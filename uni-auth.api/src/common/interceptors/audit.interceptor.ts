import {
  ForbiddenException,
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, catchError, tap, throwError } from 'rxjs';
import { Request, Response } from 'express';
import { SecurityMonitoringService } from '../../contexts/audit/application/services/security-monitoring.service';

/**
 * Audit Interceptor — перехватывает все запросы и логирует действия.
 * Может быть расширен для записи в Audit Log через EventBus.
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger('AuditLog');

  constructor(
    private readonly securityMonitoringService: SecurityMonitoringService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    if (context.getType<'http'>() !== 'http') {
      return next.handle();
    }

    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest<Request>();
    const response = httpContext.getResponse<Response>();

    const { method } = request;
    const path = request.originalUrl || request.url;
    const ipAddress = request.ip || request.socket?.remoteAddress || 'unknown';
    const userAgent = request.get('user-agent') || 'unknown';
    const securityOfficerId = (request as any).securityOfficer?.sub as
      | string
      | undefined;
    const userId =
      (request as any).user?.sub || securityOfficerId || 'anonymous';
    const requestId = request.get('x-request-id') || null;
    const startTime = Date.now();

    const preDecision = this.securityMonitoringService.analyzeIncomingRequest({
      method,
      path,
      fullUrl: request.originalUrl || request.url,
      ipAddress,
      userAgent,
      userId: userId === 'anonymous' ? null : userId,
      query: request.query,
      body: request.body,
      headers: request.headers,
      requestId,
    });

    if (preDecision.shouldBlock) {
      const duration = Date.now() - startTime;

      void this.securityMonitoringService.persistEvent({
        category: preDecision.category,
        eventType: 'request_blocked',
        method,
        path,
        query: request.query,
        requestHeaders: request.headers,
        requestBody: request.body,
        responseStatus: 403,
        responseBody: {
          message: 'Request blocked by security policy',
        },
        durationMs: duration,
        ipAddress,
        userAgent,
        userId: userId === 'anonymous' ? null : userId,
        reasons: preDecision.reasons,
        requestId,
      });

      this.logger.warn(
        `[BLOCKED] [${method}] ${path} | user=${userId} | ip=${ipAddress} | reasons=${preDecision.reasons.join('; ')}`,
      );

      throw new ForbiddenException('Request blocked by security policy');
    }

    return next.handle().pipe(
      tap((responseBody) => {
        const duration = Date.now() - startTime;
        const responseStatus = response.statusCode || 200;

        const postDecision =
          this.securityMonitoringService.analyzeAfterResponse(
            path,
            ipAddress,
            responseStatus,
          );
        const finalDecision = this.securityMonitoringService.mergeDecisions(
          preDecision,
          postDecision,
        );

        void this.securityMonitoringService.persistEvent({
          category: finalDecision.category,
          eventType: 'http_exchange',
          method,
          path,
          query: request.query,
          requestHeaders: request.headers,
          requestBody: request.body,
          responseStatus,
          responseBody,
          durationMs: duration,
          ipAddress,
          userAgent,
          userId: userId === 'anonymous' ? null : userId,
          reasons: finalDecision.reasons,
          requestId,
        });

        const level = finalDecision.category === 'normal' ? 'log' : 'warn';
        this.logger[level](
          `[${method}] ${path} | user=${userId} | ip=${ipAddress} | status=${responseStatus} | category=${finalDecision.category} | ${duration}ms`,
        );
      }),
      catchError((error: unknown) => {
        const duration = Date.now() - startTime;
        const responseStatus = this.securityMonitoringService.resolveHttpStatus(
          error,
          response.statusCode,
        );

        const postDecision =
          this.securityMonitoringService.analyzeAfterResponse(
            path,
            ipAddress,
            responseStatus,
          );
        const finalDecision = this.securityMonitoringService.mergeDecisions(
          preDecision,
          postDecision,
        );

        void this.securityMonitoringService.persistEvent({
          category: finalDecision.category,
          eventType: 'http_exchange',
          method,
          path,
          query: request.query,
          requestHeaders: request.headers,
          requestBody: request.body,
          responseStatus,
          responseBody:
            this.securityMonitoringService.extractErrorPayload(error),
          durationMs: duration,
          ipAddress,
          userAgent,
          userId: userId === 'anonymous' ? null : userId,
          reasons: finalDecision.reasons,
          requestId,
        });

        this.logger.warn(
          `[${method}] ${path} | user=${userId} | ip=${ipAddress} | status=${responseStatus} | category=${finalDecision.category} | ERROR | ${duration}ms`,
        );

        return throwError(() => error);
      }),
    );
  }
}

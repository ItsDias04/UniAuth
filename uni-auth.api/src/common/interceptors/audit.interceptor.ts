import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { Request } from 'express';

/**
 * Audit Interceptor — перехватывает все запросы и логирует действия.
 * Может быть расширен для записи в Audit Log через EventBus.
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger('AuditLog');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const { method, url, ip } = request;
    const userAgent = request.get('user-agent') || 'unknown';
    const userId = (request as any).user?.sub || 'anonymous';
    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          this.logger.log(
            `[${method}] ${url} | user=${userId} | ip=${ip} | ua=${userAgent} | ${duration}ms`,
          );
        },
        error: (err) => {
          const duration = Date.now() - startTime;
          this.logger.warn(
            `[${method}] ${url} | user=${userId} | ip=${ip} | ERROR: ${err.message} | ${duration}ms`,
          );
        },
      }),
    );
  }
}

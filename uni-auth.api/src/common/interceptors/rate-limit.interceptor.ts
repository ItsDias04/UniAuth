import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import Redis from 'ioredis';
import { ConfigService } from '@nestjs/config';

/**
 * Rate Limiting Interceptor — ограничение частоты запросов.
 * Использует Redis sliding window для distributed rate limiting.
 */
@Injectable()
export class RateLimitInterceptor implements NestInterceptor {
  private readonly logger = new Logger(RateLimitInterceptor.name);
  private readonly redis: Redis;
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(private readonly configService: ConfigService) {
    this.redis = new Redis({
      host: this.configService.get<string>('REDIS_HOST', 'localhost'),
      port: this.configService.get<number>('REDIS_PORT', 6379),
      password: this.configService.get<string>('REDIS_PASS') || undefined,
      maxRetriesPerRequest: 3,
      enableOfflineQueue: false,
      lazyConnect: true,
    });
    this.redis.on('error', (err: Error) =>
      this.logger.error(`Redis connection error: ${err.message}`),
    );
    this.redis.connect().catch((err: Error) =>
      this.logger.warn(`Redis initial connect failed: ${err.message}`),
    );
    this.maxRequests = this.configService.get<number>('RATE_LIMIT_MAX', 100);
    this.windowMs = this.configService.get<number>('RATE_LIMIT_WINDOW_MS', 60000);
  }

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const ip = request.ip || request.connection?.remoteAddress || 'unknown';
    const key = `rate_limit:${ip}`;

    try {
      const current = await this.redis.incr(key);
      if (current === 1) {
        await this.redis.pexpire(key, this.windowMs);
      }

      if (current > this.maxRequests) {
        throw new HttpException(
          'Too many requests. Please try again later.',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    } catch (err) {
      if (err instanceof HttpException) throw err;
      this.logger.warn(`Rate limiting check failed: ${err}`);
    }

    return next.handle().pipe(
      catchError((err) => throwError(() => err)),
    );
  }
}

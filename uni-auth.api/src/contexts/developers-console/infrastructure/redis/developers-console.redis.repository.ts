import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import {
  ExternalRedirectTokenState,
  IDevelopersConsoleRedisRepository,
  IpVerificationTokenState,
} from '../../domain/repositories/developers-console-redis.repository.interface';

@Injectable()
export class DevelopersConsoleRedisRepository
  implements IDevelopersConsoleRedisRepository
{
  private readonly logger = new Logger(DevelopersConsoleRedisRepository.name);
  private readonly redis: Redis;
  private readonly ipTokenPrefix = 'dev-console:ip-verify:';
  private readonly redirectTokenPrefix = 'dev-console:redirect-token:';

  constructor(private readonly configService: ConfigService) {
    this.redis = new Redis({
      host: this.configService.get<string>('REDIS_HOST', 'localhost'),
      port: this.configService.get<number>('REDIS_PORT', 6379),
      password: this.configService.get<string>('REDIS_PASS') || undefined,
      maxRetriesPerRequest: 3,
      enableOfflineQueue: false,
      lazyConnect: true,
    });

    this.redis.on('error', (err) =>
      this.logger.error(`Redis connection error: ${err.message}`),
    );

    this.redis.connect().catch((err) =>
      this.logger.warn(`Redis initial connect failed: ${err.message}`),
    );
  }

  async saveIpVerificationToken(
    state: IpVerificationTokenState,
    ttlSeconds: number,
  ): Promise<void> {
    await this.redis.set(
      this.ipTokenKey(state.token),
      JSON.stringify(state),
      'EX',
      ttlSeconds,
    );
  }

  async consumeIpVerificationToken(
    token: string,
  ): Promise<IpVerificationTokenState | null> {
    const key = this.ipTokenKey(token);
    const raw = await this.redis.get(key);
    if (!raw) return null;

    await this.redis.del(key);

    try {
      return JSON.parse(raw) as IpVerificationTokenState;
    } catch {
      return null;
    }
  }

  async saveExternalRedirectToken(
    state: ExternalRedirectTokenState,
    ttlSeconds: number,
  ): Promise<void> {
    await this.redis.set(
      this.redirectTokenKey(state.token),
      JSON.stringify(state),
      'EX',
      ttlSeconds,
    );
  }

  async consumeExternalRedirectToken(
    token: string,
  ): Promise<ExternalRedirectTokenState | null> {
    const key = this.redirectTokenKey(token);
    const raw = await this.redis.get(key);
    if (!raw) return null;

    await this.redis.del(key);

    try {
      return JSON.parse(raw) as ExternalRedirectTokenState;
    } catch {
      return null;
    }
  }

  private ipTokenKey(token: string): string {
    return `${this.ipTokenPrefix}${token}`;
  }

  private redirectTokenKey(token: string): string {
    return `${this.redirectTokenPrefix}${token}`;
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import {
  IOAuthRedisRepository,
  OAuthAuthorizationCodeRecord,
} from '../../domain/repositories/oauth-redis.repository.interface';

/**
 * Infrastructure adapter for OAuth2 short-lived artifacts.
 * Stores AuthorizationCode in Redis with strict TTL and one-time consume behavior.
 */
@Injectable()
export class OAuthRedisRepository implements IOAuthRedisRepository {
  private readonly logger = new Logger(OAuthRedisRepository.name);
  private readonly redis: Redis;
  private readonly authCodePrefix = 'oauth2:auth-code:';

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

  async saveAuthorizationCode(
    record: OAuthAuthorizationCodeRecord,
    ttlSeconds: number,
  ): Promise<void> {
    await this.redis.set(
      this.key(record.authCode),
      JSON.stringify(record),
      'EX',
      ttlSeconds,
    );
  }

  async consumeAuthorizationCode(
    authCode: string,
  ): Promise<OAuthAuthorizationCodeRecord | null> {
    const key = this.key(authCode);
    const raw = await this.redis.get(key);
    if (!raw) return null;

    await this.redis.del(key);

    try {
      return JSON.parse(raw) as OAuthAuthorizationCodeRecord;
    } catch {
      return null;
    }
  }

  private key(authCode: string): string {
    return `${this.authCodePrefix}${authCode}`;
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import {
  AuthenticatorPendingLoginState,
  IAuthenticatorRedisRepository,
} from '../../domain/repositories/authenticator-redis.repository.interface';

@Injectable()
export class AuthenticatorRedisRepository implements IAuthenticatorRedisRepository {
  private readonly logger = new Logger(AuthenticatorRedisRepository.name);
  private readonly redis: Redis;
  private readonly keyPrefix = 'security:authenticator:pending:';

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

  async savePendingLogin(
    state: AuthenticatorPendingLoginState,
    ttlSeconds: number,
  ): Promise<void> {
    await this.redis.set(
      this.key(state.loginAttemptId),
      JSON.stringify(state),
      'EX',
      ttlSeconds,
    );
  }

  async findPendingLogin(
    loginAttemptId: string,
  ): Promise<AuthenticatorPendingLoginState | null> {
    const raw = await this.redis.get(this.key(loginAttemptId));
    if (!raw) return null;

    try {
      return JSON.parse(raw) as AuthenticatorPendingLoginState;
    } catch {
      return null;
    }
  }

  async deletePendingLogin(loginAttemptId: string): Promise<void> {
    await this.redis.del(this.key(loginAttemptId));
  }

  private key(loginAttemptId: string): string {
    return `${this.keyPrefix}${loginAttemptId}`;
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import {
  ILoginMfaStateRepository,
  LoginMfaState,
} from '../../domain/repositories/login-mfa-state.repository.interface';

@Injectable()
export class LoginMfaStateRedisRepository implements ILoginMfaStateRepository {
  private readonly logger = new Logger(LoginMfaStateRedisRepository.name);
  private readonly redis: Redis;
  private readonly keyPrefix = 'security:login:mfa:';

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

  async save(state: LoginMfaState, ttlSeconds: number): Promise<void> {
    await this.redis.set(this.key(state.mfaToken), JSON.stringify(state), 'EX', ttlSeconds);
  }

  async findByToken(mfaToken: string): Promise<LoginMfaState | null> {
    const raw = await this.redis.get(this.key(mfaToken));
    if (!raw) return null;

    try {
      return JSON.parse(raw) as LoginMfaState;
    } catch {
      return null;
    }
  }

  async deleteByToken(mfaToken: string): Promise<void> {
    await this.redis.del(this.key(mfaToken));
  }

  private key(mfaToken: string): string {
    return `${this.keyPrefix}${mfaToken}`;
  }
}

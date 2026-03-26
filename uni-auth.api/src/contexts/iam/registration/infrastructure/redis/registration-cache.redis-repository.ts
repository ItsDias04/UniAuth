import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import {
  IRegistrationCacheRepository,
} from '../../domain/repositories/registration-cache.repository.interface';
import { RegistrationDraft } from '../../domain/entities/registration-draft.entity';

@Injectable()
export class RegistrationCacheRedisRepository
  implements IRegistrationCacheRepository
{
  private readonly logger = new Logger(RegistrationCacheRedisRepository.name);
  private readonly redis: Redis;
  private readonly keyPrefix = 'iam:registration:';

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

  async save(draft: RegistrationDraft, ttlSeconds: number): Promise<void> {
    const key = this.key(draft.id);
    await this.redis.set(key, JSON.stringify(draft.toPrimitives()), 'EX', ttlSeconds);
  }

  async findById(registrationId: string): Promise<RegistrationDraft | null> {
    const raw = await this.redis.get(this.key(registrationId));
    if (!raw) return null;

    try {
      const parsed = JSON.parse(raw);
      return RegistrationDraft.reconstitute({
        id: parsed.registrationId,
        login: parsed.login,
        password: parsed.password,
        firstName: parsed.firstName,
        lastName: parsed.lastName,
        phone: parsed.phone,
        email: parsed.email,
        emailCode: parsed.emailCode,
        whatsAppCode: parsed.whatsAppCode,
        tempToken: parsed.tempToken,
        emailVerified: parsed.emailVerified,
        createdAt: parsed.createdAt ? new Date(parsed.createdAt) : undefined,
        updatedAt: parsed.updatedAt ? new Date(parsed.updatedAt) : undefined,
      });
    } catch {
      return null;
    }
  }

  async delete(registrationId: string): Promise<void> {
    await this.redis.del(this.key(registrationId));
  }

  private key(registrationId: string): string {
    return `${this.keyPrefix}${registrationId}`;
  }
}

import { Injectable, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { ConfigService } from '@nestjs/config';
import { IMfaChallengeStore } from '../../domain/repositories/mfa-challenge-store.interface';
import { MfaChallenge } from '../../domain/value-objects/mfa-challenge.vo';

/**
 * Redis-backed MFA Challenge Store.
 * Хранит challenge с TTL для прохождения второго фактора.
 */
@Injectable()
export class RedisMfaChallengeStore implements IMfaChallengeStore {
  private readonly logger = new Logger(RedisMfaChallengeStore.name);
  private readonly redis: Redis;
  private readonly prefix = 'mfa:challenge:';

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
  }

  async save(challenge: MfaChallenge, ttlSeconds: number): Promise<void> {
    const key = this.prefix + challenge.challengeId;
    const data = JSON.stringify({
      challengeId: challenge.challengeId,
      userId: challenge.userId,
      expiresAt: challenge.expiresAt.toISOString(),
      verified: challenge.verified,
    });
    await this.redis.set(key, data, 'EX', ttlSeconds);
  }

  async find(challengeId: string): Promise<MfaChallenge | null> {
    const key = this.prefix + challengeId;
    const data = await this.redis.get(key);
    if (!data) return null;

    try {
      const parsed = JSON.parse(data);
      return new MfaChallenge(
        parsed.challengeId,
        parsed.userId,
        new Date(parsed.expiresAt),
        parsed.verified,
      );
    } catch {
      this.logger.warn(`Failed to parse MFA challenge: ${challengeId}`);
      return null;
    }
  }

  async delete(challengeId: string): Promise<void> {
    const key = this.prefix + challengeId;
    await this.redis.del(key);
  }
}

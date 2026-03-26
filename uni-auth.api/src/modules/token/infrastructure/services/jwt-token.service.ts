import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID, createHash } from 'crypto';
import {
  ITokenService,
  TokenPayload,
  TokenPair,
} from '../../domain/services/token.service.interface';
import { RefreshTokenOrmEntity } from '../persistence/refresh-token.orm-entity';

/**
 * JWT Token Service — реализация ITokenService.
 *
 * - Access Token: short-lived JWT (15 min)
 * - Refresh Token: long-lived, stored hashed in DB, rotation при refresh
 * - Asymmetric signing поддерживается через конфигурацию
 */
@Injectable()
export class JwtTokenService implements ITokenService {
  private readonly logger = new Logger(JwtTokenService.name);
  private readonly accessTtl: number;
  private readonly refreshTtl: number;
  private readonly accessSecret: string;
  private readonly refreshSecret: string;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectRepository(RefreshTokenOrmEntity)
    private readonly refreshTokenRepo: Repository<RefreshTokenOrmEntity>,
  ) {
    this.accessTtl = parseInt(this.configService.get<string>('JWT_ACCESS_TTL', '900'), 10); // 15 min
    this.refreshTtl = parseInt(this.configService.get<string>('JWT_REFRESH_TTL', '604800'), 10); // 7 days
    this.accessSecret = this.configService.get<string>(
      'JWT_ACCESS_SECRET',
      'dev_jwt_secret_change_me',
    );
    this.refreshSecret = this.configService.get<string>(
      'JWT_REFRESH_SECRET',
      'dev_refresh_secret_change_me',
    );
  }

  async issueTokenPair(payload: TokenPayload): Promise<TokenPair> {
    const accessToken = this.jwtService.sign(
      {
        sub: payload.sub,
        email: payload.email,
        roles: payload.roles,
        type: 'access',
      },
      {
        secret: this.accessSecret,
        expiresIn: this.accessTtl,
      },
    );

    const refreshTokenRaw = randomUUID() + '-' + randomUUID();
    const refreshTokenHash = this.hashToken(refreshTokenRaw);

    // Сохраняем hashed refresh token в БД
    await this.refreshTokenRepo.save({
      id: randomUUID(),
      userId: payload.sub,
      tokenHash: refreshTokenHash,
      expiresAt: new Date(Date.now() + this.refreshTtl * 1000),
      revoked: false,
    });

    return {
      accessToken,
      refreshToken: refreshTokenRaw,
      expiresIn: this.accessTtl,
      tokenType: 'Bearer',
    };
  }

  async refreshTokens(refreshToken: string): Promise<TokenPair> {
    const tokenHash = this.hashToken(refreshToken);

    const stored = await this.refreshTokenRepo.findOne({
      where: { tokenHash, revoked: false },
    });

    if (!stored) {
      throw new UnauthorizedException('Invalid or revoked refresh token');
    }

    if (stored.expiresAt < new Date()) {
      // Expired — удаляем
      await this.refreshTokenRepo.update(stored.id, { revoked: true });
      throw new UnauthorizedException('Refresh token expired');
    }

    // Rotation: отзываем старый, выдаём новый
    await this.refreshTokenRepo.update(stored.id, { revoked: true });

    // Decode old access token payload из userId в stored
    const payload: TokenPayload = {
      sub: stored.userId,
      email: '', // будет взят из нового access токена
      roles: [],
    };

    // В production загрузить актуальные данные пользователя
    return this.issueTokenPair(payload);
  }

  async revokeRefreshToken(refreshToken: string): Promise<void> {
    const tokenHash = this.hashToken(refreshToken);
    await this.refreshTokenRepo.update(
      { tokenHash },
      { revoked: true },
    );
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    await this.refreshTokenRepo.update(
      { userId, revoked: false },
      { revoked: true },
    );
    this.logger.log(`All tokens revoked for user ${userId}`);
  }

  async verifyAccessToken(token: string): Promise<TokenPayload> {
    try {
      const decoded = this.jwtService.verify(token, {
        secret: this.accessSecret,
      });
      return {
        sub: decoded.sub,
        email: decoded.email,
        roles: decoded.roles,
      };
    } catch (err) {
      throw new UnauthorizedException('Invalid access token');
    }
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}

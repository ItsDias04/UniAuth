import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  IssuedTokenPair,
  ITokenIssuer,
} from '../../application/services/token-issuer.interface';

@Injectable()
export class JwtTokenIssuerService implements ITokenIssuer {
  private readonly accessTokenTtlSeconds: number;
  private readonly refreshTokenTtlSeconds: number;

  constructor(
    private readonly jwtService: JwtService,
    configService: ConfigService,
  ) {
    this.accessTokenTtlSeconds = configService.get<number>(
      'JWT_ACCESS_TTL_SECONDS',
      900,
    );
    this.refreshTokenTtlSeconds = configService.get<number>(
      'JWT_REFRESH_TTL_SECONDS',
      604800,
    );
  }

  async issueTokenPair(userId: string, sessionId: string): Promise<IssuedTokenPair> {
    const accessToken = await this.jwtService.signAsync(
      { sub: userId, typ: 'access' },
      { expiresIn: this.accessTokenTtlSeconds },
    );

    const refreshToken = await this.jwtService.signAsync(
      { sub: userId, sid: sessionId, typ: 'refresh' },
      { expiresIn: this.refreshTokenTtlSeconds },
    );

    return {
      accessToken,
      refreshToken,
      accessTokenExpiresInSeconds: this.accessTokenTtlSeconds,
      refreshTokenExpiresInSeconds: this.refreshTokenTtlSeconds,
    };
  }
}

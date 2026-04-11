import {
  Injectable,
  Logger,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { timingSafeEqual } from 'crypto';

export interface SecurityOfficerTokenPayload {
  sub: string;
  login: string;
  role: 'security_officer';
  typ: 'security-monitoring-access';
  permissions: string[];
  iat?: number;
  exp?: number;
}

@Injectable()
export class SecurityOfficerAuthService {
  private readonly logger = new Logger(SecurityOfficerAuthService.name);
  private readonly officerLogin: string | null;
  private readonly officerPassword: string | null;
  private readonly jwtSecret: string;
  private readonly tokenTtlSeconds: number;

  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {
    this.officerLogin =
      this.configService.get<string>('SECURITY_OFFICER_LOGIN')?.trim() ?? null;
    this.officerPassword =
      this.configService.get<string>('SECURITY_OFFICER_PASSWORD') ?? null;
    this.jwtSecret = this.configService.get<string>(
      'SECURITY_OFFICER_JWT_SECRET',
      'dev-security-officer-secret-change-me',
    );
    this.tokenTtlSeconds = Number(
      this.configService.get<string>(
        'SECURITY_OFFICER_JWT_TTL_SECONDS',
        '3600',
      ),
    );

    if (!this.officerLogin || !this.officerPassword) {
      this.logger.error(
        'SECURITY_OFFICER_LOGIN or SECURITY_OFFICER_PASSWORD is not configured. Security officer login is disabled.',
      );
    }
  }

  isSecurityOfficerIdentifier(identifier: string): boolean {
    if (!this.officerLogin) {
      return false;
    }

    return identifier.trim().toLowerCase() === this.officerLogin.toLowerCase();
  }

  async login(
    login: string,
    password: string,
  ): Promise<{
    accessToken: string;
    tokenType: 'Bearer';
    expiresInSeconds: number;
    login: string;
  }> {
    if (!this.officerLogin || !this.officerPassword) {
      throw new ServiceUnavailableException(
        'Security officer account is not configured',
      );
    }

    if (
      !this.safeEquals(
        login.trim().toLowerCase(),
        this.officerLogin.toLowerCase(),
      )
    ) {
      throw new UnauthorizedException('Invalid security officer credentials');
    }

    if (!this.safeEquals(password, this.officerPassword)) {
      throw new UnauthorizedException('Invalid security officer credentials');
    }

    const payload: SecurityOfficerTokenPayload = {
      sub: `security-officer:${this.officerLogin}`,
      login: this.officerLogin,
      role: 'security_officer',
      typ: 'security-monitoring-access',
      permissions: ['security:read', 'security:alerts:read'],
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.jwtSecret,
      expiresIn: this.tokenTtlSeconds,
    });

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresInSeconds: this.tokenTtlSeconds,
      login: this.officerLogin,
    };
  }

  async verifyToken(token: string): Promise<SecurityOfficerTokenPayload> {
    try {
      const payload =
        await this.jwtService.verifyAsync<SecurityOfficerTokenPayload>(token, {
          secret: this.jwtSecret,
        });

      if (payload.typ !== 'security-monitoring-access') {
        throw new UnauthorizedException('Invalid security officer token type');
      }

      if (payload.role !== 'security_officer') {
        throw new UnauthorizedException('Invalid security officer role');
      }

      return payload;
    } catch {
      throw new UnauthorizedException(
        'Invalid or expired security officer token',
      );
    }
  }

  private safeEquals(left: string, right: string): boolean {
    const leftBuffer = Buffer.from(left);
    const rightBuffer = Buffer.from(right);

    if (leftBuffer.length !== rightBuffer.length) {
      return false;
    }

    return timingSafeEqual(leftBuffer, rightBuffer);
  }
}

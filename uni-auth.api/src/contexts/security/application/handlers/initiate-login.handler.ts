import {
  BadRequestException,
  Inject,
  UnauthorizedException,
} from '@nestjs/common';
import {
  CommandHandler,
  ICommandHandler as NestCommandHandler,
} from '@nestjs/cqrs';
import { createHash, randomUUID } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { ICommandHandler } from '../../../../common/cqrs';
import {
  InitiateLoginCommand,
  InitiateLoginCommandOutput,
} from '../commands/initiate-login.command';
import {
  CREDENTIALS_VERIFIER,
  ICredentialsVerifier,
} from '../services/credentials-verifier.interface';
import {
  ILoginMfaStateRepository,
  LOGIN_MFA_STATE_REPOSITORY,
} from '../../domain/repositories/login-mfa-state.repository.interface';
import {
  ISecurityEmailSender,
  SECURITY_EMAIL_SENDER,
} from '../services/security-email-sender.interface';
import {
  AUTH_SESSION_REPOSITORY,
  IAuthSessionRepository,
} from '../../domain/repositories/auth-session.repository.interface';
import { ITokenIssuer, TOKEN_ISSUER } from '../services/token-issuer.interface';

@CommandHandler(InitiateLoginCommand)
export class InitiateLoginHandler
  implements
    NestCommandHandler<InitiateLoginCommand, InitiateLoginCommandOutput>,
    ICommandHandler<InitiateLoginCommand, InitiateLoginCommandOutput>
{
  private readonly mfaTtlSeconds = 300;
  private readonly mfaRequiredByDefault: boolean;
  private readonly securityOfficerLogin: string | null;

  constructor(
    @Inject(CREDENTIALS_VERIFIER)
    private readonly credentialsVerifier: ICredentialsVerifier,
    @Inject(LOGIN_MFA_STATE_REPOSITORY)
    private readonly loginMfaStateRepository: ILoginMfaStateRepository,
    @Inject(SECURITY_EMAIL_SENDER)
    private readonly securityEmailSender: ISecurityEmailSender,
    @Inject(AUTH_SESSION_REPOSITORY)
    private readonly authSessionRepository: IAuthSessionRepository,
    @Inject(TOKEN_ISSUER)
    private readonly tokenIssuer: ITokenIssuer,
    private readonly configService: ConfigService,
  ) {
    const value = this.configService.get<string>(
      'SECURITY_MFA_REQUIRED',
      'true',
    );
    this.mfaRequiredByDefault = value.toLowerCase() === 'true';
    this.securityOfficerLogin =
      this.configService
        .get<string>('SECURITY_OFFICER_LOGIN')
        ?.trim()
        .toLowerCase() ?? null;
  }

  async execute(
    command: InitiateLoginCommand,
  ): Promise<InitiateLoginCommandOutput> {
    if (!command.email?.trim() || !command.password?.trim()) {
      throw new BadRequestException('Email and password are required');
    }

    if (
      this.securityOfficerLogin &&
      command.email.trim().toLowerCase() === this.securityOfficerLogin
    ) {
      throw new UnauthorizedException(
        'Security officer account is isolated. Use dedicated security monitoring login endpoint.',
      );
    }

    const validated = await this.credentialsVerifier.validate(
      command.email,
      command.password,
    );

    if (!validated) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!this.mfaRequiredByDefault) {
      const sessionId = randomUUID();
      const issued = await this.tokenIssuer.issueTokenPair(
        validated.userId,
        sessionId,
      );

      await this.authSessionRepository.create({
        id: sessionId,
        userId: validated.userId,
        refreshTokenHash: this.hash(issued.refreshToken),
        refreshTokenExpiresAt: new Date(
          Date.now() + issued.refreshTokenExpiresInSeconds * 1000,
        ),
      });

      return new InitiateLoginCommandOutput(
        false,
        'Login successful. MFA is disabled for this environment.',
        undefined,
        undefined,
        issued.accessToken,
        issued.refreshToken,
      );
    }

    const mfaToken = randomUUID();
    const code = this.generateCode();

    await this.loginMfaStateRepository.save(
      {
        mfaToken,
        userId: validated.userId,
        email: validated.email,
        code,
      },
      this.mfaTtlSeconds,
    );

    await this.securityEmailSender.sendLoginVerificationCode(
      validated.email,
      code,
    );

    return new InitiateLoginCommandOutput(
      true,
      'MFA code has been sent to your email',
      mfaToken,
      this.mfaTtlSeconds,
    );
  }

  private generateCode(): string {
    return `${Math.floor(100000 + Math.random() * 900000)}`;
  }

  private hash(value: string): string {
    return createHash('sha256').update(value).digest('hex');
  }
}

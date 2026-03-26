import {
  BadRequestException,
  Inject,
  UnauthorizedException,
} from '@nestjs/common';
import {
  CommandHandler,
  ICommandHandler as NestCommandHandler,
} from '@nestjs/cqrs';
import { randomUUID } from 'crypto';
import { ICommandHandler } from '../../../../common/cqrs';
import {
  LoginToAuthenticatorCommand,
  LoginToAuthenticatorCommandOutput,
} from '../commands/login-to-authenticator.command';
import {
  CREDENTIALS_VERIFIER,
  ICredentialsVerifier,
} from '../services/credentials-verifier.interface';
import {
  AUTHENTICATOR_REDIS_REPOSITORY,
  IAuthenticatorRedisRepository,
} from '../../domain/repositories/authenticator-redis.repository.interface';
import {
  ISecurityEmailSender,
  SECURITY_EMAIL_SENDER,
} from '../services/security-email-sender.interface';

@CommandHandler(LoginToAuthenticatorCommand)
export class LoginToAuthenticatorHandler
  implements
    NestCommandHandler<LoginToAuthenticatorCommand, LoginToAuthenticatorCommandOutput>,
    ICommandHandler<LoginToAuthenticatorCommand, LoginToAuthenticatorCommandOutput>
{
  private readonly ttlSeconds = 300;

  constructor(
    @Inject(CREDENTIALS_VERIFIER)
    private readonly credentialsVerifier: ICredentialsVerifier,
    @Inject(AUTHENTICATOR_REDIS_REPOSITORY)
    private readonly authenticatorRedisRepository: IAuthenticatorRedisRepository,
    @Inject(SECURITY_EMAIL_SENDER)
    private readonly securityEmailSender: ISecurityEmailSender,
  ) {}

  async execute(
    command: LoginToAuthenticatorCommand,
  ): Promise<LoginToAuthenticatorCommandOutput> {
    if (!command.email?.trim() || !command.password?.trim()) {
      throw new BadRequestException('Email and password are required');
    }

    const validated = await this.credentialsVerifier.validate(
      command.email,
      command.password,
    );

    if (!validated) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const loginAttemptId = randomUUID();
    const emailCode = this.generateCode();

    await this.authenticatorRedisRepository.savePendingLogin(
      {
        loginAttemptId,
        userId: validated.userId,
        email: validated.email,
        emailCode,
        deviceName: command.deviceName,
        deviceFingerprint: command.deviceFingerprint,
      },
      this.ttlSeconds,
    );

    await this.securityEmailSender.sendLoginVerificationCode(
      validated.email,
      emailCode,
    );

    return new LoginToAuthenticatorCommandOutput(
      loginAttemptId,
      this.ttlSeconds,
      'Email verification code has been sent',
    );
  }

  private generateCode(): string {
    return `${Math.floor(100000 + Math.random() * 900000)}`;
  }
}

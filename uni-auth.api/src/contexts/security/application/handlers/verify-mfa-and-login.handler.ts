import {
  BadRequestException,
  Inject,
  NotFoundException,
} from '@nestjs/common';
import {
  CommandHandler,
  ICommandHandler as NestCommandHandler,
} from '@nestjs/cqrs';
import { createHash, randomUUID } from 'crypto';
import { ICommandHandler } from '../../../../common/cqrs';
import {
  VerifyMfaAndLoginCommand,
  VerifyMfaAndLoginCommandOutput,
} from '../commands/verify-mfa-and-login.command';
import {
  AUTH_SESSION_REPOSITORY,
  IAuthSessionRepository,
} from '../../domain/repositories/auth-session.repository.interface';
import {
  ILoginMfaStateRepository,
  LOGIN_MFA_STATE_REPOSITORY,
} from '../../domain/repositories/login-mfa-state.repository.interface';
import {
  ITokenIssuer,
  TOKEN_ISSUER,
} from '../services/token-issuer.interface';

@CommandHandler(VerifyMfaAndLoginCommand)
export class VerifyMfaAndLoginHandler
  implements
    NestCommandHandler<VerifyMfaAndLoginCommand, VerifyMfaAndLoginCommandOutput>,
    ICommandHandler<VerifyMfaAndLoginCommand, VerifyMfaAndLoginCommandOutput>
{
  constructor(
    @Inject(LOGIN_MFA_STATE_REPOSITORY)
    private readonly loginMfaStateRepository: ILoginMfaStateRepository,
    @Inject(AUTH_SESSION_REPOSITORY)
    private readonly authSessionRepository: IAuthSessionRepository,
    @Inject(TOKEN_ISSUER)
    private readonly tokenIssuer: ITokenIssuer,
  ) {}

  async execute(
    command: VerifyMfaAndLoginCommand,
  ): Promise<VerifyMfaAndLoginCommandOutput> {
    const state = await this.loginMfaStateRepository.findByToken(command.mfaToken);

    if (!state) {
      throw new NotFoundException('MFA state not found or expired');
    }

    if (state.code !== command.code) {
      throw new BadRequestException('Invalid MFA code');
    }

    const sessionId = randomUUID();
    const issued = await this.tokenIssuer.issueTokenPair(state.userId, sessionId);

    await this.authSessionRepository.create({
      id: sessionId,
      userId: state.userId,
      refreshTokenHash: this.hash(issued.refreshToken),
      refreshTokenExpiresAt: new Date(
        Date.now() + issued.refreshTokenExpiresInSeconds * 1000,
      ),
    });

    await this.loginMfaStateRepository.deleteByToken(command.mfaToken);

    return new VerifyMfaAndLoginCommandOutput(
      issued.accessToken,
      issued.refreshToken,
      'Login completed successfully',
    );
  }

  private hash(value: string): string {
    return createHash('sha256').update(value).digest('hex');
  }
}

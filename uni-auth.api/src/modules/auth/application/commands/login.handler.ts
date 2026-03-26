import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import {
  UnauthorizedException,
  ForbiddenException,
  Inject,
  Logger,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { LoginCommand } from './login.command';
import { AuthResponseDto } from '../dto/auth-response.dto';
import {
  IUserRepository,
  USER_REPOSITORY,
} from '../../../identity/domain/repositories/user.repository.interface';
import {
  ILoginAttemptRepository,
  LOGIN_ATTEMPT_REPOSITORY,
} from '../../domain/repositories/login-attempt.repository.interface';
import {
  LoginAttempt,
  LoginAttemptStatus,
} from '../../domain/entities/login-attempt.entity';
import { AuthenticationDomainService } from '../../domain/services/authentication.domain-service';
import { LoginSucceededEvent } from '../../domain/events/login-succeeded.event';
import { LoginFailedEvent } from '../../domain/events/login-failed.event';
import { ITokenService, TOKEN_SERVICE } from '../../../token/domain/services/token.service.interface';

@CommandHandler(LoginCommand)
export class LoginHandler implements ICommandHandler<LoginCommand> {
  private readonly logger = new Logger(LoginHandler.name);

  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(LOGIN_ATTEMPT_REPOSITORY)
    private readonly loginAttemptRepo: ILoginAttemptRepository,
    @Inject(TOKEN_SERVICE)
    private readonly tokenService: ITokenService,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: LoginCommand): Promise<AuthResponseDto> {
    const { email, password, ip, userAgent } = command;

    // Brute-force protection: проверяем IP
    const ipAttempts = await this.loginAttemptRepo.countRecentByIp(ip, 15);
    if (AuthenticationDomainService.isIpBlocked(ipAttempts)) {
      await this.recordAttempt(email, ip, userAgent, LoginAttemptStatus.BLOCKED, null);
      throw new ForbiddenException('Too many login attempts from this IP');
    }

    // Ищем пользователя
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      await this.recordAttempt(email, ip, userAgent, LoginAttemptStatus.FAILED_CREDENTIALS, null);
      this.eventBus.publish(new LoginFailedEvent(email, ip, 'User not found'));
      throw new UnauthorizedException('Invalid credentials');
    }

    // Проверяем статус
    if (!user.isActive) {
      await this.recordAttempt(email, ip, userAgent, LoginAttemptStatus.BLOCKED, user.id);
      throw new ForbiddenException('Account is not active');
    }

    // Проверяем блокировку аккаунта
    if (user.isLocked) {
      await this.recordAttempt(email, ip, userAgent, LoginAttemptStatus.LOCKED, user.id);
      throw new ForbiddenException('Account is temporarily locked. Try again later.');
    }

    // Верификация пароля
    const passwordValid = await user.verifyPassword(password);
    if (!passwordValid) {
      user.recordFailedLogin();
      await this.userRepository.save(user);
      await this.recordAttempt(email, ip, userAgent, LoginAttemptStatus.FAILED_CREDENTIALS, user.id);
      this.eventBus.publish(new LoginFailedEvent(email, ip, 'Invalid password'));
      throw new UnauthorizedException('Invalid credentials');
    }

    // MFA check
    const mfaRequired = AuthenticationDomainService.isMfaRequired(user.mfaEnabled);
    if (mfaRequired) {
      // Генерируем challenge ID для MFA flow
      const challengeId = randomUUID();
      // Сохраняем challenge в Redis (будет реализовано через MFA Service)
      await this.recordAttempt(email, ip, userAgent, LoginAttemptStatus.SUCCESS, user.id);
      return AuthResponseDto.mfaChallenge(challengeId);
    }

    // Успешная аутентификация — выдаём токены
    user.recordSuccessfulLogin();
    await this.userRepository.save(user);

    const tokens = await this.tokenService.issueTokenPair({
      sub: user.id,
      email: user.email.toString(),
      roles: user.roles.map((r) => r.name),
    });

    await this.recordAttempt(email, ip, userAgent, LoginAttemptStatus.SUCCESS, user.id);
    this.eventBus.publish(new LoginSucceededEvent(user.id, email, ip, userAgent));

    // Публикуем доменные события пользователя
    for (const event of user.domainEvents) {
      this.eventBus.publish(event);
    }
    user.clearDomainEvents();

    return AuthResponseDto.success(
      tokens.accessToken,
      tokens.refreshToken,
      tokens.expiresIn,
    );
  }

  private async recordAttempt(
    email: string,
    ip: string,
    userAgent: string,
    status: LoginAttemptStatus,
    userId: string | null,
  ): Promise<void> {
    const attempt = LoginAttempt.create(
      randomUUID(),
      email,
      ip,
      userAgent,
      status,
      userId,
    );
    await this.loginAttemptRepo.save(attempt);
  }
}

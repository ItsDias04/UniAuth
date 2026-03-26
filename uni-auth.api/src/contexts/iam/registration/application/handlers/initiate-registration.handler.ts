import {
  BadRequestException,
  ConflictException,
  Inject,
} from '@nestjs/common';
import {
  CommandHandler,
  EventBus,
  ICommandHandler as NestCommandHandler,
} from '@nestjs/cqrs';
import { randomUUID } from 'crypto';
import {
  ICommandHandler,
} from '../../../../../common/cqrs';
import {
  InitiateRegistrationCommand,
  InitiateRegistrationCommandOutput,
} from '../commands/initiate-registration.command';
import {
  IRegistrationCacheRepository,
  REGISTRATION_CACHE_REPOSITORY,
} from '../../domain/repositories/registration-cache.repository.interface';
import {
  IUserAccountRepository,
  USER_ACCOUNT_REPOSITORY,
} from '../../domain/repositories/user-account.repository.interface';
import { RegistrationDraft } from '../../domain/entities/registration-draft.entity';
import { RegistrationInitiatedEvent } from '../../domain/events/registration-initiated.event';

@CommandHandler(InitiateRegistrationCommand)
export class InitiateRegistrationHandler
  implements
    NestCommandHandler<InitiateRegistrationCommand, InitiateRegistrationCommandOutput>,
    ICommandHandler<InitiateRegistrationCommand, InitiateRegistrationCommandOutput>
{
  private readonly ttlSeconds = 1800;

  constructor(
    @Inject(REGISTRATION_CACHE_REPOSITORY)
    private readonly registrationCacheRepository: IRegistrationCacheRepository,
    @Inject(USER_ACCOUNT_REPOSITORY)
    private readonly userAccountRepository: IUserAccountRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(
    command: InitiateRegistrationCommand,
  ): Promise<InitiateRegistrationCommandOutput> {
    if (!command.login?.trim() || !command.password?.trim()) {
      throw new BadRequestException('Login and password are required');
    }

    const email = command.email.toLowerCase().trim();
    const login = command.login.trim();

    if (await this.userAccountRepository.existsByEmail(email)) {
      throw new ConflictException('User with this email already exists');
    }

    if (await this.userAccountRepository.existsByLogin(login)) {
      throw new ConflictException('User with this login already exists');
    }

    const registrationId = randomUUID();
    const emailCode = this.generateCode();

    const draft = RegistrationDraft.initiate({
      id: registrationId,
      login,
      password: command.password,
      firstName: command.firstName.trim(),
      lastName: command.lastName.trim(),
      phone: command.phone.trim(),
      email,
      emailCode,
    });

    await this.registrationCacheRepository.save(draft, this.ttlSeconds);

    this.eventBus.publish(
      new RegistrationInitiatedEvent(registrationId, email, emailCode),
    );

    return new InitiateRegistrationCommandOutput(
      registrationId,
      this.ttlSeconds,
      'Registration initiated. Email code has been sent.',
    );
  }

  private generateCode(): string {
    return `${Math.floor(100000 + Math.random() * 900000)}`;
  }
}

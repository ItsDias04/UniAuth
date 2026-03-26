import {
  BadRequestException,
  Inject,
  NotFoundException,
} from '@nestjs/common';
import {
  CommandHandler,
  EventBus,
  ICommandHandler as NestCommandHandler,
} from '@nestjs/cqrs';
import { randomUUID, scryptSync, randomBytes } from 'crypto';
import { ICommandHandler } from '../../../../../common/cqrs';
import {
  VerifyWhatsAppAndCompleteRegistrationCommand,
  VerifyWhatsAppAndCompleteRegistrationCommandOutput,
} from '../commands/verify-whatsapp-and-complete-registration.command';
import {
  IRegistrationCacheRepository,
  REGISTRATION_CACHE_REPOSITORY,
} from '../../domain/repositories/registration-cache.repository.interface';
import {
  IUserAccountRepository,
  USER_ACCOUNT_REPOSITORY,
} from '../../domain/repositories/user-account.repository.interface';
import { UserAccount } from '../../domain/entities/user-account.entity';
import { UserRegisteredEvent } from '../../domain/events/user-registered.event';

@CommandHandler(VerifyWhatsAppAndCompleteRegistrationCommand)
export class VerifyWhatsAppAndCompleteRegistrationHandler
  implements
    NestCommandHandler<VerifyWhatsAppAndCompleteRegistrationCommand, VerifyWhatsAppAndCompleteRegistrationCommandOutput>,
    ICommandHandler<VerifyWhatsAppAndCompleteRegistrationCommand, VerifyWhatsAppAndCompleteRegistrationCommandOutput>
{
  constructor(
    @Inject(REGISTRATION_CACHE_REPOSITORY)
    private readonly registrationCacheRepository: IRegistrationCacheRepository,
    @Inject(USER_ACCOUNT_REPOSITORY)
    private readonly userAccountRepository: IUserAccountRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(
    command: VerifyWhatsAppAndCompleteRegistrationCommand,
  ): Promise<VerifyWhatsAppAndCompleteRegistrationCommandOutput> {
    const draft = await this.registrationCacheRepository.findById(command.registrationId);
    if (!draft) {
      throw new NotFoundException('Registration draft not found or expired');
    }

    try {
      draft.verifyWhatsApp(command.tempToken, command.whatsAppCode);
    } catch (error) {
      throw new BadRequestException((error as Error).message);
    }

    const passwordHash = this.hashPassword(draft.password);

    const user = UserAccount.register({
      id: randomUUID(),
      login: draft.login,
      passwordHash,
      firstName: draft.firstName,
      lastName: draft.lastName,
      phone: draft.phone,
      email: draft.email,
    });

    await this.userAccountRepository.save(user);
    await this.registrationCacheRepository.delete(command.registrationId);

    this.eventBus.publish(new UserRegisteredEvent(user.id, draft.email, draft.phone));

    return new VerifyWhatsAppAndCompleteRegistrationCommandOutput(
      user.id,
      'Registration completed successfully',
    );
  }

  private hashPassword(password: string): string {
    const salt = randomBytes(16).toString('hex');
    const hashed = scryptSync(password, salt, 64).toString('hex');
    return `${salt}:${hashed}`;
  }
}

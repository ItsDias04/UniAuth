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
import { randomUUID } from 'crypto';
import { ICommandHandler } from '../../../../../common/cqrs';
import {
  VerifyRegistrationEmailCommand,
  VerifyRegistrationEmailCommandOutput,
} from '../commands/verify-registration-email.command';
import {
  IRegistrationCacheRepository,
  REGISTRATION_CACHE_REPOSITORY,
} from '../../domain/repositories/registration-cache.repository.interface';
import { EmailVerifiedEvent } from '../../domain/events/email-verified.event';

@CommandHandler(VerifyRegistrationEmailCommand)
export class VerifyRegistrationEmailHandler
  implements
    NestCommandHandler<VerifyRegistrationEmailCommand, VerifyRegistrationEmailCommandOutput>,
    ICommandHandler<VerifyRegistrationEmailCommand, VerifyRegistrationEmailCommandOutput>
{
  private readonly ttlSeconds = 1800;

  constructor(
    @Inject(REGISTRATION_CACHE_REPOSITORY)
    private readonly registrationCacheRepository: IRegistrationCacheRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(
    command: VerifyRegistrationEmailCommand,
  ): Promise<VerifyRegistrationEmailCommandOutput> {
    const draft = await this.registrationCacheRepository.findById(command.registrationId);
    if (!draft) {
      throw new NotFoundException('Registration draft not found or expired');
    }

    const tempToken = randomUUID();
    const whatsAppCode = this.generateCode();

    try {
      draft.verifyEmail(command.emailCode, tempToken, whatsAppCode);
    } catch (error) {
      throw new BadRequestException((error as Error).message);
    }

    await this.registrationCacheRepository.save(draft, this.ttlSeconds);

    this.eventBus.publish(
      new EmailVerifiedEvent(draft.id, draft.phone, whatsAppCode),
    );

    return new VerifyRegistrationEmailCommandOutput(
      tempToken,
      'Email verified. WhatsApp code has been sent.',
    );
  }

  private generateCode(): string {
    return `${Math.floor(100000 + Math.random() * 900000)}`;
  }
}

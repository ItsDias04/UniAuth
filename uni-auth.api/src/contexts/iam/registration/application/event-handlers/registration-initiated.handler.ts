import { Inject } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { RegistrationInitiatedEvent } from '../../domain/events/registration-initiated.event';
import {
  EMAIL_SENDER,
  IEmailSender,
} from '../services/email-sender.interface';

@EventsHandler(RegistrationInitiatedEvent)
export class RegistrationInitiatedHandler
  implements IEventHandler<RegistrationInitiatedEvent>
{
  constructor(
    @Inject(EMAIL_SENDER)
    private readonly emailSender: IEmailSender,
  ) {}

  async handle(event: RegistrationInitiatedEvent): Promise<void> {
    await this.emailSender.sendRegistrationCode(event.email, event.emailCode);
  }
}

import { Inject } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { EmailVerifiedEvent } from '../../domain/events/email-verified.event';
import {
  IWhatsAppSender,
  WHATSAPP_SENDER,
} from '../services/whatsapp-sender.interface';

@EventsHandler(EmailVerifiedEvent)
export class EmailVerifiedHandler implements IEventHandler<EmailVerifiedEvent> {
  constructor(
    @Inject(WHATSAPP_SENDER)
    private readonly whatsAppSender: IWhatsAppSender,
  ) {}

  async handle(event: EmailVerifiedEvent): Promise<void> {
    await this.whatsAppSender.sendRegistrationCode(event.phone, event.whatsAppCode);
  }
}

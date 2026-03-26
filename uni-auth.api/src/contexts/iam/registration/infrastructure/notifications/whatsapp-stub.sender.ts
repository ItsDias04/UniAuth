import { Injectable, Logger } from '@nestjs/common';
import { IWhatsAppSender } from '../../application/services/whatsapp-sender.interface';

@Injectable()
export class WhatsAppStubSender implements IWhatsAppSender {
  private readonly logger = new Logger(WhatsAppStubSender.name);

  async sendRegistrationCode(phone: string, code: string): Promise<void> {
    this.logger.log(`[WHATSAPP STUB] Sent verification code ${code} to ${phone}`);
  }
}

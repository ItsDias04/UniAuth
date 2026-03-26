import { Injectable, Logger } from '@nestjs/common';
import { IEmailSender } from '../../application/services/email-sender.interface';

@Injectable()
export class SmtpEmailSender implements IEmailSender {
  private readonly logger = new Logger(SmtpEmailSender.name);

  async sendRegistrationCode(email: string, code: string): Promise<void> {
    this.logger.log(`[SMTP STUB] Sent registration email code ${code} to ${email}`);
  }
}

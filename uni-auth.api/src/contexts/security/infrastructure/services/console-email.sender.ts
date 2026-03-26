import { Injectable, Logger } from '@nestjs/common';
import { ISecurityEmailSender } from '../../application/services/security-email-sender.interface';

@Injectable()
export class SecurityConsoleEmailSender implements ISecurityEmailSender {
  private readonly logger = new Logger(SecurityConsoleEmailSender.name);

  async sendLoginVerificationCode(email: string, code: string): Promise<void> {
    this.logger.log(`[SECURITY EMAIL STUB] Sent login code ${code} to ${email}`);
  }
}

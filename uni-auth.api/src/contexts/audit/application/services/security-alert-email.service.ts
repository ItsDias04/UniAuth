import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { SecurityEventCategory } from '../../domain/entities/security-event-category.enum';

export interface SecurityAlertPayload {
  category: SecurityEventCategory;
  eventType: string;
  method: string;
  path: string;
  ipAddress: string;
  userId: string | null;
  responseStatus: number;
  reasons: string[];
  requestId: string | null;
  timestamp: string;
}

@Injectable()
export class SecurityAlertEmailService {
  private readonly logger = new Logger(SecurityAlertEmailService.name);
  private readonly transporter: nodemailer.Transporter | null;
  private readonly recipients: string[];
  private readonly fromAddress: string | null;
  private readonly fromName: string;

  constructor(private readonly configService: ConfigService) {
    const smtpUserEmail = this.configService.get<string>('SMTP_EMAIL');
    const smtpAppPassword = this.configService.get<string>('SMTP_APP_PASSWORD');

    this.fromName = this.configService.get<string>('SMTP_FROM_NAME', 'UniAuth');

    const rawRecipients = this.configService.get<string>(
      'SECURITY_MONITOR_NOTIFICATION_EMAILS',
      '',
    );
    this.recipients = rawRecipients
      .split(',')
      .map((email) => email.trim())
      .filter((email) => !!email);

    if (!smtpUserEmail || !smtpAppPassword) {
      this.transporter = null;
      this.fromAddress = null;
      this.logger.warn(
        'SMTP credentials are not configured. Security alerts will be logged to console only.',
      );
      return;
    }

    const smtpHost = this.configService.get<string>(
      'SMTP_HOST',
      'smtp.gmail.com',
    );
    const smtpPort = Number(this.configService.get<string>('SMTP_PORT', '465'));
    const smtpSecure =
      this.configService.get<string>('SMTP_SECURE', 'true').toLowerCase() ===
      'true';

    this.fromAddress = this.configService.get<string>(
      'SMTP_FROM_EMAIL',
      smtpUserEmail,
    );

    this.transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: {
        user: smtpUserEmail,
        pass: smtpAppPassword,
      },
    });
  }

  async sendAlert(payload: SecurityAlertPayload): Promise<void> {
    if (!this.recipients.length) {
      this.logger.warn(
        `SECURITY_MONITOR_NOTIFICATION_EMAILS is empty. Alert not delivered: ${payload.category} ${payload.method} ${payload.path}`,
      );
      return;
    }

    if (!this.transporter || !this.fromAddress) {
      this.logger.warn(
        `[SECURITY ALERT STUB] ${payload.category.toUpperCase()} ${payload.method} ${payload.path} ip=${payload.ipAddress} reasons=${payload.reasons.join('; ')}`,
      );
      return;
    }

    const content = this.buildEmail(payload);

    await this.transporter.sendMail({
      from: {
        address: this.fromAddress,
        name: this.fromName,
      },
      to: this.recipients,
      subject: content.subject,
      text: content.text,
      html: content.html,
    });

    this.logger.log(
      `Security alert email sent (${payload.category}) for ${payload.method} ${payload.path}`,
    );
  }

  private buildEmail(payload: SecurityAlertPayload): {
    subject: string;
    text: string;
    html: string;
  } {
    const subject = `[UniAuth Security] ${payload.category.toUpperCase()} :: ${payload.method} ${payload.path}`;
    const reasons = payload.reasons.length
      ? payload.reasons.join('; ')
      : 'No explicit reason captured';
    const userLine = payload.userId ?? 'anonymous';
    const requestIdLine = payload.requestId ?? '-';

    const text = [
      'UniAuth Security Monitoring Alert',
      '',
      `Category: ${payload.category}`,
      `Event Type: ${payload.eventType}`,
      `Timestamp (UTC): ${payload.timestamp}`,
      `HTTP: ${payload.method} ${payload.path}`,
      `Response status: ${payload.responseStatus}`,
      `IP: ${payload.ipAddress}`,
      `User: ${userLine}`,
      `Request ID: ${requestIdLine}`,
      `Reasons: ${reasons}`,
    ].join('\n');

    const html = `
<div style="font-family:Arial,Helvetica,sans-serif;color:#111827;background:#f3f4f6;padding:16px;">
  <div style="max-width:640px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;">
    <div style="padding:16px 20px;background:#111827;color:#f9fafb;">
      <p style="margin:0;font-size:12px;opacity:.8;letter-spacing:.06em;text-transform:uppercase;">UniAuth Security Monitoring</p>
      <h2 style="margin:8px 0 0;font-size:20px;">Alert: ${payload.category.toUpperCase()}</h2>
    </div>
    <div style="padding:18px 20px;">
      <p style="margin:0 0 10px;"><strong>Event:</strong> ${payload.eventType}</p>
      <p style="margin:0 0 10px;"><strong>Timestamp (UTC):</strong> ${payload.timestamp}</p>
      <p style="margin:0 0 10px;"><strong>HTTP:</strong> ${payload.method} ${payload.path}</p>
      <p style="margin:0 0 10px;"><strong>Status:</strong> ${payload.responseStatus}</p>
      <p style="margin:0 0 10px;"><strong>IP:</strong> ${payload.ipAddress}</p>
      <p style="margin:0 0 10px;"><strong>User:</strong> ${userLine}</p>
      <p style="margin:0 0 10px;"><strong>Request ID:</strong> ${requestIdLine}</p>
      <p style="margin:0;"><strong>Reasons:</strong> ${reasons}</p>
    </div>
  </div>
</div>
    `.trim();

    return { subject, text, html };
  }
}

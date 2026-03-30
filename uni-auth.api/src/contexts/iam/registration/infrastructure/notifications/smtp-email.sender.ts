import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { IEmailSender } from '../../application/services/email-sender.interface';

@Injectable()
export class SmtpEmailSender implements IEmailSender {
  private readonly logger = new Logger(SmtpEmailSender.name);
  private readonly transporter: nodemailer.Transporter | null;
  private readonly smtpUserEmail: string | null;
  private readonly fromAddress: string | null;
  private readonly fromName: string;

  constructor(private readonly configService: ConfigService) {
    const smtpUserEmail = this.configService.get<string>('SMTP_EMAIL');
    const smtpAppPassword = this.configService.get<string>('SMTP_APP_PASSWORD');

    this.fromName = this.configService.get<string>('SMTP_FROM_NAME', 'UniAuth');

    if (!smtpUserEmail || !smtpAppPassword) {
      this.smtpUserEmail = null;
      this.fromAddress = null;
      this.transporter = null;
      this.logger.warn(
        'SMTP_EMAIL or SMTP_APP_PASSWORD is not configured. Falling back to console email sender for registration.',
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

    this.smtpUserEmail = smtpUserEmail;
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

  async sendRegistrationCode(email: string, code: string): Promise<void> {
    if (!this.transporter || !this.smtpUserEmail || !this.fromAddress) {
      this.logger.log(
        `[SMTP STUB] Sent registration email code ${code} to ${email}`,
      );
      return;
    }

    const content = this.buildRegistrationEmailContent(code);

    await this.transporter.sendMail({
      from: {
        address: this.fromAddress,
        name: this.fromName,
      },
      to: email,
      subject: 'Complete your UniAuth registration',
      text: content.text,
      html: content.html,
    });

    this.logger.log(
      `Sent registration verification code to ${email} using SMTP account ${this.smtpUserEmail}`,
    );
  }

  private buildRegistrationEmailContent(code: string): {
    html: string;
    text: string;
  } {
    const text = [
      'UniAuth verification code',
      '',
      `Your registration verification code is: ${code}`,
      'This code expires in 30 minutes.',
      '',
      'If you did not request this code, please ignore this email.',
      'For security, never share this code with anyone.',
    ].join('\n');

    const html = `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <title>Complete your UniAuth registration</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f4f6fb;color:#0f172a;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:24px 12px;background-color:#f4f6fb;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background-color:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
            <tr>
              <td style="padding:20px 24px;background:linear-gradient(135deg,#0f172a,#1e293b);color:#f8fafc;">
                <p style="margin:0;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;opacity:0.9;">UniAuth</p>
                <h1 style="margin:8px 0 0;font-size:22px;line-height:1.3;font-weight:700;">Confirm your email to finish registration</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:24px;">
                <p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:#334155;">Use the verification code below to continue your registration flow.</p>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:18px 0 14px;">
                  <tr>
                    <td align="center" style="background-color:#f8fafc;border:1px solid #cbd5e1;border-radius:12px;padding:18px 12px;">
                      <span style="font-size:34px;line-height:1;font-weight:700;letter-spacing:0.28em;color:#0f172a;font-family:'Courier New',Courier,monospace;">${code}</span>
                    </td>
                  </tr>
                </table>
                <p style="margin:0 0 4px;font-size:14px;line-height:1.6;color:#475569;">This code expires in <strong>30 minutes</strong>.</p>
                <p style="margin:0;font-size:14px;line-height:1.6;color:#64748b;">If you did not request this code, you can safely ignore this email.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 24px;background-color:#f8fafc;border-top:1px solid #e2e8f0;">
                <p style="margin:0;font-size:12px;line-height:1.5;color:#64748b;">Security notice: UniAuth support will never ask for your verification code.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
    `.trim();

    return { html, text };
  }
}

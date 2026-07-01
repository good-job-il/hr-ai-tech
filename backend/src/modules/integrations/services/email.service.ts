import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

/**
 * EmailService — replaces `base44.integrations.Core.SendEmail`.
 *
 * If SMTP_HOST is configured, sends real emails via nodemailer.
 * Otherwise, logs the email to the console (dev/no-op fallback) so the
 * calling code path still succeeds — matching Base44's forgiving behaviour.
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(private readonly config: ConfigService) {
    const host = this.config.get<string>('SMTP_HOST');
    if (host) {
      this.transporter = nodemailer.createTransport({
        host,
        port: this.config.get<number>('SMTP_PORT', 587),
        secure: this.config.get<number>('SMTP_PORT', 587) === 465,
        auth: {
          user: this.config.get<string>('SMTP_USER'),
          pass: this.config.get<string>('SMTP_PASS'),
        },
      });
    }
  }

  async send(to: string, subject: string, body: string, fromName?: string): Promise<{ success: boolean; message: string }> {
    const from = `${fromName || 'Hire Israel'} <${this.config.get<string>('EMAIL_FROM', 'noreply@hire-israel.co.il')}>`;

    if (!this.transporter) {
      this.logger.log(`[Email:MOCK] to=${to} subject="${subject}"\n${body}`);
      return { success: true, message: 'Email logged (SMTP not configured)' };
    }

    try {
      await this.transporter.sendMail({ from, to, subject, text: body });
      return { success: true, message: 'Email sent' };
    } catch (err) {
      this.logger.error(`Failed to send email to ${to}: ${(err as Error).message}`);
      // Match Base44's forgiving behaviour — don't blow up calling flows
      return { success: false, message: (err as Error).message };
    }
  }
}


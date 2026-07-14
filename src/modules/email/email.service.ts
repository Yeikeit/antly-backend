import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { google } from 'googleapis';
import * as Handlebars from 'handlebars';
import { EmailTemplate } from './entities/email-template.entity';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly gmail;
  private readonly from: string;

  constructor(
    @InjectRepository(EmailTemplate)
    private readonly templateRepo: Repository<EmailTemplate>,
    private readonly config: ConfigService,
  ) {
    const user = config.get<string>('GMAIL_USER')!;
    this.from = `Antly <${user}>`;

    const auth = new google.auth.OAuth2(
      config.get<string>('GMAIL_CLIENT_ID'),
      config.get<string>('GMAIL_CLIENT_SECRET'),
    );
    auth.setCredentials({ refresh_token: config.get<string>('GMAIL_REFRESH_TOKEN') });

    this.gmail = google.gmail({ version: 'v1', auth });
  }

  async send(slug: string, to: string, params: Record<string, unknown>): Promise<void> {
    const template = await this.templateRepo.findOne({ where: { slug } });
    if (!template) throw new NotFoundException(`Email template "${slug}" not found`);

    const subject = Handlebars.compile(template.subject)(params);
    const html = Handlebars.compile(template.htmlBody)(params);

    const mime = [
      `From: ${this.from}`,
      `To: ${to}`,
      `Subject: ${subject}`,
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset=UTF-8',
      '',
      html,
    ].join('\r\n');

    const raw = Buffer.from(mime).toString('base64url');

    await this.gmail.users.messages.send({ userId: 'me', requestBody: { raw } });

    this.logger.log(`Email "${slug}" sent to ${to}`);
  }
}

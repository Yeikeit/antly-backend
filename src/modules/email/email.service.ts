import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import nodemailer from 'nodemailer';
import * as Handlebars from 'handlebars';
import { EmailTemplate } from './entities/email-template.entity';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly transporter: nodemailer.Transporter;
  private readonly from: string;

  constructor(
    @InjectRepository(EmailTemplate)
    private readonly templateRepo: Repository<EmailTemplate>,
    private readonly config: ConfigService,
  ) {
    const user = config.get<string>('GMAIL_USER')!;
    this.from = `Antly <${user}>`;

    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user,
        clientId: config.get<string>('GMAIL_CLIENT_ID'),
        clientSecret: config.get<string>('GMAIL_CLIENT_SECRET'),
        refreshToken: config.get<string>('GMAIL_REFRESH_TOKEN'),
      },
    });
  }

  async send(slug: string, to: string, params: Record<string, unknown>): Promise<void> {
    const template = await this.templateRepo.findOne({ where: { slug } });
    if (!template) throw new NotFoundException(`Email template "${slug}" not found`);

    const subject = Handlebars.compile(template.subject)(params);
    const html = Handlebars.compile(template.htmlBody)(params);

    await this.transporter.sendMail({ from: this.from, to, subject, html });

    this.logger.log(`Email "${slug}" sent to ${to}`);
  }
}

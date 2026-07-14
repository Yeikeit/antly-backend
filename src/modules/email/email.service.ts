import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import * as Handlebars from 'handlebars';
import { EmailTemplate } from './entities/email-template.entity';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resend: Resend;
  private readonly from: string;

  constructor(
    @InjectRepository(EmailTemplate)
    private readonly templateRepo: Repository<EmailTemplate>,
    private readonly config: ConfigService,
  ) {
    this.resend = new Resend(config.get<string>('RESEND_API_KEY'));
    this.from = config.get<string>('EMAIL_FROM') ?? 'Antly <onboarding@resend.dev>';
  }

  async send(slug: string, to: string, params: Record<string, unknown>): Promise<void> {
    const template = await this.templateRepo.findOne({ where: { slug } });
    if (!template) throw new NotFoundException(`Email template "${slug}" not found`);

    const subject = Handlebars.compile(template.subject)(params);
    const html = Handlebars.compile(template.htmlBody)(params);

    const { error } = await this.resend.emails.send({ from: this.from, to, subject, html });

    if (error) throw new Error(`Resend error: ${error.message}`);

    this.logger.log(`Email "${slug}" sent to ${to}`);
  }
}

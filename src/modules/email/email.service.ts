import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
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
    this.transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: config.get<string>('GMAIL_USER'),
        pass: config.get<string>('GMAIL_PASS'),
      },
    });

    this.from = `Antly <${config.get<string>('GMAIL_USER')}>`;
  }

  async send(slug: string, to: string, params: Record<string, unknown>): Promise<void> {
    const template = await this.templateRepo.findOne({ where: { slug } });
    if (!template) throw new NotFoundException(`Email template "${slug}" not found`);

    const compiledSubject = Handlebars.compile(template.subject)(params);
    const compiledHtml = Handlebars.compile(template.htmlBody)(params);

    await this.transporter.sendMail({
      from: this.from,
      to,
      subject: compiledSubject,
      html: compiledHtml,
    });

    this.logger.log(`Email "${slug}" sent to ${to}`);
  }
}

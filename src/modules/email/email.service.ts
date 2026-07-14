import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as https from 'https';
import * as Handlebars from 'handlebars';
import { EmailTemplate } from './entities/email-template.entity';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly from: string;
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly refreshToken: string;

  constructor(
    @InjectRepository(EmailTemplate)
    private readonly templateRepo: Repository<EmailTemplate>,
    private readonly config: ConfigService,
  ) {
    const user = config.get<string>('GMAIL_USER')!;
    this.from = `Antly <${user}>`;
    this.clientId = config.get<string>('GMAIL_CLIENT_ID')!;
    this.clientSecret = config.get<string>('GMAIL_CLIENT_SECRET')!;
    this.refreshToken = config.get<string>('GMAIL_REFRESH_TOKEN')!;
  }

  private httpsPost(hostname: string, path: string, body: string, headers: Record<string, string>): Promise<string> {
    return new Promise((resolve, reject) => {
      const req = https.request({ hostname, path, method: 'POST', headers }, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => resolve(data));
      });
      req.on('error', reject);
      req.write(body);
      req.end();
    });
  }

  private async getAccessToken(): Promise<string> {
    const body = new URLSearchParams({
      client_id: this.clientId,
      client_secret: this.clientSecret,
      refresh_token: this.refreshToken,
      grant_type: 'refresh_token',
    }).toString();

    const response = await this.httpsPost(
      'oauth2.googleapis.com',
      '/token',
      body,
      { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(body).toString() },
    );

    const json = JSON.parse(response) as { access_token?: string; error?: string };
    if (!json.access_token) throw new Error(`Failed to get access token: ${json.error}`);
    return json.access_token;
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
    const accessToken = await this.getAccessToken();
    const body = JSON.stringify({ raw });

    await this.httpsPost(
      'gmail.googleapis.com',
      '/gmail/v1/users/me/messages/send',
      body,
      {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body).toString(),
      },
    );

    this.logger.log(`Email "${slug}" sent to ${to}`);
  }
}

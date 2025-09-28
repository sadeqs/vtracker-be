import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
  constructor(private configService: ConfigService) {}

  async sendVerificationEmail(email: string, verificationToken: string): Promise<void> {
    const verificationUrl = `${this.configService.get<string>('FRONTEND_URL')}/verify-email/${verificationToken}`;
    
    if (this.configService.get<string>('NODE_ENV') === 'production') {
      // Use Mailgun in production
      await this.sendWithMailgun(email, verificationToken, verificationUrl);
    } else {
      // Use MailHog or console logging in development
      if (this.configService.get<string>('USE_MAILHOG') === 'true') {
        await this.sendWithMailHog(email, verificationToken, verificationUrl);
      } else {
        // Fallback to console logging
        this.logVerificationEmail(email, verificationUrl);
      }
    }
  }

  private async sendWithMailgun(email: string, token: string, verificationUrl: string): Promise<void> {
    const formData = require('form-data');
    const Mailgun = require('mailgun.js');
    
    const mailgun = new Mailgun(formData);
    const mg = mailgun.client({
    // TODO substitue with environment variables
      username: 'api',
      key: this.configService.get<string>('MAILGUN_API_KEY'),
    });

    const emailOptions = this.getEmailOptions(email, verificationUrl);

    try {
      await mg.messages.create(this.configService.get<string>('MAILGUN_DOMAIN'), {
        from: emailOptions.from,
        to: [emailOptions.to],
        subject: emailOptions.subject,
        html: emailOptions.html,
      });
      console.log(`Production email sent to ${email}`);
    } catch (error) {
      console.error('Mailgun error:', error);
      throw new Error('Failed to send verification email');
    }
  }

  private async sendWithMailHog(email: string, token: string, verificationUrl: string): Promise<void> {
    const nodemailer = require('nodemailer');
    
    // MailHog SMTP configuration
    const transporter = nodemailer.createTransport({
      host: this.configService.get<string>('MAILHOG_HOST', '127.0.0.1'),
      port: this.configService.get<number>('MAILHOG_PORT', 1025),
      secure: false, // true for 465, false for other ports
      auth: false, // MailHog doesn't require authentication
      tls: {
        rejectUnauthorized: false
      }
    });

    const emailOptions = this.getEmailOptions(email, verificationUrl);

    try {
      await transporter.sendMail({
        from: emailOptions.from,
        to: emailOptions.to,
        subject: emailOptions.subject,
        html: emailOptions.html,
      });
      console.log(`MailHog email sent to ${email} - Check http://localhost:8025`);
    } catch (error) {
      console.error('MailHog error:', error);
      // Fallback to console logging
      this.logVerificationEmail(email, verificationUrl);
    }
  }

  private getEmailOptions(email: string, verificationUrl: string) {
    const isDev = this.configService.get<string>('NODE_ENV') !== 'production';
    const domain = this.configService.get<string>('MAILGUN_DOMAIN', 'vtracker.com');
    
    return {
      from: `VTracker <noreply@${domain}>`,
      to: email,
      subject: `Verify your email address${isDev ? ' (DEV)' : ''}`,
      html: this.getEmailTemplate(verificationUrl),
    };
  }

  private logVerificationEmail(email: string, verificationUrl: string): void {
    console.log('='.repeat(80));
    console.log('EMAIL VERIFICATION (LOCAL DEVELOPMENT)');
    console.log('='.repeat(80));
    console.log(`To: ${email}`);
    console.log(`Subject: Verify your email address`);
    console.log(`\nPlease click the following link to verify your email:`);
    console.log(`${verificationUrl}`);
    console.log('='.repeat(80));
  }

  private getEmailTemplate(verificationUrl: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Email Verification</title>
      </head>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #333;">Welcome to VTracker!</h1>
        </div>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <p style="margin: 0; font-size: 16px; line-height: 1.5;">
            Thank you for registering! Please verify your email address to complete your account setup.
          </p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" 
             style="background-color: #007bff; color: white; padding: 12px 30px; 
                    text-decoration: none; border-radius: 5px; display: inline-block; 
                    font-weight: bold;">
            Verify Email Address
          </a>
        </div>
        
        <div style="font-size: 14px; color: #666; border-top: 1px solid #eee; padding-top: 20px;">
          <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #007bff;">${verificationUrl}</p>
          <p>This link will expire in 24 hours for security reasons.</p>
        </div>
      </body>
      </html>
    `;
  }
}
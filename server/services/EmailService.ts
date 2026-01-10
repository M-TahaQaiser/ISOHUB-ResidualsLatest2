import fetch, { Headers, Request, Response } from 'node-fetch';

// Polyfill for Node.js < 18
if (!globalThis.fetch) {
  (globalThis as any).fetch = fetch;
  (globalThis as any).Headers = Headers;
  (globalThis as any).Request = Request;
  (globalThis as any).Response = Response;
}

import { Resend } from 'resend';
import { db } from '../db';
import { emailTracking, agencies } from '@shared/schema';
import { eq } from 'drizzle-orm';

interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text: string;
  agencyId?: number;
  emailType?: string;
}

export class EmailService {
  private resend: Resend | null = null;
  private fromEmail: string;
  private isConfigured: boolean = false;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    this.fromEmail = process.env.FROM_EMAIL || 'noreply@isohub.io';
    
    if (apiKey) {
      this.resend = new Resend(apiKey);
      this.isConfigured = true;
      console.log('[EMAIL SERVICE] Resend configured successfully');
    } else {
      console.warn('[EMAIL SERVICE] WARNING: Email credentials not configured. Email functionality will be disabled.');
    }
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.isConfigured || !this.resend) {
      console.warn('[EMAIL SERVICE] Email not configured, skipping send');
      return false;
    }

    try {
      console.log(`📧 Resend - Sending email to: ${options.to}`);
      console.log(`📧 Resend - Subject: ${options.subject}`);
      console.log(`📧 Resend - Email type: ${options.emailType || 'unknown'}`);
      
      const { data, error } = await this.resend.emails.send({
        from: `ISOHub Support <${this.fromEmail}>`,
        to: [options.to],
        subject: options.subject,
        html: options.html,
        text: options.text,
      });

      if (error) {
        console.error('❌ Resend Error:', error);
        return false;
      }

      console.log(`✅ Resend Success - Message ID: ${data?.id}`);

      // Track email delivery
      if (options.agencyId && options.emailType) {
        await db.insert(emailTracking).values({
          agencyId: options.agencyId,
          recipientEmail: options.to,
          emailType: options.emailType,
          subject: options.subject,
          status: 'sent',
          metadata: { messageId: data?.id },
        });
      }

      return true;
    } catch (error: any) {
      console.error('❌ Resend Error details:', error);
      console.error('❌ Resend Error message:', error.message);
      return false;
    }
  }

  getWelcomeEmailTemplate(agencyName: string, contactName: string, adminUsername: string): EmailTemplate {
    const subject = `Welcome to ISOHub - Your Agency Instance is Ready!`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to ISOHub</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #FFD700, #FFA500); padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #ffffff; padding: 30px; border: 1px solid #ddd; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px; color: #666; }
          .button { display: inline-block; padding: 12px 24px; background: #FFD700; color: #000; text-decoration: none; border-radius: 4px; font-weight: bold; margin: 20px 0; }
          .credentials { background: #f8f9fa; padding: 15px; border-radius: 4px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; color: #000;">Welcome to ISOHub!</h1>
            <p style="margin: 10px 0 0 0; color: #333;">Your agency instance is now ready</p>
          </div>
          
          <div class="content">
            <h2>Hello ${contactName},</h2>
            
            <p>Congratulations! Your ISOHub agency instance for <strong>${agencyName}</strong> has been successfully created and configured.</p>
            
            <div class="credentials">
              <h3>Your Admin Account Details:</h3>
              <p><strong>Username:</strong> ${adminUsername}</p>
              <p><strong>Note:</strong> Your temporary password will be sent in a separate email for security purposes.</p>
            </div>
            
            <p>Your agency instance includes:</p>
            <ul>
              <li>✅ Custom branded dashboard with your colors</li>
              <li>✅ Multi-tenant merchant management system</li>
              <li>✅ Automated residual tracking and reporting</li>
              <li>✅ AI-powered insights and analytics</li>
              <li>✅ Comprehensive user role management</li>
              <li>✅ Email notification system</li>
            </ul>
            
            <p>You'll receive your login credentials shortly. Once you log in, you can:</p>
            <ul>
              <li>Upload your merchant data</li>
              <li>Configure processor connections</li>
              <li>Set up commission structures</li>
              <li>Invite team members</li>
              <li>Generate custom reports</li>
            </ul>
            
            <div style="text-align: center;">
              <a href="https://isohub.io/login" class="button">Access Your Dashboard</a>
            </div>
            
            <p>If you have any questions or need assistance, our support team is here to help.</p>
            
            <p>Best regards,<br>The ISOHub Team</p>
          </div>
          
          <div class="footer">
            <p>© 2025 ISOHub. All rights reserved.</p>
            <p>This email was sent to ${adminUsername}. If you received this in error, please contact support.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Welcome to ISOHub!

Hello ${contactName},

Congratulations! Your ISOHub agency instance for ${agencyName} has been successfully created and configured.

Your Admin Account Details:
Username: ${adminUsername}
Note: Your temporary password will be sent in a separate email for security purposes.

Your agency instance includes:
- Custom branded dashboard with your colors
- Multi-tenant merchant management system
- Automated residual tracking and reporting
- AI-powered insights and analytics
- Comprehensive user role management
- Email notification system

You'll receive your login credentials shortly. Once you log in, you can:
- Upload your merchant data
- Configure processor connections
- Set up commission structures
- Invite team members
- Generate custom reports

Access your dashboard: https://isohub.io/login

If you have any questions or need assistance, our support team is here to help.

Best regards,
The ISOHub Team

© 2025 ISOHub. All rights reserved.
    `;

    return { subject, html, text };
  }

  getPasswordEmailTemplate(contactName: string, adminUsername: string, tempPassword: string): EmailTemplate {
    const subject = `ISOHub Login Credentials - Secure Access Information`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>ISOHub Login Credentials</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #000000, #333333); padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #ffffff; padding: 30px; border: 1px solid #ddd; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px; color: #666; }
          .button { display: inline-block; padding: 12px 24px; background: #FFD700; color: #000; text-decoration: none; border-radius: 4px; font-weight: bold; margin: 20px 0; }
          .credentials { background: #fff3cd; padding: 20px; border-radius: 4px; margin: 20px 0; border-left: 4px solid #FFD700; }
          .password { font-family: 'Courier New', monospace; font-size: 18px; font-weight: bold; color: #d63384; background: #f8f9fa; padding: 10px; border-radius: 4px; letter-spacing: 1px; }
          .security-note { background: #d1ecf1; padding: 15px; border-radius: 4px; margin: 20px 0; border-left: 4px solid #bee5eb; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; color: #FFD700;">🔐 Secure Login Information</h1>
            <p style="margin: 10px 0 0 0; color: #fff;">ISOHub Admin Access</p>
          </div>
          
          <div class="content">
            <h2>Hello ${contactName},</h2>
            
            <p>Here are your secure login credentials for your ISOHub admin account.</p>
            
            <div class="credentials">
              <h3>🔑 Login Credentials:</h3>
              <p><strong>Username:</strong> <code>${adminUsername}</code></p>
              <p><strong>Temporary Password:</strong></p>
              <div class="password">${tempPassword}</div>
            </div>
            
            <div class="security-note">
              <h4>🛡️ Important Security Notes:</h4>
              <ul>
                <li><strong>Change this password immediately</strong> after your first login</li>
                <li>Use a strong, unique password with at least 12 characters</li>
                <li>Include uppercase, lowercase, numbers, and special characters</li>
                <li>Never share your login credentials with anyone</li>
                <li>Enable two-factor authentication in your account settings</li>
              </ul>
            </div>
            
            <div style="text-align: center;">
              <a href="https://isohub.io/login" class="button">Login to Your Dashboard</a>
            </div>
            
            <p><strong>First-time login steps:</strong></p>
            <ol>
              <li>Click the login button above or visit https://isohub.io/login</li>
              <li>Enter your username and temporary password</li>
              <li>You'll be prompted to change your password</li>
              <li>Set up two-factor authentication (recommended)</li>
              <li>Complete your agency profile setup</li>
            </ol>
            
            <p>If you encounter any issues logging in or have questions about your account, please contact our support team immediately.</p>
            
            <p>Best regards,<br>The ISOHub Security Team</p>
          </div>
          
          <div class="footer">
            <p>© 2025 ISOHub. All rights reserved.</p>
            <p><strong>Security Notice:</strong> This email contains sensitive information. Please delete it after use.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
ISOHub Login Credentials - Secure Access Information

Hello ${contactName},

Here are your secure login credentials for your ISOHub admin account.

Login Credentials:
Username: ${adminUsername}
Temporary Password: ${tempPassword}

IMPORTANT SECURITY NOTES:
- Change this password immediately after your first login
- Use a strong, unique password with at least 12 characters
- Include uppercase, lowercase, numbers, and special characters
- Never share your login credentials with anyone
- Enable two-factor authentication in your account settings

First-time login steps:
1. Visit https://isohub.io/login
2. Enter your username and temporary password
3. You'll be prompted to change your password
4. Set up two-factor authentication (recommended)
5. Complete your agency profile setup

If you encounter any issues logging in or have questions about your account, please contact our support team immediately.

Best regards,
The ISOHub Security Team

© 2025 ISOHub. All rights reserved.
Security Notice: This email contains sensitive information. Please delete it after use.
    `;

    return { subject, html, text };
  }

  async sendWelcomeEmail(agencyId: number, email: string, agencyName: string, contactName: string, adminUsername: string): Promise<boolean> {
    const template = this.getWelcomeEmailTemplate(agencyName, contactName, adminUsername);
    
    return await this.sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text,
      agencyId,
      emailType: 'welcome',
    });
  }

  async sendPasswordEmail(agencyId: number, email: string, contactName: string, adminUsername: string, tempPassword: string): Promise<boolean> {
    const template = this.getPasswordEmailTemplate(contactName, adminUsername, tempPassword);
    
    return await this.sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text,
      agencyId,
      emailType: 'password',
    });
  }

  async updateEmailTracking(agencyId: number, emailType: string, status: 'delivered' | 'opened' | 'clicked' | 'bounced'): Promise<void> {
    try {
      const updateData: any = { status };
      
      switch (status) {
        case 'delivered':
          updateData.deliveredAt = new Date();
          break;
        case 'opened':
          updateData.openedAt = new Date();
          break;
        case 'clicked':
          updateData.clickedAt = new Date();
          break;
        case 'bounced':
          updateData.bounced = true;
          break;
      }

      await db.update(emailTracking)
        .set(updateData)
        .where(eq(emailTracking.agencyId, agencyId));
    } catch (error) {
      console.error('Error updating email tracking:', error);
    }
  }

  // User Welcome Email Template
  getUserWelcomeEmailTemplate(firstName: string, lastName: string, username: string, tempPassword: string, agencyName: string, role: string): EmailTemplate {
    const subject = `Welcome to ${agencyName} - Your Account is Ready!`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to ${agencyName}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #FFD700, #FFA500); padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #ffffff; padding: 30px; border: 1px solid #ddd; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px; color: #666; }
          .credentials { background: #fff3cd; padding: 20px; border-radius: 4px; margin: 20px 0; border-left: 4px solid #FFD700; }
          .password { font-family: 'Courier New', monospace; font-size: 18px; font-weight: bold; color: #d63384; background: #f8f9fa; padding: 10px; border-radius: 4px; letter-spacing: 1px; }
          .security-note { background: #d1ecf1; padding: 15px; border-radius: 4px; margin: 20px 0; border-left: 4px solid #bee5eb; }
          .role-badge { display: inline-block; padding: 4px 12px; background: #FFD700; color: #000; border-radius: 4px; font-weight: bold; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; color: #000;">Welcome to ${agencyName}!</h1>
            <p style="margin: 10px 0 0 0; color: #333;">Your account has been created</p>
          </div>
          
          <div class="content">
            <h2>Hello ${firstName} ${lastName},</h2>
            
            <p>Welcome to ${agencyName}! Your user account has been successfully created with <span class="role-badge">${role}</span> access level.</p>
            
            <div class="credentials">
              <h3>🔑 Your Login Credentials:</h3>
              <p><strong>Username:</strong> <code>${username}</code></p>
              <p><strong>Temporary Password:</strong></p>
              <div class="password">${tempPassword}</div>
              <p><strong>Login URL:</strong> <a href="https://isohub.io/login" style="color: #FFD700;">https://isohub.io/login</a></p>
            </div>
            
            <div class="security-note">
              <h4>🛡️ Important Security Requirements:</h4>
              <ul>
                <li><strong>Change this password immediately</strong> after your first login</li>
                <li>Use a strong, unique password with at least 12 characters</li>
                <li>Include uppercase, lowercase, numbers, and special characters</li>
                <li>Never share your login credentials with anyone</li>
                <li>Enable two-factor authentication in your account settings</li>
              </ul>
            </div>
            
            <h3>Your Role: ${role}</h3>
            <p>Based on your assigned role, you'll have access to specific features and functionality within the system. Your account administrator can adjust your permissions as needed.</p>
            
            <p>If you have any questions or need assistance getting started, please contact your system administrator or our support team.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://isohub.io/login" style="display: inline-block; padding: 12px 24px; background: #FFD700; color: #000; text-decoration: none; border-radius: 4px; font-weight: bold;">Login Now</a>
            </div>
          </div>
          
          <div class="footer">
            <p>© 2025 ${agencyName}. Powered by ISOHub.</p>
            <p>🔒 This email contains sensitive login information. Please delete it after use.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Welcome to ${agencyName}!

Hello ${firstName} ${lastName},

Your user account has been successfully created with ${role} access level.

Login Credentials:
Username: ${username}
Temporary Password: ${tempPassword}
Login URL: https://isohub.io/login

IMPORTANT SECURITY REQUIREMENTS:
- Change this password immediately after your first login
- Use a strong, unique password with at least 12 characters
- Include uppercase, lowercase, numbers, and special characters
- Never share your login credentials with anyone
- Enable two-factor authentication in your account settings

Your Role: ${role}
Based on your assigned role, you'll have access to specific features and functionality within the system.

If you have any questions or need assistance getting started, please contact your system administrator or our support team.

© 2025 ${agencyName}. Powered by ISOHub.
🔒 This email contains sensitive login information. Please delete it after use.
    `;

    return { subject, html, text };
  }

  // Password Reset Email Template
  getPasswordResetEmailTemplate(firstName: string, lastName: string, username: string, tempPassword: string, agencyName: string): EmailTemplate {
    const subject = `Password Reset - ${agencyName}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset - ${agencyName}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #000000, #333333); padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #ffffff; padding: 30px; border: 1px solid #ddd; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px; color: #666; }
          .credentials { background: #fff3cd; padding: 20px; border-radius: 4px; margin: 20px 0; border-left: 4px solid #FFD700; }
          .password { font-family: 'Courier New', monospace; font-size: 18px; font-weight: bold; color: #d63384; background: #f8f9fa; padding: 10px; border-radius: 4px; letter-spacing: 1px; }
          .security-note { background: #f8d7da; padding: 15px; border-radius: 4px; margin: 20px 0; border-left: 4px solid #f5c6cb; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; color: #FFD700;">🔐 Password Reset</h1>
            <p style="margin: 10px 0 0 0; color: #fff;">${agencyName}</p>
          </div>
          
          <div class="content">
            <h2>Hello ${firstName} ${lastName},</h2>
            
            <p>Your password has been reset as requested. Please use the temporary password below to log in.</p>
            
            <div class="credentials">
              <h3>🔑 New Login Credentials:</h3>
              <p><strong>Username:</strong> <code>${username}</code></p>
              <p><strong>New Temporary Password:</strong></p>
              <div class="password">${tempPassword}</div>
              <p><strong>Login URL:</strong> <a href="https://isohub.io/login" style="color: #FFD700;">https://isohub.io/login</a></p>
            </div>
            
            <div class="security-note">
              <h4>⚠️ Important Security Notice:</h4>
              <ul>
                <li><strong>Change this password immediately</strong> after logging in</li>
                <li>This is a one-time temporary password</li>
                <li>If you did not request this reset, contact support immediately</li>
                <li>Your account may be compromised if this was not requested by you</li>
              </ul>
            </div>
            
            <p>For your security, this temporary password will expire in 24 hours. Please log in and change it as soon as possible.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://isohub.io/login" style="display: inline-block; padding: 12px 24px; background: #FFD700; color: #000; text-decoration: none; border-radius: 4px; font-weight: bold;">Login & Change Password</a>
            </div>
          </div>
          
          <div class="footer">
            <p>© 2025 ${agencyName}. Powered by ISOHub.</p>
            <p>🔒 If you did not request this password reset, please contact support immediately.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Password Reset - ${agencyName}

Hello ${firstName} ${lastName},

Your password has been reset as requested. Please use the temporary password below to log in.

New Login Credentials:
Username: ${username}
New Temporary Password: ${tempPassword}
Login URL: https://isohub.io/login

IMPORTANT SECURITY NOTICE:
- Change this password immediately after logging in
- This is a one-time temporary password
- If you did not request this reset, contact support immediately
- Your account may be compromised if this was not requested by you

For your security, this temporary password will expire in 24 hours. Please log in and change it as soon as possible.

© 2025 ${agencyName}. Powered by ISOHub.
🔒 If you did not request this password reset, please contact support immediately.
    `;

    return { subject, html, text };
  }

  // Send user welcome email
  async sendUserWelcomeEmail(params: {
    email: string;
    firstName: string;
    lastName: string;
    username: string;
    tempPassword: string;
    agencyName: string;
    role: string;
  }): Promise<boolean> {
    const template = this.getUserWelcomeEmailTemplate(
      params.firstName,
      params.lastName,
      params.username,
      params.tempPassword,
      params.agencyName,
      params.role
    );
    
    return await this.sendEmail({
      to: params.email,
      subject: template.subject,
      html: template.html,
      text: template.text,
      emailType: 'user_welcome',
    });
  }

  // Send password reset email
  async sendPasswordResetEmail(params: {
    email: string;
    firstName: string;
    lastName: string;
    username: string;
    tempPassword: string;
    agencyName: string;
  }): Promise<boolean> {
    const template = this.getPasswordResetEmailTemplate(
      params.firstName,
      params.lastName,
      params.username,
      params.tempPassword,
      params.agencyName
    );
    
    return await this.sendEmail({
      to: params.email,
      subject: template.subject,
      html: template.html,
      text: template.text,
      emailType: 'password_reset',
    });
  }
}

// Interface for upload link email parameters
interface UploadLinkEmailParams {
  recipientName: string;
  recipientEmail: string;
  uploadLink: string;
  expirationDate: string;
  maxDownloads: number;
  message?: string;
  senderName: string;
}

export const emailService = new EmailService();

// Add the missing sendUploadLinkEmail method
(emailService as any).sendUploadLinkEmail = async function(params: UploadLinkEmailParams): Promise<boolean> {
  console.log(`🔧 DEBUG: sendUploadLinkEmail called with params:`, params);
  
  try {
    const template = (this as any).getUploadLinkTemplate(params);
    console.log(`🔧 DEBUG: Template generated, subject: ${template.subject}`);
    
    const result = await this.sendEmail({
      to: params.recipientEmail,
      subject: template.subject,
      html: template.html,
      text: template.text,
      emailType: 'upload_link'
    });
    
    console.log(`🔧 DEBUG: sendEmail result: ${result}`);
    return result;
  } catch (error) {
    console.error(`🔧 DEBUG: Error in sendUploadLinkEmail:`, error);
    return false;
  }
};

// Add the missing getUploadLinkTemplate method
(emailService as any).getUploadLinkTemplate = function(params: UploadLinkEmailParams): EmailTemplate {
  const subject = `Secure Document Upload Link - ISOHub`;
  
  const expirationDate = new Date(params.expirationDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Secure Upload Link</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #FFD700, #FFA500); padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #ffffff; padding: 30px; border: 1px solid #ddd; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px; color: #666; }
        .button { display: inline-block; padding: 15px 30px; background: #FFD700; color: #000; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
        .info-box { background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #FFD700; }
        .security-note { background: #d1ecf1; padding: 15px; border-radius: 4px; margin: 20px 0; border-left: 4px solid #bee5eb; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0; color: #000;">🔒 Secure Document Upload</h1>
          <p style="margin: 10px 0 0 0; color: #333;">ISOHub Document Portal</p>
        </div>
        
        <div class="content">
          <h2>Hello ${params.recipientName},</h2>
          
          <p>${params.senderName} has sent you a secure upload link through ISOHub's document portal.</p>
          
          ${params.message ? `<div class="info-box">
            <h3>📝 Message from ${params.senderName}:</h3>
            <p><em>"${params.message}"</em></p>
          </div>` : ''}
          
          <div class="info-box">
            <h3>📋 Upload Details:</h3>
            <p><strong>Maximum Downloads:</strong> ${params.maxDownloads}</p>
            <p><strong>Link Expires:</strong> ${expirationDate}</p>
            <p><strong>Security:</strong> This link is encrypted and secure</p>
          </div>
          
          <div style="text-align: center;">
            <a href="${params.uploadLink}" class="button">📤 Upload Documents Securely</a>
          </div>
          
          <div class="security-note">
            <h4>🛡️ Security Information:</h4>
            <ul>
              <li>This link is unique and secure</li>
              <li>Your uploaded documents are encrypted</li>
              <li>Access is tracked and monitored</li>
              <li>Link expires automatically for security</li>
            </ul>
          </div>
          
          <p>If you have any questions or concerns about this upload request, please contact ${params.senderName} directly or reach out to our support team.</p>
          
          <p>Best regards,<br>The ISOHub Team</p>
        </div>
        
        <div class="footer">
          <p>© 2025 ISOHub. All rights reserved.</p>
          <p>This email was sent to ${params.recipientEmail}. If you received this in error, please contact support.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Secure Document Upload Link - ISOHub

Hello ${params.recipientName},

${params.senderName} has sent you a secure upload link through ISOHub's document portal.

${params.message ? `Message from ${params.senderName}: "${params.message}"` : ''}

Upload Details:
- Maximum Downloads: ${params.maxDownloads}
- Link Expires: ${expirationDate}
- Security: This link is encrypted and secure

Upload Link: ${params.uploadLink}

Security Information:
- This link is unique and secure
- Your uploaded documents are encrypted
- Access is tracked and monitored
- Link expires automatically for security

If you have any questions or concerns about this upload request, please contact ${params.senderName} directly or reach out to our support team.

Best regards,
The ISOHub Team

© 2025 ISOHub. All rights reserved.
  `;

  return { subject, html, text };
};
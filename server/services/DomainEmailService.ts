import { db } from '../db';
import { agencies } from '@shared/schema';
import { eq } from 'drizzle-orm';
import * as dns from 'dns';
import { promisify } from 'util';

const resolveTxt = promisify(dns.resolveTxt);
const resolve4 = promisify(dns.resolve4);

interface DomainVerificationResult {
  isValid: boolean;
  message: string;
  records?: any[];
}

interface EmailTestResult {
  isValid: boolean;
  message: string;
  connectionDetails?: any;
}

interface DomainSetupInstructions {
  domainType: string;
  instructions: string[];
  dnsRecords: DNSRecord[];
  sslInfo: string;
}

interface DNSRecord {
  type: 'A' | 'CNAME' | 'TXT';
  name: string;
  value: string;
  ttl?: number;
}

export class DomainEmailService {
  
  /**
   * Verify domain ownership using DNS TXT record
   */
  static async verifyDomainOwnership(domain: string, verificationCode: string): Promise<DomainVerificationResult> {
    try {
      // Check for TXT record with verification code
      const txtRecords = await resolveTxt(`_isohub-verification.${domain}`);
      const flatRecords = txtRecords.flat();
      
      const isValid = flatRecords.some(record => record.includes(verificationCode));
      
      return {
        isValid,
        message: isValid 
          ? 'Domain ownership verified successfully' 
          : 'Verification record not found. Please add the TXT record and try again.',
        records: txtRecords
      };
    } catch (error) {
      return {
        isValid: false,
        message: `DNS lookup failed: ${error.message}`,
        records: []
      };
    }
  }

  /**
   * Generate domain setup instructions based on domain type
   */
  static generateDomainSetupInstructions(agencyId: number, domainType: string, customDomain?: string, subdomainPrefix?: string): DomainSetupInstructions {
    switch (domainType) {
      case 'standard':
        return {
          domainType: 'standard',
          instructions: [
            'Your agency will use the standard ISOHub subdomain',
            'No additional setup required',
            'SSL certificate automatically provided'
          ],
          dnsRecords: [],
          sslInfo: 'Automatic SSL certificate included'
        };

      case 'subdomain':
        return {
          domainType: 'subdomain',
          instructions: [
            `Your agency will be available at: ${subdomainPrefix}.isohub.io`,
            'Subdomain will be configured automatically',
            'SSL certificate automatically provided'
          ],
          dnsRecords: [],
          sslInfo: 'Wildcard SSL certificate covers all subdomains'
        };

      case 'custom_domain':
        const verificationCode = this.generateVerificationCode();
        return {
          domainType: 'custom_domain',
          instructions: [
            'Add the following DNS records to your domain:',
            'Wait 24-48 hours for DNS propagation',
            'Contact support if you need assistance with DNS configuration',
            'SSL certificate will be automatically issued after domain verification'
          ],
          dnsRecords: [
            {
              type: 'TXT',
              name: '_isohub-verification',
              value: verificationCode,
              ttl: 300
            },
            {
              type: 'CNAME',
              name: 'www',
              value: `agency-${agencyId}.isohub.io`,
              ttl: 3600
            },
            {
              type: 'A',
              name: '@',
              value: '198.51.100.1', // Replace with actual ISOHub IP
              ttl: 3600
            }
          ],
          sslInfo: 'Free SSL certificate via Let\'s Encrypt after domain verification'
        };

      default:
        throw new Error('Invalid domain type');
    }
  }

  /**
   * Test SMTP connection with provided credentials
   */
  static async testSMTPConnection(smtpConfig: {
    host: string;
    port: number;
    username: string;
    password: string;
    fromEmail: string;
  }): Promise<EmailTestResult> {
    try {
      // Import nodemailer dynamically to avoid build issues
      const nodemailer = require('nodemailer');
      
      const transporter = nodemailer.createTransporter({
        host: smtpConfig.host,
        port: smtpConfig.port,
        secure: smtpConfig.port === 465,
        auth: {
          user: smtpConfig.username,
          pass: smtpConfig.password,
        },
      });

      // Verify connection
      await transporter.verify();
      
      return {
        isValid: true,
        message: 'SMTP connection successful',
        connectionDetails: {
          host: smtpConfig.host,
          port: smtpConfig.port,
          secure: smtpConfig.port === 465
        }
      };
    } catch (error) {
      return {
        isValid: false,
        message: `SMTP connection failed: ${error.message}`
      };
    }
  }

  /**
   * Update agency domain configuration
   */
  static async updateDomainConfiguration(agencyId: number, domainConfig: {
    domainType: string;
    customDomain?: string;
    subdomainPrefix?: string;
    dnsProvider?: string;
  }) {
    try {
      const [updatedAgency] = await db
        .update(agencies)
        .set({
          domainType: domainConfig.domainType as any,
          customDomain: domainConfig.customDomain,
          subdomainPrefix: domainConfig.subdomainPrefix,
          dnsProvider: domainConfig.dnsProvider,
          domainStatus: 'pending',
          updatedAt: new Date(),
        })
        .where(eq(agencies.id, agencyId))
        .returning();

      return updatedAgency;
    } catch (error) {
      throw new Error(`Failed to update domain configuration: ${error.message}`);
    }
  }

  /**
   * Update agency email configuration
   */
  static async updateEmailConfiguration(agencyId: number, emailConfig: {
    emailProvider: string;
    smtpHost?: string;
    smtpPort?: number;
    smtpUsername?: string;
    smtpPassword?: string;
    fromEmailAddress?: string;
    fromDisplayName?: string;
  }) {
    try {
      const [updatedAgency] = await db
        .update(agencies)
        .set({
          emailProvider: emailConfig.emailProvider as any,
          smtpHost: emailConfig.smtpHost,
          smtpPort: emailConfig.smtpPort,
          smtpUsername: emailConfig.smtpUsername,
          smtpPassword: emailConfig.smtpPassword ? (await import('./EncryptionService')).EncryptionService.encryptSMTPPassword(emailConfig.smtpPassword) : null,
          fromEmailAddress: emailConfig.fromEmailAddress,
          fromDisplayName: emailConfig.fromDisplayName,
          updatedAt: new Date(),
        })
        .where(eq(agencies.id, agencyId))
        .returning();

      return updatedAgency;
    } catch (error) {
      throw new Error(`Failed to update email configuration: ${error.message}`);
    }
  }

  /**
   * Get domain status and configuration
   */
  static async getDomainStatus(agencyId: number) {
    try {
      const [agency] = await db
        .select({
          domainType: agencies.domainType,
          customDomain: agencies.customDomain,
          subdomainPrefix: agencies.subdomainPrefix,
          domainStatus: agencies.domainStatus,
          sslStatus: agencies.sslStatus,
          dnsProvider: agencies.dnsProvider,
        })
        .from(agencies)
        .where(eq(agencies.id, agencyId));

      if (!agency) {
        throw new Error('Agency not found');
      }

      return agency;
    } catch (error) {
      throw new Error(`Failed to get domain status: ${error.message}`);
    }
  }

  /**
   * Get email configuration status
   */
  static async getEmailStatus(agencyId: number) {
    try {
      const [agency] = await db
        .select({
          emailProvider: agencies.emailProvider,
          fromEmailAddress: agencies.fromEmailAddress,
          fromDisplayName: agencies.fromDisplayName,
          smtpHost: agencies.smtpHost,
          smtpPort: agencies.smtpPort,
        })
        .from(agencies)
        .where(eq(agencies.id, agencyId));

      if (!agency) {
        throw new Error('Agency not found');
      }

      return agency;
    } catch (error) {
      throw new Error(`Failed to get email status: ${error.message}`);
    }
  }

  /**
   * Generate verification code for domain ownership
   */
  private static generateVerificationCode(): string {
    return `isohub-verify-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Check if subdomain is available
   */
  static async checkSubdomainAvailability(subdomainPrefix: string): Promise<boolean> {
    try {
      const existingAgencies = await db
        .select({ id: agencies.id })
        .from(agencies)
        .where(eq(agencies.subdomainPrefix, subdomainPrefix));

      return existingAgencies.length === 0;
    } catch (error) {
      throw new Error(`Failed to check subdomain availability: ${error.message}`);
    }
  }

  /**
   * Get email template configuration for agency
   */
  static async getEmailTemplateConfig(agencyId: number) {
    try {
      const [agency] = await db
        .select({
          companyName: agencies.companyName,
          primaryColor: agencies.primaryColor,
          secondaryColor: agencies.secondaryColor,
          logoUrl: agencies.logoUrl,
          fromEmailAddress: agencies.fromEmailAddress,
          fromDisplayName: agencies.fromDisplayName,
        })
        .from(agencies)
        .where(eq(agencies.id, agencyId));

      if (!agency) {
        throw new Error('Agency not found');
      }

      return {
        companyName: agency.companyName,
        branding: {
          primaryColor: agency.primaryColor || '#FFD700',
          secondaryColor: agency.secondaryColor || '#000000',
          logoUrl: agency.logoUrl,
        },
        emailSettings: {
          fromAddress: agency.fromEmailAddress || 'noreply@isohub.io',
          fromName: agency.fromDisplayName || agency.companyName || 'ISOHub',
        }
      };
    } catch (error) {
      throw new Error(`Failed to get email template config: ${error.message}`);
    }
  }
}
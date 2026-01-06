import crypto from 'crypto';
import { eq, and, sql } from 'drizzle-orm';
import { db } from '../db';
import {
  organizations,
  onboardingProgress,
  userActivations,
  organizationVendors,
  documentIntegrations,
  dashboardTours,
  type Organization,
  type InsertOrganization,
  type OnboardingProgress,
  type InsertOnboardingProgress,
  type UserActivation,
  type InsertUserActivation,
} from '@shared/onboarding-schema';
import { users, agencies, type InsertUser } from '@shared/schema';
import { EmailService } from './EmailService';
import bcrypt from 'bcrypt';

export class OnboardingService {
  private emailService: EmailService;

  constructor() {
    this.emailService = new EmailService();
  }

  /**
   * Step 1: Create new organization after sales completion
   * This is called when admin creates a new organization
   */
  async createOrganization(orgData: {
    name: string;
    website?: string;
    adminContactName: string;
    adminContactEmail: string;
    adminContactPhone?: string;
    industry?: string;
    skipEmail?: boolean; // Optional flag to skip email sending
  }): Promise<{ organization: Organization; activationLink: string }> {
    // Generate unique organization ID
    const organizationId = `org-${crypto.randomBytes(8).toString('hex')}`;
    
    // Generate activation token
    const activationToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // First, create an agency entry for this organization (for data isolation)
    let agencyId: number | null = null;
    try {
      const [agency] = await db.insert(agencies).values({
        companyName: orgData.name,
        contactName: orgData.adminContactName,
        email: orgData.adminContactEmail,
        phone: orgData.adminContactPhone,
        website: orgData.website,
        industry: orgData.industry,
        status: 'setup',
        adminUsername: orgData.adminContactEmail,
      }).returning();
      agencyId = agency.id;
      console.log(`[OnboardingService] Created agency ${agencyId} for organization ${orgData.name}`);
    } catch (agencyError) {
      console.error('[OnboardingService] Failed to create agency, continuing without:', agencyError);
    }

    // Create organization with link to agency
    const [organization] = await db.insert(organizations).values({
      organizationId,
      name: orgData.name,
      website: orgData.website,
      adminContactName: orgData.adminContactName,
      adminContactEmail: orgData.adminContactEmail,
      adminContactPhone: orgData.adminContactPhone,
      industry: orgData.industry,
      agencyId, // Link to the agency for data isolation
      status: 'setup',
      activationToken,
      tokenExpiry,
    }).returning();

    // Create onboarding progress record using raw SQL for compatibility
    try {
      await db.execute(sql`
        INSERT INTO onboarding_progress (organization_id, current_step, created_at, updated_at)
        VALUES (${organizationId}, 1, NOW(), NOW())
      `);
    } catch (progressError) {
      console.error('[OnboardingService] Failed to create onboarding progress:', progressError);
    }

    // Create user activation record using raw SQL for compatibility
    const tempPassword = this.generateSecurePassword();
    const hashedTempPassword = await bcrypt.hash(tempPassword, 10);

    try {
      await db.execute(sql`
        INSERT INTO user_activations (organization_id, email, activation_token, activation_expiry, created_at, updated_at)
        VALUES (${organizationId}, ${orgData.adminContactEmail}, ${activationToken}, ${tokenExpiry}, NOW(), NOW())
      `);
    } catch (activationError) {
      console.error('[OnboardingService] Failed to create user activation:', activationError);
    }

    // Generate activation link
    const activationLink = `{{FRONTEND_URL}}/activate?token=${activationToken}`;

    // Send welcome email unless skipped (for test data)
    if (!orgData.skipEmail) {
      await this.sendWelcomeEmail({
        name: orgData.adminContactName,
        email: orgData.adminContactEmail,
        organization: orgData.name,
        activationLink,
        tempPassword,
      });
    }

    return { organization, activationLink };
  }

  /**
   * Step 2: Process user activation from email link
   */
  async activateUser(token: string, newPassword: string): Promise<{
    success: boolean;
    organizationId: string;
    redirectUrl: string;
  }> {
    // Find activation record
    const [activation] = await db.select()
      .from(userActivations)
      .where(eq(userActivations.activationToken, token));

    if (!activation) {
      throw new Error('Invalid activation token');
    }

    if (new Date() > activation.activationExpiry) {
      throw new Error('Activation token has expired');
    }

    if (activation.isActivated) {
      throw new Error('Account has already been activated');
    }

    // Create user account
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    const [user] = await db.insert(users).values({
      username: activation.email,
      email: activation.email,
      password: hashedPassword,
      firstName: activation.firstName,
      lastName: activation.lastName,
      role: activation.role as any,
      organizationId: activation.organizationId,
      isActive: true,
      isTemporaryPassword: false,
    }).returning();

    // Mark activation as complete
    await db.update(userActivations).set({
      isActivated: true,
      activatedAt: new Date(),
      passwordChanged: true,
      passwordChangedAt: new Date(),
    }).where(eq(userActivations.id, activation.id));

    // Update organization status
    await db.update(organizations).set({
      status: 'onboarding',
      welcomeEmailSent: true,
    }).where(eq(organizations.organizationId, activation.organizationId));

    return {
      success: true,
      organizationId: activation.organizationId,
      redirectUrl: `/onboarding`,
    };
  }

  /**
   * Step 3: Get onboarding progress for organization
   */
  async getOnboardingProgress(organizationId: string): Promise<OnboardingProgress | null> {
    const [progress] = await db.select()
      .from(onboardingProgress)
      .where(eq(onboardingProgress.organizationId, organizationId));

    return progress || null;
  }

  /**
   * Step 4: Update onboarding step progress
   */
  async updateOnboardingStep(
    organizationId: string, 
    step: number, 
    data: any
  ): Promise<OnboardingProgress> {
    const fieldMap = {
      1: { complete: 'step1Complete', data: 'instanceData' },
      2: { complete: 'step2Complete', data: 'companyData' },
      3: { complete: 'step3Complete', data: 'orgChartData' },
      4: { complete: 'step4Complete', data: 'businessProfileData' },
      5: { complete: 'step5Complete', data: 'vendorSelectionData' },
      6: { complete: 'step6Complete', data: 'docsHubData' },
      7: { complete: 'step7Complete', data: 'tourData' },
    };

    const field = fieldMap[step as keyof typeof fieldMap];
    if (!field) {
      throw new Error('Invalid step number');
    }

    const updateData: any = {
      [field.complete]: true,
      [field.data]: data,
      currentStep: Math.min(step + 1, 7),
      updatedAt: new Date(),
    };

    // If this is the last step, mark as completed
    if (step === 7) {
      updateData.completedAt = new Date();
      
      // Update organization status to active
      await db.update(organizations).set({
        status: 'active',
      }).where(eq(organizations.organizationId, organizationId));
    }

    const [updated] = await db.update(onboardingProgress)
      .set(updateData)
      .where(eq(onboardingProgress.organizationId, organizationId))
      .returning();

    return updated;
  }

  /**
   * Step 5: Handle vendor selection during onboarding
   */
  async selectVendors(
    organizationId: string, 
    vendorSelections: { vendorId: number; category: string }[]
  ): Promise<void> {
    // Clear existing selections
    await db.delete(organizationVendors)
      .where(eq(organizationVendors.organizationId, organizationId));

    // Insert new selections
    if (vendorSelections.length > 0) {
      await db.insert(organizationVendors).values(
        vendorSelections.map(selection => ({
          organizationId,
          vendorId: selection.vendorId,
          category: selection.category as any,
          selectedAt: new Date(),
          isActive: true,
        }))
      );
    }
  }

  /**
   * Step 6: Setup document integration
   */
  async setupDocumentIntegration(
    organizationId: string,
    provider: string,
    integrationData: any
  ): Promise<void> {
    await db.insert(documentIntegrations).values({
      organizationId,
      provider: provider as any,
      integrationData,
      status: provider === 'manual' ? 'connected' : 'pending',
    });
  }

  /**
   * Step 7: Initialize dashboard tour
   */
  async initializeDashboardTour(
    organizationId: string,
    userId: number,
    tourType: string = 'admin'
  ): Promise<void> {
    await db.insert(dashboardTours).values({
      organizationId,
      userId,
      tourType: tourType as any,
      tourCompleted: false,
      completedSteps: [],
    });
  }

  /**
   * Utility: Generate secure temporary password
   */
  private generateSecurePassword(): string {
    const length = 12;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    
    return password;
  }

  /**
   * Utility: Send welcome email with activation link
   */
  private async sendWelcomeEmail(userData: {
    name: string;
    email: string;
    organization: string;
    activationLink: string;
    tempPassword: string;
  }): Promise<void> {
    const template = this.generateOnboardingWelcomeTemplate(userData);
    
    await this.emailService.sendEmail({
      to: userData.email,
      subject: template.subject,
      html: template.htmlContent,
      text: template.textContent,
      emailType: 'onboarding_welcome',
    });
  }

  /**
   * Generate comprehensive onboarding welcome email template
   */
  private generateOnboardingWelcomeTemplate(userData: {
    name: string;
    email: string;
    organization: string;
    activationLink: string;
    tempPassword: string;
  }) {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to ISOHub - Account Activation</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #FFD700, #FFA500); color: black; padding: 40px 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; font-weight: bold; }
          .header p { margin: 10px 0 0 0; opacity: 0.8; }
          .content { padding: 40px 30px; }
          .welcome-box { background: linear-gradient(135deg, #f8f9fa, #e9ecef); padding: 25px; border-radius: 8px; margin: 25px 0; border-left: 5px solid #FFD700; }
          .activation-box { background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 8px; margin: 25px 0; }
          .credentials-box { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 25px 0; border: 2px dashed #6c757d; }
          .activate-button { display: inline-block; background: linear-gradient(135deg, #FFD700, #FFA500); color: black; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; font-size: 16px; }
          .activate-button:hover { background: linear-gradient(135deg, #FFA500, #FFD700); }
          .security-note { background-color: #d1ecf1; border: 1px solid #bee5eb; padding: 15px; border-radius: 6px; margin: 20px 0; }
          .footer { background-color: #333; color: white; padding: 30px; text-align: center; }
          .footer a { color: #FFD700; text-decoration: none; }
          .steps-list { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .steps-list li { margin: 8px 0; }
          .icon { font-size: 24px; margin-right: 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Welcome to ISOHub!</h1>
            <p>Your Complete Payment Processing Platform</p>
          </div>
          
          <div class="content">
            <div class="welcome-box">
              <h2>Hello ${userData.name}!</h2>
              <p>Welcome to ISOHub! We're excited to have <strong>${userData.organization}</strong> join our platform. Your payment processing workspace is ready to be activated.</p>
            </div>

            <div class="activation-box">
              <h3>🔐 Account Activation Required</h3>
              <p>To get started, please activate your account by clicking the button below. This will allow you to set your permanent password and begin the onboarding process.</p>
              
              <div style="text-align: center;">
                <a href="${userData.activationLink}" class="activate-button">
                  🚀 Activate My Account
                </a>
              </div>
            </div>

            <div class="credentials-box">
              <h3>📧 Account Information</h3>
              <p><strong>Email:</strong> ${userData.email}</p>
              <p><strong>Organization:</strong> ${userData.organization}</p>
              <p><strong>Role:</strong> Administrator</p>
            </div>

            <div class="steps-list">
              <h3>📋 What Happens Next?</h3>
              <ol>
                <li><strong>Activate Account:</strong> Click the activation button above</li>
                <li><strong>Set Password:</strong> Create your secure password</li>
                <li><strong>Complete Onboarding:</strong> 7-step guided setup process</li>
                <li><strong>Dashboard Tour:</strong> Learn your new workspace</li>
                <li><strong>Start Processing:</strong> Begin managing your payment operations</li>
              </ol>
            </div>

            <div class="welcome-box">
              <h3>🏢 Your ISOHub Features</h3>
              <ul>
                <li><span class="icon">📄</span> <strong>Pre-Applications:</strong> Streamlined merchant application management</li>
                <li><span class="icon">🔒</span> <strong>Secure Documents:</strong> Safe document sharing and storage</li>
                <li><span class="icon">💰</span> <strong>Residuals Tracking:</strong> Real-time commission and payment monitoring</li>
                <li><span class="icon">🤖</span> <strong>AI Reports:</strong> Intelligent insights and natural language queries</li>
                <li><span class="icon">🎨</span> <strong>White-label Portal:</strong> Branded experience for your clients</li>
                <li><span class="icon">📊</span> <strong>Analytics Dashboard:</strong> Comprehensive business intelligence</li>
              </ul>
            </div>

            <div class="security-note">
              <h3>🔒 Security Information</h3>
              <p><strong>Important:</strong> This activation link expires in 24 hours for your security. If you don't activate within this time, please contact your administrator for a new activation link.</p>
              <p>This email contains sensitive information. Please do not forward it to others.</p>
            </div>
          </div>
          
          <div class="footer">
            <h3>Need Help Getting Started?</h3>
            <p>Our support team is here to help you succeed:</p>
            <p>📧 Email: <a href="mailto:support@isohub.io">support@isohub.io</a></p>
            <p>📱 Phone: <strong>{{SUPPORT_PHONE_NUMBER}}</strong></p>
            <p>💬 Live Chat: Available in your dashboard</p>
            <br>
            <p style="font-size: 12px; opacity: 0.8;">
              This email was sent to ${userData.email} for ${userData.organization}.<br>
              © ${new Date().getFullYear()} ISOHub. All rights reserved.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `
Welcome to ISOHub!

Hello ${userData.name},

Welcome to ISOHub! We're excited to have ${userData.organization} join our platform.

ACCOUNT ACTIVATION REQUIRED
To get started, please activate your account using this link:
${userData.activationLink}

Account Information:
- Email: ${userData.email}
- Organization: ${userData.organization}
- Role: Administrator

What happens next?
1. Activate your account using the link above
2. Set your secure password
3. Complete the 7-step onboarding process
4. Take the dashboard tour
5. Start managing your payment operations

Your ISOHub Features:
- Pre-Applications: Streamlined merchant application management
- Secure Documents: Safe document sharing and storage
- Residuals Tracking: Real-time commission and payment monitoring
- AI Reports: Intelligent insights and natural language queries
- White-label Portal: Branded experience for your clients
- Analytics Dashboard: Comprehensive business intelligence

SECURITY NOTICE:
This activation link expires in 24 hours. This email contains sensitive information - please do not forward it.

Need help? Contact us:
Email: support@isohub.io
Phone: {{SUPPORT_PHONE_NUMBER}}

© ${new Date().getFullYear()} ISOHub. All rights reserved.
    `;

    return {
      subject: `🎉 Welcome to ISOHub - Activate Your ${userData.organization} Account`,
      htmlContent,
      textContent,
    };
  }

  /**
   * Utility: Get all organizations
   * Uses raw SQL to handle schema differences between dev and production
   */
  async getAllOrganizations(): Promise<Organization[]> {
    // First try the full query (works in dev with full schema)
    try {
      const result = await db.execute(sql`
        SELECT 
          id,
          organization_id as "organizationId",
          name,
          website,
          admin_contact_name as "adminContactName",
          admin_contact_email as "adminContactEmail",
          admin_contact_phone as "adminContactPhone",
          industry,
          status,
          COALESCE(settings, '{}'::jsonb) as settings,
          created_at as "createdAt"
        FROM organizations 
        ORDER BY created_at ASC
      `);
      return (result.rows || []) as Organization[];
    } catch (fullQueryError) {
      console.log('[OnboardingService] Full query failed, trying minimal schema...');
    }

    // Fallback for production with minimal schema
    try {
      const result = await db.execute(sql`
        SELECT 
          id,
          organization_id as "organizationId",
          name,
          NULL as website,
          'System Admin' as "adminContactName",
          'admin@isohub.io' as "adminContactEmail",
          NULL as "adminContactPhone",
          'Payment Processing' as industry,
          'active' as status,
          COALESCE(settings, '{}'::jsonb) as settings,
          created_at as "createdAt"
        FROM organizations 
        ORDER BY created_at ASC
      `);
      console.log(`[OnboardingService] Minimal query returned ${result.rows?.length || 0} organizations`);
      return (result.rows || []) as Organization[];
    } catch (minimalError) {
      console.error('[OnboardingService] Minimal query also failed:', minimalError);
      return [];
    }
  }

  /**
   * Utility: Get organization details by ID
   */
  async getOrganization(organizationId: string): Promise<Organization | null> {
    const [org] = await db.select()
      .from(organizations)
      .where(eq(organizations.organizationId, organizationId));

    return org || null;
  }

  /**
   * Update organization details
   */
  async updateOrganization(organizationId: string, updateData: {
    name?: string;
    website?: string;
    industry?: string;
    description?: string;
    primaryContactEmail?: string;
    supportEmail?: string;
    billingEmail?: string;
    primaryColor?: string;
    secondaryColor?: string;
    accentColor?: string;
    logoUrl?: string;
    domainType?: string;
    customDomain?: string;
    subdomainPrefix?: string;
    status?: string;
  }): Promise<Organization | null> {
    const updateValues: Record<string, any> = {
      updatedAt: new Date(),
    };

    if (updateData.name !== undefined) updateValues.name = updateData.name;
    if (updateData.website !== undefined) updateValues.website = updateData.website;
    if (updateData.industry !== undefined) updateValues.industry = updateData.industry;
    if (updateData.description !== undefined) updateValues.businessProfile = { description: updateData.description };
    if (updateData.primaryContactEmail !== undefined) updateValues.adminContactEmail = updateData.primaryContactEmail;
    if (updateData.supportEmail !== undefined) updateValues.supportEmail = updateData.supportEmail;
    if (updateData.billingEmail !== undefined) updateValues.billingEmail = updateData.billingEmail;
    if (updateData.primaryColor !== undefined) updateValues.primaryColor = updateData.primaryColor;
    if (updateData.secondaryColor !== undefined) updateValues.secondaryColor = updateData.secondaryColor;
    if (updateData.accentColor !== undefined) updateValues.accentColor = updateData.accentColor;
    if (updateData.logoUrl !== undefined) updateValues.logoUrl = updateData.logoUrl;
    if (updateData.domainType !== undefined) updateValues.domainType = updateData.domainType;
    if (updateData.customDomain !== undefined) updateValues.customDomain = updateData.customDomain;
    if (updateData.subdomainPrefix !== undefined) updateValues.subdomainPrefix = updateData.subdomainPrefix;
    if (updateData.status !== undefined) updateValues.status = updateData.status;

    const [updated] = await db.update(organizations)
      .set(updateValues)
      .where(eq(organizations.organizationId, organizationId))
      .returning();

    return updated || null;
  }

  /**
   * Utility: Get organization's selected vendors
   */
  async getOrganizationVendors(organizationId: string) {
    return await db.select()
      .from(organizationVendors)
      .where(eq(organizationVendors.organizationId, organizationId));
  }

  /**
   * Generate business profile using AI (placeholder for AI integration)
   */
  async generateBusinessProfile(businessData: {
    idealClients: string;
    targetAudience: string;
    offers: string;
    strengths: string;
    challenges: string;
    purchaseMotivations: string;
  }): Promise<any> {
    // {{AI_INTEGRATION_PLACEHOLDER}}
    // This will be replaced with actual OpenAI integration
    const profile = {
      summary: `AI-generated business profile based on: ${businessData.idealClients}`,
      targetMarket: businessData.targetAudience,
      valueProposition: businessData.offers,
      competitiveAdvantages: businessData.strengths,
      growthChallenges: businessData.challenges,
      customerMotivations: businessData.purchaseMotivations,
      recommendations: [
        "Focus on digital payment solutions for target market",
        "Develop specialized merchant onboarding for identified niche",
        "Create targeted marketing materials addressing customer pain points"
      ],
      generatedAt: new Date().toISOString(),
    };

    return profile;
  }
}

export const onboardingService = new OnboardingService();
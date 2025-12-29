import fs from 'fs';
import path from 'path';

export interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
}

export interface HelpContext {
  userMessage: string;
  conversationHistory: ChatMessage[];
}

export class AIHelpService {
  private knowledgeBase: string;

  constructor() {
    this.knowledgeBase = this.loadKnowledgeBase();
  }

  private loadKnowledgeBase(): string {
    // Core ISO Hub platform knowledge
    return `ISO Hub Platform Knowledge Base

Platform Overview:
ISO Hub is a comprehensive merchant services residual tracking system with modern full-stack architecture. Features multi-tenant SAAS platform, 7-step onboarding, processor data management, AI-powered reporting, user management, email integration, vendor portal, and document hub.

Core Features:
1. Multi-Tenant SAAS Platform - Organization management with whitelabel capabilities
2. 7-Step Onboarding System - Comprehensive setup for new organizations
3. Processor Data Management - Support for 7 major processors
4. AI-Powered Reporting - Natural language report generation using GPT-4
5. User Management - 7 role types with role-based access control
6. Email Integration - Professional SMTP system with automated notifications
7. Vendor Portal - 36 vendors across 4 categories
8. Document Hub - OAuth integrations with Google Drive, OneDrive, SharePoint, Dropbox

User Roles:
1. SuperAdmin - Full system access, create organizations, impersonate users
2. Admin - Organization management and configuration
3. Manager - Team oversight and reporting
4. Team Leaders - Team management and assignments
5. Users/Reps - Daily operations and data entry
6. Team Member - Basic access to assigned functions
7. Partners - External access to specific resources

Supported Processors:
1. Payment Advisors - CSV format with standard merchant data
2. Clearent - CSV format with comprehensive transaction details
3. Global Payments TSYS - CSV format with volume and revenue tracking
4. Merchant Lynx - CSV format with merchant identification
5. Micamp Solutions - CSV format with specialized processing data
6. First Data - CSV format with enterprise merchant data
7. Shift4 - Excel format with detailed payout information

Technical Stack:
Frontend: React + TypeScript + Vite + Tailwind CSS + shadcn/ui
Backend: Express.js + TypeScript + PostgreSQL + Drizzle ORM
Database: Neon serverless PostgreSQL
Authentication: JWT with role-based permissions
Email: SMTP with Gmail integration
AI: OpenAI GPT-4 integration for reports`;
  }

  async generateResponse(context: HelpContext): Promise<string> {
    const { userMessage } = context;
    const input = userMessage.toLowerCase();

    if (this.matchesQuery(input, ['onboarding', 'setup', 'getting started', 'wizard'])) {
      return this.getOnboardingHelp(input);
    }

    if (this.matchesQuery(input, ['organization', 'create', 'new account', 'admin'])) {
      return this.getOrganizationHelp(input);
    }

    if (this.matchesQuery(input, ['user', 'role', 'permission', 'access', 'account'])) {
      return this.getUserManagementHelp(input);
    }

    if (this.matchesQuery(input, ['processor', 'data', 'upload', 'csv', 'excel'])) {
      return this.getDataUploadHelp(input);
    }

    if (this.matchesQuery(input, ['report', 'ai', 'analytics', 'dashboard', 'chart'])) {
      return this.getReportingHelp(input);
    }

    if (this.matchesQuery(input, ['email', 'notification', 'smtp', 'welcome'])) {
      return this.getEmailHelp(input);
    }

    if (this.matchesQuery(input, ['vendor', 'integration', 'oauth', 'gateway'])) {
      return this.getVendorHelp(input);
    }

    if (this.matchesQuery(input, ['error', 'problem', 'issue', 'trouble', 'bug'])) {
      return this.getTroubleshootingHelp(input);
    }

    return this.getGeneralHelp(input);
  }

  private matchesQuery(input: string, keywords: string[]): boolean {
    return keywords.some(keyword => input.includes(keyword));
  }

  private getOnboardingHelp(input: string): string {
    return `The ISO Hub onboarding process includes 7 comprehensive steps:

Step 1: Instance Setup (2-3 minutes)
- Configure basic instance settings and preferences
- Set instance name and primary domain

Step 2: Company Information (3-5 minutes)  
- Complete business profile with address and contact details
- Set company size and industry information

Step 3: Organization Chart (5-10 minutes)
- Define team structure and departments
- Set up role definitions and team member invitations

Step 4: Business Profile (3-5 minutes)
- AI-powered business profile generation
- Describe your target market and service offerings

Step 5: Vendor Selection (10-15 minutes)
- Choose from 36 vendors across 4 categories:
  - Processors (7): Payment Advisors, Clearent, Global Payments TSYS, etc.
  - Gateways (11): Authorize.Net, Stripe, Square, etc.
  - Hardware/Equipment (12): Ingenico, PAX, Clover, etc.
  - Internal (6): CRM systems, accounting tools, etc.

Step 6: Document Hub Integration (5-10 minutes)
- Connect cloud storage: Google Drive, OneDrive, SharePoint, Dropbox
- Set up OAuth authentication for seamless integration

Step 7: Dashboard Tour (5-10 minutes)
- Interactive walkthrough of platform features
- Tips and best practices for daily operations

Total time: 30-45 minutes. Each step saves progress automatically.`;
  }

  private getOrganizationHelp(input: string): string {
    return `Creating a New Organization:

1. Access: Navigate to "Organization Management" in the admin sidebar (SuperAdmin only)

2. Create Organization:
   - Click "Create Organization" button
   - Fill required fields:
     - Organization Name (required)
     - Admin Contact Name (required)  
     - Admin Contact Email (required)
   - Optional fields: Website, Phone, Industry

3. Automatic Process:
   - System generates unique organization ID (e.g., org-abc123def456)
   - Creates 24-hour activation token
   - Sends professional welcome email to admin contact
   - Initializes onboarding progress tracking

4. Admin Activation:
   - Admin receives email with activation link
   - Clicks link to activate account
   - Sets secure password (minimum 8 characters)
   - Begins 7-step onboarding process

Each organization is completely isolated with its own users, data, and configurations. The system supports unlimited organizations with full multi-tenant architecture.`;
  }

  private getUserManagementHelp(input: string): string {
    return `ISO Hub User Roles & Management:

Available User Roles:
- SuperAdmin: Full system access, create organizations, impersonate users
- Admin: Organization management, create users, configure processors
- Manager: Team oversight, access team reports, assign roles
- Team Leaders: Manage direct team members, assign tasks
- Users/Reps: Daily operations, data entry, basic reporting
- Team Member: Basic access, assigned task completion
- Partners: External access, limited to partner-specific data

Adding New Users:
1. Access "User Management" from admin sidebar
2. Click "Add User" button
3. Fill user details: name, email, role
4. System generates secure temporary password
5. Welcome email sent automatically with login credentials

Password Management:
- Temporary passwords generated for new users
- Users forced to change password on first login
- Admin can reset passwords with automatic email delivery
- Secure password requirements enforced

Role-based access control ensures each user only sees data and features appropriate for their role.`;
  }

  private getDataUploadHelp(input: string): string {
    return `Data Upload & Processing System:

Supported Processors:
1. Payment Advisors - CSV format with merchant data
2. Clearent - CSV format with transaction details
3. Global Payments TSYS - CSV format with volume tracking
4. Merchant Lynx - CSV format with merchant identification
5. Micamp Solutions - CSV format with specialized data
6. First Data - CSV format with enterprise merchant data
7. Shift4 - Excel format with detailed payout information

Upload Process:
1. Go to "Data Upload" in main navigation
2. Select your processor from supported list
3. Choose the month for data organization  
4. Upload your CSV or Excel file
5. System validates format and processes data
6. Review upload summary and any warnings
7. Data immediately available in reports

Data Validation:
- Real-time format checking
- Duplicate detection across uploads
- Revenue and volume validation
- Transaction count verification
- Automatic error reporting

The system has successfully processed authentic data from major processors with zero data loss validation.`;
  }

  private getReportingHelp(input: string): string {
    return `AI-Powered Reporting System:

AI Report Builder:
- Natural language query interface
- Powered by GPT-4 for intelligent insights
- Custom report generation from simple descriptions
- Example: "Show me top performing merchants this month"

Available Report Types:
1. Agent Reports - Individual agent performance
2. Agent Summary - Consolidated agent analytics  
3. AP Reports - Accounts payable summaries
4. Partner Summary - Partner commission tracking
5. Billing Reports - Revenue and billing analysis
6. Processor Reports - Processor-specific performance
7. Processor Summary - Cross-processor comparisons

Report Features:
- Real-time data visualization
- Export to CSV, PDF, Excel
- Scheduled report delivery via email
- Interactive charts and graphs
- Month-over-month trend analysis

The AI system can understand complex reporting requests and generate professional reports with charts, insights, and actionable recommendations.`;
  }

  private getEmailHelp(input: string): string {
    return `Email Integration System:

SMTP Configuration:
- Successfully configured with Gmail SMTP
- Uses App Password authentication for security
- Professional email templates with ISOHub branding
- Delivery tracking and confirmation

Automated Email Types:
1. Welcome Emails - New organization activation
2. User Activation - New user account setup
3. Password Reset - Secure password recovery
4. Report Delivery - Scheduled report distribution
5. Notification Emails - System alerts and updates

Email Features:
- Professional HTML/text dual-format
- ISOHub yellow and black branding
- Personalized content with user/organization details
- Mobile-responsive design
- 24-hour activation link expiration

The system has successfully delivered emails to real prospects and confirmed delivery through SMTP response tracking.`;
  }

  private getVendorHelp(input: string): string {
    return `Vendor Portal Management (36 Vendors):

Vendor Categories:

Processors (7 vendors):
- Payment Advisors, Clearent, Global Payments TSYS
- Merchant Lynx, Micamp Solutions, First Data, Shift4
- Complete integration for data upload and processing

Gateways (11 vendors):
- Authorize.Net, Stripe, Square, PayPal
- NMI, USAePay, BluePay, Payeezy
- Gateway management and transaction routing

Hardware/Equipment (12 vendors):
- Ingenico, PAX, Clover, Verifone
- First Data terminals, Square readers
- Point-of-sale and payment terminal management

Internal Tools (6 vendors):
- CRM systems, accounting software
- Business management tools
- Internal workflow integrations

During Onboarding (Step 5):
- Select relevant vendors for your organization
- Choose vendors across all 4 categories
- Configure vendor-specific settings
- Set up integration credentials

The vendor system provides comprehensive management of all payment processing partners and business tools in one centralized location.`;
  }

  private getTroubleshootingHelp(input: string): string {
    return `Common Issues & Solutions:

Activation Link Problems:
- Issue: "Activation link expired"
- Solution: Generate new link from Organization Management page
- Prevention: Links expire after 24 hours for security

Data Upload Failures:
- Issue: "File format not recognized"
- Solution: Ensure CSV/Excel matches processor requirements
- Check: Verify column headers and data format

Email Delivery Issues:
- Issue: Welcome emails not received
- Solution: Check spam/junk folders, verify email address
- Technical: SMTP configured with Gmail App Password

Login Access Problems:
- Issue: Cannot access account
- Solution: Reset password through User Management
- Check: Verify role permissions and account status

Vendor Integration Failures:
- Issue: Cannot connect to vendor systems
- Solution: Verify OAuth permissions and credentials
- Contact: Vendor support for integration assistance

For persistent issues, contact support@isohub.io with specific error details and screenshots.`;
  }

  private getGeneralHelp(input: string): string {
    return `I'm your ISO Hub AI assistant! I can help you with:

Getting Started:
- Organization creation and setup
- 7-step onboarding process
- User account management

Data & Reports:
- Processor data uploads (7 supported processors)
- AI-powered report generation
- Custom analytics and insights

User Management:
- 7 role types and permissions
- User creation and password management
- Team structure and assignments

Platform Features:
- Vendor portal (36 vendors across 4 categories)
- Email integration and notifications
- Document hub integrations

Technical Support:
- Troubleshooting common issues
- Security and access control
- API and integration help

Common Questions:
- "How do I create a new organization?"
- "What processors are supported?"
- "How does the onboarding process work?"
- "What user roles are available?"
- "How do I upload processor data?"
- "How do I generate custom reports?"

What would you like to learn about? You can ask specific questions for detailed assistance.`;
  }
}

export const aiHelpService = new AIHelpService();
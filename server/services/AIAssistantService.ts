import { readFileSync } from 'fs';
import { join } from 'path';

interface ChatContext {
  page: string;
  userAgent: string;
  timestamp: string;
  sessionHistory: Array<{
    content: string;
    isUser: boolean;
  }>;
}

interface AIResponse {
  response: string;
  confidence: number;
  sources: string[];
  category: string;
  type: 'text' | 'code' | 'link' | 'error';
}

export class AIAssistantService {
  private knowledgeBase: any;
  
  constructor() {
    this.loadKnowledgeBase();
  }

  private loadKnowledgeBase() {
    try {
      // Load all documentation and guides
      const userGuide = readFileSync(join(process.cwd(), 'ONBOARDING_USER_GUIDE.md'), 'utf8');
      const replicatedMD = readFileSync(join(process.cwd(), 'replit.md'), 'utf8');
      
      this.knowledgeBase = {
        userGuide,
        replicatedMD,
        systemInfo: {
          name: "ISOHub",
          description: "Comprehensive merchant services residual tracking platform",
          creators: ["You", "Cody Burnell"],
          capabilities: [
            "Multi-processor data upload and validation",
            "Role-based access control with agent permissions",
            "Monthly audit system with error correction",
            "AI-powered reporting and analytics",
            "Automated commission calculations",
            "Professional email system integration",
            "Progressive Web App functionality",
            "Real-time dashboard and metrics"
          ],
          processors: [
            "Payment Advisors", "Clearent", "Global Payments TSYS",
            "Merchant Lynx", "Micamp Solutions", "First Data", "Shift4"
          ],
          roles: ["SuperAdmin", "Admin", "Manager", "TeamLeader", "Agent", "Partner"]
        },
        commonIssues: {
          upload: {
            "file format": "CSV and Excel (.xlsx) files are supported. Ensure your file matches the processor's expected format.",
            "validation errors": "Use the Monthly Audit system to view and correct validation errors. Each error shows specific field and correction guidance.",
            "large files": "Break large files into smaller batches or contact support for bulk upload assistance."
          },
          authentication: {
            "login issues": "Try refreshing the page, clearing browser cache, or contact your admin to reset your password.",
            "role permissions": "Your access level is determined by your assigned role. Contact your admin if you need additional permissions."
          },
          audit: {
            "error correction": "Click 'View Errors' on the Monthly Audit page, then 'Correct' for each issue. Provide a reason for the correction.",
            "verification": "After correcting all errors, click 'Verify' to complete the audit process."
          }
        }
      };
    } catch (error) {
      console.error('Failed to load knowledge base:', error);
    }
  }

  async processMessage(message: string, context: ChatContext): Promise<AIResponse> {
    const normalizedMessage = message.toLowerCase();
    
    // Determine category and intent
    const category = this.categorizeMessage(normalizedMessage);
    const intent = this.extractIntent(normalizedMessage);
    
    // Generate response based on category and intent
    let response: string;
    let confidence: number;
    let sources: string[];
    
    switch (category) {
      case 'upload':
        ({ response, confidence, sources } = this.handleUploadQuestions(normalizedMessage, intent));
        break;
      case 'audit':
        ({ response, confidence, sources } = this.handleAuditQuestions(normalizedMessage, intent));
        break;
      case 'roles':
        ({ response, confidence, sources } = this.handleRoleQuestions(normalizedMessage, intent));
        break;
      case 'onboarding':
        ({ response, confidence, sources } = this.handleOnboardingQuestions(normalizedMessage, intent));
        break;
      case 'troubleshooting':
        ({ response, confidence, sources } = this.handleTroubleshootingQuestions(normalizedMessage, intent));
        break;
      case 'general':
        ({ response, confidence, sources } = this.handleGeneralQuestions(normalizedMessage, intent));
        break;
      default:
        ({ response, confidence, sources } = this.handleDefaultResponse(message));
    }

    // Add contextual information based on current page
    if (context.page.includes('/monthly-audit')) {
      response += "\n\n💡 *Since you're on the Monthly Audit page, you can click 'View Errors' to see validation issues or 'Verify' to complete the audit process.*";
    } else if (context.page.includes('/data-upload')) {
      response += "\n\n💡 *You can access the Monthly Audit system using the yellow button in the header to verify your uploads.*";
    }

    return {
      response,
      confidence,
      sources,
      category,
      type: this.determineResponseType(response)
    };
  }

  private categorizeMessage(message: string): string {
    const keywords = {
      upload: ['upload', 'file', 'csv', 'excel', 'processor', 'data'],
      audit: ['audit', 'verify', 'error', 'correction', 'validation'],
      roles: ['role', 'permission', 'agent', 'admin', 'access'],
      onboarding: ['onboarding', 'setup', 'wizard', 'organization'],
      troubleshooting: ['error', 'problem', 'issue', 'help', 'broken', 'not working'],
      general: ['what', 'how', 'why', 'explain', 'about']
    };

    for (const [category, words] of Object.entries(keywords)) {
      if (words.some(word => message.includes(word))) {
        return category;
      }
    }
    return 'general';
  }

  private extractIntent(message: string): string {
    if (message.includes('how')) return 'how-to';
    if (message.includes('what') || message.includes('explain')) return 'explanation';
    if (message.includes('error') || message.includes('problem')) return 'troubleshoot';
    if (message.includes('where')) return 'navigation';
    return 'general';
  }

  private handleUploadQuestions(message: string, intent: string) {
    let response = "";
    let confidence = 0.9;
    const sources = ["User Guide", "Data Upload System"];

    if (message.includes('how') && message.includes('upload')) {
      response = `To upload processor data:

1. **Navigate to Data Upload** - Click "Data Upload" in the sidebar
2. **Select Month** - Choose the reporting month from the dropdown
3. **Choose Processor** - Select from: ${this.knowledgeBase.systemInfo.processors.join(', ')}
4. **Upload File** - Drag & drop or browse for CSV/Excel files
5. **Monitor Progress** - Watch the upload status and confirmation
6. **Verify Data** - Use the "Monthly Audit" button to review and verify

**Supported formats:** CSV and Excel (.xlsx)
**File size limit:** Contact support for files over 50MB`;
    } else if (message.includes('format') || message.includes('csv') || message.includes('excel')) {
      response = `**Supported file formats:**
- CSV files (.csv) - Most common format
- Excel files (.xlsx) - Newer Excel format

**Format requirements:**
- First row should contain column headers
- Required fields vary by processor
- No empty rows between data
- Consistent date formatting (MM/DD/YYYY recommended)

**If you're getting format errors:**
1. Save Excel files as CSV format
2. Check for special characters or formulas
3. Use the Monthly Audit system to see specific validation errors`;
    } else {
      response = `I can help you with data uploads! Here are the key things to know:

**Processors supported:** ${this.knowledgeBase.systemInfo.processors.join(', ')}

**Upload process:**
- Navigate to Data Upload in the sidebar
- Select your target month
- Choose the processor
- Upload CSV or Excel files
- Review with Monthly Audit system

What specific aspect of uploading would you like to know more about?`;
    }

    return { response, confidence, sources };
  }

  private handleAuditQuestions(message: string, intent: string) {
    let response = "";
    let confidence = 0.95;
    const sources = ["Monthly Audit System", "User Guide"];

    if (message.includes('error') || message.includes('correction')) {
      response = `**Monthly Audit Error Correction Process:**

1. **View Errors** - Click "View Errors" button on any processor with issues
2. **Review Details** - See specific field errors, row numbers, and expected values
3. **Apply Corrections** - Click "Correct" for each error:
   - Enter the corrected value
   - Provide a reason (optional but recommended)
   - Click "Apply Correction"
4. **Verify Audit** - Once all errors are fixed, click "Verify" to complete

**Error Types:**
🔴 **Error** - Must be fixed before verification
🟡 **Warning** - Should be reviewed but not blocking
🔵 **Info** - Informational only

**Status Indicators:**
- Needs Upload → Uploaded → Verified ✅
- If errors found: → Error → Corrected → Verified ✅`;
    } else if (message.includes('verify') || message.includes('verification')) {
      response = `**Audit Verification Process:**

**Before Verification:**
- All critical errors must be corrected
- Warnings should be reviewed and addressed if needed
- Data totals should match your processor statements

**To Verify:**
1. Ensure all errors are resolved (status shows "Corrected" or "Uploaded")
2. Click the "Verify" button for the processor
3. System marks the audit as complete
4. Data becomes available for residual calculations

**After Verification:**
✅ Data is locked and ready for processing
📊 Revenue calculations can begin
📋 Audit trail is maintained for compliance`;
    } else {
      response = `**Monthly Audit System Overview:**

The audit system ensures 100% data accuracy before residual calculations:

**Process Flow:**
1. Upload data → Status: "Uploaded"
2. System validates → If errors found: "Error"
3. Correct errors → Status: "Corrected"  
4. Verify completion → Status: "Verified" ✅

**Key Features:**
- Real-time validation and error detection
- Field-level error correction with audit trails
- Revenue verification against processor statements
- Complete workflow tracking

Access it via the "Monthly Audit" button in Data Upload or directly from the sidebar.`;
    }

    return { response, confidence, sources };
  }

  private handleRoleQuestions(message: string, intent: string) {
    let response = "";
    let confidence = 0.9;
    const sources = ["Role-Based Access Control", "User Management"];

    response = `**ISOHub Role System:**

**Role Hierarchy:**
- **SuperAdmin** - Full system access, can create organizations
- **Admin** - Organization management, user creation, all data access
- **Manager** - Team oversight, reporting access, user management
- **TeamLeader** - Team coordination, assigned data access
- **Agent** - Limited access to assigned merchants only
- **Partner** - External partner access to relevant data

**Agent Permissions (Most Restricted):**
- ❌ No access to Data Upload or Assignments
- ❌ Cannot see other agents' data
- ✅ View only their assigned merchant reports
- ✅ Access help and support features

**Key Features:**
- Data filtering ensures agents only see their assigned merchants
- Separate navigation menus based on role
- All actions are logged with user attribution
- Role changes require admin approval

Your current role determines what sections appear in your sidebar and what data you can access.`;

    return { response, confidence, sources };
  }

  private handleOnboardingQuestions(message: string, intent: string) {
    let response = "";
    let confidence = 0.85;
    const sources = ["Onboarding Guide", "Organization Setup"];

    response = `**ISOHub Onboarding Process:**

**For New Organizations:**
1. **Super Admin Creates Organization** - Business details and admin contact
2. **Welcome Email Sent** - Activation link with 24-hour expiration
3. **Account Activation** - Set secure password and verify details
4. **7-Step Wizard** - Complete organization setup:
   - Instance configuration
   - Company information  
   - Organization chart and roles
   - Business profile
   - Subscription and billing
   - Vendor integrations
   - Final review and launch

**For Team Members:**
- Admin creates user accounts during onboarding
- Welcome emails sent with login credentials
- Role-based access automatically configured
- Training materials provided based on role

**Need Help?**
- Use this chat for real-time assistance
- Check the Help section for detailed guides
- Contact support@isohub.io for complex issues

Where are you in the onboarding process? I can provide specific guidance!`;

    return { response, confidence, sources };
  }

  private handleTroubleshootingQuestions(message: string, intent: string) {
    let response = "";
    let confidence = 0.8;
    const sources = ["Troubleshooting Guide", "Support Documentation"];

    if (message.includes('login') || message.includes('password')) {
      response = `**Login Issues Troubleshooting:**

**Common Solutions:**
1. **Clear browser cache and cookies**
2. **Try incognito/private browsing mode**
3. **Disable browser extensions temporarily**
4. **Check if Caps Lock is on**

**Password Reset:**
- Contact your organization admin for password reset
- Super admins can reset through User Management
- Use the email address associated with your account

**Still Having Issues?**
- Verify you're using the correct login URL
- Check with your admin about account status
- Contact support@isohub.io with your username

**Browser Requirements:**
- Chrome, Firefox, Safari, or Edge (latest versions)
- JavaScript enabled
- Cookies enabled`;
    } else if (message.includes('permission') || message.includes('access')) {
      response = `**Permission Issues:**

**If you can't access certain features:**
1. **Check your role** - Your sidebar shows available features
2. **Contact your admin** - They can adjust permissions
3. **Verify organization membership** - Ensure you're in the correct org

**Role-Based Restrictions:**
- Agents only see assigned merchant data
- TeamLeaders have limited user management
- Only Admins can access Data Upload and Assignments

**Need Higher Permissions?**
Contact your organization admin to request role changes.`;
    } else {
      response = `**General Troubleshooting Steps:**

1. **Refresh the page** (Ctrl+F5 or Cmd+Shift+R)
2. **Clear browser cache and cookies**
3. **Try a different browser or incognito mode**
4. **Check your internet connection**
5. **Verify you're using the latest browser version**

**Common Issues:**
- File upload failures → Check file format and size
- Page loading errors → Clear cache and refresh
- Missing data → Verify your role permissions
- Slow performance → Close unused browser tabs

**Get Help:**
- Use this chat for immediate assistance
- Email support@isohub.io for complex issues
- Check the Help section for detailed guides

What specific issue are you experiencing? I can provide targeted assistance!`;
    }

    return { response, confidence, sources };
  }

  private handleGeneralQuestions(message: string, intent: string) {
    let response = "";
    let confidence = 0.7;
    const sources = ["General Documentation"];

    if (message.includes('what') && message.includes('isohub')) {
      response = `**About ISOHub:**

ISOHub is a comprehensive merchant services residual tracking platform built by our expert team. Here's what makes it special:

**Core Capabilities:**
- Multi-processor data management (${this.knowledgeBase.systemInfo.processors.length} processors supported)
- Advanced role-based access control
- Monthly audit system with error correction
- AI-powered reporting and analytics
- Automated commission calculations
- Professional email integration
- Progressive Web App functionality

**Built for Scale:**
- Enterprise-grade security
- Multi-tenant SAAS architecture  
- Real-time data validation
- Comprehensive audit trails

**Key Features:**
✅ Monthly audit tracking with 100% accuracy verification
✅ Role-based permissions ensuring data security
✅ Intelligent error correction workflows
✅ Professional dashboard and reporting
✅ Mobile-responsive design

**Need specific help?** Ask me about uploads, audits, roles, or any other feature!`;
    } else {
      response = `I'm ISO-AI, your ISOHub AI assistant! I know everything about this platform and I'm here to help.

**I can assist with:**
- Data upload and processor management
- Monthly audit and error correction
- Role permissions and access control
- Onboarding and organization setup
- Troubleshooting and support
- Feature explanations and how-tos

**Popular questions:**
- "How do I upload processor data?"
- "Explain the monthly audit process"
- "What are agent permissions?"
- "Help with onboarding steps"
- "Fix upload validation errors"

What would you like to know about ISOHub?`;
    }

    return { response, confidence, sources };
  }

  private handleDefaultResponse(message: string) {
    return {
      response: `I understand you're asking about "${message}" but I need a bit more context to provide the best help.

Could you be more specific about:
- Which feature or page you're working with?
- What specific task you're trying to accomplish?
- Any error messages you're seeing?

**Common topics I can help with:**
- Data uploads and processor management
- Monthly audit and verification
- User roles and permissions
- Onboarding and setup
- Troubleshooting issues

Try rephrasing your question or ask about one of these specific areas!`,
      confidence: 0.5,
      sources: ["General Help"]
    };
  }

  private determineResponseType(response: string): 'text' | 'code' | 'link' | 'error' {
    if (response.includes('```') || response.includes('code')) return 'code';
    if (response.includes('http') || response.includes('www.')) return 'link';
    if (response.includes('error') || response.includes('problem')) return 'error';
    return 'text';
  }
}
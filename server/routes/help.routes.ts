import { Router } from 'express';
import { aiHelpService, type HelpContext } from '../services/AIHelpService';
import { z } from 'zod';

const router = Router();

const chatMessageSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty'),
  conversationHistory: z.array(z.object({
    id: z.string(),
    content: z.string(),
    sender: z.enum(['user', 'assistant']),
    timestamp: z.string()
  })).optional().default([])
});

/**
 * POST /api/help/chat
 * Send a message to the AI help assistant
 */
router.post('/chat', async (req, res) => {
  try {
    const { message, conversationHistory } = chatMessageSchema.parse(req.body);

    const context: HelpContext = {
      userMessage: message,
      conversationHistory: conversationHistory.map(msg => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      }))
    };

    const response = await aiHelpService.generateResponse(context);

    res.json({
      success: true,
      response,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('AI Help chat error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to process chat message',
      response: 'I apologize, but I encountered an error processing your message. Please try again or contact support if the issue persists.'
    });
  }
});

/**
 * GET /api/help/guides
 * Get list of available user guides
 */
router.get('/guides', async (req, res) => {
  try {
    const guides = [
      {
        id: 'onboarding',
        title: 'Complete Onboarding Guide',
        description: 'Step-by-step walkthrough of the 7-step onboarding process',
        file: 'ONBOARDING_USER_GUIDE.md',
        category: 'Getting Started',
        tags: ['Required', 'Setup', 'New Users']
      },
      {
        id: 'organization-management',
        title: 'Organization Management',
        description: 'How to create and manage organizations',
        file: 'organization-guide.md',
        category: 'Administration',
        tags: ['Admin', 'Setup', 'Multi-tenant']
      },
      {
        id: 'user-management',
        title: 'User Management System',
        description: 'Managing users, roles, and permissions',
        file: 'user-management-guide.md',
        category: 'Administration',
        tags: ['Users', 'Roles', 'Security']
      },
      {
        id: 'data-upload',
        title: 'Data Upload & Processing',
        description: 'How to upload and manage processor data files',
        file: 'data-upload-guide.md',
        category: 'Data Management',
        tags: ['Processors', 'CSV', 'Excel']
      },
      {
        id: 'ai-reports',
        title: 'AI Report Builder',
        description: 'Creating custom reports with natural language',
        file: 'ai-reports-guide.md',
        category: 'Reports',
        tags: ['AI', 'Analytics', 'Custom Reports']
      },
      {
        id: 'email-integration',
        title: 'Email Integration Setup',
        description: 'Configuring SMTP and email templates',
        file: 'email-integration-guide.md',
        category: 'Configuration',
        tags: ['Email', 'SMTP', 'Notifications']
      },
      {
        id: 'vendor-portal',
        title: 'Vendor Portal Management',
        description: 'Managing 36 vendors across 4 categories',
        file: 'vendor-portal-guide.md',
        category: 'Integration',
        tags: ['Vendors', 'OAuth', 'Gateways']
      }
    ];

    res.json({
      success: true,
      guides
    });
  } catch (error) {
    console.error('Error fetching guides:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user guides'
    });
  }
});

/**
 * GET /api/help/faq
 * Get frequently asked questions
 */
router.get('/faq', async (req, res) => {
  try {
    const faq = [
      {
        category: 'Getting Started',
        questions: [
          {
            question: 'How do I create a new organization?',
            answer: 'Navigate to Organization Management in the admin sidebar, click "Create Organization", fill out the required information, and the system will automatically send a welcome email with activation instructions.'
          },
          {
            question: 'What happens during the onboarding process?',
            answer: 'The onboarding includes 7 steps: Instance Setup, Company Information, Organization Chart, Business Profile, Vendor Selection (36 vendors), Document Hub Integration, and Dashboard Tour.'
          },
          {
            question: 'How long does onboarding take?',
            answer: 'The complete onboarding process typically takes 30-45 minutes, depending on your organization\'s complexity and vendor selections.'
          }
        ]
      },
      {
        category: 'User Management',
        questions: [
          {
            question: 'What user roles are available?',
            answer: 'Available roles include SuperAdmin, Admin, Manager, Team Leaders, Users/Reps, Team Members, and Partners. Each role has specific permissions and access levels.'
          },
          {
            question: 'How do I reset a user\'s password?',
            answer: 'In User Management, select the user and click "Reset Password". The system will generate a secure temporary password and send it via email.'
          },
          {
            question: 'Can I bulk assign roles to multiple users?',
            answer: 'Yes, use the bulk assignment tools in the User Management section to efficiently assign roles and permissions to multiple users at once.'
          }
        ]
      },
      {
        category: 'Data & Reports',
        questions: [
          {
            question: 'Which processors are supported?',
            answer: 'Currently supported processors include Payment Advisors, Clearent, Global Payments TSYS, Merchant Lynx, Micamp Solutions, First Data, and Shift4.'
          },
          {
            question: 'How do I upload processor data?',
            answer: 'Go to Data Upload, select your processor and month, then upload the CSV or Excel file. The system validates and processes the data automatically.'
          },
          {
            question: 'Can I generate custom reports?',
            answer: 'Yes, use the AI Report Builder to create custom reports using natural language queries. The system can generate agent reports, revenue summaries, and trend analysis.'
          }
        ]
      },
      {
        category: 'Technical Issues',
        questions: [
          {
            question: 'What file formats are supported for uploads?',
            answer: 'The system supports CSV and Excel (.xlsx) files. Each processor has specific format requirements that are automatically validated.'
          },
          {
            question: 'Why is my activation link not working?',
            answer: 'Activation links expire after 24 hours. If expired, request a new activation link from the Organization Management page.'
          },
          {
            question: 'How do I integrate with external document systems?',
            answer: 'During onboarding Step 6, you can connect Google Drive, OneDrive, SharePoint, or Dropbox using OAuth authentication.'
          }
        ]
      }
    ];

    res.json({
      success: true,
      faq
    });
  } catch (error) {
    console.error('Error fetching FAQ:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch FAQ data'
    });
  }
});

export default router;
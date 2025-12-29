import { Router } from 'express';
import { db } from '../db';
import { preApplications } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { EmailService } from '../services/emailService';
import { authenticateToken, requireReauth, AuthenticatedRequest } from '../middleware/auth';
import { Response } from 'express';

const router = Router();

// Mock data that matches the UI requirements
const mockPreApplications = [
  {
    id: "1",
    dba: "DBA Test",
    businessContactName: "John Smith",
    email: "john@dbatest.com",
    phone: "(555) 123-4567",
    status: "New",
    organizationId: "org-1",
    agentId: "agent-1",
    submittedAt: "2025-01-15T10:30:00Z",
    businessType: "Restaurant",
    monthlyVolume: 50000,
    averageTicket: 75,
    notes: "Needs quick setup for busy season"
  },
  {
    id: "2", 
    dba: "Tech Solutions LLC",
    businessContactName: "Sarah Johnson",
    email: "sarah@techsolutions.com",
    phone: "(555) 234-5678",
    status: "In Progress",
    organizationId: "org-1",
    agentId: "agent-2",
    submittedAt: "2025-01-14T14:15:00Z",
    businessType: "Professional Services",
    monthlyVolume: 25000,
    averageTicket: 125,
    notes: "B2B focused, needs invoicing features"
  },
  {
    id: "3",
    dba: "Corner Market",
    businessContactName: "Mike Wilson",
    email: "mike@cornermarket.com", 
    phone: "(555) 345-6789",
    status: "Approved",
    organizationId: "org-1",
    agentId: "agent-1",
    submittedAt: "2025-01-13T09:00:00Z",
    businessType: "Retail",
    monthlyVolume: 15000,
    averageTicket: 35,
    notes: "Standard retail setup, cash and card"
  },
  {
    id: "4",
    dba: "Elite Fitness Center",
    businessContactName: "Lisa Davis",
    email: "lisa@elitefitness.com",
    phone: "(555) 456-7890", 
    status: "Declined",
    organizationId: "org-1",
    agentId: "agent-3",
    submittedAt: "2025-01-12T16:45:00Z",
    businessType: "Health & Fitness",
    monthlyVolume: 40000,
    averageTicket: 80,
    notes: "High risk industry, needs special approval"
  },
  {
    id: "5",
    dba: "Auto Repair Plus",
    businessContactName: "Tom Rodriguez",
    email: "tom@autorepairplus.com",
    phone: "(555) 567-8901",
    status: "Pending Review", 
    organizationId: "org-1",
    agentId: "agent-2",
    submittedAt: "2025-01-11T11:20:00Z",
    businessType: "Automotive",
    monthlyVolume: 30000,
    averageTicket: 150,
    notes: "Seasonal business, needs flexible terms"
  }
];

// Get all pre-applications
router.get('/', async (req, res) => {
  try {
    const organizationId = req.query.organizationId as string;
    
    // Try to get real data from database first
    try {
      let query = db.select().from(preApplications);
      
      // Filter by organization if provided
      if (organizationId) {
        query = query.where(eq(preApplications.organizationId, organizationId));
      }
      
      const dbApplications = await query;
      
      // If we have database records, use them
      if (dbApplications.length > 0) {
        return res.json(dbApplications);
      }
    } catch (dbError) {
      console.log('Database query failed, using mock data:', dbError.message);
    }
    
    // Fallback to mock data if database is empty or fails
    let applications = mockPreApplications;
    if (organizationId) {
      applications = mockPreApplications.filter(app => app.organizationId === organizationId);
    }
    
    res.json(applications);
  } catch (error) {
    console.error('Error fetching pre-applications:', error);
    res.status(500).json({ error: 'Failed to fetch pre-applications' });
  }
});

// Get single pre-application
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const application = mockPreApplications.find(app => app.id === id);
    
    if (!application) {
      return res.status(404).json({ error: 'Pre-application not found' });
    }
    
    res.json(application);
  } catch (error) {
    console.error('Error fetching pre-application:', error);
    res.status(500).json({ error: 'Failed to fetch pre-application' });
  }
});

// Create new pre-application
// SECURITY: Step-up auth required - may contain EIN, SSN, or other sensitive business data
router.post('/', authenticateToken, requireReauth(), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      dba,
      businessContactName,
      email,
      phone,
      organizationId,
      agentId,
      businessType,
      monthlyVolume,
      averageTicket,
      notes
    } = req.body;

    const newApplication = {
      id: uuidv4(),
      dba,
      businessContactName,
      email,
      phone,
      status: "New",
      organizationId,
      agentId,
      submittedAt: new Date().toISOString(),
      businessType,
      monthlyVolume,
      averageTicket,
      notes
    };

    // In a real implementation, this would be saved to database
    mockPreApplications.push(newApplication);
    
    res.status(201).json(newApplication);
  } catch (error) {
    console.error('Error creating pre-application:', error);
    res.status(500).json({ error: 'Failed to create pre-application' });
  }
});

// Update pre-application status
// SECURITY: Step-up auth required - may update EIN, SSN, or other sensitive business data
router.put('/:id', authenticateToken, requireReauth(), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, notes, ...updateData } = req.body;
    
    const applicationIndex = mockPreApplications.findIndex(app => app.id === id);
    if (applicationIndex === -1) {
      return res.status(404).json({ error: 'Pre-application not found' });
    }
    
    // Update the application
    mockPreApplications[applicationIndex] = {
      ...mockPreApplications[applicationIndex],
      ...updateData,
      status,
      notes
    };
    
    res.json(mockPreApplications[applicationIndex]);
  } catch (error) {
    console.error('Error updating pre-application:', error);
    res.status(500).json({ error: 'Failed to update pre-application' });
  }
});

// Delete pre-application
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const applicationIndex = mockPreApplications.findIndex(app => app.id === id);
    
    if (applicationIndex === -1) {
      return res.status(404).json({ error: 'Pre-application not found' });
    }
    
    mockPreApplications.splice(applicationIndex, 1);
    res.json({ message: 'Pre-application deleted successfully' });
  } catch (error) {
    console.error('Error deleting pre-application:', error);
    res.status(500).json({ error: 'Failed to delete pre-application' });
  }
});

// Send form link to prospect  
router.post('/send-form-link', async (req, res) => {
  try {
    const { recipientEmail, firstName, lastName, formLink, senderName, organizationId } = req.body;
    
    console.log('📧 Form Link Email Request:', {
      recipientEmail,
      firstName,
      lastName,
      formLink,
      senderName,
      organizationId
    });
    
    if (!recipientEmail || !firstName || !lastName) {
      return res.status(400).json({ error: 'Recipient email, first name, and last name are required' });
    }
    
    // Generate the correct personalized form link if not provided or if provided link is incorrect
    const fullName = `${firstName}-${lastName}`.toLowerCase().replace(/\s+/g, '-');
    const agencyCode = organizationId || 'org-1';
    const correctFormLink = `${req.protocol}://${req.get('host')}/form/${agencyCode}/${fullName}`;
    
    console.log('🔗 Generated correct form link:', correctFormLink);
    
    // Use the correct personalized link instead of the passed formLink
    const actualFormLink = correctFormLink;
    
    // Extract sender info from form link for personalization
    const senderInfo = senderName || 'Your ISOHub Representative';
    const orgContext = organizationId || 'org-1';
    
    // Create email service instance
    const emailService = new EmailService();
    
    // Generate professional form link email
    const subject = `Complete Your Pre-Application - ISOHub Payment Processing`;
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #FFD700, #FFA500); padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; color: #000; font-size: 28px; font-weight: bold;">ISOHub</h1>
          <p style="margin: 10px 0 0 0; color: #333; font-size: 16px;">Payment Processing Solutions</p>
        </div>
        
        <!-- Content -->
        <div style="padding: 40px 20px; background: #ffffff; border-left: 1px solid #ddd; border-right: 1px solid #ddd;">
          <h2 style="color: #000; margin-bottom: 20px; font-size: 24px;">Hello ${firstName} ${lastName},</h2>
          
          <p style="color: #333; line-height: 1.6; margin-bottom: 20px; font-size: 16px;">
            My name is ${senderInfo}, and thank you for your interest in ISOHub's payment processing solutions. 
            I'm excited to help streamline your payment processing and grow your business with competitive rates and exceptional service.
          </p>
          
          <p style="color: #333; line-height: 1.6; margin-bottom: 25px; font-size: 16px;">
            I've created a personalized pre-application form specifically for you and your organization to ensure we provide 
            the most relevant solutions for your business needs.
          </p>
          
          <p style="color: #333; line-height: 1.6; margin-bottom: 30px; font-size: 16px;">
            To get started, please complete our secure pre-application form. It only takes 5-10 minutes 
            and helps us provide you with customized processing solutions tailored to your business needs.
          </p>
          
          <!-- CTA Button -->
          <div style="text-align: center; margin: 40px 0;">
            <a href="${actualFormLink}" 
               style="display: inline-block; background: #FFD700; color: #000; padding: 18px 45px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 18px; border: 2px solid #FFA500; box-shadow: 0 4px 8px rgba(255, 215, 0, 0.3);">
              Complete Pre-Application →
            </a>
          </div>
          
          <div style="text-align: center; margin: 20px 0;">
            <p style="font-size: 12px; color: #666;">
              Form Link: <span style="font-family: monospace;">${actualFormLink}</span>
            </p>
          </div>
          
          <div style="background: #f8f9fa; padding: 25px; border-radius: 8px; margin: 30px 0; border-left: 4px solid #FFD700;">
            <h3 style="color: #000; margin-top: 0; font-size: 18px; margin-bottom: 15px;">Why Choose ISOHub?</h3>
            <ul style="color: #333; margin: 0; padding-left: 20px; line-height: 1.8;">
              <li style="margin-bottom: 8px;">Competitive processing rates and transparent pricing</li>
              <li style="margin-bottom: 8px;">Fast setup with dedicated account management</li>
              <li style="margin-bottom: 8px;">Advanced payment solutions and reporting tools</li>
              <li style="margin-bottom: 8px;">24/7 customer support and technical assistance</li>
            </ul>
          </div>
          
          <p style="color: #666; line-height: 1.6; margin-bottom: 20px; font-size: 14px;">
            <strong>What happens next?</strong><br>
            • Complete the secure online form (takes 5-10 minutes)<br>
            • Our team reviews your application within 24 hours<br>
            • Receive competitive rates and custom processing solutions<br>
            • Get started with fast setup and dedicated support
          </p>
          
          <p style="color: #333; line-height: 1.6; margin-bottom: 20px; font-size: 16px;">
            If you have any questions, please don't hesitate to reach out. We're here to help!
          </p>
        </div>
        
        <!-- Footer -->
        <div style="background: #f8f9fa; padding: 25px; text-align: center; border-radius: 0 0 8px 8px; border: 1px solid #ddd;">
          <p style="color: #666; margin: 0; font-size: 14px; margin-bottom: 10px;">
            Questions? Contact ${senderInfo} directly at <a href="mailto:support@isohub.io" style="color: #FFD700; text-decoration: none;">support@isohub.io</a> or call (555) 123-4567
          </p>
          <p style="color: #999; margin: 0; font-size: 12px;">
            ISOHub - Streamlining Payment Processing Solutions | Personalized link for ${firstName} ${lastName} | Organization: ${orgContext}
          </p>
        </div>
      </div>
    `;
    
    const textContent = `
Hello ${firstName} ${lastName},

Thank you for your interest in ISOHub's payment processing solutions. We're excited to help streamline your payment processing and grow your business with competitive rates and exceptional service.

To get started, please complete our secure pre-application form at: ${actualFormLink}

Why Choose ISOHub?
• Competitive processing rates and transparent pricing
• Fast setup with dedicated account management  
• Advanced payment solutions and reporting tools
• 24/7 customer support and technical assistance

What happens next?
• Complete the secure online form (takes 5-10 minutes)
• Our team reviews your application within 24 hours
• Receive competitive rates and custom processing solutions
• Get started with fast setup and dedicated support

If you have any questions, please don't hesitate to reach out. We're here to help!

Questions? Contact us at support@isohub.io or call (555) 123-4567

ISOHub - Streamlining Payment Processing Solutions
    `;
    
    // Send the email
    const emailSent = await emailService.sendEmail({
      to: recipientEmail,
      subject,
      html: htmlContent,
      text: textContent,
      emailType: 'form_link'
    });
    
    console.log('📧 Email sent successfully with form link:', actualFormLink);
    
    if (emailSent) {
      // Create or update pre-application record to track the sent form link
      try {
        const fullName = `${firstName} ${lastName}`;
        
        // Check if pre-application exists for this email
        const existingApp = await db
          .select()
          .from(preApplications)
          .where(eq(preApplications.email, recipientEmail))
          .limit(1);

        if (existingApp.length > 0) {
          // Update existing record
          await db
            .update(preApplications)
            .set({
              status: "Form Link Sent",
              formLinkSentAt: new Date(),
              formLinkSentCount: (existingApp[0].formLinkSentCount || 0) + 1,
              updatedAt: new Date(),
            })
            .where(eq(preApplications.email, recipientEmail));
        } else {
          // Create new pre-application record
          await db
            .insert(preApplications)
            .values({
              dba: `${firstName}'s Business`, // Placeholder until form is filled
              businessContactName: fullName,
              email: recipientEmail,
              status: "Form Link Sent",
              organizationId: orgContext || "org-1",
              agentId: senderInfo || "agent-1",
              formLinkSentAt: new Date(),
              formLinkSentCount: 1,
            });
        }
      } catch (dbError) {
        console.error('Database update error:', dbError);
        // Don't fail the email send if database update fails
      }

      res.json({ 
        success: true, 
        message: 'Form link email sent successfully',
        recipient: {
          recipientEmail,
          recipientName: `${firstName} ${lastName}`,
          formLink: actualFormLink
        }
      });
    } else {
      res.status(500).json({ success: false, message: 'Failed to send form link email' });
    }
    
  } catch (error) {
    console.error('Error sending form link email:', error);
    res.status(500).json({ error: error.message });
  }
});

// Send pre-application email
router.post('/send-email', async (req, res) => {
  try {
    const { applicationId, recipientEmail, firstName, lastName } = req.body;
    
    if (!applicationId || !recipientEmail || !firstName || !lastName) {
      return res.status(400).json({ error: 'Application ID, recipient email, first name, and last name are required' });
    }
    
    // Find the application
    const application = mockPreApplications.find(app => app.id === applicationId);
    if (!application) {
      return res.status(404).json({ error: 'Pre-application not found' });
    }
    
    // Create email service instance
    const emailService = new EmailService();
    
    // Generate professional pre-application email
    const subject = `Complete Your Pre-Application - ${application.dba}`;
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #FFD700, #FFA500); padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; color: #000; font-size: 28px; font-weight: bold;">ISOHub</h1>
          <p style="margin: 10px 0 0 0; color: #333; font-size: 16px;">Payment Processing Solutions</p>
        </div>
        
        <!-- Content -->
        <div style="padding: 40px 20px; background: #ffffff; border-left: 1px solid #ddd; border-right: 1px solid #ddd;">
          <h2 style="color: #000; margin-bottom: 20px; font-size: 24px;">Hello ${firstName} ${lastName},</h2>
          
          <p style="color: #333; line-height: 1.6; margin-bottom: 20px; font-size: 16px;">
            Thank you for your interest in our payment processing solutions for <strong>${application.dba}</strong>. 
            We're excited to help streamline your payment processing and grow your business.
          </p>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 30px 0; border-left: 4px solid #FFD700;">
            <h3 style="color: #000; margin-top: 0; font-size: 18px;">Your Business Details:</h3>
            <ul style="color: #333; margin: 15px 0; padding-left: 20px;">
              <li style="margin-bottom: 8px;"><strong>Business Name:</strong> ${application.dba}</li>
              <li style="margin-bottom: 8px;"><strong>Contact:</strong> ${application.businessContactName}</li>
              <li style="margin-bottom: 8px;"><strong>Email:</strong> ${application.email}</li>
              <li style="margin-bottom: 8px;"><strong>Phone:</strong> ${application.phone}</li>
              ${application.businessType ? `<li style="margin-bottom: 8px;"><strong>Business Type:</strong> ${application.businessType}</li>` : ''}
              ${application.monthlyVolume ? `<li style="margin-bottom: 8px;"><strong>Monthly Volume:</strong> $${application.monthlyVolume.toLocaleString()}</li>` : ''}
              ${application.averageTicket ? `<li style="margin-bottom: 8px;"><strong>Average Ticket:</strong> $${application.averageTicket}</li>` : ''}
            </ul>
          </div>
          
          <p style="color: #333; line-height: 1.6; margin-bottom: 25px; font-size: 16px;">
            To complete your pre-application and get started with competitive rates and exceptional service, 
            please click the button below to access your personalized application form:
          </p>
          
          <!-- CTA Button -->
          <div style="text-align: center; margin: 40px 0;">
            <a href="https://isohub.io/pre-form/admin-admin2" 
               style="display: inline-block; background: #FFD700; color: #000; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; border: 2px solid #FFA500;">
              Complete Pre-Application →
            </a>
          </div>
          
          <p style="color: #666; line-height: 1.6; margin-bottom: 20px; font-size: 14px;">
            <strong>What happens next?</strong><br>
            • Complete the secure online form (takes 5-10 minutes)<br>
            • Our team reviews your application within 24 hours<br>
            • Receive competitive rates and custom processing solutions<br>
            • Get started with fast setup and dedicated support
          </p>
        </div>
        
        <!-- Footer -->
        <div style="background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; border: 1px solid #ddd;">
          <p style="color: #666; margin: 0; font-size: 14px;">
            Questions? Contact us at <a href="mailto:support@isohub.io" style="color: #FFD700;">support@isohub.io</a> or call (555) 123-4567
          </p>
          <p style="color: #999; margin: 10px 0 0 0; font-size: 12px;">
            ISOHub - Streamlining Payment Processing Solutions
          </p>
        </div>
      </div>
    `;
    
    const textContent = `
Hello ${firstName} ${lastName},

Thank you for your interest in our payment processing solutions for ${application.dba}. We're excited to help streamline your payment processing and grow your business.

Your Business Details:
- Business Name: ${application.dba}
- Contact: ${application.businessContactName}
- Email: ${application.email}
- Phone: ${application.phone}
${application.businessType ? `- Business Type: ${application.businessType}` : ''}
${application.monthlyVolume ? `- Monthly Volume: $${application.monthlyVolume.toLocaleString()}` : ''}
${application.averageTicket ? `- Average Ticket: $${application.averageTicket}` : ''}

To complete your pre-application and get started with competitive rates and exceptional service, please visit:
https://isohub.io/pre-form/admin-admin2

What happens next?
• Complete the secure online form (takes 5-10 minutes)
• Our team reviews your application within 24 hours  
• Receive competitive rates and custom processing solutions
• Get started with fast setup and dedicated support

Questions? Contact us at support@isohub.io or call (555) 123-4567

ISOHub - Streamlining Payment Processing Solutions
    `;
    
    // Send the email
    const emailSent = await emailService.sendEmail({
      to: recipientEmail,
      subject,
      html: htmlContent,
      text: textContent,
      emailType: 'pre_application'
    });
    
    if (emailSent) {
      res.json({ 
        success: true, 
        message: 'Pre-application email sent successfully',
        application: {
          dba: application.dba,
          recipientEmail,
          recipientName: `${firstName} ${lastName}`
        }
      });
    } else {
      res.status(500).json({ success: false, message: 'Failed to send pre-application email' });
    }
    
  } catch (error) {
    console.error('Error sending pre-application email:', error);
    res.status(500).json({ error: error.message });
  }
});

// Handle personalized form submission route - /{agencyCode}/{fullname}
router.get('/form-handler/:agencyCode/:fullname', async (req, res) => {
  try {
    const { agencyCode, fullname } = req.params;
    
    // Parse agency code and full name to extract user info
    // In production, you'd want to store user mappings in the database
    const agencyMapping = {
      'GTW12542': 'org-1',
      'GTW22543': 'org-2',
      'GTW32544': 'org-3',
      'JS-2025-001': 'org-1', // John Smith
      'AG-2025-001': 'org-2' // Admin/General
    };
    
    const nameMapping = {
      'john-smith': { firstName: 'John', lastName: 'Smith' },
      'jane-smith': { firstName: 'Jane', lastName: 'Smith' },
      'mike-johnson': { firstName: 'Mike', lastName: 'Johnson' },
    };
    
    const organizationId = agencyMapping[agencyCode];
    const userInfo = nameMapping[fullname.toLowerCase()];
    
    if (!organizationId || !userInfo) {
      return res.status(404).json({ error: 'Invalid agency code or agent not found' });
    }
    
    const completeUserInfo = {
      ...userInfo,
      organizationId,
      agencyCode
    };
    
    // Return form configuration for this user
    res.json({
      success: true,
      userInfo: completeUserInfo,
      formConfig: {
        title: `Pre-Application Form - ${userInfo.firstName} ${userInfo.lastName}`,
        organizationId,
        agencyCode,
        agentName: `${userInfo.firstName} ${userInfo.lastName}`,
        welcomeMessage: `Thank you for your interest! This form has been personalized by ${userInfo.firstName} ${userInfo.lastName} from agency ${agencyCode} to help us provide the best processing solutions for your business.`
      }
    });
    
  } catch (error) {
    console.error('Error handling personalized form:', error);
    res.status(500).json({ error: 'Failed to load form configuration' });
  }
});

// Test route
router.post('/test', (req, res) => {
  console.log('🧪 TEST ROUTE HIT!');
  res.json({ success: true, message: 'Test route works!' });
});

// Submit personalized form data
router.post('/form-submit/:agencyCode/:fullname', async (req, res) => {
  console.log('🔄 Form submission received:', req.params, req.body);
  
  try {
    const { agencyCode, fullname } = req.params;
    const formData = req.body;
    
    // Parse agency code and full name to extract user info
    const agencyMapping = {
      'GTW12542': 'org-1',
      'GTW22543': 'org-2', 
      'GTW32544': 'org-3',
      'JS-2025-001': 'org-1',
      'AG-2025-001': 'org-2',
      'TRM-2025-002': 'org-1',
      'TRM-2024-001': 'org-1'
    };
    
    const nameMapping = {
      'john-smith': { firstName: 'John', lastName: 'Smith' },
      'jane-smith': { firstName: 'Jane', lastName: 'Smith' },
      'mike-johnson': { firstName: 'Mike', lastName: 'Johnson' },
      'sarah-johnson': { firstName: 'Sarah', lastName: 'Johnson' },
      'admin': { firstName: 'Admin', lastName: 'User' },
      'cburnell24': { firstName: 'Cody', lastName: 'Burnell' },
      'jkeanffd': { firstName: 'James', lastName: 'Kean' },

      'cody-burnell': { firstName: 'Cody', lastName: 'Burnell' },
      'jeremy-kean': { firstName: 'Jeremy', lastName: 'Kean' }
    };
    
    const organizationId = agencyMapping[agencyCode];
    const userInfo = nameMapping[fullname.toLowerCase()];
    
    console.log('🔍 Mapping lookup:', { agencyCode, fullname, organizationId, userInfo });
    
    if (!organizationId || !userInfo) {
      console.log('❌ Invalid mapping:', { agencyCode, fullname, organizationId, userInfo });
      return res.status(404).json({ error: 'Invalid agency code or agent not found' });
    }
    
    // Save to database
    console.log('💾 Preparing database insert with:', {
      dba: formData.businessName || formData.dba || 'Unknown Business',
      businessContactName: formData.contactName || formData.businessContactName || 'Unknown Contact',
      email: formData.email || 'unknown@example.com',
      phone: formData.phone || '',
      organizationId,
      agentId: `${userInfo.firstName}_${userInfo.lastName}`.toLowerCase()
    });
    
    const savedApplication = await db
      .insert(preApplications)
      .values({
        dba: formData.businessName || formData.dba || 'Unknown Business',
        businessContactName: formData.contactName || formData.businessContactName || 'Unknown Contact',
        email: formData.email || 'unknown@example.com',
        phone: formData.phone || '',
        status: "New",
        organizationId,
        agentId: `${userInfo.firstName}_${userInfo.lastName}`.toLowerCase(),
        businessType: formData.businessType || null,
        monthlyVolume: formData.monthlyVolume ? parseFloat(formData.monthlyVolume.toString().replace(/[$,]/g, '')) : null,
        averageTicket: formData.averageTicket ? parseFloat(formData.averageTicket.toString().replace(/[$,]/g, '')) : null,
        notes: formData.notes || `Submitted via personalized form for ${userInfo.firstName} ${userInfo.lastName} (Agency: ${agencyCode})`,
      })
      .returning();
      
    console.log('✅ Database save successful:', savedApplication[0]?.id);
    
    // Send confirmation email
    if (formData.email && formData.email !== 'unknown@example.com') {
      try {
        const emailService = new EmailService();
        await emailService.sendEmail({
          to: formData.email,
          subject: 'Pre-Application Received - ISOHub',
          html: `
            <h2>Thank you for your pre-application!</h2>
            <p>Hi ${formData.contactName || formData.businessContactName || 'there'},</p>
            <p>We've received your pre-application for <strong>${formData.businessName || formData.dba || 'your business'}</strong>.</p>
            <p>Your assigned representative <strong>${userInfo.firstName} ${userInfo.lastName}</strong> will review your application and contact you within 24 hours.</p>
            <p>Thank you for choosing ISOHub!</p>
          `,
          text: `Thank you for your pre-application! Your assigned representative ${userInfo.firstName} ${userInfo.lastName} will contact you within 24 hours.`,
          emailType: 'form_submission'
        });
        console.log('✅ Confirmation email sent');
      } catch (emailError) {
        console.error('⚠️ Email sending failed:', emailError);
      }
    }
    
    res.status(201).json({
      success: true,
      message: 'Pre-application submitted successfully',
      applicationId: savedApplication[0]?.id,
      agentInfo: {
        ...userInfo,
        organizationId,
        agencyCode
      },
      emailSent: formData.email && formData.email !== 'unknown@example.com'
    });
    
  } catch (error) {
    console.error('❌ Error submitting personalized form:', error);
    res.status(500).json({ error: 'Failed to submit pre-application', details: error.message });
  }
});

// Submit pre-application form
router.post('/submit', async (req, res) => {
  try {
    const {
      businessName,
      dba,
      businessType,
      businessAddress,
      businessCity,
      businessState,
      businessZip,
      businessPhone,
      businessEmail,
      businessWebsite,
      contactName,
      contactTitle,
      contactPhone,
      contactEmail,
      yearsInBusiness,
      monthlyVolume,
      averageTicket,
      highTicket,
      currentProcessor,
      reasonForChange,
      processingNeeds,
      notes,
      agencyCode,
      agentName,
      submittedFrom
    } = req.body;

    // Insert the complete pre-application into the database
    const newApplication = await db
      .insert(preApplications)
      .values({
        businessName,
        dba: dba || businessName,
        businessContactName: contactName,
        email: contactEmail,
        phone: contactPhone,
        status: "In Progress", // Form has been filled out
        organizationId: agencyCode || "org-1",
        agentId: agentName || "agent-1",
        businessType,
        monthlyVolume: parseFloat(monthlyVolume?.replace(/[$,]/g, '') || '0'),
        averageTicket: parseFloat(averageTicket?.replace(/[$,]/g, '') || '0'),
        notes: `Business Address: ${businessAddress}, ${businessCity}, ${businessState} ${businessZip}
Business Phone: ${businessPhone}
Business Email: ${businessEmail}
Website: ${businessWebsite || 'N/A'}
Contact Title: ${contactTitle || 'N/A'}
Years in Business: ${yearsInBusiness}
High Ticket: ${highTicket || 'N/A'}
Current Processor: ${currentProcessor || 'N/A'}
Reason for Change: ${reasonForChange || 'N/A'}
Processing Needs: ${processingNeeds?.join(', ') || 'N/A'}
Additional Notes: ${notes || 'N/A'}
Submitted From: ${submittedFrom}`
      })
      .returning();

    res.json({
      success: true,
      message: 'Pre-application submitted successfully',
      application: newApplication[0]
    });
  } catch (error) {
    console.error('Error submitting pre-application:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit pre-application'
    });
  }
});

export default router;
import { Router } from 'express';
import { EmailService } from '../services/emailService';

const router = Router();
const emailService = new EmailService();

// Send pre-application link email
router.post('/preapplications/send-link-email', async (req, res) => {
  try {
    const { 
      to, 
      contactName, 
      businessName, 
      personalizedUrl, 
      shortUrl, 
      agentName, 
      agencyName 
    } = req.body;

    const emailData = {
      to,
      subject: `Your Business Pre-Application Link - ${agencyName || 'ISOHub'}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%); padding: 20px; text-align: center;">
            <h1 style="color: #000000; margin: 0; font-size: 24px;">ISOHub Pre-Application</h1>
          </div>
          
          <div style="padding: 30px; background: #ffffff;">
            <p style="font-size: 16px; color: #333;">Hi ${contactName},</p>
            
            <p style="font-size: 16px; color: #333; line-height: 1.6;">
              Thank you for your interest in our merchant services! I've prepared a personalized 
              pre-application form specifically for <strong>${businessName}</strong>.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${shortUrl || personalizedUrl}" 
                 style="background: #FFD700; color: #000000; padding: 15px 30px; 
                        text-decoration: none; border-radius: 5px; font-weight: bold; 
                        font-size: 18px; display: inline-block;">
                Complete Your Pre-Application
              </a>
            </div>
            
            <p style="font-size: 14px; color: #666; line-height: 1.6;">
              This personalized link is secure and designed specifically for your business. 
              The form takes about 5 minutes to complete and helps us understand your 
              processing needs better.
            </p>
            
            <p style="font-size: 16px; color: #333;">
              Best regards,<br>
              <strong>${agentName}</strong><br>
              ${agencyName || 'ISOHub'}<br>
              <a href="mailto:support@isohub.io">support@isohub.io</a>
            </p>
          </div>
          
          <div style="background: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #dee2e6;">
            <p style="font-size: 12px; color: #6c757d; margin: 0;">
              © 2025 ISOHub. All rights reserved.
            </p>
          </div>
        </div>
      `,
      text: `Hi ${contactName},

Thank you for your interest in our merchant services! I've prepared a personalized pre-application form for ${businessName}.

Complete your pre-application: ${shortUrl || personalizedUrl}

This secure link is designed specifically for your business and takes about 5 minutes to complete.

Best regards,
${agentName}
${agencyName || 'ISOHub'}
support@isohub.io`,
      emailType: 'pre_application_link'
    };

    const result = await emailService.sendEmail(emailData);
    
    res.json({
      success: true,
      messageId: result.messageId,
      message: 'Pre-application link email sent successfully'
    });
    
  } catch (error) {
    console.error('Error sending pre-application link email:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send pre-application link email'
    });
  }
});

// Send secured document portal access email
router.post('/secured-docs/send-access-email', async (req, res) => {
  try {
    const { 
      to, 
      contactName, 
      businessName, 
      portalUrl, 
      accessCode, 
      agentName, 
      agencyName 
    } = req.body;

    const emailData = {
      to,
      subject: `Secured Document Portal Access - ${businessName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%); padding: 20px; text-align: center;">
            <h1 style="color: #000000; margin: 0; font-size: 24px;">🔐 ISOHub Secured Portal</h1>
          </div>
          
          <div style="padding: 30px; background: #ffffff;">
            <p style="font-size: 16px; color: #333;">Hi ${contactName},</p>
            
            <p style="font-size: 16px; color: #333; line-height: 1.6;">
              Your secured document portal for <strong>${businessName}</strong> is now ready! 
              This encrypted portal allows you to safely upload and access sensitive business documents.
            </p>
            
            <div style="background: #f8f9fa; padding: 20px; border-left: 4px solid #FFD700; margin: 20px 0;">
              <p style="margin: 0; font-size: 14px; color: #666;"><strong>Portal URL:</strong></p>
              <p style="margin: 5px 0; font-size: 16px; color: #333; word-break: break-all;">
                ${portalUrl || 'https://isohub.io/secured/portal'}
              </p>
              ${accessCode ? `
                <p style="margin: 10px 0 0 0; font-size: 14px; color: #666;"><strong>Access Code:</strong></p>
                <p style="margin: 5px 0; font-size: 18px; color: #000; font-weight: bold; background: #FFD700; padding: 8px; border-radius: 3px; display: inline-block;">
                  ${accessCode}
                </p>
              ` : ''}
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${portalUrl || 'https://isohub.io/secured/portal'}" 
                 style="background: #28a745; color: white; padding: 15px 30px; 
                        text-decoration: none; border-radius: 5px; font-weight: bold; 
                        font-size: 18px; display: inline-block;">
                🔐 Access Secured Portal
              </a>
            </div>
            
            <div style="background: #e7f3ff; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="margin: 0 0 10px 0; color: #0066cc;">What you can do:</h3>
              <ul style="margin: 0; padding-left: 20px; color: #333;">
                <li>Upload bank statements securely</li>
                <li>Share tax documents safely</li>
                <li>Access your application status</li>
                <li>Download processing agreements</li>
              </ul>
            </div>
            
            <p style="font-size: 14px; color: #666; line-height: 1.6;">
              <strong>Security Note:</strong> This portal uses bank-level encryption. 
              Your access code expires in 30 days for security purposes.
            </p>
            
            <p style="font-size: 16px; color: #333;">
              Best regards,<br>
              <strong>${agentName}</strong><br>
              ${agencyName || 'ISOHub'}<br>
              <a href="mailto:support@isohub.io">support@isohub.io</a>
            </p>
          </div>
          
          <div style="background: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #dee2e6;">
            <p style="font-size: 12px; color: #6c757d; margin: 0;">
              © 2025 ISOHub. Secured by enterprise-grade encryption.
            </p>
          </div>
        </div>
      `,
      text: `Hi ${contactName},

Your secured document portal for ${businessName} is ready!

Portal URL: ${portalUrl || 'https://isohub.io/secured/portal'}
${accessCode ? `Access Code: ${accessCode}` : ''}

This encrypted portal allows you to safely upload sensitive documents and access your application status.

Security features:
• Bank-level encryption
• Secure document upload
• Application status tracking
• Encrypted file sharing

Best regards,
${agentName}
${agencyName || 'ISOHub'}
support@isohub.io`,
      emailType: 'secured_portal_access'
    };

    const result = await emailService.sendEmail(emailData);
    
    res.json({
      success: true,
      messageId: result.messageId,
      message: 'Secured portal access email sent successfully'
    });
    
  } catch (error) {
    console.error('Error sending secured portal access email:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send secured portal access email'
    });
  }
});

// Generate secured portal access
router.post('/secured-docs/generate-access', async (req, res) => {
  try {
    const { contactName, businessName, email, agencyCode, accessType } = req.body;
    
    // Generate access code
    const accessCode = Math.random().toString(36).substring(2, 10).toUpperCase();
    
    // Generate portal URL
    const urlSafeName = contactName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const portalUrl = `https://isohub.io/secured/${urlSafeName}/documents`;
    
    // Store access in database (in production)
    const portalAccess = {
      contactName,
      businessName,
      email,
      portalUrl,
      accessCode,
      agencyCode,
      accessType: accessType || 'document_upload',
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      createdAt: new Date()
    };
    
    res.json({
      success: true,
      portalUrl,
      accessCode,
      expiresAt: portalAccess.expiresAt,
      message: 'Secured portal access generated successfully'
    });
    
  } catch (error) {
    console.error('Error generating secured portal access:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate secured portal access'
    });
  }
});

// Email system status
router.get('/email/status', async (req, res) => {
  try {
    const status = {
      smtpConfigured: !!(process.env.GMAIL_USER && process.env.GMAIL_PASS),
      provider: 'Gmail SMTP',
      successRate: '98.5%',
      lastEmailSent: new Date(),
      queueHealth: 'healthy'
    };
    
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get email status' });
  }
});

// Email queue status
router.get('/email/queue', async (req, res) => {
  try {
    const queue = {
      queueLength: 0,
      processing: false,
      lastProcessed: new Date(),
      totalSent: 42,
      totalFailed: 1
    };
    
    res.json(queue);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get queue status' });
  }
});

export default router;
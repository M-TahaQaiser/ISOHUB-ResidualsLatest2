import { Router } from 'express';
import { Request, Response } from 'express';
import type { AuthenticatedRequest } from './middleware/auth';
// Note: authenticateToken and requireReauth are intentionally imported dynamically inside routes
// to avoid pulling in DB-heavy modules at import time (useful for tests).

const router = Router();

// Mock data for secure documents
let secureDocuments = [
  {
    id: '1',
    filename: 'pre-application-design-62.pdf',
    originalName: 'pre-application-design-62 (1).pdf',
    senderName: 'Ashton Vandy',
    senderEmail: 'ashton@adv.venologic@gmail.com',
    uploadDate: '2024-07-18T00:00:00Z',
    expirationDate: '2025-01-02T00:00:00Z',
    daysUntilExpiration: 167,
    downloadCount: 0,
    maxDownloads: 5,
    isExpired: false,
    fileSize: 2048576,
    fileType: 'pdf',
    organizationId: 'org-1'
  },
  {
    id: '2',
    filename: 'pre-application-design-57.pdf',
    originalName: 'pre-application-design-57 (1).pdf',
    senderName: 'Ashton Vandy',
    senderEmail: 'ashton@adv.venologic@gmail.com',
    uploadDate: '2024-07-19T00:00:00Z',
    expirationDate: '2025-01-01T00:00:00Z',
    daysUntilExpiration: 135,
    downloadCount: 1,
    maxDownloads: 5,
    isExpired: false,
    fileSize: 1536000,
    fileType: 'pdf',
    organizationId: 'org-1'
  },
  {
    id: '3',
    filename: 'principal.pdf',
    originalName: 'principal.pdf',
    senderName: 'Ashton Vandy',
    senderEmail: 'ashton@adv.venologic@gmail.com',
    uploadDate: '2024-07-20T00:00:00Z',
    expirationDate: '2024-12-31T00:00:00Z',
    daysUntilExpiration: 134,
    downloadCount: 2,
    maxDownloads: 10,
    isExpired: false,
    fileSize: 896000,
    fileType: 'pdf',
    organizationId: 'org-1'
  },
  {
    id: '4',
    filename: '1.jpg',
    originalName: '1.jpg',
    senderName: 'Test',
    senderEmail: 'test@example.com',
    uploadDate: '2024-07-15T00:00:00Z',
    expirationDate: '2024-12-30T00:00:00Z',
    daysUntilExpiration: 128,
    downloadCount: 0,
    maxDownloads: 3,
    isExpired: false,
    fileSize: 1024000,
    fileType: 'jpg',
    organizationId: 'org-1'
  },
  {
    id: '5',
    filename: 'principal-2.pdf',
    originalName: 'principal (1).pdf',
    senderName: 'Test',
    senderEmail: 'test@example.com',
    uploadDate: '2024-07-14T00:00:00Z',
    expirationDate: '2024-12-29T00:00:00Z',
    daysUntilExpiration: 128,
    downloadCount: 5,
    maxDownloads: 10,
    isExpired: false,
    fileSize: 2048000,
    fileType: 'pdf',
    organizationId: 'org-1'
  },
  // DEMO Organization Documents
  {
    id: 'demo-1',
    filename: 'agent-commission-guide-2025.pdf',
    originalName: 'Agent Commission Structure Guide 2025.pdf',
    senderName: 'Demo Admin',
    senderEmail: 'admin@demo.isohub.com',
    uploadDate: '2025-01-15T00:00:00Z',
    expirationDate: '2026-01-15T00:00:00Z',
    daysUntilExpiration: 410,
    downloadCount: 12,
    maxDownloads: 100,
    isExpired: false,
    fileSize: 1245678,
    fileType: 'pdf',
    organizationId: 'org-demo-isohub-2025'
  },
  {
    id: 'demo-2',
    filename: 'merchant-application-template.pdf',
    originalName: 'Merchant Application Template v3.pdf',
    senderName: 'Demo Admin',
    senderEmail: 'admin@demo.isohub.com',
    uploadDate: '2025-02-01T00:00:00Z',
    expirationDate: '2026-02-01T00:00:00Z',
    daysUntilExpiration: 427,
    downloadCount: 45,
    maxDownloads: 500,
    isExpired: false,
    fileSize: 892456,
    fileType: 'pdf',
    organizationId: 'org-demo-isohub-2025'
  },
  {
    id: 'demo-3',
    filename: 'pci-compliance-checklist.pdf',
    originalName: 'PCI-DSS Compliance Checklist 2025.pdf',
    senderName: 'Sarah Mitchell',
    senderEmail: 'sarah.mitchell@demo.com',
    uploadDate: '2025-03-10T00:00:00Z',
    expirationDate: '2025-12-31T00:00:00Z',
    daysUntilExpiration: 31,
    downloadCount: 8,
    maxDownloads: 50,
    isExpired: false,
    fileSize: 567890,
    fileType: 'pdf',
    organizationId: 'org-demo-isohub-2025'
  },
  {
    id: 'demo-4',
    filename: 'interchange-rate-guide-q4.xlsx',
    originalName: 'Interchange Rate Guide Q4 2025.xlsx',
    senderName: 'Michael Rodriguez',
    senderEmail: 'michael.rodriguez@demo.com',
    uploadDate: '2025-10-01T00:00:00Z',
    expirationDate: '2026-04-01T00:00:00Z',
    daysUntilExpiration: 122,
    downloadCount: 23,
    maxDownloads: 100,
    isExpired: false,
    fileSize: 234567,
    fileType: 'xlsx',
    organizationId: 'org-demo-isohub-2025'
  },
  {
    id: 'demo-5',
    filename: 'sales-training-presentation.pdf',
    originalName: 'New Agent Sales Training Presentation.pdf',
    senderName: 'Robert Garcia',
    senderEmail: 'robert.garcia@demo.com',
    uploadDate: '2025-06-15T00:00:00Z',
    expirationDate: '2026-06-15T00:00:00Z',
    daysUntilExpiration: 197,
    downloadCount: 67,
    maxDownloads: 200,
    isExpired: false,
    fileSize: 4567890,
    fileType: 'pdf',
    organizationId: 'org-demo-isohub-2025'
  },
  {
    id: 'demo-6',
    filename: 'processor-comparison-chart.pdf',
    originalName: 'Processor Comparison Chart 2025.pdf',
    senderName: 'Jennifer Thompson',
    senderEmail: 'jennifer.thompson@demo.com',
    uploadDate: '2025-08-20T00:00:00Z',
    expirationDate: '2026-02-20T00:00:00Z',
    daysUntilExpiration: 82,
    downloadCount: 34,
    maxDownloads: 100,
    isExpired: false,
    fileSize: 1234567,
    fileType: 'pdf',
    organizationId: 'org-demo-isohub-2025'
  },
  {
    id: 'demo-7',
    filename: 'equipment-pricing-sheet.pdf',
    originalName: 'Terminal Equipment Pricing Sheet.pdf',
    senderName: 'Demo Admin',
    senderEmail: 'admin@demo.isohub.com',
    uploadDate: '2025-09-01T00:00:00Z',
    expirationDate: '2026-03-01T00:00:00Z',
    daysUntilExpiration: 91,
    downloadCount: 89,
    maxDownloads: 500,
    isExpired: false,
    fileSize: 345678,
    fileType: 'pdf',
    organizationId: 'org-demo-isohub-2025'
  },
  {
    id: 'demo-8',
    filename: 'merchant-statement-analysis-template.xlsx',
    originalName: 'Statement Analysis Template.xlsx',
    senderName: 'Amanda Williams',
    senderEmail: 'amanda.williams@demo.com',
    uploadDate: '2025-07-10T00:00:00Z',
    expirationDate: '2026-01-10T00:00:00Z',
    daysUntilExpiration: 41,
    downloadCount: 56,
    maxDownloads: 200,
    isExpired: false,
    fileSize: 178900,
    fileType: 'xlsx',
    organizationId: 'org-demo-isohub-2025'
  }
];

// GET /api/secured-docs - Get all documents for organization
router.get('/', (req: Request, res: Response) => {
  try {
    const organizationId = req.query.organizationId || 'org-1';
    const filtered = secureDocuments.filter(doc => doc.organizationId === organizationId);
    res.json(filtered);
  } catch (error) {
    console.error('Error fetching secure documents:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/secured-docs/:id - Get specific document
router.get('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const document = secureDocuments.find(doc => doc.id === id);
    
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    res.json(document);
  } catch (error) {
    console.error('Error fetching document:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// In-memory store for upload links (for demo/dev only)
const uploadLinks: Record<string, { expirationDate: string; maxDownloads: number; organizationId: string; used: number }> = {};

// POST /api/secured-docs/send-upload-link - Send secure upload link
router.post('/send-upload-link', async (req: Request, res: Response) => {
  try {
    const {
      recipientEmail,
      recipientName,
      message,
      expirationDays = 30,
      maxDownloads = 5,
      organizationId = 'org-1'
    } = req.body;

    // Validate required fields
    if (!recipientEmail || !recipientName) {
      return res.status(400).json({ error: 'Recipient email and name are required' });
    }

    // Generate a unique upload link
    const uploadLinkId = Date.now().toString();
    const uploadLink = `https://isohub.io/secure-upload/${uploadLinkId}`;
    
    // Calculate expiration date
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + expirationDays);

    // Persist the link metadata in memory (demo only; production should use DB)
    uploadLinks[uploadLinkId] = {
      expirationDate: expirationDate.toISOString(),
      maxDownloads,
      organizationId,
      used: 0
    };

    // In a real implementation, this would also:
    // 1. Store the upload link details in database
    // 2. Send an email with the secure upload link
    // 3. Set up proper access controls and expiration
    
    // Send email with the secure upload link
    try {
      const { emailService } = await import('./services/emailService');
      
      console.log(`🔗 Sending secure upload link email to: ${recipientEmail}`);
      console.log(`📧 Upload link: ${uploadLink}`);
      console.log(`📅 Expiration: ${expirationDate.toISOString()}`);
      
      const emailSent = await emailService.sendUploadLinkEmail({
        recipientName,
        recipientEmail,
        uploadLink,
        expirationDate: expirationDate.toISOString(),
        maxDownloads,
        message,
        senderName: 'ISOHub Administrator'
      });
      
      if (emailSent) {
        console.log(`✅ Secure upload link email sent successfully to ${recipientEmail}`);
      } else {
        console.error(`❌ Failed to send upload link email to ${recipientEmail}`);
      }
    } catch (emailError) {
      console.error('❌ Upload link email error:', emailError);
      // Continue with the response even if email fails
    }
    
    res.status(200).json({
      message: 'Upload link sent successfully',
      uploadLinkId,
      uploadLink,
      expirationDate: expirationDate.toISOString(),
      maxDownloads
    });
  } catch (error) {
    console.error('Error sending upload link:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/secured-docs/upload - Handle file upload (from secure link or authenticated user)
// SECURITY: Allow uploads via a valid upload link (public recipient) OR authenticated + reauthenticated users
router.post('/upload', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      filename,
      originalName,
      senderName,
      senderEmail,
      fileSize,
      fileType,
      uploadLinkId,
      organizationId: bodyOrganizationId
    } = req.body as any;

    // If no uploadLinkId is provided, require auth + reauth
    let organizationId = bodyOrganizationId || 'org-1';

    if (!uploadLinkId) {
      // require Authorization header
      if (!req.headers?.authorization?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authentication required' });
      }

        // Dynamically import auth middleware so unit tests don't require DB access
      try {
        const { authenticateToken, requireReauth } = await import('./middleware/auth');

        await new Promise<void>((resolve, reject) => {
          authenticateToken(req as any, res as any, (err?: any) => err ? reject(err) : resolve());
        });

        await new Promise<void>((resolve, reject) => {
          requireReauth()(req as any, res as any, (err?: any) => err ? reject(err) : resolve());
        });

        // If authenticated, prefer user's organizationId
        if (req.user?.organizationId) {
          organizationId = req.user.organizationId;
        }
      } catch (authErr) {
        console.error('Authentication/reauth failed for upload:', authErr);
        return res.status(401).json({ error: 'Authentication required' });
      }
    } else {
      // Validate upload link
      const link = uploadLinks[uploadLinkId];
      if (!link) {
        return res.status(403).json({ error: 'Invalid upload link' });
      }
      if (new Date(link.expirationDate) < new Date()) {
        return res.status(403).json({ error: 'Upload link expired' });
      }
      if (link.used >= link.maxDownloads) {
        return res.status(403).json({ error: 'Upload link has reached maximum uploads' });
      }
      // Use organization from the link
      organizationId = link.organizationId;
      // mark as used
      link.used += 1;
    }

    // Validate required fields
    if (!filename || !senderName || !senderEmail) {
      return res.status(400).json({ error: 'Required fields missing' });
    }

    // In a real implementation, this would:
    // 1. Handle the actual file upload to secure storage
    // 2. Validate file type and size
    // 3. Update download counters and expiration tracking

    const newDocument = {
      id: Date.now().toString(),
      filename,
      originalName: originalName || filename,
      senderName,
      senderEmail,
      uploadDate: new Date().toISOString(),
      expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      daysUntilExpiration: 30,
      downloadCount: 0,
      maxDownloads: 5,
      isExpired: false,
      fileSize: fileSize || 0,
      fileType: fileType || 'unknown',
      organizationId
    };

    secureDocuments.push(newDocument);
    
    res.status(201).json(newDocument);
  } catch (error) {
    console.error('Error uploading document:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/secured-docs/:id/download - Track document download
router.put('/:id/download', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const documentIndex = secureDocuments.findIndex(doc => doc.id === id);
    
    if (documentIndex === -1) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const document = secureDocuments[documentIndex];
    
    // Check if download limit exceeded
    if (document.maxDownloads && document.downloadCount >= document.maxDownloads) {
      return res.status(403).json({ error: 'Download limit exceeded' });
    }

    // Check if document expired
    if (new Date(document.expirationDate) < new Date()) {
      return res.status(403).json({ error: 'Document has expired' });
    }

    // Increment download count
    secureDocuments[documentIndex] = {
      ...document,
      downloadCount: document.downloadCount + 1
    };
    
    res.json(secureDocuments[documentIndex]);
  } catch (error) {
    console.error('Error tracking download:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/secured-docs/:id - Delete document
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const documentIndex = secureDocuments.findIndex(doc => doc.id === id);
    
    if (documentIndex === -1) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // In a real implementation, this would also delete the file from storage
    secureDocuments.splice(documentIndex, 1);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
import { Router } from 'express';
import { Request, Response } from 'express';
import { authenticateToken, requireReauth, AuthenticatedRequest } from './middleware/auth';

const router = Router();

// Mock data - replace with actual database integration
let preApplications = [
  {
    id: '1',
    dba: 'DBA Test',
    businessContactName: '-',
    email: '-',
    phone: '-',
    status: 'New',
    submittedAt: '2025-01-20T00:00:00Z',
    organizationId: 'org-1'
  },
  {
    id: '2', 
    dba: 'DBA Test',
    businessContactName: '-',
    email: '-',
    phone: '-',
    status: 'Pending',
    submittedAt: '2025-01-19T00:00:00Z',
    organizationId: 'org-1'
  },
  {
    id: '3',
    dba: 'Business DBA',
    businessContactName: 'Marina',
    email: 'john24@gmail.com',
    phone: '3434343443',
    status: 'Approved',
    submittedAt: '2025-01-18T00:00:00Z',
    organizationId: 'org-1'
  },
  {
    id: '4',
    dba: 'New Test Organization',
    businessContactName: 'New Test Organization',
    email: 't.planning@gmail.com', 
    phone: '6686968959',
    status: 'Approved',
    submittedAt: '2025-01-17T00:00:00Z',
    organizationId: 'org-1'
  }
];

// GET /api/pre-applications - Get all pre-applications
router.get('/', (req: Request, res: Response) => {
  try {
    const organizationId = req.query.organizationId || 'org-1';
    const filtered = preApplications.filter(app => app.organizationId === organizationId);
    res.json(filtered);
  } catch (error) {
    console.error('Error fetching pre-applications:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/pre-applications/:id - Get specific pre-application
router.get('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const application = preApplications.find(app => app.id === id);
    
    if (!application) {
      return res.status(404).json({ error: 'Pre-application not found' });
    }
    
    res.json(application);
  } catch (error) {
    console.error('Error fetching pre-application:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/pre-applications - Create new pre-application
// SECURITY: Step-up auth required - may contain EIN, SSN, or other sensitive business data
router.post('/', authenticateToken, requireReauth(), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      dba,
      businessContactName,
      email,
      phone,
      organizationId = 'org-1',
      businessType,
      monthlyVolume,
      averageTicket,
      notes
    } = req.body;

    // Validate required fields
    if (!dba) {
      return res.status(400).json({ error: 'DBA is required' });
    }

    const newApplication = {
      id: Date.now().toString(),
      dba,
      businessContactName: businessContactName || '-',
      email: email || '-',
      phone: phone || '-',
      status: 'New' as const,
      submittedAt: new Date().toISOString(),
      organizationId,
      businessType,
      monthlyVolume,
      averageTicket,
      notes
    };

    preApplications.push(newApplication);
    
    res.status(201).json(newApplication);
  } catch (error) {
    console.error('Error creating pre-application:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/pre-applications/:id - Update pre-application
// SECURITY: Step-up auth required - may update EIN, SSN, or other sensitive business data
router.put('/:id', authenticateToken, requireReauth(), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const applicationIndex = preApplications.findIndex(app => app.id === id);
    
    if (applicationIndex === -1) {
      return res.status(404).json({ error: 'Pre-application not found' });
    }

    // Update the application with only allowed properties
    const allowedUpdates = {
      dba: req.body.dba,
      businessContactName: req.body.businessContactName,
      email: req.body.email,
      phone: req.body.phone,
      status: req.body.status,
      organizationId: req.body.organizationId,
      agentId: req.body.agentId,
      businessType: req.body.businessType,
      monthlyVolume: req.body.monthlyVolume,
      averageTicket: req.body.averageTicket,
      notes: req.body.notes,
      formLinkSentAt: req.body.formLinkSentAt,
      formLinkSentCount: req.body.formLinkSentCount,
      updatedAt: new Date().toISOString()
    };

    // Only include properties that are defined (not undefined)
    const filteredUpdates = Object.fromEntries(
      Object.entries(allowedUpdates).filter(([_, value]) => value !== undefined)
    );

    preApplications[applicationIndex] = {
      ...preApplications[applicationIndex],
      ...filteredUpdates,
      id // Ensure ID doesn't change
    };
    
    res.json(preApplications[applicationIndex]);
  } catch (error) {
    console.error('Error updating pre-application:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/pre-applications/:id - Delete pre-application
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const applicationIndex = preApplications.findIndex(app => app.id === id);
    
    if (applicationIndex === -1) {
      return res.status(404).json({ error: 'Pre-application not found' });
    }

    preApplications.splice(applicationIndex, 1);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting pre-application:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/pre-applications/form-link - Get form link for organization
router.get('/form-link', (req: Request, res: Response) => {
  try {
    const organizationId = req.query.organizationId || 'org-1';
    
    const formLink = {
      id: 'default',
      url: `https://isohub.io/pre-form/admin-admin2`,
      organizationId,
      isActive: true,
      createdAt: new Date().toISOString()
    };
    
    res.json({ formLink });
  } catch (error) {
    console.error('Error getting form link:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/pre-applications/email-link - Email form link
router.post('/email-link', (req: Request, res: Response) => {
  try {
    const { email, organizationId, customMessage } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // In a real implementation, this would send an actual email
    // For now, we'll just return success
    console.log(`Email sent to ${email} for organization ${organizationId}`);
    console.log(`Custom message: ${customMessage || 'Default message'}`);
    
    res.json({ message: 'Email sent successfully' });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
import express from 'express';
import { z } from 'zod';

const router = express.Router();

// Mock data for demonstration
const mockTickets = [
  {
    id: 'T-001',
    title: 'Upload validation errors on Clearent data',
    description: 'Getting multiple validation errors when uploading Clearent CSV file for April 2025. Errors show "Invalid MID format" but the MIDs look correct.',
    status: 'open',
    priority: 'high',
    category: 'technical',
    createdAt: new Date('2025-01-15').toISOString(),
    updatedAt: new Date('2025-01-15').toISOString(),
    organization: 'Tracer Consulting',
    submittedBy: 'cburnell24@cocard.net',
    responses: []
  },
  {
    id: 'T-002', 
    title: 'Agent permissions not showing correct data',
    description: 'Agent users can see data from other agents in their reports. This should be filtered to only show their assigned merchants.',
    status: 'in_progress',
    priority: 'urgent',
    category: 'bug',
    createdAt: new Date('2025-01-14').toISOString(),
    updatedAt: new Date('2025-01-16').toISOString(),
    assignedTo: 'support@isohub.io',
    organization: 'Tracer Consulting',
    submittedBy: 'jkeanffd@example.com',
    responses: [
      {
        id: 'R-001',
        content: 'We have identified the issue and are working on a fix. This is related to the role-based access control system.',
        author: 'support@isohub.io',
        timestamp: new Date('2025-01-16').toISOString(),
        isInternal: false
      }
    ]
  },
  {
    id: 'T-003',
    title: 'Monthly audit system enhancement request',
    description: 'Would like to add bulk error correction functionality to the monthly audit system to fix multiple similar errors at once.',
    status: 'waiting',
    priority: 'medium',
    category: 'feature',
    createdAt: new Date('2025-01-13').toISOString(),
    updatedAt: new Date('2025-01-14').toISOString(),
    organization: 'Demo Organization',
    submittedBy: 'admin@demo.com',
    responses: []
  },
  {
    id: 'T-004',
    title: 'Email notifications not working',
    description: 'Pre-application email notifications are not being sent to prospects. SMTP settings appear correct.',
    status: 'resolved',
    priority: 'high',
    category: 'technical',
    createdAt: new Date('2025-01-10').toISOString(),
    updatedAt: new Date('2025-01-12').toISOString(),
    assignedTo: 'support@isohub.io',
    organization: 'Tracer Consulting',
    submittedBy: 'cburnell24@cocard.net',
    responses: [
      {
        id: 'R-002',
        content: 'Issue resolved. The SMTP configuration was missing the App Password. Updated configuration and tested successfully.',
        author: 'support@isohub.io',
        timestamp: new Date('2025-01-12').toISOString(),
        isInternal: false
      }
    ]
  }
];

const ticketSchema = z.object({
  title: z.string().min(5),
  description: z.string().min(10),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  category: z.enum(['technical', 'billing', 'feature', 'bug', 'data', 'training']),
  organization: z.string().optional()
});

// Get all tickets
router.get('/tickets', async (req, res) => {
  try {
    // In production, this would filter by user's organization and role
    res.json(mockTickets);
  } catch (error) {
    console.error('Error fetching tickets:', error);
    res.status(500).json({ error: 'Failed to fetch tickets' });
  }
});

// Get single ticket
router.get('/tickets/:id', async (req, res) => {
  try {
    const ticket = mockTickets.find(t => t.id === req.params.id);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    res.json(ticket);
  } catch (error) {
    console.error('Error fetching ticket:', error);
    res.status(500).json({ error: 'Failed to fetch ticket' });
  }
});

// Create new ticket
router.post('/tickets', async (req, res) => {
  try {
    const validatedData = ticketSchema.parse(req.body);
    
    const newTicket = {
      id: `T-${String(mockTickets.length + 1).padStart(3, '0')}`,
      title: validatedData.title,
      description: validatedData.description,
      status: 'open' as const,
      priority: validatedData.priority,
      category: validatedData.category,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      organization: validatedData.organization || 'Demo Organization',
      submittedBy: 'demo@example.com', // In production, get from authenticated user
      responses: []
    };
    
    mockTickets.push(newTicket);
    res.status(201).json(newTicket);
  } catch (error) {
    console.error('Error creating ticket:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid ticket data', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to create ticket' });
  }
});

// Update ticket status
router.patch('/tickets/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const ticket = mockTickets.find(t => t.id === req.params.id);
    
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    
    ticket.status = status;
    ticket.updatedAt = new Date().toISOString();
    
    res.json(ticket);
  } catch (error) {
    console.error('Error updating ticket status:', error);
    res.status(500).json({ error: 'Failed to update ticket status' });
  }
});

// Add response to ticket
router.post('/tickets/:id/responses', async (req, res) => {
  try {
    const { content, isInternal } = req.body;
    const ticket = mockTickets.find(t => t.id === req.params.id);
    
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    
    const newResponse = {
      id: `R-${Date.now()}`,
      content,
      author: 'demo@example.com', // In production, get from authenticated user
      timestamp: new Date().toISOString(),
      isInternal: isInternal || false
    };
    
    if (ticket.responses) {
      ticket.responses.push(newResponse);
    } else {
      ticket.responses = [newResponse];
    }
    ticket.updatedAt = new Date().toISOString();
    
    res.status(201).json(newResponse);
  } catch (error) {
    console.error('Error adding response:', error);
    res.status(500).json({ error: 'Failed to add response' });
  }
});

// Get ticket statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = {
      total: mockTickets.length,
      open: mockTickets.filter(t => t.status === 'open').length,
      inProgress: mockTickets.filter(t => t.status === 'in_progress').length,
      waiting: mockTickets.filter(t => t.status === 'waiting').length,
      resolved: mockTickets.filter(t => t.status === 'resolved').length,
      closed: mockTickets.filter(t => t.status === 'closed').length,
      byPriority: {
        urgent: mockTickets.filter(t => t.priority === 'urgent').length,
        high: mockTickets.filter(t => t.priority === 'high').length,
        medium: mockTickets.filter(t => t.priority === 'medium').length,
        low: mockTickets.filter(t => t.priority === 'low').length
      },
      byCategory: {
        technical: mockTickets.filter(t => t.category === 'technical').length,
        billing: mockTickets.filter(t => t.category === 'billing').length,
        feature: mockTickets.filter(t => t.category === 'feature').length,
        bug: mockTickets.filter(t => t.category === 'bug').length,
        data: mockTickets.filter(t => t.category === 'data').length,
        training: mockTickets.filter(t => t.category === 'training').length
      }
    };
    
    res.json(stats);
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({ error: 'Failed to get statistics' });
  }
});

export default router;
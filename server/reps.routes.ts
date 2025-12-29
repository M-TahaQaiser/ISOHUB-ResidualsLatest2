import express, { Request, Response } from 'express';
import { replitDBService } from './services/replitDBService';
import { v4 as uuidv4 } from 'uuid';
import multer from 'multer';
import csv from 'csv-parser';
import { Readable } from 'stream';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// GET /api/reps/:organizationId - Get all reps for organization
router.get('/:organizationId', async (req: Request, res: Response) => {
  try {
    const { organizationId } = req.params;
    
    const reps = await replitDBService.getReps(organizationId);

    // Calculate merchant counts for each rep
    const repsWithCounts = reps.map(rep => ({
      ...rep,
      merchantCount: rep.clients ? rep.clients.length : 0
    }));

    res.json({ 
      reps: repsWithCounts,
      total: reps.length 
    });
  } catch (error) {
    console.error('Error fetching reps:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/reps/:organizationId - Create new rep
router.post('/:organizationId', async (req: Request, res: Response) => {
  try {
    const { organizationId } = req.params;
    const { firstName, lastName, company, manager, userId, additionalSplits } = req.body;

    if (!firstName || !lastName) {
      return res.status(400).json({ error: 'First name and last name are required' });
    }

    // Check if rep with this user_id already exists
    if (userId) {
      const existingReps = await replitDBService.getReps(organizationId);
      const existingRep = existingReps.find(rep => rep.user_id === userId);
      
      if (existingRep) {
        return res.status(400).json({ error: 'Rep with this user ID already exists' });
      }
    }

    const repData = {
      id: uuidv4(),
      firstName,
      lastName,
      company: company || null,
      manager: manager || null,
      user_id: userId || null,
      additionalSplits: additionalSplits || [],
      clients: [],
      createdAt: new Date().toISOString(),
      isActive: true
    };

    const newRep = await replitDBService.createRep(organizationId, repData);
    
    res.status(201).json({ 
      rep: newRep,
      message: 'Rep created successfully' 
    });
  } catch (error) {
    console.error('Error creating rep:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/reps/:organizationId/:repId - Update rep
router.put('/:organizationId/:repId', async (req: Request, res: Response) => {
  try {
    const { organizationId, repId } = req.params;
    const updates = req.body;

    const updatedRep = await replitDBService.updateRep(organizationId, repId, updates);
    
    if (!updatedRep) {
      return res.status(404).json({ error: 'Rep not found' });
    }

    res.json({ 
      rep: updatedRep,
      message: 'Rep updated successfully' 
    });
  } catch (error) {
    console.error('Error updating rep:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/reps/:organizationId/:repId - Delete rep
router.delete('/:organizationId/:repId', async (req: Request, res: Response) => {
  try {
    const { organizationId, repId } = req.params;

    const deleted = await replitDBService.deleteRep(organizationId, repId);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Rep not found' });
    }

    res.json({ message: 'Rep deleted successfully' });
  } catch (error) {
    console.error('Error deleting rep:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/reps/:organizationId/upload - Upload reps via CSV
router.post('/:organizationId/upload', upload.single('csvFile'), async (req: Request, res: Response) => {
  try {
    const { organizationId } = req.params;
    
    if (!req.file) {
      return res.status(400).json({ error: 'No CSV file uploaded' });
    }

    const csvBuffer = req.file.buffer;
    const results: any[] = [];
    const errors: string[] = [];
    
    // Parse CSV
    await new Promise<void>((resolve, reject) => {
      const stream = Readable.from(csvBuffer.toString());
      
      stream
        .pipe(csv())
        .on('data', (data) => {
          // Validate required fields
          if (!data.firstName || !data.lastName) {
            errors.push(`Missing required fields for row: ${JSON.stringify(data)}`);
            return;
          }
          
          results.push({
            id: uuidv4(),
            firstName: data.firstName?.trim(),
            lastName: data.lastName?.trim(),
            company: data.company?.trim() || null,
            manager: data.manager?.trim() || null,
            user_id: data.userId?.trim() || null,
            additionalSplits: [],
            clients: [],
            createdAt: new Date().toISOString(),
            isActive: true
          });
        })
        .on('end', resolve)
        .on('error', reject);
    });

    // Save valid reps to database
    const createdReps = [];
    for (const repData of results) {
      try {
        const newRep = await replitDBService.createRep(organizationId, repData);
        createdReps.push(newRep);
      } catch (error) {
        errors.push(`Error creating rep ${repData.firstName} ${repData.lastName}: ${error.message}`);
      }
    }

    res.json({
      success: true,
      message: `Successfully uploaded ${createdReps.length} reps`,
      created: createdReps.length,
      errors: errors.length,
      errorDetails: errors.slice(0, 10) // Limit error details for response size
    });

  } catch (error) {
    console.error('Error uploading reps:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/reps/:organizationId/:repId/clients - Get rep's clients
router.get('/:organizationId/:repId/clients', async (req: Request, res: Response) => {
  try {
    const { organizationId, repId } = req.params;
    
    const rep = await replitDBService.getRep(organizationId, repId);
    
    if (!rep) {
      return res.status(404).json({ error: 'Rep not found' });
    }

    res.json({ 
      clients: rep.clients || [],
      total: rep.clients ? rep.clients.length : 0
    });
  } catch (error) {
    console.error('Error fetching rep clients:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/reps/:organizationId/:repId/clients - Add client to rep
router.post('/:organizationId/:repId/clients', async (req: Request, res: Response) => {
  try {
    const { organizationId, repId } = req.params;
    const { clientId } = req.body;

    if (!clientId) {
      return res.status(400).json({ error: 'Client ID is required' });
    }

    const updatedRep = await replitDBService.addClientToRep(organizationId, repId, clientId);
    
    if (!updatedRep) {
      return res.status(404).json({ error: 'Rep not found' });
    }

    res.json({ 
      rep: updatedRep,
      message: 'Client added to rep successfully' 
    });
  } catch (error) {
    console.error('Error adding client to rep:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/reps/:organizationId/:repId/clients/:clientId - Remove client from rep
router.delete('/:organizationId/:repId/clients/:clientId', async (req: Request, res: Response) => {
  try {
    const { organizationId, repId, clientId } = req.params;

    const updatedRep = await replitDBService.removeClientFromRep(organizationId, repId, clientId);
    
    if (!updatedRep) {
      return res.status(404).json({ error: 'Rep not found' });
    }

    res.json({ 
      rep: updatedRep,
      message: 'Client removed from rep successfully' 
    });
  } catch (error) {
    console.error('Error removing client from rep:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
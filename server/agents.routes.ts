import express, { Request, Response } from 'express';
import { replitDBService } from './services/replitDBService';
import { v4 as uuidv4 } from 'uuid';
import multer from 'multer';
import csv from 'csv-parser';
import { Readable } from 'stream';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// GET /api/agents/:organizationId - Get all agents for organization
router.get('/:organizationId', async (req: Request, res: Response) => {
  try {
    const { organizationId } = req.params;
    
    const agents = await replitDBService.getAgents(organizationId);

    // Calculate merchant counts for each agent
    const agentWithCounts = agents.map(agent => ({
      ...agent,
      merchantCount: agent.clients ? agent.clients.length : 0
    }));

    res.json({ 
      agents: agentWithCounts,
      total: agents.length 
    });
  } catch (error) {
    console.error('Error fetching agents:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/agents/:organizationId - Create new agent
router.post('/:organizationId', async (req: Request, res: Response) => {
  try {
    const { organizationId } = req.params;
    const { firstName, lastName, company, manager, userId, additionalSplits } = req.body;

    if (!firstName || !lastName) {
      return res.status(400).json({ error: 'First name and last name are required' });
    }

    // Check if agent with this user_id already exists
    if (userId) {
      const existingAgent = await replitDBService.getAgentByUserId(organizationId, userId);

      if (existingAgent) {
        return res.status(400).json({ 
          error: 'Agent with this user ID already exists',
          existingAgent 
        });
      }
    }

    const agentId = uuidv4();
    const newAgent = {
      organizationID: organizationId,
      agentID: agentId,
      fName: firstName,
      lName: lastName,
      company: company || '',
      manager: manager || '',
      user_id: userId || null,
      additional_splits: additionalSplits || [],
      clients: []
    };

    const result = await replitDBService.createAgent(newAgent);

    if (result.acknowledged) {
      res.status(201).json({
        acknowledged: true,
        agent: newAgent,
        agentId
      });
    } else {
      res.status(500).json({ error: 'Failed to create agent' });
    }
  } catch (error) {
    console.error('Error creating agent:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/agents/:organizationId/:agentId - Update agent
router.put('/:organizationId/:agentId', async (req: Request, res: Response) => {
  try {
    const { organizationId, agentId } = req.params;
    const updateData = req.body;

    const result = await replitDBService.updateAgent(organizationId, {
      agentID: agentId,
      ...updateData
    });

    if (!result.acknowledged) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    const updatedAgent = await replitDBService.getAgentById(organizationId, agentId);

    res.json({
      acknowledged: true,
      agent: updatedAgent
    });
  } catch (error) {
    console.error('Error updating agent:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/agents/:organizationId/:agentId - Delete agent
router.delete('/:organizationId/:agentId', async (req: Request, res: Response) => {
  try {
    const { organizationId, agentId } = req.params;

    const result = await replitDBService.deleteAgent(organizationId, agentId);

    if (!result.acknowledged) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting agent:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/agents/:organizationId/:agentId - Get specific agent
router.get('/:organizationId/:agentId', async (req: Request, res: Response) => {
  try {
    const { organizationId, agentId } = req.params;

    const agent = await replitDBService.getAgentById(organizationId, agentId);

    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    res.json({
      agent,
      merchants: agent.clients || []
    });
  } catch (error) {
    console.error('Error fetching agent:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/agents/:organizationId/user/:userId - Get agent by user ID
router.get('/:organizationId/user/:userId', async (req: Request, res: Response) => {
  try {
    const { organizationId, userId } = req.params;

    const agent = await replitDBService.getAgentByUserId(organizationId, userId);

    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    res.json({ agent });
  } catch (error) {
    console.error('Error fetching agent by user ID:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/agents/:organizationId/upload - Upload agents from CSV file
router.post('/:organizationId/upload', upload.single('file'), async (req: Request, res: Response) => {
  try {
    const { organizationId } = req.params;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileBuffer = file.buffer;
    const mimetype = file.mimetype;

    // Validate file format
    if (!['text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'].includes(mimetype)) {
      return res.status(400).json({ error: 'Invalid file format. Please upload CSV or XLSX file.' });
    }

    // Record file upload
    const uploadRecord = await db.insert(agentFileUploads).values({
      organizationId,
      filename: `agents_${Date.now()}.csv`,
      originalName: file.originalname,
      fileType: mimetype,
      userId: req.user?.id || 'system',
      status: 'processing'
    }).returning();

    const uploadId = uploadRecord[0].id;

    // Process CSV data
    const agentsData: any[] = [];
    const needsAudit: any[] = [];
    const rejectedMerchants: any[] = [];

    if (mimetype === 'text/csv') {
      const readable = Readable.from(fileBuffer);
      
      await new Promise((resolve, reject) => {
        readable
          .pipe(csv())
          .on('data', (data) => {
            // Process each row of agent data
            if (data['First Name'] && data['Last Name']) {
              agentsData.push({
                firstName: data['First Name'],
                lastName: data['Last Name'],
                company: data['Company'] || null,
                manager: data['Manager'] || null,
                userId: data['User ID'] || null,
                merchants: data['Merchants'] ? JSON.parse(data['Merchants']) : []
              });
            } else {
              needsAudit.push({ row: data, issue: 'Missing required fields' });
            }
          })
          .on('end', resolve)
          .on('error', reject);
      });
    }

    const createdAgents = [];
    const results = [];

    // Create agents
    for (const agentData of agentsData) {
      try {
        // Check if agent already exists
        const existingAgent = await db
          .select()
          .from(isoAgents)
          .where(and(
            eq(isoAgents.organizationId, organizationId),
            eq(isoAgents.firstName, agentData.firstName),
            eq(isoAgents.lastName, agentData.lastName)
          ))
          .limit(1);

        let agent;
        if (existingAgent.length > 0) {
          // Update existing agent
          const updated = await db
            .update(isoAgents)
            .set({
              company: agentData.company,
              manager: agentData.manager,
              userId: agentData.userId,
              updatedAt: new Date()
            })
            .where(and(
              eq(isoAgents.organizationId, organizationId),
              eq(isoAgents.agentId, existingAgent[0].agentId)
            ))
            .returning();
          
          agent = updated[0];
          results.push({ acknowledged: true, updated: true });
        } else {
          // Create new agent
          const agentId = uuidv4();
          const created = await db.insert(isoAgents).values({
            organizationId,
            agentId,
            firstName: agentData.firstName,
            lastName: agentData.lastName,
            company: agentData.company,
            manager: agentData.manager,
            userId: agentData.userId
          }).returning();
          
          agent = created[0];
          createdAgents.push(agent);
          results.push({ acknowledged: true, created: true, agentId });
        }

        // Process merchants for this agent
        if (agentData.merchants && agentData.merchants.length > 0) {
          for (const merchant of agentData.merchants) {
            try {
              await db.insert(agentMerchants).values({
                organizationId,
                agentId: agent.agentId,
                merchantId: merchant.MerchantID.toString(),
                merchantName: merchant.MerchantName,
                processor: merchant.Processor || 'Unknown',
                bankSplit: parseFloat(merchant.BankSplit?.replace('%', '') || '0') / 100
              }).onConflictDoUpdate({
                target: [agentMerchants.organizationId, agentMerchants.agentId, agentMerchants.merchantId, agentMerchants.processor],
                set: {
                  merchantName: merchant.MerchantName,
                  bankSplit: parseFloat(merchant.BankSplit?.replace('%', '') || '0') / 100
                }
              });
            } catch (merchantError) {
              needsAudit.push({
                agentName: `${agentData.firstName} ${agentData.lastName}`,
                merchant,
                error: 'Failed to create merchant relationship'
              });
            }
          }
        }
      } catch (agentError) {
        rejectedMerchants.push({
          agentData,
          error: agentError instanceof Error ? agentError.message : 'Unknown error'
        });
      }
    }

    // Update upload record
    await db.update(agentFileUploads).set({
      status: 'processed',
      processedAt: new Date(),
      results: {
        totalProcessed: agentsData.length,
        created: createdAgents.length,
        updated: results.filter(r => r.updated).length,
        needsAudit: needsAudit.length,
        rejected: rejectedMerchants.length
      },
      needsAudit,
      rejectedMerchants
    }).where(eq(agentFileUploads.id, uploadId));

    res.status(200).json({
      message: 'Agents processed successfully',
      results,
      needsAudit,
      rejectedMerchants,
      createdAgents
    });

  } catch (error) {
    console.error('Error uploading agents:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/agents/:organizationId/reaudit - Re-audit agents data
router.post('/:organizationId/reaudit', async (req: Request, res: Response) => {
  try {
    const { organizationId } = req.params;
    const agentsData = req.body;

    if (!agentsData || agentsData.length === 0) {
      return res.status(400).json({ error: 'No agents data provided for re-audit' });
    }

    const results = [];
    const needsAudit = [];
    const rejectedMerchants = [];

    for (const agentData of agentsData) {
      try {
        // Find existing agent
        const existingAgent = await db
          .select()
          .from(isoAgents)
          .where(and(
            eq(isoAgents.organizationId, organizationId),
            eq(isoAgents.firstName, agentData.fName),
            eq(isoAgents.lastName, agentData.lName)
          ))
          .limit(1);

        if (existingAgent.length > 0) {
          // Update existing agent
          await db
            .update(isoAgents)
            .set({
              company: agentData.company,
              manager: agentData.manager,
              companySplit: agentData.companySplit,
              managerSplit: agentData.managerSplit,
              agentSplit: agentData.agentSplit,
              additionalSplits: agentData.additional_splits || [],
              updatedAt: new Date()
            })
            .where(eq(isoAgents.agentId, existingAgent[0].agentId));

          results.push({ acknowledged: true, updated: true, agentId: existingAgent[0].agentId });
        } else {
          needsAudit.push(agentData);
        }
      } catch (error) {
        rejectedMerchants.push({ agentData, error: error instanceof Error ? error.message : 'Unknown error' });
      }
    }

    res.json({ results, needsAudit, rejectedMerchants });
  } catch (error) {
    console.error('Error re-auditing agents:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
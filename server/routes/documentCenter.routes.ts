import { Router, Response } from 'express';
import { z } from 'zod';
import { documentCenterService } from '../services/ai/DocumentCenterService';
import { authenticateToken, type AuthenticatedRequest } from '../middleware/auth';
import multer from 'multer';

const router = Router();

router.use(authenticateToken);

const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

const createDocumentSchema = z.object({
  title: z.string().min(1).max(500),
  content: z.string().min(1),
  visibleToRole: z.enum(['public', 'rep', 'admin']).optional(),
  fileType: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

const updateDocumentSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  content: z.string().min(1).optional(),
  visibleToRole: z.enum(['public', 'rep', 'admin']).optional(),
  isActive: z.boolean().optional(),
  metadata: z.record(z.unknown()).optional(),
});

const searchDocumentsSchema = z.object({
  query: z.string().min(1).max(500),
  limit: z.number().min(1).max(50).optional(),
});

const rejectDocumentSchema = z.object({
  reason: z.string().min(1).max(1000),
});

function getUserId(req: AuthenticatedRequest): number {
  if (!req.user?.id) {
    throw new Error('User not authenticated');
  }
  return req.user.id;
}

function getOrganizationId(req: AuthenticatedRequest): string {
  return req.user?.agencyId ? `org-${req.user.agencyId}` : 'org-86f76df1';
}

function getUserRole(req: AuthenticatedRequest): string {
  const role = req.user?.role?.toLowerCase() || 'public';
  if (role.includes('admin') || role.includes('super')) return 'admin';
  if (role.includes('rep') || role.includes('agent')) return 'rep';
  return 'public';
}

function isAdmin(req: AuthenticatedRequest): boolean {
  const role = req.user?.role?.toLowerCase() || '';
  return role.includes('admin') || role.includes('super');
}

router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const organizationId = getOrganizationId(req);
    const { approvalStatus, visibleToRole, search, limit, offset } = req.query;

    const documents = await documentCenterService.getDocuments({
      organizationId,
      approvalStatus: approvalStatus as string,
      visibleToRole: visibleToRole as string,
      isActive: true,
      search: search as string,
    }, 
    parseInt(limit as string) || 50,
    parseInt(offset as string) || 0
    );

    res.json(documents);
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

router.get('/stats', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const organizationId = getOrganizationId(req);
    const stats = await documentCenterService.getDocumentStats(organizationId);
    res.json(stats);
  } catch (error) {
    console.error('Error fetching document stats:', error);
    res.status(500).json({ error: 'Failed to fetch document stats' });
  }
});

router.get('/pending', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const organizationId = getOrganizationId(req);
    const documents = await documentCenterService.getDocuments({
      organizationId,
      approvalStatus: 'pending',
    });

    res.json(documents);
  } catch (error) {
    console.error('Error fetching pending documents:', error);
    res.status(500).json({ error: 'Failed to fetch pending documents' });
  }
});

router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const organizationId = getOrganizationId(req);

    const document = await documentCenterService.getDocumentById(id, organizationId);
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    await documentCenterService.incrementViewCount(id);

    res.json(document);
  } catch (error) {
    console.error('Error fetching document:', error);
    res.status(500).json({ error: 'Failed to fetch document' });
  }
});

router.post('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = getUserId(req);
    const organizationId = getOrganizationId(req);
    const data = createDocumentSchema.parse(req.body);

    const document = await documentCenterService.createDocument({
      organizationId,
      title: data.title,
      content: data.content,
      visibleToRole: data.visibleToRole,
      fileType: data.fileType,
      uploadedBy: userId,
      metadata: data.metadata,
    });

    res.status(201).json(document);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Error creating document:', error);
    res.status(500).json({ error: 'Failed to create document' });
  }
});

router.post('/upload', upload.single('file'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = getUserId(req);
    const organizationId = getOrganizationId(req);
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { title, visibleToRole } = req.body;
    const file = req.file;

    let content = '';
    const mimeType = file.mimetype;
    const fileType = mimeType.split('/')[1] || 'unknown';

    if (mimeType.startsWith('text/') || 
        mimeType === 'application/json' ||
        fileType === 'csv' ||
        fileType === 'plain') {
      content = file.buffer.toString('utf-8');
    } else {
      content = `[Binary file: ${file.originalname}]`;
    }

    const document = await documentCenterService.createDocument({
      organizationId,
      title: title || file.originalname,
      content,
      fileData: file.buffer.toString('base64'),
      filePath: file.originalname,
      fileType,
      fileSizeBytes: file.size,
      mimeType,
      visibleToRole: visibleToRole || 'public',
      uploadedBy: userId,
      metadata: { originalName: file.originalname },
    });

    res.status(201).json(document);
  } catch (error) {
    console.error('Error uploading document:', error);
    res.status(500).json({ error: 'Failed to upload document' });
  }
});

router.patch('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const organizationId = getOrganizationId(req);
    const data = updateDocumentSchema.parse(req.body);

    const document = await documentCenterService.updateDocument(id, organizationId, data);
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    res.json(document);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Error updating document:', error);
    res.status(500).json({ error: 'Failed to update document' });
  }
});

router.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const organizationId = getOrganizationId(req);

    const success = await documentCenterService.deleteDocument(id, organizationId);
    if (!success) {
      return res.status(404).json({ error: 'Document not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ error: 'Failed to delete document' });
  }
});

router.post('/:id/approve', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const id = parseInt(req.params.id);
    const userId = getUserId(req);
    const organizationId = getOrganizationId(req);

    const document = await documentCenterService.approveDocument(id, organizationId, userId);
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    res.json(document);
  } catch (error) {
    console.error('Error approving document:', error);
    res.status(500).json({ error: 'Failed to approve document' });
  }
});

router.post('/:id/reject', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const id = parseInt(req.params.id);
    const userId = getUserId(req);
    const organizationId = getOrganizationId(req);
    const { reason } = rejectDocumentSchema.parse(req.body);

    const document = await documentCenterService.rejectDocument(id, organizationId, userId, reason);
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    res.json(document);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Error rejecting document:', error);
    res.status(500).json({ error: 'Failed to reject document' });
  }
});

router.post('/search', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const organizationId = getOrganizationId(req);
    const userRole = getUserRole(req);
    const { query, limit } = searchDocumentsSchema.parse(req.body);

    const results = await documentCenterService.searchDocuments(
      query,
      organizationId,
      userRole,
      limit || 10
    );

    res.json(results);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Error searching documents:', error);
    res.status(500).json({ error: 'Failed to search documents' });
  }
});

router.post('/:id/regenerate-embeddings', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const id = parseInt(req.params.id);
    const organizationId = getOrganizationId(req);

    const updatedCount = await documentCenterService.regenerateEmbeddings(id, organizationId);
    
    res.json({ success: true, updatedChunks: updatedCount });
  } catch (error) {
    console.error('Error regenerating embeddings:', error);
    res.status(500).json({ error: 'Failed to regenerate embeddings' });
  }
});

export default router;

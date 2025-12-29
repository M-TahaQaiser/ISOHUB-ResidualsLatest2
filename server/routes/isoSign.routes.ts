import { Router, Request, Response } from 'express';
import { isoSignService } from '../services/ISOSignService';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { z } from 'zod';
import multer from 'multer';

const router = Router();

const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
});

const createEnvelopeSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  sourceType: z.enum(['pre_application', 'onboarding', 'commission_agreement', 'document_center', 'manual']).optional(),
  sourceId: z.number().optional(),
  expiresAt: z.string().datetime().optional(),
  reminderEnabled: z.boolean().optional(),
  reminderDays: z.number().min(1).max(30).optional(),
  sequentialSigning: z.boolean().optional(),
});

const addRecipientSchema = z.object({
  name: z.string().min(1).max(255),
  email: z.string().email(),
  phone: z.string().optional(),
  role: z.enum(['signer', 'cc', 'witness', 'approver']).optional(),
  routingOrder: z.number().min(1).optional(),
  accessCode: z.string().optional(),
  requireIdVerification: z.boolean().optional(),
  requireSmsVerification: z.boolean().optional(),
});

const addFieldSchema = z.object({
  documentId: z.number(),
  recipientId: z.number(),
  fieldType: z.enum(['signature', 'initial', 'date', 'text', 'checkbox', 'dropdown', 'name', 'email', 'company', 'title']),
  pageNumber: z.number().min(1),
  xPosition: z.number(),
  yPosition: z.number(),
  width: z.number(),
  height: z.number(),
  isRequired: z.boolean().optional(),
  label: z.string().optional(),
  placeholder: z.string().optional(),
  defaultValue: z.string().optional(),
  options: z.array(z.string()).optional(),
});

function getOrganizationId(req: AuthenticatedRequest): string {
  const organizationId = req.user?.organizationId;
  if (!organizationId) {
    throw new Error('Organization ID required');
  }
  return organizationId;
}

router.get('/stats', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const organizationId = getOrganizationId(req);
    const stats = await isoSignService.getEnvelopeStats(organizationId);
    res.json(stats);
  } catch (error: any) {
    console.error('Get envelope stats error:', error);
    if (error.message === 'Organization ID required') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

router.get('/envelopes', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const organizationId = getOrganizationId(req);
    const status = req.query.status as string | undefined;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    const result = await isoSignService.listEnvelopes(organizationId, { status, limit, offset });
    res.json(result);
  } catch (error: any) {
    console.error('List envelopes error:', error);
    if (error.message === 'Organization ID required') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to list envelopes' });
  }
});

router.post('/envelopes', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const validation = createEnvelopeSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors });
    }

    const organizationId = getOrganizationId(req);
    const envelope = await isoSignService.createEnvelope(
      {
        ...validation.data,
        expiresAt: validation.data.expiresAt ? new Date(validation.data.expiresAt) : undefined,
      },
      organizationId,
      req.user?.id,
      req.user?.firstName && req.user?.lastName 
        ? `${req.user.firstName} ${req.user.lastName}` 
        : req.user?.username,
      req.user?.email || undefined
    );

    res.status(201).json(envelope);
  } catch (error: any) {
    console.error('Create envelope error:', error);
    if (error.message === 'Organization ID required') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to create envelope' });
  }
});

router.get('/envelopes/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const envelopeId = parseInt(req.params.id);
    const organizationId = getOrganizationId(req);

    const envelope = await isoSignService.getEnvelope(envelopeId, organizationId);
    if (!envelope) {
      return res.status(404).json({ error: 'Envelope not found' });
    }

    res.json(envelope);
  } catch (error) {
    console.error('Get envelope error:', error);
    res.status(500).json({ error: 'Failed to get envelope' });
  }
});

router.post('/envelopes/:id/documents', authenticateToken, upload.single('file'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const envelopeId = parseInt(req.params.id);
    const organizationId = getOrganizationId(req);

    if (!req.file) {
      return res.status(400).json({ error: 'File required' });
    }

    const document = await isoSignService.addDocument(envelopeId, organizationId, {
      name: req.body.name || req.file.originalname,
      fileName: req.file.originalname,
      mimeType: req.file.mimetype,
      content: req.file.buffer.toString('base64'),
      fileSizeBytes: req.file.size,
      order: parseInt(req.body.order) || 1,
    });

    res.status(201).json(document);
  } catch (error: any) {
    console.error('Add document error:', error);
    if (error.message === 'Organization ID required' || error.message === 'Envelope not found or access denied') {
      return res.status(error.message === 'Organization ID required' ? 400 : 403).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to add document' });
  }
});

router.post('/envelopes/:id/recipients', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const envelopeId = parseInt(req.params.id);
    const organizationId = getOrganizationId(req);

    const validation = addRecipientSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors });
    }

    const recipient = await isoSignService.addRecipient(envelopeId, organizationId, validation.data);
    res.status(201).json(recipient);
  } catch (error: any) {
    console.error('Add recipient error:', error);
    if (error.message === 'Organization ID required' || error.message === 'Envelope not found or access denied') {
      return res.status(error.message === 'Organization ID required' ? 400 : 403).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to add recipient' });
  }
});

router.post('/envelopes/:id/fields', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const organizationId = getOrganizationId(req);

    const validation = addFieldSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors });
    }

    const field = await isoSignService.addField(
      validation.data.documentId,
      validation.data.recipientId,
      organizationId,
      {
        fieldType: validation.data.fieldType,
        pageNumber: validation.data.pageNumber,
        xPosition: validation.data.xPosition.toString(),
        yPosition: validation.data.yPosition.toString(),
        width: validation.data.width.toString(),
        height: validation.data.height.toString(),
        isRequired: validation.data.isRequired,
        label: validation.data.label,
        placeholder: validation.data.placeholder,
        defaultValue: validation.data.defaultValue,
        options: validation.data.options,
      }
    );

    res.status(201).json(field);
  } catch (error: any) {
    console.error('Add field error:', error);
    if (error.message === 'Organization ID required' || error.message.includes('not found or access denied')) {
      return res.status(error.message === 'Organization ID required' ? 400 : 403).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to add field' });
  }
});

router.post('/envelopes/:id/send', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const envelopeId = parseInt(req.params.id);
    const organizationId = getOrganizationId(req);

    const envelope = await isoSignService.sendEnvelope(envelopeId, organizationId);
    res.json(envelope);
  } catch (error: any) {
    console.error('Send envelope error:', error);
    if (error.message === 'Organization ID required') {
      return res.status(400).json({ error: error.message });
    }
    res.status(400).json({ error: error.message || 'Failed to send envelope' });
  }
});

router.post('/envelopes/:id/void', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const envelopeId = parseInt(req.params.id);
    const organizationId = getOrganizationId(req);
    const reason = req.body.reason;

    if (!reason) {
      return res.status(400).json({ error: 'Void reason required' });
    }

    const envelope = await isoSignService.voidEnvelope(
      envelopeId,
      organizationId,
      reason,
      req.user?.id,
      req.user?.firstName && req.user?.lastName 
        ? `${req.user.firstName} ${req.user.lastName}` 
        : req.user?.username,
      req.user?.email || undefined
    );

    res.json(envelope);
  } catch (error: any) {
    console.error('Void envelope error:', error);
    if (error.message === 'Organization ID required') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to void envelope' });
  }
});

router.get('/envelopes/:id/audit-trail', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const envelopeId = parseInt(req.params.id);
    const organizationId = getOrganizationId(req);

    const events = await isoSignService.getAuditTrail(envelopeId, organizationId);
    res.json(events);
  } catch (error: any) {
    console.error('Get audit trail error:', error);
    if (error.message === 'Organization ID required') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to get audit trail' });
  }
});

router.post('/recipients/:id/signing-url', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const recipientId = parseInt(req.params.id);
    const organizationId = getOrganizationId(req);

    const url = await isoSignService.generateSigningUrl(recipientId, organizationId);
    res.json({ url });
  } catch (error: any) {
    console.error('Generate signing URL error:', error);
    res.status(400).json({ error: error.message || 'Failed to generate signing URL' });
  }
});

router.get('/sign/:recipientUuid', async (req: Request, res: Response) => {
  try {
    const { recipientUuid } = req.params;
    const token = req.query.token as string;

    if (!token) {
      return res.status(400).json({ error: 'Token required' });
    }

    const result = await isoSignService.validateSigningAccess(recipientUuid, token);
    
    if (!result.valid) {
      return res.status(403).json({ error: 'Invalid or expired signing link' });
    }

    const envelope = await isoSignService.getEnvelopeByUuid(result.envelope!.envelopeUuid);
    res.json({
      envelope,
      recipient: result.recipient,
    });
  } catch (error) {
    console.error('Validate signing access error:', error);
    res.status(500).json({ error: 'Failed to validate access' });
  }
});

router.post('/sign/:recipientUuid/complete', async (req: Request, res: Response) => {
  try {
    const { recipientUuid } = req.params;
    const { token, signatureData, accessCode } = req.body;

    if (!token || !signatureData) {
      return res.status(400).json({ error: 'Token and signature data required' });
    }

    const result = await isoSignService.validateSigningAccess(recipientUuid, token, accessCode);
    
    if (!result.valid || !result.recipient) {
      return res.status(403).json({ error: 'Invalid or expired signing link' });
    }

    const ipAddress = req.ip || req.headers['x-forwarded-for'] as string;
    const userAgent = req.headers['user-agent'];

    const recipient = await isoSignService.recordSignature(
      result.recipient.id,
      result.recipient.organizationId,
      signatureData,
      ipAddress,
      userAgent
    );

    res.json({ 
      success: true, 
      message: 'Signature recorded successfully',
      recipient 
    });
  } catch (error) {
    console.error('Complete signing error:', error);
    res.status(500).json({ error: 'Failed to record signature' });
  }
});

export default router;

import { db } from '../db';
import { 
  isoSignEnvelopes, 
  isoSignDocuments, 
  isoSignRecipients, 
  isoSignFields,
  isoSignEvents,
  isoSignTemplates,
  InsertIsoSignEnvelope,
  InsertIsoSignDocument,
  InsertIsoSignRecipient,
  InsertIsoSignField,
  InsertIsoSignEvent,
  IsoSignEnvelope,
  IsoSignDocument,
  IsoSignRecipient,
  IsoSignEnvelopeWithDetails,
  ISO_SIGN_ENVELOPE_STATUS,
  ISO_SIGN_RECIPIENT_STATUS,
} from '@shared/schema';
import { eq, and, desc, asc, sql } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { EncryptionService } from './EncryptionService';
import { TenancyService } from './tenancyService';

export class ISOSignService {
  private generateHash(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  private generateSigningToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  private async verifyEnvelopeOwnership(envelopeId: number, organizationId: string): Promise<IsoSignEnvelope> {
    const [envelope] = await db.select()
      .from(isoSignEnvelopes)
      .where(and(
        eq(isoSignEnvelopes.id, envelopeId),
        eq(isoSignEnvelopes.organizationId, organizationId)
      ))
      .limit(1);

    if (!envelope) {
      throw new Error('Envelope not found or access denied');
    }

    return envelope;
  }

  private async verifyDocumentOwnership(documentId: number, organizationId: string): Promise<IsoSignDocument> {
    const [document] = await db.select()
      .from(isoSignDocuments)
      .where(and(
        eq(isoSignDocuments.id, documentId),
        eq(isoSignDocuments.organizationId, organizationId)
      ))
      .limit(1);

    if (!document) {
      throw new Error('Document not found or access denied');
    }

    return document;
  }

  private async verifyRecipientOwnership(recipientId: number, organizationId: string): Promise<IsoSignRecipient> {
    const [recipient] = await db.select()
      .from(isoSignRecipients)
      .where(and(
        eq(isoSignRecipients.id, recipientId),
        eq(isoSignRecipients.organizationId, organizationId)
      ))
      .limit(1);

    if (!recipient) {
      throw new Error('Recipient not found or access denied');
    }

    return recipient;
  }

  async createEnvelope(
    data: Partial<InsertIsoSignEnvelope>,
    organizationId: string,
    senderUserId?: number,
    senderName?: string,
    senderEmail?: string
  ): Promise<IsoSignEnvelope> {
    const envelopeUuid = uuidv4();
    const agencyId = await TenancyService.resolveAgencyId(organizationId);

    const [envelope] = await db.insert(isoSignEnvelopes).values({
      envelopeUuid,
      organizationId,
      agencyId,
      title: data.title || 'Untitled Envelope',
      description: data.description,
      status: 'draft',
      sourceType: data.sourceType,
      sourceId: data.sourceId,
      senderUserId,
      senderName,
      senderEmail,
      expiresAt: data.expiresAt,
      reminderEnabled: data.reminderEnabled ?? true,
      reminderDays: data.reminderDays ?? 3,
      sequentialSigning: data.sequentialSigning ?? false,
    }).returning();

    await this.logEvent(envelope.id, organizationId, {
      eventType: 'envelope_created',
      actorType: 'sender',
      actorEmail: senderEmail,
      actorName: senderName,
      actorUserId: senderUserId,
      message: `Envelope "${envelope.title}" created`,
    });

    return envelope;
  }

  async getEnvelope(envelopeId: number, organizationId: string): Promise<IsoSignEnvelopeWithDetails | null> {
    const [envelope] = await db.select()
      .from(isoSignEnvelopes)
      .where(and(
        eq(isoSignEnvelopes.id, envelopeId),
        eq(isoSignEnvelopes.organizationId, organizationId)
      ))
      .limit(1);

    if (!envelope) return null;

    const documents = await db.select()
      .from(isoSignDocuments)
      .where(eq(isoSignDocuments.envelopeId, envelopeId))
      .orderBy(asc(isoSignDocuments.order));

    const recipients = await db.select()
      .from(isoSignRecipients)
      .where(eq(isoSignRecipients.envelopeId, envelopeId))
      .orderBy(asc(isoSignRecipients.routingOrder));

    const events = await db.select()
      .from(isoSignEvents)
      .where(eq(isoSignEvents.envelopeId, envelopeId))
      .orderBy(desc(isoSignEvents.createdAt))
      .limit(50);

    return {
      ...envelope,
      documents,
      recipients,
      events,
    };
  }

  async getEnvelopeByUuid(envelopeUuid: string): Promise<IsoSignEnvelopeWithDetails | null> {
    const [envelope] = await db.select()
      .from(isoSignEnvelopes)
      .where(eq(isoSignEnvelopes.envelopeUuid, envelopeUuid))
      .limit(1);

    if (!envelope) return null;

    return this.getEnvelope(envelope.id, envelope.organizationId);
  }

  async listEnvelopes(
    organizationId: string,
    options: {
      status?: string;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{ envelopes: IsoSignEnvelope[]; total: number }> {
    const { status, limit = 20, offset = 0 } = options;

    let query = db.select()
      .from(isoSignEnvelopes)
      .where(eq(isoSignEnvelopes.organizationId, organizationId));

    if (status) {
      query = db.select()
        .from(isoSignEnvelopes)
        .where(and(
          eq(isoSignEnvelopes.organizationId, organizationId),
          sql`${isoSignEnvelopes.status} = ${status}`
        ));
    }

    const envelopes = await query
      .orderBy(desc(isoSignEnvelopes.createdAt))
      .limit(limit)
      .offset(offset);

    const [countResult] = await db.select({ count: sql<number>`count(*)` })
      .from(isoSignEnvelopes)
      .where(eq(isoSignEnvelopes.organizationId, organizationId));

    return {
      envelopes,
      total: Number(countResult?.count || 0),
    };
  }

  async addDocument(
    envelopeId: number,
    organizationId: string,
    data: {
      name: string;
      fileName: string;
      mimeType: string;
      content: string;
      fileSizeBytes?: number;
      pageCount?: number;
      order?: number;
    }
  ): Promise<IsoSignDocument> {
    await this.verifyEnvelopeOwnership(envelopeId, organizationId);
    
    const documentUuid = uuidv4();
    const encryptedContent = EncryptionService.encrypt(data.content);
    const documentHash = this.generateHash(data.content);

    const [document] = await db.insert(isoSignDocuments).values({
      documentUuid,
      envelopeId,
      organizationId,
      name: data.name,
      fileName: data.fileName,
      mimeType: data.mimeType,
      fileSizeBytes: data.fileSizeBytes,
      pageCount: data.pageCount,
      order: data.order || 1,
      storageType: 'database',
      documentContent: encryptedContent,
      documentHash,
    }).returning();

    return document;
  }

  async addRecipient(
    envelopeId: number,
    organizationId: string,
    data: {
      name: string;
      email: string;
      phone?: string;
      role?: 'signer' | 'cc' | 'witness' | 'approver';
      routingOrder?: number;
      accessCode?: string;
      requireIdVerification?: boolean;
      requireSmsVerification?: boolean;
      userId?: number;
    }
  ): Promise<IsoSignRecipient> {
    await this.verifyEnvelopeOwnership(envelopeId, organizationId);
    
    const recipientUuid = uuidv4();
    let encryptedAccessCode: string | undefined;
    if (data.accessCode) {
      encryptedAccessCode = EncryptionService.encrypt(data.accessCode);
    }

    const [recipient] = await db.insert(isoSignRecipients).values({
      recipientUuid,
      envelopeId,
      organizationId,
      name: data.name,
      email: data.email,
      phone: data.phone,
      role: data.role || 'signer',
      routingOrder: data.routingOrder || 1,
      status: 'pending',
      accessCode: encryptedAccessCode,
      requireIdVerification: data.requireIdVerification || false,
      requireSmsVerification: data.requireSmsVerification || false,
      userId: data.userId,
    }).returning();

    return recipient;
  }

  async addField(
    documentId: number,
    recipientId: number,
    organizationId: string,
    data: {
      fieldType: 'signature' | 'initial' | 'date' | 'text' | 'checkbox' | 'dropdown' | 'name' | 'email' | 'company' | 'title';
      pageNumber: number;
      xPosition: string;
      yPosition: string;
      width: string;
      height: string;
      isRequired?: boolean;
      label?: string;
      placeholder?: string;
      defaultValue?: string;
      options?: any;
    }
  ): Promise<any> {
    await this.verifyDocumentOwnership(documentId, organizationId);
    await this.verifyRecipientOwnership(recipientId, organizationId);
    
    const fieldUuid = uuidv4();

    const [field] = await db.insert(isoSignFields).values({
      fieldUuid,
      documentId,
      recipientId,
      organizationId,
      fieldType: data.fieldType,
      pageNumber: data.pageNumber,
      xPosition: data.xPosition,
      yPosition: data.yPosition,
      width: data.width,
      height: data.height,
      isRequired: data.isRequired ?? true,
      label: data.label,
      placeholder: data.placeholder,
      defaultValue: data.defaultValue,
      options: data.options,
    }).returning();

    return field;
  }

  async sendEnvelope(envelopeId: number, organizationId: string): Promise<IsoSignEnvelope> {
    const envelope = await this.getEnvelope(envelopeId, organizationId);
    if (!envelope) {
      throw new Error('Envelope not found');
    }

    if (envelope.status !== 'draft') {
      throw new Error('Envelope is not in draft status');
    }

    if (!envelope.documents?.length) {
      throw new Error('Envelope must have at least one document');
    }

    if (!envelope.recipients?.length) {
      throw new Error('Envelope must have at least one recipient');
    }

    const [updated] = await db.update(isoSignEnvelopes)
      .set({ 
        status: 'sent',
        updatedAt: new Date(),
      })
      .where(and(
        eq(isoSignEnvelopes.id, envelopeId),
        eq(isoSignEnvelopes.organizationId, organizationId)
      ))
      .returning();

    for (const recipient of envelope.recipients) {
      if (recipient.role === 'signer' || recipient.role === 'approver') {
        const signingToken = this.generateSigningToken();
        const tokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        await db.update(isoSignRecipients)
          .set({
            status: 'sent',
            signingToken,
            signingTokenExpiresAt: tokenExpiry,
            lastNotificationSentAt: new Date(),
            notificationCount: 1,
            updatedAt: new Date(),
          })
          .where(and(
            eq(isoSignRecipients.id, recipient.id),
            eq(isoSignRecipients.organizationId, organizationId)
          ));

        await this.logEvent(envelopeId, organizationId, {
          eventType: 'recipient_sent',
          actorType: 'system',
          actorEmail: recipient.email,
          actorName: recipient.name,
          message: `Signing request sent to ${recipient.email}`,
          metadata: { recipientId: recipient.id },
        });
      }
    }

    await this.logEvent(envelopeId, organizationId, {
      eventType: 'envelope_sent',
      actorType: 'sender',
      actorEmail: envelope.senderEmail || undefined,
      actorName: envelope.senderName || undefined,
      message: `Envelope sent to ${envelope.recipients.length} recipient(s)`,
    });

    return updated;
  }

  async generateSigningUrl(recipientId: number, organizationId: string): Promise<string> {
    const [recipient] = await db.select()
      .from(isoSignRecipients)
      .where(and(
        eq(isoSignRecipients.id, recipientId),
        eq(isoSignRecipients.organizationId, organizationId)
      ))
      .limit(1);

    if (!recipient) {
      throw new Error('Recipient not found');
    }

    if (!recipient.signingToken || !recipient.signingTokenExpiresAt) {
      throw new Error('Signing token not generated');
    }

    if (new Date() > recipient.signingTokenExpiresAt) {
      throw new Error('Signing token expired');
    }

    const baseUrl = process.env.APP_URL || 'https://isohub.replit.app';
    return `${baseUrl}/sign/${recipient.recipientUuid}?token=${recipient.signingToken}`;
  }

  async validateSigningAccess(
    recipientUuid: string,
    token: string,
    accessCode?: string
  ): Promise<{ valid: boolean; recipient?: IsoSignRecipient; envelope?: IsoSignEnvelope }> {
    const [recipient] = await db.select()
      .from(isoSignRecipients)
      .where(eq(isoSignRecipients.recipientUuid, recipientUuid))
      .limit(1);

    if (!recipient) {
      return { valid: false };
    }

    if (recipient.signingToken !== token) {
      return { valid: false };
    }

    if (recipient.signingTokenExpiresAt && new Date() > recipient.signingTokenExpiresAt) {
      return { valid: false };
    }

    if (recipient.accessCode && accessCode) {
      const decryptedCode = EncryptionService.decrypt(recipient.accessCode);
      if (decryptedCode !== accessCode) {
        return { valid: false };
      }
    }

    const [envelope] = await db.select()
      .from(isoSignEnvelopes)
      .where(eq(isoSignEnvelopes.id, recipient.envelopeId))
      .limit(1);

    return { valid: true, recipient, envelope };
  }

  async recordSignature(
    recipientId: number,
    organizationId: string,
    signatureData: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<IsoSignRecipient> {
    await this.verifyRecipientOwnership(recipientId, organizationId);
    
    const encryptedSignature = EncryptionService.encrypt(signatureData);

    const [recipient] = await db.update(isoSignRecipients)
      .set({
        status: 'signed',
        signedAt: new Date(),
        signatureData: encryptedSignature,
        signatureIp: ipAddress,
        signatureUserAgent: userAgent,
        signingToken: null,
        signingTokenExpiresAt: null,
        updatedAt: new Date(),
      })
      .where(and(
        eq(isoSignRecipients.id, recipientId),
        eq(isoSignRecipients.organizationId, organizationId)
      ))
      .returning();

    await this.logEvent(recipient.envelopeId, organizationId, {
      eventType: 'recipient_signed',
      actorType: 'recipient',
      actorEmail: recipient.email,
      actorName: recipient.name,
      ipAddress,
      userAgent,
      message: `${recipient.name} signed the document`,
      metadata: { recipientId },
    });

    await this.checkEnvelopeCompletion(recipient.envelopeId, organizationId);

    return recipient;
  }

  async checkEnvelopeCompletion(envelopeId: number, organizationId: string): Promise<boolean> {
    await this.verifyEnvelopeOwnership(envelopeId, organizationId);
    
    const recipients = await db.select()
      .from(isoSignRecipients)
      .where(and(
        eq(isoSignRecipients.envelopeId, envelopeId),
        eq(isoSignRecipients.organizationId, organizationId),
        sql`${isoSignRecipients.role} IN ('signer', 'approver')`
      ));

    const allSigned = recipients.every(r => r.status === 'signed' || r.status === 'completed');

    if (allSigned && recipients.length > 0) {
      await db.update(isoSignEnvelopes)
        .set({
          status: 'completed',
          completedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(and(
          eq(isoSignEnvelopes.id, envelopeId),
          eq(isoSignEnvelopes.organizationId, organizationId)
        ));

      await this.logEvent(envelopeId, organizationId, {
        eventType: 'envelope_completed',
        actorType: 'system',
        message: 'All recipients have signed. Envelope completed.',
      });

      return true;
    }

    return false;
  }

  async voidEnvelope(
    envelopeId: number,
    organizationId: string,
    reason: string,
    actorUserId?: number,
    actorName?: string,
    actorEmail?: string
  ): Promise<IsoSignEnvelope> {
    const [envelope] = await db.update(isoSignEnvelopes)
      .set({
        status: 'voided',
        voidedAt: new Date(),
        voidReason: reason,
        updatedAt: new Date(),
      })
      .where(and(
        eq(isoSignEnvelopes.id, envelopeId),
        eq(isoSignEnvelopes.organizationId, organizationId)
      ))
      .returning();

    await this.logEvent(envelopeId, organizationId, {
      eventType: 'envelope_voided',
      actorType: 'sender',
      actorUserId,
      actorEmail,
      actorName,
      message: `Envelope voided: ${reason}`,
    });

    return envelope;
  }

  async logEvent(
    envelopeId: number,
    organizationId: string,
    data: {
      eventType: string;
      actorType: 'system' | 'sender' | 'recipient' | 'admin';
      recipientId?: number;
      documentId?: number;
      actorEmail?: string;
      actorName?: string;
      actorUserId?: number;
      ipAddress?: string;
      userAgent?: string;
      geoLocation?: any;
      metadata?: any;
      message?: string;
    }
  ): Promise<void> {
    const [lastEvent] = await db.select()
      .from(isoSignEvents)
      .where(eq(isoSignEvents.envelopeId, envelopeId))
      .orderBy(desc(isoSignEvents.id))
      .limit(1);

    const eventData = JSON.stringify({
      ...data,
      timestamp: new Date().toISOString(),
      previousHash: lastEvent?.eventHash,
    });
    const eventHash = this.generateHash(eventData);

    await db.insert(isoSignEvents).values({
      envelopeId,
      organizationId,
      eventType: data.eventType as any,
      actorType: data.actorType,
      recipientId: data.recipientId,
      documentId: data.documentId,
      actorEmail: data.actorEmail,
      actorName: data.actorName,
      actorUserId: data.actorUserId,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      geoLocation: data.geoLocation,
      metadata: data.metadata,
      message: data.message,
      previousEventHash: lastEvent?.eventHash,
      eventHash,
    });
  }

  async getAuditTrail(envelopeId: number, organizationId: string): Promise<any[]> {
    const events = await db.select()
      .from(isoSignEvents)
      .where(and(
        eq(isoSignEvents.envelopeId, envelopeId),
        eq(isoSignEvents.organizationId, organizationId)
      ))
      .orderBy(asc(isoSignEvents.createdAt));

    return events;
  }

  async getEnvelopeStats(organizationId: string): Promise<{
    draft: number;
    sent: number;
    inProgress: number;
    completed: number;
    declined: number;
    voided: number;
    expired: number;
  }> {
    const results = await db.select({
      status: isoSignEnvelopes.status,
      count: sql<number>`count(*)`,
    })
      .from(isoSignEnvelopes)
      .where(eq(isoSignEnvelopes.organizationId, organizationId))
      .groupBy(isoSignEnvelopes.status);

    const stats = {
      draft: 0,
      sent: 0,
      inProgress: 0,
      completed: 0,
      declined: 0,
      voided: 0,
      expired: 0,
    };

    for (const row of results) {
      const status = row.status;
      if (status === 'in_progress') {
        stats.inProgress = Number(row.count);
      } else if (status === 'draft') {
        stats.draft = Number(row.count);
      } else if (status === 'sent') {
        stats.sent = Number(row.count);
      } else if (status === 'completed') {
        stats.completed = Number(row.count);
      } else if (status === 'declined') {
        stats.declined = Number(row.count);
      } else if (status === 'voided') {
        stats.voided = Number(row.count);
      } else if (status === 'expired') {
        stats.expired = Number(row.count);
      }
    }

    return stats;
  }
}

export const isoSignService = new ISOSignService();

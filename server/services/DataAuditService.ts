import { db } from "../db";
import { monthlyAudits, validationErrors, uploadSessions, userCorrections } from "@shared/audit-schema";
import { eq, and, desc } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

export class DataAuditService {
  // Get monthly audit status for all processors
  async getMonthlyAuditStatus(year: number, month: string) {
    const processors = [
      'Payment Advisors', 'Clearent', 'Global Payments TSYS', 
      'Merchant Lynx', 'Micamp Solutions', 'First Data', 
      'Shift4', 'TRX', 'PayBright'
    ];

    const audits = await db
      .select()
      .from(monthlyAudits)
      .where(and(
        eq(monthlyAudits.year, year),
        eq(monthlyAudits.month, month)
      ));

    const auditMap = new Map(audits.map(audit => [audit.processor, audit]));

    return processors.map(processor => {
      const audit = auditMap.get(processor);
      return {
        processor,
        status: audit?.status || 'needs_upload',
        recordCount: audit?.recordCount || 0,
        totalRevenue: audit?.totalRevenue || '0.00',
        uploadDate: audit?.uploadDate,
        verificationDate: audit?.verificationDate,
        hasErrors: audit?.discrepancies ? (audit.discrepancies as any[]).length > 0 : false,
        auditId: audit?.id
      };
    });
  }

  // Create or update monthly audit
  async createOrUpdateAudit(auditData: {
    processor: string;
    month: string;
    year: number;
    recordCount?: number;
    totalRevenue?: string;
    status?: string;
    uploadedBy?: string;
  }) {
    const existingAudit = await db
      .select()
      .from(monthlyAudits)
      .where(and(
        eq(monthlyAudits.processor, auditData.processor),
        eq(monthlyAudits.month, auditData.month),
        eq(monthlyAudits.year, auditData.year)
      ))
      .limit(1);

    if (existingAudit.length > 0) {
      // Update existing audit
      const [updatedAudit] = await db
        .update(monthlyAudits)
        .set({
          ...auditData,
          updatedAt: new Date(),
          uploadDate: auditData.status === 'uploaded' ? new Date() : existingAudit[0].uploadDate
        })
        .where(eq(monthlyAudits.id, existingAudit[0].id))
        .returning();
      return updatedAudit;
    } else {
      // Create new audit
      const [newAudit] = await db
        .insert(monthlyAudits)
        .values({
          id: uuidv4(),
          ...auditData,
          uploadDate: auditData.status === 'uploaded' ? new Date() : undefined
        })
        .returning();
      return newAudit;
    }
  }

  // Create upload session for file validation
  async createUploadSession(sessionData: {
    filename: string;
    originalName: string;
    processor: string;
    month: string;
    fileSize: number;
    uploadedBy: string;
  }) {
    const [session] = await db
      .insert(uploadSessions)
      .values({
        id: uuidv4(),
        ...sessionData,
        processingStarted: new Date()
      })
      .returning();
    return session;
  }

  // Add validation errors
  async addValidationErrors(auditId: string, errors: Array<{
    errorType: string;
    severity: 'error' | 'warning' | 'info';
    fieldName?: string;
    expectedValue?: string;
    actualValue?: string;
    rowNumber?: number;
    errorMessage: string;
  }>) {
    const errorRecords = errors.map(error => ({
      id: uuidv4(),
      auditId,
      ...error
    }));

    await db.insert(validationErrors).values(errorRecords);
    return errorRecords;
  }

  // Get validation errors for an audit
  async getValidationErrors(auditId: string) {
    return await db
      .select()
      .from(validationErrors)
      .where(eq(validationErrors.auditId, auditId))
      .orderBy(desc(validationErrors.createdAt));
  }

  // Apply user correction
  async applyUserCorrection(correctionData: {
    sessionId: string;
    errorId: string;
    fieldName: string;
    originalValue?: string;
    correctedValue: string;
    correctionReason?: string;
    appliedBy: string;
  }) {
    // Record the correction
    const [correction] = await db
      .insert(userCorrections)
      .values({
        id: uuidv4(),
        ...correctionData
      })
      .returning();

    // Mark the validation error as resolved
    await db
      .update(validationErrors)
      .set({
        isResolved: true,
        userCorrection: correctionData.correctedValue,
        resolvedAt: new Date(),
        resolvedBy: correctionData.appliedBy
      })
      .where(eq(validationErrors.id, correctionData.errorId));

    return correction;
  }

  // Validate CSV data integrity
  async validateUploadData(sessionId: string, csvData: any[], processor: string) {
    const errors: any[] = [];
    const requiredFields = this.getRequiredFieldsForProcessor(processor);
    
    csvData.forEach((row, index) => {
      // Check required fields
      requiredFields.forEach(field => {
        if (!row[field] || row[field].toString().trim() === '') {
          errors.push({
            errorType: 'missing_field',
            severity: 'error' as const,
            fieldName: field,
            rowNumber: index + 1,
            errorMessage: `Required field '${field}' is missing or empty`
          });
        }
      });

      // Validate monetary amounts
      if (row.revenue && isNaN(parseFloat(row.revenue))) {
        errors.push({
          errorType: 'invalid_format',
          severity: 'error' as const,
          fieldName: 'revenue',
          actualValue: row.revenue,
          rowNumber: index + 1,
          errorMessage: 'Revenue must be a valid number'
        });
      }

      // Check for duplicate MIDs
      const duplicates = csvData.filter((r, i) => 
        i !== index && r.mid && r.mid === row.mid
      );
      if (duplicates.length > 0) {
        errors.push({
          errorType: 'duplicate_record',
          severity: 'warning' as const,
          fieldName: 'mid',
          actualValue: row.mid,
          rowNumber: index + 1,
          errorMessage: `Duplicate MID found: ${row.mid}`
        });
      }
    });

    // Update session with validation results
    await db
      .update(uploadSessions)
      .set({
        recordsProcessed: csvData.length,
        recordsValid: csvData.length - errors.filter(e => e.severity === 'error').length,
        recordsInvalid: errors.filter(e => e.severity === 'error').length,
        validationStatus: errors.length > 0 ? 'completed' : 'completed',
        processingCompleted: new Date(),
        errorSummary: errors.length > 0 ? errors : null
      })
      .where(eq(uploadSessions.id, sessionId));

    return {
      isValid: errors.filter(e => e.severity === 'error').length === 0,
      errors,
      totalRecords: csvData.length,
      validRecords: csvData.length - errors.filter(e => e.severity === 'error').length
    };
  }

  // Get required fields based on processor
  private getRequiredFieldsForProcessor(processor: string): string[] {
    const fieldMap: { [key: string]: string[] } = {
      'Clearent': ['mid', 'businessName', 'revenue', 'transactionCount'],
      'Global Payments TSYS': ['mid', 'businessName', 'revenue', 'volume'],
      'Payment Advisors': ['mid', 'businessName', 'revenue'],
      'TRX': ['mid', 'businessName', 'agentResidual'],
      'Shift4': ['mid', 'businessName', 'payoutAmount'],
      'default': ['mid', 'businessName', 'revenue']
    };

    return fieldMap[processor] || fieldMap['default'];
  }

  // Mark audit as verified by user
  async verifyAudit(auditId: string, verifiedBy: string, notes?: string) {
    const [updatedAudit] = await db
      .update(monthlyAudits)
      .set({
        status: 'verified',
        verificationDate: new Date(),
        verifiedBy,
        auditNotes: notes,
        updatedAt: new Date()
      })
      .where(eq(monthlyAudits.id, auditId))
      .returning();

    return updatedAudit;
  }

  // Get audit history for a processor
  async getAuditHistory(processor: string, limit: number = 12) {
    return await db
      .select()
      .from(monthlyAudits)
      .where(eq(monthlyAudits.processor, processor))
      .orderBy(desc(monthlyAudits.year), desc(monthlyAudits.month))
      .limit(limit);
  }
}

export const dataAuditService = new DataAuditService();
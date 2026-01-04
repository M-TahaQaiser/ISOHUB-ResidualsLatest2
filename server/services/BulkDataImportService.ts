import { db } from "../db";
import { monthlyData, merchants, processors, uploadProgress } from "../../shared/schema";
import { eq, and, sql } from "drizzle-orm";
import { parse } from "csv-parse/sync";
import * as fs from "fs";

interface ProcessorDataRow {
  mid?: string;
  merchantName?: string;
  dba?: string;
  income?: number;
  revenue?: number;
  sales?: number;
  commission?: number;
  [key: string]: any;
}

export class BulkDataImportService {
  
  /**
   * Process and import CSV data for a specific processor and month
   */
  static async importProcessorData(
    filePath: string,
    processorName: string,
    month: string,
    agencyId: number = 1
  ): Promise<{ success: boolean; recordsImported: number; errors: string[] }> {
    const errors: string[] = [];
    let recordsImported = 0;

    try {
      // Read and parse CSV file
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const records = parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        bom: true
      }) as ProcessorDataRow[];

      console.log(`Processing ${records.length} records for ${processorName} - ${month}`);

      // Find or create processor
      const processor = await this.findOrCreateProcessor(processorName);
      
      if (!processor) {
        throw new Error(`Failed to find or create processor: ${processorName}`);
      }

      // Process each record
      for (let i = 0; i < records.length; i++) {
        const record = records[i];
        
        try {
          // Extract MID from various possible column names
          const mid = this.extractMID(record);
          
          if (!mid) {
            errors.push(`Row ${i + 1}: Missing MID`);
            continue;
          }

          // Extract merchant name/DBA
          const merchantName = this.extractMerchantName(record);
          
          // Extract financial data
          const income = this.extractIncome(record);
          
          if (income === null || income === undefined) {
            errors.push(`Row ${i + 1}: Missing income/revenue data for MID ${mid}`);
            continue;
          }

          // Find or create merchant
          const merchant = await this.findOrCreateMerchant(mid, merchantName, agencyId);

          // Insert monthly data using raw SQL for better upsert control
          await db.execute(sql`
            INSERT INTO monthly_data (
              month, merchant_id, processor_id, income, agency_id, dba, created_at, updated_at
            ) VALUES (
              ${month}, ${merchant.id}, ${processor.id}, ${income.toString()}, ${agencyId}, ${merchantName}, NOW(), NOW()
            )
            ON CONFLICT (month, merchant_id, processor_id)
            DO UPDATE SET
              income = ${income.toString()},
              dba = ${merchantName},
              updated_at = NOW()
          `);

          recordsImported++;
        } catch (rowError: any) {
          errors.push(`Row ${i + 1}: ${rowError.message}`);
        }
      }

      // Update upload progress
      await this.updateUploadProgress(month, processor.id, processor.name, recordsImported);

      console.log(`✅ Imported ${recordsImported} records for ${processorName} - ${month}`);
      
      return {
        success: true,
        recordsImported,
        errors
      };

    } catch (error: any) {
      console.error(`Failed to import data for ${processorName}:`, error);
      return {
        success: false,
        recordsImported,
        errors: [error.message]
      };
    }
  }

  /**
   * Extract MID from various column name formats
   */
  private static extractMID(record: ProcessorDataRow): string | null {
    const midFields = [
      'MID', 'Mid', 'mid',
      'Merchant ID', 'MerchantID', 'Merchant_ID',
      'Account Number', 'AccountNumber', 'Account_Number',
      'DBA Number', 'DBANumber'
    ];

    for (const field of midFields) {
      if (record[field]) {
        return String(record[field]).trim();
      }
    }

    return null;
  }

  /**
   * Extract merchant name from various column formats
   */
  private static extractMerchantName(record: ProcessorDataRow): string {
    const nameFields = [
      'DBA', 'dba', 'Dba',
      'Merchant Name', 'MerchantName', 'Merchant_Name',
      'Business Name', 'BusinessName', 'Business_Name',
      'Legal Name', 'LegalName', 'Legal_Name',
      'Name', 'name'
    ];

    for (const field of nameFields) {
      if (record[field]) {
        return String(record[field]).trim();
      }
    }

    return 'Unknown Merchant';
  }

  /**
   * Extract income/revenue from various column formats
   */
  private static extractIncome(record: ProcessorDataRow): number | null {
    const incomeFields = [
      'Income', 'income',
      'Revenue', 'revenue',
      'Commission', 'commission',
      'Amount', 'amount',
      'Total', 'total',
      'Net Income', 'NetIncome', 'Net_Income',
      'Gross Income', 'GrossIncome', 'Gross_Income',
      'Residual', 'residual',
      'Payout', 'payout'
    ];

    for (const field of incomeFields) {
      if (record[field] !== undefined && record[field] !== null && record[field] !== '') {
        const value = String(record[field]).replace(/[$,]/g, '').trim();
        const parsed = parseFloat(value);
        if (!isNaN(parsed)) {
          return parsed;
        }
      }
    }

    return null;
  }

  /**
   * Find or create processor by name
   */
  private static async findOrCreateProcessor(name: string): Promise<{ id: number; name: string } | null> {
    try {
      // Try exact match first
      let result = await db.select()
        .from(processors)
        .where(eq(processors.name, name))
        .limit(1);

      if (result.length > 0) {
        return result[0];
      }

      // Try case-insensitive match
      result = await db.execute(sql`
        SELECT id, name FROM processors 
        WHERE LOWER(name) = LOWER(${name})
        LIMIT 1
      `) as any;

      if (result.rows && result.rows.length > 0) {
        return result.rows[0] as { id: number; name: string };
      }

      // Create new processor if not found
      const inserted = await db.insert(processors)
        .values({
          name,
          isActive: true,
          createdAt: new Date()
        })
        .returning();

      return inserted[0];
    } catch (error) {
      console.error(`Error finding/creating processor ${name}:`, error);
      return null;
    }
  }

  /**
   * Find or create merchant by MID
   */
  private static async findOrCreateMerchant(
    mid: string,
    merchantName: string,
    agencyId: number
  ): Promise<{ id: number; mid: string }> {
    try {
      // Try to find existing merchant
      let result = await db.select()
        .from(merchants)
        .where(and(
          eq(merchants.mid, mid),
          eq(merchants.agencyId, agencyId)
        ))
        .limit(1);

      if (result.length > 0) {
        return result[0];
      }

      // Create new merchant
      const inserted = await db.insert(merchants)
        .values({
          mid,
          dba: merchantName,
          legalName: merchantName,
          agencyId,
          isActive: true,
          createdAt: new Date()
        })
        .returning();

      return inserted[0];
    } catch (error: any) {
      console.error(`Error finding/creating merchant ${mid}:`, error);
      throw error;
    }
  }

  /**
   * Update upload progress for processor
   */
  private static async updateUploadProgress(
    month: string,
    processorId: number,
    processorName: string,
    recordCount: number
  ): Promise<void> {
    try {
      await db.execute(sql`
        INSERT INTO upload_progress (
          month, 
          processor_id, 
          processor_name, 
          upload_status, 
          lead_sheet_status,
          compilation_status,
          record_count,
          last_updated
        )
        VALUES (
          ${month}, 
          ${processorId}, 
          ${processorName}, 
          'validated',
          'validated',
          'compiled',
          ${recordCount},
          NOW()
        )
        ON CONFLICT (month, processor_id) 
        DO UPDATE SET 
          upload_status = 'validated',
          lead_sheet_status = 'validated',
          compilation_status = 'compiled',
          record_count = ${recordCount},
          last_updated = NOW()
      `);
    } catch (error) {
      console.error(`Error updating upload progress:`, error);
    }
  }

  /**
   * Bulk import multiple processor files
   */
  static async bulkImport(
    imports: Array<{
      filePath: string;
      processorName: string;
      month: string;
      agencyId?: number;
    }>
  ): Promise<{
    totalImported: number;
    results: Array<{
      processor: string;
      month: string;
      success: boolean;
      recordsImported: number;
      errors: string[];
    }>;
  }> {
    const results = [];
    let totalImported = 0;

    for (const importConfig of imports) {
      console.log(`\n📊 Processing ${importConfig.processorName} - ${importConfig.month}...`);
      
      const result = await this.importProcessorData(
        importConfig.filePath,
        importConfig.processorName,
        importConfig.month,
        importConfig.agencyId || 1
      );

      results.push({
        processor: importConfig.processorName,
        month: importConfig.month,
        ...result
      });

      totalImported += result.recordsImported;
    }

    return {
      totalImported,
      results
    };
  }
}

import { parse } from 'csv-parse/sync';
import { InsertMerchant, InsertMonthlyData } from '@shared/schema';

export interface CSVRecord {
  [key: string]: string;
}

export interface ProcessorData {
  merchantId: string;
  merchantName: string;
  transactions: number;
  salesAmount: string;
  income: string;
  expenses: string;
  net: string;
  bps: string;
  percentage: string;
  agentNet: string;
  approvalDate?: string;
  groupCode?: string;
}

export interface LeadData {
  merchantId: string;
  legalName?: string;
  dba?: string;
  branchNumber?: string;
  status?: string;
  statusCategory?: string;
  currentProcessor?: string;
  partnerName?: string;
  salesReps?: string;
  assignedUsers?: string;
}

export class CSVParser {
  // Generic CSV parser that returns raw records
  static parseCSV(csvContent: string): CSVRecord[] {
    try {
      const records: CSVRecord[] = parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        relax_quotes: true,
        relax_column_count: true,
      });
      return records;
    } catch (error: any) {
      throw new Error(`Failed to parse CSV: ${error.message}`);
    }
  }

  static parseProcessorFile(csvContent: string, processorName: string): ProcessorData[] {
    try {
      // Find the header row (contains "Merchant ID" or "MID")
      const lines = csvContent.split(/\r?\n/);
      const headerIndex = lines.findIndex(line => {
        const cleanLine = line.toLowerCase().trim();
        return cleanLine.includes('merchant id') && cleanLine.includes('transactions');
      });
      
      if (headerIndex === -1) {
        throw new Error('Could not find header row with expected columns in CSV file');
      }
      
      // Extract CSV content starting from header row, ensuring clean line endings
      const processedLines = lines.slice(headerIndex).filter(line => line.trim().length > 0);
      const processedContent = processedLines.join('\n');
      
      const records: CSVRecord[] = parse(processedContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        relax_quotes: true,
        relax_column_count: true,
      });

      return records.map(record => {
        // Handle different CSV formats based on processor
        const merchantId = record['Merchant ID'] || record['MID'] || record['Merchant_ID'] || '';
        const merchantName = record['Merchant'] || record['Merchant Name'] || record['DBA'] || '';
        
        return {
          merchantId: merchantId.toString().trim(),
          merchantName: merchantName.trim(),
          transactions: parseInt(record['Transactions'] || '0') || 0,
          salesAmount: this.cleanCurrency(record['Sales Amount'] || '0'),
          income: this.cleanCurrency(record['Income'] || '0'),
          expenses: this.cleanCurrency(record['Expenses'] || '0'),
          net: this.cleanCurrency(record['Net'] || '0'),
          bps: record['BPS'] || '0',
          percentage: record['%'] || '0',
          agentNet: this.cleanCurrency(record['Agent Net'] || '0'),
          approvalDate: record['Approval Date'],
          groupCode: record['Group'] || record['Group Code'],
        };
      });
    } catch (error: any) {
      throw new Error(`Failed to parse processor CSV: ${error.message}`);
    }
  }

  static parseLeadSheet(csvContent: string): LeadData[] {
    try {
      const records: CSVRecord[] = parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });

      return records.map(record => ({
        merchantId: (record['Existing MID'] || record['MID'] || '').toString().trim(),
        legalName: record['Legal Name'] || '',
        dba: record['DBA'] || '',
        branchNumber: record['Partner Branch Number'] || record['Branch Number'] || '',
        status: record['Status'] || '',
        statusCategory: record['Status Category'] || '',
        currentProcessor: record['Current Processor'] || '',
        partnerName: record['Partner Name'] || '',
        salesReps: record['Sales Reps'] || '',
        assignedUsers: record['Assigned Users'] || '',
      }));
    } catch (error: any) {
      throw new Error(`Failed to parse lead sheet CSV: ${error.message}`);
    }
  }

  static createMerchantFromLead(leadData: LeadData): InsertMerchant {
    return {
      mid: leadData.merchantId,
      legalName: leadData.legalName || null,
      dba: leadData.dba || null,
      branchNumber: leadData.branchNumber || null,
      status: leadData.status || null,
      statusCategory: leadData.statusCategory || null,
      currentProcessor: leadData.currentProcessor || null,
      partnerName: leadData.partnerName || null,
    };
  }

  static createMonthlyData(
    processorData: ProcessorData, 
    merchantId: number, 
    processorId: number, 
    month: string
  ): InsertMonthlyData {
    return {
      merchantId,
      processorId,
      month,
      transactions: processorData.transactions,
      salesAmount: processorData.salesAmount,
      income: processorData.income,
      expenses: processorData.expenses,
      net: processorData.net,
      bps: processorData.bps,
      percentage: processorData.percentage,
      repNet: processorData.agentNet, // Map agentNet to repNet
      approvalDate: processorData.approvalDate ? new Date(processorData.approvalDate) : null,
      groupCode: processorData.groupCode || null,
    };
  }

  static cleanCurrency(value: string): string {
    // Remove currency symbols, commas, and handle negative values
    return value.replace(/[$,]/g, '').trim();
  }

  static validateMID(mid: string): boolean {
    // Basic MID validation - should be numeric and reasonable length
    const cleaned = mid.replace(/\D/g, '');
    return cleaned.length >= 8 && cleaned.length <= 20;
  }

  static normalizeMID(mid: string): string {
    // Remove any non-numeric characters and standardize format
    return mid.replace(/\D/g, '');
  }
}

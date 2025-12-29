// Processor Column Mapping Service
// Maps processor-specific CSV column headers to standardized master dataset fields

export interface StandardFields {
  mid: string;
  merchantName: string;
  merchantDba?: string;
  processorId: string;
  processorName: string;
  month: string;
  year: string;
  volume: number;
  transactions: number;
  grossRevenue: number;
  netRevenue: number;
  interchange?: number;
  processingFees?: number;
  otherFees?: number;
  branchId?: string;
  agentId?: string;
  partnerId?: string;
  salesManagerId?: string;
  status?: string;
  notes?: string;
}

// Define processor-specific column mappings
export const processorMappings: Record<string, Record<string, string>> = {
  'clearent': {
    'Merchant ID': 'mid',
    'MID': 'mid',
    'Merchant Number': 'mid',
    'Merchant': 'merchantName',
    'Merchant Name': 'merchantName',
    'Business Name': 'merchantName',
    'DBA': 'merchantDba',
    'DBA Name': 'merchantDba',
    'Sales Amount': 'volume',
    'Volume': 'volume',
    'Sales Volume': 'volume',
    'Transactions': 'transactions',
    'Transaction Count': 'transactions',
    'Income': 'grossRevenue',
    'Gross Revenue': 'grossRevenue',
    'Total Revenue': 'grossRevenue',
    'Net': 'netRevenue',
    'Net Revenue': 'netRevenue',
    'Net Income': 'netRevenue',
    'Agent Net': 'netRevenue',
    'Residual Amount': 'netRevenue',
    'Expenses': 'expenses',
    'Interchange': 'interchange',
    'Processing Fees': 'processingFees',
    'Fees': 'processingFees',
    'Branch': 'branchId',
    'Branch ID': 'branchId',
    'Group': 'agentId',
    'Agent': 'agentId',
    'Partner': 'partnerId',
    'Status': 'status',
    'Approval Date': 'approvalDate',
    'BPS': 'bps',
    '%': 'percentage'
  },
  'first-data': {
    'MID Number': 'mid',
    'Merchant ID': 'mid',
    'Merchant': 'merchantName',
    'Legal Name': 'merchantName',
    'DBA': 'merchantDba',
    'Monthly Volume': 'volume',
    'Trans Count': 'transactions',
    'Revenue': 'grossRevenue',
    'Net Amount': 'netRevenue',
    'Commission': 'netRevenue',
    'Branch Code': 'branchId',
    'Agent ID': 'agentId',
    'Partner ID': 'partnerId',
    'Active': 'status'
  },
  'global-payments-tsys': {
    'Merchant Number': 'mid',
    'MID': 'mid',
    'Name': 'merchantName',
    'DBA Name': 'merchantDba',
    'Volume Amount': 'volume',
    'Transaction Volume': 'volume',
    'Number of Transactions': 'transactions',
    'Gross Income': 'grossRevenue',
    'Net Income': 'netRevenue',
    'Residual': 'netRevenue',
    'Branch Number': 'branchId',
    'Agent Number': 'agentId',
    'Status Code': 'status'
  },
  'merchant-lynx': {
    'MID': 'mid',
    'Merchant ID': 'mid',
    'Business Name': 'merchantName',
    'DBA': 'merchantDba',
    'Processing Volume': 'volume',
    'Transaction Count': 'transactions',
    'Total Revenue': 'grossRevenue',
    'Net Revenue': 'netRevenue',
    'Branch': 'branchId',
    'Agent': 'agentId',
    'Partner': 'partnerId'
  },
  'micamp-solutions': {
    'Merchant ID': 'mid',
    'Merchant': 'merchantName',
    'Merchant Name': 'merchantName',
    'DBA Name': 'merchantDba',
    'Sales Amount': 'volume',
    'Monthly Volume': 'volume',
    'Transactions': 'transactions',
    'Income': 'grossRevenue',
    'Gross Revenue': 'grossRevenue',
    'Expenses': 'expenses',
    'Net': 'netRevenue',
    'Net Revenue': 'netRevenue',
    'Agent Net': 'netRevenue',
    'BPS': 'bps',
    '%': 'percentage',
    'Approval Date': 'approvalDate',
    'Group': 'agentId',
    'Branch ID': 'branchId',
    'Agent ID': 'agentId'
  },
  'payment-advisors': {
    'MID': 'mid',
    'Merchant': 'merchantName',
    'DBA': 'merchantDba',
    'Volume': 'volume',
    'Trans': 'transactions',
    'Revenue': 'grossRevenue',
    'Net': 'netRevenue',
    'Branch': 'branchId',
    'Agent': 'agentId'
  },
  'shift4': {
    'Merchant ID': 'mid',
    'Business Name': 'merchantName',
    'DBA Name': 'merchantDba',
    'Total Volume': 'volume',
    'Total Transactions': 'transactions',
    'Gross Amount': 'grossRevenue',
    'Net Amount': 'netRevenue',
    'Branch Code': 'branchId',
    'Agent Code': 'agentId',
    'Partner Code': 'partnerId'
  }
};

export class ProcessorMappingService {
  /**
   * Get the mapping for a specific processor
   */
  static getProcessorMapping(processorId: string): Record<string, string> {
    const normalizedId = processorId.toLowerCase().replace(/\s+/g, '-');
    return processorMappings[normalizedId] || {};
  }

  /**
   * Map processor-specific data to standard fields
   */
  static mapProcessorData(
    processorId: string,
    rawData: Record<string, any>,
    month: string,
    year: string
  ): StandardFields {
    const mapping = this.getProcessorMapping(processorId);
    const mapped: Partial<StandardFields> = {
      processorId,
      processorName: processorId,
      month,
      year
    };

    // Map each field using the processor's mapping
    for (const [sourceColumn, value] of Object.entries(rawData)) {
      const targetField = mapping[sourceColumn];
      if (targetField && value !== undefined && value !== null && value !== '') {
        // Handle numeric fields
        if (['volume', 'transactions', 'grossRevenue', 'netRevenue', 'interchange', 'processingFees', 'otherFees'].includes(targetField)) {
          // Clean the value: remove $, commas, and other non-numeric characters
          const cleanValue = String(value).replace(/[$,]/g, '').trim();
          const numericValue = parseFloat(cleanValue);
          if (!isNaN(numericValue)) {
            (mapped as any)[targetField] = numericValue;
          }
        } else {
          // String fields
          (mapped as any)[targetField] = String(value).trim();
        }
      }
    }

    // Ensure required fields have defaults
    return {
      mid: mapped.mid || 'UNKNOWN',
      merchantName: mapped.merchantName || 'Unknown Merchant',
      processorId: mapped.processorId!,
      processorName: mapped.processorName!,
      month: mapped.month!,
      year: mapped.year!,
      volume: mapped.volume || 0,
      transactions: mapped.transactions || 0,
      grossRevenue: mapped.grossRevenue || 0,
      netRevenue: mapped.netRevenue || 0,
      ...mapped
    } as StandardFields;
  }

  /**
   * Find the best matching column for a standard field
   */
  static findColumnForField(
    headers: string[],
    processorId: string,
    standardField: string
  ): string | null {
    const mapping = this.getProcessorMapping(processorId);
    
    // Find which source column maps to this standard field
    for (const [sourceColumn, targetField] of Object.entries(mapping)) {
      if (targetField === standardField) {
        // Check if this column exists in the headers (case-insensitive)
        const matchedHeader = headers.find(h => 
          h.toLowerCase().trim() === sourceColumn.toLowerCase().trim()
        );
        if (matchedHeader) {
          return matchedHeader;
        }
      }
    }
    
    return null;
  }

  /**
   * Auto-detect processor type from column headers
   */
  static detectProcessorType(headers: string[]): string | null {
    const normalizedHeaders = headers.map(h => h.toLowerCase().trim());
    let bestMatch: { processor: string; score: number } | null = null;

    for (const [processorId, mapping] of Object.entries(processorMappings)) {
      let matchScore = 0;
      const mappingKeys = Object.keys(mapping).map(k => k.toLowerCase().trim());
      
      for (const header of normalizedHeaders) {
        if (mappingKeys.includes(header)) {
          matchScore++;
        }
      }

      if (!bestMatch || matchScore > bestMatch.score) {
        bestMatch = { processor: processorId, score: matchScore };
      }
    }

    // Return processor if we have at least 3 matching columns
    return bestMatch && bestMatch.score >= 3 ? bestMatch.processor : null;
  }

  /**
   * Validate that required fields are present in the mapping
   */
  static validateMapping(
    headers: string[],
    processorId: string
  ): { isValid: boolean; missingFields: string[] } {
    const requiredFields = ['mid', 'merchantName', 'netRevenue'];
    const missingFields: string[] = [];

    for (const field of requiredFields) {
      const column = this.findColumnForField(headers, processorId, field);
      if (!column) {
        missingFields.push(field);
      }
    }

    return {
      isValid: missingFields.length === 0,
      missingFields
    };
  }

  /**
   * Process a batch of rows from a CSV/Excel file
   */
  static processBatch(
    rows: Record<string, any>[],
    processorId: string,
    month: string,
    year: string
  ): StandardFields[] {
    return rows.map(row => this.mapProcessorData(processorId, row, month, year));
  }
}
import { z } from 'zod';

export interface ValidationError {
  row: number;
  column: string;
  value: any;
  error: string;
  severity: 'error' | 'warning' | 'info';
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  summary: {
    totalRows: number;
    validRows: number;
    errorRows: number;
    warningRows: number;
  };
}

// Processor-specific validation schemas
const processorSchemas = {
  'Payment Advisors': z.object({
    'Merchant Name': z.string().min(1, 'Merchant name is required'),
    'MID': z.string().regex(/^\d+$/, 'MID must be numeric'),
    'Amount': z.number().positive('Amount must be positive'),
    'Date': z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD format')
  }),
  
  'Clearent': z.object({
    'Merchant': z.string().min(1, 'Merchant name is required'),
    'MID': z.string().regex(/^\d+$/, 'MID must be numeric'),
    'Residual': z.number().positive('Residual must be positive'),
    'Processing Date': z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/, 'Date must be MM/DD/YYYY format')
  }),
  
  'Global Payments TSYS': z.object({
    'DBA Name': z.string().min(1, 'DBA name is required'),
    'Merchant ID': z.string().regex(/^\d+$/, 'Merchant ID must be numeric'),
    'Net Amount': z.number().positive('Net amount must be positive'),
    'Statement Date': z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/, 'Date must be MM/DD/YYYY format')
  }),
  
  'Merchant Lynx': z.object({
    'Business Name': z.string().min(1, 'Business name is required'),
    'MID': z.string().regex(/^\d+$/, 'MID must be numeric'),
    'Commission': z.number().positive('Commission must be positive'),
    'Date': z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD format')
  }),
  
  'Shift4': z.object({
    'Merchant Name': z.string().min(1, 'Merchant name is required'),
    'MID': z.string().regex(/^\d+$/, 'MID must be numeric'),
    'Payout Amount': z.number().positive('Payout amount must be positive'),
    'Date': z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD format')
  })
};

export class DataValidationService {
  
  static validateProcessorData(processor: string, data: any[]): ValidationResult {
    const schema = processorSchemas[processor as keyof typeof processorSchemas];
    if (!schema) {
      return {
        isValid: false,
        errors: [{ row: 0, column: 'processor', value: processor, error: 'Unsupported processor type', severity: 'error' }],
        warnings: [],
        summary: { totalRows: 0, validRows: 0, errorRows: 1, warningRows: 0 }
      };
    }

    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    let validRows = 0;

    data.forEach((row, index) => {
      try {
        // Basic validation
        const result = schema.safeParse(row);
        if (!result.success) {
          result.error.errors.forEach(err => {
            errors.push({
              row: index + 1,
              column: err.path.join('.'),
              value: row[err.path[0]],
              error: err.message,
              severity: 'error'
            });
          });
        } else {
          validRows++;
          
          // Advanced business logic validation
          this.performBusinessValidation(processor, row, index + 1, warnings);
        }
      } catch (error) {
        errors.push({
          row: index + 1,
          column: 'general',
          value: JSON.stringify(row),
          error: 'Row parsing error',
          severity: 'error'
        });
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      summary: {
        totalRows: data.length,
        validRows,
        errorRows: data.length - validRows,
        warningRows: warnings.length
      }
    };
  }

  private static performBusinessValidation(
    processor: string, 
    row: any, 
    rowIndex: number, 
    warnings: ValidationError[]
  ): void {
    // Amount validation
    const amountFields = ['Amount', 'Residual', 'Net Amount', 'Commission', 'Payout Amount'];
    const amountField = amountFields.find(field => row[field] !== undefined);
    
    if (amountField && row[amountField]) {
      const amount = parseFloat(row[amountField]);
      
      // Warning for unusually high amounts
      if (amount > 10000) {
        warnings.push({
          row: rowIndex,
          column: amountField,
          value: amount,
          error: 'Unusually high amount - please verify',
          severity: 'warning'
        });
      }
      
      // Warning for very low amounts
      if (amount < 1) {
        warnings.push({
          row: rowIndex,
          column: amountField,
          value: amount,
          error: 'Very low amount - may indicate data issue',
          severity: 'warning'
        });
      }
    }

    // MID validation
    const midFields = ['MID', 'Merchant ID'];
    const midField = midFields.find(field => row[field] !== undefined);
    
    if (midField && row[midField]) {
      const mid = row[midField].toString();
      
      // Warning for short MIDs
      if (mid.length < 6) {
        warnings.push({
          row: rowIndex,
          column: midField,
          value: mid,
          error: 'MID appears too short - typical MIDs are 6+ digits',
          severity: 'warning'
        });
      }
    }

    // Date validation
    const dateFields = ['Date', 'Processing Date', 'Statement Date'];
    const dateField = dateFields.find(field => row[field] !== undefined);
    
    if (dateField && row[dateField]) {
      const dateStr = row[dateField].toString();
      const parsedDate = new Date(dateStr);
      const now = new Date();
      
      // Warning for future dates
      if (parsedDate > now) {
        warnings.push({
          row: rowIndex,
          column: dateField,
          value: dateStr,
          error: 'Future date detected - please verify',
          severity: 'warning'
        });
      }
      
      // Warning for very old dates (older than 2 years)
      const twoYearsAgo = new Date();
      twoYearsAgo.setFullYear(now.getFullYear() - 2);
      
      if (parsedDate < twoYearsAgo) {
        warnings.push({
          row: rowIndex,
          column: dateField,
          value: dateStr,
          error: 'Very old date - may be historical data',
          severity: 'info'
        });
      }
    }
  }

  static generateValidationReport(result: ValidationResult): string {
    let report = `Validation Summary:
    Total Rows: ${result.summary.totalRows}
    Valid Rows: ${result.summary.validRows}
    Error Rows: ${result.summary.errorRows}
    Warning Rows: ${result.summary.warningRows}
    
    Overall Status: ${result.isValid ? 'PASSED' : 'FAILED'}
    `;

    if (result.errors.length > 0) {
      report += '\n\nERRORS:\n';
      result.errors.forEach(error => {
        report += `Row ${error.row}, Column ${error.column}: ${error.error} (Value: ${error.value})\n`;
      });
    }

    if (result.warnings.length > 0) {
      report += '\n\nWARNINGS:\n';
      result.warnings.forEach(warning => {
        report += `Row ${warning.row}, Column ${warning.column}: ${warning.error} (Value: ${warning.value})\n`;
      });
    }

    return report;
  }
}
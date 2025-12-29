import { CSVParser } from '../csvParser';

describe('CSVParser - Bug Fixes', () => {
  describe('Bug #1: Flexible Header Detection', () => {
    test('Should accept "MID" instead of "Merchant ID"', () => {
      const csv = `MID,Merchant Name,Transactions,Sales Amount,Income,Expenses,Net,BPS,%,Agent Net
123456789,Test Merchant,100,$5000.00,$250.00,$50.00,$200.00,50,2.5,$125.00`;
      
      const result = CSVParser.parseProcessorFile(csv, 'Test Processor');
      
      expect(result).toHaveLength(1);
      expect(result[0].merchantId).toBe('123456789');
      expect(result[0].merchantName).toBe('Test Merchant');
      expect(result[0].transactions).toBe(100);
    });

    test('Should accept "Total Transactions" instead of "Transactions"', () => {
      const csv = `Merchant ID,Merchant Name,Total Transactions,Sales Amount,Income,Expenses,Net,BPS,%,Agent Net
123456789,Test Merchant,100,$5000.00,$250.00,$50.00,$200.00,50,2.5,$125.00`;
      
      const result = CSVParser.parseProcessorFile(csv, 'Test Processor');
      
      expect(result).toHaveLength(1);
      expect(result[0].transactions).toBe(100);
    });

    test('Should accept "Merchant_ID" (underscore variant)', () => {
      const csv = `Merchant_ID,Merchant Name,Transactions,Sales Amount,Income,Expenses,Net,BPS,%,Agent Net
123456789,Test Merchant,100,$5000.00,$250.00,$50.00,$200.00,50,2.5,$125.00`;
      
      const result = CSVParser.parseProcessorFile(csv, 'Test Processor');
      
      expect(result).toHaveLength(1);
      expect(result[0].merchantId).toBe('123456789');
    });

    test('Should accept "MerchantID" (no space)', () => {
      const csv = `MerchantID,Merchant Name,Transactions,Sales Amount,Income,Expenses,Net,BPS,%,Agent Net
123456789,Test Merchant,100,$5000.00,$250.00,$50.00,$200.00,50,2.5,$125.00`;
      
      const result = CSVParser.parseProcessorFile(csv, 'Test Processor');
      
      expect(result).toHaveLength(1);
      expect(result[0].merchantId).toBe('123456789');
    });

    test('Should reject CSV without MID column', () => {
      const csv = `Name,Count,Amount
Test,100,$5000.00`;
      
      expect(() => {
        CSVParser.parseProcessorFile(csv, 'Test Processor');
      }).toThrow(/Could not find header row/);
    });

    test('Should reject CSV without transaction column', () => {
      const csv = `MID,Merchant Name,Amount
123456789,Test Merchant,$5000.00`;
      
      expect(() => {
        CSVParser.parseProcessorFile(csv, 'Test Processor');
      }).toThrow(/Could not find header row/);
    });
  });

  describe('Bug #2: Currency Parser with Accounting Negatives', () => {
    test('Should convert accounting negative (1,234.56) to -1234.56', () => {
      const result = CSVParser.cleanCurrency('(1,234.56)');
      expect(result).toBe('-1234.56');
    });

    test('Should handle positive currency $1,234.56 → 1234.56', () => {
      const result = CSVParser.cleanCurrency('$1,234.56');
      expect(result).toBe('1234.56');
    });

    test('Should handle negative with minus sign -$1,234.56 → -1234.56', () => {
      const result = CSVParser.cleanCurrency('-$1,234.56');
      expect(result).toBe('-1234.56');
    });

    test('Should handle accounting negative with dollar sign ($1,234.56) → -1234.56', () => {
      const result = CSVParser.cleanCurrency('($1,234.56)');
      expect(result).toBe('-1234.56');
    });

    test('Should handle plain number 1234.56 → 1234.56', () => {
      const result = CSVParser.cleanCurrency('1234.56');
      expect(result).toBe('1234.56');
    });

    test('Should handle zero (0.00) → 0', () => {
      const result = CSVParser.cleanCurrency('(0.00)');
      expect(result).toBe('0');
    });

    test('Should handle empty string → 0', () => {
      const result = CSVParser.cleanCurrency('');
      expect(result).toBe('0');
    });

    test('Should handle whitespace → 0', () => {
      const result = CSVParser.cleanCurrency('   ');
      expect(result).toBe('0');
    });

    test('Should preserve decimal precision', () => {
      const result = CSVParser.cleanCurrency('(1,234.567)');
      expect(result).toBe('-1234.567');
    });

    test('Full CSV parsing with accounting negatives', () => {
      const csv = `MID,Merchant Name,Transactions,Sales Amount,Income,Expenses,Net,BPS,%,Agent Net
123456789,Test Merchant,100,$5000.00,$250.00,($50.00),($200.00),50,2.5,$125.00`;
      
      const result = CSVParser.parseProcessorFile(csv, 'Test Processor');
      
      expect(result).toHaveLength(1);
      expect(result[0].expenses).toBe('-50.00'); // Accounting negative converted
      expect(result[0].net).toBe('-200.00'); // Accounting negative converted
      expect(result[0].income).toBe('250.00'); // Positive unchanged
    });
  });

  describe('Edge Cases and Integration', () => {
    test('Should handle CSV with extra whitespace', () => {
      const csv = `  MID  ,  Merchant Name  ,  Transactions  ,  Sales Amount  ,  Income  ,  Expenses  ,  Net  ,  BPS  ,  %  ,  Agent Net  
  123456789  ,  Test Merchant  ,  100  ,  $5000.00  ,  $250.00  ,  $50.00  ,  $200.00  ,  50  ,  2.5  ,  $125.00  `;
      
      const result = CSVParser.parseProcessorFile(csv, 'Test Processor');
      
      expect(result).toHaveLength(1);
      expect(result[0].merchantId).toBe('123456789');
      expect(result[0].merchantName).toBe('Test Merchant');
    });

    test('Should handle multiple rows with mixed positive/negative values', () => {
      const csv = `MID,Merchant Name,Transactions,Sales Amount,Income,Expenses,Net,BPS,%,Agent Net
123456789,Merchant A,100,$5000.00,$250.00,$50.00,$200.00,50,2.5,$125.00
987654321,Merchant B,50,($2000.00),($100.00),$30.00,($130.00),40,2.0,($65.00)`;
      
      const result = CSVParser.parseProcessorFile(csv, 'Test Processor');
      
      expect(result).toHaveLength(2);
      
      // First row - all positive
      expect(result[0].merchantId).toBe('123456789');
      expect(result[0].salesAmount).toBe('5000.00');
      expect(result[0].income).toBe('250.00');
      
      // Second row - mixed negatives
      expect(result[1].merchantId).toBe('987654321');
      expect(result[1].salesAmount).toBe('-2000.00'); // Accounting negative
      expect(result[1].income).toBe('-100.00'); // Accounting negative
      expect(result[1].expenses).toBe('30.00'); // Positive
      expect(result[1].net).toBe('-130.00'); // Accounting negative
    });

    test('Should handle CSV with rows before header (metadata rows)', () => {
      const csv = `Report Generated: 2024-01-15
Processor: Test Processor
Total Merchants: 2

MID,Merchant Name,Transactions,Sales Amount,Income,Expenses,Net,BPS,%,Agent Net
123456789,Test Merchant,100,$5000.00,$250.00,$50.00,$200.00,50,2.5,$125.00`;
      
      const result = CSVParser.parseProcessorFile(csv, 'Test Processor');
      
      expect(result).toHaveLength(1);
      expect(result[0].merchantId).toBe('123456789');
    });
  });

  describe('MID Validation', () => {
    test('Should validate numeric MID with 8-20 digits', () => {
      expect(CSVParser.validateMID('12345678')).toBe(true); // 8 digits
      expect(CSVParser.validateMID('12345678901234567890')).toBe(true); // 20 digits
      expect(CSVParser.validateMID('123456789012345')).toBe(true); // 15 digits
    });

    test('Should reject MID with less than 8 digits', () => {
      expect(CSVParser.validateMID('1234567')).toBe(false); // 7 digits
      expect(CSVParser.validateMID('123')).toBe(false); // 3 digits
    });

    test('Should reject MID with more than 20 digits', () => {
      expect(CSVParser.validateMID('123456789012345678901')).toBe(false); // 21 digits
    });

    test('Should handle MID with hyphens/spaces (strips them)', () => {
      expect(CSVParser.validateMID('1234-5678-9012')).toBe(true); // 12 digits after cleaning
      expect(CSVParser.validateMID('1234 5678 9012')).toBe(true); // 12 digits after cleaning
    });
  });

  describe('MID Normalization', () => {
    test('Should normalize MID by removing all non-numeric characters', () => {
      expect(CSVParser.normalizeMID('1234-5678-9012')).toBe('123456789012');
      expect(CSVParser.normalizeMID('1234 5678 9012')).toBe('123456789012');
      expect(CSVParser.normalizeMID('MID-1234-5678')).toBe('12345678');
      expect(CSVParser.normalizeMID('12345678')).toBe('12345678');
    });
  });
});

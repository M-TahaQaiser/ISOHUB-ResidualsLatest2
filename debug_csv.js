import fs from 'fs';
import { parse } from 'csv-parse';

// CSV validation and processing utility
export class CSVValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.stats = {
      totalRows: 0,
      validRows: 0,
      invalidRows: 0,
      missingData: 0,
      totalRevenue: 0
    };
  }

  async validateClearentCSV(filePath) {
    return new Promise((resolve, reject) => {
      const results = [];
      const parser = parse({
        columns: true,
        skip_empty_lines: true,
        trim: true
      });

      parser.on('readable', function() {
        let record;
        while (record = parser.read()) {
          results.push(record);
        }
      });

      parser.on('error', (err) => {
        this.errors.push(`CSV parsing error: ${err.message}`);
        reject(err);
      });

      parser.on('end', () => {
        this.processRecords(results);
        resolve(this.generateReport(results));
      });

      if (fs.existsSync(filePath)) {
        fs.createReadStream(filePath).pipe(parser);
      } else {
        reject(new Error(`File not found: ${filePath}`));
      }
    });
  }

  processRecords(records) {
    this.stats.totalRows = records.length;
    
    records.forEach((record, index) => {
      const rowNum = index + 2; // Account for header row
      
      // Check required fields
      const merchantId = record['Merchant ID'] || record['MID'];
      const merchantName = record['Merchant'];
      const net = record['Net'];
      const sales = record['Sales Amount'];

      if (!merchantId || merchantId.trim() === '') {
        this.errors.push(`Row ${rowNum}: Missing Merchant ID`);
        this.stats.invalidRows++;
        return;
      }

      if (!merchantName || merchantName.trim() === '') {
        this.errors.push(`Row ${rowNum}: Missing Merchant Name`);
        this.stats.invalidRows++;
        return;
      }

      // Validate numeric fields
      const netValue = parseFloat(net || '0');
      const salesValue = parseFloat(sales || '0');
      
      if (isNaN(netValue)) {
        this.warnings.push(`Row ${rowNum}: Invalid Net value: ${net}`);
      } else {
        this.stats.totalRevenue += netValue;
      }

      if (isNaN(salesValue)) {
        this.warnings.push(`Row ${rowNum}: Invalid Sales Amount: ${sales}`);
      }

      // Check for missing optional data
      if (!record['Transactions'] || record['Transactions'] === '') {
        this.stats.missingData++;
      }

      this.stats.validRows++;
    });
  }

  generateReport(records) {
    const report = {
      summary: {
        totalRows: this.stats.totalRows,
        validRows: this.stats.validRows,
        invalidRows: this.stats.invalidRows,
        successRate: ((this.stats.validRows / this.stats.totalRows) * 100).toFixed(2) + '%',
        totalRevenue: this.stats.totalRevenue.toFixed(2),
        missingOptionalData: this.stats.missingData
      },
      errors: this.errors,
      warnings: this.warnings.slice(0, 10), // First 10 warnings
      sampleRecords: records.slice(0, 5).map(record => ({
        merchantId: record['Merchant ID'],
        merchant: record['Merchant'],
        net: record['Net'],
        sales: record['Sales Amount'],
        transactions: record['Transactions']
      })),
      duplicateCheck: this.findDuplicates(records),
      revenueValidation: this.validateRevenue(records)
    };

    return report;
  }

  findDuplicates(records) {
    const merchantIds = records.map(r => r['Merchant ID']).filter(Boolean);
    const duplicates = merchantIds.filter((item, index) => merchantIds.indexOf(item) !== index);
    return [...new Set(duplicates)]; // Remove duplicates from duplicates list
  }

  validateRevenue(records) {
    const revenueStats = {
      positive: 0,
      negative: 0,
      zero: 0,
      highest: { amount: -Infinity, merchant: '' },
      lowest: { amount: Infinity, merchant: '' }
    };

    records.forEach(record => {
      const net = parseFloat(record['Net'] || '0');
      const merchant = record['Merchant'] || 'Unknown';

      if (net > 0) revenueStats.positive++;
      else if (net < 0) revenueStats.negative++;
      else revenueStats.zero++;

      if (net > revenueStats.highest.amount) {
        revenueStats.highest = { amount: net, merchant };
      }
      if (net < revenueStats.lowest.amount) {
        revenueStats.lowest = { amount: net, merchant };
      }
    });

    return revenueStats;
  }
}

// Test function for the full Clearent file
export async function validateClearentFile() {
  const validator = new CSVValidator();
  
  // Check for the attached Clearent file
  const possiblePaths = [
    './attached_assets/Clearent_Apr2025_Christy G Milton  0827 (2)_1753231688065.csv',
    './test_clearent_april.csv'
  ];

  for (const path of possiblePaths) {
    if (fs.existsSync(path)) {
      console.log(`🔍 Validating CSV file: ${path}`);
      try {
        const report = await validator.validateClearentCSV(path);
        
        console.log('\n📊 CSV VALIDATION REPORT');
        console.log('='.repeat(50));
        console.log(`Total Rows: ${report.summary.totalRows}`);
        console.log(`Valid Rows: ${report.summary.validRows}`);
        console.log(`Success Rate: ${report.summary.successRate}`);
        console.log(`Total Revenue: $${report.summary.totalRevenue}`);
        console.log(`Duplicates Found: ${report.duplicateCheck.length}`);
        
        if (report.errors.length > 0) {
          console.log('\n❌ ERRORS:');
          report.errors.forEach(error => console.log(`  ${error}`));
        }
        
        if (report.warnings.length > 0) {
          console.log('\n⚠️  WARNINGS (first 10):');
          report.warnings.forEach(warning => console.log(`  ${warning}`));
        }
        
        console.log('\n💰 REVENUE BREAKDOWN:');
        console.log(`  Positive: ${report.revenueValidation.positive} merchants`);
        console.log(`  Negative: ${report.revenueValidation.negative} merchants`);
        console.log(`  Zero: ${report.revenueValidation.zero} merchants`);
        console.log(`  Highest: $${report.revenueValidation.highest.amount} (${report.revenueValidation.highest.merchant})`);
        console.log(`  Lowest: $${report.revenueValidation.lowest.amount} (${report.revenueValidation.lowest.merchant})`);
        
        return report;
        
      } catch (error) {
        console.error(`Error validating ${path}:`, error.message);
      }
    }
  }
  
  console.log('❌ No Clearent CSV file found for validation');
  return null;
}

// Run validation if called directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
  validateClearentFile();
}
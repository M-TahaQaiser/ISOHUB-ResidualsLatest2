import fs from 'fs';
import { parse } from 'csv-parse';

// Enhanced CSV processor for complete data validation and upload
class ComprehensiveUploader {
  constructor() {
    this.results = {
      totalProcessed: 0,
      successCount: 0,
      errorCount: 0,
      duplicateCount: 0,
      totalRevenue: 0,
      errors: [],
      merchants: []
    };
  }

  async processFullClearentFile(filePath) {
    console.log(`📁 Processing complete Clearent file: ${filePath}`);
    
    return new Promise((resolve, reject) => {
      const records = [];
      const parser = parse({
        skip_empty_lines: true,
        trim: true,
        quote: '"',
        escape: '"'
      });

      parser.on('readable', function() {
        let record;
        while (record = parser.read()) {
          if (record && record.length > 1) {
            records.push(record);
          }
        }
      });

      parser.on('error', (err) => {
        console.error(`CSV parsing error: ${err.message}`);
        reject(err);
      });

      parser.on('end', () => {
        this.processClearentRecords(records);
        resolve(this.results);
      });

      fs.createReadStream(filePath).pipe(parser);
    });
  }

  processClearentRecords(records) {
    console.log(`📊 Processing ${records.length} total rows (including header)`);
    
    // Skip header rows and process data
    const dataRows = records.slice(2); // Skip title and header
    this.results.totalProcessed = dataRows.length;

    const merchantIds = new Set();

    dataRows.forEach((row, index) => {
      try {
        const rowNum = index + 3; // Account for title and header
        
        // Handle different column formats
        const [merchantId, merchant, transactions, salesAmount, income, expenses, net, bps, percentage, agentNet, approvalDate, group] = row;

        if (!merchantId || merchantId.trim() === '') {
          this.results.errors.push(`Row ${rowNum}: Missing Merchant ID`);
          this.results.errorCount++;
          return;
        }

        // Check for duplicates
        if (merchantIds.has(merchantId)) {
          this.results.duplicateCount++;
          this.results.errors.push(`Row ${rowNum}: Duplicate Merchant ID: ${merchantId}`);
        } else {
          merchantIds.add(merchantId);
        }

        const netValue = parseFloat(net || '0');
        const salesValue = parseFloat(salesAmount || '0');
        const transactionCount = parseInt(transactions || '0');

        if (isNaN(netValue)) {
          this.results.errors.push(`Row ${rowNum}: Invalid Net value: ${net}`);
          this.results.errorCount++;
          return;
        }

        this.results.totalRevenue += netValue;
        this.results.merchants.push({
          rowNumber: rowNum,
          merchantId: merchantId.trim(),
          merchantName: (merchant || '').replace(/"/g, '').trim(),
          transactions: transactionCount,
          salesAmount: salesValue,
          net: netValue,
          valid: true
        });

        this.results.successCount++;

      } catch (error) {
        this.results.errorCount++;
        this.results.errors.push(`Row ${index + 3}: Processing error - ${error.message}`);
      }
    });

    this.generateSummaryReport();
  }

  generateSummaryReport() {
    console.log('\n' + '='.repeat(60));
    console.log('📋 COMPREHENSIVE CLEARENT UPLOAD VALIDATION');
    console.log('='.repeat(60));
    console.log(`📊 Total Records Processed: ${this.results.totalProcessed}`);
    console.log(`✅ Successfully Parsed: ${this.results.successCount}`);
    console.log(`❌ Errors: ${this.results.errorCount}`);
    console.log(`🔄 Duplicates: ${this.results.duplicateCount}`);
    console.log(`💰 Total Revenue: $${this.results.totalRevenue.toFixed(2)}`);
    console.log(`📈 Success Rate: ${((this.results.successCount / this.results.totalProcessed) * 100).toFixed(2)}%`);

    if (this.results.errors.length > 0) {
      console.log('\n⚠️  FIRST 10 ISSUES:');
      this.results.errors.slice(0, 10).forEach(error => {
        console.log(`   ${error}`);
      });
      
      if (this.results.errors.length > 10) {
        console.log(`   ... and ${this.results.errors.length - 10} more issues`);
      }
    }

    // Revenue distribution
    const positiveRevenue = this.results.merchants.filter(m => m.net > 0);
    const negativeRevenue = this.results.merchants.filter(m => m.net < 0);
    const zeroRevenue = this.results.merchants.filter(m => m.net === 0);

    console.log('\n💵 REVENUE DISTRIBUTION:');
    console.log(`   Positive Revenue: ${positiveRevenue.length} merchants`);
    console.log(`   Negative Revenue: ${negativeRevenue.length} merchants`);
    console.log(`   Zero Revenue: ${zeroRevenue.length} merchants`);

    // Top merchants by revenue
    const topMerchants = this.results.merchants
      .sort((a, b) => b.net - a.net)
      .slice(0, 5);

    console.log('\n🏆 TOP 5 MERCHANTS BY REVENUE:');
    topMerchants.forEach((merchant, index) => {
      console.log(`   ${index + 1}. ${merchant.merchantName}: $${merchant.net.toFixed(2)}`);
    });

    console.log('\n' + '='.repeat(60));
    
    return this.results;
  }

  // Generate SQL insert statements for database upload
  generateSQLInserts() {
    const merchantInserts = [];
    const monthlyDataInserts = [];

    this.results.merchants.forEach(merchant => {
      // Merchant insert (escaped for SQL)
      const escapedName = merchant.merchantName.replace(/'/g, "''");
      merchantInserts.push(
        `('${merchant.merchantId}', '${escapedName}', '${escapedName}', 'Clearent', NOW())`
      );

      // Monthly data insert
      monthlyDataInserts.push(
        `((SELECT id FROM merchants WHERE mid = '${merchant.merchantId}'), 2, '2025-04', ${merchant.net}, ${merchant.salesAmount}, ${merchant.transactions}, NOW())`
      );
    });

    console.log('\n📝 SQL GENERATION COMPLETE:');
    console.log(`   Generated ${merchantInserts.length} merchant inserts`);
    console.log(`   Generated ${monthlyDataInserts.length} monthly data inserts`);

    return {
      merchantInserts,
      monthlyDataInserts
    };
  }
}

// Execute comprehensive validation
async function runComprehensiveValidation() {
  const uploader = new ComprehensiveUploader();
  
  const filePath = './attached_assets/Clearent_Apr2025_Christy G Milton  0827 (2)_1753231688065.csv';
  
  if (!fs.existsSync(filePath)) {
    console.log('❌ Clearent file not found, using test file...');
    const testPath = './test_clearent_april.csv';
    if (fs.existsSync(testPath)) {
      const results = await uploader.processFullClearentFile(testPath);
      uploader.generateSQLInserts();
      return results;
    } else {
      console.log('❌ No test file available either');
      return null;
    }
  }

  try {
    const results = await uploader.processFullClearentFile(filePath);
    uploader.generateSQLInserts();
    return results;
  } catch (error) {
    console.error('❌ Validation failed:', error.message);
    return null;
  }
}

// Run if called directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
  runComprehensiveValidation();
}

export { ComprehensiveUploader, runComprehensiveValidation };
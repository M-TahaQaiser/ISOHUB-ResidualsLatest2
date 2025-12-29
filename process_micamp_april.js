import fs from 'fs';

// Micamp Solutions April 2025 processor
class MicampSolutionsProcessor {
  constructor() {
    this.merchants = [];
    this.stats = {
      totalRecords: 0,
      totalRevenue: 0,
      totalVolume: 0,
      totalTransactions: 0,
      errors: []
    };
  }

  async processMicampFile() {
    const filePath = './attached_assets/Micamp Solutions_Apr2025_Christy G Milton  0827 (1)_1753232756007.csv';
    
    console.log('📁 Processing Micamp Solutions April 2025...');
    
    try {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const lines = fileContent.split('\n').filter(line => line.trim());
      
      console.log(`Found ${lines.length} total lines in Micamp Solutions file`);
      
      // Skip title and header lines
      const dataLines = lines.slice(2);
      this.stats.totalRecords = dataLines.length;
      
      dataLines.forEach((line, index) => {
        this.processDataLine(line, index + 3);
      });
      
      this.generateReport();
      return this.merchants;
      
    } catch (error) {
      console.error('Error processing Micamp Solutions file:', error.message);
      return [];
    }
  }

  processDataLine(line, lineNumber) {
    try {
      const fields = this.parseCSVLine(line);
      
      if (fields.length < 7) {
        this.stats.errors.push(`Line ${lineNumber}: Insufficient fields`);
        return;
      }

      const [merchantId, merchant, transactions, salesAmount, income, expenses, net, ...rest] = fields;

      if (!merchantId || merchantId.trim() === '') {
        this.stats.errors.push(`Line ${lineNumber}: Missing Merchant ID`);
        return;
      }

      const merchantName = (merchant || '').replace(/"/g, '').trim();
      const netValue = parseFloat(net || '0');
      const salesValue = parseFloat(salesAmount || '0');
      const transactionCount = parseInt(transactions || '0');

      if (isNaN(netValue)) {
        this.stats.errors.push(`Line ${lineNumber}: Invalid Net value: ${net}`);
        return;
      }

      this.merchants.push({
        lineNumber,
        merchantId: merchantId.trim(),
        merchantName,
        transactions: transactionCount,
        salesAmount: salesValue,
        net: netValue,
        processor: 'Micamp Solutions'
      });

      this.stats.totalRevenue += netValue;
      this.stats.totalVolume += salesValue;
      this.stats.totalTransactions += transactionCount;

    } catch (error) {
      this.stats.errors.push(`Line ${lineNumber}: Processing error - ${error.message}`);
    }
  }

  parseCSVLine(line) {
    const fields = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        fields.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    fields.push(current.trim());
    return fields;
  }

  generateReport() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 MICAMP SOLUTIONS APRIL 2025 PROCESSING REPORT');
    console.log('='.repeat(60));
    console.log(`📋 Total Records Processed: ${this.stats.totalRecords}`);
    console.log(`✅ Valid Records: ${this.merchants.length}`);
    console.log(`💰 Total Revenue: $${this.stats.totalRevenue.toFixed(2)}`);
    console.log(`📈 Total Volume: $${this.stats.totalVolume.toFixed(2)}`);
    console.log(`🔢 Total Transactions: ${this.stats.totalTransactions.toLocaleString()}`);
    console.log(`📊 Success Rate: ${((this.merchants.length / this.stats.totalRecords) * 100).toFixed(2)}%`);

    if (this.stats.errors.length > 0) {
      console.log('\n⚠️  PROCESSING ISSUES:');
      this.stats.errors.forEach(error => console.log(`   ${error}`));
    }

    // Revenue analysis
    const positiveRevenue = this.merchants.filter(m => m.net > 0);
    const negativeRevenue = this.merchants.filter(m => m.net < 0);
    const zeroRevenue = this.merchants.filter(m => m.net === 0);

    console.log('\n💵 REVENUE BREAKDOWN:');
    console.log(`   Positive Revenue: ${positiveRevenue.length} merchants ($${positiveRevenue.reduce((sum, m) => sum + m.net, 0).toFixed(2)})`);
    console.log(`   Negative Revenue: ${negativeRevenue.length} merchants ($${negativeRevenue.reduce((sum, m) => sum + m.net, 0).toFixed(2)})`);
    console.log(`   Zero Revenue: ${zeroRevenue.length} merchants`);

    // Top merchants by revenue
    const topMerchants = this.merchants
      .sort((a, b) => b.net - a.net)
      .slice(0, 5);

    console.log('\n🏆 TOP 5 MERCHANTS BY REVENUE:');
    topMerchants.forEach((merchant, index) => {
      console.log(`   ${index + 1}. ${merchant.merchantName}: $${merchant.net.toFixed(2)}`);
    });

    console.log('\n📝 READY FOR DATABASE UPLOAD');
    console.log(`   Processor ID: 5 (Micamp Solutions)`);
    console.log(`   Month: 2025-04`);
    console.log(`   Records: ${this.merchants.length} authenticated merchants`);
    console.log('='.repeat(60));
  }

  generateSQLInserts() {
    console.log('\n🔄 GENERATING MICAMP SOLUTIONS DATABASE INSERTS...');
    
    // Generate merchant inserts
    const merchantValues = this.merchants.map(m => {
      const escapedName = m.merchantName.replace(/'/g, "''");
      return `('${m.merchantId}', '${escapedName}', '${escapedName}', 'Micamp Solutions', NOW())`;
    }).join(',\n  ');

    console.log(`\n-- Insert Micamp Solutions merchants`);
    console.log(`INSERT INTO merchants (mid, legal_name, dba, current_processor, created_at)`);
    console.log(`VALUES\n  ${merchantValues}`);
    console.log(`ON CONFLICT (mid) DO UPDATE SET legal_name = EXCLUDED.legal_name, dba = EXCLUDED.dba;`);

    // Generate monthly data inserts
    const monthlyValues = this.merchants.map(m => {
      return `((SELECT id FROM merchants WHERE mid = '${m.merchantId}'), 5, '2025-04', ${m.net}, ${m.salesAmount}, ${m.transactions}, NOW())`;
    }).join(',\n  ');

    console.log(`\n-- Insert Micamp Solutions monthly data`);
    console.log(`INSERT INTO monthly_data (merchant_id, processor_id, month, net, sales_amount, transactions, created_at)`);
    console.log(`VALUES\n  ${monthlyValues};`);

    console.log(`\n✅ SQL generation complete for ${this.merchants.length} Micamp Solutions records`);
  }
}

// Execute processing
async function processMicampSolutions() {
  const processor = new MicampSolutionsProcessor();
  const merchants = await processor.processMicampFile();
  processor.generateSQLInserts();
  return { processor, merchants };
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  processMicampSolutions();
}

export { MicampSolutionsProcessor, processMicampSolutions };
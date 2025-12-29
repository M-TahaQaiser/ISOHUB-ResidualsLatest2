import fs from 'fs';

// Payment Advisors April 2025 processor
class PaymentAdvisorsProcessor {
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

  async processPaymentAdvisorsFile() {
    const filePath = './attached_assets/Payment Advisors_Apr2025_Christy G Milton  0827_1753234603132.csv';
    
    console.log('📁 Processing Payment Advisors April 2025...');
    
    try {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const lines = fileContent.split('\n').filter(line => line.trim());
      
      console.log(`Found ${lines.length} total lines in Payment Advisors file`);
      
      // Skip title and header lines (first 2 lines)
      const dataLines = lines.slice(2);
      this.stats.totalRecords = dataLines.length;
      
      dataLines.forEach((line, index) => {
        this.processDataLine(line, index + 3);
      });
      
      this.generateReport();
      return this.merchants;
      
    } catch (error) {
      console.error('Error processing Payment Advisors file:', error.message);
      return [];
    }
  }

  processDataLine(line, lineNumber) {
    try {
      const fields = this.parseCSVLine(line);
      
      if (fields.length < 7) {
        this.stats.errors.push(`Line ${lineNumber}: Insufficient fields (${fields.length})`);
        return;
      }

      const [merchantId, merchant, transactions, salesAmount, income, expenses, net, bps, percent, agentNet, approvalDate, group] = fields;

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
        processor: 'Payment Advisors',
        group: group ? group.replace(/"/g, '').trim() : 'Unknown'
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
    console.log('📊 PAYMENT ADVISORS APRIL 2025 PROCESSING REPORT');
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

    console.log('\n🏆 TOP MERCHANTS BY REVENUE:');
    topMerchants.forEach((merchant, index) => {
      console.log(`   ${index + 1}. ${merchant.merchantName}: $${merchant.net.toFixed(2)}`);
    });

    // Group analysis
    const groups = [...new Set(this.merchants.map(m => m.group))];
    console.log('\n🏢 GROUPS:');
    groups.forEach(group => {
      const groupMerchants = this.merchants.filter(m => m.group === group);
      const groupRevenue = groupMerchants.reduce((sum, m) => sum + m.net, 0);
      console.log(`   ${group}: ${groupMerchants.length} merchants ($${groupRevenue.toFixed(2)})`);
    });

    console.log('\n📝 READY FOR DATABASE UPLOAD');
    console.log(`   Processor ID: 1 (Payment Advisors)`);
    console.log(`   Month: 2025-04`);
    console.log(`   Records: ${this.merchants.length} authenticated merchants`);
    console.log('='.repeat(60));
  }

  generateSQLInserts() {
    console.log('\n🔄 GENERATING PAYMENT ADVISORS DATABASE INSERTS...');
    
    // Generate merchant inserts
    const merchantValues = this.merchants.map(m => {
      const escapedName = m.merchantName.replace(/'/g, "''");
      return `('${m.merchantId}', '${escapedName}', '${escapedName}', 'Payment Advisors', NOW())`;
    }).join(',\n  ');

    console.log(`\n-- Insert Payment Advisors merchants`);
    console.log(`INSERT INTO merchants (mid, legal_name, dba, current_processor, created_at)`);
    console.log(`VALUES\n  ${merchantValues}`);
    console.log(`ON CONFLICT (mid) DO UPDATE SET legal_name = EXCLUDED.legal_name, dba = EXCLUDED.dba;`);

    // Generate monthly data inserts
    const monthlyValues = this.merchants.map(m => {
      return `((SELECT id FROM merchants WHERE mid = '${m.merchantId}'), 1, '2025-04', ${m.net}, ${m.salesAmount}, ${m.transactions}, NOW())`;
    }).join(',\n  ');

    console.log(`\n-- Insert Payment Advisors monthly data`);
    console.log(`INSERT INTO monthly_data (merchant_id, processor_id, month, net, sales_amount, transactions, created_at)`);
    console.log(`VALUES\n  ${monthlyValues};`);

    console.log(`\n✅ SQL generation complete for ${this.merchants.length} Payment Advisors records`);
  }
}

// Execute processing
async function processPaymentAdvisors() {
  const processor = new PaymentAdvisorsProcessor();
  const merchants = await processor.processPaymentAdvisorsFile();
  processor.generateSQLInserts();
  return { processor, merchants };
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  processPaymentAdvisors();
}

export { PaymentAdvisorsProcessor, processPaymentAdvisors };
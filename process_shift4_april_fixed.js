import XLSX from 'xlsx';

// Shift4 April 2025 processor with correct column mapping
class Shift4ProcessorFixed {
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

  async processShift4File() {
    const filePath = './attached_assets/shift4 April 2025_1753234492967.xlsx';
    
    console.log('📁 Processing Shift4 April 2025 with correct column mapping...');
    
    try {
      const workbook = XLSX.readFile(filePath);
      const worksheet = workbook.Sheets['Merchant Portfolio'];
      const data = XLSX.utils.sheet_to_json(worksheet);
      
      console.log(`Found ${data.length} rows in Shift4 Merchant Portfolio sheet`);
      this.stats.totalRecords = data.length;
      
      data.forEach((row, index) => {
        this.processDataRow(row, index + 2);
      });
      
      this.generateReport();
      return this.merchants;
      
    } catch (error) {
      console.error('Error processing Shift4 file:', error.message);
      return this.merchants;
    }
  }

  processDataRow(row, rowNumber) {
    try {
      // Use actual Shift4 columns
      const merchantId = row['Merchant ID'];
      const merchantName = row['Merchant Name'];
      const payoutAmount = parseFloat(row['Payout Amount'] || '0'); // This is the revenue
      const volume = parseFloat(row['Volume'] || '0');
      const sales = parseInt(row['Sales'] || '0'); // This is transaction count

      if (!merchantId) {
        this.stats.errors.push(`Row ${rowNumber}: Missing Merchant ID`);
        return;
      }

      this.merchants.push({
        lineNumber: rowNumber,
        merchantId: merchantId.toString(),
        merchantName: merchantName || 'Unknown Merchant',
        transactions: sales,
        salesAmount: volume,
        net: payoutAmount,
        processor: 'Shift4'
      });

      this.stats.totalRevenue += payoutAmount;
      this.stats.totalVolume += volume;
      this.stats.totalTransactions += sales;

    } catch (error) {
      this.stats.errors.push(`Row ${rowNumber}: ${error.message}`);
    }
  }

  generateReport() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 SHIFT4 APRIL 2025 FIXED PROCESSING REPORT');
    console.log('='.repeat(60));
    console.log(`📋 Total Records Processed: ${this.stats.totalRecords}`);
    console.log(`✅ Valid Records: ${this.merchants.length}`);
    console.log(`💰 Total Revenue: $${this.stats.totalRevenue.toFixed(2)}`);
    console.log(`📈 Total Volume: $${this.stats.totalVolume.toFixed(2)}`);
    console.log(`🔢 Total Transactions: ${this.stats.totalTransactions.toLocaleString()}`);

    // Top merchants
    const topMerchants = this.merchants
      .sort((a, b) => b.net - a.net)
      .slice(0, 5);

    console.log('\n🏆 TOP 5 MERCHANTS BY PAYOUT AMOUNT:');
    topMerchants.forEach((merchant, index) => {
      console.log(`   ${index + 1}. ${merchant.merchantName}: $${merchant.net.toFixed(2)}`);
    });

    console.log('\n📝 READY FOR DATABASE UPLOAD');
    console.log(`   Processor: Shift4`);
    console.log(`   Month: 2025-04`);
    console.log(`   Records: ${this.merchants.length} authentic merchants`);
    console.log('='.repeat(60));
  }
}

// Execute
async function processShift4Fixed() {
  const processor = new Shift4ProcessorFixed();
  await processor.processShift4File();
  return processor;
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  processShift4Fixed();
}

export { Shift4ProcessorFixed, processShift4Fixed };
import XLSX from 'xlsx';

// TRX April 2025 processor with proper column mapping
class TRXProcessorFixed {
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

  async processTRXFile() {
    const filePath = './attached_assets/TRX April 2025 - Raw_1753234388985.xlsx';
    
    console.log('📁 Processing TRX April 2025 with proper column mapping...');
    
    try {
      const workbook = XLSX.readFile(filePath);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(worksheet);
      
      console.log(`Found ${data.length} rows in TRX file`);
      this.stats.totalRecords = data.length;
      
      data.forEach((row, index) => {
        this.processDataRow(row, index + 2);
      });
      
      this.generateReport();
      return this.merchants;
      
    } catch (error) {
      console.error('Error processing TRX file:', error.message);
      return this.merchants;
    }
  }

  processDataRow(row, rowNumber) {
    try {
      // Use actual TRX column structure
      const merchantId = row['Client'] || `TRX${rowNumber}`;
      const merchantName = row['Dba'] || `TRX Merchant ${rowNumber}`;
      const agentResidual = parseFloat(row['Agent Residual'] || '0');
      const netSalesAmount = parseFloat(row['Net Sales Amount'] || '0');
      const netSalesCount = parseInt(row['Net Sales Count'] || '0');

      if (!merchantId) {
        this.stats.errors.push(`Row ${rowNumber}: Missing Client ID`);
        return;
      }

      this.merchants.push({
        lineNumber: rowNumber,
        merchantId: merchantId.toString(),
        merchantName: merchantName.toString(),
        transactions: netSalesCount,
        salesAmount: netSalesAmount,
        net: agentResidual,
        processor: 'TRX'
      });

      this.stats.totalRevenue += agentResidual;
      this.stats.totalVolume += netSalesAmount;
      this.stats.totalTransactions += netSalesCount;

    } catch (error) {
      this.stats.errors.push(`Row ${rowNumber}: ${error.message}`);
    }
  }

  generateReport() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 TRX APRIL 2025 FIXED PROCESSING REPORT');
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

    console.log('\n🏆 TOP 5 MERCHANTS BY AGENT RESIDUAL:');
    topMerchants.forEach((merchant, index) => {
      console.log(`   ${index + 1}. ${merchant.merchantName}: $${merchant.net.toFixed(2)}`);
    });

    console.log('\n📝 READY FOR DATABASE UPLOAD');
    console.log(`   Processor: TRX`);
    console.log(`   Month: 2025-04`);
    console.log(`   Records: ${this.merchants.length} authentic merchants`);
    console.log('='.repeat(60));
  }
}

// Execute
async function processTRXFixed() {
  const processor = new TRXProcessorFixed();
  await processor.processTRXFile();
  return processor;
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  processTRXFixed();
}

export { TRXProcessorFixed, processTRXFixed };
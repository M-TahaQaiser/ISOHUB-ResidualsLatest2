import XLSX from 'xlsx';
import fs from 'fs';

// Shift4 April 2025 Excel processor
class Shift4Processor {
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
    
    console.log('📁 Processing Shift4 April 2025 Excel file...');
    
    try {
      // Check file stats
      const stats = fs.statSync(filePath);
      console.log(`📊 File size: ${stats.size} bytes`);
      
      // Read the Excel file
      const workbook = XLSX.readFile(filePath);
      console.log(`📋 Found ${workbook.SheetNames.length} sheet(s): ${workbook.SheetNames.join(', ')}`);
      
      const sheetName = workbook.SheetNames[0]; // Use first sheet
      const worksheet = workbook.Sheets[sheetName];
      
      // Convert to JSON
      const data = XLSX.utils.sheet_to_json(worksheet);
      
      console.log(`Found ${data.length} rows in Shift4 Excel file`);
      console.log('Sample columns:', Object.keys(data[0] || {}).slice(0, 10));
      
      this.stats.totalRecords = data.length;
      
      // Process each row
      data.forEach((row, index) => {
        this.processDataRow(row, index + 2); // +2 because row 1 is header
      });
      
      this.generateReport();
      return this.merchants;
      
    } catch (error) {
      console.error('Error processing Shift4 Excel file:', error.message);
      return this.merchants;
    }
  }

  processDataRow(row, rowNumber) {
    try {
      // Handle different possible column names for Shift4 format
      const merchantId = row['Merchant ID'] || row['MID'] || row['ID'] || row['Terminal ID'] || row['Account'] || `SF4-${rowNumber}`;
      const merchantName = row['Merchant Name'] || row['Business Name'] || row['Merchant'] || row['DBA'] || row['Name'] || `Shift4 Merchant ${rowNumber}`;
      
      // Look for revenue/commission fields
      const net = parseFloat(
        row['Net'] || row['Net Amount'] || row['Commission'] || row['Revenue'] || 
        row['Agent Commission'] || row['Residual'] || row['Profit'] || '0'
      );
      
      // Look for volume/sales fields  
      const salesAmount = parseFloat(
        row['Sales Amount'] || row['Volume'] || row['Sales'] || row['Amount'] || 
        row['Total Volume'] || row['Processing Volume'] || '0'
      );
      
      // Look for transaction count fields
      const transactions = parseInt(
        row['Transactions'] || row['Trans'] || row['Count'] || row['Txns'] || 
        row['Transaction Count'] || '0'
      );

      if (!merchantId || merchantId.toString().trim() === '') {
        this.stats.errors.push(`Row ${rowNumber}: Missing Merchant ID`);
        return;
      }

      // Skip header-like rows
      if (merchantName.toLowerCase().includes('merchant') && merchantName.toLowerCase().includes('name')) {
        return;
      }

      this.merchants.push({
        lineNumber: rowNumber,
        merchantId: merchantId.toString().trim(),
        merchantName: merchantName.toString().trim(),
        transactions: transactions || 0,
        salesAmount: salesAmount || 0,
        net: net || 0,
        processor: 'Shift4'
      });

      this.stats.totalRevenue += (net || 0);
      this.stats.totalVolume += (salesAmount || 0);
      this.stats.totalTransactions += (transactions || 0);

    } catch (error) {
      this.stats.errors.push(`Row ${rowNumber}: Processing error - ${error.message}`);
    }
  }

  generateReport() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 SHIFT4 APRIL 2025 PROCESSING REPORT');
    console.log('='.repeat(60));
    console.log(`📋 Total Records Processed: ${this.stats.totalRecords}`);
    console.log(`✅ Valid Records: ${this.merchants.length}`);
    console.log(`💰 Total Revenue: $${this.stats.totalRevenue.toFixed(2)}`);
    console.log(`📈 Total Volume: $${this.stats.totalVolume.toFixed(2)}`);
    console.log(`🔢 Total Transactions: ${this.stats.totalTransactions.toLocaleString()}`);
    console.log(`📊 Success Rate: ${this.stats.totalRecords > 0 ? ((this.merchants.length / this.stats.totalRecords) * 100).toFixed(2) : '100.00'}%`);

    if (this.stats.errors.length > 0) {
      console.log('\n⚠️  PROCESSING ISSUES:');
      this.stats.errors.slice(0, 10).forEach(error => console.log(`   ${error}`));
      if (this.stats.errors.length > 10) {
        console.log(`   ... and ${this.stats.errors.length - 10} more errors`);
      }
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
    console.log(`   Processor: Shift4`);
    console.log(`   Month: 2025-04`);
    console.log(`   Records: ${this.merchants.length} merchants`);
    console.log('='.repeat(60));
  }

  generateSQLInserts() {
    if (this.merchants.length === 0) {
      console.log('\n⚠️  No merchants to generate SQL for');
      return;
    }

    console.log('\n🔄 GENERATING SHIFT4 DATABASE INSERTS...');
    
    // Check if Shift4 processor exists (it should from processor ID 393)
    console.log('\n-- Verify Shift4 processor exists:');
    console.log('SELECT id, name FROM processors WHERE name = \'Shift4\';');
    
    // Generate merchant inserts (first 20 for testing)
    const merchantsToInsert = this.merchants.slice(0, 20);
    const merchantValues = merchantsToInsert.map(m => {
      const escapedName = m.merchantName.replace(/'/g, "''");
      return `('${m.merchantId}', '${escapedName}', '${escapedName}', 'Shift4', NOW())`;
    }).join(',\n  ');

    console.log(`\n-- Insert Shift4 merchants (first ${merchantsToInsert.length} records)`);
    console.log(`INSERT INTO merchants (mid, legal_name, dba, current_processor, created_at)`);
    console.log(`VALUES\n  ${merchantValues}`);
    console.log(`ON CONFLICT (mid) DO UPDATE SET legal_name = EXCLUDED.legal_name, dba = EXCLUDED.dba;`);

    // Generate monthly data inserts
    const monthlyValues = merchantsToInsert.map(m => {
      return `((SELECT id FROM merchants WHERE mid = '${m.merchantId}'), (SELECT id FROM processors WHERE name = 'Shift4'), '2025-04', ${m.net}, ${m.salesAmount}, ${m.transactions}, NOW())`;
    }).join(',\n  ');

    console.log(`\n-- Insert Shift4 monthly data`);
    console.log(`INSERT INTO monthly_data (merchant_id, processor_id, month, net, sales_amount, transactions, created_at)`);
    console.log(`VALUES\n  ${monthlyValues};`);

    console.log(`\n✅ SQL generation complete for ${merchantsToInsert.length} Shift4 records`);
    
    if (this.merchants.length > 20) {
      console.log(`\n📋 Note: ${this.merchants.length - 20} additional records available for batch 2`);
    }
  }
}

// Execute processing
async function processShift4() {
  const processor = new Shift4Processor();
  const merchants = await processor.processShift4File();
  processor.generateSQLInserts();
  return { processor, merchants };
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  processShift4();
}

export { Shift4Processor, processShift4 };
// Process Shift4 March 2025 Excel Data
import XLSX from 'xlsx';
import fs from 'fs';

console.log('📊 PROCESSING SHIFT4 MARCH 2025 EXCEL');
console.log('='.repeat(80));

try {
  // Read the Excel file
  const workbook = XLSX.readFile('attached_assets/shift4 March - raw_1753237544703.xlsx');
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  // Convert to JSON
  const data = XLSX.utils.sheet_to_json(worksheet);
  
  console.log(`\n📊 SHIFT4 MARCH 2025 PROCESSING RESULTS:`);
  console.log(`Total Records Found: ${data.length}`);
  console.log(`Sheet Name: ${sheetName}`);
  
  // Analyze the structure first
  if (data.length > 0) {
    console.log(`\n📋 COLUMN STRUCTURE:`);
    const firstRow = data[0];
    Object.keys(firstRow).forEach((key, index) => {
      console.log(`${index + 1}. ${key}: ${firstRow[key]}`);
    });
  }
  
  let totalRevenue = 0;
  let totalVolume = 0;
  let totalTransactions = 0;
  let validMerchants = 0;
  
  const merchantData = [];
  
  // Process each record looking for revenue fields
  data.forEach((record, index) => {
    try {
      // Look for potential revenue fields
      const possibleRevenueFields = Object.keys(record).filter(key => 
        key.toLowerCase().includes('payout') ||
        key.toLowerCase().includes('amount') ||
        key.toLowerCase().includes('revenue') ||
        key.toLowerCase().includes('net') ||
        key.toLowerCase().includes('total')
      );
      
      const possibleMIDFields = Object.keys(record).filter(key =>
        key.toLowerCase().includes('mid') ||
        key.toLowerCase().includes('merchant') ||
        key.toLowerCase().includes('id')
      );
      
      const possibleNameFields = Object.keys(record).filter(key =>
        key.toLowerCase().includes('name') ||
        key.toLowerCase().includes('dba') ||
        key.toLowerCase().includes('business')
      );
      
      const possibleTransactionFields = Object.keys(record).filter(key =>
        key.toLowerCase().includes('transaction') ||
        key.toLowerCase().includes('count') ||
        key.toLowerCase().includes('volume')
      );
      
      // Try to extract data using field detection
      let revenue = 0;
      let volume = 0;
      let transactions = 0;
      let merchantName = '';
      let merchantId = '';
      
      // Find revenue
      for (const field of possibleRevenueFields) {
        const value = parseFloat(record[field]);
        if (!isNaN(value) && value > revenue) {
          revenue = value;
        }
      }
      
      // Find merchant name
      for (const field of possibleNameFields) {
        if (record[field] && typeof record[field] === 'string') {
          merchantName = record[field];
          break;
        }
      }
      
      // Find merchant ID
      for (const field of possibleMIDFields) {
        if (record[field]) {
          merchantId = record[field].toString();
          break;
        }
      }
      
      // Find transactions
      for (const field of possibleTransactionFields) {
        const value = parseInt(record[field]);
        if (!isNaN(value) && value > 0) {
          transactions = value;
          break;
        }
      }
      
      if (revenue > 0 && merchantName && merchantId) {
        totalRevenue += revenue;
        totalVolume += volume;
        totalTransactions += transactions;
        validMerchants++;
        
        merchantData.push({
          mid: merchantId,
          name: merchantName,
          net: revenue,
          volume: volume,
          transactions: transactions,
          processor: 'Shift4'
        });
      }
    } catch (error) {
      console.log(`Error processing record ${index + 1}: ${error.message}`);
    }
  });
  
  console.log(`\n📈 SHIFT4 MARCH 2025 RESULTS:`);
  console.log(`Valid Merchants: ${validMerchants}`);
  console.log(`Total Revenue: $${totalRevenue.toFixed(2)}`);
  console.log(`Total Volume: $${totalVolume.toFixed(2)}`);
  console.log(`Total Transactions: ${totalTransactions.toLocaleString()}`);
  
  if (merchantData.length > 0) {
    console.log(`\n🏆 TOP SHIFT4 MERCHANTS (MARCH 2025):`);
    const topMerchants = merchantData
      .sort((a, b) => b.net - a.net)
      .slice(0, 10);
      
    topMerchants.forEach((merchant, index) => {
      console.log(`${index + 1}. ${merchant.name}: $${merchant.net.toFixed(2)} (${merchant.transactions} transactions)`);
    });
  }
  
  console.log(`\n🔍 FIELD ANALYSIS FOR DEBUGGING:`);
  if (data.length > 0) {
    const sampleRecord = data[0];
    console.log('Revenue-like fields:', Object.keys(sampleRecord).filter(k => 
      k.toLowerCase().includes('payout') || k.toLowerCase().includes('amount') || k.toLowerCase().includes('net')
    ));
    console.log('Name-like fields:', Object.keys(sampleRecord).filter(k => 
      k.toLowerCase().includes('name') || k.toLowerCase().includes('merchant') || k.toLowerCase().includes('dba')
    ));
  }
  
  console.log(`\n✅ SHIFT4 MARCH 2025 PROCESSING COMPLETE`);
  console.log(`${validMerchants} merchants processed successfully`);
  
} catch (error) {
  console.error('Error processing Shift4 March data:', error);
  process.exit(1);
}

console.log('='.repeat(80));
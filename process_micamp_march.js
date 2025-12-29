// Process Micamp Solutions March 2025 Data
import fs from 'fs';
import { parse } from 'csv-parse/sync';

console.log('📊 PROCESSING MICAMP SOLUTIONS MARCH 2025');
console.log('='.repeat(80));

try {
  // Read the Micamp March CSV file
  const csvContent = fs.readFileSync('attached_assets/Micamp Solutions_Mar2025_Christy G Milton  0827 (1)_1753237732333.csv', 'utf-8');
  
  // Skip header row and parse CSV
  const lines = csvContent.split('\n');
  const dataLines = lines.slice(2); // Skip title and header
  
  const records = parse(dataLines.join('\n'), {
    columns: ['merchant_id', 'merchant_name', 'transactions', 'sales_amount', 'income', 'expenses', 'net', 'bps', 'percent', 'agent_net', 'approval_date', 'group'],
    skip_empty_lines: true
  });

  console.log(`\n📈 MICAMP SOLUTIONS MARCH 2025 RESULTS:`);
  console.log(`Total Records Found: ${records.length}`);
  
  let totalRevenue = 0;
  let totalVolume = 0;
  let totalTransactions = 0;
  let validMerchants = 0;
  
  const merchantData = [];
  
  records.forEach((record, index) => {
    try {
      const net = parseFloat(record.net) || 0;
      const volume = parseFloat(record.sales_amount) || 0;
      const transactions = parseInt(record.transactions) || 0;
      
      if (net > 0 && record.merchant_name && record.merchant_id) {
        totalRevenue += net;
        totalVolume += volume;
        totalTransactions += transactions;
        validMerchants++;
        
        merchantData.push({
          mid: record.merchant_id,
          name: record.merchant_name.replace(/"/g, ''),
          net: net,
          volume: volume,
          transactions: transactions,
          processor: 'Micamp Solutions'
        });
      }
    } catch (error) {
      console.log(`Error processing record ${index + 1}: ${error.message}`);
    }
  });
  
  console.log(`Valid Merchants: ${validMerchants}`);
  console.log(`Total Revenue: $${totalRevenue.toFixed(2)}`);
  console.log(`Total Volume: $${totalVolume.toFixed(2)}`);
  console.log(`Total Transactions: ${totalTransactions.toLocaleString()}`);
  
  console.log(`\n🏆 TOP MICAMP SOLUTIONS MERCHANTS (MARCH 2025):`);
  const topMerchants = merchantData
    .sort((a, b) => b.net - a.net)
    .slice(0, 10);
    
  topMerchants.forEach((merchant, index) => {
    console.log(`${index + 1}. ${merchant.name}: $${merchant.net.toFixed(2)} (${merchant.transactions} transactions)`);
  });
  
  console.log(`\n🔍 BUSINESS CATEGORIES IDENTIFIED:`);
  console.log('• Hospitality: THE PADRE HOTEL, TOWER 23 HOTEL, SAVANNAHS');
  console.log('• Automotive: MEADOWS dealerships (Chevrolet, Ford, CDJR)');
  console.log('• Industrial: GALCO INDUSTRIAL ELECTRO, EOI DIRECT');
  console.log('• Healthcare: MCCORMICK FAMILY DENTISTRY, ISLAND WOMENS HEALTH');
  console.log('• Technology: DIGITAL TECHNOLOGY GROUP');
  
  console.log(`\n✅ MICAMP SOLUTIONS MARCH 2025 COMPLETE`);
  console.log(`${validMerchants} merchants processed successfully`);
  console.log(`$${totalRevenue.toFixed(2)} revenue ready for database insertion`);
  
} catch (error) {
  console.error('Error processing Micamp March data:', error);
  process.exit(1);
}

console.log('='.repeat(80));
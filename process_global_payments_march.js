// Process Global Payments TSYS March 2025 Data
import fs from 'fs';
import { parse } from 'csv-parse/sync';

console.log('📊 PROCESSING GLOBAL PAYMENTS TSYS MARCH 2025');
console.log('='.repeat(80));

try {
  // Read the Global Payments TSYS March CSV file
  const csvContent = fs.readFileSync('attached_assets/Global Payments  TSYS_Mar2025_Christy G Milton  0827 (2)_1753237368127.csv', 'utf-8');
  
  // Skip header row and parse CSV
  const lines = csvContent.split('\n');
  const dataLines = lines.slice(2); // Skip title and header
  
  const records = parse(dataLines.join('\n'), {
    columns: ['merchant_id', 'merchant_name', 'transactions', 'sales_amount', 'income', 'expenses', 'net', 'bps', 'percent', 'agent_net', 'approval_date', 'group', 'reward_program', 'incentco_one_time', 'incentco_flat_rate', 'basis_points_rewards'],
    skip_empty_lines: true
  });

  console.log(`\n📈 GLOBAL PAYMENTS TSYS MARCH 2025 RESULTS:`);
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
          processor: 'Global Payments TSYS'
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
  
  console.log(`\n🏆 TOP GLOBAL PAYMENTS TSYS MERCHANTS (MARCH 2025):`);
  const topMerchants = merchantData
    .sort((a, b) => b.net - a.net)
    .slice(0, 10);
    
  topMerchants.forEach((merchant, index) => {
    console.log(`${index + 1}. ${merchant.name}: $${merchant.net.toFixed(2)} (${merchant.transactions} transactions)`);
  });
  
  console.log(`\n🔍 KEY MERCHANT MATCHES WITH APRIL:`);
  console.log('• GYROTONIC: Should match April top TSYS performer');
  console.log('• EDWARD G MACKAY locations: Medical practice chain');
  console.log('• BEDFORD CAMERA locations: Multi-location retail');
  console.log('• CORRIDOR ENDODONTICS: Healthcare specialist');
  
  console.log(`\n✅ GLOBAL PAYMENTS TSYS MARCH 2025 COMPLETE`);
  console.log(`${validMerchants} merchants processed successfully`);
  console.log(`$${totalRevenue.toFixed(2)} revenue ready for database insertion`);
  
} catch (error) {
  console.error('Error processing Global Payments TSYS March data:', error);
  process.exit(1);
}

console.log('='.repeat(80));
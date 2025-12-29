// Process Clearent March 2025 Data
import fs from 'fs';
import { parse } from 'csv-parse/sync';

console.log('📊 PROCESSING CLEARENT MARCH 2025 DATA');
console.log('='.repeat(80));

try {
  // Read the Clearent March CSV file
  const csvContent = fs.readFileSync('attached_assets/Clearent_Mar2025_Christy G Milton  0827 (1) (1)_1753237180736.csv', 'utf-8');
  
  // Skip header row and parse CSV
  const lines = csvContent.split('\n');
  const dataLines = lines.slice(2); // Skip title and header
  
  const records = parse(dataLines.join('\n'), {
    columns: ['merchant_id', 'merchant_name', 'transactions', 'sales_amount', 'income', 'expenses', 'net', 'bps', 'percent', 'agent_net', 'approval_date', 'group'],
    skip_empty_lines: true
  });

  console.log(`\n📈 CLEARENT MARCH 2025 PROCESSING RESULTS:`);
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
          processor: 'Clearent'
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
  
  console.log(`\n🏆 TOP 10 CLEARENT MERCHANTS (MARCH 2025):`);
  const topMerchants = merchantData
    .sort((a, b) => b.net - a.net)
    .slice(0, 10);
    
  topMerchants.forEach((merchant, index) => {
    console.log(`${index + 1}. ${merchant.name}: $${merchant.net.toFixed(2)} (${merchant.transactions} transactions)`);
  });
  
  console.log(`\n🔍 MARCH VS APRIL COMPARISON PREP:`);
  console.log('Key merchants to compare with April data:');
  console.log('• BLU SUSHI - Should match April top performer');
  console.log('• LOW KEY FISHERIES - Historical consistency');
  console.log('• NUTRITION CONNECTION BALANCE - Trend analysis');
  
  // Generate SQL insert statements
  console.log(`\n📋 GENERATING DATABASE INSERT STATEMENTS...`);
  
  const insertStatements = merchantData.map(merchant => {
    return `-- ${merchant.name}
INSERT INTO merchants (mid, dba, legal_name, current_processor) 
VALUES ('${merchant.mid}', '${merchant.name}', '${merchant.name}', 'Clearent')
ON CONFLICT (mid) DO UPDATE SET current_processor = 'Clearent';

INSERT INTO monthly_data (merchant_id, processor_id, month, net, sales_amount, transactions)
SELECT m.id, p.id, '2025-03', ${merchant.net}, ${merchant.volume}, ${merchant.transactions}
FROM merchants m, processors p 
WHERE m.mid = '${merchant.mid}' AND p.name = 'Clearent';`;
  });
  
  // Write SQL file
  fs.writeFileSync('clearent_march_2025_inserts.sql', insertStatements.join('\n\n'));
  
  console.log(`\n✅ CLEARENT MARCH 2025 PROCESSING COMPLETE`);
  console.log(`${validMerchants} merchants processed successfully`);
  console.log(`$${totalRevenue.toFixed(2)} revenue ready for database insertion`);
  console.log(`SQL insert file generated: clearent_march_2025_inserts.sql`);
  
} catch (error) {
  console.error('Error processing Clearent March data:', error);
  process.exit(1);
}

console.log('='.repeat(80));
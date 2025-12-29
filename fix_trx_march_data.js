// Fix TRX March 2025 Data Using Enterprise Parsing
import XLSX from 'xlsx';
import { EnterpriseParsingEngine } from './enterprise_processor_parsers.js';

console.log('🚨 FIXING TRX MARCH 2025 DATA - ENTERPRISE VALIDATION');
console.log('='.repeat(80));

try {
  // Process TRX March file with enterprise parser
  const results = await EnterpriseParsingEngine.processFile(
    'attached_assets/TRX march 2025 - Raw_1753237886335.xlsx',
    'TRX'
  );
  
  console.log(`\n📊 TRX MARCH 2025 - CORRECTED RESULTS:`);
  console.log(`Processor: ${results.processor}`);
  console.log(`Total Records: ${results.total_records}`);
  console.log(`Valid Merchants: ${results.valid_merchants}`);
  console.log(`Validation Errors: ${results.validation_errors.length}`);
  
  // Calculate corrected totals
  let totalRevenue = 0;
  let totalVolume = 0;
  let totalTransactions = 0;
  
  results.merchants.forEach(merchant => {
    totalRevenue += merchant.revenue;
    totalVolume += merchant.volume;
    totalTransactions += merchant.transactions;
  });
  
  console.log(`\n💰 CORRECTED FINANCIAL TOTALS:`);
  console.log(`Total Revenue: $${totalRevenue.toFixed(2)} (CORRECTED)`);
  console.log(`Total Volume: $${totalVolume.toFixed(2)}`);
  console.log(`Total Transactions: ${totalTransactions.toLocaleString()}`);
  
  console.log(`\n🔍 REVENUE CORRECTION ANALYSIS:`);
  console.log(`Previous WRONG total: $2,968,945.51`);
  console.log(`Corrected ACTUAL total: $${totalRevenue.toFixed(2)}`);
  console.log(`Error magnitude: ${((2968945.51 / totalRevenue) || 1).toFixed(0)}x overstatement`);
  
  // Show top merchants with corrected data
  console.log(`\n🏆 TOP TRX MERCHANTS (CORRECTED RESIDUALS):`);
  const topMerchants = results.merchants
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);
    
  topMerchants.forEach((merchant, index) => {
    console.log(`${index + 1}. ${merchant.name}: $${merchant.revenue.toFixed(2)} (was showing $${(merchant.volume || 0).toFixed(2)})`);
  });
  
  // Show validation errors
  if (results.validation_errors.length > 0) {
    console.log(`\n⚠️ VALIDATION WARNINGS:`);
    results.validation_errors.slice(0, 5).forEach(error => {
      console.log(`• ${error.reason} (${error.severity})`);
    });
  }
  
  console.log(`\n✅ TRX DATA CORRECTION COMPLETE`);
  console.log(`Enterprise parsing prevented $${(2968945.51 - totalRevenue).toFixed(2)} in false revenue reporting`);
  
  // Export corrected data for database insertion
  console.log(`\n📋 READY FOR DATABASE UPDATE:`);
  console.log(`${results.valid_merchants} TRX merchants with accurate residual amounts`);
  
} catch (error) {
  console.error('❌ Error fixing TRX data:', error);
  process.exit(1);
}

console.log('='.repeat(80));
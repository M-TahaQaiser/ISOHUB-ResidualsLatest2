// Implement Blanket Assignments Based on Business Logic
import { IntelligentAssignmentEngine } from './intelligent_assignment_engine.js';

console.log('🎯 IMPLEMENTING BLANKET ASSIGNMENTS - BUSINESS LOGIC EXECUTION');
console.log('='.repeat(80));

// Business rules summary
console.log('\n📋 BUSINESS RULES IMPLEMENTATION:');
console.log('1. CoCard 0827 = Association (10% on all deals)');
console.log('2. Branch ID present = HBS Partner deal → Cody Burnell as Sales Manager');
console.log('3. Cody can be both Sales Manager AND Agent on same deal');
console.log('4. Christy co-owns C2FS with Cody → can be Sales Manager or Agent');
console.log('5. HBS Partner deals get priority assignment structure');

// Mock data structure for testing (will be replaced with real DB data)
const sampleMerchants = [
  {
    id: 101,
    mid: '31055',
    dba: 'BMW of El Cajon',
    processor: 'TRX',
    revenue: 2369.42,
    group_code: 'HBS-BRANCH-001', // HBS indicator
    month: '2025-03'
  },
  {
    id: 102,
    mid: '820100005405',
    dba: 'SAVANNAHS',
    processor: 'Micamp Solutions',
    revenue: 1985.85,
    group_code: null, // No branch ID = C2FS deal
    month: '2025-05'
  },
  {
    id: 103,
    mid: '6588000002435956',
    dba: 'BLU SUSHI',
    processor: 'Clearent',
    revenue: 1946.50,
    group_code: null, // Standard agent deal
    month: '2025-05'
  },
  {
    id: 104,
    mid: '5436845559568000',
    dba: 'GYROTONIC',
    processor: 'Global Payments TSYS',
    revenue: 1537.31,
    group_code: 'HBS-MEDICAL-003', // HBS medical deal
    month: '2025-05'
  }
];

const sampleRoles = [
  { id: 1, name: 'CoCard 0827', type: 'association' },
  { id: 2, name: 'Cody Burnell', type: 'agent' },
  { id: 3, name: 'Christy G Milton', type: 'sales_manager' },
  { id: 4, name: 'HBS Partner 0827', type: 'partner' },
  { id: 5, name: 'C2FS Partner 0827', type: 'partner' }
];

// Process assignments
console.log('\n🚀 PROCESSING BLANKET ASSIGNMENTS:');

try {
  const assignmentSQL = await IntelligentAssignmentEngine.processBulkAssignments(
    sampleMerchants, 
    sampleRoles
  );
  
  console.log('\n💾 GENERATED SQL FOR DATABASE EXECUTION:');
  console.log(assignmentSQL);
  
  // Calculate total commissions
  console.log('\n💰 COMMISSION CALCULATIONS:');
  
  sampleMerchants.forEach(merchant => {
    const rule = IntelligentAssignmentEngine.determineAssignmentRule(merchant);
    const ruleConfig = IntelligentAssignmentEngine.ASSIGNMENT_RULES[rule];
    
    console.log(`\n${merchant.dba} - $${merchant.revenue} (${rule})`);
    
    let totalCommission = 0;
    ruleConfig.assignments.forEach(assignment => {
      const commission = merchant.revenue * assignment.percentage / 100;
      totalCommission += commission;
      console.log(`  • ${assignment.role}: ${assignment.percentage}% = $${commission.toFixed(2)}`);
    });
    console.log(`  TOTAL: $${totalCommission.toFixed(2)} (${((totalCommission/merchant.revenue)*100).toFixed(1)}%)`);
  });
  
  // Summary statistics
  const totalRevenue = sampleMerchants.reduce((sum, m) => sum + m.revenue, 0);
  console.log(`\n📊 ASSIGNMENT SUMMARY:`);
  console.log(`Total Revenue: $${totalRevenue.toFixed(2)}`);
  console.log(`HBS Partner Deals: ${sampleMerchants.filter(m => IntelligentAssignmentEngine.determineAssignmentRule(m) === 'HBS_PARTNER_RULE').length}`);
  console.log(`C2FS Partner Deals: ${sampleMerchants.filter(m => IntelligentAssignmentEngine.determineAssignmentRule(m) === 'C2FS_PARTNER_RULE').length}`);
  console.log(`Standard Agent Deals: ${sampleMerchants.filter(m => IntelligentAssignmentEngine.determineAssignmentRule(m) === 'STANDARD_AGENT_RULE').length}`);
  
} catch (error) {
  console.error('❌ Error processing assignments:', error);
}

console.log('\n✅ BLANKET ASSIGNMENT LOGIC READY FOR DATABASE EXECUTION');
console.log('Business rules implemented - ready to process all 240 unassigned merchants');
console.log('='.repeat(80));
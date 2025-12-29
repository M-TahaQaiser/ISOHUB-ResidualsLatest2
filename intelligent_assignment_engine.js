// Intelligent Assignment Engine - Business Logic Implementation
console.log('🎯 INTELLIGENT ASSIGNMENT ENGINE - BUSINESS LOGIC IMPLEMENTATION');
console.log('='.repeat(80));

class IntelligentAssignmentEngine {
  
  // Business rules based on user requirements
  static ASSIGNMENT_RULES = {
    
    // Rule 1: CoCard 0827 is Association for all deals
    ASSOCIATION_RULE: {
      role: 'CoCard 0827',
      type: 'association',
      percentage: 10, // Typical association fee
      applies_to: 'ALL_DEALS'
    },
    
    // Rule 2: HBS Partner deals (identified by branch ID)
    HBS_PARTNER_RULE: {
      conditions: ['has_branch_id', 'group_code_present'],
      assignments: [
        { role: 'HBS Partner 0827', type: 'partner', percentage: 40 },
        { role: 'Cody Burnell', type: 'sales_manager', percentage: 30 },
        { role: 'Cody Burnell', type: 'agent', percentage: 20 }, // Can be both
        { role: 'CoCard 0827', type: 'association', percentage: 10 }
      ]
    },
    
    // Rule 3: C2FS Partner deals (Christy co-owner with Cody)
    C2FS_PARTNER_RULE: {
      conditions: ['c2fs_indicator'],
      assignments: [
        { role: 'C2FS Partner 0827', type: 'partner', percentage: 45 },
        { role: 'Christy G Milton', type: 'sales_manager', percentage: 35 },
        { role: 'Cody Burnell', type: 'agent', percentage: 10 }, // Co-owner
        { role: 'CoCard 0827', type: 'association', percentage: 10 }
      ]
    },
    
    // Rule 4: Standard agent deals
    STANDARD_AGENT_RULE: {
      conditions: ['no_partner_indicators'],
      assignments: [
        { role: 'Cody Burnell', type: 'agent', percentage: 70 },
        { role: 'Christy G Milton', type: 'sales_manager', percentage: 20 },
        { role: 'CoCard 0827', type: 'association', percentage: 10 }
      ]
    }
  };

  // Analyze merchant data to determine assignment rule
  static determineAssignmentRule(merchant) {
    console.log(`\n🔍 ANALYZING: ${merchant.dba} (${merchant.processor})`);
    
    // Check for HBS Partner indicators
    if (merchant.group_code || merchant.branch_id) {
      console.log(`  ✅ HBS PARTNER DEAL - Branch ID/Group Code detected: ${merchant.group_code || merchant.branch_id}`);
      return 'HBS_PARTNER_RULE';
    }
    
    // Check for C2FS indicators (could be processor-specific)
    if (merchant.processor === 'Micamp Solutions' || merchant.dba.includes('C2FS')) {
      console.log(`  ✅ C2FS PARTNER DEAL - Processor/name indicator`);
      return 'C2FS_PARTNER_RULE';
    }
    
    // Check for high-value TRX deals (might indicate partner involvement)
    if (merchant.processor === 'TRX' && merchant.revenue > 1000) {
      console.log(`  ✅ HIGH-VALUE TRX DEAL - Potential partner involvement`);
      return 'HBS_PARTNER_RULE';
    }
    
    // Default to standard agent rule
    console.log(`  ✅ STANDARD AGENT DEAL - Default assignment`);
    return 'STANDARD_AGENT_RULE';
  }

  // Generate assignment SQL based on rule
  static generateAssignmentSQL(merchant, rule, roleMap) {
    const ruleConfig = this.ASSIGNMENT_RULES[rule];
    let sqlStatements = [];
    
    console.log(`\n📋 GENERATING ASSIGNMENTS FOR: ${merchant.dba}`);
    console.log(`   Rule: ${rule}`);
    console.log(`   Revenue: $${merchant.revenue}`);
    
    ruleConfig.assignments.forEach(assignment => {
      const roleId = roleMap[assignment.role];
      if (roleId) {
        const commission = (merchant.revenue * assignment.percentage / 100).toFixed(2);
        
        console.log(`   • ${assignment.role} (${assignment.type}): ${assignment.percentage}% = $${commission}`);
        
        sqlStatements.push(`
INSERT INTO assignments (merchant_id, role_id, percentage, month)
SELECT ${merchant.id}, ${roleId}, ${assignment.percentage}, '${merchant.month}'
WHERE NOT EXISTS (
  SELECT 1 FROM assignments 
  WHERE merchant_id = ${merchant.id} 
  AND role_id = ${roleId} 
  AND month = '${merchant.month}'
);`);
      }
    });
    
    return sqlStatements;
  }

  // Process bulk assignments for all unassigned merchants
  static async processBulkAssignments(merchants, roles) {
    console.log(`\n🚀 PROCESSING BULK ASSIGNMENTS FOR ${merchants.length} MERCHANTS`);
    
    // Create role mapping
    const roleMap = {};
    roles.forEach(role => {
      roleMap[role.name] = role.id;
    });
    
    console.log('\n📊 ROLE MAPPING:');
    Object.entries(roleMap).forEach(([name, id]) => {
      console.log(`  ${name} → ID: ${id}`);
    });
    
    let allSQL = [];
    let ruleStats = {};
    
    merchants.forEach(merchant => {
      const rule = this.determineAssignmentRule(merchant);
      
      // Track rule usage
      ruleStats[rule] = (ruleStats[rule] || 0) + 1;
      
      // Generate SQL for this merchant
      const merchantSQL = this.generateAssignmentSQL(merchant, rule, roleMap);
      allSQL.push(...merchantSQL);
    });
    
    console.log('\n📈 ASSIGNMENT RULE STATISTICS:');
    Object.entries(ruleStats).forEach(([rule, count]) => {
      console.log(`  ${rule}: ${count} merchants`);
    });
    
    console.log(`\n💾 GENERATED ${allSQL.length} ASSIGNMENT STATEMENTS`);
    return allSQL.join('\n');
  }

  // Validate assignments total 100% per merchant
  static validateAssignments(assignments) {
    const merchantTotals = {};
    
    assignments.forEach(assignment => {
      const key = `${assignment.merchant_id}_${assignment.month}`;
      merchantTotals[key] = (merchantTotals[key] || 0) + assignment.percentage;
    });
    
    const validationResults = [];
    Object.entries(merchantTotals).forEach(([key, total]) => {
      if (Math.abs(total - 100) > 0.01) {
        validationResults.push({
          merchant_month: key,
          total_percentage: total,
          error: `Total ${total}% ≠ 100%`
        });
      }
    });
    
    return validationResults;
  }
}

// Test assignment logic
console.log('\n🧪 TESTING ASSIGNMENT LOGIC:');

const testMerchants = [
  {
    id: 1,
    dba: 'BMW of El Cajon',
    processor: 'TRX',
    revenue: 2369.42,
    group_code: 'HBS-001',
    month: '2025-03'
  },
  {
    id: 2,
    dba: 'SAVANNAHS',
    processor: 'Micamp Solutions',
    revenue: 1985.85,
    group_code: null,
    month: '2025-05'
  },
  {
    id: 3,
    dba: 'BLU SUSHI',
    processor: 'Clearent',
    revenue: 1946.50,
    group_code: null,
    month: '2025-05'
  }
];

testMerchants.forEach(merchant => {
  const rule = IntelligentAssignmentEngine.determineAssignmentRule(merchant);
  console.log(`${merchant.dba} → ${rule}`);
});

console.log('\n✅ INTELLIGENT ASSIGNMENT ENGINE READY');
console.log('Business logic implemented for automatic commission distribution');

export { IntelligentAssignmentEngine };
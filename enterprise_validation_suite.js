// Enterprise Data Validation Suite
import { EnterpriseParsingEngine } from './enterprise_processor_parsers.js';

class EnterpriseValidationSuite {
  
  // Cross-processor duplicate MID detection
  static detectDuplicateMIDs(allMerchants) {
    const midMap = new Map();
    const duplicates = [];
    
    allMerchants.forEach(merchant => {
      const key = merchant.mid.toString();
      if (midMap.has(key)) {
        duplicates.push({
          mid: key,
          merchants: [midMap.get(key), merchant],
          issue: 'Same MID across different processors'
        });
      } else {
        midMap.set(key, merchant);
      }
    });
    
    return duplicates;
  }
  
  // Revenue anomaly detection
  static detectRevenueAnomalies(merchants, processor) {
    const anomalies = [];
    const revenues = merchants.map(m => m.revenue).filter(r => r > 0);
    
    if (revenues.length === 0) return anomalies;
    
    const avg = revenues.reduce((a, b) => a + b, 0) / revenues.length;
    const max = Math.max(...revenues);
    const min = Math.min(...revenues);
    
    // Statistical outlier detection
    merchants.forEach(merchant => {
      if (merchant.revenue > avg * 10) {
        anomalies.push({
          type: 'EXTREME_REVENUE_OUTLIER',
          merchant: merchant.name,
          revenue: merchant.revenue,
          avg_for_processor: avg.toFixed(2),
          severity: 'CRITICAL'
        });
      }
      
      if (merchant.revenue > 0 && merchant.transactions === 0) {
        anomalies.push({
          type: 'REVENUE_WITHOUT_TRANSACTIONS',
          merchant: merchant.name,
          revenue: merchant.revenue,
          severity: 'HIGH'
        });
      }
    });
    
    return anomalies;
  }
  
  // Cross-month consistency validation
  static validateMonthlyConsistency(currentMonth, previousMonth) {
    const consistency = [];
    const currentMIDs = new Set(currentMonth.map(m => m.mid));
    const previousMIDs = new Set(previousMonth.map(m => m.mid));
    
    // Check for merchants with extreme variance
    currentMonth.forEach(current => {
      const previous = previousMonth.find(p => p.mid === current.mid);
      if (previous && previous.revenue > 0 && current.revenue > 0) {
        const variance = Math.abs(current.revenue - previous.revenue) / previous.revenue;
        
        if (variance > 5.0) { // 500% change
          consistency.push({
            type: 'EXTREME_MONTH_VARIANCE',
            merchant: current.name,
            current_revenue: current.revenue,
            previous_revenue: previous.revenue,
            variance_percent: (variance * 100).toFixed(1),
            severity: 'HIGH'
          });
        }
      }
    });
    
    return consistency;
  }
  
  // Generate comprehensive audit report
  static generateAuditReport(processors) {
    const report = {
      timestamp: new Date().toISOString(),
      processors: {},
      global_issues: [],
      summary: {}
    };
    
    let totalMerchants = 0;
    let totalRevenue = 0;
    const allMerchants = [];
    
    // Process each processor
    Object.entries(processors).forEach(([processor, data]) => {
      const anomalies = this.detectRevenueAnomalies(data.merchants, processor);
      
      report.processors[processor] = {
        merchant_count: data.merchants.length,
        total_revenue: data.merchants.reduce((sum, m) => sum + m.revenue, 0),
        avg_revenue: data.merchants.length > 0 ? 
          (data.merchants.reduce((sum, m) => sum + m.revenue, 0) / data.merchants.length).toFixed(2) : 0,
        anomalies: anomalies,
        validation_errors: data.validation_errors || []
      };
      
      totalMerchants += data.merchants.length;
      totalRevenue += report.processors[processor].total_revenue;
      allMerchants.push(...data.merchants);
    });
    
    // Global validations
    const duplicateMIDs = this.detectDuplicateMIDs(allMerchants);
    report.global_issues.push(...duplicateMIDs);
    
    report.summary = {
      total_processors: Object.keys(processors).length,
      total_merchants: totalMerchants,
      total_revenue: totalRevenue.toFixed(2),
      avg_revenue_per_merchant: totalMerchants > 0 ? (totalRevenue / totalMerchants).toFixed(2) : 0,
      critical_issues: this.countIssuesBySeverity(report, 'CRITICAL'),
      high_issues: this.countIssuesBySeverity(report, 'HIGH'),
      medium_issues: this.countIssuesBySeverity(report, 'MEDIUM')
    };
    
    return report;
  }
  
  // Helper to count issues by severity
  static countIssuesBySeverity(report, severity) {
    let count = 0;
    
    Object.values(report.processors).forEach(processor => {
      count += processor.anomalies.filter(a => a.severity === severity).length;
      count += processor.validation_errors.filter(e => e.severity === severity).length;
    });
    
    count += report.global_issues.filter(i => i.severity === severity).length;
    
    return count;
  }
}

// Test enterprise validation on current data
console.log('🔍 ENTERPRISE VALIDATION SUITE TEST');
console.log('='.repeat(60));

// Mock current processor data for testing
const testData = {
  'Clearent': {
    merchants: [
      { mid: '123', name: 'BLU SUSHI', revenue: 2178.82, transactions: 2521 },
      { mid: '456', name: 'LOW KEY FISHERIES', revenue: 1227.47, transactions: 1259 }
    ],
    validation_errors: []
  },
  'TRX': {
    merchants: [
      { mid: '789', name: 'BMW El Cajon', revenue: 544378.17, transactions: 0 }, // This will flag as anomaly
      { mid: '101', name: 'Regular Merchant', revenue: 45.50, transactions: 120 }
    ],
    validation_errors: []
  }
};

const auditReport = EnterpriseValidationSuite.generateAuditReport(testData);

console.log('\n📊 AUDIT REPORT SUMMARY:');
console.log(`Total Processors: ${auditReport.summary.total_processors}`);
console.log(`Total Merchants: ${auditReport.summary.total_merchants}`);
console.log(`Total Revenue: $${auditReport.summary.total_revenue}`);
console.log(`Critical Issues: ${auditReport.summary.critical_issues}`);
console.log(`High Issues: ${auditReport.summary.high_issues}`);

console.log('\n🚨 DETECTED ANOMALIES:');
Object.entries(auditReport.processors).forEach(([processor, data]) => {
  if (data.anomalies.length > 0) {
    console.log(`${processor}:`);
    data.anomalies.forEach(anomaly => {
      console.log(`  • ${anomaly.type}: ${anomaly.merchant} - $${anomaly.revenue} (${anomaly.severity})`);
    });
  }
});

console.log('\n✅ ENTERPRISE VALIDATION SUITE READY');

export { EnterpriseValidationSuite };
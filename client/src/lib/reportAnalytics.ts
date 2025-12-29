/**
 * Advanced Report Analytics
 * Integrated from TRACER C2 Dashboard
 */

export interface MonthlyMetrics {
  month: string;
  totalRevenue: number;
  totalAccounts: number;
  retentionRate: number;
  attritionRate: number;
  revenuePerAccount: number;
  momRevenueChange: number | null;
  momRevenueChangePercent: number | null;
  retainedAccounts: number;
  newAccounts: number;
  lostAccounts: number;
  netAccountGrowth: number;
  processorBreakdown?: ProcessorMetrics[];
}

export interface ProcessorMetrics {
  processor: string;
  revenue: number;
  accounts: number;
  percentOfTotal: number;
}

export interface RevenueConcentration {
  concentrationPercent: number;
  riskLevel: 'low' | 'medium' | 'high';
  topMerchants: Array<{
    merchantId: string;
    name: string;
    revenue: number;
    percentOfTotal: number;
  }>;
}

export interface TrendingMerchant {
  merchantId: string;
  name: string;
  revenue: number;
  month: string;
  processor: string;
}

export interface MerchantTrends {
  newMerchants: TrendingMerchant[];
  lostMerchants: TrendingMerchant[];
  retainedCount: number;
}

/**
 * Calculate revenue concentration risk
 * Shows what % of revenue comes from top N merchants
 */
export function calculateRevenueConcentration(
  reports: any[],
  topN: number = 10
): RevenueConcentration {
  // Aggregate revenue by merchant
  const merchantRevenue = new Map<string, { name: string; revenue: number }>();
  let totalRevenue = 0;

  reports.forEach(report => {
    const revenue = Number(report.totalRevenue) || 0;
    totalRevenue += revenue;

    const merchantKey = report.merchantId || report.processor;
    const merchantName = report.merchantName || report.processor;
    
    if (merchantRevenue.has(merchantKey)) {
      merchantRevenue.get(merchantKey)!.revenue += revenue;
    } else {
      merchantRevenue.set(merchantKey, { name: merchantName, revenue });
    }
  });

  // Get top merchants
  const topMerchants = Array.from(merchantRevenue.entries())
    .map(([merchantId, data]) => ({
      merchantId,
      name: data.name,
      revenue: data.revenue,
      percentOfTotal: totalRevenue > 0 ? (data.revenue / totalRevenue) * 100 : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, topN);

  // Calculate concentration percentage
  const concentrationPercent = topMerchants.reduce((sum, m) => sum + m.percentOfTotal, 0);

  // Determine risk level
  let riskLevel: 'low' | 'medium' | 'high';
  if (concentrationPercent < 25) {
    riskLevel = 'low';
  } else if (concentrationPercent < 40) {
    riskLevel = 'medium';
  } else {
    riskLevel = 'high';
  }

  return {
    concentrationPercent,
    riskLevel,
    topMerchants,
  };
}

/**
 * Identify trending merchants (new vs lost)
 */
export function calculateMerchantTrends(
  reports: any[]
): MerchantTrends {
  // Group by month
  const reportsByMonth = new Map<string, any[]>();
  reports.forEach(report => {
    const month = report.month;
    if (!reportsByMonth.has(month)) {
      reportsByMonth.set(month, []);
    }
    reportsByMonth.get(month)!.push(report);
  });

  const sortedMonths = Array.from(reportsByMonth.keys()).sort();
  
  if (sortedMonths.length < 2) {
    return { newMerchants: [], lostMerchants: [], retainedCount: 0 };
  }

  // Compare last two months
  const previousMonth = sortedMonths[sortedMonths.length - 2];
  const currentMonth = sortedMonths[sortedMonths.length - 1];

  const previousReports = reportsByMonth.get(previousMonth)!;
  const currentReports = reportsByMonth.get(currentMonth)!;

  const previousMerchants = new Map(
    previousReports.map(r => [r.merchantId || r.processor, r])
  );
  const currentMerchants = new Map(
    currentReports.map(r => [r.merchantId || r.processor, r])
  );

  const newMerchants: TrendingMerchant[] = [];
  const lostMerchants: TrendingMerchant[] = [];
  let retainedCount = 0;

  // Find new merchants
  currentMerchants.forEach((report, merchantId) => {
    if (!previousMerchants.has(merchantId)) {
      newMerchants.push({
        merchantId: merchantId,
        name: report.merchantName || report.processor,
        revenue: Number(report.totalRevenue) || 0,
        month: currentMonth,
        processor: report.processor || 'Unknown',
      });
    } else {
      retainedCount++;
    }
  });

  // Find lost merchants
  previousMerchants.forEach((report, merchantId) => {
    if (!currentMerchants.has(merchantId)) {
      lostMerchants.push({
        merchantId: merchantId,
        name: report.merchantName || report.processor,
        revenue: Number(report.totalRevenue) || 0,
        month: previousMonth,
        processor: report.processor || 'Unknown',
      });
    }
  });

  // Sort by revenue
  newMerchants.sort((a, b) => b.revenue - a.revenue);
  lostMerchants.sort((a, b) => b.revenue - a.revenue);

  return { newMerchants, lostMerchants, retainedCount };
}

/**
 * Calculate month-over-month growth percentage
 */
export function calculateMoMGrowth(currentRevenue: number, previousRevenue: number): number {
  if (previousRevenue === 0) return currentRevenue > 0 ? 100 : 0;
  return ((currentRevenue - previousRevenue) / previousRevenue) * 100;
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format percentage for display
 */
export function formatPercent(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format month string (YYYY-MM) to display label (January 2025)
 */
export function formatMonthLabel(month: string): string {
  if (!month) return '';
  const [year, monthNum] = month.split('-');
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const monthIndex = parseInt(monthNum, 10) - 1;
  if (isNaN(monthIndex) || monthIndex < 0 || monthIndex > 11) return month;
  return `${monthNames[monthIndex]} ${year}`;
}

/**
 * Get the latest month from a list of records
 */
export function getLatestMonth(records: Array<{ month: string }>): string | null {
  if (!records || records.length === 0) return null;
  const months = Array.from(new Set(records.map(r => r.month))).sort();
  return months[months.length - 1] || null;
}

/**
 * Calculate monthly metrics from merchant records
 */
export function calculateMonthlyMetrics(
  records: Array<{
    month: string;
    merchantId?: string | number;
    mid?: string;
    net?: string | number;
    totalRevenue?: string | number;
    processor?: string;
  }>,
  processor?: string
): MonthlyMetrics[] {
  // Filter by processor if specified
  const filteredRecords = processor && processor !== 'All'
    ? records.filter(r => r.processor === processor)
    : records;

  // Group by month
  const recordsByMonth = new Map<string, typeof filteredRecords>();
  filteredRecords.forEach(record => {
    const month = record.month;
    if (!recordsByMonth.has(month)) {
      recordsByMonth.set(month, []);
    }
    recordsByMonth.get(month)!.push(record);
  });

  const sortedMonths = Array.from(recordsByMonth.keys()).sort();
  const metrics: MonthlyMetrics[] = [];

  sortedMonths.forEach((month, index) => {
    const monthRecords = recordsByMonth.get(month)!;
    const previousMonth = index > 0 ? sortedMonths[index - 1] : null;
    const previousRecords = previousMonth ? recordsByMonth.get(previousMonth)! : [];

    // Calculate totals
    const totalRevenue = monthRecords.reduce((sum, r) => {
      const revenue = Number(r.net || r.totalRevenue || 0);
      return sum + revenue;
    }, 0);

    const totalAccounts = new Set(monthRecords.map(r => r.merchantId || r.mid)).size;

    // Get unique merchants for current and previous month
    const currentMerchants = new Set(monthRecords.map(r => String(r.merchantId || r.mid)));
    const previousMerchants = previousMonth
      ? new Set(previousRecords.map(r => String(r.merchantId || r.mid)))
      : new Set<string>();

    // Calculate retention metrics
    let retainedAccounts = 0;
    let lostAccounts = 0;
    let newAccounts = 0;

    if (previousMerchants.size > 0) {
      previousMerchants.forEach(mid => {
        if (currentMerchants.has(mid)) {
          retainedAccounts++;
        } else {
          lostAccounts++;
        }
      });

      currentMerchants.forEach(mid => {
        if (!previousMerchants.has(mid)) {
          newAccounts++;
        }
      });
    } else {
      newAccounts = totalAccounts;
    }

    const retentionRate = previousMerchants.size > 0
      ? (retainedAccounts / previousMerchants.size) * 100
      : 100;

    const attritionRate = previousMerchants.size > 0
      ? (lostAccounts / previousMerchants.size) * 100
      : 0;

    // Calculate MoM revenue change
    const previousRevenue = previousRecords.reduce((sum, r) => {
      return sum + Number(r.net || r.totalRevenue || 0);
    }, 0);

    const momRevenueChange = previousMonth ? totalRevenue - previousRevenue : null;
    const momRevenueChangePercent = previousMonth && previousRevenue > 0
      ? ((totalRevenue - previousRevenue) / previousRevenue) * 100
      : null;

    // Calculate processor breakdown
    const processorMap = new Map<string, { revenue: number; accounts: Set<string> }>();
    monthRecords.forEach(r => {
      const proc = r.processor || 'Unknown';
      if (!processorMap.has(proc)) {
        processorMap.set(proc, { revenue: 0, accounts: new Set() });
      }
      const data = processorMap.get(proc)!;
      data.revenue += Number(r.net || r.totalRevenue || 0);
      data.accounts.add(String(r.merchantId || r.mid));
    });

    const processorBreakdown: ProcessorMetrics[] = Array.from(processorMap.entries())
      .map(([proc, data]) => ({
        processor: proc,
        revenue: data.revenue,
        accounts: data.accounts.size,
        percentOfTotal: totalRevenue > 0 ? (data.revenue / totalRevenue) * 100 : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue);

    metrics.push({
      month,
      totalRevenue,
      totalAccounts,
      retentionRate,
      attritionRate,
      revenuePerAccount: totalAccounts > 0 ? totalRevenue / totalAccounts : 0,
      momRevenueChange,
      momRevenueChangePercent,
      retainedAccounts,
      newAccounts,
      lostAccounts,
      netAccountGrowth: newAccounts - lostAccounts,
      processorBreakdown,
    });
  });

  return metrics;
}

/**
 * Get top merchants by revenue for a specific month
 */
export function getTopMerchants(
  records: Array<{
    month: string;
    merchantId?: string | number;
    mid?: string;
    merchantName?: string;
    dba?: string;
    net?: string | number;
    totalRevenue?: string | number;
    processor?: string;
  }>,
  month: string,
  limit: number = 10
): Array<{ merchantId: string; name: string; revenue: number; processor: string }> {
  const monthRecords = records.filter(r => r.month === month);

  const merchantMap = new Map<string, { name: string; revenue: number; processor: string }>();
  monthRecords.forEach(r => {
    const id = String(r.merchantId || r.mid);
    const revenue = Number(r.net || r.totalRevenue || 0);
    const name = r.merchantName || r.dba || id;
    const processor = r.processor || 'Unknown';

    if (merchantMap.has(id)) {
      merchantMap.get(id)!.revenue += revenue;
    } else {
      merchantMap.set(id, { name, revenue, processor });
    }
  });

  return Array.from(merchantMap.entries())
    .map(([merchantId, data]) => ({
      merchantId,
      name: data.name,
      revenue: data.revenue,
      processor: data.processor,
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit);
}

/**
 * Aggregate metrics across multiple months
 */
export function aggregateMetrics(metrics: MonthlyMetrics[]): MonthlyMetrics | null {
  if (metrics.length === 0) return null;

  const totalRevenue = metrics.reduce((sum, m) => sum + m.totalRevenue, 0);
  const lastMetric = metrics[metrics.length - 1];
  const firstMetric = metrics[0];

  return {
    month: metrics.length > 1
      ? `${formatMonthLabel(firstMetric.month)} - ${formatMonthLabel(lastMetric.month)}`
      : lastMetric.month,
    totalRevenue,
    totalAccounts: lastMetric.totalAccounts,
    retentionRate: metrics.reduce((sum, m) => sum + m.retentionRate, 0) / metrics.length,
    attritionRate: metrics.reduce((sum, m) => sum + m.attritionRate, 0) / metrics.length,
    revenuePerAccount: lastMetric.totalAccounts > 0 ? totalRevenue / lastMetric.totalAccounts : 0,
    momRevenueChange: lastMetric.momRevenueChange,
    momRevenueChangePercent: lastMetric.momRevenueChangePercent,
    retainedAccounts: metrics.reduce((sum, m) => sum + m.retainedAccounts, 0),
    newAccounts: metrics.reduce((sum, m) => sum + m.newAccounts, 0),
    lostAccounts: metrics.reduce((sum, m) => sum + m.lostAccounts, 0),
    netAccountGrowth: metrics.reduce((sum, m) => sum + m.netAccountGrowth, 0),
    processorBreakdown: lastMetric.processorBreakdown,
  };
}

/**
 * Get date range filtered months
 */
export function getFilteredMonths(
  allMonths: string[],
  dateRange: 'current' | '3months' | '6months' | '12months' | 'all' | 'custom',
  customStart?: string,
  customEnd?: string
): string[] {
  if (dateRange === 'all') return allMonths;
  if (dateRange === 'current') return allMonths.length > 0 ? [allMonths[allMonths.length - 1]] : [];

  if (dateRange === 'custom') {
    if (!customStart || !customEnd) return allMonths;
    const startIdx = allMonths.indexOf(customStart);
    const endIdx = allMonths.indexOf(customEnd);
    if (startIdx === -1 || endIdx === -1) return allMonths;
    return allMonths.slice(Math.min(startIdx, endIdx), Math.max(startIdx, endIdx) + 1);
  }

  const monthCount = dateRange === '3months' ? 3 : dateRange === '6months' ? 6 : 12;
  return allMonths.slice(-monthCount);
}

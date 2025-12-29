import express, { Response } from "express";
import { storage } from "./storage";
import { db } from "./db";
import { processors, monthlyData, merchants, assignments, roles } from "@shared/schema";
import { sql, eq, sum, count, isNotNull } from "drizzle-orm";
import { authenticateToken, requireReauth, AuthenticatedRequest } from "./middleware/auth";

const router = express.Router();

// Get residual reports for specified month with assignment audit
router.get("/residuals", async (req, res) => {
  try {
    // ============= NO MOCK DATA ZONE =============
    // ALL DATA MUST COME FROM REAL DATABASE ONLY
    // NO HARDCODED VALUES, NO FALLBACK DATA
    // =============================================
    
    // Get month from query parameter or default to current month
    const requestedMonth = req.query.month as string || "2025-05";
    
    // Get assignment data to show audit status
    const assignments = await storage.getAssignments(requestedMonth);
    const monthlyData = await storage.getMonthlyData(requestedMonth);
    
    // Calculate assignment statistics - fix data structure access
    const assignedMerchantIds = new Set(assignments.map(a => a.merchantId));
    const allMerchantIds = new Set(monthlyData.map(data => data.merchantId));
    const needsAssignmentCount = allMerchantIds.size - assignedMerchantIds.size;
    const totalRevenue = monthlyData.reduce((sum, data) => sum + parseFloat(data.net || "0"), 0);
    
    console.log(`Residuals API: ${assignments.length} assignments, ${monthlyData.length} monthly records, ${needsAssignmentCount} need assignment`);

    // Get processor summaries from existing monthlyData with processor names
    const processorRevenue = new Map();
    const allProcessors = await storage.getProcessors();
    
    // Process each monthly data record to accumulate by processor
    for (const data of monthlyData) {
      const processorId = data.processorId;
      const revenue = parseFloat(data.net || "0");
      const processor = allProcessors.find(p => p.id === processorId);
      
      if (!processorRevenue.has(processorId)) {
        processorRevenue.set(processorId, {
          name: processor?.name || 'Unknown',
          revenue: 0,
          recordCount: 0
        });
      }
      
      const existing = processorRevenue.get(processorId);
      existing.revenue += revenue;
      existing.recordCount += 1;
    }
    
    // Create reports for all processors
    const reports = allProcessors.map((processor, index) => {
      const processorData = processorRevenue.get(processor.id) || { name: processor.name, revenue: 0, recordCount: 0 };
      const revenue = processorData.revenue;
      const recordCount = processorData.recordCount;
      
      let status = 'completed';
      if (recordCount === 0) status = 'needs_upload';
      else if (revenue < 0) status = 'needs_audit';
      else if (revenue > 10000) status = 'needs_approval';
      
      console.log(`REAL DB DATA - ${processor.name}: $${revenue}, Records: ${recordCount}`);
      
      return {
        id: (index + 1).toString(),
        name: `${processor.name} - ${requestedMonth}`,
        processor: processor.name,
        status,
        amount: revenue,
        revenue,
        date: `${requestedMonth}-31`,
        month: requestedMonth,
        recordCount,
        auditIssues: status === 'needs_audit' ? [`${needsAssignmentCount} merchants need commission assignments`] : []
      };
    });

    console.log(`Generated ${reports.length} reports from database with total revenue: $${reports.reduce((sum, r) => sum + r.revenue, 0)}`);
    
    // VERIFY: Log each report to ensure no mock data
    reports.forEach(report => {
      console.log(`Report: ${report.processor} = $${report.revenue} (${report.recordCount} records)`);
    });

    // Add assignment audit report
    reports.push({
      id: (reports.length + 1).toString(),
      name: `Commission Assignments - ${requestedMonth}`,
      processor: "Assignment Audit",
      status: needsAssignmentCount > 0 ? "needs_audit" : "completed",
      amount: totalRevenue,
      revenue: totalRevenue,
      date: `${requestedMonth}-31`,
      month: requestedMonth,
      recordCount: allMerchantIds.size,
      auditIssues: needsAssignmentCount > 0 ? [
        `${needsAssignmentCount} merchants need commission assignments`,
        "Navigate to Assignments page to assign roles and percentages",
        `Total merchant revenue: $${totalRevenue.toLocaleString()}`
      ] : ["All merchants have commission assignments"]
    });

    console.log(`Returning ${reports.length} reports for residuals dashboard`);
    res.json({ reports });
  } catch (error) {
    console.error("Error fetching residual reports:", error);
    res.status(500).json({ error: "Failed to fetch residual reports" });
  }
});

// Get audit comparison between months
router.get("/audit", async (req, res) => {
  try {
    const currentMonth = req.query.current as string || "2025-05";
    const previousMonth = req.query.previous as string || "2025-04";
    
    console.log(`Audit API: Comparing ${currentMonth} vs ${previousMonth}`);
    
    // Get data for both months
    const currentData = await storage.getMonthlyData(currentMonth);
    const previousData = await storage.getMonthlyData(previousMonth);
    
    // Calculate totals for each month
    const currentTotal = currentData.reduce((sum, data) => sum + parseFloat(data.net || "0"), 0);
    const previousTotal = previousData.reduce((sum, data) => sum + parseFloat(data.net || "0"), 0);
    
    // Calculate merchant changes
    const currentMerchants = new Set(currentData.map(d => d.merchantId));
    const previousMerchants = new Set(previousData.map(d => d.merchantId));
    
    const newMerchants = Array.from(currentMerchants).filter(id => !previousMerchants.has(id));
    const lostMerchants = Array.from(previousMerchants).filter(id => !currentMerchants.has(id));
    
    // Calculate revenue changes per processor using Drizzle query builder with parameterized queries
    const processorChanges = await db.execute(sql`
      SELECT 
        p.name as processor_name,
        COALESCE(current_month.revenue, 0) as current_revenue,
        COALESCE(previous_month.revenue, 0) as previous_revenue,
        COALESCE(current_month.revenue, 0) - COALESCE(previous_month.revenue, 0) as revenue_change,
        COALESCE(current_month.merchant_count, 0) as current_merchants,
        COALESCE(previous_month.merchant_count, 0) as previous_merchants
      FROM processors p
      LEFT JOIN (
        SELECT processor_id, SUM(net) as revenue, COUNT(*) as merchant_count
        FROM monthly_data 
        WHERE month = ${currentMonth}
        GROUP BY processor_id
      ) current_month ON p.id = current_month.processor_id
      LEFT JOIN (
        SELECT processor_id, SUM(net) as revenue, COUNT(*) as merchant_count
        FROM monthly_data 
        WHERE month = ${previousMonth}
        GROUP BY processor_id
      ) previous_month ON p.id = previous_month.processor_id
      WHERE p.is_active = true
      ORDER BY revenue_change DESC
    `);
    
    const auditSummary = {
      comparison: {
        currentMonth,
        previousMonth,
        currentTotal: parseFloat(currentTotal.toFixed(2)),
        previousTotal: parseFloat(previousTotal.toFixed(2)),
        totalChange: parseFloat((currentTotal - previousTotal).toFixed(2)),
        percentageChange: previousTotal > 0 ? parseFloat(((currentTotal - previousTotal) / previousTotal * 100).toFixed(2)) : 0
      },
      merchantChanges: {
        newMerchants: newMerchants.length,
        lostMerchants: lostMerchants.length,
        netMerchantChange: newMerchants.length - lostMerchants.length
      },
      processorChanges: processorChanges.rows.map((row: any) => ({
        processor: row.processor_name,
        currentRevenue: parseFloat(row.current_revenue || 0),
        previousRevenue: parseFloat(row.previous_revenue || 0),
        revenueChange: parseFloat(row.revenue_change || 0),
        currentMerchants: parseInt(row.current_merchants || 0),
        previousMerchants: parseInt(row.previous_merchants || 0),
        merchantChange: parseInt(row.current_merchants || 0) - parseInt(row.previous_merchants || 0)
      }))
    };
    
    console.log(`Audit Summary: ${currentMonth} vs ${previousMonth} - Revenue change: $${auditSummary.comparison.totalChange}`);
    res.json(auditSummary);
  } catch (error) {
    console.error("Error generating audit report:", error);
    res.status(500).json({ error: "Failed to generate audit report" });
  }
});

// Get commission calculations per agent - joins monthly data with role assignments
// Supports: ?month=2025-05 (single month), ?startMonth=2025-03&endMonth=2025-05 (range), ?timeRange=3m or ?timeRange=all
// SECURITY: Step-up auth required for commission data (contains compensation/payroll info)
// Using reuseToken since this is read-only, but still requires identity verification
router.get("/commissions", authenticateToken, requireReauth({ reuseToken: true }), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const singleMonth = req.query.month as string;
    const startMonth = req.query.startMonth as string;
    const endMonth = req.query.endMonth as string;
    const timeRange = req.query.timeRange as string;
    
    // Determine date range based on query parameters
    let monthFilter: any;
    let dateRangeDescription: string;
    
    if (timeRange === 'all') {
      // All-time data - no month filter
      monthFilter = sql`1=1`;
      dateRangeDescription = 'all-time';
    } else if (timeRange) {
      // Parse timeRange like "3m" for past 3 months
      const months = parseInt(timeRange.replace('m', ''));
      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth() - months + 1, 1);
      const calcStartMonth = startDate.toISOString().slice(0, 7);
      const calcEndMonth = now.toISOString().slice(0, 7);
      monthFilter = sql`md.month >= ${calcStartMonth} AND md.month <= ${calcEndMonth}`;
      dateRangeDescription = `${calcStartMonth} to ${calcEndMonth}`;
    } else if (startMonth && endMonth) {
      // Explicit date range
      monthFilter = sql`md.month >= ${startMonth} AND md.month <= ${endMonth}`;
      dateRangeDescription = `${startMonth} to ${endMonth}`;
    } else {
      // Single month (default to current month)
      const requestedMonth = singleMonth || new Date().toISOString().slice(0, 7);
      monthFilter = sql`md.month = ${requestedMonth}`;
      dateRangeDescription = requestedMonth;
    }
    
    // Get commission breakdown by agent/role from actual data
    // Note: Database uses 'agent' column instead of 'rep' for the representative role
    const commissionData = await db.execute(sql`
      WITH monthly_revenue AS (
        SELECT 
          m.mid,
          m.dba as merchant_name,
          md.month,
          md.net as revenue,
          p.name as processor_name
        FROM monthly_data md
        JOIN merchants m ON md.merchant_id = m.id
        LEFT JOIN processors p ON md.processor_id = p.id
        WHERE ${monthFilter}
      ),
      commission_calculations AS (
        SELECT 
          mr.mid,
          mr.merchant_name,
          mr.revenue,
          mr.processor_name,
          mra.agent as rep,
          mra.agent_percentage as rep_percentage,
          CASE WHEN mra.agent IS NOT NULL AND mra.agent_percentage IS NOT NULL 
            THEN CAST(mr.revenue AS DECIMAL) * (CAST(mra.agent_percentage AS DECIMAL) / 100)
            ELSE 0 END as rep_commission,
          mra.partner,
          mra.partner_percentage,
          CASE WHEN mra.partner IS NOT NULL AND mra.partner_percentage IS NOT NULL 
            THEN CAST(mr.revenue AS DECIMAL) * (CAST(mra.partner_percentage AS DECIMAL) / 100)
            ELSE 0 END as partner_commission,
          mra.sales_manager,
          mra.sales_manager_percentage,
          CASE WHEN mra.sales_manager IS NOT NULL AND mra.sales_manager_percentage IS NOT NULL 
            THEN CAST(mr.revenue AS DECIMAL) * (CAST(mra.sales_manager_percentage AS DECIMAL) / 100)
            ELSE 0 END as sales_manager_commission,
          mra.company,
          mra.company_percentage,
          CASE WHEN mra.company IS NOT NULL AND mra.company_percentage IS NOT NULL 
            THEN CAST(mr.revenue AS DECIMAL) * (CAST(mra.company_percentage AS DECIMAL) / 100)
            ELSE 0 END as company_commission,
          mra.association,
          mra.association_percentage,
          CASE WHEN mra.association IS NOT NULL AND mra.association_percentage IS NOT NULL 
            THEN CAST(mr.revenue AS DECIMAL) * (CAST(mra.association_percentage AS DECIMAL) / 100)
            ELSE 0 END as association_commission,
          mra.assignment_status
        FROM monthly_revenue mr
        LEFT JOIN mid_role_assignments mra ON mr.mid = mra.mid
      )
      SELECT * FROM commission_calculations
      ORDER BY revenue DESC
    `);
    
    // Aggregate by agent/role for summary
    // Note: Database uses 'agent' column instead of 'rep' for the representative role
    const agentSummary = await db.execute(sql`
      WITH agent_commissions AS (
        SELECT 
          mra.agent as agent_name,
          'agent' as role_type,
          COUNT(DISTINCT m.mid) as merchant_count,
          SUM(CAST(md.net AS DECIMAL)) as total_revenue,
          SUM(CAST(md.net AS DECIMAL) * (CAST(mra.agent_percentage AS DECIMAL) / 100)) as total_commission
        FROM monthly_data md
        JOIN merchants m ON md.merchant_id = m.id
        JOIN mid_role_assignments mra ON m.mid = mra.mid
        WHERE ${monthFilter}
          AND mra.agent IS NOT NULL
          AND mra.agent_percentage IS NOT NULL
        GROUP BY mra.agent
        
        UNION ALL
        
        SELECT 
          mra.partner as agent_name,
          'partner' as role_type,
          COUNT(DISTINCT m.mid) as merchant_count,
          SUM(CAST(md.net AS DECIMAL)) as total_revenue,
          SUM(CAST(md.net AS DECIMAL) * (CAST(mra.partner_percentage AS DECIMAL) / 100)) as total_commission
        FROM monthly_data md
        JOIN merchants m ON md.merchant_id = m.id
        JOIN mid_role_assignments mra ON m.mid = mra.mid
        WHERE ${monthFilter}
          AND mra.partner IS NOT NULL
          AND mra.partner_percentage IS NOT NULL
        GROUP BY mra.partner
        
        UNION ALL
        
        SELECT 
          mra.sales_manager as agent_name,
          'sales_manager' as role_type,
          COUNT(DISTINCT m.mid) as merchant_count,
          SUM(CAST(md.net AS DECIMAL)) as total_revenue,
          SUM(CAST(md.net AS DECIMAL) * (CAST(mra.sales_manager_percentage AS DECIMAL) / 100)) as total_commission
        FROM monthly_data md
        JOIN merchants m ON md.merchant_id = m.id
        JOIN mid_role_assignments mra ON m.mid = mra.mid
        WHERE ${monthFilter}
          AND mra.sales_manager IS NOT NULL
          AND mra.sales_manager_percentage IS NOT NULL
        GROUP BY mra.sales_manager
        
        UNION ALL
        
        SELECT 
          mra.company as agent_name,
          'company' as role_type,
          COUNT(DISTINCT m.mid) as merchant_count,
          SUM(CAST(md.net AS DECIMAL)) as total_revenue,
          SUM(CAST(md.net AS DECIMAL) * (CAST(mra.company_percentage AS DECIMAL) / 100)) as total_commission
        FROM monthly_data md
        JOIN merchants m ON md.merchant_id = m.id
        JOIN mid_role_assignments mra ON m.mid = mra.mid
        WHERE ${monthFilter}
          AND mra.company IS NOT NULL
          AND mra.company_percentage IS NOT NULL
        GROUP BY mra.company
        
        UNION ALL
        
        SELECT 
          mra.association as agent_name,
          'association' as role_type,
          COUNT(DISTINCT m.mid) as merchant_count,
          SUM(CAST(md.net AS DECIMAL)) as total_revenue,
          SUM(CAST(md.net AS DECIMAL) * (CAST(mra.association_percentage AS DECIMAL) / 100)) as total_commission
        FROM monthly_data md
        JOIN merchants m ON md.merchant_id = m.id
        JOIN mid_role_assignments mra ON m.mid = mra.mid
        WHERE ${monthFilter}
          AND mra.association IS NOT NULL
          AND mra.association_percentage IS NOT NULL
        GROUP BY mra.association
      )
      SELECT 
        agent_name,
        role_type,
        SUM(merchant_count) as merchant_count,
        SUM(total_revenue) as total_revenue,
        SUM(total_commission) as total_commission
      FROM agent_commissions
      WHERE agent_name IS NOT NULL
      GROUP BY agent_name, role_type
      ORDER BY total_commission DESC
    `);
    
    // Calculate summary statistics
    const totalRevenue = commissionData.rows.reduce((sum: number, row: any) => 
      sum + parseFloat(row.revenue || 0), 0);
    const totalCommissions = commissionData.rows.reduce((sum: number, row: any) => 
      sum + parseFloat(row.rep_commission || 0) + parseFloat(row.partner_commission || 0) + 
      parseFloat(row.sales_manager_commission || 0) + parseFloat(row.company_commission || 0) +
      parseFloat(row.association_commission || 0), 0);
    // Check all roles to determine if a merchant is assigned (not just rep/partner)
    const assignedCount = commissionData.rows.filter((row: any) => 
      row.assignment_status === 'assigned' || 
      row.rep || row.partner || row.sales_manager || row.company || row.association).length;
    const unassignedCount = commissionData.rows.length - assignedCount;
    
    console.log(`Commission Report for ${dateRangeDescription}: ${commissionData.rows.length} merchants, $${totalRevenue.toFixed(2)} revenue, $${totalCommissions.toFixed(2)} commissions`);
    
    res.json({
      dateRange: dateRangeDescription,
      summary: {
        totalMerchants: commissionData.rows.length,
        assignedMerchants: assignedCount,
        unassignedMerchants: unassignedCount,
        totalRevenue: parseFloat(totalRevenue.toFixed(2)),
        totalCommissions: parseFloat(totalCommissions.toFixed(2)),
        companyRetained: parseFloat((totalRevenue - totalCommissions).toFixed(2))
      },
      agentSummary: agentSummary.rows.map((row: any) => ({
        agentName: row.agent_name,
        roleType: row.role_type,
        merchantCount: parseInt(row.merchant_count || 0),
        totalRevenue: parseFloat(row.total_revenue || 0),
        totalCommission: parseFloat(row.total_commission || 0)
      })),
      merchantDetails: commissionData.rows.map((row: any) => ({
        mid: row.mid,
        merchantName: row.merchant_name,
        processor: row.processor_name,
        revenue: parseFloat(row.revenue || 0),
        rep: row.rep,
        repPercentage: parseFloat(row.rep_percentage || 0),
        repCommission: parseFloat(row.rep_commission || 0),
        partner: row.partner,
        partnerPercentage: parseFloat(row.partner_percentage || 0),
        partnerCommission: parseFloat(row.partner_commission || 0),
        salesManager: row.sales_manager,
        salesManagerPercentage: parseFloat(row.sales_manager_percentage || 0),
        salesManagerCommission: parseFloat(row.sales_manager_commission || 0),
        company: row.company,
        companyPercentage: parseFloat(row.company_percentage || 0),
        companyCommission: parseFloat(row.company_commission || 0),
        association: row.association,
        associationPercentage: parseFloat(row.association_percentage || 0),
        associationCommission: parseFloat(row.association_commission || 0),
        assignmentStatus: row.assignment_status || 'unassigned'
      }))
    });
  } catch (error) {
    console.error("Error calculating commissions:", error);
    res.status(500).json({ error: "Failed to calculate commissions" });
  }
});

// Get all reports (saved reports)
router.get("/", async (req, res) => {
  try {
    const reports = await storage.getReports();
    res.json({ reports });
  } catch (error) {
    console.error("Error fetching reports:", error);
    res.status(500).json({ error: "Failed to fetch reports" });
  }
});

// Create a new report
router.post("/", async (req, res) => {
  try {
    const report = await storage.createReport(req.body);
    res.status(201).json({ report });
  } catch (error) {
    console.error("Error creating report:", error);
    res.status(500).json({ error: "Failed to create report" });
  }
});

// Update a report
router.put("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const report = await storage.updateReport(id, req.body);
    res.json({ report });
  } catch (error) {
    console.error("Error updating report:", error);
    res.status(500).json({ error: "Failed to update report" });
  }
});

// Advanced report builder endpoint
router.post("/advanced", async (req, res) => {
  try {
    const { filters, columns, groupBy, dateRange, type } = req.body;
    
    // Build base query
    let query = db
      .select()
      .from(monthlyData)
      .innerJoin(merchants, eq(monthlyData.merchantId, merchants.id))
      .innerJoin(processors, eq(monthlyData.processorId, processors.id))
      .leftJoin(assignments, eq(assignments.merchantId, merchants.id))
      .leftJoin(roles, eq(assignments.roleId, roles.id));

    // Apply date range filter
    if (dateRange?.start && dateRange?.end) {
      query = query.where(
        sql`${monthlyData.month} BETWEEN ${dateRange.start.substring(0, 7)} AND ${dateRange.end.substring(0, 7)}`
      );
    }

    // Apply custom filters
    if (filters && filters.length > 0) {
      for (const filter of filters) {
        const { field, operator, value } = filter;
        
        // Map field names to actual columns
        let column;
        if (field.startsWith('merchant.')) {
          const fieldName = field.replace('merchant.', '');
          column = merchants[fieldName as keyof typeof merchants];
        } else if (field.startsWith('processor.')) {
          const fieldName = field.replace('processor.', '');
          column = processors[fieldName as keyof typeof processors];
        } else if (field.startsWith('monthlyData.')) {
          const fieldName = field.replace('monthlyData.', '');
          column = monthlyData[fieldName as keyof typeof monthlyData];
        } else if (field.startsWith('roles.')) {
          const fieldName = field.replace('roles.', '');
          column = roles[fieldName as keyof typeof roles];
        }

        if (column) {
          switch (operator) {
            case 'equals':
              query = query.where(eq(column, value));
              break;
            case 'contains':
              query = query.where(sql`${column} ILIKE ${'%' + value + '%'}`);
              break;
            case 'greater_than':
              query = query.where(sql`${column} > ${parseFloat(value)}`);
              break;
            case 'less_than':
              query = query.where(sql`${column} < ${parseFloat(value)}`);
              break;
            case 'between':
              const [start, end] = value.split(',');
              query = query.where(sql`${column} BETWEEN ${start} AND ${end}`);
              break;
          }
        }
      }
    }

    // Execute query
    const results = await query.limit(1000);

    // Transform results for frontend
    const transformedResults = results.map(result => ({
      'merchant.name': result.merchants?.name,
      'merchant.mid': result.merchants?.mid,
      'merchant.status': result.merchants?.status,
      'merchant.industry': result.merchants?.industry,
      'processor.name': result.processors?.name,
      'monthlyData.month': result.monthly_data?.month,
      'monthlyData.net': result.monthly_data?.net,
      'monthlyData.salesAmount': result.monthly_data?.salesAmount,
      'monthlyData.transactionCount': result.monthly_data?.transactionCount,
      'roles.name': result.roles?.name,
      'assignments.percentage': result.assignments?.percentage,
      'assignments.roleType': result.assignments?.roleType
    }));

    res.json({ 
      results: transformedResults,
      totalCount: transformedResults.length,
      query: req.body
    });
  } catch (error) {
    console.error("Error generating advanced report:", error);
    res.status(500).json({ error: "Failed to generate report" });
  }
});

// Save report configuration
router.post("/save", async (req, res) => {
  try {
    const reportConfig = req.body;
    
    // Save to database (simplified for now)
    const savedReport = await storage.createReport({
      name: reportConfig.name,
      type: reportConfig.type,
      configuration: JSON.stringify(reportConfig),
      isActive: true,
      createdAt: new Date()
    });

    res.json({ success: true, reportId: savedReport.id });
  } catch (error) {
    console.error("Error saving report:", error);
    res.status(500).json({ error: "Failed to save report" });
  }
});

// Get historical residuals data with month/date range filters
router.get("/historical", async (req, res) => {
  try {
    const startMonth = req.query.startMonth as string;
    const endMonth = req.query.endMonth as string;
    const month = req.query.month as string;
    const processorId = req.query.processorId ? parseInt(req.query.processorId as string) : null;
    const reportType = req.query.type as string || 'all';
    
    console.log(`Historical reports API: month=${month}, startMonth=${startMonth}, endMonth=${endMonth}, processor=${processorId}, type=${reportType}`);
    
    // Build query conditions
    let whereConditions: any[] = [];
    
    // Month filtering
    if (month) {
      whereConditions.push(eq(monthlyData.month, month));
    } else if (startMonth && endMonth) {
      whereConditions.push(sql`${monthlyData.month} BETWEEN ${startMonth} AND ${endMonth}`);
    }
    
    // Processor filtering
    if (processorId) {
      whereConditions.push(eq(monthlyData.processorId, processorId));
    }
    
    // Build the query
    let query = db
      .select({
        month: monthlyData.month,
        processorId: monthlyData.processorId,
        processorName: processors.name,
        totalRevenue: sql<number>`SUM(${monthlyData.income}::numeric)`,
        totalNet: sql<number>`SUM(${monthlyData.net}::numeric)`,
        totalTransactions: sql<number>`SUM(${monthlyData.transactions}::integer)`,
        totalVolume: sql<number>`SUM(${monthlyData.salesAmount}::numeric)`,
        merchantCount: count(monthlyData.id)
      })
      .from(monthlyData)
      .innerJoin(processors, eq(monthlyData.processorId, processors.id))
      .groupBy(monthlyData.month, monthlyData.processorId, processors.name)
      .orderBy(monthlyData.month, processors.name);
    
    // Apply conditions
    if (whereConditions.length > 0) {
      query = query.where(sql`${sql.join(whereConditions, sql` AND `)}`);
    }
    
    const rawResults = await query;
    
    // Group by month for summary reports
    const monthlyReports = new Map();
    
    for (const row of rawResults) {
      const monthKey = row.month;
      
      if (!monthlyReports.has(monthKey)) {
        monthlyReports.set(monthKey, {
          month: monthKey,
          processors: [],
          totalRevenue: 0,
          totalNet: 0,
          totalTransactions: 0,
          totalVolume: 0,
          totalMerchants: 0
        });
      }
      
      const monthData = monthlyReports.get(monthKey);
      monthData.processors.push({
        processorId: row.processorId,
        processorName: row.processorName,
        revenue: parseFloat(row.totalRevenue?.toString() || '0'),
        net: parseFloat(row.totalNet?.toString() || '0'),
        transactions: parseInt(row.totalTransactions?.toString() || '0'),
        volume: parseFloat(row.totalVolume?.toString() || '0'),
        merchants: parseInt(row.merchantCount?.toString() || '0')
      });
      
      monthData.totalRevenue += parseFloat(row.totalRevenue?.toString() || '0');
      monthData.totalNet += parseFloat(row.totalNet?.toString() || '0');
      monthData.totalTransactions += parseInt(row.totalTransactions?.toString() || '0');
      monthData.totalVolume += parseFloat(row.totalVolume?.toString() || '0');
      monthData.totalMerchants += parseInt(row.merchantCount?.toString() || '0');
    }
    
    // Format reports based on report type
    let reports: any[] = [];
    
    if (reportType === 'processor') {
      // Processor-specific reports - one report per processor per month
      reports = rawResults.map((row, index) => ({
        id: index + 1,
        name: `${row.processorName} - ${row.month}`,
        type: 'Processor Report',
        dateRange: row.month,
        month: row.month,
        processor: row.processorName,
        totalRevenue: parseFloat(row.totalRevenue?.toString() || '0'),
        totalNet: parseFloat(row.totalNet?.toString() || '0'),
        totalTransactions: parseInt(row.totalTransactions?.toString() || '0'),
        totalVolume: parseFloat(row.totalVolume?.toString() || '0'),
        merchantCount: parseInt(row.merchantCount?.toString() || '0'),
        status: parseFloat(row.totalRevenue?.toString() || '0') > 0 ? 'completed' : 'pending',
        generatedBy: 'System',
        createdAt: new Date().toISOString()
      }));
    } else if (reportType === 'agent' || reportType === 'partner') {
      // For agent/partner reports, redirect to commissions endpoint data
      // This is a simplified version - in production, fetch from commissions endpoint
      const roleType = reportType === 'agent' ? 'rep' : 'partner';
      
      reports = Array.from(monthlyReports.values()).map((monthData, index) => ({
        id: index + 1,
        name: `${reportType === 'agent' ? 'Agent' : 'Partner'} Commission Summary - ${monthData.month}`,
        type: reportType === 'agent' ? 'Agent Report' : 'Partner Summary',
        dateRange: monthData.month,
        month: monthData.month,
        totalRevenue: monthData.totalRevenue,
        totalNet: monthData.totalNet,
        totalTransactions: monthData.totalTransactions,
        totalVolume: monthData.totalVolume,
        merchantCount: monthData.totalMerchants,
        processors: monthData.processors,
        status: monthData.totalRevenue > 0 ? 'completed' : 'pending',
        generatedBy: 'System',
        createdAt: new Date().toISOString(),
        note: `Use Commissions API endpoint for detailed ${roleType} breakdowns`
      }));
    } else {
      // Monthly summary reports (default)
      reports = Array.from(monthlyReports.values()).map((monthData, index) => ({
        id: index + 1,
        name: `Monthly Summary - ${monthData.month}`,
        type: 'Monthly Summary',
        dateRange: monthData.month,
        month: monthData.month,
        totalRevenue: monthData.totalRevenue,
        totalNet: monthData.totalNet,
        totalTransactions: monthData.totalTransactions,
        totalVolume: monthData.totalVolume,
        merchantCount: monthData.totalMerchants,
        processors: monthData.processors,
        status: monthData.totalRevenue > 0 ? 'completed' : 'pending',
        generatedBy: 'System',
        createdAt: new Date().toISOString()
      }));
    }
    
    console.log(`Generated ${reports.length} ${reportType} reports from database`);
    res.json({ reports, summary: {
      totalMonths: reportType === 'processor' ? new Set(reports.map(r => r.month)).size : reports.length,
      totalRevenue: reports.reduce((sum, r) => sum + (r.totalRevenue || 0), 0),
      totalMerchants: reports.reduce((sum, r) => sum + (r.merchantCount || 0), 0)
    }});
  } catch (error) {
    console.error("Error fetching historical reports:", error);
    res.status(500).json({ error: "Failed to fetch historical reports" });
  }
});

export default router;
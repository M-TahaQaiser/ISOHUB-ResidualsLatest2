import express, { Request, Response } from 'express';
import { replitDBService } from './services/replitDBService';

const router = express.Router();

// Helper function to get previous month and year
const getPreviousMonthAndYear = () => {
  const date = new Date();
  const previousMonth = date.getMonth() === 0 ? 11 : date.getMonth() - 1;
  const year = date.getMonth() === 0 ? date.getFullYear() - 1 : date.getFullYear();
  const monthName = new Date(year, previousMonth).toLocaleString('default', { month: 'long' });
  return { month: monthName, year };
};

// GET /api/dashboard/:organizationId/metrics - Get dashboard metrics
router.get('/:organizationId/metrics', async (req: Request, res: Response) => {
  try {
    const { organizationId } = req.params;

    const metrics = await replitDBService.getDashboardMetrics(organizationId);
    const agents = await replitDBService.getAgents(organizationId);
    
    // Get top performing agents by merchant count
    const topAgents = agents
      .map(agent => ({
        agentId: agent.agentID,
        firstName: agent.fName,
        lastName: agent.lName,
        merchantCount: agent.clients ? agent.clients.length : 0
      }))
      .sort((a, b) => b.merchantCount - a.merchantCount)
      .slice(0, 5);

    res.json({
      metrics: {
        totalAgents: metrics.totalAgents,
        totalMerchants: agents.reduce((acc, agent) => acc + (agent.clients?.length || 0), 0),
        totalReports: metrics.totalReports,
        approvedReports: metrics.approvedReports,
        pendingApprovals: metrics.pendingApprovals
      },
      topAgents
    });
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/dashboard/:organizationId/needs-approval - Get items needing approval
router.get('/:organizationId/needs-approval', async (req: Request, res: Response) => {
  try {
    const { organizationId } = req.params;

    // Get agents and reports
    const agents = await replitDBService.getAgents(organizationId);
    const { reports } = await replitDBService.getReports(organizationId);

    // Filter out fully approved agent reports
    const filteredReports = reports.filter(
      report => !(report.type === 'agent' && report.approved)
    );

    // Identify unapproved or partially approved agent reports
    const unapprovedAgentReports = filteredReports.filter(report =>
      report.type === 'agent' &&
      (!report.approved || (report.reportData && Array.isArray(report.reportData) && 
       report.reportData.some((row: any) => !row.approved)))
    );

    // Build list from existing (but unapproved) agent report records
    const agentsNeedingApproval = unapprovedAgentReports.map(report => {
      const matchingAgent = agents.find(agent => agent.agentID === report.agentId);
      return {
        processor: `${matchingAgent?.fName || 'Unknown'} ${matchingAgent?.lName || ''}`,
        agentId: report.agentId,
        reportId: report.reportID,
        type: 'agent',
        approved: false,
        monthYear: report.monthYear
      };
    });

    // Identify agents with no agent report record at all
    const agentsWithoutReports = agents.filter(agent =>
      !reports.some(report => report.type === 'agent' && report.agentId === agent.agentID)
    );

    const { month, year } = getPreviousMonthAndYear();
    const finalAgentsWithoutReports = agentsWithoutReports.map(agent => ({
      processor: `${agent.fName} ${agent.lName}`,
      agentId: agent.agentID,
      type: 'agent',
      approved: false,
      monthYear: `${month} ${year}`,
      needsReportCreation: true
    }));

    // Combine all agents needing approval
    const allAgentsNeedingApproval = [...agentsNeedingApproval, ...finalAgentsWithoutReports];

    // Get processor reports needing approval
    const processorReports = filteredReports.filter(report => report.type === 'processor' && !report.approved);
    const processorNeedsApproval = processorReports.map(report => ({
      processor: report.processor || 'Unknown Processor',
      reportId: report.reportID,
      type: 'processor',
      approved: false,
      monthYear: report.monthYear
    }));

    // Get bank summary reports needing approval
    const bankSummaryReports = filteredReports.filter(report => report.type === 'bank_summary' && !report.approved);
    const bankSummaryNeedsApproval = bankSummaryReports.map(report => ({
      processor: `Bank Summary - ${report.processor || 'All'}`,
      reportId: report.reportID,
      type: 'bank_summary',
      approved: false,
      monthYear: report.monthYear
    }));

    res.json({
      needsApproval: [
        ...allAgentsNeedingApproval,
        ...processorNeedsApproval,
        ...bankSummaryNeedsApproval
      ],
      summary: {
        agents: allAgentsNeedingApproval.length,
        processors: processorNeedsApproval.length,
        bankSummaries: bankSummaryNeedsApproval.length,
        total: allAgentsNeedingApproval.length + processorNeedsApproval.length + bankSummaryNeedsApproval.length
      }
    });

  } catch (error) {
    console.error('Error fetching items needing approval:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/dashboard/:organizationId/needs-audit - Get items needing audit
router.get('/:organizationId/needs-audit', async (req: Request, res: Response) => {
  try {
    const { organizationId } = req.params;

    const agents = await replitDBService.getAgents(organizationId);
    const needsAudit = [];

    for (const agent of agents) {
      const issues = [];

      // Check for missing required data
      if (!agent.company) issues.push('Missing company information');
      if (!agent.manager) issues.push('Missing manager information');
      
      // Check for clients with no bank split defined
      const clientsWithoutSplit = (agent.clients || []).filter(
        client => !client.bankSplit || parseFloat(client.bankSplit) === 0
      );

      if (clientsWithoutSplit.length > 0) {
        issues.push(`${clientsWithoutSplit.length} merchants with no bank split defined`);
      }

      if (issues.length > 0) {
        needsAudit.push({
          agentId: agent.agentID,
          agentName: `${agent.fName} ${agent.lName}`,
          issues,
          priority: issues.length > 2 ? 'high' : 'medium'
        });
      }
    }

    res.json({
      needsAudit,
      summary: {
        total: needsAudit.length,
        highPriority: needsAudit.filter(item => item.priority === 'high').length,
        mediumPriority: needsAudit.filter(item => item.priority === 'medium').length
      }
    });

  } catch (error) {
    console.error('Error fetching items needing audit:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/dashboard/:organizationId/recent-activity - Get recent activity
router.get('/:organizationId/recent-activity', async (req: Request, res: Response) => {
  try {
    const { organizationId } = req.params;

    // Get recent agents and reports
    const agents = await replitDBService.getAgents(organizationId);
    const { reports } = await replitDBService.getReports(organizationId);

    // Filter recent agents (created in last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentAgents = agents.filter(agent => {
      const createdAt = new Date(agent.createdAt || agent.updatedAt || Date.now());
      return createdAt >= thirtyDaysAgo;
    }).slice(0, 10);

    // Get recent reports
    const recentReports = reports
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
      .slice(0, 10);

    const activity = [
      ...recentAgents.map(agent => ({
        type: 'agent_created',
        description: `Agent ${agent.fName} ${agent.lName} was created`,
        timestamp: agent.createdAt || agent.updatedAt || new Date().toISOString(),
        agentId: agent.agentID
      })),
      ...recentReports.map(report => ({
        type: 'report_created',
        description: `${report.type} report "${report.title}" was created`,
        timestamp: report.createdAt || new Date().toISOString(),
        reportId: report.reportID,
        approved: report.approved
      }))
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
     .slice(0, 15);

    res.json({ activity });

  } catch (error) {
    console.error('Error fetching recent activity:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
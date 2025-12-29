import AgentsCoordinator from "./agents.coordinator.js";
import ReportsV2Coor from "./reportsV2.coordinator.js";

export default class DashboardCoordinator {
  // Helper: Compute previous month and year
  static getPreviousMonthAndYear() {
    const date = new Date();
    const previousMonth = date.getMonth() === 0 ? 11 : date.getMonth() - 1;
    const year = date.getMonth() === 0 ? date.getFullYear() - 1 : date.getFullYear();
    const monthName = new Date(year, previousMonth).toLocaleString('default', { month: 'long' });
    return { month: monthName, year };
  }

  static async getNeedsApproval(organizationID) {
    try {
      // console.log('Getting reports needing approval for organization:', organizationID);
      // Fetch agents and reports from their coordinators
      const agentsResponse = await AgentsCoordinator.getAgents(organizationID);
      const reportsResponse = await ReportsV2Coor.getReports(organizationID);
      const agents = Array.isArray(agentsResponse.agents) ? agentsResponse.agents : [];
      const reports = reportsResponse.reports || [];

      // Remove fully approved agent reports from further processing
      const filteredReports = reports.filter(
        report => !(report.type === 'agent' && report.approved)
      );
      // console.log('Filtered reports:', filteredReports);

      // Identify unapproved or partially approved agent reports
      const unapprovedAgentReports = filteredReports.filter(report =>
        report.type === 'agent' &&
        (!report.approved || (report.reportData && report.reportData.some(row => !row.approved)))
      );

      // Build list from existing (but unapproved) agent report records
      let agentsNeedingApproval = unapprovedAgentReports.map(report => {
        const matchingAgent = agents.find(agent => agent.agentID === report.agentID);
        return {
          processor: `${matchingAgent?.fName || 'Unknown'} ${matchingAgent?.lName || ''}`,
          agentID: report.agentID,
          type: 'agent',
          approved: false
        };
      });

      // Identify agents with no agent report record at all
      const agentsWithoutReports = agents.filter(agent =>
        !reports.some(report => report.type === 'agent' && report.agentID === agent.agentID)
      ).map(agent => ({
        processor: `${agent.fName} ${agent.lName}`,
        agentID: agent.agentID,
        type: 'agent',
        approved: false
      }));

      // console.log('Agents without reports:', agentsWithoutReports);
      const { month, year } = this.getPreviousMonthAndYear();
      const finalAgentsWithoutReports = [];
      for (const agent of agentsWithoutReports) {
        try {
          // Build the agent report for the given month/year.
          const generatedReport = await ReportsV2Coor.buildAgentReport(organizationID, agent.agentID, `${month} ${year}`);
         
          // If build succeeds, add the agent to the approval list.
          finalAgentsWithoutReports.push(agent);
        } catch (error) {
          // If the error indicates the report already exists, add the agent.
          if (error.message && error.message.includes("already exists")) {
            finalAgentsWithoutReports.push(agent);
          } else {
            console.error(`Error building report for agent ${agent.agentID}:`, error);
          }
        }
      }

      // Agent Summary: if all individual agent reports are approved, try to build the summary report.
      const allAgentReportsApproved = filteredReports
        .filter(report => report.type === 'agent')
        .every(report => report.approved);
      if (allAgentReportsApproved) {
        let agentSummaryPlaceholder = null;
        try {
          const builtAgentSummary = await ReportsV2Coor.buildAgentSummaryReport(organizationID, `${month} ${year}`);
          // console.log("Built agent summary report:", builtAgentSummary);
          if (!builtAgentSummary.approved) {
            agentSummaryPlaceholder = {
              processor: 'Agent Summary',
              type: 'agent summary',
              approved: false,
              month: `${month} ${year}`,
            };
          }
        } catch (error) {
          if (error.message && error.message.includes("already exists")) {
            agentSummaryPlaceholder = {
              processor: 'Agent Summary',
              type: 'agent summary',
              approved: false,
              month: `${month} ${year}`,
            };
          } else {
            console.error("Error building agent summary report:", error);
          }
        }
        if (agentSummaryPlaceholder) {
          agentsNeedingApproval.push(agentSummaryPlaceholder);
        }
      }

      // Processor Summary: if all processor reports are approved, try to build the summary report.
      const allProcessorReportsApproved = reports
        .filter(report => report.type === 'processor')
        .every(report => report.approved);
      if (allProcessorReportsApproved) {
        let processorSummaryPlaceholder = null;
        try {
          const builtProcessorSummary = await ReportsV2Coor.buildProcessorSummaryReport(organizationID, `${month} ${year}`);
          // console.log("Built processor summary report:", builtProcessorSummary);
          if (!builtProcessorSummary.approved) {
            processorSummaryPlaceholder = {
              processor: 'Processor Summary',
              type: 'processor summary',
              approved: false,
              month: `${month} ${year}`,
            };
          }
        } catch (error) {
          if (error.message && error.message.includes("already exists")) {
            processorSummaryPlaceholder = {
              processor: 'Processor Summary',
              type: 'processor summary',
              approved: false,
              month: `${month} ${year}`,
            };
          } else {
            console.error("Error building processor summary report:", error);
          }
        }
        if (processorSummaryPlaceholder) {
          agentsNeedingApproval.push(processorSummaryPlaceholder);
        }
      }

      // Bank Summary: if all processor reports are approved, try to build the bank summary report.
      if (allProcessorReportsApproved) {
        let bankSummaryPlaceholder = null;
        try {
          const builtBankSummary = await ReportsV2Coor.buildBankSummaryReport(organizationID, `${month} ${year}`);
          // console.log("Built bank summary report:", builtBankSummary);
          if (!builtBankSummary.approved) {
            bankSummaryPlaceholder = {
              processor: 'Bank Summary',
              type: 'bank summary',
              approved: false,
              month: `${month} ${year}`,
            };
          }
        } catch (error) {
          if (error.message && error.message.includes("already exists")) {
            bankSummaryPlaceholder = {
              processor: 'Bank Summary',
              type: 'bank summary',
              approved: false,
              month: `${month} ${year}`,
            };
          } else {
            console.error("Error building bank summary report:", error);
          }
        }
        if (bankSummaryPlaceholder) {
          agentsNeedingApproval.push(bankSummaryPlaceholder);
        }
      }

      // Merge the two lists (unapproved agent reports already in the DB and agents that now have a report after checking)
      const combinedReports = [...agentsNeedingApproval, ...finalAgentsWithoutReports];
      return combinedReports;
    } catch (error) {
      console.error('Error in getNeedsApproval:', error);
      throw error;
    }
  }
}

import AgentReportUtil from './agentReport.util.js'; // Import the existing AgentReportUtil
import Report from '../classes/report.class.js';
import processorTypeMap from '../lib/typeMap.lib.js'; // Import the processor type map

export default class AgentSummaryUtil {

    static buildAgentSummaryReport = async (organizationID, monthYear, agents, processorReports) => {
        try {

            const totalSummary = initializeTotalSummary();
            const reportData = [];

            for (const agent of agents) {
                const agentReport = AgentReportUtil.buildAgentReport(organizationID, monthYear, agent, processorReports);
                const agentTotals = calculateAgentTotals(agentReport);
                addAgentToReport(reportData, agent, agentTotals);
                updateTotalSummary(totalSummary, agentTotals);
            };

            addTotalRowToReport(reportData, totalSummary);

            const report = new Report(organizationID, '', 'agent summary', monthYear, reportData);

            return report; // Return the summary report data
        } catch (error) {
            console.error('Error creating agent summary report:', error);
            throw new Error('Error creating agent summary report: ' + error.message);
        }
    };
}

/**
 * Initializes the total summary object with default values.
 */
const initializeTotalSummary = () => ({
    totalTransactions: 0,
    totalSalesAmount: 0,
    totalIncome: 0,
    totalExpenses: 0,
    totalNet: 0,
    totalAgentNet: 0,
});

/**
 * Calculates totals for a given agent report based on processor types.
 */
/**
 * Calculates totals for a given agent report based on processor types.
 */
const calculateAgentTotals = (agentReport) => {
    let agentTotals = {
        totalTransactions: 0,
        totalSalesAmount: 0,
        totalIncome: 0,
        totalExpenses: 0,
        totalNet: 0,
        totalAgentNet: 0,
    };

    agentReport.reportData.forEach(processorReport => {
        const processorType = processorTypeMap[processorReport.processor] || 'type1'; // Default to 'type1'

        processorReport.reportData.forEach(row => {
            switch (processorType) {
                case 'type1':
                    agentTotals.totalTransactions += parseFloat(row['Transaction'] || row['Sales']) || 0;
                    agentTotals.totalSalesAmount += parseFloat(row['Sales Amount'] || row['Volume']) || 0;
                    agentTotals.totalIncome += parseFloat(row['Income']) || 0;
                    agentTotals.totalExpenses += parseFloat(row['Expenses']) || 0;
                    agentTotals.totalNet += parseFloat(row['Net'] || row['Payout Amount']) || 0;
                    agentTotals.totalAgentNet += parseFloat(row['Agent Net'] || row['Bank Payout']) || 0;
                    break;

                case 'type2':
                case 'type3':
                    agentTotals.totalTransactions += parseFloat(row['Transaction'] || row['Sales']) || 0;
                    agentTotals.totalSalesAmount += parseFloat(row['Sales Amount'] || row['Volume']) || 0;
                    agentTotals.totalIncome += parseFloat(row['Income']) || 0;
                    agentTotals.totalExpenses += parseFloat(row['Expenses'] || row['Refunds']) || 0;
                    agentTotals.totalNet += parseFloat(row['Net'] || row['Payout Amount']) || 0;
                    agentTotals.totalAgentNet += parseFloat(row['Agent Net'] || row['Bank Payout']) || 0;
                    break;

                case 'type4':
                    agentTotals.totalTransactions += parseFloat(row['Transaction'] || row['Sales']) || 0;
                    agentTotals.totalSalesAmount += parseFloat(row['Sales Amount'] || row['Volume']) || 0;
                    agentTotals.totalIncome += parseFloat(row['Income']) || 0;
                    agentTotals.totalExpenses += parseFloat(row['Expenses']) || 0;
                    agentTotals.totalNet += parseFloat(row['Net'] || row['Payout Amount']) || 0;
                    agentTotals.totalAgentNet += parseFloat(row['Agent Net'] || row['Bank Payout']) || 0;
                    break;

                default:
                    throw new Error(`Unknown processor type: ${processorType}`);
            }
        });
    });

    return agentTotals;
};


/**
 * Adds the agent's calculated data to the report.
 */
const addAgentToReport = (reportData, agent, agentTotals) => {
    reportData.push({
        agentID: agent.agentID,
        agentName: `${agent.fName} ${agent.lName}` || agent.company,
        totalTransactions: agentTotals.totalTransactions,
        totalSalesAmount: agentTotals.totalSalesAmount,
        totalIncome: agentTotals.totalIncome,
        totalExpenses: agentTotals.totalExpenses,
        totalNet: agentTotals.totalNet,
        totalAgentNet: agentTotals.totalAgentNet,
        approved: false,
    });
};

/**
 * Updates the total summary with the agent's calculated totals.
 */
const updateTotalSummary = (totalSummary, agentTotals) => {
    totalSummary.totalTransactions += agentTotals.totalTransactions;
    totalSummary.totalSalesAmount += agentTotals.totalSalesAmount;
    totalSummary.totalIncome += agentTotals.totalIncome;
    totalSummary.totalExpenses += agentTotals.totalExpenses;
    totalSummary.totalNet += agentTotals.totalNet;
    totalSummary.totalAgentNet += agentTotals.totalAgentNet;
};

/**
 * Adds a total row for all agents to the report.
 */
const addTotalRowToReport = (reportData, totalSummary) => {
    reportData.push({
        agentName: 'TOTALS',
        totalTransactions: totalSummary.totalTransactions,
        totalSalesAmount: totalSummary.totalSalesAmount,
        totalIncome: totalSummary.totalIncome,
        totalExpenses: totalSummary.totalExpenses,
        totalNet: totalSummary.totalNet,
        totalAgentNet: totalSummary.totalAgentNet,
    });
};

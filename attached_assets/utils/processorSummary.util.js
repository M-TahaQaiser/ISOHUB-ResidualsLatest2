import Report from "../classes/report.class.js";
import processorTypeMap from "../lib/typeMap.lib.js"; // Import the processor type map

// Mapping processor type to columns
const processorColumnMapByType = {
  'type1': ['Merchant Id', 'Merchant Name', 'Transaction', 'Sales Amount', 'Income', 'Expenses', 'Net', 'bps', '%', 'Agent Net', 'Branch ID'],
  'type2': ['Merchant Id', 'Merchant Name', 'Payout Amount', 'Volume', 'Sales', 'Refunds', 'Reject Amount', 'Bank Split', 'Bank Payout', 'Branch ID'],
  'type3': ['Merchant Id', 'Merchant DBA', 'Payout Amount', 'Volume', 'Sales', 'Refunds', 'Reject Amount', 'Bank Split', 'Bank Payout', 'Branch ID'],
  'type4': ['Merchant Id', 'Merchant Name', 'Income', '', '', 'Expenses', 'Net', '', '%', 'Agent Net', 'Branch ID'],
  'type5': ['Merchant Id', 'Merchant Name', 'Transaction', 'Sales Amount', 'Income', 'Expenses', 'Net', 'BPS', '%', 'Agent Net']
};

export default class ProcessorSummaryUtil {
    // Create a processor summary report
    static createProcessorReport = async (organizationID, monthYear, reports) => {
        try {

            // Build the summary data based on the processor reports
            const summaryData = buildSummaryData(reports);
            // organizationID, processor, type, month, reportData
            // Create a new report instance using the Report class
            const report = new Report(
                organizationID,
                '',
                'processor summary',
                monthYear,
                summaryData
            );
           // Return the generated report
            return report;
        } catch (error) {
            console.error(`Error creating processor summary report for orgID: ${organizationID}, monthYear: ${monthYear}`);
            console.error('Error details:', error);
            throw new Error('Error creating processor summary report: ' + error.message);
        }
    };
};

const buildSummaryData = (reports) => {
    try {
        
        // Array to hold summary data for each processor
        const summaryData = [];

        // Initialize overall totals
        let totalTransactions = 0;
        let totalSalesAmount = 0;
        let totalIncome = 0;
        let totalExpenses = 0;
        let totalNet = 0;
        let totalAgentNet = 0;

        // Iterate over each report to calculate totals and build summary data
        reports.forEach(report => {
            const processorType = processorTypeMap[report.processor]; // Get the processor type using the map
            if (!processorType) {
                throw new Error(`Processor type not found for processor: ${report.processor}`);
            }

            const columns = processorColumnMapByType[processorType];
            if (!columns) {
                throw new Error(`Columns not found for processor type: ${processorType}`);
            }

            // Calculate totals for the given report
            const totals = calculateTotals(report, processorType, columns);

            // Update overall totals
            totalTransactions += totals.totalTransactions;
            totalSalesAmount += totals.totalSalesAmount;
            totalIncome += totals.totalIncome;
            totalExpenses += totals.totalExpenses;
            totalNet += totals.totalNet;
            totalAgentNet += totals.totalAgentNet;

            // Push the summary data including the original headers to the summaryData array
            summaryData.push({
                processor: report.processor,
                totalTransactions: totals.totalTransactions,
                totalSalesAmount: totals.totalSalesAmount,
                totalIncome: totals.totalIncome,
                totalExpenses: totals.totalExpenses,
                totalNet: totals.totalNet,
                totalAgentNet: totals.totalAgentNet,
                originalHeaders: columns // Include original headers from the report
            });
        });

        // Add overall totals to the summary data
        summaryData.push({
            processor: 'Overall Totals',
            totalTransactions,
            totalSalesAmount,
            totalIncome,
            totalExpenses,
            totalNet,
            totalAgentNet,
            originalHeaders: []
        });

        return summaryData;
    } catch (error) {
        console.error('Error building summary data:', error);
        throw new Error('Error building summary data: ' + error.message);
    }
};

const calculateTotals = (report, processorType, columns) => {
    try {

        // Initialize total values
        let totalTransactions = 0;
        let totalSalesAmount = 0;
        let totalIncome = 0;
        let totalExpenses = 0;
        let totalNet = 0;
        let totalAgentNet = 0;

        // Loop through each row of the report data to calculate totals
        report.reportData.forEach((row, index) => {
            try {
                // Determine calculations based on processor type
                switch (processorType) {
                    case 'type1':
                        // Sum Transactions, Sales Amount, Income, Expenses, Net, and Agent Net for type1 processors
                        totalTransactions += parseFloat(row['Transaction']) || 0; // Transactions
                        totalSalesAmount += parseFloat(row['Sales Amount']) || 0; // Sales Amount
                        totalIncome += parseFloat(row['Income']) || 0; // Income
                        totalExpenses += parseFloat(row['Expenses']) || 0; // Expenses
                        totalNet += parseFloat(row['Net']) || 0; // Net
                        totalAgentNet += parseFloat(row['Agent Net']) || 0; // Agent Net
                        break;

                    case 'type2':
                    case 'type3':
                        // Sum Volume, Sales, and Payout Amount for type2 and type3 processors
                        totalTransactions += parseFloat(row['Sales']) || 0; // Sales (used as Transactions here)
                        totalSalesAmount += parseFloat(row['Volume']) || 0; // Volume
                        totalIncome += parseFloat(row['Payout Amount']) || 0; // Payout Amount (used as Income here)
                        break;

                    case 'type4':
                        // Sum Income, Expenses, Net, and Agent Net for type4 processors
                        totalIncome += parseFloat(row['Income']) || 0; // Income
                        totalExpenses += parseFloat(row['Expenses']) || 0; // Expenses
                        totalNet += parseFloat(row['Net']) || 0; // Net
                        totalAgentNet += parseFloat(row['Agent Net']) || 0; // Agent Net
                        break;

                    case 'type5':
                        // Sum Transactions, Sales Amount, Income, Expenses, Net, and Agent Net for type5 processors (PayBright)
                        totalTransactions += parseFloat(row['Transaction']) || 0; // Transactions
                        totalSalesAmount += parseFloat(row['Sales Amount']) || 0; // Sales Amount
                        totalIncome += parseFloat(row['Income']) || 0; // Income
                        totalExpenses += parseFloat(row['Expenses']) || 0; // Expenses
                        totalNet += parseFloat(row['Net']) || 0; // Net
                        totalAgentNet += parseFloat(row['Agent Net']) || 0; // Agent Net
                        break;

                    default:
                        // Throw an error if processor type is unknown
                        throw new Error(`Unknown processor type: ${processorType}`);
                }
            } catch (rowError) {
                // Log and throw an error if there's an issue processing a row
                console.error(`Error processing row ${index + 1} for processor: ${report.processor}`, rowError);
                throw rowError;
            }
        });


        // Return calculated totals
        return {
            totalTransactions,
            totalSalesAmount,
            totalIncome,
            totalExpenses,
            totalNet,
            totalAgentNet
        };
    } catch (error) {
        // Log and throw an error if there's an issue calculating totals
        console.error('Error calculating totals:', error);
        throw new Error('Error calculating totals: ' + error.message);
    }
};

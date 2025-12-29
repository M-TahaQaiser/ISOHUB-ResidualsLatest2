import React from 'react';
import { generateBankSummaryReport, generateAgentSummaryReport } from '../../../api/reports.api'; // Adjust path as needed
import { getInvoiceNum, updateInvoiceNum } from '../../../api/invoices.api';
import './ap-report-export.component.css'; // Optional: Add styles

const APReportExport = ({ authToken, organizationID }) => {
    const getCurrentMonthAndYear = () => {
        const date = new Date();
        const monthName = date.toLocaleString('default', { month: 'long' });
        const year = date.getFullYear();
        return { month: monthName, year };
    };

    const generateAPReport = async () => {
        try {
            // Current month and year
            const { month, year } = getCurrentMonthAndYear();
            console.log('Generating AP Report for:', month, year);
            const monthYear = `${month} ${year}`;

            // Fetch necessary reports
            const [bankSummary, agentSummary] = await Promise.all([
                generateBankSummaryReport(organizationID, monthYear, authToken),
                generateAgentSummaryReport(organizationID, monthYear, authToken),
            ]);

            if (!bankSummary || !agentSummary) {
                alert('Failed to fetch required reports. Please check your data.');
                return;
            }

            console.log('Bank Summary:', bankSummary);
            console.log('Agent Summary:', agentSummary);

            // Fetch the current invoice number
            let invoiceNum = await getInvoiceNum(organizationID, authToken);
            if (!invoiceNum.number || isNaN(invoiceNum.number)) {
                alert('Failed to retrieve the current invoice number.');
                return;
            }

            // Prepare headers
            const headers = ['Vendor Name', 'Invoice #', 'Invoice Date', 'Due Date', 'Bill Line Item Order'];
            const rows = [];

            const invoiceDate = `${month} ${year}`;
            const dueDate = `${month} ${year}`;

            // Process agents
            agentSummary.data.reportData.forEach(agent => {
                console.log('Agent:', agent);
                if (agent.agentName === 'TOTALS') return;
                rows.push([
                    agent.agentName,                // Vendor Name
                    `Invoice-${String(invoiceNum.number++).padStart(4, '0')}`, // Invoice #
                    invoiceDate,                    // Invoice Date
                    dueDate,                        // Due Date
                    parseFloat(agent.totalAgentNet).toFixed(2), // Bill Line Item Order
                ]);
            });

            console.log('Updated invoice number:', invoiceNum.number);

            // Calculate total bank payout across all processors in the bank summary
            const totalBankPayout = bankSummary.data.reportData.reduce((sum, processor) => {
                return sum + processor.reportData.reduce((processorSum, item) => {
                    return processorSum + parseFloat(item['Bank Payout'] || 0);
                }, 0);
            }, 0);

            rows.push([
                'HBS',                            // Vendor Name
                `Invoice-${String(invoiceNum.number++).padStart(4, '0')}`, // Invoice #
                invoiceDate,                      // Invoice Date
                dueDate,                          // Due Date
                totalBankPayout.toFixed(2),       // Bill Line Item Order
            ]);

            // Update the invoice number in the system
            console.log('Updating invoice number:', invoiceNum.number);
            await updateInvoiceNum(organizationID, invoiceNum.number, authToken);

            // Convert to CSV
            const csvContent = [
                headers.join(','), 
                ...rows.map(row => row.join(',')),
            ].join('\n');

            // Create a downloadable link
            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `AP_Report_${month}_${year}.csv`;
            link.click();

            URL.revokeObjectURL(url);
            alert('AP Report exported successfully!');
        } catch (error) {
            console.error('Error generating AP report:', error);
            alert('Failed to generate AP Report. Check console for details.');
        }
    };

    return (
        <div className="ap-report-export">
            <button className="export-button text-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-black hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-400" onClick={generateAPReport}>
                Export AP Report
            </button>
        </div>
    );
};

export default APReportExport;

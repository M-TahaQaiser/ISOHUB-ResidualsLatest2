import React from 'react';
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface Report {
  id: string;
  name: string;
  status: 'needs_upload' | 'needs_audit' | 'needs_approval' | 'completed';
  amount?: number;
  processor?: string;
  date?: string;
  auditIssues?: string[];
}

interface APReportExportProps {
  reports: Report[];
  authToken?: string;
  organizationID?: string;
}

const APReportExport: React.FC<APReportExportProps> = ({ reports, authToken, organizationID }) => {
  const getCurrentMonthAndYear = () => {
    const date = new Date();
    const monthName = date.toLocaleString('en-US', { month: 'long' });
    const year = date.getFullYear();
    return { month: monthName, year };
  };

  const handleExportAPReport = async () => {
    try {
      console.log('Exporting AP Report for organization:', organizationID);
      
      const { month, year } = getCurrentMonthAndYear();
      const monthYear = `${month} ${year}`;
      
      // Import API functions dynamically
      const { generateBankSummaryReport, generateAgentSummaryReport } = await import('../../api/reports.api');
      const { getInvoiceNum, updateInvoiceNum } = await import('../../api/invoices.api');
      
      // Fetch reports and invoice data  
      const [bankSummary, agentSummary] = await Promise.all([
        generateBankSummaryReport(organizationID || '', monthYear, authToken || ''),
        generateAgentSummaryReport(organizationID || '', monthYear, authToken || ''),
      ]);
      
      if (!bankSummary || !agentSummary) {
        alert('Failed to fetch required reports. Please check your data.');
        return;
      }
      
      let invoiceData = await getInvoiceNum(organizationID || '', authToken || '');
      let invoiceNum = invoiceData.number || 37;
      
      // Prepare CSV content
      const headers = ['Vendor Name', 'Invoice #', 'Invoice Date', 'Due Date', 'Bill Line Item Order'];
      const rows = [];
      
      const invoiceDate = monthYear;
      const dueDate = monthYear;
      
      // Process agents from migrated data
      if (agentSummary.data?.reportData) {
        agentSummary.data.reportData.forEach((agent: any) => {
          if (agent.agentName === 'TOTALS') return;
          rows.push([
            agent.agentName,
            `Invoice-${String(invoiceNum++).padStart(4, '0')}`,
            invoiceDate,
            dueDate,
            parseFloat(agent.totalAgentNet || 0).toFixed(2),
          ]);
        });
      }
      
      // Add HBS entry
      const totalBankPayout = bankSummary.data?.reportData?.reduce((sum: number, processor: any) => {
        return sum + (processor.reportData?.reduce((processorSum: number, item: any) => {
          return processorSum + parseFloat(item['Bank Payout'] || 0);
        }, 0) || 0);
      }, 0) || 0;
      
      rows.push([
        'HBS',
        `Invoice-${String(invoiceNum++).padStart(4, '0')}`,
        invoiceDate,
        dueDate,
        totalBankPayout.toFixed(2),
      ]);
      
      // Update invoice number
      await updateInvoiceNum(organizationID || '', invoiceNum, authToken || '');
      
      // Create CSV content
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');
      
      // Download the file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `ap-report-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (error) {
      console.error('Error generating AP report:', error);
      alert('Failed to generate AP report. Please try again.');
    }
  };

  return (
    <Button 
      onClick={handleExportAPReport}
      className="bg-black text-yellow-400 hover:bg-gray-800 font-medium"
    >
      <Download className="h-4 w-4 mr-2" />
      Export AP Report
    </Button>
  );
};

export default APReportExport;
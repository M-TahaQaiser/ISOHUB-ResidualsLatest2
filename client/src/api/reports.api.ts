// API functions for reports - converted from original GitHub repository

interface Report {
  id: string;
  name: string;
  status: 'needs_upload' | 'needs_audit' | 'needs_approval' | 'completed';
  amount?: number;
  processor?: string;
  date?: string;
  auditIssues?: string[];
  reportData?: any[];
}

export async function getAllReports(organizationID: string, authToken?: string): Promise<Report[]> {
  try {
    console.log(`Fetching all reports for organization: ${organizationID}...`);
    
    // Use the residuals API endpoint for May 2025 data
    const response = await fetch(`/api/reports/residuals`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(authToken && { 'Authorization': `Bearer ${authToken}` })
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch reports: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.reports || [];
  } catch (error) {
    console.error('Error fetching reports:', error);
    
    // Return empty array if API fails - no mock data
    return [];
  }
}

export async function getNeedsApproval(organizationID: string, authToken?: string) {
  try {
    const reports = await getAllReports(organizationID, authToken);
    return reports.filter(report => report.status === 'needs_approval');
  } catch (error) {
    console.error('Error fetching needs approval data:', error);
    return [];
  }
}

export async function approveReport(reportId: string, authToken: string) {
  try {
    // TODO: Implement actual API call to approve report
    console.log(`Approving report ${reportId}`);
    return { success: true };
  } catch (error) {
    console.error('Error approving report:', error);
    throw error;
  }
}

export async function generateBankSummaryReport(organizationID: string, monthYear: string, authToken: string) {
  try {
    console.log(`Generating bank summary report for ${monthYear}`);
    
    // TODO: Replace with actual API endpoint
    const response = await fetch(`/api/reports/bank-summary/${organizationID}?month=${monthYear}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to generate bank summary: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error generating bank summary report:', error);
    throw error;
  }
}

export async function generateAgentSummaryReport(organizationID: string, monthYear: string, authToken: string) {
  try {
    console.log(`Generating agent summary report for ${monthYear}`);
    
    // TODO: Replace with actual API endpoint  
    const response = await fetch(`/api/reports/agent-summary/${organizationID}?month=${monthYear}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to generate agent summary: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error generating agent summary report:', error);
    throw error;
  }
}

export async function exportAPReport(organizationID: string, authToken: string, reports: Report[]) {
  try {
    // Create CSV content from reports
    const csvHeaders = ['Processor', 'Status', 'Amount', 'Date', 'Issues'];
    const csvRows = reports.map(report => [
      report.processor || 'Unknown',
      report.status,
      report.amount ? `$${report.amount.toFixed(2)}` : '$0.00',
      report.date || new Date().toISOString().split('T')[0],
      report.auditIssues ? report.auditIssues.join('; ') : ''
    ]);
    
    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.join(','))
    ].join('\n');
    
    return csvContent;
  } catch (error) {
    console.error('Error exporting AP report:', error);
    throw error;
  }
}
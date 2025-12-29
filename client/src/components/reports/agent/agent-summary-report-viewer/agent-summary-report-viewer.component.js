import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getAgentSummaryReport, generateAgentSummaryReport, createAgentSummaryReport, updateReport } from '../../../../api/reports.api.js';
import './agent-summary-report-viewer.component.css';
import { FaCheck } from 'react-icons/fa';

const AgentSummaryReportViewer = ({ authToken, organizationID }) => {
  const [summaryReport, setSummaryReport] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [approvedRows, setApprovedRows] = useState([]);
  const [dbReport, setDbReport] = useState(null);
  const [hasChanges, setHasChanges] = useState(false); // Track if any changes were made
  const [selectedRows, setSelectedRows] = useState([]);
  const location = useLocation();

  // Extract the monthYear from the URL
  const queryParams = new URLSearchParams(location.search);
  const monthYear = queryParams.get('month');

  useEffect(() => {
    if (authToken && organizationID && monthYear) {
      const initializeData = async () => {
        try {
          console.log('Initializing data...');
          await generateSummaryReport(); // Generate the report first
          await fetchSavedAgentSummaryReport(); // Fetch saved approvals
        } catch (err) {
          console.error('Initialization failed:', err);
          setError('Initialization failed.');
        }
      };
      initializeData();
    } else {
      setError('Missing required data to fetch reports');
    }
  }, [authToken, organizationID, monthYear]);

  // Generate Agent Summary Report
  const generateSummaryReport = async () => {
    try {
      setLoading(true);
      console.log('Generating agent summary report...');
      const response = await generateAgentSummaryReport(organizationID, monthYear, authToken);
      const agentReports = response.data.reportData;

      console.log('Generated agent reports:', agentReports);

      if (!Array.isArray(agentReports)) {
        throw new Error('Invalid response structure: reportData is not an array');
      }

      // Set the initial report data and keep it in memory for merging later
      setSummaryReport(agentReports);

    } catch (err) {
      console.error('Error generating agent summary report:', err);
      setError('Failed to generate agent summary report');
    } finally {
      setLoading(false);
    }
  };

  const fetchSavedAgentSummaryReport = async () => {
    try {
      console.log('Fetching saved agent summary report...');
      const savedReportResponse = await getAgentSummaryReport(organizationID, monthYear, authToken);
      if (savedReportResponse && savedReportResponse.data) {
        const savedReportData = savedReportResponse.data.reportData || [];
        console.log('Fetched saved report from DB:', savedReportData);
        setApprovedRows(savedReportData);
        mergeApprovedRows(savedReportData); // Merge saved data into the generated report
        setDbReport(savedReportResponse.data);
      }
    } catch (error) {
      console.error('Error fetching saved agent summary report:', error);
    }
  };

  const handleBulkSelect = () => {
    const allSelected = selectedRows.length === summaryReport.length;
    setSelectedRows(allSelected ? [] : summaryReport.map(item => item.agentID));
  };

  const handleBulkApprove = () => {
    const updatedApprovedRows = [...approvedRows];
    selectedRows.forEach((agentID) => {
      if (!updatedApprovedRows.some(row => row.agentID === agentID)) {
        updatedApprovedRows.push({ agentID, approved: true });
      }
    });

    setApprovedRows(updatedApprovedRows);
    setSummaryReport((prevReport) =>
      prevReport.map((item) =>
        selectedRows.includes(item.agentID) ? { ...item, approved: true } : item
      )
    );
    setSelectedRows([]);
    setHasChanges(true);
  };

  // Use useEffect to merge once both summaryReport and approvedRows are available
  useEffect(() => {
    if (summaryReport.length > 0 && approvedRows.length > 0) {
      mergeApprovedRows(approvedRows);
    }
  }, [summaryReport, approvedRows]);

  const mergeApprovedRows = (approvedRows) => {
    console.log('Merging approved rows:', approvedRows);
    console.log('Current summary report before merging:', summaryReport);

    if (!summaryReport.length || !approvedRows.length) return;

    // Directly assign the approved status to matching agentIDs
    const updatedSummaryReport = summaryReport.map((item) => {
      const approvedRow = approvedRows.find(row => row.agentID === item.agentID);

      if (approvedRow) {
        console.log(`Assigning approved status for agentID: ${item.agentID}`);
        item.approved = approvedRow.approved; // Directly assign the approved status
      }

      return item;
    });

    console.log('Updated summary report after merging:', updatedSummaryReport);
    setSummaryReport(updatedSummaryReport);
  };


  // Handle row approval
  const handleApproveRow = (agentID) => {
    console.log('Handling row approval for agentID:', agentID);
    const updatedApprovedRows = [...approvedRows];
    const index = updatedApprovedRows.findIndex(row => row.agentID === agentID);

    if (index === -1) {
      updatedApprovedRows.push({ agentID, approved: true });
    } else {
      updatedApprovedRows[index].approved = true;
    }

    console.log('Updated approved rows:', updatedApprovedRows);
    setApprovedRows(updatedApprovedRows);

    // Update the summary report with the new approval status
    const updatedSummaryReport = summaryReport.map((item) =>
      item.agentID === agentID ? { ...item, approved: true } : item
    );

    setHasChanges(true); // Flag that changes are being made
    setSummaryReport(updatedSummaryReport);
  };

  // Save changes
  const handleSaveChanges = async () => {
    try {
        console.log('Saving changes...');

        // ✅ Check if all rows are approved
        const allRowsApproved = summaryReport.every(item =>
            approvedRows.some(approvedRow => 
                approvedRow.agentID === item.agentID && approvedRow.approved
            )
        );

        // ✅ Prepare the updated report structure with approval status
        const updatedReport = {
            monthYear,
            reportData: approvedRows,  // Save the report data directly
            approved: allRowsApproved,  // ✅ Mark the entire report as approved if all rows are approved
        };

        console.log('Final report to save:', updatedReport);

        // ✅ Save or update the report in the database
        if (dbReport) {
            await updateReport(dbReport.reportID, updatedReport, authToken);
            console.log("Updated existing report.");
        } else {
            await createAgentSummaryReport(organizationID, updatedReport, authToken);
            console.log("Created a new summary report.");
        }

        alert('Changes saved successfully!');
        setHasChanges(false);  // ✅ Reset the changes flag after a successful save
    } catch (error) {
        console.error('Error saving agent summary report:', error);
        alert('Error saving agent summary report. Please check the console for details.');
    }
};


  // Export to CSV function
  const exportToCSV = () => {
    const csvHeaders = [
      "Agent ID", "Agent Name", "Transactions", "Sales Amount", "Income", "Expenses", "Net", "Agent Net"
    ];
    const csvRows = summaryReport.map(item => [
      item.agentID,
      item.agentName,
      item.totalTransactions,
      item.totalSalesAmount,
      item.totalIncome,
      item.totalExpenses,
      item.totalNet,
      item.totalAgentNet
    ]);

    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `Agent_Summary_Report_${monthYear}.csv`;
    link.click();

    URL.revokeObjectURL(url);
  };

  const renderTableRows = () => {
    return summaryReport.map((item, index) => {
      const isSelected = selectedRows.includes(item.agentID);
      const isApproved = item.approved;

      return (
        <tr key={index} className={`report-row ${isApproved ? 'approved' : ''}`}>
          <td>
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => setSelectedRows(prev =>
                isSelected ? prev.filter(id => id !== item.agentID) : [...prev, item.agentID]
              )}
            />
          </td>
          <td>{item.agentName || 'N/A'}</td>
          <td>{item.totalTransactions || 'N/A'}</td>
          <td>{item.totalSalesAmount || 'N/A'}</td>
          <td>{item.totalIncome || 'N/A'}</td>
          <td>{item.totalExpenses || 'N/A'}</td>
          <td>{item.totalNet || 'N/A'}</td>
          <td>{item.totalAgentNet || 'N/A'}</td>
          <td>{isApproved && <FaCheck />}</td>
        </tr>
      );
    });
  };


  if (loading) {
    return <div className="agent-summary-report-viewer"><p>Loading...</p></div>;
  }

  if (error) {
    return <div className="agent-summary-report-viewer"><p>{error}</p></div>;
  }

  return (
    <div className="report-viewer">
      <header className="header">
        <h1 className="header-title">Agent Summary Report for {monthYear}</h1>
        <button onClick={exportToCSV} className="btn-export">Export to CSV</button>
      </header>

      <p><strong>Month:</strong> {monthYear}</p>
      

      <div className="status-save-container">
        {dbReport?.approved ? (
          <p className="status-text status-approved">Status: Approved</p>
        ) : (
          <p className="status-text status-needs-approval">Status: Needs Approval</p>
        )}

        {hasChanges && (
          <button onClick={handleSaveChanges} className="btn-save">Save Changes</button>
        )}
      </div>

      <div className="bulk-action-container">
        <button onClick={handleBulkApprove} disabled={!selectedRows.length} className="bulk-action-btn">
          Bulk Approve
        </button>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th><input type="checkbox" onChange={handleBulkSelect} checked={selectedRows.length === summaryReport.length} /></th>
              <th>Agent Name</th>
              <th>Transactions</th>
              <th>Sales Amount</th>
              <th>Income</th>
              <th>Expenses</th>
              <th>Net</th>
              <th>Agent Net</th>
              <th>Approved</th>
            </tr>
          </thead>
          <tbody>
            {renderTableRows()}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AgentSummaryReportViewer;

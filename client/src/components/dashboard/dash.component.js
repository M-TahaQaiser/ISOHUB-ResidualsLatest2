import React, { useEffect, useState } from 'react';
import { getReports } from '../../api/reports.api.js';
import './dash.component.css';
import { useNavigate } from 'react-router-dom';

const Dashboard = ({ organizationID, username, authToken }) => {
  const [needsUpload, setNeedsUpload] = useState([]); // Reports that need to be uploaded
  const [needsApproval, setNeedsApproval] = useState([]); // Reports that need to be approved
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Processor report types
  const processorReports = {
    'accept.blue': 'billing report', 
    'PAAY': 'billing report', 
    'Clearent': 'process report', 
    'Fiserv Bin & ICA': 'process report',
    'Fiserv Omaha': 'process report',
    'Global': 'process report',
    'Merchant Lynx': 'process report',
    'Micamp': 'process report',
    'Payment Advisors': 'process report',
    'Shift4': 'process report',
    'Hyfin': 'process report', 
    'Rectangle Health': 'process report',
    'TRX': 'process report'
  };

  // Get the previous month and year
  const getPreviousMonth = () => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1); // Get the previous month
    const month = date.toLocaleString('default', { month: 'long' });
    const year = date.getFullYear();
    return { month, year };
  };

  // Fetch reports for the previous month
  const fetchReports = async () => {
    const { month, year } = getPreviousMonth();
    setLoading(true);

    try {
      // Fetch all reports for the organization
      const fetchedReports = await getReports(organizationID, 'ar', authToken);

      if (!fetchedReports || fetchedReports.length === 0) {
        // If no reports are found, mark all processors as needing uploads
        const allProcessorsNeedUpload = Object.keys(processorReports).map(processor => ({
          processor,
          reportType: processorReports[processor]
        }));
        setNeedsUpload(allProcessorsNeedUpload);
        setNeedsApproval([]); // No approvals if no reports
        setLoading(false);
        return;
      }

      // Filter reports for the previous month
      const previousMonthReports = fetchedReports.filter(report => {
        const reportDate = new Date(report.month);
        return reportDate.getMonth() === new Date(`${month} ${year}`).getMonth() && reportDate.getFullYear() === year;
      });

      // Initialize lists for reports that need uploading or approval
      const reportsToUpload = [];
      const reportsToApprove = [];

      // Check if each processor's report has been uploaded and approved
      for (const processor in processorReports) {
        const reportType = processorReports[processor];
        const existingReport = previousMonthReports.find(report => report.processor === processor && report.type === reportType);

        if (!existingReport) {
          // If no report found for this processor, add it to the upload list
          reportsToUpload.push({ processor, reportType });
        } else if (!existingReport.approved) {
          // If the report exists but isn't approved, add it to the approval list
          reportsToApprove.push(existingReport);
        }
      }

      setNeedsUpload(reportsToUpload);
      setNeedsApproval(reportsToApprove);
    } catch (error) {
      console.error('Error fetching reports:', error);
      // If there's any error, show all processors as needing uploads
      const allProcessorsNeedUpload = Object.keys(processorReports).map(processor => ({
        processor,
        reportType: processorReports[processor]
      }));
      setNeedsUpload(allProcessorsNeedUpload);
      setNeedsApproval([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [authToken, organizationID]);

  // Navigate to report upload or edit page
  const handleEditClick = (reportID) => {
    navigate(`/edit-report/${reportID}`);
  };

  const handleUploadClick = () => {
    navigate('/upload-report');
  };

  return (
    <div className="dashboard-container">
      <h1>Welcome, {username}</h1>
  
      {loading ? (
        <p>Loading reports...</p>
      ) : (
        <>
          <h2>Reports for {getPreviousMonth().month} {getPreviousMonth().year}</h2>
            {/* Single upload button for all missing reports */}
            {needsUpload.length > 0 && (
            <div className="button-container">
              <button onClick={handleUploadClick}>Upload Missing Reports</button>
            </div>
          )}
          <div className="reports-section">
            {/* Table for Reports Needing Upload */}
            <div className="table-container">
              <h3>Reports Needing Upload</h3>
              {needsUpload.length > 0 ? (
                <>
                  <table>
                    <thead>
                      <tr>
                        <th>Processor</th>
                        <th>Report Type</th>
                      </tr>
                    </thead>
                    <tbody>
                      {needsUpload.map((report, index) => (
                        <tr key={index}>
                          <td>{report.processor}</td>
                          <td>{report.reportType}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              ) : (
                <p>All reports have been uploaded.</p>
              )}
            </div>
  
            {/* Table for Reports Needing Approval */}
            <div className="table-container">
              <h3>Reports Needing Approval</h3>
              {needsApproval.length > 0 ? (
                <table>
                  <thead>
                    <tr>
                      <th>Processor</th>
                      <th>Report Type</th>
                      <th>Month</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {needsApproval.map((report, index) => (
                      <tr key={index}>
                        <td>{report.processor}</td>
                        <td>{report.type}</td>
                        <td>{new Date(report.month).toLocaleString('default', { month: 'long', year: 'numeric' })}</td>
                        <td>
                          <button onClick={() => handleEditClick(report.reportID)}>
                            <i className="fa fa-pencil"></i> Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p>All reports have been approved.</p>
              )}
            </div>
          </div>
  

        </>
      )}
    </div>
  );
  
};

export default Dashboard;

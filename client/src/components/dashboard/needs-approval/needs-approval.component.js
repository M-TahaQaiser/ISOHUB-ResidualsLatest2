import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getNeedsApproval } from '../../../api/dashboard.api';
import './needs-approval.component.css';

const NeedsApproval = ({ authToken, organizationID }) => {
  const [reportsThatNeedApproval, setReportsThatNeedApproval] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const reportsPerPage = 5;
  const navigate = useNavigate();

  // Helper function to get the previous month and year
  const getPreviousMonthAndYear = () => {
    const date = new Date();
    const previousMonth = date.getMonth() === 0 ? 11 : date.getMonth() - 1;
    const year = date.getMonth() === 0 ? date.getFullYear() - 1 : date.getFullYear();
    const monthName = new Date(year, previousMonth).toLocaleString('default', { month: 'long' });
    return { month: monthName, year };
  };

  useEffect(() => {
    if (authToken && organizationID) {
      fetchNeedsApproval();
    }
  }, [authToken, organizationID]);

  const fetchNeedsApproval = async () => {
    try {
      const data = await getNeedsApproval(organizationID, authToken);
      setReportsThatNeedApproval(data);
    } catch (error) {
      console.error('Error fetching needs approval data:', error);
      setReportsThatNeedApproval([]);
    }
  };

  // Pagination logic
  const indexOfLastReport = currentPage * reportsPerPage;
  const indexOfFirstReport = indexOfLastReport - reportsPerPage;
  const currentReports = reportsThatNeedApproval.slice(indexOfFirstReport, indexOfLastReport);
  const totalPages = Math.ceil(reportsThatNeedApproval.length / reportsPerPage);

  // Navigation handlers
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleEditClick = (reportID) => navigate(`/report/${reportID}`);
  const handleViewAgentReport = (agentID, month) => navigate(`/agent-report/${agentID}?month=${month}`);
  const handleViewSummaryReport = (month) => navigate(`/agent-summary-report?month=${month}`);
  const handleViewProcessorSummaryReport = (month) => navigate(`/processor-summary-report?month=${month}`);
  const handleViewBankSummaryReport = (month) => navigate(`/bank-summary-report?month=${month}`);

  return (
    <div className="needs-approval-container bg-zinc-900 rounded-lg shadow-sm p-6 mb-8 border border-yellow-400/20 b-maine-wrap">
      <h3 className='text-lg font-semibold text-white mb-4'>Reports Needing Approval</h3>
      {reportsThatNeedApproval.length > 0 ? (
        <>
          <ul className="report-list">
            {currentReports.map((report, index) =>
              report.processor !== 'Unknown Processor' && (
                <li key={index} className="report-item">
                  <strong>
                    {report.type === 'ar'
                      ? 'Accounts Receivable'
                      : report.type === 'agent summary'
                      ? 'Agent Summary Report'
                      : report.type === 'processor summary'
                      ? 'Processor Summary Report'
                      : report.type === 'bank summary'
                      ? 'Bank Summary Report'
                      : report.processor}
                  </strong>
                  {report.type === 'agent summary' ? (
                    <button onClick={() => handleViewSummaryReport(report.month)}>Edit</button>
                  ) : report.type === 'processor summary' ? (
                    <button onClick={() => handleViewProcessorSummaryReport(report.month)}>Edit</button>
                  ) : report.type === 'agent' ? (
                    <button
                      onClick={() =>
                        handleViewAgentReport(
                          report.agentID,
                          report.month || `${getPreviousMonthAndYear().month} ${getPreviousMonthAndYear().year}`
                        )
                      }
                    >
                      Edit
                    </button>
                  ) : report.type === 'bank summary' ? (
                    <button
                      onClick={() =>
                        handleViewBankSummaryReport(
                          report.month || `${getPreviousMonthAndYear().month} ${getPreviousMonthAndYear().year}`
                        )
                      }
                    >
                      Edit
                    </button>
                  ) : (
                    <button onClick={() => handleEditClick(report.reportID)}>Edit</button>
                  )}
                </li>
              )
            )}
          </ul>
          <div className="pagination">
            {Array.from({ length: totalPages }, (_, index) => (
              <button
                key={index}
                className={`pagination-btn ${index + 1 === currentPage ? 'active' : ''}`}
                onClick={() => handlePageChange(index + 1)}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </>
      ) : (
        <p className='text-sm text-gray-300 text-center'>All reports have been approved.</p>
      )}
    </div>
  );
};

export default NeedsApproval;

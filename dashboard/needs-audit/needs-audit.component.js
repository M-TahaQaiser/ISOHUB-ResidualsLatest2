import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './needs-audit.component.css'; // Assuming you'll add styles here

const NeedsAudit = ({ reports }) => {
  const [reportsThatNeedAudit, setReportsThatNeedAudit] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const reportsPerPage = 5; // Adjust the number of reports per page
  const navigate = useNavigate();

  useEffect(() => {
    // Filter reports that have entries needing audit
    const reportsNeedingAudit = reports.filter(report => 
      Array.isArray(report.reportData) && report.reportData.some(item => item.needsAudit)
    );
    setReportsThatNeedAudit(reportsNeedingAudit);
  }, [reports]);

  // Pagination logic
  const indexOfLastReport = currentPage * reportsPerPage;
  const indexOfFirstReport = indexOfLastReport - reportsPerPage;
  const currentReports = reportsThatNeedAudit.slice(indexOfFirstReport, indexOfLastReport);
  const totalPages = Math.ceil(reportsThatNeedAudit.length / reportsPerPage);

  // Handle page change
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Navigate to the report edit page
  const handleEditClick = (reportID) => {
    navigate(`/report/${reportID}`);
  };

  return (
    <div className="needs-audit-container bg-zinc-900 rounded-lg shadow-sm p-6 mb-8 border border-yellow-400/20 b-maine-wrap">
      <h3 className='text-lg font-semibold text-white mb-4'>Reports Needing Audit</h3>
      {reportsThatNeedAudit.length > 0 ? (
        <>
          <ul className="audit-list">
            {currentReports.map((report, index) => (
              <li key={index} className="audit-item px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                <strong className='font-medium text-sm text-gray-300'>{report.processor || 'Unknown Processor'}</strong>
                <button className='text-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-black bg-yellow-400 hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-400' onClick={() => handleEditClick(report.reportID)}>Edit</button>
              </li>
            ))}
          </ul>

          {/* Pagination */}
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
        <p>All reports have been audited.</p>
      )}
    </div>
  );
};

export default NeedsAudit;

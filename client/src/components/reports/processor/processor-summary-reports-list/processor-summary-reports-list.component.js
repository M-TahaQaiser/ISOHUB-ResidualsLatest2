import React, { useState, useEffect } from 'react';
import { FaEye } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { getReports } from '../../../../api/reports.api';
import './processor-summary-reports-list.component.css';

const ProcessorSummaryReportsList = ({ authToken, organizationID, filterMonth, filterYear }) => {
  const [summaryReports, setSummaryReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (authToken && organizationID) {
      fetchProcessorReports();
    }
  }, [authToken, organizationID, filterMonth, filterYear]);

  const fetchProcessorReports = async () => {
    try {
      setLoading(true);
      // Fetch all processor reports from the backend
      const processorReports = await getReports(organizationID, 'processor', authToken);

      // Filter processor reports based on the selected month and year
      const filteredReports = processorReports.filter(report => {
        if (filterMonth && !report.month.includes(filterMonth)) return false;
        if (filterYear && report.year !== filterYear) return false;
        return true;
      });

      // Create a summary report entry for each unique month-year combination
      const uniqueMonthYearCombinations = [...new Set(filteredReports.map(report => `${report.month}-${report.year}`))];
      const summaryReportsData = uniqueMonthYearCombinations.map(monthYear => {
        const [month, year] = monthYear.split('-');
        return {
          month,
          year,
          reports: filteredReports.filter(report => report.month === month && report.year === year),
        };
      });

      setSummaryReports(summaryReportsData);
    } catch (error) {
      console.error('Error fetching processor reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewSummaryReport = (month, year) => {
    // Navigate to the processor summary report viewer page
    navigate(`/processor-summary-report?month=${month}`);
  };

  if (loading) {
    return <div className="processor-summary-reports-list"><p>Loading...</p></div>;
  }

  return (
    <div className="processor-summary-reports-list">
      <table>
        <thead>
          <tr>
            <th>Month</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {summaryReports.map(summaryReport => (
            <tr key={`${summaryReport.month}-${summaryReport.year}`}>
              <td>{summaryReport.month}</td>
              <td>
                <button
                  className="btn-view"
                  onClick={() => handleViewSummaryReport(summaryReport.month, summaryReport.year)}
                >
                  <FaEye />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ProcessorSummaryReportsList;

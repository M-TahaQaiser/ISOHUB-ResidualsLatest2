import React, { useState, useEffect } from 'react';
import { FaEye, FaTrash } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import './billing-reports.component.css'; // Create this CSS file for styling
import { getReports, deleteReport } from '../../api/reports.api';
import ReportViewer from '../reportViewer/reportViewer.component';

const BillingReports = ({ authToken, organizationID }) => {
    const [reports, setReports] = useState([]);
    const [filteredReports, setFilteredReports] = useState([]);
    const [filterMonth, setFilterMonth] = useState('');
    const [filterYear, setFilterYear] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(true); // Loading state to track data fetching
    const reportsPerPage = 10;
    const navigate = useNavigate(); // Initialize the useNavigate hook

    useEffect(() => {
        if (authToken && organizationID) {
            fetchBillingReports();
        }
    }, [authToken, organizationID]); // Fetch reports only when both are available

    useEffect(() => {
        filterReports();
    }, [filterMonth, filterYear, reports]);

    const fetchBillingReports = async () => {
        try {
            setLoading(true); // Set loading to true before fetching
            const data = await getReports(organizationID, 'billing', authToken);
            setReports(data);
            setFilteredReports(data);
        } catch (error) {
            console.error('Error fetching billing reports:', error);
        } finally {
            setLoading(false); // Stop loading after data is fetched
        }
    };

    const filterReports = () => {
        let filtered = reports;

        if (filterMonth) {
            filtered = filtered.filter(report => report.month.includes(filterMonth));
        }

        if (filterYear) {
            filtered = filtered.filter(report => report.year === filterYear);
        }

        setFilteredReports(filtered);
        setCurrentPage(1); // Reset to the first page after filtering
    };

    const handleView = (reportID) => {
        navigate(`/report/${reportID}`);
    };

    const handleDelete = async (reportID) => {
        try {
            await deleteReport(reportID, authToken);
            setReports(reports.filter(report => report.reportID !== reportID));
        } catch (error) {
            console.error('Error deleting report:', error);
        }
    };
    
  // Function to navigate to the report upload component
  const handleUploadClick = () => {
    navigate('/upload-report');
  };

    // Pagination logic
    const indexOfLastReport = currentPage * reportsPerPage;
    const indexOfFirstReport = indexOfLastReport - reportsPerPage;
    const currentReports = filteredReports.slice(indexOfFirstReport, indexOfLastReport);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    if (loading) {
        return <div className="billing-reports"><p>Loading...</p></div>; // Display loading state
    }

    return (
        <div className="billing-reports">
            <div className="header">
                <h2>Billing Reports</h2>
                <button onClick={handleUploadClick}>Go to Report Upload</button> {/* Button to navigate to upload */}
            </div>
            <div className="filters">
                <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)}>
                    <option value="">All Months</option>
                    <option value="January">January</option>
                    <option value="February">February</option>
                    <option value="March">March</option>
                    <option value="April">April</option>
                    <option value="May">May</option>
                    <option value="June">June</option>
                    <option value="July">July</option>
                    <option value="August">August</option>
                    <option value="September">September</option>
                    <option value="October">October</option>
                    <option value="November">November</option>
                    <option value="December">December</option>
                </select>
                <input
                    type="number"
                    placeholder="Year"
                    value={filterYear}
                    onChange={(e) => setFilterYear(e.target.value)}
                />
            </div>
            <table>
                <thead>
                    <tr>
                        <th>Month</th>
                        <th>Processor</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {currentReports.map((report) => (
                        <tr key={report.reportID}>
                            <td>{report.month}</td>
                            <td>{report.processor}</td>
                            <td>
                                <button className="btn-view" onClick={() => handleView(report.reportID)}>
                                    <FaEye />
                                </button>
                                <button className="btn-delete" onClick={() => handleDelete(report.reportID)}>
                                    <FaTrash />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <div className="pagination">
                {[...Array(Math.ceil(filteredReports.length / reportsPerPage)).keys()].map(number => (
                    <button
                        key={number + 1}
                        onClick={() => paginate(number + 1)}
                        className={currentPage === number + 1 ? 'active' : ''}
                    >
                        {number + 1}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default BillingReports;

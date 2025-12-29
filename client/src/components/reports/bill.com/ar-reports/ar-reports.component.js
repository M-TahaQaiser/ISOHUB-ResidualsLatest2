import React, { useState, useEffect } from 'react';
import { FaEye, FaTrash } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import './ar-reports.component.css';
import { getReports, deleteReport } from '../../../../api/reports.api';

const ARReports = ({ authToken, organizationID }) => {
    const [reports, setReports] = useState([]);
    const [filteredReports, setFilteredReports] = useState([]);
    const [filterMonth, setFilterMonth] = useState('');
    const [filterYear, setFilterYear] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const reportsPerPage = 10;
    const navigate = useNavigate();

    useEffect(() => {
        fetchARReports();
    }, []);

    useEffect(() => {
        filterReports();
    }, [filterMonth, filterYear, reports]);

    const fetchARReports = async () => {
        try {
            const data = await getReports(organizationID, 'ar', authToken);
            setReports(data);
            setFilteredReports(data);
        } catch (error) {
            console.error('Error fetching AR reports:', error);
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

    const handleView = (id) => {
        navigate(`/report/${id}`);
    };

    const handleDelete = async (reportID) => {
        try {
            await deleteReport(reportID, authToken);
            setReports(reports.filter(report => report.reportID !== reportID));
        } catch (error) {
            console.error('Error deleting report:', error);
        }
    };

    const indexOfLastReport = currentPage * reportsPerPage;
    const indexOfFirstReport = indexOfLastReport - reportsPerPage;
    const currentReports = filteredReports.slice(indexOfFirstReport, indexOfLastReport);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    return (
        <div className="ar-reports">
            <div className="header">
                <h2>AR Reports</h2>
            </div>
            <div className="filters">
                <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)}>
                    <option value="">All Months</option>
                    {/* Loop through months */}
                    {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(month => (
                        <option value={month} key={month}>{month}</option>
                    ))}
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
                    {currentReports.length > 0 ? (
                        currentReports.map((report) => (
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
                        ))
                    ) : (
                        <tr>
                            <td colSpan="3">No reports found</td>
                        </tr>
                    )}
                </tbody>
            </table>
            {filteredReports.length > reportsPerPage && (
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
            )}
        </div>
    );
};

export default ARReports;

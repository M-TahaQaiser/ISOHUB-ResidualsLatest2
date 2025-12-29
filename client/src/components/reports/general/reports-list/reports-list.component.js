import React, { useState, useEffect } from 'react';
import { FaEye, FaTrash } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { confirmAlert } from 'react-confirm-alert';
import 'react-confirm-alert/src/react-confirm-alert.css';
import { getReports, deleteReport } from '../../../../api/reports.api';
import './reports-list.component.css';

const ReportsList = ({ authToken, organizationID, type, filterMonth, filterYear, searchTerm, setUniqueProcessor }) => {
    const [reports, setReports] = useState([]);
    const [filteredReports, setFilteredReports] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const reportsPerPage = 10;
    const navigate = useNavigate();

    useEffect(() => {
        if (authToken && organizationID) {
            fetchReports();
        }
    }, [authToken, organizationID, type]);

    useEffect(() => {
        filterReports();
    }, [filterMonth, filterYear, searchTerm, reports]);

    const fetchReports = async () => {
        try {
            setLoading(true);
            const data = await getReports(organizationID, type, authToken);
            // Filter out reports with type 'agent'
            const nonAgentReports = Array.isArray(data) ? data.filter(report => report.type !== 'agent') : [];
            setReports(nonAgentReports);
            setFilteredReports(nonAgentReports);
        } catch (error) {
            console.error(`Error fetching ${type} reports:`, error);
        } finally {
            setLoading(false);
        }
    };
    

    const filterReports = () => {
        let filtered = reports;

        if (filterMonth) {
            filtered = filtered.filter(report => report.month.includes(filterMonth));
        }

        if (filterYear) {
            filtered = filtered.filter(report => report.month.includes(filterYear));
        }

        if (searchTerm) {
            const lowercasedTerm = searchTerm.toLowerCase();
            filtered = filtered.filter(report => 
                report.processor.toLowerCase().includes(lowercasedTerm) ||
                report.month.toLowerCase().includes(lowercasedTerm)
            );
        }

        setFilteredReports(filtered);
        setCurrentPage(1);
        const uniqueFirstProcessor = [
            ...new Set(filtered.map(report => report.processor?.trim()).filter(Boolean))
        ];
        
        setUniqueProcessor(uniqueFirstProcessor);
    };

    const handleView = (reportID) => {
        navigate(`/report/${reportID}`);
    };

    const handleDelete = async (reportID) => {
        try {
            confirmAlert({
                title: 'Confirm to delete',
                message: 'Are you sure you want to delete this report? This action can\'t be undone.',
                buttons: [
                    {
                        label: 'Yes',
                        onClick: async () => {
                            try {
                                await deleteReport(reportID, authToken);
                                setReports(reports.filter(report => report.reportID !== reportID));
                            } catch (err) {
                                setError('Failed to delete report');
                            }
                        }
                    },
                    {
                        label: 'No'
                    }
                ]
            });
        } catch (error) {
            console.error('Error deleting report:', error);
        }
    };

    const handleUploadClick = () => {
        navigate('/upload-report');
    };

    const indexOfLastReport = currentPage * reportsPerPage;
    const indexOfFirstReport = indexOfLastReport - reportsPerPage;
    const currentReports = Array.isArray(filteredReports) ? filteredReports.slice(indexOfFirstReport, indexOfLastReport) : [];

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    if (loading) {
        return <div className="report-list"><p>Loading...</p></div>;
    }

    return (
        <div className="report-list">
            <table>
                <thead>
                    <tr>
                        <th className='border-l-0 border-b px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider'>Month</th>
                        <th className='border-l-0 border-b px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider'>Processor</th>
                        <th className='border-l-0 border-b px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider'>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {currentReports.map((report) => (
                        <tr key={report.reportID}>
                            <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-300'>{report.month}</td>
                            <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-300'>{report.processor}</td>
                            <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-300'>
                                <button className="btn-view text-yellow-400 hover:text-yellow-500"  onClick={() => handleView(report.reportID)}>
                                    <FaEye />
                                </button>
                                <button className="btn-delete text-yellow-400 hover:text-yellow-500" onClick={() => handleDelete(report.reportID)}>
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

export default ReportsList;

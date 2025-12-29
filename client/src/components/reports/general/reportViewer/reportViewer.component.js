import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { FaPencilAlt, FaTrash, FaCheck, FaExclamationTriangle } from 'react-icons/fa';
import { getReportById, updateReport } from '../../../../api/reports.api';
import { regenerateProcessorReport } from '../../../../utils/reports/processorReport.util';
import './reportViewer.component.css';
import Totals from '../reports/totals/totals.component';

const ReportViewer = ({ authToken }) => {
    const { reportID } = useParams();
    const [report, setReport] = useState(null);
    const [editableReportData, setEditableReportData] = useState(null);
    const [status, setStatus] = useState({ loading: true, error: null });
    const [isEditingRow, setIsEditingRow] = useState(null);
    const [hasChanges, setHasChanges] = useState(false); // Track if any changes were made
    const [selectedRows, setSelectedRows] = useState([]); // Tracks selected rows for bulk actions
    const [currentPage, setCurrentPage] = useState(1); // Tracks the current page
    const [showDropdown, setShowDropdown] = useState(false);
    const [branchFilterActive, setBranchFilterActive] = useState(false); // New state for branch filter

    // Toggle branch filter function
    const toggleBranchFilter = () => setBranchFilterActive(!branchFilterActive);


    // Variables for pagination
    const rowsPerPage = 10; // Rows per page
    const indexOfLastRow = currentPage * rowsPerPage;
    const indexOfFirstRow = indexOfLastRow - rowsPerPage;
    const totalPages = Math.ceil(editableReportData?.length / rowsPerPage);

    // Modify filtered data for display, totals, and export
    const filteredReportData = branchFilterActive && report?.type === 'processor'
        ? editableReportData.filter(row => row['Branch ID'] !== 'N/A')
        : editableReportData;

    const currentRows = filteredReportData?.slice(indexOfFirstRow, indexOfLastRow);

    // Change page function with boundary check
    const paginate = (pageNumber) => {
        if (pageNumber > 0 && pageNumber <= totalPages) {
            setCurrentPage(pageNumber);
        }
    };


    useEffect(() => {
        fetchReport();
    }, [reportID, authToken]);

    const fetchReport = async () => {
        try {
            const data = await getReportById(reportID, authToken);
            setReport(data);
            setEditableReportData(data.reportData);
        } catch (err) {
            setStatus({ loading: false, error: 'Failed to fetch report.' });
        }
        setStatus({ loading: false, error: null });
    };



    const handleRegenerateReport = async () => {
        try {
            setStatus({ loading: true, error: null });
            const updatedReport = await regenerateProcessorReport(report.organizationID, authToken, report);
            setReport(updatedReport);
            setEditableReportData(updatedReport.reportData);
            setHasChanges(true); // Mark changes as unsaved
            setStatus({ loading: false, error: null });
        } catch (error) {
            console.error('Error regenerating report:', error);
            setStatus({ loading: false, error: 'Failed to regenerate report.' });
        }
    };


    const handleEditRow = (index) => {
        setIsEditingRow(index);
        setHasChanges(true); // Flag that changes are being made
    };

    const handleDeleteRow = (index) => {
        const updatedData = [...editableReportData];
        updatedData.splice(index, 1);
        setEditableReportData(updatedData);
        setHasChanges(true); // Flag that changes were made
    };

    const handleApproveRow = (index) => {
        const updatedData = [...editableReportData];
        updatedData[index].approved = true;
        updatedData[index].needsAudit = false;
        setEditableReportData(updatedData);
        setHasChanges(true); // Flag that changes were made
        setIsEditingRow(null);
    };

    // Toggle row selection with correct indexing across pages
    const toggleRowSelection = (index) => {
        const globalIndex = index + (currentPage - 1) * rowsPerPage;
        setSelectedRows((prevSelected) =>
            prevSelected.includes(globalIndex)
                ? prevSelected.filter((rowIndex) => rowIndex !== globalIndex)
                : [...prevSelected, globalIndex]
        );
    };

    // Select or deselect all rows on the current page
    const toggleSelectAll = () => {
        const pageIndices = currentRows.map((_, idx) => idx + (currentPage - 1) * rowsPerPage);
        const allSelected = pageIndices.every((idx) => selectedRows.includes(idx));
        setSelectedRows(allSelected ? selectedRows.filter((idx) => !pageIndices.includes(idx)) : [...selectedRows, ...pageIndices]);
    };

    // Updated Bulk Delete action
    const handleBulkDelete = () => {
        const updatedData = editableReportData.filter((_, idx) => !selectedRows.includes(idx));
        setEditableReportData(updatedData);
        setSelectedRows([]); // Reset selection
        setHasChanges(true);
    };


    // Bulk Approve action
    const handleBulkApprove = () => {
        const updatedData = [...editableReportData];
        selectedRows.forEach((index) => {
            updatedData[index].approved = true;
            updatedData[index].needsAudit = false;
        });
        setEditableReportData(updatedData);
        setSelectedRows([]); // Reset selection
        setHasChanges(true);
    };




    // Change page
    const handlePageChange = (page) => {
        setCurrentPage(page);
    };



    const handleInputChange = (e, index, header) => {
        const updatedData = [...editableReportData];
        updatedData[index][header] = e.target.value;
        setEditableReportData(updatedData);
        setHasChanges(true); // Flag that changes were made
    };
    const exportToCSV = () => {
        if (!filteredReportData || filteredReportData.length === 0) return;
    
        // ✅ Extract headers directly from the report data, excluding 'Needs Audit' and 'Approved'
        const headers = Object.keys(filteredReportData[0]).filter(header => !["Needs Audit", "approved"].includes(header));
        const csvRows = [];
        const numericColumns = [
            "lineItemQuantity", 
            "lineItemAmount", 
            "lineItemPrice"
        ];
    
        // ✅ Add headers as the first row
        csvRows.push(headers.join(','));
    
        // ✅ Initialize totals object
        const totals = headers.reduce((acc, header) => {
            acc[header] = 0;
            return acc;
        }, {});
    
        // ✅ Process each row and calculate totals for numeric columns only
        filteredReportData.forEach(item => {
            const row = headers.map(header => {
                const value = item[header];
    
                // ✅ Sum totals only for numeric columns
                if (numericColumns.includes(header)) {
                    const numericValue = parseFloat(value) || 0;
                    totals[header] += numericValue;
                }
    
                // ✅ Escape values for CSV safety
                const escapedValue = ('' + value).replace(/"/g, '\\"');
                return `"${escapedValue}"`;
            });
            csvRows.push(row.join(','));
        });
    
        /**
         * ✅ Add Totals Row:
         * - Include "Totals" in the first column (customerID)
         * - Only sum numeric columns, skip others
         */
        const totalsRow = headers.map((header, index) => {
            if (index === 0) {
                return `"Totals"`; // ✅ Place "Totals" label in the first column
            }
            if (numericColumns.includes(header)) {
                return `"${totals[header].toFixed(2)}"`; // ✅ Numeric totals formatted with 2 decimals
            }
            return '""'; // Leave non-numeric columns empty for proper alignment
        });
    
        csvRows.push(totalsRow.join(','));
    
        // ✅ Prepare CSV data and trigger download
        const csvString = csvRows.join('\n');
        const blob = new Blob([csvString], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
    
        // ✅ File naming based on filter state
        const reportType = branchFilterActive ? 'BankReport' : 'ProcessorReport';
        a.setAttribute('hidden', '');
        a.setAttribute('href', url);
        a.setAttribute('download', `${report.processor}${report.month.slice(0, -5)}${report.month.slice(-4)}.${reportType}.csv`);
    
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };
    

    
    const handleSaveChanges = async () => {
        try {
            const allRowsApproved = editableReportData.every((row) => row.approved);
            const updatedReport = {
                ...report,
                reportData: editableReportData,
                approved: allRowsApproved,
            };

            await updateReport(reportID, updatedReport, authToken);
            alert('Report updated successfully!');
            fetchReport();
            setHasChanges(false);
        } catch (error) {
            console.error('Error updating report:', error);
        }
    };

    if (status.loading) return <p>Loading...</p>;
    if (status.error) return <p>{status.error}</p>;

    const tableHeaders = editableReportData?.length > 0
        ? Object.keys(editableReportData[0]).filter(header => header !== 'needsAudit' && header !== 'approved')
        : [];

    return (
        <div className='report-viewer'>
            <header className='header'>
                <h1>{report.type.slice(0, 1).toUpperCase() + report.type.slice(1)} Report</h1>
                <button onClick={exportToCSV} className="btn-export">Export to CSV</button>
            </header>

            {report ? (
                <>
                    <p><strong>Month:</strong> {report.month}</p>
                    <p><strong>Processor:</strong> {report.processor}</p>

                    <div className="status-save-container">
                        {/* Status text */}
                        {report.approved ? (
                            <p className="status-text approved-status">Status: Approved</p>
                        ) : (
                            <p className="status-text needs-approval">Status: Needs Approval</p>
                        )}
                        <button onClick={handleRegenerateReport} className="btn-regenerate">
                            Regenerate Report
                        </button>

                        {/* Save button */}
                        {hasChanges && (
                            <button onClick={handleSaveChanges} className="btn-save">Save Changes</button>
                        )}
                    </div>

                    <Totals reportData={filteredReportData} tableHeaders={tableHeaders} />
                    <div className="bulk-action-container">
                        <div className="dropdown">
                            <button className="dropdown-toggle" onClick={() => setShowDropdown(!showDropdown)}>
                                Bulk Actions
                            </button>
                            {showDropdown && (
                                <div className="dropdown-menu">
                                    <button onClick={handleBulkApprove} disabled={!selectedRows.length} className="dropdown-item">
                                        Bulk Approve
                                    </button>
                                    <button onClick={handleBulkDelete} disabled={!selectedRows.length} className="dropdown-item">
                                        Bulk Delete
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                    {report.type === 'processor' ? (

                        <div className="filter-controls">
                            <button onClick={toggleBranchFilter}>
                                {branchFilterActive ? 'Show Full Report' : 'Show Bank Report'}
                            </button>
                        </div>
                    ) : (
                        <></>
                    )}

                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>
                                        <input
                                            type="checkbox"
                                            checked={currentRows?.every((_, idx) => selectedRows.includes(idx + (currentPage - 1) * rowsPerPage))}
                                            onChange={toggleSelectAll}
                                        />
                                    </th>
                                    <th className='text-xs font-medium text-gray-300'>Needs Audit</th>
                                    {tableHeaders.map((header, index) => (
                                        <th key={index}>{header.replace(/([A-Z])/g, ' $1').trim()}</th>
                                    ))}
                                    <th className='text-xs font-medium text-gray-300'>Approved</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentRows?.map((item, index) => (
                                    <tr key={index} className="report-row">

                                        <td>
                                            <input
                                                type="checkbox"
                                                checked={selectedRows.includes(index + (currentPage - 1) * rowsPerPage)}
                                                onChange={() => toggleRowSelection(index + (currentPage - 1) * rowsPerPage)}
                                            />
                                        </td>
                                        <td className="needs-audit-column">
                                            {item.needsAudit ? <FaExclamationTriangle className="needs-audit-icon" /> : ''}
                                        </td>
                                        {tableHeaders.map((header, subIndex) => (
                                            <td key={subIndex}>
                                                {isEditingRow === index ? (
                                                    <input
                                                        type="text"
                                                        value={item[header]}
                                                        onChange={(e) => handleInputChange(e, index, header)}
                                                    />
                                                ) : (
                                                    typeof item[header] === 'object'
                                                        ? JSON.stringify(item[header])
                                                        : item[header] !== null && item[header] !== undefined
                                                            ? item[header].toString()
                                                            : ''
                                                )}
                                            </td>
                                        ))}
                                        <td className={`approved-column ${item.approved ? 'approved' : ''}`}>
                                            {item.approved ? (
                                                <FaCheck />
                                            ) : (
                                                <div className="action-buttons">
                                                    <button
                                                        onClick={() => handleEditRow(index)}
                                                        className="btn-edit"
                                                    >
                                                        <FaPencilAlt />
                                                    </button>
                                                    {isEditingRow === index && (
                                                        <button
                                                            onClick={() => handleDeleteRow(index)}
                                                            className="btn-delete"
                                                        >
                                                            <FaTrash />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleApproveRow(index)}
                                                        className="btn-approve"
                                                    >
                                                        <FaCheck />
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div className="pagination">
                            <button
                                onClick={() => paginate(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="pagination-arrow"
                            >
                                &laquo;
                            </button>

                            {currentPage > 1 && (
                                <button onClick={() => paginate(currentPage - 1)}>
                                    {currentPage - 1}
                                </button>
                            )}

                            <button className="active">{currentPage}</button>

                            {currentPage < totalPages && (
                                <button onClick={() => paginate(currentPage + 1)}>
                                    {currentPage + 1}
                                </button>
                            )}

                            <button
                                onClick={() => paginate(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="pagination-arrow"
                            >
                                &raquo;
                            </button>
                        </div>


                    </div>
                </>
            ) : (
                <p>No report data available.</p>
            )}


        </div>
    );
};

export default ReportViewer;

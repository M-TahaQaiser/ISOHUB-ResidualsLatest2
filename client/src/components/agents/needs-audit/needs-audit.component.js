import React, { useState, useEffect } from 'react';
import { FaPencilAlt, FaTrash } from 'react-icons/fa';
import './needs-audit.component.css';

const EXCLUDED_COLUMNS = [
    'created', 'status', 'status category', 'status age',
    'sales reps', 'current processor'
];

const NeedsAudit = ({ data = [] }) => {
    const [tableData, setTableData] = useState(data);
    const [currentPage, setCurrentPage] = useState(1);
    const [isEditingRow, setIsEditingRow] = useState(null);
    const [selectedRows, setSelectedRows] = useState([]);
    const rowsPerPage = 10;

    useEffect(() => {
        setTableData(data);
    }, [data]);

    const handleEdit = (index) => setIsEditingRow(index);

    const handleDelete = (index) => {
        const updatedData = tableData.filter((_, i) => i !== index);
        setTableData(updatedData);
    };

    const handleBulkDelete = () => {
        const updatedData = tableData.filter((_, index) => !selectedRows.includes(index));
        setTableData(updatedData);
        setSelectedRows([]);
    };

    const handleInputChange = (e, index, key) => {
        const updatedData = [...tableData];
        updatedData[index][key] = e.target.value;
        setTableData(updatedData);
    };

    const handleRowSelect = (index) => {
        setSelectedRows(prevSelected =>
            prevSelected.includes(index)
                ? prevSelected.filter((i) => i !== index)
                : [...prevSelected, index]
        );
    };

    const handleSelectAll = () => {
        setSelectedRows(selectedRows.length === currentRows.length ? [] : currentRows.map((_, i) => indexOfFirstRow + i));
    };

    const displayedColumns = Object.keys(tableData[0] || {}).filter(key =>
        !EXCLUDED_COLUMNS.includes(key.toLowerCase().trim())
    );

    const indexOfLastRow = currentPage * rowsPerPage;
    const indexOfFirstRow = indexOfLastRow - rowsPerPage;
    const currentRows = tableData.slice(indexOfFirstRow, indexOfLastRow);
    const totalPages = Math.ceil(tableData.length / rowsPerPage);

    const goToNextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));
    const goToPreviousPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));

    return (
        <div>
            <h2>Needs Audit</h2>
            {tableData.length === 0 ? (
                <p>No data available for needs audit.</p>
            ) : (
                <div className="needs-audit-table-container">
                    {/* Bulk Action Dropdown */}
                    <div className="bulk-actions">
                        <button className='delete' onClick={handleBulkDelete} disabled={selectedRows.length === 0}>Delete
                        </button>
                        <span>{selectedRows.length} selected</span>
                    </div>
                    <table className="needs-audit-table">
                        <thead>
                            <tr>
                                <th className='border-l-0 border-b px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider'>
                                    <input
                                        type="checkbox"
                                        checked={selectedRows.length === currentRows.length}
                                        onChange={handleSelectAll}
                                    />
                                </th>
                                {displayedColumns.map((key) => (
                                    <th key={key}>{key.replace(/([A-Z])/g, ' $1').trim()}</th>
                                ))}
                                <th className='border-l-0 border-b px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider'>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentRows.map((row, rowIndex) => (
                                <tr key={rowIndex}>
                                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-300'>
                                        <input
                                            type="checkbox"
                                            checked={selectedRows.includes(indexOfFirstRow + rowIndex)}
                                            onChange={() => handleRowSelect(indexOfFirstRow + rowIndex)}
                                        />
                                    </td>
                                    {displayedColumns.map((key) => (
                                        <td key={key} className='px-6 py-4 whitespace-nowrap text-sm text-gray-300'>
                                            {isEditingRow === indexOfFirstRow + rowIndex ? (
                                                <input
                                                    type="text"
                                                    value={row[key]}
                                                    onChange={(e) => handleInputChange(e, indexOfFirstRow + rowIndex, key)}
                                                    className="needs-audit-input"
                                                />
                                            ) : (
                                                row[key] !== null && row[key] !== undefined
                                                    ? row[key].toString()
                                                    : ''
                                            )}
                                        </td>
                                    ))}
                                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-300'>
                                        <div className="needs-audit-action-buttons">
                                            <button onClick={() => handleEdit(indexOfFirstRow + rowIndex)} className="needs-audit-btn-edit">
                                                <FaPencilAlt />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="needs-audit-pagination">
                        <button onClick={goToPreviousPage} disabled={currentPage === 1}>
                            Previous
                        </button>
                        <span>Page {currentPage} of {totalPages}</span>
                        <button onClick={goToNextPage} disabled={currentPage === totalPages}>
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NeedsAudit;

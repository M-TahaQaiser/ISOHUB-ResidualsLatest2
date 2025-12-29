import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { 
    getProcessorSummaryReport, 
    generateProcessorSummaryReport, 
    createProcessorSummaryReport, 
    updateReport 
} from '../../../../api/reports.api.js';
import Header from '../../../general/header/header.component.js';
import TableWithFilters from '../../../general/table/table.component.js';
import { exportToCSV } from '../../../../utils/export.util.js';
import { FaCheck } from 'react-icons/fa';

const ProcessorSummaryReportViewer = ({ authToken, organizationID }) => {
    const [summaryReport, setSummaryReport] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [approvedRows, setApprovedRows] = useState([]);
    const [dbReport, setDbReport] = useState(null);
    const [hasChanges, setHasChanges] = useState(false);
    const [selectedRows, setSelectedRows] = useState([]);

    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const monthYear = queryParams.get('month');

    useEffect(() => {
        if (authToken && organizationID && monthYear) {
            const initializeData = async () => {
                try {
                    await generateSummaryReport();
                    await fetchSavedProcessorSummaryReport();
                } catch (err) {
                    console.error("Initialization failed:", err);
                    setError('Initialization failed.');
                }
            };
            initializeData();
        } else {
            setError('Missing required data to fetch reports');
        }
    }, [authToken, organizationID, monthYear]);

    const generateSummaryReport = async () => {
        try {
            setLoading(true);
            const response = await generateProcessorSummaryReport(organizationID, monthYear, authToken);
            const processorReports = response.data.reportData;
            if (!Array.isArray(processorReports)) {
                throw new Error('Invalid response structure: reportData is not an array');
            }
            setSummaryReport(processorReports);
        } catch (err) {
            console.error('Error generating processor summary report:', err);
            setError('Failed to generate processor summary report');
        } finally {
            setLoading(false);
        }
    };

    const fetchSavedProcessorSummaryReport = async () => {
        try {
            const savedReportResponse = await getProcessorSummaryReport(organizationID, monthYear, authToken);
            if (savedReportResponse && savedReportResponse.data) {
                const savedReportData = savedReportResponse.data.reportData || [];
                setApprovedRows(savedReportData);
                mergeApprovedRows(savedReportData);
                setDbReport(savedReportResponse.data);
            }
        } catch (error) {
            console.error('Error fetching saved processor summary report:', error);
        }
    };

    useEffect(() => {
        if (approvedRows.length && summaryReport.length) {
            const updatedSummaryReport = summaryReport.map((item) => {
                const approvedRow = approvedRows.find(row => row.processor === item.processor);
                return { ...item, approved: approvedRow ? approvedRow.approved : false };
            });

            if (JSON.stringify(updatedSummaryReport) !== JSON.stringify(summaryReport)) {
                setSummaryReport(updatedSummaryReport);
            }
        }
    }, [approvedRows]);

    const mergeApprovedRows = (approvedRows) => {
        if (!summaryReport.length || !approvedRows.length) return;

        const updatedSummaryReport = summaryReport.map((item) => {
            const approvedRow = approvedRows.find(row => row.processor === item.processor);
            return {
                ...item,
                approved: approvedRow ? approvedRow.approved : false
            };
        });

        setSummaryReport(updatedSummaryReport);
    };

    const handleBulkApprove = () => {
        if (!selectedRows.length) return;

        const updatedApprovedRows = [...approvedRows];
        selectedRows.forEach((processor) => {
            if (!updatedApprovedRows.some(row => row.processor === processor)) {
                updatedApprovedRows.push({ processor, approved: true });
            }
        });

        setApprovedRows(updatedApprovedRows);
        setSummaryReport((prevReport) =>
            prevReport.map((item) =>
                selectedRows.includes(item.processor) ? { ...item, approved: true } : item
            )
        );
        setSelectedRows([]);
        setHasChanges(true);
    };

    const handleSaveChanges = async () => {
        try {
            const allRowsApproved = summaryReport.every((item) =>
                approvedRows.some(approvedRow =>
                    approvedRow.processor === item.processor && approvedRow.approved
                )
            );

            const { _id, ...reportWithoutId } = dbReport || {};
            const updatedReport = {
                ...reportWithoutId,
                organizationID,
                monthYear,
                reportData: approvedRows,
                approved: allRowsApproved,
            };

            if (dbReport?.reportID) {
                await updateReport(dbReport.reportID, updatedReport, authToken);
            } else {
                await createProcessorSummaryReport(organizationID, updatedReport, authToken);
            }

            alert('Changes saved successfully!');
        } catch (error) {
            console.error('Error saving processor summary report:', error);
            alert('Error saving summary report. Please check the console for more details.');
        }
    };

    const handleExport = () => {
        exportToCSV(summaryReport, columns, {}, `Processor_Summary_Report_${monthYear}.csv`);
    };

    // ✅ Define Table Columns
    const columns = [
        { field: "processor", label: "Processor" },
        { field: "totalTransactions", label: "Total Transactions", type: "number" },
        { field: "totalSalesAmount", label: "Total Sales Amount", type: "number" },
        { field: "totalIncome", label: "Total Income", type: "number" },
        { field: "totalExpenses", label: "Total Expenses", type: "number" },
        { field: "totalNet", label: "Total Net", type: "number" },
        { field: "totalAgentNet", label: "Total Agent Net", type: "number" },
        { field: "approved", label: "Approved", render: (value) => value ? <FaCheck /> : '' }
    ];

    if (loading) return <div>Loading...</div>;
    if (error) return <div>{error}</div>;

    return (
        <div>
            <Header 
                title={`Processor Summary Report - ${monthYear}`}
                supportingData={[`Status: ${dbReport?.approved ? "Approved" : "Needs Approval"}`]}
            />

            <div className="status-save-container">
                {hasChanges && <button onClick={handleSaveChanges} className="btn-save">Save Changes</button>}
            </div>

            {/* ✅ Use Reusable Table with Bulk Approve in Actions */}
            <TableWithFilters
                data={summaryReport}
                setData={setSummaryReport}
                idField="processor"
                columns={columns}
                enableSearch={true}
                enableTotals={true}
                selected={selectedRows}
                setSelected={setSelectedRows}
                actions={[
                    { name: "Approve", action: handleBulkApprove, disabled: !selectedRows.length }
                ]}
                totalFields={["totalTransactions", "totalSalesAmount", "totalIncome", "totalExpenses", "totalNet", "totalAgentNet"]}
            />
        </div>
    );
};

export default ProcessorSummaryReportViewer;

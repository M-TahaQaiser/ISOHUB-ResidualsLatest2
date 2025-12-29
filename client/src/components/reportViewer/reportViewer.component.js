import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getReportById, deleteReport } from '../../api/reports.api';
import './reportViewer.component.css';

const ReportViewer = ({ authToken, isSidebarOpen }) => {
    const { reportID } = useParams();
    const [report, setReport] = useState(null);
    const [status, setStatus] = useState({ loading: true, error: null });

    useEffect(() => {
        const fetchReport = async () => {
            try {
                const data = await getReportById(reportID, authToken);
                console.log(data);
                setReport(data);
            } catch (err) {
                setStatus({ loading: false, error: 'Failed to fetch report.' });
                return;
            }
            setStatus({ loading: false, error: null });
        };

        fetchReport();
    }, [reportID, authToken]);

    const exportToCSV = () => {
        if (!report || !report.reportData || report.reportData.length === 0) return;

        const headers = Object.keys(report.reportData[0]);
        const csvRows = [];

        // Add headers row
        csvRows.push(headers.join(','));

        // Add data rows
        report.reportData.forEach(item => {
            const row = headers.map(header => {
                const escapedValue = ('' + item[header]).replace(/"/g, '\\"');
                return `"${escapedValue}"`;
            });
            csvRows.push(row.join(','));
        });

        // Create CSV string
        const csvString = csvRows.join('\n');

        // Create a blob from the CSV string and trigger a download
        const blob = new Blob([csvString], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.setAttribute('hidden', '');
        a.setAttribute('href', url);
        a.setAttribute('download', `${report.type}-${reportID}.csv`);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    const deleteReport = async () => {
        try {
            await deleteReport(reportID, authToken);
            window.location.href = '/reports';
        } catch (err) {
            console.error(err);
        }
    };

    if (status.loading) return <p>Loading...</p>;
    if (status.error) return <p>{status.error}</p>;

    const tableHeaders = report?.reportData?.length > 0
        ? Object.keys(report.reportData[0])
        : [];

    return (
        <div className='report-viewer'>
                    <header className='header'>

            {report.type === 'billing' ? <h1>Billing Report</h1> : <h1>AR Report</h1>}
                    <button onClick={exportToCSV} className="btn-export">Export to CSV</button>
                    </header>
            {report ? (
                <>
                    <p><strong>Month:</strong> {report.month}</p>
                    <p><strong>Processor:</strong> {report.processor}</p>
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    {tableHeaders.map((header, index) => (
                                        <th key={index}>{header.replace(/([A-Z])/g, ' $1').trim()}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {report.reportData?.map((item, index) => (
                                    <tr key={index}>
                                        {tableHeaders.map((header, subIndex) => (
                                            <td key={subIndex}>{item[header]}</td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            ) : (
                <p>No report data available.</p>
            )}
        </div>
    );
};

export default ReportViewer;

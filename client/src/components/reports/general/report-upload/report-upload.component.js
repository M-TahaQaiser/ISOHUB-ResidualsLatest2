import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Import the hook
import { addReport } from '../../../../api/reports.api.js';
import './report-upload.component.css';

const ReportUpload = ({ authToken, organizationID }) => {
  const processors = [
    'accept.blue',
    'Clearent',
    'Fiserv Bin & ICA',
    'Fiserv Omaha',
    'Global',
    'Hyfin',
    'Merchant Lynx',
    'Micamp',
    'PAAY',
    'Payment Advisors',
    'Rectangle Health',
    'Shift4',
    'TRX'
  ];

  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  // Dynamically generate years including the current year and the previous few years
  const currentYear = new Date().getFullYear();
  const years = [currentYear, currentYear - 1, currentYear - 2, currentYear - 3];

  const [rows, setRows] = useState([]);
  const [uploadStatus, setUploadStatus] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [loading, setLoading] = useState(false); // Add loading state
  const navigate = useNavigate(); // Initialize useNavigate

  const handleAddRow = () => {
    setRows([...rows, { processor: '', file: null }]);
  };

  const handleProcessorChange = (index, value) => {
    const updatedRows = [...rows];
    updatedRows[index].processor = value;
    setRows(updatedRows);
  };

  const handleFileChange = (index, file) => {
    const updatedRows = [...rows];
    updatedRows[index].file = file;
    setRows(updatedRows);
  };

  const handleDeleteRow = (index) => {
    setRows(rows.filter((_, i) => i !== index));
  };

  const handleUpload = async (e) => {
    e.preventDefault();

    if (rows.length === 0) {
      setUploadStatus('Please add at least one file to upload.');
      return;
    }

    if (!selectedMonth || !selectedYear) {
      setUploadStatus('Please select a month and year.');
      return;
    }

    try {
      setLoading(true); // Show loading popup
      const formData = new FormData();
      
      rows.forEach((row) => {
        if (row.file && row.processor) {
          const processorFieldName = row.processor;
          formData.append(processorFieldName, row.file);
        }
      });

      formData.append('month', selectedMonth);
      formData.append('year', selectedYear);

      const response = await addReport(organizationID, formData, authToken);
      console.log('API Response:', response);

      if (response && response.status === 200) {
        setUploadStatus('Files uploaded successfully!');
        setLoading(false); // Hide loading popup
        navigate('/reports/all'); // Redirect after successful upload
      } else {
        setUploadStatus('Failed to upload files.');
        setLoading(false); // Hide loading popup on failure
      }
    } catch (error) {
      setUploadStatus(`Error: ${error.message}`);
      setLoading(false); // Hide loading popup on error
      console.error('Upload error:', error);
    }
  };
  
  
  const selectedProcessors = rows.map(row => row.processor); // Get all selected processors

  return (
    <div className='p-6'>
    <div className="report-upload-container max-w-7xl mx-auto bg-zinc-900 rounded-lg shadow-sm p-6 mb-8 ">
      <h2 className='text-lg font-semibold text-white mb-4'>Upload Reports</h2>

      {/* Month and Year Selection */}
      <div className="month-year-selection">
        <label className='text-xs font-medium text-gray-300'>
          Month:
          <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} required className='text-sm px-5 bg-zinc-800 ml-2 border-zinc-700 text-white rounded-md focus:ring-yellow-400 focus:border-yellow-400'>
            <option value="" disabled>Select Month</option>
            {months.map((month) => (
              <option key={month} value={month}>{month}</option>
            ))}
          </select>
        </label>

        <label className='text-xs font-medium text-gray-300'>
          Year:
          <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} required className='text-sm px-5 bg-zinc-800 ml-2 border-zinc-700 text-white rounded-md focus:ring-yellow-400 focus:border-yellow-400'>
            <option value="" disabled>Select Year</option>
            {years.map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </label>
      </div>

      <form onSubmit={handleUpload}>
        <table className="report-upload-table">
          <thead>
            <tr>
              <th>Processor</th>
              <th>File</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index}>
                <td>
                  <select
                    value={row.processor}
                    onChange={(e) => handleProcessorChange(index, e.target.value)}
                    required
                  >
                    <option value="" disabled>Select Processor</option>
                    {processors
                      .filter(processor => !selectedProcessors.includes(processor) || processor === row.processor) // Ensure processor is available or already selected
                      .map((processor) => (
                        <option key={processor} value={processor}>
                          {processor}
                        </option>
                      ))}
                  </select>
                </td>
                <td>
                  <input
                    type="file"
                    accept=".csv, .xlsx" // Limit file types to CSV and XLSX
                    onChange={(e) => handleFileChange(index, e.target.files[0])}
                    required
                  />
                </td>
                <td>
                  <button
                    type="button"
                    className="delete-btn"
                    onClick={() => handleDeleteRow(index)}
                  >
                    <i className="fa fa-trash"></i>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="add-row-btn">
          <button type="button" onClick={handleAddRow} className='text-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-black bg-yellow-400 hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-400'>
            Add File <i className="fa fa-plus"></i>
          </button>
        </div>

        {rows.length > 0 && (
          <button type="submit" className="upload-btn text-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-black bg-yellow-400 hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-400">
            Upload Files
          </button>
        )}
      </form>
      
      {uploadStatus && <p className="upload-status">{uploadStatus}</p>}

      {/* Loading Popup */}
      {loading && (
        <div className="loading-popup">
          <div className="loading-spinner"></div>
          <p>Uploading... Please wait</p>
        </div>
      )}
    </div>
    </div>
  );
};

export default ReportUpload;

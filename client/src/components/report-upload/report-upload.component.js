import React, { useState } from 'react';
import { addReport } from '../../api/reports.api.js'; // Import the addReport function
import './report-upload.component.css';

const ReportUpload = ({ authToken, organizationID }) => {
  const [acceptBlueFile, setAcceptBlueFile] = useState(null);
  const [paayFile, setPaayFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');

  const handleFileChange = (e, processor) => {
    if (processor === 'accept.blue') {
      setAcceptBlueFile(e.target.files[0]);
    } else if (processor === 'PAAY') {
      setPaayFile(e.target.files[0]);
    }
  };

const handleUpload = async (e) => {
  e.preventDefault();

  if (!acceptBlueFile && !paayFile) {
    setUploadStatus('Please select files for at least one processor.');
    return;
  }

  try {
    const formData = new FormData();
    if (acceptBlueFile) {
      formData.append('acceptBlueFile', acceptBlueFile);
      formData.append('processor', 'accept.blue');
    }

    if (paayFile) {
      formData.append('paayFile', paayFile);
      formData.append('processor', 'PAAY');
    }

    const response = await addReport(organizationID, formData, authToken);

    if (response) {
      setUploadStatus('Files uploaded successfully!');
    } else {
      setUploadStatus('Failed to upload files.');
    }
  } catch (error) {
    setUploadStatus('An error occurred during upload.');
    console.error('Upload error:', error);
  }
};

  return (
    <div className="report-upload-container">
      <h2>Upload Reports</h2>
      <form onSubmit={handleUpload}>
        <div className="upload-section">
          <label>
            Accept.Blue:
            <input type="file" onChange={(e) => handleFileChange(e, 'accept.blue')} />
          </label>
        </div>
        <div className="upload-section">
          <label>
            PAAY:
            <input type="file" onChange={(e) => handleFileChange(e, 'PAAY')} />
          </label>
        </div>
        <button type="submit">Upload</button>
      </form>
      {uploadStatus && <p className="upload-status">{uploadStatus}</p>}
    </div>
  );
};

export default ReportUpload;

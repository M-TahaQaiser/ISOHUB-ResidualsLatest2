import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { uploadAgents } from '../../../api/agents.api'; // This is the API call to upload the file
import './agent-uploader.component.css';

const AgentUploader = ({ authToken, organizationID }) => {
  const [file, setFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async (e) => {
    e.preventDefault();

    if (!file) {
      setUploadStatus('Please select a file to upload.');
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append('agents', file);

    try {
      const response = await uploadAgents(organizationID, formData, authToken);
      
      if (response && response.status === 200) {
        const { needsAudit, rejectedMerchants } = response.data;

        // Log to confirm data content
        console.log("needsAudit data:", needsAudit);
        console.log("rejectedMerchants data:", rejectedMerchants);

        setUploadStatus('File uploaded successfully!');
        
        setTimeout(() => {
          // Redirect to needs-audit page with needsAudit and rejectedMerchants data
          navigate('/needs-audit', {
            state: { needsAudit, rejectedMerchants },
          });
        }, 1000);
      } else {
        setUploadStatus('Failed to upload the file.');
      }
    } catch (error) {
      setUploadStatus(`Error: ${error.message}`);
      console.error('Upload error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div class="agtupload min-h-screen flex items-center justify-center">
    <div className="agent-upload-container bg-zinc-900 p-10 rounded-lg shadow-lg w-full max-w-md " >
      <h2 className='pb-6 mb-6 border-b border-yellow-400/20'>Upload Agent List</h2>

      <form onSubmit={handleUpload}>
        <div className="file-input-container ">
          <label htmlFor="fileUpload" className='block font-medium text-gray-300 mb-2'>Choose file:</label>
          <input
            type="file"
            id="fileUpload"
            accept=".csv, .xlsx"
            onChange={handleFileChange}
          />
        </div>

        {file && (
          <div className="file-info">
            <p>Selected file: {file.name}</p>
          </div>
        )}

        <button type="submit" className="upload-btn w-full bg-yellow-500 hover:bg-yellow-600 text-black py-3 rounded font-medium uppercase transition duration-200 dsabled:opacity-50">
          Upload File
        </button>
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

export default AgentUploader;

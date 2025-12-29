import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAgent, updateAgent } from '../../../api/agents.api';
import { confirmAlert } from 'react-confirm-alert';
import './agent-viewer.component.css';

const AgentViewer = ({ organizationID, authToken }) => {
  const { agentID } = useParams();
  const [agent, setAgent] = useState(null);
  const [clients, setClients] = useState([]);
  const [unsavedClients, setUnsavedClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [clientsPerPage] = useState(10); // Adjust the number of merchants per page
  const [hasBranchIDFilter, setHasBranchIDFilter] = useState(false); // State for "Has Branch ID" filter
  const [searchTerm, setSearchTerm] = useState(''); // State for merchant search

  const navigate = useNavigate();

  useEffect(() => {
    const fetchAgentDetails = async () => {
      try {
        const response = await getAgent(organizationID, agentID, authToken);
        if (response.data && response.data.success && response.data.agent) {
          setAgent(response.data.agent);
          setClients(response.data.agent.clients || []);
        } else {
          setError('Agent not found.');
        }
      } catch (err) {
        setError('Failed to fetch agent details.');
      } finally {
        setLoading(false);
      }
    };

    fetchAgentDetails();
  }, [organizationID, agentID, authToken]);

  const handleClientChange = (index, field, value) => {
    const updatedClients = [...clients];
    updatedClients[index] = { ...updatedClients[index], [field]: value };
    setClients(updatedClients);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };


  const handleDeleteClient = async (index) => {
    confirmAlert({
      title: 'Confirm to delete',
      message: 'Are you sure you want to delete this merchant?',
      buttons: [
        {
          label: 'Yes',
          onClick: async () => {
            try {
              const updatedClients = clients.filter((_, i) => i !== index);
              await updateAgent(organizationID, agentID, { ...agent, clients: updatedClients }, authToken);
              setClients(updatedClients);
            } catch (err) {
              setError('Failed to delete client');
            }
          }
        },
        {
          label: 'No'
        }
      ]
    });
  };

  const handleAddClientRow = () => {
    const newClient = { merchantName: '', merchantID: Date.now().toString(), branchID: '' }; // Ensure unique merchantID
    setUnsavedClients([...unsavedClients, newClient]);
  };

  const handleUnsavedClientChange = (index, field, value) => {
    const updatedUnsavedClients = [...unsavedClients];
    updatedUnsavedClients[index] = { ...updatedUnsavedClients[index], [field]: value };
    setUnsavedClients(updatedUnsavedClients);
  };

  const handleSaveClients = async () => {
    const updatedClients = [...clients, ...unsavedClients];
    try {
      await updateAgent(organizationID, agentID, { ...agent, clients: updatedClients }, authToken);
      setClients(updatedClients);
      setUnsavedClients([]);
      alert('Agent updated successfully!');
    } catch (err) {
      alert('Failed to update agent.');
    }
  };

  const handleNameChange = (field, value) => {
    setAgent({ ...agent, [field]: value });
  };

  const handleSplitChange = (value) => {
    setAgent({ ...agent, split: value });
  };

  const handleFilterToggle = () => {
    setHasBranchIDFilter((prevState) => !prevState);
  };

  // Filter clients based on "Has Branch ID" filter


  const filteredClients = clients
    .filter((client) => {
      const merchantName = client.merchantName || ''; // Fallback to an empty string if it's undefined or null
      const merchantID = client.merchantID ? client.merchantID.toString() : ''; // Convert merchantID to string

      return (
        merchantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        merchantID.toLowerCase().includes(searchTerm.toLowerCase())
      );
    })
    .filter((client) => (hasBranchIDFilter ? client.branchID : true));

  // Pagination logic
  const indexOfLastClient = currentPage * clientsPerPage;
  const indexOfFirstClient = indexOfLastClient - clientsPerPage;
  const currentClients = filteredClients.slice(indexOfFirstClient, indexOfLastClient); // Now using filteredClients

  const paginate = (pageNumber) => setCurrentPage(pageNumber);


  if (loading) {
    return <p>Loading agent details...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  if (!agent) {
    return <p>No agent details available.</p>;
  }

  return (
    <div className="agent-viewer">
      <h2>Agent Details</h2>

      <div className="agent-info">
        {agent.role === 'company' ? (
          <p>
            <strong>Company:</strong>
            <input
              type="text"
              value={agent.company || ''}
              onChange={(e) => handleNameChange('company', e.target.value)}
              className="name-input"
            />
          </p>
        ) : (
          <p>
            <strong>Name:</strong>
            <input
              type="text"
              value={agent.fName || ''}
              onChange={(e) => handleNameChange('fName', e.target.value)}
              className="name-input"
            />
            <input
              type="text"
              value={agent.lName || ''}
              onChange={(e) => handleNameChange('lName', e.target.value)}
              className="name-input"
            />
          </p>
        )}

        <p>
          <strong>Split:</strong>
          <input
            type="text"
            value={agent.split || ''}
            onChange={(e) => handleSplitChange(e.target.value)}
            className="split-input"
          />
        </p>


        <div className="bottom-buttons">
            <button onClick={() => navigate('/agents')} className="btn-back">
              Back to Agents List
            </button>
            {(unsavedClients.length > 0 || clients.length > 0) && (
              <div className="save">
                <button onClick={handleSaveClients} className="btn-save">
                  Save Changes
                </button>
              </div>
            )}
          </div>

        <div className="clients-section">
          <h3>Merchants</h3>
          <p>Total Merchants: {clients.length}</p> {/* Display the merchant count */}
          <div className="table-header">

            {/* Search and Branch ID Filter Section */}
            <div className="filter-section">
              <input
                type="text"
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder="Search by merchant..."
                className="search-input"
              />
              <div className="branch-toggle-container">
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={hasBranchIDFilter}
                    onChange={handleFilterToggle}
                  />
                  <span className="slider round"></span>
                </label>
                <span className="toggle-label">Has Branch ID</span>
              </div>


            </div>

            {/* Add Merchant Button */}
            <div className="add-merchant-btn" onClick={handleAddClientRow}>
              Add Merchant <i className="fa fa-plus"></i>
            </div>
          </div>


          <table>
            <thead>
              <tr>
                <th>Merchant ID</th>
                <th>Merchant Name</th>
                <th>Branch ID</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentClients.map((client, index) => (
                <tr key={index}>
                  <td>
                    <input
                      type="text"
                      value={client.merchantID}
                      onChange={(e) => handleClientChange(index, 'merchantID', e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={client.merchantName}
                      onChange={(e) => handleClientChange(index, 'merchantName', e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={client.branchID || ''}
                      onChange={(e) => handleClientChange(index, 'branchID', e.target.value)}
                    />
                  </td>
                  <td className="actions-column">
                    <button className="delete-btn" onClick={() => handleDeleteClient(index)}>
                      <i className="fa fa-trash"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination Controls */}
          <div className="pagination">
            {currentPage > 1 && (
              <button className="pagination-btn" onClick={() => paginate(currentPage - 1)}>
                &laquo; {/* Backward arrow */}
              </button>
            )}
            {currentPage > 1 && (
              <button
                className="pagination-btn"
                onClick={() => paginate(currentPage - 1)}
              >
                {currentPage - 1}
              </button>
            )}
            <button className="pagination-btn active">
              {currentPage}
            </button>
            {currentPage < Math.ceil(clients.length / clientsPerPage) && (
              <button
                className="pagination-btn"
                onClick={() => paginate(currentPage + 1)}
              >
                {currentPage + 1}
              </button>
            )}
            {currentPage < Math.ceil(clients.length / clientsPerPage) && (
              <button className="pagination-btn" onClick={() => paginate(currentPage + 1)}>
                &raquo; {/* Forward arrow */}
              </button>
            )}
          </div>


        </div>
      </div>
    </div>
  );
};

export default AgentViewer;

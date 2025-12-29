import React, { useEffect, useState } from 'react';
import { getAgents, deleteAgent } from '../../../api/agents.api';
import { Link } from 'react-router-dom';
import { FaEye, FaTrash } from 'react-icons/fa';
import { confirmAlert } from 'react-confirm-alert';
import 'react-confirm-alert/src/react-confirm-alert.css';
import './agents-list.component.css';

const AgentsList = ({ organizationID, authToken }) => {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const agentsPerPage = 10;

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const response = await getAgents(organizationID, authToken);
        if (response && response.agents && Array.isArray(response.agents)) {
          setAgents(response.agents);
        } else {
          setAgents([]);
        }
      } catch (err) {
        setError('Failed to fetch agents');
      } finally {
        setLoading(false);
      }
    };

    fetchAgents();
  }, [organizationID, authToken]);

  const handleDelete = async (agentID) => {
    confirmAlert({
      title: 'Confirm to delete',
      message: 'Are you sure you want to delete this agent? This action can\'t be undone.',
      buttons: [
        {
          label: 'Yes',
          onClick: async () => {
            try {
              await deleteAgent(organizationID, agentID, authToken);
              setAgents(agents.filter(agent => agent.agentID !== agentID));
            } catch (err) {
              setError('Failed to delete agent');
            }
          }
        },
        {
          label: 'No'
        }
      ]
    });
  };

  // Handle search
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Handle filter by role
  const handleFilterChange = (e) => {
    setFilterRole(e.target.value);
  };

  // Apply search and filters
  const filteredAgents = agents.filter(agent => {
    const fullName = `${agent.fName} ${agent.lName}`.toLowerCase();
    const companyName = agent.company?.toLowerCase() || '';

    const matchesSearch = fullName.includes(searchTerm.toLowerCase()) || companyName.includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || agent.role === filterRole;

    return matchesSearch && matchesRole;
  });

  // Pagination logic
  const indexOfLastAgent = currentPage * agentsPerPage;
  const indexOfFirstAgent = indexOfLastAgent - agentsPerPage;
  const currentAgents = filteredAgents.slice(indexOfFirstAgent, indexOfLastAgent);

  const totalPages = Math.ceil(filteredAgents.length / agentsPerPage);

  const handleNextPage = () => {
    setCurrentPage((prevPage) => Math.min(prevPage + 1, totalPages));
  };

  const handlePreviousPage = () => {
    setCurrentPage((prevPage) => Math.max(prevPage - 1, 1));
  };

  if (loading) {
    return <p>Loading agents...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  return (
    <div className="agents-list reports max-w-7xl mx-auto bg-zinc-900 rounded-lg shadow-sm p-6 mb-8">
      <div className="header p-0">
        <h2 className='text-lg font-semibold text-white mb-4'>Agents List</h2>
      </div>

      {/* Filters Section */}
      <div className="filters">
        <input
          type="text"
          value={searchTerm}
          onChange={handleSearchChange}
          placeholder="Search by name or company..."
          className="search-input block w-full pr-10 truncate bg-zinc-800 border-zinc-700 text-white rounded-md focus:ring-yellow-400 focus:border-yellow-400"
        />

        <select value={filterRole} onChange={handleFilterChange} className="al-select filter-select bg-zinc-800 border-zinc-700 text-white rounded-md focus:ring-yellow-400 focus:border-yellow-400">
          <option value="all">All Roles</option>
          <option value="company">Company</option>
          <option value="individual">Individual</option>
        </select>
        <div className="actions-container">
          <Link to="/agents/add-agent" className="add-agent-link">
            <button className="add-agent-button text-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-black bg-yellow-400 hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-400">Add New Agent</button>
          </Link>
          <Link to="/agents/upload" className="upload-agent-link">
            <button className="upload-agent-button text-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-black bg-yellow-400 hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-400">Upload Agents</button>
          </Link>
        </div>

        
      </div>

      {filteredAgents.length === 0 ? (
        <p>No agents found.</p>
      ) : (
        <>
          <table className="agents-table">
            <thead>
              <tr>
                <th className='border-l-0 border-b px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider'>First Name / Company Name</th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider'>Last Name</th>
                <th className="actions-column px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider ">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentAgents.map((agent, index) => (
                <tr key={index}>
                  <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-300'>{agent.role === 'company' ? agent.company : agent.fName}</td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-300'>{agent.role === 'company' ? '' : agent.lName}</td>
                  <td className="actions-column px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    <Link to={`/agents/${agent.agentID}`}>
                      <button className="btn-view text-yellow-400 hover:text-yellow-500">
                        <FaEye />
                      </button>
                    </Link>
                    <button 
                      className="btn-delete text-yellow-400 hover:text-yellow-500" 
                      onClick={() => handleDelete(agent.agentID)}
                    >
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination Controls */}
          <div className="pagination-controls">
            <button 
              className="pagination-btn" 
              onClick={handlePreviousPage} 
              disabled={currentPage === 1}
            >
              Previous
            </button>
            <span>Page {currentPage} of {totalPages}</span>
            <button 
              className="pagination-btn" 
              onClick={handleNextPage} 
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default AgentsList;

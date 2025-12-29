import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './add-agent.component.css';
import { createAgent } from '../../../api/agents.api'; // Ensure this is correct

const AddAgent = ({organizationID, authToken}) => {
  const navigate = useNavigate();
  const [agent, setAgent] = useState({
    fName: '',
    lName: '',
    merchants: [] // Empty merchants array for now
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setAgent({
      ...agent,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      console.log('Submitting Agent:', agent);
      const response = await createAgent(organizationID, agent, authToken);

      navigate(`/agents/${response.data.agentID}`);
    } catch (error) {
      alert('Error creating agent');
    }
  };

  return (
    <div className="add-agent-container bg-zinc-900 p-10 rounded-lg shadow-lg w-full max-w-md w-full">
      <h2 className='pb-6 mb-6 border-b border-yellow-400/20 text-lg font-semibold text-white mb-4'>Add Agent</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className='block font-medium text-gray-300 mb-2'>First Name</label>
          <input
            type="text"
            name="fName"
            className='w-full px-4 py-2 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500'
            value={agent.fName}
            onChange={handleInputChange}
            placeholder="First Name"
            required
          />
        </div>
        <div className="form-group">
          <label className='block font-medium text-gray-300 mb-2'>Last Name</label>
          <input
            type="text"
            name="lName"
            className='w-full px-4 py-2 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500'
            value={agent.lName}
            onChange={handleInputChange}
            placeholder="Last Name"
            required
          />
        </div>

        <button type="submit" className="submit-button w-full bg-yellow-500 hover:bg-yellow-600 text-black py-3 rounded font-medium uppercase transition duration-200 dsabled:opacity-50">
          Add Agent
        </button>
      </form>
    </div>
  );
};

export default AddAgent;

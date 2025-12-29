import axios from 'axios';

const BASE_URL = process.env.NODE_ENV === 'production' ? process.env.REACT_APP_PROD_URL : process.env.REACT_APP_DEV_URL;
const ROUTE_BASE_URL = `${BASE_URL}/api/v2/agents`; // Ensure this is set in your .env file

console.log(ROUTE_BASE_URL,'ROUTE_BASE_URL');
console.log('ROUTE_BASE_URL');

// Fetch all agents
export const getAgents = async (organizationID, authToken) => {
  try {
    const headers = {
      Authorization: `Bearer ${authToken}`,
    };
    const response = await axios.get(`${ROUTE_BASE_URL}/organizations/${organizationID}`, { headers });
    console.log("Agents:", response.data);
    console.log(ROUTE_BASE_URL,'ROUTE_BASE_URL');
    return response.data;
  } catch (error) {
    console.error("Error fetching agents:", error);
    throw error.response?.data || error.message;
  }
};

// Fetch a single agent by ID
export const getAgent = async (organizationID, agentID, authToken) => {
  try {
    const headers = {
      Authorization: `Bearer ${authToken}`,
    };
    const response = await axios.get(`${ROUTE_BASE_URL}/organizations/${organizationID}/${agentID}`, { headers });
    console.log("Agent Details:", response.data);
    return response;
  } catch (error) {
    console.error("Error fetching agent details:", error);
    throw error.response?.data || error.message;
  }
};

// Create a new agent
export const createAgent = async (organizationID, agentData, authToken) => {
  try {
    const headers = {
      Authorization: `Bearer ${authToken}`,
    };
    const response = await axios.post(`${ROUTE_BASE_URL}/organizations/${organizationID}`, agentData, { headers });
    console.log("Agent Created:", response.data);
    return response;
  } catch (error) {
    console.error("Error creating agent:", error);
    throw error.response?.data || error.message;
  }
};

// Re-audit agents
export const reauditAgents = async (organizationID, agentsData, authToken) => {
  try {
    console.log("Starting re-audit for organization:", organizationID);

    const headers = {
      Authorization: `Bearer ${authToken}`,
    };

    // Log request details for tracing
    console.log("Request URL:", `${ROUTE_BASE_URL}/organizations/${organizationID}/reaudit`);
    console.log("Request Headers:", headers);
    console.log("Request Data:", agentsData);

    // Perform the re-audit request
    const response = await axios.post(`${ROUTE_BASE_URL}/organizations/${organizationID}/reaudit`, agentsData, { headers });

    // Log response for debugging
    console.log("Re-audit response:", response);

    return response; // Return data for handling on the front end
  } catch (error) {
    console.error("Error during re-audit:", error);

    // Log full error response if available
    if (error.response) {
      console.error("Error Response:", error.response);
      console.error("Error Data:", error.response.data);
    } else {
      console.error("Error Message:", error.message);
    }

    throw error.response?.data || error.message; // Rethrow for further handling
  }
};


export const uploadAgents = async (organizationID, agentsData, authToken) => {
  try {
    console.log("Starting upload for organization:", organizationID);

    const headers = {
      Authorization: `Bearer ${authToken}`,
    };

    // Log the request details for better tracing
    console.log("Request URL:", `${ROUTE_BASE_URL}/organizations/${organizationID}/batch`);
    console.log("Request Headers:", headers);
    console.log("Request Data:", agentsData);

    // Perform the upload request
    const response = await axios.post(`${ROUTE_BASE_URL}/organizations/${organizationID}/batch`, agentsData, { headers });

    // Log the full response for debugging
    console.log("Upload response:", response);

    return response; // Access data directly for easier handling on the front end
  } catch (error) {
    console.error("Error uploading agents:", error);

    // Log the full error response if available
    if (error.response) {
      console.error("Error Response:", error.response);
      console.error("Error Data:", error.response.data);
    } else {
      console.error("Error Message:", error.message);
    }

    throw error.response?.data || error.message; // Rethrow for further handling
  }
};

// Update an existing agent by agentID
export const updateAgent = async (organizationID, agentID, agentData, authToken) => {
  try {
    const headers = {
      Authorization: `Bearer ${authToken}`,
    };
    const response = await axios.patch(`${ROUTE_BASE_URL}/organizations/${organizationID}/${agentID}`, agentData, { headers });
    console.log("Agent Updated:", response.data);
    return response;
  } catch (error) {
    console.error("Error updating agent:", error);
    throw error.response?.data || error.message;
  }
};

// Delete an agent by ID
export const deleteAgent = async (organizationID, agentID, authToken) => {
  try {
    console.log("Deleting agent with ID:", organizationID, agentID, authToken);
    const headers = {
      Authorization: `Bearer ${authToken}`,
    };
    const response = await axios.delete(`${ROUTE_BASE_URL}/organizations/${organizationID}/${agentID}`, { headers });
    console.log("Agent Deleted:", response.data);
    return response;
  } catch (error) {
    console.error("Error deleting agent:", error);
    throw error.response?.data || error.message;
  }
};

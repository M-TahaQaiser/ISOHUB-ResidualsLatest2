import axios from 'axios';

const BASE_URL = process.env.NODE_ENV === 'production' ? process.env.REACT_APP_PROD_URL : process.env.REACT_APP_DEV_URL;
const ROUTE_BASE_URL = `${BASE_URL}/api/v2/reports`; // Ensure this is set in your .env file

// General report API functions
export const addReport = async (organizationID, reportData, authToken) => {
  try {
    const headers = {
      Authorization: `Bearer ${authToken}`,
    };
    const response = await axios.post(`${ROUTE_BASE_URL}/organizations/${organizationID}`, reportData, { headers });
    return response;
  } catch (error) {
    console.error("Error adding report:", error);
    throw error.response?.data || error.message;
  }
};

export const getReports = async (organizationID, type, authToken) => {
  try {
    const headers = {
      Authorization: `Bearer ${authToken}`,
    };
    if (type === 'all') {
      const response = await axios.get(`${ROUTE_BASE_URL}/organizations/${organizationID}`, { headers });
      return response.data;
    }
    const response = await axios.get(`${ROUTE_BASE_URL}/organizations/${organizationID}/${type}`, { headers });
    return response.data;
  } catch (error) {
    console.error("Error fetching reports:", error);
    throw error.response?.data || error.message;
  }
};

export const getAllReports = async (organizationID, authToken) => {
  try {
    const headers = {
      Authorization: `Bearer ${authToken}`,
    };
    const response = await axios.get(`${ROUTE_BASE_URL}/organizations/${organizationID}`, { headers });
    return response.data;
  } catch (error) {
    console.error("Error fetching reports:", error);
    throw error.response?.data || error.message;    
  }
};

export const getReportById = async (reportID, authToken) => {
  try {
    const headers = {
      Authorization: `Bearer ${authToken}`,
    };
    const response = await axios.get(`${ROUTE_BASE_URL}/${reportID}`, { headers });
    return response.data;
  } catch (error) {
    console.error("Error fetching report:", error);
    throw error.response?.data || error.message;
  }
};

export const deleteReport = async (reportID, authToken) => {
  try {
    const headers = {
      Authorization: `Bearer ${authToken}`,
    };
    const response = await axios.delete(`${ROUTE_BASE_URL}/${reportID}`, { headers });
    return response.data;
  } catch (error) {
    console.error("Error deleting report:", error);
    throw error.response?.data || error.message;
  }
};

export const updateReport = async (reportID, reportData, authToken) => {
  try {
    console.log('updateReport', reportID, reportData);
    const headers = {
      Authorization: `Bearer ${authToken}`,
    };
    const response = await axios.put(`${ROUTE_BASE_URL}/${reportID}`, reportData, { headers });
    return response.data;
  } catch (error) {
    console.error("Error updating report:", error);
    throw error.response?.data || error.message;
  }
};

// Agent report API functions
export const createAgentReport = async (organizationID, agentID, monthYear, reportData, authToken) => {
  try {
    console.log('createAgentReport:', organizationID, agentID, monthYear, reportData);
    const headers = {
      Authorization: `Bearer ${authToken}`,
    };
    const url = `${ROUTE_BASE_URL}/organizations/${organizationID}/${agentID}/agent-report`;
    const response = await axios.post(url, { monthYear, reportData }, { headers });

    return response.data; // Return the created agent report
  } catch (error) {
    console.error("Error creating agent report:", error);
    throw error.response?.data || error.message;
  }
};

export const generateAgentReport = async (organizationID, agentID, monthYear, authToken) => {
  try {
    const headers = {
      Authorization: `Bearer ${authToken}`,
    };
    const url = `${ROUTE_BASE_URL}/organizations/${organizationID}/${agentID}`;
    const response = await axios.post(
      `${url}`,
      { monthYear }, // Send the monthYear in the body
      { headers } // Send headers including Authorization token
    );
    return response; // Returns the generated agent report data
  } catch (error) {
    console.error('Error generating agent report:', error);
    throw error;
  }
};

export const getAgentReportByMonth = async (organizationID, agentID, monthYear, authToken) => {
  try {
    const monthYearSplit = monthYear.split(' ');
    const headers = {
      Authorization: `Bearer ${authToken}`,
    };
    const response = await axios.get(`${ROUTE_BASE_URL}/organizations/${organizationID}/${agentID}/${monthYearSplit[0]}/${monthYearSplit[1]}`, { headers });
    return response;
  } catch (error) {
    console.error("Error fetching agent report:", error);
    throw error.response?.data || error.message;
  }
};

// Bank summary report API functions
export const generateBankSummaryReport = async (organizationID, monthYear, authToken) => {
  try {
    const headers = {
      Authorization: `Bearer ${authToken}`,
    };
    const response = await axios.post(`${ROUTE_BASE_URL}/organizations/${organizationID}/bank-summary`, { monthYear }, { headers });
    return response;
  } catch (error) {
    console.error("Error generating bank summary report:", error);
    throw error.response?.data || error.message;
  };
};

export const getBankSummaryReport = async (organizationID, monthYear, authToken) => {
  try {
    const monthYearSplit = monthYear.split(' ');
    const headers = {
      Authorization: `Bearer ${authToken}`,
    };
    console.log('getBankSummaryReport', organizationID, monthYearSplit[0], monthYearSplit[1]);
    const response = await axios.get(`${ROUTE_BASE_URL}/organizations/${organizationID}/bank-summary/${monthYearSplit[0]}/${monthYearSplit[1]}`, { headers });
    return response;
  } catch (error) {
    console.error("Error fetching bank summary report:", error);
    throw error.response?.data || error.message;
  }
};

export const createBankSummaryReport = async (organizationID, monthYear, reportData, authToken) => {
  try {
    const headers = {
      Authorization: `Bearer ${authToken}`,
    };
    const response = await axios.post(`${ROUTE_BASE_URL}/organizations/${organizationID}/bank-summary/approve`, {monthYear, reportData}, { headers });
    return response.data;
  } catch (error) {
    console.error("Error creating bank summary report:", error);
    throw error.response?.data || error.message;
  }
};

export const updateBankSummaryReport = async (reportID, reportData, authToken) => {
  try {
    const headers = {
      Authorization: `Bearer ${authToken}`,
    };
    const response = await axios.put(`${ROUTE_BASE_URL}/bank-summary/${reportID}`, reportData, { headers });
    return response.data;
  } catch (error) {
    console.error("Error updating bank summary report:", error);
    throw error.response?.data || error.message;
  }
};
// Processor summary report API functions
export const generateProcessorSummaryReport = async (organizationID, monthYear, authToken) => {
  try {
    const headers = {
      Authorization: `Bearer ${authToken}`,
    };
    const response = await axios.post(`${ROUTE_BASE_URL}/organizations/${organizationID}/processor-summary`, { monthYear }, { headers });
    return response;
  } catch (error) {
    console.error("Error generating processor summary report:", error);
    throw error.response?.data || error.message;
  };
};

export const getProcessorSummaryReport = async (organizationID, monthYear, authToken) => {
  try {
    const monthYearSplit = monthYear.split(' ');
    const headers = {
      Authorization: `Bearer ${authToken}`,
    };
    console.log('getProcessorSummaryReport', organizationID, monthYearSplit[0], monthYearSplit[1]);
    const response = await axios.get(`${ROUTE_BASE_URL}/organizations/${organizationID}/processor-summary/${monthYearSplit[0]}/${monthYearSplit[1]}`, { headers });
    return response;
  } catch (error) {
    console.error("Error fetching processor summary report:", error);
    throw error.response?.data || error.message;
  }
};

export const createProcessorSummaryReport = async (organizationID, reportData, authToken) => {
  try {
    const headers = {
      Authorization: `Bearer ${authToken}`,
    };
    const response = await axios.post(`${ROUTE_BASE_URL}/organizations/${organizationID}/processor-summary/approve`, reportData, { headers });
    return response.data;
  } catch (error) {
    console.error("Error creating processor summary report:", error);
    throw error.response?.data || error.message;
  }
};

export const updateProcessorSummaryReport = async (reportID, reportData, authToken) => {
  try {
    const headers = {
      Authorization: `Bearer ${authToken}`,
    };
    const response = await axios.put(`${ROUTE_BASE_URL}/processor-summary/${reportID}`, reportData, { headers });
    return response.data;
  } catch (error) {
    console.error("Error updating processor summary report:", error);
    throw error.response?.data || error.message;
  }
};

// Agent summary report API functions
export const generateAgentSummaryReport = async (organizationID, monthYear, authToken) => {
  try {
    console.log('generateAgentSummaryReport', organizationID, monthYear);
    const headers = {
      Authorization: `Bearer ${authToken}`,
    };
    const response = await axios.post(`${ROUTE_BASE_URL}/organizations/${organizationID}/agent-summary`, { monthYear }, { headers });
    return response;
  } catch (error) {
    console.error("Error generating agent summary report:", error);
    throw error.response?.data || error.message;
  }
};

export const getAgentSummaryReport = async (organizationID, monthYear, authToken) => {
  try {
    const monthYearSplit = monthYear.split(' ');
    const headers = {
      Authorization: `Bearer ${authToken}`,
    };
    const response = await axios.get(`${ROUTE_BASE_URL}/organizations/${organizationID}/agent-summary/${monthYearSplit[0]}/${monthYearSplit[1]}`, { headers });
    return response;
  } catch (error) {
    console.error("Error fetching agent summary report:", error);
    throw error.response?.data || error.message;
  };
};

export const createAgentSummaryReport = async (organizationID, reportData, authToken) => {
  try {
    const headers = {
      Authorization: `Bearer ${authToken}`,
    };
    const response = await axios.post(`${ROUTE_BASE_URL}/organizations/${organizationID}/agent-summary/approve`, reportData, { headers });
    return response.data;
  } catch (error) {
    console.error("Error creating agent summary report:", error);
    throw error.response?.data || error.message;
  }
};

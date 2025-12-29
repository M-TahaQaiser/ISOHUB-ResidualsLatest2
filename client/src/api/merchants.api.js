import axios from 'axios';

const ROUTE_BASE_URL = `https://cocard.iriscrm.com/api/v1/merchants/api/v2/agents`; // Ensure this is set in your .env file

// Fetch all agents
export const getMerchants = async () => {
  try {
    const headers = {
      'X-API-KEY': process.env.REACT_APP_IRIS_API_KEY,
    };
    const response = await axios.get(`${ROUTE_BASE_URL}/merchants`, { headers });
    console.log("Merchants:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error fetching agents:", error);
    throw error.response?.data || error.message;
  }
};

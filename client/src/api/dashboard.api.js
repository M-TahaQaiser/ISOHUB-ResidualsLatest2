import axios from 'axios';

const BASE_URL = process.env.NODE_ENV === 'production' 
  ? process.env.REACT_APP_PROD_URL 
  : process.env.REACT_APP_DEV_URL;
const ROUTE_BASE_URL = `${BASE_URL}/api/v2/dashboard`; // Ensure this is set in your .env file

// Fetch dashboard "needs approval" data
export const getNeedsApproval = async (organizationID, authToken) => {
  try {
    const headers = {
      Authorization: `Bearer ${authToken}`,
    };
    // Note: This URL matches the route defined on the server:
    // GET /organizations/:organizationID/dashboard/needs-approval
    const response = await axios.get(
      `${ROUTE_BASE_URL}/organizations/${organizationID}/needs-approval`, 
      { headers }
    );
    console.log("Dashboard - Needs Approval Reports:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error fetching needs approval data:", error);
    throw error.response?.data || error.message;
  }
};

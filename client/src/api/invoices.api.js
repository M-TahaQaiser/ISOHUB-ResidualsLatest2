import axios from 'axios';

const BASE_URL = process.env.NODE_ENV === 'production' ? process.env.REACT_APP_PROD_URL : process.env.REACT_APP_DEV_URL;
const ROUTE_BASE_URL = `${BASE_URL}/api/v2/invoices`; // Ensure this is set in your .env file

export const getInvoiceNum = async (organizationID, authToken) => {
    try {
      const headers = {
        Authorization: `Bearer ${authToken}`,
      };
      console.log(`the route is '${ROUTE_BASE_URL}/organizations/${organizationID}'`);
      const response = await axios.get(`${ROUTE_BASE_URL}/organizations/${organizationID}`, { headers });
      console.log("User invoice number:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error fetching user details:", error);
      throw error.response?.data || error.message;
    }
  };

  
  // Update an existing user by organizationID and username
  export const updateInvoiceNum = async (organizationID, invoiceNum, authToken) => {
    try {
      const headers = {
        Authorization: `Bearer ${authToken}`,
      };
      console.log('invoiceNum:', invoiceNum); 
      const response = await axios.put(`${ROUTE_BASE_URL}/organizations/${organizationID}`, {invoiceNum}, { headers });
      console.log("invoice number Updated:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error updating user:", error);
      throw error.response?.data || error.message;
    }
  };

import axios from 'axios';

const BASE_URL = process.env.NODE_ENV === 'production' ? process.env.REACT_APP_PROD_URL : process.env.REACT_APP_DEV_URL;
const ROUTE_BASE_URL = `${BASE_URL}/api/v2/reports`; // Ensure this is set in your .env file

// Fetch user details by organizationID and username
export const getUsers = async (organizationID, authToken) => {
    try {
        const headers = {
            Authorization: `Bearer ${authToken}`,
        };
        const response = await axios.get(`${ROUTE_BASE_URL}/organizations/${organizationID}`, { headers });
        console.log('Users:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error fetching users:', error);
        throw error.response?.data || error.message;
    };
}

export const getUser = async (organizationID, username, authToken) => {
  try {
    const headers = {
      Authorization: `Bearer ${authToken}`,
    };
    const response = await axios.get(`${ROUTE_BASE_URL}/organizations/${organizationID}/${username}`, { headers });
    console.log("User Details:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error fetching user details:", error);
    throw error.response?.data || error.message;
  }
};

// Create a new user
export const createUser = async (organizationID, userData, authToken) => {
  try {
    const headers = {
      Authorization: `Bearer ${authToken}`,
    };
    const response = await axios.post(`${ROUTE_BASE_URL}/organizations/${organizationID}`, userData, { headers });
    console.log("User Created:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error creating user:", error);
    throw error.response?.data || error.message;
  }
};

// Update an existing user by organizationID and username
export const updateUser = async (organizationID, username, userData, authToken) => {
  try {
    const headers = {
      Authorization: `Bearer ${authToken}`,
    };
    const response = await axios.put(`${ROUTE_BASE_URL}/organizations/${organizationID}/${username}`, userData, { headers });
    console.log("User Updated:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error updating user:", error);
    throw error.response?.data || error.message;
  }
};

// Delete a user by organizationID and username
export const deleteUser = async (organizationID, username, authToken) => {
  try {
    const headers = {
      Authorization: `Bearer ${authToken}`,
    };
    const response = await axios.delete(`${ROUTE_BASE_URL}/organizations/${organizationID}/${username}`, { headers });
    console.log("User Deleted:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error deleting user:", error);
    throw error.response?.data || error.message;
  }
};

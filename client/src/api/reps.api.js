import axios from 'axios';

const BASE_URL = process.env.NODE_ENV === 'production' ? process.env.REACT_APP_PROD_URL : process.env.REACT_APP_DEV_URL;
const ROUTE_BASE_URL = `${BASE_URL}/api/v2/reps`; // Ensure this is set in your .env file

console.log(ROUTE_BASE_URL,'ROUTE_BASE_URL');
console.log('ROUTE_BASE_URL');

// Fetch all reps
export const getReps = async (organizationID, authToken) => {
  try {
    const headers = {
      Authorization: `Bearer ${authToken}`,
    };
    const response = await axios.get(`${ROUTE_BASE_URL}/organizations/${organizationID}`, { headers });
    console.log("Reps:", response.data);
    console.log(ROUTE_BASE_URL,'ROUTE_BASE_URL');
    return response.data;
  } catch (error) {
    console.error("Error fetching reps:", error);
    throw error.response?.data || error.message;
  }
};

// Fetch a single rep by ID
export const getRep = async (organizationID, repID, authToken) => {
  try {
    const headers = {
      Authorization: `Bearer ${authToken}`,
    };
    const response = await axios.get(`${ROUTE_BASE_URL}/organizations/${organizationID}/${repID}`, { headers });
    console.log("Rep Details:", response.data);
    return response;
  } catch (error) {
    console.error("Error fetching rep details:", error);
    throw error.response?.data || error.message;
  }
};

// Create a new rep
export const createRep = async (organizationID, repData, authToken) => {
  try {
    const headers = {
      Authorization: `Bearer ${authToken}`,
    };
    const response = await axios.post(`${ROUTE_BASE_URL}/organizations/${organizationID}`, repData, { headers });
    console.log("Rep Created:", response.data);
    return response;
  } catch (error) {
    console.error("Error creating rep:", error);
    throw error.response?.data || error.message;
  }
};

// Re-audit reps
export const reauditReps = async (organizationID, repsData, authToken) => {
  try {
    console.log("Starting re-audit for organization:", organizationID);

    const headers = {
      Authorization: `Bearer ${authToken}`,
    };

    // Log request details for tracing
    console.log("Request URL:", `${ROUTE_BASE_URL}/organizations/${organizationID}/reaudit`);
    console.log("Request Headers:", headers);
    console.log("Request Data:", repsData);

    // Perform the re-audit request
    const response = await axios.post(`${ROUTE_BASE_URL}/organizations/${organizationID}/reaudit`, repsData, { headers });

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


export const uploadReps = async (organizationID, repsData, authToken) => {
  try {
    console.log("Starting upload for organization:", organizationID);

    const headers = {
      Authorization: `Bearer ${authToken}`,
    };

    // Log the request details for better tracing
    console.log("Request URL:", `${ROUTE_BASE_URL}/organizations/${organizationID}/batch`);
    console.log("Request Headers:", headers);
    console.log("Request Data:", repsData);

    // Perform the upload request
    const response = await axios.post(`${ROUTE_BASE_URL}/organizations/${organizationID}/batch`, repsData, { headers });

    // Log the full response for debugging
    console.log("Upload response:", response);

    return response; // Access data directly for easier handling on the front end
  } catch (error) {
    console.error("Error uploading reps:", error);

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

// Update an existing rep by repID
export const updateRep = async (organizationID, repID, repData, authToken) => {
  try {
    const headers = {
      Authorization: `Bearer ${authToken}`,
    };
    const response = await axios.patch(`${ROUTE_BASE_URL}/organizations/${organizationID}/${repID}`, repData, { headers });
    console.log("Rep Updated:", response.data);
    return response;
  } catch (error) {
    console.error("Error updating rep:", error);
    throw error.response?.data || error.message;
  }
};

// Delete a rep by ID
export const deleteRep = async (organizationID, repID, authToken) => {
  try {
    console.log("Deleting rep with ID:", organizationID, repID, authToken);
    const headers = {
      Authorization: `Bearer ${authToken}`,
    };
    const response = await axios.delete(`${ROUTE_BASE_URL}/organizations/${organizationID}/${repID}`, { headers });
    console.log("Rep Deleted:", response.data);
    return response;
  } catch (error) {
    console.error("Error deleting rep:", error);
    throw error.response?.data || error.message;
  }
};
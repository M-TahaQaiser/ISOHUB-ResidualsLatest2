import axios from 'axios';

const BASE_URL = process.env.NODE_ENV === 'production' ? process.env.REACT_APP_PROD_URL : process.env.REACT_APP_DEV_URL;
const ROUTE_BASE_URL = `${BASE_URL}/api/v2/auth`; // Ensure this is set in your .env file

export const signup = async (user) => {
  try {
    console.log(`Calling sign up route ${ROUTE_BASE_URL}/signup`);
    const response = await axios.post(`${ROUTE_BASE_URL}/signup`, user);
    console.log('response', response);
    return response.data;
  } catch (error) {
    throw error.response.data; // Throw the error message from the response
  }
}

export const login = async (username, password) => {
  try {
    console.log(`Calling login route ${ROUTE_BASE_URL}/login`);
    const response = await axios.post(`${ROUTE_BASE_URL}/login`, { username, password });
    console.log('response', response);
    // Axios automatically returns the data in the response
    return { token: response.data.token };
  } catch (error) {
    // Throw the error from the response
    throw error.response.data;
  }
};

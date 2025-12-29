import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../../../api/authApi.js';
import {jwtDecode} from 'jwt-decode'; // Correct import for jwt-decode

const Login = ({ setUsername, setAuthToken, setOrganization }) => { // Added setOrganization prop
  const [localUsername, setLocalUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      console.log('starting login');
      
      const { token } = await login(localUsername, password);
  
      // Decode the token to get the organizationID
      const decodedToken = jwtDecode(token);
      const organizationID = decodedToken.organization;
  
      // Store token and organizationID in localStorage
      localStorage.setItem('authToken', token);
      localStorage.setItem('username', localUsername);
      localStorage.setItem('organizationID', organizationID);
  
      // Update state
      setAuthToken(token);
      setUsername(localUsername);
      setOrganization(organizationID);  // Set organizationID in state
  
      // Redirect to dashboard
      navigate('/dashboard');
    } catch (error) {
      console.error('Login failed:', error);
      setError(`Login failed: ${error.message}`);
    }
  };
  
  return (
    <div className="auth-page">
      <div className="auth-container bg-zinc-900 p-10 rounded-lg shadow-lg w-full max-w-md">
        <div className='pb-6 mb-6 border-b border-yellow-400/20'>
           <h2>Login</h2>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className='block font-medium text-gray-300 mb-2'>Username:</label>
            <input
              type="text"
              className='w-full px-4 py-2 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500'
              value={localUsername}
              onChange={(e) => setLocalUsername(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className='block font-medium text-gray-300 mb-2'>Password:</label>
            <input
              type="password"
              className='w-full px-4 py-2 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && <p className="error-message">{error}</p>}
          <button type="submit" className='w-full bg-yellow-500 hover:bg-yellow-600 text-white py-3 rounded font-medium uppercase transition duration-200 dsabled:opacity-50'>Login</button>
        </form>
        <p className='mt-1 text-center text-xs text-yellow-400/60 btn-new'>
          Don't have an account? <Link to="/signup">Sign up here</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // Import Link
import { login } from '../../api/authApi.js';

const Login = ({ setUsername, setAuthToken }) => {
  const [localUsername, setLocalUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    console.log('starting login');
    const { token } = await login(localUsername, password);
    localStorage.setItem('authToken', token);
    localStorage.setItem('username', localUsername);

    // Update state for authToken and username
    setAuthToken(token);
    setUsername(localUsername);
    navigate('/dashboard'); // Redirect to the dashboard after login
  } catch (error) {
    console.error('Login failed:', error); // Add this line
    setError(`Login failed: ${error.message}`); // Update error message
  }
};


  return (
    
    <div className="auth-page">
      <div className="auth-container bg-zinc-900 p-10 rounded-lg shadow-lg w-full max-w-md ">
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Username:</label>
          <input
            type="text"
            value={localUsername}
            onChange={(e) => setLocalUsername(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label>Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error && <p className="error-message">{error}</p>}
        <button type="submit">Login</button>
      </form>
      <p>
        Don't have an account? <Link to="/signup">Sign up here</Link>
      </p>
    </div>
    </div>
  );
};

export default Login;

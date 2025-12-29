import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signup } from '../../../api/authApi.js';

function Signup() {
  const [fName, setFName] = useState('');
  const [lName, setLName] = useState('');
  const [email, setEmail] = useState('');  // Add email state
  const [organization, setOrganization] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const navigate = useNavigate();

  const validatePassword = (pw) => {
    if (pw.length < 8) {
      return { isValid: false, error: 'Password must be at least 8 characters long' };
    }
    if (!/[A-Z]/.test(pw)) {
      return { isValid: false, error: 'Password must contain at least one uppercase letter' };
    }
    if (!/[a-z]/.test(pw)) {
      return { isValid: false, error: 'Password must contain at least one lowercase letter' };
    }
    if (!/[0-9]/.test(pw)) {
      return { isValid: false, error: 'Password must contain at least one number' };
    }
    if (!/[^A-Za-z0-9]/.test(pw)) {
      return { isValid: false, error: 'Password must contain at least one special character' };
    }
    return { isValid: true };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    const { isValid, error: passwordError } = validatePassword(password);
    if (!isValid) {
      setError(passwordError);
      return;
    }

    try {
      const user = {
        fName,
        lName,
        email,  // Send email to the backend
        organization,
        username,
        password,
      };
      console.log('user', user);
      console.log('calling signup');
      const response = await signup(user);
      if (response.isDupe) {
        setError('Sorry, that Username already exists');
      } else if (response.userID) {
        setSuccess(`Signup successful! You can now log in.  ${response.username}.`);
        setError('');
        navigate('/login');
      }
    } catch (error) {
      setError('Signup failed. Please try again.');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container bg-zinc-900 p-10 rounded-lg shadow-lg w-full max-w-md">
        <h2 className='pb-6 mb-6 border-b border-yellow-400/20'>Signup</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className='block font-medium text-gray-300 mb-2'>First Name:</label>
            <input
              type="text"
              className='w-full px-4 py-2 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500'
              value={fName}
              onChange={(e) => setFName(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className='block font-medium text-gray-300 mb-2'>Last Name:</label>
            <input
              type="text"
              className='w-full px-4 py-2 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500'
              value={lName}
              onChange={(e) => setLName(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className='block font-medium text-gray-300 mb-2'>Organization:</label>
            <input
              type="text"
              className='w-full px-4 py-2 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500'
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className='block font-medium text-gray-300 mb-2'>Username:</label>
            <input
              type="text"
              className='w-full px-4 py-2 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500'
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className='block font-medium text-gray-300 mb-2'>Email:</label> {/* Add email field */}
            <input
              type="email"
              className='w-full px-4 py-2 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className='block font-medium text-gray-300 mb-2'>Password:</label>
            <input
              type="password"
              className='w-full px-4 py-2 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className='block font-medium text-gray-300 mb-2'>Confirm Password:</label>
            <input
              type="password"
              className='w-full px-4 py-2 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500'
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="error-message">{error}</p>}
          {success && <p className="success-message">{success}</p>}
          <button type="submit" className='w-full bg-yellow-500 hover:bg-yellow-600 text-white py-3 rounded font-medium uppercase transition duration-200 dsabled:opacity-50'>Signup</button>
        </form>
        <p className='mt-1 text-center text-xs text-yellow-400/60 btn-new'>
          Already have an account? <Link to="/login">Login here</Link>
        </p>
      </div>
    </div>
  );
}

export default Signup;

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signup } from '../../api/authApi.js';

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
    if (pw.length < 12) {
      return { isValid: false, error: 'Password must be at least 12 characters long' };
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
        setSuccess(`Signup successful! You can now log in. Welcome ${response.username}.`);
        setError('');
        navigate('/login');
      }
    } catch (error) {
      setError('Signup failed. Please try again.');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <h2>Signup</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>First Name:</label>
            <input
              type="text"
              value={fName}
              onChange={(e) => setFName(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Last Name:</label>
            <input
              type="text"
              value={lName}
              onChange={(e) => setLName(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Organization:</label>
            <input
              type="text"
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Username:</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Email:</label> {/* Add email field */}
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Password:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Confirm Password:</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="error-message">{error}</p>}
          {success && <p className="success-message">{success}</p>}
          <button type="submit">Signup</button>
        </form>
        <p>
          Already have an account? <Link to="/login">Login here</Link>
        </p>
      </div>
    </div>
  );
}

export default Signup;

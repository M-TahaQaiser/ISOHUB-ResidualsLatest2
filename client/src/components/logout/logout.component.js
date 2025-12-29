import React from 'react';

function Logout() {
  const handleLogout = async () => {
    const token = localStorage.getItem('authToken');
    if (!token) return;

    try {
      localStorage.removeItem('authToken'); // Remove the token from localStorage
      // Optionally redirect the user after logout
      console.log('Logout successful!');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return <button onClick={handleLogout}>Logout</button>;
}

export default Logout;

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { updateUser, getUser } from '../../api/users.api';
import './user-settings.component.css';

const UserSettings = ({ authToken, organizationID, username, setUsername, isAdmin }) => {
  const [newUsername, setNewUsername] = useState(username);
  const [newEmail, setNewEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangePasswordVisible, setIsChangePasswordVisible] = useState(false);
  const [showManageTeam, setShowManageTeam] = useState(isAdmin); // Initialize with isAdmin

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const user = await getUser(organizationID, username, authToken);
        setNewEmail(user.email);
        setNewUsername(user.username); // Update username as well in case it changes
      } catch (error) {
        console.error('Error fetching user data: ', error);
      }
    };

    fetchUserData();
  }, [organizationID, username, authToken]);

  // Ensure showManageTeam gets updated as soon as isAdmin changes
  useEffect(() => {
    setShowManageTeam(isAdmin); // Update showManageTeam based on the latest value of isAdmin
  }, [isAdmin]);

  const handleProfileUpdate = async () => {
    const updatedUser = {
      username: newUsername,
      email: newEmail,
    };
    try {
      setUsername(newUsername); // Update username in case it changes
      setNewEmail(newEmail); // Update email in case it changes
      await updateUser(organizationID, username, updatedUser, authToken);
      alert('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile: ', error);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword === confirmPassword) {
      try {
        await updateUser(organizationID, username, { password: newPassword }, authToken);
        alert('Password updated successfully');
      } catch (error) {
        console.error('Error changing password: ', error);
      }
    } else {
      alert('Passwords do not match!');
    }
  };

  return (
    <div className="user-settings-main p-6">
    <div className="user-settings-container">
      <h2>User Settings</h2>
      <div className="form-group">
        <label>Username</label>
        <input
          type="text"
          value={newUsername}
          onChange={(e) => setNewUsername(e.target.value)}
        />
      </div>
      <div className="form-group">
        <label>Email</label>
        <input
          type="email"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
        />
      </div>
      <button className="save-button" onClick={handleProfileUpdate}>
        Save Profile
      </button>

      <button
        className="toggle-password-button"
        onClick={() => setIsChangePasswordVisible(!isChangePasswordVisible)}
      >
        {isChangePasswordVisible ? 'Hide Change Password' : 'Change Password'}
      </button>

      {isChangePasswordVisible && (
        <>
          <h3 className='mt-2'>Change Password</h3>
          <div className="form-group">
            <label>Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
          <button className="save-button" onClick={handleChangePassword}>
            Change Password
          </button>
        </>
      )}

      {showManageTeam && (
        <div className="manage-users-link">
          <Link to="/manage-team" className="manage-team-button">
            Manage Team
          </Link>
        </div>
      )}
    </div>
    </div>
  );
};

export default UserSettings;

import React, { useState, useEffect } from 'react';
import './manage-team.component.css';
import { getUsers, createUser, deleteUser, updateUser } from '../../api/users.api';
import { FaPlus, FaPencilAlt, FaTrashAlt } from 'react-icons/fa';

const ManageTeam = ({ authToken, organizationID }) => {
  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState({ fName: '', lName: '', email: '' });
  const [newUserCredentials, setNewUserCredentials] = useState(null); // Stores the new user credentials
  const [editingUser, setEditingUser] = useState(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const fetchedUsers = await getUsers(organizationID, authToken);
      setUsers(fetchedUsers || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to load users.');
      setLoading(false);
    }
  };

  const handleAddUser = async () => {
    try {
      const response = await createUser(organizationID, newUser, authToken);
      setNewUser({ fName: '', lName: '', email: '' });
      setNewUserCredentials(response); // Store the credentials after creation
      fetchUsers();
      setIsPopupOpen(false);
    } catch (error) {
      console.error('Error adding user:', error);
      setError('Failed to add user.');
    }
  };

  const handleDeleteUser = async (username) => {
    if (window.confirm(`Are you sure you want to remove ${username}?`)) {
      try {
        await deleteUser(organizationID, username, authToken);
        fetchUsers();
      } catch (error) {
        console.error('Error removing user:', error);
        setError('Failed to remove user.');
      }
    }
  };

  const handleEditUser = async () => {
    try {
      await updateUser(organizationID, editingUser.username, editingUser, authToken);
      fetchUsers();
      setEditingUser(null);
    } catch (error) {
      console.error('Error updating user:', error);
      setError('Failed to update user.');
    }
  };

  const openEditPopup = (user) => {
    setEditingUser(user);
    setIsPopupOpen(true);
  };

  const openAddPopup = () => {
    setEditingUser(null);
    setIsPopupOpen(true);
    setNewUserCredentials(null); // Clear any previous credentials
  };

  return (
    <div className="manage-team-container">
      <h2>Manage Team</h2>

      {loading && <p>Loading users...</p>}
      {error && <p className="error-message">{error}</p>}

      <button className="add-user-button" onClick={openAddPopup}>
        <FaPlus /> Add User
      </button>

      <table className="user-table">
        <thead>
          <tr>
            <th>Full Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users && users.length > 0 ? (
            users.map((user, index) => (
              <tr key={index}>
                <td>{user.fName} {user.lName}</td>
                <td>{user.email}</td>
                <td>{user.isAdmin ? 'Admin' : 'User'}</td>
                <td className="table-actions">
                  <button className="action-button edit" onClick={() => openEditPopup(user)}>
                    <FaPencilAlt />
                  </button>
                  <button className="action-button delete" onClick={() => handleDeleteUser(user.username)}>
                    <FaTrashAlt />
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="4">No users found.</td>
            </tr>
          )}
        </tbody>
      </table>

      {isPopupOpen && (
        <>
          <div className="popup-overlay" onClick={() => setIsPopupOpen(false)}></div>
          <div className="popup-container">
            <h3>{editingUser ? 'Edit User' : 'Add New User'}</h3>
            <div className="form-group">
              <label>First Name</label>
              <input
                type="text"
                value={editingUser ? editingUser.fName : newUser.fName}
                onChange={(e) => editingUser
                  ? setEditingUser({ ...editingUser, fName: e.target.value })
                  : setNewUser({ ...newUser, fName: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Last Name</label>
              <input
                type="text"
                value={editingUser ? editingUser.lName : newUser.lName}
                onChange={(e) => editingUser
                  ? setEditingUser({ ...editingUser, lName: e.target.value })
                  : setNewUser({ ...newUser, lName: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={editingUser ? editingUser.email : newUser.email}
                onChange={(e) => editingUser
                  ? setEditingUser({ ...editingUser, email: e.target.value })
                  : setNewUser({ ...newUser, email: e.target.value })}
              />
            </div>
            {editingUser && (
              <div className="form-group">
                <label>Role</label>
                <select
                  value={editingUser.isAdmin ? 'Admin' : 'User'}
                  onChange={(e) => setEditingUser({ ...editingUser, isAdmin: e.target.value === 'Admin' })}
                >
                  <option value="User">User</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>
            )}
            <button className="save-button" onClick={editingUser ? handleEditUser : handleAddUser}>
              {editingUser ? 'Save Changes' : 'Add User'}
            </button>
          </div>
        </>
      )}

      {/* New User Credentials Popup */}
      {newUserCredentials && (
        <div className="credentials-popup">
          <h3>New User Credentials</h3>
          <p><strong>Username:</strong> {newUserCredentials.username}</p>
          <p><strong>Password:</strong> {newUserCredentials.password}</p>
          <button onClick={() => setNewUserCredentials(null)}>Close</button>
        </div>
      )}
    </div>
  );
};

export default ManageTeam;

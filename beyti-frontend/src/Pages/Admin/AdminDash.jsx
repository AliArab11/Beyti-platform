import { useEffect, useState } from 'react';
import { getUsers, createUser, updateUser, toggleUserStatus } from '../../services/api';

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState({ displayName: '', roleType: '', status: 'Active' });
  const [editingId, setEditingId] = useState(null);
  const [originalRole, setOriginalRole] = useState(null);
  const [roleFilter, setRoleFilter] = useState('All');

  const fetchUsersList = async () => {
    try {
      const data = await getUsers(roleFilter);
      setUsers(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchUsersList();
  }, [roleFilter]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        const result = await updateUser(editingId, formData);
        
        // Show message if role was changed
        if (result.message) {
          alert(`${result.message}\nOld user (${result.oldUser.roleType}) marked as "Role Changed".\nNew user created as ${result.newUser.roleType}.`);
        }
        
        setEditingId(null);
        setOriginalRole(null);
      } else {
        await createUser(formData);
      }
      setFormData({ displayName: '', roleType: '', status: 'Active' });
      fetchUsersList();
    } catch (err) {
      console.error(err);
      alert('Error saving user.');
    }
  };

  const handleEdit = (user) => {
    setEditingId(user.id);
    setOriginalRole(user.roleType);
    setFormData({ displayName: user.displayName, roleType: user.roleType, status: user.status });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setOriginalRole(null);
    setFormData({ displayName: '', roleType: '', status: 'Active' });
  };

  const handleToggleStatus = async (user) => {
    try {
      await toggleUserStatus(user.id);
      fetchUsersList();
    } catch (err) {
      console.error(err);
      alert('Error toggling status.');
    }
  };

  const isRoleChanging = editingId && originalRole && formData.roleType !== originalRole;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">User Management</h2>

      {/* Role Filter */}
      <div className="mb-4">
        <label className="font-semibold mr-2">Filter by Role:</label>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="border px-3 py-1 rounded"
        >
          <option value="All">All</option>
          <option value="Customer">Customer</option>
          <option value="Seller">Seller</option>
          <option value="ServiceProvider">ServiceProvider</option>
          <option value="Admin">Admin</option>
          <option value="Driver">Driver</option>
        </select>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="mb-6 space-y-2">
        <input
          type="text"
          placeholder="Display Name"
          value={formData.displayName}
          onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
          className="border px-2 py-1 rounded w-full"
          required
        />
        <select
          value={formData.roleType}
          onChange={(e) => setFormData({ ...formData, roleType: e.target.value })}
          className="border px-2 py-1 rounded w-full"
          required
        >
          <option value="">Select Role</option>
          <option value="Customer">Customer</option>
          <option value="Seller">Seller</option>
          <option value="ServiceProvider">ServiceProvider</option>
          <option value="Driver">Driver</option>
          <option value="Admin">Admin</option>
        </select>

        {/* Warning when role is changing */}
        {isRoleChanging && (
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-3 py-2 rounded">
            ⚠️ Changing role from <strong>{originalRole}</strong> to <strong>{formData.roleType}</strong> will mark the current user as "Role Changed" and create a new user with the new role.
          </div>
        )}

        <div className="flex space-x-2">
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
            {editingId ? (isRoleChanging ? 'Change Role & Create New User' : 'Update User') : 'Add User'}
          </button>
          {editingId && (
            <button type="button" onClick={handleCancelEdit} className="bg-gray-400 text-white px-4 py-2 rounded">
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* Users Table */}
      <table className="min-w-full bg-white border">
        <thead>
          <tr>
            <th className="border px-2 py-1">ID</th>
            <th className="border px-2 py-1">Display Name</th>
            <th className="border px-2 py-1">Role</th>
            <th className="border px-2 py-1">Status</th>
            <th className="border px-2 py-1">Created At</th>
            <th className="border px-2 py-1">Updated At</th>
            <th className="border px-2 py-1">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className={user.status === 'Role Changed' ? 'bg-gray-100' : ''}>
              <td className="border px-2 py-1">{user.id}</td>
              <td className="border px-2 py-1">{user.displayName}</td>
              <td className="border px-2 py-1">{user.roleType}</td>
              <td className="border px-2 py-1">
                <span className={`px-2 py-1 rounded text-sm ${
                  user.status === 'Active' ? 'bg-green-100 text-green-800' :
                  user.status === 'Inactive' ? 'bg-red-100 text-red-800' :
                  user.status === 'Role Changed' ? 'bg-gray-200 text-gray-600' :
                  'bg-gray-100'
                }`}>
                  {user.status}
                </span>
              </td>
              <td className="border px-2 py-1">{new Date(user.createdAt).toLocaleString()}</td>
              <td className="border px-2 py-1">{new Date(user.updatedAt).toLocaleString()}</td>
              <td className="border px-2 py-1 space-x-2">
                {user.status !== 'Role Changed' && (
                  <>
                    <button onClick={() => handleEdit(user)} className="bg-yellow-400 text-white px-2 py-1 rounded">
                      Edit
                    </button>
                    <button
                      onClick={() => handleToggleStatus(user)}
                      className={`px-2 py-1 rounded text-white ${user.status === 'Active' ? 'bg-red-600' : 'bg-green-600'}`}
                    >
                      {user.status === 'Active' ? 'Deactivate' : 'Activate'}
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
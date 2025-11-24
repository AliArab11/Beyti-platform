import { useEffect, useState } from 'react';
import { getUsers, createUser, updateUser, toggleUserStatus } from '../../../services/api';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState({ displayName: '', roleType: '', status: 'Active' });
  const [editingId, setEditingId] = useState(null);
  const [originalRole, setOriginalRole] = useState(null);
  const [roleFilter, setRoleFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);

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
        if (result.message) {
          alert(`${result.message}\nOld user (${result.oldUser.roleType}) marked as "Role Changed".\nNew user created as ${result.newUser.roleType}.`);
        }
        setEditingId(null);
        setOriginalRole(null);
      } else {
        await createUser(formData);
      }
      setFormData({ displayName: '', roleType: '', status: 'Active' });
      setShowForm(false);
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
    setShowForm(true);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setOriginalRole(null);
    setFormData({ displayName: '', roleType: '', status: 'Active' });
    setShowForm(false);
  };

  const handleToggleStatus = async (user) => {
    if (confirm(`Are you sure you want to ${user.status === 'Active' ? 'deactivate' : 'activate'} ${user.displayName}?`)) {
      try {
        await toggleUserStatus(user.id);
        fetchUsersList();
      } catch (err) {
        console.error(err);
        alert('Error toggling status.');
      }
    }
  };

  const isRoleChanging = editingId && originalRole && formData.roleType !== originalRole;

  const filteredUsers = users.filter(user =>
    user.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.roleType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      {/* Header Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">User Management</h2>
            <p className="text-gray-600 text-sm mt-1">{filteredUsers.length} users found</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition"
          >
            {showForm ? '✕ Close Form' : '+ Add New User'}
          </button>
        </div>

        {/* Filters */}
        <div className="mt-6 flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="🔍 Search by name or role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="All">All Roles</option>
            <option value="Customer">Customer</option>
            <option value="Seller">Seller</option>
            <option value="ServiceProvider">Service Provider</option>
            <option value="Admin">Admin</option>
            <option value="Driver">Driver</option>
          </select>
        </div>
      </div>

      {/* Form Section */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">
            {editingId ? 'Edit User' : 'Add New User'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
              <input
                type="text"
                placeholder="Enter display name"
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select
                value={formData.roleType}
                onChange={(e) => setFormData({ ...formData, roleType: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select Role</option>
                <option value="Customer">Customer</option>
                <option value="Seller">Seller</option>
                <option value="ServiceProvider">Service Provider</option>
                <option value="Driver">Driver</option>
                <option value="Admin">Admin</option>
              </select>
            </div>

            {isRoleChanging && (
              <div className="bg-yellow-50 border border-yellow-400 text-yellow-800 px-4 py-3 rounded-lg">
                <p className="font-medium">⚠️ Warning: Role Change</p>
                <p className="text-sm mt-1">
                  Changing role from <strong>{originalRole}</strong> to <strong>{formData.roleType}</strong> will 
                  mark the current user as "Role Changed" and create a new user with the new role.
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition"
              >
                {editingId ? (isRoleChanging ? 'Change Role & Create New User' : 'Update User') : 'Create User'}
              </button>
              <button
                type="button"
                onClick={handleCancelEdit}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-2 rounded-lg font-medium transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className={user.status === 'Role Changed' ? 'bg-gray-50' : 'hover:bg-gray-50'}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-bold">{user.displayName.charAt(0).toUpperCase()}</span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.displayName}</div>
                        <div className="text-sm text-gray-500">ID: {user.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                      {user.roleType}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.status === 'Active' ? 'bg-green-100 text-green-800' :
                      user.status === 'Inactive' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {user.status !== 'Role Changed' && (
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEdit(user)}
                          className="text-blue-600 hover:text-blue-900 font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleToggleStatus(user)}
                          className={`font-medium ${user.status === 'Active' ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}`}
                        >
                          {user.status === 'Active' ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No users found</p>
          </div>
        )}
      </div>
    </div>
  );
}
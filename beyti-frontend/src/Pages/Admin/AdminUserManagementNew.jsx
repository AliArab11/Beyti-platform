/**
 * Admin User Management Page - New Design System
 *
 * Complete rebuild using the Beyti Design System components.
 * Features full CRUD functionality with the new component library.
 */

import React, { useEffect, useState } from 'react';
import { House, Users, ShieldCheck, FileText, Gear } from '@phosphor-icons/react';
import NavigationButton from '../../components/NavigationButton';
import SidebarProfile from '../../components/SidebarProfile';
import PageHeader from '../../components/PageHeader';
import { Table, TableHeader, TableBody, TableRow } from '../../components/Table';
import CRUDButton from '../../components/CRUDButton';
import StatusChip from '../../components/StatusChip';
import FilterDropdown from '../../components/FilterDropdown';
import { getUsers, createUser, updateUser, toggleUserStatus } from '../../services/api';

const AdminUserManagementNew = () => {
  // State management
  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState({ displayName: '', roleType: '', status: 'Active' });
  const [editingId, setEditingId] = useState(null);
  const [originalRole, setOriginalRole] = useState(null);
  const [roleFilter, setRoleFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);

  // Fetch users
  const fetchUsersList = async () => {
    try {
      const data = await getUsers(roleFilter === 'All' ? null : roleFilter);
      setUsers(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchUsersList();
  }, [roleFilter]);

  // Form handlers
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

  // Filter users by search term
  const filteredUsers = users.filter(user =>
    user.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.roleType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Map status to StatusChip variant
  const getStatusVariant = (status) => {
    switch (status) {
      case 'Active': return 'success';
      case 'Inactive': return 'neutral';
      case 'Role Changed': return 'neutral';
      default: return 'neutral';
    }
  };

  // Map role to StatusChip variant
  const getRoleVariant = (role) => {
    switch (role) {
      case 'Admin': return 'brand';
      case 'Seller': return 'success';
      case 'Customer': return 'success';
      case 'Driver': return 'danger';
      case 'ServiceProvider': return 'danger';
      default: return 'neutral';
    }
  };

  return (
    <div className="flex min-h-screen bg-cream-50">
      {/* Sidebar */}
      <aside className="w-[250px] bg-sage-500 flex flex-col">
        {/* Logo */}
        <div className="p-6">
          <h1 className="text-display-h1 text-cream-200">Beyti Logo</h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-2">
          <NavigationButton icon={<House size={20} weight="fill" />}>
            Dashboard
          </NavigationButton>
          <NavigationButton selected icon={<Users size={20} weight="fill" />}>
            User Management
          </NavigationButton>
          <NavigationButton icon={<ShieldCheck size={20} />}>
            Seller Approvals
          </NavigationButton>
          <NavigationButton icon={<FileText size={20} />}>
            Financials
          </NavigationButton>
          <NavigationButton icon={<Gear size={20} />}>
            Settings
          </NavigationButton>
        </nav>

        {/* Profile Section */}
        <SidebarProfile userName="Ali" userRole="Super Admin" />
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Page Header */}
        <PageHeader
          title="User Management"
          withSearch
          searchPlaceholder="Search users by name or role..."
          onSearch={setSearchTerm}
          notificationCount={3}
          userName="Ali"
          userRole="Super Admin"
        />

        {/* Content Area */}
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Add User Form */}
            {showForm && (
              <div className="bg-grey-200 shadow-soft-lift rounded-lg p-6">
                <h2 className="text-card-h2 text-charcoal-600 mb-4">
                  {editingId ? 'Edit User' : 'Add New User'}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="text-label-medium text-charcoal-600 mb-2 block">
                      Display Name
                    </label>
                    <input
                      type="text"
                      placeholder="Enter display name"
                      value={formData.displayName}
                      onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                      className="
                        w-full h-[42px] px-4
                        border border-charcoal-400 rounded-md
                        text-body-regular text-charcoal-600
                        placeholder:text-charcoal-400
                        focus:outline-none focus:ring-2 focus:ring-sage-500
                        bg-grey-200
                      "
                      required
                    />
                  </div>

                  <div>
                    <label className="text-label-medium text-charcoal-600 mb-2 block">
                      Role
                    </label>
                    <select
                      value={formData.roleType}
                      onChange={(e) => setFormData({ ...formData, roleType: e.target.value })}
                      className="
                        w-full h-[42px] px-4
                        border border-charcoal-400 rounded-md
                        text-body-regular text-charcoal-600
                        focus:outline-none focus:ring-2 focus:ring-sage-500
                        bg-grey-200
                      "
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
                    <div className="bg-danger-bg border-l-4 border-danger-btn p-4 rounded">
                      <p className="text-body-medium text-danger-text font-medium">
                        Warning: Role Change
                      </p>
                      <p className="text-body-regular text-danger-text mt-2">
                        Changing role from <strong>{originalRole}</strong> to <strong>{formData.roleType}</strong> will
                        mark the current user as "Role Changed" and create a new user with the new role.
                      </p>
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <CRUDButton type="submit" variant="success">
                      {editingId ? (isRoleChanging ? 'Change Role' : 'Update User') : 'Create User'}
                    </CRUDButton>
                    <CRUDButton type="button" variant="neutral" onClick={handleCancelEdit}>
                      Cancel
                    </CRUDButton>
                  </div>
                </form>
              </div>
            )}

            {/* Users Table */}
            <Table
              title="All Users"
              filters={[
                {
                  label: 'Role:',
                  value: roleFilter,
                  options: ['All', 'Customer', 'Seller', 'ServiceProvider', 'Admin', 'Driver'],
                  onChange: setRoleFilter
                }
              ]}
              actionButton={
                <CRUDButton
                  variant="success"
                  onClick={() => {
                    setShowForm(!showForm);
                    if (showForm) handleCancelEdit();
                  }}
                >
                  {showForm ? 'Close Form' : 'Add New User'}
                </CRUDButton>
              }
            >
              <TableHeader columns={['User', 'Role', 'Status', 'Created', 'Actions']} />
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow
                    key={user.id}
                    data={[
                      // User column
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-sage-500 flex items-center justify-center flex-shrink-0">
                          <span className="text-body-regular text-cream-200 font-medium">
                            {user.displayName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-body-regular text-charcoal-600 font-medium">
                            {user.displayName}
                          </p>
                          <p className="text-label-medium text-charcoal-400">
                            ID: {user.id}
                          </p>
                        </div>
                      </div>,

                      // Role column
                      <StatusChip variant={getRoleVariant(user.roleType)}>
                        {user.roleType}
                      </StatusChip>,

                      // Status column
                      <StatusChip variant={getStatusVariant(user.status)}>
                        {user.status}
                      </StatusChip>,

                      // Created column
                      new Date(user.createdAt).toLocaleDateString()
                    ]}
                    actions={
                      user.status !== 'Role Changed' && (
                        <>
                          <CRUDButton variant="neutral" onClick={() => handleEdit(user)}>
                            Edit
                          </CRUDButton>
                          <CRUDButton
                            variant={user.status === 'Active' ? 'error' : 'success'}
                            onClick={() => handleToggleStatus(user)}
                          >
                            {user.status === 'Active' ? 'Deactivate' : 'Activate'}
                          </CRUDButton>
                        </>
                      )
                    }
                  />
                ))}
              </TableBody>
            </Table>

            {filteredUsers.length === 0 && (
              <div className="bg-grey-200 shadow-soft-lift rounded-lg p-12 text-center">
                <p className="text-body-regular text-charcoal-400">No users found</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminUserManagementNew;

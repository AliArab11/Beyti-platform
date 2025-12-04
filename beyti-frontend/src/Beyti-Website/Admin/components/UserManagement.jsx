/**
 * User Management Page
 * 
 * Manages all platform users with CRUD operations
 * Features: View users, add/edit users, filter by role, search, toggle status
 */

import React, { useEffect, useState } from 'react';
import {
  Plus,
  X,
  PencilSimple,
  CheckCircle,
  ProhibitInset,
  Eye,
  Users
} from '@phosphor-icons/react';
import {
  getUsers,
  createUser,
  updateUser,
  toggleUserStatus
} from '../../../services/api';
import { logAdminActivity } from '../../../utils/adminActivityLogger';

// Import design system components
import AnalyticsCard from '../../../components/AnalyticsCard';
import CRUDButton from '../../../components/CRUDButton';
import StatusChip from '../../../components/StatusChip';
import { Table, TableHeader, TableBody, TableRow } from '../../../components/Table';
import PageHeader from '../../../components/PageHeader';
import AdminSidebar from './AdminSidebar';

const UserManagement = ({ onNavigate, adminUserProfileId }) => {

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ displayName: '', roleType: '', status: 'Active' });
  const [editingId, setEditingId] = useState(null);
  const [originalRole, setOriginalRole] = useState(null);
  const [activeSection, setActiveSection] = useState('all'); // all, customers, sellers, service-providers, drivers
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [notificationCount] = useState(0);

  // Statistics state
  const [stats, setStats] = useState({
    totalUsers: 0,
    newUsersThisWeek: 0,
    activeUsers: 0,
    customers: 0,
    sellers: 0,
    serviceProviders: 0,
    drivers: 0
  });

  const fetchUsersList = async () => {
    try {
      setLoading(true);
      const data = await getUsers();
      setUsers(data);

      // Calculate statistics
      const total = data.length;
      const active = data.filter(u => u.status === 'Active').length;

      // Calculate new users this week
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const newThisWeek = data.filter(u => new Date(u.createdAt) >= oneWeekAgo).length;

      // Count by role
      const customers = data.filter(u => u.roleType === 'Customer').length;
      const sellers = data.filter(u => u.roleType === 'Seller').length;
      const serviceProviders = data.filter(u => u.roleType === 'ServiceProvider').length;
      const drivers = data.filter(u => u.roleType === 'Driver').length;

      setStats({
        totalUsers: total,
        newUsersThisWeek: newThisWeek,
        activeUsers: active,
        customers,
        sellers,
        serviceProviders,
        drivers
      });
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsersList();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        const result = await updateUser(editingId, formData, adminUserProfileId);
        if (result.message) {
          alert(`${result.message}\nOld user (${result.oldUser.roleType}) marked as "Role Changed".\nNew user created as ${result.newUser.roleType}.`);
        }

        // Log the admin activity
        logAdminActivity(
          'user_created',
          'Updated User Account',
          `${formData.displayName} - ${formData.roleType}`
        );

        setEditingId(null);
        setOriginalRole(null);
      } else {
        await createUser(formData, adminUserProfileId);

        // Log the admin activity
        logAdminActivity(
          'user_created',
          'Created New User',
          `${formData.displayName} - ${formData.roleType}`
        );

        alert('User created successfully!');
      }
      setFormData({ displayName: '', roleType: '', status: 'Active' });
      setShowForm(false);
      fetchUsersList();
    } catch (err) {
      console.error('Error saving user:', err);
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
    if (window.confirm(`Are you sure you want to ${user.status === 'Active' ? 'deactivate' : 'activate'} ${user.displayName}?`)) {
      try {
        await toggleUserStatus(user.id, adminUserProfileId);

        // Log the admin activity
        const action = user.status === 'Active' ? 'Deactivated' : 'Activated';
        logAdminActivity(
          user.status === 'Active' ? 'suspension' : 'approval',
          `${action} User Account`,
          `${user.displayName} - ${user.roleType}`
        );

        fetchUsersList();
      } catch (err) {
        console.error('Error toggling status:', err);
        alert('Error toggling status.');
      }
    }
  };

  const handleViewDetails = (user) => {
    setSelectedUser(user);
    setShowDetailsModal(true);
  };

  const handleCloseModal = () => {
    setShowDetailsModal(false);
    setSelectedUser(null);
  };

  const isRoleChanging = editingId && originalRole && formData.roleType !== originalRole;

  // Filter users based on active section and search term
  const getFilteredUsers = () => {
    let filtered = users;

    // Filter by section
    if (activeSection !== 'all') {
      const roleMap = {
        'customers': 'Customer',
        'sellers': 'Seller',
        'service-providers': 'ServiceProvider',
        'drivers': 'Driver'
      };
      filtered = filtered.filter(u => u.roleType === roleMap[activeSection]);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.roleType.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  };

  const filteredUsers = getFilteredUsers();

  if (loading) {
    return (
      <div className="flex min-h-screen bg-cream-50">
        <AdminSidebar currentPage="users" onNavigate={onNavigate} />

        {/* Main Content - Loading */}
        <div className="flex-1 ml-[250px] flex flex-col">
          <PageHeader
            title="User Management"
            notificationCount={notificationCount}
            userName="Admin User"
            userRole="Super Admin"
          />
          <main className="flex-1 p-8 overflow-y-auto">
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sage-500"></div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-cream-50">
      <AdminSidebar currentPage="users" onNavigate={onNavigate} />

      {/* Main Content */}
      <div className="flex-1 ml-[250px] flex flex-col">
        {/* Header */}
        <PageHeader
          title="User Management"
          withSearch={true}
          searchPlaceholder="Search by name or role..."
          onSearch={(value) => setSearchTerm(value)}
          notificationCount={notificationCount}
          userName="Admin User"
          userRole="Super Admin"
        />

        {/* Main Content Area */}
        <main className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <AnalyticsCard
                title="Total Users"
                metrics={[
                  {
                    value: loading ? '...' : stats.totalUsers.toString(),
                    label: 'All Platform Users'
                  }
                ]}
              />
              <AnalyticsCard
                title="New Users"
                metrics={[
                  {
                    value: loading ? '...' : stats.newUsersThisWeek.toString(),
                    label: 'This Week'
                  }
                ]}
              />
              <AnalyticsCard
                title="Active Users"
                metrics={[
                  {
                    value: loading ? '...' : stats.activeUsers.toString(),
                    label: 'Currently Active'
                  }
                ]}
              />
            </div>

            {/* Tabs and Content */}
            <div className="bg-grey-200 dark:bg-[#2A2A2A] rounded-lg shadow-soft-lift dark:shadow-none transition-colors">
              <div className="flex flex-wrap items-center justify-between border-b border-grey-stroke">
                <div className="flex flex-wrap">
                  <button
                    onClick={() => setActiveSection('all')}
                    className={`px-6 py-4 font-semibold transition ${
                      activeSection === 'all'
                        ? 'border-b-2 border-sage-500 text-sage-700 bg-sage-100/30'
                        : 'text-charcoal-400 hover:text-charcoal-600 hover:bg-cream-100'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <Users size={20} weight={activeSection === 'all' ? 'fill' : 'regular'} />
                      <span>All Users ({stats.totalUsers})</span>
                    </div>
                  </button>
                  <button
                    onClick={() => setActiveSection('customers')}
                    className={`px-6 py-4 font-semibold transition ${
                      activeSection === 'customers'
                        ? 'border-b-2 border-sage-500 text-sage-700 bg-sage-100/30'
                        : 'text-charcoal-400 hover:text-charcoal-600 hover:bg-cream-100'
                    }`}
                  >
                    <span>Customers ({stats.customers})</span>
                  </button>
                  <button
                    onClick={() => setActiveSection('sellers')}
                    className={`px-6 py-4 font-semibold transition ${
                      activeSection === 'sellers'
                        ? 'border-b-2 border-sage-500 text-sage-700 bg-sage-100/30'
                        : 'text-charcoal-400 hover:text-charcoal-600 hover:bg-cream-100'
                    }`}
                  >
                    <span>Sellers ({stats.sellers})</span>
                  </button>
                  <button
                    onClick={() => setActiveSection('service-providers')}
                    className={`px-6 py-4 font-semibold transition ${
                      activeSection === 'service-providers'
                        ? 'border-b-2 border-sage-500 text-sage-700 bg-sage-100/30'
                        : 'text-charcoal-400 hover:text-charcoal-600 hover:bg-cream-100'
                    }`}
                  >
                    <span>Service Providers ({stats.serviceProviders})</span>
                  </button>
                  <button
                    onClick={() => setActiveSection('drivers')}
                    className={`px-6 py-4 font-semibold transition ${
                      activeSection === 'drivers'
                        ? 'border-b-2 border-sage-500 text-sage-700 bg-sage-100/30'
                        : 'text-charcoal-400 hover:text-charcoal-600 hover:bg-cream-100'
                    }`}
                  >
                    <span>Drivers ({stats.drivers})</span>
                  </button>
                </div>

                {/* Add User Button */}
                <div className="px-6 py-2">
                  <CRUDButton
                    variant="success"
                    onClick={() => setShowForm(!showForm)}
                  >
                    {showForm ? (
                      <>
                        <X size={16} className="inline mr-1" />
                        Close Form
                      </>
                    ) : (
                      <>
                        <Plus size={16} className="inline mr-1" />
                        Add New User
                      </>
                    )}
                  </CRUDButton>
                </div>
              </div>

              {/* Tab Content */}
              <div className="p-6">

                {/* Add/Edit Form */}
                {showForm && (
                  <div className="bg-cream-50 rounded-lg border border-grey-stroke p-6 mb-6">
                    <h3 className="text-card-h2 text-charcoal-600 mb-4">
                      {editingId ? 'Edit User' : 'Add New User'}
                    </h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <label className="block text-body-regular text-charcoal-600 font-semibold mb-2">
                          Display Name
                        </label>
                        <input
                          type="text"
                          placeholder="Enter display name"
                          value={formData.displayName}
                          onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                          className="w-full border border-grey-stroke rounded-lg px-4 py-2 focus:ring-2 focus:ring-sage-500 focus:border-sage-500 text-body-regular bg-white"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-body-regular text-charcoal-600 font-semibold mb-2">
                          Role
                        </label>
                        <select
                          value={formData.roleType}
                          onChange={(e) => setFormData({ ...formData, roleType: e.target.value })}
                          className="w-full border border-grey-stroke rounded-lg px-4 py-2 focus:ring-2 focus:ring-sage-500 focus:border-sage-500 text-body-regular bg-white"
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
                        <div className="bg-danger-bg border border-danger-btn text-danger-text px-4 py-3 rounded-lg">
                          <p className="text-body-medium font-semibold">⚠️ Warning: Role Change</p>
                          <p className="text-body-regular mt-1">
                            Changing role from <strong>{originalRole}</strong> to <strong>{formData.roleType}</strong> will
                            mark the current user as "Role Changed" and create a new user with the new role.
                          </p>
                        </div>
                      )}

                      <div className="flex gap-3 pt-2">
                        <CRUDButton type="submit" variant="success">
                          {editingId ? (isRoleChanging ? 'Change Role & Create New User' : 'Update User') : 'Create User'}
                        </CRUDButton>
                        <CRUDButton type="button" variant="error" onClick={handleCancelEdit}>
                          Cancel
                        </CRUDButton>
                      </div>
                    </form>
                  </div>
                )}

                {/* Users Table */}
                {filteredUsers.length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle size={64} className="text-success-btn mx-auto mb-4" weight="fill" />
                    <p className="text-charcoal-400 text-lg">No users found</p>
                    <p className="text-charcoal-400 text-sm mt-2">Try adjusting your search or filters</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader
                      columns={[
                        'User ID',
                        'Name',
                        'Role',
                        'Status',
                        'Created',
                        'Actions'
                      ]}
                    />
                    <TableBody>
                      {filteredUsers.map((user) => (
                        <TableRow
                          key={user.id}
                          data={[
                            user.id,
                            user.displayName,
                            <StatusChip variant="success">{user.roleType}</StatusChip>,
                            <StatusChip
                              variant={
                                user.status === 'Active'
                                  ? 'success'
                                  : user.status === 'Inactive'
                                  ? 'error'
                                  : 'danger'
                              }
                            >
                              {user.status}
                            </StatusChip>,
                            new Date(user.createdAt).toLocaleDateString()
                          ]}
                          actions={
                            user.status !== 'Role Changed' ? (
                              <>
                                <CRUDButton
                                  variant="success"
                                  onClick={() => handleViewDetails(user)}
                                >
                                  <Eye size={16} className="inline mr-1" />
                                  View
                                </CRUDButton>
                                <CRUDButton
                                  variant="success"
                                  onClick={() => handleEdit(user)}
                                >
                                  <PencilSimple size={16} className="inline mr-1" />
                                  Edit
                                </CRUDButton>
                                <CRUDButton
                                  variant={user.status === 'Active' ? 'error' : 'success'}
                                  onClick={() => handleToggleStatus(user)}
                                >
                                  {user.status === 'Active' ? (
                                    <>
                                      <ProhibitInset size={16} className="inline mr-1" />
                                      Deactivate
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle size={16} className="inline mr-1" />
                                      Activate
                                    </>
                                  )}
                                </CRUDButton>
                              </>
                            ) : null
                          }
                        />
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedUser && (
        <div className="fixed inset-0 bg-charcoal-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-soft-lift max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="p-6 border-b border-grey-stroke">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-display-h2 text-charcoal-600">{selectedUser.displayName}</h3>
                  <p className="text-body-regular text-charcoal-400 mt-1">
                    User ID: {selectedUser.id}
                  </p>
                  <div className="mt-3 flex gap-2">
                    <StatusChip variant="success">{selectedUser.roleType}</StatusChip>
                    <StatusChip
                      variant={
                        selectedUser.status === 'Active'
                          ? 'success'
                          : selectedUser.status === 'Inactive'
                          ? 'error'
                          : 'danger'
                      }
                    >
                      {selectedUser.status}
                    </StatusChip>
                  </div>
                </div>
                <button
                  onClick={handleCloseModal}
                  className="text-charcoal-400 hover:text-charcoal-600 transition-colors p-2"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <h4 className="text-card-h2 text-charcoal-600 mb-4">User Details</h4>

              <div className="space-y-4">
                {/* Basic Information */}
                <div className="bg-cream-50 rounded-lg p-4">
                  <h5 className="text-body-medium text-charcoal-600 font-semibold mb-3">
                    Basic Information
                  </h5>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-body-regular text-charcoal-400">Display Name:</span>
                      <span className="text-body-regular text-charcoal-600 font-semibold">
                        {selectedUser.displayName}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-body-regular text-charcoal-400">User ID:</span>
                      <span className="text-body-regular text-charcoal-600">
                        {selectedUser.id}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-body-regular text-charcoal-400">Role Type:</span>
                      <StatusChip variant="success">{selectedUser.roleType}</StatusChip>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-body-regular text-charcoal-400">Account Status:</span>
                      <StatusChip
                        variant={
                          selectedUser.status === 'Active'
                            ? 'success'
                            : selectedUser.status === 'Inactive'
                            ? 'error'
                            : 'danger'
                        }
                      >
                        {selectedUser.status}
                      </StatusChip>
                    </div>
                  </div>
                </div>

                {/* Account Dates */}
                <div className="bg-cream-50 rounded-lg p-4">
                  <h5 className="text-body-medium text-charcoal-600 font-semibold mb-3">
                    Account Dates
                  </h5>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-body-regular text-charcoal-400">Created At:</span>
                      <span className="text-body-regular text-charcoal-600">
                        {new Date(selectedUser.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-body-regular text-charcoal-400">Last Updated:</span>
                      <span className="text-body-regular text-charcoal-600">
                        {new Date(selectedUser.updatedAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-grey-stroke flex justify-end gap-3">
              <CRUDButton variant="error" onClick={handleCloseModal}>
                Close
              </CRUDButton>
              {selectedUser.status !== 'Role Changed' && (
                <>
                  <CRUDButton
                    variant="success"
                    onClick={() => {
                      handleCloseModal();
                      handleEdit(selectedUser);
                    }}
                  >
                    <PencilSimple size={16} className="inline mr-1" />
                    Edit User
                  </CRUDButton>
                  <CRUDButton
                    variant={selectedUser.status === 'Active' ? 'error' : 'success'}
                    onClick={() => {
                      handleCloseModal();
                      handleToggleStatus(selectedUser);
                    }}
                  >
                    {selectedUser.status === 'Active' ? (
                      <>
                        <ProhibitInset size={16} className="inline mr-1" />
                        Deactivate
                      </>
                    ) : (
                      <>
                        <CheckCircle size={16} className="inline mr-1" />
                        Activate
                      </>
                    )}
                  </CRUDButton>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
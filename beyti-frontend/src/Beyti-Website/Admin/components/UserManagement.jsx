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
  toggleUserStatus,
  getUserProfile,
  updateUserProfile,
  getCategories,
  getServiceCategoryList
} from '../../../services/api';
import { logAdminActivity } from '../../../utils/adminActivityLogger';

// Import design system components
import AnalyticsCard from '../../../components/AnalyticsCard';
import CRUDButton from '../../../components/CRUDButton';
import StatusChip from '../../../components/StatusChip';
import { Table, TableHeader, TableBody, TableRow } from '../../../components/Table';
import PageHeader from '../../../components/PageHeader';
import AdminSidebar from './AdminSidebar';
import Snackbar from '../../../components/Snackbar';
import ConfirmModal from '../../../components/ConfirmModal';

const UserManagement = ({ onNavigate, adminUserProfileId, renderContentOnly = false }) => {

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ displayName: '', roleType: '', status: 'Active', categoryId: '', serviceCategoryId: '' });
  const [editingId, setEditingId] = useState(null);
  const [originalRole, setOriginalRole] = useState(null);
  const [activeSection, setActiveSection] = useState('all'); // all, customers, sellers, service-providers, drivers
  const [searchTerm, setSearchTerm] = useState('');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [notificationCount] = useState(0);

  // Snackbar state
  const [snackbar, setSnackbar] = useState({ open: false, message: '', type: 'success' });

  // ConfirmModal state
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    variant: 'danger'
  });

  // Category and Service Category state
  const [categories, setCategories] = useState([]);
  const [serviceCategories, setServiceCategories] = useState([]);

  // User profile state (only used when not renderContentOnly)
  const [userProfile, setUserProfile] = useState(null);
  const [displayName, setDisplayName] = useState("Admin User");

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

      // Normalize data to handle both PascalCase and camelCase
      const normalizedUsers = data.map(user => ({
        id: user.Id || user.id,
        displayName: user.DisplayName || user.displayName,
        roleType: user.RoleType || user.roleType,
        status: user.Status || user.status,
        createdAt: user.CreatedAt || user.createdAt,
        updatedAt: user.UpdatedAt || user.updatedAt,
        categoryId: user.CategoryId || user.categoryId,
        serviceCategoryId: user.ServiceCategoryId || user.serviceCategoryId
      }));

      setUsers(normalizedUsers);

      // Calculate statistics using normalized data
      const total = normalizedUsers.length;
      const active = normalizedUsers.filter(u => u.status === 'Active').length;

      // Calculate new users this week
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const newThisWeek = normalizedUsers.filter(u => new Date(u.createdAt) >= oneWeekAgo).length;

      // Count by role
      const customers = normalizedUsers.filter(u => u.roleType === 'Customer').length;
      const sellers = normalizedUsers.filter(u => u.roleType === 'Seller').length;
      const serviceProviders = normalizedUsers.filter(u => u.roleType === 'ServiceProvider').length;
      const drivers = normalizedUsers.filter(u => u.roleType === 'Driver').length;

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

  // Fetch categories for Sellers
  const fetchCategories = async () => {
    try {
      const data = await getCategories();
      setCategories(data || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setCategories([]);
    }
  };

  // Fetch service categories for Service Providers
  const fetchServiceCategories = async () => {
    try {
      const data = await getServiceCategoryList();
      setServiceCategories(data || []);
    } catch (err) {
      console.error('Error fetching service categories:', err);
      setServiceCategories([]);
    }
  };

  // Fetch user profile details
  const fetchUserProfile = async () => {
    try {
      const profile = await getUserProfile(adminUserProfileId);
      if (profile) {
        const normalizedProfile = {
          userProfileId: profile.UserProfileId,
          displayName: profile.DisplayName,
          roleType: profile.RoleType,
          status: profile.Status,
          phone: profile.Phone,
          createdAt: profile.CreatedAt,
          updatedAt: profile.UpdatedAt,
        };
        setUserProfile(normalizedProfile);
        if (normalizedProfile.displayName) {
          setDisplayName(normalizedProfile.displayName);
        }
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  // Handle profile update
  const handleProfileUpdate = async (updates) => {
    try {
      await updateUserProfile(adminUserProfileId, 'Admin', updates);
      await fetchUserProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchUsersList();
    fetchCategories();
    fetchServiceCategories();
    if (!renderContentOnly) {
      fetchUserProfile();
    }
  }, [renderContentOnly]);

  // Auto-close snackbar after 5 seconds
  useEffect(() => {
    if (snackbar.open) {
      const timer = setTimeout(() => {
        setSnackbar({ ...snackbar, open: false });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [snackbar.open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        const result = await updateUser(editingId, formData, adminUserProfileId);
        if (result.message) {
          setSnackbar({
            open: true,
            message: `${result.message}. Old user (${result.oldUser.roleType}) marked as "Role Changed". New user created as ${result.newUser.roleType}.`,
            type: 'success'
          });
        } else {
          setSnackbar({
            open: true,
            message: 'User updated successfully!',
            type: 'success'
          });
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

        setSnackbar({
          open: true,
          message: 'User created successfully!',
          type: 'success'
        });
      }
      setFormData({ displayName: '', roleType: '', status: 'Active', categoryId: '', serviceCategoryId: '' });
      setShowEditModal(false);
      setShowAddModal(false);
      setSelectedUser(null);
      fetchUsersList();
    } catch (err) {
      console.error('Error saving user:', err);
      // Display the actual error message from the backend
      const errorMessage = err.message || err.error || 'Error saving user. Please try again.';
      setSnackbar({
        open: true,
        message: errorMessage,
        type: 'error'
      });
    }
  };

  const handleEdit = (user) => {
    setEditingId(user.id);
    setOriginalRole(user.roleType);
    setSelectedUser(user);
    setFormData({
      displayName: user.displayName,
      roleType: user.roleType,
      status: user.status,
      categoryId: user.categoryId || '',
      serviceCategoryId: user.serviceCategoryId || ''
    });
    setShowEditModal(true);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setOriginalRole(null);
    setFormData({ displayName: '', roleType: '', status: 'Active', categoryId: '', serviceCategoryId: '' });
    setShowEditModal(false);
    setShowAddModal(false);
    setSelectedUser(null);
  };

  const handleToggleStatus = (user) => {
    const action = user.status === 'Active' ? 'deactivate' : 'activate';
    setConfirmModal({
      isOpen: true,
      title: `${action.charAt(0).toUpperCase() + action.slice(1)} User`,
      message: `Are you sure you want to ${action} ${user.displayName}?`,
      variant: user.status === 'Active' ? 'danger' : 'success',
      onConfirm: async () => {
        try {
          await toggleUserStatus(user.id, adminUserProfileId);

          // Log the admin activity
          const actionLabel = user.status === 'Active' ? 'Deactivated' : 'Activated';
          logAdminActivity(
            user.status === 'Active' ? 'suspension' : 'approval',
            `${actionLabel} User Account`,
            `${user.displayName} - ${user.roleType}`
          );

          setConfirmModal({ ...confirmModal, isOpen: false });
          setSnackbar({
            open: true,
            message: `User ${actionLabel.toLowerCase()} successfully!`,
            type: 'success'
          });
          fetchUsersList();
        } catch (err) {
          console.error('Error toggling status:', err);
          setConfirmModal({ ...confirmModal, isOpen: false });
          setSnackbar({
            open: true,
            message: 'Error toggling status. Please try again.',
            type: 'error'
          });
        }
      }
    });
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

  // Render content for when embedded in AdminView
  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sage-500"></div>
        </div>
      );
    }

    return (
      <>
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
                onClick={() => setShowAddModal(true)}
              >
                <Plus size={16} className="inline mr-1" />
                Add New User
              </CRUDButton>
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6">
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

      {/* Details Modal */}
      {showDetailsModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
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
                    {/* Show category for Sellers */}
                    {selectedUser.roleType === 'Seller' && selectedUser.categoryId && (
                      <div className="flex justify-between items-center">
                        <span className="text-body-regular text-charcoal-400">Category:</span>
                        <span className="text-body-regular text-charcoal-600">
                          {categories.find(cat => (cat.id || cat.Id) === selectedUser.categoryId)?.name ||
                           categories.find(cat => (cat.id || cat.Id) === selectedUser.categoryId)?.Name ||
                           'Unknown Category'}
                        </span>
                      </div>
                    )}
                    {/* Show service category for Service Providers */}
                    {selectedUser.roleType === 'ServiceProvider' && selectedUser.serviceCategoryId && (
                      <div className="flex justify-between items-center">
                        <span className="text-body-regular text-charcoal-400">Service Category:</span>
                        <span className="text-body-regular text-charcoal-600">
                          {serviceCategories.find(cat => (cat.id || cat.Id) === selectedUser.serviceCategoryId)?.name ||
                           serviceCategories.find(cat => (cat.id || cat.Id) === selectedUser.serviceCategoryId)?.Name ||
                           'Unknown Service Category'}
                        </span>
                      </div>
                    )}
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

      {/* Edit Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-soft-lift max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="p-6 border-b border-grey-stroke">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-display-h2 text-charcoal-600">Edit User</h3>
                  <p className="text-body-regular text-charcoal-400 mt-1">
                    User ID: {selectedUser.id}
                  </p>
                </div>
                <button
                  onClick={handleCancelEdit}
                  className="text-charcoal-400 hover:text-charcoal-600 transition-colors p-2"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Modal Body - Edit Form */}
            <form onSubmit={handleSubmit}>
              <div className="p-6">
                <div className="space-y-4">
                  {/* Display Name */}
                  <div className="bg-cream-50 rounded-lg p-4">
                    <label className="block text-body-medium text-charcoal-600 font-semibold mb-2">
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

                  {/* Role Type */}
                  <div className="bg-cream-50 rounded-lg p-4">
                    <label className="block text-body-medium text-charcoal-600 font-semibold mb-2">
                      Role Type
                    </label>
                    <select
                      value={formData.roleType}
                      onChange={(e) => {
                        const newRole = e.target.value;
                        setFormData({
                          ...formData,
                          roleType: newRole,
                          categoryId: '',
                          serviceCategoryId: ''
                        });
                      }}
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

                  {/* Category selection for Sellers */}
                  {formData.roleType === 'Seller' && (
                    <div className="bg-cream-50 rounded-lg p-4">
                      <label className="block text-body-medium text-charcoal-600 font-semibold mb-2">
                        Category <span className="text-danger-text">*</span>
                      </label>
                      <select
                        value={formData.categoryId}
                        onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                        className="w-full border border-grey-stroke rounded-lg px-4 py-2 focus:ring-2 focus:ring-sage-500 focus:border-sage-500 text-body-regular bg-white"
                        required
                      >
                        <option value="">Select Category</option>
                        {categories
                          .filter(cat => cat.isActive || cat.IsActive)
                          .map((category) => (
                            <option key={category.id || category.Id} value={category.id || category.Id}>
                              {category.name || category.Name}
                            </option>
                          ))}
                      </select>
                      <p className="text-body-small text-charcoal-400 mt-2">
                        Choose the main category for this seller's store
                      </p>
                    </div>
                  )}

                  {/* Service Category selection for Service Providers */}
                  {formData.roleType === 'ServiceProvider' && (
                    <div className="bg-cream-50 rounded-lg p-4">
                      <label className="block text-body-medium text-charcoal-600 font-semibold mb-2">
                        Service Category <span className="text-danger-text">*</span>
                      </label>
                      <select
                        value={formData.serviceCategoryId}
                        onChange={(e) => setFormData({ ...formData, serviceCategoryId: e.target.value })}
                        className="w-full border border-grey-stroke rounded-lg px-4 py-2 focus:ring-2 focus:ring-sage-500 focus:border-sage-500 text-body-regular bg-white"
                        required
                      >
                        <option value="">Select Service Category</option>
                        {serviceCategories
                          .filter(cat => cat.isActive || cat.IsActive)
                          .map((category) => (
                            <option key={category.id || category.Id} value={category.id || category.Id}>
                              {category.name || category.Name}
                            </option>
                          ))}
                      </select>
                      <p className="text-body-small text-charcoal-400 mt-2">
                        Choose the service category for this service provider
                      </p>
                    </div>
                  )}

                  {/* Role Change Warning */}
                  {isRoleChanging && (
                    <div className="bg-danger-bg border border-danger-btn text-danger-text px-4 py-3 rounded-lg">
                      <p className="text-body-medium font-semibold">⚠️ Warning: Role Change</p>
                      <p className="text-body-regular mt-1">
                        Changing role from <strong>{originalRole}</strong> to <strong>{formData.roleType}</strong> will
                        mark the current user as "Role Changed" and create a new user with the new role.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-grey-stroke flex justify-end gap-3">
                <CRUDButton type="button" variant="error" onClick={handleCancelEdit}>
                  Cancel
                </CRUDButton>
                <CRUDButton type="submit" variant="success">
                  {isRoleChanging ? 'Change Role & Create New User' : 'Update User'}
                </CRUDButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-soft-lift max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="p-6 border-b border-grey-stroke">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-display-h2 text-charcoal-600">Add New User</h3>
                  <p className="text-body-regular text-charcoal-400 mt-1">
                    Create a new user account
                  </p>
                </div>
                <button
                  onClick={handleCancelEdit}
                  className="text-charcoal-400 hover:text-charcoal-600 transition-colors p-2"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Modal Body - Add Form */}
            <form onSubmit={handleSubmit}>
              <div className="p-6">
                <div className="space-y-4">
                  {/* Display Name */}
                  <div className="bg-cream-50 rounded-lg p-4">
                    <label className="block text-body-medium text-charcoal-600 font-semibold mb-2">
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

                  {/* Role Type */}
                  <div className="bg-cream-50 rounded-lg p-4">
                    <label className="block text-body-medium text-charcoal-600 font-semibold mb-2">
                      Role Type
                    </label>
                    <select
                      value={formData.roleType}
                      onChange={(e) => {
                        const newRole = e.target.value;
                        setFormData({
                          ...formData,
                          roleType: newRole,
                          categoryId: '',
                          serviceCategoryId: ''
                        });
                      }}
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

                  {/* Category selection for Sellers */}
                  {formData.roleType === 'Seller' && (
                    <div className="bg-cream-50 rounded-lg p-4">
                      <label className="block text-body-medium text-charcoal-600 font-semibold mb-2">
                        Category <span className="text-danger-text">*</span>
                      </label>
                      <select
                        value={formData.categoryId}
                        onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                        className="w-full border border-grey-stroke rounded-lg px-4 py-2 focus:ring-2 focus:ring-sage-500 focus:border-sage-500 text-body-regular bg-white"
                        required
                      >
                        <option value="">Select Category</option>
                        {categories
                          .filter(cat => cat.isActive || cat.IsActive)
                          .map((category) => (
                            <option key={category.id || category.Id} value={category.id || category.Id}>
                              {category.name || category.Name}
                            </option>
                          ))}
                      </select>
                      <p className="text-body-small text-charcoal-400 mt-2">
                        Choose the main category for this seller's store
                      </p>
                    </div>
                  )}

                  {/* Service Category selection for Service Providers */}
                  {formData.roleType === 'ServiceProvider' && (
                    <div className="bg-cream-50 rounded-lg p-4">
                      <label className="block text-body-medium text-charcoal-600 font-semibold mb-2">
                        Service Category <span className="text-danger-text">*</span>
                      </label>
                      <select
                        value={formData.serviceCategoryId}
                        onChange={(e) => setFormData({ ...formData, serviceCategoryId: e.target.value })}
                        className="w-full border border-grey-stroke rounded-lg px-4 py-2 focus:ring-2 focus:ring-sage-500 focus:border-sage-500 text-body-regular bg-white"
                        required
                      >
                        <option value="">Select Service Category</option>
                        {serviceCategories
                          .filter(cat => cat.isActive || cat.IsActive)
                          .map((category) => (
                            <option key={category.id || category.Id} value={category.id || category.Id}>
                              {category.name || category.Name}
                            </option>
                          ))}
                      </select>
                      <p className="text-body-small text-charcoal-400 mt-2">
                        Choose the service category for this service provider
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-grey-stroke flex justify-end gap-3">
                <CRUDButton type="button" variant="error" onClick={handleCancelEdit}>
                  Cancel
                </CRUDButton>
                <CRUDButton type="submit" variant="success">
                  Create User
                </CRUDButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        message={snackbar.message}
        type={snackbar.type}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      />

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        variant={confirmModal.variant}
        onConfirm={confirmModal.onConfirm}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
      />
      </>
    );
  };

  // If renderContentOnly is true, return just the content
  if (renderContentOnly) {
    return renderContent();
  }

  // Otherwise, render full page with sidebar and header
  if (loading) {
    return (
      <div className="flex min-h-screen bg-cream-50">
        <AdminSidebar currentPage="users" onNavigate={onNavigate} />
        <div className="flex-1 ml-[250px] flex flex-col">
          <PageHeader
            title="User Management"
            notificationCount={notificationCount}
            userName={displayName}
            userRole="Super Admin"
            userProfile={userProfile}
            entityId={null}
            userId={adminUserProfileId}
            onProfileUpdate={handleProfileUpdate}
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
      <div className="flex-1 ml-[250px] flex flex-col">
        <PageHeader
          title="User Management"
          withSearch={true}
          searchPlaceholder="Search by name or role..."
          onSearch={(value) => setSearchTerm(value)}
          notificationCount={notificationCount}
          userName={displayName}
          userRole="Super Admin"
          userProfile={userProfile}
          entityId={null}
          userId={adminUserProfileId}
          onProfileUpdate={handleProfileUpdate}
        />
        <main className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto space-y-8">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default UserManagement;
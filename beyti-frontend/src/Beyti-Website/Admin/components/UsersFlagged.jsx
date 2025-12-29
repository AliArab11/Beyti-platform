/**
 * Flagged Users Management Page
 * 
 * Manages users with policy violations and suspensions
 * Features: View flagged users, suspended users, violations, warn, suspend, reactivate
 */

import React, { useEffect, useState } from 'react';
import {
  Warning,
  X,
  Eye,
  ShieldWarning,
  Prohibit,
  CheckCircle
} from '@phosphor-icons/react';
import {
  getFlaggedUsers,
  getUserViolations,
  suspendUser,
  reactivateUser,
  warnUser,
  getUserProfile,
  updateUserProfile
} from '../../../services/api';
import { logAdminActivity } from '../../../utils/adminActivityLogger';

// Import design system components
import AnalyticsCard from '../../../components/AnalyticsCard';
import CRUDButton from '../../../components/CRUDButton';
import StatusChip from '../../../components/StatusChip';
import PageHeader from '../../../components/PageHeader';
import AdminSidebar from './AdminSidebar';
import Snackbar from '../../../components/Snackbar';
import ConfirmModal from '../../../components/ConfirmModal';

const UsersFlagged = ({ onNavigate, adminUserProfileId, renderContentOnly = false }) => {
  const [flaggedData, setFlaggedData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [violations, setViolations] = useState([]);
  const [loadingViolations, setLoadingViolations] = useState(false);
  const [activeSection, setActiveSection] = useState('flagged'); // flagged, suspended
  const [notificationCount] = useState(0); // Placeholder

  // User profile state
  const [userProfile, setUserProfile] = useState(null);
  const [displayName, setDisplayName] = useState("Admin User");

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

  // Input modal state for prompts (warn/suspend reasons)
  const [inputModal, setInputModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    placeholder: '',
    onConfirm: (value) => {},
    inputValue: ''
  });

  const fetchFlaggedUsers = async () => {
    try {
      setLoading(true);
      const data = await getFlaggedUsers();
      setFlaggedData(data);
    } catch (err) {
      console.error('Error fetching flagged users:', err);
    } finally {
      setLoading(false);
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
    fetchFlaggedUsers();
    if (adminUserProfileId) {
      fetchUserProfile();
    }
  }, [adminUserProfileId]);

  // Auto-close snackbar after 5 seconds
  useEffect(() => {
    if (snackbar.open) {
      const timer = setTimeout(() => {
        setSnackbar({ ...snackbar, open: false });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [snackbar.open]);

  const handleViewDetails = async (user) => {
    try {
      setLoadingViolations(true);
      setSelectedUser(user);
      setShowDetailsModal(true);
      const data = await getUserViolations(user.userId);
      setViolations(data.violations);
    } catch (err) {
      console.error('Error fetching violations:', err);
      setSnackbar({
        open: true,
        message: 'Error loading violations. Please try again.',
        type: 'error'
      });
      setShowDetailsModal(false);
    } finally {
      setLoadingViolations(false);
    }
  };

  const handleCloseModal = () => {
    setShowDetailsModal(false);
    setSelectedUser(null);
    setViolations([]);
  };

  const handleSuspendUser = (userId, userName) => {
    setInputModal({
      isOpen: true,
      title: `Suspend ${userName}`,
      message: 'Enter the reason for suspending this user:',
      placeholder: 'Reason for suspension...',
      inputValue: '',
      onConfirm: (reason) => {
        if (reason.trim()) {
          setInputModal({ ...inputModal, isOpen: false });
          setConfirmModal({
            isOpen: true,
            title: 'Confirm Suspension',
            message: `Are you sure you want to suspend ${userName}? This will deactivate all their products/services.`,
            variant: 'danger',
            onConfirm: async () => {
              try {
                await suspendUser(userId, reason, adminUserProfileId);

                // Log the admin activity
                logAdminActivity(
                  'suspension',
                  'User Account Suspended',
                  userName
                );

                setConfirmModal({ ...confirmModal, isOpen: false });
                setSnackbar({
                  open: true,
                  message: 'User suspended successfully!',
                  type: 'success'
                });
                handleCloseModal();
                fetchFlaggedUsers();
              } catch (err) {
                console.error('Error suspending user:', err);
                setConfirmModal({ ...confirmModal, isOpen: false });
                setSnackbar({
                  open: true,
                  message: 'Error suspending user. Please try again.',
                  type: 'error'
                });
              }
            }
          });
        }
      }
    });
  };

  const handleReactivateUser = (userId, userName) => {
    setConfirmModal({
      isOpen: true,
      title: 'Reactivate User',
      message: `Are you sure you want to reactivate ${userName}?`,
      variant: 'success',
      onConfirm: async () => {
        try {
          await reactivateUser(userId, adminUserProfileId);

          // Log the admin activity
          logAdminActivity(
            'approval',
            'User Account Reactivated',
            userName
          );

          setConfirmModal({ ...confirmModal, isOpen: false });
          setSnackbar({
            open: true,
            message: 'User reactivated successfully!',
            type: 'success'
          });
          fetchFlaggedUsers();
        } catch (err) {
          console.error('Error reactivating user:', err);
          setConfirmModal({ ...confirmModal, isOpen: false });
          setSnackbar({
            open: true,
            message: 'Error reactivating user. Please try again.',
            type: 'error'
          });
        }
      }
    });
  };

  const handleWarnUser = (userId, userName) => {
    setInputModal({
      isOpen: true,
      title: `Warn ${userName}`,
      message: 'Enter the warning message to send to this user:',
      placeholder: 'Warning message...',
      inputValue: '',
      onConfirm: async (message) => {
        if (message.trim()) {
          try {
            await warnUser(userId, message, adminUserProfileId);

            // Log the admin activity
            logAdminActivity(
              'moderation',
              'Warning Message Sent',
              `to ${userName}`
            );

            setInputModal({ ...inputModal, isOpen: false });
            setSnackbar({
              open: true,
              message: 'Warning sent to user successfully!',
              type: 'success'
            });
          } catch (err) {
            console.error('Error warning user:', err);
            setInputModal({ ...inputModal, isOpen: false });
            setSnackbar({
              open: true,
              message: 'Error sending warning. Please try again.',
              type: 'error'
            });
          }
        }
      }
    });
  };

  // Render main content
  const renderContent = () => {
    if (!flaggedData) {
      return (
        <div className="bg-error-bg border border-error-btn rounded-lg p-4">
          <p className="text-error-text font-semibold">Error loading flagged users</p>
        </div>
      );
    }

    return (
      <>
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <AnalyticsCard
            title="Flagged Sellers"
            metrics={[
              {
                value: flaggedData.sellers.length.toString(),
                label: 'Require Review'
              }
            ]}
          />
          <AnalyticsCard
            title="Flagged Service Providers"
            metrics={[
              {
                value: flaggedData.serviceProviders.length.toString(),
                label: 'Require Review'
              }
            ]}
          />
          <AnalyticsCard
            title="Suspended Users"
            metrics={[
              {
                value: flaggedData.totalSuspended.toString(),
                label: 'Currently Suspended'
              }
            ]}
          />
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-soft-lift">
          <div className="flex border-b border-grey-stroke">
            <button
              onClick={() => setActiveSection('flagged')}
              className={`flex-1 px-6 py-4 font-semibold transition ${
                activeSection === 'flagged'
                  ? 'border-b-2 border-sage-500 text-sage-700 bg-sage-100/30'
                  : 'text-charcoal-400 hover:text-charcoal-600 hover:bg-cream-100'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Warning size={20} weight={activeSection === 'flagged' ? 'fill' : 'regular'} />
                <span>Flagged Users ({flaggedData.totalFlagged})</span>
              </div>
            </button>
            <button
              onClick={() => setActiveSection('suspended')}
              className={`flex-1 px-6 py-4 font-semibold transition ${
                activeSection === 'suspended'
                  ? 'border-b-2 border-error-btn text-error-text bg-error-bg/30'
                  : 'text-charcoal-400 hover:text-charcoal-600 hover:bg-cream-100'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Prohibit size={20} weight={activeSection === 'suspended' ? 'fill' : 'regular'} />
                <span>Suspended Users ({flaggedData.totalSuspended})</span>
              </div>
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Flagged Users Section */}
            {activeSection === 'flagged' && (
              <>
                {flaggedData.totalFlagged === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle size={64} className="text-success-btn mx-auto mb-4" weight="fill" />
                    <p className="text-charcoal-400 text-lg">No flagged users</p>
                    <p className="text-charcoal-400 text-sm mt-2">All users are in good standing</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {[...flaggedData.sellers, ...flaggedData.serviceProviders].map((user) => (
                      <div
                        key={user.userId}
                        className="bg-cream-50 rounded-lg border-l-4 border-error-btn p-6 hover:shadow-soft-lift transition-shadow"
                      >
                        {/* User Header */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-xl font-bold ${
                                user.type === 'Seller' ? 'bg-danger-btn' : 'bg-error-btn'
                              }`}
                            >
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <h3 className="text-card-h2 text-charcoal-600">{user.name}</h3>
                              <p className="text-body-regular text-charcoal-400">
                                {user.type === 'Seller' ? user.storeName : user.businessName}
                              </p>
                            </div>
                          </div>
                          <StatusChip variant={user.type === 'Seller' ? 'danger' : 'error'}>
                            {user.type}
                          </StatusChip>
                        </div>

                        {/* Flag Reason */}
                        <div className="mb-4 p-3 bg-danger-bg border border-danger-btn rounded-lg">
                          <p className="text-body-regular text-danger-text font-semibold">
                            ⚠️ {user.flagReason}
                          </p>
                        </div>

                        {/* Stats for Sellers */}
                        {user.type === 'Seller' && (
                          <div className="grid grid-cols-3 gap-4 mb-4">
                            <div className="text-center p-3 bg-white rounded-lg">
                              <p className="text-metric-h3 text-charcoal-600">{user.totalProducts}</p>
                              <p className="text-label-medium text-charcoal-400">Total</p>
                            </div>
                            <div className="text-center p-3 bg-white rounded-lg">
                              <p className="text-metric-h3 text-error-btn">{user.inactiveProducts}</p>
                              <p className="text-label-medium text-charcoal-400">Inactive</p>
                            </div>
                            {user.inappropriateProducts > 0 && (
                              <div className="text-center p-3 bg-white rounded-lg">
                                <p className="text-metric-h3 text-danger-btn">{user.inappropriateProducts}</p>
                                <p className="text-label-medium text-charcoal-400">Flagged</p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Stats for Service Providers */}
                        {user.type === 'ServiceProvider' && (
                          <div className="mb-4 space-y-2">
                            <div className="p-4 bg-white rounded-lg">
                              <div className="flex justify-between items-center">
                                <span className="text-body-regular text-charcoal-400">Availability:</span>
                                <StatusChip
                                  variant={
                                    user.availabilityStatus === 'Available'
                                      ? 'success'
                                      : user.availabilityStatus === 'Busy'
                                      ? 'danger'
                                      : 'error'
                                  }
                                >
                                  {user.availabilityStatus}
                                </StatusChip>
                              </div>
                            </div>
                            {user.totalServices > 0 && (
                              <div className="grid grid-cols-2 gap-4">
                                <div className="text-center p-3 bg-white rounded-lg">
                                  <p className="text-metric-h3 text-charcoal-600">{user.totalServices}</p>
                                  <p className="text-label-medium text-charcoal-400">Total Services</p>
                                </div>
                                {user.inappropriateServices > 0 && (
                                  <div className="text-center p-3 bg-white rounded-lg">
                                    <p className="text-metric-h3 text-danger-btn">{user.inappropriateServices}</p>
                                    <p className="text-label-medium text-charcoal-400">Flagged</p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {/* User Info */}
                        <div className="text-body-regular text-charcoal-400 mb-4 space-y-1">
                          <p>Phone: {user.phone || 'N/A'}</p>
                          <p>Created: {new Date(user.createdAt).toLocaleDateString()}</p>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                          <CRUDButton
                            variant="success"
                            onClick={() => handleViewDetails(user)}
                            className="flex-1"
                          >
                            <Eye size={16} className="inline mr-1" />
                            View Details
                          </CRUDButton>
                          <CRUDButton
                            variant="danger"
                            onClick={() => handleWarnUser(user.userId, user.name)}
                            className="flex-1"
                          >
                            <ShieldWarning size={16} className="inline mr-1" />
                            Warn
                          </CRUDButton>
                          <CRUDButton
                            variant="error"
                            onClick={() => handleSuspendUser(user.userId, user.name)}
                            className="flex-1"
                          >
                            <Prohibit size={16} className="inline mr-1" />
                            Suspend
                          </CRUDButton>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Suspended Users Section */}
            {activeSection === 'suspended' && (
              <>
                {flaggedData.suspendedUsers.length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle size={64} className="text-success-btn mx-auto mb-4" weight="fill" />
                    <p className="text-charcoal-400 text-lg">No suspended users</p>
                    <p className="text-charcoal-400 text-sm mt-2">All accounts are active</p>
                  </div>
                ) : (
                  <div className="bg-white rounded-lg border border-grey-stroke overflow-hidden">
                    <table className="min-w-full divide-y divide-grey-stroke">
                      <thead className="bg-cream-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-label-medium text-charcoal-600">
                            User
                          </th>
                          <th className="px-6 py-3 text-left text-label-medium text-charcoal-600">
                            Role
                          </th>
                          <th className="px-6 py-3 text-left text-label-medium text-charcoal-600">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-label-medium text-charcoal-600">
                            Suspended Date
                          </th>
                          <th className="px-6 py-3 text-right text-label-medium text-charcoal-600">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-grey-stroke">
                        {flaggedData.suspendedUsers.map((user) => (
                          <tr key={user.userId} className="hover:bg-cream-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="w-10 h-10 bg-error-bg rounded-full flex items-center justify-center">
                                  <span className="text-error-btn font-bold">
                                    {user.name.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <div className="ml-3">
                                  <div className="text-body-medium text-charcoal-600 font-semibold">
                                    {user.name}
                                  </div>
                                  <div className="text-body-regular text-charcoal-400">
                                    ID: {user.userId}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <StatusChip variant="success">{user.roleType}</StatusChip>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <StatusChip variant="error">{user.status}</StatusChip>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-body-regular text-charcoal-400">
                              {new Date(user.updatedAt).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              <CRUDButton
                                variant="success"
                                onClick={() => handleReactivateUser(user.userId, user.name)}
                              >
                                <CheckCircle size={16} className="inline mr-1" />
                                Reactivate
                              </CRUDButton>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </>
    );
  };

  // If renderContentOnly is true, just return the content without sidebar/header
  if (renderContentOnly) {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sage-500"></div>
        </div>
      );
    }
    return (
      <>
        {renderContent()}
        {/* Details Modal */}
        {showDetailsModal && selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-lg shadow-soft-lift max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="p-6 border-b border-grey-stroke">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-display-h2 text-charcoal-600">{selectedUser.name}</h3>
                    <p className="text-body-regular text-charcoal-400 mt-1">
                      {selectedUser.type === 'Seller' ? selectedUser.storeName : selectedUser.businessName}
                    </p>
                    <div className="mt-3 flex gap-2">
                      <StatusChip variant={selectedUser.type === 'Seller' ? 'danger' : 'error'}>
                        {selectedUser.type}
                      </StatusChip>
                      <StatusChip variant="danger">{selectedUser.flagReason}</StatusChip>
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
                {loadingViolations ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sage-500 mx-auto"></div>
                    <p className="text-charcoal-400 mt-4">Loading violations...</p>
                  </div>
                ) : (
                  <>
                    <h4 className="text-card-h2 text-charcoal-600 mb-4">
                      Policy Violations ({violations.length})
                    </h4>

                    {violations.length === 0 ? (
                      <div className="text-center py-8">
                        <CheckCircle size={48} className="text-success-btn mx-auto mb-2" weight="fill" />
                        <p className="text-charcoal-400">No violations found</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {violations.map((violation, index) => (
                          <div
                            key={index}
                            className={`border rounded-lg p-4 ${
                              violation.violationType.includes('Inappropriate')
                                ? 'border-danger-btn bg-danger-bg'
                                : 'border-error-btn bg-error-bg'
                            }`}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <h5 className="text-body-medium text-charcoal-600 font-semibold">
                                {violation.name}
                              </h5>
                              <StatusChip
                                variant={
                                  violation.violationType.includes('Inappropriate') ? 'danger' : 'error'
                                }
                              >
                                {violation.violationType}
                              </StatusChip>
                            </div>
                            {violation.description && (
                              <p className="text-body-regular text-charcoal-400 mb-2">
                                {violation.description}
                              </p>
                            )}
                            {violation.flaggedKeywords && violation.flaggedKeywords.length > 0 && (
                              <div className="mb-2">
                                <p className="text-label-medium text-danger-text mb-1">
                                  Flagged Keywords:
                                </p>
                                <div className="flex flex-wrap gap-1">
                                  {violation.flaggedKeywords.map((keyword, idx) => (
                                    <span
                                      key={idx}
                                      className="px-2 py-1 bg-danger-btn text-white text-label-medium rounded"
                                    >
                                      {keyword}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            {violation.basePrice && (
                              <p className="text-body-regular text-charcoal-400">
                                Price: ${violation.basePrice.toFixed(2)}
                              </p>
                            )}
                            <p className="text-label-medium text-charcoal-400 mt-2">
                              Created: {new Date(violation.createdAt).toLocaleDateString()} |
                              Updated: {new Date(violation.updatedAt).toLocaleDateString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-grey-stroke flex justify-end gap-3">
                <CRUDButton
                  variant="danger"
                  onClick={() => handleWarnUser(selectedUser.userId, selectedUser.name)}
                >
                  <ShieldWarning size={16} className="inline mr-1" />
                  Send Warning
                </CRUDButton>
                <CRUDButton
                  variant="error"
                  onClick={() => handleSuspendUser(selectedUser.userId, selectedUser.name)}
                >
                  <Prohibit size={16} className="inline mr-1" />
                  Suspend User
                </CRUDButton>
              </div>
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

        {/* Input Modal for text inputs (warn/suspend) */}
        {inputModal.isOpen && (
          <div className="fixed inset-0 bg-charcoal-900/50 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
            <div className="bg-cream-50 rounded-2xl shadow-2xl max-w-md w-full">
              <div className="p-6 border-b border-grey-stroke">
                <h3 className="text-card-h2 text-charcoal-600 font-bold">{inputModal.title}</h3>
              </div>
              <div className="p-6">
                <p className="text-body-regular text-charcoal-600 mb-4">{inputModal.message}</p>
                <textarea
                  className="w-full border border-grey-stroke rounded-lg px-4 py-2 focus:ring-2 focus:ring-sage-500 focus:border-sage-500 text-body-regular bg-white resize-none"
                  rows="4"
                  placeholder={inputModal.placeholder}
                  value={inputModal.inputValue}
                  onChange={(e) => setInputModal({ ...inputModal, inputValue: e.target.value })}
                />
              </div>
              <div className="p-6 border-t border-grey-stroke flex gap-3 justify-end">
                <button
                  onClick={() => setInputModal({ ...inputModal, isOpen: false, inputValue: '' })}
                  className="px-6 py-2.5 bg-grey-200 text-charcoal-600 text-button font-semibold rounded-xl hover:bg-grey-300 border border-grey-stroke"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (inputModal.inputValue.trim()) {
                      inputModal.onConfirm(inputModal.inputValue);
                    }
                  }}
                  className="px-6 py-2.5 bg-sage-500 hover:bg-sage-600 text-white text-button font-semibold rounded-xl shadow-soft-lift"
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // Full page render with sidebar and header (standalone mode)
  if (loading) {
    return (
      <div className="flex min-h-screen bg-cream-50">
        <AdminSidebar currentPage="flagged-users" onNavigate={onNavigate} />

        {/* Main Content - Loading */}
        <div className="flex-1 ml-[250px] flex flex-col">
          <PageHeader
            title="User Moderation"
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
      <AdminSidebar currentPage="flagged-users" onNavigate={onNavigate} />

      {/* Main Content */}
      <div className="flex-1 ml-[250px] flex flex-col">
        {/* Header */}
        <PageHeader
          title="User Moderation"
          notificationCount={notificationCount}
          userName={displayName}
          userRole="Super Admin"
          userProfile={userProfile}
          entityId={null}
          userId={adminUserProfileId}
          onProfileUpdate={handleProfileUpdate}
        />

        {/* Main Content Area */}
        <main className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto space-y-8">
            {renderContent()}
          </div>
        </main>
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-soft-lift max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="p-6 border-b border-grey-stroke">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-display-h2 text-charcoal-600">{selectedUser.name}</h3>
                  <p className="text-body-regular text-charcoal-400 mt-1">
                    {selectedUser.type === 'Seller' ? selectedUser.storeName : selectedUser.businessName}
                  </p>
                  <div className="mt-3 flex gap-2">
                    <StatusChip variant={selectedUser.type === 'Seller' ? 'danger' : 'error'}>
                      {selectedUser.type}
                    </StatusChip>
                    <StatusChip variant="danger">{selectedUser.flagReason}</StatusChip>
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
              {loadingViolations ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sage-500 mx-auto"></div>
                  <p className="text-charcoal-400 mt-4">Loading violations...</p>
                </div>
              ) : (
                <>
                  <h4 className="text-card-h2 text-charcoal-600 mb-4">
                    Policy Violations ({violations.length})
                  </h4>

                  {violations.length === 0 ? (
                    <div className="text-center py-8">
                      <CheckCircle size={48} className="text-success-btn mx-auto mb-2" weight="fill" />
                      <p className="text-charcoal-400">No violations found</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {violations.map((violation, index) => (
                        <div
                          key={index}
                          className={`border rounded-lg p-4 ${
                            violation.violationType.includes('Inappropriate')
                              ? 'border-danger-btn bg-danger-bg'
                              : 'border-error-btn bg-error-bg'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <h5 className="text-body-medium text-charcoal-600 font-semibold">
                              {violation.name}
                            </h5>
                            <StatusChip
                              variant={
                                violation.violationType.includes('Inappropriate') ? 'danger' : 'error'
                              }
                            >
                              {violation.violationType}
                            </StatusChip>
                          </div>
                          {violation.description && (
                            <p className="text-body-regular text-charcoal-400 mb-2">
                              {violation.description}
                            </p>
                          )}
                          {violation.flaggedKeywords && violation.flaggedKeywords.length > 0 && (
                            <div className="mb-2">
                              <p className="text-label-medium text-danger-text mb-1">
                                Flagged Keywords:
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {violation.flaggedKeywords.map((keyword, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-1 bg-danger-btn text-white text-label-medium rounded"
                                  >
                                    {keyword}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          {violation.basePrice && (
                            <p className="text-body-regular text-charcoal-400">
                              Price: ${violation.basePrice.toFixed(2)}
                            </p>
                          )}
                          <p className="text-label-medium text-charcoal-400 mt-2">
                            Created: {new Date(violation.createdAt).toLocaleDateString()} |
                            Updated: {new Date(violation.updatedAt).toLocaleDateString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-grey-stroke flex justify-end gap-3">
              <CRUDButton
                variant="danger"
                onClick={() => handleWarnUser(selectedUser.userId, selectedUser.name)}
              >
                <ShieldWarning size={16} className="inline mr-1" />
                Send Warning
              </CRUDButton>
              <CRUDButton
                variant="error"
                onClick={() => handleSuspendUser(selectedUser.userId, selectedUser.name)}
              >
                <Prohibit size={16} className="inline mr-1" />
                Suspend User
              </CRUDButton>
            </div>
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

      {/* Input Modal for text inputs (warn/suspend) */}
      {inputModal.isOpen && (
        <div className="fixed inset-0 bg-charcoal-900/50 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
          <div className="bg-cream-50 rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-6 border-b border-grey-stroke">
              <h3 className="text-card-h2 text-charcoal-600 font-bold">{inputModal.title}</h3>
            </div>
            <div className="p-6">
              <p className="text-body-regular text-charcoal-600 mb-4">{inputModal.message}</p>
              <textarea
                className="w-full border border-grey-stroke rounded-lg px-4 py-2 focus:ring-2 focus:ring-sage-500 focus:border-sage-500 text-body-regular bg-white resize-none"
                rows="4"
                placeholder={inputModal.placeholder}
                value={inputModal.inputValue}
                onChange={(e) => setInputModal({ ...inputModal, inputValue: e.target.value })}
              />
            </div>
            <div className="p-6 border-t border-grey-stroke flex gap-3 justify-end">
              <button
                onClick={() => setInputModal({ ...inputModal, isOpen: false, inputValue: '' })}
                className="px-6 py-2.5 bg-grey-200 text-charcoal-600 text-button font-semibold rounded-xl hover:bg-grey-300 border border-grey-stroke"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (inputModal.inputValue.trim()) {
                    inputModal.onConfirm(inputModal.inputValue);
                  }
                }}
                className="px-6 py-2.5 bg-sage-500 hover:bg-sage-600 text-white text-button font-semibold rounded-xl shadow-soft-lift"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersFlagged;
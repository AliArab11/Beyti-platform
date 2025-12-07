/**
 * Service Moderation Page
 *
 * Manages service catalog listings and moderation
 * Features: View services, view details, suspend/approve services, search and filter
 */

import React, { useEffect, useState } from 'react';
import {
  X,
  Eye,
  CheckCircle,
  ProhibitInset,
  Briefcase
} from '@phosphor-icons/react';
import {
  getServicesForModeration,
  getServiceModerationStatistics,
  getServiceDetails,
  approveService,
  suspendService,
  deleteService,
  getUserProfile,
  updateUserProfile
} from '../../../services/api';
import { logAdminActivity } from '../../../utils/adminActivityLogger';

// Import design system components
import AnalyticsCard from '../../../components/AnalyticsCard';
import CRUDButton from '../../../components/CRUDButton';
import StatusChip from '../../../components/StatusChip';
import { Table, TableHeader, TableBody, TableRow } from '../../../components/Table';
import PageHeader from '../../../components/PageHeader';
import AdminSidebar from './AdminSidebar';

const ServiceModeration = ({ onNavigate, adminUserProfileId }) => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, active, inactive
  const [notificationCount] = useState(0);

  // User profile state
  const [userProfile, setUserProfile] = useState(null);
  const [displayName, setDisplayName] = useState("Admin User");

  // Details modal state
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedService, setSelectedService] = useState(null);

  // Suspend modal state
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [suspendReason, setSuspendReason] = useState('');
  const [serviceToSuspend, setServiceToSuspend] = useState(null);

  // Statistics
  const [stats, setStats] = useState({
    totalServices: 0,
    activeServices: 0,
    inactiveServices: 0,
    recentServices: 0
  });

  const fetchStatistics = async () => {
    try {
      const data = await getServiceModerationStatistics();
      setStats(data);
    } catch (err) {
      console.error('Error fetching statistics:', err);
    }
  };

  const fetchServices = async () => {
    try {
      setLoading(true);
      const isActive = filterStatus === 'active' ? true : filterStatus === 'inactive' ? false : null;
      const data = await getServicesForModeration(isActive, searchTerm);
      setServices(data);
    } catch (err) {
      console.error('Error fetching services:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch user profile details
  const fetchUserProfile = async () => {
    // Skip if adminUserProfileId is not provided
    if (!adminUserProfileId) {
      console.warn('Admin user profile ID not provided, skipping profile fetch');
      return;
    }

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
    fetchStatistics();
    fetchServices();
    fetchUserProfile();
  }, [filterStatus]);

  // View service details
  const handleViewDetails = async (serviceId) => {
    try {
      const details = await getServiceDetails(serviceId);
      setSelectedService(details);
      setShowDetailsModal(true);
    } catch (err) {
      console.error('Error fetching service details:', err);
      alert('Error loading service details');
    }
  };

  // Approve service
  const handleApprove = async (serviceId) => {
    if (window.confirm('Are you sure you want to approve this service?')) {
      try {
        const service = services.find(s => s.id === serviceId);
        await approveService(serviceId, adminUserProfileId);

        // Log the admin activity
        logAdminActivity(
          'approval',
          'Approved Service',
          service?.name || `Service #${serviceId}`
        );

        alert('Service approved successfully!');
        fetchServices();
        fetchStatistics();
        if (showDetailsModal) {
          setShowDetailsModal(false);
        }
      } catch (err) {
        console.error('Error approving service:', err);
        alert('Error approving service');
      }
    }
  };

  // Open suspend modal
  const handleOpenSuspendModal = (service) => {
    setServiceToSuspend(service);
    setSuspendReason('');
    setShowSuspendModal(true);
  };

  // Suspend service
  const handleSuspend = async () => {
    if (!suspendReason.trim()) {
      alert('Please provide a reason for suspension');
      return;
    }

    try {
      await suspendService(serviceToSuspend.id, suspendReason, adminUserProfileId);

      // Log the admin activity
      logAdminActivity(
        'suspension',
        'Suspended Service',
        serviceToSuspend?.name || `Service #${serviceToSuspend.id}`
      );

      alert('Service suspended successfully!');
      setShowSuspendModal(false);
      setServiceToSuspend(null);
      setSuspendReason('');
      fetchServices();
      fetchStatistics();
      if (showDetailsModal) {
        setShowDetailsModal(false);
      }
    } catch (err) {
      console.error('Error suspending service:', err);
      alert('Error suspending service');
    }
  };

  // Delete service
  const handleDelete = async (serviceId) => {
    if (window.confirm('Are you sure you want to DELETE this service? This action cannot be undone!')) {
      try {
        const service = services.find(s => s.id === serviceId);
        await deleteService(serviceId);

        // Log the admin activity
        logAdminActivity(
          'moderation',
          'Deleted Service',
          service?.name || `Service #${serviceId}`
        );

        alert('Service deleted successfully!');
        fetchServices();
        fetchStatistics();
        if (showDetailsModal) {
          setShowDetailsModal(false);
        }
      } catch (err) {
        console.error('Error deleting service:', err);
        alert('Error deleting service');
      }
    }
  };

  // Filter services based on search
  const getFilteredServices = () => {
    if (!searchTerm) return services;

    return services.filter(service =>
      service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (service.description && service.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  };

  const filteredServices = getFilteredServices();

  if (loading && services.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sage-500"></div>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <AnalyticsCard
                title="Total Services"
                metrics={[
                  {
                    value: loading ? '...' : stats.totalServices.toString(),
                    label: 'All Services'
                  }
                ]}
              />
              <AnalyticsCard
                title="Active Services"
                metrics={[
                  {
                    value: loading ? '...' : stats.activeServices.toString(),
                    label: 'Currently Active'
                  }
                ]}
              />
              <AnalyticsCard
                title="Inactive Services"
                metrics={[
                  {
                    value: loading ? '...' : stats.inactiveServices.toString(),
                    label: 'Suspended/Inactive'
                  }
                ]}
              />
              <AnalyticsCard
                title="Recent Services"
                metrics={[
                  {
                    value: loading ? '...' : stats.recentServices.toString(),
                    label: 'Last 7 Days'
                  }
                ]}
              />
            </div>

            {/* Services Table */}
            <div className="bg-grey-200 dark:bg-[#2A2A2A] rounded-lg shadow-soft-lift dark:shadow-none transition-colors">
              <div className="p-6 border-b border-grey-stroke dark:border-charcoal-500">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <h2 className="text-card-h2 text-charcoal-600 dark:text-white">Services Management</h2>
                  <div className="flex gap-2">
                    <CRUDButton
                      variant={filterStatus === 'all' ? 'success' : 'neutral'}
                      onClick={() => setFilterStatus('all')}
                    >
                      All
                    </CRUDButton>
                    <CRUDButton
                      variant={filterStatus === 'active' ? 'success' : 'neutral'}
                      onClick={() => setFilterStatus('active')}
                    >
                      Active
                    </CRUDButton>
                    <CRUDButton
                      variant={filterStatus === 'inactive' ? 'error' : 'neutral'}
                      onClick={() => setFilterStatus('inactive')}
                    >
                      Inactive
                    </CRUDButton>
                  </div>
                </div>
              </div>

              <div className="p-6">
                {/* Services List */}
                {filteredServices.length === 0 ? (
                  <div className="text-center py-12">
                    <Briefcase size={64} className="text-charcoal-300 mx-auto mb-4" weight="fill" />
                    <p className="text-charcoal-400 text-lg">No services found</p>
                    <p className="text-charcoal-400 text-sm mt-2">Try adjusting your search or filters</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader
                      columns={[
                        'Service ID',
                        'Service Name',
                        'Category',
                        'Price Range',
                        'Duration',
                        'Status',
                        'Created',
                        'Actions'
                      ]}
                    />
                    <TableBody>
                      {filteredServices.map((service) => (
                        <TableRow
                          key={service.id}
                          data={[
                            service.id,
                            <div>
                              <div className="font-semibold text-charcoal-600">{service.name}</div>
                              <div className="text-label-medium text-charcoal-400 truncate max-w-xs">
                                {service.description || 'No description'}
                              </div>
                            </div>,
                            <div>
                              <div className="text-charcoal-600">{service.category}</div>
                              <div className="text-label-medium text-charcoal-400">{service.subCategory}</div>
                            </div>,
                            <span className="font-semibold text-charcoal-600">
                              ${service.minPrice != null ? service.minPrice.toFixed(2) : '0.00'} -
                              ${service.maxPrice != null ? service.maxPrice.toFixed(2) : '0.00'}
                            </span>,
                            <span className="text-charcoal-600">
                              {service.estimatedDuration ? `${service.estimatedDuration} mins` : 'N/A'}
                            </span>,
                            <StatusChip variant={service.isActive ? 'success' : 'error'}>
                              {service.isActive ? 'Active' : 'Inactive'}
                            </StatusChip>,
                            new Date(service.createdAt).toLocaleDateString()
                          ]}
                          actions={
                            <>
                              <CRUDButton
                                variant="success"
                                onClick={() => handleViewDetails(service.id)}
                              >
                                <Eye size={16} className="inline mr-1" />
                                View
                              </CRUDButton>
                              {service.isActive ? (
                                <CRUDButton
                                  variant="error"
                                  onClick={() => handleOpenSuspendModal(service)}
                                >
                                  <ProhibitInset size={16} className="inline mr-1" />
                                  Suspend
                                </CRUDButton>
                              ) : (
                                <CRUDButton
                                  variant="success"
                                  onClick={() => handleApprove(service.id)}
                                >
                                  <CheckCircle size={16} className="inline mr-1" />
                                  Approve
                                </CRUDButton>
                              )}
                            </>
                          }
                        />
                      ))}
                    </TableBody>
                  </Table>
                )}
            </div>
          </div>
        </div>

      {/* Service Details Modal */}
      {showDetailsModal && selectedService && (
        <div className="fixed inset-0 bg-charcoal-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-grey-200 dark:bg-[#2A2A2A] rounded-lg shadow-soft-lift max-w-3xl w-full max-h-[90vh] overflow-y-auto transition-colors">
            {/* Modal Header */}
            <div className="p-6 border-b border-grey-stroke dark:border-charcoal-500">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-display-h2 text-charcoal-600 dark:text-white">{selectedService.name}</h3>
                  <p className="text-body-regular text-charcoal-400 dark:text-gray-400 mt-1">
                    Service ID: {selectedService.id}
                  </p>
                  <div className="mt-3">
                    <StatusChip variant={selectedService.isActive ? 'success' : 'error'}>
                      {selectedService.isActive ? 'Active' : 'Inactive'}
                    </StatusChip>
                  </div>
                </div>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-charcoal-400 hover:text-charcoal-600 transition-colors p-2"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <h4 className="text-card-h2 text-charcoal-600 dark:text-white mb-4">Service Details</h4>

              <div className="space-y-4">
                {/* Description */}
                <div className="bg-cream-50 rounded-lg p-4">
                  <h5 className="text-body-medium text-charcoal-600 font-semibold mb-2">
                    Description
                  </h5>
                  <p className="text-body-regular text-charcoal-600">
                    {selectedService.description || 'No description provided'}
                  </p>
                </div>

                {/* Category Info */}
                <div className="bg-cream-50 rounded-lg p-4">
                  <h5 className="text-body-medium text-charcoal-600 font-semibold mb-3">
                    Category Information
                  </h5>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-body-regular text-charcoal-400">Category:</span>
                      <span className="text-body-regular text-charcoal-600 font-semibold">
                        {selectedService.category}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-body-regular text-charcoal-400">SubCategory:</span>
                      <span className="text-body-regular text-charcoal-600">
                        {selectedService.subCategory}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Pricing and Duration */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-cream-50 rounded-lg p-4">
                    <h5 className="text-body-medium text-charcoal-600 font-semibold mb-3">
                      Pricing
                    </h5>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-body-regular text-charcoal-400">Min Price:</span>
                        <span className="text-body-medium text-sage-700 font-bold">
                          ${selectedService.minPrice != null ? selectedService.minPrice.toFixed(2) : '0.00'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-body-regular text-charcoal-400">Max Price:</span>
                        <span className="text-body-medium text-sage-700 font-bold">
                          ${selectedService.maxPrice != null ? selectedService.maxPrice.toFixed(2) : '0.00'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-cream-50 rounded-lg p-4">
                    <h5 className="text-body-medium text-charcoal-600 font-semibold mb-3">
                      Duration
                    </h5>
                    <div className="flex justify-between items-center">
                      <span className="text-body-regular text-charcoal-400">Estimated Time:</span>
                      <span className="text-body-medium text-charcoal-600 font-bold">
                        {selectedService.estimatedDuration ? `${selectedService.estimatedDuration} minutes` : 'Not specified'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Dates */}
                <div className="bg-cream-50 rounded-lg p-4">
                  <h5 className="text-body-medium text-charcoal-600 font-semibold mb-3">
                    Timeline
                  </h5>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-body-regular text-charcoal-400">Created At:</span>
                      <span className="text-body-regular text-charcoal-600">
                        {new Date(selectedService.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-grey-stroke flex justify-end gap-3">
              <CRUDButton variant="error" onClick={() => setShowDetailsModal(false)}>
                Close
              </CRUDButton>
              {selectedService.isActive ? (
                <CRUDButton
                  variant="error"
                  onClick={() => {
                    setShowDetailsModal(false);
                    handleOpenSuspendModal(selectedService);
                  }}
                >
                  <ProhibitInset size={16} className="inline mr-1" />
                  Suspend Service
                </CRUDButton>
              ) : (
                <CRUDButton
                  variant="success"
                  onClick={() => handleApprove(selectedService.id)}
                >
                  <CheckCircle size={16} className="inline mr-1" />
                  Approve Service
                </CRUDButton>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Suspend Modal */}
      {showSuspendModal && serviceToSuspend && (
        <div className="fixed inset-0 bg-charcoal-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-grey-200 dark:bg-[#2A2A2A] rounded-lg shadow-soft-lift max-w-md w-full transition-colors">
            {/* Modal Header */}
            <div className="p-6 border-b border-grey-stroke dark:border-charcoal-500">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-display-h2 text-charcoal-600 dark:text-white">Suspend Service</h3>
                  <p className="text-body-regular text-charcoal-400 dark:text-gray-400 mt-1">
                    {serviceToSuspend.name}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowSuspendModal(false);
                    setServiceToSuspend(null);
                    setSuspendReason('');
                  }}
                  className="text-charcoal-400 hover:text-charcoal-600 transition-colors p-2"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <label className="block text-body-regular text-charcoal-600 dark:text-white font-semibold mb-2">
                Reason for Suspension *
              </label>
              <textarea
                placeholder="Enter the reason for suspending this service..."
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                className="w-full border border-grey-stroke rounded-lg px-4 py-2 focus:ring-2 focus:ring-sage-500 focus:border-sage-500 text-body-regular bg-white min-h-[120px]"
                required
              />
              <p className="text-label-medium text-charcoal-400 dark:text-gray-500 mt-2">
                This reason will be recorded and the service will be marked as inactive.
              </p>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-grey-stroke flex justify-end gap-3">
              <CRUDButton
                variant="error"
                onClick={() => {
                  setShowSuspendModal(false);
                  setServiceToSuspend(null);
                  setSuspendReason('');
                }}
              >
                Cancel
              </CRUDButton>
              <CRUDButton
                variant="success"
                onClick={handleSuspend}
              >
                <ProhibitInset size={16} className="inline mr-1" />
                Suspend Service
              </CRUDButton>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ServiceModeration;

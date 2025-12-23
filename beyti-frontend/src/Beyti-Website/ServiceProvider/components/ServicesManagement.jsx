import { useEffect, useState } from 'react';
import {
  getMyServices,
  getProviderCategories,
  addService,
  updateService,
  toggleServiceStatus,
  checkFlaggedKeywords
} from '../../../services/api';
import CRUDButton from '../../../components/CRUDButton';
import StatusChip from '../../../components/StatusChip';
import { Table, TableHeader, TableBody, TableRow } from '../../../components/Table';
import { logProviderActivity } from '../../../utils/providerActivityLogger';
import Snackbar from '../../../components/Snackbar';
import ConfirmModal from '../../../components/ConfirmModal';

export default function ServicesManagement({ serviceProviderId, searchTerm = '' }) {
  const [services, setServices] = useState([]);
  const [providerCategory, setProviderCategory] = useState(null);
  const [serviceCatalogs, setServiceCatalogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'active', 'inactive'
  const [priceFilter, setPriceFilter] = useState('all'); // 'all', 'low', 'medium', 'high'
  const [formData, setFormData] = useState({
    name: '',
    serviceCategoryId: '', // This will be serviceCatalogId
    description: '',
    minPrice: '',
    maxPrice: '',
    estimatedDuration: '',
    durationHours: '',
    durationMinutes: ''
  });
  const [flaggedKeywords, setFlaggedKeywords] = useState([]);
  const [showWarning, setShowWarning] = useState(false);
  const [priceError, setPriceError] = useState('');

  // Snackbar state
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    type: 'success'
  });

  // Confirm modal state
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    variant: 'danger'
  });

  // Helper functions for snackbar
  const showSnackbar = (message, type = 'success') => {
    setSnackbar({ open: true, message, type });
    setTimeout(() => {
      setSnackbar(prev => ({ ...prev, open: false }));
    }, 3000);
  };

  const closeSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // Helper functions for confirm modal
  const showConfirmModal = (title, message, onConfirm, variant = 'danger') => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      onConfirm,
      variant
    });
  };

  const closeConfirmModal = () => {
    setConfirmModal({
      isOpen: false,
      title: '',
      message: '',
      onConfirm: null,
      variant: 'danger'
    });
  };

  const fetchServices = async () => {
    try {
      setLoading(true);
      const data = await getMyServices(serviceProviderId);
      setServices(data);
    } catch (err) {
      console.error('Error fetching services:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      // Fetch only the catalogs for the provider's enrolled category
      const data = await getProviderCategories(serviceProviderId);
      setProviderCategory(data);

      // Map ServiceCatalogs for the dropdown - only from provider's category
      const catalogs = data.serviceCatalogs?.map(sc => ({
        id: sc.id,
        name: sc.name,
        categoryName: data.name
      })) || [];

      setServiceCatalogs(catalogs);
    } catch (err) {
      console.error('Error fetching categories:', err);
      // If provider is not enrolled in any category, show error
      if (err.status === 404) {
        showSnackbar('You are not enrolled in any service category. Please contact support.', 'error');
      }
    }
  };

  useEffect(() => {
    fetchServices();
    fetchCategories();
  }, [serviceProviderId]);

  // Check for flagged keywords whenever name or description changes
  useEffect(() => {
    const checkKeywords = async () => {
      const textToCheck = `${formData.name} ${formData.description}`.trim();
      if (textToCheck) {
        try {
          const result = await checkFlaggedKeywords(textToCheck);
          if (result.flaggedKeywords && result.flaggedKeywords.length > 0) {
            setFlaggedKeywords(result.flaggedKeywords);
            setShowWarning(true);
          } else {
            setFlaggedKeywords([]);
            setShowWarning(false);
          }
        } catch (err) {
          console.error('Error checking flagged keywords:', err);
        }
      } else {
        setFlaggedKeywords([]);
        setShowWarning(false);
      }
    };

    // Debounce the keyword check
    const timer = setTimeout(() => {
      checkKeywords();
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.name, formData.description]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate price range
    const minPrice = formData.minPrice ? parseFloat(formData.minPrice) : null;
    const maxPrice = formData.maxPrice ? parseFloat(formData.maxPrice) : null;

    if (minPrice !== null && maxPrice !== null && minPrice > maxPrice) {
      setPriceError('Minimum price must be less than or equal to maximum price');
      showSnackbar('Error: Minimum price must be less than or equal to maximum price', 'error');
      return;
    }

    // Clear price error if validation passes
    setPriceError('');

    // Warn user if flagged keywords detected
    if (flaggedKeywords.length > 0) {
      showConfirmModal(
        'Prohibited Keywords Detected',
        `Warning: Your service contains prohibited keywords (${flaggedKeywords.join(', ')}). This may result in your service being flagged or suspended. Do you want to proceed anyway?`,
        () => {
          closeConfirmModal();
          submitService();
        },
        'warning'
      );
      return;
    }

    submitService();
  };

  const submitService = async () => {
    // Calculate total duration in minutes from hours and minutes
    const hours = formData.durationHours ? parseInt(formData.durationHours) : 0;
    const minutes = formData.durationMinutes ? parseInt(formData.durationMinutes) : 0;
    const totalMinutes = (hours * 60) + minutes;

    // Get price values
    const minPrice = formData.minPrice ? parseFloat(formData.minPrice) : null;
    const maxPrice = formData.maxPrice ? parseFloat(formData.maxPrice) : null;

    try {
      if (editingService) {
        const updateData = {
          serviceCategoryId: parseInt(formData.serviceCategoryId),
          name: formData.name,
          description: formData.description || null,
          minPrice: minPrice,
          maxPrice: maxPrice,
          estimatedDuration: totalMinutes > 0 ? totalMinutes : null
        };
        await updateService(editingService.serviceId, updateData);

        // Log activity
        logProviderActivity(
          serviceProviderId,
          'service',
          'Updated Service',
          `Service: ${formData.name}`
        );

        showSnackbar('Service updated successfully!', 'success');
      } else {
        const addData = {
          serviceProviderId,
          serviceCategoryId: parseInt(formData.serviceCategoryId),
          name: formData.name,
          description: formData.description || null,
          minPrice: minPrice,
          maxPrice: maxPrice,
          estimatedDuration: totalMinutes > 0 ? totalMinutes : null
        };
        await addService(addData);

        // Log activity
        logProviderActivity(
          serviceProviderId,
          'service',
          'Created New Service',
          `Service: ${formData.name}`
        );

        showSnackbar('Service added successfully!', 'success');
      }

      setFormData({
        name: '',
        serviceCategoryId: '',
        description: '',
        minPrice: '',
        maxPrice: '',
        estimatedDuration: '',
        durationHours: '',
        durationMinutes: ''
      });
      setPriceError('');
      setShowForm(false);
      setEditingService(null);
      setFlaggedKeywords([]);
      setShowWarning(false);
      fetchServices();
    } catch (err) {
      console.error('Error saving service:', err);

      // Show specific error message if it's a category authorization error
      if (err.error === 'Unauthorized category' || err.message?.includes('category')) {
        showSnackbar(err.message || 'You can only add services from your enrolled category.', 'error');
      } else {
        showSnackbar('Error saving service. Check console for details.', 'error');
      }
    }
  };

  const handleEdit = (service) => {
    setEditingService(service);

    // Convert total minutes back to hours and minutes
    const totalMinutes = service.estimatedDuration || 0;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    setFormData({
      name: service.name,
      serviceCategoryId: service.serviceCatalogId,
      description: service.description || '',
      minPrice: service.minPrice || '',
      maxPrice: service.maxPrice || '',
      estimatedDuration: service.estimatedDuration || '',
      durationHours: hours > 0 ? hours : '',
      durationMinutes: minutes > 0 ? minutes : ''
    });
    setPriceError('');
    setShowForm(true);
  };

  const handleToggle = (serviceId) => {
    const service = services.find(s => s.serviceId === serviceId);
    const action = service?.isActive ? 'deactivate' : 'activate';
    const actionTitle = service?.isActive ? 'Deactivate Service' : 'Activate Service';

    showConfirmModal(
      actionTitle,
      `Are you sure you want to ${action} "${service?.name}"?`,
      () => {
        closeConfirmModal();
        performToggle(serviceId, service);
      },
      service?.isActive ? 'warning' : 'success'
    );
  };

  const performToggle = async (serviceId, service) => {
    try {
      await toggleServiceStatus(serviceId);

      // Log activity
      logProviderActivity(
        serviceProviderId,
        'service',
        service?.isActive ? 'Deactivated Service' : 'Activated Service',
        `Service: ${service?.name || 'N/A'}`
      );

      fetchServices();

      // Show success message
      const successMessage = service?.isActive
        ? `Service "${service?.name}" has been deactivated successfully!`
        : `Service "${service?.name}" has been activated successfully!`;
      showSnackbar(successMessage, 'success');
    } catch (err) {
      console.error('Error toggling service:', err);
      showSnackbar('Error toggling service status', 'error');
    }
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingService(null);
    setFormData({
      name: '',
      serviceCategoryId: '',
      description: '',
      minPrice: '',
      maxPrice: '',
      estimatedDuration: '',
      durationHours: '',
      durationMinutes: ''
    });
    setPriceError('');
    setFlaggedKeywords([]);
    setShowWarning(false);
  };

  // Calculate statistics
  const statistics = {
    total: services.length,
    active: services.filter(s => s.isActive).length,
    inactive: services.filter(s => !s.isActive).length
  };

  // Filter services by search term, status, and price
  const getFilteredServices = () => {
    let filtered = services;

    // Apply search term filter
    if (searchTerm) {
      filtered = filtered.filter(service =>
        service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter === 'active') {
      filtered = filtered.filter(service => service.isActive);
    } else if (statusFilter === 'inactive') {
      filtered = filtered.filter(service => !service.isActive);
    }

    // Apply price filter
    if (priceFilter !== 'all') {
      filtered = filtered.filter(service => {
        const avgPrice = service.minPrice && service.maxPrice
          ? (service.minPrice + service.maxPrice) / 2
          : service.minPrice || service.maxPrice || 0;

        if (priceFilter === 'low') return avgPrice < 20;
        if (priceFilter === 'medium') return avgPrice >= 20 && avgPrice < 50;
        if (priceFilter === 'high') return avgPrice >= 50;
        return true;
      });
    }

    return filtered;
  };

  const filteredServices = getFilteredServices();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sage-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-grey-200 dark:bg-[#2A2A2A] rounded-lg shadow-soft-lift dark:shadow-none p-6 transition-colors">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-card-h2 text-charcoal-600 dark:text-white">Services Management</h2>
            <p className="text-body-regular text-charcoal-400 dark:text-gray-400 mt-1">
              Manage your service offerings
            </p>
          </div>
          <CRUDButton
            variant={showForm ? 'error' : 'success'}
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? 'Close' : 'Add Service'}
          </CRUDButton>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-grey-200 dark:bg-[#2A2A2A] rounded-lg shadow-soft-lift dark:shadow-none p-6 transition-colors">
          <p className="text-label-medium text-charcoal-400 dark:text-gray-400 mb-1">Total Services</p>
          <p className="text-card-h2 text-charcoal-600 dark:text-white font-bold">{statistics.total}</p>
        </div>
        <div className="bg-grey-200 dark:bg-[#2A2A2A] rounded-lg shadow-soft-lift dark:shadow-none p-6 transition-colors">
          <p className="text-label-medium text-charcoal-400 dark:text-gray-400 mb-1">Active Services</p>
          <p className="text-card-h2 text-sage-600 dark:text-sage-400 font-bold">{statistics.active}</p>
        </div>
        <div className="bg-grey-200 dark:bg-[#2A2A2A] rounded-lg shadow-soft-lift dark:shadow-none p-6 transition-colors">
          <p className="text-label-medium text-charcoal-400 dark:text-gray-400 mb-1">Inactive Services</p>
          <p className="text-card-h2 text-red-600 dark:text-red-400 font-bold">{statistics.inactive}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-grey-200 dark:bg-[#2A2A2A] rounded-lg shadow-soft-lift dark:shadow-none p-6 transition-colors">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-label-medium text-charcoal-600 dark:text-white mb-2">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full border border-grey-stroke rounded-lg px-4 py-2 text-body-regular focus:ring-2 focus:ring-sage-500 focus:border-sage-500 bg-white dark:bg-[#1F1F1F] dark:text-white"
            >
              <option value="all">All Services</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-label-medium text-charcoal-600 dark:text-white mb-2">Price Range</label>
            <select
              value={priceFilter}
              onChange={(e) => setPriceFilter(e.target.value)}
              className="w-full border border-grey-stroke rounded-lg px-4 py-2 text-body-regular focus:ring-2 focus:ring-sage-500 focus:border-sage-500 bg-white dark:bg-[#1F1F1F] dark:text-white"
            >
              <option value="all">All Prices</option>
              <option value="low">Low (Under 20 BHD)</option>
              <option value="medium">Medium (20-50 BHD)</option>
              <option value="high">High (50+ BHD)</option>
            </select>
          </div>
          {(statusFilter !== 'all' || priceFilter !== 'all' || searchTerm) && (
            <div className="flex items-end">
              <CRUDButton
                variant="warning"
                onClick={() => {
                  setStatusFilter('all');
                  setPriceFilter('all');
                }}
              >
                Clear Filters
              </CRUDButton>
            </div>
          )}
        </div>
        {(statusFilter !== 'all' || priceFilter !== 'all' || searchTerm) && (
          <div className="mt-4 text-body-regular text-charcoal-600 dark:text-gray-400">
            Showing {filteredServices.length} of {services.length} services
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-cream-50 dark:bg-[#2A2A2A] rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col border border-grey-stroke">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-grey-stroke flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-charcoal-700 dark:text-white">
                  {editingService ? 'Edit Service' : 'Add New Service'}
                </h3>
                {providerCategory && (
                  <p className="text-sm text-charcoal-400 dark:text-gray-400 mt-1">
                    Your enrolled category: <span className="font-semibold text-sage-600 dark:text-sage-400">{providerCategory.name}</span>
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={handleCancelForm}
                className="text-charcoal-400 hover:text-charcoal-600 dark:text-gray-400 dark:hover:text-gray-200 text-2xl leading-none"
              >
                ×
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <form onSubmit={handleSubmit} className="space-y-4" id="service-form">
            <div>
              <label className="block text-body-medium text-charcoal-600 dark:text-white mb-2">Service Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full border border-grey-stroke rounded-lg px-4 py-2 text-body-regular focus:ring-2 focus:ring-sage-500 focus:border-sage-500 bg-white dark:bg-[#1F1F1F] dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-body-medium text-charcoal-600 dark:text-white mb-2">
                Service Type *
                <span className="text-label-medium text-charcoal-400 dark:text-gray-400 ml-2">
                  (Only from your category: {providerCategory?.name})
                </span>
              </label>
              <select
                value={formData.serviceCategoryId}
                onChange={(e) => setFormData({ ...formData, serviceCategoryId: e.target.value })}
                className="w-full border border-grey-stroke rounded-lg px-4 py-2 text-body-regular focus:ring-2 focus:ring-sage-500 focus:border-sage-500 bg-white dark:bg-[#1F1F1F] dark:text-white"
                required
              >
                <option value="">Select a service type</option>
                {serviceCatalogs.map((catalog) => (
                  <option key={catalog.id} value={catalog.id}>
                    {catalog.name}
                  </option>
                ))}
              </select>
              {serviceCatalogs.length === 0 && (
                <p className="text-label-medium text-red-600 dark:text-red-400 mt-2">
                  No service types available for your category. Please contact support.
                </p>
              )}
            </div>

            <div>
              <label className="block text-body-medium text-charcoal-600 dark:text-white mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full border border-grey-stroke rounded-lg px-4 py-2 text-body-regular focus:ring-2 focus:ring-sage-500 focus:border-sage-500 bg-white dark:bg-[#1F1F1F] dark:text-white resize-none"
                rows="3"
              />
            </div>

            {/* Flagged Keywords Warning */}
            {showWarning && flaggedKeywords.length > 0 && (
              <div className="bg-danger-bg border-l-4 border-danger-btn rounded-lg p-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-danger-btn" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-body-medium text-danger-text font-semibold">
                      Prohibited Content Detected
                    </h3>
                    <div className="mt-2 text-body-regular text-danger-text">
                      <p>Your service contains prohibited keywords that violate our content policy:</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {flaggedKeywords.map((keyword, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-label-medium font-medium bg-danger-btn text-white"
                          >
                            {keyword}
                          </span>
                        ))}
                      </div>
                      <p className="mt-2">
                        Submitting this service may result in automatic flagging, suspension, or account restrictions.
                        Please remove or modify the flagged content before proceeding.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-body-medium text-charcoal-600 dark:text-white mb-2">Min Price (BHD)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.minPrice}
                  onChange={(e) => {
                    setFormData({ ...formData, minPrice: e.target.value });
                    setPriceError('');
                  }}
                  className={`w-full border ${priceError ? 'border-red-500' : 'border-grey-stroke'} rounded-lg px-4 py-2 text-body-regular focus:ring-2 focus:ring-sage-500 focus:border-sage-500 bg-white dark:bg-[#1F1F1F] dark:text-white`}
                />
              </div>

              <div>
                <label className="block text-body-medium text-charcoal-600 dark:text-white mb-2">Max Price (BHD)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.maxPrice}
                  onChange={(e) => {
                    setFormData({ ...formData, maxPrice: e.target.value });
                    setPriceError('');
                  }}
                  className={`w-full border ${priceError ? 'border-red-500' : 'border-grey-stroke'} rounded-lg px-4 py-2 text-body-regular focus:ring-2 focus:ring-sage-500 focus:border-sage-500 bg-white dark:bg-[#1F1F1F] dark:text-white`}
                />
              </div>
            </div>

            {priceError && (
              <p className="text-label-medium text-red-600 dark:text-red-400 mt-2">
                {priceError}
              </p>
            )}

            <div>
              <label className="block text-body-medium text-charcoal-600 dark:text-white mb-2">
                Estimated Duration
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-label-medium text-charcoal-400 dark:text-gray-400 mb-2">Hours</label>
                  <input
                    type="number"
                    min="0"
                    max="24"
                    value={formData.durationHours}
                    onChange={(e) => setFormData({ ...formData, durationHours: e.target.value })}
                    className="w-full border border-grey-stroke rounded-lg px-4 py-2 text-body-regular focus:ring-2 focus:ring-sage-500 focus:border-sage-500 bg-white dark:bg-[#1F1F1F] dark:text-white"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-label-medium text-charcoal-400 dark:text-gray-400 mb-2">Minutes</label>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={formData.durationMinutes}
                    onChange={(e) => setFormData({ ...formData, durationMinutes: e.target.value })}
                    className="w-full border border-grey-stroke rounded-lg px-4 py-2 text-body-regular focus:ring-2 focus:ring-sage-500 focus:border-sage-500 bg-white dark:bg-[#1F1F1F] dark:text-white"
                    placeholder="0"
                  />
                </div>
              </div>
              {(formData.durationHours || formData.durationMinutes) && (
                <p className="text-label-medium text-charcoal-400 dark:text-gray-400 mt-2">
                  Total: {formData.durationHours || 0}h {formData.durationMinutes || 0}m
                  ({((parseInt(formData.durationHours) || 0) * 60) + (parseInt(formData.durationMinutes) || 0)} minutes)
                </p>
              )}
            </div>

              </form>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-grey-stroke bg-grey-100 dark:bg-[#1F1F1F]">
              <div className="flex flex-col md:flex-row gap-3">
                <button
                  type="submit"
                  form="service-form"
                  className="flex-1 bg-sage-500 hover:bg-sage-600 text-cream-50 py-2.5 rounded-lg font-semibold transition-colors"
                >
                  {editingService ? 'Update Service' : 'Add Service'}
                </button>
                <button
                  type="button"
                  onClick={handleCancelForm}
                  className="flex-1 bg-grey-300 hover:bg-grey-400 text-charcoal-700 dark:text-charcoal-600 py-2.5 rounded-lg font-semibold transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Services Table */}
      <div>
        <Table title="Services List">
          <TableHeader
            columns={[
              'Service Name',
              'Category',
              'Price Range',
              'Duration',
              'Status',
              'Actions'
            ]}
          />
          <TableBody>
            {loading ? (
              <TableRow
                data={['Loading...', '', '', '', '', '']}
              />
            ) : filteredServices.length === 0 ? (
              <TableRow
                data={[searchTerm ? 'No services found matching your search' : 'No services added yet', '', '', '', '', '']}
              />
            ) : (
              filteredServices.map((service) => (
                <TableRow
                  key={service.serviceId}
                  data={[
                    <div>
                      <p className="text-body-medium text-charcoal-600 dark:text-white font-semibold">{service.name}</p>
                      {service.description && (
                        <p className="text-label-medium text-charcoal-400 dark:text-gray-400 mt-1">{service.description}</p>
                      )}
                      {service.flaggedKeywords && service.flaggedKeywords.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {service.flaggedKeywords.map((keyword, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center px-2 py-0.5 rounded-full text-label-medium font-medium bg-danger-btn text-white"
                            >
                              {keyword}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>,
                    <span className="text-body-regular text-charcoal-400 dark:text-gray-400">
                      {service.category} / {service.subCategory}
                    </span>,
                    service.minPrice && service.maxPrice ? (
                      <span className="text-body-regular text-charcoal-600 dark:text-white">
                        {service.minPrice} - {service.maxPrice} BHD
                      </span>
                    ) : (
                      <span className="text-body-regular text-charcoal-400 dark:text-gray-400">Not set</span>
                    ),
                    service.estimatedDuration ? (
                      <span className="text-body-regular text-charcoal-600 dark:text-white">
                        {Math.floor(service.estimatedDuration / 60)}h {service.estimatedDuration % 60}m
                      </span>
                    ) : (
                      <span className="text-body-regular text-charcoal-400 dark:text-gray-400">Not set</span>
                    ),
                    <StatusChip variant={service.isActive ? 'success' : 'error'}>
                      {service.isActive ? 'Active' : 'Inactive'}
                    </StatusChip>
                  ]}
                  actions={
                    <>
                      <CRUDButton
                        variant="warning"
                        onClick={() => handleEdit(service)}
                      >
                        Edit
                      </CRUDButton>
                      <CRUDButton
                        variant={service.isActive ? 'error' : 'success'}
                        onClick={() => handleToggle(service.serviceId)}
                      >
                        {service.isActive ? 'Deactivate' : 'Activate'}
                      </CRUDButton>
                    </>
                  }
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        message={snackbar.message}
        type={snackbar.type}
        onClose={closeSnackbar}
      />

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={closeConfirmModal}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        variant={confirmModal.variant}
        confirmText="Proceed"
        cancelText="Cancel"
      />
    </div>
  );
}

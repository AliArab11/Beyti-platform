import { useEffect, useState } from 'react';
import {
  getMyServices,
  getServiceCategories,
  addService,
  updateService,
  toggleServiceStatus
} from '../../../services/api';
import CRUDButton from '../../../components/CRUDButton';
import StatusChip from '../../../components/StatusChip';
import { Table, TableHeader, TableBody, TableRow } from '../../../components/Table';
import { logProviderActivity } from '../../../utils/providerActivityLogger';

export default function ServicesManagement({ serviceProviderId, searchTerm = '' }) {
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'active', 'inactive'
  const [priceFilter, setPriceFilter] = useState('all'); // 'all', 'low', 'medium', 'high'
  const [formData, setFormData] = useState({
    name: '',
    serviceCategoryId: '',
    description: '',
    minPrice: '',
    maxPrice: '',
    estimatedDuration: ''
  });

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
      const data = await getServiceCategories();
      setCategories(data);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  useEffect(() => {
    fetchServices();
    fetchCategories();
  }, [serviceProviderId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingService) {
        const updateData = {
          serviceCategoryId: parseInt(formData.serviceCategoryId),
          name: formData.name,
          description: formData.description || null,
          minPrice: formData.minPrice ? parseFloat(formData.minPrice) : null,
          maxPrice: formData.maxPrice ? parseFloat(formData.maxPrice) : null,
          estimatedDuration: formData.estimatedDuration ? parseInt(formData.estimatedDuration) : null
        };
        await updateService(editingService.serviceCatalogId, updateData);

        // Log activity
        logProviderActivity(
          serviceProviderId,
          'service',
          'Updated Service',
          `Service: ${formData.name}`
        );

        alert('Service updated successfully!');
      } else {
        const addData = {
          serviceProviderId,
          serviceCategoryId: parseInt(formData.serviceCategoryId),
          name: formData.name,
          description: formData.description || null,
          minPrice: formData.minPrice ? parseFloat(formData.minPrice) : null,
          maxPrice: formData.maxPrice ? parseFloat(formData.maxPrice) : null,
          estimatedDuration: formData.estimatedDuration ? parseInt(formData.estimatedDuration) : null
        };
        await addService(addData);

        // Log activity
        logProviderActivity(
          serviceProviderId,
          'service',
          'Created New Service',
          `Service: ${formData.name}`
        );

        alert('Service added successfully!');
      }

      setFormData({
        name: '',
        serviceCategoryId: '',
        description: '',
        minPrice: '',
        maxPrice: '',
        estimatedDuration: ''
      });
      setShowForm(false);
      setEditingService(null);
      fetchServices();
    } catch (err) {
      console.error('Error saving service:', err);
      alert('Error saving service. Check console for details.');
    }
  };

  const handleEdit = (service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      serviceCategoryId: service.categoryId,
      description: service.description || '',
      minPrice: service.minPrice || '',
      maxPrice: service.maxPrice || '',
      estimatedDuration: service.estimatedDuration || ''
    });
    setShowForm(true);
  };

  const handleToggle = async (serviceCatalogId) => {
    try {
      const service = services.find(s => s.serviceCatalogId === serviceCatalogId);
      await toggleServiceStatus(serviceCatalogId);

      // Log activity
      logProviderActivity(
        serviceProviderId,
        'service',
        service?.isActive ? 'Deactivated Service' : 'Activated Service',
        `Service: ${service?.name || 'N/A'}`
      );

      fetchServices();
    } catch (err) {
      console.error('Error toggling service:', err);
      alert('Error toggling service status');
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
      estimatedDuration: ''
    });
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

      {/* Form */}
      {showForm && (
        <div className="bg-grey-200 dark:bg-[#2A2A2A] rounded-lg shadow-soft-lift dark:shadow-none p-6 transition-colors">
          <h3 className="text-card-h2 text-charcoal-600 dark:text-white mb-6">
            {editingService ? 'Edit Service' : 'Add New Service'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-body-medium text-charcoal-600 dark:text-white mb-2">Service Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full border border-grey-stroke rounded-lg px-4 py-2 text-body-regular focus:ring-2 focus:ring-sage-500 focus:border-sage-500"
                required
              />
            </div>

            <div>
              <label className="block text-body-medium text-charcoal-600 dark:text-white mb-2">Category *</label>
              <select
                value={formData.serviceCategoryId}
                onChange={(e) => setFormData({ ...formData, serviceCategoryId: e.target.value })}
                className="w-full border border-grey-stroke rounded-lg px-4 py-2 text-body-regular focus:ring-2 focus:ring-sage-500 focus:border-sage-500"
                required
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-body-medium text-charcoal-600 dark:text-white mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full border border-grey-stroke rounded-lg px-4 py-2 text-body-regular focus:ring-2 focus:ring-sage-500 focus:border-sage-500"
                rows="3"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-body-medium text-charcoal-600 dark:text-white mb-2">Min Price (BHD)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.minPrice}
                  onChange={(e) => setFormData({ ...formData, minPrice: e.target.value })}
                  className="w-full border border-grey-stroke rounded-lg px-4 py-2 text-body-regular focus:ring-2 focus:ring-sage-500 focus:border-sage-500"
                />
              </div>

              <div>
                <label className="block text-body-medium text-charcoal-600 dark:text-white mb-2">Max Price (BHD)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.maxPrice}
                  onChange={(e) => setFormData({ ...formData, maxPrice: e.target.value })}
                  className="w-full border border-grey-stroke rounded-lg px-4 py-2 text-body-regular focus:ring-2 focus:ring-sage-500 focus:border-sage-500"
                />
              </div>

              <div>
                <label className="block text-body-medium text-charcoal-600 dark:text-white mb-2">Duration (minutes)</label>
                <input
                  type="number"
                  value={formData.estimatedDuration}
                  onChange={(e) => setFormData({ ...formData, estimatedDuration: e.target.value })}
                  className="w-full border border-grey-stroke rounded-lg px-4 py-2 text-body-regular focus:ring-2 focus:ring-sage-500 focus:border-sage-500"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <CRUDButton type="submit" variant="success">
                {editingService ? 'Update Service' : 'Add Service'}
              </CRUDButton>
              <CRUDButton type="button" variant="error" onClick={handleCancelForm}>
                Cancel
              </CRUDButton>
            </div>
          </form>
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
                  key={service.serviceCatalogId}
                  data={[
                    <div>
                      <p className="text-body-medium text-charcoal-600 font-semibold">{service.name}</p>
                      {service.description && (
                        <p className="text-label-medium text-charcoal-400 mt-1">{service.description}</p>
                      )}
                    </div>,
                    <span className="text-body-regular text-charcoal-400">
                      {service.category} / {service.subCategory}
                    </span>,
                    service.minPrice && service.maxPrice ? (
                      <span className="text-body-regular text-charcoal-600">
                        {service.minPrice} - {service.maxPrice} BHD
                      </span>
                    ) : (
                      <span className="text-body-regular text-charcoal-400">Not set</span>
                    ),
                    service.estimatedDuration ? (
                      <span className="text-body-regular text-charcoal-600">
                        {service.estimatedDuration} mins
                      </span>
                    ) : (
                      <span className="text-body-regular text-charcoal-400">Not set</span>
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
                        onClick={() => handleToggle(service.serviceCatalogId)}
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
    </div>
  );
}

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
import { MagnifyingGlass } from '@phosphor-icons/react';

export default function ServicesManagement({ serviceProviderId }) {
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    subCategoryId: '',
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
          subCategoryId: parseInt(formData.subCategoryId),
          name: formData.name,
          description: formData.description || null,
          minPrice: formData.minPrice ? parseFloat(formData.minPrice) : null,
          maxPrice: formData.maxPrice ? parseFloat(formData.maxPrice) : null,
          estimatedDuration: formData.estimatedDuration ? parseInt(formData.estimatedDuration) : null
        };
        await updateService(editingService.serviceCatalogId, updateData);
        alert('Service updated successfully!');
      } else {
        const addData = {
          serviceProviderId,
          subCategoryId: parseInt(formData.subCategoryId),
          name: formData.name,
          description: formData.description || null,
          minPrice: formData.minPrice ? parseFloat(formData.minPrice) : null,
          maxPrice: formData.maxPrice ? parseFloat(formData.maxPrice) : null,
          estimatedDuration: formData.estimatedDuration ? parseInt(formData.estimatedDuration) : null
        };
        await addService(addData);
        alert('Service added successfully!');
      }

      setFormData({
        name: '',
        subCategoryId: '',
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
      subCategoryId: service.subCategoryId,
      description: service.description || '',
      minPrice: service.minPrice || '',
      maxPrice: service.maxPrice || '',
      estimatedDuration: service.estimatedDuration || ''
    });
    setShowForm(true);
  };

  const handleToggle = async (serviceCatalogId) => {
    try {
      await toggleServiceStatus(serviceCatalogId);
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
      subCategoryId: '',
      description: '',
      minPrice: '',
      maxPrice: '',
      estimatedDuration: ''
    });
  };

  // Filter services by search term
  const getFilteredServices = () => {
    if (!searchTerm) {
      return services;
    }

    return services.filter(service =>
      service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.subCategory?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
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
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-card-h2 text-charcoal-600 dark:text-white">My Services</h2>
              <p className="text-body-regular text-charcoal-400 dark:text-gray-400 mt-1">
                {filteredServices.length} {filteredServices.length === 1 ? 'service' : 'services'}
                {searchTerm && ` (filtered from ${services.length})`}
              </p>
            </div>
            <CRUDButton
              variant={showForm ? 'error' : 'success'}
              onClick={() => setShowForm(!showForm)}
            >
              {showForm ? 'Close' : 'Add Service'}
            </CRUDButton>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <MagnifyingGlass
              size={20}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-charcoal-400"
            />
            <input
              type="text"
              placeholder="Search by service name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-grey-stroke rounded-lg focus:ring-2 focus:ring-sage-500 focus:border-sage-500 text-body-regular"
            />
          </div>
        </div>
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
                value={formData.subCategoryId}
                onChange={(e) => setFormData({ ...formData, subCategoryId: e.target.value })}
                className="w-full border border-grey-stroke rounded-lg px-4 py-2 text-body-regular focus:ring-2 focus:ring-sage-500 focus:border-sage-500"
                required
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <optgroup key={category.id} label={category.name}>
                    {category.subCategories.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.name}
                      </option>
                    ))}
                  </optgroup>
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
        <Table title="My Services">
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

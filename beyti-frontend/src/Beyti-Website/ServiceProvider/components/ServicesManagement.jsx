import { useEffect, useState } from 'react';
import {
  getMyServices,
  getServiceCategories,
  addService,
  updateService,
  toggleServiceStatus
} from '../../../services/api';

export default function ServicesManagement({ serviceProviderId }) {
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState(null);
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
      // EDIT SERVICE - Convert string values to numbers and include subCategoryId
      const updateData = {
        subCategoryId: parseInt(formData.subCategoryId), // ADD THIS
        name: formData.name,
        description: formData.description || null,
        minPrice: formData.minPrice ? parseFloat(formData.minPrice) : null,
        maxPrice: formData.maxPrice ? parseFloat(formData.maxPrice) : null,
        estimatedDuration: formData.estimatedDuration ? parseInt(formData.estimatedDuration) : null
      };
      await updateService(editingService.serviceCatalogId, updateData);
      alert('Service updated successfully!');
    } else {
      // ADD SERVICE - Convert string values to numbers
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
    
    // Reset form
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">My Services</h2>
            <p className="text-gray-600 text-sm mt-1">{services.length} services</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition"
          >
            {showForm ? '✕ Close' : '+ Add Service'}
          </button>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">
            {editingService ? 'Edit Service' : 'Add New Service'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Service Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
              <select
                value={formData.subCategoryId}
                onChange={(e) => setFormData({ ...formData, subCategoryId: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                rows="3"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Min Price (BHD)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.minPrice}
                  onChange={(e) => setFormData({ ...formData, minPrice: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Price (BHD)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.maxPrice}
                  onChange={(e) => setFormData({ ...formData, maxPrice: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
                <input
                  type="number"
                  value={formData.estimatedDuration}
                  onChange={(e) => setFormData({ ...formData, estimatedDuration: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition"
              >
                {editingService ? 'Update Service' : 'Add Service'}
              </button>
              <button
                type="button"
                onClick={handleCancelForm}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-2 rounded-lg font-medium transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Services List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((service) => (
          <div
            key={service.serviceCatalogId}
            className={`bg-white rounded-lg shadow-md overflow-hidden border-l-4 ${
              service.isActive ? 'border-green-500' : 'border-gray-400'
            }`}
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-lg font-bold text-gray-800">{service.name}</h3>
                <span
                  className={`px-3 py-1 text-xs font-semibold rounded-full ${
                    service.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {service.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  <span className="font-semibold">Category:</span> {service.category} / {service.subCategory}
                </p>
                {service.description && (
                  <p className="text-sm text-gray-600 mt-2">{service.description}</p>
                )}
              </div>

              <div className="mb-4 p-3 bg-gray-50 rounded">
                {service.minPrice && service.maxPrice ? (
                  <p className="text-sm">
                    <span className="font-semibold">Price Range:</span> {service.minPrice} - {service.maxPrice} BHD
                  </p>
                ) : (
                  <p className="text-sm text-gray-500">No price range set</p>
                )}
                {service.estimatedDuration && (
                  <p className="text-sm mt-1">
                    <span className="font-semibold">Duration:</span> {service.estimatedDuration} mins
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(service)}
                  className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleToggle(service.serviceCatalogId)}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition ${
                    service.isActive
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                >
                  {service.isActive ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {services.length === 0 && (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <div className="text-6xl mb-4">🔧</div>
          <p className="text-gray-500 text-lg">No services added yet</p>
          <p className="text-gray-400 text-sm mt-2">Click "Add Service" to get started</p>
        </div>
      )}
    </div>
  );
}
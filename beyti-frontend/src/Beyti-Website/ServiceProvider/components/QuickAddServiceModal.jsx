import { useState, useEffect } from 'react';
import { getProviderCategories, addService } from '../../../services/api';
import { logProviderActivity } from '../../../utils/providerActivityLogger';

export default function QuickAddServiceModal({ serviceProviderId, isOpen, onClose, onSuccess }) {
  const [providerCategory, setProviderCategory] = useState(null);
  const [serviceCatalogs, setServiceCatalogs] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    serviceCategoryId: '',
    description: '',
    minPrice: '',
    maxPrice: '',
    durationHours: '',
    durationMinutes: ''
  });

  useEffect(() => {
    if (isOpen && serviceProviderId) {
      fetchCategories();
    }
  }, [isOpen, serviceProviderId]);

  const fetchCategories = async () => {
    try {
      const data = await getProviderCategories(serviceProviderId);
      setProviderCategory(data);
      const catalogs = data.serviceCatalogs?.map(sc => ({
        id: sc.id,
        name: sc.name,
        categoryName: data.name
      })) || [];
      setServiceCatalogs(catalogs);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const hours = formData.durationHours ? parseInt(formData.durationHours) : 0;
      const minutes = formData.durationMinutes ? parseInt(formData.durationMinutes) : 0;
      const totalMinutes = (hours * 60) + minutes;

      const addData = {
        serviceProviderId,
        serviceCategoryId: parseInt(formData.serviceCategoryId),
        name: formData.name,
        description: formData.description || null,
        minPrice: formData.minPrice ? parseFloat(formData.minPrice) : null,
        maxPrice: formData.maxPrice ? parseFloat(formData.maxPrice) : null,
        estimatedDuration: totalMinutes > 0 ? totalMinutes : null
      };

      await addService(addData);

      logProviderActivity(
        serviceProviderId,
        'service',
        'Created New Service',
        `Service: ${formData.name}`
      );

      alert('Service added successfully!');
      setFormData({
        name: '',
        serviceCategoryId: '',
        description: '',
        minPrice: '',
        maxPrice: '',
        durationHours: '',
        durationMinutes: ''
      });
      onClose();
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('Error saving service:', err);
      alert('Error saving service. Check console for details.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-cream-50 dark:bg-[#2A2A2A] rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col border border-grey-stroke">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-grey-stroke flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-charcoal-700 dark:text-white">
              Add New Service
            </h3>
            {providerCategory && (
              <p className="text-sm text-charcoal-400 dark:text-gray-400 mt-1">
                Your enrolled category: <span className="font-semibold text-sage-600 dark:text-sage-400">{providerCategory.name}</span>
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-charcoal-400 hover:text-charcoal-600 dark:text-gray-400 dark:hover:text-gray-200 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <form onSubmit={handleSubmit} className="space-y-4" id="quick-service-form">
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
              <label className="block text-body-medium text-charcoal-600 dark:text-white mb-2">Service Type *</label>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-body-medium text-charcoal-600 dark:text-white mb-2">Min Price (BHD)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.minPrice}
                  onChange={(e) => setFormData({ ...formData, minPrice: e.target.value })}
                  className="w-full border border-grey-stroke rounded-lg px-4 py-2 text-body-regular focus:ring-2 focus:ring-sage-500 focus:border-sage-500 bg-white dark:bg-[#1F1F1F] dark:text-white"
                />
              </div>

              <div>
                <label className="block text-body-medium text-charcoal-600 dark:text-white mb-2">Max Price (BHD)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.maxPrice}
                  onChange={(e) => setFormData({ ...formData, maxPrice: e.target.value })}
                  className="w-full border border-grey-stroke rounded-lg px-4 py-2 text-body-regular focus:ring-2 focus:ring-sage-500 focus:border-sage-500 bg-white dark:bg-[#1F1F1F] dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-body-medium text-charcoal-600 dark:text-white mb-2">Estimated Duration</label>
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
            </div>
          </form>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-grey-stroke bg-grey-100 dark:bg-[#1F1F1F]">
          <div className="flex flex-col md:flex-row gap-3">
            <button
              type="submit"
              form="quick-service-form"
              className="flex-1 bg-sage-500 hover:bg-sage-600 text-cream-50 py-2.5 rounded-lg font-semibold transition-colors"
            >
              Add Service
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-grey-300 hover:bg-grey-400 text-charcoal-700 dark:text-charcoal-600 py-2.5 rounded-lg font-semibold transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

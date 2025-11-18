import { useState } from 'react';
import { createMembershipPlan } from '../../services/api';

const AddPlan = () => {
  const [formData, setFormData] = useState({
    Name: '',
    Description: '',
    MonthlyPrice: '',
    DurationDays: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear messages when user starts typing
    setError(null);
    setSuccess(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    if (!formData.Name.trim()) {
      setError('Plan name is required');
      return;
    }
    if (!formData.Description.trim()) {
      setError('Description is required');
      return;
    }
    if (!formData.MonthlyPrice || formData.MonthlyPrice <= 0) {
      setError('Monthly price must be greater than 0');
      return;
    }
    if (!formData.DurationDays || formData.DurationDays <= 0) {
      setError('Duration must be greater than 0');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Convert string values to numbers for price and duration
      const planData = {
        Name: formData.Name.trim(),
        Description: formData.Description.trim(),
        MonthlyPrice: parseFloat(formData.MonthlyPrice),
        DurationDays: parseInt(formData.DurationDays, 10)
      };

      await createMembershipPlan(planData);

      setSuccess(true);
      // Reset form
      setFormData({
        Name: '',
        Description: '',
        MonthlyPrice: '',
        DurationDays: ''
      });

      // Show success message for 3 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err) {
      setError(err.message || 'Failed to create membership plan');
      console.error('Error creating membership plan:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Add Membership Plan</h1>
          <p className="text-gray-600">Create a new membership plan for the platform</p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded-lg">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-green-700 font-medium">Membership plan created successfully!</p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-red-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-700 font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Form */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <form onSubmit={handleSubmit}>
            {/* Plan Name */}
            <div className="mb-6">
              <label htmlFor="Name" className="block text-sm font-medium text-gray-700 mb-2">
                Plan Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="Name"
                name="Name"
                value={formData.Name}
                onChange={handleChange}
                placeholder="e.g., Beyti Elite"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                disabled={loading}
              />
            </div>

            {/* Description */}
            <div className="mb-6">
              <label htmlFor="Description" className="block text-sm font-medium text-gray-700 mb-2">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                id="Description"
                name="Description"
                value={formData.Description}
                onChange={handleChange}
                placeholder="Describe the features and benefits of this plan..."
                rows="4"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                disabled={loading}
              />
            </div>

            {/* Monthly Price */}
            <div className="mb-6">
              <label htmlFor="MonthlyPrice" className="block text-sm font-medium text-gray-700 mb-2">
                Monthly Price ($) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="MonthlyPrice"
                name="MonthlyPrice"
                value={formData.MonthlyPrice}
                onChange={handleChange}
                placeholder="e.g., 35.00"
                step="0.01"
                min="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                disabled={loading}
              />
            </div>

            {/* Duration Days */}
            <div className="mb-6">
              <label htmlFor="DurationDays" className="block text-sm font-medium text-gray-700 mb-2">
                Duration (Days) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="DurationDays"
                name="DurationDays"
                value={formData.DurationDays}
                onChange={handleChange}
                placeholder="e.g., 30"
                min="1"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                disabled={loading}
              />
            </div>

            {/* Submit Button */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className={`flex-1 py-3 px-6 rounded-lg font-medium text-white transition-all ${
                  loading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg'
                }`}
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating...
                  </span>
                ) : (
                  'Create Membership Plan'
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setFormData({
                    Name: '',
                    Description: '',
                    MonthlyPrice: '',
                    DurationDays: ''
                  });
                  setError(null);
                  setSuccess(false);
                }}
                disabled={loading}
                className="px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Reset
              </button>
            </div>
          </form>
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
          <div className="flex">
            <svg className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-sm text-blue-700">
              <p className="font-medium mb-1">Tips:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Plan name should be clear and descriptive</li>
                <li>Include key features in the description</li>
                <li>Pricing should reflect the value provided</li>
                <li>Standard duration is 30 days (1 month)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddPlan;

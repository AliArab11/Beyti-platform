import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Select from '../../components/Select';
import { validateRequired, validatePhone } from '../../utils/validation';

/**
 * Driver Onboarding Form
 *
 * Simple registration form for drivers wanting to deliver orders.
 * No multi-step wizard or membership selection.
 * Drivers earn through deliveries, not subscription plans.
 *
 * Fields: Vehicle Type, License Number, Phone Number
 */
export default function DriverOnboarding() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    vehicleType: '',
    licenseNumber: '',
    phone: ''
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  // Vehicle type options
  const vehicleTypes = [
    { value: 'bike', label: 'Motorcycle/Bike' },
    { value: 'car', label: 'Car' },
    { value: 'van', label: 'Van' },
    { value: 'truck', label: 'Truck' }
  ];

  /**
   * Update form field
   */
  const handleChange = (field) => (e) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  /**
   * Validate form
   */
  const validate = () => {
    const newErrors = {};

    if (!validateRequired(formData.vehicleType)) {
      newErrors.vehicleType = 'Please select a vehicle type';
    }

    if (!validateRequired(formData.licenseNumber)) {
      newErrors.licenseNumber = 'License number is required';
    }

    if (!validateRequired(formData.phone)) {
      newErrors.phone = 'Phone number is required';
    } else if (!validatePhone(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Submit driver registration
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setIsLoading(true);

    try {
      // Get stored user data from registration
      const userId = localStorage.getItem('userId');
      const userEmail = localStorage.getItem('userEmail');

      console.log('[DriverOnboarding] userId from localStorage:', userId);

      if (!userId) {
        throw new Error('User ID not found. Please register or login first before completing onboarding.');
      }

      // Create Driver
      const driverResponse = await fetch('https://localhost:7062/api/Drivers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          UserId: userId,  // Pass userId (GUID string) for onboarding - links to existing UserProfile
          VehicleType: formData.vehicleType,
          LicenseNumber: formData.licenseNumber,
          PhoneNumber: formData.phone,
          Email: userEmail,
          IsAvailable: true
        })
      });

      if (!driverResponse.ok) {
        throw new Error('Failed to create driver account');
      }

      // Update role in localStorage
      localStorage.setItem('userRole', 'Driver');

      // Navigate to dashboard
      navigate('/dashboard');

    } catch (error) {
      setErrors({ form: error.message || 'An error occurred. Please try again.' });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream-50 flex items-center justify-center p-4">
      {/* Card Container */}
      <div className="bg-grey-200 rounded-lg p-8 shadow-soft-lift border border-grey-stroke max-w-lg w-full">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-6xl mb-4">🚚</div>
          <h1 className="text-display-h1 text-charcoal-600 mb-2">
            Driver Registration
          </h1>
          <p className="text-body-regular text-charcoal-400">
            Start delivering orders and earning today
          </p>
        </div>

        {/* Form Error Message */}
        {errors.form && (
          <div
            className="bg-error-bg border-l-4 border-error-btn p-4 rounded mb-6"
            role="alert"
          >
            <p className="text-body-regular text-error-text">{errors.form}</p>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="VEHICLE TYPE"
            name="vehicleType"
            id="vehicleType"
            value={formData.vehicleType}
            onChange={handleChange('vehicleType')}
            options={vehicleTypes}
            placeholder="Select your vehicle type"
            required
            error={errors.vehicleType}
          />

          <Input
            label="LICENSE NUMBER"
            type="text"
            name="licenseNumber"
            id="licenseNumber"
            value={formData.licenseNumber}
            onChange={handleChange('licenseNumber')}
            placeholder="Enter your license number"
            required
            error={errors.licenseNumber}
          />

          <Input
            label="PHONE NUMBER"
            type="tel"
            name="phone"
            id="phone"
            value={formData.phone}
            onChange={handleChange('phone')}
            placeholder="+973 12345678"
            required
            error={errors.phone}
          />

          {/* Info Box */}
          <div className="bg-cream-100 border border-grey-stroke rounded-lg p-4">
            <h3 className="text-body-regular font-medium text-charcoal-600 mb-2">
              How it works:
            </h3>
            <ul className="space-y-1 text-sm text-charcoal-400">
              <li>✓ Accept delivery requests in your area</li>
              <li>✓ Earn per delivery with transparent rates</li>
              <li>✓ Flexible schedule - work when you want</li>
              <li>✓ Track your earnings in real-time</li>
            </ul>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            variant="primary"
            fullWidth
            disabled={isLoading}
          >
            {isLoading ? 'Completing Registration...' : 'Complete Registration'}
          </Button>
        </form>

        {/* Additional Info */}
        <div className="mt-6 text-center">
          <p className="text-sm text-charcoal-400">
            By registering, you agree to our{' '}
            <a href="/terms" className="text-sage-500 hover:text-sage-700 underline">
              Terms of Service
            </a>
            {' '}and{' '}
            <a href="/privacy" className="text-sage-500 hover:text-sage-700 underline">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

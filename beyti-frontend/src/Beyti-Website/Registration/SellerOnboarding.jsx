import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Select from '../../components/Select';
import MembershipSelection from './components/MembershipSelection';
import { validateRequired, validatePhone } from '../../utils/validation';
import { getCategories, createUserMembership } from '../../services/api';

/**
 * Seller Onboarding Wizard
 *
 * 4-step registration flow for sellers wanting to sell physical products.
 *
 * Step 1: Identity (Store Name, Category, Phone)
 * Step 2: Location (City, Block, Road, Building, Avenue)
 * Step 3: Verification (Mock document upload)
 * Step 4: Membership (Plan selection)
 */
export default function SellerOnboarding() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);

  const [formData, setFormData] = useState({
    // Step 1: Identity
    storeName: '',
    categoryId: '',
    phone: localStorage.getItem('userPhone') || '',
    // Step 2: Location
    city: '',
    block: '',
    road: '',
    building: '',
    avenue: '',
    // Step 3: Verification
    isVerified: false,
    // Step 4: Membership
    selectedPlan: null
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // Fetch categories from backend
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const cats = await getCategories();
        setCategories(cats.map(cat => ({
          value: cat.id,
          label: cat.name
        })));
      } catch (error) {
        console.error('Failed to load categories:', error);
        setErrors(prev => ({ ...prev, form: 'Failed to load categories. Please refresh the page.' }));
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchCategories();
  }, []);

  /**
   * Update form field
   */
  const handleChange = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  /**
   * Validate current step
   */
  const validateStep = (step) => {
    const newErrors = {};

    if (step === 1) {
      if (!validateRequired(formData.storeName)) {
        newErrors.storeName = 'Store name is required';
      }
      if (!validateRequired(formData.categoryId)) {
        newErrors.categoryId = 'Please select a category';
      }
      if (!validateRequired(formData.phone)) {
        newErrors.phone = 'Phone number is required';
      } else if (!validatePhone(formData.phone)) {
        newErrors.phone = 'Please enter a valid phone number';
      }
    } else if (step === 2) {
      if (!validateRequired(formData.city)) {
        newErrors.city = 'City is required';
      }
      if (!validateRequired(formData.block)) {
        newErrors.block = 'Block is required';
      }
      if (!validateRequired(formData.road)) {
        newErrors.road = 'Road is required';
      }
    } else if (step === 3) {
      if (!formData.isVerified) {
        newErrors.verification = 'Please complete the verification step';
      }
    }
    // Step 4: Membership is now optional - no validation needed

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Navigate to next step
   */
  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
    }
  };

  /**
   * Navigate to previous step
   */
  const handlePrevious = () => {
    setCurrentStep(prev => prev - 1);
  };

  /**
   * Handle membership selection
   */
  const handleMembershipSelect = (planId) => {
    setFormData(prev => ({ ...prev, selectedPlan: planId }));
    if (errors.membership) {
      setErrors(prev => ({ ...prev, membership: null }));
    }
  };

  /**
   * Handle verification checkbox
   */
  const handleVerificationChange = (e) => {
    setFormData(prev => ({ ...prev, isVerified: e.target.checked }));
    if (errors.verification) {
      setErrors(prev => ({ ...prev, verification: null }));
    }
  };

  /**
   * Submit seller registration
   */
  const handleSubmit = async () => {
    // No validation needed for step 4 since membership is optional

    setIsLoading(true);

    try {
      // Get stored user data from registration
      const userId = localStorage.getItem('userId');
      const userProfileId = localStorage.getItem('userProfileId');
      const userEmail = localStorage.getItem('userEmail');
      const userPhone = localStorage.getItem('userPhone');

      console.log('[SellerOnboarding] userId from localStorage:', userId);
      console.log('[SellerOnboarding] All localStorage:', {
        userId,
        userProfileId,
        userEmail,
        userPhone,
        authToken: localStorage.getItem('authToken')
      });

      if (!userId || !userProfileId) {
        throw new Error('User ID not found. Please register or login first before completing onboarding.');
      }

      // Step 1: Create Address
      // Combine location fields into proper address format
      const streetParts = [
        formData.road ? `Road ${formData.road}` : '',
        formData.building ? `Building ${formData.building}` : '',
        formData.avenue ? `Avenue ${formData.avenue}` : ''
      ].filter(Boolean).join(', ');

      const addressResponse = await fetch('https://localhost:7062/api/Addresses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          Label: 'Store Address',
          Street: streetParts || 'N/A',
          City: formData.city,
          Region: null,
          PostalCode: formData.block,
          Country: 'Bahrain',
          Latitude: null,
          Longitude: null,
          IsDefault: true
        })
      });

      if (!addressResponse.ok) {
        const errorText = await addressResponse.text();
        console.error('Address creation failed:', errorText);
        throw new Error(`Step 1: Failed to create address - ${errorText || 'Bad Request'}`);
      }

      const addressData = await addressResponse.json();
      console.log('Address created:', addressData);

      // Handle both camelCase (id) and PascalCase (Id) from backend
      const addressId = addressData.id || addressData.Id;
      if (!addressId) {
        throw new Error('Step 1: Address created but no ID returned');
      }

      // Step 2: Create Seller
      const sellerResponse = await fetch('https://localhost:7062/api/Sellers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          StoreName: formData.storeName,
          CategoryId: parseInt(formData.categoryId),
          Phone: formData.phone,
          UserId: userId  // Pass userId for onboarding - links to existing UserProfile
        })
      });

      if (!sellerResponse.ok) {
        const errorText = await sellerResponse.text();
        console.error('Seller creation failed:', errorText);
        throw new Error(`Step 2: Failed to create seller account - ${errorText || 'Bad Request'}`);
      }

      const sellerData = await sellerResponse.json();
      console.log('Seller created:', sellerData);

      // Handle both camelCase (id) and PascalCase (Id) from backend
      const sellerId = sellerData.id || sellerData.Id;
      if (!sellerId) {
        throw new Error('Step 2: Seller created but no ID returned');
      }

      // Step 3: Create SellerAddress relationship
      const sellerAddressResponse = await fetch('https://localhost:7062/api/SellerAddresses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          SellerId: sellerId,
          AddressId: addressId
        })
      });

      if (!sellerAddressResponse.ok) {
        const errorText = await sellerAddressResponse.text();
        console.error('SellerAddress creation failed:', errorText);
        throw new Error(`Step 3: Failed to link address to seller - ${errorText || 'Bad Request'}`);
      }

      // Step 4: Create membership if selected
      if (formData.selectedPlan) {
        try {
          await createUserMembership({
            userProfileId: parseInt(userProfileId),
            membershipPlanId: formData.selectedPlan,
            autoRenew: false
          });
        } catch (error) {
          console.error('Failed to assign membership, continuing...', error);
          // Don't block registration if membership fails
        }
      }

      // Update role in localStorage
      localStorage.setItem('userRole', 'Seller');

      // Navigate to dashboard
      navigate('/dashboard');

    } catch (error) {
      console.error('Registration error:', error);
      setErrors({
        form: `Registration failed: ${error.message || 'An error occurred. Please try again.'}`
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream-50 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-display-h1 text-charcoal-600 mb-2">
            Seller Registration
          </h1>
          <p className="text-body-regular text-charcoal-400">
            Step {currentStep} of 4
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {[1, 2, 3, 4].map((step) => (
              <div
                key={step}
                className={`flex-1 h-2 rounded ${
                  step <= currentStep ? 'bg-sage-500' : 'bg-grey-stroke'
                } ${step !== 4 ? 'mr-2' : ''}`}
              />
            ))}
          </div>
          <div className="flex justify-between text-sm text-charcoal-400">
            <span>Identity</span>
            <span>Location</span>
            <span>Verification</span>
            <span>Membership</span>
          </div>
        </div>

        {/* Card Container */}
        <div className="bg-grey-200 rounded-lg p-8 shadow-soft-lift border border-grey-stroke">
          {/* Form Error Message */}
          {errors.form && (
            <div
              className="bg-error-bg border-l-4 border-error-btn p-4 rounded mb-6"
              role="alert"
            >
              <p className="text-body-regular text-error-text">{errors.form}</p>
            </div>
          )}

          {/* Step 1: Identity */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <h2 className="text-card-h2 text-charcoal-600 mb-4">
                Store Information
              </h2>

              <Input
                label="STORE NAME"
                type="text"
                name="storeName"
                id="storeName"
                value={formData.storeName}
                onChange={handleChange('storeName')}
                placeholder="Enter your store name"
                required
                error={errors.storeName}
              />

              <Select
                label="CATEGORY"
                name="categoryId"
                id="categoryId"
                value={formData.categoryId}
                onChange={handleChange('categoryId')}
                options={categories}
                placeholder={loadingCategories ? "Loading..." : "Select a category"}
                required
                disabled={loadingCategories}
                error={errors.categoryId}
              />

              <div>
                <Input
                  label="STORE PHONE NUMBER"
                  type="tel"
                  name="phone"
                  id="phone"
                  value={formData.phone}
                  onChange={handleChange('phone')}
                  placeholder="+973 12345678"
                  required
                  error={errors.phone}
                />
                {localStorage.getItem('userPhone') && (
                  <p className="text-xs text-charcoal-400 mt-1">
                    Using your registered number. You can change it if needed.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Location */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <h2 className="text-card-h2 text-charcoal-600 mb-4">
                Store Location
              </h2>

              <Input
                label="CITY"
                type="text"
                name="city"
                id="city"
                value={formData.city}
                onChange={handleChange('city')}
                placeholder="Enter city"
                required
                error={errors.city}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="BLOCK"
                  type="text"
                  name="block"
                  id="block"
                  value={formData.block}
                  onChange={handleChange('block')}
                  placeholder="Block number"
                  required
                  error={errors.block}
                />

                <Input
                  label="ROAD"
                  type="text"
                  name="road"
                  id="road"
                  value={formData.road}
                  onChange={handleChange('road')}
                  placeholder="Road number"
                  required
                  error={errors.road}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="BUILDING (Optional)"
                  type="text"
                  name="building"
                  id="building"
                  value={formData.building}
                  onChange={handleChange('building')}
                  placeholder="Building number"
                />

                <Input
                  label="AVENUE (Optional)"
                  type="text"
                  name="avenue"
                  id="avenue"
                  value={formData.avenue}
                  onChange={handleChange('avenue')}
                  placeholder="Avenue number"
                />
              </div>
            </div>
          )}

          {/* Step 3: Verification */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <h2 className="text-card-h2 text-charcoal-600 mb-4">
                Business Verification
              </h2>

              <div className="bg-cream-100 border border-grey-stroke rounded-lg p-6 text-center">
                <div className="text-6xl mb-4">📄</div>
                <p className="text-body-regular text-charcoal-600 mb-4">
                  Please upload your business registration documents
                </p>
                <p className="text-sm text-charcoal-400 mb-6">
                  Accepted formats: PDF, JPG, PNG (Max 5MB)
                </p>

                {/* Mock Upload Button */}
                <Button variant="secondary" onClick={() => {}}>
                  Upload Document
                </Button>
              </div>

              {/* Verification Checkbox */}
              <label className="flex items-start gap-3 cursor-pointer mt-6">
                <input
                  type="checkbox"
                  checked={formData.isVerified}
                  onChange={handleVerificationChange}
                  className="
                    w-5 h-5 mt-0.5
                    rounded
                    border-2
                    border-charcoal-400
                    bg-cream-100
                    checked:bg-sage-500
                    checked:border-sage-500
                    focus:outline-none
                    focus:ring-2
                    focus:ring-sage-500
                    focus:ring-offset-2
                    transition-all
                    duration-200
                    cursor-pointer
                  "
                />
                <span className="text-body-regular text-charcoal-600">
                  I confirm that I have uploaded valid business registration documents
                </span>
              </label>

              {errors.verification && (
                <p className="text-sm text-error-text mt-2" role="alert">
                  {errors.verification}
                </p>
              )}

              <div className="bg-cream-100 border border-grey-stroke rounded-lg p-4 mt-4">
                <p className="text-sm text-charcoal-400">
                  <strong>Note:</strong> Your documents will be reviewed within 24-48 hours.
                  You'll receive an email notification once your account is verified.
                </p>
              </div>
            </div>
          )}

          {/* Step 4: Membership */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <MembershipSelection
                onSelect={handleMembershipSelect}
                selectedPlan={formData.selectedPlan}
                onSubmit={handleSubmit}
              />

              {errors.membership && (
                <p className="text-sm text-error-text text-center" role="alert">
                  {errors.membership}
                </p>
              )}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 gap-4">
            {currentStep > 1 ? (
              <Button variant="secondary" onClick={handlePrevious}>
                Previous
              </Button>
            ) : (
              <div />
            )}

            {currentStep < 4 ? (
              <Button variant="primary" onClick={handleNext}>
                Next
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={handleSubmit}
                disabled={isLoading}
              >
                {isLoading ? 'Completing Registration...' : 'Complete Registration'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

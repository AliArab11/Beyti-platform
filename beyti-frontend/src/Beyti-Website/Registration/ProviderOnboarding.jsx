import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Select from '../../components/Select';
import MembershipSelection from './components/MembershipSelection';
import { validateRequired, validatePhone, validateNumber, validatePriceRange } from '../../utils/validation';
import { getServiceCategories, createUserMembership } from '../../services/api';

/**
 * Service Provider Onboarding Wizard
 *
 * 5-step registration flow for service providers offering professional services.
 *
 * Step 1: Identity (Business Name, Service Type, Phone)
 * Step 2: Services (Service Description, Pricing)
 * Step 3: Location (Service Area)
 * Step 4: Verification (Mock document upload)
 * Step 5: Membership (Plan selection)
 */
export default function ProviderOnboarding() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);

  const [formData, setFormData] = useState({
    // Step 1: Identity
    businessName: '',
    serviceCategoryId: '',
    phone: localStorage.getItem('userPhone') || '',
    // Step 2: Services
    serviceDescription: '',
    minPrice: '',
    maxPrice: '',
    // Step 3: Location
    city: '',
    block: '',
    road: '',
    building: '',
    avenue: '',
    // Step 4: Verification
    isVerified: false,
    // Step 5: Membership
    selectedPlan: null
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [serviceCategories, setServiceCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [uploadedCertificates, setUploadedCertificates] = useState([]);

  // Fetch service categories from backend
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categories = await getServiceCategories();
        setServiceCategories(categories.map(cat => ({
          value: cat.id,
          label: cat.name
        })));
      } catch (error) {
        console.error('Failed to load service categories:', error);
        setErrors(prev => ({ ...prev, form: 'Failed to load service categories. Please refresh the page.' }));
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
      if (!validateRequired(formData.businessName)) {
        newErrors.businessName = 'Business name is required';
      }
      if (!validateRequired(formData.serviceCategoryId)) {
        newErrors.serviceCategoryId = 'Please select a service category';
      }
      if (!validateRequired(formData.phone)) {
        newErrors.phone = 'Phone number is required';
      } else if (!validatePhone(formData.phone)) {
        newErrors.phone = 'Please enter a valid phone number';
      }
    } else if (step === 2) {
      if (!validateRequired(formData.serviceDescription)) {
        newErrors.serviceDescription = 'Service description is required';
      }
      if (!validateRequired(formData.minPrice)) {
        newErrors.minPrice = 'Minimum price is required';
      } else if (!validateNumber(formData.minPrice)) {
        newErrors.minPrice = 'Please enter a valid number';
      }
      if (!validateRequired(formData.maxPrice)) {
        newErrors.maxPrice = 'Maximum price is required';
      } else if (!validateNumber(formData.maxPrice)) {
        newErrors.maxPrice = 'Please enter a valid number';
      } else if (!validatePriceRange(formData.minPrice, formData.maxPrice)) {
        newErrors.maxPrice = 'Maximum price must be greater than or equal to minimum price';
      }
    } else if (step === 3) {
      if (!validateRequired(formData.city)) {
        newErrors.city = 'City is required';
      }
      if (!validateRequired(formData.block)) {
        newErrors.block = 'Block is required';
      }
      if (!validateRequired(formData.road)) {
        newErrors.road = 'Road is required';
      }
    } else if (step === 4) {
      if (!formData.isVerified) {
        newErrors.verification = 'Please complete the verification step';
      }
    }
    // Step 5: Membership is now optional - no validation needed

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
   * Handle certificate file upload
   */
  const handleCertificateUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      setErrors(prev => ({ ...prev, certificate: 'Invalid file type. Please use PDF, JPG, or PNG' }));
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, certificate: 'File too large. Maximum size is 5MB' }));
      return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onloadend = () => {
      setUploadedCertificates(prev => [...prev, {
        title: file.name,
        fileData: reader.result, // base64 string
        fileName: file.name
      }]);
      // Auto-check verification checkbox when file uploaded
      setFormData(prev => ({ ...prev, isVerified: true }));
      // Clear any certificate errors
      if (errors.certificate) {
        setErrors(prev => ({ ...prev, certificate: null }));
      }
    };
    reader.onerror = () => {
      setErrors(prev => ({ ...prev, certificate: 'Failed to read file. Please try again' }));
    };
    reader.readAsDataURL(file);
  };

  /**
   * Remove uploaded certificate
   */
  const handleRemoveCertificate = (index) => {
    setUploadedCertificates(prev => prev.filter((_, i) => i !== index));
    // Uncheck verification if no certificates remain
    if (uploadedCertificates.length === 1) {
      setFormData(prev => ({ ...prev, isVerified: false }));
    }
  };

  /**
   * Submit provider registration
   */
  const handleSubmit = async () => {
    // No validation needed for step 5 since membership is optional

    setIsLoading(true);

    try {
      // Get stored user data from registration
      const userId = localStorage.getItem('userId');
      const userProfileId = localStorage.getItem('userProfileId');
      const userEmail = localStorage.getItem('userEmail');
      const userPhone = localStorage.getItem('userPhone');

      console.log('[ProviderOnboarding] userId from localStorage:', userId);
      console.log('[ProviderOnboarding] userProfileId from localStorage:', userProfileId);

      if (!userId) {
        throw new Error('User ID not found. Please register or login first before completing onboarding.');
      }

      // Check if ServiceProvider already exists (resubmission case)
      let providerId = null;
      let isResubmission = false;

      try {
        const checkProviderResponse = await fetch(`https://localhost:7062/api/ServiceProviders/user/${userProfileId}`);
        if (checkProviderResponse.ok) {
          const existingProvider = await checkProviderResponse.json();
          providerId = existingProvider.id || existingProvider.Id;
          isResubmission = true;
          console.log('[ProviderOnboarding] Existing provider found (resubmission):', providerId);
        }
      } catch (error) {
        console.log('[ProviderOnboarding] No existing provider found (new registration)');
      }

      // If NEW registration, create address and provider
      if (!isResubmission) {
        // Step 1: Create Address
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
            Label: 'Service Area',
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
          throw new Error(`Failed to create address - ${errorText || 'Bad Request'}`);
        }

        const addressData = await addressResponse.json();
        const addressId = addressData.id || addressData.Id;

        if (!addressId) {
          throw new Error('Address created but no ID returned');
        }

        // Step 2: Create Service Provider with status 'Unavailable'
        const providerResponse = await fetch('https://localhost:7062/api/ServiceProviders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            businessName: formData.businessName,
            serviceCategoryId: parseInt(formData.serviceCategoryId),
            phone: formData.phone,
            minServicePrice: parseFloat(formData.minPrice),
            maxServicePrice: parseFloat(formData.maxPrice),
            displayName: formData.businessName,
            status: 'Unavailable',  // Changed from 'Available'
            userId: userId
          })
        });

        if (!providerResponse.ok) {
          const errorText = await providerResponse.text();
          console.error('Service Provider creation failed:', errorText);
          throw new Error(`Failed to create service provider account - ${errorText || 'Bad Request'}`);
        }

        const providerData = await providerResponse.json();
        providerId = providerData.id || providerData.Id;

        if (!providerId) {
          throw new Error('Service provider created but no ID returned');
        }

        // Step 3: Link Address
        const providerAddressResponse = await fetch('https://localhost:7062/api/ServiceProviderAddresses', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ServiceProviderId: providerId,
            AddressId: addressId
          })
        });

        if (!providerAddressResponse.ok) {
          const errorText = await providerAddressResponse.text();
          console.error('ServiceProviderAddress creation failed:', errorText);
          throw new Error(`Failed to link address to service provider - ${errorText || 'Bad Request'}`);
        }

        console.log('[ProviderOnboarding] New ServiceProvider created:', providerId);
      }

      // Step 4: Create or Update ProviderApplication
      const applicationResponse = await fetch('https://localhost:7062/api/ProviderApplications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          serviceProviderId: providerId,
          status: 'Pending',
          notes: formData.serviceDescription || null
        })
      });

      if (!applicationResponse.ok) {
        const errorText = await applicationResponse.text();
        console.error('ProviderApplication creation failed:', errorText);
        throw new Error(`Failed to create application - ${errorText || 'Bad Request'}`);
      }

      const applicationData = await applicationResponse.json();
      const applicationId = applicationData.id || applicationData.Id;

      if (!applicationId) {
        throw new Error('Application created but no ID returned');
      }

      console.log('[ProviderOnboarding] ProviderApplication created/updated:', applicationId);

      // Step 5: Upload certificates
      for (const cert of uploadedCertificates) {
        try {
          const certResponse = await fetch('https://localhost:7062/api/ProviderCertificates', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              providerApplicationId: applicationId,
              title: cert.title,
              fileData: cert.fileData,
              expiresAt: null
            })
          });

          if (!certResponse.ok) {
            const errorText = await certResponse.text();
            console.error('Certificate upload failed:', errorText);
            throw new Error(`Failed to upload certificate ${cert.fileName} - ${errorText}`);
          }

          console.log('[ProviderOnboarding] Certificate uploaded:', cert.fileName);
        } catch (error) {
          console.error('Certificate upload error:', error);
          throw error;
        }
      }

      // Step 6: Create membership if selected
      if (formData.selectedPlan) {
        try {
          await createUserMembership({
            userProfileId: parseInt(userProfileId),
            membershipPlanId: formData.selectedPlan,
            autoRenew: false
          });
          console.log('[ProviderOnboarding] Membership created successfully');
        } catch (error) {
          console.error('Failed to assign membership, continuing...', error);
          // Don't block registration if membership fails
        }
      }

      // Step 7: Set role to 'Pending' (CHANGED!)
      localStorage.setItem('userRole', 'Pending');
      console.log('[ProviderOnboarding] User role set to Pending');

      // Step 8: Navigate to homepage (CHANGED from /dashboard)
      navigate('/');

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
            Service Provider Registration
          </h1>
          <p className="text-body-regular text-charcoal-400">
            Step {currentStep} of 5
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {[1, 2, 3, 4, 5].map((step) => (
              <div
                key={step}
                className={`flex-1 h-2 rounded ${
                  step <= currentStep ? 'bg-sage-500' : 'bg-grey-stroke'
                } ${step !== 5 ? 'mr-2' : ''}`}
              />
            ))}
          </div>
          <div className="flex justify-between text-xs text-charcoal-400">
            <span>Identity</span>
            <span>Services</span>
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
                Business Information
              </h2>

              <Input
                label="BUSINESS NAME"
                type="text"
                name="businessName"
                id="businessName"
                value={formData.businessName}
                onChange={handleChange('businessName')}
                placeholder="Enter your business name"
                required
                error={errors.businessName}
              />

              <Select
                label="SERVICE TYPE"
                name="serviceCategoryId"
                id="serviceCategoryId"
                value={formData.serviceCategoryId}
                onChange={handleChange('serviceCategoryId')}
                options={serviceCategories}
                placeholder={loadingCategories ? "Loading..." : "Select your service type"}
                required
                disabled={loadingCategories}
                error={errors.serviceCategoryId}
              />

              <div>
                <Input
                  label="BUSINESS PHONE NUMBER"
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

          {/* Step 2: Services */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <h2 className="text-card-h2 text-charcoal-600 mb-4">
                Service Details
              </h2>

              <div>
                <label className="text-label-medium text-charcoal-600 block mb-2">
                  SERVICE DESCRIPTION *
                </label>
                <textarea
                  name="serviceDescription"
                  id="serviceDescription"
                  value={formData.serviceDescription}
                  onChange={handleChange('serviceDescription')}
                  placeholder="Describe the services you offer..."
                  rows={5}
                  required
                  className={`
                    w-full px-4 py-2
                    bg-cream-100
                    border-2
                    ${errors.serviceDescription ? 'border-error-btn' : 'border-charcoal-400'}
                    rounded-lg
                    text-body-regular text-charcoal-600
                    placeholder-charcoal-400
                    focus:outline-none
                    focus:ring-2
                    focus:ring-sage-500
                    focus:border-sage-500
                    transition-all duration-200
                  `}
                />
                {errors.serviceDescription && (
                  <p className="text-sm text-error-text mt-1" role="alert">
                    {errors.serviceDescription}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="MINIMUM PRICE (BHD)"
                  type="number"
                  name="minPrice"
                  id="minPrice"
                  value={formData.minPrice}
                  onChange={handleChange('minPrice')}
                  placeholder="0.00"
                  required
                  error={errors.minPrice}
                />

                <Input
                  label="MAXIMUM PRICE (BHD)"
                  type="number"
                  name="maxPrice"
                  id="maxPrice"
                  value={formData.maxPrice}
                  onChange={handleChange('maxPrice')}
                  placeholder="0.00"
                  required
                  error={errors.maxPrice}
                />
              </div>

              <div className="bg-cream-100 border border-grey-stroke rounded-lg p-4">
                <p className="text-sm text-charcoal-400">
                  <strong>Tip:</strong> Set a price range that reflects your service quality and market rates.
                  This helps customers understand your pricing structure.
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Location */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <h2 className="text-card-h2 text-charcoal-600 mb-4">
                Service Area
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

          {/* Step 4: Verification */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <h2 className="text-card-h2 text-charcoal-600 mb-4">
                Professional Verification
              </h2>

              <div className="bg-cream-100 border border-grey-stroke rounded-lg p-6 text-center">
                <div className="text-6xl mb-4">📋</div>
                <p className="text-body-regular text-charcoal-600 mb-4">
                  Please upload your professional certifications or licenses
                </p>
                <p className="text-sm text-charcoal-400 mb-6">
                  Accepted formats: PDF, JPG, PNG (Max 5MB)
                </p>

                {/* Real File Upload */}
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleCertificateUpload}
                  className="hidden"
                  id="certificate-upload"
                />
                <label htmlFor="certificate-upload">
                  <Button variant="secondary" as="span" style={{ cursor: 'pointer' }}>
                    Upload Certification
                  </Button>
                </label>

                {/* Display error */}
                {errors.certificate && (
                  <p className="text-sm text-error-text mt-2" role="alert">
                    {errors.certificate}
                  </p>
                )}
              </div>

              {/* Display uploaded files */}
              {uploadedCertificates.length > 0 && (
                <div className="mt-4 space-y-2">
                  {uploadedCertificates.map((cert, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between bg-cream-100 border border-grey-stroke rounded-lg p-3"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xl">📄</span>
                        <span className="text-body-regular text-charcoal-600">{cert.fileName}</span>
                      </div>
                      <button
                        onClick={() => handleRemoveCertificate(idx)}
                        className="text-error-btn hover:text-error-text text-sm font-semibold"
                        type="button"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}

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
                  I confirm that I have uploaded valid professional certifications or licenses
                </span>
              </label>

              {errors.verification && (
                <p className="text-sm text-error-text mt-2" role="alert">
                  {errors.verification}
                </p>
              )}

              <div className="bg-cream-100 border border-grey-stroke rounded-lg p-4 mt-4">
                <p className="text-sm text-charcoal-400">
                  <strong>Note:</strong> Your credentials will be reviewed within 24-48 hours.
                  You'll receive an email notification once your account is verified.
                </p>
              </div>
            </div>
          )}

          {/* Step 5: Membership */}
          {currentStep === 5 && (
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

            {currentStep < 5 ? (
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

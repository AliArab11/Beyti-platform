import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/Button';
import Input from '../../components/Input';
import PasswordInput from '../../components/PasswordInput';
import Checkbox from '../../components/Checkbox';
import { register, login } from '../../services/api';
import { validateEmail, validatePassword, passwordsMatch } from '../../utils/validation';
import { isLoggedIn } from '../../utils/auth';

/**
 * Universal Registration Page
 *
 * First step in the "One Door, Two Paths" registration flow.
 * Creates user account with Identity + UserProfile, then auto-logs in
 * and redirects to role selection.
 */
export default function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    agreedToTerms: false
  });

  const [errors, setErrors] = useState({});

  // Redirect if already logged in
  useEffect(() => {
    if (isLoggedIn()) {
      console.log('[Register] User already logged in, redirecting to home');
      navigate('/');
    }
  }, [navigate]);
  const [isLoading, setIsLoading] = useState(false);

  // Password strength validation
  const passwordValidation = validatePassword(formData.password);

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
   * Validate form before submission
   */
  const validate = () => {
    const newErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (!passwordValidation.isValid) {
      newErrors.password = 'Password does not meet requirements';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (!passwordsMatch(formData.password, formData.confirmPassword)) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.agreedToTerms) {
      newErrors.agreedToTerms = 'You must agree to the Terms & Conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setIsLoading(true);

    try {
      // Step 1: Register user
      await register({
        Email: formData.email,
        Password: formData.password,
        FirstName: formData.firstName,
        LastName: formData.lastName,
        PhoneNumber: formData.phoneNumber
      });

      // Step 2: Auto-login
      const loginResponse = await login({
        Email: formData.email,
        Password: formData.password
      });

      console.log('[Register] Login response:', loginResponse);
      console.log('[Register] token:', loginResponse.token);
      console.log('[Register] userId:', loginResponse.userId);
      console.log('[Register] role:', loginResponse.role);

      // Step 3: Store auth data (backend returns camelCase fields)
      localStorage.setItem('authToken', loginResponse.token);
      localStorage.setItem('userId', loginResponse.userId);
      localStorage.setItem('userProfileId', loginResponse.userProfileId);
      localStorage.setItem('userRole', loginResponse.role);
      localStorage.setItem('userEmail', formData.email);
      localStorage.setItem('userPhone', formData.phoneNumber);
      localStorage.setItem('userName', `${formData.firstName} ${formData.lastName}`);

      // Step 4: Navigate to role selection
      navigate('/role-selection');

    } catch (error) {
      let errorMessage = error.message;
      let emailError = null;

      // Map common errors to user-friendly messages
      if (errorMessage.toLowerCase().includes('duplicate') ||
          errorMessage.toLowerCase().includes('already exists') ||
          errorMessage.toLowerCase().includes('already registered')) {
        errorMessage = 'This email is already registered. Please login or use a different email.';
        emailError = 'This email is already registered';
      } else if (errorMessage.toLowerCase().includes('network') ||
                 errorMessage.toLowerCase().includes('failed to fetch')) {
        errorMessage = 'Unable to connect to server. Please check your connection.';
      } else if (!errorMessage || errorMessage.includes('Request failed')) {
        errorMessage = 'An error occurred during registration. Please try again.';
      }

      setErrors({
        form: errorMessage,
        email: emailError
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream-50 flex items-center justify-center p-4">
      {/* Card Container */}
      <div className="bg-grey-200 rounded-lg p-8 shadow-soft-lift border border-grey-stroke max-w-lg w-full">
        {/* Header */}
        <h1 className="text-display-h1 text-charcoal-600 mb-2">Create Account</h1>
        <p className="text-body-regular text-charcoal-400 mb-6">
          Join Beyti and start your journey
        </p>

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
          {/* Name Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="FIRST NAME"
              type="text"
              name="firstName"
              id="firstName"
              value={formData.firstName}
              onChange={handleChange('firstName')}
              placeholder="Enter first name"
              required
              error={errors.firstName}
            />
            <Input
              label="LAST NAME"
              type="text"
              name="lastName"
              id="lastName"
              value={formData.lastName}
              onChange={handleChange('lastName')}
              placeholder="Enter last name"
              required
              error={errors.lastName}
            />
          </div>

          {/* Email */}
          <Input
            label="EMAIL ADDRESS"
            type="email"
            name="email"
            id="email"
            value={formData.email}
            onChange={handleChange('email')}
            placeholder="Enter your email"
            required
            error={errors.email}
          />

          {/* Phone */}
          <Input
            label="PHONE NUMBER"
            type="tel"
            name="phoneNumber"
            id="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleChange('phoneNumber')}
            placeholder="+973 12345678"
            required
            error={errors.phoneNumber}
          />

          {/* Password */}
          <div>
            <PasswordInput
              label="PASSWORD"
              value={formData.password}
              onChange={handleChange('password')}
              placeholder="Create a password"
              required
              name="password"
              id="password"
              error={errors.password}
            />
            {/* Password Strength Indicator */}
            {formData.password && (
              <div className="space-y-1 mt-2 text-sm">
                <div className={passwordValidation.hasMinLength ? 'text-success-text' : 'text-charcoal-400'}>
                  {passwordValidation.hasMinLength ? '✓' : '○'} At least 6 characters
                </div>
                <div className={passwordValidation.hasDigit ? 'text-success-text' : 'text-charcoal-400'}>
                  {passwordValidation.hasDigit ? '✓' : '○'} Contains at least 1 digit
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <PasswordInput
            label="CONFIRM PASSWORD"
            value={formData.confirmPassword}
            onChange={handleChange('confirmPassword')}
            placeholder="Re-enter your password"
            required
            name="confirmPassword"
            id="confirmPassword"
            error={errors.confirmPassword}
          />

          {/* Terms & Conditions */}
          <Checkbox
            label={
              <span>
                I agree to the{' '}
                <a href="/terms" className="text-sage-500 hover:text-sage-700 underline">
                  Terms & Conditions
                </a>
              </span>
            }
            checked={formData.agreedToTerms}
            onChange={handleChange('agreedToTerms')}
            required
            name="agreedToTerms"
            id="agreedToTerms"
            error={errors.agreedToTerms}
          />

          {/* Submit Button */}
          <Button
            type="submit"
            variant="primary"
            fullWidth
            disabled={isLoading}
          >
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </Button>
        </form>

        {/* Login Link */}
        <div className="mt-6 text-center">
          <p className="text-body-regular text-charcoal-400">
            Already have an account?{' '}
            <a
              href="/login"
              className="text-sage-500 hover:text-sage-700 font-medium transition-colors duration-200"
            >
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

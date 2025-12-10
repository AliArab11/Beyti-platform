import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/Button';
import * as Icon from '@phosphor-icons/react';

/**
 * Driver Dashboard Placeholder
 *
 * Temporary page shown to drivers until their full dashboard is implemented.
 * Provides information about upcoming features and contact options.
 */
export default function DriverDashboardPlaceholder() {
  const navigate = useNavigate();

  const handleBackHome = () => {
    console.log('[DriverPlaceholder] Navigating to home');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-cream-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Card Container */}
        <div className="bg-grey-200 rounded-lg p-8 shadow-soft-lift border border-grey-stroke">

          {/* Icon and Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <Icon.Truck size={80} weight="thin" className="text-sage-500" />
            </div>
            <h1 className="text-display-h1 text-charcoal-600 mb-2">
              Driver Dashboard
            </h1>
            <div className="inline-block bg-sage-100 px-4 py-2 rounded-full">
              <p className="text-body-regular text-sage-600 font-medium">
                Coming Soon
              </p>
            </div>
          </div>

          {/* Welcome Message */}
          <div className="bg-cream-100 border border-grey-stroke rounded-lg p-6 mb-6">
            <p className="text-body-regular text-charcoal-600 text-center">
              Welcome to Beyti! Your driver dashboard is currently under development.
              We're working hard to bring you a comprehensive platform to manage your deliveries and earnings.
            </p>
          </div>

          {/* Upcoming Features */}
          <div className="mb-8">
            <h2 className="text-card-h2 text-charcoal-600 mb-4">
              What's Coming:
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <Icon.MapPin size={24} weight="duotone" className="text-sage-500 flex-shrink-0" />
                <div>
                  <h3 className="text-body-regular font-medium text-charcoal-600">View Delivery Requests</h3>
                  <p className="text-sm text-charcoal-400">See available deliveries in your area</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Icon.CurrencyDollar size={24} weight="duotone" className="text-sage-500 flex-shrink-0" />
                <div>
                  <h3 className="text-body-regular font-medium text-charcoal-600">Track Earnings</h3>
                  <p className="text-sm text-charcoal-400">Monitor your income in real-time</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Icon.Calendar size={24} weight="duotone" className="text-sage-500 flex-shrink-0" />
                <div>
                  <h3 className="text-body-regular font-medium text-charcoal-600">Manage Availability</h3>
                  <p className="text-sm text-charcoal-400">Set your working hours and status</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Icon.ClockCounterClockwise size={24} weight="duotone" className="text-sage-500 flex-shrink-0" />
                <div>
                  <h3 className="text-body-regular font-medium text-charcoal-600">Delivery History</h3>
                  <p className="text-sm text-charcoal-400">Review your completed deliveries</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              variant="primary"
              fullWidth
              onClick={handleBackHome}
            >
              Back to Home
            </Button>
            <Button
              variant="secondary"
              fullWidth
              onClick={() => {
                window.location.href = 'mailto:support@beyti.com';
              }}
            >
              Contact Support
            </Button>
          </div>

          {/* Additional Info */}
          <div className="mt-6 text-center">
            <p className="text-sm text-charcoal-400">
              Have questions? Email us at{' '}
              <a
                href="mailto:support@beyti.com"
                className="text-sage-500 hover:text-sage-700 underline"
              >
                support@beyti.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

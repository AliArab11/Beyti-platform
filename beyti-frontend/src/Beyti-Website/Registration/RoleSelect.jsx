import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Role Selection Page
 *
 * "The Binary Choice" - Second step in registration flow.
 * User chooses between Customer (shopping) or Partner (business roles).
 *
 * Two views:
 * - Initial: Shop vs Partner choice
 * - Partner: Seller, Service Provider, or Driver choice
 */
export default function RoleSelect() {
  const navigate = useNavigate();
  const [view, setView] = useState('initial'); // 'initial' | 'partner'

  return (
    <div className="min-h-screen bg-cream-50 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-display-h1 text-charcoal-600 mb-2">
            {view === 'initial' ? 'Choose Your Path' : 'Select Partner Type'}
          </h1>
          <p className="text-body-regular text-charcoal-400">
            {view === 'initial'
              ? 'How would you like to use Beyti?'
              : 'What type of business partner are you?'}
          </p>
        </div>

        {/* View A: Initial Choice (Customer vs Partner) */}
        {view === 'initial' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Customer Card */}
            <button
              onClick={() => navigate('/customer')}
              className="
                bg-grey-200 p-8 rounded-lg shadow-soft-lift border border-grey-stroke
                hover:shadow-lg hover:border-sage-500
                transition-all duration-200
                text-left
              "
            >
              <div className="text-6xl mb-4">🛍️</div>
              <h2 className="text-card-h2 text-charcoal-600 mb-2">
                I want to Shop
              </h2>
              <p className="text-body-regular text-charcoal-400">
                Browse products and services from local vendors
              </p>
            </button>

            {/* Partner Card */}
            <button
              onClick={() => setView('partner')}
              className="
                bg-grey-200 p-8 rounded-lg shadow-soft-lift border border-grey-stroke
                hover:shadow-lg hover:border-sage-500
                transition-all duration-200
                text-left
              "
            >
              <div className="text-6xl mb-4">🤝</div>
              <h2 className="text-card-h2 text-charcoal-600 mb-2">
                I want to become a Partner
              </h2>
              <p className="text-body-regular text-charcoal-400">
                Sell products, offer services, or deliver orders
              </p>
            </button>
          </div>
        )}

        {/* View B: Partner Type Selection */}
        {view === 'partner' && (
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {/* Seller Card */}
              <button
                onClick={() => navigate('/seller-onboarding')}
                className="
                  bg-grey-200 p-6 rounded-lg shadow-soft-lift border border-grey-stroke
                  hover:shadow-lg hover:border-sage-500
                  transition-all duration-200
                  text-left
                "
              >
                <div className="text-5xl mb-3">🏪</div>
                <h3 className="text-card-h2 text-charcoal-600 mb-2">Seller</h3>
                <p className="text-body-regular text-charcoal-400 text-sm">
                  Sell physical products through your own store
                </p>
              </button>

              {/* Service Provider Card */}
              <button
                onClick={() => navigate('/provider-onboarding')}
                className="
                  bg-grey-200 p-6 rounded-lg shadow-soft-lift border border-grey-stroke
                  hover:shadow-lg hover:border-sage-500
                  transition-all duration-200
                  text-left
                "
              >
                <div className="text-5xl mb-3">🛠️</div>
                <h3 className="text-card-h2 text-charcoal-600 mb-2">
                  Service Provider
                </h3>
                <p className="text-body-regular text-charcoal-400 text-sm">
                  Offer professional services like plumbing, tutoring, or cleaning
                </p>
              </button>

              {/* Driver Card */}
              <button
                onClick={() => navigate('/driver-onboarding')}
                className="
                  bg-grey-200 p-6 rounded-lg shadow-soft-lift border border-grey-stroke
                  hover:shadow-lg hover:border-sage-500
                  transition-all duration-200
                  text-left
                "
              >
                <div className="text-5xl mb-3">🚚</div>
                <h3 className="text-card-h2 text-charcoal-600 mb-2">Driver</h3>
                <p className="text-body-regular text-charcoal-400 text-sm">
                  Deliver orders and earn by transporting goods
                </p>
              </button>
            </div>

            {/* Back Button */}
            <div className="text-center">
              <button
                onClick={() => setView('initial')}
                className="
                  text-body-regular text-sage-500 hover:text-sage-700
                  font-medium
                  transition-colors duration-200
                "
              >
                ← Back to main options
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

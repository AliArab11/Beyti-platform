import React, { useState } from 'react';
import Button from '../../../components/Button';

/**
 * Membership Selection Component
 *
 * Displays 3 membership plan cards: Starter (Free), Souq (BHD 15), Partner (BHD 35).
 * Used in Seller and Service Provider onboarding flows.
 *
 * @param {object} props
 * @param {function} props.onSelect - Callback when plan is selected, receives planId
 * @param {string} props.selectedPlan - Currently selected plan ID
 */
export default function MembershipSelection({ onSelect, selectedPlan = null }) {
  const plans = [
    {
      id: 'starter',
      name: 'Starter',
      price: 'Free',
      priceValue: 0,
      features: [
        'Basic listing',
        'Up to 10 products',
        'Email support'
      ],
      buttonVariant: 'secondary',
      recommended: false
    },
    {
      id: 'souq',
      name: 'Souq',
      price: 'BHD 15',
      priceValue: 15,
      priceColor: 'text-sage-500',
      features: [
        'Featured listing',
        'Unlimited products',
        'Priority support',
        'Analytics dashboard'
      ],
      buttonVariant: 'primary',
      recommended: true
    },
    {
      id: 'partner',
      name: 'Partner',
      price: 'BHD 35',
      priceValue: 35,
      features: [
        'Everything in Souq',
        'Dedicated account manager',
        'Advanced analytics',
        'API access'
      ],
      buttonVariant: 'primary',
      recommended: false
    }
  ];

  return (
    <div>
      <h2 className="text-card-h2 text-charcoal-600 mb-4">Choose Your Membership</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const isSelected = selectedPlan === plan.id;

          return (
            <div
              key={plan.id}
              className={`
                bg-grey-200 p-6 rounded-lg shadow-soft-lift
                border-2 relative
                ${isSelected ? 'border-sage-500' : 'border-grey-stroke'}
                ${plan.recommended ? 'border-sage-500' : ''}
                transition-all duration-200
              `}
            >
              {/* Recommended Badge */}
              {plan.recommended && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-sage-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                  Recommended
                </div>
              )}

              {/* Plan Name */}
              <h3 className="text-card-h2 text-charcoal-600 mb-2">
                {plan.name}
              </h3>

              {/* Price */}
              <p className={`text-metric-h3 mb-4 ${plan.priceColor || 'text-charcoal-600'}`}>
                {plan.price}
                {plan.priceValue > 0 && (
                  <span className="text-sm text-charcoal-400">/month</span>
                )}
              </p>

              {/* Features */}
              <ul className="space-y-2 mb-6 text-body-regular text-charcoal-400">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-success-text mr-2">✓</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              {/* Select Button */}
              <Button
                variant={isSelected ? 'success' : plan.buttonVariant}
                fullWidth
                onClick={() => onSelect(plan.id)}
              >
                {isSelected ? 'Selected' : `Select ${plan.name}`}
              </Button>
            </div>
          );
        })}
      </div>

      {selectedPlan && (
        <p className="text-body-regular text-success-text mt-4 text-center">
          ✓ {plans.find(p => p.id === selectedPlan)?.name} plan selected
        </p>
      )}
    </div>
  );
}

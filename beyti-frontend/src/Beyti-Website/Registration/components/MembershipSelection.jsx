import React, { useState, useEffect } from 'react';
import Button from '../../../components/Button';
import { getMembershipPlans } from '../../../services/api';

/**
 * Membership Selection Component
 *
 * Displays membership plan cards fetched from backend.
 * Used in Seller and Service Provider onboarding flows.
 *
 * @param {object} props
 * @param {function} props.onSelect - Callback when plan is selected, receives planId
 * @param {number} props.selectedPlan - Currently selected plan ID
 * @param {function} props.onSubmit - Optional callback to submit/complete registration (for auto-submit on skip)
 */
export default function MembershipSelection({ onSelect, selectedPlan = null, onSubmit = null }) {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const membershipPlans = await getMembershipPlans();

        // Transform backend data to component format
        const transformedPlans = membershipPlans.map((plan, index) => ({
          id: plan.id,
          name: plan.name,
          price: plan.monthlyPrice === 0 ? 'Free' : `BHD ${plan.monthlyPrice}`,
          priceValue: plan.monthlyPrice,
          priceColor: plan.monthlyPrice > 0 ? 'text-sage-500' : undefined,
          features: plan.description ? plan.description.split(', ') : [],
          buttonVariant: plan.monthlyPrice === 0 ? 'secondary' : 'primary',
          recommended: index === 1 // Middle plan is recommended
        }));

        setPlans(transformedPlans);
      } catch (error) {
        console.error('Failed to load membership plans:', error);
        setError('Failed to load membership plans. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, []);

  // Show loading state
  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-body-regular text-charcoal-400">Loading membership plans...</p>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="bg-error-bg border-l-4 border-error-btn p-4 rounded" role="alert">
        <p className="text-body-regular text-error-text">{error}</p>
      </div>
    );
  }

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

      {/* Skip button - assigns free plan and auto-completes registration */}
      <div className="text-center mt-6">
        <Button
          variant="ghost"
          onClick={() => {
            const freePlan = plans.find(p => p.priceValue === 0);
            if (freePlan) {
              onSelect(freePlan.id);
              // Auto-submit if callback provided
              if (onSubmit) {
                setTimeout(() => onSubmit(), 100); // Small delay to ensure state updates
              }
            }
          }}
        >
          Continue with Free Plan
        </Button>
      </div>
    </div>
  );
}

/**
 * Account Suspended Page
 *
 * Displayed when a user's account has been suspended by an administrator
 * Prevents access to dashboard and provides contact information
 */

import React from 'react';
import { Prohibit, EnvelopeSimple, Phone } from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';
import CRUDButton from '../../components/CRUDButton';

const AccountSuspended = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Clear authentication data
    localStorage.removeItem('authToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('userRole');

    // Redirect to login
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-100 to-sage-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-soft-lift overflow-hidden">
          {/* Header with Icon */}
          <div className="bg-error-bg border-b-4 border-error-btn p-8 text-center">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-error-btn rounded-full mb-4">
              <Prohibit size={64} className="text-white" weight="fill" />
            </div>
            <h1 className="text-display-h1 text-charcoal-600 mb-2">
              Account Suspended
            </h1>
            <p className="text-body-large text-charcoal-400">
              Your account has been temporarily suspended
            </p>
          </div>

          {/* Content */}
          <div className="p-8 space-y-6">
            {/* Explanation */}
            <div className="bg-cream-50 border border-grey-stroke rounded-lg p-6">
              <h2 className="text-card-h2 text-charcoal-600 mb-3">
                What does this mean?
              </h2>
              <p className="text-body-regular text-charcoal-500 leading-relaxed mb-4">
                Your account has been suspended due to a violation of our platform policies or terms of service.
                While suspended, you will not be able to:
              </p>
              <ul className="space-y-2 text-body-regular text-charcoal-500">
                <li className="flex items-start gap-2">
                  <span className="text-error-btn font-bold">•</span>
                  <span>Access your dashboard</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-error-btn font-bold">•</span>
                  <span>Modify your services or products</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-error-btn font-bold">•</span>
                  <span>Accept new bookings or orders</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-error-btn font-bold">•</span>
                  <span>Update your profile or settings</span>
                </li>
              </ul>
            </div>

            {/* What to Do Next */}
            <div className="bg-sage-100 border border-sage-300 rounded-lg p-6">
              <h2 className="text-card-h2 text-charcoal-600 mb-3">
                What should I do next?
              </h2>
              <p className="text-body-regular text-charcoal-500 leading-relaxed mb-4">
                If you believe this suspension was made in error or would like to appeal this decision,
                please contact our support team:
              </p>

              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                  <EnvelopeSimple size={24} className="text-sage-600" weight="fill" />
                  <div>
                    <p className="text-label-medium text-charcoal-400">Email Support</p>
                    <a
                      href="mailto:support@beyti.com"
                      className="text-body-medium text-sage-600 hover:text-sage-700 font-semibold"
                    >
                      support@beyti.com
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                  <Phone size={24} className="text-sage-600" weight="fill" />
                  <div>
                    <p className="text-label-medium text-charcoal-400">Phone Support</p>
                    <a
                      href="tel:+97317XXXXXX"
                      className="text-body-medium text-sage-600 hover:text-sage-700 font-semibold"
                    >
                      +973 17 XXXXXX
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Info */}
            <div className="border-t border-grey-stroke pt-6">
              <p className="text-body-small text-charcoal-400 text-center mb-6">
                Your account will remain suspended until an administrator reviews your case and
                makes a decision to reactivate your account.
              </p>

              <div className="flex justify-center">
                <CRUDButton
                  variant="neutral"
                  onClick={handleLogout}
                  className="min-w-[200px]"
                >
                  Logout
                </CRUDButton>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Notice */}
        <div className="mt-6 text-center">
          <p className="text-body-small text-charcoal-400">
            For more information about our policies, please visit our{' '}
            <a href="/terms" className="text-sage-600 hover:text-sage-700 underline">
              Terms of Service
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AccountSuspended;

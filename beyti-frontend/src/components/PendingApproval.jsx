import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from './Button';

/**
 * PendingApproval Component
 *
 * Shown to users whose accounts are awaiting admin approval.
 * Provides information about the pending status, displays rejection reasons,
 * and allows resubmission for rejected applications.
 */
export default function PendingApproval() {
  const navigate = useNavigate();
  const [applicationData, setApplicationData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchApplicationStatus = async () => {
      const userProfileId = localStorage.getItem('userProfileId');
      if (!userProfileId) {
        navigate('/login');
        return;
      }

      try {
        const response = await fetch(`https://localhost:7062/api/ProviderApplications/user/${userProfileId}`);
        if (response.ok) {
          const data = await response.json();
          setApplicationData(data);
        }
      } catch (error) {
        console.error('[PendingApproval] Error fetching application:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchApplicationStatus();
  }, [navigate]);

  const handleLogout = () => {
    // Clear all auth data
    localStorage.removeItem('authToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('userProfileId');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userPhone');

    console.log('[PendingApproval] User logged out');
    navigate('/login');
  };

  const handleResubmit = () => {
    console.log('[PendingApproval] Redirecting to resubmit application');
    navigate('/provider-onboarding');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sage-500"></div>
      </div>
    );
  }

  const isRejected = applicationData?.status === 'Rejected';
  const userEmail = localStorage.getItem('userEmail') || 'your email';

  return (
    <div className="min-h-screen bg-cream-50 flex items-center justify-center p-4">
      <div className="bg-grey-200 rounded-lg p-8 shadow-soft-lift border border-grey-stroke max-w-md w-full text-center">
        {/* Icon */}
        <div className="text-6xl mb-4">{isRejected ? '❌' : '⏳'}</div>

        {/* Title */}
        <h1 className="text-display-h1 text-charcoal-600 mb-4">
          {isRejected ? 'Application Rejected' : 'Account Pending Approval'}
        </h1>

        {/* Message */}
        <p className="text-body-regular text-charcoal-500 mb-6">
          {isRejected
            ? 'Unfortunately, your service provider application was not approved.'
            : 'Thank you for registering with Beyti! Your account is currently under review by our admin team.'}
        </p>

        {/* Rejection Reason */}
        {isRejected && applicationData?.notes && (
          <div className="bg-error-bg border-l-4 border-error-btn rounded-lg p-4 mb-6 text-left">
            <p className="text-body-small text-charcoal-600">
              <strong>Rejection Reason:</strong>
            </p>
            <p className="text-body-small text-charcoal-500 mt-2">
              {applicationData.notes}
            </p>
          </div>
        )}

        {/* Info Box - Only for Pending */}
        {!isRejected && (
          <div className="bg-cream-100 border border-sage-500 rounded-lg p-4 mb-6">
            <p className="text-body-small text-charcoal-600">
              <strong>What happens next?</strong>
            </p>
            <ul className="text-body-small text-charcoal-500 mt-2 space-y-2 text-left">
              <li>• Our team will review your registration details</li>
              <li>• You'll receive an email at <strong>{userEmail}</strong> once approved</li>
              <li>• Approval typically takes 1-2 business days</li>
            </ul>
          </div>
        )}

        <p className="text-body-small text-charcoal-400 mb-6">
          If you have any questions, please contact us at <strong>support@beyti.com</strong>
        </p>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          {isRejected && (
            <Button
              variant="primary"
              fullWidth
              onClick={handleResubmit}
            >
              Resubmit Application
            </Button>
          )}
          <Button
            variant="secondary"
            fullWidth
            onClick={handleLogout}
          >
            Logout
          </Button>
        </div>
      </div>
    </div>
  );
}

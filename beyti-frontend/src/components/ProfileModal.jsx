/**
 * Profile Modal Component
 *
 * Modal wrapper for displaying and editing user profile
 */

import { X } from '@phosphor-icons/react';
import ProfilePage from './ProfilePage';

export default function ProfileModal({
  isOpen,
  onClose,
  userProfile,
  userRole,
  entityId,
  onProfileUpdate
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-screen items-center justify-center p-4">
        <div
          className="relative w-full max-w-5xl bg-cream-50 dark:bg-charcoal-600 rounded-lg shadow-xl transition-colors max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 bg-grey-200 dark:bg-charcoal-500 text-charcoal-600 dark:text-cream-50 rounded-md hover:bg-grey-300 dark:hover:bg-charcoal-400 transition-colors"
            aria-label="Close modal"
          >
            <X size={24} />
          </button>

          {/* Profile Content */}
          <div className="p-8">
            <ProfilePage
              userProfile={userProfile}
              userRole={userRole}
              entityId={entityId}
              onProfileUpdate={onProfileUpdate}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

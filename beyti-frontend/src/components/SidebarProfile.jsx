/**
 * Sidebar Profile Section Component
 *
 * User profile section located at the bottom of the sidebar.
 *
 * Specifications:
 * - Context: Located at bottom of Sidebar (on bg-sage-500)
 * - Layout: Flex row (items-center, justify-between or gap-4)
 * - Border: Top border 1px solid border-sage-700
 * - Padding: p-4 or py-6 px-4
 * - Name Typography: text-body-regular (Inter 16px), Color: text-cream-200
 * - Role Typography: text-label-medium (Inter 12px), Color: text-cream-100
 * - Avatar: Size w-10 h-10 (40px), Style: Circular, bg-sage-700 or transparent
 */

import React, { useState } from 'react';
import { CaretDown, User } from '@phosphor-icons/react';

const SidebarProfile = ({
  userName = 'Ali',
  userRole = 'Super Admin',
  avatarUrl,
  onProfileClick,
  className = '',
  ...props
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div
      className={`
        border-t border-sage-700 dark:border-charcoal-400
        p-4
        ${className}
      `}
      {...props}
    >
      <div className="flex items-center justify-between gap-4">
        {/* Avatar and Info */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Avatar */}
          <div className="w-10 h-10 rounded-full bg-sage-700 dark:bg-charcoal-400 flex items-center justify-center flex-shrink-0 overflow-hidden">
            {avatarUrl ? (
              <img src={avatarUrl} alt={userName} className="w-full h-full object-cover" />
            ) : (
              <User size={20} className="text-cream-200 dark:text-cream-50" />
            )}
          </div>

          {/* Name and Role */}
          <div className="flex-1 min-w-0">
            <p className="text-body-regular text-cream-200 dark:text-cream-50 truncate">{userName}</p>
            <p className="text-label-medium text-cream-100 dark:text-gray-400 truncate">{userRole}</p>
          </div>
        </div>

        {/* Chevron/Collapse Icon */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex-shrink-0 p-1 hover:bg-sage-700 dark:hover:bg-charcoal-400 rounded transition-colors"
        >
          <CaretDown
            size={16}
            className={`text-cream-200 dark:text-cream-50 transition-transform ${
              isExpanded ? 'rotate-180' : ''
            }`}
          />
        </button>
      </div>

      {/* Expanded Menu (Optional) */}
      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-sage-700 dark:border-charcoal-400 space-y-2">
          <button className="w-full text-left px-3 py-2 text-body-regular text-cream-200 dark:text-cream-50 hover:bg-sage-700 dark:hover:bg-charcoal-400 rounded transition-colors">
            Profile Settings
          </button>
          <button className="w-full text-left px-3 py-2 text-body-regular text-cream-200 dark:text-cream-50 hover:bg-sage-700 dark:hover:bg-charcoal-400 rounded transition-colors">
            Preferences
          </button>
          <button className="w-full text-left px-3 py-2 text-body-regular text-error-btn dark:text-error-btn hover:bg-sage-700 dark:hover:bg-charcoal-400 rounded transition-colors">
            Logout
          </button>
        </div>
      )}
    </div>
  );
};

export default SidebarProfile;

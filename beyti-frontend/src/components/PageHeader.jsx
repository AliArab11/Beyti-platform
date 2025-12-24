/**
 * Page Header Component
 *
 * Top page header with title, optional search, notification bell, and user dropdown.
 *
 * Specifications:
 * - Layout: Flex (justify-between, items-center)
 * - Divider: Bottom border 1px solid border-grey-stroke
 * - Height: ~80px
 * - Title Typography: text-display-h1 (Merriweather 32px), text-charcoal-600
 * - Search Bar: Border border-charcoal-400, Text text-charcoal-400, Radius rounded-md
 * - Notification Bell: Background bg-sage-500, Icon text-sage-100, Radius rounded-md
 * - User Dropdown: Border border-grey-stroke, Text text-body-regular, Radius rounded-md
 *
 * Variants:
 * - withSearch: Includes central search input field
 * - simple: Title and right-hand controls only
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MagnifyingGlass, Bell, CaretDown, User, House, Gear, SignOut } from '@phosphor-icons/react';
import SettingsModal from './SettingsModal';
import { logout } from '../utils/auth';
import NotificationDropdown from './NotificationDropdown';

const PageHeader = ({
  title,
  withSearch = false,
  searchPlaceholder = 'Search Business name, contact...',
  onSearch,
  notificationCount = 0,
  userName = 'User',
  userRole = 'Admin',
  userProfile = null,
  entityId = null, // Service Provider ID, Seller ID, etc.
  userId = null, // User ID for notifications
  onUserMenuClick,
  onProfileClick,
  onProfileUpdate, // Callback when profile is updated
  onLogout,
  additionalActions = null, 
  className = '',
  ...props
}) => {
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState('');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleSearch = (e) => {
    setSearchValue(e.target.value);
    if (onSearch) {
      onSearch(e.target.value);
    }
  };

const handleProfileClick = () => {
  setIsUserMenuOpen(false);
  // Navigate to profile page by default, or call custom handler if provided
  if (onProfileClick) {
    onProfileClick();
  } else {
    navigate('/profile');
  }
};


  const handleSettingsClick = () => {
    setIsUserMenuOpen(false);
    setIsSettingsOpen(true);
  };

  const handleLogout = () => {
    setIsUserMenuOpen(false);
    // Call custom logout handler if provided
    if (onLogout) {
      onLogout();
    } else {
      // Default logout behavior
      logout();
      navigate('/login');
    }
  };

  return (
    <header
      className={`
        flex items-center justify-between
        h-[80px] px-6
        border-b border-grey-stroke dark:border-charcoal-400
        bg-cream-50 dark:bg-charcoal-500
        transition-colors
        ${className}
      `}
      {...props}
    >
      {/* Left: Page Title */}
      <h1 className="text-display-h1 text-charcoal-600 dark:text-cream-50">{title}</h1>

      {/* Center: Search Bar (if withSearch) */}
      {withSearch && (
        <div className="flex-1 max-w-md mx-8">
          <div className="relative">
            <MagnifyingGlass
              size={20}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-400 dark:text-charcoal-300"
            />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={handleSearch}
              className="
                w-full h-[42px] pl-10 pr-4
                border border-charcoal-400 dark:border-charcoal-300
                rounded-md
                text-body-regular text-charcoal-600 dark:text-cream-50
                placeholder:text-charcoal-400 dark:placeholder:text-charcoal-300
                focus:outline-none focus:ring-2 focus:ring-sage-500
                bg-grey-200 dark:bg-charcoal-400
                transition-colors
              "
            />
          </div>
        </div>
      )}

      {/* Right: Controls */}
      <div className="flex items-center gap-4">
        {/* Notification Bell */}
        <NotificationDropdown userId={userId} />

        {/* Additional Actions (like Cart Button) */}
        {additionalActions}

        {/* User Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="
              flex items-center gap-2 h-[42px] px-3
              border border-grey-stroke dark:border-charcoal-400 rounded-md
              text-body-regular text-charcoal-600 dark:text-cream-50
              hover:bg-cream-100 dark:hover:bg-charcoal-400
              transition-colors
            "
          >
            <User size={20} className="text-charcoal-600 dark:text-cream-50" />
            <span>{userName}</span>
            <CaretDown size={16} className="text-charcoal-400 dark:text-charcoal-300" />
          </button>

          {/* Dropdown Menu */}
          {isUserMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setIsUserMenuOpen(false)}
              />
              <div className="absolute top-full right-0 mt-2 w-80 bg-grey-200 dark:bg-charcoal-500 border border-grey-stroke dark:border-charcoal-400 rounded-md shadow-soft-lift z-20 overflow-hidden">
                {/* Profile Details Section */}
                <div className="px-4 py-4 border-b border-grey-stroke dark:border-charcoal-400 bg-cream-50 dark:bg-charcoal-600">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-full bg-sage-500 dark:bg-sage-700 flex items-center justify-center flex-shrink-0">
                      <User size={24} weight="fill" className="text-sage-100 dark:text-cream-50" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-body-regular text-charcoal-600 dark:text-cream-50 font-semibold truncate">
                        {userProfile?.displayName || userName}
                      </p>
                      <p className="text-label-medium text-charcoal-400 dark:text-charcoal-300 mt-0.5">
                        {userRole}
                      </p>
                      {userProfile?.phone && userRole !== 'Admin' && userRole !== 'Super Admin' && (
                        <p className="text-label-small text-charcoal-500 dark:text-charcoal-300 mt-1">
                          {userProfile.phone}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Additional Profile Info */}
                  {userProfile && (userRole !== 'Admin' && userRole !== 'Super Admin') && (
                    <div className="mt-3 pt-3 border-t border-grey-stroke dark:border-charcoal-400 space-y-1.5">
                      {userProfile.address && (
                        <div className="flex items-start gap-2">
                          <span className="text-label-small text-charcoal-400 dark:text-charcoal-300 min-w-[60px]">Address:</span>
                          <span className="text-label-small text-charcoal-600 dark:text-cream-50 break-words">
                            {typeof userProfile.address === 'string'
                              ? userProfile.address
                              : `${userProfile.address.street || ''}, ${userProfile.address.city || ''}, ${userProfile.address.region || ''} ${userProfile.address.postalCode || ''}, ${userProfile.address.country || ''}`.replace(/,\s*,/g, ',').replace(/^,\s*/, '').replace(/,\s*$/, '')}
                          </span>
                        </div>
                      )}
                      {userProfile.createdAt && (
                        <div className="flex items-start gap-2">
                          <span className="text-label-small text-charcoal-400 dark:text-charcoal-300 min-w-[60px]">Member Since:</span>
                          <span className="text-label-small text-charcoal-600 dark:text-cream-50">
                            {new Date(userProfile.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Menu Actions */}
                <div className="py-1">
                  {/* Return to Home - Only show for Customer role */}
                  {userRole === 'Customer' && (
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      window.location.href = '/mainStore';
                    }}
                    className="w-full px-4 py-2.5 text-left text-body-regular text-charcoal-600 dark:text-cream-50 hover:bg-cream-100 dark:hover:bg-charcoal-400 transition-colors flex items-center gap-3"
                  >
                    <House size={20} weight="regular" className="text-charcoal-500 dark:text-charcoal-300" />
                    <span style={{ fontFamily: 'Inter, sans-serif' }}>Return to Home</span>
                  </button>
                )}
                  
                  <button
                    onClick={handleProfileClick}
                    className="w-full px-4 py-2.5 text-left text-body-regular text-charcoal-600 dark:text-cream-50 hover:bg-cream-100 dark:hover:bg-charcoal-400 transition-colors flex items-center gap-3"
                  >
                    <User size={20} weight="regular" className="text-charcoal-500 dark:text-charcoal-300" />
                    <span style={{ fontFamily: 'Inter, sans-serif' }}>View Profile</span>
                  </button>
                  <button
                    onClick={handleSettingsClick}
                    className="w-full px-4 py-2.5 text-left text-body-regular text-charcoal-600 dark:text-cream-50 hover:bg-cream-100 dark:hover:bg-charcoal-400 transition-colors flex items-center gap-3"
                  >
                    <Gear size={20} weight="regular" className="text-charcoal-500 dark:text-charcoal-300" />
                    <span style={{ fontFamily: 'Inter, sans-serif' }}>Settings</span>
                  </button>
                </div>

                {/* Logout Section */}
                <div className="border-t border-grey-stroke dark:border-charcoal-400">
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2.5 text-left text-body-regular text-error-text dark:text-red-400 hover:bg-error-bg dark:hover:bg-red-900/20 transition-colors flex items-center gap-3"
                  >
                    <SignOut size={20} weight="regular" className="text-error-text dark:text-red-400" />
                    <span style={{ fontFamily: 'Inter, sans-serif' }}>Logout</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Settings Modal */}
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

    </header>
  );
};

export default PageHeader;

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
import { MagnifyingGlass, Bell, CaretDown, User } from '@phosphor-icons/react';

const PageHeader = ({
  title,
  withSearch = false,
  searchPlaceholder = 'Search Business name, contact...',
  onSearch,
  notificationCount = 0,
  userName = 'User',
  userRole = 'Admin',
  userProfile = null,
  onUserMenuClick,
  onProfileClick,
  className = '',
  ...props
}) => {
  const [searchValue, setSearchValue] = useState('');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const handleSearch = (e) => {
    setSearchValue(e.target.value);
    if (onSearch) {
      onSearch(e.target.value);
    }
  };

  const handleProfileClick = () => {
    setIsUserMenuOpen(false);
    if (onProfileClick) {
      onProfileClick();
    }
  };

  return (
    <header
      className={`
        flex items-center justify-between
        h-[80px] px-6
        border-b border-grey-stroke
        bg-cream-50
        ${className}
      `}
      {...props}
    >
      {/* Left: Page Title */}
      <h1 className="text-display-h1 text-charcoal-600">{title}</h1>

      {/* Center: Search Bar (if withSearch) */}
      {withSearch && (
        <div className="flex-1 max-w-md mx-8">
          <div className="relative">
            <MagnifyingGlass
              size={20}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-400"
            />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={handleSearch}
              className="
                w-full h-[42px] pl-10 pr-4
                border border-charcoal-400
                rounded-md
                text-body-regular text-charcoal-600
                placeholder:text-charcoal-400
                focus:outline-none focus:ring-2 focus:ring-sage-500
                bg-grey-200
              "
            />
          </div>
        </div>
      )}

      {/* Right: Controls */}
      <div className="flex items-center gap-4">
        {/* Notification Bell */}
        <button className="relative p-2 bg-sage-500 rounded-md hover:bg-sage-700 transition-colors">
          <Bell size={20} weight="fill" className="text-sage-100" />
          {notificationCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-error-btn text-white text-xs flex items-center justify-center rounded-full">
              {notificationCount > 9 ? '9+' : notificationCount}
            </span>
          )}
        </button>

        {/* User Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="
              flex items-center gap-2 h-[42px] px-3
              border border-grey-stroke rounded-md
              text-body-regular text-charcoal-600
              hover:bg-cream-100
              transition-colors
            "
          >
            <User size={20} className="text-charcoal-600" />
            <span>{userName}</span>
            <CaretDown size={16} className="text-charcoal-400" />
          </button>

          {/* Dropdown Menu */}
          {isUserMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setIsUserMenuOpen(false)}
              />
              <div className="absolute top-full right-0 mt-2 w-80 bg-grey-200 border border-grey-stroke rounded-md shadow-soft-lift z-20 overflow-hidden">
                {/* Profile Details Section */}
                <div className="px-4 py-4 border-b border-grey-stroke bg-cream-50">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-full bg-sage-500 flex items-center justify-center flex-shrink-0">
                      <User size={24} weight="fill" className="text-sage-100" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-body-regular text-charcoal-600 font-semibold truncate">
                        {userProfile?.displayName || userName}
                      </p>
                      <p className="text-label-medium text-charcoal-400 mt-0.5">
                        {userRole}
                      </p>
                      {userProfile?.phone && (
                        <p className="text-label-small text-charcoal-500 mt-1">
                          {userProfile.phone}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Additional Profile Info */}
                  {userProfile && (
                    <div className="mt-3 pt-3 border-t border-grey-stroke space-y-1.5">
                      {userProfile.address && (
                        <div className="flex items-start gap-2">
                          <span className="text-label-small text-charcoal-400 min-w-[60px]">Address:</span>
                          <span className="text-label-small text-charcoal-600 break-words">
                            {userProfile.address}
                          </span>
                        </div>
                      )}
                      {userProfile.createdAt && (
                        <div className="flex items-start gap-2">
                          <span className="text-label-small text-charcoal-400 min-w-[60px]">Member Since:</span>
                          <span className="text-label-small text-charcoal-600">
                            {new Date(userProfile.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Menu Actions */}
                <div className="py-1">
                  <button
                    onClick={handleProfileClick}
                    className="w-full px-4 py-2.5 text-left text-body-regular text-charcoal-600 hover:bg-cream-100 transition-colors flex items-center gap-2"
                  >
                    <User size={18} className="text-charcoal-500" />
                    <span>View Profile</span>
                  </button>
                  <button className="w-full px-4 py-2.5 text-left text-body-regular text-charcoal-600 hover:bg-cream-100 transition-colors flex items-center gap-2">
                    <span className="text-charcoal-500">⚙️</span>
                    <span>Settings</span>
                  </button>
                </div>

                {/* Logout Section */}
                <div className="border-t border-grey-stroke">
                  <button className="w-full px-4 py-2.5 text-left text-body-regular text-error-text hover:bg-error-bg transition-colors flex items-center gap-2">
                    <span>🚪</span>
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default PageHeader;

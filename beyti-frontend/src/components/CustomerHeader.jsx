/**
 * Customer Header Component
 * 
 * Specialized header for customer-facing pages with search, notifications, cart, and profile
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MagnifyingGlass, Bell, ShoppingCartSimple, User, Package, MapPin, Gear, SignOut, House, ArrowLeft, CaretDown  } from '@phosphor-icons/react';
import NotificationDropdown from './NotificationDropdown';

const CustomerHeader = ({
  title = "Beyti",
  showSearch = true,
  searchPlaceholder = "Search stores, products...",
  searchValue = "",
  onSearchChange,
  customerName = null,
  customerId = null,
  cart = [],
  stores = [],
  customerAddresses = [],
  onCartClick,
  onCustomerClick, // For login button
  onLogout,
  onBack, // Back button handler
  showBackButton = false, // Show back arrow
  variant = "store", // "store" or "dashboard"
  className = "",
  ...props
}) => {
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleSearchChange = (e) => {
    if (onSearchChange) {
      onSearchChange(e.target.value);
    }
  };

  const handleCartClick = () => {
    if (onCartClick) {
      onCartClick();
    } else {
      // Default cart behavior - find store with items and navigate
      let targetStoreId = null;
      let targetStoreName = null;
      let targetStore = null;
      
      if (customerId) {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith(`beyti_cart_`) && key.endsWith(`_${customerId}`)) {
            try {
              const savedCart = localStorage.getItem(key);
              if (savedCart) {
                const parsedCart = JSON.parse(savedCart);
                if (parsedCart.length > 0) {
                  const parts = key.split('_');
                  targetStoreId = parts[2];
                  targetStoreName = parsedCart[0]?.storeName;
                  targetStore = stores?.find(s => s.id.toString() === targetStoreId);
                  break;
                }
              }
            } catch (err) {
              console.error('Error parsing cart:', err);
            }
          }
        }
      }
      
      navigate("/checkout", { 
        state: { 
          customerId, 
          customerName,
          customerAddresses,
          selectedStore: targetStore,
          storeName: targetStoreName,
          storeId: targetStoreId
        } 
      });
    }
  };

  const handleLogout = () => {
    setIsDropdownOpen(false);
    if (onLogout) {
      onLogout();
    } else {
      // Default logout
      sessionStorage.removeItem('beyti_customerId');
      sessionStorage.removeItem('beyti_customerName');
      if (customerId) {
        localStorage.removeItem(`beyti_activeOrder_${customerId}`);
        localStorage.removeItem(`beyti_bannerDismissed_${customerId}`);
      }
      navigate('/', { replace: true });
    }
  };

  const cartItemCount = cart.reduce((total, item) => total + item.quantity, 0);

  return (
    <header
      className={`
        bg-cream-50 dark:bg-charcoal-500 
        border-b border-grey-stroke dark:border-charcoal-400
        transition-colors
        ${className}
      `}
      {...props}
    >
      <div className="w-full pl-8 py-4">
        <div className="relative w-full flex items-center">
        {/* Left: Back Button (if shown) OR Brand */}
          <div className="flex items-center gap-6">
            {showBackButton && (
              <button 
                onClick={onBack}
                className="p-2 hover:bg-grey-200 dark:hover:bg-charcoal-400 rounded-lg transition-all"
              >
                <ArrowLeft className="w-6 h-6 text-charcoal-600 dark:text-cream-50" weight="bold" />
              </button>
            )}
            <h1
            className="text-[32px] font-bold text-sage-500 dark:text-sage-400"
            style={{ fontFamily: 'Merriweather, serif' }}
            >
            {title}
            </h1>

          </div>

        {/* Center: Search Bar */}
          {showSearch && (
            <div className="absolute left-1/2 -translate-x-1/2 w-full max-w-xl px-4">
                <div className="relative">
                <MagnifyingGlass
                    size={20}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-charcoal-400"
                />
                <input
                    type="text"
                    placeholder={searchPlaceholder}
                    value={searchValue}
                    onChange={handleSearchChange}
                    className="
                    w-full h-[44px] pl-12 pr-4
                    border-2 border-grey-stroke
                    rounded-full
                    bg-white
                    text-charcoal-600
                    placeholder:text-charcoal-400
                    focus:outline-none focus:ring-2 focus:ring-sage-500
                    "
                />
                </div>
            </div>
            )}


        {/* Right: Actions */}
          <div className="flex items-center gap-4 ml-auto pr-[clamp(16px,4vw,32px)]">
          {/* Notifications */}
          <NotificationDropdown userId={customerId} />

          {/* Cart Button */}
          <button
            onClick={handleCartClick}
            className="p-2 hover:bg-grey-200 dark:hover:bg-charcoal-400 rounded-lg transition-all relative"
          >
            <ShoppingCartSimple 
              className="w-5 h-5 text-charcoal-400 dark:text-charcoal-300"
              weight="regular"
            />
            {cartItemCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-sage-500 text-white min-w-[20px] h-5 px-1.5 rounded-full flex items-center justify-center text-xs font-bold">
                {cartItemCount}
              </span>
            )}
          </button>

          {/* User Section */}
          {customerName ? (
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="
                  flex items-center gap-2 h-[42px] px-3
                  border border-grey-stroke dark:border-charcoal-400 rounded-md
                  text-body-regular text-charcoal-600 dark:text-cream-50
                  hover:bg-cream-100 dark:hover:bg-charcoal-400
                  transition-colors
                "
              >
                <User size={20} className="text-charcoal-600 dark:text-cream-50" />
                <span>{customerName}</span>
                <CaretDown size={16} className="text-charcoal-400 dark:text-charcoal-300" />
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setIsDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-80 bg-grey-200 dark:bg-charcoal-500 border border-grey-stroke dark:border-charcoal-400 rounded-md shadow-[0_4px_20px_rgba(0,0,0,0.15)] z-20 overflow-hidden">
                    {/* Profile Details */}
                    <div className="px-4 py-4 border-b border-grey-stroke dark:border-charcoal-400 bg-cream-50 dark:bg-charcoal-600">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-full bg-sage-500 dark:bg-sage-700 flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-lg font-semibold">{customerName[0]}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-body-regular text-charcoal-600 dark:text-cream-50 font-semibold truncate" style={{ fontFamily: 'Inter, sans-serif' }}>
                            {customerName}
                          </p>
                          <p className="text-label-medium text-charcoal-400 dark:text-charcoal-300 mt-0.5" style={{ fontFamily: 'Inter, sans-serif' }}>
                            Customer
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Menu Actions */}
                    <div className="py-1">
                      {variant === "dashboard" ? (
                        // Dashboard variant - show "Return to Home"
                        <button
                          onClick={() => {
                            setIsDropdownOpen(false);
                            navigate('/mainStore', { state: { customerId, customerName } });
                          }}
                          className="w-full px-4 py-2.5 text-left text-body-regular text-charcoal-600 dark:text-cream-50 hover:bg-cream-100 dark:hover:bg-charcoal-400 transition-colors flex items-center gap-3"
                        >
                          <House size={20} weight="regular" className="text-charcoal-500 dark:text-charcoal-300" />
                          <span style={{ fontFamily: 'Inter, sans-serif' }}>Return to Home</span>
                        </button>
                      ) : (
                        // Store variant - show "My Orders"
                        <button
                          onClick={() => {
                            setIsDropdownOpen(false);
                            navigate('/customer-dashboard');
                          }}
                          className="w-full px-4 py-2.5 text-left text-body-regular text-charcoal-600 dark:text-cream-50 hover:bg-cream-100 dark:hover:bg-charcoal-400 transition-colors flex items-center gap-3"
                        >
                          <Package size={20} weight="regular" className="text-charcoal-500 dark:text-charcoal-300" />
                          <span style={{ fontFamily: 'Inter, sans-serif' }}>My Orders</span>
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setIsDropdownOpen(false);
                          // TODO: Navigate to profile page
                        }}
                        className="w-full px-4 py-2.5 text-left text-body-regular text-charcoal-600 dark:text-cream-50 hover:bg-cream-100 dark:hover:bg-charcoal-400 transition-colors flex items-center gap-3"
                      >
                        <User size={20} weight="regular" className="text-charcoal-500 dark:text-charcoal-300" />
                        <span style={{ fontFamily: 'Inter, sans-serif' }}>Profile</span>
                      </button>

                      <button
                        onClick={() => {
                          setIsDropdownOpen(false);
                          // TODO: Navigate to settings page
                        }}
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
          ) : (
            <button
              onClick={onCustomerClick}
              className="flex items-center gap-2 pl-4 border-l border-grey-stroke dark:border-charcoal-400 bg-sage-500 hover:bg-sage-600 text-white px-4 py-2 rounded-lg transition-all"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              <span className="text-sm font-semibold" style={{ fontFamily: 'Inter, sans-serif' }}>
                Login
              </span>
            </button>
          )}
        </div>
      </div>
     </div>
    </header>
  );
};

export default CustomerHeader;
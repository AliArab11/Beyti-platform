/**
 * Customer Sidebar Component
 *
 * Reusable sidebar for customer-facing pages
 * Provides consistent navigation across the customer portal
 */

import React from 'react';
import {
  Storefront,
  Scissors,
  Bell,
  ClockCounterClockwise,
  User,
  CaretDown
} from '@phosphor-icons/react';
import NavigationButton from './NavigationButton';

const CustomerSidebar = ({ currentPage, onNavigate, userName = "Customer", userRole = "Customer" }) => {
  return (
    <aside className="w-[250px] bg-sage-500 dark:bg-charcoal-500 flex flex-col fixed h-screen transition-colors border-r border-sage-700 dark:border-charcoal-400">
      <div className="p-6 border-b border-sage-700 dark:border-charcoal-400">
        <h1 className="text-display-h1 text-cream-200 dark:text-cream-50">Beyti</h1>
        <p className="text-label-medium text-cream-100 dark:text-charcoal-300 mt-1">Customer Portal</p>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        <NavigationButton
          selected={currentPage === 'stores'}
          icon={<Storefront size={20} weight={currentPage === 'stores' ? 'fill' : 'regular'} />}
          onClick={() => onNavigate('stores')}
        >
          Stores
        </NavigationButton>

        <NavigationButton
          selected={currentPage === 'services'}
          icon={<Scissors size={20} weight={currentPage === 'services' ? 'fill' : 'regular'} />}
          onClick={() => onNavigate('services')}
        >
          Services
        </NavigationButton>

        <NavigationButton
          selected={currentPage === 'notifications'}
          icon={<Bell size={20} weight={currentPage === 'notifications' ? 'fill' : 'regular'} />}
          onClick={() => onNavigate('notifications')}
        >
          Notifications
        </NavigationButton>

        <NavigationButton
          selected={currentPage === 'history'}
          icon={<ClockCounterClockwise size={20} weight={currentPage === 'history' ? 'fill' : 'regular'} />}
          onClick={() => onNavigate('history')}
        >
          Orders & Services History
        </NavigationButton>
      </nav>

      <div className="border-t border-sage-700 dark:border-charcoal-400 p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-full bg-sage-700 dark:bg-charcoal-400 flex items-center justify-center flex-shrink-0">
              <User size={20} className="text-cream-200 dark:text-cream-50" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-body-regular text-cream-200 dark:text-cream-50 truncate">{userName}</p>
              <p className="text-label-medium text-cream-100 dark:text-charcoal-300 truncate">{userRole}</p>
            </div>
          </div>
          <button className="flex-shrink-0 p-1 hover:bg-sage-700 dark:hover:bg-charcoal-400 rounded transition-colors">
            <CaretDown size={16} className="text-cream-200 dark:text-cream-50" />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default CustomerSidebar;

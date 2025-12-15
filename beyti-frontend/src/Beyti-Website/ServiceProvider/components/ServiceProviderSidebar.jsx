/**
 * Service Provider Sidebar Component
 *
 * Reusable sidebar for all service provider pages
 * Provides consistent navigation across the service provider portal
 */

import React from 'react';
import {
  House,
  Briefcase,
  CalendarCheck,
  CalendarBlank,
  Calendar,
  User,
  CaretDown,
  Star,
  Bell
} from '@phosphor-icons/react';
import NavigationButton from '../../../components/NavigationButton';

const ServiceProviderSidebar = ({ currentPage, onNavigate, userName = "Service Provider", userRole = "Provider" }) => {
  return (
    <aside className="w-[250px] bg-sage-500 dark:bg-charcoal-500 flex flex-col fixed h-screen transition-colors border-r border-sage-700 dark:border-charcoal-400">
      <div className="p-6 border-b border-sage-700 dark:border-charcoal-400">
        <h1 className="text-display-h1 text-cream-200 dark:text-cream-50">Beyti</h1>
        <p className="text-label-medium text-cream-100 dark:text-charcoal-300 mt-1">Provider Portal</p>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        <NavigationButton
          selected={currentPage === 'overview'}
          icon={<House size={20} weight={currentPage === 'overview' ? 'fill' : 'regular'} />}
          onClick={() => onNavigate('overview')}
        >
          Dashboard
        </NavigationButton>

        <NavigationButton
          selected={currentPage === 'services'}
          icon={<Briefcase size={20} weight={currentPage === 'services' ? 'fill' : 'regular'} />}
          onClick={() => onNavigate('services')}
        >
          My Services
        </NavigationButton>

        <NavigationButton
          selected={currentPage === 'bookings'}
          icon={<CalendarCheck size={20} weight={currentPage === 'bookings' ? 'fill' : 'regular'} />}
          onClick={() => onNavigate('bookings')}
        >
          Booking Requests
        </NavigationButton>

        <NavigationButton
          selected={currentPage === 'weeklySchedule'}
          icon={<Calendar size={20} weight={currentPage === 'weeklySchedule' ? 'fill' : 'regular'} />}
          onClick={() => onNavigate('weeklySchedule')}
        >
          Schedule
        </NavigationButton>

        <NavigationButton
          selected={currentPage === 'schedule'}
          icon={<CalendarBlank size={20} weight={currentPage === 'schedule' ? 'fill' : 'regular'} />}
          onClick={() => onNavigate('schedule')}
        >
          Availability
        </NavigationButton>

        <NavigationButton
          selected={currentPage === 'reviews'}
          icon={<Star size={20} weight={currentPage === 'reviews' ? 'fill' : 'regular'} />}
          onClick={() => onNavigate('reviews')}
        >
          Reviews
        </NavigationButton>

        <NavigationButton
          selected={currentPage === 'notifications'}
          icon={<Bell size={20} weight={currentPage === 'notifications' ? 'fill' : 'regular'} />}
          onClick={() => onNavigate('notifications')}
        >
          Notifications
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

export default ServiceProviderSidebar;

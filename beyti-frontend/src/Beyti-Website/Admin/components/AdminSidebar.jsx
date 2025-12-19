/**
 * Admin Sidebar Component
 *
 * Reusable sidebar for all admin pages
 * Provides consistent navigation across the admin portal
 */

import React from 'react';
import {
  House,
  Users,
  ShieldCheck,
  Warning,
  Package,
  User,
  CaretDown,
  Tag,
  Briefcase,
  Bell,
  ClockClockwise,
  Megaphone
} from '@phosphor-icons/react';
import NavigationButton from '../../../components/NavigationButton';

const AdminSidebar = ({ currentPage, onNavigate }) => {
  return (
    <aside className="w-[250px] bg-sage-500 flex flex-col fixed h-screen">
      <div className="p-6 border-b border-sage-700">
        <h1 className="text-display-h1 text-cream-200">Beyti</h1>
        <p className="text-label-medium text-cream-100 mt-1">Admin Portal</p>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        <NavigationButton
          selected={currentPage === 'dashboard'}
          icon={<House size={20} weight={currentPage === 'dashboard' ? 'fill' : 'regular'} />}
          onClick={() => onNavigate('/admin')}
        >
          Dashboard
        </NavigationButton>

        <NavigationButton
          selected={currentPage === 'users'}
          icon={<Users size={20} weight={currentPage === 'users' ? 'fill' : 'regular'} />}
          onClick={() => onNavigate('/admin/users')}
        >
          User Management
        </NavigationButton>

        <NavigationButton
          selected={currentPage === 'approvals'}
          icon={<ShieldCheck size={20} weight={currentPage === 'approvals' ? 'fill' : 'regular'} />}
          onClick={() => onNavigate('/admin/approvals')}
        >
          Request Approvals
        </NavigationButton>

        <NavigationButton
          selected={currentPage === 'flagged-users'}
          icon={<Warning size={20} weight={currentPage === 'flagged-users' ? 'fill' : 'regular'} />}
          onClick={() => onNavigate('/admin/flagged-users')}
        >
          Flagged Users
        </NavigationButton>

        <NavigationButton
          selected={currentPage === 'product-moderation'}
          icon={<Package size={20} weight={currentPage === 'product-moderation' ? 'fill' : 'regular'} />}
          onClick={() => onNavigate('/admin/product-moderation')}
        >
          Product Moderation
        </NavigationButton>

        <NavigationButton
          selected={currentPage === 'service-moderation'}
          icon={<Briefcase size={20} weight={currentPage === 'service-moderation' ? 'fill' : 'regular'} />}
          onClick={() => onNavigate('/admin/service-moderation')}
        >
          Service Moderation
        </NavigationButton>

        <NavigationButton
          selected={currentPage === 'category-moderation'}
          icon={<Tag size={20} weight={currentPage === 'category-moderation' ? 'fill' : 'regular'} />}
          onClick={() => onNavigate('/admin/category-moderation')}
        >
          Categories
        </NavigationButton>

        <NavigationButton
          selected={currentPage === 'announcements'}
          icon={<Megaphone size={20} weight={currentPage === 'announcements' ? 'fill' : 'regular'} />}
          onClick={() => onNavigate('/admin/announcements')}
        >
          Announcements
        </NavigationButton>

        <NavigationButton
          selected={currentPage === 'notifications'}
          icon={<Bell size={20} weight={currentPage === 'notifications' ? 'fill' : 'regular'} />}
          onClick={() => onNavigate('/admin/notifications')}
        >
          Notifications
        </NavigationButton>

        <NavigationButton
          selected={currentPage === 'audit-logs'}
          icon={<ClockClockwise size={20} weight={currentPage === 'audit-logs' ? 'fill' : 'regular'} />}
          onClick={() => onNavigate('/admin/audit-logs')}
        >
          Audit Logs
        </NavigationButton>
      </nav>

      <div className="border-t border-sage-700 p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-full bg-sage-700 flex items-center justify-center flex-shrink-0">
              <User size={20} className="text-cream-200" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-body-regular text-cream-200 truncate">Admin User</p>
              <p className="text-label-medium text-cream-100 truncate">Super Admin</p>
            </div>
          </div>
          <button className="flex-shrink-0 p-1 hover:bg-sage-700 rounded transition-colors">
            <CaretDown size={16} className="text-cream-200" />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default AdminSidebar;

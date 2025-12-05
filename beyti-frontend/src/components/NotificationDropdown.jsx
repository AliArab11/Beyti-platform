/**
 * Notification Dropdown Component
 *
 * Displays user notifications in a dropdown when bell icon is clicked.
 * Shows notification count, marks notifications as read, and displays recent notifications.
 */

import React, { useState, useEffect, useRef } from 'react';
import { Bell, X } from '@phosphor-icons/react';
import {
  getUserNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification
} from '../services/api';

const NotificationDropdown = ({ userId, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  // Fetch notifications and unread count
  const fetchNotifications = async () => {
    if (!userId) {
      console.warn('NotificationDropdown: No userId provided');
      return;
    }

    try {
      setLoading(true);
      console.log('Fetching notifications for userId:', userId);
      const [notifs, count] = await Promise.all([
        getUserNotifications(userId),
        getUnreadCount(userId)
      ]);
      console.log('Fetched notifications:', notifs);
      console.log('Unread count:', count);
      setNotifications(notifs);
      setUnreadCount(count);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch notifications on mount and when dropdown opens
  useEffect(() => {
    if (userId) {
      fetchNotifications();
    }
  }, [userId]);

  // Refresh notifications when dropdown opens
  useEffect(() => {
    if (isOpen && userId) {
      fetchNotifications();
    }
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Handle notification click - mark as read
  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      try {
        await markNotificationRead(notification.id);
        // Update local state
        setNotifications(prev =>
          prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (error) {
        console.error('Failed to mark notification as read:', error);
      }
    }
  };

  // Handle mark all as read
  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead(userId);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  // Handle delete notification
  const handleDeleteNotification = async (e, notificationId) => {
    e.stopPropagation();
    try {
      await deleteNotification(notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      // Update unread count if deleted notification was unread
      const deletedNotif = notifications.find(n => n.id === notificationId);
      if (deletedNotif && !deletedNotif.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  // Format timestamp
  const formatTime = (timestamp) => {
    // Ensure timestamp is treated as UTC if it doesn't have timezone info
    const date = new Date(timestamp + (timestamp.endsWith('Z') ? '' : 'Z'));
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Bell Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 bg-sage-500 dark:bg-sage-700 rounded-md hover:bg-sage-700 dark:hover:bg-sage-500 transition-colors"
      >
        <Bell size={20} weight="fill" className="text-sage-100 dark:text-cream-50" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-error-btn text-white text-xs flex items-center justify-center rounded-full">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full right-0 mt-2 w-96 bg-grey-200 dark:bg-charcoal-500 border border-grey-stroke dark:border-charcoal-400 rounded-md shadow-soft-lift z-20 overflow-hidden max-h-[600px] flex flex-col">
            {/* Header */}
            <div className="px-4 py-3 border-b border-grey-stroke dark:border-charcoal-400 bg-cream-50 dark:bg-charcoal-600 flex items-center justify-between">
              <h3 className="text-body-regular font-semibold text-charcoal-600 dark:text-cream-50">
                Notifications
              </h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-label-small text-sage-500 dark:text-sage-400 hover:text-sage-700 dark:hover:text-sage-300 transition-colors"
                >
                  Mark all as read
                </button>
              )}
            </div>

            {/* Notifications List */}
            <div className="overflow-y-auto flex-1">
              {loading ? (
                <div className="p-8 text-center text-charcoal-400 dark:text-charcoal-300">
                  Loading notifications...
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center text-charcoal-400 dark:text-charcoal-300">
                  No notifications yet
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`
                      px-4 py-3 border-b border-grey-stroke dark:border-charcoal-400
                      cursor-pointer hover:bg-cream-100 dark:hover:bg-charcoal-400
                      transition-colors group relative
                      ${!notification.isRead ? 'bg-sage-50 dark:bg-charcoal-550' : ''}
                    `}
                  >
                    {/* Unread Indicator */}
                    {!notification.isRead && (
                      <div className="absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 bg-sage-500 rounded-full" />
                    )}

                    <div className="ml-3 pr-6">
                      {/* Title */}
                      {notification.title && (
                        <p className="text-body-regular font-semibold text-charcoal-600 dark:text-cream-50 mb-1">
                          {notification.title}
                        </p>
                      )}

                      {/* Body */}
                      <p className="text-label-medium text-charcoal-500 dark:text-charcoal-300 line-clamp-2">
                        {notification.body}
                      </p>

                      {/* Type & Time */}
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-label-small text-sage-600 dark:text-sage-400 px-2 py-0.5 bg-sage-100 dark:bg-sage-900/30 rounded">
                          {notification.type}
                        </span>
                        <span className="text-label-small text-charcoal-400 dark:text-charcoal-300">
                          {formatTime(notification.createdAt)}
                        </span>
                      </div>
                    </div>

                    {/* Delete Button */}
                    <button
                      onClick={(e) => handleDeleteNotification(e, notification.id)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-error-bg dark:hover:bg-red-900/20 transition-all"
                    >
                      <X size={16} className="text-error-text dark:text-red-400" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Footer - View All (optional) */}
            {notifications.length > 0 && (
              <div className="px-4 py-2 border-t border-grey-stroke dark:border-charcoal-400 bg-cream-50 dark:bg-charcoal-600">
                <button className="w-full text-center text-label-medium text-sage-500 dark:text-sage-400 hover:text-sage-700 dark:hover:text-sage-300 transition-colors">
                  View all notifications
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationDropdown;

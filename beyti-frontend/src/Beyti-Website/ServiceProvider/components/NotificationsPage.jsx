/**
 * Notifications Page Component
 *
 * Displays all user notifications (read and unread) with search functionality
 * Shows notification details, allows marking as read/unread, and deleting notifications
 */

import React, { useState, useEffect } from 'react';
import { X, Check, Envelope, EnvelopeOpen, PaperPlaneRight } from '@phosphor-icons/react';
import {
  getUserNotifications,
  getSentNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification
} from '../../../services/api';

const NotificationsPage = ({ userId, searchQuery = '' }) => {
  const [notifications, setNotifications] = useState([]);
  const [sentNotifications, setSentNotifications] = useState([]);
  const [filteredNotifications, setFilteredNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all'); // 'all', 'unread', 'read'
  const [viewMode, setViewMode] = useState('received'); // 'received', 'sent'

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      const [receivedNotifs, sentNotifs] = await Promise.all([
        getUserNotifications(userId),
        getSentNotifications(userId)
      ]);
      setNotifications(receivedNotifs);
      setSentNotifications(sentNotifs);
      setFilteredNotifications(viewMode === 'received' ? receivedNotifs : sentNotifs);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchNotifications();
  }, [userId]);

  // Filter notifications based on search, filter type, and view mode
  useEffect(() => {
    const baseNotifications = viewMode === 'received' ? notifications : sentNotifications;
    let filtered = baseNotifications;

    // Filter by type (only for received notifications)
    if (viewMode === 'received') {
      if (filterType === 'unread') {
        filtered = filtered.filter(n => !n.isRead);
      } else if (filterType === 'read') {
        filtered = filtered.filter(n => n.isRead);
      }
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(n =>
        n.title?.toLowerCase().includes(query) ||
        n.body?.toLowerCase().includes(query) ||
        n.type?.toLowerCase().includes(query) ||
        (viewMode === 'sent' && n.recipientName?.toLowerCase().includes(query))
      );
    }

    setFilteredNotifications(filtered);
  }, [searchQuery, filterType, notifications, sentNotifications, viewMode]);

  // Handle mark as read
  const handleMarkAsRead = async (notificationId) => {
    try {
      await markNotificationRead(notificationId);
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
      );
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  // Handle mark all as read
  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead(userId);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  // Handle delete notification
  const handleDeleteNotification = async (notificationId) => {
    try {
      await deleteNotification(notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  // Format timestamp
  const formatTime = (timestamp) => {
    if (!timestamp) return '';

    // Parse the timestamp - backend sends local timestamps using DateTime.Now
    // JavaScript's new Date() will treat timestamps without timezone as local time
    const date = new Date(timestamp);

    // Validate the date
    if (isNaN(date.getTime())) {
      console.error('Invalid timestamp:', timestamp);
      return '';
    }

    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    // Handle negative differences (clock skew or future timestamps)
    if (diffMs < 0) return 'Just now';

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="space-y-6">
      {/* View Mode Toggle */}
      <div className="bg-cream-50 dark:bg-charcoal-600 border border-grey-stroke dark:border-charcoal-400 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('received')}
            className={`px-6 py-3 rounded-md text-body-regular transition-colors ${
              viewMode === 'received'
                ? 'bg-sage-500 text-cream-50 dark:bg-sage-700'
                : 'bg-grey-200 dark:bg-charcoal-500 text-charcoal-600 dark:text-cream-50 hover:bg-grey-300 dark:hover:bg-charcoal-400'
            }`}
          >
            Received ({notifications.length})
          </button>
          <button
            onClick={() => setViewMode('sent')}
            className={`px-6 py-3 rounded-md text-body-regular transition-colors ${
              viewMode === 'sent'
                ? 'bg-sage-500 text-cream-50 dark:bg-sage-700'
                : 'bg-grey-200 dark:bg-charcoal-500 text-charcoal-600 dark:text-cream-50 hover:bg-grey-300 dark:hover:bg-charcoal-400'
            }`}
          >
            Sent ({sentNotifications.length})
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {viewMode === 'received' ? (
        <div className="grid grid-cols-3 gap-6">
          <div className="bg-cream-50 dark:bg-charcoal-600 border border-grey-stroke dark:border-charcoal-400 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-label-medium text-charcoal-400 dark:text-charcoal-300">Total Received</p>
                <p className="text-display-h2 text-charcoal-600 dark:text-cream-50 mt-2">{notifications.length}</p>
              </div>
              <div className="w-12 h-12 bg-sage-100 dark:bg-sage-900/30 rounded-lg flex items-center justify-center">
                <Envelope size={24} className="text-sage-600 dark:text-sage-400" />
              </div>
            </div>
          </div>

          <div className="bg-cream-50 dark:bg-charcoal-600 border border-grey-stroke dark:border-charcoal-400 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-label-medium text-charcoal-400 dark:text-charcoal-300">Unread</p>
                <p className="text-display-h2 text-sage-600 dark:text-sage-400 mt-2">{unreadCount}</p>
              </div>
              <div className="w-12 h-12 bg-sage-100 dark:bg-sage-900/30 rounded-lg flex items-center justify-center">
                <EnvelopeOpen size={24} className="text-sage-600 dark:text-sage-400" />
              </div>
            </div>
          </div>

          <div className="bg-cream-50 dark:bg-charcoal-600 border border-grey-stroke dark:border-charcoal-400 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-label-medium text-charcoal-400 dark:text-charcoal-300">Read</p>
                <p className="text-display-h2 text-charcoal-600 dark:text-cream-50 mt-2">{notifications.length - unreadCount}</p>
              </div>
              <div className="w-12 h-12 bg-charcoal-100 dark:bg-charcoal-500 rounded-lg flex items-center justify-center">
                <Check size={24} className="text-charcoal-500 dark:text-charcoal-300" />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-6">
          <div className="bg-cream-50 dark:bg-charcoal-600 border border-grey-stroke dark:border-charcoal-400 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-label-medium text-charcoal-400 dark:text-charcoal-300">Total Sent</p>
                <p className="text-display-h2 text-charcoal-600 dark:text-cream-50 mt-2">{sentNotifications.length}</p>
              </div>
              <div className="w-12 h-12 bg-sage-100 dark:bg-sage-900/30 rounded-lg flex items-center justify-center">
                <PaperPlaneRight size={24} className="text-sage-600 dark:text-sage-400" />
              </div>
            </div>
          </div>

          <div className="bg-cream-50 dark:bg-charcoal-600 border border-grey-stroke dark:border-charcoal-400 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-label-medium text-charcoal-400 dark:text-charcoal-300">Read by Recipients</p>
                <p className="text-display-h2 text-sage-600 dark:text-sage-400 mt-2">{sentNotifications.filter(n => n.isRead).length}</p>
              </div>
              <div className="w-12 h-12 bg-sage-100 dark:bg-sage-900/30 rounded-lg flex items-center justify-center">
                <Check size={24} className="text-sage-600 dark:text-sage-400" />
              </div>
            </div>
          </div>

          <div className="bg-cream-50 dark:bg-charcoal-600 border border-grey-stroke dark:border-charcoal-400 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-label-medium text-charcoal-400 dark:text-charcoal-300">UNREAD</p>
                <p className="text-display-h2 text-charcoal-600 dark:text-cream-50 mt-2">{sentNotifications.filter(n => !n.isRead).length}</p>
              </div>
              <div className="w-12 h-12 bg-charcoal-100 dark:bg-charcoal-500 rounded-lg flex items-center justify-center">
                <EnvelopeOpen size={24} className="text-charcoal-500 dark:text-charcoal-300" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters and Actions - Only show for received notifications */}
      {viewMode === 'received' && (
        <div className="bg-cream-50 dark:bg-charcoal-600 border border-grey-stroke dark:border-charcoal-400 rounded-lg p-4">
          <div className="flex items-center justify-between gap-4">
            {/* Filter Tabs */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFilterType('all')}
                className={`px-4 py-2 rounded-md text-body-regular transition-colors ${
                  filterType === 'all'
                    ? 'bg-sage-500 text-cream-50 dark:bg-sage-700'
                    : 'bg-grey-200 dark:bg-charcoal-500 text-charcoal-600 dark:text-cream-50 hover:bg-grey-300 dark:hover:bg-charcoal-400'
                }`}
              >
                All ({notifications.length})
              </button>
              <button
                onClick={() => setFilterType('unread')}
                className={`px-4 py-2 rounded-md text-body-regular transition-colors ${
                  filterType === 'unread'
                    ? 'bg-sage-500 text-cream-50 dark:bg-sage-700'
                    : 'bg-grey-200 dark:bg-charcoal-500 text-charcoal-600 dark:text-cream-50 hover:bg-grey-300 dark:hover:bg-charcoal-400'
                }`}
              >
                Unread ({unreadCount})
              </button>
              <button
                onClick={() => setFilterType('read')}
                className={`px-4 py-2 rounded-md text-body-regular transition-colors ${
                  filterType === 'read'
                    ? 'bg-sage-500 text-cream-50 dark:bg-sage-700'
                    : 'bg-grey-200 dark:bg-charcoal-500 text-charcoal-600 dark:text-cream-50 hover:bg-grey-300 dark:hover:bg-charcoal-400'
                }`}
              >
                Read ({notifications.length - unreadCount})
              </button>
            </div>

            {/* Mark All as Read Button */}
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="px-4 py-2 bg-sage-500 dark:bg-sage-700 text-cream-50 rounded-md hover:bg-sage-700 dark:hover:bg-sage-500 transition-colors text-body-regular"
              >
                Mark All as Read
              </button>
            )}
          </div>
        </div>
      )}

      {/* Notifications List */}
      <div className="bg-cream-50 dark:bg-charcoal-600 border border-grey-stroke dark:border-charcoal-400 rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-charcoal-400 dark:text-charcoal-300">
            Loading notifications...
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="p-12 text-center text-charcoal-400 dark:text-charcoal-300">
            {searchQuery ? 'No notifications match your search' : `No ${viewMode} notifications yet`}
          </div>
        ) : (
          <div className="divide-y divide-grey-stroke dark:divide-charcoal-400">
            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-6 hover:bg-cream-100 dark:hover:bg-charcoal-500 transition-colors group ${
                  viewMode === 'received' && !notification.isRead ? 'bg-sage-50 dark:bg-charcoal-550' : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Unread Indicator - Only for received notifications */}
                  {viewMode === 'received' && (
                    <div className="flex-shrink-0 w-3 pt-2">
                      {!notification.isRead && (
                        <div className="w-2.5 h-2.5 bg-sage-500 rounded-full" />
                      )}
                    </div>
                  )}

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {/* Recipient Name - Only for sent notifications */}
                    {viewMode === 'sent' && notification.recipientName && (
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-label-small text-charcoal-400 dark:text-charcoal-300">To:</span>
                        <span className="text-body-regular font-semibold text-charcoal-600 dark:text-cream-50">
                          {notification.recipientName}
                        </span>
                        {notification.isRead ? (
                          <span className="text-label-small text-sage-600 dark:text-sage-400 px-2 py-0.5 bg-sage-100 dark:bg-sage-900/30 rounded">
                            Read
                          </span>
                        ) : (
                          <span className="text-label-small text-charcoal-500 dark:text-charcoal-300 px-2 py-0.5 bg-grey-200 dark:bg-charcoal-500 rounded">
                            Unread
                          </span>
                        )}
                      </div>
                    )}

                    {/* Title */}
                    {notification.title && (
                      <h3 className="text-body-regular font-semibold text-charcoal-600 dark:text-cream-50 mb-1">
                        {notification.title}
                      </h3>
                    )}

                    {/* Body */}
                    <p className="text-body-regular text-charcoal-500 dark:text-charcoal-300 mb-3">
                      {notification.body}
                    </p>

                    {/* Meta Info */}
                    <div className="flex items-center gap-3">
                      <span className="text-label-small text-sage-600 dark:text-sage-400 px-2 py-1 bg-sage-100 dark:bg-sage-900/30 rounded">
                        {notification.type}
                      </span>
                      <span className="text-label-small text-charcoal-400 dark:text-charcoal-300">
                        {formatTime(notification.createdAt)}
                      </span>
                    </div>
                  </div>

                  {/* Actions - Only for received notifications */}
                  {viewMode === 'received' && (
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!notification.isRead && (
                        <button
                          onClick={() => handleMarkAsRead(notification.id)}
                          className="p-2 rounded hover:bg-sage-100 dark:hover:bg-sage-900/30 transition-colors"
                          title="Mark as read"
                        >
                          <Check size={18} className="text-sage-600 dark:text-sage-400" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteNotification(notification.id)}
                        className="p-2 rounded hover:bg-error-bg dark:hover:bg-red-900/20 transition-colors"
                        title="Delete notification"
                      >
                        <X size={18} className="text-error-text dark:text-red-400" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;

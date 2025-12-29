/**
 * Announcement Management Component
 *
 * Displays a list of announcements sent by the admin
 * Shows read/unread status and allows sending new announcements
 */

import React, { useState, useEffect } from 'react';
import {
  Megaphone,
  CheckCircle,
  Clock,
  Plus,
  CalendarBlank,
  Users
} from '@phosphor-icons/react';
import CRUDButton from '../../../components/CRUDButton';
import Snackbar from '../../../components/Snackbar';
import ConfirmModal from '../../../components/ConfirmModal';

const AnnouncementManagement = ({
  onNavigate,
  adminUserProfileId,
  renderContentOnly = false,
  onOpenAnnouncementModal
}) => {
  // State management
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all'); // all, active, expired

  // Snackbar state
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    type: 'success'
  });

  // Confirm modal state
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    announcementId: null,
    title: ''
  });

  // Fetch announcements on mount
  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const response = await fetch('https://localhost:7062/api/Announcements');
      const data = await response.json();

      // Sort by created date (newest first)
      const sortedData = data.sort((a, b) =>
        new Date(b.CreatedAt || b.createdAt) - new Date(a.CreatedAt || a.createdAt)
      );

      setAnnouncements(sortedData);
    } catch (error) {
      console.error('Error fetching announcements:', error);
      showSnackbar('Failed to fetch announcements', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Show snackbar helper
  const showSnackbar = (message, type = 'success') => {
    setSnackbar({ open: true, message, type });
    setTimeout(() => {
      setSnackbar({ open: false, message: '', type: 'success' });
    }, 3000);
  };

  // Open confirm modal for inactivating
  const handleInactivateClick = (announcement) => {
    setConfirmModal({
      isOpen: true,
      announcementId: announcement.Id || announcement.id,
      title: announcement.Title || announcement.title
    });
  };

  // Close confirm modal
  const handleCloseConfirmModal = () => {
    setConfirmModal({
      isOpen: false,
      announcementId: null,
      title: ''
    });
  };

  // Inactivate announcement
  const handleInactivateAnnouncement = async () => {
    try {
      const response = await fetch(
        `https://localhost:7062/api/Announcements/${confirmModal.announcementId}/deactivate`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to inactivate announcement');
      }

      // Update local state
      setAnnouncements(prevAnnouncements =>
        prevAnnouncements.map(a =>
          (a.Id || a.id) === confirmModal.announcementId
            ? { ...a, IsActive: false, isActive: false }
            : a
        )
      );

      showSnackbar('Announcement inactivated successfully', 'success');
      handleCloseConfirmModal();
    } catch (error) {
      console.error('Error inactivating announcement:', error);
      showSnackbar('Failed to inactivate announcement', 'error');
    }
  };

  // Filter announcements
  const filteredAnnouncements = announcements.filter(announcement => {
    // Status filter
    const expiresAt = announcement.ExpiresAt || announcement.expiresAt;
    const isExpired = expiresAt && new Date(expiresAt) < new Date();
    const isActive = announcement.IsActive !== undefined ? announcement.IsActive : announcement.isActive;

    if (filterStatus === 'active') {
      return isActive && !isExpired;
    } else if (filterStatus === 'expired') {
      return isExpired || !isActive;
    }

    return true; // 'all'
  });

  // Helper function to format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Helper function to parse audience
  const parseAudience = (audienceString) => {
    if (!audienceString) return [];
    return audienceString.split(',').map(a => a.trim());
  };

  // Helper function to check if announcement is expired
  const isExpired = (announcement) => {
    const expiresAt = announcement.ExpiresAt || announcement.expiresAt;
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  // Helper function to get status badge
  const getStatusBadge = (announcement) => {
    const expired = isExpired(announcement);
    const isActive = announcement.IsActive !== undefined ? announcement.IsActive : announcement.isActive;

    if (expired) {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-error-bg text-error-text border border-error-btn">
          Expired
        </span>
      );
    } else if (isActive) {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-success-bg text-success-text border border-success-btn">
          Active
        </span>
      );
    } else {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-grey-300 text-charcoal-600 border border-grey-stroke">
          Inactive
        </span>
      );
    }
  };

  const renderContent = () => (
    <>
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        {/* Filter Dropdown */}
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2.5 rounded-lg border border-grey-stroke bg-white dark:bg-[#2A2A2A] dark:border-gray-600 text-charcoal-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-sage-400"
        >
          <option value="all">All Announcements</option>
          <option value="active">Active Only</option>
          <option value="expired">Expired/Inactive</option>
        </select>

        {/* Create Button */}
        <CRUDButton
          variant="success"
          onClick={onOpenAnnouncementModal}
        >
          
          Send
        </CRUDButton>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-grey-200 dark:bg-[#2A2A2A] rounded-lg shadow-soft-lift dark:shadow-none p-4 border border-grey-stroke dark:border-gray-600">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-sage-100 rounded-lg">
              <Megaphone size={24} className="text-sage-600" weight="fill" />
            </div>
            <div>
              <p className="text-metric-h3 text-charcoal-700 dark:text-white font-semibold">
                {announcements.length}
              </p>
              <p className="text-label-medium text-charcoal-400 dark:text-gray-400">
                Total Announcements
              </p>
            </div>
          </div>
        </div>

        <div className="bg-grey-200 dark:bg-[#2A2A2A] rounded-lg shadow-soft-lift dark:shadow-none p-4 border border-grey-stroke dark:border-gray-600">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-success-bg rounded-lg">
              <CheckCircle size={24} className="text-success-btn" weight="fill" />
            </div>
            <div>
              <p className="text-metric-h3 text-charcoal-700 dark:text-white font-semibold">
                {announcements.filter(a => (a.IsActive || a.isActive) && !isExpired(a)).length}
              </p>
              <p className="text-label-medium text-charcoal-400 dark:text-gray-400">
                Active Announcements
              </p>
            </div>
          </div>
        </div>

        <div className="bg-grey-200 dark:bg-[#2A2A2A] rounded-lg shadow-soft-lift dark:shadow-none p-4 border border-grey-stroke dark:border-gray-600">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-error-bg rounded-lg">
              <Clock size={24} className="text-error-btn" weight="fill" />
            </div>
            <div>
              <p className="text-metric-h3 text-charcoal-700 dark:text-white font-semibold">
                {announcements.filter(a => isExpired(a) || !(a.IsActive || a.isActive)).length}
              </p>
              <p className="text-label-medium text-charcoal-400 dark:text-gray-400">
                Expired/Inactive
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Announcements List */}
      <div className="bg-grey-200 dark:bg-[#2A2A2A] rounded-lg shadow-soft-lift dark:shadow-none border border-grey-stroke dark:border-gray-600">
        <div className="p-6 border-b border-grey-stroke dark:border-gray-600">
          <h2 className="text-card-h2 text-charcoal-700 dark:text-white">
            Announcement History
          </h2>
          <p className="text-body-regular text-charcoal-400 dark:text-gray-400 mt-1">
            View all announcements sent to platform users
          </p>
        </div>

        <div className="divide-y divide-grey-stroke dark:divide-gray-600">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sage-500"></div>
            </div>
          ) : filteredAnnouncements.length === 0 ? (
            <div className="text-center py-12">
              <Megaphone size={48} className="text-charcoal-300 dark:text-gray-500 mx-auto mb-3" weight="light" />
              <p className="text-body-regular text-charcoal-400 dark:text-gray-400">
                No announcements found
              </p>
              <p className="text-label-medium text-charcoal-300 dark:text-gray-500 mt-1">
                Click "Send Announcement" to create your first announcement
              </p>
            </div>
          ) : (
            filteredAnnouncements.map((announcement) => {
              const audiences = parseAudience(announcement.Audience || announcement.audience);
              const createdAt = announcement.CreatedAt || announcement.createdAt;
              const expiresAt = announcement.ExpiresAt || announcement.expiresAt;
              const title = announcement.Title || announcement.title;
              const message = announcement.Message || announcement.message;

              return (
                <div
                  key={announcement.Id || announcement.id}
                  className="p-6 hover:bg-grey-100 dark:hover:bg-[#1F1F1F] transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Title and Status */}
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-card-h3 text-charcoal-700 dark:text-white font-semibold">
                          {title}
                        </h3>
                        {getStatusBadge(announcement)}
                      </div>

                      {/* Message Preview */}
                      <p className="text-body-regular text-charcoal-600 dark:text-gray-300 mb-3 line-clamp-2">
                        {message}
                      </p>

                      {/* Metadata */}
                      <div className="flex flex-wrap items-center gap-4 text-label-medium text-charcoal-400 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <CalendarBlank size={16} />
                          <span>Sent: {formatDate(createdAt)}</span>
                        </div>

                        {expiresAt && (
                          <div className="flex items-center gap-1">
                            <Clock size={16} />
                            <span>Expires: {formatDate(expiresAt)}</span>
                          </div>
                        )}

                        <div className="flex items-center gap-1">
                          <Users size={16} />
                          <span>
                            To: {audiences.length > 0 ? audiences.join(', ') : 'N/A'}
                          </span>
                        </div>
                      </div>

                      {/* Action Button */}
                      {(announcement.IsActive || announcement.isActive) && !isExpired(announcement) && (
                        <div className="mt-4">
                          <CRUDButton
                            variant="danger"
                            onClick={() => handleInactivateClick(announcement)}
                          >
                            Inactivate
                          </CRUDButton>
                        </div>
                      )}
                    </div>

                    {/* Icon */}
                    <div className={`p-3 rounded-lg flex-shrink-0 ${
                      isExpired(announcement)
                        ? 'bg-error-bg'
                        : 'bg-sage-100'
                    }`}>
                      <Megaphone
                        size={24}
                        className={
                          isExpired(announcement)
                            ? 'text-error-btn'
                            : 'text-sage-600'
                        }
                        weight="fill"
                      />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );

  if (renderContentOnly) {
    return (
      <>
        {renderContent()}

        {/* Snackbar */}
        <Snackbar
          open={snackbar.open}
          message={snackbar.message}
          type={snackbar.type}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        />

        {/* Confirm Modal */}
        <ConfirmModal
          isOpen={confirmModal.isOpen}
          onClose={handleCloseConfirmModal}
          onConfirm={handleInactivateAnnouncement}
          title="Inactivate Announcement"
          message={`Are you sure you want to inactivate "${confirmModal.title}"? This announcement will no longer be visible to users.`}
          confirmText="Inactivate"
          cancelText="Cancel"
          variant="danger"
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-cream-50 dark:bg-[#1A1A1A]">
      <div className="max-w-7xl mx-auto p-8">
        {renderContent()}
      </div>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        message={snackbar.message}
        type={snackbar.type}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      />

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={handleCloseConfirmModal}
        onConfirm={handleInactivateAnnouncement}
        title="Inactivate Announcement"
        message={`Are you sure you want to inactivate "${confirmModal.title}"? This announcement will no longer be visible to users.`}
        confirmText="Inactivate"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
};

export default AnnouncementManagement;
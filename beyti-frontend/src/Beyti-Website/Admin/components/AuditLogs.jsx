/**
 * Audit Logs Page
 *
 * Displays system audit logs tracking all admin and user actions
 * Features: View logs, filter by event type, search, pagination
 */

import React, { useEffect, useState } from 'react';
import {
  ClockClockwise,
  MagnifyingGlass,
  User,
  Warning,
  Info,
  CheckCircle,
  XCircle
} from '@phosphor-icons/react';
import {
  getAuditLogs,
  getUserProfile,
  updateUserProfile
} from '../../../services/api';

// Import design system components
import AnalyticsCard from '../../../components/AnalyticsCard';
import StatusChip from '../../../components/StatusChip';
import { Table, TableHeader, TableBody, TableRow } from '../../../components/Table';
import PageHeader from '../../../components/PageHeader';
import AdminSidebar from './AdminSidebar';

const AuditLogs = ({ onNavigate, adminUserProfileId = 4037 }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEventType, setFilterEventType] = useState('All');
  const [filterSeverity, setFilterSeverity] = useState('All');
  const [notificationCount] = useState(0);

  // User profile state
  const [userProfile, setUserProfile] = useState(null);
  const [displayName, setDisplayName] = useState("Admin User");

  // Statistics state
  const [stats, setStats] = useState({
    totalLogs: 0,
    todayLogs: 0,
    criticalLogs: 0,
    uniqueActors: 0
  });

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const data = await getAuditLogs();
      setLogs(data);

      // Calculate statistics
      const total = data.length;

      // Calculate logs from today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayLogs = data.filter(log => new Date(log.createdAt) >= today).length;

      // Count critical severity logs
      const criticalLogs = data.filter(log => log.severity === 'Critical' || log.severity === 'High').length;

      // Count unique actors
      const uniqueActors = new Set(data.filter(log => log.actorUserId).map(log => log.actorUserId)).size;

      setStats({
        totalLogs: total,
        todayLogs,
        criticalLogs,
        uniqueActors
      });
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch user profile details
  const fetchUserProfile = async () => {
    try {
      const profile = await getUserProfile(adminUserProfileId);
      if (profile) {
        const normalizedProfile = {
          userProfileId: profile.UserProfileId,
          displayName: profile.DisplayName,
          roleType: profile.RoleType,
          status: profile.Status,
          phone: profile.Phone,
          createdAt: profile.CreatedAt,
          updatedAt: profile.UpdatedAt,
        };
        setUserProfile(normalizedProfile);
        if (normalizedProfile.displayName) {
          setDisplayName(normalizedProfile.displayName);
        }
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  // Handle profile update
  const handleProfileUpdate = async (updates) => {
    try {
      await updateUserProfile(adminUserProfileId, 'Admin', updates);
      await fetchUserProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchAuditLogs();
    fetchUserProfile();
  }, []);

  // Filter logs based on search term, event type, and severity
  const getFilteredLogs = () => {
    let filtered = logs;

    // Filter by event type
    if (filterEventType !== 'All') {
      filtered = filtered.filter(log => log.eventType === filterEventType);
    }

    // Filter by severity
    if (filterSeverity !== 'All') {
      filtered = filtered.filter(log => log.severity === filterSeverity);
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(log =>
        log.eventType?.toLowerCase().includes(term) ||
        log.description?.toLowerCase().includes(term) ||
        log.targetTable?.toLowerCase().includes(term) ||
        log.actorUserId?.toString().includes(term)
      );
    }

    return filtered;
  };

  const filteredLogs = getFilteredLogs();

  // Get unique event types for filter dropdown
  const uniqueEventTypes = ['All', ...new Set(logs.map(log => log.eventType).filter(Boolean))];
  const severityOptions = ['All', 'Low', 'Medium', 'High', 'Critical'];

  // Helper function to get severity icon and color
  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'Critical':
        return <XCircle size={20} className="text-error-btn" weight="fill" />;
      case 'High':
        return <Warning size={20} className="text-danger-btn" weight="fill" />;
      case 'Medium':
        return <Info size={20} className="text-warning-btn" weight="fill" />;
      case 'Low':
        return <CheckCircle size={20} className="text-success-btn" weight="fill" />;
      default:
        return <Info size={20} className="text-charcoal-400" weight="fill" />;
    }
  };

  // Helper function to get severity variant
  const getSeverityVariant = (severity) => {
    switch (severity) {
      case 'Critical':
        return 'error';
      case 'High':
        return 'danger';
      case 'Medium':
        return 'warning';
      case 'Low':
        return 'success';
      default:
        return 'default';
    }
  };

  // Helper function to format date/time
  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-cream-50">
        <AdminSidebar currentPage="audit-logs" onNavigate={onNavigate} />

        {/* Main Content - Loading */}
        <div className="flex-1 ml-[250px] flex flex-col">
          <PageHeader
            title="Audit Logs"
            notificationCount={notificationCount}
            userName={displayName}
            userRole="Super Admin"
            userProfile={userProfile}
            entityId={null}
            userId={adminUserProfileId}
            onProfileUpdate={handleProfileUpdate}
          />
          <main className="flex-1 p-8 overflow-y-auto">
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sage-500"></div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-cream-50">
      <AdminSidebar currentPage="audit-logs" onNavigate={onNavigate} />

      {/* Main Content */}
      <div className="flex-1 ml-[250px] flex flex-col">
        {/* Header with Search */}
        <PageHeader
          title="Audit Logs"
          withSearch
          searchPlaceholder="Search by event type, description, or table..."
          onSearch={(value) => setSearchTerm(value)}
          notificationCount={notificationCount}
          userName={displayName}
          userRole="Super Admin"
          userProfile={userProfile}
          entityId={null}
          userId={adminUserProfileId}
          onProfileUpdate={handleProfileUpdate}
        />

        {/* Main Content Area */}
        <main className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <AnalyticsCard
                title="Total Logs"
                metrics={[
                  {
                    value: stats.totalLogs.toString(),
                    label: 'All Time'
                  }
                ]}
              />
              <AnalyticsCard
                title="Today's Logs"
                metrics={[
                  {
                    value: stats.todayLogs.toString(),
                    label: 'Last 24 Hours'
                  }
                ]}
              />
              <AnalyticsCard
                title="Critical Logs"
                metrics={[
                  {
                    value: stats.criticalLogs.toString(),
                    label: 'Requires Attention'
                  }
                ]}
              />
              <AnalyticsCard
                title="Unique Actors"
                metrics={[
                  {
                    value: stats.uniqueActors.toString(),
                    label: 'Users Taking Actions'
                  }
                ]}
              />
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-soft-lift p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <label className="block text-body-regular text-charcoal-600 font-semibold mb-2">
                    Event Type
                  </label>
                  <select
                    value={filterEventType}
                    onChange={(e) => setFilterEventType(e.target.value)}
                    className="w-full border border-grey-stroke rounded-lg px-4 py-2 focus:ring-2 focus:ring-sage-500 focus:border-sage-500 text-body-regular bg-white"
                  >
                    {uniqueEventTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-body-regular text-charcoal-600 font-semibold mb-2">
                    Severity
                  </label>
                  <select
                    value={filterSeverity}
                    onChange={(e) => setFilterSeverity(e.target.value)}
                    className="w-full border border-grey-stroke rounded-lg px-4 py-2 focus:ring-2 focus:ring-sage-500 focus:border-sage-500 text-body-regular bg-white"
                  >
                    {severityOptions.map((severity) => (
                      <option key={severity} value={severity}>
                        {severity}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Audit Logs Table */}
            <div className="bg-white rounded-lg shadow-soft-lift">
              <div className="p-6 border-b border-grey-stroke">
                <div className="flex items-center justify-between">
                  <h2 className="text-card-h2 text-charcoal-600">
                    Audit Logs ({filteredLogs.length})
                  </h2>
                  <div className="flex items-center gap-2 text-body-regular text-charcoal-400">
                    <ClockClockwise size={20} />
                    <span>Showing {filteredLogs.length} of {logs.length} logs</span>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                {filteredLogs.length === 0 ? (
                  <div className="text-center py-12">
                    <MagnifyingGlass size={64} className="text-charcoal-300 mx-auto mb-4" weight="light" />
                    <p className="text-charcoal-400 text-lg">No audit logs found</p>
                    <p className="text-charcoal-400 text-sm mt-2">Try adjusting your filters or search term</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader
                      columns={[
                        'Timestamp',
                        'Event Type',
                        'Actor',
                        'Target',
                        'Description',
                        'Severity'
                      ]}
                    />
                    <TableBody>
                      {filteredLogs.map((log) => (
                        <TableRow
                          key={log.id}
                          data={[
                            <span className="text-body-regular text-charcoal-400">
                              {formatDateTime(log.createdAt)}
                            </span>,
                            <span className="text-body-medium text-charcoal-600 font-semibold">
                              {log.eventType}
                            </span>,
                            <div className="flex items-center gap-2">
                              <User size={16} className="text-charcoal-400" />
                              <span className="text-body-regular text-charcoal-600">
                                {log.actorUserId ? `User #${log.actorUserId}` : 'System'}
                              </span>
                            </div>,
                            <div>
                              {log.targetTable && (
                                <div className="text-body-regular text-charcoal-600">
                                  {log.targetTable}
                                  {log.targetId && (
                                    <span className="text-charcoal-400 ml-1">
                                      #{log.targetId}
                                    </span>
                                  )}
                                </div>
                              )}
                              {!log.targetTable && (
                                <span className="text-body-regular text-charcoal-400">N/A</span>
                              )}
                            </div>,
                            <span className="text-body-regular text-charcoal-600">
                              {log.description || 'No description'}
                            </span>,
                            <div className="flex items-center gap-2">
                              {getSeverityIcon(log.severity)}
                              <StatusChip variant={getSeverityVariant(log.severity)}>
                                {log.severity || 'N/A'}
                              </StatusChip>
                            </div>
                          ]}
                        />
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AuditLogs;

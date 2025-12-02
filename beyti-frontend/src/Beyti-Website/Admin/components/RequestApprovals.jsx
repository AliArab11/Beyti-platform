/**
 * Request Approvals Page
 *
 * Manages all service provider requests with approval/rejection functionality
 * Features: View requests, approve/reject, filter by status, statistics tracking
 */

import React, { useEffect, useState } from 'react';
import {
  MagnifyingGlass,
  CheckCircle,
  XCircle,
  Eye
} from '@phosphor-icons/react';
import {
  getAllServiceProviderRequests,
  approveServiceProviderRequest,
  rejectServiceProviderRequest
} from '../../../services/api';
import { logAdminActivity } from '../../../utils/adminActivityLogger';

// Import design system components
import AnalyticsCard from '../../../components/AnalyticsCard';
import { Table, TableHeader, TableBody, TableRow } from '../../../components/Table';
import CRUDButton from '../../../components/CRUDButton';
import StatusChip from '../../../components/StatusChip';
import PageHeader from '../../../components/PageHeader';
import AdminSidebar from './AdminSidebar';

const RequestApprovals = ({ onNavigate }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [notificationCount] = useState(0);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);

  // Statistics state
  const [stats, setStats] = useState({
    pendingRequests: 0,
    approvedThisWeek: 0,
    rejectedRequests: 0
  });

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const data = await getAllServiceProviderRequests();
      setRequests(data);

      // Calculate statistics
      const pending = data.filter(r => r.status === 'Pending').length;

      // Calculate approved this week
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const approvedThisWeek = data.filter(r =>
        r.status === 'Approved' && new Date(r.updatedAt) >= oneWeekAgo
      ).length;

      const rejected = data.filter(r => r.status === 'Rejected').length;

      setStats({
        pendingRequests: pending,
        approvedThisWeek,
        rejectedRequests: rejected
      });
    } catch (err) {
      console.error('Error fetching requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleApprove = async (id) => {
    if (window.confirm('Are you sure you want to approve this request?')) {
      try {
        setProcessingId(id);
        const request = requests.find(r => r.id === id);
        await approveServiceProviderRequest(id);

        // Log the admin activity
        logAdminActivity(
          'approval',
          'Approved Service Provider Request',
          request?.businessName || `Request #${id}`
        );

        alert('Request approved successfully!');
        fetchRequests();
      } catch (err) {
        console.error('Error approving request:', err);
        alert('Error approving request: ' + (err.message || 'Unknown error'));
      } finally {
        setProcessingId(null);
      }
    }
  };

  const handleReject = async (id) => {
    if (window.confirm('Are you sure you want to reject this request?')) {
      try {
        setProcessingId(id);
        const request = requests.find(r => r.id === id);
        await rejectServiceProviderRequest(id);

        // Log the admin activity
        logAdminActivity(
          'moderation',
          'Rejected Service Provider Request',
          request?.businessName || `Request #${id}`
        );

        alert('Request rejected successfully!');
        fetchRequests();
      } catch (err) {
        console.error('Error rejecting request:', err);
        alert('Error rejecting request: ' + (err.message || 'Unknown error'));
      } finally {
        setProcessingId(null);
      }
    }
  };

  const handleViewDetails = (request) => {
    setSelectedRequest(request);
    setShowDetailsModal(true);
  };

  const handleCloseModal = () => {
    setShowDetailsModal(false);
    setSelectedRequest(null);
  };

  // Filter requests based on search term and status filter
  const getFilteredRequests = () => {
    let filtered = requests;

    // Filter by status
    if (filterStatus !== 'All') {
      filtered = filtered.filter(r => r.status === filterStatus);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(request =>
        request.businessName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.userDisplayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.userRoleType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.notes?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  };

  const filteredRequests = getFilteredRequests();

  if (loading) {
    return (
      <div className="flex min-h-screen bg-cream-50">
        <AdminSidebar currentPage="approvals" onNavigate={onNavigate} />

        {/* Main Content - Loading */}
        <div className="flex-1 ml-[250px] flex flex-col">
          <PageHeader
            title="Request Approvals"
            notificationCount={notificationCount}
            userName="Admin User"
            userRole="Super Admin"
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
      <AdminSidebar currentPage="approvals" onNavigate={onNavigate} />

      {/* Main Content */}
      <div className="flex-1 ml-[250px] flex flex-col">
        {/* Header */}
        <PageHeader
          title="Request Approvals"
          notificationCount={notificationCount}
          userName="Admin User"
          userRole="Super Admin"
        />

        {/* Main Content Area */}
        <main className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <AnalyticsCard
                title="Pending Requests"
                metrics={[
                  {
                    value: loading ? '...' : stats.pendingRequests.toString(),
                    label: 'Awaiting Review'
                  }
                ]}
              />
              <AnalyticsCard
                title="Approved This Week"
                metrics={[
                  {
                    value: loading ? '...' : stats.approvedThisWeek.toString(),
                    label: 'Last 7 Days'
                  }
                ]}
              />
              <AnalyticsCard
                title="Rejected Requests"
                metrics={[
                  {
                    value: loading ? '...' : stats.rejectedRequests.toString(),
                    label: 'Total Rejected'
                  }
                ]}
              />
            </div>

            {/* Requests Table */}
            <div className="bg-grey-200 dark:bg-[#2A2A2A] rounded-lg shadow-soft-lift dark:shadow-none transition-colors">
              <div className="p-6 border-b border-grey-stroke dark:border-charcoal-500">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  {/* Search Bar */}
                  <div className="flex-1 relative">
                    <MagnifyingGlass size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-charcoal-400" />
                    <input
                      type="text"
                      placeholder="Search by business name, provider, user type, or notes..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-grey-stroke rounded-lg focus:ring-2 focus:ring-sage-500 focus:border-sage-500 text-body-regular"
                    />
                  </div>

                  {/* Status Filter */}
                  <div className="flex items-center gap-3">
                    <label className="text-body-regular text-charcoal-600 font-semibold">Status:</label>
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="border border-grey-stroke rounded-lg px-4 py-2 focus:ring-2 focus:ring-sage-500 focus:border-sage-500 text-body-regular bg-white"
                    >
                      <option value="All">All</option>
                      <option value="Pending">Pending</option>
                      <option value="Approved">Approved</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Table Content */}
              <div className="p-6">
                {filteredRequests.length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle size={64} className="text-success-btn mx-auto mb-4" weight="fill" />
                    <p className="text-charcoal-400 text-lg">No requests found</p>
                    <p className="text-charcoal-400 text-sm mt-2">Try adjusting your search or filters</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader
                      columns={[
                        'Request ID',
                        'Business Name',
                        'Provider',
                        'Status',
                        'Submitted',
                        'Actions'
                      ]}
                    />
                    <TableBody>
                      {filteredRequests.map((request) => (
                        <TableRow
                          key={request.id}
                          data={[
                            request.id,
                            request.businessName || 'N/A',
                            request.userRoleType || 'N/A',
                            <StatusChip
                              variant={
                                request.status === 'Approved'
                                  ? 'success'
                                  : request.status === 'Pending'
                                  ? 'danger'
                                  : 'error'
                              }
                            >
                              {request.status}
                            </StatusChip>,
                            new Date(request.createdAt).toLocaleDateString()
                          ]}
                          actions={
                            <>
                              <CRUDButton
                                variant="success"
                                onClick={() => handleViewDetails(request)}
                              >
                                <Eye size={16} className="inline mr-1" />
                                View
                              </CRUDButton>
                              {request.status === 'Pending' && (
                                <>
                                  <CRUDButton
                                    variant="success"
                                    onClick={() => handleApprove(request.id)}
                                    disabled={processingId === request.id}
                                  >
                                    <CheckCircle size={16} className="inline mr-1" />
                                    {processingId === request.id ? 'Processing...' : 'Approve'}
                                  </CRUDButton>
                                  <CRUDButton
                                    variant="error"
                                    onClick={() => handleReject(request.id)}
                                    disabled={processingId === request.id}
                                  >
                                    <XCircle size={16} className="inline mr-1" />
                                    {processingId === request.id ? 'Processing...' : 'Reject'}
                                  </CRUDButton>
                                </>
                              )}
                            </>
                          }
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

      {/* Details Modal */}
      {showDetailsModal && selectedRequest && (
        <div className="fixed inset-0 bg-charcoal-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-grey-200 dark:bg-[#2A2A2A] rounded-lg shadow-soft-lift max-w-2xl w-full max-h-[90vh] overflow-y-auto transition-colors">
            {/* Modal Header */}
            <div className="p-6 border-b border-grey-stroke dark:border-charcoal-500">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-display-h2 text-charcoal-600 dark:text-white">{selectedRequest.businessName || 'N/A'}</h3>
                  <p className="text-body-regular text-charcoal-400 dark:text-gray-400 mt-1">
                    Request ID: {selectedRequest.id}
                  </p>
                  <div className="mt-3">
                    <StatusChip
                      variant={
                        selectedRequest.status === 'Approved'
                          ? 'success'
                          : selectedRequest.status === 'Pending'
                          ? 'danger'
                          : 'error'
                      }
                    >
                      {selectedRequest.status}
                    </StatusChip>
                  </div>
                </div>
                <button
                  onClick={handleCloseModal}
                  className="text-charcoal-400 hover:text-charcoal-600 transition-colors p-2"
                >
                  <XCircle size={24} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <h4 className="text-card-h2 text-charcoal-600 dark:text-white mb-4">Request Details</h4>

              <div className="space-y-4">
                {/* Basic Information */}
                <div className="bg-cream-50 rounded-lg p-4">
                  <h5 className="text-body-medium text-charcoal-600 font-semibold mb-3">
                    Basic Information
                  </h5>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-body-regular text-charcoal-400 dark:text-gray-400">Business Name:</span>
                      <span className="text-body-regular text-charcoal-600 dark:text-white font-semibold">
                        {selectedRequest.businessName || 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-body-regular text-charcoal-400">Provider Name:</span>
                      <span className="text-body-regular text-charcoal-600">
                        {selectedRequest.userDisplayName || 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-body-regular text-charcoal-400">User Type:</span>
                      <span className="text-body-regular text-charcoal-600">
                        {selectedRequest.userRoleType || 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-body-regular text-charcoal-400">Request ID:</span>
                      <span className="text-body-regular text-charcoal-600">
                        {selectedRequest.id}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {selectedRequest.notes && (
                  <div className="bg-cream-50 rounded-lg p-4">
                    <h5 className="text-body-medium text-charcoal-600 font-semibold mb-3">
                      Notes
                    </h5>
                    <p className="text-body-regular text-charcoal-600">
                      {selectedRequest.notes}
                    </p>
                  </div>
                )}

                {/* Dates */}
                <div className="bg-cream-50 rounded-lg p-4">
                  <h5 className="text-body-medium text-charcoal-600 font-semibold mb-3">
                    Timeline
                  </h5>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-body-regular text-charcoal-400">Submitted:</span>
                      <span className="text-body-regular text-charcoal-600">
                        {new Date(selectedRequest.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-body-regular text-charcoal-400">Last Updated:</span>
                      <span className="text-body-regular text-charcoal-600">
                        {new Date(selectedRequest.updatedAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-grey-stroke flex justify-end gap-3">
              <CRUDButton variant="error" onClick={handleCloseModal}>
                Close
              </CRUDButton>
              {selectedRequest.status === 'Pending' && (
                <>
                  <CRUDButton
                    variant="success"
                    onClick={() => {
                      handleCloseModal();
                      handleApprove(selectedRequest.id);
                    }}
                  >
                    <CheckCircle size={16} className="inline mr-1" />
                    Approve Request
                  </CRUDButton>
                  <CRUDButton
                    variant="error"
                    onClick={() => {
                      handleCloseModal();
                      handleReject(selectedRequest.id);
                    }}
                  >
                    <XCircle size={16} className="inline mr-1" />
                    Reject Request
                  </CRUDButton>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RequestApprovals;


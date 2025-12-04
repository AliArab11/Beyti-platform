import React, { useState } from "react";
import * as Icon from "@phosphor-icons/react";

// Helper Functions
const getStatusVariant = (status) => {
  const s = (status || "").toLowerCase();
  if (s === "available") return "neutral";
  if (s === "accepted") return "danger";
  if (s === "picked up") return "brand";
  if (s === "delivered") return "success";
  if (s === "cancelled") return "error";
  return "neutral";
};

const isNewJob = (job) => {
  const status = (job.status || "").toLowerCase();
  if (status !== "available") return false;
  const createdAt = new Date(job.order?.createdAt || job.createdAt);
  if (isNaN(createdAt.getTime())) return false;
  const diffMinutes = (new Date() - createdAt) / (1000 * 60);
  return diffMinutes <= 30;
};

const formatDate = (value) => {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

// UI Components
const AnalyticsCard = ({ title, metrics }) => (
  <div className="bg-grey-200 rounded-lg shadow-soft-lift border border-grey-stroke p-6">
    <h3 className="text-card-h2 text-charcoal-600 mb-4">{title}</h3>
    <div className="flex gap-6">
      {metrics.map((m, i) => (
        <div key={i} className="flex-1">
          <p className="text-metric-h3 text-sage-700 font-bold">{m.value}</p>
          <p className="text-body-regular text-charcoal-400 mt-1">{m.label}</p>
        </div>
      ))}
    </div>
  </div>
);

const StatusChip = ({ variant, children }) => {
  const variants = {
    success: "bg-success-bg text-success-text border-success-btn",
    error: "bg-error-bg text-error-text border-error-btn",
    danger: "bg-danger-bg text-danger-text border-danger-btn",
    brand: "bg-sage-100 text-sage-700 border-sage-500",
    neutral: "bg-grey-200 text-charcoal-600 border-grey-stroke",
  };
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-label-medium font-semibold border ${variants[variant] || variants.neutral}`}>
      {children}
    </span>
  );
};

const CRUDButton = ({ variant, onClick, children, disabled }) => {
  const variants = {
    success: "bg-success-btn hover:bg-success-text text-white",
    error: "bg-error-btn hover:bg-error-text text-white",
    outline: "bg-transparent border-2 border-charcoal-400 hover:bg-grey-200 text-charcoal-600",
  };
  return (
    <button onClick={onClick} disabled={disabled} className={`px-3 h-9 rounded-lg font-semibold text-sm transition-colors disabled:opacity-50 ${variants[variant]}`}>
      {children}
    </button>
  );
};

// Main Component
const DriverOrdersPage = ({ 
  driverId, 
  driverName, 
  isOnline, 
  setIsOnline,
  metrics, 
  availableJobs, 
  currentJobs, 
  historyJobs, 
  onAcceptJob, 
  onUpdateStatus, 
  onOpenJobModal 
}) => {
  const [activeTab, setActiveTab] = useState("available");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [filterStatus, setFilterStatus] = useState("all");

  // Get current orders based on active tab
  let currentOrders = activeTab === "available" ? availableJobs : activeTab === "current" ? currentJobs : historyJobs;

  // Apply search filter
  if (searchQuery) {
    currentOrders = currentOrders.filter(job => 
      job.orderId?.toString().includes(searchQuery) ||
      job.order?.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.order?.sellerName?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  // Apply status filter (for history tab)
  if (activeTab === "history" && filterStatus !== "all") {
    currentOrders = currentOrders.filter(job => 
      job.status?.toLowerCase() === filterStatus.toLowerCase()
    );
  }

  // Apply sorting
  currentOrders = [...currentOrders].sort((a, b) => {
    if (sortBy === "date") {
      return new Date(b.createdAt) - new Date(a.createdAt);
    } else if (sortBy === "fee") {
      return (b.order?.deliveryFee || 0) - (a.order?.deliveryFee || 0);
    } else if (sortBy === "customer") {
      return (a.order?.customerName || "").localeCompare(b.order?.customerName || "");
    }
    return 0;
  });

  return (
    <div className="space-y-6">
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <AnalyticsCard title="Available Jobs" metrics={[{ value: isOnline ? metrics.available : "—", label: isOnline ? "New requests" : "You are offline" }]} />
        <AnalyticsCard title="Active Deliveries" metrics={[{ value: metrics.current, label: "In progress" }]} />
        <AnalyticsCard title="Completed" metrics={[{ value: metrics.completed, label: "All time" }]} />
        <AnalyticsCard title="Total Earnings" metrics={[{ value: `BHD ${metrics.earnings.toFixed(3)}`, label: "Lifetime" }]} />
      </div>

      {/* Active Delivery Alert */}
      {metrics.activeDelivery && (
        <div className="bg-gradient-to-br from-danger-bg to-danger-bg/50 border-2 border-danger-btn rounded-lg p-6 shadow-soft-lift">
          <div className="flex items-center gap-2 mb-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-danger-btn opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-danger-btn"></span>
            </span>
            <h3 className="text-card-h2 text-danger-text font-bold">Active Delivery in Progress</h3>
          </div>
          <p className="text-body-medium text-charcoal-600 mb-3">Order #{metrics.activeDelivery.orderId} • {metrics.activeDelivery.status}</p>
          <div className="flex gap-2">
            {metrics.activeDelivery.status === "Accepted" && (
              <button onClick={() => onUpdateStatus(metrics.activeDelivery.id, "Picked Up")} className="flex-1 bg-success-btn hover:bg-success-text text-white py-2.5 rounded-lg font-semibold text-sm">
                ✓ Mark Picked Up
              </button>
            )}
            {metrics.activeDelivery.status === "Picked Up" && (
              <button onClick={() => onUpdateStatus(metrics.activeDelivery.id, "Delivered")} className="flex-1 bg-success-btn hover:bg-success-text text-white py-2.5 rounded-lg font-semibold text-sm">
                ✓ Mark Delivered
              </button>
            )}
            <button onClick={() => onOpenJobModal(metrics.activeDelivery)} className="flex-1 bg-grey-300 hover:bg-grey-400 text-charcoal-700 py-2.5 rounded-lg font-semibold text-sm">
              View Details
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-3 flex-wrap mt-8">
        <button onClick={() => setActiveTab("available")} className={`px-4 py-2 rounded-lg text-sm font-medium ${activeTab === "available" ? "bg-sage-500 text-cream-50" : "bg-grey-200 text-charcoal-600 hover:bg-grey-300"}`}>
          Available Jobs {metrics.available > 0 && <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold ${activeTab === "available" ? "bg-cream-50 text-sage-700" : "bg-sage-500 text-cream-50"}`}>{metrics.available}</span>}
        </button>
        <button onClick={() => setActiveTab("current")} className={`px-4 py-2 rounded-lg text-sm font-medium ${activeTab === "current" ? "bg-sage-500 text-cream-50" : "bg-grey-200 text-charcoal-600 hover:bg-grey-300"}`}>
          Current Deliveries {metrics.current > 0 && <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold ${activeTab === "current" ? "bg-cream-50 text-sage-700" : "bg-sage-500 text-cream-50"}`}>{metrics.current}</span>}
        </button>
        <button onClick={() => setActiveTab("history")} className={`px-4 py-2 rounded-lg text-sm font-medium ${activeTab === "history" ? "bg-sage-500 text-cream-50" : "bg-grey-200 text-charcoal-600 hover:bg-grey-300"}`}>
          History {metrics.completed > 0 && <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold ${activeTab === "history" ? "bg-cream-50 text-sage-700" : "bg-sage-500 text-cream-50"}`}>{metrics.completed}</span>}
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-grey-200 rounded-lg border border-grey-stroke p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Icon.MagnifyingGlass size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-charcoal-400" />
            <input
              type="text"
              placeholder="Search by order #, customer, or restaurant..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-grey-stroke rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-400 bg-cream-50"
            />
          </div>

          {/* Sort */}
          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-grey-stroke rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-400 bg-cream-50 text-charcoal-700 font-medium"
            >
              <option value="date">Sort by Date</option>
              <option value="fee">Sort by Fee</option>
              <option value="customer">Sort by Customer</option>
            </select>

            {/* Status Filter (only for history) */}
            {activeTab === "history" && (
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-grey-stroke rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-400 bg-cream-50 text-charcoal-700 font-medium"
              >
                <option value="all">All Status</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            )}
          </div>
        </div>
      </div>

      {/* Offline Alert */}
      {!isOnline && activeTab === "available" && (
        <div className="bg-error-bg border-l-4 border-error-btn px-4 py-3 rounded-lg">
          <p className="text-body-medium text-error-text font-semibold">⚠️ You are offline. Go online to view and accept jobs.</p>
        </div>
      )}

      {/* Orders Table */}
      {currentOrders.length === 0 ? (
        <div className="bg-grey-200 p-8 rounded-lg border border-grey-stroke text-center">
          <Icon.Package size={64} className="text-charcoal-400 mx-auto mb-4" />
          <p className="text-card-h2 text-charcoal-500 mb-2">No orders found</p>
          <p className="text-body-regular text-charcoal-400">
            {searchQuery ? "No orders match your search" : activeTab === "available" && !isOnline ? "Go online to see available jobs" : `No ${activeTab} orders at the moment`}
          </p>
        </div>
      ) : (
        <div className="bg-cream-50 rounded-lg shadow-soft-lift border border-grey-stroke overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-grey-100 border-b-2 border-grey-stroke">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-charcoal-600 uppercase tracking-wider">Order</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-charcoal-600 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-charcoal-600 uppercase tracking-wider">Restaurant</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-charcoal-600 uppercase tracking-wider">Delivery Fee</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-charcoal-600 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-charcoal-600 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-charcoal-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-grey-stroke">
                {currentOrders.map((job) => {
                  const isNew = isNewJob(job);
                  return (
                    <tr key={job.id} className={`transition-colors ${isNew ? 'bg-danger-bg/20' : 'bg-cream-50 hover:bg-grey-50'}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {isNew && (
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-danger-btn opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-danger-btn"></span>
                            </span>
                          )}
                          <span className={`font-bold text-sm ${isNew ? 'text-danger-text' : 'text-charcoal-700'}`}>#{job.orderId}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Icon.User size={16} className="text-charcoal-400" />
                          <span className="text-sm text-charcoal-700 font-medium">{job.order?.customerName || "—"}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Icon.Storefront size={16} className="text-charcoal-400" />
                          <span className="text-sm text-charcoal-700 font-medium">{job.order?.sellerName || "—"}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className="text-sm font-bold text-sage-700">BHD {(job.order?.deliveryFee || 0).toFixed(3)}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <StatusChip variant={getStatusVariant(job.status)}>{job.status}</StatusChip>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-charcoal-600">{formatDate(job.createdAt)}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex gap-2 justify-end">
                          <CRUDButton variant="outline" onClick={() => onOpenJobModal(job)}>
                            <div className="flex items-center gap-1">
                              <Icon.Eye size={16} />
                              View
                            </div>
                          </CRUDButton>
                          {job.status === "Available" && (
                            <CRUDButton variant="success" onClick={() => onAcceptJob(job)} disabled={!isOnline || !!metrics.activeDelivery}>
                              <div className="flex items-center gap-1">
                                <Icon.Check size={16} weight="bold" />
                                Accept
                              </div>
                            </CRUDButton>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Results count */}
      {currentOrders.length > 0 && (
        <div className="text-center text-sm text-charcoal-400">
          Showing {currentOrders.length} {currentOrders.length === 1 ? 'order' : 'orders'}
        </div>
      )}
    </div>
  );
};

export default DriverOrdersPage;
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
  onOpenJobModal,
  onDeclineJob
}) => {
  const [activeTab, setActiveTab] = useState("available");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [filterStatus, setFilterStatus] = useState("all");
  const [expandedId, setExpandedId] = useState(null);

  const toggleRow = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  // Get current orders based on active tab
  let currentOrders = activeTab === "available" ? availableJobs : activeTab === "current" ? currentJobs : historyJobs;
  
  // Hide available jobs when offline
  if (activeTab === "available" && !isOnline) {
    currentOrders = [];
  }

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
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-danger-btn opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-danger-btn"></span>
          </span>
          <h3 className="text-card-h2 text-danger-text font-bold">Active Delivery in Progress</h3>
        </div>
        <p className="text-body-medium text-charcoal-600 mb-4">
          Order #{metrics.activeDelivery.orderId} • {metrics.activeDelivery.status}
        </p>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-white/60 rounded-lg p-3">
            <p className="text-xs text-charcoal-400 uppercase mb-1">Customer</p>
            <p className="text-sm font-semibold text-charcoal-700">
              {metrics.activeDelivery.order?.customerName || "N/A"}
            </p>
          </div>
          <div className="bg-white/60 rounded-lg p-3">
            <p className="text-xs text-charcoal-400 uppercase mb-1">Restaurant</p>
            <p className="text-sm font-semibold text-charcoal-700">
              {metrics.activeDelivery.order?.sellerName || "N/A"}
            </p>
          </div>
          <div className="bg-white/60 rounded-lg p-3">
            <p className="text-xs text-charcoal-400 uppercase mb-1">Your Earnings</p>
            <p className="text-lg font-bold text-sage-700">
              BHD {(metrics.activeDelivery.order?.deliveryFee || 0).toFixed(3)}
            </p>
          </div>
          <div className="bg-white/60 rounded-lg p-3">
            <p className="text-xs text-charcoal-400 uppercase mb-1">Total Order</p>
            <p className="text-lg font-bold text-charcoal-700">
              BHD {(metrics.activeDelivery.order?.totalAmount || 0).toFixed(3)}
            </p>
          </div>
        </div>
        
        {/* Quick Action Buttons */}
        <div className="flex gap-2 mb-3">
          {(metrics.activeDelivery.status === "Accepted" || metrics.activeDelivery.status === "accepted") && (
            <button
              onClick={async () => {
                try {
                  await onUpdateStatus(metrics.activeDelivery.id, "Picked Up");
                } catch (err) {
                  alert(err.message || "Failed to update status");
                }
              }}
              className="flex-1 bg-success-btn hover:bg-success-text text-white py-2.5 rounded-lg font-semibold text-sm cursor-pointer transition-colors"
            >
              ✓ Mark Picked Up
            </button>
          )}
          
          {(metrics.activeDelivery.status === "Picked Up" || metrics.activeDelivery.status === "picked up") && (
            <button
              onClick={async () => {
                try {
                  await onUpdateStatus(metrics.activeDelivery.id, "Delivered");
                } catch (err) {
                  alert(err.message || "Failed to update status");
                }
              }}
              className="flex-1 bg-success-btn hover:bg-success-text text-white py-2.5 rounded-lg font-semibold text-sm cursor-pointer transition-colors"
            >
              ✓ Mark Delivered
            </button>
          )}
          
          <button
            onClick={() => onOpenJobModal(metrics.activeDelivery)}
            className="flex-1 bg-grey-300 hover:bg-grey-400 text-charcoal-700 py-2.5 rounded-lg font-semibold text-sm cursor-pointer transition-colors"
          >
            View Details
          </button>
        </div>
      </div>
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
        <div className="overflow-x-auto border border-grey-stroke rounded-lg bg-cream-50">
          <table className="min-w-full text-sm">
            <thead className="bg-grey-100 border-b border-grey-stroke">
              <tr>
                <th className="w-10 pl-4 pr-2 py-3 text-left text-xs font-semibold text-charcoal-500"></th>
                <th className="px-2 py-3 text-left text-xs font-semibold text-charcoal-500">Order #</th>
                <th className="px-2 py-3 text-left text-xs font-semibold text-charcoal-500">Customer</th>
                <th className="px-2 py-3 text-left text-xs font-semibold text-charcoal-500">Restaurant</th>
                <th className="px-2 py-3 text-right text-xs font-semibold text-charcoal-500">Total</th>
                <th className="px-2 py-3 text-right text-xs font-semibold text-charcoal-500">Fee</th>
                <th className="px-2 py-3 text-center text-xs font-semibold text-charcoal-500">Status</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-charcoal-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentOrders.map((job) => {
                const isExpanded = expandedId === job.id;
                const statusText = job.status || "Unknown";
                const statusVariant = getStatusVariant(job.status);
                const newJob = isNewJob(job);

                const mainRowClass = [
                  "border-b-2 border-grey-stroke transition-all",
                  newJob ? "bg-danger-bg/30 hover:bg-danger-bg/40" : "bg-cream-50 hover:bg-grey-100",
                  isExpanded ? "border-b-0" : ""
                ].join(" ");

                return (
                  <React.Fragment key={job.id}>
                    <tr className={mainRowClass}>
                      {/* arrow left */}
                      <td className="pl-4 pr-2 py-3 align-top">
                        <button
                          type="button"
                          onClick={() => toggleRow(job.id)}
                          className="w-7 h-7 flex items-center justify-center rounded-full border border-grey-stroke bg-white hover:bg-grey-100 transition-transform"
                        >
                          <Icon.CaretRight
                            size={16}
                            className={`text-charcoal-600 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                          />
                        </button>
                      </td>

                      {/* order + "New" ping */}
                      <td className="px-2 py-3 align-top">
                        <div className="flex items-center gap-2">
                          {newJob && (
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-danger-btn opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-danger-btn"></span>
                            </span>
                          )}
                          <span className="font-semibold text-charcoal-700">#{job.orderId}</span>
                        </div>
                      </td>

                      {/* customer */}
                      <td className="px-2 py-3 align-top text-charcoal-700">
                        {job.order?.customerName || "—"}
                      </td>

                      {/* restaurant */}
                      <td className="px-2 py-3 align-top text-charcoal-700">
                        {job.order?.sellerName || "—"}
                      </td>

                      {/* subtotal */}
                      <td className="px-2 py-3 align-top text-right text-charcoal-800 font-semibold">
                        BHD {((job.order?.totalAmount || 0) - (job.order?.deliveryFee || 0)).toFixed(3)}
                      </td>

                      {/* fee */}
                      <td className="px-2 py-3 align-top text-right text-charcoal-600">
                        BHD {(job.order?.deliveryFee || 0).toFixed(3)}
                      </td>

                      {/* status */}
                      <td className="px-2 py-3 align-top text-center">
                        <StatusChip variant={statusVariant}>{statusText}</StatusChip>
                      </td>

                      {/* actions */}
                      <td className="px-4 py-3 align-top">
                        <div className="flex flex-wrap gap-2 justify-end">
                          <CRUDButton variant="outline" onClick={() => onOpenJobModal(job)}>
                            Manage
                          </CRUDButton>

                          {(job.status === "Available" || job.status === "available") && (
                            <>
                              <CRUDButton
                                variant="success"
                                onClick={() => onAcceptJob(job)}
                                disabled={!isOnline || !!metrics.activeDelivery}
                              >
                                {metrics.activeDelivery ? '🚫 Busy' : 'Accept'}
                              </CRUDButton>
                              <CRUDButton
                                variant="error"
                                onClick={() => onDeclineJob(job.id)}
                                disabled={!isOnline}
                              >
                                Decline
                              </CRUDButton>
                            </>
                          )}

                          {(job.status === "Accepted" || job.status === "accepted") && (
                            <CRUDButton
                              variant="success"
                              onClick={() => onUpdateStatus(job.id, "Picked Up")}
                            >
                              ✓ Picked Up
                            </CRUDButton>
                          )}

                          {(job.status === "Picked Up" || job.status === "picked up") && (
                            <CRUDButton
                              variant="success"
                              onClick={() => onUpdateStatus(job.id, "Delivered")}
                            >
                              ✓ Delivered
                            </CRUDButton>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* Expanded row with details */}
                    {isExpanded && (
                      <tr className="bg-grey-50">
                        <td colSpan={8} className="px-0 pb-0 pt-0">
                          <div className="bg-gradient-to-b from-grey-50 to-cream-50 border-l-4 border-sage-500 mx-4 mb-4 mt-2 rounded-lg shadow-md p-6 space-y-5">
                            
                            {/* Section Title */}
                            <div className="flex items-center justify-between pb-3 border-b-2 border-sage-300">
                              <h4 className="text-base font-bold text-charcoal-700 flex items-center gap-2">
                                <Icon.Package size={20} weight="fill" className="text-sage-600" />
                                Order Details - #{job.orderId}
                              </h4>
                              <button
                                onClick={() => toggleRow(job.id)}
                                className="text-charcoal-400 hover:text-charcoal-600 flex items-center gap-1 text-sm font-medium"
                              >
                                <span>Collapse</span>
                                <Icon.CaretUp size={16} />
                              </button>
                            </div>

                            {/* Contact Information Row */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="bg-grey-100 rounded-lg p-4 border border-grey-stroke">
                                <div className="flex items-start gap-3">
                                  <Icon.User size={20} className="text-sage-600 mt-0.5" />
                                  <div className="flex-1">
                                    <p className="text-xs text-charcoal-400 mb-1 uppercase tracking-wide">Customer</p>
                                    <p className="text-sm font-semibold text-charcoal-700 mb-1">{job.order?.customerName || "N/A"}</p>
                                    <p className="text-xs text-charcoal-500 flex items-center gap-1">
                                      <Icon.Phone size={14} weight="fill" />
                                      {job.order?.customerPhone || "No phone"}
                                    </p>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="bg-grey-100 rounded-lg p-4 border border-grey-stroke">
                                <div className="flex items-start gap-3">
                                  <Icon.Storefront size={20} className="text-sage-600 mt-0.5" />
                                  <div className="flex-1">
                                    <p className="text-xs text-charcoal-400 mb-1 uppercase tracking-wide">Restaurant</p>
                                    <p className="text-sm font-semibold text-charcoal-700 mb-1">{job.order?.sellerName || "N/A"}</p>
                                    <p className="text-xs text-charcoal-500 flex items-center gap-1">
                                      <Icon.Phone size={14} weight="fill" />
                                      {job.order?.sellerPhone || "No phone"}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Payment & Pricing Row */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="bg-cream-50 rounded-lg p-4 border border-grey-stroke">
                                <p className="text-xs text-charcoal-400 mb-1 uppercase tracking-wide">Payment Method</p>
                                <p className="text-sm font-semibold text-charcoal-700">{job.order?.paymentMethod || "N/A"}</p>
                              </div>
                              
                              <div className="bg-cream-50 rounded-lg p-4 border border-grey-stroke">
                                <p className="text-xs text-charcoal-400 mb-1 uppercase tracking-wide">Items Subtotal</p>
                                <p className="text-base font-bold text-charcoal-700">
                                  BHD {((job.order?.totalAmount || 0) - (job.order?.deliveryFee || 0)).toFixed(3)}
                                </p>
                              </div>
                              
                              <div className="bg-sage-100 rounded-lg p-4 border border-sage-500">
                                <p className="text-xs text-sage-700 mb-1 uppercase tracking-wide font-semibold">Your Earnings</p>
                                <p className="text-base font-bold text-sage-700">BHD {(job.order?.deliveryFee || 0).toFixed(3)}</p>
                                <p className="text-xs text-charcoal-500 mt-1">Total: BHD {(job.order?.totalAmount || 0).toFixed(3)}</p>
                              </div>
                            </div>

                            {/* Route Information */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="bg-gradient-to-br from-sage-50 to-cream-50 border-2 border-sage-300 rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                  <div className="w-10 h-10 rounded-full bg-sage-500 flex items-center justify-center flex-shrink-0">
                                    <Icon.Package size={20} weight="fill" className="text-white" />
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-xs text-sage-700 uppercase tracking-wide mb-2 font-semibold">📦 PICKUP LOCATION</p>
                                    <p className="text-sm font-bold text-charcoal-700 mb-1">{job.pickupAddress?.street || "N/A"}</p>
                                    <p className="text-xs text-charcoal-600 mb-1">
                                      {job.pickupAddress?.city || "N/A"}
                                      {job.pickupAddress?.state && `, ${job.pickupAddress.state}`}
                                    </p>
                                    {job.pickupAddress?.building && (
                                      <p className="text-xs text-charcoal-500 bg-white/60 rounded px-2 py-1 inline-block">
                                        🏢 Building: {job.pickupAddress.building}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="bg-gradient-to-br from-danger-bg to-cream-50 border-2 border-danger-btn/30 rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                  <div className="w-10 h-10 rounded-full bg-danger-btn flex items-center justify-center flex-shrink-0">
                                    <Icon.MapPin size={20} weight="fill" className="text-white" />
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-xs text-danger-text uppercase tracking-wide mb-2 font-semibold">📍 DELIVERY LOCATION</p>
                                    <p className="text-sm font-bold text-charcoal-700 mb-1">{job.deliveryAddress?.street || "N/A"}</p>
                                    <p className="text-xs text-charcoal-600 mb-1">
                                      {job.deliveryAddress?.city || "N/A"}
                                      {job.deliveryAddress?.state && `, ${job.deliveryAddress.state}`}
                                    </p>
                                    {job.deliveryAddress?.building && (
                                      <p className="text-xs text-charcoal-500 bg-white/60 rounded px-2 py-1 inline-block">
                                        🏢 Building: {job.deliveryAddress.building}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Special Instructions */}
                            {job.order?.specialInstructions && (
                              <div className="bg-amber-50 border-l-4 border-amber-500 rounded-lg p-4">
                                <div className="flex items-start gap-2">
                                  <Icon.Note size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
                                  <div className="flex-1">
                                    <p className="text-xs text-amber-700 uppercase tracking-wide mb-2 font-semibold">📝 SPECIAL INSTRUCTIONS</p>
                                    <p className="text-sm text-charcoal-700 leading-relaxed">{job.order.specialInstructions}</p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
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
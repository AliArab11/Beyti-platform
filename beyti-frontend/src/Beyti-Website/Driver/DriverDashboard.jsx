import React, { useState, useEffect, useMemo } from "react";
import * as Icon from "@phosphor-icons/react";

// ---------------------------------------------------------------------
// API helpers
// ---------------------------------------------------------------------
const BASE_URL = "https://localhost:7062/api";

const fetchAPI = async (endpoint, options = {}) => {
  try {
    const url = `${BASE_URL}${endpoint}`;
    const defaultHeaders = { "Content-Type": "application/json" };
    const config = {
      ...options,
      headers: { ...defaultHeaders, ...(options.headers || {}) },
    };

    const response = await fetch(url, config);

    if (!response.ok) {
      let errorMessage;
      const contentType = response.headers.get("content-type");

      if (contentType && contentType.includes("application/json")) {
        const errorData = await response.json().catch(() => ({}));
        errorMessage =
          errorData.message || errorData.Message || errorData.title;
      } else {
        errorMessage = await response.text().catch(() => "");
      }

      if (!errorMessage) {
        errorMessage = `Request failed with status ${response.status}`;
      }
      throw new Error(errorMessage);
    }

    if (response.status === 204) return null;
    return await response.json();
  } catch (error) {
    console.error("API Request Failed:", error);
    throw error;
  }
};

const getDrivers = async () => fetchAPI("/Drivers");
const getDeliveryTickets = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  return fetchAPI(`/DeliveryTickets${queryString ? `?${queryString}` : ""}`);
};
const acceptDeliveryTicket = async (id, driverId) =>
  fetchAPI(`/DeliveryTickets/${id}/accept`, {
    method: "PUT",
    body: JSON.stringify({ DriverId: driverId }),
  });
const updateDeliveryStatus = async (id, status) =>
  fetchAPI(`/DeliveryTickets/${id}/update-status`, {
    method: "PUT",
    body: JSON.stringify({ Status: status }),
  });

// ---------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------
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

  const createdAtStr = job.order?.createdAt || job.createdAt;
  if (!createdAtStr) return false;

  const createdAt = new Date(createdAtStr);
  if (Number.isNaN(createdAt.getTime())) return false;

  const now = new Date();
  const diffMinutes = (now - createdAt) / (1000 * 60);
  return diffMinutes <= 30; // treat as "new" for 30 minutes
};

// ---------------------------------------------------------------------
// Small shared UI components (matching Seller style)
// ---------------------------------------------------------------------
const NavigationButton = ({ icon, selected, onClick, children }) => (
  <button
    onClick={onClick}
    className={`w-[220px] h-11 px-4 rounded-lg flex items-center gap-3 transition-colors ${
      selected ? "bg-sage-700 text-white" : "text-sage-100 hover:bg-sage-600"
    }`}
  >
    {icon}
    <span className="text-body-medium">{children}</span>
  </button>
);

const SidebarProfile = ({ userName, userRole }) => (
  <div className="border-t border-sage-600 pt-4 px-4">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-sage-700 flex items-center justify-center">
        <Icon.User size={20} weight="fill" className="text-white" />
      </div>
      <div>
        <p className="text-body-medium text-white font-semibold">{userName}</p>
        <p className="text-label-medium text-sage-100">{userRole}</p>
      </div>
    </div>
  </div>
);

const PageHeader = ({ title, notificationCount, userName, userRole }) => (
  <div className="h-20 px-6 flex items-center justify-between border-b border-grey-stroke bg-grey-200">
    <h1 className="text-display-h1 text-charcoal-600">{title}</h1>
    <div className="flex items-center gap-4">
      <div className="relative">
        <Icon.Bell size={24} className="text-charcoal-600" />
        {notificationCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-danger-btn text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
            {notificationCount}
          </span>
        )}
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-body-medium text-charcoal-600 font-semibold">
            {userName}
          </p>
          <p className="text-label-medium text-charcoal-400">{userRole}</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-sage-500 flex items-center justify-center">
          <Icon.User size={20} weight="fill" className="text-white" />
        </div>
      </div>
    </div>
  </div>
);

const AnalyticsCard = ({ title, metrics }) => (
  <div className="bg-grey-200 rounded-lg p-6 shadow-soft-lift border border-grey-stroke">
    {title && <h3 className="text-card-h2 text-charcoal-600 mb-4">{title}</h3>}
    <div className="flex gap-6">
      {metrics.map((metric, idx) => (
        <div key={idx} className="flex-1">
          <p className="text-metric-h3 text-sage-700">{metric.value}</p>
          {metric.label && (
            <p className="text-body-regular text-charcoal-400 mt-1">
              {metric.label}
            </p>
          )}
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
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-label-medium font-semibold border ${
        variants[variant] || variants.neutral
      }`}
    >
      {children}
    </span>
  );
};

const CRUDButton = ({ variant, onClick, children, disabled }) => {
  const variants = {
    success: "bg-success-btn hover:bg-success-text text-white",
    error: "bg-error-btn hover:bg-error-text text-white",
    danger: "bg-danger-btn hover:bg-danger-text text-danger-text",
    neutral: "bg-grey-300 hover:bg-grey-400 text-charcoal-700",
    outline:
      "bg-transparent border-2 border-charcoal-400 hover:bg-grey-200 text-charcoal-600",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-3 h-[36px] rounded-lg font-semibold text-xs md:text-sm transition-colors disabled:opacity-50 ${
        variants[variant] || variants.neutral
      }`}
    >
      {children}
    </button>
  );
};

// ---------------------------------------------------------------------
// Main Driver Dashboard
// ---------------------------------------------------------------------
const DriverDashboard = () => {
  // sidebar "page" level tabs
  const [activeTab, setActiveTab] = useState("dashboard");

  // inline tabs inside main dashboard
  const [dashTab, setDashTab] = useState("requests");

  // driver selection
  const [driverId, setDriverId] = useState(null);
  const [driverName, setDriverName] = useState("My Profile");
  const [driverList, setDriverList] = useState([]);
  const [selectModalOpen, setSelectModalOpen] = useState(true);

  // data
  const [tickets, setTickets] = useState([]);
  const [loading] = useState(false); // keeping for future if you want loader
  const [error, setError] = useState(null);

  // job detail modal
  const [selectedJob, setSelectedJob] = useState(null);
  const [jobModalOpen, setJobModalOpen] = useState(false);

  // Disable body scroll when modal(s) are open
  useEffect(() => {
    if (selectModalOpen || jobModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [selectModalOpen, jobModalOpen]);

  // Load drivers once
  useEffect(() => {
    const loadDrivers = async () => {
      try {
        const data = await getDrivers();
        setDriverList(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to load drivers", err);
      }
    };
    loadDrivers();
  }, []);

  const openJobModal = (job) => {
    setSelectedJob(job);
    setJobModalOpen(true);
  };

  const closeJobModal = () => {
    setJobModalOpen(false);
    setSelectedJob(null);
  };

  const handleJobUpdated = (updatedJob) => {
    setTickets((prev) =>
      prev.map((t) => (t.id === updatedJob.id ? { ...t, ...updatedJob } : t))
    );
    setSelectedJob((prev) =>
      prev && prev.id === updatedJob.id ? { ...prev, ...updatedJob } : prev
    );
  };

  const handleDeclineJob = (jobId) => {
    setTickets((prev) => prev.filter((t) => t.id !== jobId));
    setSelectedJob((prev) => (prev && prev.id === jobId ? null : prev));
    if (selectedJob && selectedJob.id === jobId) {
      setJobModalOpen(false);
    }
  };

  const handleAcceptJob = async (job) => {
    if (!driverId) return;
    try {
      await acceptDeliveryTicket(job.id, driverId);
      const updated = { ...job, status: "Accepted", driverId };
      handleJobUpdated(updated);
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to accept job");
    }
  };

  // Fetch tickets (all) - filtered by driver in frontend
  const fetchTickets = async () => {
    try {
      const data = await getDeliveryTickets();
      setTickets(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      console.error("Failed to load tickets", err);
      setError(err.message || "Failed to load delivery tickets");
    }
  };

  // Load tickets once when a driver is selected
  useEffect(() => {
    if (!driverId) return;
    fetchTickets();
    // DO NOT ADD ANYTHING ELSE
  }, [driverId]);

  // Derived metrics & slices
  const { metrics, availableJobs, currentJobs, historyJobs } = useMemo(() => {
    if (!tickets || tickets.length === 0) {
      return {
        metrics: {
          available: 0,
          current: 0,
          completed: 0,
          earnings: 0,
        },
        availableJobs: [],
        currentJobs: [],
        historyJobs: [],
      };
    }

    const availableJobs = tickets.filter(
      (t) => t.status === "Available" && !t.driverId
    );

    const currentJobs = tickets.filter(
      (t) =>
        t.driverId === driverId &&
        (t.status === "Accepted" || t.status === "Picked Up")
    );

    const historyJobs = tickets.filter(
      (t) => t.driverId === driverId && t.status === "Delivered"
    );

    const completed = historyJobs.length;
    const earnings = historyJobs.reduce(
      (sum, t) => sum + (t.order?.deliveryFee || 0),
      0
    );

    return {
      metrics: {
        available: availableJobs.length,
        current: currentJobs.length,
        completed,
        earnings,
      },
      availableJobs,
      currentJobs,
      historyJobs,
    };
  }, [tickets, driverId]);

  // -------------------------------------------------------------------
  // Delivery Details Modal (kept for full-screen "Manage")
  // -------------------------------------------------------------------
  const DeliveryDetailsModal = ({ job, onClose, onJobUpdated, onDecline }) => {
    const [actionLoading, setActionLoading] = useState(false);
    const [actionError, setActionError] = useState(null);
    const [localJob, setLocalJob] = useState(job);

    const status = (localJob.status || "").toLowerCase();
    const isAvailable = status === "available";
    const isAccepted = status === "accepted";
    const isPickedUp = status === "picked up";
    const isDelivered = status === "delivered";
    const isCancelled = status === "cancelled";

    const applyUpdate = (newStatus) => {
      const updated = { ...localJob, status: newStatus };
      setLocalJob(updated);
      if (onJobUpdated) onJobUpdated(updated);
    };

    const handleAcceptModal = async () => {
      if (!driverId) return;
      setActionLoading(true);
      setActionError(null);
      try {
        await acceptDeliveryTicket(localJob.id, driverId);
        applyUpdate("Accepted");
      } catch (err) {
        setActionError(err.message || "Failed to accept delivery");
      } finally {
        setActionLoading(false);
      }
    };

    const handleUpdateStatus = async (newStatus) => {
      setActionLoading(true);
      setActionError(null);
      try {
        await updateDeliveryStatus(localJob.id, newStatus);
        applyUpdate(newStatus);
      } catch (err) {
        setActionError(err.message || "Failed to update status");
      } finally {
        setActionLoading(false);
      }
    };

    const renderFooterButtons = () => {
      if (isDelivered || isCancelled) {
        return (
          <button
            type="button"
            onClick={onClose}
            className="w-full bg-grey-300 hover:bg-grey-400 text-charcoal-700 py-2.5 rounded-lg font-semibold"
          >
            Close
          </button>
        );
      }

      if (isAvailable) {
        return (
          <div className="flex flex-col md:flex-row gap-3">
            <button
              type="button"
              disabled={actionLoading}
              onClick={handleAcceptModal}
              className="flex-1 bg-success-btn hover:bg-success-text disabled:bg-success-btn/60 text-white py-2.5 rounded-lg font-semibold"
            >
              {actionLoading ? "Accepting..." : "✓ Accept Job"}
            </button>
            <button
              type="button"
              disabled={actionLoading}
              onClick={() => {
                if (onDecline) onDecline(localJob.id);
                onClose();
              }}
              className="flex-1 bg-error-btn hover:bg-error-text text-white py-2.5 rounded-lg font-semibold"
            >
              Decline Job
            </button>
          </div>
        );
      }

      if (isAccepted) {
        return (
          <div className="flex flex-col md:flex-row gap-3">
            <button
              type="button"
              disabled={actionLoading}
              onClick={() => handleUpdateStatus("Picked Up")}
              className="flex-1 bg-success-btn hover:bg-success-text disabled:bg-success-btn/60 text-white py-2.5 rounded-lg font-semibold"
            >
              {actionLoading ? "Updating..." : "→ Mark Picked Up"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-grey-300 hover:bg-grey-400 text-charcoal-700 py-2.5 rounded-lg font-semibold"
            >
              Close
            </button>
          </div>
        );
      }

      if (isPickedUp) {
        return (
          <div className="flex flex-col md:flex-row gap-3">
            <button
              type="button"
              disabled={actionLoading}
              onClick={() => handleUpdateStatus("Delivered")}
              className="flex-1 bg-success-btn hover:bg-success-text disabled:bg-success-btn/60 text-white py-2.5 rounded-lg font-semibold"
            >
              {actionLoading ? "Updating..." : "→ Mark Delivered"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-grey-300 hover:bg-grey-400 text-charcoal-700 py-2.5 rounded-lg font-semibold"
            >
              Close
            </button>
          </div>
        );
      }

      return (
        <button
          type="button"
          onClick={onClose}
          className="w-full bg-grey-300 hover:bg-grey-400 text-charcoal-700 py-2.5 rounded-lg font-semibold"
        >
          Close
        </button>
      );
    };

    if (!localJob) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
        <div className="bg-cream-50 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col border border-grey-stroke">
          {/* Header */}
          <div className="px-6 py-4 border-b border-grey-stroke flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-charcoal-700">
                Delivery Ticket #{localJob.id}
              </h2>
              <p className="text-sm text-charcoal-400">
                Order #{localJob.orderId}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-charcoal-400 hover:text-charcoal-600 text-2xl leading-none"
            >
              ×
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
            {/* Status and fee */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="space-y-1">
                <p className="text-xs text-charcoal-400 uppercase tracking-wide">
                  Delivery Status
                </p>
                <StatusChip variant={getStatusVariant(localJob.status)}>
                  {localJob.status || "Unknown"}
                </StatusChip>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-charcoal-400 uppercase tracking-wide">
                  Delivery Fee
                </p>
                <p className="text-lg font-semibold text-sage-700">
                  BHD {(localJob.order?.deliveryFee || 0).toFixed(3)}
                </p>
              </div>
            </div>

            {/* Customer & Order info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-grey-100 rounded-xl p-4 border border-grey-stroke">
              <div>
                <p className="text-xs text-charcoal-400 mb-1 uppercase tracking-wide">
                  Customer
                </p>
                <p className="text-sm font-semibold text-charcoal-700">
                  {localJob.order?.customerName || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-xs text-charcoal-400 mb-1 uppercase tracking-wide">
                  Restaurant
                </p>
                <p className="text-sm font-semibold text-charcoal-700">
                  {localJob.order?.sellerName || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-xs text-charcoal-400 mb-1 uppercase tracking-wide">
                  Order Total
                </p>
                <p className="text-lg font-semibold text-charcoal-800">
                  BHD {(localJob.order?.totalAmount || 0).toFixed(3)}
                </p>
              </div>
              <div>
                <p className="text-xs text-charcoal-400 mb-1 uppercase tracking-wide">
                  Payment Method
                </p>
                <p className="text-sm font-semibold text-charcoal-700">
                  {localJob.order?.paymentMethod || "N/A"}
                </p>
              </div>
            </div>

            {/* Addresses */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-charcoal-700">
                Route Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-cream-50 border border-grey-stroke rounded-lg p-4">
                  <div className="flex items-start gap-2 mb-2">
                    <Icon.Package
                      size={20}
                      className="text-sage-600 mt-0.5"
                    />
                    <div className="flex-1">
                      <p className="text-xs text-charcoal-400 uppercase tracking-wide mb-1">
                        PICKUP LOCATION
                      </p>
                      <p className="text-sm font-semibold text-charcoal-700">
                        {localJob.pickupAddress?.street || "N/A"}
                      </p>
                      <p className="text-xs text-charcoal-500">
                        {localJob.pickupAddress?.city || "N/A"},{" "}
                        {localJob.pickupAddress?.state || ""}
                      </p>
                      {localJob.pickupAddress?.building && (
                        <p className="text-xs text-charcoal-500">
                          Building: {localJob.pickupAddress.building}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-cream-50 border border-grey-stroke rounded-lg p-4">
                  <div className="flex items-start gap-2 mb-2">
                    <Icon.MapPin
                      size={20}
                      className="text-danger-btn mt-0.5"
                    />
                    <div className="flex-1">
                      <p className="text-xs text-charcoal-400 uppercase tracking-wide mb-1">
                        DELIVERY LOCATION
                      </p>
                      <p className="text-sm font-semibold text-charcoal-700">
                        {localJob.deliveryAddress?.street || "N/A"}
                      </p>
                      <p className="text-xs text-charcoal-500">
                        {localJob.deliveryAddress?.city || "N/A"},{" "}
                        {localJob.deliveryAddress?.state || ""}
                      </p>
                      {localJob.deliveryAddress?.building && (
                        <p className="text-xs text-charcoal-500">
                          Building: {localJob.deliveryAddress.building}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Special instructions */}
            {localJob.order?.specialInstructions && (
              <div className="bg-cream-50 border border-grey-stroke rounded-lg p-4">
                <p className="text-xs text-charcoal-400 uppercase tracking-wide mb-2">
                  SPECIAL INSTRUCTIONS
                </p>
                <p className="text-sm text-charcoal-700">
                  {localJob.order.specialInstructions}
                </p>
              </div>
            )}

            {/* Error message */}
            {actionError && (
              <div className="bg-error-bg border-l-4 border-error-btn px-3 py-2 rounded">
                <p className="text-xs text-error-text">{actionError}</p>
              </div>
            )}
          </div>

          {/* Footer actions */}
          <div className="px-6 py-4 border-t border-grey-stroke bg-grey-100">
            {renderFooterButtons()}
          </div>
        </div>
      </div>
    );
  };

  // -------------------------------------------------------------------
  // Driver selection modal
  // -------------------------------------------------------------------
  const DriverSelectModal = () => {
    if (!selectModalOpen) return null;
    return (
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-cream-50 rounded-2xl shadow-2xl w-full max-w-md p-6 border border-grey-stroke">
          <h2 className="text-display-h2 text-charcoal-700 mb-2">
            Select Driver Profile
          </h2>
          <p className="text-body-regular text-charcoal-400 mb-4">
            Choose your driver account to continue.
          </p>
          <select
            className="w-full border border-grey-stroke rounded-lg p-3 mb-6 bg-white focus:outline-none focus:ring-2 focus:ring-sage-400"
            defaultValue=""
            onChange={(e) => {
              const id = parseInt(e.target.value, 10);
              if (!id) return;
              const selected = driverList.find((d) => d.id === id);
              setDriverName(selected?.fullName || "My Profile");
              setDriverId(id);
              setSelectModalOpen(false);
            }}
          >
            <option value="">-- Select Driver --</option>
            {driverList.map((driver) => (
              <option key={driver.id} value={driver.id}>
                {driver.fullName}
              </option>
            ))}
          </select>
          <button
            onClick={() => setSelectModalOpen(false)}
            className="w-full bg-error-btn hover:bg-error-text text-white py-2.5 rounded-lg font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    );
  };

  // -------------------------------------------------------------------
  // Job table with left arrow + expand row + A-style details + buttons
  // -------------------------------------------------------------------
  const JobTable = ({ jobs }) => {
    const [expandedId, setExpandedId] = useState(null);

    const toggleRow = (id) => {
      setExpandedId((prev) => (prev === id ? null : id));
    };

    if (!jobs || jobs.length === 0) {
      return (
        <p className="text-body-regular text-charcoal-400">
          No deliveries to show.
        </p>
      );
    }

    return (
      <div className="overflow-x-auto border border-grey-stroke rounded-lg bg-cream-50">
        <table className="min-w-full text-sm">
          <thead className="bg-grey-100 border-b border-grey-stroke">
            <tr>
              <th className="w-10 pl-4 pr-2 py-3 text-left text-xs font-semibold text-charcoal-500">
                {/* arrow */}
              </th>
              <th className="px-2 py-3 text-left text-xs font-semibold text-charcoal-500">
                Order #
              </th>
              <th className="px-2 py-3 text-left text-xs font-semibold text-charcoal-500">
                Customer
              </th>
              <th className="px-2 py-3 text-left text-xs font-semibold text-charcoal-500">
                Restaurant
              </th>
              <th className="px-2 py-3 text-right text-xs font-semibold text-charcoal-500">
                Total
              </th>
              <th className="px-2 py-3 text-right text-xs font-semibold text-charcoal-500">
                Fee
              </th>
              <th className="px-2 py-3 text-center text-xs font-semibold text-charcoal-500">
                Status
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-charcoal-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((job) => {
              const isExpanded = expandedId === job.id;
              const statusText = job.status || "Unknown";
              const statusVariant = getStatusVariant(job.status);
              const newJob = isNewJob(job);

              const mainRowClass = [
                "border-b border-grey-stroke",
                newJob ? "bg-danger-bg/30" : "bg-cream-50 hover:bg-grey-100",
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
                          className={`text-charcoal-600 transition-transform ${
                            isExpanded ? "rotate-90" : ""
                          }`}
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
                        <span className="font-semibold text-charcoal-700">
                          #{job.orderId}
                        </span>
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

                    {/* total */}
                    <td className="px-2 py-3 align-top text-right text-charcoal-800 font-semibold">
                      BHD {(job.order?.totalAmount || 0).toFixed(3)}
                    </td>

                    {/* fee */}
                    <td className="px-2 py-3 align-top text-right text-charcoal-600">
                      BHD {(job.order?.deliveryFee || 0).toFixed(3)}
                    </td>

                    {/* status */}
                    <td className="px-2 py-3 align-top text-center">
                      <StatusChip variant={statusVariant}>
                        {statusText}
                      </StatusChip>
                    </td>

                    {/* actions */}
                    <td className="px-4 py-3 align-top">
                      <div className="flex flex-wrap gap-2 justify-end">
                       {/* Manage button (outline, proper size) */}
                            <CRUDButton 
                            variant="outline" 
                            onClick={() => openJobModal(job)}
                            >
                            Manage
                            </CRUDButton>

                        {/* For available jobs: Accept + Decline */}
                        {(job.status === "Available" || job.status === "available") && (
                          <>
                            <CRUDButton
                              variant="success"
                              onClick={() => handleAcceptJob(job)}
                            >
                              Accept
                            </CRUDButton>
                            <CRUDButton
                              variant="error"
                              onClick={() => handleDeclineJob(job.id)}
                            >
                              Decline
                            </CRUDButton>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>

                  {/* Expanded row with A-style boxed details */}
                  {isExpanded && (
                    <tr className="bg-cream-50">
                      <td colSpan={8} className="px-6 pb-4 pt-0">
                        <div className="border-t border-grey-stroke mt-1 pt-4 space-y-4">
                          {/* Top summary grid */}
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="bg-grey-100 rounded-lg p-3 border border-grey-stroke">
                              <p className="text-xs text-charcoal-400 mb-1 uppercase tracking-wide">
                                Customer
                              </p>
                              <p className="text-sm font-semibold text-charcoal-700">
                                {job.order?.customerName || "N/A"}
                              </p>
                            </div>
                            <div className="bg-grey-100 rounded-lg p-3 border border-grey-stroke">
                              <p className="text-xs text-charcoal-400 mb-1 uppercase tracking-wide">
                                Restaurant
                              </p>
                              <p className="text-sm font-semibold text-charcoal-700">
                                {job.order?.sellerName || "N/A"}
                              </p>
                            </div>
                            <div className="bg-grey-100 rounded-lg p-3 border border-grey-stroke">
                              <p className="text-xs text-charcoal-400 mb-1 uppercase tracking-wide">
                                Payment
                              </p>
                              <p className="text-sm font-semibold text-charcoal-700">
                                {job.order?.paymentMethod || "N/A"}
                              </p>
                            </div>
                            <div className="bg-grey-100 rounded-lg p-3 border border-grey-stroke">
                              <p className="text-xs text-charcoal-400 mb-1 uppercase tracking-wide">
                                Total + Fee
                              </p>
                              <p className="text-sm font-semibold text-charcoal-700">
                                Total: BHD{" "}
                                {(job.order?.totalAmount || 0).toFixed(3)}
                              </p>
                              <p className="text-xs text-charcoal-500">
                                Fee: BHD{" "}
                                {(job.order?.deliveryFee || 0).toFixed(3)}
                              </p>
                            </div>
                          </div>

                          {/* Route cards */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-cream-50 border border-grey-stroke rounded-lg p-4">
                              <div className="flex items-start gap-2">
                                <Icon.Package
                                  size={20}
                                  className="text-sage-600 mt-0.5"
                                />
                                <div>
                                  <p className="text-xs text-charcoal-400 uppercase tracking-wide mb-1">
                                    PICKUP LOCATION
                                  </p>
                                  <p className="text-sm font-semibold text-charcoal-700">
                                    {job.pickupAddress?.street || "N/A"}
                                  </p>
                                  <p className="text-xs text-charcoal-500">
                                    {job.pickupAddress?.city || "N/A"},{" "}
                                    {job.pickupAddress?.state || ""}
                                  </p>
                                  {job.pickupAddress?.building && (
                                    <p className="text-xs text-charcoal-500">
                                      Building: {job.pickupAddress.building}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="bg-cream-50 border border-grey-stroke rounded-lg p-4">
                              <div className="flex items-start gap-2">
                                <Icon.MapPin
                                  size={20}
                                  className="text-danger-btn mt-0.5"
                                />
                                <div>
                                  <p className="text-xs text-charcoal-400 uppercase tracking-wide mb-1">
                                    DELIVERY LOCATION
                                  </p>
                                  <p className="text-sm font-semibold text-charcoal-700">
                                    {job.deliveryAddress?.street || "N/A"}
                                  </p>
                                  <p className="text-xs text-charcoal-500">
                                    {job.deliveryAddress?.city || "N/A"},{" "}
                                    {job.deliveryAddress?.state || ""}
                                  </p>
                                  {job.deliveryAddress?.building && (
                                    <p className="text-xs text-charcoal-500">
                                      Building: {job.deliveryAddress.building}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Special instructions */}
                          {job.order?.specialInstructions && (
                            <div className="bg-cream-50 border border-grey-stroke rounded-lg p-4">
                              <p className="text-xs text-charcoal-400 uppercase tracking-wide mb-2">
                                SPECIAL INSTRUCTIONS
                              </p>
                              <p className="text-sm text-charcoal-700">
                                {job.order.specialInstructions}
                              </p>
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
    );
  };

  // -------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-cream-50 flex">
      <DriverSelectModal />

      {jobModalOpen && selectedJob && (
        <DeliveryDetailsModal
          job={selectedJob}
          onClose={closeJobModal}
          onJobUpdated={handleJobUpdated}
          onDecline={handleDeclineJob}
        />
      )}

      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col bg-sage-500 text-white w-64 p-4 justify-between">
        <div className="space-y-3">
          <div className="mb-4">
            <h2 className="text-card-h2 text-cream-50">Beyti Driver</h2>
            <p className="text-body-regular text-sage-100 opacity-80">
              Your delivery hub
            </p>
          </div>

          <NavigationButton
            selected={activeTab === "dashboard"}
            onClick={() => setActiveTab("dashboard")}
            icon={
              <Icon.House
                size={20}
                weight={activeTab === "dashboard" ? "fill" : "regular"}
              />
            }
          >
            Dashboard
          </NavigationButton>

          <NavigationButton
            selected={activeTab === "available"}
            onClick={() => setActiveTab("available")}
            icon={
              <Icon.Package
                size={20}
                weight={activeTab === "available" ? "fill" : "regular"}
              />
            }
          >
            Available Jobs
          </NavigationButton>

          <NavigationButton
            selected={activeTab === "current"}
            onClick={() => setActiveTab("current")}
            icon={
              <Icon.Truck
                size={20}
                weight={activeTab === "current" ? "fill" : "regular"}
              />
            }
          >
            Current Deliveries
          </NavigationButton>

          <NavigationButton
            selected={activeTab === "history"}
            onClick={() => setActiveTab("history")}
            icon={
              <Icon.ClockCounterClockwise
                size={20}
                weight={activeTab === "history" ? "fill" : "regular"}
              />
            }
          >
            History
          </NavigationButton>
        </div>

        <SidebarProfile userName={driverName} userRole="Driver" />
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        <PageHeader
          title="Driver Dashboard"
          notificationCount={metrics.available}
          userName={driverName}
          userRole="Driver"
        />

        <main className="flex-1 p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            {!driverId && (
              <div className="bg-cream-50 border border-grey-stroke rounded-xl p-6 text-center">
                <p className="text-body-medium text-charcoal-500">
                  Please select a driver profile to view dashboard.
                </p>
              </div>
            )}

            {driverId && loading && (
              <div className="bg-grey-200 rounded-lg p-6 shadow-soft-lift text-center border border-grey-stroke">
                <p className="text-body-medium text-charcoal-400">
                  Loading your dashboard...
                </p>
              </div>
            )}

            {driverId && error && !loading && (
              <div className="bg-error-bg border-l-4 border-error-btn p-4 rounded shadow-soft-lift">
                <p className="text-body-medium text-error-text">{error}</p>
              </div>
            )}

            {driverId && !loading && !error && (
              <>
                {activeTab === "dashboard" && (
                  <>
                    {/* OVERVIEW CARDS */}
                    <section className="space-y-4">
                      <h2 className="text-card-h2 text-charcoal-600">
                        Overview
                      </h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <AnalyticsCard
                          title="Available Jobs"
                          metrics={[
                            {
                              value: metrics.available,
                              label: "Unassigned deliveries",
                            },
                          ]}
                        />
                        <AnalyticsCard
                          title="Active Deliveries"
                          metrics={[
                            {
                              value: metrics.current,
                              label: "Accepted / Picked up",
                            },
                          ]}
                        />
                        <AnalyticsCard
                          title="Completed Deliveries"
                          metrics={[
                            {
                              value: metrics.completed,
                              label: "All time",
                            },
                          ]}
                        />
                        <AnalyticsCard
                          title="Total Earnings"
                          metrics={[
                            {
                              value: `BHD ${metrics.earnings.toFixed(3)}`,
                              label: "All time",
                            },
                          ]}
                        />
                      </div>
                    </section>

                    {/* DELIVERIES SECTION WITH INLINE TABS */}
                    <section className="bg-grey-200 rounded-lg p-6 shadow-soft-lift border border-grey-stroke space-y-4">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <div>
                          <h2 className="text-card-h2 text-charcoal-600">
                            Deliveries
                          </h2>
                          <p className="text-body-regular text-charcoal-400">
                            Manage your current requests, ongoing tasks, and
                            history from here.
                          </p>
                        </div>
                        <button
                          type="button"
                          className="text-sm font-medium text-sage-600 hover:text-sage-700 underline cursor-pointer"
                          onClick={() => {
                            setActiveTab("current");
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }}
                        >
                          Go to full view
                        </button>
                      </div>

                      {/* Inline Tabs */}
                      <div className="border-b border-grey-stroke flex gap-4">
                        <button
                          className={`px-4 py-2 text-sm font-medium ${
                            dashTab === "requests"
                              ? "text-sage-700 border-b-2 border-sage-600"
                              : "text-charcoal-400"
                          }`}
                          onClick={() => setDashTab("requests")}
                        >
                          Current Requests
                        </button>
                        <button
                          className={`px-4 py-2 text-sm font-medium ${
                            dashTab === "ongoing"
                              ? "text-sage-700 border-b-2 border-sage-600"
                              : "text-charcoal-400"
                          }`}
                          onClick={() => setDashTab("ongoing")}
                        >
                          Ongoing
                        </button>
                        <button
                          className={`px-4 py-2 text-sm font-medium ${
                            dashTab === "history"
                              ? "text-sage-700 border-b-2 border-sage-600"
                              : "text-charcoal-400"
                          }`}
                          onClick={() => setDashTab("history")}
                        >
                          History
                        </button>
                      </div>

                      {/* Tab Content - TABLES */}
                      <div className="mt-4 space-y-3">
                        {dashTab === "requests" && (
                          <>
                            {availableJobs.length === 0 ? (
                              <p className="text-body-regular text-charcoal-400">
                                No available jobs at the moment.
                              </p>
                            ) : (
                              <JobTable jobs={availableJobs.slice(0, 5)} />
                            )}
                          </>
                        )}

                        {dashTab === "ongoing" && (
                          <>
                            {currentJobs.length === 0 ? (
                              <p className="text-body-regular text-charcoal-400">
                                No active deliveries.
                              </p>
                            ) : (
                              <JobTable jobs={currentJobs.slice(0, 5)} />
                            )}
                          </>
                        )}

                        {dashTab === "history" && (
                          <>
                            {historyJobs.length === 0 ? (
                              <p className="text-body-regular text-charcoal-400">
                                No delivery history yet.
                              </p>
                            ) : (
                              <JobTable jobs={historyJobs.slice(0, 5)} />
                            )}
                          </>
                        )}
                      </div>
                    </section>
                  </>
                )}

                {/* FULL PAGE TABS USING SAME TABLE UI */}
                {activeTab === "available" && (
                  <section className="space-y-4">
                    <h2 className="text-card-h2 text-charcoal-600">
                      Available Delivery Jobs
                    </h2>
                    {availableJobs.length === 0 ? (
                      <div className="bg-grey-200 rounded-lg p-12 text-center shadow-soft-lift border border-grey-stroke">
                        <Icon.Package
                          size={64}
                          className="text-charcoal-400 mx-auto mb-4"
                        />
                        <p className="text-body-medium text-charcoal-400">
                          No available jobs right now. Check back soon.
                        </p>
                      </div>
                    ) : (
                      <JobTable jobs={availableJobs} />
                    )}
                  </section>
                )}

                {activeTab === "current" && (
                  <section className="space-y-4">
                    <h2 className="text-card-h2 text-charcoal-600">
                      Current Deliveries
                    </h2>
                    {currentJobs.length === 0 ? (
                      <div className="bg-grey-200 rounded-lg p-12 text-center shadow-soft-lift border border-grey-stroke">
                        <Icon.Truck
                          size={64}
                          className="text-charcoal-400 mx-auto mb-4"
                        />
                        <p className="text-body-medium text-charcoal-400">
                          No active deliveries.
                        </p>
                      </div>
                    ) : (
                      <JobTable jobs={currentJobs} />
                    )}
                  </section>
                )}

                {activeTab === "history" && (
                  <section className="space-y-4">
                    <h2 className="text-card-h2 text-charcoal-600">
                      Delivery History
                    </h2>
                    {historyJobs.length === 0 ? (
                      <div className="bg-grey-200 rounded-lg p-12 text-center shadow-soft-lift border border-grey-stroke">
                        <Icon.ClockCounterClockwise
                          size={64}
                          className="text-charcoal-400 mx-auto mb-4"
                        />
                        <p className="text-body-medium text-charcoal-400">
                          No completed deliveries yet.
                        </p>
                      </div>
                    ) : (
                      <JobTable jobs={historyJobs} />
                    )}
                  </section>
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DriverDashboard;

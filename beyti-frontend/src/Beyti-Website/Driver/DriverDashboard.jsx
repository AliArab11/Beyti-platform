import React, { useState, useEffect, useMemo } from "react";
import * as Icon from "@phosphor-icons/react";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from 'leaflet'

import { useNavigate, useLocation } from "react-router-dom";

import DriverOrdersPage from "./Components/DriverOrders";
import DriverAnalytics from "./Components/DriverAnalytics";

// Ensure Leaflet CSS is loaded
if (typeof window !== 'undefined') {
  import('leaflet/dist/leaflet.css');
}

// Fix Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

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

const AnalyticsCard = ({ title, metrics, compact }) => (
  <div className={`bg-grey-200 rounded-lg shadow-soft-lift border border-grey-stroke ${compact ? 'p-4' : 'p-6'}`}>
    {title && <h3 className={`text-charcoal-600 font-semibold ${compact ? 'text-sm mb-2' : 'text-card-h2 mb-4'}`}>{title}</h3>}
    <div className={`flex ${compact ? 'gap-3' : 'gap-6'}`}>
      {metrics.map((metric, idx) => (
        <div key={idx} className="flex-1">
          <p className={`text-sage-700 font-bold ${compact ? 'text-xl' : 'text-metric-h3'}`}>{metric.value}</p>
          {metric.label && (
            <p className={`text-charcoal-400 ${compact ? 'text-xs mt-0.5' : 'text-body-regular mt-1'}`}>
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

  const navigate = useNavigate();
  const location = useLocation();



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

  // Online/Offline state
const [isOnline, setIsOnline] = useState(true);

// Map modal state
const [viewMapModal, setViewMapModal] = useState({ 
  show: false, 
  pickup: null, 
  delivery: null 
});

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
    
    // Check if there's already an active delivery
    if (metrics.activeDelivery) {
        alert('⚠️ You already have an active delivery in progress. Please complete it before accepting another job.');
        return;
    }
    
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

const { metrics, availableJobs, currentJobs, historyJobs } = useMemo(() => {
if (!tickets || tickets.length === 0) {
    return {
      metrics: {
        available: 0,
        current: 0,
        completed: 0,
        earnings: 0,
        earningsToday: 0,
        deliveriesToday: 0,
        acceptanceRate: 0,
        activeDelivery: null,
        weeklyDeliveries: 0,
        weeklyEarnings: 0,
        avgDeliveryValue: 0,
        topRestaurants: [],
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

  // Calculate daily metrics
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const deliveriesToday = historyJobs.filter(t => {
    const deliveryDate = new Date(t.updatedAt);
    deliveryDate.setHours(0, 0, 0, 0);
    return deliveryDate.getTime() === today.getTime();
  }).length;

  const earningsToday = historyJobs
    .filter(t => {
      const deliveryDate = new Date(t.updatedAt);
      deliveryDate.setHours(0, 0, 0, 0);
      return deliveryDate.getTime() === today.getTime();
    })
    .reduce((sum, t) => sum + (t.order?.deliveryFee || 0), 0);

  // Calculate acceptance rate (accepted / total available shown to driver)
  const totalOffered = tickets.filter(t => 
    t.status === "Available" || (t.driverId === driverId)
  ).length;
  const totalAccepted = tickets.filter(t => t.driverId === driverId).length;
  const acceptanceRate = totalOffered > 0 
    ? Math.round((totalAccepted / totalOffered) * 100) 
    : 0;

  // Find active delivery (most recent Accepted or Picked Up)
  const activeDelivery = currentJobs.length > 0 
    ? currentJobs.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))[0]
    : null;

  // Weekly performance summary
  const last7DaysJobs = historyJobs.filter(job => {
    const jobDate = new Date(job.updatedAt);
    const daysDiff = (today - jobDate) / (1000 * 60 * 60 * 24);
    return daysDiff <= 7;
  });
  
  const weeklyDeliveries = last7DaysJobs.length;
  const weeklyEarnings = last7DaysJobs.reduce((sum, job) => sum + (job.order?.deliveryFee || 0), 0);
  const avgDeliveryValue = weeklyDeliveries > 0 ? weeklyEarnings / weeklyDeliveries : 0;

  // Calculate top 3 restaurants
  const restaurantCount = {};
  historyJobs.forEach(job => {
    const name = job.order?.sellerName;
    if (!name) return;
    restaurantCount[name] = (restaurantCount[name] || 0) + 1;
  });

  const topRestaurants = Object.entries(restaurantCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name, count], index) => ({
      rank: index + 1,
      name,
      count,
    }));


return {
    metrics: {
      available: availableJobs.length,
      current: currentJobs.length,
      completed,
      earnings,
      earningsToday,
      deliveriesToday,
      acceptanceRate,
      activeDelivery,
      weeklyDeliveries,
      weeklyEarnings,
      avgDeliveryValue,
      topRestaurants,
    },
    availableJobs,
    currentJobs,
    historyJobs,
  };
}, [tickets, driverId]);


// -------------------------------------------------------------------
// Map Modal Component
// -------------------------------------------------------------------
const ViewMapModal = ({ pickup, delivery, onClose }) => {
  const mapRef = React.useRef(null);

  if (!pickup?.latitude || !delivery?.latitude) return null;

  const handleResetView = () => {
    if (mapRef.current) {
      const map = mapRef.current;
      map.setView([
        (pickup.latitude + delivery.latitude) / 2,
        (pickup.longitude + delivery.longitude) / 2
      ], 13);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
      <div className="bg-cream-50 rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col border border-grey-stroke">
        {/* Header */}
        <div className="p-6 border-b border-grey-stroke flex justify-between items-center bg-grey-200">
          <div>
            <h3 className="text-xl font-bold text-charcoal-700 flex items-center gap-2">
              <Icon.MapTrifold size={24} weight="fill" className="text-sage-600" />
              Delivery Route
            </h3>
            <p className="text-sm text-charcoal-400 mt-1">Pickup to delivery location</p>
          </div>
          <button 
            onClick={onClose} 
            className="text-charcoal-400 hover:text-charcoal-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Map Container */}
        <div className="flex-1 p-6 bg-white" style={{ minHeight: '600px' }}>
         <div className="rounded-lg overflow-hidden border-2 border-grey-stroke shadow-lg" style={{ height: '550px', width: '100%' }}>
            <MapContainer
                center={[
                    (pickup.latitude + delivery.latitude) / 2,
                    (pickup.longitude + delivery.longitude) / 2
                ]}
                zoom={13}
                scrollWheelZoom={true}
                dragging={true}
                doubleClickZoom={true}
                zoomControl={true}
                style={{ height: '500px', width: '100%', minHeight: '500px' }}
                ref={mapRef}
                >
              <TileLayer 
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              
              {/* Pickup Marker */}
              <Marker position={[pickup.latitude, pickup.longitude]}>
                <Popup>
                  <div className="p-2">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon.Package size={20} className="text-sage-600" />
                      <strong className="text-sage-700">Pickup Location</strong>
                    </div>
                    {pickup.street && <p className="text-sm mb-1"><strong>Street:</strong> {pickup.street}</p>}
                    {pickup.city && <p className="text-sm mb-1"><strong>City:</strong> {pickup.city}</p>}
                    {pickup.building && <p className="text-sm"><strong>Building:</strong> {pickup.building}</p>}
                  </div>
                </Popup>
              </Marker>
              
              {/* Delivery Marker */}
              <Marker position={[delivery.latitude, delivery.longitude]}>
                <Popup>
                  <div className="p-2">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon.MapPin size={20} className="text-danger-btn" />
                      <strong className="text-danger-text">Delivery Location</strong>
                    </div>
                    {delivery.street && <p className="text-sm mb-1"><strong>Street:</strong> {delivery.street}</p>}
                    {delivery.city && <p className="text-sm mb-1"><strong>City:</strong> {delivery.city}</p>}
                    {delivery.building && <p className="text-sm"><strong>Building:</strong> {delivery.building}</p>}
                  </div>
                </Popup>
              </Marker>
            </MapContainer>
          </div>
        </div>

        {/* Legend */}
        <div className="px-6 py-3 bg-grey-100 border-t border-grey-stroke">
          <div className="flex items-center justify-center gap-8 text-sm">
            <div className="flex items-center gap-2">
              <Icon.Package size={20} className="text-sage-600" />
              <span className="text-charcoal-600 font-medium">Pickup Location</span>
            </div>
            <div className="flex items-center gap-2">
              <Icon.MapPin size={20} className="text-danger-btn" />
              <span className="text-charcoal-600 font-medium">Delivery Location</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-grey-stroke bg-grey-200 flex gap-3">
          <button
            onClick={handleResetView}
            className="flex-1 bg-sage-500 hover:bg-sage-600 text-cream-50 py-2.5 rounded-lg font-semibold"
          >
            Reset View
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-grey-300 hover:bg-grey-400 text-charcoal-700 py-2.5 rounded-lg font-semibold"
          >
            Close Map
          </button>
        </div>
      </div>
    </div>
  );
};


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
    
    // Check if there's already an active delivery
    if (metrics.activeDelivery) {
        setActionError('⚠️ You already have an active delivery. Complete it before accepting another.');
        return;
    }
    
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
            const hasActiveDelivery = !!metrics.activeDelivery;
            return (
                <div className="flex flex-col md:flex-row gap-3">
                <button
                    type="button"
                    disabled={actionLoading || !isOnline || hasActiveDelivery}
                    onClick={handleAcceptModal}
                    className="flex-1 bg-success-btn hover:bg-success-text disabled:bg-success-btn/60 text-white py-2.5 rounded-lg font-semibold"
                >
                    {hasActiveDelivery ? "🚫 Complete Active Delivery First" : (!isOnline ? "⚠️ You're Offline" : actionLoading ? "Accepting..." : "✓ Accept Job")}
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

                {/* Contact Information */}
                <div className="space-y-3">
                <h3 className="text-sm font-semibold text-charcoal-700 flex items-center gap-2">
                    <Icon.Users size={18} className="text-sage-600" />
                    Contact Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-grey-100 rounded-lg p-4 border border-grey-stroke">
                    <div className="flex items-start gap-3">
                        <Icon.User size={20} className="text-sage-600 mt-0.5" />
                        <div className="flex-1">
                        <p className="text-xs text-charcoal-400 mb-1 uppercase tracking-wide">
                            Customer
                        </p>
                        <p className="text-sm font-semibold text-charcoal-700 mb-2">
                            {localJob.order?.customerName || "N/A"}
                        </p>
                        <a 
                            href={`tel:${localJob.order?.customerPhone}`}
                            className="text-xs text-sage-600 hover:text-sage-700 flex items-center gap-1 font-medium"
                        >
                            <Icon.Phone size={14} weight="fill" />
                            {localJob.order?.customerPhone || "No phone"}
                        </a>
                        </div>
                    </div>
                    </div>
                    
                    <div className="bg-grey-100 rounded-lg p-4 border border-grey-stroke">
                    <div className="flex items-start gap-3">
                        <Icon.Storefront size={20} className="text-sage-600 mt-0.5" />
                        <div className="flex-1">
                        <p className="text-xs text-charcoal-400 mb-1 uppercase tracking-wide">
                            Restaurant
                        </p>
                        <p className="text-sm font-semibold text-charcoal-700 mb-2">
                            {localJob.order?.sellerName || "N/A"}
                        </p>
                        <a 
                            href={`tel:${localJob.order?.sellerPhone}`}
                            className="text-xs text-sage-600 hover:text-sage-700 flex items-center gap-1 font-medium"
                        >
                            <Icon.Phone size={14} weight="fill" />
                            {localJob.order?.sellerPhone || "No phone"}
                        </a>
                        </div>
                    </div>
                    </div>
                </div>
                </div>

                {/* Payment & Pricing */}
                <div className="space-y-3">
                <h3 className="text-sm font-semibold text-charcoal-700 flex items-center gap-2">
                    <Icon.CurrencyDollar size={18} className="text-sage-600" />
                    Payment Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-cream-50 rounded-lg p-4 border border-grey-stroke">
                    <p className="text-xs text-charcoal-400 mb-1 uppercase tracking-wide">
                        Payment Method
                    </p>
                    <p className="text-sm font-semibold text-charcoal-700">
                        {localJob.order?.paymentMethod || "N/A"}
                    </p>
                    </div>
                    
                    <div className="bg-cream-50 rounded-lg p-4 border border-grey-stroke">
                    <p className="text-xs text-charcoal-400 mb-1 uppercase tracking-wide">
                        Items Subtotal
                    </p>
                    <p className="text-base font-bold text-charcoal-700">
                        BHD {((localJob.order?.totalAmount || 0) - (localJob.order?.deliveryFee || 0)).toFixed(3)}
                    </p>
                    </div>
                    
                    <div className="bg-sage-100 rounded-lg p-4 border border-sage-500">
                    <p className="text-xs text-sage-700 mb-1 uppercase tracking-wide font-semibold">
                        Your Earnings
                    </p>
                    <p className="text-lg font-bold text-sage-700">
                        BHD {(localJob.order?.deliveryFee || 0).toFixed(3)}
                    </p>
                    <p className="text-xs text-charcoal-500 mt-1">
                        Total: BHD {(localJob.order?.totalAmount || 0).toFixed(3)}
                    </p>
                    </div>
                </div>
                </div>

            {/* Route Information */}
                <div className="space-y-3">
                <h3 className="text-sm font-semibold text-charcoal-700 flex items-center gap-2">
                    <Icon.MapTrifold size={18} className="text-sage-600" />
                    Route Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gradient-to-br from-sage-50 to-cream-50 border-2 border-sage-300 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-sage-500 flex items-center justify-center flex-shrink-0">
                        <Icon.Package size={20} weight="fill" className="text-white" />
                        </div>
                        <div className="flex-1">
                        <p className="text-xs text-sage-700 uppercase tracking-wide mb-2 font-semibold">
                            📦 PICKUP LOCATION
                        </p>
                        <p className="text-sm font-bold text-charcoal-700 mb-1">
                            {localJob.pickupAddress?.street || "N/A"}
                        </p>
                        <p className="text-xs text-charcoal-600 mb-1">
                            {localJob.pickupAddress?.city || "N/A"}
                            {localJob.pickupAddress?.state && `, ${localJob.pickupAddress.state}`}
                        </p>
                        {localJob.pickupAddress?.building && (
                            <p className="text-xs text-charcoal-500 bg-white/60 rounded px-2 py-1 inline-block mt-1">
                            🏢 {localJob.pickupAddress.building}
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
                        <p className="text-xs text-danger-text uppercase tracking-wide mb-2 font-semibold">
                            📍 DELIVERY LOCATION
                        </p>
                        <p className="text-sm font-bold text-charcoal-700 mb-1">
                            {localJob.deliveryAddress?.street || "N/A"}
                        </p>
                        <p className="text-xs text-charcoal-600 mb-1">
                            {localJob.deliveryAddress?.city || "N/A"}
                            {localJob.deliveryAddress?.state && `, ${localJob.deliveryAddress.state}`}
                        </p>
                        {localJob.deliveryAddress?.building && (
                            <p className="text-xs text-charcoal-500 bg-white/60 rounded px-2 py-1 inline-block mt-1">
                            🏢 {localJob.deliveryAddress.building}
                            </p>
                        )}
                        </div>
                    </div>
                    </div>
                </div>
                </div>

            {/* Special Instructions */}
                {localJob.order?.specialInstructions && (
                <div className="bg-amber-50 border-l-4 border-amber-500 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                    <Icon.Note size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <p className="text-xs text-amber-700 uppercase tracking-wide mb-2 font-semibold">
                        📝 SPECIAL INSTRUCTIONS
                        </p>
                        <p className="text-sm text-charcoal-700 leading-relaxed">
                        {localJob.order.specialInstructions}
                        </p>
                    </div>
                    </div>
                </div>
                )}

            {/* View Route Map Button */}
                {localJob.pickupAddress?.latitude && localJob.deliveryAddress?.latitude && (
                <button
                    type="button"
                    onClick={() => {
                    setViewMapModal({
                        show: true,
                        pickup: localJob.pickupAddress,
                        delivery: localJob.deliveryAddress
                    });
                    }}
                    className="w-full bg-sage-500 hover:bg-sage-600 text-cream-50 py-3 rounded-lg font-semibold flex items-center justify-center gap-2"
                >
                    <Icon.MapTrifold size={20} weight="fill" />
                    <span>🗺️ View Route on Map</span>
                </button>
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

                    {/* subtotal (items total only) */}
                    <td className="px-2 py-3 align-top text-right text-charcoal-800 font-semibold">
                    BHD {(
                        (job.order?.totalAmount || 0) - (job.order?.deliveryFee || 0)
                    ).toFixed(3)}
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
                        {/* Manage button */}
                        <CRUDButton 
                        variant="outline" 
                        onClick={() => openJobModal(job)}
                        >
                        Manage
                        </CRUDButton>

                        {/* For available jobs: Accept + Decline (disabled if offline or active delivery) */}
                            {(job.status === "Available" || job.status === "available") && (
                            <>
                                <CRUDButton
                                variant="success"
                                onClick={() => handleAcceptJob(job)}
                                disabled={!isOnline || !!metrics.activeDelivery}
                                title={metrics.activeDelivery ? 'Complete your active delivery first' : (!isOnline ? 'You are offline' : 'Accept this delivery')}
                                >
                                {metrics.activeDelivery ? '🚫 Busy' : 'Accept'}
                                </CRUDButton>
                                <CRUDButton
                                variant="error"
                                onClick={() => handleDeclineJob(job.id)}
                                disabled={!isOnline}
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
                                    <p className="text-xs text-charcoal-400 mb-1 uppercase tracking-wide">
                                    Customer
                                    </p>
                                    <p className="text-sm font-semibold text-charcoal-700 mb-1">
                                    {job.order?.customerName || "N/A"}
                                    </p>
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
                                    <p className="text-xs text-charcoal-400 mb-1 uppercase tracking-wide">
                                    Restaurant
                                    </p>
                                    <p className="text-sm font-semibold text-charcoal-700 mb-1">
                                    {job.order?.sellerName || "N/A"}
                                    </p>
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
                                <p className="text-xs text-charcoal-400 mb-1 uppercase tracking-wide">
                                Payment Method
                                </p>
                                <p className="text-sm font-semibold text-charcoal-700">
                                {job.order?.paymentMethod || "N/A"}
                                </p>
                            </div>
                            
                            <div className="bg-cream-50 rounded-lg p-4 border border-grey-stroke">
                                <p className="text-xs text-charcoal-400 mb-1 uppercase tracking-wide">
                                Items Subtotal
                                </p>
                                <p className="text-base font-bold text-charcoal-700">
                                BHD {((job.order?.totalAmount || 0) - (job.order?.deliveryFee || 0)).toFixed(3)}
                                </p>
                            </div>
                            
                            <div className="bg-sage-100 rounded-lg p-4 border border-sage-500">
                                <p className="text-xs text-sage-700 mb-1 uppercase tracking-wide font-semibold">
                                Your Earnings
                                </p>
                                <p className="text-base font-bold text-sage-700">
                                BHD {(job.order?.deliveryFee || 0).toFixed(3)}
                                </p>
                                <p className="text-xs text-charcoal-500 mt-1">
                                Total: BHD {(job.order?.totalAmount || 0).toFixed(3)}
                                </p>
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
                                    <p className="text-xs text-sage-700 uppercase tracking-wide mb-2 font-semibold">
                                    📦 PICKUP LOCATION
                                    </p>
                                    <p className="text-sm font-bold text-charcoal-700 mb-1">
                                    {job.pickupAddress?.street || "N/A"}
                                    </p>
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
                                    <p className="text-xs text-danger-text uppercase tracking-wide mb-2 font-semibold">
                                    📍 DELIVERY LOCATION
                                    </p>
                                    <p className="text-sm font-bold text-charcoal-700 mb-1">
                                    {job.deliveryAddress?.street || "N/A"}
                                    </p>
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
                                    <p className="text-xs text-amber-700 uppercase tracking-wide mb-2 font-semibold">
                                    📝 SPECIAL INSTRUCTIONS
                                    </p>
                                    <p className="text-sm text-charcoal-700 leading-relaxed">
                                    {job.order.specialInstructions}
                                    </p>
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
    );
  };

  // -------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-cream-50 flex">
      <DriverSelectModal />

          {/* Map Modal */}
            {viewMapModal.show && (
            <ViewMapModal
                pickup={viewMapModal.pickup}
                delivery={viewMapModal.delivery}
                onClose={() => setViewMapModal({ show: false, pickup: null, delivery: null })}
            />
            )}

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
          selected={location.pathname === "/driver-dashboard" || location.pathname === "/driver-dashboard/" || location.pathname === "/driver-dashboard/dashboard"}
          onClick={() => navigate("/driver-dashboard/dashboard")}
          icon={
            <Icon.House
              size={20}
              weight={(location.pathname === "/driver-dashboard" || location.pathname === "/driver-dashboard/" || location.pathname === "/driver-dashboard/dashboard") ? "fill" : "regular"}
            />
          }
        >
          Dashboard
        </NavigationButton>

          <NavigationButton
          selected={location.pathname.includes("/driver-dashboard/orders")}
          onClick={() => navigate("/driver-dashboard/orders")}
          icon={
            <Icon.Package
              size={20}
              weight={location.pathname.includes("/driver-dashboard/orders") ? "fill" : "regular"}
            />
          }
        >
          Orders
        </NavigationButton>

          <NavigationButton
          selected={location.pathname.includes("/driver-dashboard/analytics")}
          onClick={() => navigate("/driver-dashboard/analytics")}
          icon={
            <Icon.ChartBar
              size={20}
              weight={location.pathname.includes("/driver-dashboard/analytics") ? "fill" : "regular"}
            />
          }
        >
          Analytics
        </NavigationButton>

        </div>

        <SidebarProfile userName={driverName} userRole="Driver" />
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        <PageHeader
        title="Driver Dashboard"
        notificationCount={isOnline ? metrics.available : 0}
        userName={driverName}
        userRole="Driver"
        />

        <main className="flex-1 p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Online/Offline Toggle - Compact */}
                {driverId && (
                <div className="flex justify-end mb-0">
                    <div className="bg-grey-200 border border-grey-stroke rounded-lg px-4 py-2 shadow-soft-lift inline-flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-success-btn' : 'bg-grey-400'} ${isOnline ? 'animate-pulse' : ''}`}></span>
                        <span className={`text-sm font-semibold ${isOnline ? 'text-success-text' : 'text-charcoal-400'}`}>
                        {isOnline ? 'Online' : 'Offline'}
                        </span>
                    </div>
                    <button
                        onClick={() => {
                            if (isOnline && metrics.activeDelivery) {
                                alert('⚠️ You cannot go offline while you have an active delivery. Please complete or cancel your current delivery first.');
                                return;
                            }
                            setIsOnline(!isOnline);
                        }}
                        disabled={isOnline && metrics.activeDelivery}
                        className={`px-4 py-1.5 rounded-lg font-semibold text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                        isOnline 
                            ? 'bg-error-btn hover:bg-error-text text-white' 
                            : 'bg-success-btn hover:bg-success-text text-white'
                        }`}
                    >
                        {isOnline ? (metrics.activeDelivery ? '🚫 Active Delivery' : 'Go Offline') : 'Go Online'}
                    </button>
                    </div>
                </div>
                )}
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
                {(location.pathname === "/driver-dashboard" || location.pathname === "/driver-dashboard/" || location.pathname === "/driver-dashboard/dashboard") && (
                  <>
                    {/* OVERVIEW CARDS */}
                        <section className="space-y-4">
                        <h2 className="text-card-h2 text-charcoal-600">Overview</h2>
                        
                        {/* Top Row: 4 Main Metric Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {/* Available Jobs */}
                            <AnalyticsCard
                            title="Available Jobs"
                            metrics={[
                                {
                                value: isOnline ? metrics.available : "—",
                                label: isOnline ? "Unassigned deliveries" : "You are offline",
                                },
                            ]}
                            />
                            
                            {/* Active Deliveries */}
                            <AnalyticsCard
                            title="Active Deliveries"
                            metrics={[
                                {
                                value: metrics.current,
                                label: "Accepted / Picked up",
                                },
                            ]}
                            />
                            
                            {/* Earnings Today */}
                            <AnalyticsCard
                            title="Earnings Today"
                            metrics={[
                                {
                                value: `BHD ${metrics.earningsToday.toFixed(3)}`,
                                label: `${metrics.deliveriesToday} ${metrics.deliveriesToday === 1 ? 'delivery' : 'deliveries'}`,
                                },
                            ]}
                            />
                            
                            {/* Acceptance Rate */}
                            <AnalyticsCard
                            title="Acceptance Rate"
                            metrics={[
                                {
                                value: `${metrics.acceptanceRate}%`,
                                label: `${metrics.completed} completed`,
                                },
                            ]}
                            />
                        </div>

                        {/* Second Row: Active Delivery/Deliveries Table + Stats */}
                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                        {/* Left Section: Active Delivery OR Deliveries Table (3 columns) */}
                        <div className="lg:col-span-3">
                            {metrics.activeDelivery ? (
                            /* When there IS an active delivery */
                            <div className="bg-gradient-to-br from-danger-bg to-danger-bg/50 border-2 border-danger-btn rounded-lg p-6 shadow-soft-lift h-full">
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
                                      {metrics.activeDelivery.status === "Accepted" && (
                                        <button
                                          onClick={async () => {
                                            try {
                                              await updateDeliveryStatus(metrics.activeDelivery.id, "Picked Up");
                                              const updated = { ...metrics.activeDelivery, status: "Picked Up" };
                                              handleJobUpdated(updated);
                                            } catch (err) {
                                              alert(err.message || "Failed to update status");
                                            }
                                          }}
                                          className="flex-1 bg-success-btn hover:bg-success-text text-white py-2.5 rounded-lg font-semibold text-sm"
                                        >
                                          ✓ Mark Picked Up
                                        </button>
                                      )}
                                      
                                      {metrics.activeDelivery.status === "Picked Up" && (
                                        <button
                                          onClick={async () => {
                                            try {
                                              await updateDeliveryStatus(metrics.activeDelivery.id, "Delivered");
                                              const updated = { ...metrics.activeDelivery, status: "Delivered" };
                                              handleJobUpdated(updated);
                                            } catch (err) {
                                              alert(err.message || "Failed to update status");
                                            }
                                          }}
                                          className="flex-1 bg-success-btn hover:bg-success-text text-white py-2.5 rounded-lg font-semibold text-sm"
                                        >
                                          ✓ Mark Delivered
                                        </button>
                                      )}
                                      
                                      <button
                                        onClick={() => openJobModal(metrics.activeDelivery)}
                                        className="flex-1 bg-grey-300 hover:bg-grey-400 text-charcoal-700 py-2.5 rounded-lg font-semibold text-sm"
                                      >
                                        View Details
                                      </button>
                                    </div>
                                </div>
                                </div>
                            </div>
                            ) : (
                            /* When there's NO active delivery - show deliveries table */
                            <div className="bg-grey-200 rounded-lg p-6 shadow-soft-lift border border-grey-stroke space-y-4">
                               <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                                <div>
                                    <h2 className="text-card-h2 text-charcoal-600">
                                    Deliveries
                                    </h2>
                                    <p className="text-body-regular text-charcoal-400">
                                    Manage your current requests, ongoing tasks, and history from here.
                                    </p>
                                </div>
                                <div className="flex gap-3">
                                    <button
                                    type="button"
                                    className="px-4 py-2 bg-sage-500 hover:bg-sage-600 text-white rounded-lg font-semibold text-sm flex items-center gap-2 cursor-pointer"
                                    onClick={() => fetchTickets()}
                                    >
                                    <Icon.ArrowsClockwise size={16} weight="bold" />
                                    Refresh
                                    </button>
                                    <button
                                    type="button"
                                    className="text-sm font-medium text-sage-600 hover:text-sage-700 underline cursor-pointer"
                                    onClick={() => {
                                        navigate("/driver-dashboard/orders");
                                        window.scrollTo({ top: 0, behavior: "smooth" });
                                    }}
                                    >
                                    Go to full view
                                    </button>
                                </div>
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
                                        {!isOnline ? (
                                        <div className="bg-error-bg border-l-4 border-error-btn p-4 rounded-lg">
                                            <p className="text-body-medium text-error-text font-semibold">
                                            ⚠️ You are currently offline. Go online to view and accept delivery requests.
                                            </p>
                                        </div>
                                        ) : availableJobs.length === 0 ? (
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
                            </div>
                            )}
                        </div>

                        {/* Right Section: Stats - ALWAYS VISIBLE (1 column) */}
                            <div className="space-y-4 flex flex-col h-full">
                            <AnalyticsCard
                                title="Total Completed"
                                compact={false}
                                metrics={[
                                {
                                    value: metrics.completed,
                                    label: "All time deliveries",
                                },
                                ]}
                            />
                            <AnalyticsCard
                                title="Total Earnings"
                                compact={false}
                                metrics={[
                                {
                                    value: `BHD ${metrics.earnings.toFixed(3)}`,
                                    label: "Lifetime earnings",
                                },
                                ]}
                            />
                            </div>
                        </div>

                        {/* Third Row: Deliveries Table - ONLY shows when there IS an active delivery */}
                        {metrics.activeDelivery && (
                        <div className="bg-grey-200 rounded-lg p-6 shadow-soft-lift border border-grey-stroke space-y-4">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                                <div>
                                    <h2 className="text-card-h2 text-charcoal-600">
                                    Deliveries
                                    </h2>
                                    <p className="text-body-regular text-charcoal-400">
                                    Manage your current requests, ongoing tasks, and history from here.
                                    </p>
                                </div>
                                <div className="flex gap-3">
                                    <button
                                    type="button"
                                    className="px-4 py-2 bg-sage-500 hover:bg-sage-600 text-white rounded-lg font-semibold text-sm flex items-center gap-2 cursor-pointer"
                                    onClick={() => fetchTickets()}
                                    >
                                    <Icon.ArrowsClockwise size={16} weight="bold" />
                                    Refresh
                                    </button>
                                    <button
                                    type="button"
                                    className="text-sm font-medium text-sage-600 hover:text-sage-700 underline cursor-pointer"
                                    onClick={() => {
                                    navigate("/driver-dashboard/orders");
                                    window.scrollTo({ top: 0, behavior: "smooth" });
                                }}
                                    >
                                    Go to full view
                                    </button>
                                </div>
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
                        </div>
                        )}
                        </section>

                    
                  </>
                )}

                {location.pathname.includes("/driver-dashboard/orders") ? (
                <DriverOrdersPage
                  driverId={driverId}
                  driverName={driverName}
                  tickets={tickets}
                  isOnline={isOnline}
                  metrics={metrics}
                  availableJobs={availableJobs}
                  currentJobs={currentJobs}
                  historyJobs={historyJobs}
                  onAcceptJob={handleAcceptJob}
                  onDeclineJob={handleDeclineJob}
                  onOpenJobModal={openJobModal}
                  onRefresh={fetchTickets}
                />
              ) : location.pathname.includes("/driver-dashboard/analytics") ? (
                <DriverAnalytics
                  driverId={driverId}
                  driverName={driverName}
                  metrics={metrics}
                />  
              ) : null}

                {/* Top Restaurants - Only on Dashboard */}
                {(location.pathname === "/driver-dashboard" || location.pathname === "/driver-dashboard/") && (
                  <section className="mt-6">
                    <div className="bg-grey-200 rounded-lg shadow-soft-lift border border-grey-stroke p-6">
                      <h3 className="text-card-h2 text-charcoal-600 mb-4">Top Restaurants</h3>
                      
                      {metrics.topRestaurants.length === 0 ? (
                        <p className="text-body-regular text-charcoal-400">
                          No delivery history yet.
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {metrics.topRestaurants.map((restaurant) => (
                            <div
                              key={restaurant.rank}
                              className="flex items-center justify-between p-4 bg-cream-50 rounded-lg border border-grey-stroke"
                            >
                              <div className="flex items-center gap-3">
                                <span className="text-2xl font-bold text-sage-700">
                                  #{restaurant.rank}
                                </span>
                                <span className="text-base font-semibold text-charcoal-700">
                                  {restaurant.name}
                                </span>
                              </div>
                              <span className="text-lg font-bold text-charcoal-600">
                                {restaurant.count} {restaurant.count === 1 ? 'delivery' : 'deliveries'}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
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

import { useState, useEffect, useRef } from 'react';
import { getDrivers, createDriver, updateDriver, deleteDriver } from '../../services/api';
import { getDeliveryTickets, getDeliveryTicket, acceptDeliveryTicket, updateDeliveryStatus } from '../../services/api';
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

import L from 'leaflet';

// Fix Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const Drivers = () => {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Driver Jobs states
const [jobsModal, setJobsModal] = useState({ 
  show: false, 
  driverId: null, 
  driverName: "", 
  loading: false 
});
const [jobTab, setJobTab] = useState("available");
const [availableTickets, setAvailableTickets] = useState([]);
const [currentTickets, setCurrentTickets] = useState([]);
const [historyTickets, setHistoryTickets] = useState([]);
const [showTicketModal, setShowTicketModal] = useState(false);
const [selectedTicketDetails, setSelectedTicketDetails] = useState(null);
const [viewMapModal, setViewMapModal] = useState({ show: false, pickup: null, delivery: null });
const [viewSingleMapModal, setViewSingleMapModal] = useState({ show: false, lat: null, lng: null, address: null });

// Add ViewMapModal component
const ViewMapModal = ({ lat, lng, onClose, address }) => {
  const mapRef = useRef();

  if (!lat || !lng) return null;

  const handleResetView = () => {
    if (mapRef.current) {
      mapRef.current.setView([lat, lng], 15);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex justify-center items-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-auto p-4 flex flex-col">
        <h2 className="text-xl font-bold mb-3 text-black">Address Location</h2>

        <div className="flex-1">
          <MapContainer
            center={[lat, lng]}
            zoom={15}
            scrollWheelZoom={true}
            dragging={true}
            doubleClickZoom={true}
            zoomControl={true}
            style={{ height: "400px", width: "100%" }}
            ref={mapRef}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <Marker position={[lat, lng]}>
              <Popup>
                <div className="text-sm">
                  {address?.street && <div><strong>Street:</strong> {address.street}</div>}
                  {address?.city && <div><strong>City:</strong> {address.city}</div>}
                  {address?.region && <div><strong>Region:</strong> {address.region}</div>}
                  {address?.country && <div><strong>Country:</strong> {address.country}</div>}
                  {address?.postalCode && <div><strong>Postal Code:</strong> {address.postalCode}</div>}
                </div>
              </Popup>
            </Marker>
          </MapContainer>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            onClick={handleResetView}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg"
          >
            Reset View
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
  // Form fields for Add
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState("Active");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState(null);

  // Edit state
  const [editingId, setEditingId] = useState(null);
  const [editFullName, setEditFullName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [editError, setEditError] = useState(null);

  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
  try {
    setLoading(true);
    setError(null);
    const data = await getDrivers();
    
    // Fetch available job counts for each driver
    const driversWithCounts = await Promise.all(
      data.map(async (driver) => {
        try {
          const allTickets = await getDeliveryTickets();
          // Count available tickets (not assigned to anyone)
          const availableCount = allTickets.filter(t => t.status === "Available" && !t.driverId).length;
          return { ...driver, availableJobCount: availableCount };
        } catch {
          return { ...driver, availableJobCount: 0 };
        }
      })
    );
    
    setDrivers(driversWithCounts);
  } catch (err) {
    setError(err.message || "Failed to load drivers");
  } finally {
    setLoading(false);
  }
};

  const handleAddDriver = async (e) => {
    e.preventDefault();
    setAdding(true);
    setAddError(null);
    try {
      await createDriver({ FullName: fullName, Phone: phone, Status: status });
      await fetchDrivers();
      setFullName("");
      setPhone("");
      setStatus("Active");
    } catch (err) {
      setAddError(err.message || "Failed to add driver");
    } finally {
      setAdding(false);
    }
  };

  const startEdit = (driver) => {
    setEditingId(driver.id);
    setEditFullName(driver.fullName);
    setEditPhone(driver.phone);
    setEditStatus(driver.status);
    setEditError(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditFullName("");
    setEditPhone("");
    setEditStatus("");
    setEditError(null);
  };

  const handleEditDriver = async (e) => {
    e.preventDefault();
    try {
      await updateDriver(editingId, { FullName: editFullName, Phone: editPhone, Status: editStatus });
      await fetchDrivers();
      cancelEdit();
    } catch (err) {
      setEditError(err.message || "Failed to edit driver");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this driver?")) return;
    try {
      await deleteDriver(id);
      setDrivers(drivers.filter(d => d.id !== id));
    } catch (err) {
      alert(err.message || "Failed to delete driver");
    }
  };

// Open driver jobs modal
const openDriverJobsModal = async (driverId, driverName) => {
  setJobsModal({ show: true, driverId, driverName, loading: true });
  setJobTab("available");
  try {
    await fetchDriverTickets(driverId);
  } catch (err) {
    console.error("Error loading driver jobs:", err);
  } finally {
    setJobsModal(prev => ({ ...prev, loading: false }));
  }
};

// Close driver jobs modal
const closeJobsModal = () => {
  setJobsModal({ show: false, driverId: null, driverName: "", loading: false });
  setAvailableTickets([]);
  setCurrentTickets([]);
  setHistoryTickets([]);
};

// Fetch tickets for selected driver
const fetchDriverTickets = async (driverId) => {
  try {
    const allTickets = await getDeliveryTickets();
    
    // Available tickets (not assigned, status = Available)
    const available = allTickets.filter(t => t.status === "Available" && !t.driverId);
    
    // Current tickets for this driver (Accepted or Picked Up)
    const current = allTickets.filter(t => 
      t.driverId === driverId && 
      (t.status === "Accepted" || t.status === "Picked Up")
    );
    
    // History for this driver (Delivered)
    const history = allTickets.filter(t => 
      t.driverId === driverId && 
      t.status === "Delivered"
    );
    
    setAvailableTickets(available);
    setCurrentTickets(current);
    setHistoryTickets(history);
  } catch (err) {
    console.error("Error fetching tickets:", err);
  }
};

// Auto-refresh tickets every 10 seconds when modal is open
useEffect(() => {
  if (jobsModal.show && jobsModal.driverId) {
    const interval = setInterval(() => {
      fetchDriverTickets(jobsModal.driverId);
    }, 10000);
    return () => clearInterval(interval);
  }
}, [jobsModal.show, jobsModal.driverId]);

// Open ticket details modal
const openTicketDetails = async (ticket) => {
  try {
    const fullTicket = await getDeliveryTicket(ticket.id);
    setSelectedTicketDetails(fullTicket);
    setShowTicketModal(true);
  } catch (err) {
    alert("Failed to load ticket details: " + err.message);
  }
};

// Accept a delivery ticket
const handleAcceptTicket = async (ticketId) => {
  if (!confirm("Accept this delivery job?")) return;
  
  try {
    await acceptDeliveryTicket(ticketId, jobsModal.driverId);
    alert("✓ Delivery job accepted!");
    await fetchDriverTickets(jobsModal.driverId);
  } catch (err) {
    alert("Failed to accept delivery: " + err.message);
  }
};

// Decline a delivery ticket (just a visual confirmation for now)
const handleDeclineTicket = async (ticketId) => {
  if (!confirm("Decline this delivery job? It will remain available for other drivers.")) return;
  alert("✓ Request declined");
  // Note: We're not removing it from the system, just not accepting it
};

// Update ticket status (Picked Up / Delivered)
const handleUpdateTicketStatus = async (ticketId, newStatus) => {
  if (!confirm(`Mark as ${newStatus}?`)) return;
  
  try {
    await updateDeliveryStatus(ticketId, newStatus);
    alert(`✓ Status updated to ${newStatus}!`);
    await fetchDriverTickets(jobsModal.driverId);
  } catch (err) {
    alert("Failed to update status: " + err.message);
  }
};

  const inputClasses = "w-full border-2 border-gray-400 rounded-lg p-2 text-black bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500";

  if (loading) return <p className="text-center mt-8 text-black">Loading drivers...</p>;
  if (error) return <p className="text-center mt-8 text-red-600">{error}</p>;

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">

        <h1 className="text-3xl font-bold mb-4 text-black">Drivers</h1>

        {/* Add Driver Form */}
        <div className="bg-white shadow-md rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-black">Add Driver</h2>
          {addError && <p className="mb-2 text-red-600">{addError}</p>}
          <form onSubmit={handleAddDriver} className="space-y-4 sm:flex sm:gap-4 sm:items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input type="text" required value={fullName} onChange={e => setFullName(e.target.value)} className={inputClasses} placeholder="Full Name" />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input type="text" required value={phone} onChange={e => setPhone(e.target.value)} className={inputClasses} placeholder="Phone" />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select value={status} onChange={e => setStatus(e.target.value)} className={inputClasses}>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
            <button type="submit" disabled={adding} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
              {adding ? "Adding..." : "Add Driver"}
            </button>
          </form>
        </div>

        {/* Drivers Table */}
        <div className="bg-white shadow-md rounded-lg overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">Full Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">Phone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-black uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {drivers.map(driver => (
                <tr key={driver.id}>
                  {editingId === driver.id ? (
                    <>
                      <td className="px-6 py-3">
                        <input type="text" required value={editFullName} onChange={e => setEditFullName(e.target.value)} className={inputClasses} />
                      </td>
                      <td className="px-6 py-3">
                        <input type="text" required value={editPhone} onChange={e => setEditPhone(e.target.value)} className={inputClasses} />
                      </td>
                      <td className="px-6 py-3">
                        <select value={editStatus} onChange={e => setEditStatus(e.target.value)} className={inputClasses}>
                          <option value="Active">Active</option>
                          <option value="Inactive">Inactive</option>
                        </select>
                      </td>
                      <td className="px-6 py-3 text-right">
                        <div className="flex gap-2 justify-end">
                          <button onClick={handleEditDriver} className="bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700">Save</button>
                          <button onClick={cancelEdit} className="bg-gray-400 text-white px-3 py-1 rounded-lg hover:bg-gray-500">Cancel</button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-6 py-3 font-bold text-black">{driver.fullName}</td>
                      <td className="px-6 py-3 text-black">{driver.phone}</td>
                      <td className="px-6 py-3 text-black">{driver.status}</td>
                      <td className="px-6 py-3 text-right">
                        <div className="flex gap-2 justify-end">
                          <button 
                            onClick={() => openDriverJobsModal(driver.id, driver.fullName)} 
                            className="bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 relative"
                          >
                            Jobs
                            {driver.availableJobCount > 0 && (
                              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                                {driver.availableJobCount}
                              </span>
                            )}
                          </button>
                          <button onClick={() => startEdit(driver)} className="bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700">Edit</button>
                          <button onClick={() => handleDelete(driver.id)} className="bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-700">Delete</button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
{/* Driver Jobs Modal */}
{jobsModal.show && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center p-6 border-b border-gray-200">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">Delivery Jobs: {jobsModal.driverName}</h3>
          <p className="text-sm text-gray-600 mt-1">Manage delivery requests and active orders</p>
        </div>
        <button 
          onClick={closeJobsModal} 
          className="text-gray-500 hover:text-gray-700 text-2xl"
        >
          ×
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 px-6">
        <button
          onClick={() => setJobTab("available")}
          className={`px-6 py-3 font-semibold transition-colors border-b-2 relative ${
            jobTab === "available"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          📋 Available Requests
          {availableTickets.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center animate-pulse">
              {availableTickets.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setJobTab("current")}
          className={`px-6 py-3 font-semibold transition-colors border-b-2 relative ${
            jobTab === "current"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          🚚 Current Order
          {currentTickets.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
              {currentTickets.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setJobTab("history")}
          className={`px-6 py-3 font-semibold transition-colors border-b-2 ${
            jobTab === "history"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          📜 History ({historyTickets.length})
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-6">
        {jobsModal.loading ? (
          <div className="flex justify-center py-8">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-r-transparent"></div>
          </div>
        ) : (
          <>
           {/* Available Requests Tab */}
              {jobTab === "available" && (
                <div className="space-y-4">
                  {availableTickets.length > 0 ? (
                    availableTickets.map(ticket => (
                      <div key={ticket.id} className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg border-2 border-yellow-200 p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="bg-yellow-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                                NEW REQUEST
                              </span>
                              <p className="font-bold text-gray-900 text-lg">Order #{ticket.orderId}</p>
                            </div>
                            <p className="text-sm text-black mb-1">
                              <span className="font-semibold">Customer:</span> {ticket.order.customerName}
                            </p>
                            <p className="text-sm text-black mb-1">
                              <span className="font-semibold">Seller:</span> {ticket.order.sellerName}
                            </p>
                            <p className="text-lg text-black font-bold mt-2">
                              💰 ${ticket.order.totalAmount.toFixed(2)}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => openTicketDetails(ticket)}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold text-sm"
                            >
                              📄 Details
                            </button>
                            <button
                              onClick={() => handleAcceptTicket(ticket.id)}
                              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold text-sm"
                            >
                              ✓ Accept
                            </button>
                            <button
                              onClick={() => handleDeclineTicket(ticket.id)}
                              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold text-sm"
                            >
                              ✕ Decline
                            </button>
                          </div>
                        </div>
                        <div className="mt-3 pt-3 border-t border-yellow-300 grid grid-cols-2 gap-3 text-sm">
                          {/* PICKUP ADDRESS - ADD BUTTON HERE */}
                          <div className="bg-white bg-opacity-60 p-2 rounded">
                            <span className="text-gray-600 font-medium">📦 Pickup:</span>
                            <p className="text-black font-semibold">{ticket.pickupAddress?.street || "Store address"}</p>
                            <p className="text-black">{ticket.pickupAddress?.city || "N/A"}</p>
                            {ticket.pickupAddress?.latitude && ticket.pickupAddress?.longitude && (
                              <button
                                onClick={() => setViewSingleMapModal({
                                  show: true,
                                  lat: ticket.pickupAddress.latitude,
                                  lng: ticket.pickupAddress.longitude,
                                  address: ticket.pickupAddress
                                })}
                                className="mt-2 bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs font-semibold"
                              >
                                📍 View on Map
                              </button>
                            )}
                          </div>
                          {/* DELIVERY ADDRESS - ADD BUTTON HERE */}
                          <div className="bg-white bg-opacity-60 p-2 rounded">
                            <span className="text-gray-600 font-medium">🏠 Delivery:</span>
                            <p className="text-black font-semibold">{ticket.deliveryAddress?.street || "N/A"}</p>
                            <p className="text-black">{ticket.deliveryAddress?.city || "N/A"}</p>
                            {ticket.deliveryAddress?.latitude && ticket.deliveryAddress?.longitude && (
                              <button
                                onClick={() => setViewSingleMapModal({
                                  show: true,
                                  lat: ticket.deliveryAddress.latitude,
                                  lng: ticket.deliveryAddress.longitude,
                                  address: ticket.deliveryAddress
                                })}
                                className="mt-2 bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-xs font-semibold"
                              >
                                📍 View on Map
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                ) : (
                  <div className="text-center py-12">
                    <div className="bg-gray-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <p className="text-gray-600 font-medium">No available delivery requests</p>
                  </div>
                )}
              </div>
            )}

            {/* Current Order Tab */}
              {jobTab === "current" && (
                <div className="space-y-4">
                  {currentTickets.length > 0 ? (
                    currentTickets.map(ticket => (
                      <div key={ticket.id} className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-300 p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <p className="text-2xl font-black text-gray-900">Order #{ticket.orderId}</p>
                              <span className={`px-4 py-1 rounded-full text-sm font-bold ${
                                ticket.status === "Accepted" ? "bg-yellow-100 text-yellow-800 border-2 border-yellow-300" :
                                ticket.status === "Picked Up" ? "bg-blue-100 text-blue-800 border-2 border-blue-300" :
                                "bg-gray-100 text-gray-800"
                              }`}>
                                {ticket.status}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-4 mb-4">
                              <div>
                                <p className="text-xs text-gray-600 mb-1">Customer</p>
                                <p className="text-sm font-bold text-black">{ticket.order.customerName}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-600 mb-1">Seller</p>
                                <p className="text-sm font-bold text-black">{ticket.order.sellerName}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-600 mb-1">Payment</p>
                                <p className="text-sm font-bold text-gray-900">{ticket.order.paymentMethod}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-600 mb-1">Total Amount</p>
                                <p className="text-xl font-black text-green-600">${ticket.order.totalAmount.toFixed(2)}</p>
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => openTicketDetails(ticket)}
                            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-semibold text-sm"
                          >
                            📄 Full Details
                          </button>
                        </div>

                        {/* Addresses */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          {/* PICKUP - WITH BUTTON */}
                          <div className="bg-yellow-100 border-2 border-yellow-300 p-4 rounded-lg">
                            <p className="text-xs font-bold text-gray-700 mb-2">📦 PICKUP LOCATION</p>
                            <p className="text-sm font-bold text-black">{ticket.pickupAddress?.street || "Store address"}</p>
                            <p className="text-sm text-black">{ticket.pickupAddress?.city || "N/A"}, {ticket.pickupAddress?.region || ""}</p>
                            <p className="text-sm text-black">{ticket.pickupAddress?.country || ""}</p>
                            {ticket.pickupAddress?.latitude && ticket.pickupAddress?.longitude && (
                              <button
                                onClick={() => setViewSingleMapModal({
                                  show: true,
                                  lat: ticket.pickupAddress.latitude,
                                  lng: ticket.pickupAddress.longitude,
                                  address: ticket.pickupAddress
                                })}
                                className="mt-3 w-full bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-semibold"
                              >
                                📍 View Pickup Location
                              </button>
                            )}
                          </div>
                          {/* DELIVERY - WITH BUTTON */}
                          <div className="bg-green-100 border-2 border-green-300 p-4 rounded-lg">
                            <p className="text-xs font-bold text-gray-700 mb-2">🏠 DELIVERY LOCATION</p>
                            <p className="text-sm font-bold text-black">{ticket.deliveryAddress?.street || "N/A"}</p>
                            <p className="text-sm text-black">{ticket.deliveryAddress?.city || "N/A"}, {ticket.deliveryAddress?.region || ""}</p>
                            <p className="text-sm text-black">{ticket.deliveryAddress?.country || ""}</p>
                            {ticket.deliveryAddress?.latitude && ticket.deliveryAddress?.longitude && (
                              <button
                                onClick={() => setViewSingleMapModal({
                                  show: true,
                                  lat: ticket.deliveryAddress.latitude,
                                  lng: ticket.deliveryAddress.longitude,
                                  address: ticket.deliveryAddress
                                })}
                                className="mt-3 w-full bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-semibold"
                              >
                                📍 View Delivery Location
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Action Buttons - THIS WAS MISSING */}
                        <div className="flex gap-3">
                          {ticket.status === "Accepted" && (
                            <button
                              onClick={() => handleUpdateTicketStatus(ticket.id, "Picked Up")}
                              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-bold text-lg"
                            >
                              📦 Mark as Picked Up
                            </button>
                          )}
                          {ticket.status === "Picked Up" && (
                            <button
                              onClick={() => handleUpdateTicketStatus(ticket.id, "Delivered")}
                              className="flex-1 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-bold text-lg"
                            >
                              ✓ Mark as Delivered
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <div className="bg-gray-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <p className="text-gray-600 font-medium">No active deliveries</p>
                    </div>
                  )}
                </div>
              )}

            {/* History Tab */}
            {jobTab === "history" && (
              <div className="space-y-4">
                {historyTickets.length > 0 ? (
                  historyTickets.map(ticket => (
                    <div key={ticket.id} className="bg-gray-50 rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-center">
                        <div className="flex-1">
                          <p className="font-bold text-gray-900 text-lg">Order #{ticket.orderId}</p>
                          <p className="text-sm text-gray-600">{ticket.order.customerName} • {ticket.order.sellerName}</p>
                          <p className="text-sm text-green-600 font-bold mt-1">💰 ${ticket.order.totalAmount.toFixed(2)}</p>
                        </div>
                        <div className="text-right">
                          <span className="inline-block px-4 py-2 rounded-full text-sm font-bold bg-green-100 text-green-800 border-2 border-green-300 mb-2">
                            ✓ {ticket.status}
                          </span>
                          <p className="text-xs text-gray-500">
                            {new Date(ticket.updatedAt).toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'short', 
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <div className="bg-gray-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-gray-600 font-medium">No delivery history yet</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  </div>
)}
{/* Ticket Details Modal */}
{showTicketModal && selectedTicketDetails && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">Order Details #{selectedTicketDetails.orderId}</h3>
          <p className="text-sm text-gray-600 mt-1">Complete delivery information</p>
        </div>
        <button 
          onClick={() => setShowTicketModal(false)} 
          className="text-gray-500 hover:text-gray-700 text-2xl"
        >
          ×
        </button>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Status */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-2">Delivery Status</p>
          <span className="inline-block px-4 py-2 bg-blue-600 text-white rounded-full font-bold">
            {selectedTicketDetails.status}
          </span>
        </div>

        {/* Customer & Seller Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-xs text-gray-600 mb-2 font-semibold">CUSTOMER</p>
            <p className="font-bold text-gray-900 text-lg">{selectedTicketDetails.order.customerName}</p>
            <p className="text-sm text-gray-600">{selectedTicketDetails.order.customerPhone}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-xs text-gray-600 mb-2 font-semibold">SELLER</p>
            <p className="font-bold text-gray-900 text-lg">{selectedTicketDetails.order.sellerName}</p>
          </div>
        </div>

        {/* Order Items */}
        <div className="bg-white border-2 border-gray-200 rounded-lg p-4">
          <p className="text-sm font-bold text-gray-700 mb-3">📦 ORDER ITEMS</p>
          <div className="space-y-2">
            {selectedTicketDetails.order.orderItems.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{item.productName}</p>
                  <p className="text-sm text-gray-600">Qty: {item.qty} × ${item.unitPrice.toFixed(2)}</p>
                </div>
                <p className="font-bold text-gray-900">${item.lineTotal.toFixed(2)}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t-2 border-gray-300 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-800">Subtotal:</span>
              <span className="font-semibold text-black">${selectedTicketDetails.order.subtotalAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-800">Delivery Fee:</span>
              <span className="font-semibold text-black">${selectedTicketDetails.order.deliveryFee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold">
              <span className='text-black'>Total:</span>
              <span className="text-green-600">${selectedTicketDetails.order.totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Payment Info */}
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
          <p className="text-sm font-bold text-gray-700 mb-2">💳 PAYMENT</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-600">Method</p>
              <p className="font-bold text-gray-900">{selectedTicketDetails.order.paymentMethod}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Status</p>
              <p className="font-bold text-gray-900">{selectedTicketDetails.order.paymentStatus}</p>
            </div>
          </div>
        </div>

        {/* Addresses with Map Button */}
        ``<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* PICKUP ADDRESS */}
          <div className="bg-yellow-100 border-2 border-yellow-300 p-4 rounded-lg">
            <p className="text-xs font-bold text-gray-700 mb-2">📦 PICKUP LOCATION (Store)</p>
            {selectedTicketDetails.pickupAddress ? (
              <>
                <p className="text-sm font-bold text-black">{selectedTicketDetails.pickupAddress.street}</p>
                <p className="text-sm text-black">{selectedTicketDetails.pickupAddress.city}, {selectedTicketDetails.pickupAddress.region}</p>
                <p className="text-sm text-black">{selectedTicketDetails.pickupAddress.country}</p>
                {selectedTicketDetails.pickupAddress.postalCode && (
                  <p className="text-sm text-black">{selectedTicketDetails.pickupAddress.postalCode}</p>
                )}
                {selectedTicketDetails.pickupAddress.latitude && selectedTicketDetails.pickupAddress.longitude && (
                  <button
                    onClick={() => {
                      setViewSingleMapModal({
                        show: true,
                        lat: selectedTicketDetails.pickupAddress.latitude,
                        lng: selectedTicketDetails.pickupAddress.longitude,
                        address: selectedTicketDetails.pickupAddress
                      });
                    }}
                    className="mt-3 w-full bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-semibold"
                  >
                    📍 View Pickup on Map
                  </button>
                )}
              </>
            ) : selectedTicketDetails.order?.sellerName ? (
              <>
                <p className="text-sm font-bold text-black">{selectedTicketDetails.order.sellerName}</p>
                <p className="text-sm text-red-600 italic">⚠️ Store address not available</p>
                <p className="text-xs text-gray-600 mt-2">Contact: {selectedTicketDetails.order.sellerPhone || "N/A"}</p>
              </>
            ) : (
              <p className="text-sm text-red-600">⚠️ No pickup address available</p>
            )}
          </div>
          
          {/* DELIVERY ADDRESS */}
          <div className="bg-green-100 border-2 border-green-300 p-4 rounded-lg">
            <p className="text-xs font-bold text-gray-700 mb-2">🏠 DELIVERY LOCATION (Customer)</p>
            {selectedTicketDetails.deliveryAddress ? (
              <>
                <p className="text-sm font-bold text-gray-900">{selectedTicketDetails.deliveryAddress.street}</p>
                <p className="text-sm text-gray-700">{selectedTicketDetails.deliveryAddress.city}, {selectedTicketDetails.deliveryAddress.region}</p>
                <p className="text-sm text-gray-700">{selectedTicketDetails.deliveryAddress.country}</p>
                {selectedTicketDetails.deliveryAddress.postalCode && (
                  <p className="text-sm text-gray-700">{selectedTicketDetails.deliveryAddress.postalCode}</p>
                )}
                {selectedTicketDetails.deliveryAddress.latitude && selectedTicketDetails.deliveryAddress.longitude && (
                  <button
                    onClick={() => {
                      setViewSingleMapModal({
                        show: true,
                        lat: selectedTicketDetails.deliveryAddress.latitude,
                        lng: selectedTicketDetails.deliveryAddress.longitude,
                        address: selectedTicketDetails.deliveryAddress
                      });
                    }}
                    className="mt-3 w-full bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-semibold"
                  >
                    📍 View Delivery on Map
                  </button>
                )}
              </>
            ) : (
              <p className="text-sm text-gray-500">No delivery address available</p>
            )}
          </div>
        </div>

        {/* View Map Button */}
        {(selectedTicketDetails.pickupAddress?.latitude && selectedTicketDetails.deliveryAddress?.latitude) && (
          <button
            onClick={() => {
              setViewMapModal({ 
                show: true, 
                pickup: selectedTicketDetails.pickupAddress,
                delivery: selectedTicketDetails.deliveryAddress 
              });
              setShowTicketModal(false);
            }}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-bold text-lg"
          >
            🗺️ View Route on Map
          </button>
        )}
      </div>
    </div>
  </div>
)}

{/* View Single Address Map Modal */}
{viewSingleMapModal.show && (
  <ViewMapModal
    lat={viewSingleMapModal.lat}
    lng={viewSingleMapModal.lng}
    address={viewSingleMapModal.address}
    onClose={() => setViewSingleMapModal({ show: false, lat: null, lng: null, address: null })}
  />
)}


{/* Map Modal */}
{viewMapModal.show && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full h-[80vh] flex flex-col">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h3 className="text-xl font-bold text-gray-900">🗺️ Delivery Route</h3>
        <button 
          onClick={() => setViewMapModal({ show: false, pickup: null, delivery: null })} 
          className="text-gray-500 hover:text-gray-700 text-2xl"
        >
          ×
        </button>
      </div>
      <div className="flex-1">
        <MapContainer
          center={[
            (viewMapModal.pickup.latitude + viewMapModal.delivery.latitude) / 2,
            (viewMapModal.pickup.longitude + viewMapModal.delivery.longitude) / 2
          ]}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <Marker position={[viewMapModal.pickup.latitude, viewMapModal.pickup.longitude]}>
            <Popup>📦 Pickup: {viewMapModal.pickup.street}</Popup>
          </Marker>
          <Marker position={[viewMapModal.delivery.latitude, viewMapModal.delivery.longitude]}>
            <Popup>🏠 Delivery: {viewMapModal.delivery.street}</Popup>
          </Marker>
        </MapContainer>
      </div>
    </div>
  </div>
)}

      </div>
    </div>
  );
};

export default Drivers;

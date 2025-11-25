import { useState, useEffect, Fragment, useRef } from "react";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, useMapEvents, Popup }  from "react-leaflet";
import {
  getCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  createAddress,
  deleteAddress,
  updateAddress,
  updateCustomerAddress,
  createCustomerAddress,
  deleteCustomerAddress,
  getCustomerOrders,
  createReview
} from "../../services/api";

// Custom Toast Component - ADD THIS HERE (OUTSIDE)
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === 'success' ? '!bg-green-500' : '!bg-red-500';
  const icon = type === 'success' ? '✓' : '✕';

  return (
    <div className={`fixed top-4 right-4 z-[9999] ${bgColor} !text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 animate-slide-in`}>
      <span className="text-xl font-bold">{icon}</span>
      <span className="font-medium">{message}</span>
      <button onClick={onClose} className="ml-2 hover:!text-gray-200">✕</button>
    </div>
  );
};

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  // Toggle between adding customer or address
  const [addingMode, setAddingMode] = useState("customer");

  // Customer form fields
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState(null);

  // Address form fields
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [addressStreet, setAddressStreet] = useState("");
  const [addressCity, setAddressCity] = useState("");
  const [addressCountry, setAddressCountry] = useState("");
  const [addressRegion, setAddressRegion] = useState("");
  const [addressPostalCode, setAddressPostalCode] = useState("");
  const [addAddressError, setAddAddressError] = useState(null);

  // Map modal state
const [mapModal, setMapModal] = useState({
  show: false,
  lat: null,
  lng: null,
  loading: false,
  addressResult: null,
});
const [viewMapModal, setViewMapModal] = useState({ show: false, lat: null, lng: null });
const [savedLocation, setSavedLocation] = useState(null);

// Outside of your main component
const ViewMapModal = ({ lat, lng, onClose, address }) => {
  
   const mapRef = useRef();

    if (!lat || !lng) return null;

  const handleResetView = () => {
    if (mapRef.current) {
      mapRef.current.setView([lat, lng], 15);
    }
  };


  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-auto p-4 flex flex-col">
        <h2 className="text-xl font-bold mb-3">Address Location</h2>

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
            className="flex-1 !bg-red-600 hover:!bg-red-700 text-white py-2 rounded-lg"
          >
            Reset View
          </button>
          <button
            onClick={onClose}
            className="flex-1 !bg-red-600 hover:!bg-red-700 text-white py-2 rounded-lg"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};


  // Edit state
  const [editingId, setEditingId] = useState(null);
  const [editFullName, setEditFullName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editError, setEditError] = useState(null);
  // Address edit/delete state
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [editAddressStreet, setEditAddressStreet] = useState("");
  const [editAddressCity, setEditAddressCity] = useState("");
  const [editAddressCountry, setEditAddressCountry] = useState("");
  const [editAddressRegion, setEditAddressRegion] = useState("");
  const [editAddressPostalCode, setEditAddressPostalCode] = useState("");
  const [editAddressError, setEditAddressError] = useState(null);
  const [deleteAddressConfirm, setDeleteAddressConfirm] = useState({ show: false, addressId: null, customerId: null });   
  const [editSavedLocation, setEditSavedLocation] = useState(null); 
  const [editMapModal, setEditMapModal] = useState({ show: false }); 
  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, id: null, name: '' });

  // Expanded row state
  const [expandedRows, setExpandedRows] = useState(new Set());

  // Orders modal state
  const [ordersModal, setOrdersModal] = useState({ show: false, customerId: null, customerName: "", orders: [], loading: false, error: null });
  const [expandedOrderRows, setExpandedOrderRows] = useState(new Set());
  
  // Review modal state
  const [reviewModal, setReviewModal] = useState({ 
    show: false, 
    orderId: null, 
    productId: null,
    productName: "",
    rating: 5, 
    comment: "", 
    loading: false, 
    error: null 
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getCustomers();
      setCustomers(data);
    } catch (err) {
      setError(err.message || "Failed to load customers");
    } finally {
      setLoading(false);
    }
  };

const showToast = (message, type = 'success') => {
  setToast({ show: true, message, type });
};

const hideToast = () => {
  setToast({ show: false, message: '', type: 'success' });
};

  // --- Customer APIs ---
  const handleAddCustomer = async (e) => {
    e.preventDefault();
    setAdding(true);
    setAddError(null);
    try {
      await createCustomer({ FullName: fullName, Phone: phone });
      await fetchCustomers();
      setFullName("");
      setPhone("");
      showToast('Customer added successfully!', 'success'); // ADD THIS
    } catch (err) {
      setAddError(err.message || "Failed to add customer");
      showToast(errorMsg, 'error'); 
    } finally {
      setAdding(false);
    }
  };

  // --- Address APIs ---
  const handleAddAddress = async (e) => {
    e.preventDefault();
    setAdding(true);
    setAddAddressError(null);
    showToast('Address added successfully!', 'success'); 

    try {
      if (!selectedCustomerId) throw new Error("Select a customer");

      const newAddress = await createAddress({
        Label: null,
        Street: addressStreet,
        City: addressCity,
        Region: addressRegion || null,
        PostalCode: addressPostalCode || null,
        Country: addressCountry,
        Latitude: savedLocation?.lat,     
        Longitude: savedLocation?.lng,    
        IsDefault: false
      });

      await createCustomerAddress({
        CustomerId: parseInt(selectedCustomerId),
        AddressId: newAddress.id
      });

      setSelectedCustomerId("");
      setAddressStreet("");
      setAddressCity("");
      setAddressCountry("");
      setAddressRegion("");
      setAddressPostalCode("");
      
      await fetchCustomers();
      setAddAddressError(null);
    } catch (err) {
      console.error("Full error:", err);
      setAddAddressError(err.message || "Failed to add address");
      showToast(errorMsg, 'error');
    } finally {
      setAdding(false);
    }
  };
// --- Address Edit/Delete Functions ---
const startEditAddress = (address) => {
  setEditingAddressId(address.id);
  setEditAddressStreet(address.street || "");
  setEditAddressCity(address.city || "");
  setEditAddressCountry(address.country || "");
  setEditAddressRegion(address.region || "");
  setEditAddressPostalCode(address.postalCode || "");
  setEditAddressError(null);
  
  if (address.latitude && address.longitude) {
    setEditSavedLocation({
      lat: parseFloat(address.latitude),
      lng: parseFloat(address.longitude)
    });
  } else {
    setEditSavedLocation(null);
  }
};

const cancelEditAddress = () => {
  setEditingAddressId(null);
  setEditAddressStreet("");
  setEditAddressCity("");
  setEditAddressCountry("");
  setEditAddressRegion("");
  setEditAddressPostalCode("");
  setEditAddressError(null);
  setEditSavedLocation(null);
};

const handleEditAddress = async (addressId) => {
  try {
    await updateAddress(addressId, {
      Street: editAddressStreet,
      City: editAddressCity,
      Country: editAddressCountry,
      Region: editAddressRegion || null,
      PostalCode: editAddressPostalCode || null,
      Latitude: editSavedLocation?.lat || null,  
      Longitude: editSavedLocation?.lng || null,
    });
    await fetchCustomers();
    cancelEditAddress();
    showToast('Address updated successfully!', 'success');
  } catch (err) {
    setEditAddressError(err.message || "Failed to update address");
    showToast(err.message || "Failed to update address", 'error');
  }
};

const confirmDeleteAddress = (addressId, customerId) => {
  setDeleteAddressConfirm({ show: true, addressId, customerId });
};

const cancelDeleteAddress = () => {
  setDeleteAddressConfirm({ show: false, addressId: null, customerId: null });
};

const handleDeleteAddress = async () => {
  try {
    const { addressId, customerId } = deleteAddressConfirm;
    
    // Find the customer and the junction table record
    const customer = customers.find(c => c.id === customerId);
    const customerAddressLink = customer?.customerAddresses?.find(
      ca => ca.address?.id === addressId
    );
    
    if (!customerAddressLink) {
      throw new Error("Address link not found");
    }
    
    // First delete the relationship using the junction table's ID
    await deleteCustomerAddress(customerAddressLink.id);
    
    // Then delete the address itself
    await deleteAddress(addressId);
    
    await fetchCustomers();
    cancelDeleteAddress();
    showToast('Address deleted successfully!', 'success');
  } catch (err) {
    showToast(err.message || "Failed to delete address", 'error');
  }
};
  const startEdit = (customer) => {
    setEditingId(customer.id);
    setEditFullName(customer.fullName);
    setEditPhone(customer.phone || "");
    setEditError(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditFullName("");
    setEditPhone("");
    setEditError(null);
  };

  const handleEditCustomer = async (e) => {
    e.preventDefault();
    try {
      await updateCustomer(editingId, { FullName: editFullName, Phone: editPhone });
      await fetchCustomers();
      cancelEdit();
      showToast('Customer updated successfully!', 'success');
    } catch (err) {
      setEditError(err.message || "Failed to edit customer");
      showToast(errorMsg, 'error');
    }
  };

  const confirmDelete = (id, name) => {
    setDeleteConfirm({ show: true, id, name });
  };

  const cancelDelete = () => {
    setDeleteConfirm({ show: false, id: null, name: '' });
  };

  const handleDelete = async () => {
    try {
      await deleteCustomer(deleteConfirm.id);
      setCustomers(customers.filter((c) => c.id !== deleteConfirm.id));
      cancelDelete();
      showToast('Customer deleted successfully!', 'success');
    } catch (err) {
      alert(err.message || "Failed to delete customer");
      showToast(errorMsg, 'error');
    }
  };

  const toggleRow = (customerId) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(customerId)) {
      newExpanded.delete(customerId);
    } else {
      newExpanded.add(customerId);
    }
    setExpandedRows(newExpanded);
  };

// --- Orders Management ---
const openOrdersModal = async (customerId, customerName) => {
  setOrdersModal({ show: true, customerId, customerName, orders: [], loading: true, error: null });
  try {
    const data = await getCustomerOrders(customerId);
    
    // Fetch reviews for all products in all orders
    const ordersWithReviews = await Promise.all(
      (data || []).map(async (order) => {
        const itemsWithReviews = await Promise.all(
          (order.orderItems || []).map(async (item) => {
            try {
              // Fetch reviews for this product
              const reviews = await fetch(`https://localhost:7062/api/Reviews?productId=${item.productId}&customerId=${customerId}`);
              const reviewData = await reviews.json();
              // Find review for this specific order
              const orderReview = reviewData.find(r => r.orderId === order.id && r.productId === item.productId);
              return { ...item, review: orderReview || null };
            } catch {
              return { ...item, review: null };
            }
          })
        );
        return { ...order, orderItems: itemsWithReviews };
      })
    );
    
    setOrdersModal(prev => ({ ...prev, orders: ordersWithReviews, loading: false }));
  } catch (err) {
    setOrdersModal(prev => ({ ...prev, error: err.message || "Failed to load orders", loading: false }));
  }
};

  const closeOrdersModal = () => {
    setOrdersModal({ show: false, customerId: null, customerName: "", orders: [], loading: false, error: null });
    setExpandedOrderRows(new Set());
  };

  const toggleOrderRow = (orderId) => {
    const newExpanded = new Set(expandedOrderRows);
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId);
    } else {
      newExpanded.add(orderId);
    }
    setExpandedOrderRows(newExpanded);
  };

  // --- Review Management ---
  const openReviewModal = (orderId, productId, productName) => {
    setReviewModal({ 
      show: true, 
      orderId, 
      productId,
      productName,
      rating: 5, 
      comment: "", 
      loading: false, 
      error: null 
    });
  };

  const closeReviewModal = () => {
    setReviewModal({ 
      show: false, 
      orderId: null, 
      productId: null,
      productName: "",
      rating: 5, 
      comment: "", 
      loading: false, 
      error: null 
    });
  };

  const handleSubmitReview = async () => {
  if (!reviewModal.comment.trim()) {
    showToast("Please write a comment", 'error');
    setReviewModal(prev => ({ ...prev, error: "Please write a comment" }));
    return;
  }

  setReviewModal(prev => ({ ...prev, loading: true, error: null }));
  try {
    await createReview({
      OrderId: reviewModal.orderId,
      ProductId: reviewModal.productId,
      CustomerId: ordersModal.customerId,
      Rating: reviewModal.rating,
      Comment: reviewModal.comment
    });
    
    showToast('Review submitted successfully! ⭐', 'success');
    closeReviewModal();
    
    // Refresh orders WITH reviews
    const data = await getCustomerOrders(ordersModal.customerId);
    const ordersWithReviews = await Promise.all(
      (data || []).map(async (order) => {
        const itemsWithReviews = await Promise.all(
          (order.orderItems || []).map(async (item) => {
            try {
              const reviews = await fetch(`https://localhost:7062/api/Reviews?productId=${item.productId}&customerId=${ordersModal.customerId}`);
              const reviewData = await reviews.json();
              const orderReview = reviewData.find(r => r.orderId === order.id && r.productId === item.productId);
              return { ...item, review: orderReview || null };
            } catch {
              return { ...item, review: null };
            }
          })
        );
        return { ...order, orderItems: itemsWithReviews };
      })
    );
    setOrdersModal(prev => ({ ...prev, orders: ordersWithReviews }));
  } catch (err) {
    const errorMsg = err.message || "Failed to submit review";
    setReviewModal(prev => ({ ...prev, error: errorMsg, loading: false }));
    showToast(errorMsg, 'error');
  }
};

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "placed": return "bg-blue-100 text-blue-800";
      case "processing": return "bg-yellow-100 text-yellow-800";
      case "completed": return "bg-green-100 text-green-800";
      case "cancelled": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getPaymentColor = (status) => {
    switch (status?.toLowerCase()) {
      case "paid": return "bg-green-100 text-green-800";
      case "pending": return "bg-orange-100 text-orange-800";
      case "failed": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const inputClasses = "w-full !border-2 !border-gray-400 rounded-lg p-3 !text-black !bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:!border-blue-500";

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen !bg-gray-50">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-r-transparent"></div>
          <p className="mt-4 text-lg !text-gray-600">Loading customers...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen !bg-gray-50">
        <div className="max-w-md w-full !bg-white shadow-lg rounded-lg p-6 border-l-4 border-red-500">
          <h2 className="text-xl font-semibold !text-gray-800 mb-2">Error Loading Customers</h2>
          <p className="!text-gray-600 mb-4">{error}</p>
          <button onClick={fetchCustomers} className="w-full !bg-blue-600 hover:!bg-blue-700 !text-white py-2 px-4 rounded-lg">
            Retry
          </button>
        </div>
      </div>
    );
  }

  // 🌍 MAP MODAL (Leaflet)


const LocationSelector = ({ onSelect }) => {
  useMapEvents({
    click(e) {
      onSelect(e.latlng);
    }
  });
  return null;
};

const MapModal = () => {
  const [tempLocation, setTempLocation] = useState(null); // temporary marker

  if (!mapModal.show) return null;

  const handleSave = async () => {
  if (!tempLocation) {
    showToast("Please pick a location on the map", "error");
    return;
  }

  setMapModal(prev => ({ ...prev, loading: true }));
  try {
    const { lat, lng } = tempLocation;

    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
    );
    const data = await res.json();
    const addr = data.address || {};

    setAddressStreet(addr.road || "");
    setAddressCity(addr.city || addr.town || addr.village || "");
    setAddressCountry(addr.country || "");
    setAddressRegion(addr.state || "");
    setAddressPostalCode(addr.postcode || "");

    // ✅ Store the saved location for backend
    setSavedLocation({ lat, lng });

    showToast("Location saved!", "success");
  } catch (err) {
    showToast("Failed to fetch location details", "error");
  } finally {
    setMapModal(prev => ({ ...prev, loading: false }));
  }
};

  const LocationSelector = () => {
    useMapEvents({
      click(e) {
        setTempLocation(e.latlng); // just move the temp marker, do NOT save yet
      }
    });
    return null;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-6">
      <div className="bg-white rounded-xl shadow-xl p-4 max-w-3xl w-full">
        <h2 className="text-xl font-bold mb-3">Pick Location on Map</h2>

        <MapContainer
          center={[26.0667, 50.5577]}
          zoom={12}
          style={{ height: "400px", width: "100%" }}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <LocationSelector />
          {tempLocation && <Marker position={[tempLocation.lat, tempLocation.lng]} />}
        </MapContainer>

        <div className="mt-4 flex gap-2">
          <button
            onClick={handleSave}
            className="flex-1 !bg-green-600 hover:!bg-green-700 text-white py-2 rounded-lg"
          >
            Save Location
          </button>
          <button
            onClick={() => setMapModal({ show: false })}
            className="flex-1 !bg-red-600 hover:!bg-red-700 text-white py-2 rounded-lg"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

// Edit Map Modal for updating address coordinates
const EditMapModal = () => {
  const [tempLocation, setTempLocation] = useState(editSavedLocation);

  if (!editMapModal.show) return null;

  const handleSave = async () => {
    if (!tempLocation) {
      showToast("Please pick a location on the map", "error");
      return;
    }

    setEditMapModal(prev => ({ ...prev, loading: true }));
    try {
      const { lat, lng } = tempLocation;

      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
      );
      const data = await res.json();
      const addr = data.address || {};

      // Update the edit form fields
      setEditAddressStreet(addr.road || editAddressStreet);
      setEditAddressCity(addr.city || addr.town || addr.village || editAddressCity);
      setEditAddressCountry(addr.country || editAddressCountry);
      setEditAddressRegion(addr.state || editAddressRegion);
      setEditAddressPostalCode(addr.postcode || editAddressPostalCode);

      // Save the location
      setEditSavedLocation({ lat, lng });

      showToast("Location updated!", "success");
      setEditMapModal({ show: false });
    } catch (err) {
      showToast("Failed to fetch location details", "error");
    } finally {
      setEditMapModal(prev => ({ ...prev, loading: false }));
    }
  };

  const LocationSelector = () => {
    useMapEvents({
      click(e) {
        setTempLocation(e.latlng);
      }
    });
    return null;
  };

  const centerLocation = tempLocation || editSavedLocation || [26.0667, 50.5577];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex justify-center items-center p-6">
      <div className="bg-white rounded-xl shadow-xl p-4 max-w-3xl w-full">
        <h2 className="text-xl font-bold mb-3">Update Location on Map</h2>

        <MapContainer
          center={[centerLocation.lat || centerLocation[0], centerLocation.lng || centerLocation[1]]}
          zoom={15}
          style={{ height: "400px", width: "100%" }}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <LocationSelector />
          {tempLocation && <Marker position={[tempLocation.lat, tempLocation.lng]} />}
        </MapContainer>

        <div className="mt-4 flex gap-2">
          <button
            onClick={handleSave}
            className="flex-1 !bg-green-600 hover:!bg-green-700 text-white py-2 rounded-lg"
          >
            Update Location
          </button>
          <button
            onClick={() => setEditMapModal({ show: false })}
            className="flex-1 !bg-red-600 hover:!bg-red-700 text-white py-2 rounded-lg"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};


  return (
    <div className="min-h-screen !bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <style>{`
      @keyframes slide-in {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      .animate-slide-in {
        animation: slide-in 0.3s ease-out;
      }
    `}</style>

    {toast.show && (
      <Toast message={toast.message} type={toast.type} onClose={hideToast} />
    )}
    <MapModal />
    <EditMapModal />
        {viewMapModal.show && (
        <ViewMapModal
            lat={viewMapModal.lat}
            lng={viewMapModal.lng}
            address={viewMapModal.address}
            onClose={() => setViewMapModal({ show: false, lat: null, lng: null })}
        />
        )}

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold !text-gray-900">Customer Management</h1>
          <p className="mt-2 text-lg !text-gray-600">Manage customers and their addresses</p>
        </div>

        {/* Toggle Button */}
        <div className="mb-6">
          <button
            onClick={() => setAddingMode(addingMode === "customer" ? "address" : "customer")}
            className="!bg-gradient-to-r !from-gray-600 !to-gray-700 hover:!from-gray-700 hover:!to-gray-800 !text-white px-6 py-3 rounded-lg font-semibold shadow-md transition-all"
          >
            {addingMode === "customer" ? "➕ Add Address Mode" : "👤 Add Customer Mode"}
          </button>
        </div>

        {/* Add Customer Form */}
        {addingMode === "customer" ? (
          <div className="!bg-white shadow-lg rounded-xl border border-gray-200 p-6 mb-6">
            <h2 className="text-2xl font-semibold !text-gray-900 mb-4">Add Customer</h2>
            {addError && (
              <div className="mb-4 p-4 rounded-lg !bg-red-50 border-l-4 border-red-500">
                <p className="text-sm !text-red-700 font-medium">{addError}</p>
              </div>
            )}
            <form onSubmit={handleAddCustomer} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium !text-gray-700 mb-2">
                  Full Name <span className="!text-red-500">*</span>
                </label>
                <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputClasses} placeholder="Enter full name" />
              </div>
              <div>
                <label className="block text-sm font-medium !text-gray-700 mb-2">Phone</label>
                <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClasses} placeholder="Enter phone number" />
              </div>
              <div className="flex items-end">
                <button type="submit" disabled={adding} className="w-full !bg-blue-600 hover:!bg-blue-700 !text-white py-3 px-6 rounded-lg font-semibold disabled:opacity-50">
                  {adding ? "Adding..." : "Add Customer"}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="!bg-white shadow-lg rounded-xl border border-gray-200 p-6 mb-6">
            <h2 className="text-2xl font-semibold !text-gray-900 mb-4">Add Address</h2>
            {addAddressError && (
              <div className="mb-4 p-4 rounded-lg !bg-red-50 border-l-4 border-red-500">
                <p className="text-sm !text-red-700 font-medium">{addAddressError}</p>
              </div>
            )}
            <form onSubmit={handleAddAddress} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium !text-gray-700 mb-2">Customer <span className="!text-red-500">*</span></label>
                  <select required value={selectedCustomerId} onChange={(e) => setSelectedCustomerId(e.target.value)} className={inputClasses}>
                    <option value="">Select Customer</option>
                    {customers.map((c) => <option key={c.id} value={c.id}>{c.fullName}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium !text-gray-700 mb-2">Street <span className="!text-red-500">*</span></label>
                  <input type="text" value={addressStreet} onChange={(e) => setAddressStreet(e.target.value)} required className={inputClasses} placeholder="Enter street address" />
                </div>
                <div className="mt-2">
                    <button
                        type="button"
                        onClick={() => setMapModal({ show: true })}
                        className="!bg-green-600 hover:!bg-green-700 !text-white px-4 py-2 rounded-lg font-semibold"
                    >
                        📍 Pick from Map
                    </button>
                    </div>

              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium !text-gray-700 mb-2">City <span className="!text-red-500">*</span></label>
                  <input type="text" value={addressCity} onChange={(e) => setAddressCity(e.target.value)} required className={inputClasses} placeholder="Enter city" />
                </div>
                <div>
                  <label className="block text-sm font-medium !text-gray-700 mb-2">Country <span className="!text-red-500">*</span></label>
                  <input type="text" value={addressCountry} onChange={(e) => setAddressCountry(e.target.value)} required className={inputClasses} placeholder="Enter country" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium !text-gray-700 mb-2">Region</label>
                  <input type="text" value={addressRegion} onChange={(e) => setAddressRegion(e.target.value)} className={inputClasses} placeholder="Enter region (optional)" />
                </div>
                <div>
                  <label className="block text-sm font-medium !text-gray-700 mb-2">Postal Code</label>
                  <input type="text" value={addressPostalCode} onChange={(e) => setAddressPostalCode(e.target.value)} className={inputClasses} placeholder="Enter postal code (optional)" />
                </div>
              </div>
              <button type="submit" disabled={adding} className="w-full !bg-blue-600 hover:!bg-blue-700 !text-white py-3 px-6 rounded-lg font-semibold disabled:opacity-50">
                {adding ? "Adding Address..." : "Add Address"}
              </button>
            </form>
          </div>
        )}

        {/* Customers Table */}
        <div className="!bg-white shadow-lg rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 !bg-gradient-to-r !from-blue-50 !to-indigo-50">
            <h2 className="text-2xl font-semibold !text-gray-900">All Customers</h2>
            <p className="mt-1 text-sm !text-gray-600">Manage your customer database</p>
          </div>

          {customers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="!bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold !text-gray-600 uppercase tracking-wider w-12"></th>
                    <th className="px-6 py-4 text-left text-xs font-semibold !text-gray-600 uppercase tracking-wider">Full Name</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold !text-gray-600 uppercase tracking-wider">Phone</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold !text-gray-600 uppercase tracking-wider">Addresses</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold !text-gray-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="!bg-white divide-y divide-gray-200">
                  {customers.map((customer) => (
                    <Fragment key={customer.id}>
                      <tr className="hover:!bg-gray-50 transition-colors">
                        {editingId === customer.id ? (
                          <>
                            <td className="px-6 py-4"></td>
                            <td className="px-6 py-4">
                              <input type="text" required value={editFullName} onChange={(e) => setEditFullName(e.target.value)} className={inputClasses} />
                            </td>
                            <td className="px-6 py-4">
                              <input type="text" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} className={inputClasses} />
                            </td>
                            <td className="px-6 py-4"></td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex gap-2 justify-end">
                                <button onClick={handleEditCustomer} className="!bg-green-600 hover:!bg-green-700 !text-white px-4 py-2 rounded-lg font-semibold">Save</button>
                                <button onClick={cancelEdit} className="!bg-gray-500 hover:!bg-gray-600 !text-white px-4 py-2 rounded-lg font-semibold">Cancel</button>
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="px-6 py-4">
                              {customer.customerAddresses && customer.customerAddresses.length > 0 && (
                                <button onClick={() => toggleRow(customer.id)} className="!text-gray-600 hover:!text-blue-600">
                                  <svg className={`w-5 h-5 transition-transform ${expandedRows.has(customer.id) ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                  </svg>
                                </button>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm font-medium !text-gray-900">{customer.fullName}</div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm !text-gray-900">{customer.phone || "N/A"}</div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="inline-flex px-3 py-1 text-xs font-medium rounded-full !bg-blue-100 !text-blue-800">
                                {customer.customerAddresses?.length || 0} address{customer.customerAddresses?.length !== 1 ? 'es' : ''}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex gap-2 justify-end flex-wrap">
                                <button onClick={() => openOrdersModal(customer.id, customer.fullName)} className="!bg-purple-600 hover:!bg-purple-700 !text-white px-4 py-2 rounded-lg font-semibold text-sm" title="View Orders">
                                  📦 Orders
                                </button>
                                <button onClick={() => startEdit(customer)} className="!bg-yellow-500 hover:!bg-yellow-600 !text-white p-2 rounded-lg" title="Edit Customer">
                                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                                <button onClick={() => confirmDelete(customer.id, customer.fullName)} className="!bg-red-600 hover:!bg-red-700 !text-white p-2 rounded-lg" title="Delete Customer">
                                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </td>
                          </>
                        )}
                      </tr>
                      
                      {/* Expanded Address Details */}
{expandedRows.has(customer.id) && customer.customerAddresses && customer.customerAddresses.length > 0 && (
  <tr className="!bg-gray-50">
    <td colSpan="5" className="px-6 py-4">
      <div className="ml-8 space-y-3">
        <h4 className="font-semibold !text-gray-900 mb-3">Addresses:</h4>
        {customer.customerAddresses.map((ca, idx) => (
          <div key={idx} className="!bg-white p-4 rounded-lg border border-gray-200">
            {editingAddressId === ca.address?.id ? (
  // EDIT MODE
  <div className="space-y-3">
    {editAddressError && (
      <div className="p-3 rounded-lg !bg-red-50 border-l-4 border-red-500">
        <p className="text-sm !text-red-700">{editAddressError}</p>
      </div>
    )}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div>
        <label className="block text-xs font-medium !text-gray-600 mb-1">Street</label>
        <input
          type="text"
          value={editAddressStreet}
          onChange={(e) => setEditAddressStreet(e.target.value)}
          className="w-full !border-2 !border-gray-400 rounded-lg p-2 text-sm !text-black !bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Street"
        />
      </div>
      <div>
        <label className="block text-xs font-medium !text-gray-600 mb-1">City</label>
        <input
          type="text"
          value={editAddressCity}
          onChange={(e) => setEditAddressCity(e.target.value)}
          className="w-full !border-2 !border-gray-400 rounded-lg p-2 text-sm !text-black !bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="City"
        />
      </div>
      <div>
        <label className="block text-xs font-medium !text-gray-600 mb-1">Region</label>
        <input
          type="text"
          value={editAddressRegion}
          onChange={(e) => setEditAddressRegion(e.target.value)}
          className="w-full !border-2 !border-gray-400 rounded-lg p-2 text-sm !text-black !bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Region"
        />
      </div>
      <div>
        <label className="block text-xs font-medium !text-gray-600 mb-1">Country</label>
        <input
          type="text"
          value={editAddressCountry}
          onChange={(e) => setEditAddressCountry(e.target.value)}
          className="w-full !border-2 !border-gray-400 rounded-lg p-2 text-sm !text-black !bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Country"
        />
      </div>
      <div>
        <label className="block text-xs font-medium !text-gray-600 mb-1">Postal Code</label>
        <input
          type="text"
          value={editAddressPostalCode}
          onChange={(e) => setEditAddressPostalCode(e.target.value)}
          className="w-full !border-2 !border-gray-400 rounded-lg p-2 text-sm !text-black !bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Postal Code"
        />
      </div>
      {/* ✅ ADD THIS - Show current location status */}
      <div className="flex items-center">
        <button
          type="button"
          onClick={() => setEditMapModal({ show: true })}
          className="!bg-green-600 hover:!bg-green-700 !text-white px-4 py-2 rounded-lg font-semibold text-sm"
        >
          📍 {editSavedLocation ? 'Update Location' : 'Add Location'}
        </button>
        {editSavedLocation && (
          <span className="ml-2 text-xs !text-green-600">✓ Location set</span>
        )}
      </div>
    </div>
    <div className="flex gap-2">
      <button
        onClick={() => handleEditAddress(ca.address.id)}
        className="!bg-green-600 hover:!bg-green-700 text-white px-4 py-2 rounded-lg font-semibold text-sm"
      >
        Save Changes
      </button>
      <button
        onClick={cancelEditAddress}
        className="!bg-gray-500 hover:!bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold text-sm"
      >
        Cancel
      </button>
    </div>
  </div>
            ) : (
              // VIEW MODE
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-3">
                  <div>
                    <span className="font-medium !text-gray-600">Street:</span>
                    <p className="!text-gray-900">{ca.address?.street || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="font-medium !text-gray-600">City:</span>
                    <p className="!text-gray-900">{ca.address?.city || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="font-medium !text-gray-600">Region:</span>
                    <p className="!text-gray-900">{ca.address?.region || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="font-medium !text-gray-600">Country:</span>
                    <p className="!text-gray-900">{ca.address?.country || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const lat = ca.address?.latitude || ca.address?.Latitude || ca.address?.lat;
                      const lng = ca.address?.longitude || ca.address?.Longitude || ca.address?.lng;
                      
                      if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
                        setViewMapModal({ 
                          show: true, 
                          lat: parseFloat(lat), 
                          lng: parseFloat(lng), 
                          address: ca.address
                        });
                      } else {
                        showToast("No coordinates saved for this address", "error");
                      }
                    }}
                    className="!bg-blue-600 hover:!bg-blue-700 text-white px-3 py-1 rounded-lg font-semibold text-sm"
                  >
                    📍 View on Map
                  </button>
                  <button
                    onClick={() => startEditAddress(ca.address)}
                    className="!bg-yellow-500 hover:!bg-yellow-600 text-white px-3 py-1 rounded-lg font-semibold text-sm"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => confirmDeleteAddress(ca.address.id, customer.id)}
                    className="!bg-red-600 hover:!bg-red-700 text-white px-3 py-1 rounded-lg font-semibold text-sm"
                    >
                    🗑️ Delete
                    </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </td>
  </tr>
)}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 px-6">
              <svg className="mx-auto h-12 w-12 !text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <h3 className="mt-4 text-lg font-medium !text-gray-900">No customers yet</h3>
              <p className="mt-2 text-sm !text-gray-500">Get started by adding your first customer above.</p>
            </div>
          )}
        </div>
      </div>
      {/* Delete Address Confirmation Modal */}
{deleteAddressConfirm.show && (
  <div className="fixed inset-0 !bg-black !bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="!bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
      <div className="flex items-center mb-4">
        <div className="!bg-red-100 p-3 rounded-full">
          <svg className="w-6 h-6 !text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </div>
        <h3 className="ml-3 text-xl font-bold !text-gray-900">Delete Address</h3>
      </div>
      <p className="!text-gray-600 mb-6">
        Are you sure you want to delete this address? This action cannot be undone.
      </p>
      <div className="flex gap-3">
        <button 
          onClick={handleDeleteAddress} 
          className="flex-1 !bg-red-600 hover:!bg-red-700 !text-white py-3 px-4 rounded-lg font-semibold"
        >
          Delete Address
        </button>
        <button 
          onClick={cancelDeleteAddress} 
          className="flex-1 !bg-gray-500 hover:!bg-gray-600 !text-white py-3 px-4 rounded-lg font-semibold"
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
)}

      {/* Delete Confirmation Modal */}
      {deleteConfirm.show && (
        <div className="fixed inset-0 !bg-black !bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="!bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center mb-4">
              <div className="!bg-red-100 p-3 rounded-full">
                <svg className="w-6 h-6 !text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="ml-3 text-xl font-bold !text-gray-900">Confirm Delete</h3>
            </div>
            <p className="!text-gray-600 mb-6">
              Are you sure you want to delete <strong className="!text-gray-900">"{deleteConfirm.name}"</strong>? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={handleDelete} className="flex-1 !bg-red-600 hover:!bg-red-700 !text-white py-3 px-4 rounded-lg font-semibold">Delete</button>
              <button onClick={cancelDelete} className="flex-1 !bg-gray-500 hover:!bg-gray-600 !text-white py-3 px-4 rounded-lg font-semibold">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Orders Modal */}
      {ordersModal.show && (
        <div className="fixed inset-0 !bg-black !bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="!bg-white rounded-xl shadow-2xl max-w-5xl w-full p-6 my-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold !text-gray-900">Orders for {ordersModal.customerName}</h3>
              <button onClick={closeOrdersModal} className="!text-gray-500 hover:!text-gray-700 text-2xl">×</button>
            </div>

            {ordersModal.error && (
              <div className="mb-4 p-4 rounded-lg !bg-red-50 border-l-4 border-red-500">
                <p className="text-sm !text-red-700">{ordersModal.error}</p>
              </div>
            )}

            {ordersModal.loading ? (
              <div className="flex justify-center py-8">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-r-transparent"></div>
              </div>
            ) : ordersModal.orders.length > 0 ? (
              <div className="space-y-4">
                {ordersModal.orders.map(order => (
                  <div key={order.id} className="!bg-gray-50 rounded-lg border border-gray-200">
                    <div className="p-4 flex justify-between items-center cursor-pointer" onClick={() => toggleOrderRow(order.id)}>
                      <div className="flex items-center gap-4">
                        <svg className={`w-5 h-5 !text-gray-600 transition-transform ${expandedOrderRows.has(order.id) ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        <div>
                          <p className="font-semibold !text-gray-900">Order #{order.id}</p>
                          <p className="text-sm !text-gray-600">{new Date(order.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                          {order.status || "N/A"}
                        </span>
                        <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${getPaymentColor(order.paymentStatus)}`}>
                          {order.paymentStatus || "N/A"}
                        </span>
                        <p className="font-bold !text-gray-900">${order.totalAmount?.toFixed(2) || "0.00"}</p>
                      </div>
                    </div>

                    {expandedOrderRows.has(order.id) && (
                      <div className="p-4 border-t border-gray-200 !bg-white">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div>
                            <p className="text-xs !text-gray-600 mb-1">Seller</p>
                            <p className="text-sm font-medium !text-gray-900">{order.sellerName || "N/A"}</p>
                          </div>
                          <div>
                            <p className="text-xs !text-gray-600 mb-1">Fulfillment</p>
                            <p className="text-sm font-medium !text-gray-900">{order.fulfillmentType || "N/A"}</p>
                          </div>
                          <div>
                            <p className="text-xs !text-gray-600 mb-1">Payment Method</p>
                            <p className="text-sm font-medium !text-gray-900">{order.paymentMethod || "N/A"}</p>
                          </div>
                          <div>
                            <p className="text-xs !text-gray-600 mb-1">Delivery Fee</p>
                            <p className="text-sm font-medium !text-gray-900">${order.deliveryFee?.toFixed(2) || "0.00"}</p>
                          </div>
                        </div>

                        {order.orderItems && order.orderItems.length > 0 && (
                          <div>
                            <h4 className="font-semibold !text-gray-900 mb-3">Order Items:</h4>
                            <div className="space-y-2">
                              {order.orderItems.map((item, idx) => (
                                <div key={idx} className="p-3 !bg-gray-50 rounded-lg">
                                    {/* Product Info Row */}
                                    <div className="flex justify-between items-center">
                                    <div className="flex-1">
                                        <p className="text-sm font-medium !text-gray-900">{item.productName || "Product"}</p>
                                        <p className="text-xs !text-gray-600">SKU: {item.variantSKU || "N/A"} • Qty: {item.qty}</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <p className="text-sm font-semibold !text-gray-900">${item.lineTotal?.toFixed(2) || "0.00"}</p>
                                        {order.status?.toLowerCase() === 'completed' && !item.review && (
                                        <button 
                                            onClick={() => openReviewModal(order.id, item.productId, item.productName)}
                                            className="!bg-blue-600 hover:!bg-blue-700 !text-white px-3 py-1 rounded text-xs font-medium"
                                        >
                                            ⭐ Review
                                        </button>
                                        )}
                                        {item.review && (
                                        <span className="!bg-green-100 !text-green-700 px-3 py-1 rounded text-xs font-medium">
                                            ✓ Reviewed
                                        </span>
                                        )}
                                    </div>
                                    </div>
                                     {/* Review Display - THIS IS THE NEW PART */}
                                    {item.review && (
                                    <div className="mt-3 p-3 !bg-white rounded-lg border border-gray-200">
                                        <div className="flex items-center gap-2 mb-2">
                                        <span className="text-xs font-semibold !text-gray-700">Your Review:</span>
                                        <div className="flex">
                                            {[1, 2, 3, 4, 5].map(star => (
                                            <span key={star} className={`text-sm ${star <= item.review.rating ? '!text-yellow-400' : '!text-gray-300'}`}>
                                                ★
                                            </span>
                                            ))}
                                        </div>
                                        <span className="text-xs !text-gray-600">
                                            {new Date(item.review.createdAt).toLocaleDateString()}
                                        </span>
                                        </div>
                                        <p className="text-sm !text-gray-700 italic">"{item.review.comment}"</p>
                                    </div>
                                    )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="!text-gray-600">No orders found for this customer</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Review Modal */}
      {reviewModal.show && (
        <div className="fixed inset-0 !bg-black !bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="!bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center mb-4">
              <div className="!bg-yellow-100 p-3 rounded-full">
                <svg className="w-6 h-6 !text-yellow-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </div>
              <h3 className="ml-3 text-xl font-bold !text-gray-900">Write a Review</h3>
            </div>
            
            <p className="!text-gray-600 mb-4">Product: <strong className="!text-gray-900">{reviewModal.productName}</strong></p>

            {reviewModal.error && (
              <div className="mb-4 p-3 rounded-lg !bg-red-50 border-l-4 border-red-500">
                <p className="text-sm !text-red-700">{reviewModal.error}</p>
              </div>
            )}

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium !text-gray-700 mb-2">Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewModal(prev => ({ ...prev, rating: star }))}
                      className={`text-3xl ${star <= reviewModal.rating ? '!text-yellow-400' : '!text-gray-300'} hover:!text-yellow-400 transition`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium !text-gray-700 mb-2">Comment</label>
                <textarea
                  value={reviewModal.comment}
                  onChange={(e) => setReviewModal(prev => ({ ...prev, comment: e.target.value }))}
                  rows="4"
                  className="w-full !border-2 !border-gray-400 rounded-lg p-3 !text-black !bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Share your experience with this product..."
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={handleSubmitReview} 
                disabled={reviewModal.loading}
                className="flex-1 !bg-blue-600 hover:!bg-blue-700 !text-white py-3 px-4 rounded-lg font-semibold disabled:opacity-50"
              >
                {reviewModal.loading ? "Submitting..." : "Submit Review"}
              </button>
              <button 
                onClick={closeReviewModal} 
                disabled={reviewModal.loading}
                className="flex-1 !bg-gray-300 hover:!bg-gray-400 !text-gray-900 py-3 px-4 rounded-lg font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;
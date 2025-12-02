import { useState, useEffect, Fragment, useRef } from "react";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, useMapEvents, Popup }  from "react-leaflet";
import { 
  getSellers, 
  createSeller, 
  updateSeller, 
  deleteSeller, 
  createAddress, 
  deleteAddress,
  updateAddress,
  updateSellerAddress,
  createSellerAddress,
  deleteSellerAddress,
  getSellerOrders,
  updateOrder
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


const Sellers = () => {
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };
  
  const hideToast = () => {
    setToast({ show: false, message: '', type: 'success' });
  };


  // Toggle mode: adding seller or address
  const [addingMode, setAddingMode] = useState("seller"); // "seller" or "address"

  // Seller form fields
  const [storeName, setStoreName] = useState("");
  const [phone, setPhone] = useState("");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState(null);

  // Address form fields
  const [selectedSellerId, setSelectedSellerId] = useState("");
  const [addressStreet, setAddressStreet] = useState("");
  const [addressCity, setAddressCity] = useState("");
  const [addressCountry, setAddressCountry] = useState("");
  const [addressRegion, setAddressRegion] = useState("");
  const [addressPostalCode, setAddressPostalCode] = useState("");
  const [addAddressError, setAddAddressError] = useState(null);

  // Edit seller
  const [editingId, setEditingId] = useState(null);
  const [editStoreName, setEditStoreName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editError, setEditError] = useState(null);

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, id: null, name: "" });

  // Expanded row state
  const [expandedRows, setExpandedRows] = useState(new Set());

  // Orders modal
  const [ordersModal, setOrdersModal] = useState({ show: false, sellerId: null, sellerName: "", orders: [], loading: false, error: null });
  const [statusModal, setStatusModal] = useState({ show: false, orderId: null, currentStatus: "", loading: false, error: null });
  const [orderStatusFilter, setOrderStatusFilter] = useState("all");
  const [expandedOrderRows, setExpandedOrderRows] = useState(new Set());
  const [activeTab, setActiveTab] = useState("orders"); // "orders" or "products"

  
  const [orderTab, setOrderTab] = useState("requests"); // "requests", "ongoing", "history"
  const [requestCount, setRequestCount] = useState(0);

  const [productsWithReviews, setProductsWithReviews] = useState([]);
  const [expandedProducts, setExpandedProducts] = useState(new Set());
 
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

// ADDRESS EDIT/DELETE STATES 
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [editAddressStreet, setEditAddressStreet] = useState("");
  const [editAddressCity, setEditAddressCity] = useState("");
  const [editAddressCountry, setEditAddressCountry] = useState("");
  const [editAddressRegion, setEditAddressRegion] = useState("");
  const [editAddressPostalCode, setEditAddressPostalCode] = useState("");
  const [editAddressError, setEditAddressError] = useState(null);
  const [deleteAddressConfirm, setDeleteAddressConfirm] = useState({ show: false, addressId: null, sellerId: null });
  const [editSavedLocation, setEditSavedLocation] = useState(null);
  const [editMapModal, setEditMapModal] = useState({ show: false });

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



 const fetchSellers = async () => {
  try {
    const data = await getSellers();
    
    // Fetch request counts for each seller
    const sellersWithCounts = await Promise.all(
      data.map(async (seller) => {
        try {
          const orders = await getSellerOrders(seller.id);
          const requestCount = orders.filter(o => o.status?.toLowerCase() === "placed").length;
          return { ...seller, requestCount };
        } catch {
          return { ...seller, requestCount: 0 };
        }
      })
    );
    
    setSellers(sellersWithCounts);
  } catch (err) {
    setError(err.message || "Failed to load sellers");
  }
}; 

useEffect(() => {
  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getSellers();
      
      // Now fetch request counts for each seller
      const sellersWithCounts = await Promise.all(
        data.map(async (seller) => {
          try {
            const orders = await getSellerOrders(seller.id);
            const requestCount = orders.filter(o => o.status?.toLowerCase() === "placed").length;
            return { ...seller, requestCount };
          } catch {
            return { ...seller, requestCount: 0 };
          }
        })
      );
      
      setSellers(sellersWithCounts);
    } catch (err) {
      setError(err.message || "Failed to load sellers");
    } finally {
      setLoading(false);
    }
  };
  
  loadData();
}, []);

  // --- Seller APIs ---
  const handleAddSeller = async () => {
    if (!storeName) return;
    setAdding(true);
    setAddError(null);
    try {
      await createSeller({ StoreName: storeName, Phone: phone });
      await fetchSellers();
      setStoreName("");
      setPhone("");
      showToast('Seller added successfully!', 'success');
    } catch (err) {
      setAddError(err.message || "Failed to add seller");
    } finally {
      setAdding(false);
    }
  };

  const startEdit = (seller) => {
    setEditingId(seller.id);
    setEditStoreName(seller.storeName);
    setEditPhone(seller.phone || "");
    setEditError(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditStoreName("");
    setEditPhone("");
    setEditError(null);
  };

  const handleEditSeller = async () => {
    try {
      await updateSeller(editingId, { StoreName: editStoreName, Phone: editPhone });
      await fetchSellers();
      cancelEdit();
      showToast('Seller updated successfully!', 'success');
    } catch (err) {
      setEditError(err.message || "Failed to edit seller");
    }
  };

  const confirmDelete = (id, name) => {
    setDeleteConfirm({ show: true, id, name });
  };

  const cancelDelete = () => {
    setDeleteConfirm({ show: false, id: null, name: "" });
  };

  const handleDelete = async () => {
    try {
      await deleteSeller(deleteConfirm.id);
      setSellers(sellers.filter((s) => s.id !== deleteConfirm.id));
      cancelDelete();
      showToast('Seller deleted successfully!', 'success');
    } catch (err) {
      alert(err.message || "Failed to delete seller");
    }
  };

  // --- Address APIs ---
  const handleAddAddress = async () => {
    if (!selectedSellerId || !addressStreet || !addressCity || !addressCountry) return;
    setAdding(true);
    setAddAddressError(null);
    showToast('Address added successfully!', 'success');

    try {
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

      await createSellerAddress({
        SellerId: parseInt(selectedSellerId),
        AddressId: newAddress.id
      });

      setSelectedSellerId("");
      setAddressStreet("");
      setAddressCity("");
      setAddressCountry("");
      setAddressRegion("");
      setAddressPostalCode("");

      await fetchSellers();
      setAddAddressError(null);
    } catch (err) {
      console.error("Full error:", err);
      setAddAddressError(err.message || "Failed to add address");
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
      await fetchSellers();
      cancelEditAddress();
      showToast('Address updated successfully!', 'success');
    } catch (err) {
      setEditAddressError(err.message || "Failed to update address");
      showToast(err.message || "Failed to update address", 'error');
    }
  };

  const confirmDeleteAddress = (addressId, sellerId) => {
    setDeleteAddressConfirm({ show: true, addressId, sellerId });
  };

  const cancelDeleteAddress = () => {
    setDeleteAddressConfirm({ show: false, addressId: null, sellerId: null });
  };

  const handleDeleteAddress = async () => {
    try {
      const { addressId, sellerId } = deleteAddressConfirm;
      
      const seller = sellers.find(s => s.id === sellerId);
      const sellerAddressLink = seller?.sellerAddresses?.find(
        sa => sa.address?.id === addressId
      );
      
      if (!sellerAddressLink) {
        throw new Error("Address link not found");
      }
      
      await deleteSellerAddress(sellerAddressLink.id);
      await deleteAddress(addressId);
      
      await fetchSellers();
      cancelDeleteAddress();
      showToast('Address deleted successfully!', 'success');
    } catch (err) {
      showToast(err.message || "Failed to delete address", 'error');
    }
  };


const openOrdersModal = async (sellerId, sellerName, keepCurrentTab = false) => {
  const currentTab = keepCurrentTab ? orderTab : "requests";
  
  setOrdersModal({ show: true, sellerId, sellerName, orders: [], loading: true, error: null });
  setOrderStatusFilter("all");
  setExpandedOrderRows(new Set());
  setActiveTab("orders");
  setProductsWithReviews([]);
  setExpandedProducts(new Set());
  setOrderTab(currentTab); // Use current or default tab
  
  try {
    const data = await getSellerOrders(sellerId);
    
    // Count pending requests
    const pendingRequests = (data || []).filter(o => o.status?.toLowerCase() === "placed").length;
    setRequestCount(pendingRequests);
    
    // Fetch reviews for all products in all orders
    const ordersWithReviews = await Promise.all(
      (data || []).map(async (order) => {
        const itemsWithReviews = await Promise.all(
          (order.orderItems || []).map(async (item) => {
            try {
              const reviews = await fetch(`https://localhost:7062/api/Reviews?productId=${item.productId}`);
              const reviewData = await reviews.json();
              const productReviews = reviewData.filter(r => r.orderId === order.id && r.productId === item.productId);
              return { ...item, reviews: productReviews || [], orderId: order.id, orderDate: order.createdAt };
            } catch {
              return { ...item, reviews: [], orderId: order.id, orderDate: order.createdAt };
            }
          })
        );
        return { ...order, orderItems: itemsWithReviews };
      })
    );
    
    // Group products with their reviews
    const productMap = new Map();
    ordersWithReviews.forEach(order => {
      order.orderItems?.forEach(item => {
        if (!productMap.has(item.productId)) {
          productMap.set(item.productId, {
            productId: item.productId,
            productName: item.productName,
            totalOrders: 0,
            totalReviews: 0,
            reviews: []
          });
        }
        const product = productMap.get(item.productId);
        product.totalOrders++;
        if (item.reviews && item.reviews.length > 0) {
          product.totalReviews += item.reviews.length;
          item.reviews.forEach(review => {
            product.reviews.push({
              ...review,
              orderId: item.orderId,
              orderDate: item.orderDate
            });
          });
        }
      });
    });
    
    const productsArray = Array.from(productMap.values());
    setProductsWithReviews(productsArray);
    setOrdersModal(prev => ({ ...prev, orders: ordersWithReviews, loading: false }));
  } catch (err) {
    setOrdersModal(prev => ({ ...prev, error: err.message || "Failed to load orders", loading: false }));
  }
};

 const closeOrdersModal = () => {
  setOrdersModal({ show: false, sellerId: null, sellerName: "", orders: [], loading: false, error: null });
  setOrderStatusFilter("all");
  setExpandedOrderRows(new Set());
  setActiveTab("orders");
  setProductsWithReviews([]);
  setExpandedProducts(new Set());
};

  const openStatusModal = (orderId, currentStatus) => {
    setStatusModal({ show: true, orderId, currentStatus, loading: false, error: null });
  };

  const closeStatusModal = () => {
    setStatusModal({ show: false, orderId: null, currentStatus: "", loading: false, error: null });
  };

  const handleUpdateStatus = async (newStatus) => {
    setStatusModal(prev => ({ ...prev, loading: true }));
    try {
      await updateOrder(statusModal.orderId, { Status: newStatus });
      setOrdersModal(prev => ({
        ...prev,
        orders: prev.orders.map(o => o.id === statusModal.orderId ? { ...o, status: newStatus } : o)
      }));
      closeStatusModal();
    } catch (err) {
      setStatusModal(prev => ({ ...prev, error: err.message || "Failed to update status", loading: false }));
    }
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

const toggleProductRow = (productId) => {
  const newExpanded = new Set(expandedProducts);
  if (newExpanded.has(productId)) {
    newExpanded.delete(productId);
  } else {
    newExpanded.add(productId);
  }
  setExpandedProducts(newExpanded);
};

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "placed":
        return "bg-blue-100 text-blue-800";
      case "processing":
        return "bg-yellow-100 text-yellow-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPaymentColor = (status) => {
    switch (status?.toLowerCase()) {
      case "paid":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-orange-100 text-orange-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const filteredOrders = ordersModal.orders.filter(order => {
    return orderStatusFilter === "all" || order.status?.toLowerCase() === orderStatusFilter.toLowerCase();
  });

  const toggleRow = (sellerId) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(sellerId)) {
      newExpanded.delete(sellerId);
    } else {
      newExpanded.add(sellerId);
    }
    setExpandedRows(newExpanded);
  };

  const inputClasses = "w-full !border-2 !border-gray-400 rounded-lg p-3 !text-black !bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:!border-blue-500";

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen !bg-gray-50">
      <div className="text-center">
        <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-r-transparent"></div>
        <p className="mt-4 text-lg !text-gray-600">Loading sellers...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="flex items-center justify-center min-h-screen !bg-gray-50">
      <div className="max-w-md w-full !bg-white shadow-lg rounded-lg p-6 border-l-4 border-red-500">
        <h2 className="text-xl font-semibold !text-gray-800 mb-2">Error Loading Sellers</h2>
        <p className="!text-gray-600 mb-4">{error}</p>
        <button onClick={fetchSellers} className="w-full !bg-blue-600 hover:!bg-blue-700 !text-white py-2 px-4 rounded-lg">
          Retry
        </button>
      </div>
    </div>
  );

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

      setEditAddressStreet(addr.road || editAddressStreet);
      setEditAddressCity(addr.city || addr.town || addr.village || editAddressCity);
      setEditAddressCountry(addr.country || editAddressCountry);
      setEditAddressRegion(addr.state || editAddressRegion);
      setEditAddressPostalCode(addr.postcode || editAddressPostalCode);

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
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      .animate-slide-in { animation: slide-in 0.3s ease-out; }
    `}</style>

    {toast.show && (
      <Toast message={toast.message} type={toast.type} onClose={hideToast} />
    )}
    
    <MapModal />
    <EditMapModal />
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold !text-gray-900">Seller Management</h1>
          <p className="mt-2 text-lg !text-gray-600">Manage sellers and their addresses</p>
        </div>

        {/* Toggle Button */}
        <div className="mb-6">
          <button
            onClick={() => setAddingMode(addingMode === "seller" ? "address" : "seller")}
            className="!bg-gradient-to-r !from-gray-600 !to-gray-700 hover:!from-gray-700 hover:!to-gray-800 !text-white px-6 py-3 rounded-lg font-semibold shadow-md transition-all"
          >
            {addingMode === "seller" ? "➕ Add Address Mode" : "👤 Add Seller Mode"}
          </button>
        </div>

        {/* Add Seller / Address Form */}
        {addingMode === "seller" ? (
          <div className="!bg-white shadow-lg rounded-xl border border-gray-200 p-6 mb-6">
            <h2 className="text-2xl font-semibold !text-gray-900 mb-4">Add Seller</h2>
            {addError && (
              <div className="mb-4 p-4 rounded-lg !bg-red-50 border-l-4 border-red-500">
                <p className="text-sm !text-red-700 font-medium">{addError}</p>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium !text-gray-700 mb-2">Store Name <span className="!text-red-500">*</span></label>
                <input type="text" value={storeName} onChange={e => setStoreName(e.target.value)} className={inputClasses} placeholder="Enter store name" />
              </div>
              <div>
                <label className="block text-sm font-medium !text-gray-700 mb-2">Phone</label>
                <input type="text" value={phone} onChange={e => setPhone(e.target.value)} className={inputClasses} placeholder="Enter phone number" />
              </div>
              <div className="flex items-end">
                <button onClick={handleAddSeller} disabled={adding || !storeName} className="w-full !bg-blue-600 hover:!bg-blue-700 !text-white py-3 px-6 rounded-lg font-semibold disabled:opacity-50">
                  {adding ? "Adding..." : "Add Seller"}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="!bg-white shadow-lg rounded-xl border border-gray-200 p-6 mb-6">
            <h2 className="text-2xl font-semibold !text-gray-900 mb-4">Add Address</h2>
            {addAddressError && (
              <div className="mb-4 p-4 rounded-lg !bg-red-50 border-l-4 border-red-500">
                <p className="text-sm !text-red-700 font-medium">{addAddressError}</p>
              </div>
            )}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium !text-gray-700 mb-2">Seller <span className="!text-red-500">*</span></label>
                  <select value={selectedSellerId} onChange={e => setSelectedSellerId(e.target.value)} className={inputClasses}>
                    <option value="">Select Seller</option>
                    {sellers.map(s => <option key={s.id} value={s.id}>{s.storeName}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium !text-gray-700 mb-2">Street <span className="!text-red-500">*</span></label>
                  <input type="text" value={addressStreet} onChange={e => setAddressStreet(e.target.value)} className={inputClasses} placeholder="Enter street address" />
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
                  <input type="text" value={addressCity} onChange={e => setAddressCity(e.target.value)} className={inputClasses} placeholder="Enter city" />
                </div>
                <div>
                  <label className="block text-sm font-medium !text-gray-700 mb-2">Country <span className="!text-red-500">*</span></label>
                  <input type="text" value={addressCountry} onChange={e => setAddressCountry(e.target.value)} className={inputClasses} placeholder="Enter country" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium !text-gray-700 mb-2">Region</label>
                  <input type="text" value={addressRegion} onChange={e => setAddressRegion(e.target.value)} className={inputClasses} placeholder="Enter region (optional)" />
                </div>
                <div>
                  <label className="block text-sm font-medium !text-gray-700 mb-2">Postal Code</label>
                  <input type="text" value={addressPostalCode} onChange={e => setAddressPostalCode(e.target.value)} className={inputClasses} placeholder="Enter postal code (optional)" />
                </div>
              </div>
              <button onClick={handleAddAddress} disabled={adding || !selectedSellerId || !addressStreet || !addressCity || !addressCountry} className="w-full !bg-blue-600 hover:!bg-blue-700 !text-white py-3 px-6 rounded-lg font-semibold disabled:opacity-50">
                {adding ? "Adding Address..." : "Add Address"}
              </button>
            </div>
          </div>
        )}
        {viewMapModal.show && (
        <ViewMapModal
          lat={viewMapModal.lat}
          lng={viewMapModal.lng}
          address={viewMapModal.address}
          onClose={() => setViewMapModal({ show: false, lat: null, lng: null, address: null })}
        />
      )}


        {/* Sellers Table */}
        <div className="!bg-white shadow-lg rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 !bg-gradient-to-r !from-blue-50 !to-indigo-50">
            <h2 className="text-2xl font-semibold !text-gray-900">All Sellers</h2>
            <p className="mt-1 text-sm !text-gray-600">Manage your seller database</p>
          </div>

          {sellers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="!bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold !text-gray-600 uppercase tracking-wider w-12"></th>
                    <th className="px-6 py-4 text-left text-xs font-semibold !text-gray-600 uppercase tracking-wider">Store Name</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold !text-gray-600 uppercase tracking-wider">Phone</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold !text-gray-600 uppercase tracking-wider">Addresses</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold !text-gray-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="!bg-white divide-y divide-gray-200">
                  {sellers.map(seller => (
                    <Fragment key={seller.id}>
                      <tr className="hover:!bg-gray-50 transition-colors">
                        {editingId === seller.id ? (
                          <>
                            <td className="px-6 py-4"></td>
                            <td className="px-6 py-4">
                              <input type="text" value={editStoreName} onChange={e => setEditStoreName(e.target.value)} className={inputClasses} />
                            </td>
                            <td className="px-6 py-4">
                              <input type="text" value={editPhone} onChange={e => setEditPhone(e.target.value)} className={inputClasses} />
                            </td>
                            <td className="px-6 py-4"></td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex gap-2 justify-end">
                                <button onClick={handleEditSeller} className="!bg-green-600 hover:!bg-green-700 !text-white px-4 py-2 rounded-lg font-semibold">Save</button>
                                <button onClick={cancelEdit} className="!bg-gray-500 hover:!bg-gray-600 !text-white px-4 py-2 rounded-lg font-semibold">Cancel</button>
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="px-6 py-4">
                              {seller.sellerAddresses && seller.sellerAddresses.length > 0 && (
                                <button onClick={() => toggleRow(seller.id)} className="!text-gray-600 hover:!text-blue-600">
                                  <svg className={`w-5 h-5 transition-transform ${expandedRows.has(seller.id) ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                  </svg>
                                </button>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm font-medium !text-gray-900">{seller.storeName}</div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm !text-gray-900">{seller.phone || "N/A"}</div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="inline-flex px-3 py-1 text-xs font-medium rounded-full !bg-blue-100 !text-blue-800">
                                {seller.sellerAddresses?.length || 0} address{seller.sellerAddresses?.length !== 1 ? 'es' : ''}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex gap-2 justify-end flex-wrap">
                                <button onClick={() => openOrdersModal(seller.id, seller.storeName)} className="!bg-purple-600 hover:!bg-purple-700 !text-white px-4 py-2 rounded-lg font-semibold text-sm relative" title="Manage Orders">
                                    📦 Manage Orders
                                    {sellers.find(s => s.id === seller.id)?.requestCount > 0 && (
                                      <span className="absolute -top-2 -right-2 !bg-red-500 !text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
                                        {sellers.find(s => s.id === seller.id)?.requestCount || 0}
                                      </span>
                                    )}
                                  </button>
                                <button onClick={() => startEdit(seller)} className="!bg-yellow-500 hover:!bg-yellow-600 !text-white p-2 rounded-lg" title="Edit Seller">
                                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                                <button onClick={() => confirmDelete(seller.id, seller.storeName)} className="!bg-red-600 hover:!bg-red-700 !text-white p-2 rounded-lg" title="Delete Seller">
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
                      {expandedRows.has(seller.id) && seller.sellerAddresses && seller.sellerAddresses.length > 0 && (
                        <tr className="!bg-gray-50">
                          <td colSpan="5" className="px-6 py-4">
                            <div className="ml-8 space-y-3">
                              <h4 className="font-semibold !text-gray-900 mb-3">Addresses:</h4>
                              {seller.sellerAddresses.map((sa, idx) => (
                                <div key={idx} className="!bg-white p-4 rounded-lg border border-gray-200">
                                  {editingAddressId === sa.address?.id ? (
                                    // ✅ EDIT MODE
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
                                          onClick={() => handleEditAddress(sa.address.id)}
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
                                    // ✅ VIEW MODE
                                    <>
                                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-3">
                                        <div>
                                          <span className="font-medium !text-gray-600">Street:</span>
                                          <p className="!text-gray-900">{sa.address?.street || 'N/A'}</p>
                                        </div>
                                        <div>
                                          <span className="font-medium !text-gray-600">City:</span>
                                          <p className="!text-gray-900">{sa.address?.city || 'N/A'}</p>
                                        </div>
                                        <div>
                                          <span className="font-medium !text-gray-600">Region:</span>
                                          <p className="!text-gray-900">{sa.address?.region || 'N/A'}</p>
                                        </div>
                                        <div>
                                          <span className="font-medium !text-gray-600">Country:</span>
                                          <p className="!text-gray-900">{sa.address?.country || 'N/A'}</p>
                                        </div>
                                      </div>
                                      <div className="flex gap-2">
                                        <button
                                          onClick={() => {
                                            const lat = sa.address?.latitude || sa.address?.Latitude || sa.address?.lat;
                                            const lng = sa.address?.longitude || sa.address?.Longitude || sa.address?.lng;

                                            if (lat && lng) {
                                              setViewMapModal({ 
                                                show: true, 
                                                lat, 
                                                lng, 
                                                address: sa.address
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
                                          onClick={() => startEditAddress(sa.address)}
                                          className="!bg-yellow-500 hover:!bg-yellow-600 text-white px-3 py-1 rounded-lg font-semibold text-sm"
                                        >
                                          ✏️ Edit
                                        </button>
                                        <button
                                          onClick={() => confirmDeleteAddress(sa.address.id, seller.id)}
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <h3 className="mt-4 text-lg font-medium !text-gray-900">No sellers yet</h3>
              <p className="mt-2 text-sm !text-gray-500">Get started by adding your first seller above.</p>
            </div>
          )}
        </div>

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
                <button onClick={handleDelete} className="flex-1 !bg-red-600 hover:!bg-red-700 !text-white py-3 px-4 rounded-lg font-semibold">
                  Delete
                </button>
                <button onClick={cancelDelete} className="flex-1 !bg-gray-500 hover:!bg-gray-600 !text-white py-3 px-4 rounded-lg font-semibold">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

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

        {/* Orders Modal */}
        {ordersModal.show && (
  <div className="fixed inset-0 !bg-black !bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="!bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center p-6 border-b border-gray-200">
        <h3 className="text-2xl font-bold !text-gray-900">Manage: {ordersModal.sellerName}</h3>
        <button onClick={closeOrdersModal} className="!text-gray-500 hover:!text-gray-700 text-2xl">×</button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 px-6">
        <button
          onClick={() => setActiveTab("orders")}
          className={`px-6 py-3 font-semibold transition-colors border-b-2 ${
            activeTab === "orders"
              ? "!border-blue-600 !text-blue-600"
              : "!border-transparent !text-gray-600 hover:!text-gray-900"
          }`}
        >
          📦 Orders ({ordersModal.orders.length})
        </button>
        <button
          onClick={() => setActiveTab("products")}
          className={`px-6 py-3 font-semibold transition-colors border-b-2 ${
            activeTab === "products"
              ? "!border-blue-600 !text-blue-600"
              : "!border-transparent !text-gray-600 hover:!text-gray-900"
          }`}
        >
          ⭐ Products & Reviews ({productsWithReviews.length})
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-6">
        {ordersModal.error && (
          <div className="mb-4 p-4 rounded-lg !bg-red-50 border-l-4 border-red-500">
            <p className="text-sm !text-red-700">{ordersModal.error}</p>
          </div>
        )}

        {ordersModal.loading ? (
          <div className="flex justify-center py-8">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-r-transparent"></div>
          </div>
        ) : (
          <>
            {/* Orders Tab */}
              {activeTab === "orders" && (
                <>
                  {/* Order Sub-Tabs */}
                  <div className="flex gap-2 mb-6 border-b border-gray-200 pb-2">
                    <button
                      onClick={() => setOrderTab("requests")}
                      className={`px-4 py-2 font-semibold rounded-t-lg transition-colors relative ${
                        orderTab === "requests"
                          ? "!bg-blue-100 !text-blue-700 border-b-2 !border-blue-600"
                          : "!bg-gray-100 !text-gray-600 hover:!bg-gray-200"
                      }`}
                    >
                      🔔 Requests
                      {requestCount > 0 && (
                        <span className="absolute -top-1 -right-1 !bg-red-500 !text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                          {requestCount}
                        </span>
                      )}
                    </button>
                    <button
                      onClick={() => setOrderTab("ongoing")}
                      className={`px-4 py-2 font-semibold rounded-t-lg transition-colors relative ${
                        orderTab === "ongoing"
                          ? "!bg-blue-100 !text-blue-700 border-b-2 !border-blue-600"
                          : "!bg-gray-100 !text-gray-600 hover:!bg-gray-200"
                      }`}
                    >
                      🔄 Ongoing
                      {(() => {
                        const ongoingCount = ordersModal.orders.filter(o => 
                          ["accepted", "preparing", "ready for pickup"].includes(o.status?.toLowerCase())
                        ).length;
                        return ongoingCount > 0 && (
                          <span className="absolute -top-1 -right-1 !bg-orange-500 !text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                            {ongoingCount}
                          </span>
                        );
                      })()}
                    </button>
                    <button
                      onClick={() => setOrderTab("history")}
                      className={`px-4 py-2 font-semibold rounded-t-lg transition-colors ${
                        orderTab === "history"
                          ? "!bg-blue-100 !text-blue-700 border-b-2 !border-blue-600"
                          : "!bg-gray-100 !text-gray-600 hover:!bg-gray-200"
                      }`}
                    >
                      📜 History
                    </button>
                  </div>

                  {/* Filter Orders Based on Sub-Tab */}
                  {(() => {
                    let tabFilteredOrders = [];
                    if (orderTab === "requests") {
                      tabFilteredOrders = ordersModal.orders.filter(o => o.status?.toLowerCase() === "placed");
                    } else if (orderTab === "ongoing") {
                      tabFilteredOrders = ordersModal.orders.filter(o => 
                        ["accepted", "preparing", "ready for pickup"].includes(o.status?.toLowerCase())
                      );
                    } else if (orderTab === "history") {
                      tabFilteredOrders = ordersModal.orders.filter(o => 
                        ["completed", "cancelled"].includes(o.status?.toLowerCase())
                      );
                    }

                    return tabFilteredOrders.length > 0 ? (
                      <div className="space-y-4">
                        {tabFilteredOrders.map(order => (
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
                                
                                {/* Action Buttons Based on Status */}
                                {order.status?.toLowerCase() === "placed" && (
                                  <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                                    <button
                                      onClick={async () => {
                                        try {
                                          await fetch(`https://localhost:7062/api/Orders/${order.id}/seller-response`, {
                                            method: 'PUT',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ Status: "Accepted" })
                                          });
                                          await openOrdersModal(ordersModal.sellerId, ordersModal.sellerName, true);
                                          await fetchSellers(); 
                                        } catch (err) {
                                          alert("Failed to accept order");
                                        }
                                      }}
                                      className="!bg-green-600 hover:!bg-green-700 !text-white px-3 py-1 rounded text-sm font-medium"
                                    >
                                      ✓ Accept
                                    </button>
                                    <button
                                      onClick={async () => {
                                        if (confirm("Decline this order?")) {
                                          try {
                                            await fetch(`https://localhost:7062/api/Orders/${order.id}/seller-response`, {
                                              method: 'PUT',
                                              headers: { 'Content-Type': 'application/json' },
                                              body: JSON.stringify({ Status: "Cancelled" })
                                            });
                                            await openOrdersModal(ordersModal.sellerId, ordersModal.sellerName, true);
                                            await fetchSellers(); 
                                          } catch (err) {
                                            alert("Failed to decline order");
                                          }
                                        }
                                      }}
                                      className="!bg-red-600 hover:!bg-red-700 !text-white px-3 py-1 rounded text-sm font-medium"
                                    >
                                      ✕ Decline
                                    </button>
                                  </div>
                                )}
                                
                                {(order.status?.toLowerCase() === "accepted" || order.status?.toLowerCase() === "preparing") && (
                                  <button
                                    onClick={async (e) => {
                                      e.stopPropagation();
                                      const newStatus = order.status?.toLowerCase() === "accepted" ? "Preparing" : "Ready for Pickup";
                                      try {
                                        await fetch(`https://localhost:7062/api/Orders/${order.id}/update-seller-status`, {
                                          method: 'PUT',
                                          headers: { 'Content-Type': 'application/json' },
                                          body: JSON.stringify({ Status: newStatus })
                                        });
                                        await openOrdersModal(ordersModal.sellerId, ordersModal.sellerName, true);
                                        await fetchSellers(); 
                                      } catch (err) {
                                        alert("Failed to update status");
                                      }
                                    }}
                                    className="!bg-blue-600 hover:!bg-blue-700 !text-white px-3 py-1 rounded text-sm font-medium"
                                  >
                                    {order.status?.toLowerCase() === "accepted" ? "→ Start Preparing" : "→ Ready for Pickup"}
                                  </button>
                                )}
                                
                                {order.status?.toLowerCase() === "ready for pickup" && order.fulfillmentType === "Pickup" && (
                                  <button
                                    onClick={async (e) => {
                                      e.stopPropagation();
                                      try {
                                        await fetch(`https://localhost:7062/api/Orders/${order.id}/update-seller-status`, {
                                          method: 'PUT',
                                          headers: { 'Content-Type': 'application/json' },
                                          body: JSON.stringify({ Status: "Completed" })
                                        });
                                        await openOrdersModal(ordersModal.sellerId, ordersModal.sellerName, true);
                                        await fetchSellers(); 
                                      } catch (err) {
                                        alert("Failed to complete order");
                                      }
                                    }}
                                    className="!bg-green-600 hover:!bg-green-700 !text-white px-3 py-1 rounded text-sm font-medium"
                                  >
                                    ✓ Mark Completed
                                  </button>
                                )}
                              </div>
                            </div>

                            {expandedOrderRows.has(order.id) && (
                              <div className="p-4 border-t border-gray-200 !bg-white">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                  <div>
                                    <p className="text-xs !text-gray-600 mb-1">Customer</p>
                                    <p className="text-sm font-medium !text-gray-900">{order.customerName || "N/A"}</p>
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
                                          <div className="flex justify-between items-center">
                                            <div className="flex-1">
                                              <p className="text-sm font-medium !text-gray-900">{item.productName || "Product"}</p>
                                              <p className="text-xs !text-gray-600">SKU: {item.variantSKU || "N/A"} • Qty: {item.qty}</p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                              <p className="text-sm font-semibold !text-gray-900">${item.lineTotal?.toFixed(2) || "0.00"}</p>
                                              {item.reviews && item.reviews.length > 0 && (
                                                <span className="!bg-yellow-100 !text-yellow-700 px-3 py-1 rounded text-xs font-medium">
                                                  ⭐ {item.reviews.length} Review{item.reviews.length !== 1 ? 's' : ''}
                                                </span>
                                              )}
                                            </div>
                                          </div>

                                          {item.reviews && item.reviews.length > 0 && (
                                            <div className="mt-3 space-y-2">
                                              {item.reviews.map((review, reviewIdx) => (
                                                <div key={reviewIdx} className={`p-3 rounded-lg border ${review.isCommentHiddenBySeller ? '!bg-red-50 border-red-300' : '!bg-white border-gray-200'}`}>
                                                  <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-2">
                                                      <span className="text-xs font-semibold !text-gray-700">Customer Review:</span>
                                                      <div className="flex">
                                                        {[1, 2, 3, 4, 5].map(star => (
                                                          <span key={star} className={`text-sm ${star <= review.rating ? '!text-yellow-400' : '!text-gray-300'}`}>
                                                            ★
                                                          </span>
                                                        ))}
                                                      </div>
                                                      <span className="text-xs !text-gray-600">
                                                        {new Date(review.createdAt).toLocaleDateString()}
                                                      </span>
                                                      {review.isCommentHiddenBySeller && (
                                                        <span className="!bg-red-500 !text-white px-2 py-1 rounded text-xs font-bold">
                                                          🚫 HIDDEN
                                                        </span>
                                                      )}
                                                    </div>
                                                    <button
                                                      onClick={async (e) => {
                                                        e.stopPropagation();
                                                        const reason = review.isCommentHiddenBySeller 
                                                          ? null 
                                                          : prompt("Please provide a reason for hiding this review:");
                                                        
                                                        if (reason === null && !review.isCommentHiddenBySeller) {
                                                          // User cancelled the prompt
                                                          return;
                                                        }
                                                        
                                                        if (!review.isCommentHiddenBySeller && (!reason || reason.trim() === "")) {
                                                          showToast("Please provide a reason for hiding the review", "error");
                                                          return;
                                                        }
                                                        
                                                        if (confirm(review.isCommentHiddenBySeller ? "Unhide this review?" : `Hide this review?\nReason: ${reason}`)) {
                                                          try {
                                                            await fetch(`https://localhost:7062/api/Reviews/${review.id}`, {
                                                              method: 'PUT',
                                                              headers: { 'Content-Type': 'application/json' },
                                                              body: JSON.stringify({ 
                                                                IsCommentHiddenBySeller: !review.isCommentHiddenBySeller,
                                                                HiddenReason: review.isCommentHiddenBySeller ? null : reason.trim()
                                                              })
                                                            });
                                                            showToast(review.isCommentHiddenBySeller ? 'Review unhidden successfully!' : 'Review hidden successfully!', 'success');
                                                            await openOrdersModal(ordersModal.sellerId, ordersModal.sellerName, true);
                                                          } catch (err) {
                                                            showToast('Failed to update review', 'error');
                                                          }
                                                        }
                                                      }}
                                                      className={`${review.isCommentHiddenBySeller ? '!bg-green-600 hover:!bg-green-700' : '!bg-red-600 hover:!bg-red-700'} !text-white px-2 py-1 rounded text-xs font-semibold`}
                                                    >
                                                      {review.isCommentHiddenBySeller ? '👁️ Unhide' : '🚫 Hide'}
                                                    </button>
                                                  </div>
                                                  <p className={`text-sm italic ${review.isCommentHiddenBySeller ? '!text-gray-500 line-through' : '!text-gray-700'}`}>
                                                    "{review.comment}"
                                                  </p>
                                                  {review.isCommentHiddenBySeller && review.hiddenReason && (
                                                    <p className="text-xs !text-red-600 mt-2 italic">Reason: {review.hiddenReason}</p>
                                                  )}
                                                </div>
                                              ))}
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
                        <p className="!text-gray-600">
                          {orderTab === "requests" && "No pending order requests"}
                          {orderTab === "ongoing" && "No ongoing orders"}
                          {orderTab === "history" && "No order history"}
                        </p>
                      </div>
                    );
                  })()}
                </>
              )}

            {/* Products & Reviews Tab */}
            {activeTab === "products" && (
              <>
                {productsWithReviews.length > 0 ? (
                  <div className="space-y-4">
                    {productsWithReviews.map(product => (
                      <div key={product.productId} className="!bg-gray-50 rounded-lg border border-gray-200">
                        <div className="p-4 flex justify-between items-center cursor-pointer" onClick={() => toggleProductRow(product.productId)}>
                          <div className="flex items-center gap-4">
                            <svg className={`w-5 h-5 !text-gray-600 transition-transform ${expandedProducts.has(product.productId) ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                            <div>
                              <p className="font-semibold !text-gray-900">{product.productName}</p>
                              <p className="text-sm !text-gray-600">Product ID: {product.productId}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="inline-flex px-3 py-1 text-xs font-medium rounded-full !bg-blue-100 !text-blue-800">
                              {product.totalOrders} Order{product.totalOrders !== 1 ? 's' : ''}
                            </span>
                            <span className="inline-flex px-3 py-1 text-xs font-medium rounded-full !bg-yellow-100 !text-yellow-700">
                              ⭐ {product.totalReviews} Review{product.totalReviews !== 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>

                        {expandedProducts.has(product.productId) && (
                          <div className="p-4 border-t border-gray-200 !bg-white">
                            {product.reviews.length > 0 ? (
                              <div className="space-y-3">
                                <h4 className="font-semibold !text-gray-900 mb-3">Customer Reviews:</h4>
                                {product.reviews.map((review, idx) => (
                                  <div key={idx} className={`p-4 rounded-lg border ${review.isCommentHiddenBySeller ? '!bg-red-50 border-red-300' : '!bg-gray-50 border-gray-200'}`}>
                                    <div className="flex items-center justify-between mb-3">
                                      <div className="flex items-center gap-3">
                                        <div className="flex">
                                          {[1, 2, 3, 4, 5].map(star => (
                                            <span key={star} className={`text-lg ${star <= review.rating ? '!text-yellow-400' : '!text-gray-300'}`}>
                                              ★
                                            </span>
                                          ))}
                                        </div>
                                        <span className="text-sm font-semibold !text-gray-900">{review.customerName || "Anonymous"}</span>
                                        {review.isCommentHiddenBySeller && (
                                          <span className="!bg-red-500 !text-white px-2 py-1 rounded text-xs font-bold">
                                            🚫 HIDDEN
                                          </span>
                                        )}
                                      </div>
                                      <div className="text-right flex items-center gap-3">
                                        <div>
                                          <p className="text-xs !text-gray-600">{new Date(review.createdAt).toLocaleDateString()}</p>
                                          <p className="text-xs !text-gray-500">Order #{review.orderId}</p>
                                        </div>
                                        <button
                                          onClick={async (e) => {
                                            e.stopPropagation();
                                            const reason = review.isCommentHiddenBySeller 
                                              ? null 
                                              : prompt("Please provide a reason for hiding this review:");
                                            
                                            if (reason === null && !review.isCommentHiddenBySeller) {
                                              // User cancelled the prompt
                                              return;
                                            }
                                            
                                            if (!review.isCommentHiddenBySeller && (!reason || reason.trim() === "")) {
                                              showToast("Please provide a reason for hiding the review", "error");
                                              return;
                                            }
                                            
                                            if (confirm(review.isCommentHiddenBySeller ? "Unhide this review?" : `Hide this review?\nReason: ${reason}`)) {
                                              try {
                                                await fetch(`https://localhost:7062/api/Reviews/${review.id}`, {
                                                  method: 'PUT',
                                                  headers: { 'Content-Type': 'application/json' },
                                                  body: JSON.stringify({ 
                                                    IsCommentHiddenBySeller: !review.isCommentHiddenBySeller,
                                                    HiddenReason: review.isCommentHiddenBySeller ? null : reason.trim()
                                                  })
                                                });
                                                showToast(review.isCommentHiddenBySeller ? 'Review unhidden successfully!' : 'Review hidden successfully!', 'success');
                                                await openOrdersModal(ordersModal.sellerId, ordersModal.sellerName, true);
                                              } catch (err) {
                                                showToast('Failed to update review', 'error');
                                              }
                                            }
                                          }}
                                          className={`${review.isCommentHiddenBySeller ? '!bg-green-600 hover:!bg-green-700' : '!bg-red-600 hover:!bg-red-700'} !text-white px-3 py-1 rounded text-xs font-semibold`}
                                        >
                                          {review.isCommentHiddenBySeller ? '👁️ Unhide' : '🚫 Hide'}
                                        </button>
                                      </div>
                                    </div>
                                    <p className={`text-sm ${review.isCommentHiddenBySeller ? '!text-gray-500 line-through' : '!text-gray-700'}`}>
                                      "{review.comment}"
                                    </p>
                                    {review.isCommentHiddenBySeller && review.hiddenReason && (
                                      <p className="text-xs !text-red-600 mt-2 italic">Reason: {review.hiddenReason}</p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center py-4">
                                <p className="!text-gray-600">No reviews yet for this product</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="!text-gray-600">No products with reviews found</p>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  </div>
)}

        {/* Status Update Modal */}
        {statusModal.show && (
          <div className="fixed inset-0 !bg-black !bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="!bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
              <div className="flex items-center mb-4">
                <div className="!bg-blue-100 p-3 rounded-full">
                  <svg className="w-6 h-6 !text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="ml-3 text-xl font-bold !text-gray-900">Update Order Status</h3>
              </div>
              <p className="!text-gray-600 mb-4">Current Status: <strong className="!text-gray-900">{statusModal.currentStatus}</strong></p>

              {statusModal.error && (
                <div className="mb-4 p-3 rounded-lg !bg-red-50 border-l-4 border-red-500">
                  <p className="text-sm !text-red-700">{statusModal.error}</p>
                </div>
              )}

              <div className="space-y-2 mb-6">
                {["Placed", "Processing", "Completed", "Cancelled"].map(status => (
                  <button
                    key={status}
                    onClick={() => handleUpdateStatus(status)}
                    disabled={statusModal.loading || status === statusModal.currentStatus}
                    className="w-full !bg-blue-600 hover:!bg-blue-700 !text-white py-2 px-4 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    {statusModal.loading ? "Updating..." : `Mark as ${status}`}
                  </button>
                ))}
              </div>

              <button onClick={closeStatusModal} disabled={statusModal.loading} className="w-full !bg-gray-300 hover:!bg-gray-400 !text-gray-900 py-2 px-4 rounded-lg font-medium">
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sellers;
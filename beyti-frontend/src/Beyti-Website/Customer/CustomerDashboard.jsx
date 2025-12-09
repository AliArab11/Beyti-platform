import React, { useState, useEffect, useMemo } from "react";
import * as Icon from "@phosphor-icons/react";
import { useNavigate, useLocation } from "react-router-dom";
import PageHeader from "../../components/PageHeader";
import NavigationButton from "../../components/NavigationButton";
import AnalyticsCard from "../../components/AnalyticsCard";
import StatusChip from "../../components/StatusChip";
import CRUDButton from "../../components/CRUDButton";
import { Table, TableHeader, TableBody, TableRow } from "../../components/Table";
import '../Seller/Components/modalAnimations.css';
import OrderDetails from '../Store/Components/OrderDetails';

// API helpers
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
      const text = await response.text();
      throw new Error(text || "Request failed");
    }
    if (response.status === 204) return null;
    return await response.json();
  } catch (error) {
    console.error("API Request Failed:", error);
    throw error;
  }
};

const getCustomers = async () => fetchAPI("/Customers");
const getCustomerOrders = async (customerId) => 
  fetchAPI(`/Orders?customerId=${customerId}`);

// Helper functions
const formatDate = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatCurrency = (value) => {
  if (!value && value !== 0) return "BHD 0.000";
  return `BHD ${Number(value).toFixed(3)}`;
};

const getStatusVariant = (status) => {
  const s = status?.toLowerCase();
  if (!s) return "neutral";
  if (s === "placed" || s === "pending") return "danger";
  if (["accepted", "preparing", "ready for pickup"].includes(s)) return "brand";
  if (s === "completed" || s === "delivered") return "success";
  if (s === "cancelled") return "error";
  return "neutral";
};

// Order Details Modal
const OrderDetailsModal = ({ order, onClose }) => {
  if (!order) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm modal-backdrop-enter">
      <div className="bg-cream-50 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col border border-grey-stroke modal-content-enter">
        {/* Header */}
        <div className="px-6 py-4 border-b border-grey-stroke flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-charcoal-700">
              Order #{order.id}
            </h2>
            <p className="text-sm text-charcoal-400">
              Placed on {formatDate(order.createdAt)}
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
          {/* Status */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-1">
              <p className="text-xs text-charcoal-400 uppercase tracking-wide">
                Order Status
              </p>
              <StatusChip variant={getStatusVariant(order.status)}>
                {order.status || "Unknown"}
              </StatusChip>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-charcoal-400 uppercase tracking-wide">
                Fulfillment
              </p>
              <span className="inline-flex px-3 py-1 rounded-full text-xs font-medium bg-grey-200 text-charcoal-600">
                {order.fulfillmentType || "N/A"}
              </span>
            </div>
          </div>

          {/* Store & Total */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-grey-100 rounded-xl p-4 border border-grey-stroke">
            <div>
              <p className="text-xs text-charcoal-400 mb-1 uppercase tracking-wide">
                Store
              </p>
              <p className="text-sm font-semibold text-charcoal-700">
                {order.sellerName || "N/A"}
              </p>
            </div>
            <div>
              <p className="text-xs text-charcoal-400 mb-1 uppercase tracking-wide">
                Order Total
              </p>
              <p className="text-lg font-semibold text-charcoal-800">
                {formatCurrency(order.totalAmount || 0)}
              </p>
            </div>
          </div>

          {/* Items */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-charcoal-700">
              Order Items ({order.orderItems?.length || 0})
            </h3>
            {order.orderItems && order.orderItems.length > 0 ? (
              <div className="space-y-2">
                {order.orderItems.map((item) => (
                  <div
                    key={item.id}
                    className="bg-cream-50 border border-grey-stroke rounded-lg px-3 py-2 flex items-center justify-between"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-charcoal-700">
                        {item.productName || "Product"}
                      </p>
                      <p className="text-xs text-charcoal-400">
                        Qty: {item.qty}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-charcoal-800">
                      {formatCurrency(item.lineTotal || 0)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-charcoal-400">No items found.</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-grey-stroke bg-grey-100">
          <button
            type="button"
            onClick={onClose}
            className="w-full bg-grey-300 hover:bg-grey-400 text-charcoal-700 py-2.5 rounded-lg font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// Main Customer Dashboard
const CustomerDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Get customer info from session storage (set by MainStoreView/StoreView)
  const [customerId, setCustomerId] = useState(() => {
    return parseInt(sessionStorage.getItem('beyti_customerId')) || null;
  });
  const [customerName, setCustomerName] = useState(() => {
    return sessionStorage.getItem('beyti_customerName') || "My Account";
  });

  const [customerList, setCustomerList] = useState([]);
  const [selectModalOpen, setSelectModalOpen] = useState(false);

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderModalOpen, setOrderModalOpen] = useState(false);

  const [activeOrder, setActiveOrder] = useState(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);  
  
  const [activeOrderIndex, setActiveOrderIndex] = useState(0);

  // Disable body scroll when modals are open
  useEffect(() => {
    if (selectModalOpen || orderModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [selectModalOpen, orderModalOpen]);

  // Load customers
  useEffect(() => {
    const loadCustomers = async () => {
      try {
        const data = await getCustomers();
        setCustomerList(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to load customers", err);
      }
    };
    loadCustomers();
  }, []);

  // Load orders
  useEffect(() => {
    if (!customerId) return;
    const loadOrders = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getCustomerOrders(customerId);
        setOrders(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message || "Failed to load orders");
      } finally {
        setLoading(false);
      }
    };
    loadOrders();
  }, [customerId]);



const activeOrders = useMemo(() => {
  if (!orders || orders.length === 0) return [];
  
  return orders.filter(o => 
    !['completed', 'cancelled', 'delivered'].includes(o.status?.toLowerCase())
  );
}, [orders]);

// Set the currently displayed active order based on index
const currentActiveOrder = activeOrders.length > 0 ? activeOrders[activeOrderIndex] : null;

  const getPageTitle = () => {
    if (location.pathname.includes("/customer-dashboard/orders")) {
      return "My Orders";
    } else if (location.pathname.includes("/customer-dashboard/addresses")) {
      return "My Addresses";
    } else if (location.pathname.includes("/customer-dashboard/favorites")) {
      return "My Favorites";
    } else {
      return "Dashboard";
    }
  };

  const openOrderModal = (order) => {
    setSelectedOrder(order);
    setOrderModalOpen(true);
  };

  const closeOrderModal = () => {
    setOrderModalOpen(false);
    setSelectedOrder(null);
  };

  // Metrics
  const { metrics, recentOrders } = useMemo(() => {
    if (!orders || orders.length === 0) {
      return {
        metrics: {
          totalOrders: 0,
          activeOrders: 0,
          totalSpent: 0,
        },
        recentOrders: [],
      };
    }

    const totalOrders = orders.length;
    const activeOrders = orders.filter(
      (o) => !["completed", "cancelled", "delivered"].includes(o.status?.toLowerCase())
    ).length;
    const totalSpent = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    const recentOrders = [...orders]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);

    return {
      metrics: { totalOrders, activeOrders, totalSpent },
      recentOrders,
    };
  }, [orders]);

  // Calculate favorite stores
const favoriteStores = useMemo(() => {
  if (!orders || orders.length === 0) return [];
  
  // Count orders per store
  const storeCounts = {};
  orders.forEach(order => {
    const storeName = order.sellerName || 'Unknown Store';
    storeCounts[storeName] = (storeCounts[storeName] || 0) + 1;
  });
  
  // Sort by count and get top 3
  return Object.entries(storeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name, count]) => ({ name, count }));
}, [orders]);

// Separate past orders (completed/cancelled)
const pastOrders = useMemo(() => {
  return orders
    .filter(o => ['completed', 'cancelled', 'delivered'].includes(o.status?.toLowerCase()))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);
}, [orders]);

  // Customer Select Modal
  const CustomerSelectModal = () => {
    if (!selectModalOpen) return null;

    return (
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-40 p-4 modal-backdrop-enter">
        <div className="bg-cream-50 rounded-2xl shadow-2xl w-full max-w-md p-6 border border-grey-stroke modal-content-enter">
          <h2 className="text-2xl font-semibold text-charcoal-700 mb-2">
            Select Customer Profile
          </h2>
          <p className="text-body-regular text-charcoal-400 mb-4">
            Choose your customer account to continue.
          </p>
          <select
            className="w-full border border-grey-stroke rounded-lg p-3 mb-6 bg-white focus:outline-none focus:ring-2 focus:ring-sage-400"
            defaultValue=""
            onChange={(e) => {
              const id = parseInt(e.target.value, 10);
              if (!id) return;
              const selected = customerList.find((c) => c.id === id);
              setCustomerName(selected?.fullName || "My Account");
              setCustomerId(id);
              setSelectModalOpen(false);
            }}
          >
            <option value="">-- Select Customer --</option>
            {customerList.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.fullName || `Customer #${customer.id}`}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setSelectModalOpen(false)}
            className="w-full bg-error-btn hover:bg-error-btn/90 text-cream-50 py-2.5 rounded-lg font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-cream-50 flex">
      <CustomerSelectModal />
      {orderModalOpen && selectedOrder && (
        <OrderDetailsModal order={selectedOrder} onClose={closeOrderModal} />
      )}

      {/* Sidebar */}
      <aside className="w-64 bg-sage-500 flex flex-col fixed h-screen border-r border-sage-700">
        <div className="p-6 border-b border-sage-700">
          <h1 className="text-display-h1 text-cream-200">Beyti</h1>
          <p className="text-label-medium text-cream-100 mt-1">Customer Portal</p>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          <NavigationButton
            selected={location.pathname === "/customer-dashboard" || location.pathname.includes("/customer-dashboard/dashboard")}
            onClick={() => navigate("dashboard")}
            icon={<Icon.House size={20} weight={location.pathname.includes("/dashboard") ? "fill" : "regular"} />}
          >
            Dashboard
          </NavigationButton>

          <NavigationButton
            selected={location.pathname.includes("/customer-dashboard/orders")}
            onClick={() => navigate("orders")}
            icon={<Icon.Package size={20} weight={location.pathname.includes("/orders") ? "fill" : "regular"} />}
          >
            My Orders
          </NavigationButton>

          <NavigationButton
            selected={location.pathname.includes("/customer-dashboard/addresses")}
            onClick={() => navigate("addresses")}
            icon={<Icon.MapPin size={20} weight={location.pathname.includes("/addresses") ? "fill" : "regular"} />}
          >
            Addresses
          </NavigationButton>

          <NavigationButton
            selected={location.pathname.includes("/customer-dashboard/favorites")}
            onClick={() => navigate("favorites")}
            icon={<Icon.Heart size={20} weight={location.pathname.includes("/favorites") ? "fill" : "regular"} />}
          >
            Favorites
          </NavigationButton>
        </nav>

      </aside>

      {/* Main content */}
      <div className="flex-1 ml-64 flex flex-col">
        <div className="border-b border-grey-stroke bg-grey-200">
          <PageHeader
            title={getPageTitle()}
            notificationCount={metrics.activeOrders || 0}
            userName={customerName}
            userRole="Customer"
            userProfile={{
              userProfileId: customerId,
              displayName: customerName,
              roleType: 'Customer',
              status: 'Active',
              phone: customerList.find(c => c.id === customerId)?.phone || '',
              createdAt: customerList.find(c => c.id === customerId)?.createdAt,
              updatedAt: new Date().toISOString()
            }}
            entityId={customerId}
            userId={customerId}
          />
        </div>

        <main className="flex-1 p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            {!customerId && (
              <div className="bg-cream-50 border border-grey-stroke rounded-xl p-6 text-center">
                <p className="text-body-medium text-charcoal-500">
                  Please select a customer profile to view your dashboard.
                </p>
              </div>
            )}

            {customerId && loading && (
              <div className="bg-grey-200 rounded-lg p-6 shadow-soft-lift text-center border border-grey-stroke">
                <p className="text-body-medium text-charcoal-400">Loading your dashboard...</p>
              </div>
            )}

            {customerId && error && !loading && (
              <div className="bg-error-bg border-l-4 border-error-btn p-4 rounded shadow-soft-lift">
                <p className="text-body-medium text-error-text">{error}</p>
              </div>
            )}

            {customerId && !loading && !error && (
            <>
                {/* Active Orders Carousel */}
                    {activeOrders.length > 0 && (
                    <section className="mb-8 relative">
                    {/* Left Arrow - Outside card */}
                    {activeOrders.length > 1 && (
                        <button
                        onClick={() => setActiveOrderIndex((prev) => (prev - 1 + activeOrders.length) % activeOrders.length)}
                        className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white hover:bg-cream-50 rounded-full flex items-center justify-center transition-all shadow-lg border-2 border-grey-stroke"
                        >
                        <Icon.CaretLeft size={24} weight="bold" className="text-sage-600" />
                        </button>
                    )}

                    {/* Right Arrow - Outside card */}
                    {activeOrders.length > 1 && (
                        <button
                        onClick={() => setActiveOrderIndex((prev) => (prev + 1) % activeOrders.length)}
                        className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white hover:bg-cream-50 rounded-full flex items-center justify-center transition-all shadow-lg border-2 border-grey-stroke"
                        >
                        <Icon.CaretRight size={24} weight="bold" className="text-sage-600" />
                        </button>
                    )}

                    {/* Cards Container with Scroll Animation */}
                    <div className="overflow-hidden px-16 py-2">
                        <div 
                        className="flex transition-transform duration-500 ease-out"
                        style={{ transform: `translateX(-${activeOrderIndex * 100}%)` }}
                        >
                        {activeOrders.map((order, index) => (
                            <div 
                            key={order.id}
                            className="w-full flex-shrink-0"
                            >
                            <div 
                                onClick={() => {
                                setShowOrderDetails(true);
                                // Update the displayed order when clicking a card
                                setActiveOrderIndex(index);
                                }}
                                className="bg-gradient-to-br from-sage-500 to-sage-600 rounded-2xl p-6 shadow-2xl cursor-pointer hover:shadow-3xl transition-all transform hover:scale-[1.02] border-2 border-sage-700 mx-2"
                            >
                                <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-3">
                                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                                        <Icon.Package size={24} weight="fill" className="text-white" />
                                    </div>
                                    <div>
                                        <p className="text-white/80 text-sm font-medium">Active Order</p>
                                        <h3 className="text-white text-2xl font-bold">Order #{order.id}</h3>
                                    </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-3 gap-4 text-white/90">
                                    <div>
                                        <p className="text-xs text-white/70">Store</p>
                                        <p className="font-semibold text-sm truncate">{order.sellerName}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-white/70">Status</p>
                                        <p className="font-semibold text-sm">{order.status}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-white/70">Total</p>
                                        <p className="font-semibold text-sm">{formatCurrency(order.totalAmount)}</p>
                                    </div>
                                    </div>
                                </div>
                                
                                <div className="text-white">
                                    <Icon.CaretRight size={32} weight="bold" />
                                </div>
                                </div>
                                
                                <div className="mt-4 pt-4 border-t border-white/20">
                                <p className="text-white/80 text-sm text-center">
                                    👆 Click to track your order
                                </p>
                                </div>
                            </div>
                            </div>
                        ))}
                        </div>
                    </div>

                    {/* Dots Indicator */}
                    {activeOrders.length > 1 && (
                        <div className="flex justify-center gap-2 mt-4">
                        {activeOrders.map((_, index) => (
                            <button
                            key={index}
                            onClick={() => setActiveOrderIndex(index)}
                            className={`h-2 rounded-full transition-all ${
                                activeOrderIndex === index ? 'bg-sage-500 w-8' : 'bg-grey-stroke w-2 hover:bg-grey-400'
                            }`}
                            />
                        ))}
                        </div>
                    )}
                    </section>
                    )}
                {/* Quick Actions */}
                <section className="mb-8">
                <div className="grid grid-cols-2 gap-4">
                    <button
                    onClick={() => window.location.href = '/mainStore'}
                    className="bg-white hover:bg-grey-100 border-2 border-grey-stroke rounded-xl p-6 transition-all flex items-center gap-4 group"
                    >
                    <div className="w-12 h-12 bg-sage-100 rounded-full flex items-center justify-center group-hover:bg-sage-200 transition-colors">
                        <Icon.Storefront size={24} className="text-sage-600" />
                    </div>
                    <div className="text-left">
                        <p className="font-bold text-charcoal-700 text-lg">Browse Stores</p>
                        <p className="text-sm text-charcoal-500">Discover new favorites</p>
                    </div>
                    </button>
                    
                    <button
                    onClick={() => navigate('orders')}
                    className="bg-white hover:bg-grey-100 border-2 border-grey-stroke rounded-xl p-6 transition-all flex items-center gap-4 group"
                    >
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                        <Icon.ClockCounterClockwise size={24} className="text-blue-600" />
                    </div>
                    <div className="text-left">
                        <p className="font-bold text-charcoal-700 text-lg">Order History</p>
                        <p className="text-sm text-charcoal-500">View all past orders</p>
                    </div>
                    </button>
                </div>
                </section>

                {/* Overview Cards */}
                <section className="space-y-4 mb-8">
                <h2 className="text-card-h2 text-charcoal-600">Your Overview</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <AnalyticsCard
                    title="Total Orders"
                    metrics={[{ value: metrics.totalOrders, label: "All time" }]}
                    />
                    <AnalyticsCard
                    title="Active Orders"
                    metrics={[{ value: metrics.activeOrders, label: "In progress" }]}
                    />
                    <AnalyticsCard
                    title="Total Spent"
                    metrics={[{ value: formatCurrency(metrics.totalSpent), label: "All time" }]}
                    />
                </div>
                </section>

                {/* Favorite Stores */}
                {favoriteStores.length > 0 && (
                <section className="mb-8">
                    <h2 className="text-card-h2 text-charcoal-600 mb-4">Your Favorite Stores</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {favoriteStores.map((store, index) => (
                        <div key={store.name} className="bg-white rounded-lg p-4 border-2 border-grey-stroke hover:border-sage-500 transition-all">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-sage-100 rounded-full flex items-center justify-center">
                            <span className="text-2xl">{index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                            <p className="font-bold text-charcoal-700 truncate">{store.name}</p>
                            <p className="text-sm text-charcoal-500">{store.count} order{store.count !== 1 ? 's' : ''}</p>
                            </div>
                        </div>
                        </div>
                    ))}
                    </div>
                </section>
                )}

                {/* Past Orders */}
                {pastOrders.length > 0 && (
                <section className="bg-grey-200 rounded-lg p-6 shadow-soft-lift border border-grey-stroke space-y-4 mb-8">
                    <div className="flex items-center justify-between">
                    <h2 className="text-card-h2 text-charcoal-600">Past Orders</h2>
                    <button
                        type="button"
                        className="text-sm font-medium text-sage-600 hover:text-sage-700 underline"
                        onClick={() => navigate("orders")}
                    >
                        View all
                    </button>
                    </div>

                    <Table>
                    <TableHeader columns={["Order #", "Store", "Status", "Total", "Date"]} />
                    <TableBody>
                        {pastOrders.map((order) => (
                        <TableRow
                            key={order.id}
                            data={[
                            `#${order.id}`,
                            order.sellerName || "—",
                            <StatusChip variant={getStatusVariant(order.status)}>
                                {order.status || "Unknown"}
                            </StatusChip>,
                            formatCurrency(order.totalAmount || 0),
                            formatDate(order.createdAt),
                            ]}
                        />
                        ))}
                    </TableBody>
                    </Table>
                </section>
                )}

                {/* Recent Orders */}
                <section className="bg-grey-200 rounded-lg p-6 shadow-soft-lift border border-grey-stroke space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-card-h2 text-charcoal-600">Recent Activity</h2>
                    <button
                    type="button"
                    className="text-sm font-medium text-sage-600 hover:text-sage-700 underline"
                    onClick={() => navigate("orders")}
                    >
                    View all
                    </button>
                </div>

                {recentOrders.length === 0 ? (
                    <div className="text-center py-8">
                    <Icon.Package size={48} className="mx-auto text-charcoal-300 mb-3" />
                    <p className="text-body-regular text-charcoal-400 mb-4">No orders yet</p>
                    <button
                        onClick={() => window.location.href = '/mainStore'}
                        className="bg-sage-500 hover:bg-sage-600 text-white px-6 py-2 rounded-lg font-semibold transition-all"
                    >
                        Start Shopping
                    </button>
                    </div>
                ) : (
                    <Table>
                    <TableHeader columns={["Order #", "Store", "Status", "Total", "Date", "Action"]} />
                    <TableBody>
                        {recentOrders.map((order) => (
                        <TableRow
                            key={order.id}
                            data={[
                            `#${order.id}`,
                            order.sellerName || "—",
                            <StatusChip variant={getStatusVariant(order.status)}>
                                {order.status || "Unknown"}
                            </StatusChip>,
                            formatCurrency(order.totalAmount || 0),
                            formatDate(order.createdAt),
                            ]}
                            actions={
                            <CRUDButton variant="neutral" onClick={() => openOrderModal(order)}>
                                View Details
                            </CRUDButton>
                            }
                        />
                        ))}
                    </TableBody>
                    </Table>
                )}
                </section>
            </>
            )}
          </div>
        </main>
      </div>
      {/* OrderDetails Modal */}
        {showOrderDetails && currentActiveOrder && (
        <OrderDetails 
            order={currentActiveOrder} 
            onClose={() => {
            setShowOrderDetails(false);
            }} 
        />
        )}
    </div>
  );
};

export default CustomerDashboard;
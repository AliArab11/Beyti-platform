import React, { useEffect, useMemo, useState } from "react";
import PageHeader from "../../components/PageHeader";
import SidebarProfile from "../../components/SidebarProfile";
import NavigationButton from "../../components/NavigationButton";
import AnalyticsCard from "../../components/AnalyticsCard";
import StatusChip from "../../components/StatusChip";
import CRUDButton from "../../components/CRUDButton";
import { Table, TableHeader, TableBody, TableRow } from "../../components/Table";

import { getSellerOrders, getSellers } from "../../services/api";
import Orders from "./Components/Orders"; 
import Analytics from "./Components/Analytics";
import Products from "./Components/Products";
import Reviews from "./Components/Reviews";

import './Components/modalAnimations.css';

import { Outlet, useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";

import * as Icon from "@phosphor-icons/react";





// ---------- Helpers ----------
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
  if (s === "completed") return "success";
  if (s === "cancelled") return "error";
  return "neutral";
};

const getPaymentVariant = (status) => {
  const s = status?.toLowerCase();
  if (!s) return "neutral";
  if (s === "paid") return "success";
  if (s === "pending") return "danger";
  if (s === "failed") return "error";
  return "neutral";
};

// ---------- Order Details Modal (Option A - Centered) ----------
const OrderDetailsModal = ({ order, onClose, onOrderUpdated }) => {
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [localOrder, setLocalOrder] = useState(order);

  // derived flags
  const status = (localOrder.status || "").toLowerCase();
  const isPlaced = status === "placed";
  const isAccepted = status === "accepted";
  const isPreparing = status === "preparing";
  const isReadyForPickup = status === "ready for pickup";
  const isCompleted = status === "completed" || status === "cancelled";

  const isPickup = localOrder.fulfillmentType === "Pickup";
  const isDelivery = localOrder.fulfillmentType === "Delivery";

  const baseUrl = "https://localhost:7062/api/Orders";

  const applyUpdate = (newStatus) => {
    const updated = { ...localOrder, status: newStatus };
    setLocalOrder(updated);
    if (onOrderUpdated) onOrderUpdated(updated);
  };

  const handleSellerResponse = async (newStatus) => {
    setActionLoading(true);
    setActionError(null);
    try {
      const res = await fetch(`${baseUrl}/${localOrder.id}/seller-response`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          Status: newStatus,
          SellerNote: null,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to update order");
      }

      applyUpdate(newStatus);
    } catch (err) {
      console.error(err);
      setActionError(err.message || "Failed to update order");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAdvanceStatus = async () => {
    let nextStatus = null;

    if (isAccepted) nextStatus = "Preparing";
    else if (isPreparing) nextStatus = "Ready for Pickup";
    else if (isReadyForPickup && isPickup) nextStatus = "Completed";
    else return;

    setActionLoading(true);
    setActionError(null);
    try {
      const res = await fetch(
        `${baseUrl}/${localOrder.id}/update-seller-status`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            Status: nextStatus,
          }),
        }
      );

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to update order status");
      }

      applyUpdate(nextStatus);
    } catch (err) {
      console.error(err);
      setActionError(err.message || "Failed to update order status");
    } finally {
      setActionLoading(false);
    }
  };

  const renderFooterButtons = () => {
    if (isCompleted) {
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

    if (isPlaced) {
      return (
        <div className="flex flex-col md:flex-row gap-3">
          <button
            type="button"
            disabled={actionLoading}
            onClick={() => handleSellerResponse("Accepted")}
            className="flex-1 bg-sage-500 hover:bg-sage-600 disabled:bg-sage-300 text-cream-50 py-2.5 rounded-lg font-semibold"
          >
            {actionLoading ? "Updating..." : "✓ Accept Order"}
          </button>
          <button
            type="button"
            disabled={actionLoading}
            onClick={() => handleSellerResponse("Cancelled")}
            className="flex-1 bg-error-btn hover:bg-error-btn/90 disabled:bg-error-btn/60 text-cream-50 py-2.5 rounded-lg font-semibold"
          >
            {actionLoading ? "Updating..." : "✕ Decline Order"}
          </button>
        </div>
      );
    }

    if (isAccepted || isPreparing || (isReadyForPickup && isPickup)) {
      let label = "";
      if (isAccepted) label = "Start Preparing";
      else if (isPreparing) label = "Mark Ready for Pickup";
      else if (isReadyForPickup && isPickup) label = "Mark Completed";

      return (
        <div className="flex flex-col md:flex-row gap-3">
          <button
            type="button"
            disabled={actionLoading}
            onClick={handleAdvanceStatus}
            className="flex-1 bg-sage-500 hover:bg-sage-600 disabled:bg-sage-300 text-cream-50 py-2.5 rounded-lg font-semibold"
          >
            {actionLoading ? "Updating..." : `→ ${label}`}
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

    // fallback
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

  if (!localOrder) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm modal-backdrop-enter">
      <div className="bg-cream-50 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col border border-grey-stroke modal-content-enter">
        {/* Header */}
        <div className="px-6 py-4 border-b border-grey-stroke flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-charcoal-700">
              Order #{localOrder.id}
            </h2>
            <p className="text-sm text-charcoal-400">
              Placed on {formatDate(localOrder.createdAt)}
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
          {/* Status + Payment row */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-1">
              <p className="text-xs text-charcoal-400 uppercase tracking-wide">
                Status
              </p>
              <StatusChip variant={getStatusVariant(localOrder.status)}>
                {localOrder.status || "Unknown"}
              </StatusChip>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-charcoal-400 uppercase tracking-wide">
                Fulfillment
              </p>
              <span className="inline-flex px-3 py-1 rounded-full text-xs font-medium bg-grey-200 text-charcoal-600">
                {localOrder.fulfillmentType || "N/A"}
              </span>
            </div>
          </div>

          {/* Customer & Store info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-grey-100 rounded-xl p-4 border border-grey-stroke">
            <div>
              <p className="text-xs text-charcoal-400 mb-1 uppercase tracking-wide">
                Customer
              </p>
              <p className="text-sm font-semibold text-charcoal-700">
                {localOrder.customerName || "N/A"}
              </p>
            </div>
            <div>
              <p className="text-xs text-charcoal-400 mb-1 uppercase tracking-wide">
                Store
              </p>
              <p className="text-sm font-semibold text-charcoal-700">
                {localOrder.sellerName || "N/A"}
              </p>
            </div>
            <div>
              <p className="text-xs text-charcoal-400 mb-1 uppercase tracking-wide">
                Order Total
              </p>
              <p className="text-lg font-semibold text-charcoal-800">
                {formatCurrency(localOrder.totalAmount || 0)}
              </p>
            </div>
            <div>
              <p className="text-xs text-charcoal-400 mb-1 uppercase tracking-wide">
                Delivery Fee
              </p>
              <p className="text-sm font-semibold text-charcoal-700">
                {formatCurrency(localOrder.deliveryFee || 0)}
              </p>
            </div>
          </div>

          {/* Items */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-charcoal-700">
                Order Items
              </h3>
              <p className="text-xs text-charcoal-400">
                {localOrder.orderItems?.length || 0} item
                {localOrder.orderItems?.length === 1 ? "" : "s"}
              </p>
            </div>
            {localOrder.orderItems && localOrder.orderItems.length > 0 ? (
              <div className="space-y-2">
                {localOrder.orderItems.map((item) => (
                  <div
                    key={item.id}
                    className="bg-cream-50 border border-grey-stroke rounded-lg px-3 py-2 flex items-center justify-between"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-charcoal-700">
                        {item.productName || "Product"}
                      </p>
                      <p className="text-xs text-charcoal-400">
                        SKU: {item.variantSKU || "N/A"} • Qty: {item.qty}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-charcoal-400">
                        Unit: {formatCurrency(item.unitPrice || 0)}
                      </p>
                      <p className="text-sm font-semibold text-charcoal-800">
                        {formatCurrency(item.lineTotal || 0)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-charcoal-400">
                No items found for this order.
              </p>
            )}
          </div>

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

// ---------- Main Component ----------
const SellerDashboard = () => {

    const getPageTitle = () => {
    if (location.pathname.includes("/seller-dashboard/orders")) {
      return "Order Management";
    } else if (location.pathname.includes("/seller-dashboard/products")) {
      return "Product Management";
    } else if (location.pathname.includes("/seller-dashboard/analytics")) {
      return "Analytics & Insights";
    } else if (location.pathname.includes("/seller-dashboard/reviews")) {
      return "Customer Reviews";
    } else {
      return "Seller Dashboard";
    }
  };


  const navigate = useNavigate();
  const location = useLocation();
  
  const [sellerId, setSellerId] = useState(null);
  const [sellerName, setSellerName] = useState("My Store");

  const [sellerList, setSellerList] = useState([]);
  const [selectModalOpen, setSelectModalOpen] = useState(true);

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [searchRecent, setSearchRecent] = useState("");

  // order modal state
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderModalOpen, setOrderModalOpen] = useState(false);

  // Disable page scroll when modals are open
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

  const openOrderModal = (order) => {
    setSelectedOrder(order);
    setOrderModalOpen(true);
  };

  const closeOrderModal = () => {
    setOrderModalOpen(false);
    setSelectedOrder(null);
  };

  const handleOrderUpdated = (updatedOrder) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === updatedOrder.id ? { ...o, ...updatedOrder } : o))
    );
    // also keep selectedOrder in sync so modal shows new status instantly
    setSelectedOrder((prev) =>
      prev && prev.id === updatedOrder.id ? { ...prev, ...updatedOrder } : prev
    );
  };

  // Load sellers for modal
  useEffect(() => {
    const loadSellers = async () => {
      try {
        const data = await getSellers();
        setSellerList(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to load sellers", err);
      }
    };

    loadSellers();
  }, []);

  // Load seller orders after selecting sellerId
  useEffect(() => {
    if (!sellerId) return;

    const loadOrders = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getSellerOrders(sellerId);
        setOrders(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message || "Failed to load orders");
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, [sellerId]);

  // ---------- Derived metrics & views ----------
  const { metrics, recentOrders, topProducts, analyticsPreview } = useMemo(() => {
    if (!orders || orders.length === 0) {
      return {
        metrics: {
          totalOrders: 0,
          pendingOrders: 0,
          activeProducts: 0,
          totalRevenue: 0,
        },
        recentOrders: [],
        topProducts: [],
        analyticsPreview: {
          last7DaysRevenue: 0,
          last7DaysOrders: 0,
        },
      };
    }

    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);

    let totalRevenue = 0;
    let pendingOrders = 0;
    let last7DaysRevenue = 0;
    let last7DaysOrders = 0;

    const productMap = new Map();

    orders.forEach((order) => {
      const amount = order.totalAmount || 0;
      totalRevenue += amount;

      const status = order.status?.toLowerCase();
      if (status === "placed" || status === "pending") {
        pendingOrders += 1;
      }

      const created = new Date(order.createdAt);
      if (!Number.isNaN(created.getTime()) && created >= sevenDaysAgo) {
        last7DaysRevenue += amount;
        last7DaysOrders += 1;
      }

      (order.orderItems || []).forEach((item) => {
        const key = item.productId || item.productName || "unknown";
        if (!productMap.has(key)) {
          productMap.set(key, {
            productId: item.productId,
            productName: item.productName || "Unnamed Product",
            productImage: item.productImage || item.imageUrl || null,
            totalOrders: 0,
            totalQty: 0,
          });
        }
        const record = productMap.get(key);
        record.totalOrders += 1;
        record.totalQty += item.qty || 0;
      });
    });

    const totalOrders = orders.length;
    const activeProducts = productMap.size;

    const productsArr = Array.from(productMap.values()).sort(
      (a, b) => b.totalOrders - a.totalOrders
    );
    const topProducts = productsArr.slice(0, 3);

    const recentOrders = [...orders]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);

    return {
      metrics: {
        totalOrders,
        pendingOrders,
        activeProducts,
        totalRevenue,
      },
      recentOrders,
      topProducts,
      analyticsPreview: {
        last7DaysRevenue,
        last7DaysOrders,
      },
    };
  }, [orders]);

  const filteredRecentOrders = useMemo(() => {
    if (!searchRecent.trim()) return recentOrders;
    const q = searchRecent.toLowerCase();
    return recentOrders.filter((o) => {
      return (
        o.id?.toString().includes(q) ||
        o.customerName?.toLowerCase().includes(q) ||
        o.status?.toLowerCase().includes(q)
      );
    });
  }, [recentOrders, searchRecent]);

  // ---------------------------------------------------------------------
  // SELLER SELECTION MODAL
  // ---------------------------------------------------------------------
  const SellerSelectModal = () => {
    if (!selectModalOpen) return null;

    return (
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-40 p-4 modal-backdrop-enter">
        <div className="bg-cream-50 rounded-2xl shadow-2xl w-full max-w-md p-6 border border-grey-stroke modal-content-enter">
          <h2 className="text-2xl font-semibold text-charcoal-700 mb-2">
            Select a Store
          </h2>

          <p className="text-body-regular text-charcoal-400 mb-4">
            Choose which store’s dashboard you want to view.
          </p>

          <select
            className="w-full border border-grey-stroke rounded-lg p-3 mb-6 bg-white focus:outline-none focus:ring-2 focus:ring-sage-400"
            defaultValue=""
            onChange={(e) => {
              const id = e.target.value;
              if (id) {
                const numericId = parseInt(id, 10);
                const selected = sellerList.find((s) => s.id === numericId);
                setSellerName(selected?.storeName || "My Store");
                setSellerId(numericId);
                setSelectModalOpen(false);
              }
            }}
          >
            <option value="">-- Select Store --</option>
            {sellerList.map((seller) => (
              <option key={seller.id} value={seller.id}>
                {seller.storeName || seller.name || `Store #${seller.id}`}
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

  

  // -----------------------------------------
  // MAIN DASHBOARD LAYOUT
  // -----------------------------------------
  return (
    <div className="min-h-screen bg-cream-50 flex">
      <SellerSelectModal />
      {orderModalOpen && selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={closeOrderModal}
          onOrderUpdated={handleOrderUpdated}
        />
      )}

      {/* Sidebar */}
      <aside className="w-64 bg-sage-500 flex flex-col fixed h-screen transition-colors border-r border-sage-700">
        <div className="p-6 border-b border-sage-700">
          <h1 className="text-display-h1 text-cream-200">Beyti</h1>
          <p className="text-label-medium text-cream-100 mt-1">Seller Portal</p>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {/* Dashboard */}
          <NavigationButton
            selected={location.pathname.includes("/seller-dashboard/dashboard") || location.pathname === "/seller-dashboard"}
            onClick={() => navigate("dashboard")}
            icon={
              <Icon.House
                size={20}
                weight={(location.pathname.includes("/seller-dashboard/dashboard") || location.pathname === "/seller-dashboard") ? "fill" : "regular"}
              />
            }
          >
            Dashboard
          </NavigationButton>

          {/* Orders */}
          <NavigationButton
            selected={location.pathname.includes("/seller-dashboard/orders")}
            onClick={() => navigate("orders")}
            icon={
              <Icon.Receipt
                size={20}
                weight={location.pathname.includes("/seller-dashboard/orders") ? "fill" : "regular"}
              />
            }
          >
            Orders
          </NavigationButton>

          {/* Products */}
          <NavigationButton
            selected={location.pathname.includes("/seller-dashboard/products")}
            onClick={() => navigate("products")}
            icon={
              <Icon.Package
                size={20}
                weight={location.pathname.includes("/seller-dashboard/products") ? "fill" : "regular"}
              />
            }
          >
            Products
          </NavigationButton>

          {/* Analytics */}
          <NavigationButton
            selected={location.pathname.includes("/seller-dashboard/analytics")}
            onClick={() => navigate("analytics")}
            icon={
              <Icon.ChartBar
                size={20}
                weight={location.pathname.includes("/seller-dashboard/analytics") ? "fill" : "regular"}
              />
            }
          >
            Analytics
          </NavigationButton>

          {/* Reviews */}
          <NavigationButton
            selected={location.pathname.includes("/seller-dashboard/reviews")}
            onClick={() => navigate("reviews")}
            icon={
              <Icon.Star
                size={20}
                weight={location.pathname.includes("/seller-dashboard/reviews") ? "fill" : "regular"}
              />
            }
          >
            Reviews
          </NavigationButton>
        </nav>

        <div className="border-t border-sage-700 p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-10 h-10 rounded-full bg-sage-700 flex items-center justify-center flex-shrink-0">
                <Icon.User size={20} weight="fill" className="text-cream-200" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-body-regular text-cream-200 truncate">{sellerName}</p>
                <p className="text-label-medium text-cream-100 truncate">Seller</p>
              </div>
            </div>
            <button className="flex-shrink-0 p-1 hover:bg-sage-700 rounded transition-colors">
              <Icon.CaretDown size={16} className="text-cream-200" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 ml-64 flex flex-col">
        <div className="border-b border-grey-stroke bg-grey-200">
         <PageHeader
          title={getPageTitle()}
          notificationCount={metrics.pendingOrders || 0}
          userName={sellerName}
          userRole="Seller"
          userProfile={{
            userProfileId: sellerId,
            displayName: sellerName,
            roleType: 'Seller',
            status: 'Active',
            phone: sellerList.find(s => s.id === sellerId)?.phone || '',
            address: sellerList.find(s => s.id === sellerId)?.address || '',
            createdAt: sellerList.find(s => s.id === sellerId)?.createdAt,
            updatedAt: new Date().toISOString()
          }}
          entityId={sellerId}
          userId={sellerId}
          onProfileUpdate={async (updates) => {
            try {
              console.log('Profile updates:', updates);
              const sellers = await getSellers();
              const updatedSeller = sellers.find(s => s.id === sellerId);
              if (updatedSeller) {
                setSellerName(updatedSeller.storeName || sellerName);
              }
            } catch (error) {
              console.error('Error updating profile:', error);
              throw error;
            }
          }}
        />
        </div>

        <main className="flex-1 p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Message when no seller selected */}
            {!sellerId && (
              <div className="bg-cream-50 border border-grey-stroke rounded-xl p-6 text-center">
                <p className="text-body-medium text-charcoal-500">
                  Please select a store to view its dashboard.
                </p>
              </div>
            )}

            {/* Loading */}
            {sellerId && loading && (
              <div className="bg-grey-200 rounded-lg p-6 shadow-soft-lift text-center border border-grey-stroke">
                <p className="text-body-medium text-charcoal-400">
                  Loading your dashboard...
                </p>
              </div>
            )}

            {/* Error */}
            {sellerId && error && !loading && (
              <div className="bg-error-bg border-l-4 border-error-btn p-4 rounded shadow-soft-lift">
                <p className="text-body-medium text-error-text">{error}</p>
              </div>
            )}

             {/* DASHBOARD CONTENT */}
            {sellerId && !loading && !error && (
              <>
                {location.pathname === "/seller-dashboard" || location.pathname === "/seller-dashboard/dashboard" ? (
                <>
                {/* TOP METRIC CARDS */}
                <section className="space-y-4">
                  <h2 className="text-card-h2 text-charcoal-600">Overview</h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <AnalyticsCard
                      title="Total Orders"
                      metrics={[
                        {
                          value: metrics.totalOrders,
                          label: "All time",
                        },
                      ]}
                    />
                    <AnalyticsCard
                      title="Pending Orders"
                      metrics={[
                        {
                          value: metrics.pendingOrders,
                          label: "Awaiting action",
                        },
                      ]}
                    />
                    <AnalyticsCard
                      title="Active Products"
                      metrics={[
                        {
                          value: metrics.activeProducts,
                          label: "Listed in your shop",
                        },
                      ]}
                    />
                    <AnalyticsCard
                      title="Total Revenue"
                      metrics={[
                        {
                          value: formatCurrency(metrics.totalRevenue),
                          label: "All time",
                        },
                      ]}
                    />
                  </div>
                </section>

                {/* RECENT ORDERS + TOP PRODUCTS */}
                <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Recent Orders */}
                  <div className="lg:col-span-2 bg-grey-200 rounded-lg p-6 shadow-soft-lift border border-grey-stroke space-y-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <h2 className="text-card-h2 text-charcoal-600">
                          Recent Orders
                        </h2>
                        <p className="text-body-regular text-charcoal-400">
                          Last few orders placed in your shop.
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={searchRecent}
                          onChange={(e) => setSearchRecent(e.target.value)}
                          placeholder="Search orders..."
                          className="hidden md:block w-56 px-3 py-2 rounded-lg border border-grey-stroke bg-cream-50 text-sm focus:outline-none focus:ring-2 focus:ring-sage-400"
                        />
                        <button
                            type="button"
                            className="text-sm font-medium text-sage-600 hover:text-sage-700 underline cursor-pointer"
                            onClick={() => {
                              navigate("orders");
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                            >
                            View all
                            </button>
                      </div>
                    </div>

                    {filteredRecentOrders.length === 0 ? (
                      <p className="text-body-regular text-charcoal-400">
                        No recent orders yet.
                      </p>
                    ) : (
                      <Table>
                        <TableHeader
                          columns={[
                            "Order #",
                            "Customer",
                            "Status",
                            "Total",
                            "Date",
                            "Action",
                          ]}
                        />
                       <TableBody>
                        {filteredRecentOrders.map((order) => {
                            // Check if order is a new request (within last 30 minutes)
                            const status = order.status?.toLowerCase();
                            const isRequest = ["placed", "pending"].includes(status);
                            
                            let isNew = false;
                            if (isRequest) {
                            const orderTime = new Date(order.createdAt);
                            const now = new Date();
                            const diffMinutes = (now - orderTime) / (1000 * 60);
                            isNew = diffMinutes <= 100000;
                            }
                            
                            return (
                            <TableRow
                                key={order.id}
                                className={isNew ? "bg-danger-bg" : ""}
                                data={[
                                <div className="flex items-center gap-2" key={`id-${order.id}`}>
                                    {isNew && (
                                    <span className="flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-danger-btn opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-danger-btn"></span>
                                    </span>
                                    )}
                                    <span className={isNew ? "font-semibold text-danger-text" : ""}>
                                    #{order.id}
                                    </span>
                                </div>,
                                <span className={isNew ? "font-semibold" : ""}>
                                    {order.customerName || "—"}
                                </span>,
                                <StatusChip
                                    key={`status-${order.id}`}
                                    variant={getStatusVariant(order.status)}
                                >
                                    {order.status || "Unknown"}
                                </StatusChip>,
                                <span className={isNew ? "font-semibold" : ""}>
                                    {formatCurrency(order.totalAmount || 0)}
                                </span>,
                                formatDate(order.createdAt),
                                ]}
                                actions={
                                <CRUDButton
                                    variant={isNew ? "danger" : "neutral"}
                                    onClick={() => openOrderModal(order)}
                                >
                                    {isNew ? "Respond Now" : "View Details"}
                                </CRUDButton>
                                }
                            />
                            );
                        })}
                        </TableBody>
                      </Table>
                    )}
                  </div>

                                    {/* Top Products */}
                  <div className="bg-grey-200 rounded-lg p-6 shadow-soft-lift border border-grey-stroke space-y-4 flex flex-col">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-card-h2 text-charcoal-600">
                          Top Products
                        </h2>
                        <p className="text-body-regular text-charcoal-400">
                          Most ordered items in your store.
                        </p>
                      </div>
                      <button
                        type="button"
                        className="text-sm font-medium text-sage-600 hover:text-sage-700 underline cursor-pointer"
                        onClick={() => {
                          navigate("products");
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                      >
                        View all
                      </button>
                    </div>

                    {topProducts.length === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center text-center py-12 px-4">
                        {/* Icon */}
                        <div className="w-20 h-20 rounded-full bg-sage-100 flex items-center justify-center mb-6">
                          <Icon.Package size={40} className="text-sage-500" weight="duotone" />
                        </div>

                        {/* Text Content */}
                        <h3 className="text-card-h2 text-charcoal-600 mb-2">
                          Stock Your Shelves
                        </h3>
                        <p className="text-body-regular text-charcoal-400 mb-6 max-w-xs">
                          Your shop is looking a little empty. Add your first product to get ready for launch.
                        </p>

                        {/* CTA Button */}
                        <button
                          type="button"
                          onClick={() => {
                            navigate("products");
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="w-full max-w-xs bg-sage-500 hover:bg-sage-600 text-cream-50 py-3 px-6 rounded-lg font-semibold text-sm shadow-soft-lift transition-colors"
                        >
                          Add Your First Product
                        </button>
                      </div>
                    ) : (
                      <ul className="space-y-3">
                        {topProducts.map((product) => (
                          <li
                            key={product.productId || product.productName}
                            className="flex items-center justify-between bg-cream-50 rounded-lg px-3 py-2 border border-grey-stroke"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-grey-200 flex items-center justify-center overflow-hidden">
                                {product.productImage ? (
                                  <img
                                    src={product.productImage}
                                    alt={product.productName}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <span className="text-xs text-charcoal-400">
                                    No image
                                  </span>
                                )}
                              </div>
                              <div>
                                <p className="text-body-medium text-charcoal-600">
                                  {product.productName}
                                </p>
                                <p className="text-label-medium text-charcoal-400">
                                  {product.totalOrders} orders •{" "}
                                  {product.totalQty} items sold
                                </p>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </section>

                {/* ANALYTICS PREVIEW + QUICK ACTIONS */}
                <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Analytics preview */}
                  <div className="lg:col-span-2 bg-grey-200 rounded-lg p-6 shadow-soft-lift border border-grey-stroke space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-card-h2 text-charcoal-600">
                          Analytics Snapshot
                        </h2>
                        <p className="text-body-regular text-charcoal-400">
                          Quick look at your last 7 days.
                        </p>
                      </div>
                      <button
                        type="button"
                        className="text-sm font-medium text-sage-600 hover:text-sage-700 underline cursor-pointer"
                           onClick={() => {
                            navigate("analytics");
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                            
                            
                      >
                        View full analytics
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-cream-50 rounded-lg p-4 border border-grey-stroke">
                        <p className="text-label-medium text-charcoal-400 mb-1">
                          Revenue (Last 7 Days)
                        </p>
                        <p className="text-2xl font-semibold text-charcoal-700">
                          {formatCurrency(analyticsPreview.last7DaysRevenue)}
                        </p>
                      </div>

                      <div className="bg-cream-50 rounded-lg p-4 border border-grey-stroke">
                        <p className="text-label-medium text-charcoal-400 mb-1">
                          Orders (Last 7 Days)
                        </p>
                        <p className="text-2xl font-semibold text-charcoal-700">
                          {analyticsPreview.last7DaysOrders}
                        </p>
                      </div>
                    </div>

                    <p className="text-xs text-charcoal-400">
                      Tip: Use the full Analytics page to see trends, top
                      products, and more detailed charts.
                    </p>
                  </div>

                  {/* Quick actions */}
                  <div className="bg-grey-200 rounded-lg p-6 shadow-soft-lift border border-grey-stroke space-y-4">
                    <h2 className="text-card-h2 text-charcoal-600">
                      Quick Actions
                    </h2>
                    <p className="text-body-regular text-charcoal-400">
                      Common tasks you might want to do next.
                    </p>

                    <div className="space-y-3">
                      <button
                        type="button"
                        className="w-full py-2.5 rounded-full bg-sage-500 hover:bg-sage-600 text-cream-50 font-semibold text-sm shadow-soft-lift"
                        onClick={() => console.log("Add product")}
                      >
                        + Add Product
                      </button>
                      <button
                        type="button"
                        className="w-full py-2.5 rounded-full bg-sage-100 hover:bg-sage-200 text-sage-700 font-semibold text-sm"
                        onClick={() => console.log("View all orders")}
                      >
                        View All Orders
                      </button>
                      <button
                        type="button"
                        className="w-full py-2.5 rounded-full bg-grey-300 hover:bg-grey-400 text-charcoal-600 font-semibold text-sm"
                        onClick={() => console.log("Manage store")}
                      >
                        Manage Store
                      </button>
                    </div>
                  </div>
                </section>
              </>
                ) : location.pathname.includes("/seller-dashboard/orders") ? (
                    <Orders
                        sellerId={sellerId}
                        sellerName={sellerName}
                        onOpenOrderModal={openOrderModal}
                        orders={orders}
                        onOrderUpdate={handleOrderUpdated}
                    />
                    ) : location.pathname.includes("/seller-dashboard/products") ? (
                    <Products
                        sellerId={sellerId}
                        sellerName={sellerName}
                    />
                    ) : location.pathname.includes("/seller-dashboard/analytics") ? (
                    <Analytics
                        sellerId={sellerId}
                        sellerName={sellerName}
                        orders={orders}
                    />
                    ) : location.pathname.includes("/seller-dashboard/reviews") ? (
                    <Reviews sellerId={sellerId} sellerName={sellerName} />
                    ) : null}
            </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default SellerDashboard;

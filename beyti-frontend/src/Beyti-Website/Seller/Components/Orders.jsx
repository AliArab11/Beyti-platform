import React, { useEffect, useMemo, useState } from "react";
import AnalyticsCard from "../../../components/AnalyticsCard";
import StatusChip from "../../../components/StatusChip";
import CRUDButton from "../../../components/CRUDButton";
import { Table, TableHeader, TableBody, TableRow } from "../../../components/Table";

import { getSellerOrders } from "../../../services/api";

// STATUS → CHIP COLOR
const getStatusVariant = (status) => {
  const s = status?.toLowerCase();
  if (!s) return "neutral";
  if (["placed", "pending"].includes(s)) return "danger";
  if (["accepted", "preparing", "ready for pickup"].includes(s)) return "brand";
  if (s === "completed") return "success";
  if (s === "cancelled") return "error";
  return "neutral";
};

const formatDate = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatTime = (value) => {
  if (!value) return "";
  const d = new Date(value);
  return d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatCurrency = (value) => {
  if (!value && value !== 0) return "BHD 0.000";
  return `BHD ${Number(value).toFixed(3)}`;
};

const Orders = ({ sellerId, sellerName, onOpenOrderModal, orders: externalOrders, onOrderUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [sortBy, setSortBy] = useState("newest"); // newest, oldest, amount-high, amount-low
  const [searchQuery, setSearchQuery] = useState("");

  // Use external orders if provided, otherwise fetch
  useEffect(() => {
    if (externalOrders) {
      setOrders(externalOrders);
      return;
    }

    if (!sellerId) return;
    const load = async () => {
      setLoading(true);
      try {
        const data = await getSellerOrders(sellerId);
        setOrders(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [sellerId, externalOrders]);

  // METRICS
  const metrics = useMemo(() => {
    return {
      total: orders.length,
      currentRequests: orders.filter((o) =>
        ["placed", "pending"].includes(o.status?.toLowerCase())
      ).length,
      processing: orders.filter((o) =>
        ["accepted", "preparing", "ready for pickup"].includes(
          o.status?.toLowerCase()
        )
      ).length,
      completed: orders.filter((o) => o.status?.toLowerCase() === "completed")
        .length,
    };
  }, [orders]);

  // FILTERED & SORTED ORDERS
  const filteredOrders = useMemo(() => {
    // First filter by tab
    let filtered;
    switch (activeTab) {
      case "requests":
        filtered = orders.filter((o) =>
          ["placed", "pending"].includes(o.status?.toLowerCase())
        );
        break;
      case "processing":
        filtered = orders.filter((o) =>
          ["accepted", "preparing", "ready for pickup"].includes(
            o.status?.toLowerCase()
          )
        );
        break;
      case "completed":
        filtered = orders.filter((o) => o.status?.toLowerCase() === "completed");
        break;
      case "cancelled":
        filtered = orders.filter((o) => o.status?.toLowerCase() === "cancelled");
        break;
      default:
        filtered = [...orders];
    }

    // Then filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((o) => {
        return (
          o.id?.toString().includes(query) ||
          o.customerName?.toLowerCase().includes(query) ||
          o.status?.toLowerCase().includes(query)
        );
      });
    }

    // Then sort
    switch (sortBy) {
      case "oldest":
        return filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      case "amount-high":
        return filtered.sort((a, b) => (b.totalAmount || 0) - (a.totalAmount || 0));
      case "amount-low":
        return filtered.sort((a, b) => (a.totalAmount || 0) - (b.totalAmount || 0));
      case "newest":
      default:
        return filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
  }, [activeTab, orders, sortBy, searchQuery]);

  // Check if order is a new request (within last 30 minutes)
  const isNewRequest = (order) => {
    const status = order.status?.toLowerCase();
    if (!["placed", "pending"].includes(status)) return false;
    
    const orderTime = new Date(order.createdAt);
    const now = new Date();
    const diffMinutes = (now - orderTime) / (1000 * 60);
    return diffMinutes <= 30; // Highlight if placed in last 30 minutes
  };

  // TAB BUTTON
  const TabButton = ({ id, label, count, showCount }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`
        px-4 py-2 rounded-lg text-sm font-medium transition-colors relative
        ${
          activeTab === id
            ? "bg-sage-500 text-cream-50"
            : "bg-grey-200 text-charcoal-600 hover:bg-grey-300"
        }
      `}
    >
      {label}
      {showCount && count > 0 && (
        <span
          className={`
            ml-2 px-2 py-0.5 rounded-full text-xs font-semibold
            ${
              activeTab === id
                ? "bg-cream-50 text-sage-700"
                : "bg-sage-500 text-cream-50"
            }
          `}
        >
          {count}
        </span>
      )}
    </button>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">

      {/* CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <AnalyticsCard
          title="Total Orders"
          metrics={[{ value: metrics.total, label: "All orders" }]}
        />
        <AnalyticsCard
          title="Current Requests"
          metrics={[{ value: metrics.currentRequests, label: "Needs attention" }]}
        />
        <AnalyticsCard
          title="Processing"
          metrics={[{ value: metrics.processing, label: "In progress" }]}
        />
        <AnalyticsCard
          title="Completed"
          metrics={[{ value: metrics.completed, label: "Delivered" }]}
        />
      </div>

      {/* TABS */}
      <div className="flex gap-3 flex-wrap">
        <TabButton id="all" label="All Orders" />
        <TabButton id="requests" label="Current Requests" count={metrics.currentRequests} showCount />
        <TabButton id="processing" label="Processing" count={metrics.processing} showCount />
        <TabButton id="completed" label="Completed" />
        <TabButton id="cancelled" label="Cancelled" />
      </div>

      {/* NEW REQUESTS ALERT */}
      {metrics.currentRequests > 0 && activeTab === "all" && (
        <div className="bg-danger-bg border-l-4 border-danger-btn px-4 py-3 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg
              className="w-6 h-6 text-danger-text"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <p className="text-body-medium text-danger-text font-semibold">
                {metrics.currentRequests} New Order Request{metrics.currentRequests > 1 ? 's' : ''}
              </p>
              <p className="text-body-regular text-danger-text">
                {metrics.currentRequests === 1 ? 'This order requires' : 'These orders require'} your immediate attention
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab("requests")}
            className="px-4 py-2 bg-danger-btn hover:bg-danger-text text-cream-50 rounded-lg font-semibold text-sm transition-colors"
          >
            View Requests
          </button>
        </div>
      )}

      {/* SEARCH AND SORT */}
      <div className="flex items-center justify-between gap-4">
        {/* Search Bar */}
        <div className="flex-1 max-w-md relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by order #, customer name, or status..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-grey-stroke bg-cream-50 text-body-regular text-charcoal-600 placeholder:text-charcoal-400 focus:outline-none focus:ring-2 focus:ring-sage-400"
          />
        </div>

        {/* Sort Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-label-medium text-charcoal-400">SORT BY:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2.5 rounded-lg border border-grey-stroke bg-cream-50 text-body-regular text-charcoal-600 focus:outline-none focus:ring-2 focus:ring-sage-400"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="amount-high">Highest Amount</option>
            <option value="amount-low">Lowest Amount</option>
          </select>
        </div>
      </div>

      {/* TABLE */}
      {loading ? (
        <div className="bg-grey-200 p-6 rounded-lg border border-grey-stroke">
          <p className="text-charcoal-400 text-center">Loading orders...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-grey-200 p-8 rounded-lg border border-grey-stroke text-center">
          <svg
            className="w-16 h-16 mx-auto text-charcoal-400 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
          <p className="text-card-h2 text-charcoal-500 mb-2">No orders found</p>
          <p className="text-body-regular text-charcoal-400">
            {activeTab === "all"
              ? "You don't have any orders yet."
              : `No ${activeTab} orders at the moment.`}
          </p>
        </div>
      ) : (
        <div className="bg-grey-200 rounded-lg shadow-soft-lift border border-grey-stroke overflow-hidden">
          <Table>
            <TableHeader
              columns={[
                "Order #",
                "Customer",
                "Status",
                "Total",
                "Date & Time",
                "Action",
              ]}
            />
            <TableBody>
              {filteredOrders.map((order) => {
                const isNew = isNewRequest(order);
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
                        {order.customerName ?? "—"}
                      </span>,
                      <StatusChip
                        variant={getStatusVariant(order.status)}
                        key={`status-${order.id}`}
                      >
                        {order.status}
                      </StatusChip>,
                      <span className={isNew ? "font-semibold" : ""}>
                        {formatCurrency(order.totalAmount)}
                      </span>,
                      <div key={`date-${order.id}`}>
                        <div className={isNew ? "font-semibold" : ""}>
                          {formatDate(order.createdAt)}
                        </div>
                        <div className="text-xs text-charcoal-400">
                          {formatTime(order.createdAt)}
                        </div>
                      </div>,
                    ]}
                    actions={
                      <CRUDButton
                        variant={isNew ? "danger" : "neutral"}
                        onClick={() => onOpenOrderModal && onOpenOrderModal(order)}
                      >
                        {isNew ? "Respond Now" : "View Details"}
                      </CRUDButton>
                    }
                  />
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* FOOTER INFO */}
      {filteredOrders.length > 0 && (
        <div className="text-center text-body-regular text-charcoal-400">
          Showing {filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''}
          {activeTab !== "all" && ` in ${activeTab}`}
        </div>
      )}
    </div>
  );
};

export default Orders;
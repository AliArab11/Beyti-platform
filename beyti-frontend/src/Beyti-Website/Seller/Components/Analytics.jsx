import React, { useMemo, useState } from "react";
import AnalyticsCard from "../../../components/AnalyticsCard";
import StatusChip from "../../../components/StatusChip";

const formatCurrency = (value) => {
  if (!value && value !== 0) return "BHD 0.000";
  return `BHD ${Number(value).toFixed(3)}`;
};

const formatDate = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
  });
};

const Analytics = ({ sellerId, sellerName, orders = [] }) => {
  const [timeRange, setTimeRange] = useState("30");

  const analytics = useMemo(() => {
    if (!orders || orders.length === 0) {
      return {
        overview: {
          totalRevenue: 0,
          totalOrders: 0,
          avgOrderValue: 0,
          completionRate: 0,
        },
        ordersByStatus: [],
        revenueByDay: [],
        topProducts: [],
        topCustomers: [],
        fulfillmentBreakdown: { pickup: 0, delivery: 0 },
      };
    }

    const now = new Date();
    const daysAgo = new Date(now);
    daysAgo.setDate(now.getDate() - parseInt(timeRange));

    const filteredOrders = orders.filter((order) => {
      const orderDate = new Date(order.createdAt);
      return orderDate >= daysAgo;
    });

    // Overview metrics
    const totalRevenue = filteredOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const totalOrders = filteredOrders.length;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const completedOrders = filteredOrders.filter(o => o.status?.toLowerCase() === "completed").length;
    const completionRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;

    // Orders by status
    const statusMap = new Map();
    filteredOrders.forEach((order) => {
      const status = order.status || "Unknown";
      if (!statusMap.has(status)) {
        statusMap.set(status, { status, count: 0, revenue: 0 });
      }
      const record = statusMap.get(status);
      record.count += 1;
      record.revenue += order.totalAmount || 0;
    });
    const ordersByStatus = Array.from(statusMap.values()).sort((a, b) => b.count - a.count);

    // Revenue by day
    const dayMap = new Map();
    filteredOrders.forEach((order) => {
      const date = new Date(order.createdAt);
      const dayKey = date.toISOString().split('T')[0];
      if (!dayMap.has(dayKey)) {
        dayMap.set(dayKey, { date: dayKey, revenue: 0, orders: 0 });
      }
      const record = dayMap.get(dayKey);
      record.revenue += order.totalAmount || 0;
      record.orders += 1;
    });
    const revenueByDay = Array.from(dayMap.values())
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(-14);

    // Top products
    const productMap = new Map();
    filteredOrders.forEach((order) => {
      (order.orderItems || []).forEach((item) => {
        const key = item.productId || item.productName || "unknown";
        if (!productMap.has(key)) {
          productMap.set(key, {
            productId: item.productId,
            productName: item.productName || "Unnamed Product",
            totalOrders: 0,
            totalQty: 0,
            totalRevenue: 0,
          });
        }
        const record = productMap.get(key);
        record.totalOrders += 1;
        record.totalQty += item.qty || 0;
        record.totalRevenue += item.lineTotal || 0;
      });
    });
    const topProducts = Array.from(productMap.values())
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 5);

    // Top customers
    const customerMap = new Map();
    filteredOrders.forEach((order) => {
      const customer = order.customerName || "Unknown";
      if (!customerMap.has(customer)) {
        customerMap.set(customer, { name: customer, orders: 0, revenue: 0 });
      }
      const record = customerMap.get(customer);
      record.orders += 1;
      record.revenue += order.totalAmount || 0;
    });
    const topCustomers = Array.from(customerMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Fulfillment breakdown
    const pickup = filteredOrders.filter(o => o.fulfillmentType === "Pickup").length;
    const delivery = filteredOrders.filter(o => o.fulfillmentType === "Delivery").length;
    const fulfillmentBreakdown = { pickup, delivery };

    return {
      overview: { totalRevenue, totalOrders, avgOrderValue, completionRate },
      ordersByStatus,
      revenueByDay,
      topProducts,
      topCustomers,
      fulfillmentBreakdown,
    };
  }, [orders, timeRange]);

  const getStatusVariant = (status) => {
    const s = status?.toLowerCase();
    if (!s) return "neutral";
    if (["placed", "pending"].includes(s)) return "danger";
    if (["accepted", "preparing", "ready for pickup"].includes(s)) return "brand";
    if (s === "completed") return "success";
    if (s === "cancelled") return "error";
    return "neutral";
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-end gap-2">

        <div className="flex items-center gap-2">
          <span className="text-label-medium text-charcoal-400">TIME RANGE:</span>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2.5 rounded-lg border border-grey-stroke bg-cream-50 text-body-regular text-charcoal-600 focus:outline-none focus:ring-2 focus:ring-sage-400 cursor-pointer"
          >
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
            <option value="90">Last 90 Days</option>
            <option value="365">Last Year</option>
          </select>
        </div>
      </div>

      {/* OVERVIEW CARDS */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <AnalyticsCard
          title="Total Revenue"
          metrics={[{ value: formatCurrency(analytics.overview.totalRevenue), label: `Last ${timeRange} days` }]}
        />
        <AnalyticsCard
          title="Total Orders"
          metrics={[{ value: analytics.overview.totalOrders, label: `Last ${timeRange} days` }]}
        />
        <AnalyticsCard
          title="Avg Order Value"
          metrics={[{ value: formatCurrency(analytics.overview.avgOrderValue), label: "Per order" }]}
        />
        <AnalyticsCard
          title="Completion Rate"
          metrics={[{ value: `${analytics.overview.completionRate.toFixed(1)}%`, label: "Orders completed" }]}
        />
      </section>

      {/* REVENUE TREND */}
      <section className="bg-grey-200 rounded-lg p-6 shadow-soft-lift border border-grey-stroke">
        <div className="mb-6">
          <h2 className="text-card-h2 text-charcoal-600">Revenue Trend</h2>
          <p className="text-body-regular text-charcoal-400 mt-1">
            Daily revenue over the last 14 days
          </p>
        </div>
        {analytics.revenueByDay.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-body-regular text-charcoal-400">No data available for this period</p>
          </div>
        ) : (
          <div className="space-y-2">
            {analytics.revenueByDay.map((day) => {
              const maxRevenue = Math.max(...analytics.revenueByDay.map(d => d.revenue));
              const widthPercent = maxRevenue > 0 ? (day.revenue / maxRevenue) * 100 : 0;
              
              return (
                <div key={day.date} className="flex items-center gap-4">
                  <span className="text-label-medium text-charcoal-600 w-20 flex-shrink-0">
                    {formatDate(day.date)}
                  </span>
                  <div className="flex-1 bg-grey-100 rounded-full h-10 relative overflow-hidden">
                    <div
                      className="bg-sage-500 h-full rounded-full flex items-center justify-end pr-4 transition-all duration-300"
                      style={{
                        width: `${Math.max(widthPercent, 5)}%`
                      }}
                    >
                      <span className="text-xs font-semibold text-white whitespace-nowrap">
                        {formatCurrency(day.revenue)}
                      </span>
                    </div>
                  </div>
                  <span className="text-body-regular text-charcoal-400 w-20 text-right flex-shrink-0">
                    {day.orders} {day.orders === 1 ? 'order' : 'orders'}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ORDERS BY STATUS + FULFILLMENT */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Orders by Status */}
        <div className="bg-grey-200 rounded-lg p-6 shadow-soft-lift border border-grey-stroke">
          <div className="mb-6">
            <h2 className="text-card-h2 text-charcoal-600">Orders by Status</h2>
            <p className="text-body-regular text-charcoal-400 mt-1">
              Breakdown of order statuses
            </p>
          </div>
          {analytics.ordersByStatus.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-body-regular text-charcoal-400">No orders in this period</p>
            </div>
          ) : (
            <div className="space-y-3">
              {analytics.ordersByStatus.map((item) => (
                <div key={item.status} className="flex items-center justify-between bg-cream-50 rounded-lg p-4 border border-grey-stroke hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3">
                    <StatusChip variant={getStatusVariant(item.status)}>
                      {item.status}
                    </StatusChip>
                    <span className="text-body-regular text-charcoal-600">
                      {item.count} {item.count === 1 ? 'order' : 'orders'}
                    </span>
                  </div>
                  <span className="text-body-medium text-charcoal-700 font-semibold">
                    {formatCurrency(item.revenue)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Fulfillment Breakdown */}
        <div className="bg-grey-200 rounded-lg p-6 shadow-soft-lift border border-grey-stroke">
          <div className="mb-6">
            <h2 className="text-card-h2 text-charcoal-600">Fulfillment Method</h2>
            <p className="text-body-regular text-charcoal-400 mt-1">
              How customers receive orders
            </p>
          </div>
          {analytics.overview.totalOrders === 0 ? (
            <div className="text-center py-12">
              <p className="text-body-regular text-charcoal-400">No fulfillment data available</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-cream-50 rounded-lg p-4 border border-grey-stroke">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-body-medium text-charcoal-600">Pickup</span>
                  <span className="text-body-medium text-charcoal-700 font-semibold">
                    {analytics.fulfillmentBreakdown.pickup} {analytics.fulfillmentBreakdown.pickup === 1 ? 'order' : 'orders'}
                  </span>
                </div>
                <div className="bg-grey-100 rounded-full h-4 overflow-hidden">
                  <div
                    className="bg-sage-500 h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${((analytics.fulfillmentBreakdown.pickup / (analytics.fulfillmentBreakdown.pickup + analytics.fulfillmentBreakdown.delivery)) * 100) || 0}%`
                    }}
                  ></div>
                </div>
                <span className="text-xs text-charcoal-400 mt-2 block">
                  {analytics.overview.totalOrders > 0 
                    ? `${((analytics.fulfillmentBreakdown.pickup / analytics.overview.totalOrders) * 100).toFixed(0)}% of total orders` 
                    : '0% of total orders'}
                </span>
              </div>

              <div className="bg-cream-50 rounded-lg p-4 border border-grey-stroke">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-body-medium text-charcoal-600">Delivery</span>
                  <span className="text-body-medium text-charcoal-700 font-semibold">
                    {analytics.fulfillmentBreakdown.delivery} {analytics.fulfillmentBreakdown.delivery === 1 ? 'order' : 'orders'}
                  </span>
                </div>
                <div className="bg-grey-100 rounded-full h-4 overflow-hidden">
                  <div
                    className="bg-sage-700 h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${((analytics.fulfillmentBreakdown.delivery / (analytics.fulfillmentBreakdown.pickup + analytics.fulfillmentBreakdown.delivery)) * 100) || 0}%`
                    }}
                  ></div>
                </div>
                <span className="text-xs text-charcoal-400 mt-2 block">
                  {analytics.overview.totalOrders > 0 
                    ? `${((analytics.fulfillmentBreakdown.delivery / analytics.overview.totalOrders) * 100).toFixed(0)}% of total orders` 
                    : '0% of total orders'}
                </span>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* TOP PRODUCTS */}
      <section className="bg-grey-200 rounded-lg p-6 shadow-soft-lift border border-grey-stroke">
        <div className="mb-6">
          <h2 className="text-card-h2 text-charcoal-600">Top Performing Products</h2>
          <p className="text-body-regular text-charcoal-400 mt-1">
            Your best-selling products by revenue
          </p>
        </div>
        {analytics.topProducts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-body-regular text-charcoal-400">No product data available</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-grey-stroke">
                  <th className="text-left py-3 px-3 text-label-medium text-charcoal-400">RANK</th>
                  <th className="text-left py-3 px-3 text-label-medium text-charcoal-400">PRODUCT</th>
                  <th className="text-right py-3 px-3 text-label-medium text-charcoal-400">ORDERS</th>
                  <th className="text-right py-3 px-3 text-label-medium text-charcoal-400">QTY SOLD</th>
                  <th className="text-right py-3 px-3 text-label-medium text-charcoal-400">REVENUE</th>
                </tr>
              </thead>
              <tbody>
                {analytics.topProducts.map((product, index) => (
                  <tr key={product.productId} className="border-b border-grey-stroke hover:bg-cream-50 transition-colors">
                    <td className="py-4 px-3">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-sage-500 text-cream-50 font-semibold text-sm">
                        {index + 1}
                      </span>
                    </td>
                    <td className="py-4 px-3">
                      <span className="text-body-regular text-charcoal-600 font-medium">
                        {product.productName}
                      </span>
                    </td>
                    <td className="py-4 px-3 text-right text-body-regular text-charcoal-600">
                      {product.totalOrders}
                    </td>
                    <td className="py-4 px-3 text-right text-body-regular text-charcoal-600">
                      {product.totalQty}
                    </td>
                    <td className="py-4 px-3 text-right text-body-medium text-charcoal-700 font-semibold">
                      {formatCurrency(product.totalRevenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* TOP CUSTOMERS */}
      <section className="bg-grey-200 rounded-lg p-6 shadow-soft-lift border border-grey-stroke">
        <div className="mb-6">
          <h2 className="text-card-h2 text-charcoal-600">Top Customers</h2>
          <p className="text-body-regular text-charcoal-400 mt-1">
            Your most valuable customers by revenue
          </p>
        </div>
        {analytics.topCustomers.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-body-regular text-charcoal-400">No customer data available</p>
          </div>
        ) : (
          <div className="space-y-3">
            {analytics.topCustomers.map((customer, index) => (
              <div key={customer.name} className="flex items-center justify-between bg-cream-50 rounded-lg p-4 border border-grey-stroke hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4">
                  <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-sage-500 text-cream-50 font-semibold flex-shrink-0">
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-body-medium text-charcoal-700 font-semibold">
                      {customer.name}
                    </p>
                    <p className="text-body-regular text-charcoal-400">
                      {customer.orders} {customer.orders === 1 ? 'order' : 'orders'}
                    </p>
                  </div>
                </div>
                <span className="text-body-medium text-charcoal-700 font-semibold">
                  {formatCurrency(customer.revenue)}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Analytics;
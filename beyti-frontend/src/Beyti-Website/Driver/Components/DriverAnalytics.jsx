import React, { useMemo, useState } from "react";
import * as Icon from "@phosphor-icons/react";

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

const DriverAnalytics = ({ driverId, driverName, metrics, historyJobs = [] }) => {
  const [timeRange, setTimeRange] = useState("30");

  const analytics = useMemo(() => {
    if (!historyJobs || historyJobs.length === 0) {
      return {
        overview: {
          totalEarnings: 0,
          totalDeliveries: 0,
          avgEarningsPerDelivery: 0,
          onTimeRate: 0,
        },
        earningsByDay: [],
        deliveriesByDay: [],
        topRestaurants: [],
        earningsByRestaurant: [],
        performanceMetrics: {
          avgDeliveryTime: 0,
          totalDistance: 0,
          peakHours: [],
        },
      };
    }

    const now = new Date();
    const daysAgo = new Date(now);
    daysAgo.setDate(now.getDate() - parseInt(timeRange));

    const filteredJobs = historyJobs.filter((job) => {
      const jobDate = new Date(job.updatedAt);
      return jobDate >= daysAgo && job.status === "Delivered";
    });

    // Overview metrics
    const totalEarnings = filteredJobs.reduce((sum, j) => sum + (j.order?.deliveryFee || 0), 0);
    const totalDeliveries = filteredJobs.length;
    const avgEarningsPerDelivery = totalDeliveries > 0 ? totalEarnings / totalDeliveries : 0;
    const onTimeRate = 100; // Placeholder - would need delivery time data

    // Earnings by day
    const dayMapEarnings = new Map();
    filteredJobs.forEach((job) => {
      const date = new Date(job.updatedAt);
      const dayKey = date.toISOString().split('T')[0];
      if (!dayMapEarnings.has(dayKey)) {
        dayMapEarnings.set(dayKey, { date: dayKey, earnings: 0, deliveries: 0 });
      }
      const record = dayMapEarnings.get(dayKey);
      record.earnings += job.order?.deliveryFee || 0;
      record.deliveries += 1;
    });
    const earningsByDay = Array.from(dayMapEarnings.values())
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(-14);

    // Top restaurants by deliveries
    const restaurantMap = new Map();
    filteredJobs.forEach((job) => {
      const name = job.order?.sellerName || "Unknown";
      if (!restaurantMap.has(name)) {
        restaurantMap.set(name, { 
          name, 
          deliveries: 0, 
          earnings: 0,
          avgOrderValue: 0 
        });
      }
      const record = restaurantMap.get(name);
      record.deliveries += 1;
      record.earnings += job.order?.deliveryFee || 0;
    });
    
    const topRestaurants = Array.from(restaurantMap.values())
      .map(r => ({ ...r, avgOrderValue: r.deliveries > 0 ? r.earnings / r.deliveries : 0 }))
      .sort((a, b) => b.deliveries - a.deliveries)
      .slice(0, 5);

    const earningsByRestaurant = Array.from(restaurantMap.values())
      .sort((a, b) => b.earnings - a.earnings)
      .slice(0, 5);

    // Peak hours analysis
    const hourMap = new Map();
    filteredJobs.forEach((job) => {
      const hour = new Date(job.updatedAt).getHours();
      hourMap.set(hour, (hourMap.get(hour) || 0) + 1);
    });
    const peakHours = Array.from(hourMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([hour, count]) => ({ hour, count }));

    return {
      overview: { totalEarnings, totalDeliveries, avgEarningsPerDelivery, onTimeRate },
      earningsByDay,
      topRestaurants,
      earningsByRestaurant,
      performanceMetrics: {
        avgDeliveryTime: 25, // Placeholder
        totalDistance: totalDeliveries * 3.5, // Placeholder estimate
        peakHours,
      },
    };
  }, [historyJobs, timeRange]);

  const formatHour = (hour) => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:00 ${period}`;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* HEADER */}
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
          title="Total Earnings"
          metrics={[{ value: formatCurrency(analytics.overview.totalEarnings), label: `Last ${timeRange} days` }]}
        />
        <AnalyticsCard
          title="Total Deliveries"
          metrics={[{ value: analytics.overview.totalDeliveries, label: `Last ${timeRange} days` }]}
        />
        <AnalyticsCard
          title="Avg Per Delivery"
          metrics={[{ value: formatCurrency(analytics.overview.avgEarningsPerDelivery), label: "Average earnings" }]}
        />
        <AnalyticsCard
          title="On-Time Rate"
          metrics={[{ value: `${analytics.overview.onTimeRate.toFixed(0)}%`, label: "Deliveries on time" }]}
        />
      </section>

      {/* EARNINGS TREND */}
      <section className="bg-grey-200 rounded-lg p-6 shadow-soft-lift border border-grey-stroke">
        <div className="mb-6">
          <h2 className="text-card-h2 text-charcoal-600">Earnings Trend</h2>
          <p className="text-body-regular text-charcoal-400 mt-1">
            Daily earnings over the last 14 days
          </p>
        </div>
        {analytics.earningsByDay.length === 0 ? (
          <div className="text-center py-12">
            <Icon.ChartLine size={48} className="text-charcoal-300 mx-auto mb-3" />
            <p className="text-body-regular text-charcoal-400">No delivery data for this period</p>
          </div>
        ) : (
          <div className="space-y-2">
          {analytics.earningsByDay.slice().reverse().map((day) => {
            const maxEarnings = Math.max(...analytics.earningsByDay.map(d => d.earnings));
            const widthPercent = maxEarnings > 0 ? (day.earnings / maxEarnings) * 100 : 0;
            
            // Threshold for label placement (adjust based on your container width)
            const MIN_LABEL_WIDTH = 15; // percentage threshold
            const showLabelInside = widthPercent >= MIN_LABEL_WIDTH;
            
            const formattedAmount = Number(day.earnings).toFixed(3);
            
            return (
              <div key={day.date} className="flex items-center gap-4">
                <span className="text-label-medium text-charcoal-600 w-20 flex-shrink-0">
                  {formatDate(day.date)}
                </span>
                <div className="flex-1 relative">
                  <div className="bg-grey-100 rounded-full h-10 relative overflow-hidden">
                    <div
                      className="bg-sage-500 h-full rounded-full transition-all duration-300 flex items-center justify-end pr-3"
                      style={{
                        width: `${Math.max(widthPercent, 2)}%`,
                        minWidth: '6px'
                      }}
                    >
                      {showLabelInside && (
                        <span className="text-sm font-semibold text-white whitespace-nowrap">
                          {formattedAmount} BHD
                        </span>
                      )}
                    </div>
                  </div>
                  {!showLabelInside && (
                    <span 
                      className="absolute top-1/2 -translate-y-1/2 text-sm font-semibold text-charcoal-700 whitespace-nowrap"
                      style={{
                        left: `calc(${Math.max(widthPercent, 2)}% + 12px)`
                      }}
                    >
                      {formattedAmount} BHD
                    </span>
                  )}
                </div>
                <span className="text-body-regular text-charcoal-400 w-24 text-right flex-shrink-0">
                  {day.deliveries} {day.deliveries === 1 ? 'delivery' : 'deliveries'}
                </span>
              </div>
            );
          })}
        </div>
        )}
      </section>

      {/* TOP RESTAURANTS */}
       <section className="grid grid-cols-1 gap-6">

        {/* Busiest Restaurants */}
          <div className="bg-grey-200 rounded-lg p-6 shadow-soft-lift border border-grey-stroke">
            <div className="mb-6">
              <h2 className="text-card-h2 text-charcoal-600">Busiest Restaurants</h2>
              <p className="text-body-regular text-charcoal-400 mt-1">
                Where you deliver the most
              </p>
            </div>
            {analytics.topRestaurants.length === 0 ? (
              <div className="text-center py-12">
                <Icon.Storefront size={48} className="text-charcoal-300 mx-auto mb-3" />
                <p className="text-body-regular text-charcoal-400">No restaurant data available</p>
              </div>
            ) : (
              <div className="space-y-3">
                {analytics.topRestaurants.slice(0, 3).map((restaurant, index) => {
                  const maxDeliveries = Math.max(...analytics.topRestaurants.map(r => r.deliveries));
                  const widthPercent = maxDeliveries > 0 ? (restaurant.deliveries / maxDeliveries) * 100 : 0;
                  
                  return (
                    <div key={restaurant.name} className="bg-cream-50 rounded-lg p-4 border border-grey-stroke">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-sage-500 text-cream-50 font-semibold text-sm flex-shrink-0">
                            {index + 1}
                          </span>
                          <span className="text-body-medium text-charcoal-700 font-semibold">
                            {restaurant.name}
                          </span>
                        </div>
                        <span className="text-body-regular text-charcoal-600 font-semibold">
                          {restaurant.deliveries} {restaurant.deliveries === 1 ? 'delivery' : 'deliveries'}
                        </span>
                      </div>
                      <div className="bg-grey-100 rounded-full h-3 overflow-hidden">
                        <div
                          className="bg-sage-500 h-full rounded-full transition-all duration-300"
                          style={{ width: `${Math.max(widthPercent, 2)}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-charcoal-400">
                          Total earnings
                        </span>
                        <span className="text-xs text-sage-700 font-semibold">
                          {formatCurrency(restaurant.earnings)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
      </section>

      {/* QUICK STATS */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-sage-50 to-cream-50 border-2 border-sage-300 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-full bg-sage-500 flex items-center justify-center">
              <Icon.TrendUp size={24} weight="fill" className="text-white" />
            </div>
            <div>
              <p className="text-xs text-sage-700 uppercase tracking-wide font-semibold">
                Best Day
              </p>
              <p className="text-lg font-bold text-charcoal-700">
                {analytics.earningsByDay.length > 0 
                  ? formatDate(analytics.earningsByDay.reduce((max, day) => day.earnings > max.earnings ? day : max).date)
                  : '—'}
              </p>
            </div>
          </div>
          <p className="text-sm text-charcoal-600">
            {analytics.earningsByDay.length > 0 
              ? formatCurrency(Math.max(...analytics.earningsByDay.map(d => d.earnings)))
              : 'No data'}
          </p>
        </div>

        <div className="bg-gradient-to-br from-success-bg to-cream-50 border-2 border-success-btn/30 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-full bg-success-btn flex items-center justify-center">
              <Icon.Package size={24} weight="fill" className="text-white" />
            </div>
            <div>
              <p className="text-xs text-success-text uppercase tracking-wide font-semibold">
                Most Deliveries
              </p>
              <p className="text-lg font-bold text-charcoal-700">
                {analytics.earningsByDay.length > 0 
                  ? formatDate(analytics.earningsByDay.reduce((max, day) => day.deliveries > max.deliveries ? day : max).date)
                  : '—'}
              </p>
            </div>
          </div>
          <p className="text-sm text-charcoal-600">
            {analytics.earningsByDay.length > 0 
              ? `${Math.max(...analytics.earningsByDay.map(d => d.deliveries))} deliveries`
              : 'No data'}
          </p>
        </div>

        <div className="bg-gradient-to-br from-danger-bg to-cream-50 border-2 border-danger-btn/30 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-full bg-danger-btn flex items-center justify-center">
              <Icon.Target size={24} weight="fill" className="text-white" />
            </div>
            <div>
              <p className="text-xs text-danger-text uppercase tracking-wide font-semibold">
                Acceptance Rate
              </p>
              <p className="text-lg font-bold text-charcoal-700">
                {metrics?.acceptanceRate || 0}%
              </p>
            </div>
          </div>
          <p className="text-sm text-charcoal-600">
            Of offered deliveries
          </p>
        </div>
      </section>
    </div>
  );
};

export default DriverAnalytics;
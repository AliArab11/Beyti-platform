import { useEffect, useState } from 'react';
import { getDashboardStatistics } from '../../../services/api';

export default function DashboardStats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      const data = await getDashboardStatistics();
      setStats(data);
    } catch (err) {
      console.error('Error fetching statistics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatistics();
    const interval = setInterval(fetchStatistics, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">Error loading statistics</p>
      </div>
    );
  }

  return (
    <div>
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          change={`+${stats.recentActivity.newUsers} this week`}
          icon="👥"
          color="blue"
        />
        <StatCard
          title="Total Sales"
          value={`$${stats.sales.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
          change={`${stats.sales.totalOrders} orders`}
          icon="💰"
          color="green"
        />
        <StatCard
          title="Active Listings"
          value={stats.listings.active}
          change={`${stats.listings.total} total`}
          icon="📦"
          color="purple"
        />
        <StatCard
          title="Pending Orders"
          value={stats.sales.pendingOrders}
          change="Awaiting processing"
          icon="⏳"
          color="yellow"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-md p-6 text-white">
          <p className="text-blue-100 text-sm font-medium uppercase">Monthly Revenue</p>
          <p className="text-3xl font-bold mt-2">
            ${stats.sales.monthlyRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-blue-100 text-sm mt-2">Last 30 days</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-md p-6 text-white">
          <p className="text-green-100 text-sm font-medium uppercase">Available Providers</p>
          <p className="text-3xl font-bold mt-2">{stats.serviceProviders.available}</p>
          <p className="text-green-100 text-sm mt-2">Currently online</p>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-md p-6 text-white">
          <p className="text-orange-100 text-sm font-medium uppercase">Pending Requests</p>
          <p className="text-3xl font-bold mt-2">{stats.serviceProviders.pendingRequests}</p>
          <p className="text-orange-100 text-sm mt-2">Awaiting approval</p>
        </div>
      </div>

      {/* Users by Role */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-bold mb-4 text-gray-800">Users by Role</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <RoleCard role="Customers" count={stats.usersByRole.customers} color="blue" />
          <RoleCard role="Sellers" count={stats.usersByRole.sellers} color="green" />
          <RoleCard role="Drivers" count={stats.usersByRole.drivers} color="purple" />
          <RoleCard role="Service Providers" count={stats.usersByRole.serviceProviders} color="orange" />
          <RoleCard role="Admins" count={stats.usersByRole.admins} color="red" />
        </div>
      </div>

      {/* Active Memberships */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-bold mb-4 text-gray-800">Active Memberships</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <MembershipCard label="Total" count={stats.memberships.total} color="indigo" />
          <MembershipCard label="Sellers" count={stats.memberships.sellers} color="green" />
          <MembershipCard label="Service Providers" count={stats.memberships.serviceProviders} color="orange" />
          <MembershipCard label="Drivers" count={stats.memberships.drivers} color="purple" />
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4 text-gray-800">Recent Activity (Last 7 Days)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ActivityCard
            icon="👤"
            count={stats.recentActivity.newUsers}
            label="New Users"
            bgColor="bg-blue-50"
            iconBg="bg-blue-500"
          />
          <ActivityCard
            icon="🛒"
            count={stats.recentActivity.newOrders}
            label="New Orders"
            bgColor="bg-green-50"
            iconBg="bg-green-500"
          />
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, change, icon, color }) {
  const colors = {
    blue: 'border-blue-500 bg-blue-100 text-blue-500',
    green: 'border-green-500 bg-green-100 text-green-500',
    purple: 'border-purple-500 bg-purple-100 text-purple-500',
    yellow: 'border-yellow-500 bg-yellow-100 text-yellow-500',
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border-l-4 hover:shadow-lg transition">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500 text-sm font-medium uppercase">{title}</p>
          <p className="text-3xl font-bold text-gray-800 mt-2">{value}</p>
        </div>
        <div className={`rounded-full p-3 ${colors[color]}`}>
          <span className="text-2xl">{icon}</span>
        </div>
      </div>
      <p className="text-sm text-gray-600 mt-3">{change}</p>
    </div>
  );
}

function RoleCard({ role, count, color }) {
  const colors = {
    blue: 'bg-blue-50 border-blue-200 text-blue-600',
    green: 'bg-green-50 border-green-200 text-green-600',
    purple: 'bg-purple-50 border-purple-200 text-purple-600',
    orange: 'bg-orange-50 border-orange-200 text-orange-600',
    red: 'bg-red-50 border-red-200 text-red-600',
  };

  return (
    <div className={`text-center p-4 rounded-lg border ${colors[color]}`}>
      <p className="text-3xl font-bold">{count}</p>
      <p className="text-sm text-gray-600 mt-1">{role}</p>
    </div>
  );
}

function MembershipCard({ label, count, color }) {
  const colors = {
    indigo: 'from-indigo-50 to-indigo-100 border-indigo-200 text-indigo-600',
    green: 'from-green-50 to-green-100 border-green-200 text-green-600',
    orange: 'from-orange-50 to-orange-100 border-orange-200 text-orange-600',
    purple: 'from-purple-50 to-purple-100 border-purple-200 text-purple-600',
  };

  return (
    <div className={`text-center p-4 bg-gradient-to-br rounded-lg border ${colors[color]}`}>
      <p className="text-3xl font-bold">{count}</p>
      <p className="text-sm text-gray-600 mt-1">{label}</p>
    </div>
  );
}

function ActivityCard({ icon, count, label, bgColor, iconBg }) {
  return (
    <div className={`flex items-center p-4 rounded-lg ${bgColor}`}>
      <div className={`${iconBg} rounded-full p-3 mr-4`}>
        <span className="text-2xl text-white">{icon}</span>
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-800">{count}</p>
        <p className="text-sm text-gray-600">{label}</p>
      </div>
    </div>
  );
}
import { useState } from 'react';
import DashboardStats from './components/DashboardStats';
import UserManagement from './components/UserManagement';
import ServiceProviderRequests from './components/ServiceProviderRequests';
import FlaggedUsers from './components/FlaggedUsers';
import ProductModeration from './components/ProductModeration';
export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
  { id: 'overview', name: 'Dashboard Overview', icon: '📊' },
  { id: 'users', name: 'User Management', icon: '👥' },
  { id: 'flagged', name: 'Flagged Users', icon: '⚠️' }, // Changed from providers
{ id: 'products', name: 'Product Moderation', icon: '📦' },
  { id: 'requests', name: 'Pending Requests', icon: '⏳' },
];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="px-6 py-4">
          <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage your platform</p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-1 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'overview' && <DashboardStats />}
        {activeTab === 'users' && <UserManagement />}
        {activeTab === 'providers' && <div className="bg-white rounded-lg shadow p-6"><p>Service Providers management coming soon...</p></div>}
        {activeTab === 'requests' && <ServiceProviderRequests />}
        {activeTab === 'flagged' && <FlaggedUsers />}
        {activeTab === 'products' && <ProductModeration />}
      </div>
    </div>
  );
}
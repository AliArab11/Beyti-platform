import { useState } from 'react';
import ProviderOverview from './components/ProviderOverview';
import ServicesManagement from './components/ServicesManagement';
import ScheduleManagement from './components/ScheduleManagement';
import BookingsManagement from './components/BookingsManagement';

export default function ServiceProviderDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [bookingFilter, setBookingFilter] = useState(null);
  
  // TODO: Get this from authentication/context
  const userProfileId = 1031; // Replace with actual logged-in user
  const serviceProviderId = 6; // Replace with actual provider ID

  const tabs = [
    { id: 'overview', name: 'Dashboard', icon: '📊' },
    { id: 'services', name: 'My Services', icon: '🔧' },
    { id: 'schedule', name: 'Schedule', icon: '📅' },
    { id: 'bookings', name: 'Bookings', icon: '📋' },
  ];

  // Handler for navigating from dashboard stats to bookings with filter
  const handleNavigateToBookings = (status) => {
    setBookingFilter(status);
    setActiveTab('bookings');
  };

  // Reset filter when manually switching to bookings tab
  const handleTabChange = (tabId) => {
    if (tabId === 'bookings' && activeTab !== 'bookings') {
      setBookingFilter(null); // Reset filter when manually clicking bookings tab
    }
    setActiveTab(tabId);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="px-6 py-4">
          <h1 className="text-3xl font-bold text-gray-800">Service Provider Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage your services and bookings</p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-1 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
                {/* Badge for pending items */}
                {tab.id === 'bookings' && bookingFilter && (
                  <span className="ml-2 px-2 py-0.5 text-xs bg-blue-500 text-white rounded-full">
                    Filtered
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'overview' && (
          <ProviderOverview 
            serviceProviderId={serviceProviderId}
            onNavigateToBookings={handleNavigateToBookings}
          />
        )}
        {activeTab === 'services' && (
          <ServicesManagement serviceProviderId={serviceProviderId} />
        )}
        {activeTab === 'schedule' && (
          <ScheduleManagement serviceProviderId={serviceProviderId} />
        )}
        {activeTab === 'bookings' && (
          <BookingsManagement 
            serviceProviderId={serviceProviderId}
            initialFilter={bookingFilter}
          />
        )}
      </div>
    </div>
  );
}
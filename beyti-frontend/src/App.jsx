import { useState } from 'react';
import RegistrationPage from "./Pages/Registration";
import MembershipPage from "./Pages/Membership";
import AddPlanPage from "./Pages/Membership/AddPlan";
import AdminPage from './Pages/Admin/AdminPage';
import ServiceProviderPage from "./Pages/ServiceProvider";
import AdminUsersPage from './Pages/Admin/AdminDash'; 
import ServiceProviderRequests from './Pages/Admin/ServiceProviderRequests.jsx';
import CustomerPage from "./Pages/Customer";
import SellerPage from "./Pages/Seller";
import StoresPage from "./Pages/Seller/Store";
import StoreDetailsPage from "./Pages/Seller/StoreDetails";
import ProductsPage from "./Pages/Product/Products";
import CategoryPage from "./Pages/Product/Categories";
import DriverPage from "./Pages/Driver";
import DesignSystemDemo from './components/DesignSystemDemo';

// Placeholder components for pages that don't exist yet
const PlaceholderPage = ({ pageName }) => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <h1 className="text-4xl font-bold text-gray-800 mb-4">{pageName}</h1>
      <p className="text-gray-600">This page is coming soon...</p>
    </div>
  </div>
);

export default function App() {
  const [currentPage, setCurrentPage] = useState('registration');
  const [selectedStoreId, setSelectedStoreId] = useState(null);

  const navItems = [
    { id: 'registration', label: 'Registration' },
    { id: 'membership', label: 'Membership' },
    { id: 'addplan', label: 'Add Plan' },
    { id: 'seller', label: 'Seller' },
    { id: 'store', label: 'Store' },
    { id: 'product', label: 'Product' },
    { id: 'category', label: 'Category' },
    { id: 'customer', label: 'Customer' },
    { id: 'driver', label: 'Driver' },
    { id: 'admin', label: 'Admin' },
    { id: 'serviceprovider', label: 'Service Provider' },
    { id: 'notification', label: 'Notification' },
    { id: 'admindashboard', label: 'Admin Dashboard'},
     { id: 'servicerequest', label: 'Service Request'},
     { id: 'DesignDemo', label: 'Design Demo'}
  ];

  const renderPage = () => {
    switch (currentPage) {
      case 'registration':
        return <RegistrationPage />;
      case 'membership':
        return <MembershipPage />;
      case 'addplan':
        return <AddPlanPage />;
      case 'seller':
        return <SellerPage />;
      case 'store':
        return <StoresPage />;
      case 'storedetails':
        return <StoreDetailsPage />;
      case 'product':
        return <ProductsPage />;
      case 'category':
        return <CategoryPage />;
      case 'customer':
        return <CustomerPage />;
      case 'driver':
        return <DriverPage />;
      case 'admin':
        return <AdminPage />;
      case 'serviceprovider':
        return < ServiceProviderPage />;
      case 'admindashboard' :
        return < AdminUsersPage />;
      case 'servicerequest' :
        return <ServiceProviderRequests />
      case 'notification':
        return <PlaceholderPage pageName="Notification" />;
      case 'DesignDemo':
        return <DesignSystemDemo />;
      default:
        return <RegistrationPage />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo/Brand */}
            <div className="flex-shrink-0">
              <h1 className="text-2xl font-bold text-blue-600">Beyti Platform</h1>
            </div>

            {/* Navigation Items */}
            <div className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setCurrentPage(item.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    currentPage === item.id
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-blue-600'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button
                onClick={() => {
                  const menu = document.getElementById('mobile-menu');
                  menu.classList.toggle('hidden');
                }}
                className="text-gray-700 hover:text-blue-600 focus:outline-none"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <div id="mobile-menu" className="hidden md:hidden bg-white border-t border-gray-200">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentPage(item.id);
                  document.getElementById('mobile-menu').classList.add('hidden');
                }}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  currentPage === item.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-blue-600'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Page Content */}
      <main>
        {renderPage()}
      </main>
    </div>
  );
}

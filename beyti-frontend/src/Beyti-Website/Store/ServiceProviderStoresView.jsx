import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Scissors } from "@phosphor-icons/react";
import { getServiceProviders, getServiceCategoryList, getUserProfile, updateUserProfile, getServiceProviderServices, getProviderServiceReviews } from "../../services/api";
import { isAuthenticated, getUserId, handleSuspensionError } from "../../utils/authUtils";
import PageHeader from "../../components/PageHeader";
import CustomerSidebar from "../../components/CustomerSidebar";

// Main Category Tabs Component
const CategoryTabs = ({ categories, selected, onSelect }) => (
  <div className="flex justify-center items-center gap-5 mb-6">
    {categories.map((category, index) => (
      <button
        key={`category-${index}-${category}`}
        onClick={() => onSelect(category)}
        className={`px-20 py-4 rounded-full font-semibold text-[19px] transition-all ${
          selected === category
            ? 'bg-sage-500 text-white shadow-[0_2px_12px_rgba(85,107,92,0.25)]'
            : 'bg-cream-50 text-charcoal-600 border-2 border-grey-stroke hover:border-sage-500 shadow-[0_1px_3px_rgba(0,0,0,0.08)]'
        }`}
        style={{ fontFamily: 'Inter, sans-serif' }}
      >
        {category}
      </button>
    ))}
  </div>
);

// Search Bar Component
const SearchBar = ({ value, onChange }) => (
  <div className="flex gap-4 items-center mb-8">
    <div className="flex-1 relative">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search Service Providers..."
        className="w-full pl-12 pr-4 py-3.5 bg-white rounded-full border border-grey-stroke focus:outline-none focus:border-sage-500 text-charcoal-600 shadow-[0_2px_8px_rgba(0,0,0,0.06)]"
        style={{ fontFamily: 'Inter, sans-serif', fontSize: '16px' }}
      />
      <svg className="w-5 h-5 text-charcoal-400 absolute left-4 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    </div>
    <button className="flex items-center gap-3 px-6 py-3.5 bg-white rounded-full border border-grey-stroke hover:border-sage-500 transition-all shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
      <svg className="w-5 h-5 text-sage-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
      </svg>
      <span className="text-charcoal-600 font-semibold text-[14px]" style={{ fontFamily: 'Inter, sans-serif' }}>Filter</span>
      <svg className="w-4 h-4 text-charcoal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </button>
  </div>
);


// Star Rating Component
const StarRating = ({ rating }) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-0.5">
        {[...Array(fullStars)].map((_, idx) => (
          <svg key={`full-${idx}`} className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
        {hasHalfStar && (
          <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
            <defs>
              <linearGradient id="half-fill">
                <stop offset="50%" stopColor="currentColor" />
                <stop offset="50%" stopColor="#e5e7eb" />
              </linearGradient>
            </defs>
            <path fill="url(#half-fill)" d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        )}
        {[...Array(emptyStars)].map((_, idx) => (
          <svg key={`empty-${idx}`} className="w-4 h-4 text-grey-300" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
      <span className="text-charcoal-500 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>
        {rating > 0 ? `${rating.toFixed(1)}` : 'No reviews'}
      </span>
    </div>
  );
};

// Service Provider Card Component
const ProviderCard = ({ provider, onClick, services }) => {
  console.log('[ProviderCard] Rendering provider:', provider);
  console.log('[ProviderCard] Services:', services);

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'Available':
        return 'bg-green-100 text-green-700';
      case 'Busy':
        return 'bg-yellow-100 text-yellow-700';
      case 'Unavailable':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-grey-200 text-charcoal-600';
    }
  };

  // Get active services count
  // Handle both PascalCase and camelCase property names from API
  const activeServicesCount = services?.filter(s => s.isActive || s.IsActive).length || 0;
  const displayServices = services?.filter(s => s.isActive || s.IsActive).slice(0, 3) || [];

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl overflow-hidden cursor-pointer shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.12)] transition-all"
    >
      <div className="relative h-32 bg-gradient-to-br from-[#E8D8E0] to-[#DFC9D8]">
        <div className="absolute -bottom-8 left-4">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.15)] border-4 border-white">
            <Scissors className="w-8 h-8 text-sage-500" weight="regular" />
          </div>
        </div>
      </div>

      <div className="pt-10 p-4 bg-white">
        {/* Business Name from ServiceProvider */}
        <h3 className="font-bold text-charcoal-600 text-base mb-2" style={{ fontFamily: 'Merriweather, serif' }}>
          {provider.businessName || provider.displayName || 'Service Provider'}
        </h3>

        {/* Star Rating */}
        <div className="mb-2">
          <StarRating rating={provider.averageRating || 0} />
        </div>

        {/* Services List */}
        {displayServices.length > 0 && (
          <div className="mb-3 mt-3">
            <p className="text-xs font-semibold text-charcoal-500 mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
              Services Offered:
            </p>
            <div className="space-y-1">
              {displayServices.map((service, idx) => {
                // Handle both PascalCase and camelCase property names
                const serviceName = service.name || service.Name;
                const minPrice = service.minPrice || service.MinPrice;
                const maxPrice = service.maxPrice || service.MaxPrice;

                return (
                  <div key={service.id || service.Id || idx} className="flex items-start gap-2">
                    <span className="text-sage-500 text-xs mt-0.5">•</span>
                    <div className="flex-1">
                      <p className="text-xs text-charcoal-600" style={{ fontFamily: 'Inter, sans-serif' }}>
                        {serviceName}
                        {minPrice && maxPrice && (
                          <span className="text-charcoal-400 ml-1">
                            (${minPrice} - ${maxPrice})
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                );
              })}
              {activeServicesCount > 3 && (
                <p className="text-xs text-sage-500 font-medium mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>
                  +{activeServicesCount - 3} more services
                </p>
              )}
            </div>
          </div>
        )}

        {/* No Services Message */}
        {(!services || services.length === 0) && (
          <div className="mb-3 mt-3">
            <p className="text-xs text-charcoal-400 italic" style={{ fontFamily: 'Inter, sans-serif' }}>
              No services listed yet
            </p>
          </div>
        )}

        {/* Phone from ServiceProvider */}
        {provider.phone && (
          <p className="text-charcoal-500 text-sm mb-2 flex items-center gap-2" style={{ fontFamily: 'Inter, sans-serif' }}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            {provider.phone}
          </p>
        )}

        {/* Status from ServiceProvider */}
        {provider.status && (
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(provider.status)}`} style={{ fontFamily: 'Inter, sans-serif' }}>
              {provider.status}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

// Main Component
const ServiceProviderStoresView = () => {
  const navigate = useNavigate();
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [displayName, setDisplayName] = useState("Customer");
  const [userProfile, setUserProfile] = useState(null);
  const [providerServices, setProviderServices] = useState({}); // Map of providerId -> services array
  const [activeView, setActiveView] = useState('services'); // Current view: stores, services, notifications, history

  // Check authentication on mount
  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login');
    }
  }, [navigate]);

  // Get user ID from localStorage (Customer: UserProfileId = 2, CustomerId = 1)
  const userProfileId = parseInt(getUserId()) || 1002;
  const customerId = 2; // TODO: Get from API based on userProfileId

  // Fetch user profile details
  const fetchUserProfile = async () => {
    try {
      const profile = await getUserProfile(userProfileId);
      console.log('[fetchUserProfile] Received profile:', profile);
      if (profile) {
        // API returns PascalCase, convert to camelCase for frontend use
        const normalizedProfile = {
          userProfileId: profile.UserProfileId,
          displayName: profile.DisplayName,
          roleType: profile.RoleType,
          accountStatus: profile.AccountStatus,
          phone: profile.Phone,
          street: profile.Street,
          city: profile.City,
          region: profile.Region,
          postalCode: profile.PostalCode,
          country: profile.Country,
          address: profile.Address,
          createdAt: profile.CreatedAt,
          updatedAt: profile.UpdatedAt,
        };

        console.log('[fetchUserProfile] Normalized profile:', normalizedProfile);
        console.log('[fetchUserProfile] Account status:', normalizedProfile.accountStatus);

        // Check if account is suspended
        if (normalizedProfile.accountStatus === 'Suspended') {
          navigate('/account-suspended');
          return;
        }

        setUserProfile(normalizedProfile);
        if (normalizedProfile.displayName) {
          setDisplayName(normalizedProfile.displayName);
        }
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      // Check if error is due to suspension
      if (!handleSuspensionError(error, navigate)) {
        // Handle other errors
        console.error('Failed to load profile');
      }
    }
  };

  // Handle profile update
  const handleProfileUpdate = async (updates) => {
    try {
      await updateUserProfile(userProfileId, 'Customer', updates);
      // Refresh the profile after update
      await fetchUserProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, [userProfileId]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      console.log('[fetchInitialData] ===== STARTING DATA FETCH =====');
      const [providersData, categoriesData] = await Promise.all([
        getServiceProviders(),
        getServiceCategoryList()
      ]);

      console.log('[fetchInitialData] Raw providers data:', providersData);

      // Data is already in camelCase from the API, just use it directly
      const normalizedProviders = Array.isArray(providersData) ? providersData : [];

      console.log('[fetchInitialData] Providers to set:', normalizedProviders);

      setProviders(normalizedProviders);
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);

      // Fetch services and reviews for each provider
      if (normalizedProviders.length > 0) {
        const servicesMap = {};
        const updatedProviders = await Promise.all(
          normalizedProviders.map(async (provider) => {
            try {
              const services = await getServiceProviderServices(provider.id);
              console.log(`[fetchInitialData] Services for provider ${provider.id}:`, services);
              console.log(`[fetchInitialData] First service structure:`, services[0]);
              servicesMap[provider.id] = Array.isArray(services) ? services : [];

              // Fetch reviews for this provider to calculate accurate rating
              const reviews = await getProviderServiceReviews(provider.id);
              console.log(`[fetchInitialData] Reviews for provider ${provider.id}:`, reviews);

              // Calculate average rating from ALL reviews (including hidden ones)
              let averageRating = provider.averageRating || 0;
              if (Array.isArray(reviews) && reviews.length > 0) {
                const totalRating = reviews.reduce((acc, review) => acc + (review.overallRating || 0), 0);
                averageRating = totalRating / reviews.length;
                console.log(`[fetchInitialData] Calculated average rating for provider ${provider.id}: ${averageRating.toFixed(2)} from ${reviews.length} reviews`);
              }

              return {
                ...provider,
                averageRating
              };
            } catch (error) {
              console.error(`Failed to fetch services/reviews for provider ${provider.id}:`, error);
              servicesMap[provider.id] = [];
              return provider;
            }
          })
        );
        console.log('[fetchInitialData] Final servicesMap:', servicesMap);
        setProviderServices(servicesMap);
        setProviders(updatedProviders);
      }

      // Don't set any default category - show all providers initially
      setSelectedCategory(null);
    } catch (error) {
      console.error("Failed to load initial data:", error);
      setProviders([]);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCategorySelect = (categoryId) => {
    setSelectedCategory(categoryId);
  };

  const filteredProviders = providers.filter(provider => {
    const searchLower = searchQuery.toLowerCase();
    const displayName = provider.displayName || '';
    const businessName = provider.businessName || '';

    // Filter by search query
    const matchesSearch = displayName.toLowerCase().includes(searchLower) ||
                         businessName.toLowerCase().includes(searchLower);

    // Filter by category if one is selected, otherwise show all
    const matchesCategory = selectedCategory === null ||
                          provider.serviceCategoryId === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // Handle sidebar navigation
  const handleNavigate = (view) => {
    setActiveView(view);

    // Navigate to different routes based on selection
    switch(view) {
      case 'stores':
        navigate('/mainStore');
        break;
      case 'services':
        // Stay on current page (service providers view)
        break;
      case 'notifications':
        navigate('/customer/notifications');
        break;
      case 'history':
        navigate('/customer/history');
        break;
      default:
        break;
    }
  };

  // Get page title based on active view
  const getPageTitle = () => {
    switch (activeView) {
      case 'stores':
        return 'Stores';
      case 'services':
        return 'Service Providers';
      case 'notifications':
        return 'Notifications';
      case 'history':
        return 'Orders & Services History';
      default:
        return 'Service Providers';
    }
  };

  return (
    <div className="flex min-h-screen bg-cream-50 dark:bg-charcoal-600">
      {/* Sidebar */}
      <CustomerSidebar
        currentPage={activeView}
        onNavigate={handleNavigate}
        userName={displayName}
        userRole="Customer"
      />

      {/* Main Content */}
      <div className="flex-1 ml-[250px] flex flex-col">
        {/* Header */}
        <PageHeader
          title={getPageTitle()}
          withSearch={false}
          notificationCount={0}
          userName={displayName}
          userRole="Customer"
          userProfile={userProfile}
          entityId={customerId}
          userId={userProfileId}
          onProfileUpdate={handleProfileUpdate}
        />

        {/* Main Content Area */}
        <main className="flex-1 p-8 overflow-y-auto" style={{ backgroundColor: '#FAF7F2' }}>
          <div className="max-w-[1440px] mx-auto">
            <div className="flex justify-center">
              <CategoryTabs
                categories={['All', ...categories.map(cat => cat.name)]}
                selected={selectedCategory === null ? 'All' : (categories.find(cat => cat.id === selectedCategory)?.name || '')}
                onSelect={(name) => {
                  if (name === 'All') {
                    handleCategorySelect(null);
                  } else {
                    const category = categories.find(cat => cat.name === name);
                    if (category) handleCategorySelect(category.id);
                  }
                }}
              />
            </div>

            <div className="mt-8">
              <SearchBar value={searchQuery} onChange={setSearchQuery} />

              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="w-12 h-12 border-4 border-grey-stroke border-t-sage-500 rounded-full animate-spin"></div>
                </div>
              ) : filteredProviders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="w-24 h-24 bg-cream-100 rounded-full flex items-center justify-center mb-4">
                    <Scissors className="w-12 h-12 text-charcoal-400" weight="regular" />
                  </div>
                  <h3 className="text-xl font-bold text-charcoal-600 mb-2" style={{ fontFamily: 'Merriweather, serif' }}>
                    No Service Providers Found
                  </h3>
                  <p className="text-charcoal-400 text-center max-w-md" style={{ fontFamily: 'Inter, sans-serif' }}>
                    {searchQuery
                      ? `No service providers match "${searchQuery}". Try a different search term.`
                      : 'There are no service providers available at the moment. Please check back later.'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredProviders.map((provider, idx) => (
                    <ProviderCard
                      key={provider.id || `provider-${idx}`}
                      provider={provider}
                      services={providerServices[provider.id] || []}
                      onClick={() => navigate(`/service-provider/${provider.id}`)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ServiceProviderStoresView;

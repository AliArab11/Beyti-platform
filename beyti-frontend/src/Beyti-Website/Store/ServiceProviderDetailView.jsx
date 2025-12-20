import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Scissors, Star, MagnifyingGlass, ArrowLeft } from "@phosphor-icons/react";
import { getServiceProviderById, getServiceCatalogs, getServiceProviderServices, getProviderServiceReviews, getServiceBookings, getUserProfile } from "../../services/api";
import { isAuthenticated, getUserId } from "../../utils/authUtils";
import CustomerHeader from "../../components/CustomerHeader";
import ActiveOrderBanner from "./Components/ActiveOrderBanner";
import ServiceDetailsSheet from "./Components/ServiceDetailsSheet";
import ServiceCheckout from "./Components/ServiceCheckout";


// Service Provider Info Section
const ServiceProviderInfo = ({ provider }) => {
  console.log('[ServiceProviderInfo] Rendering provider:', provider);

  return (
    <div className="bg-cream-50 px-8 py-6">
      <div className="max-w-[1400px] mx-auto">

        {/* Main Card Container */}
        <div className="bg-white rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] relative">

          {/* Banner Section (Top) - No images, just gradient */}
          <div className="relative h-[180px] bg-gradient-to-br from-[#E8D8E0]/20 via-[#DFC9D8]/15 to-[#E8D8E0]/20 rounded-t-3xl overflow-hidden"
               style={{ backgroundColor: '#F5F5F7' }}>
            <div className="absolute inset-0 opacity-30">
              <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="diagonalLines" patternUnits="userSpaceOnUse" width="40" height="40" patternTransform="rotate(45)">
                    <line x1="0" y1="0" x2="0" y2="40" stroke="#8B5CF6" strokeWidth="1" opacity="0.3"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#diagonalLines)"/>
              </svg>
            </div>

            <div className="absolute inset-0">
              <div className="absolute top-8 right-16 w-32 h-32 rounded-full opacity-20"
                   style={{ background: 'radial-gradient(circle, #8B5CF6 0%, transparent 70%)' }}></div>
              <div className="absolute bottom-6 right-1/3 w-24 h-24 rounded-full opacity-15"
                   style={{ background: 'radial-gradient(circle, #8B5CF6 0%, transparent 70%)' }}></div>
              <div className="absolute top-12 left-1/4 w-20 h-20 rounded-full opacity-25"
                   style={{ background: 'radial-gradient(circle, #8B5CF6 0%, transparent 70%)' }}></div>
            </div>

            <div className="absolute bottom-0 left-0 right-0">
              <svg viewBox="0 0 1200 60" className="w-full" preserveAspectRatio="none">
                <path d="M0,30 Q300,10 600,30 T1200,30 L1200,60 L0,60 Z"
                      fill="white" opacity="0.1"/>
                <path d="M0,40 Q300,20 600,40 T1200,40 L1200,60 L0,60 Z"
                      fill="white" opacity="0.15"/>
              </svg>
            </div>
          </div>

          {/* Icon Logo */}
          <div className="absolute -bottom-[112px] left-12 z-30">
            <div className="w-[140px] h-[140px] rounded-full bg-gradient-to-br from-[#8B5CF6] via-[#7C3AED] to-[#6D28D9] border-[6px] border-white flex items-center justify-center overflow-hidden relative"
                 style={{ boxShadow: '0 8px 30px rgba(139,92,246,0.5)' }}>
              <div className="absolute inset-0 opacity-20">
                <div className="absolute top-0 left-0 w-full h-full"
                     style={{
                       backgroundImage: 'radial-gradient(circle at 20% 30%, rgba(255,255,255,0.3) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(255,255,255,0.2) 0%, transparent 50%)'
                     }}>
                </div>
              </div>

              <div className="relative z-10 w-full h-full flex flex-col items-center justify-center p-3">
                <Scissors className="w-16 h-16 text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.4)]" weight="regular" />
              </div>
            </div>
          </div>
        </div>

        {/* White Info Section (Bottom) */}
        <div className="pt-7 pb-3 px-10 bg-white rounded-b-3xl">

          {/* HORIZONTAL LAYOUT */}
          <div className="flex items-start gap-8">

            {/* LEFT SIDE: Logo space + Provider Name + Rating */}
            <div className="flex items-start gap-6 flex-1">
              {/* Spacer for logo */}
              <div className="w-[140px] flex-shrink-0"></div>

              {/* Provider Name and Info next to logo */}
              <div className="flex-1">
                {/* Provider Name with Rating inline */}
                <div className="flex items-center gap-4 mb-1.5">
                  <h1 className="text-[32px] font-bold text-charcoal-600 leading-tight drop-shadow-[0_3px_8px_rgba(0,0,0,0.2)]"
                      style={{ fontFamily: "Merriweather, serif" }}>
                    {provider?.businessName || provider?.displayName || "Service Provider"}
                  </h1>

                  {/* Rating inline with name */}
                  <div className="flex items-center gap-2.5">
                    {provider?.averageRating && provider.averageRating > 0 ? (
                      <>
                        <Star className="w-7 h-7 text-sage-500" weight="fill" />
                        <span className="text-[22px] font-semibold text-sage-500"
                              style={{ fontFamily: "Inter, sans-serif" }}>
                          {provider.averageRating.toFixed(1)}
                        </span>
                      </>
                    ) : (
                      <span className="px-4 py-1.5 bg-sage-500 text-white text-sm font-bold rounded-full"
                            style={{ fontFamily: 'Inter, sans-serif' }}>
                        NEW
                      </span>
                    )}
                  </div>
                </div>

                {/* Status */}
                {provider?.status && (
                  <p className="text-[15px] text-charcoal-500"
                     style={{ fontFamily: "Inter, sans-serif" }}>
                    Status: {provider.status}
                  </p>
                )}
              </div>
            </div>

            {/* VERTICAL DIVIDER LINE */}
            <div className="w-[2px] h-16 bg-grey-stroke self-start"></div>

            {/* RIGHT SIDE: Provider Information */}
            <div className="flex-1 pr-8">
              {/* Inline Details */}
              <div className="space-y-1.5 text-[15px]"
                   style={{ fontFamily: "Inter, sans-serif", lineHeight: '1.6' }}>

                {provider?.description && (
                  <p className="text-charcoal-500">
                    {provider.description}
                  </p>
                )}

                {provider?.phone && (
                  <p>
                    <span className="font-semibold text-[#556B5C]">Phone:</span>{" "}
                    <span className="text-charcoal-600">{provider.phone}</span>
                  </p>
                )}

                {provider?.email && (
                  <p>
                    <span className="font-semibold text-[#556B5C]">Email:</span>{" "}
                    <span className="text-charcoal-600">{provider.email}</span>
                  </p>
                )}

                {provider?.address && (
                  <p>
                    <span className="font-semibold text-[#556B5C]">Address:</span>{" "}
                    <span className="text-charcoal-600">{provider.address}</span>
                  </p>
                )}

              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

// Category Sidebar
const CategorySidebar = ({ catalogs, selected, onSelect }) => {
  return (
    <aside className="w-[280px] flex-shrink-0 sticky top-[88px] h-[calc(100vh-88px)] overflow-y-auto">
      <div className="space-y-3 py-6">
        {catalogs.map(cat => (
          <button
            key={cat.id}
            onClick={() => onSelect(cat.id)}
            className={`w-full flex items-center gap-4 px-6 py-4 rounded-full text-left transition-all font-medium text-[17px] ${
              selected === cat.id
                ? 'bg-sage-500 text-white shadow-[0_2px_8px_rgba(85,107,92,0.3)]'
                : 'bg-cream-50 text-sage-500 hover:bg-cream-100'
            }`}
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
              selected === cat.id ? 'bg-sage-700' : 'bg-[#E8F0EA]'
            }`}>
              <div className={selected === cat.id ? 'text-white' : 'text-sage-500'}>
                <Scissors size={24} weight="regular" />
              </div>
            </div>
            <span className="truncate">{cat.name}</span>
          </button>
        ))}
      </div>
    </aside>
  );
};

// Service Card Component with MinPrice "Starting from" badge
const ServiceCard = ({ service, onClick }) => {
  const isActive = service?.isActive !== false; // Default to true if undefined

  return (
    <div
      onClick={isActive ? onClick : undefined}
      className={`bg-white rounded-2xl overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-all group relative ${
        isActive
          ? 'cursor-pointer hover:shadow-[0_4px_16px_rgba(0,0,0,0.12)]'
          : 'opacity-60 cursor-not-allowed'
      }`}
    >
      {/* Inactive Overlay */}
      {!isActive && (
        <div className="absolute inset-0 bg-charcoal-600/20 z-10 flex items-center justify-center backdrop-blur-[1px]">
          <div className="bg-charcoal-600/90 text-white px-6 py-3 rounded-full font-bold text-sm shadow-xl" style={{ fontFamily: 'Inter, sans-serif' }}>
            Currently Unavailable
          </div>
        </div>
      )}

      {/* Service Icon */}
      <div className="relative h-48 bg-gradient-to-br from-[#E8D8E0] to-[#DFC9D8] overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-32 h-32 bg-white/30 rounded-full flex items-center justify-center">
            <Scissors className="w-16 h-16 text-white/60" weight="regular" />
          </div>
        </div>

        {/* Status Badge - Top Left */}
        <div className={`absolute top-4 left-4 px-3 py-1.5 rounded-full text-xs font-bold shadow-lg ${
          isActive
            ? 'bg-green-500 text-white'
            : 'bg-charcoal-500 text-white'
        }`} style={{ fontFamily: 'Inter, sans-serif' }}>
          {isActive ? 'Active' : 'Inactive'}
        </div>

        {/* MinPrice Badge - "Starting from" */}
        <div className="absolute top-4 right-4 bg-white px-4 py-2.5 rounded-full shadow-lg">
          <div className="text-xs font-medium text-sage-600 text-center" style={{ fontFamily: 'Inter, sans-serif', lineHeight: '1.2' }}>
            Starting from
          </div>
          <div className="text-base font-bold text-sage-700 text-center" style={{ fontFamily: 'Inter, sans-serif', lineHeight: '1.2' }}>
            {service?.minPrice ? `${service.minPrice.toFixed(3)} BD` : "20.000 BD"}
          </div>
        </div>
      </div>

      {/* Service Info */}
      <div className="p-5">
        <h3 className={`font-bold text-lg mb-2 line-clamp-2 transition-colors ${
          isActive ? 'text-charcoal-600 group-hover:text-sage-600' : 'text-charcoal-400'
        }`} style={{ fontFamily: 'Merriweather, serif' }}>
          {service?.name || "Service"}
        </h3>

        {/* Dynamic Star Rating */}
        <div className="flex items-center gap-1 mb-3">
          {service?.averageRating && service.averageRating > 0 ? (
            <>
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className="w-4 h-4"
                  weight="fill"
                  style={{
                    color: i < Math.floor(service.averageRating)
                      ? '#556B5C'
                      : '#E5E7EB'
                  }}
                />
              ))}
              <span className="text-sm font-semibold text-charcoal-600 ml-1">
                {service.averageRating.toFixed(1)}
              </span>
            </>
          ) : (
            <span className="px-3 py-1 bg-sage-500 text-white text-xs font-bold rounded-full" style={{ fontFamily: 'Inter, sans-serif' }}>
              NEW
            </span>
          )}
        </div>

        {service?.description && (
          <p className={`text-sm mb-4 line-clamp-2 ${isActive ? 'text-charcoal-400' : 'text-charcoal-300'}`}>
            {service.description}
          </p>
        )}

        <button
          disabled={!isActive}
          className={`w-full font-semibold py-3 rounded-xl transition-all shadow-[0_2px_8px_rgba(85,107,92,0.2)] ${
            isActive
              ? 'bg-sage-500 hover:bg-sage-600 text-white'
              : 'bg-grey-200 text-charcoal-400 cursor-not-allowed'
          }`}
        >
          {isActive ? 'View Details' : 'Unavailable'}
        </button>
      </div>
    </div>
  );
};

// Main Service Provider Detail View Component
const ServiceProviderDetailView = () => {
  const { providerId } = useParams();
  const navigate = useNavigate();
  const [provider, setProvider] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [catalogs, setCatalogs] = useState([]);
  const [selectedCatalog, setSelectedCatalog] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("popular");
  const [services, setServices] = useState([]);
  const [allReviews, setAllReviews] = useState([]);
  const [bookings, setBookings] = useState([]);

  // Service booking states
  const [selectedService, setSelectedService] = useState(null);
  const [showServiceDetails, setShowServiceDetails] = useState(false);
  const [showServiceCheckout, setShowServiceCheckout] = useState(false);
  const [bookingData, setBookingData] = useState(null);


  // User profile states
const [displayName, setDisplayName] = useState("Customer");
const [userProfile, setUserProfile] = useState(null);

// Active order banner states
const [activeOrderCount, setActiveOrderCount] = useState(0);
const [showOrderBanner, setShowOrderBanner] = useState(false);

const [cart, setCart] = useState([]);

// User IDs
const userProfileId = parseInt(getUserId()) || 4;
const customerId = 1; // TODO: Get from API based on userProfileId



  // Check authentication on mount
  // useEffect(() => {
  //   if (!isAuthenticated()) {
  //     navigate('/login');
  //   }
  // }, [navigate]);

  // Fetch user profile details
const fetchUserProfile = async () => {
  try {
    const profile = await getUserProfile(userProfileId);
    if (profile) {
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

      setUserProfile(normalizedProfile);
      if (normalizedProfile.displayName) {
        setDisplayName(normalizedProfile.displayName);
      }
    }
  } catch (error) {
    console.error('Error fetching user profile:', error);
  }
};

// Fetch user profile on mount
useEffect(() => {
  fetchUserProfile();
}, [userProfileId]);

// Check for active orders
useEffect(() => {
  if (customerId) {
    const activeOrderKey = `beyti_activeOrder_${customerId}`;
    const bannerDismissedKey = `beyti_bannerDismissed_${customerId}`;
    
    const activeOrder = localStorage.getItem(activeOrderKey);
    const bannerDismissed = localStorage.getItem(bannerDismissedKey);
    
    if (activeOrder && !bannerDismissed) {
      try {
        const orderData = JSON.parse(activeOrder);
        setActiveOrderCount(1);
        setShowOrderBanner(true);
      } catch (err) {
        console.error('Error parsing active order:', err);
      }
    }
  }
}, [customerId]);

// Load cart from localStorage
useEffect(() => {
  if (customerId) {
    // Check all cart keys for this customer
    let allCartItems = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(`beyti_cart_`) && key.endsWith(`_${customerId}`)) {
        try {
          const savedCart = localStorage.getItem(key);
          if (savedCart) {
            const parsedCart = JSON.parse(savedCart);
            allCartItems = [...allCartItems, ...parsedCart];
          }
        } catch (err) {
          console.error('Error parsing cart:', err);
        }
      }
    }
    setCart(allCartItems);
  }
}, [customerId]);

const handleTrackOrder = () => {
  navigate('/customer-dashboard');
};

const handleDismissBanner = () => {
  setShowOrderBanner(false);
  if (customerId) {
    localStorage.setItem(`beyti_bannerDismissed_${customerId}`, 'true');
  }
};

const handleCartClick = () => {
  // Find store with items and navigate
  let targetStoreId = null;
  let targetStoreName = null;
  
  if (customerId) {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(`beyti_cart_`) && key.endsWith(`_${customerId}`)) {
        try {
          const savedCart = localStorage.getItem(key);
          if (savedCart) {
            const parsedCart = JSON.parse(savedCart);
            if (parsedCart.length > 0) {
              const parts = key.split('_');
              targetStoreId = parts[2];
              targetStoreName = parsedCart[0]?.storeName;
              break;
            }
          }
        } catch (err) {
          console.error('Error parsing cart:', err);
        }
      }
    }
  }
  
  navigate("/checkout", { 
    state: { 
      customerId, 
      customerName: displayName,
      storeName: targetStoreName,
      storeId: targetStoreId
    } 
  });
};

  useEffect(() => {
    // Scroll to top when component mounts or providerId changes
    window.scrollTo({ top: 70, behavior: 'smooth' });

    const loadProvider = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch provider details
        const providerData = await getServiceProviderById(providerId);
        console.log('[ServiceProviderDetailView] Provider data:', providerData);
        setProvider(providerData);

        // Fetch catalogs filtered by the service provider's enrolled category
        const catalogsData = await getServiceCatalogs(providerData.serviceCategoryId);
        console.log('[ServiceProviderDetailView] Catalogs data (filtered by category):', catalogsData);
        setCatalogs(Array.isArray(catalogsData) ? catalogsData : []);

        // Fetch services for this provider
        const servicesData = await getServiceProviderServices(providerId);
        console.log('[ServiceProviderDetailView] Services data:', servicesData);

        // Fetch all bookings for this provider
        const bookingsData = await getServiceBookings(providerId);
        console.log('[ServiceProviderDetailView] Bookings data:', bookingsData);
        setBookings(Array.isArray(bookingsData) ? bookingsData : []);

        // Fetch all reviews for this provider
        const reviewsData = await getProviderServiceReviews(providerId);
        console.log('[ServiceProviderDetailView] Reviews data:', reviewsData);
        setAllReviews(Array.isArray(reviewsData) ? reviewsData : []);

        // Create a map of reviews by serviceId using bookings
        // Review -> Booking -> ServiceId
        const reviewsByServiceId = {};
        (Array.isArray(reviewsData) ? reviewsData : []).forEach(review => {
          // Find the booking for this review
          const booking = (Array.isArray(bookingsData) ? bookingsData : []).find(
            b => b.id === review.serviceBookingId
          );

          if (booking && booking.serviceId) {
            if (!reviewsByServiceId[booking.serviceId]) {
              reviewsByServiceId[booking.serviceId] = [];
            }
            reviewsByServiceId[booking.serviceId].push(review);
          }
        });

        console.log('[ServiceProviderDetailView] Reviews grouped by serviceId:', reviewsByServiceId);

        // Calculate average rating for each service based on reviews specific to that service
        const servicesWithRatings = (Array.isArray(servicesData) ? servicesData : []).map(service => {
          // Get ALL reviews for this specific service (including hidden ones for rating calculation)
          const allServiceReviews = reviewsByServiceId[service.id] || [];

          // Filter only visible reviews for display count
          const visibleServiceReviews = allServiceReviews.filter(review => !review.isHidden);

          console.log(`[Service ${service.id}] Found ${allServiceReviews.length} total reviews (${visibleServiceReviews.length} visible)`);

          let averageRating = 0;
          if (allServiceReviews.length > 0) {
            // Calculate rating from ALL reviews (including hidden ones)
            const sum = allServiceReviews.reduce((acc, review) => acc + (review.overallRating || 0), 0);
            averageRating = sum / allServiceReviews.length;
            console.log(`[Service ${service.id}] Average rating: ${averageRating.toFixed(2)} from ${allServiceReviews.length} reviews`);
          }

          return {
            ...service,
            averageRating,
            reviewCount: visibleServiceReviews.length // Show count of visible reviews only
          };
        });

        setServices(servicesWithRatings);

        // Calculate overall provider rating from all reviews
        const allReviewsArray = Array.isArray(reviewsData) ? reviewsData : [];
        if (allReviewsArray.length > 0) {
          const totalRating = allReviewsArray.reduce((acc, review) => acc + (review.overallRating || 0), 0);
          const providerAverageRating = totalRating / allReviewsArray.length;
          console.log(`[Provider ${providerId}] Calculated average rating: ${providerAverageRating.toFixed(2)} from ${allReviewsArray.length} reviews`);

          // Update provider with calculated rating
          setProvider(prevProvider => ({
            ...prevProvider,
            averageRating: providerAverageRating,
            reviewCount: allReviewsArray.length
          }));
        }

        // Set first catalog as default
        if (catalogsData && catalogsData.length > 0) {
          setSelectedCatalog(catalogsData[0].id);
        }
      } catch (err) {
        console.error('[ServiceProviderDetailView] Error loading provider:', err);
        setError(err.message || "Failed to load service provider");
      } finally {
        setLoading(false);
      }
    };

    if (providerId) {
      loadProvider();
    }
  }, [providerId]);

  // Get catalog title
  const getCatalogTitle = (catalogId) => {
    const catalog = catalogs.find(c => c.id === catalogId);
    return catalog?.name || "Services";
  };

  // Handle service card click
  const handleServiceClick = (service) => {
    setSelectedService(service);
    setShowServiceDetails(true);
  };

  // Handle book service
  const handleBookService = (bookingInfo) => {
    setBookingData(bookingInfo);
    setShowServiceDetails(false);
    setShowServiceCheckout(true);
  };

  // Close modals
  const closeServiceDetails = () => {
    setShowServiceDetails(false);
    setSelectedService(null);
  };

  const closeServiceCheckout = () => {
    setShowServiceCheckout(false);
    setBookingData(null);
  };

  // Filter services by selected catalog and search query
  const filteredServices = services.filter(service => {
    // Filter by catalog
    const matchesCatalog = selectedCatalog 
      ? service.serviceCatalogId === selectedCatalog 
      : true;
    
    // Filter by search query
    const matchesSearch = searchQuery.trim() === '' 
      ? true 
      : service.name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesCatalog && matchesSearch;
  });

  // Sort filtered services
  const sortedServices = [...filteredServices].sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return (a.minPrice || 0) - (b.minPrice || 0);
      case 'price-high':
        return (b.minPrice || 0) - (a.minPrice || 0);
      case 'newest':
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      case 'popular':
      default:
        return (b.averageRating || 0) - (a.averageRating || 0);
    }
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-grey-stroke border-t-sage-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-charcoal-600 font-medium">Loading service provider...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 bg-error-bg rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-12 h-12 text-error-btn" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-charcoal-600 mb-2">Error Loading Service Provider</h3>
          <p className="text-charcoal-400 mb-6">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-3 bg-sage-500 hover:bg-sage-600 text-white font-semibold rounded-full"
          >
            Back to Service Providers
          </button>
        </div>
      </div>
    );
  }

  return (
  <div className="min-h-screen bg-cream-50">
    {/* Header */}
    <CustomerHeader
      pageTitle={provider?.businessName || provider?.displayName || "Service Provider"}
      showSearch={false}
      customerName={displayName}
      customerId={customerId}
      userProfileId={userProfileId}
      cart={cart}
      stores={[]}
      customerAddresses={[]}
      onCartClick={handleCartClick}
      onCustomerClick={() => {
        console.log('Auto-login triggered');
      }}
      onBack={() => navigate(-1)}
      showBackButton={true}
      variant="store"
      currentContext="services"
      showContextSwitch={true}
    />

    {/* Active Order Banner */}
    {showOrderBanner && activeOrderCount > 0 && (
      <ActiveOrderBanner
        activeOrderCount={activeOrderCount}
        onTrack={handleTrackOrder}
        onDismiss={handleDismissBanner}
      />
    )}

      <ServiceProviderInfo provider={provider} />

      <div className="max-w-[1440px] mx-auto px-12 py-8">
        <div className="flex gap-8">
          <CategorySidebar
            catalogs={catalogs}
            selected={selectedCatalog}
            onSelect={setSelectedCatalog}
          />

          <div className="flex-1">
            {/* Category Title with Search and Sort - ALL IN ONE ROW */}
            <div className="flex items-center justify-between mb-8">
              {/* Category Title on the left */}
              <h2 className="text-3xl font-bold text-[#556B5C]" style={{ fontFamily: 'Merriweather, serif' }}>
                {getCatalogTitle(selectedCatalog)}
              </h2>

              {/* Search and Sort on the right */}
              <div className="flex gap-3 items-center">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-5 py-2.5 bg-white rounded-full border border-grey-stroke hover:border-sage-500 transition-all shadow-[0_2px_8px_rgba(0,0,0,0.06)] text-charcoal-600 font-medium cursor-pointer text-sm"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  <option value="popular">Sort All</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="newest">Newest First</option>
                </select>

                <div className="relative w-64">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search Services..."
                    className="w-full pl-10 pr-4 py-2.5 bg-white rounded-full border border-grey-stroke focus:outline-none focus:border-sage-500 text-charcoal-600 shadow-[0_2px_8px_rgba(0,0,0,0.06)] text-sm"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  />
                  <MagnifyingGlass className="w-4 h-4 text-charcoal-400 absolute left-3.5 top-1/2 -translate-y-1/2" weight="bold" />
                </div>
              </div>
            </div>

            {/* Services Grid */}
            {sortedServices.length > 0 ? (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortedServices.map(service => (
                  <ServiceCard
                    key={service.id}
                    service={service}
                    onClick={() => handleServiceClick(service)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="w-24 h-24 bg-grey-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Scissors className="w-12 h-12 text-charcoal-400" weight="regular" />
                </div>
                <h3 className="text-xl font-bold text-charcoal-600 mb-2">No Services Found</h3>
                <p className="text-charcoal-400">
                  {searchQuery ? 'No services match your search.' : 'This category has no services yet.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Service Details Modal */}
      <ServiceDetailsSheet
        service={selectedService}
        provider={provider}
        isOpen={showServiceDetails}
        onClose={closeServiceDetails}
        onBookService={handleBookService}
        allReviews={allReviews}
        bookings={bookings}
      />

      {/* Service Checkout Modal */}
      {showServiceCheckout && bookingData && (
        <ServiceCheckout
          bookingData={bookingData}
          onClose={closeServiceCheckout}
        />
      )}
    </div>
  );
};

export default ServiceProviderDetailView;
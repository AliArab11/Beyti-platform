import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Scissors, Star, Storefront, Heart, Briefcase, Users } from "@phosphor-icons/react";
import { getServiceProviders, getServiceCategoryList, getServiceCatalogs, getUserProfile, updateUserProfile, getServiceProviderServices, getProviderServiceReviews } from "../../services/api";
import { isAuthenticated, getUserId, handleSuspensionError } from "../../utils/authUtils";
import CustomerHeader from "../../components/CustomerHeader";
import ActiveOrderBanner from "./Components/ActiveOrderBanner";
import { useSignalR } from '../../contexts/SignalRContext';

// Main Category Tabs Component with Scrolling
const CategoryTabs = ({ categories, selected, onSelect }) => {
  const scrollContainerRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateArrows = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const scrollLeft = Math.round(container.scrollLeft);
    const scrollWidth = container.scrollWidth;
    const clientWidth = container.clientWidth;
    
    setCanScrollLeft(scrollLeft > 1);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    container.scrollLeft = 0;
    
    const timer = setTimeout(updateArrows, 200);
    
    container.addEventListener('scroll', updateArrows);
    window.addEventListener('resize', updateArrows);
    
    return () => {
      clearTimeout(timer);
      container.removeEventListener('scroll', updateArrows);
      window.removeEventListener('resize', updateArrows);
    };
  }, [categories]);

  const scroll = (direction) => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const scrollAmount = 360;
    container.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  };

  const showArrows = categories.length > 3;

  return (
    <div className="flex justify-center items-center mb-6 w-full relative">
      {showArrows && canScrollLeft && (
        <button
          onClick={() => scroll('left')}
          className="absolute left-4 z-10 w-10 h-10 bg-white rounded-full shadow-[0_2px_10px_rgba(0,0,0,0.12)] flex items-center justify-center hover:bg-cream-50 transition-all"
        >
          <svg className="w-5 h-5 text-charcoal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      <div 
        ref={scrollContainerRef}
        className="overflow-x-auto py-2 scrollbar-hide snap-x snap-mandatory" 
        style={{ 
          maxWidth: '1400px',
          width: '100%',
          scrollbarWidth: 'none', 
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        <style>{`
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
        `}</style>
        <div className="flex gap-5 justify-start" style={{ 
          marginLeft: (categories.length + 1) <= 3 ? 'auto' : '0',
          marginRight: (categories.length + 1) <= 3 ? 'auto' : '0',
          width: (categories.length + 1) <= 3 ? 'fit-content' : 'auto'
        }}>
          {/* All Categories Button */}
          <button
            onClick={() => onSelect(null)}
            className={`px-20 py-4 rounded-full font-semibold text-[19px] transition-all whitespace-nowrap flex-shrink-0 snap-start ${
              selected === null
                ? 'bg-sage-500 text-white shadow-[0_2px_12px_rgba(85,107,92,0.25)]'
                : 'bg-cream-50 text-charcoal-600 border-2 border-grey-stroke hover:border-sage-500 shadow-[0_1px_3px_rgba(0,0,0,0.08)]'
            }`}
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            All Categories
          </button>

          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => onSelect(category.id)}
              className={`px-20 py-4 rounded-full font-semibold text-[19px] transition-all whitespace-nowrap flex-shrink-0 snap-start ${
                selected === category.id
                  ? 'bg-sage-500 text-white shadow-[0_2px_12px_rgba(85,107,92,0.25)]'
                  : 'bg-cream-50 text-charcoal-600 border-2 border-grey-stroke hover:border-sage-500 shadow-[0_1px_3px_rgba(0,0,0,0.08)]'
              }`}
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {showArrows && canScrollRight && (
        <button
          onClick={() => scroll('right')}
          className="absolute right-4 z-10 w-10 h-10 bg-white rounded-full shadow-[0_2px_10px_rgba(0,0,0,0.12)] flex items-center justify-center hover:bg-cream-50 transition-all"
        >
          <svg className="w-5 h-5 text-charcoal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}
    </div>
  );
};



// Featured Carousel Component
const FeaturedCarousel = ({ providers, onProviderClick, services }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Get top 5 rated providers only (must have a rating)
  const featured = providers
    .filter(provider => {
      const rating = provider.averageRating;
      return rating !== null && rating !== undefined && rating > 0;
    })
    .sort((a, b) => b.averageRating - a.averageRating)
    .slice(0, 5);

  useEffect(() => {
    if (featured.length === 0) return;

    const maxIndex = Math.max(0, featured.length - 3);
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % (maxIndex + 1));
    }, 3000);

    return () => clearInterval(interval);
  }, [featured.length]);

  if (featured.length === 0) return null;

  return (
    <div className="relative mb-16 pb-4">

      <button
        onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
        disabled={currentIndex === 0}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white rounded-full shadow-[0_2px_10px_rgba(0,0,0,0.12)] flex items-center justify-center hover:bg-cream-50 transition-all disabled:opacity-30"
      >
        <svg className="w-5 h-5 text-charcoal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <div className="overflow-hidden px-12 py-3">
        <div className="flex gap-6 transition-transform duration-500" style={{ transform: `translateX(-${currentIndex * (100 / 3)}%)` }}>
          {featured.map((provider, idx) => {
            const providerServices = services[provider.id] || [];
            const activeServicesCount = providerServices.filter(s => s.isActive || s.IsActive).length || 0;

            return (
              <div
                key={provider.id || idx}
                onClick={() => onProviderClick(provider.id)}
                className="flex-shrink-0 w-[calc(33.333%-16px)] bg-white rounded-2xl overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.12)] transition-all cursor-pointer"
              >
                <div className="relative h-32 bg-gradient-to-br from-[#E8D8E0] to-[#DFC9D8]">
                  {/* Provider Status Badge */}
                  {provider.status && (
                    <div className="absolute top-3 left-3">
                      <div className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 ${
                        provider.status === 'Available' ? 'bg-success-btn text-white' :
                        provider.status === 'Busy' ? 'bg-yellow-500 text-white' :
                        provider.status === 'Unavailable' ? 'bg-error-btn text-white' :
                        'bg-grey-500 text-white'
                      }`}>
                        <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                        {provider.status.toUpperCase()}
                      </div>
                    </div>
                  )}

                  <div className="absolute -bottom-8 left-4">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.15)] border-4 border-white">
                      <Scissors className="w-8 h-8 text-sage-500" weight="regular" />
                    </div>
                  </div>
                </div>

                <div className="pt-10 p-4 bg-white">
                  <h3 className="font-bold text-charcoal-600 text-base mb-2" style={{ fontFamily: 'Merriweather, serif' }}>
                    {provider.businessName || provider.displayName || 'Service Provider'}
                  </h3>
                  <div className="flex items-center gap-1 mb-3">
                    {(() => {
                      const rating = provider.averageRating || 0;
                      const hasRating =
                        provider.averageRating !== null &&
                        provider.averageRating !== undefined &&
                        provider.averageRating > 0;


                      if (!hasRating) {
                        return (
                          <span className="px-3 py-1 bg-sage-500 text-white text-xs font-bold rounded-full" style={{ fontFamily: 'Inter, sans-serif' }}>
                            NEW
                          </span>
                        );
                      }

                      return (
                        <>
                          {[0,1,2,3,4].map(i => {
                            const fillPercentage = Math.max(0, Math.min(100, (rating - i) * 100));
                            return (
                              <div key={i} className="relative w-3.5 h-3.5">
                                <Star size={14} className="text-grey-stroke absolute" weight="fill" />
                                <div className="overflow-hidden absolute" style={{ width: `${fillPercentage}%` }}>
                                  <Star size={14} className="text-sage-500" weight="fill" />
                                </div>
                              </div>
                            );
                          })}
                          <span className="text-xs font-semibold text-charcoal-600 ml-1" style={{ fontFamily: 'Inter, sans-serif' }}>
                            {rating.toFixed(1)}
                          </span>
                        </>
                      );
                    })()}
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {activeServicesCount > 0 ? (
                      <span className="px-3 py-1 bg-cream-100 rounded-full text-xs font-medium text-charcoal-600" style={{ fontFamily: 'Inter, sans-serif' }}>
                        {activeServicesCount} {activeServicesCount === 1 ? 'Service' : 'Services'}
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-grey-200 rounded-full text-xs font-medium text-charcoal-400 italic" style={{ fontFamily: 'Inter, sans-serif' }}>
                        No services
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <button
        onClick={() => setCurrentIndex(Math.min(featured.length - 3, currentIndex + 1))}
        disabled={currentIndex >= featured.length - 3}
        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white rounded-full shadow-[0_2px_10px_rgba(0,0,0,0.12)] flex items-center justify-center hover:bg-cream-50 transition-all disabled:opacity-30"
      >
        <svg className="w-5 h-5 text-charcoal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      <div className="flex justify-center gap-2 mt-6">
        {Array.from({ length: Math.max(1, featured.length - 2) }).map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`h-2 rounded-full transition-all ${
              currentIndex === idx ? 'bg-sage-500 w-8' : 'bg-grey-stroke w-2'
            }`}
          />
        ))}
      </div>
    </div>
  );
};


// Star Rating Component
const StarRating = ({ rating }) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-0.5">
        {[...Array(fullStars)].map((_, idx) => (
          <svg key={`full-${idx}`} className="w-4 h-4 text-sage-500" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
        {hasHalfStar && (
          <svg className="w-4 h-4 text-sage-500" fill="currentColor" viewBox="0 0 20 20">
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
        {/* Provider Status Badge */}
        {provider.status && (
          <div className="absolute top-3 left-3">
            <div className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 ${
              provider.status === 'Available' ? 'bg-success-btn text-white' :
              provider.status === 'Busy' ? 'bg-yellow-500 text-white' :
              provider.status === 'Unavailable' ? 'bg-error-btn text-white' :
              'bg-grey-500 text-white'
            }`}>
              <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
              {provider.status.toUpperCase()}
            </div>
          </div>
        )}

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
          {provider.averageRating === null ||
          provider.averageRating === undefined ||
          provider.averageRating <= 0 ? (
            <span
              className="inline-block px-3 py-1 bg-sage-500 text-white text-xs font-bold rounded-full"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              NEW
            </span>
          ) : (
            <StarRating rating={provider.averageRating} />
          )}
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
      </div>
    </div>
  );
};

// Main Component
const ServiceProviderStoresView = () => {
  const navigate = useNavigate();
  const { on, off } = useSignalR();
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [serviceCatalogs, setServiceCatalogs] = useState([]);
  const [selectedCatalog, setSelectedCatalog] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [displayName, setDisplayName] = useState("Customer");
  const [userProfile, setUserProfile] = useState(null);
  const [providerServices, setProviderServices] = useState({}); // Map of providerId -> services array

  const categoryScrollRef = useRef(null);
  const [canScrollCatLeft, setCanScrollCatLeft] = useState(false);
  const [canScrollCatRight, setCanScrollCatRight] = useState(false);

  const serviceCatalogScrollRef = useRef(null);
  const [canScrollCatalogLeft, setCanScrollCatalogLeft] = useState(false);
  const [canScrollCatalogRight, setCanScrollCatalogRight] = useState(false);

  const [activeOrderCount, setActiveOrderCount] = useState(0);
  const [showOrderBanner, setShowOrderBanner] = useState(false);

  const [cart, setCart] = useState([]);

  // Filter state
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [activeFilters, setActiveFilters] = useState({
    rating: null, // null, 1, 2, 3, 4, 5
  });

  // Check authentication on mount
  // useEffect(() => {
  //   if (!isAuthenticated()) {
  //     navigate('/login');
  //   }
  // }, [navigate]);

  
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
        setActiveOrderCount(1); // Currently tracking 1 order at a time
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

  // Fetch Service Catalogs when selected category changes
  useEffect(() => {
    const fetchCatalogs = async () => {
      if (!selectedCategory) {
        setServiceCatalogs([]);
        setSelectedCatalog(null);
        return;
      }

      try {
        console.log('[fetchCatalogs] Fetching catalogs for category:', selectedCategory);
        const catalogs = await getServiceCatalogs(selectedCategory);
        console.log('[fetchCatalogs] Received catalogs:', catalogs);
        // Filter out inactive catalogs (IsActive === true)
        const activeCatalogs = Array.isArray(catalogs)
          ? catalogs.filter(catalog => catalog.IsActive === true || catalog.isActive === true)
          : [];
        console.log('[fetchCatalogs] Active catalogs:', activeCatalogs);
        setServiceCatalogs(activeCatalogs);
        setSelectedCatalog(null); // Reset to "All Providers" when category changes
      } catch (error) {
        console.error('Failed to fetch service catalogs:', error);
        setServiceCatalogs([]);
      }
    };

    fetchCatalogs();
  }, [selectedCategory]);

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

      // Set categories - filter out inactive categories (IsActive === true)
      const cats = Array.isArray(categoriesData)
        ? categoriesData.filter(category => category.IsActive === true || category.isActive === true)
        : [];
      console.log('[fetchInitialData] Active categories:', cats);
      setCategories(cats);

      // Don't set a default category - let user choose
      // Category will be null by default, showing all providers

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
    } catch (error) {
      console.error("Failed to load initial data:", error);
      setProviders([]);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter helper functions
  const handleFilterChange = (filterType, value) => {
    setActiveFilters(prev => ({
      ...prev,
      [filterType]: prev[filterType] === value ? null : value
    }));
  };

  const clearAllFilters = () => {
    setActiveFilters({
      rating: null,
    });
  };

  const getActiveFilterCount = () => {
    return Object.values(activeFilters).filter(v => v !== null).length;
  };

  // Close filter dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showFilterDropdown && !event.target.closest('.relative')) {
        setShowFilterDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showFilterDropdown]);

  // SignalR listener for real-time service updates
  useEffect(() => {
    const handleServiceUpdate = (data) => {
      console.log('[ServiceProviderStoresView] Received service update:', data);

      // Refresh providers when any service is created or updated
      if (data.type === 'ServiceCreated' || data.type === 'ServiceUpdated') {
        console.log('[ServiceProviderStoresView] Refreshing providers due to service update');
        fetchInitialData();
      }
    };

    if (on) {
      on('ReceiveServiceUpdate', handleServiceUpdate);
    }

    return () => {
      if (off) {
        off('ReceiveServiceUpdate', handleServiceUpdate);
      }
    };
  }, [on, off]);


  // Update service catalog scroll arrows
useEffect(() => {
  const updateScrollArrows = () => {
    const container = serviceCatalogScrollRef.current;
    if (!container) return;

    const scrollLeft = Math.round(container.scrollLeft);
    const scrollWidth = container.scrollWidth;
    const clientWidth = container.clientWidth;
    
    setCanScrollCatalogLeft(scrollLeft > 1);
    setCanScrollCatalogRight(scrollLeft < scrollWidth - clientWidth - 1);
  };

  const timer = setTimeout(updateScrollArrows, 200);
  
  const container = serviceCatalogScrollRef.current;
  if (container) {
    window.addEventListener('resize', updateScrollArrows);
  }
  
  return () => {
    clearTimeout(timer);
    window.removeEventListener('resize', updateScrollArrows);
  };
}, [serviceCatalogs, selectedCatalog]);

  const filteredProviders = providers.filter(provider => {
    const searchLower = searchQuery.toLowerCase();
    const displayName = provider.displayName || '';
    const businessName = provider.businessName || '';

    // Filter by search query
    const matchesSearch = displayName.toLowerCase().includes(searchLower) ||
                         businessName.toLowerCase().includes(searchLower);

    // Filter by category if one is selected
    const matchesCategory = !selectedCategory || provider.serviceCategoryId === selectedCategory;

    // Filter by service catalog - check if provider has at least one service with this catalog
    let matchesCatalog = true;
    if (selectedCatalog !== null) {
      const services = providerServices[provider.id] || [];
      // Provider must have at least one active service that belongs to the selected catalog
      matchesCatalog = services.some(service => {
        const isActive = service.isActive || service.IsActive;
        const catalogId = service.serviceCatalogId || service.ServiceCatalogId;
        const matches = isActive && catalogId === selectedCatalog;

        if (matches) {
          console.log(`[Filter] Provider ${provider.id} matches catalog ${selectedCatalog} via service:`, service.name || service.Name);
        }

        return matches;
      });

      if (!matchesCatalog && services.length > 0) {
        console.log(`[Filter] Provider ${provider.id} (${provider.businessName || provider.displayName}) has NO services matching catalog ${selectedCatalog}`);
      }
    }

    // Rating filter - providers with no rating are always included
    if (activeFilters.rating) {
      const rating = provider.averageRating;
      // If provider has no rating (null/undefined), include it
      if (rating !== null && rating !== undefined) {
        // Only filter out providers that have ratings below the threshold
        if (rating < activeFilters.rating) return false;
      }
    }

    return matchesSearch && matchesCategory && matchesCatalog;
  }).sort((a, b) => {
    // Sort providers: rated providers first (by rating desc), then providers without ratings
    const ratingA = a.averageRating;
    const ratingB = b.averageRating;

    const hasRatingA = ratingA !== null && ratingA !== undefined;
    const hasRatingB = ratingB !== null && ratingB !== undefined;

    // Both have ratings - sort by rating (highest first)
    if (hasRatingA && hasRatingB) {
      return ratingB - ratingA;
    }

    // Only A has rating - A comes first
    if (hasRatingA && !hasRatingB) {
      return -1;
    }

    // Only B has rating - B comes first
    if (!hasRatingA && hasRatingB) {
      return 1;
    }

    // Neither has rating - maintain original order
    return 0;
  });


  return (
    <div className="flex min-h-screen bg-cream-50 dark:bg-charcoal-600">
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <CustomerHeader
          pageTitle="Service Providers"
          showSearch={false}
          customerName={displayName}
          customerId={customerId}
          userProfileId={userProfileId}
          cart={cart}
          stores={[]}
          customerAddresses={[]}
          onCartClick={handleCartClick}
          onCustomerClick={() => {
            // Auto-login with fixed credentials
            // This mimics what happens when user is already logged in
            console.log('Auto-login triggered');
          }}
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

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto" style={{ backgroundColor: '#FAF7F2' }}>
         <div className="max-w-[1600px] mx-auto px-8 py-8">
            <div className="flex justify-center">
              <CategoryTabs
                categories={categories}
                selected={selectedCategory}
                onSelect={setSelectedCategory}
              />
            </div>

            <div className="mt-2">
              <div className="flex-1 max-w-[1400px] mx-auto">
                {/* Featured Section - Only show if there are featured providers */}
                  {(() => {
                    const hasFeaturedProviders = filteredProviders
                      .filter(provider => {
                        const rating = provider.averageRating;
                        return rating !== null && rating !== undefined && rating > 0;
                      }).length > 0;

                    return hasFeaturedProviders ? (
                      <>
                        <div className="mb-3">
                          <h2 className="text-2xl font-bold text-charcoal-700" style={{ fontFamily: 'Merriweather, serif' }}>
                            Top Rated Providers
                          </h2>
                        </div>
                        
                        <FeaturedCarousel
                          providers={filteredProviders}
                          onProviderClick={(id) => navigate(`/service-provider/${id}`)}
                          services={providerServices}
                        />
                      </>
                    ) : null;
                  })()}
                  

                  {/* Search Bar */}
                <div className="flex gap-4 items-center mb-8">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search Service Providers..."
                      className="w-full pl-12 pr-4 py-3.5 bg-white rounded-full border border-grey-stroke focus:outline-none focus:border-sage-500 text-charcoal-600 shadow-[0_2px_8px_rgba(0,0,0,0.06)]"
                      style={{ fontFamily: 'Inter, sans-serif', fontSize: '16px' }}
                    />
                    <svg className="w-5 h-5 text-charcoal-400 absolute left-4 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>

                  {/* Filter Button */}
                  <div className="relative">
                    <button
                      onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                      className="flex items-center gap-3 px-6 py-3.5 bg-white rounded-full border border-grey-stroke hover:border-sage-500 transition-all shadow-[0_2px_8px_rgba(0,0,0,0.06)] relative"
                    >
                      <svg className="w-5 h-5 text-sage-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                      </svg>
                      <span className="text-charcoal-600 font-semibold text-[14px]" style={{ fontFamily: 'Inter, sans-serif' }}>
                        Filter
                      </span>
                      {getActiveFilterCount() > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-sage-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                          {getActiveFilterCount()}
                        </span>
                      )}
                      <svg className="w-4 h-4 text-charcoal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {/* Filter Dropdown */}
                    {showFilterDropdown && (
                      <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-grey-stroke z-50">
                        <div className="p-6 space-y-6">
                          {/* Header */}
                          <div className="flex items-center justify-between pb-4 border-b border-grey-stroke">
                            <h3 className="text-lg font-bold text-charcoal-600" style={{ fontFamily: 'Merriweather, serif' }}>
                              Filters
                            </h3>
                            {getActiveFilterCount() > 0 && (
                              <button
                                onClick={clearAllFilters}
                                className="text-sm text-sage-600 hover:text-sage-700 font-semibold"
                                style={{ fontFamily: 'Inter, sans-serif' }}
                              >
                                Clear All
                              </button>
                            )}
                          </div>

                          {/* Rating Slider */}
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <p className="text-sm font-semibold text-charcoal-600" style={{ fontFamily: 'Inter, sans-serif' }}>
                                Minimum Rating
                              </p>
                              <div className="flex items-center gap-1 bg-sage-100 px-3 py-1 rounded-full">
                                <Star size={14} weight="fill" className="text-sage-600" />
                                <span className="text-sm font-bold text-sage-700" style={{ fontFamily: 'Inter, sans-serif' }}>
                                  {activeFilters.rating ? `${activeFilters.rating}+` : 'Any'}
                                </span>
                              </div>
                            </div>
                            <div className="relative">
                              <input
                                type="range"
                                min="0"
                                max="5"
                                step="1"
                                value={activeFilters.rating || 0}
                                onChange={(e) => {
                                  const value = parseInt(e.target.value);
                                  handleFilterChange('rating', value === 0 ? null : value);
                                }}
                                className="w-full h-2 bg-grey-200 rounded-full appearance-none cursor-pointer
                                         [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5
                                         [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-sage-500
                                         [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-md
                                         [&::-webkit-slider-thumb]:hover:bg-sage-600 [&::-webkit-slider-thumb]:transition-colors
                                         [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full
                                         [&::-moz-range-thumb]:bg-sage-500 [&::-moz-range-thumb]:border-0
                                         [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:shadow-md
                                         [&::-moz-range-thumb]:hover:bg-sage-600 [&::-moz-range-thumb]:transition-colors"
                                style={{
                                  background: activeFilters.rating
                                    ? `linear-gradient(to right, #556B5C 0%, #556B5C ${((activeFilters.rating || 0) / 5) * 100}%, #E5E7EB ${((activeFilters.rating || 0) / 5) * 100}%, #E5E7EB 100%)`
                                    : '#E5E7EB'
                                }}
                              />
                              <div className="flex justify-between mt-2 text-xs text-charcoal-400" style={{ fontFamily: 'Inter, sans-serif' }}>
                                <span>Any</span>
                                <span>1</span>
                                <span>2</span>
                                <span>3</span>
                                <span>4</span>
                                <span>5</span>
                              </div>
                            </div>
                          </div>

                          {/* Apply Button */}
                          <button
                            onClick={() => setShowFilterDropdown(false)}
                            className="w-full bg-sage-500 hover:bg-sage-600 text-white font-bold py-3 rounded-xl transition-all shadow-soft-lift"
                            style={{ fontFamily: 'Inter, sans-serif' }}
                          >
                            Apply Filters
                          </button>
                        </div>
                      </div>
                    )}
                    
                  </div>
                </div>
                {/* Horizontal Service Catalog Chips */}
                      {serviceCatalogs.length > 0 && (
                        <div className="mb-8 relative pl-2">
                          {/* Left Arrow */}
                          {canScrollCatalogLeft && (
                            <button
                              onClick={() => {
                                const container = serviceCatalogScrollRef.current;
                                if (container) {
                                  container.scrollBy({ left: -300, behavior: 'smooth' });
                                }
                              }}
                              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.15)] flex items-center justify-center hover:bg-cream-50 transition-all"
                            >
                              <svg className="w-5 h-5 text-charcoal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                              </svg>
                            </button>
                          )}

                          {/* Scrollable Container */}
                          <div className="relative overflow-hidden px-12">
                            {canScrollCatalogLeft && (
                              <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-[#FAF7F2] to-transparent pointer-events-none z-10" />
                            )}
                            
                            {canScrollCatalogRight && (
                              <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-[#FAF7F2] to-transparent pointer-events-none z-10" />
                            )}

                            <div 
                              ref={serviceCatalogScrollRef}
                              className="overflow-x-auto scrollbar-hide"
                              onScroll={() => {
                                const container = serviceCatalogScrollRef.current;
                                if (!container) return;
                                const scrollLeft = Math.round(container.scrollLeft);
                                const scrollWidth = container.scrollWidth;
                                const clientWidth = container.clientWidth;
                                setCanScrollCatalogLeft(scrollLeft > 1);
                                setCanScrollCatalogRight(scrollLeft < scrollWidth - clientWidth - 1);
                              }}
                            >
                              <div className="flex gap-4 pb-2">
                                {/* All Providers Chip */}
                                <button
                                  onClick={() => setSelectedCatalog(null)}
                                  className={`flex items-center gap-3 px-8 py-4 rounded-full text-base font-semibold transition-all whitespace-nowrap flex-shrink-0 ${
                                    selectedCatalog === null
                                      ? 'bg-sage-500 text-white shadow-[0_2px_8px_rgba(85,107,92,0.3)]'
                                      : 'bg-cream-50 text-sage-500 hover:bg-cream-100 border border-grey-stroke'
                                  }`}
                                  style={{ fontFamily: 'Inter, sans-serif' }}
                                >
                                  <Storefront size={20} weight="regular" />
                                  <span>All Providers</span>
                                </button>

                                {/* Service Catalog Chips */}
                                  {serviceCatalogs.map(catalog => (
                                    <button
                                      key={catalog.id}
                                      onClick={() => setSelectedCatalog(catalog.id)}
                                      className={`px-8 py-4 rounded-full text-base font-semibold transition-all whitespace-nowrap flex-shrink-0 ${
                                        selectedCatalog === catalog.id
                                          ? 'bg-sage-500 text-white shadow-[0_2px_8px_rgba(85,107,92,0.3)]'
                                          : 'bg-cream-50 text-sage-500 hover:bg-cream-100 border border-grey-stroke'
                                      }`}
                                      style={{ fontFamily: 'Inter, sans-serif' }}
                                    >
                                      {catalog.name}
                                    </button>
                                  ))}
                              </div>
                            </div>
                          </div>

                          {/* Right Arrow */}
                          {canScrollCatalogRight && (
                            <button
                              onClick={() => {
                                const container = serviceCatalogScrollRef.current;
                                if (container) {
                                  container.scrollBy({ left: 300, behavior: 'smooth' });
                                }
                              }}
                              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.15)] flex items-center justify-center hover:bg-cream-50 transition-all"
                            >
                              <svg className="w-5 h-5 text-charcoal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </button>
                          )}
                        </div>
                      )}

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
          </div>
        </main>
      </div>
    </div>
  );
};

export default ServiceProviderStoresView;

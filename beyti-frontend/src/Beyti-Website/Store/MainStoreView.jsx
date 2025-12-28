import { useState, useEffect , useRef} from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Cake, BowlFood, Heart, Bread, Coffee, Storefront, ShoppingCartSimple, Package, Star } from "@phosphor-icons/react";
import StoreView from "./StoreView";
import OrderDetails from './Components/OrderDetails';
import ActiveOrderBanner from './Components/ActiveOrderBanner';
import Snackbar from './../../components/Snackbar';
import CustomerHeader from '../../components/CustomerHeader';
import { isStoreOpen } from '../Seller/Components/storeStatus';
import { StoreBanner } from '../../components/StoreBanner';
import { useSignalR } from '../../contexts/SignalRContext';


// Get customers function
const getCustomers = async () => {
  try {
    const response = await fetch('https://localhost:7062/api/Customers');

    if (!response.ok) {
      throw new Error('Failed to load customers');
    }

    const data = await response.json();
    console.log("🔔 MainStoreView: Fetched customers from API:", data);
    if (data.length > 0) {
      console.log("🔔 MainStoreView: First customer structure:", data[0]);
      console.log("🔔 MainStoreView: First customer userProfileId:", data[0].userProfileId);
    }
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error fetching customers:', error);
    alert("Failed to load customers: " + error.message);
    return [];
  }
};

// Get categories function
const getCategories = async () => {
  try {
    const response = await fetch('https://localhost:7062/api/Categories');
    if (!response.ok) throw new Error('Failed to fetch categories');
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
};

// Get ALL subcategories (not filtered by category)
const getAllSubCategories = async () => {
  try {
    const response = await fetch('https://localhost:7062/api/SubCategories');
    if (!response.ok) throw new Error('Failed to fetch subcategories');
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error fetching subcategories:', error);
    return [];
  }
};

const getSellers = async () => {
  try {
    const response = await fetch('https://localhost:7062/api/Sellers');
    if (!response.ok) throw new Error('Failed to fetch');
    const sellers = await response.json();
    
    // Fetch products for each seller to get discount info
    const sellersWithProducts = await Promise.all(
      sellers.map(async (seller) => {
        try {
          const productsRes = await fetch(`https://localhost:7062/api/Sellers/${seller.id}/products`);
          if (productsRes.ok) {
            const productsData = await productsRes.json();
            return { ...seller, products: productsData.products || [] };
          }
          return { ...seller, products: [] };
        } catch (err) {
          console.error(`Failed to fetch products for seller ${seller.id}:`, err);
          return { ...seller, products: [] };
        }
      })
    );
    
    return sellersWithProducts;
  } catch (error) {
    console.error('Error fetching sellers:', error);
    return [];
  }
};



// Main Category Tabs Component
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

    // Force scroll to 0 on mount
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
          marginLeft: categories.length <= 3 ? 'auto' : '0',
          marginRight: categories.length <= 3 ? 'auto' : '0',
          width: categories.length <= 3 ? 'fit-content' : 'auto'
        }}>
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


// Search Bar Component
const SearchBar = ({ value, onChange }) => (
  <div className="flex gap-4 items-center mb-8">
    <div className="flex-1 relative">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search Stores..."
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


// Featured Carousel Component
const FeaturedCarousel = ({ stores, onStoreClick, subcategories = [], selectedCategory, favoriteStores = [], onToggleFavorite }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Filter stores by selected category only (ignore subcategory filter)
  const categoryFilteredStores = stores.filter(store => {
    // Filter out stores with no active products
    const hasActiveProducts = store.products && 
                             store.products.length > 0 && 
                             store.products.some(p => p.isActive === true);
    if (!hasActiveProducts) {
      return false;
    }
    
    if (!selectedCategory) return true;
    return store.categoryId === selectedCategory;
  });
  
  const featured = categoryFilteredStores.slice(0, 6);

  useEffect(() => {
    if (featured.length === 0) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % Math.max(1, featured.length - 3));
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
        <div className="flex gap-6 transition-transform duration-500" style={{ transform: `translateX(-${currentIndex * (100 / 4)}%)` }}>
          {featured.map((store, idx) => {
            const words = store.storeName.split(' ').filter(w => w.length > 0);
            const initials = words.length >= 2 
              ? words[0][0].toUpperCase() + words[words.length - 1][0].toUpperCase()
              : words[0].slice(0, 2).toUpperCase();
            
            return (
              <div 
  key={store.id || idx} 
  onClick={() => onStoreClick(store.id)}
  className="flex-shrink-0 w-[calc(25%-18px)] bg-white rounded-2xl overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.12)] transition-all cursor-pointer"
>
  <div className="relative h-32">
     {/* Banner layer (clipped) */}
  <div className="absolute inset-0 overflow-hidden z-0">
    <StoreBanner
      storeName={store.storeName}
      storeImageUrl={store.storeImageUrl ? `https://localhost:7062${store.storeImageUrl}` : null}
      bannerThemeKey={store.bannerThemeKey || 'modern-gradient'}
      bannerAccentColor={store.bannerAccentColor || '#F97316'}
      variant="card"
    />
  </div>
    
    {/* Store Status Badge */}
    <div className="absolute top-3 left-3">
      <div className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 ${
        isStoreOpen(store)
          ? 'bg-success-btn text-white'
          : 'bg-error-btn text-white'
      }`}>
        <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
        {isStoreOpen(store) ? 'OPEN' : 'CLOSED'}
      </div>
    </div>

    {/* Favorite Heart Button */}
    {onToggleFavorite && (
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleFavorite(store.id);
        }}
        className="absolute top-3 right-3 w-9 h-9 bg-white hover:bg-cream-50 rounded-full flex items-center justify-center shadow-md transition-all z-10"
      >
        <Heart 
          size={20} 
          weight={favoriteStores.includes(store.id) ? 'fill' : 'regular'} 
          className={favoriteStores.includes(store.id) ? 'text-error-btn' : 'text-charcoal-400'}
        />
      </button>
    )}
    
    {/* External Logo - positioned on LEFT, overlapping */}
    <div className="absolute -bottom-8 left-4 z-20">
    <div className="w-16 h-16 rounded-full border-4 border-white bg-white shadow-[0_4px_12px_rgba(0,0,0,0.15)] overflow-hidden">
        {store.storeImageUrl ? (
          <img 
            src={`https://localhost:7062${store.storeImageUrl}`}
            alt={store.storeName}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-grey-200 to-grey-300">
            <span className="text-lg font-black text-charcoal-600" style={{ fontFamily: "Inter, sans-serif" }}>
              {(() => {
                const words = store.storeName.split(' ').filter(w => w.length > 0);
                return words.length >= 2 
                  ? words[0][0].toUpperCase() + words[words.length - 1][0].toUpperCase()
                  : words[0].slice(0, 2).toUpperCase();
              })()}
            </span>
          </div>
        )}
      </div>
    </div>
  </div>
  
  <div className="pt-10 p-4 bg-white">
    <h3 className="font-bold text-charcoal-600 text-base mb-2" style={{ fontFamily: 'Merriweather, serif' }}>{store.storeName}</h3>
    <div className="flex items-center gap-1 mb-3">
      {(() => {
        const rating = store.averageRating || 0;
        const hasEnoughReviews = store.averageRating !== null && store.averageRating !== undefined;
        
        if (!hasEnoughReviews) {
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
      {(() => {
        const storeSubcategoryIds = store.subCategoryIds || [];
        const storeSubcategories = subcategories.filter(sub => storeSubcategoryIds.includes(sub.id));
        
        return storeSubcategories.length > 0 ? (
          storeSubcategories.map(subcat => (
            <span key={subcat.id} className="px-3 py-1 bg-cream-100 rounded-full text-xs font-medium text-charcoal-600" style={{ fontFamily: 'Inter, sans-serif' }}>
              {subcat.name}
            </span>
          ))
        ) : (
          <span className="px-3 py-1 bg-grey-200 rounded-full text-xs font-medium text-charcoal-400 italic" style={{ fontFamily: 'Inter, sans-serif' }}>
            No categories
          </span>
        );
      })()}
    </div>
  </div>
</div>
            );
          })}
        </div>
      </div>

      <button
        onClick={() => setCurrentIndex(Math.min(featured.length - 3, currentIndex + 1))}
        disabled={currentIndex >= featured.length - 4}
        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white rounded-full shadow-[0_2px_10px_rgba(0,0,0,0.12)] flex items-center justify-center hover:bg-cream-50 transition-all disabled:opacity-30"
      >
        <svg className="w-5 h-5 text-charcoal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      <div className="flex justify-center gap-2 mt-6">
        {Array.from({ length: Math.max(1, featured.length - 3) }).map((_, idx) => (
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

// Store Card Component
const StoreCard = ({ store, subcategories = [], isFavorited = false, onToggleFavorite }) => {
  const words = store.storeName.split(' ').filter(w => w.length > 0);
  const initials = words.length >= 2 
    ? words[0][0].toUpperCase() + words[words.length - 1][0].toUpperCase()
    : words[0].slice(0, 2).toUpperCase();

  return (
    <div className="bg-white rounded-2xl overflow-hidden cursor-pointer shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.12)] transition-all">
      <div className="relative h-32">

      <div className="absolute inset-0 overflow-hidden z-0">
    <StoreBanner
      storeName={store.storeName}
      storeImageUrl={store.storeImageUrl ? `https://localhost:7062${store.storeImageUrl}` : null}
      bannerThemeKey={store.bannerThemeKey || 'modern-gradient'}
      bannerAccentColor={store.bannerAccentColor || '#F97316'}
      variant="card"
    />
  </div>

  {/* Store Status Badge */}
  <div className="absolute top-3 left-3 z-30">
    <div className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 ${
      isStoreOpen(store)
        ? 'bg-success-btn text-white'
        : 'bg-error-btn text-white'
    }`}>
      <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
      {isStoreOpen(store) ? 'OPEN' : 'CLOSED'}
    </div>
  </div>

  {/* Favorite Heart */}
  {onToggleFavorite && (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onToggleFavorite(store.id);
      }}
      className="absolute top-3 right-3 w-9 h-9 bg-white hover:bg-cream-50 rounded-full flex items-center justify-center shadow-md transition-all z-30"
    >
      <Heart
        size={20}
        weight={isFavorited ? 'fill' : 'regular'}
        className={isFavorited ? 'text-error-btn' : 'text-charcoal-400'}
      />
    </button>
  )}

  {/* Store Logo (OVERLAPS banner + card) */}
  <div className="absolute -bottom-8 left-4 z-20">
    <div className="w-16 h-16 rounded-full border-4 border-white bg-white shadow-[0_4px_12px_rgba(0,0,0,0.15)] overflow-hidden">
      {store.storeImageUrl ? (
        <img
          src={`https://localhost:7062${store.storeImageUrl}`}
          alt={store.storeName}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-grey-200 to-grey-300">
          <span className="text-lg font-black text-charcoal-600">
            {initials}
          </span>
        </div>
      )}
    </div>
  </div>

</div>
      
      <div className="pt-10 p-4 bg-white">
        <h3 className="font-bold text-charcoal-600 text-base mb-2" style={{ fontFamily: 'Merriweather, serif' }}>{store.storeName}</h3>
        <div className="flex items-center gap-1 mb-3">
          {(() => {
            const rating = store.averageRating || 0;
            const hasEnoughReviews = store.averageRating !== null && store.averageRating !== undefined;
            
            if (!hasEnoughReviews) {
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
          {(() => {
            const storeSubcategoryIds = store.subCategoryIds || [];
            return storeSubcategoryIds.length > 0 ? (
              storeSubcategoryIds.map(subId => {
                const subcat = subcategories.find(s => s.id === subId);
                return subcat ? (
                  <span key={subcat.id} className="px-3 py-1 bg-cream-100 rounded-full text-xs font-medium text-charcoal-600" style={{ fontFamily: 'Inter, sans-serif' }}>
                    {subcat.name}
                  </span>
                ) : null;
              })
            ) : (
              <span className="px-3 py-1 bg-grey-200 rounded-full text-xs font-medium text-charcoal-400 italic" style={{ fontFamily: 'Inter, sans-serif' }}>
                No categories
              </span>
            );
          })()}
        </div>
      </div>
    </div>
  );
};

const CustomerSelectModal = ({ isOpen, customers, onSelect, onClose }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-cream-50 rounded-2xl shadow-2xl w-full max-w-md p-6 border border-grey-stroke transform transition-all">
        <h2 className="text-2xl font-semibold text-charcoal-700 mb-2" style={{ fontFamily: 'Merriweather, serif' }}>
          Select Customer Account
        </h2>

        <p className="text-sm text-charcoal-400 mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>
          Choose which customer account you want to shop as.
        </p>

        <select
          className="w-full border border-grey-stroke rounded-lg p-3 mb-6 bg-white focus:outline-none focus:ring-2 focus:ring-sage-400 text-charcoal-600"
          style={{ fontFamily: 'Inter, sans-serif' }}
          defaultValue=""
          onChange={(e) => {
            const id = e.target.value;
            if (id) {
              const numericId = parseInt(id, 10);
              console.log("🔔 CustomerSelectModal: Selected ID from dropdown:", numericId);
              console.log("🔔 CustomerSelectModal: Available customers:", customers);
              const selected = customers.find((c) => {
                const customerId = c.id || c.Id; // Handle both camelCase and PascalCase
                console.log("🔔 CustomerSelectModal: Comparing", customerId, "with", numericId);
                return customerId === numericId;
              });
              console.log("🔔 CustomerSelectModal: Found customer:", selected);
              if (selected) {
                onSelect(selected);
              } else {
                console.error("🔔 CustomerSelectModal: Customer not found!");
              }
            }
          }}
        >
          <option value="">-- Select Customer --</option>
          {customers.map((customer) => {
            const customerId = customer.id || customer.Id;
            const customerName = customer.fullName || customer.name || `Customer #${customerId}`;
            return (
              <option key={customerId} value={customerId}>
                {customerName}
              </option>
            );
          })}
        </select>

        <button
          type="button"
          onClick={onClose}
          className="w-full bg-grey-300 hover:bg-grey-400 text-charcoal-700 py-2.5 rounded-lg font-semibold transition-colors"
          style={{ fontFamily: 'Inter, sans-serif' }}
        >
          Close
        </button>
      </div>
    </div>
  );
};

// Main Component
const MainStoreView = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { on, off } = useSignalR();

  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [subcategories, setSubcategories] = useState([]);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null); // null means "All Stores"

  const subcategoryScrollRef = useRef(null);
  const [canScrollSubLeft, setCanScrollSubLeft] = useState(false);
  const [canScrollSubRight, setCanScrollSubRight] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStoreId, setSelectedStoreId] = useState(null);

  const [filteredSubcategories, setFilteredSubcategories] = useState([]); // Filtered by category

  // Filter subcategories by selected category for the sidebar
useEffect(() => {
  if (!selectedCategory) {
    setFilteredSubcategories([]);
    setSelectedSubcategory(null);
    return;
  }
  
  const filtered = subcategories.filter(sub => sub.categoryId === selectedCategory);
  setFilteredSubcategories(filtered);
  setSelectedSubcategory(null); // Reset to "All Stores" when category changes
}, [selectedCategory, subcategories]);

// Update subcategory scroll arrows
useEffect(() => {
  const updateSubScrollArrows = () => {
    const container = subcategoryScrollRef.current;
    if (!container) return;

    const scrollLeft = Math.round(container.scrollLeft);
    const scrollWidth = container.scrollWidth;
    const clientWidth = container.clientWidth;
    
    setCanScrollSubLeft(scrollLeft > 1);
    setCanScrollSubRight(scrollLeft < scrollWidth - clientWidth - 1);
  };

  updateSubScrollArrows();
  
  const container = subcategoryScrollRef.current;
  if (container) {
    container.addEventListener('scroll', updateSubScrollArrows);
    window.addEventListener('resize', updateSubScrollArrows);
  }
  
  return () => {
    if (container) {
      container.removeEventListener('scroll', updateSubScrollArrows);
    }
    window.removeEventListener('resize', updateSubScrollArrows);
  };
}, [filteredSubcategories, selectedSubcategory]);

  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [activeFilters, setActiveFilters] = useState({
    rating: null, // null, 4, 3
    priceRange: null, // null, 'low', 'medium', 'high'
    distance: null, // null, 'near', 'far'
    availability: null, // null, 'open', 'closed'
  });

 // Customer state
  const [customers, setCustomers] = useState([]);
  const [customerId, setCustomerId] = useState(null);
  const [customerName, setCustomerName] = useState(null);
  const [userProfileId, setUserProfileId] = useState(null); // Add userProfileId for notifications
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [customerAddresses, setCustomerAddresses] = useState([]);

  const [favoriteStores, setFavoriteStores] = useState([]);
  const [loadingFavorites, setLoadingFavorites] = useState(false);

  // Add Snackbar state
const [snackbar, setSnackbar] = useState({ open: false, message: '', type: 'success' });
const orderPlacedShown = useRef(false);

const showSnackbar = (message, type = 'success') => {
  setSnackbar({ open: true, message, type });
  setTimeout(() => setSnackbar({ open: false, message: '', type: 'success' }), 5000);
};

  // Cart state - load from localStorage
  const [cart, setCart] = useState(() => {
    try {
      if (customerId) {
        // Check all cart keys for this customer
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith(`beyti_cart_`) && key.endsWith(`_${customerId}`)) {
            try {
              const savedCart = localStorage.getItem(key);
              if (savedCart) {
                const parsedCart = JSON.parse(savedCart);
                if (parsedCart.length > 0) {
                  return parsedCart;
                }
              }
            } catch (err) {
              console.error('Error parsing cart from key:', key, err);
            }
          }
        }
      }
    } catch (err) {
      console.error('Error loading cart:', err);
    }
    return [];
  });

  // Update cart when customer changes or on mount
  useEffect(() => {
    if (!customerId) {
      setCart([]);
      return;
    }

    // Poll localStorage for cart updates - check ALL stores
    const updateCart = () => {
      try {
        let allItems = [];
        
        // Check all localStorage keys for this customer
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith(`beyti_cart_`) && key.endsWith(`_${customerId}`)) {
            const savedCart = localStorage.getItem(key);
            if (savedCart) {
              const parsedCart = JSON.parse(savedCart);
              if (parsedCart.length > 0) {
                allItems = parsedCart; // Take the first non-empty cart we find
                break;
              }
            }
          }
        }
        
        setCart(allItems);
      } catch (err) {
        console.error('Error updating cart:', err);
      }
    };

    updateCart();
    
    // Update cart every 500ms to catch changes
    const interval = setInterval(updateCart, 500);
    
    return () => clearInterval(interval);
  }, [customerId]);

// Add active order state
const [activeOrder, setActiveOrder] = useState(null);

const [orders, setOrders] = useState([]);

// Load and poll active order for the selected customer (like cart polling)
useEffect(() => {
  if (!customerId) {
    setActiveOrder(null);
    return;
  }

  const updateActiveOrder = () => {
    try {
      const savedOrder = localStorage.getItem(`beyti_activeOrder_${customerId}`);
      if (savedOrder) {
        const parsedOrder = JSON.parse(savedOrder);
        setActiveOrder(parsedOrder);
      } else {
        setActiveOrder(null);
      }
    } catch (err) {
      console.error('Error loading active order:', err);
    }
  };

  // Load immediately
  updateActiveOrder();
  
  // Poll every 1 second to catch changes
  const interval = setInterval(updateActiveOrder, 1000);
  
  return () => clearInterval(interval);
}, [customerId]);




// Fetch customer orders (backend handles auto-cancellation)
useEffect(() => {
  if (!customerId) {
    setOrders([]);
    return;
  }

  const fetchOrders = async () => {
    try {
      const response = await fetch(`https://localhost:7062/api/Orders?customerId=${customerId}`);
      if (response.ok) {
        const data = await response.json();
        setOrders(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
      setOrders([]);
    }
  };

  fetchOrders();
  
  // Poll every 30 seconds
  const interval = setInterval(fetchOrders, 30000);
  
  return () => clearInterval(interval);
}, [customerId]);

// Poll for order updates
useEffect(() => {
  if (!activeOrder || !customerId) return;

  const interval = setInterval(async () => {
    try {
      const response = await fetch(`https://localhost:7062/api/Orders/${activeOrder.id}`);
      if (response.ok) {
        const updated = await response.json();
        if (updated.status !== activeOrder.status) {
          const completeUpdatedOrder = {
            ...activeOrder,
            ...updated,
            storeName: updated.sellerName || activeOrder.storeName,
            storePhone: activeOrder.storePhone || updated.sellerPhone,
            pickupAddress: updated.pickupAddress || activeOrder.pickupAddress,
            deliveryAddress: updated.deliveryAddress || activeOrder.deliveryAddress,
          };
          setActiveOrder(completeUpdatedOrder);
        }
      }
    } catch (err) {
      console.error('Polling error:', err);
    }
  }, 5000);

  return () => clearInterval(interval);
}, [activeOrder]);

const [bannerDismissed, setBannerDismissed] = useState(() => {
  if (!customerId) return false;
  return localStorage.getItem(`beyti_bannerDismissed_${customerId}`) === 'true';
});


useEffect(() => {
  const initialize = async () => {
    const cats = await getCategories();
    setCategories(cats);
    if (cats.length > 0) {
      setSelectedCategory(cats[0].id);
    }
  };
  initialize();
  fetchStores();
}, []);

// Fetch ALL subcategories on mount (for store cards to display)
useEffect(() => {
  const fetchAllSubcategories = async () => {
    const allSubs = await getAllSubCategories();
    setSubcategories(allSubs);
  };
  
  fetchAllSubcategories();
}, []);

// Load customers on mount
  useEffect(() => {
    const loadCustomers = async () => {
      try {
        const data = await getCustomers();
        setCustomers(data); // data is already an array from getCustomers
      } catch (error) {
        console.error("Failed to load customers:", error);
        setCustomers([]); // Ensure empty array on error
      }
    };
    loadCustomers();
  }, []);

// Load saved customer from sessionStorage on mount
useEffect(() => {
  const savedCustomerId = sessionStorage.getItem('beyti_customerId');
  const savedCustomerName = sessionStorage.getItem('beyti_customerName');
  const savedUserProfileId = sessionStorage.getItem('beyti_userProfileId');

  if (savedCustomerId && savedCustomerName) {
    setCustomerId(parseInt(savedCustomerId, 10));
    setCustomerName(savedCustomerName);
    if (savedUserProfileId) {
      setUserProfileId(parseInt(savedUserProfileId, 10));
    }
    console.log("Restored customer session:", savedCustomerName);
  }
  // Removed auto-opening modal - let user browse as guest
}, []);


// Fetch favorites when customer changes
useEffect(() => {
  if (customerId) {
    fetchFavorites(customerId);
  } else {
    setFavoriteStores([]);
  }
}, [customerId]);

// Fetch customer addresses when customerId changes
useEffect(() => {
  const fetchCustomerAddresses = async () => {
    if (!customerId) {
      setCustomerAddresses([]);
      return;
    }

    try {
      console.log("🔍 Fetching customer addresses for ID:", customerId);
      const response = await fetch(`https://localhost:7062/api/Customers/${customerId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const customerData = await response.json();
      console.log("✅ Customer data received:", customerData);
      
      const addresses = customerData.customerAddresses || [];
      console.log("📍 Customer addresses extracted:", addresses);
      
      setCustomerAddresses(addresses);
    } catch (err) {
      console.error("❌ Error fetching customer addresses:", err);
      setCustomerAddresses([]);
    }
  };

  fetchCustomerAddresses();
}, [customerId]);

useEffect(() => {
  console.log('🔥 MainStore orderPlaced effect triggered');
  console.log('📦 location.state:', location.state);
  console.log('📦 orderPlacedShown.current:', orderPlacedShown.current);
  
  // Only run this if we're actually on the main store page (not navigating away)
  if (location.state?.orderPlaced && !orderPlacedShown.current && location.pathname === '/mainStore') {
    console.log('✅ SHOWING ORDER PLACED SNACKBAR');
    orderPlacedShown.current = true;
    
    showSnackbar(`Order #${location.state.orderId} placed successfully! 🎉`, 'success');
    
    setTimeout(() => {
      // Only navigate if still on mainStore page
      if (window.location.pathname === '/mainStore') {
        navigate(location.pathname, { 
          replace: true, 
          state: { customerId, customerName } 
        });
      }
      orderPlacedShown.current = false;
    }, 3500);
  }
}, [location.state, location.pathname, customerId, customerName, navigate]);

// Reset banner dismissed state when customer changes
useEffect(() => {
  if (customerId) {
    const dismissed = localStorage.getItem(`beyti_bannerDismissed_${customerId}`) === 'true';
    setBannerDismissed(dismissed);
  }
}, [customerId]);

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

// SignalR listener for real-time product updates
useEffect(() => {
  const handleProductUpdate = (data) => {
    console.log('[MainStoreView] Received product update:', data);

    // Refresh stores list when any product is created, updated, or status changed
    if (data.type === 'ProductCreated' || data.type === 'ProductUpdated' || data.type === 'ProductStatusChanged') {
      console.log('[MainStoreView] Refreshing stores due to product update');
      fetchStores();
    }
  };

  if (on) {
    on('ReceiveProductUpdate', handleProductUpdate);
  }

  return () => {
    if (off) {
      off('ReceiveProductUpdate', handleProductUpdate);
    }
  };
}, [on, off]);

const scrollSubcategories = (direction) => {
  const container = subcategoryScrollRef.current;
  if (!container) return;

  const scrollAmount = 300;
  container.scrollBy({
    left: direction === 'left' ? -scrollAmount : scrollAmount,
    behavior: 'smooth'
  });
};

const handleCustomerSelect = (customer) => {
  // Handle both camelCase and PascalCase from API
  const customerId = customer.id || customer.Id;
  const userProfileId = customer.userProfileId || customer.UserProfileId;
  const name = customer.fullName || customer.name || `Customer #${customerId}`;

  console.log("🔔 MainStoreView: Selected customer:", customer);
  console.log("🔔 MainStoreView: customer.userProfileId:", userProfileId);
  console.log("🔔 MainStoreView: customer.id:", customerId);

  setCustomerId(customerId);
  setCustomerName(name);
  setUserProfileId(userProfileId); // Store userProfileId for notifications
  setCustomerModalOpen(false);

  // Save to sessionStorage
  sessionStorage.setItem('beyti_customerId', customerId.toString());
  sessionStorage.setItem('beyti_customerName', name);
  sessionStorage.setItem('beyti_userProfileId', userProfileId?.toString() || '');

  console.log("🔔 MainStoreView: Saved to sessionStorage - userProfileId:", userProfileId);
};

const handleCustomerLogout = () => {
  // Clear customer session
  sessionStorage.removeItem('beyti_customerId');
  sessionStorage.removeItem('beyti_customerName');
  sessionStorage.removeItem('beyti_userProfileId');
  setCustomerId(null);
  setCustomerName(null);
  setUserProfileId(null);
  setActiveOrder(null);

  // Clear any active order from localStorage
  if (customerId) {
    localStorage.removeItem(`beyti_activeOrder_${customerId}`);
  }

  console.log("Customer logged out");
};

const handleDismissBanner = () => {
  setBannerDismissed(true);
  localStorage.setItem(`beyti_bannerDismissed_${customerId}`, 'true');
};

const handleTrackOrder = () => {
  navigate('/customer-dashboard');
};

  const handleCustomerClick = () => {
    setCustomerModalOpen(true);
  };

  const fetchStores = async () => {
    try {
      setLoading(true);
      const data = await getSellers();
      setStores(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load stores:", error);
      setStores([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchFavorites = async (custId) => {
  if (!custId) {
    setFavoriteStores([]);
    return;
  }

  try {
    setLoadingFavorites(true);
    const response = await fetch(`https://localhost:7062/api/CustomerFavorites/${custId}`);
    if (response.ok) {
      const data = await response.json();
      setFavoriteStores(Array.isArray(data) ? data.map(f => f.sellerId) : []);
    } else {
      setFavoriteStores([]);
    }
  } catch (error) {
    console.error("Failed to load favorites:", error);
    setFavoriteStores([]);
  } finally {
    setLoadingFavorites(false);
  }
};


const toggleFavorite = async (sellerId) => {
  if (!customerId) {
    showSnackbar('Please login to save favorites', 'warning');
    return;
  }

  const isFavorited = favoriteStores.includes(sellerId);

  try {
    if (isFavorited) {
      // Remove from favorites
      const response = await fetch(
        `https://localhost:7062/api/CustomerFavorites/${customerId}/${sellerId}`,
        { method: 'DELETE' }
      );

      if (response.ok) {
        setFavoriteStores(prev => prev.filter(id => id !== sellerId));
        showSnackbar('Removed from favorites', 'success');
      }
    } else {
      // Add to favorites
      const response = await fetch('https://localhost:7062/api/CustomerFavorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId, sellerId })
      });

      if (response.ok) {
        setFavoriteStores(prev => [...prev, sellerId]);
        showSnackbar('Added to favorites', 'success');
      }
    }
  } catch (error) {
    console.error('Error toggling favorite:', error);
    showSnackbar('Failed to update favorites', 'error');
  }
};

  const handleFilterChange = (filterType, value) => {
  setActiveFilters(prev => ({
    ...prev,
    [filterType]: prev[filterType] === value ? null : value
  }));
};

const clearAllFilters = () => {
  setActiveFilters({
    rating: null,
    priceRange: null,
    distance: null,
    availability: null,
  });
};

const getActiveFilterCount = () => {
  return Object.values(activeFilters).filter(v => v !== null).length;
};

  
// Navigate from store list to individual store page
const handleStoreNavigation = (targetStoreId) => {
  navigate(`/store/${targetStoreId}`, { 
    state: { customerId, customerName } 
  });
}


const filteredStores = stores
  .filter(store => {

  // Filter out stores with no active products - ADD THIS FIRST
      const hasActiveProducts = store.products && 
                              store.products.length > 0 && 
                              store.products.some(p => p.isActive === true);
      if (!hasActiveProducts) {
        return false;
      }


    // Category filter - MOST IMPORTANT
    if (selectedCategory && store.categoryId !== selectedCategory) {
      return false;
    }
    
    // Subcategory filter - NEW
    if (selectedSubcategory !== null) {
      // Check if store has this subcategory
      const storeSubcategoryIds = store.subCategoryIds || [];
      if (!storeSubcategoryIds.includes(selectedSubcategory)) {
        return false;
      }
    }
    
    // Search filter
    if (searchQuery && !store.storeName?.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    // Rating filter - NEW stores (no rating) are always included
    if (activeFilters.rating) {
      const rating = store.averageRating;
      // If store has no rating (null/undefined), include it (will be sorted to end)
      if (rating !== null && rating !== undefined) {
        // Only filter out stores that have ratings below the threshold
        if (rating < activeFilters.rating) return false;
      }
    }
    
    // Price range filter (based on average product price)
    if (activeFilters.priceRange && store.products && store.products.length > 0) {
      const avgPrice = store.products.reduce((sum, p) => sum + (p.basePrice || 0), 0) / store.products.length;
      
      if (activeFilters.priceRange === 'budget' && avgPrice >= 5) return false;
      if (activeFilters.priceRange === 'low' && (avgPrice < 5 || avgPrice >= 10)) return false;
      if (activeFilters.priceRange === 'medium' && (avgPrice < 10 || avgPrice >= 25)) return false;
      if (activeFilters.priceRange === 'high' && avgPrice < 25) return false;
    }
    
    return true;
  })
  .sort((a, b) => {
  // FIRST PRIORITY: Open stores before closed stores
  const aIsOpen = isStoreOpen(a);
  const bIsOpen = isStoreOpen(b);
  
  if (aIsOpen && !bIsOpen) return -1; // a is open, b is closed -> a comes first
  if (!aIsOpen && bIsOpen) return 1;  // a is closed, b is open -> b comes first
  
  // SECOND PRIORITY: Sort by rating within same open/closed group
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
    <div className="min-h-screen" style={{ backgroundColor: '#FAF7F2' }}>
      <CustomerSelectModal
        isOpen={customerModalOpen}
        customers={customers}
        onSelect={handleCustomerSelect}
        onClose={() => setCustomerModalOpen(false)}
      />
      
      <CustomerHeader
        pageTitle="Stores"
        customerName={customerName}
        customerId={customerId}
        userProfileId={userProfileId}
        cart={cart}
        stores={stores}
        customerAddresses={customerAddresses}
        onCustomerClick={handleCustomerClick}
        onLogout={handleCustomerLogout}
        variant="store"
        showSearch={false}
        showContextSwitch={true}
        currentContext="stores"
      />

    {/* Active Order Banner */}
      {(() => {
        const count = orders.filter(o => 
          !['completed', 'cancelled', 'delivered'].includes(o.status?.toLowerCase())
        ).length;
        return count > 0 && !bannerDismissed && (
          <ActiveOrderBanner 
            activeOrderCount={count}
            onTrack={handleTrackOrder}
            onDismiss={handleDismissBanner}
          />
        );
      })()}


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

          <div className="flex-1">
            

            {/* Featured Stores Section */}
            <div className="mb-3">
              <h2 className="text-2xl font-bold text-charcoal-700" style={{ fontFamily: 'Merriweather, serif' }}>
                Featured Stores
              </h2>
            </div>
            
            <FeaturedCarousel 
              stores={stores} 
              onStoreClick={handleStoreNavigation}
              subcategories={subcategories}
              selectedCategory={selectedCategory}
              favoriteStores={favoriteStores}
              onToggleFavorite={toggleFavorite}
            />

            <div className="flex gap-4 items-center mb-8">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search Stores..."
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

      {/* Price Range Slider */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-charcoal-600" style={{ fontFamily: 'Inter, sans-serif' }}>
            Average Price Range
          </p>
          <div className="bg-sage-100 px-3 py-1 rounded-full">
            <span className="text-sm font-bold text-sage-700" style={{ fontFamily: 'Inter, sans-serif' }}>
              {activeFilters.priceRange === 'budget' && 'Under 5 BD'}
              {activeFilters.priceRange === 'low' && '5-10 BD'}
              {activeFilters.priceRange === 'medium' && '10-25 BD'}
              {activeFilters.priceRange === 'high' && '25+ BD'}
              {!activeFilters.priceRange && 'Any'}
            </span>
          </div>
        </div>
        <div className="relative">
          <input
            type="range"
            min="0"
            max="4"
            step="1"
            value={
              activeFilters.priceRange === 'budget' ? 1 :
              activeFilters.priceRange === 'low' ? 2 :
              activeFilters.priceRange === 'medium' ? 3 :
              activeFilters.priceRange === 'high' ? 4 : 0
            }
            onChange={(e) => {
              const value = parseInt(e.target.value);
              const priceMap = { 0: null, 1: 'budget', 2: 'low', 3: 'medium', 4: 'high' };
              handleFilterChange('priceRange', priceMap[value]);
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
              background: activeFilters.priceRange
                ? `linear-gradient(to right, #556B5C 0%, #556B5C ${
                    (activeFilters.priceRange === 'budget' ? 1 :
                     activeFilters.priceRange === 'low' ? 2 :
                     activeFilters.priceRange === 'medium' ? 3 : 
                     activeFilters.priceRange === 'high' ? 4 : 0) / 4 * 100
                  }%, #E5E7EB ${
                    (activeFilters.priceRange === 'budget' ? 1 :
                     activeFilters.priceRange === 'low' ? 2 :
                     activeFilters.priceRange === 'medium' ? 3 : 
                     activeFilters.priceRange === 'high' ? 4 : 0) / 4 * 100
                  }%, #E5E7EB 100%)`
                : '#E5E7EB'
            }}
          />
          <div className="flex justify-between mt-2 text-xs text-charcoal-400" style={{ fontFamily: 'Inter, sans-serif' }}>
            <span>Any</span>
            <span>&lt;5</span>
            <span>5-10</span>
            <span>10-25</span>
            <span>25+</span>
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

           {/* Horizontal Subcategory Chips */}
{filteredSubcategories.length > 0 && (
  <div className="mb-8 relative pl-2">
    {/* Left Arrow */}
    {canScrollSubLeft && (
      <button
        onClick={() => scrollSubcategories('left')}
        className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.15)] flex items-center justify-center hover:bg-cream-50 transition-all"
      >
        <svg className="w-5 h-5 text-charcoal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
    )}

    {/* Scrollable Container with Fade */}
    <div className="relative overflow-hidden px-12">
      {/* Left Fade */}
      {canScrollSubLeft && (
        <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-[#FAF7F2] to-transparent pointer-events-none z-10" />
      )}
      
      {/* Right Fade */}
      {canScrollSubRight && (
        <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-[#FAF7F2] to-transparent pointer-events-none z-10" />
      )}

      <div 
        ref={subcategoryScrollRef}
        className="overflow-x-auto scrollbar-hide"
      >
        <style>{`
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
        `}</style>
        <div className="flex gap-4 pb-2">
          {/* My Favorites Chip */}
          <button
            onClick={() => setSelectedSubcategory('favorites')}
            className={`flex items-center gap-3 px-8 py-4 rounded-full text-base font-semibold transition-all whitespace-nowrap flex-shrink-0 ${
              selectedSubcategory === 'favorites'
                ? 'bg-sage-500 text-white shadow-[0_2px_8px_rgba(85,107,92,0.3)]'
                : 'bg-cream-50 text-sage-500 hover:bg-cream-100 border border-grey-stroke'
            }`}
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            <Heart size={20} weight={selectedSubcategory === 'favorites' ? 'fill' : 'regular'} />
            <span>My Favorites</span>
          </button>

          {/* All Stores Chip */}
          <button
            onClick={() => setSelectedSubcategory(null)}
            className={`flex items-center gap-3 px-8 py-4 rounded-full text-base font-semibold transition-all whitespace-nowrap flex-shrink-0 ${
              selectedSubcategory === null
                ? 'bg-sage-500 text-white shadow-[0_2px_8px_rgba(85,107,92,0.3)]'
                : 'bg-cream-50 text-sage-500 hover:bg-cream-100 border border-grey-stroke'
            }`}
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            <Storefront size={20} weight="regular" />
            <span>All Stores</span>
          </button>

          {/* Subcategory Chips */}
          {filteredSubcategories.map(subcat => (
            <button
              key={subcat.id}
              onClick={() => setSelectedSubcategory(subcat.id)}
              className={`px-8 py-4 rounded-full text-base font-semibold transition-all whitespace-nowrap flex-shrink-0 ${
                selectedSubcategory === subcat.id
                  ? 'bg-sage-500 text-white shadow-[0_2px_8px_rgba(85,107,92,0.3)]'
                  : 'bg-cream-50 text-sage-500 hover:bg-cream-100 border border-grey-stroke'
              }`}
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              {subcat.name}
            </button>
          ))}
        </div>
      </div>
    </div>

    {/* Right Arrow */}
    {canScrollSubRight && (
      <button
        onClick={() => scrollSubcategories('right')}
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
              ) : (() => {
                // Calculate which stores to show
                const storesToShow = selectedSubcategory === 'favorites' 
                  ? stores
                      .filter(s => favoriteStores.includes(s.id))
                      .filter(s => !searchQuery || s.storeName?.toLowerCase().includes(searchQuery.toLowerCase()))
                      .sort((a, b) => {
                        const aIsOpen = isStoreOpen(a);
                        const bIsOpen = isStoreOpen(b);
                        
                        if (aIsOpen && !bIsOpen) return -1;
                        if (!aIsOpen && bIsOpen) return 1;
                        
                        const ratingA = a.averageRating || 0;
                        const ratingB = b.averageRating || 0;
                        
                        if (ratingA !== 0 && ratingB !== 0) return ratingB - ratingA;
                        if (ratingA !== 0) return -1;
                        if (ratingB !== 0) return 1;
                        
                        return 0;
                      })
                  : filteredStores;

                return storesToShow.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16">
                    <div className="w-24 h-24 bg-cream-100 rounded-full flex items-center justify-center mb-4">
                      <Storefront className="w-12 h-12 text-charcoal-400" weight="regular" />
                    </div>
                    <h3 className="text-xl font-bold text-charcoal-600 mb-2" style={{ fontFamily: 'Merriweather, serif' }}>
                      No Stores Found
                    </h3>
                    <p className="text-charcoal-400 text-center max-w-md" style={{ fontFamily: 'Inter, sans-serif' }}>
                      {selectedSubcategory === 'favorites' 
                        ? (searchQuery 
                            ? `No favorite stores match "${searchQuery}".`
                            : 'No favorite stores yet. Click the ❤️ icon on stores to save them here!')
                        : (searchQuery
                            ? `No stores match "${searchQuery}". Try a different search term.`
                            : 'There are no stores available at the moment. Please check back later.')}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                    {storesToShow.map(store => (
                      <div key={store.id} onClick={() => handleStoreNavigation(store.id)}>
                        <StoreCard 
                          store={store} 
                          subcategories={subcategories}
                          isFavorited={favoriteStores.includes(store.id)}
                          onToggleFavorite={toggleFavorite}
                        />
                      </div>
                    ))}
                  </div>
                );
              })()}
          </div>
        </div>
      </div>
      </div>
      {/* Snackbar */}
      <Snackbar 
        open={snackbar.open}
        message={snackbar.message}
        type={snackbar.type}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      />
    </div>
  );
};

export default MainStoreView;
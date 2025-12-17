import { useState, useEffect , useRef} from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Cake, BowlFood, Heart, Bread, Coffee, Storefront, ShoppingCartSimple, Package, Star } from "@phosphor-icons/react";
import StoreView from "./StoreView";
import OrderDetails from './Components/OrderDetails';
import ActiveOrderBanner from './Components/ActiveOrderBanner';
import Snackbar from './../../components/Snackbar';
import CustomerHeader from '../../components/CustomerHeader';
import { isStoreOpen } from '../Seller/Components/storeStatus';


// Get customers function
const getCustomers = async () => {
  try {
    const response = await fetch('https://localhost:7062/api/Customers');
    
    if (!response.ok) {
      throw new Error('Failed to load customers');
    }

    const data = await response.json();
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

// Mock getSellers function

// Mock getSellers function
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

// Color generation utility function
const getStoreColors = (storeName) => {
  const gradients = [
    'from-[#6366F1] via-[#8B5CF6] to-[#EC4899]',
    'from-[#F59E0B] via-[#EF4444] to-[#DC2626]',
    'from-[#10B981] via-[#059669] to-[#047857]',
    'from-[#3B82F6] via-[#2563EB] to-[#1D4ED8]',
    'from-[#EC4899] via-[#DB2777] to-[#BE185D]',
    'from-[#8B5CF6] via-[#7C3AED] to-[#6D28D9]',
    'from-[#14B8A6] via-[#0D9488] to-[#0F766E]',
    'from-[#F97316] via-[#EA580C] to-[#C2410C]',
  ];
  
  const bannerGradients = [
    'from-[#6366F1]/20 via-[#8B5CF6]/15 to-[#EC4899]/20',
    'from-[#F59E0B]/20 via-[#EF4444]/15 to-[#DC2626]/20',
    'from-[#10B981]/20 via-[#059669]/15 to-[#047857]/20',
    'from-[#3B82F6]/20 via-[#2563EB]/15 to-[#1D4ED8]/20',
    'from-[#EC4899]/20 via-[#DB2777]/15 to-[#BE185D]/20',
    'from-[#8B5CF6]/20 via-[#7C3AED]/15 to-[#6D28D9]/20',
    'from-[#14B8A6]/20 via-[#0D9488]/15 to-[#0F766E]/20',
    'from-[#F97316]/20 via-[#EA580C]/15 to-[#C2410C]/20',
  ];
  
  const shadowColors = [
    'rgba(139,92,246,0.5)',
    'rgba(239,68,68,0.5)',
    'rgba(16,185,129,0.5)',
    'rgba(59,130,246,0.5)',
    'rgba(236,72,153,0.5)',
    'rgba(139,92,246,0.5)',
    'rgba(20,184,166,0.5)',
    'rgba(249,115,22,0.5)',
  ];
  
  const accentColors = [
    '#8B5CF6', '#EF4444', '#10B981', '#3B82F6',
    '#EC4899', '#8B5CF6', '#14B8A6', '#F97316'
  ];
  
  const hash = storeName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const index = hash % gradients.length;
  
  return {
    gradient: gradients[index],
    bannerGradient: bannerGradients[index],
    shadow: shadowColors[index],
    accent: accentColors[index]
  };
};



// Main Category Tabs Component
const CategoryTabs = ({ categories, selected, onSelect }) => (
  <div className="flex justify-center items-center gap-5 mb-6 ml-32">
    {categories.map(category => (
      <button
        key={category.id}
        onClick={() => onSelect(category.id)}
        className={`px-20 py-4 rounded-full font-semibold text-[19px] transition-all ${
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
);

// Subcategory Sidebar Component
const SubcategorySidebar = ({ subcategories, selected, onSelect }) => {
  // Icon mapping for common subcategory names
  const getIconForSubcategory = (name) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('sweet') || lowerName.includes('dessert')) return <Cake size={24} weight="regular" />;
    if (lowerName.includes('traditional')) return <BowlFood size={24} weight="regular" />;
    if (lowerName.includes('healthy')) return <Heart size={24} weight="regular" />;
    if (lowerName.includes('bake') || lowerName.includes('bread')) return <Bread size={24} weight="regular" />;
    if (lowerName.includes('beverage') || lowerName.includes('drink')) return <Coffee size={24} weight="regular" />;
    return <Storefront size={24} weight="regular" />; // Default icon
  };

  return (
    <aside className="w-[280px] flex-shrink-0 mt-20">
      <div className="space-y-3">
        {/* "All Stores" option */}
        <button
          onClick={() => onSelect(null)}
          className={`w-full flex items-center gap-4 px-6 py-4 rounded-full text-left transition-all font-medium text-[17px] ${
            selected === null
              ? 'bg-sage-500 text-white shadow-[0_2px_8px_rgba(85,107,92,0.3)]'
              : 'bg-cream-50 text-sage-500 hover:bg-cream-100'
          }`}
          style={{ fontFamily: 'Inter, sans-serif' }}
        >
          <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
            selected === null ? 'bg-sage-700' : 'bg-[#E8F0EA]'
          }`}>
            <div className={selected === null ? 'text-white' : 'text-sage-500'}>
              <Storefront size={24} weight="regular" />
            </div>
          </div>
          <span>All Stores</span>
        </button>

        {/* Actual subcategories */}
        {subcategories.map(subcat => (
          <button
            key={subcat.id}
            onClick={() => onSelect(subcat.id)}
            className={`w-full flex items-center gap-4 px-6 py-4 rounded-full text-left transition-all font-medium text-[17px] ${
              selected === subcat.id
                ? 'bg-sage-500 text-white shadow-[0_2px_8px_rgba(85,107,92,0.3)]'
                : 'bg-cream-50 text-sage-500 hover:bg-cream-100'
            }`}
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
              selected === subcat.id ? 'bg-sage-700' : 'bg-[#E8F0EA]'
            }`}>
              <div className={selected === subcat.id ? 'text-white' : 'text-sage-500'}>
                {getIconForSubcategory(subcat.name)}
              </div>
            </div>
            <span>{subcat.name}</span>
          </button>
        ))}
      </div>
    </aside>
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
        placeholder="Search Food Stores..."
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
const FeaturedCarousel = ({ stores, onStoreClick, subcategories = [], selectedCategory }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Filter stores by selected category only (ignore subcategory filter)
  const categoryFilteredStores = stores.filter(store => {
    if (!selectedCategory) return true;
    return store.categoryId === selectedCategory;
  });
  
  const featured = categoryFilteredStores.slice(0, 6);

  useEffect(() => {
    if (featured.length === 0) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % Math.max(1, featured.length - 2));
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
          {featured.map((store, idx) => {
            const colors = getStoreColors(store.storeName);
            const words = store.storeName.split(' ').filter(w => w.length > 0);
            const initials = words.length >= 2 
              ? words[0][0].toUpperCase() + words[words.length - 1][0].toUpperCase()
              : words[0].slice(0, 2).toUpperCase();
            
            return (
              <div 
                key={store.id || idx} 
                onClick={() => onStoreClick(store.id)}
                className="flex-shrink-0 w-[calc(33.333%-16px)] bg-white rounded-2xl overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.12)] transition-all cursor-pointer"
              >
                <div className={`relative h-32 bg-gradient-to-br ${colors.bannerGradient}`} style={{ backgroundColor: '#F5F5F7' }}>
                  <div className="absolute inset-0 opacity-20">
                    <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                      <defs>
                        <pattern id={`pattern-carousel-${idx}`} patternUnits="userSpaceOnUse" width="25" height="25" patternTransform="rotate(45)">
                          <line x1="0" y1="0" x2="0" y2="25" stroke={colors.accent} strokeWidth="1" opacity="0.3"/>
                        </pattern>
                      </defs>
                      <rect width="100%" height="100%" fill={`url(#pattern-carousel-${idx})`}/>
                    </svg>
                  </div>
                  <div className="absolute top-3 right-4 w-12 h-12 rounded-full opacity-15"
                      style={{ background: `radial-gradient(circle, ${colors.accent} 0%, transparent 70%)` }}></div>
                      {/* Store Status Badge*/}
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
                  
                  <div className="absolute -bottom-8 left-4">
                    <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${colors.gradient} border-4 border-white flex items-center justify-center`}
                        style={{ boxShadow: `0 4px 12px ${colors.shadow}` }}>
                      <div className="absolute inset-0 flex items-center justify-center opacity-15">
                        <svg viewBox="0 0 100 100" className="w-14 h-14 text-white">
                          <polygon points="50,10 85,30 85,70 50,90 15,70 15,30" fill="currentColor"/>
                        </svg>
                      </div>
                      <span className="relative z-10 text-[18px] font-black text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.4)]" 
                            style={{ fontFamily: "Inter, sans-serif" }}>
                        {initials}
                      </span>
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
                      // Get subcategory names for this store
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

// Store Card Component
const StoreCard = ({ store, subcategories = [] }) => {
  const colors = getStoreColors(store.storeName);
  const words = store.storeName.split(' ').filter(w => w.length > 0);
  const initials = words.length >= 2 
    ? words[0][0].toUpperCase() + words[words.length - 1][0].toUpperCase()
    : words[0].slice(0, 2).toUpperCase();

  return (
    <div className="bg-white rounded-2xl overflow-hidden cursor-pointer shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.12)] transition-all">
      <div className={`relative h-32 bg-gradient-to-br ${colors.bannerGradient}`} style={{ backgroundColor: '#F5F5F7' }}>
        <div className="absolute inset-0 opacity-20">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id={`pattern-${store.id}`} patternUnits="userSpaceOnUse" width="25" height="25" patternTransform="rotate(45)">
                <line x1="0" y1="0" x2="0" y2="25" stroke={colors.accent} strokeWidth="1" opacity="0.3"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill={`url(#pattern-${store.id})`}/>
          </svg>
        </div>
        <div className="absolute top-3 right-4 w-12 h-12 rounded-full opacity-15"
             style={{ background: `radial-gradient(circle, ${colors.accent} 0%, transparent 70%)` }}></div>

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
        
        <div className="absolute -bottom-8 left-4">
          <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${colors.gradient} border-4 border-white flex items-center justify-center`}
               style={{ boxShadow: `0 4px 12px ${colors.shadow}` }}>
            <div className="absolute inset-0 flex items-center justify-center opacity-15">
              <svg viewBox="0 0 100 100" className="w-14 h-14 text-white">
                <polygon points="50,10 85,30 85,70 50,90 15,70 15,30" fill="currentColor"/>
              </svg>
            </div>
            <span className="relative z-10 text-[18px] font-black text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.4)]" 
                  style={{ fontFamily: "Inter, sans-serif" }}>
              {initials}
            </span>
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
            // Get subcategory names for this store
            const storeSubcategoryIds = store.subCategoryIds || [];
            // We need to get subcategories from the parent scope
            // Since StoreCard is used in MainStoreView, we'll need to pass subcategories as a prop
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
              const selected = customers.find((c) => c.id === numericId);
              onSelect(selected);
            }
          }}
        >
          <option value="">-- Select Customer --</option>
          {customers.map((customer) => (
            <option key={customer.id} value={customer.id}>
              {customer.fullName || customer.name || `Customer #${customer.id}`}
            </option>
          ))}
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

  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [subcategories, setSubcategories] = useState([]);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null); // null means "All Stores"
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
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [customerAddresses, setCustomerAddresses] = useState([]);

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
  
  if (savedCustomerId && savedCustomerName) {
    setCustomerId(parseInt(savedCustomerId, 10));
    setCustomerName(savedCustomerName);
    console.log("Restored customer session:", savedCustomerName);
  }
  // Removed auto-opening modal - let user browse as guest
}, []);

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

const handleCustomerSelect = (customer) => {
  const name = customer.fullName || customer.name || `Customer #${customer.id}`;
  setCustomerId(customer.id);
  setCustomerName(name);
  setCustomerModalOpen(false);
  
  // Save to sessionStorage
  sessionStorage.setItem('beyti_customerId', customer.id.toString());
  sessionStorage.setItem('beyti_customerName', name);
  
  console.log("Selected customer with addresses:", customer);
};

const handleCustomerLogout = () => {
  // Clear customer session
  sessionStorage.removeItem('beyti_customerId');
  sessionStorage.removeItem('beyti_customerName');
  setCustomerId(null);
  setCustomerName(null);
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

  
// Function to handle store navigation - ALWAYS allow browsing
const handleStoreNavigation = (targetStoreId) => {
  // Always allow navigation to browse stores
  navigate(`/store/${targetStoreId}`, { 
    state: { customerId, customerName } 
  });
};


const filteredStores = stores
  .filter(store => {
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
        customerName={customerName}
        customerId={customerId}
        cart={cart}
        stores={stores}
        customerAddresses={customerAddresses}
        onCustomerClick={handleCustomerClick}
        onLogout={handleCustomerLogout}
        variant="store"
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
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


      <div className="max-w-[1440px] mx-auto px-8 py-8">
        <div className="flex justify-center">
          <CategoryTabs 
            categories={categories} 
            selected={selectedCategory} 
            onSelect={setSelectedCategory} 
          />
        </div>
        
        <div className="flex gap-4 mt-2">
          <SubcategorySidebar 
            subcategories={filteredSubcategories}
            selected={selectedSubcategory} 
            onSelect={setSelectedSubcategory} 
          />

          <div className="flex-1">
            <div className="flex gap-4 items-center mb-8">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search Food Stores..."
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
            <FeaturedCarousel 
              stores={stores} 
              onStoreClick={handleStoreNavigation}
              subcategories={subcategories}
              selectedCategory={selectedCategory}
            />

            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-12 h-12 border-4 border-grey-stroke border-t-sage-500 rounded-full animate-spin"></div>
              </div>
            ) : filteredStores.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="w-24 h-24 bg-cream-100 rounded-full flex items-center justify-center mb-4">
                  <Storefront className="w-12 h-12 text-charcoal-400" weight="regular" />
                </div>
                <h3 className="text-xl font-bold text-charcoal-600 mb-2" style={{ fontFamily: 'Merriweather, serif' }}>
                  No Stores Found
                </h3>
                <p className="text-charcoal-400 text-center max-w-md" style={{ fontFamily: 'Inter, sans-serif' }}>
                  {searchQuery
                    ? `No stores match "${searchQuery}". Try a different search term.`
                    : 'There are no stores available at the moment. Please check back later.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredStores.map(store => (
                  <div key={store.id} onClick={() => handleStoreNavigation(store.id)}>
                    <StoreCard store={store} subcategories={subcategories} />
                  </div>
                ))}
              </div>
            )}
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
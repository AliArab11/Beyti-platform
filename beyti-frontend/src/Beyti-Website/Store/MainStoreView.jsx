import { useState, useEffect , useRef} from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Cake, BowlFood, Heart, Bread, Coffee, Storefront, ShoppingCartSimple, Package } from "@phosphor-icons/react";
import StoreView from "./StoreView";
import OrderDetails from './Components/OrderDetails';
import ActiveOrderBanner from './Components/ActiveOrderBanner';
import Snackbar from './../../components/Snackbar';


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

// Mock getSellers function
const getSellers = async () => {
  try {
    const response = await fetch('https://localhost:7062/api/Sellers');
    if (!response.ok) throw new Error('Failed to fetch');
    return await response.json();
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

// Header Component
const Header = ({ customerName = null, customerId, cart = [], onCustomerClick, onLogout }) => {
  const navigate = useNavigate();  
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <header className="bg-cream-50 py-4 px-8 border-b border-grey-stroke">
      <div className="max-w-[1440px] mx-auto flex items-center justify-between">
        <h1 className="text-[32px] font-bold text-charcoal-600" style={{ fontFamily: 'Merriweather, serif' }}>
          Beyti
        </h1>
        <h2 className="text-[32px] font-bold text-charcoal-600 absolute left-1/2 -translate-x-1/2" style={{ fontFamily: 'Merriweather, serif' }}>
          Beyti Stores
        </h2>
        <div className="flex items-center gap-4">
          <button className="p-2 hover:bg-grey-200 rounded-lg transition-all">
            <svg className="w-5 h-5 text-charcoal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </button>

           {/* Cart Button with Badge */}
            <button
                onClick={() => {
                    let targetStoreId = null;
                    let targetStoreName = null;
                    let targetStore = null;
                    let cartItems = [];
                    
                    // Find the storeId and store details from cart
                    if (customerId) {
                        for (let i = 0; i < localStorage.length; i++) {
                            const key = localStorage.key(i);
                            if (key && key.startsWith(`beyti_cart_`) && key.endsWith(`_${customerId}`)) {
                                try {
                                    const savedCart = localStorage.getItem(key);
                                    if (savedCart) {
                                        const parsedCart = JSON.parse(savedCart);
                                        if (parsedCart.length > 0) {
                                            cartItems = parsedCart;
                                            // Extract storeId from key: beyti_cart_{storeId}_{customerId}
                                            const parts = key.split('_');
                                            targetStoreId = parts[2];
                                            
                                            // Get store name from cart items
                                            targetStoreName = parsedCart[0]?.storeName;
                                            
                                            // Find the full store object
                                            targetStore = stores.find(s => s.id.toString() === targetStoreId);
                                            
                                            break;
                                        }
                                    }
                                } catch (err) {
                                    console.error('Error parsing cart:', err);
                                }
                            }
                        }
                    }
                    
                    // Navigate to checkout with full store details
                    navigate("/checkout", { 
                        state: { 
                            customerId, 
                            customerName,
                            customerAddresses: [], // We don't have addresses in MainStoreView
                            selectedStore: targetStore,
                            storeName: targetStoreName || targetStore?.storeName,
                            storeId: targetStoreId
                        } 
                    });
                }}
                className="p-2 hover:bg-grey-200 rounded-lg transition-all relative"
            >
                <ShoppingCartSimple 
                    className="w-5 h-5 text-charcoal-400"
                    weight="regular"
                />
                {cart.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-sage-500 text-white min-w-[20px] h-5 px-1.5 rounded-full flex items-center justify-center text-xs font-bold">
                        {cart.reduce((total, item) => total + item.quantity, 0)}
                    </span>
                )}
            </button>
          
          {customerName ? (
            <div className="relative">
              {/* Customer Profile Section */}
              <div className="flex items-center border-l border-grey-stroke pl-4">
                {/* Name Button - Clickable to view profile */}
                <button
                onClick={() => {
                    navigate('/customer-dashboard'); // Navigate to dashboard
                }}
                className="flex items-center gap-3 hover:bg-grey-200 rounded-lg px-3 py-2 transition-all"
                >
                <div className="w-8 h-8 bg-sage-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-semibold">{customerName[0]}</span>
                </div>
                <span className="text-charcoal-600 font-medium text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
                    {customerName}
                </span>
                </button>

                {/* Dropdown Arrow Button */}
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="p-2 hover:bg-grey-200 rounded-lg transition-all ml-1"
                >
                  <svg className="w-4 h-4 text-charcoal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>

              {/* Dropdown Menu */}
                {isDropdownOpen && (
                <>
                    <div
                    className="fixed inset-0 z-10"
                    onClick={() => setIsDropdownOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-80 bg-grey-200 dark:bg-charcoal-500 border border-grey-stroke dark:border-charcoal-400 rounded-md shadow-[0_4px_20px_rgba(0,0,0,0.15)] z-20 overflow-hidden">
                    {/* Profile Details Section */}
                    <div className="px-4 py-4 border-b border-grey-stroke dark:border-charcoal-400 bg-cream-50 dark:bg-charcoal-600">
                        <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-full bg-sage-500 dark:bg-sage-700 flex items-center justify-center flex-shrink-0">
                            <span className="text-white text-lg font-semibold">{customerName[0]}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-body-regular text-charcoal-600 dark:text-cream-50 font-semibold truncate" style={{ fontFamily: 'Inter, sans-serif' }}>
                            {customerName}
                            </p>
                            <p className="text-label-medium text-charcoal-400 dark:text-charcoal-300 mt-0.5" style={{ fontFamily: 'Inter, sans-serif' }}>
                            Customer
                            </p>
                        </div>
                        </div>
                    </div>

                    {/* Menu Actions */}
                    <div className="py-1">
                        <button
                          onClick={() => {
                            setIsDropdownOpen(false);
                            navigate('/customer-dashboard');
                          }}
                          className="w-full px-4 py-2.5 text-left text-body-regular text-charcoal-600 dark:text-cream-50 hover:bg-cream-100 dark:hover:bg-charcoal-400 transition-colors flex items-center gap-3"
                        >
                          <Package 
                            size={20}
                            weight="regular"
                            className="text-charcoal-500 dark:text-charcoal-300"
                          />

                          <span style={{ fontFamily: 'Inter, sans-serif' }}>My Orders</span>
                        </button>

                        <button
                        onClick={() => {
                            setIsDropdownOpen(false);
                            // Navigate to Addresses (placeholder)
                        }}
                        className="w-full px-4 py-2.5 text-left text-body-regular text-charcoal-600 dark:text-cream-50 hover:bg-cream-100 dark:hover:bg-charcoal-400 transition-colors flex items-center gap-3"
                        >
                        <svg className="w-5 h-5 text-charcoal-500 dark:text-charcoal-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span style={{ fontFamily: 'Inter, sans-serif' }}>Addresses</span>
                        </button>

                        <button
                        onClick={() => {
                            setIsDropdownOpen(false);
                            // Navigate to Settings (placeholder)
                        }}
                        className="w-full px-4 py-2.5 text-left text-body-regular text-charcoal-600 dark:text-cream-50 hover:bg-cream-100 dark:hover:bg-charcoal-400 transition-colors flex items-center gap-3"
                        >
                        <svg className="w-5 h-5 text-charcoal-500 dark:text-charcoal-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span style={{ fontFamily: 'Inter, sans-serif' }}>Settings</span>
                        </button>
                    </div>

                    {/* Logout Section */}
                    <div className="border-t border-grey-stroke dark:border-charcoal-400">
                        <button
                        onClick={() => {
                            setIsDropdownOpen(false);
                            onLogout();
                        }}
                        className="w-full px-4 py-2.5 text-left text-body-regular text-error-text dark:text-red-400 hover:bg-error-bg dark:hover:bg-red-900/20 transition-colors flex items-center gap-3"
                        >
                        <svg className="w-5 h-5 text-error-text dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span style={{ fontFamily: 'Inter, sans-serif' }}>Logout</span>
                        </button>
                    </div>
                    </div>
                </>
                )}
            </div>
          ) : (
            <button
              onClick={onCustomerClick}
              className="flex items-center gap-2 pl-4 border-l border-grey-stroke bg-sage-500 hover:bg-sage-600 text-white px-4 py-2 rounded-lg transition-all"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="text-sm font-semibold" style={{ fontFamily: 'Inter, sans-serif' }}>
                Select Customer
              </span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};


// Main Category Tabs Component
const CategoryTabs = ({ categories, selected, onSelect }) => (
  <div className="flex justify-center items-center gap-5 mb-6 ml-32">
    {categories.map(category => (
      <button
        key={category}
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

// Subcategory Sidebar Component
const SubcategorySidebar = ({ categories, selected, onSelect }) => (
  <aside className="w-[280px] flex-shrink-0 mt-20">
    <div className="space-y-3">
      {categories.map(cat => (
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
              {cat.icon}
            </div>
          </div>
          <span>{cat.label}</span>
        </button>
      ))}
    </div>
  </aside>
);

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
const FeaturedCarousel = ({ stores, onStoreClick }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const featured = stores.slice(0, 6);

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
                className="flex-shrink-0 w-[calc(33.333%-16px)] bg-white rounded-2xl overflow-hidden shadow-[0_2px_10px_rgba(0,0,0,0.1)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.15)] transition-all cursor-pointer"
              >
                {/* Dynamic Banner */}
                <div className={`relative h-40 bg-gradient-to-br ${colors.bannerGradient}`} style={{ backgroundColor: '#F5F5F7' }}>
                  <div className="absolute inset-0 opacity-20">
                    <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                      <defs>
                        <pattern id={`pattern-${idx}`} patternUnits="userSpaceOnUse" width="30" height="30" patternTransform="rotate(45)">
                          <line x1="0" y1="0" x2="0" y2="30" stroke={colors.accent} strokeWidth="1" opacity="0.3"/>
                        </pattern>
                      </defs>
                      <rect width="100%" height="100%" fill={`url(#pattern-${idx})`}/>
                    </svg>
                  </div>
                  <div className="absolute top-4 right-6 w-16 h-16 rounded-full opacity-15"
                       style={{ background: `radial-gradient(circle, ${colors.accent} 0%, transparent 70%)` }}></div>
                  
                  <div className="absolute -bottom-9 left-5">
                    <div className={`w-[4.5rem] h-[4.5rem] rounded-full bg-gradient-to-br ${colors.gradient} border-4 border-white flex items-center justify-center`}
                         style={{ boxShadow: `0 4px 12px ${colors.shadow}` }}>
                      <div className="absolute inset-0 flex items-center justify-center opacity-15">
                        <svg viewBox="0 0 100 100" className="w-16 h-16 text-white">
                          <polygon points="50,10 85,30 85,70 50,90 15,70 15,30" fill="currentColor"/>
                        </svg>
                      </div>
                      <span className="relative z-10 text-[22px] font-black text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.4)]" 
                            style={{ fontFamily: "Inter, sans-serif" }}>
                        {initials}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="pt-11 p-5 bg-white">
                  <h3 className="font-bold text-charcoal-600 text-[17px] mb-2" style={{ fontFamily: 'Merriweather, serif' }}>{store.storeName}</h3>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className="w-3.5 h-3.5 text-[#F5C563] fill-current" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
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
const StoreCard = ({ store }) => {
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
          {[1,2,3,4,5].map(star => (
            <svg key={star} className="w-3.5 h-3.5 text-[#F5C563] fill-current" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          ))}
          <span className="text-xs font-semibold text-charcoal-600 ml-1" style={{ fontFamily: 'Inter, sans-serif' }}>4.5</span>
        </div>
        <div className="flex gap-2 flex-wrap">
          <span className="px-3 py-1 bg-cream-100 rounded-full text-xs font-medium text-charcoal-600" style={{ fontFamily: 'Inter, sans-serif' }}>Bakery</span>
          <span className="px-3 py-1 bg-cream-100 rounded-full text-xs font-medium text-charcoal-600" style={{ fontFamily: 'Inter, sans-serif' }}>Sweets</span>
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
  const [selectedCategory, setSelectedCategory] = useState("Food & Drink");
  const [selectedSubcategory, setSelectedSubcategory] = useState("sweets");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStoreId, setSelectedStoreId] = useState(null);

 // Customer state
  const [customers, setCustomers] = useState([]);
  const [customerId, setCustomerId] = useState(null);
  const [customerName, setCustomerName] = useState(null);
  const [customerModalOpen, setCustomerModalOpen] = useState(false);

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




// Fetch customer orders AND auto-cancel expired ones
useEffect(() => {
  if (!customerId) {
    setOrders([]);
    return;
  }

  const checkAndCancelExpiredOrders = async (ordersList) => {
    const now = new Date();
    const expiredOrders = [];

    for (const order of ordersList) {
      const status = order.status?.toLowerCase();
      
      // Only check orders that are still pending/placed
      if (!['placed', 'pending'].includes(status)) continue;

      // Parse order creation time
      let orderTime;
      const dateStr = order.createdAt;
      
      if (dateStr.endsWith('Z')) {
        orderTime = new Date(dateStr);
      } else if (dateStr.includes('T') && !dateStr.includes('+') && !dateStr.endsWith('Z')) {
        orderTime = new Date(dateStr + 'Z');
      } else {
        orderTime = new Date(dateStr);
      }

      // Check if 10 minutes have passed
      const expiryTime = new Date(orderTime.getTime() + 10 * 60 * 1000);
      
      if (now >= expiryTime) {
        expiredOrders.push(order.id);
      }
    }

    // Cancel all expired orders
    if (expiredOrders.length > 0) {
      console.log('🔄 Found', expiredOrders.length, 'expired orders, cancelling...');
      
      for (const orderId of expiredOrders) {
        try {
          const response = await fetch(
            `https://localhost:7062/api/Orders/${orderId}/seller-response`,
            {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                Status: 'Cancelled',
                SellerNote: 'Order auto-cancelled: No response within 10 minutes'
              })
            }
          );

          if (response.ok) {
            console.log('✅ Auto-cancelled order:', orderId);
          }
        } catch (err) {
          console.error('❌ Failed to auto-cancel order', orderId, err);
        }
      }

      // Refetch orders to get updated statuses
      return true;
    }

    return false;
  };

  const fetchOrders = async () => {
    try {
      const response = await fetch(`https://localhost:7062/api/Orders?customerId=${customerId}`);
      if (response.ok) {
        const data = await response.json();
        const ordersList = Array.isArray(data) ? data : [];
        
        // Check for expired orders before setting state
        const needsRefetch = await checkAndCancelExpiredOrders(ordersList);
        
        if (needsRefetch) {
          // Fetch again to get updated statuses
          const refreshResponse = await fetch(`https://localhost:7062/api/Orders?customerId=${customerId}`);
          if (refreshResponse.ok) {
            const refreshedData = await refreshResponse.json();
            setOrders(Array.isArray(refreshedData) ? refreshedData : []);
          }
        } else {
          setOrders(ordersList);
        }
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
      setOrders([]);
    }
  };

  fetchOrders();
  
  // Check every 30 seconds for expired orders
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


  const categories = ["Food & Drink", "Clothing & Accessories", "Self-Care & Beauty"];
  
  const subcategories = [
    { id: "sweets", label: "Sweets", icon: <Cake size={24} weight="regular" /> },
    { id: "traditional", label: "Traditional", icon: <BowlFood size={24} weight="regular" /> },
    { id: "healthy", label: "Healthy", icon: <Heart size={24} weight="regular" /> },
    { id: "bakery", label: "Bakery", icon: <Bread size={24} weight="regular" /> },
    { id: "beverages", label: "Beverages", icon: <Coffee size={24} weight="regular" /> }
  ];

  useEffect(() => {
    fetchStores();
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
  } else {
    // No saved session, show customer select modal
    setCustomerModalOpen(true);  
  }
}, []);

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

  
// Function to handle store navigation - ALWAYS allow browsing
const handleStoreNavigation = (targetStoreId) => {
  // Always allow navigation to browse stores
  navigate(`/store/${targetStoreId}`, { 
    state: { customerId, customerName } 
  });
};



  const filteredStores = stores.filter(store => 
    store.storeName?.toLowerCase().includes(searchQuery.toLowerCase())
  );


  

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAF7F2' }}>
      <CustomerSelectModal
        isOpen={customerModalOpen}
        customers={customers}
        onSelect={handleCustomerSelect}
        onClose={() => setCustomerModalOpen(false)}
      />
      
      <Header 
        customerName={customerName}
        customerId={customerId}
        cart={cart}
        onCustomerClick={handleCustomerClick}
        onLogout={handleCustomerLogout}
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
            categories={subcategories} 
            selected={selectedSubcategory} 
            onSelect={setSelectedSubcategory} 
          />

          <div className="flex-1">
            <SearchBar value={searchQuery} onChange={setSearchQuery} />
            <FeaturedCarousel 
            stores={stores} 
            onStoreClick={handleStoreNavigation}
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
                        <StoreCard store={store} />
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
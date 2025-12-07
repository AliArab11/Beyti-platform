import { useState, useEffect } from "react";
import { Cake, BowlFood, Heart, Bread, Coffee } from "@phosphor-icons/react";
import StoreView from "./StoreView";

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

// Header Component
const Header = ({ userName = "Ahmed" }) => (
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
        <button className="p-2 hover:bg-grey-200 rounded-lg transition-all">
          <svg className="w-5 h-5 text-charcoal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>
        <button className="p-2 hover:bg-grey-200 rounded-lg transition-all">
          <svg className="w-5 h-5 text-charcoal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
        </button>
        <div className="flex items-center gap-3 pl-4 border-l border-grey-stroke">
          <div className="w-8 h-8 bg-sage-500 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-semibold">{userName[0]}</span>
          </div>
          <span className="text-charcoal-600 font-medium text-sm">{userName}</span>
          <svg className="w-4 h-4 text-charcoal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>
  </header>
);

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
  
  // Get first 6 stores for featured carousel
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
                    {featured.map((store, idx) => (
            <div 
              key={store.id || idx} 
              onClick={() => onStoreClick(store.id)} // 🆕 ADD THIS
              className="flex-shrink-0 w-[calc(33.333%-16px)] bg-white rounded-2xl overflow-hidden shadow-[0_2px_10px_rgba(0,0,0,0.1)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.15)] transition-all cursor-pointer" // 🆕 ADD cursor-pointer
            >
              <div className="relative h-40 bg-gradient-to-br from-[#D8E8DC] to-[#C9DFD0]">
                <div className="absolute -bottom-9 left-5">
                  <div className="w-[4.5rem] h-[4.5rem] bg-white rounded-full flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.15)] border-4 border-white">
                    <svg className="w-9 h-9 text-sage-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
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
          ))}
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
const StoreCard = ({ store }) => (
  <div className="bg-white rounded-2xl overflow-hidden cursor-pointer shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.12)] transition-all">
    <div className="relative h-32 bg-gradient-to-br from-[#D8E8DC] to-[#C9DFD0]">
      <div className="absolute -bottom-8 left-4">
        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.15)] border-4 border-white">
          <svg className="w-8 h-8 text-sage-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
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

// Main Component
const MainStoreView = () => {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("Food & Drink");
  const [selectedSubcategory, setSelectedSubcategory] = useState("sweets");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStoreId, setSelectedStoreId] = useState(null);

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

  const filteredStores = stores.filter(store => 
    store.storeName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

    if (selectedStoreId) {
    return (
      <StoreView storeId={selectedStoreId} onBack={() => setSelectedStoreId(null)} />
    );
  }


  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAF7F2' }}>
      <Header />

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
              onStoreClick={(id) => setSelectedStoreId(id)} // 🆕 ADD THIS LINE
            />

            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-12 h-12 border-4 border-grey-stroke border-t-sage-500 rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredStores.map(store => (
                  <div key={store.id} onClick={() => setSelectedStoreId(store.id)}> {/* 🆕 WRAP IN DIV */}
                    <StoreCard store={store} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainStoreView;
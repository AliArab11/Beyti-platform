import { useNavigate } from 'react-router-dom';
import { Storefront, Scissors } from "@phosphor-icons/react";

// Header Component
const Header = ({ userName = "Ahmed" }) => (
  <header className="bg-cream-50 py-4 px-8 border-b border-grey-stroke">
    <div className="max-w-[1440px] mx-auto flex items-center justify-between">
      <h1 className="text-[32px] font-bold text-charcoal-600" style={{ fontFamily: 'Merriweather, serif' }}>
        Beyti
      </h1>
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

// Selection Card Component
const SelectionCard = ({ title, description, icon: Icon, onClick, gradient }) => (
  <div
    onClick={onClick}
    className="cursor-pointer group bg-white rounded-3xl overflow-hidden shadow-[0_4px_16px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.12)] transition-all duration-300 transform hover:scale-[1.02]"
  >
    <div className={`relative h-64 ${gradient}`}>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-32 h-32 bg-white/90 rounded-full flex items-center justify-center shadow-[0_4px_16px_rgba(0,0,0,0.1)] group-hover:scale-110 transition-transform duration-300">
          <Icon size={64} className="text-sage-500" weight="regular" />
        </div>
      </div>
    </div>

    <div className="p-8 bg-white">
      <h3 className="font-bold text-charcoal-600 text-2xl mb-3" style={{ fontFamily: 'Merriweather, serif' }}>
        {title}
      </h3>
      <p className="text-charcoal-400 text-base leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>
        {description}
      </p>
      <div className="mt-6 flex items-center gap-2 text-sage-500 font-semibold group-hover:gap-4 transition-all">
        <span style={{ fontFamily: 'Inter, sans-serif' }}>Browse Now</span>
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </div>
  </div>
);

// Main Component
const StoreTypeSelection = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAF7F2' }}>
      <Header />

      <div className="max-w-[1200px] mx-auto px-8 py-16">
        <div className="text-center mb-16">
          <h2 className="text-[48px] font-bold text-charcoal-600 mb-4" style={{ fontFamily: 'Merriweather, serif' }}>
            Welcome to Beyti Stores
          </h2>
          <p className="text-xl text-charcoal-400 max-w-2xl mx-auto" style={{ fontFamily: 'Inter, sans-serif' }}>
            Discover amazing products and services from local businesses. Choose your shopping experience below.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <SelectionCard
            title="Seller Stores"
            description="Browse through a wide variety of products from local sellers. Find unique items, handmade goods, and everything you need."
            icon={Storefront}
            onClick={() => navigate('/mainStore')}
            gradient="bg-gradient-to-br from-[#D8E8DC] to-[#C9DFD0]"
          />

          <SelectionCard
            title="Service Providers"
            description="Connect with skilled service providers for all your needs. From beauty services to home maintenance and more."
            icon={Scissors}
            onClick={() => navigate('/serviceProviders')}
            gradient="bg-gradient-to-br from-[#E8D8E0] to-[#DFC9D8]"
          />
        </div>
      </div>
    </div>
  );
};

export default StoreTypeSelection;

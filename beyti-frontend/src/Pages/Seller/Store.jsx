import { useState, useEffect } from "react";
import { getSellers } from "../../services/api";

const StoresPage = () => {
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedStoreId, setSelectedStoreId] = useState(null);
  const [selectedStore, setSelectedStore] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    fetchSellers();
  }, []);

  const fetchSellers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getSellers();
      setSellers(data);
    } catch (err) {
      setError(err.message || "Failed to load stores");
    } finally {
      setLoading(false);
    }
  };

  const handleStoreClick = async (storeId) => {
    try {
      setLoadingDetails(true);
      setSelectedStoreId(storeId);
      
      const response = await fetch(`https://localhost:7062/api/Sellers/${storeId}/products`);
      
      if (!response.ok) {
        throw new Error(`Failed to load store details`);
      }

      const data = await response.json();
      setSelectedStore(data);
    } catch (err) {
      console.error("Error loading store details:", err);
      alert("Failed to load store details: " + err.message);
      setSelectedStoreId(null);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleBackToStores = () => {
    setSelectedStoreId(null);
    setSelectedStore(null);
  };

  const handleProductClick = (product) => {
    setSelectedProduct(product);
  };

  const closeProductModal = () => {
    setSelectedProduct(null);
  };

  const filteredSellers = sellers.filter(seller =>
    seller.storeName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen !bg-gradient-to-br !from-blue-50 !via-indigo-50 !to-purple-50">
        <div className="text-center">
          <div className="relative inline-block">
            <div className="w-20 h-20 border-4 !border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            <div className="absolute inset-0 w-20 h-20 border-4 !border-transparent border-r-purple-600 rounded-full animate-spin" style={{animationDirection: 'reverse', animationDuration: '1s'}}></div>
          </div>
          <p className="mt-6 text-xl font-bold !text-gray-800 animate-pulse">Loading stores...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen !bg-gradient-to-br !from-red-50 !to-orange-50">
        <div className="max-w-md w-full !bg-white shadow-2xl rounded-3xl p-8 border-l-4 !border-red-500">
          <div className="flex items-center gap-4 mb-4">
            <div className="!bg-red-100 p-4 rounded-full">
              <svg className="w-8 h-8 !text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold !text-gray-900">Error Loading Stores</h2>
          </div>
          <p className="!text-gray-700 mb-6 text-lg">{error}</p>
          <button 
            onClick={fetchSellers} 
            className="w-full !bg-gradient-to-r !from-red-500 !to-orange-500 hover:!from-red-600 hover:!to-orange-600 !text-white py-3 px-6 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Store Details View
  if (selectedStoreId && selectedStore) {
    return (
      <div className="min-h-screen !bg-gradient-to-br !from-slate-50 !via-blue-50 !to-indigo-100 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Back Button */}
          <button
            onClick={handleBackToStores}
            className="group mb-8 flex items-center gap-3 !bg-white hover:!bg-blue-600 !text-blue-600 hover:!text-white px-6 py-3 rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
          >
            <svg className="w-6 h-6 transform group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Stores
          </button>

          {/* Store Header Card */}
          <div className="!bg-gradient-to-br !from-white !to-blue-50 shadow-2xl rounded-3xl border-2 !border-blue-200 p-8 mb-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 !bg-gradient-to-br !from-blue-400 !to-purple-400 rounded-full blur-3xl opacity-20 -mr-32 -mt-32"></div>
            
            <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex-1">
                <h1 className="text-5xl font-black !text-gray-900 mb-4">{selectedStore.storeName}</h1>
                
                <div className="flex flex-wrap items-center gap-4">
                  {selectedStore.phone && (
                    <div className="flex items-center gap-2 !bg-white px-4 py-2 rounded-xl shadow-md">
                      <svg className="w-5 h-5 !text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <span className="font-bold !text-gray-800">{selectedStore.phone}</span>
                    </div>
                  )}
                  <div className="!bg-gradient-to-r !from-green-500 !to-emerald-500 !text-white text-sm font-bold px-6 py-2 rounded-xl shadow-lg">
                    {selectedStore.products?.length || 0} Products
                  </div>
                </div>
              </div>
              
              <div className="!bg-gradient-to-br !from-blue-600 !to-purple-600 p-6 rounded-3xl shadow-2xl transform hover:rotate-6 transition-transform">
                <svg className="w-16 h-16 !text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            </div>

            {/* Store Locations */}
            {selectedStore.sellerAddresses && selectedStore.sellerAddresses.length > 0 && (
              <div className="mt-8 pt-6 border-t-2 border-blue-200">
                <div className="flex items-center gap-2 mb-4">
                  <svg className="w-6 h-6 !text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <h3 className="text-xl font-black !text-gray-900">Store Locations</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedStore.sellerAddresses.map((sa, idx) => (
                    <div key={idx} className="!bg-white p-5 rounded-2xl border-2 !border-blue-100 hover:!border-blue-300 hover:shadow-xl transition-all transform hover:scale-105">
                      <p className="!text-gray-900 font-bold text-lg mb-1">{sa.address?.street}</p>
                      <p className="!text-gray-600 font-medium">
                        {sa.address?.city}{sa.address?.region && `, ${sa.address.region}`}
                      </p>
                      <p className="!text-blue-600 font-bold mt-2">{sa.address?.country}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Products Header */}
          <div className="mb-8 text-center">
            <h2 className="text-4xl font-black !text-gray-900 mb-3">Our Products</h2>
            <p className="text-xl !text-gray-600 font-medium">
              {selectedStore.products && selectedStore.products.length > 0 
                ? `Browse our collection of ${selectedStore.products.length} product${selectedStore.products.length !== 1 ? 's' : ''}`
                : 'No products available at the moment'
              }
            </p>
          </div>

          {/* Products Grid */}
          {selectedStore.products && selectedStore.products.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {selectedStore.products.map((product) => (
                <div key={product.id} className="group !bg-white rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl border-2 !border-gray-100 hover:!border-blue-300 transition-all transform hover:scale-105">
                  <div className="relative !bg-gradient-to-br !from-blue-100 !via-purple-100 !to-pink-100 h-64 flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 !bg-gradient-to-br !from-blue-500/20 !to-purple-500/20 group-hover:scale-110 transition-transform"></div>
                    <svg className="w-32 h-32 !text-white/50 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    <div className="absolute top-4 right-4 !bg-gradient-to-r !from-green-500 !to-emerald-500 !text-white text-2xl font-black px-5 py-3 rounded-2xl shadow-2xl transform rotate-3 group-hover:rotate-6 transition-transform">
                      ${product.basePrice.toFixed(2)}
                    </div>
                  </div>

                  <div className="p-6">
                    <h3 className="text-2xl font-black !text-gray-900 mb-3 line-clamp-2 group-hover:!text-blue-600 transition-colors">
                      {product.name}
                    </h3>

                    {product.description && (
                      <p className="!text-gray-600 text-sm mb-4 line-clamp-3 leading-relaxed">
                        {product.description}
                      </p>
                    )}

                    {product.subCategory && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        <span className="!bg-gradient-to-r !from-blue-100 !to-purple-100 !text-blue-800 text-xs font-bold px-4 py-2 rounded-full border-2 !border-blue-200">
                          {product.subCategory.name}
                        </span>
                      </div>
                    )}

                    <button 
                      onClick={() => handleProductClick(product)}
                      className="w-full !bg-gradient-to-r !from-blue-600 !to-purple-600 hover:!from-blue-700 hover:!to-purple-700 !text-white font-bold py-4 rounded-2xl shadow-lg hover:shadow-2xl transition-all transform hover:scale-105 flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="!bg-gradient-to-br !from-white !to-gray-50 rounded-3xl p-16 text-center shadow-2xl">
              <div className="!bg-gradient-to-br !from-blue-100 !to-purple-100 w-32 h-32 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-16 h-16 !text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h3 className="text-3xl font-black !text-gray-900 mb-3">No Products Yet</h3>
              <p className="!text-gray-600 text-lg mb-6">This store is preparing something amazing!</p>
              <button
                onClick={handleBackToStores}
                className="!bg-gradient-to-r !from-blue-600 !to-purple-600 hover:!from-blue-700 hover:!to-purple-700 !text-white px-8 py-4 rounded-2xl font-bold shadow-lg hover:shadow-2xl transition-all transform hover:scale-105"
              >
                Explore Other Stores
              </button>
            </div>
          )}
        </div>

        {/* Product Details Modal */}
        {selectedProduct && (
          <div className="fixed inset-0 !bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="!bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto relative transform animate-slideUp">
              {/* Close Button */}
              <button
                onClick={closeProductModal}
                className="absolute top-6 right-6 !bg-red-500 hover:!bg-red-600 !text-white p-3 rounded-full shadow-lg transition-all transform hover:scale-110 z-10"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Modal Content */}
              <div className="p-8">
                {/* Product Image */}
                <div className="relative !bg-gradient-to-br !from-blue-100 !via-purple-100 !to-pink-100 h-96 flex items-center justify-center rounded-3xl overflow-hidden mb-8">
                  <div className="absolute inset-0 !bg-gradient-to-br !from-blue-500/20 !to-purple-500/20"></div>
                  <svg className="w-48 h-48 !text-white/50 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  <div className="absolute top-6 right-6 !bg-gradient-to-r !from-green-500 !to-emerald-500 !text-white text-3xl font-black px-8 py-4 rounded-2xl shadow-2xl">
                    ${selectedProduct.basePrice.toFixed(2)}
                  </div>
                </div>

                {/* Product Info */}
                <div className="space-y-6">
                  <div>
                    <h2 className="text-5xl font-black !text-gray-900 mb-4">{selectedProduct.name}</h2>
                    {selectedProduct.subCategory && (
                      <div className="flex flex-wrap gap-3 mb-4">
                        <span className="!bg-gradient-to-r !from-blue-100 !to-purple-100 !text-blue-800 text-sm font-bold px-6 py-2 rounded-full border-2 !border-blue-200">
                          {selectedProduct.subCategory.name}
                        </span>
                        {selectedProduct.subCategory.category && (
                          <span className="!bg-gradient-to-r !from-purple-100 !to-pink-100 !text-purple-800 text-sm font-bold px-6 py-2 rounded-full border-2 !border-purple-200">
                            {selectedProduct.subCategory.category.name}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  {selectedProduct.description && (
                    <div className="!bg-gradient-to-r !from-gray-50 !to-blue-50 p-6 rounded-2xl border-2 !border-gray-100">
                      <h3 className="text-xl font-black !text-gray-900 mb-3 flex items-center gap-2">
                        <svg className="w-6 h-6 !text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Description
                      </h3>
                      <p className="!text-gray-700 text-lg leading-relaxed">{selectedProduct.description}</p>
                    </div>
                  )}

                  {/* Product Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="!bg-gradient-to-br !from-blue-50 !to-indigo-50 p-6 rounded-2xl border-2 !border-blue-100">
                      <div className="flex items-center gap-3 mb-2">
                        <svg className="w-6 h-6 !text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <h4 className="font-black !text-gray-900">Price</h4>
                      </div>
                      <p className="text-3xl font-black !text-blue-600">${selectedProduct.basePrice.toFixed(2)}</p>
                    </div>

                    <div className="!bg-gradient-to-br !from-purple-50 !to-pink-50 p-6 rounded-2xl border-2 !border-purple-100">
                      <div className="flex items-center gap-3 mb-2">
                        <svg className="w-6 h-6 !text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        <h4 className="font-black !text-gray-900">Store</h4>
                      </div>
                      <p className="text-xl font-bold !text-purple-600">{selectedStore.storeName}</p>
                    </div>

                    {selectedProduct.createdAt && (
                      <div className="!bg-gradient-to-br !from-green-50 !to-emerald-50 p-6 rounded-2xl border-2 !border-green-100">
                        <div className="flex items-center gap-3 mb-2">
                          <svg className="w-6 h-6 !text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <h4 className="font-black !text-gray-900">Added On</h4>
                        </div>
                        <p className="text-lg font-bold !text-green-600">{new Date(selectedProduct.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                      </div>
                    )}

                    {selectedProduct.isActive !== undefined && (
                      <div className="!bg-gradient-to-br !from-orange-50 !to-yellow-50 p-6 rounded-2xl border-2 !border-orange-100">
                        <div className="flex items-center gap-3 mb-2">
                          <svg className="w-6 h-6 !text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <h4 className="font-black !text-gray-900">Status</h4>
                        </div>
                        <p className="text-lg font-bold !text-orange-600">{selectedProduct.isActive ? 'Active' : 'Inactive'}</p>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-4 pt-6">
                    <button className="flex-1 !bg-gradient-to-r !from-blue-600 !to-purple-600 hover:!from-blue-700 hover:!to-purple-700 !text-white font-bold py-4 rounded-2xl shadow-lg hover:shadow-2xl transition-all transform hover:scale-105 flex items-center justify-center gap-3">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      Add to Cart
                    </button>
                    <button 
                      onClick={closeProductModal}
                      className="!bg-gray-200 hover:!bg-gray-300 !text-gray-800 font-bold py-4 px-8 rounded-2xl transition-all transform hover:scale-105"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Store List View
  return (
    <div className="min-h-screen !bg-gradient-to-br !from-blue-50 !via-indigo-50 !to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Hero Header */}
        <div className="text-center mb-12">
          <h1 className="text-6xl md:text-7xl font-black !text-gray-900 mb-4">
            Browse Stores
          </h1>
          <p className="text-2xl !text-gray-700 font-medium max-w-2xl mx-auto">
            Discover incredible sellers and their unique products
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for stores..."
              className="w-full !bg-white !text-gray-900 placeholder-gray-400 px-8 py-6 pl-16 rounded-3xl shadow-2xl border-2 !border-blue-200 focus:!border-blue-500 focus:outline-none text-xl font-medium transition-all"
            />
            <svg className="absolute left-6 top-1/2 transform -translate-y-1/2 w-8 h-8 !text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Stats */}
        <div className="max-w-md mx-auto mb-12">
          <div className="!bg-gradient-to-r !from-blue-600 !to-purple-600 !text-white px-8 py-6 rounded-3xl shadow-2xl text-center transform hover:scale-105 transition-transform">
            <span className="text-5xl font-black">{filteredSellers.length}</span>
            <span className="text-2xl font-bold ml-3">Store{filteredSellers.length !== 1 ? 's' : ''} Available</span>
          </div>
        </div>

        {/* Loading Overlay */}
        {loadingDetails && (
          <div className="fixed inset-0 !bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="!bg-white p-10 rounded-3xl shadow-2xl text-center">
              <div className="relative w-20 h-20 mx-auto mb-4">
                <div className="w-20 h-20 border-4 !border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
              </div>
              <p className="text-xl font-bold !text-gray-800">Loading store...</p>
            </div>
          </div>
        )}

        {/* Stores Grid */}
        {filteredSellers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredSellers.map((seller) => (
              <button
                key={seller.id}
                onClick={() => handleStoreClick(seller.id)}
                className="group !bg-white rounded-3xl shadow-xl hover:shadow-2xl border-2 !border-gray-100 hover:!border-blue-300 p-8 text-left transition-all transform hover:scale-105 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 !bg-gradient-to-br !from-blue-400 !to-purple-400 rounded-full blur-3xl opacity-0 group-hover:opacity-20 transition-opacity"></div>
                
                <div className="relative flex items-start justify-between mb-6">
                  <div className="!bg-gradient-to-br !from-blue-600 !to-purple-600 p-5 rounded-2xl shadow-lg group-hover:rotate-12 transition-transform">
                    <svg className="w-10 h-10 !text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  {seller.sellerAddresses && seller.sellerAddresses.length > 0 && (
                    <span className="!bg-gradient-to-r !from-green-500 !to-emerald-500 !text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg">
                      {seller.sellerAddresses.length} Location{seller.sellerAddresses.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>

                <h3 className="text-3xl font-black !text-gray-900 mb-4 group-hover:!text-blue-600 transition-colors">
                  {seller.storeName}
                </h3>
                
                {seller.phone && (
                  <div className="flex items-center gap-3 !text-gray-600 mb-4 !bg-gray-50 px-4 py-3 rounded-xl">
                    <svg className="w-5 h-5 !text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span className="font-bold">{seller.phone}</span>
                  </div>
                )}

                {seller.sellerAddresses && seller.sellerAddresses.length > 0 && seller.sellerAddresses[0].address && (
                  <div className="flex items-start gap-3 !text-gray-600 mb-6 !bg-blue-50 px-4 py-3 rounded-xl">
                    <svg className="w-5 h-5 !text-blue-600 mt-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="font-medium line-clamp-2">
                      {seller.sellerAddresses[0].address.city}, {seller.sellerAddresses[0].address.country}
                    </span>
                  </div>
                )}

                <div className="pt-6 border-t-2 border-gray-100 flex items-center justify-between !text-blue-600 font-black text-lg group-hover:!text-purple-600 transition-colors">
                  <span>Explore Store</span>
                  <svg className="w-6 h-6 transform group-hover:translate-x-2 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="!bg-gradient-to-br !from-white !to-gray-50 rounded-3xl p-20 text-center shadow-2xl">
            <div className="!bg-gradient-to-br !from-blue-100 !to-purple-100 w-40 h-40 rounded-full flex items-center justify-center mx-auto mb-8">
              <svg className="w-20 h-20 !text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-4xl font-black !text-gray-900 mb-4">No Stores Found</h3>
            <p className="!text-gray-600 text-xl mb-8">Try adjusting your search or check back later</p>
            <button 
              onClick={() => setSearchQuery("")}
              className="!bg-gradient-to-r !from-blue-600 !to-purple-600 hover:!from-blue-700 hover:!to-purple-700 !text-white px-8 py-4 rounded-2xl font-bold shadow-lg hover:shadow-2xl transition-all transform hover:scale-105"
            >
              Clear Search
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default StoresPage;
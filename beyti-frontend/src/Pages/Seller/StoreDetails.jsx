import { useState, useEffect } from "react";

const StoreDetails = ({ storeId, onBack }) => {
  const [seller, setSeller] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (storeId) {
      fetchSellerDetails();
    }
  }, [storeId]);

  const fetchSellerDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Debug log
      const url = `/api/Sellers/${storeId}/products`;
      console.log("Fetching from URL:", url);
      
      const response = await fetch(url);
      
      console.log("Response status:", response.status);
      console.log("Response headers:", {
        contentType: response.headers.get('content-type'),
        contentLength: response.headers.get('content-length')
      });

      if (!response.ok) {
        const text = await response.text();
        console.error("Error response body:", text);
        throw new Error(`HTTP ${response.status}: ${text.substring(0, 200)}`);
      }

      const data = await response.json();
      console.log("Success! Data received:", data);
      setSeller(data);
    } catch (err) {
      console.error("Full error object:", err);
      setError(err.message || "Failed to load store details");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen !bg-gray-50">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-r-transparent"></div>
          <p className="mt-4 text-lg !text-gray-600">Loading store details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen !bg-gray-50">
        <div className="max-w-md w-full !bg-white shadow-lg rounded-lg p-6 border-l-4 border-red-500">
          <h2 className="text-xl font-semibold !text-gray-800 mb-2">Error Loading Store</h2>
          <p className="!text-gray-600 mb-2 text-sm font-mono bg-gray-50 p-2 rounded">{error}</p>
          <p className="!text-gray-600 mb-4 text-xs">Check browser console (F12) for more details</p>
          <div className="flex gap-3">
            <button onClick={fetchSellerDetails} className="flex-1 !bg-blue-600 hover:!bg-blue-700 !text-white py-2 px-4 rounded-lg">
              Retry
            </button>
            <button onClick={onBack} className="flex-1 !bg-gray-500 hover:!bg-gray-600 !text-white py-2 px-4 rounded-lg">
              Back to Stores
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!seller) {
    return null;
  }

  return (
    <div className="min-h-screen !bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <button
          onClick={onBack}
          className="mb-6 flex items-center gap-2 !text-blue-600 hover:!text-blue-700 font-semibold transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Stores
        </button>

        {/* Store Header */}
        <div className="!bg-white shadow-lg rounded-xl border border-gray-200 p-8 mb-8">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-4xl font-bold !text-gray-900 mb-2">{seller.storeName}</h1>
              <div className="flex flex-wrap items-center gap-4 !text-gray-600">
                {seller.phone && (
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span className="font-medium">{seller.phone}</span>
                  </div>
                )}
                <span className="!bg-blue-100 !text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                  {seller.products?.length || 0} Product{seller.products?.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
            <div className="!bg-blue-100 p-4 rounded-lg">
              <svg className="w-10 h-10 !text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>

          {/* Addresses */}
          {seller.addresses && seller.addresses.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-sm font-semibold !text-gray-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Store Locations
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {seller.addresses.map((addr, idx) => (
                  <div key={idx} className="!bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <p className="!text-gray-700 font-medium">{addr.street}</p>
                    <p className="!text-gray-600 text-sm mt-1">
                      {addr.city}
                      {addr.region && `, ${addr.region}`}
                      {addr.postalCode && ` ${addr.postalCode}`}
                    </p>
                    <p className="!text-gray-600 text-sm">{addr.country}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Products Section */}
        <div className="mb-6">
          <h2 className="text-3xl font-bold !text-gray-900 mb-2">Our Products</h2>
          <p className="!text-gray-600">
            {seller.products && seller.products.length > 0 
              ? `Browse our collection of ${seller.products.length} product${seller.products.length !== 1 ? 's' : ''}`
              : 'No products available at the moment'
            }
          </p>
        </div>

        {seller.products && seller.products.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {seller.products.map((product) => (
              <div key={product.id} className="!bg-white shadow-lg rounded-xl border border-gray-200 overflow-hidden hover:shadow-2xl hover:!border-blue-300 transition-all">
                {/* Product Image Placeholder */}
                <div className="!bg-gradient-to-br !from-blue-50 !to-indigo-100 h-56 flex items-center justify-center relative">
                  <svg className="w-24 h-24 !text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  
                  {/* Price Badge on Image */}
                  <div className="absolute top-4 right-4 !bg-green-500 !text-white text-xl font-bold px-4 py-2 rounded-lg shadow-lg">
                    ${product.basePrice.toFixed(2)}
                  </div>
                </div>

                {/* Product Details */}
                <div className="p-6">
                  <h3 className="text-2xl font-bold !text-gray-900 mb-3 line-clamp-2 min-h-[3.5rem]">
                    {product.name}
                  </h3>

                  {product.description && (
                    <p className="!text-gray-600 text-sm mb-4 line-clamp-3 min-h-[3.75rem]">
                      {product.description}
                    </p>
                  )}

                  {/* Category Badges */}
                  {product.subCategory && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className="inline-flex items-center gap-1.5 !bg-blue-100 !text-blue-800 text-xs font-semibold px-3 py-1.5 rounded-full">
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                        </svg>
                        {product.subCategory.category.name}
                      </span>
                      <span className="inline-flex items-center gap-1.5 !bg-purple-100 !text-purple-800 text-xs font-semibold px-3 py-1.5 rounded-full">
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm3.293 1.293a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L7.586 10 5.293 7.707a1 1 0 010-1.414zM11 12a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                        </svg>
                        {product.subCategory.name}
                      </span>
                    </div>
                  )}

                  {/* Product Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2 !text-gray-500 text-xs">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>{new Date(product.createdAt).toLocaleDateString()}</span>
                    </div>
                    <button className="!bg-blue-600 hover:!bg-blue-700 !text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      View
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="!bg-white shadow-lg rounded-xl border border-gray-200 p-16 text-center">
            <div className="!bg-gray-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 !text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold !text-gray-900 mb-2">No Products Available</h3>
            <p className="!text-gray-600 mb-6">This store hasn't added any products yet. Check back soon!</p>
            <button
              onClick={onBack}
              className="!bg-blue-600 hover:!bg-blue-700 !text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Browse Other Stores
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default StoreDetails;
import { useEffect, useState } from 'react';
import {
  getProductsForModeration,
  approveProduct,
  suspendProduct,
  deleteProducts,
  getProductDetails
} from '../../../services/api';

export default function ProductModeration() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, active, inactive
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [suspendReason, setSuspendReason] = useState('');

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const isActive = filter === 'active' ? true : filter === 'inactive' ? false : null;
      const data = await getProductsForModeration(isActive, searchTerm);
      setProducts(data);
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [filter]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchProducts();
  };

  const handleViewDetails = async (productId) => {
    try {
      const details = await getProductDetails(productId);
      setSelectedProduct(details);
      setShowDetailsModal(true);
    } catch (err) {
      console.error('Error fetching product details:', err);
      alert('Error loading product details');
    }
  };

  const handleApprove = async (productId) => {
    if (confirm('Are you sure you want to approve this product?')) {
      try {
        await approveProduct(productId);
        alert('Product approved successfully!');
        fetchProducts();
      } catch (err) {
        console.error('Error approving product:', err);
        alert('Error approving product');
      }
    }
  };

  const handleSuspend = async (productId) => {
    const reason = prompt('Please enter the reason for suspension:');
    if (reason) {
      try {
        await suspendProduct(productId, reason);
        alert('Product suspended successfully!');
        fetchProducts();
      } catch (err) {
        console.error('Error suspending product:', err);
        alert('Error suspending product');
      }
    }
  };

  const handleDelete = async (productId) => {
    if (confirm('Are you sure you want to DELETE this product? This action cannot be undone!')) {
      try {
        await deleteProducts(productId);
        alert('Product deleted successfully!');
        fetchProducts();
      } catch (err) {
        console.error('Error deleting product:', err);
        alert('Error deleting product');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Product Moderation</h2>
            <p className="text-gray-600 text-sm mt-1">{products.length} products found</p>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-6 flex flex-col md:flex-row gap-4">
          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <input
              type="text"
              placeholder="🔍 Search products by name or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition"
            >
              Search
            </button>
          </form>

          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('active')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === 'active'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setFilter('inactive')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === 'inactive'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Inactive
            </button>
          </div>
        </div>
      </div>

      {/* Products List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {products.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-500 text-lg">No products found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Seller</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{product.name}</div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {product.description || 'No description'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{product.sellerStoreName}</div>
                      <div className="text-sm text-gray-500">{product.sellerName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{product.category}</div>
                      <div className="text-sm text-gray-500">{product.subCategory}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${product.basePrice.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        product.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {product.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(product.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleViewDetails(product.id)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          View
                        </button>
                        {product.isActive ? (
                          <button
                            onClick={() => handleSuspend(product.id)}
                            className="text-yellow-600 hover:text-yellow-900"
                          >
                            Suspend
                          </button>
                        ) : (
                          <button
                            onClick={() => handleApprove(product.id)}
                            className="text-green-600 hover:text-green-900"
                          >
                            Approve
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Product Details Modal */}
      {showDetailsModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-start">
                <h3 className="text-2xl font-bold text-gray-800">{selectedProduct.name}</h3>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <h4 className="font-semibold text-gray-700">Description</h4>
                <p className="text-gray-600">{selectedProduct.description || 'No description provided'}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-gray-700">Seller</h4>
                  <p className="text-gray-600">{selectedProduct.sellerStoreName}</p>
                  <p className="text-gray-500 text-sm">{selectedProduct.sellerName}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-700">Category</h4>
                  <p className="text-gray-600">{selectedProduct.category} / {selectedProduct.subCategory}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-gray-700">Base Price</h4>
                  <p className="text-gray-600 text-2xl font-bold">${selectedProduct.basePrice.toFixed(2)}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-700">Status</h4>
                  <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    selectedProduct.isActive
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {selectedProduct.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              {selectedProduct.variants && selectedProduct.variants.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">Variants</h4>
                  <div className="space-y-2">
                    {selectedProduct.variants.map((variant) => (
                      <div key={variant.id} className="bg-gray-50 p-3 rounded">
                        <div className="flex justify-between">
                          <span className="font-medium">SKU: {variant.sku}</span>
                          <span className="font-bold">${variant.price.toFixed(2)}</span>
                        </div>
                        <div className="text-sm text-gray-500">Stock: {variant.stock}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="text-sm text-gray-500">
                <p>Created: {new Date(selectedProduct.createdAt).toLocaleString()}</p>
                <p>Updated: {new Date(selectedProduct.updatedAt).toLocaleString()}</p>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              {selectedProduct.isActive ? (
                <button
                  onClick={() => {
                    handleSuspend(selectedProduct.id);
                    setShowDetailsModal(false);
                  }}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-2 rounded-lg font-medium transition"
                >
                  Suspend Product
                </button>
              ) : (
                <button
                  onClick={() => {
                    handleApprove(selectedProduct.id);
                    setShowDetailsModal(false);
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition"
                >
                  Approve Product
                </button>
              )}
              <button
                onClick={() => {
                  if (handleDelete(selectedProduct.id)) {
                    setShowDetailsModal(false);
                  }
                }}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium transition"
              >
                Delete Product
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
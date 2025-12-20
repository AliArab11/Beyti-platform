/**
 * Product Moderation Page
 *
 * Manages product listings and moderation
 * Features: View products, view details, suspend/approve products, search and filter
 */

import React, { useEffect, useState } from 'react';
import {
  X,
  Eye,
  CheckCircle,
  ProhibitInset,
  Package
} from '@phosphor-icons/react';
import {
  getProductsForModeration,
  getModerationStatistics,
  getProductDetails,
  approveProduct,
  suspendProduct,
  deleteProducts,
  getUserProfile,
  updateUserProfile
} from '../../../services/api';
import { logAdminActivity } from '../../../utils/adminActivityLogger';

// Import design system components
import AnalyticsCard from '../../../components/AnalyticsCard';
import CRUDButton from '../../../components/CRUDButton';
import StatusChip from '../../../components/StatusChip';
import { Table, TableHeader, TableBody, TableRow } from '../../../components/Table';
import PageHeader from '../../../components/PageHeader';
import AdminSidebar from './AdminSidebar';
import Snackbar from '../../../components/Snackbar';
import ConfirmModal from '../../../components/ConfirmModal';

const ProductModeration = ({ onNavigate, adminUserProfileId }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, active, inactive
  const [notificationCount] = useState(0);

  // User profile state
  const [userProfile, setUserProfile] = useState(null);
  const [displayName, setDisplayName] = useState("Admin User");

  // Details modal state
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Snackbar state
  const [snackbar, setSnackbar] = useState({ open: false, message: '', type: 'success' });

  // ConfirmModal state
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    variant: 'danger'
  });

  // Input modal state for prompts (suspend reason)
  const [inputModal, setInputModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    placeholder: '',
    onConfirm: (value) => {},
    inputValue: ''
  });

  // Statistics
  const [stats, setStats] = useState({
    totalProducts: 0,
    activeProducts: 0,
    inactiveProducts: 0,
    recentProducts: 0
  });

  const fetchStatistics = async () => {
    try {
      const data = await getModerationStatistics();
      setStats(data);
    } catch (err) {
      console.error('Error fetching statistics:', err);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const isActive = filterStatus === 'active' ? true : filterStatus === 'inactive' ? false : null;
      const data = await getProductsForModeration(isActive, searchTerm);
      setProducts(data);
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch user profile details
  const fetchUserProfile = async () => {
    if (!adminUserProfileId) {
      console.warn('No adminUserProfileId provided, skipping profile fetch');
      return;
    }

    try {
      const profile = await getUserProfile(adminUserProfileId);
      if (profile) {
        const normalizedProfile = {
          userProfileId: profile.UserProfileId,
          displayName: profile.DisplayName,
          roleType: profile.RoleType,
          status: profile.Status,
          phone: profile.Phone,
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

  // Handle profile update
  const handleProfileUpdate = async (updates) => {
    try {
      await updateUserProfile(adminUserProfileId, 'Admin', updates);
      await fetchUserProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchStatistics();
    fetchProducts();
    fetchUserProfile();
  }, [filterStatus, adminUserProfileId]);

  // Auto-close snackbar after 5 seconds
  useEffect(() => {
    if (snackbar.open) {
      const timer = setTimeout(() => {
        setSnackbar({ ...snackbar, open: false });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [snackbar.open]);


  // View product details
  const handleViewDetails = async (productId) => {
    try {
      const details = await getProductDetails(productId);
      setSelectedProduct(details);
      setShowDetailsModal(true);
    } catch (err) {
      console.error('Error fetching product details:', err);
      setSnackbar({
        open: true,
        message: 'Error loading product details. Please try again.',
        type: 'error'
      });
    }
  };

  // Approve product
  const handleApprove = (productId) => {
    const product = products.find(p => p.id === productId);
    setConfirmModal({
      isOpen: true,
      title: 'Approve Product',
      message: `Are you sure you want to approve "${product?.name || 'this product'}"?`,
      variant: 'success',
      onConfirm: async () => {
        try {
          await approveProduct(productId, adminUserProfileId);

          // Log the admin activity
          logAdminActivity(
            'approval',
            'Approved Product',
            product?.name || `Product #${productId}`
          );

          setConfirmModal({ ...confirmModal, isOpen: false });
          setSnackbar({
            open: true,
            message: 'Product approved successfully!',
            type: 'success'
          });
          fetchProducts();
          fetchStatistics();
          if (showDetailsModal) {
            setShowDetailsModal(false);
          }
        } catch (err) {
          console.error('Error approving product:', err);
          setConfirmModal({ ...confirmModal, isOpen: false });
          setSnackbar({
            open: true,
            message: 'Error approving product. Please try again.',
            type: 'error'
          });
        }
      }
    });
  };

  // Open suspend modal
  const handleOpenSuspendModal = (product) => {
    setInputModal({
      isOpen: true,
      title: `Suspend ${product.name}`,
      message: 'Enter the reason for suspending this product:',
      placeholder: 'Reason for suspension...',
      inputValue: '',
      onConfirm: (reason) => {
        if (reason.trim()) {
          setInputModal({ ...inputModal, isOpen: false });
          setConfirmModal({
            isOpen: true,
            title: 'Confirm Suspension',
            message: `Are you sure you want to suspend "${product.name}"? This will make it inactive.`,
            variant: 'danger',
            onConfirm: async () => {
              try {
                await suspendProduct(product.id, reason, adminUserProfileId);

                // Log the admin activity
                logAdminActivity(
                  'suspension',
                  'Suspended Product',
                  product?.name || `Product #${product.id}`
                );

                setConfirmModal({ ...confirmModal, isOpen: false });
                setSnackbar({
                  open: true,
                  message: 'Product suspended successfully!',
                  type: 'success'
                });
                fetchProducts();
                fetchStatistics();
                if (showDetailsModal) {
                  setShowDetailsModal(false);
                }
              } catch (err) {
                console.error('Error suspending product:', err);
                setConfirmModal({ ...confirmModal, isOpen: false });
                setSnackbar({
                  open: true,
                  message: 'Error suspending product. Please try again.',
                  type: 'error'
                });
              }
            }
          });
        }
      }
    });
  };

  // Delete product
  const handleDelete = (productId) => {
    const product = products.find(p => p.id === productId);
    setConfirmModal({
      isOpen: true,
      title: 'Delete Product',
      message: `Are you sure you want to DELETE "${product?.name || 'this product'}"? This action cannot be undone!`,
      variant: 'danger',
      onConfirm: async () => {
        try {
          await deleteProducts(productId);

          // Log the admin activity
          logAdminActivity(
            'moderation',
            'Deleted Product',
            product?.name || `Product #${productId}`
          );

          setConfirmModal({ ...confirmModal, isOpen: false });
          setSnackbar({
            open: true,
            message: 'Product deleted successfully!',
            type: 'success'
          });
          fetchProducts();
          fetchStatistics();
          if (showDetailsModal) {
            setShowDetailsModal(false);
          }
        } catch (err) {
          console.error('Error deleting product:', err);
          setConfirmModal({ ...confirmModal, isOpen: false });
          setSnackbar({
            open: true,
            message: 'Error deleting product. Please try again.',
            type: 'error'
          });
        }
      }
    });
  };

  // Filter products based on search
  const getFilteredProducts = () => {
    if (!searchTerm) return products;

    return products.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      product.sellerStoreName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const filteredProducts = getFilteredProducts();

  if (loading && products.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sage-500"></div>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <AnalyticsCard
                title="Total Products"
                metrics={[
                  {
                    value: loading ? '...' : stats.totalProducts.toString(),
                    label: 'All Products'
                  }
                ]}
              />
              <AnalyticsCard
                title="Active Products"
                metrics={[
                  {
                    value: loading ? '...' : stats.activeProducts.toString(),
                    label: 'Currently Active'
                  }
                ]}
              />
              <AnalyticsCard
                title="Inactive Products"
                metrics={[
                  {
                    value: loading ? '...' : stats.inactiveProducts.toString(),
                    label: 'Suspended/Inactive'
                  }
                ]}
              />
              <AnalyticsCard
                title="Recent Products"
                metrics={[
                  {
                    value: loading ? '...' : stats.recentProducts.toString(),
                    label: 'Last 7 Days'
                  }
                ]}
              />
            </div>

            {/* Products Table */}
            <div className="bg-grey-200 dark:bg-[#2A2A2A] rounded-lg shadow-soft-lift dark:shadow-none transition-colors">
              <div className="p-6 border-b border-grey-stroke dark:border-charcoal-500">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <h2 className="text-card-h2 text-charcoal-600 dark:text-white">Products Management</h2>
                  <div className="flex gap-2">
                    <CRUDButton
                      variant={filterStatus === 'all' ? 'success' : 'neutral'}
                      onClick={() => setFilterStatus('all')}
                    >
                      All
                    </CRUDButton>
                    <CRUDButton
                      variant={filterStatus === 'active' ? 'success' : 'neutral'}
                      onClick={() => setFilterStatus('active')}
                    >
                      Active
                    </CRUDButton>
                    <CRUDButton
                      variant={filterStatus === 'inactive' ? 'error' : 'neutral'}
                      onClick={() => setFilterStatus('inactive')}
                    >
                      Inactive
                    </CRUDButton>
                  </div>
                </div>
              </div>

              <div className="p-6">
                {/* Products List */}
                {filteredProducts.length === 0 ? (
                  <div className="text-center py-12">
                    <Package size={64} className="text-charcoal-300 mx-auto mb-4" weight="fill" />
                    <p className="text-charcoal-400 text-lg">No products found</p>
                    <p className="text-charcoal-400 text-sm mt-2">Try adjusting your search or filters</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader
                      columns={[
                        'Product ID',
                        'Product Name',
                        'Seller',
                        'Category',
                        'Price',
                        'Status',
                        'Created',
                        'Actions'
                      ]}
                    />
                    <TableBody>
                      {filteredProducts.map((product) => (
                        <TableRow
                          key={product.id}
                          data={[
                            product.id,
                            <div>
                              <div className="font-semibold text-charcoal-600">{product.name}</div>
                              <div className="text-label-medium text-charcoal-400 truncate max-w-xs">
                                {product.description || 'No description'}
                              </div>
                            </div>,
                            <div>
                              <div className="text-charcoal-600">{product.sellerStoreName}</div>
                              <div className="text-label-medium text-charcoal-400">{product.sellerName}</div>
                            </div>,
                            <div>
                              <div className="text-charcoal-600">{product.category}</div>
                              <div className="text-label-medium text-charcoal-400">{product.subCategory}</div>
                            </div>,
                            <span className="font-semibold text-charcoal-600">${product.basePrice != null ? product.basePrice.toFixed(2) : '0.00'}</span>,
                            <StatusChip variant={product.isActive ? 'success' : 'error'}>
                              {product.isActive ? 'Active' : 'Inactive'}
                            </StatusChip>,
                            new Date(product.createdAt).toLocaleDateString()
                          ]}
                          actions={
                            <>
                              <CRUDButton
                                variant="success"
                                onClick={() => handleViewDetails(product.id)}
                              >
                                <Eye size={16} className="inline mr-1" />
                                View
                              </CRUDButton>
                              {product.isActive ? (
                                <CRUDButton
                                  variant="error"
                                  onClick={() => handleOpenSuspendModal(product)}
                                >
                                  <ProhibitInset size={16} className="inline mr-1" />
                                  Suspend
                                </CRUDButton>
                              ) : (
                                <CRUDButton
                                  variant="success"
                                  onClick={() => handleApprove(product.id)}
                                >
                                  <CheckCircle size={16} className="inline mr-1" />
                                  Approve
                                </CRUDButton>
                              )}
                            </>
                          }
                        />
                      ))}
                    </TableBody>
                  </Table>
                )}
            </div>
          </div>
        </div>

      {/* Product Details Modal */}
      {showDetailsModal && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-grey-200 dark:bg-[#2A2A2A] rounded-lg shadow-soft-lift max-w-3xl w-full max-h-[90vh] overflow-y-auto transition-colors">
            {/* Modal Header */}
            <div className="p-6 border-b border-grey-stroke dark:border-charcoal-500">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-display-h2 text-charcoal-600 dark:text-white">{selectedProduct.name}</h3>
                  <p className="text-body-regular text-charcoal-400 dark:text-gray-400 mt-1">
                    Product ID: {selectedProduct.id}
                  </p>
                  <div className="mt-3">
                    <StatusChip variant={selectedProduct.isActive ? 'success' : 'error'}>
                      {selectedProduct.isActive ? 'Active' : 'Inactive'}
                    </StatusChip>
                  </div>
                </div>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-charcoal-400 hover:text-charcoal-600 transition-colors p-2"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <h4 className="text-card-h2 text-charcoal-600 dark:text-white mb-4">Product Details</h4>

              <div className="space-y-4">
                {/* Description */}
                <div className="bg-cream-50 rounded-lg p-4">
                  <h5 className="text-body-medium text-charcoal-600 dark:text-white font-semibold mb-2">
                    Description
                  </h5>
                  <p className="text-body-regular text-charcoal-600 dark:text-white">
                    {selectedProduct.description || 'No description provided'}
                  </p>
                </div>

                {/* Seller and Category Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-cream-50 rounded-lg p-4">
                    <h5 className="text-body-medium text-charcoal-600 font-semibold mb-3">
                      Seller Information
                    </h5>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-body-regular text-charcoal-400">Store Name:</span>
                        <span className="text-body-regular text-charcoal-600 font-semibold">
                          {selectedProduct.sellerStoreName}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-body-regular text-charcoal-400">Seller:</span>
                        <span className="text-body-regular text-charcoal-600">
                          {selectedProduct.sellerName}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-cream-50 rounded-lg p-4">
                    <h5 className="text-body-medium text-charcoal-600 font-semibold mb-3">
                      Category Information
                    </h5>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-body-regular text-charcoal-400">Category:</span>
                        <span className="text-body-regular text-charcoal-600 font-semibold">
                          {selectedProduct.category}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-body-regular text-charcoal-400">SubCategory:</span>
                        <span className="text-body-regular text-charcoal-600">
                          {selectedProduct.subCategory}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pricing */}
                <div className="bg-cream-50 rounded-lg p-4">
                  <h5 className="text-body-medium text-charcoal-600 font-semibold mb-3">
                    Pricing
                  </h5>
                  <div className="flex justify-between items-center">
                    <span className="text-body-regular text-charcoal-400">Base Price:</span>
                    <span className="text-metric-h2 text-sage-700 font-bold">
                      ${selectedProduct.basePrice != null ? selectedProduct.basePrice.toFixed(2) : '0.00'}
                    </span>
                  </div>
                </div>

                {/* Variants */}
                {selectedProduct.variants && selectedProduct.variants.length > 0 && (
                  <div className="bg-cream-50 rounded-lg p-4">
                    <h5 className="text-body-medium text-charcoal-600 font-semibold mb-3">
                      Product Variants ({selectedProduct.variants.length})
                    </h5>
                    <div className="space-y-2">
                      {selectedProduct.variants.map((variant) => (
                        <div key={variant.id} className="bg-white p-3 rounded border border-grey-stroke">
                          <div className="flex justify-between items-center">
                            <div>
                              <span className="text-body-regular text-charcoal-600 font-semibold">
                                SKU: {variant.sku || 'N/A'}
                              </span>
                              <div className="text-label-medium text-charcoal-400">
                                Stock: {variant.stockQty || 0} units
                              </div>
                            </div>
                            <span className="text-body-medium text-charcoal-600 font-bold">
                              ${variant.price != null ? variant.price.toFixed(2) : '0.00'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Dates */}
                <div className="bg-cream-50 rounded-lg p-4">
                  <h5 className="text-body-medium text-charcoal-600 font-semibold mb-3">
                    Timeline
                  </h5>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-body-regular text-charcoal-400">Created At:</span>
                      <span className="text-body-regular text-charcoal-600">
                        {new Date(selectedProduct.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-body-regular text-charcoal-400">Last Updated:</span>
                      <span className="text-body-regular text-charcoal-600">
                        {new Date(selectedProduct.updatedAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-grey-stroke flex justify-end gap-3">
              <CRUDButton variant="error" onClick={() => setShowDetailsModal(false)}>
                Close
              </CRUDButton>
              {selectedProduct.isActive ? (
                <CRUDButton
                  variant="error"
                  onClick={() => {
                    setShowDetailsModal(false);
                    handleOpenSuspendModal(selectedProduct);
                  }}
                >
                  <ProhibitInset size={16} className="inline mr-1" />
                  Suspend Product
                </CRUDButton>
              ) : (
                <CRUDButton
                  variant="success"
                  onClick={() => handleApprove(selectedProduct.id)}
                >
                  <CheckCircle size={16} className="inline mr-1" />
                  Approve Product
                </CRUDButton>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        message={snackbar.message}
        type={snackbar.type}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      />

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        variant={confirmModal.variant}
        onConfirm={confirmModal.onConfirm}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
      />

      {/* Input Modal for text inputs (suspend reason) */}
      {inputModal.isOpen && (
        <div className="fixed inset-0 bg-charcoal-900/50 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
          <div className="bg-cream-50 rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-6 border-b border-grey-stroke">
              <h3 className="text-card-h2 text-charcoal-600 font-bold">{inputModal.title}</h3>
            </div>
            <div className="p-6">
              <p className="text-body-regular text-charcoal-600 mb-4">{inputModal.message}</p>
              <textarea
                className="w-full border border-grey-stroke rounded-lg px-4 py-2 focus:ring-2 focus:ring-sage-500 focus:border-sage-500 text-body-regular bg-white resize-none"
                rows="4"
                placeholder={inputModal.placeholder}
                value={inputModal.inputValue}
                onChange={(e) => setInputModal({ ...inputModal, inputValue: e.target.value })}
              />
            </div>
            <div className="p-6 border-t border-grey-stroke flex gap-3 justify-end">
              <button
                onClick={() => setInputModal({ ...inputModal, isOpen: false, inputValue: '' })}
                className="px-6 py-2.5 bg-grey-200 text-charcoal-600 text-button font-semibold rounded-xl hover:bg-grey-300 border border-grey-stroke"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (inputModal.inputValue.trim()) {
                    inputModal.onConfirm(inputModal.inputValue);
                  }
                }}
                className="px-6 py-2.5 bg-sage-500 hover:bg-sage-600 text-white text-button font-semibold rounded-xl shadow-soft-lift"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProductModeration;

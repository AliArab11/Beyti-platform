/**
 * Category Moderation Page
 *
 * Manages product categories and subcategories
 * Features: View categories, add/edit categories, toggle status, manage subcategories
 */

import React, { useEffect, useState } from 'react';
import {
  Plus,
  PencilSimple,
  CheckCircle,
  ProhibitInset,
  CaretRight,
  Tag,
  X
} from '@phosphor-icons/react';
import {
  getCategories,
  createCategory,
  updateCategory,
  createSubCategory,
  updateSubCategory,
  getServiceCategoryList,
  createServiceCategory,
  updateServiceCategory,
  getServiceCatalogs,
  createServiceCatalog,
  updateServiceCatalog,
  getUserProfile,
  updateUserProfile
} from '../../../services/api';
import { logAdminActivity } from '../../../utils/adminActivityLogger';
import Snackbar from '../../../components/Snackbar';
import ConfirmModal from '../../../components/ConfirmModal';
// Import design system components
import AnalyticsCard from '../../../components/AnalyticsCard';
import CRUDButton from '../../../components/CRUDButton';
import StatusChip from '../../../components/StatusChip';
import { Table, TableHeader, TableBody, TableRow } from '../../../components/Table';
import PageHeader from '../../../components/PageHeader';
import AdminSidebar from './AdminSidebar';

const CategoryModeration = ({ onNavigate, adminUserProfileId = 4037 }) => {

  // View mode: 'products' or 'services'
  const [viewMode, setViewMode] = useState('products');

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState(new Set());
  const [notificationCount] = useState(0);

  // User profile state
  const [userProfile, setUserProfile] = useState(null);
  const [displayName, setDisplayName] = useState("Admin User");

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
  // Modal states
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showSubCategoryModal, setShowSubCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingSubCategory, setEditingSubCategory] = useState(null);
  const [selectedCategoryForSubCategory, setSelectedCategoryForSubCategory] = useState(null);

  // Form data
  const [categoryFormData, setCategoryFormData] = useState({ Name: '', Description: '', IsActive: true });
  const [subCategoryFormData, setSubCategoryFormData] = useState({ Name: '', CategoryId: null, IsActive: true });

  // Statistics
  const [stats, setStats] = useState({
    totalCategories: 0,
    activeCategories: 0,
    totalSubCategories: 0
  });

  const fetchCategories = async () => {
    try {
      setLoading(true);
      let data;

      if (viewMode === 'products') {
        // Fetch product categories and subcategories
        data = await getCategories();
      } else {
        // Fetch service categories and catalogs
        const serviceCategories = await getServiceCategoryList();
        const serviceCatalogs = await getServiceCatalogs();

        console.log('Service Categories:', serviceCategories);
        console.log('Service Catalogs:', serviceCatalogs);

        // Transform service data to match the product category structure
        data = (serviceCategories || []).map(category => ({
          id: category.Id || category.id,
          name: category.Name || category.name || '',
          description: category.Description || category.description || '',
          isActive: category.IsActive !== undefined ? category.IsActive : (category.isActive !== undefined ? category.isActive : true),
          createdAt: category.CreatedAt || category.createdAt,
          subCategories: (serviceCatalogs || [])
            .filter(catalog => (catalog.ServiceCategoryId || catalog.serviceCategoryId) === (category.Id || category.id))
            .map(catalog => ({
              id: catalog.Id || catalog.id,
              name: catalog.Name || catalog.name || '',
              description: catalog.Description || catalog.description || '',
              isActive: catalog.IsActive !== undefined ? catalog.IsActive : (catalog.isActive !== undefined ? catalog.isActive : true),
              minPrice: catalog.MinPrice || catalog.minPrice,
              maxPrice: catalog.MaxPrice || catalog.maxPrice,
              estimatedDuration: catalog.EstimatedDuration || catalog.estimatedDuration
            }))
        }));

        console.log('Transformed data:', data);
      }

      setCategories(data);

      // Calculate statistics
      const totalCats = data.length;
      const activeCats = data.filter(c => c.isActive).length;
      const totalSubCats = data.reduce((sum, cat) => sum + (cat.subCategories?.length || 0), 0);

      setStats({
        totalCategories: totalCats,
        activeCategories: activeCats,
        totalSubCategories: totalSubCats
      });
    } catch (err) {
      console.error('Error fetching categories:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch user profile details
  const fetchUserProfile = async () => {
    // Skip fetching user profile if adminUserProfileId is not valid
    if (!adminUserProfileId || adminUserProfileId === null) {
      console.log('No valid adminUserProfileId provided, skipping user profile fetch');
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
    fetchCategories();
  }, [viewMode]);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  // Auto-close snackbar after 5 seconds
  useEffect(() => {
    if (snackbar.open) {
      const timer = setTimeout(() => {
        setSnackbar({ ...snackbar, open: false });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [snackbar.open]);

  // Category handlers
  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    try {
      if (viewMode === 'products') {
        if (editingCategory) {
          await updateCategory(editingCategory.id, categoryFormData);

          // Log the admin activity
          logAdminActivity(
            'moderation',
            'Updated Category',
            categoryFormData.Name
          );

          setSnackbar({
            open: true,
            message: 'Category updated successfully!',
            type: 'success'
          });
        } else {
          await createCategory(categoryFormData);

          // Log the admin activity
          logAdminActivity(
            'user_created',
            'Created New Category',
            categoryFormData.Name
          );

          setSnackbar({
            open: true,
            message: 'Category created successfully!',
            type: 'success'
          });
        }
      } else {
        // Service category operations
        if (editingCategory) {
          await updateServiceCategory(editingCategory.id, categoryFormData);

          // Log the admin activity
          logAdminActivity(
            'moderation',
            'Updated Service Category',
            categoryFormData.Name
          );

          setSnackbar({
            open: true,
            message: 'Service Category updated successfully!',
            type: 'success'
          });
        } else {
          await createServiceCategory(categoryFormData);

          // Log the admin activity
          logAdminActivity(
            'user_created',
            'Created New Service Category',
            categoryFormData.Name
          );

          setSnackbar({
            open: true,
            message: 'Service Category created successfully!',
            type: 'success'
          });
        }
      }
      setCategoryFormData({ Name: '', Description: '', IsActive: true });
      setEditingCategory(null);
      setShowCategoryModal(false);
      fetchCategories();
    } catch (err) {
      console.error('Error saving category:', err);
      setSnackbar({
        open: true,
        message: 'Error saving category. Please try again.',
        type: 'error'
      });
    }
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setCategoryFormData({
      Name: category.name,
      Description: category.description || '',
      IsActive: category.isActive
    });
    setShowCategoryModal(true);
  };

  const handleToggleCategoryStatus = async (category) => {
    const newStatus = !category.isActive;
    setConfirmModal({
      isOpen: true,
      title: `${newStatus ? 'Activate' : 'Deactivate'} Category`,
      message: `Are you sure you want to ${newStatus ? 'activate' : 'deactivate'} "${category.name}"?`,
      variant: newStatus ? 'success' : 'warning',
      onConfirm: async () => {
        try {
          const updateData = {
            Name: category.name,
            Description: category.description || '',
            IsActive: newStatus
          };

          if (viewMode === 'products') {
            await updateCategory(category.id, updateData);
          } else {
            await updateServiceCategory(category.id, updateData);
          }

          // Log the admin activity
          logAdminActivity(
            newStatus ? 'approval' : 'suspension',
            `${newStatus ? 'Activated' : 'Deactivated'} ${viewMode === 'products' ? 'Category' : 'Service Category'}`,
            category.name
          );

          setConfirmModal({ ...confirmModal, isOpen: false });
          setSnackbar({
            open: true,
            message: `Category ${newStatus ? 'activated' : 'deactivated'} successfully!`,
            type: 'success'
          });
          fetchCategories();
        } catch (err) {
          console.error('Error toggling category status:', err);
          setConfirmModal({ ...confirmModal, isOpen: false });
          setSnackbar({
            open: true,
            message: 'Error toggling category status. Please try again.',
            type: 'error'
          });
        }
      }
    });
  };

  const handleCancelCategoryForm = () => {
    setEditingCategory(null);
    setCategoryFormData({ Name: '', Description: '', IsActive: true });
    setShowCategoryModal(false);
  };

  // SubCategory/Catalog handlers
  const handleSubCategorySubmit = async (e) => {
    e.preventDefault();
    try {
      if (viewMode === 'products') {
        // Product subcategory operations
        if (editingSubCategory) {
          await updateSubCategory(editingSubCategory.id, {
            Name: subCategoryFormData.Name,
            CategoryId: subCategoryFormData.CategoryId,
            IsActive: subCategoryFormData.IsActive
          });

          // Log the admin activity
          logAdminActivity(
            'moderation',
            'Updated SubCategory',
            `${subCategoryFormData.Name} - ${selectedCategoryForSubCategory?.name || ''}`
          );

          setSnackbar({
            open: true,
            message: 'SubCategory updated successfully!',
            type: 'success'
          });
        } else {
          await createSubCategory(subCategoryFormData);

          // Log the admin activity
          logAdminActivity(
            'user_created',
            'Created New SubCategory',
            `${subCategoryFormData.Name} - ${selectedCategoryForSubCategory?.name || ''}`
          );

          setSnackbar({
            open: true,
            message: 'SubCategory created successfully!',
            type: 'success'
          });
        }
      } else {
        // Service catalog operations
        const catalogData = {
          Name: subCategoryFormData.Name,
          Description: subCategoryFormData.Description || '',
          ServiceCategoryId: parseInt(subCategoryFormData.CategoryId),
          IsActive: subCategoryFormData.IsActive,
          MinPrice: subCategoryFormData.MinPrice ? parseFloat(subCategoryFormData.MinPrice) : null,
          MaxPrice: subCategoryFormData.MaxPrice ? parseFloat(subCategoryFormData.MaxPrice) : null,
          EstimatedDuration: subCategoryFormData.EstimatedDuration ? parseInt(subCategoryFormData.EstimatedDuration) : null
        };

        if (editingSubCategory) {
          await updateServiceCatalog(editingSubCategory.id, catalogData);

          // Log the admin activity
          logAdminActivity(
            'moderation',
            'Updated Service Catalog',
            `${subCategoryFormData.Name} - ${selectedCategoryForSubCategory?.name || ''}`
          );

          setSnackbar({
            open: true,
            message: 'Service Catalog updated successfully!',
            type: 'success'
          });
        } else {
          await createServiceCatalog(catalogData);

          // Log the admin activity
          logAdminActivity(
            'user_created',
            'Created New Service Catalog',
            `${subCategoryFormData.Name} - ${selectedCategoryForSubCategory?.name || ''}`
          );

          setSnackbar({
            open: true,
            message: 'Service Catalog created successfully!',
            type: 'success'
          });
        }
      }
      setSubCategoryFormData({ Name: '', CategoryId: null, IsActive: true });
      setEditingSubCategory(null);
      setSelectedCategoryForSubCategory(null);
      setShowSubCategoryModal(false);
      fetchCategories();
    } catch (err) {
      console.error('Error saving subcategory/catalog:', err);
      setSnackbar({
        open: true,
        message: 'Error saving subcategory/catalog. Please try again.',
        type: 'error'
      });
    }
  };
  const handleAddSubCategory = (category) => {
    setSelectedCategoryForSubCategory(category);
    setSubCategoryFormData({ Name: '', CategoryId: category.id, IsActive: true });
    setShowSubCategoryModal(true);
  };

  const handleEditSubCategory = (category, subCategory) => {
    setEditingSubCategory(subCategory);
    setSelectedCategoryForSubCategory(category);
    setSubCategoryFormData({
      Name: subCategory.name,
      Description: subCategory.description || '',
      CategoryId: category.id,
      IsActive: subCategory.isActive !== undefined ? subCategory.isActive : true,
      MinPrice: subCategory.minPrice || '',
      MaxPrice: subCategory.maxPrice || '',
      EstimatedDuration: subCategory.estimatedDuration || ''
    });
    setShowSubCategoryModal(true);
  };

  const handleToggleSubCategoryStatus = async (category, subCategory) => {
    const currentStatus = subCategory.isActive !== undefined ? subCategory.isActive : true;
    const newStatus = !currentStatus;
    
    setConfirmModal({
      isOpen: true,
      title: `${newStatus ? 'Activate' : 'Deactivate'} ${viewMode === 'products' ? 'SubCategory' : 'Service Catalog'}`,
      message: `Are you sure you want to ${newStatus ? 'activate' : 'deactivate'} "${subCategory.name}"?`,
      variant: newStatus ? 'success' : 'warning',
      onConfirm: async () => {
        try {
          if (viewMode === 'products') {
            await updateSubCategory(subCategory.id, {
              Name: subCategory.name,
              CategoryId: category.id,
              IsActive: newStatus
            });

            // Log the admin activity
            logAdminActivity(
              newStatus ? 'approval' : 'suspension',
              `${newStatus ? 'Activated' : 'Deactivated'} SubCategory`,
              `${subCategory.name} - ${category.name}`
            );
          } else {
            await updateServiceCatalog(subCategory.id, {
              Name: subCategory.name,
              Description: subCategory.description || '',
              ServiceCategoryId: parseInt(category.id),
              IsActive: newStatus,
              MinPrice: subCategory.minPrice ? parseFloat(subCategory.minPrice) : null,
              MaxPrice: subCategory.maxPrice ? parseFloat(subCategory.maxPrice) : null,
              EstimatedDuration: subCategory.estimatedDuration ? parseInt(subCategory.estimatedDuration) : null
            });

            // Log the admin activity
            logAdminActivity(
              newStatus ? 'approval' : 'suspension',
              `${newStatus ? 'Activated' : 'Deactivated'} Service Catalog`,
              `${subCategory.name} - ${category.name}`
            );
          }

          setConfirmModal({ ...confirmModal, isOpen: false });
          setSnackbar({
            open: true,
            message: `${viewMode === 'products' ? 'SubCategory' : 'Service Catalog'} ${newStatus ? 'activated' : 'deactivated'} successfully!`,
            type: 'success'
          });
          fetchCategories();
        } catch (err) {
          console.error('Error toggling subcategory/catalog status:', err);
          setConfirmModal({ ...confirmModal, isOpen: false });
          setSnackbar({
            open: true,
            message: 'Error toggling status. Please try again.',
            type: 'error'
          });
        }
      }
    });
  };

  const handleCancelSubCategoryForm = () => {
    setEditingSubCategory(null);
    setSelectedCategoryForSubCategory(null);
    setSubCategoryFormData({ Name: '', CategoryId: null });
    setShowSubCategoryModal(false);
  };

  // Toggle category expansion
  const toggleCategoryExpansion = (categoryId) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  // Filter categories based on search
  const getFilteredCategories = () => {
    if (!searchTerm) return categories;

    return categories.filter(category => {
      const categoryMatch = category.name.toLowerCase().includes(searchTerm.toLowerCase());
      const subCategoryMatch = category.subCategories?.some(sub =>
        sub.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      return categoryMatch || subCategoryMatch;
    });
  };

  const filteredCategories = getFilteredCategories();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sage-500"></div>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* View Mode Toggle */}
        <div className="bg-white rounded-lg shadow-soft-lift p-6">
          <div className="flex items-center gap-4">
            <span className="text-body-regular text-charcoal-600 font-semibold">View Mode:</span>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('products')}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  viewMode === 'products'
                    ? 'bg-sage-500 text-white'
                    : 'bg-cream-100 text-charcoal-600 hover:bg-cream-200'
                }`}
              >
                Products (Category/SubCategory)
              </button>
              <button
                onClick={() => setViewMode('services')}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  viewMode === 'services'
                    ? 'bg-sage-500 text-white'
                    : 'bg-cream-100 text-charcoal-600 hover:bg-cream-200'
                }`}
              >
                Services (ServiceCategory/ServiceCatalog)
              </button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <AnalyticsCard
                title={`Total ${viewMode === 'products' ? 'Categories' : 'Service Categories'}`}
                metrics={[
                  {
                    value: loading ? '...' : stats.totalCategories.toString(),
                    label: `All ${viewMode === 'products' ? 'Categories' : 'Service Categories'}`
                  }
                ]}
              />
              <AnalyticsCard
                title={`Active ${viewMode === 'products' ? 'Categories' : 'Service Categories'}`}
                metrics={[
                  {
                    value: loading ? '...' : stats.activeCategories.toString(),
                    label: 'Currently Active'
                  }
                ]}
              />
              <AnalyticsCard
                title={`Total ${viewMode === 'products' ? 'SubCategories' : 'Service Catalogs'}`}
                metrics={[
                  {
                    value: loading ? '...' : stats.totalSubCategories.toString(),
                    label: `All ${viewMode === 'products' ? 'SubCategories' : 'Service Catalogs'}`
                  }
                ]}
              />
            </div>

            {/* Categories Table */}
            <div className="bg-white rounded-lg shadow-soft-lift">
              <div className="p-6 border-b border-grey-stroke">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <h2 className="text-card-h2 text-charcoal-600">
                    {viewMode === 'products' ? 'Categories Management' : 'Service Categories Management'}
                  </h2>
                  <CRUDButton
                    variant="success"
                    onClick={() => setShowCategoryModal(true)}
                  >
                    <Plus size={16} className="inline mr-1" />
                    Add New {viewMode === 'products' ? 'Category' : 'Service Category'}
                  </CRUDButton>
                </div>
              </div>

              <div className="p-6">
                {filteredCategories.length === 0 ? (
                  <div className="text-center py-12">
                    <Tag size={64} className="text-charcoal-300 mx-auto mb-4" weight="fill" />
                    <p className="text-charcoal-400 text-lg">No categories found</p>
                    <p className="text-charcoal-400 text-sm mt-2">Try adjusting your search or create a new category</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader
                      columns={[
                        '',
                        `${viewMode === 'products' ? 'Category' : 'Service Category'} ID`,
                        `${viewMode === 'products' ? 'Category' : 'Service Category'} Name`,
                        viewMode === 'products' ? 'SubCategories' : 'Service Catalogs',
                        'Status',
                        'Actions'
                      ]}
                    />
                    <TableBody>
                      {filteredCategories.map((category) => (
                        <React.Fragment key={category.id}>
                          <TableRow
                            data={[
                              <button
                                onClick={() => toggleCategoryExpansion(category.id)}
                                className="p-1 hover:bg-cream-100 rounded transition-colors"
                              >
                                <CaretRight
                                  size={20}
                                  className={`text-charcoal-600 transition-transform ${
                                    expandedCategories.has(category.id) ? 'rotate-90' : ''
                                  }`}
                                />
                              </button>,
                              category.id,
                              <span className="font-semibold text-charcoal-600">{category.name}</span>,
                              <span className="text-charcoal-400">
                                {category.subCategories?.length || 0} {viewMode === 'products' ? 'subcategories' : 'service catalogs'}
                              </span>,
                              <StatusChip variant={category.isActive ? 'success' : 'error'}>
                                {category.isActive ? 'Active' : 'Inactive'}
                              </StatusChip>
                            ]}
                            actions={
                              <React.Fragment>
                                <CRUDButton
                                  key={`add-sub-${category.id}`}
                                  variant="success"
                                  onClick={() => handleAddSubCategory(category)}
                                >
                                  <Plus size={16} className="inline mr-1" />
                                  Add Sub
                                </CRUDButton>
                                <CRUDButton
                                  key={`edit-${category.id}`}
                                  variant="success"
                                  onClick={() => handleEditCategory(category)}
                                >
                                  <PencilSimple size={16} className="inline mr-1" />
                                  Edit
                                </CRUDButton>
                                <CRUDButton
                                  key={`toggle-${category.id}`}
                                  variant={category.isActive ? 'error' : 'success'}
                                  onClick={() => handleToggleCategoryStatus(category)}
                                >
                                  {category.isActive ? (
                                    <>
                                      <ProhibitInset size={16} className="inline mr-1" />
                                      Deactivate
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle size={16} className="inline mr-1" />
                                      Activate
                                    </>
                                  )}
                                </CRUDButton>
                              </React.Fragment>
                            }
                          />
                          {/* SubCategories Rows */}
                          {expandedCategories.has(category.id) && category.subCategories?.map((subCategory) => (
                            <TableRow
                              key={`sub-${subCategory.id}`}
                              data={[
                                '',
                                '',
                                <div className="pl-8 flex items-center gap-2">
                                  <CaretRight size={16} className="text-charcoal-400" />
                                  <span className="text-charcoal-600">{subCategory.name}</span>
                                </div>,
                                <span className="text-label-medium text-charcoal-400">
                                  {viewMode === 'products' ? 'SubCategory' : 'Service Catalog'}
                                </span>,
                                <StatusChip variant={subCategory.isActive !== false ? 'success' : 'error'}>
                                  {subCategory.isActive !== false ? 'Active' : 'Inactive'}
                                </StatusChip>
                              ]}
                              actions={
                                <React.Fragment>
                                  <CRUDButton
                                    key={`edit-sub-${subCategory.id}`}
                                    variant="success"
                                    onClick={() => handleEditSubCategory(category, subCategory)}
                                  >
                                    <PencilSimple size={16} className="inline mr-1" />
                                    Edit
                                  </CRUDButton>
                                  <CRUDButton
                                    key={`toggle-sub-${subCategory.id}`}
                                    variant={subCategory.isActive !== false ? 'error' : 'success'}
                                    onClick={() => handleToggleSubCategoryStatus(category, subCategory)}
                                  >
                                    {subCategory.isActive !== false ? (
                                      <>
                                        <ProhibitInset size={16} className="inline mr-1" />
                                        Deactivate
                                      </>
                                    ) : (
                                      <>
                                        <CheckCircle size={16} className="inline mr-1" />
                                        Activate
                                      </>
                                    )}
                                  </CRUDButton>
                                  
                                </React.Fragment>
                              }
                            />
                          ))}
                        </React.Fragment>
                      ))}
                    </TableBody>
                  </Table>
                )}
            </div>
          </div>
        </div>
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
        {/* Category Modal */}
        {showCategoryModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-lg shadow-soft-lift max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="p-6 border-b border-grey-stroke">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-display-h2 text-charcoal-600">
                      {editingCategory ? 'Edit Category' : 'Add New Category'}
                    </h3>
                    <p className="text-body-regular text-charcoal-400 mt-1">
                      {viewMode === 'products' ? 'Product Category' : 'Service Category'}
                    </p>
                  </div>
                  <button
                    onClick={handleCancelCategoryForm}
                    className="text-charcoal-400 hover:text-charcoal-600 transition-colors p-2"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>

              {/* Modal Body - Category Form */}
              <form onSubmit={handleCategorySubmit}>
                <div className="p-6">
                  <div className="space-y-4">
                    {/* Category Name */}
                    <div className="bg-cream-50 rounded-lg p-4">
                      <label className="block text-body-medium text-charcoal-600 font-semibold mb-2">
                        Category Name
                      </label>
                      <input
                        type="text"
                        placeholder="Enter category name"
                        value={categoryFormData.Name}
                        onChange={(e) => setCategoryFormData({ ...categoryFormData, Name: e.target.value })}
                        className="w-full border border-grey-stroke rounded-lg px-4 py-2 focus:ring-2 focus:ring-sage-500 focus:border-sage-500 text-body-regular bg-white"
                        required
                      />
                    </div>

                    {/* Description (for services only) */}
                    {viewMode === 'services' && (
                      <div className="bg-cream-50 rounded-lg p-4">
                        <label className="block text-body-medium text-charcoal-600 font-semibold mb-2">
                          Description
                        </label>
                        <textarea
                          placeholder="Enter category description"
                          value={categoryFormData.Description}
                          onChange={(e) => setCategoryFormData({ ...categoryFormData, Description: e.target.value })}
                          className="w-full border border-grey-stroke rounded-lg px-4 py-2 focus:ring-2 focus:ring-sage-500 focus:border-sage-500 text-body-regular bg-white"
                          rows="3"
                        />
                      </div>
                    )}

                    {/* Active Status */}
                    <div className="bg-cream-50 rounded-lg p-4">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="categoryActive"
                          checked={categoryFormData.IsActive}
                          onChange={(e) => setCategoryFormData({ ...categoryFormData, IsActive: e.target.checked })}
                          className="w-4 h-4 text-sage-500 focus:ring-sage-500 border-grey-stroke rounded"
                        />
                        <label htmlFor="categoryActive" className="text-body-regular text-charcoal-600">
                          Active
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="p-6 border-t border-grey-stroke flex justify-end gap-3">
                  <CRUDButton type="button" variant="error" onClick={handleCancelCategoryForm}>
                    Cancel
                  </CRUDButton>
                  <CRUDButton type="submit" variant="success">
                    {editingCategory ? 'Update Category' : 'Create Category'}
                  </CRUDButton>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* SubCategory/Catalog Modal */}
        {showSubCategoryModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-lg shadow-soft-lift max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="p-6 border-b border-grey-stroke">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-display-h2 text-charcoal-600">
                      {editingSubCategory
                        ? `Edit ${viewMode === 'products' ? 'SubCategory' : 'Service Catalog'}`
                        : `Add New ${viewMode === 'products' ? 'SubCategory' : 'Service Catalog'}`}
                    </h3>
                    {selectedCategoryForSubCategory && (
                      <p className="text-body-regular text-charcoal-400 mt-1">
                        Parent: {selectedCategoryForSubCategory.name}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={handleCancelSubCategoryForm}
                    className="text-charcoal-400 hover:text-charcoal-600 transition-colors p-2"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>

              {/* Modal Body - SubCategory/Catalog Form */}
              <form onSubmit={handleSubCategorySubmit}>
                <div className="p-6">
                  <div className="space-y-4">
                    {/* Name */}
                    <div className="bg-cream-50 rounded-lg p-4">
                      <label className="block text-body-medium text-charcoal-600 font-semibold mb-2">
                        {viewMode === 'products' ? 'SubCategory' : 'Service Catalog'} Name
                      </label>
                      <input
                        type="text"
                        placeholder={`Enter ${viewMode === 'products' ? 'subcategory' : 'service catalog'} name`}
                        value={subCategoryFormData.Name}
                        onChange={(e) => setSubCategoryFormData({ ...subCategoryFormData, Name: e.target.value })}
                        className="w-full border border-grey-stroke rounded-lg px-4 py-2 focus:ring-2 focus:ring-sage-500 focus:border-sage-500 text-body-regular bg-white"
                        required
                      />
                    </div>

                    {/* Service-specific fields */}
                    {viewMode === 'services' && (
                      <>
                        {/* Description */}
                        <div className="bg-cream-50 rounded-lg p-4">
                          <label className="block text-body-medium text-charcoal-600 font-semibold mb-2">
                            Description
                          </label>
                          <textarea
                            placeholder="Enter service description"
                            value={subCategoryFormData.Description || ''}
                            onChange={(e) => setSubCategoryFormData({ ...subCategoryFormData, Description: e.target.value })}
                            className="w-full border border-grey-stroke rounded-lg px-4 py-2 focus:ring-2 focus:ring-sage-500 focus:border-sage-500 text-body-regular bg-white"
                            rows="3"
                          />
                        </div>

                        {/* Price Range */}
                        <div className="bg-cream-50 rounded-lg p-4">
                          <label className="block text-body-medium text-charcoal-600 font-semibold mb-3">
                            Price Range (BHD)
                          </label>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-body-small text-charcoal-500 mb-1">
                                Min Price
                              </label>
                              <input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={subCategoryFormData.MinPrice || ''}
                                onChange={(e) => setSubCategoryFormData({ ...subCategoryFormData, MinPrice: e.target.value })}
                                className="w-full border border-grey-stroke rounded-lg px-4 py-2 focus:ring-2 focus:ring-sage-500 focus:border-sage-500 text-body-regular bg-white"
                              />
                            </div>
                            <div>
                              <label className="block text-body-small text-charcoal-500 mb-1">
                                Max Price
                              </label>
                              <input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={subCategoryFormData.MaxPrice || ''}
                                onChange={(e) => setSubCategoryFormData({ ...subCategoryFormData, MaxPrice: e.target.value })}
                                className="w-full border border-grey-stroke rounded-lg px-4 py-2 focus:ring-2 focus:ring-sage-500 focus:border-sage-500 text-body-regular bg-white"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Estimated Duration */}
                        <div className="bg-cream-50 rounded-lg p-4">
                          <label className="block text-body-medium text-charcoal-600 font-semibold mb-2">
                            Estimated Duration (minutes)
                          </label>
                          <input
                            type="number"
                            placeholder="60"
                            value={subCategoryFormData.EstimatedDuration || ''}
                            onChange={(e) => setSubCategoryFormData({ ...subCategoryFormData, EstimatedDuration: e.target.value })}
                            className="w-full border border-grey-stroke rounded-lg px-4 py-2 focus:ring-2 focus:ring-sage-500 focus:border-sage-500 text-body-regular bg-white"
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="p-6 border-t border-grey-stroke flex justify-end gap-3">
                  <CRUDButton type="button" variant="error" onClick={handleCancelSubCategoryForm}>
                    Cancel
                  </CRUDButton>
                  <CRUDButton type="submit" variant="success">
                    {editingSubCategory
                      ? `Update ${viewMode === 'products' ? 'SubCategory' : 'Service Catalog'}`
                      : `Create ${viewMode === 'products' ? 'SubCategory' : 'Service Catalog'}`}
                  </CRUDButton>
                </div>
              </form>
            </div>
          </div>
        )}
    </>
  );
};

export default CategoryModeration;

/**
 * Category Moderation Page
 *
 * Manages product categories and subcategories
 * Features: View categories, add/edit categories, toggle status, manage subcategories
 */

import React, { useEffect, useState } from 'react';
import {
  Plus,
  X,
  PencilSimple,
  CheckCircle,
  ProhibitInset,
  CaretRight,
  Tag
} from '@phosphor-icons/react';
import {
  getCategories,
  createCategory,
  updateCategory,
  createSubCategory,
  updateSubCategory,
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

const CategoryModeration = ({ onNavigate, adminUserProfileId = 4037 }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState(new Set());
  const [notificationCount] = useState(0);

  // User profile state
  const [userProfile, setUserProfile] = useState(null);
  const [displayName, setDisplayName] = useState("Admin User");

  // Form states
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showSubCategoryForm, setShowSubCategoryForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingSubCategory, setEditingSubCategory] = useState(null);
  const [selectedCategoryForSubCategory, setSelectedCategoryForSubCategory] = useState(null);

  // Form data
  const [categoryFormData, setCategoryFormData] = useState({ Name: '', IsActive: true });
  const [subCategoryFormData, setSubCategoryFormData] = useState({ Name: '', CategoryId: null });

  // Statistics
  const [stats, setStats] = useState({
    totalCategories: 0,
    activeCategories: 0,
    totalSubCategories: 0
  });

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const data = await getCategories();
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
    fetchUserProfile();
  }, []);


  // Category handlers
  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, categoryFormData);

        // Log the admin activity
        logAdminActivity(
          'moderation',
          'Updated Category',
          categoryFormData.Name
        );

        alert('Category updated successfully!');
      } else {
        await createCategory(categoryFormData);

        // Log the admin activity
        logAdminActivity(
          'user_created',
          'Created New Category',
          categoryFormData.Name
        );

        alert('Category created successfully!');
      }
      setCategoryFormData({ Name: '', IsActive: true });
      setEditingCategory(null);
      setShowCategoryForm(false);
      fetchCategories();
    } catch (err) {
      console.error('Error saving category:', err);
      alert('Error saving category.');
    }
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setCategoryFormData({ Name: category.name, IsActive: category.isActive });
    setShowCategoryForm(true);
  };

  const handleToggleCategoryStatus = async (category) => {
    if (window.confirm(`Are you sure you want to ${category.isActive ? 'deactivate' : 'activate'} ${category.name}?`)) {
      try {
        const newStatus = !category.isActive;
        await updateCategory(category.id, { Name: category.name, IsActive: newStatus });

        // Log the admin activity
        logAdminActivity(
          newStatus ? 'approval' : 'suspension',
          `${newStatus ? 'Activated' : 'Deactivated'} Category`,
          category.name
        );

        fetchCategories();
      } catch (err) {
        console.error('Error toggling category status:', err);
        alert('Error toggling category status.');
      }
    }
  };

  const handleCancelCategoryForm = () => {
    setEditingCategory(null);
    setCategoryFormData({ Name: '', IsActive: true });
    setShowCategoryForm(false);
  };

  // SubCategory handlers
  const handleSubCategorySubmit = async (e) => {
    e.preventDefault();
    try {
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

        alert('SubCategory updated successfully!');
      } else {
        await createSubCategory(subCategoryFormData);

        // Log the admin activity
        logAdminActivity(
          'user_created',
          'Created New SubCategory',
          `${subCategoryFormData.Name} - ${selectedCategoryForSubCategory?.name || ''}`
        );

        alert('SubCategory created successfully!');
      }
      setSubCategoryFormData({ Name: '', CategoryId: null });
      setEditingSubCategory(null);
      setSelectedCategoryForSubCategory(null);
      setShowSubCategoryForm(false);
      fetchCategories();
    } catch (err) {
      console.error('Error saving subcategory:', err);
      alert('Error saving subcategory.');
    }
  };

  const handleAddSubCategory = (category) => {
    setSelectedCategoryForSubCategory(category);
    setSubCategoryFormData({ Name: '', CategoryId: category.id, IsActive: true });
    setShowSubCategoryForm(true);
  };

  const handleEditSubCategory = (category, subCategory) => {
    setEditingSubCategory(subCategory);
    setSelectedCategoryForSubCategory(category);
    setSubCategoryFormData({
      Name: subCategory.name,
      CategoryId: category.id,
      IsActive: subCategory.isActive !== undefined ? subCategory.isActive : true
    });
    setShowSubCategoryForm(true);
  };

  const handleToggleSubCategoryStatus = async (category, subCategory) => {
    const currentStatus = subCategory.isActive !== undefined ? subCategory.isActive : true;
    if (window.confirm(`Are you sure you want to ${currentStatus ? 'deactivate' : 'activate'} ${subCategory.name}?`)) {
      try {
        const newStatus = !currentStatus;
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

        fetchCategories();
      } catch (err) {
        console.error('Error toggling subcategory status:', err);
        alert('Error toggling subcategory status.');
      }
    }
  };

  const handleCancelSubCategoryForm = () => {
    setEditingSubCategory(null);
    setSelectedCategoryForSubCategory(null);
    setSubCategoryFormData({ Name: '', CategoryId: null });
    setShowSubCategoryForm(false);
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
      <div className="flex min-h-screen bg-cream-50">
       
          <main className="flex-1 p-8 overflow-y-auto">
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sage-500"></div>
            </div>
          </main>
        </div>
     
    );
  }

  return (
    <div className="flex min-h-screen bg-cream-50">
      
        {/* Main Content Area */}
        <main className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <AnalyticsCard
                title="Total Categories"
                metrics={[
                  {
                    value: loading ? '...' : stats.totalCategories.toString(),
                    label: 'All Categories'
                  }
                ]}
              />
              <AnalyticsCard
                title="Active Categories"
                metrics={[
                  {
                    value: loading ? '...' : stats.activeCategories.toString(),
                    label: 'Currently Active'
                  }
                ]}
              />
              <AnalyticsCard
                title="Total SubCategories"
                metrics={[
                  {
                    value: loading ? '...' : stats.totalSubCategories.toString(),
                    label: 'All SubCategories'
                  }
                ]}
              />
            </div>

            {/* Categories Table */}
            <div className="bg-white rounded-lg shadow-soft-lift">
              <div className="p-6 border-b border-grey-stroke">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <h2 className="text-card-h2 text-charcoal-600">Categories Management</h2>
                  <CRUDButton
                    variant="success"
                    onClick={() => setShowCategoryForm(!showCategoryForm)}
                  >
                    {showCategoryForm ? (
                      <>
                        <X size={16} className="inline mr-1" />
                        Close Form
                      </>
                    ) : (
                      <>
                        <Plus size={16} className="inline mr-1" />
                        Add New Category
                      </>
                    )}
                  </CRUDButton>
                </div>
              </div>

              <div className="p-6">
                {/* Category Form */}
                {showCategoryForm && (
                  <div className="bg-cream-50 rounded-lg border border-grey-stroke p-6 mb-6">
                    <h3 className="text-card-h2 text-charcoal-600 mb-4">
                      {editingCategory ? 'Edit Category' : 'Add New Category'}
                    </h3>
                    <form onSubmit={handleCategorySubmit} className="space-y-4">
                      <div>
                        <label className="block text-body-regular text-charcoal-600 font-semibold mb-2">
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

                      <div className="flex gap-3 pt-2">
                        <CRUDButton type="submit" variant="success">
                          {editingCategory ? 'Update Category' : 'Create Category'}
                        </CRUDButton>
                        <CRUDButton type="button" variant="error" onClick={handleCancelCategoryForm}>
                          Cancel
                        </CRUDButton>
                      </div>
                    </form>
                  </div>
                )}

                {/* SubCategory Form */}
                {showSubCategoryForm && (
                  <div className="bg-cream-50 rounded-lg border border-grey-stroke p-6 mb-6">
                    <h3 className="text-card-h2 text-charcoal-600 mb-4">
                      {editingSubCategory ? 'Edit SubCategory' : 'Add New SubCategory'}
                      {selectedCategoryForSubCategory && (
                        <span className="text-body-regular text-charcoal-400 ml-2">
                          - {selectedCategoryForSubCategory.name}
                        </span>
                      )}
                    </h3>
                    <form onSubmit={handleSubCategorySubmit} className="space-y-4">
                      <div>
                        <label className="block text-body-regular text-charcoal-600 font-semibold mb-2">
                          SubCategory Name
                        </label>
                        <input
                          type="text"
                          placeholder="Enter subcategory name"
                          value={subCategoryFormData.Name}
                          onChange={(e) => setSubCategoryFormData({ ...subCategoryFormData, Name: e.target.value })}
                          className="w-full border border-grey-stroke rounded-lg px-4 py-2 focus:ring-2 focus:ring-sage-500 focus:border-sage-500 text-body-regular bg-white"
                          required
                        />
                      </div>

                      <div className="flex gap-3 pt-2">
                        <CRUDButton type="submit" variant="success">
                          {editingSubCategory ? 'Update SubCategory' : 'Create SubCategory'}
                        </CRUDButton>
                        <CRUDButton type="button" variant="error" onClick={handleCancelSubCategoryForm}>
                          Cancel
                        </CRUDButton>
                      </div>
                    </form>
                  </div>
                )}

                {/* Categories List */}
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
                        'Category ID',
                        'Category Name',
                        'SubCategories',
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
                                {category.subCategories?.length || 0} subcategories
                              </span>,
                              <StatusChip variant={category.isActive ? 'success' : 'error'}>
                                {category.isActive ? 'Active' : 'Inactive'}
                              </StatusChip>
                            ]}
                            actions={
                              <>
                                <CRUDButton
                                  variant="success"
                                  onClick={() => handleAddSubCategory(category)}
                                >
                                  <Plus size={16} className="inline mr-1" />
                                  Add Sub
                                </CRUDButton>
                                <CRUDButton
                                  variant="success"
                                  onClick={() => handleEditCategory(category)}
                                >
                                  <PencilSimple size={16} className="inline mr-1" />
                                  Edit
                                </CRUDButton>
                                <CRUDButton
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
                              </>
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
                                <span className="text-label-medium text-charcoal-400">SubCategory</span>,
                                <StatusChip variant={subCategory.isActive !== false ? 'success' : 'error'}>
                                  {subCategory.isActive !== false ? 'Active' : 'Inactive'}
                                </StatusChip>
                              ]}
                              actions={
                                <>
                                  <CRUDButton
                                    variant="success"
                                    onClick={() => handleEditSubCategory(category, subCategory)}
                                  >
                                    <PencilSimple size={16} className="inline mr-1" />
                                    Edit
                                  </CRUDButton>
                                  <CRUDButton
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
                                </>
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
        </main>
      </div>
    
  );
};

export default CategoryModeration;

import { useState, useEffect } from 'react';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  createSubCategory,
} from '../../services/api';

const CategoriesPage = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Add Category state
  const [categoryName, setCategoryName] = useState('');
  const [addingCategory, setAddingCategory] = useState(false);
  const [addCategoryError, setAddCategoryError] = useState(null);

  // Add Subcategory state
  const [subcategoryName, setSubcategoryName] = useState('');
  const [subcategoryCategoryId, setSubcategoryCategoryId] = useState('');
  const [addingSubcategory, setAddingSubcategory] = useState(false);
  const [addSubcategoryError, setAddSubcategoryError] = useState(null);

  // Edit modal state
  const [editingCategory, setEditingCategory] = useState(null);
  const [editCategoryName, setEditCategoryName] = useState('');
  const [editSubcategories, setEditSubcategories] = useState([]);
  const [newSubName, setNewSubName] = useState('');
  const [modalError, setModalError] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  // Lock scroll when modal is open
  useEffect(() => {
    if (editingCategory) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }, [editingCategory]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const data = await getCategories();
      setCategories(data);
    } catch (err) {
      setError(err.message || 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  // Add Category
  const handleAddCategory = async (e) => {
    e.preventDefault();
    setAddingCategory(true);
    setAddCategoryError(null);
    try {
      await createCategory({ Name: categoryName, IsActive: true });
      setCategoryName('');
      await fetchCategories();
    } catch (err) {
      setAddCategoryError(err.message || 'Failed to add category');
    } finally {
      setAddingCategory(false);
    }
  };

  // Add Subcategory
  const handleAddSubcategory = async (e) => {
    e.preventDefault();
    if (!subcategoryCategoryId) return setAddSubcategoryError('Please select a category');
    setAddingSubcategory(true);
    setAddSubcategoryError(null);
    try {
      await createSubCategory({
        Name: subcategoryName,
        CategoryId: parseInt(subcategoryCategoryId),
      });
      setSubcategoryName('');
      setSubcategoryCategoryId('');
      await fetchCategories();
    } catch (err) {
      setAddSubcategoryError(err.message || 'Failed to add subcategory');
    } finally {
      setAddingSubcategory(false);
    }
  };

  // Open edit modal
  const openEdit = (category) => {
    setEditingCategory(category);
    setEditCategoryName(category.name);
    setEditSubcategories(
      category.subCategories
        ? category.subCategories.map((s) => ({ ...s, toDelete: false }))
        : []
    );
    setModalError(null);
  };

  // Close edit modal
  const closeEdit = () => {
    setEditingCategory(null);
    setEditCategoryName('');
    setEditSubcategories([]);
    setNewSubName('');
    setModalError(null);
  };

  // Edit subcategories
  const handleSubChange = (id, name) => {
    setEditSubcategories((prev) =>
      prev.map((s) => (s.id === id ? { ...s, name } : s))
    );
  };

  const toggleDeleteSub = (id) => {
    setEditSubcategories((prev) =>
      prev.map((s) => (s.id === id ? { ...s, toDelete: !s.toDelete } : s))
    );
  };

  // Save edits
  const handleSave = async () => {
    setSaving(true);
    setModalError(null);
    try {
      const updatedCategory = {
        Name: editCategoryName,
        subCategories: editSubcategories,
      };
      await updateCategory(editingCategory.id, updatedCategory);
      closeEdit();
      await fetchCategories();
    } catch (err) {
      setModalError(err.message || 'Failed to save category');
    } finally {
      setSaving(false);
    }
  };

  // Delete category
  const handleDeleteCategory = async () => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    try {
      await deleteCategory(editingCategory.id);
      closeEdit();
      await fetchCategories();
    } catch (err) {
      setModalError(err.message || 'Failed to delete category');
    }
  };

  const inputClasses =
    'w-full border-2 border-gray-400 rounded-lg p-2 text-black bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500';

  if (loading) return <p className="text-center mt-8 text-black">Loading categories...</p>;
  if (error) return <p className="text-center mt-8 text-red-600">{error}</p>;

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8 relative">
      <div className={`max-w-7xl mx-auto ${editingCategory ? 'pointer-events-none filter blur-sm' : ''}`}>
        <h1 className="text-3xl font-bold mb-4 text-black">Categories</h1>

        {/* Add Category Form */}
        <div className="bg-white shadow-md rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-black">Add Category</h2>
          {addCategoryError && <p className="mb-2 text-red-600">{addCategoryError}</p>}
          <form onSubmit={handleAddCategory} className="space-y-4 sm:flex sm:gap-4 sm:items-end">
            <div className="flex-1">
              <input
                type="text"
                required
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                className={inputClasses}
                placeholder="Category Name"
              />
            </div>
            <button
              type="submit"
              disabled={addingCategory}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              {addingCategory ? 'Adding...' : 'Add Category'}
            </button>
          </form>
        </div>

        {/* Add Subcategory Form */}
        <div className="bg-white shadow-md rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-black">Add Subcategory</h2>
          {addSubcategoryError && <p className="mb-2 text-red-600">{addSubcategoryError}</p>}
          <form onSubmit={handleAddSubcategory} className="space-y-4 sm:flex sm:gap-4 sm:items-end">
            <select
              required
              value={subcategoryCategoryId}
              onChange={(e) => setSubcategoryCategoryId(e.target.value)}
              className={inputClasses}
            >
              <option value="">Select Category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            <input
              type="text"
              required
              value={subcategoryName}
              onChange={(e) => setSubcategoryName(e.target.value)}
              className={inputClasses}
              placeholder="Subcategory Name"
            />
            <button
              type="submit"
              disabled={addingSubcategory}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              {addingSubcategory ? 'Adding...' : 'Add Subcategory'}
            </button>
          </form>
        </div>

        {/* Categories Table */}
        <div className="bg-white shadow-md rounded-lg overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                  Subcategories
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-black uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {categories.map((category) => (
                <tr key={category.id}>
                  <td className="px-6 py-3 font-bold text-black">{category.name}</td>
                  <td className="px-6 py-3 text-black">
                    {category.subCategories && category.subCategories.length > 0
                      ? category.subCategories.map((sub) => sub.name).join(', ')
                      : 'No subcategories'}
                  </td>
                  <td className="px-6 py-3 text-right">
                    <button
                      onClick={() => openEdit(category)}
                      className="bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 flex justify-center items-center">
          <div className="absolute inset-0 backdrop-blur-sm"></div>
          <div className="relative bg-white shadow-lg rounded-lg border border-gray-300 w-full max-w-2xl z-10 max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-xl font-semibold mb-4 text-black">Edit Category</h2>
            {modalError && <p className="mb-2 text-red-600">{modalError}</p>}

            <div className="mb-4">
              <label className="block mb-1 text-black font-medium">Category Name</label>
              <input
                type="text"
                value={editCategoryName}
                onChange={(e) => setEditCategoryName(e.target.value)}
                className={inputClasses}
              />
            </div>

            <div className="mb-4">
              <label className="block mb-1 text-black font-medium">Subcategories</label>
              {editSubcategories.map((sub) => (
                <div key={sub.id ?? Math.random()} className="flex gap-2 mb-2 items-center">
                  <input
                    type="text"
                    value={sub.name}
                    onChange={(e) => handleSubChange(sub.id, e.target.value)}
                    className={`${inputClasses} flex-1 ${sub.toDelete ? 'line-through text-gray-400' : ''}`}
                    disabled={sub.toDelete}
                  />
                  <button
                    type="button"
                    onClick={() => toggleDeleteSub(sub.id)}
                    className={`px-3 py-1 rounded-lg ${sub.toDelete ? 'bg-gray-400 text-white' : 'bg-red-600 text-white hover:bg-red-700'}`}
                  >
                    {sub.toDelete ? 'Undo' : 'Delete'}
                  </button>
                </div>
              ))}
              <div className="flex gap-2 mt-2">
                <input
                  type="text"
                  value={newSubName}
                  onChange={(e) => setNewSubName(e.target.value)}
                  className={`${inputClasses} flex-1`}
                  placeholder="New subcategory"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!newSubName.trim()) return;
                    setEditSubcategories([...editSubcategories, { id: null, name: newSubName }]);
                    setNewSubName('');
                  }}
                  className="bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700"
                >
                  Add
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={handleDeleteCategory}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
              >
                Delete Category
              </button>
              <button
                onClick={closeEdit}
                className="bg-gray-400 text-white px-4 py-2 rounded-lg hover:bg-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default CategoriesPage;

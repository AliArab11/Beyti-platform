import { useState, useEffect } from 'react';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getSubCategories,
  createSubCategory,
  updateSubCategory,
  deleteSubCategory,
} from '../../services/api';

const CategoriesPage = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form state
  const [categoryName, setCategoryName] = useState('');
  const [addingCategory, setAddingCategory] = useState(false);
  const [addCategoryError, setAddCategoryError] = useState(null);

  const [subcategoryName, setSubcategoryName] = useState('');
  const [subcategoryCategoryId, setSubcategoryCategoryId] = useState('');
  const [addingSubcategory, setAddingSubcategory] = useState(false);
  const [addSubcategoryError, setAddSubcategoryError] = useState(null);

  // Edit state
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [editCategoryName, setEditCategoryName] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

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

  const inputClasses = 'w-full border-2 border-gray-400 rounded-lg p-2 text-black bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500';

  if (loading) return <p className="text-center mt-8 text-black">Loading categories...</p>;
  if (error) return <p className="text-center mt-8 text-red-600">{error}</p>;

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
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
                <option key={cat.id} value={cat.id}>{cat.name}</option>
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
                <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">Subcategories</th>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CategoriesPage;

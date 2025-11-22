import { useState, useEffect, useRef } from "react";
import { 
  getSellerDropdown, 
  getSubCategoryDropdown, 
  createProduct, 
  getProducts, 
  updateProduct,
  deleteProduct
} from "../../services/api";

const Dropdown = ({ label, options, value, onChange, id, disabled }) => {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const handleSelect = (idValue) => {
    onChange(idValue);
    setOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <label htmlFor={id} className="block text-sm font-medium !text-gray-700 mb-2">
        {label}
      </label>
      <button
        type="button"
        id={id}
        disabled={disabled}
        onClick={() => setOpen(!open)}
        className={`w-full p-3 rounded-lg !border-2 !border-gray-300 !bg-white !text-gray-900 text-left hover:!border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:!border-blue-500 transition-colors ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        {value
          ? options.find((o) => o.id === value)?.name ||
            options.find((o) => o.id === value)?.storeName
          : `Select ${label}`}
      </button>
      {open && !disabled && (
        <ul className="absolute z-10 mt-2 w-full max-h-60 overflow-auto rounded-lg !border-2 !border-gray-400 !bg-white shadow-xl">
          {options.map((option) => (
            <li
              key={option.id}
              onClick={() => handleSelect(option.id)}
              className="cursor-pointer px-4 py-3 !text-gray-900 hover:!bg-blue-50 hover:!text-blue-700 transition-colors first:rounded-t-lg last:rounded-b-lg"
            >
              {option.name || option.storeName}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const AddProduct = () => {
  const [sellers, setSellers] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");

  const [form, setForm] = useState({
    name: "",
    description: "",
    sellerId: null,
    subCategoryId: null,
    basePrice: "",
  });

  const [editProduct, setEditProduct] = useState(null);
  const [editLoading, setEditLoading] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [sellersData, subCategoriesData, productsData] = await Promise.all([
        getSellerDropdown(),
        getSubCategoryDropdown(),
        getProducts()
      ]);
      setSellers(sellersData);
      setSubCategories(subCategoriesData);
      setProducts(productsData);
    } catch (err) {
      console.error("Failed to load initial data", err);
    }
  };

  const fetchProducts = async () => {
    try {
      const data = await getProducts();
      setProducts(data);
    } catch (err) {
      console.error("Failed to load products", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!form.sellerId || !form.subCategoryId) {
      setFormError("Please select both Seller and SubCategory");
      return;
    }
    if (!form.name.trim() || !form.basePrice) {
      setFormError("Please fill in Product Name and Base Price");
      return;
    }

    setLoading(true);
    const payload = {
      Name: form.name.trim(),
      Description: form.description.trim() || "",
      BasePrice: parseFloat(form.basePrice),
      SellerId: parseInt(form.sellerId),
      SubCategoryId: parseInt(form.subCategoryId),
    };

    try {
      await createProduct(payload);
      setForm({ name: "", description: "", sellerId: null, subCategoryId: null, basePrice: "" });
      await fetchProducts();
      setFormError("");
    } catch (err) {
      setFormError(err.message || "Failed to create product");
    } finally {
      setLoading(false);
    }
  };

  const openEdit = (product) => {
    setEditProduct({ ...product });
    document.body.style.overflow = "hidden"; // prevent background scroll
  };

  const closeEdit = () => {
    setEditProduct(null);
    document.body.style.overflow = "auto";
  };

  const handleEditSave = async () => {
    setEditLoading(true);
    try {
      await updateProduct(editProduct.id, {
        Name: editProduct.name,
        Description: editProduct.description,
        BasePrice: parseFloat(editProduct.basePrice),
        SubCategoryId: parseInt(editProduct.subCategoryId),
      });
      await fetchProducts();
      closeEdit();
    } catch (err) {
      alert(err.message || "Failed to update product");
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      await deleteProduct(id);
      setProducts(products.filter(p => p.id !== id));
    } catch (err) {
      alert(err.message || "Failed to delete product");
    }
  };

  const inputClasses = "w-full border-2 border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 !bg-white !text-gray-900 transition-colors";

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold !text-gray-900">Product Management</h1>
          <p className="mt-2 text-lg !text-gray-600">Add new products and manage your inventory</p>
        </div>

        {/* Add Product Form */}
        <div className="!bg-white shadow-lg rounded-xl border border-gray-200">
          <div className="px-6 py-5 border-b border-gray-200 !bg-gradient-to-r !from-blue-50 !to-indigo-50">
            <h2 className="text-2xl font-semibold !text-gray-900">Add New Product</h2>
            <p className="mt-1 text-sm !text-gray-600">Fill in the details to create a new product</p>
          </div>
          
          <div className="p-6 !bg-white">
            {formError && (
              <div className="mb-6 p-4 rounded-lg !bg-red-50 border-l-4 border-red-500">
                <p className="text-sm !text-red-700 font-medium">{formError}</p>
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium !text-gray-700 mb-2">Product Name <span className="text-red-500">*</span></label>
                  <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={inputClasses} placeholder="Enter product name" required />
                </div>
                <div>
                  <label className="block text-sm font-medium !text-gray-700 mb-2">Base Price <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 !text-gray-500">$</span>
                    <input type="number" value={form.basePrice} onChange={e => setForm({ ...form, basePrice: e.target.value })} className="w-full border-2 border-gray-300 p-3 pl-8 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 !bg-white !text-gray-900 transition-colors" placeholder="0.00" required min={0} step={0.01} />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium !text-gray-700 mb-2">Description</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className={inputClasses} placeholder="Enter product description" rows={3} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Dropdown id="sellerId" label="Seller / Store" options={sellers} value={form.sellerId} onChange={val => setForm({ ...form, sellerId: val })} />
                <Dropdown id="subCategoryId" label="SubCategory" options={subCategories} value={form.subCategoryId} onChange={val => setForm({ ...form, subCategoryId: val })} />
              </div>

              <div className="pt-4">
                <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
                  {loading ? "Adding Product..." : "Add Product"}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Products List */}
        <div className="!bg-white shadow-lg rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 !bg-gradient-to-r !from-green-50 !to-emerald-50 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold !text-gray-900">Product List</h2>
              <p className="mt-1 text-sm !text-gray-600">All products in your inventory</p>
            </div>
            <div className="!bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm">
              <span className="text-sm font-medium !text-gray-600">Total Products: </span>
              <span className="text-lg font-bold !text-gray-900">{products.length}</span>
            </div>
          </div>

          {products.length > 0 ? (
            <div className="overflow-x-auto !bg-white">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="!bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold !text-gray-600 uppercase tracking-wider">Product Name</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold !text-gray-600 uppercase tracking-wider">Description</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold !text-gray-600 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold !text-gray-600 uppercase tracking-wider">Price</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold !text-gray-600 uppercase tracking-wider">Seller</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold !text-gray-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="!bg-white divide-y divide-gray-200">
                  {products.map(product => (
                    <tr key={product.id} className="hover:!bg-gray-50 transition-colors">
                      <td className="px-6 py-4 !text-gray-900">{product.name}</td>
                      <td className="px-6 py-4 !text-gray-600 max-w-xs truncate">{product.description || "-"}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex px-3 py-1 text-xs font-medium rounded-full !bg-blue-100 !text-blue-800">
                          {subCategories.find(sc => sc.id === product.subCategoryId)?.name || "-"}
                        </span>
                      </td>
                      <td className="px-6 py-4 !text-green-600 font-semibold">${product.basePrice.toFixed(2)}</td>
                      <td className="px-6 py-4 !text-gray-900">{sellers.find(s => s.id === product.sellerId)?.storeName || "-"}</td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => openEdit(product)} className="bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700 mr-2">Edit</button>
                        <button onClick={() => handleDeleteProduct(product.id)} className="bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-700">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 px-6 !bg-white">
              <h3 className="mt-4 text-lg font-medium !text-gray-900">No products yet</h3>
              <p className="mt-2 text-sm !text-gray-500">Get started by adding your first product above.</p>
            </div>
          )}
        </div>
      </div>

      {/* Edit Product Modal */}
      {editProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-xl shadow-lg p-6 relative">
            <button onClick={closeEdit} className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 font-bold text-lg">&times;</button>
            <h2 className="text-2xl font-semibold !text-gray-900 mb-4">Edit Product</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium !text-gray-700 mb-1">Product Name</label>
                <input type="text" value={editProduct.name} onChange={e => setEditProduct({ ...editProduct, name: e.target.value })} className={inputClasses} />
              </div>
              <div>
                <label className="block text-sm font-medium !text-gray-700 mb-1">Description</label>
                <textarea value={editProduct.description} onChange={e => setEditProduct({ ...editProduct, description: e.target.value })} className={inputClasses} rows={3} />
              </div>
              <div>
                <label className="block text-sm font-medium !text-gray-700 mb-1">Category</label>
                <Dropdown id="editSubCategory" label="SubCategory" options={subCategories} value={editProduct.subCategoryId} onChange={val => setEditProduct({ ...editProduct, subCategoryId: val })} />
              </div>
              <div>
                <label className="block text-sm font-medium !text-gray-700 mb-1">Base Price</label>
                <input type="number" value={editProduct.basePrice} onChange={e => setEditProduct({ ...editProduct, basePrice: e.target.value })} className={inputClasses} min={0} step={0.01} />
              </div>
              <div>
                <label className="block text-sm font-medium !text-gray-700 mb-1">Seller / Store</label>
                <input type="text" value={sellers.find(s => s.id === editProduct.sellerId)?.storeName || ""} disabled className={inputClasses} />
              </div>

              <div className="flex justify-end gap-3 mt-4">
                <button onClick={closeEdit} className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100">Cancel</button>
                <button onClick={handleEditSave} disabled={editLoading} className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">
                  {editLoading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AddProduct;

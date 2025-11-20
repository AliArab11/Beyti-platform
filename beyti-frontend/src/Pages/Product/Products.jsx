import { useState, useEffect, useRef } from "react";
import { 
  getSellerDropdown, 
  getSubCategoryDropdown, 
  createProduct, 
  getProducts 
} from "../../services/api";

const Dropdown = ({ label, options, value, onChange, id }) => {
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
        onClick={() => setOpen(!open)}
        className="w-full p-3 rounded-lg !border-2 !border-gray-300 !bg-white !text-gray-900 text-left hover:!border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:!border-blue-500 transition-colors"
      >
        {value
          ? options.find((o) => o.id === value)?.name ||
            options.find((o) => o.id === value)?.storeName
          : `Select ${label}`}
      </button>
      {open && (
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
      setForm({
        name: "",
        description: "",
        sellerId: null,
        subCategoryId: null,
        basePrice: "",
      });
      await fetchProducts();
      setFormError("");
    } catch (err) {
      setFormError(err.message || "Failed to create product");
    } finally {
      setLoading(false);
    }
  };

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
                {/* Product Name */}
                <div>
                  <label className="block text-sm font-medium !text-gray-700 mb-2">
                    Product Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full border-2 border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 !bg-white !text-gray-900 transition-colors"
                    placeholder="Enter product name"
                    required
                  />
                </div>

                {/* Base Price */}
                <div>
                  <label className="block text-sm font-medium !text-gray-700 mb-2">
                    Base Price <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 !text-gray-500">$</span>
                    <input
                      type="number"
                      value={form.basePrice}
                      onChange={(e) => setForm({ ...form, basePrice: e.target.value })}
                      className="w-full border-2 border-gray-300 p-3 pl-8 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 !bg-white !text-gray-900 transition-colors"
                      placeholder="0.00"
                      required
                      min={0}
                      step={0.01}
                    />
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium !text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full border-2 border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 !bg-white !text-gray-900 transition-colors"
                  placeholder="Enter product description"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Seller Dropdown */}
                <Dropdown
                  id="sellerId"
                  label="Seller / Store"
                  options={sellers}
                  value={form.sellerId}
                  onChange={(val) => setForm({ ...form, sellerId: val })}
                />

                {/* SubCategory Dropdown */}
                <Dropdown
                  id="subCategoryId"
                  label="SubCategory"
                  options={subCategories}
                  value={form.subCategoryId}
                  onChange={(val) => setForm({ ...form, subCategoryId: val })}
                />
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Adding Product...
                    </span>
                  ) : (
                    "Add Product"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Products List */}
        <div className="!bg-white shadow-lg rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 !bg-gradient-to-r !from-green-50 !to-emerald-50">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold !text-gray-900">Product List</h2>
                <p className="mt-1 text-sm !text-gray-600">All products in your inventory</p>
              </div>
              <div className="!bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm">
                <span className="text-sm font-medium !text-gray-600">Total Products: </span>
                <span className="text-lg font-bold !text-gray-900">{products.length}</span>
              </div>
            </div>
          </div>

          {products.length > 0 ? (
            <div className="overflow-x-auto !bg-white">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="!bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold !text-gray-600 uppercase tracking-wider">
                      Product Name
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold !text-gray-600 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold !text-gray-600 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold !text-gray-600 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold !text-gray-600 uppercase tracking-wider">
                      Seller
                    </th>
                  </tr>
                </thead>
                <tbody className="!bg-white divide-y divide-gray-200">
                  {products.map((product) => (
                    <tr key={product.id} className="hover:!bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium !text-gray-900">{product.name}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm !text-gray-600 max-w-xs truncate">
                          {product.description || "-"}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex px-3 py-1 text-xs font-medium rounded-full !bg-blue-100 !text-blue-800">
                          {subCategories.find((sc) => sc.id === product.subCategoryId)?.name || "-"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold !text-green-600">
                          ${product.basePrice.toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm !text-gray-900">
                          {sellers.find((s) => s.id === product.sellerId)?.storeName || "-"}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 px-6 !bg-white">
              <svg className="mx-auto h-12 w-12 !text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <h3 className="mt-4 text-lg font-medium !text-gray-900">No products yet</h3>
              <p className="mt-2 text-sm !text-gray-500">Get started by adding your first product above.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddProduct;
import React, { useEffect, useMemo, useState } from "react";
import AnalyticsCard from "../../../components/AnalyticsCard";
import StatusChip from "../../../components/StatusChip";
import Button from "../../../components/Button";
import ConfirmModal from "../../../components/ConfirmModal";

import {
  getProducts,
  getSubCategoryDropdown,
  createProduct,
  updateProduct,
  deleteProduct,
  createProductVariant,
  updateProductVariant,
  deleteProductVariant,
  getProductVariants,
} from "../../../services/api";

const formatCurrency = (value) => {
  if (!value && value !== 0) return "BHD 0.000";
  return `BHD ${Number(value).toFixed(3)}`;
};

const Products = ({ sellerId }) => {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [subCategories, setSubCategories] = useState([]);

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);

  const [variantError, setVariantError] = useState(null);

  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null });

  const [form, setForm] = useState({
    name: "",
    description: "",
    basePrice: "",
    discountPercentage: "",
    subCategoryId: "",
    stockQty: "",
    sku: "",
    colorValue: "",
    sizeValue: "",
  });

    const [showVariantModal, setShowVariantModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [variants, setVariants] = useState([]);
    const [editingVariant, setEditingVariant] = useState(null);

    const [variantForm, setVariantForm] = useState({
    colorValue: "",
    sizeValue: "",
    sku: "",
    price: "",
    stockQty: "",
    });

  // ========================
  // LOAD DATA
  // ========================

  const loadSellerProducts = async () => {
  const prodData = await getProducts();
  const sid = Number(sellerId);
  const sellerProducts = prodData.filter((p) => p.sellerId === sid);

  // attach variants
  for (const p of sellerProducts) {
    try {
      const v = await getProductVariants(p.id);
      p.variants = v;
    } catch {
      p.variants = [];
    }
  }

  return sellerProducts;
};

// ========================
// SKU VALIDATION
// ========================
const checkDuplicateSKU = async (sku, currentVariantId = null) => {
  if (!sku || sku.trim() === '') return { isDuplicate: false };
  
  const normalizedSku = sku.trim().toLowerCase();
  
  // Get fresh product data to ensure we have latest variants
  const freshProducts = await loadSellerProducts();
  
  // Check against all products and their variants
  for (const product of freshProducts) {
    if (!product.variants) continue;
    
    for (const variant of product.variants) {
      // Skip if checking the same variant being edited
      if (currentVariantId && variant.id === currentVariantId) continue;
      
      if (variant.sku?.toLowerCase() === normalizedSku) {
        return {
          isDuplicate: true,
          productName: product.name,
          variantDetails: `${variant.colorValue || ''} ${variant.sizeValue || ''}`.trim() || 'Unnamed variant'
        };
      }
    }
  }
  
  return { isDuplicate: false };
};

 useEffect(() => {
  const load = async () => {
    setLoading(true);
    try {
      const [sellerProducts, subCats] = await Promise.all([
        loadSellerProducts(sellerId),
        getSubCategoryDropdown()
      ]);

      setProducts(sellerProducts);
      setSubCategories(subCats);
    } catch (err) {
      console.error("Failed to load products", err);
      alert("Failed to load products. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  load();
}, [sellerId]);





  // ========================
  // METRICS
  // ========================
  const metrics = useMemo(() => {
    return {
      total: products.length,
      active: products.filter((p) => p.isActive).length,
      inactive: products.filter((p) => !p.isActive).length,
      totalValue: products.reduce((sum, p) => sum + (p.basePrice || 0), 0),
    };
  }, [products]);

  // ========================
  // FILTER + SEARCH
  // ========================
  const filteredProducts = useMemo(() => {
    let list = [...products];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q)
      );
    }

    if (filterStatus === "active") {
      list = list.filter((p) => p.isActive);
    } else if (filterStatus === "inactive") {
      list = list.filter((p) => !p.isActive);
    }

    return list;
  }, [products, search, filterStatus]);

  // ========================
  // OPEN / CLOSE MODAL
  // ========================
  const openNew = () => {
    setEditing(null);
    setForm({
      name: "",
      description: "",
      basePrice: "",
      discountPercentage: "",
      subCategoryId: "",
      stockQty: "",
      sku: "",
      colorValue: "",
      sizeValue: "",
    });
    setShowModal(true);
  };

  const openEdit = (p) => {
  setEditing(p);
  setForm({
    name: p.name,
    description: p.description || "",
    basePrice: p.basePrice,
    discountPercentage: p.discountPercentage || "",
    subCategoryId: p.subCategoryId,
    stockQty: "",
    sku: "",
    colorValue: "",
    sizeValue: "",
  });
  setShowModal(true);
};

  const closeModal = () => setShowModal(false);

  // ========================
// SUBMIT HANDLER
// ========================
const saveProduct = async (e) => {
  e.preventDefault();

  // Step 1: Prepare the basic product data
  const payload = {
  Name: form.name.trim(),
  Description: form.description.trim(),
  BasePrice: parseFloat(form.basePrice),
  DiscountPercentage: form.discountPercentage ? parseFloat(form.discountPercentage) : null,
  SellerId: sellerId,
  SubCategoryId: parseInt(form.subCategoryId),
};

  try {
    // Step 2: Check if we're EDITING or CREATING
    if (editing) {
      await updateProduct(editing.id, payload);
      
    } else {
      // VALIDATION 1: Check if SKU is provided
      if (!form.sku || form.sku.trim() === '') {
        alert('SKU is required for the initial variant');
        return; // Stop here, don't create product
      }
      
      // VALIDATION 2: Check if Stock Quantity is provided
      if (!form.stockQty || form.stockQty === '') {
        alert('Stock Quantity is required for the initial variant');
        return; // Stop here, don't create product
      }

      // VALIDATION 3: Check for duplicate SKU (only if SKU exists after previous validations)
      if (form.sku && form.sku.trim()) {
        const skuCheck = await checkDuplicateSKU(form.sku.trim());
        
        if (skuCheck.isDuplicate) {
          alert('This SKU is already in use. Please choose a different SKU code.');
          return;
        }
      }

      // All validations passed! Now create the product
      const created = await createProduct(payload);

      // Then immediately create the required initial variant
      await createProductVariant({
        ProductId: created.id,
        ColorValue: form.colorValue.trim() || null,
        SizeValue: form.sizeValue.trim() || null,
        SKU: form.sku.trim(),
        Price: null,
        StockQty: parseInt(form.stockQty),
      });
    }

    // Step 3: Refresh the products list to show changes
    const refreshed = await loadSellerProducts();
    setProducts(refreshed);
    
    // Step 4: Close modal and reset form
    closeModal();
    setForm({
      name: "",
      description: "",
      basePrice: "",
      discountPercentage: "",
      subCategoryId: "",
      stockQty: "",
      sku: "",
      colorValue: "",
      sizeValue: "",
    });
    
  } catch (err) {
    console.error("Save product error:", err);
    alert(err.message || "Failed to save product");
  }
};

  const removeProduct = async (id) => {
  const product = products.find(p => p.id === id);
  const actionText = product?.isActive ? 'Deactivate' : 'Activate';
  const statusText = product?.isActive ? 'deactivate' : 'activate';
  const variantType = product?.isActive ? 'danger' : 'success'; // Add this line

  await new Promise((resolve) => {
    setConfirmModal({
      isOpen: true,
      title: `${actionText} Product`,
      message: `Are you sure you want to ${statusText} this product? ${product?.isActive ? 'It will be hidden from customers.' : 'It will be visible to customers again.'}`,
      variant: variantType, // Add this line
      onConfirm: () => {
        setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: null });
        resolve(true);
      }
    });
  });
  
  try {
    await deleteProduct(id);
    const refreshed = await loadSellerProducts();
    setProducts(refreshed);
  } catch (err) {
    await new Promise((resolve) => {
      setConfirmModal({
        isOpen: true,
        title: 'Error',
        message: err.message || 'Failed to update product status',
        variant: 'danger', // Add this line
        onConfirm: () => {
          setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: null });
          resolve(true);
        }
      });
    });
  }
};

  // ========================
// VARIANT MANAGEMENT
// ========================
const openVariantModal = async (product) => {
  setSelectedProduct(product);
  setEditingVariant(null);
  setVariantError(null); // Clear any previous errors
  setVariantForm({
    colorValue: "",
    sizeValue: "",
    sku: "",
    price: "",
    stockQty: "",
  });
  
  // Fetch variants from API
  try {
    const variantsData = await getProductVariants(product.id);
    setVariants(variantsData);
  } catch (err) {
    console.error("Failed to load variants", err);
    setVariants([]);
  }
  
  setShowVariantModal(true);
};

const closeVariantModal = () => {
  setShowVariantModal(false);
  setSelectedProduct(null);
  setVariants([]);
  setEditingVariant(null);
  setVariantError(null); // Clear error when closing
};

const openEditVariant = (variant) => {
  setEditingVariant(variant);
  setVariantError(null); // Clear error when switching variants
  setVariantForm({
    colorValue: variant.colorValue || "",
    sizeValue: variant.sizeValue || "",
    sku: variant.sku || "",
    price: variant.price || "",
    stockQty: variant.stockQty || "",
  });
};

const saveVariant = async (e) => {
  e.preventDefault();
  setVariantError(null);

  // VALIDATION 1: SKU is required
  if (!variantForm.sku || variantForm.sku.trim() === '') {
    setVariantError('SKU is required for each variant');
    return;
  }

  // VALIDATION 2: Stock Quantity is required
  if (variantForm.stockQty === '' || variantForm.stockQty === null || variantForm.stockQty === undefined) {
    setVariantError('Stock Quantity is required');
    return;
  }

  // VALIDATION 3: Stock Quantity must be 0 or greater
  if (Number(variantForm.stockQty) < 0) {
    setVariantError('Stock Quantity must be 0 or greater');
    return;
  }

  // VALIDATION 4: Check for duplicate SKU
  const skuCheck = await checkDuplicateSKU(
    variantForm.sku.trim(), 
    editingVariant?.id
  );
  
  if (skuCheck.isDuplicate) {
    setVariantError('This SKU is already in use. Please choose a different SKU code.');
    return;
  }

  const payload = {
    ProductId: selectedProduct.id,
    ColorValue: variantForm.colorValue || null,
    SizeValue: variantForm.sizeValue || null,
    SKU: variantForm.sku || null,
    Price: variantForm.price ? parseFloat(variantForm.price) : null,
    StockQty: parseInt(variantForm.stockQty),
  };

  try {
    if (editingVariant) {
      // Update existing variant
      await updateProductVariant(editingVariant.id, payload);
    } else {
      // Create new variant
      await createProductVariant(payload);
    }

    const refreshed = await loadSellerProducts();
setProducts(refreshed);

const updatedProduct = refreshed.find(p => p.id === selectedProduct.id);
setVariants(updatedProduct?.variants || []);
setSelectedProduct(updatedProduct); // update metadata too
    
    // Reset form and clear error
    setVariantError(null);
    setEditingVariant(null);
    setVariantForm({
      colorValue: "",
      sizeValue: "",
      sku: "",
      price: "",
      stockQty: "",
    });
  } catch (err) {
    alert(err.message || "Failed to save variant");
  }
};

const removeVariant = async (variantId) => {
  await new Promise((resolve) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Variant',
      message: 'Are you sure you want to delete this variant? This action cannot be undone.',
      onConfirm: () => {
        setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: null });
        resolve(true);
      }
    });
  });
  
  try {
    await deleteProductVariant(variantId);
    
    const refreshed = await loadSellerProducts();
    setProducts(refreshed);

    const updatedProduct = refreshed.find(p => p.id === selectedProduct.id);
    setVariants(updatedProduct?.variants || []);
    setSelectedProduct(updatedProduct);

  } catch (err) {
    alert(err.message || "Failed to delete variant");
  }
};

  // ========================
  // UI
  // ========================
  if (loading) {
    return (
    <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <div className="w-12 h-12 border-4 border-sage-200 border-t-sage-500 rounded-full animate-spin mb-4"></div>
        <p className="text-body-medium text-charcoal-400">Loading products...</p>
    </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* ADD PRODUCT BUTTON */}
      <div className="flex justify-end">

        <Button variant="primary" size="large" onClick={openNew}>
        Add Product
        </Button>
      </div>

      {/* METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <AnalyticsCard
          title="Total Products"
          metrics={[{ value: metrics.total, label: "All products" }]}
        />
        <AnalyticsCard
          title="Active"
          metrics={[{ value: metrics.active, label: "Currently listed" }]}
        />
        <AnalyticsCard
          title="Inactive"
          metrics={[{ value: metrics.inactive, label: "Not listed" }]}
        />
        <AnalyticsCard
          title="Total Value"
          metrics={[{ value: formatCurrency(metrics.totalValue), label: "Inventory value" }]}
        />
      </div>

      {/* FILTER + SEARCH */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
        {["all", "active", "inactive"].map((s) => (
            <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`px-5 py-2.5 rounded-lg text-button font-semibold transition-all ${
                filterStatus === s
                ? "bg-sage-500 text-cream-50 shadow-soft-lift"
                : "bg-cream-50 text-charcoal-600 border border-grey-stroke hover:bg-grey-200"
            }`}
            >
            {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
        ))}
        </div>

        <div className="relative max-w-md w-full">
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-lg border-2 border-grey-stroke bg-white text-body-regular text-charcoal-600 focus:outline-none focus:border-sage-500 focus:ring-2 focus:ring-sage-100 transition-all"
          />
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>

      {/* PRODUCT GRID */}
      {filteredProducts.length === 0 ? (
        <div className="bg-grey-200 rounded-lg p-16 text-center border border-grey-stroke">
        <svg
            className="w-16 h-16 mx-auto mb-4 text-charcoal-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
        >
            <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
            />
        </svg>
        <p className="text-body-large text-charcoal-400 font-medium">No products found</p>
        <p className="text-body-regular text-charcoal-400 mt-2">
            {search || filterStatus !== "all" 
            ? "Try adjusting your filters" 
            : "Get started by adding your first product"}
        </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((p) => {
           
            
            return (
            <div
                key={p.id}
                className="bg-white rounded-xl overflow-hidden border border-grey-stroke shadow-soft-lift hover:shadow-lg transition-all hover:scale-[1.02] duration-200"
            >
              <div className="bg-gradient-to-br from-sage-100 to-sage-200 h-48 flex items-center justify-center relative">
              <svg
                className="w-20 h-20 text-sage-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>

              {/* Status badges */}
              <div className="absolute top-3 right-3 flex flex-col gap-2">
                {!p.isActive && (
                  <StatusChip variant="neutral">Inactive</StatusChip>
                )}
                {p.discountPercentage && (
                  <div className="px-3 py-1.5 bg-error-btn text-white text-sm font-bold rounded-full shadow-md">
                    {p.discountPercentage}% OFF
                  </div>
                )}
              </div>
            </div>

              <div className="p-5 space-y-3">
                <div>
                  <h3 className="text-card-h3 text-charcoal-700 font-semibold line-clamp-2">
                    {p.name}
                  </h3>
                  <p className="text-body-regular text-charcoal-400 line-clamp-2">
                    {p.description || "No description"}
                  </p>
                </div>

                <div className="flex items-center justify-between">
                <div>
                  <p className="text-label-small text-charcoal-400">PRICE</p>
                  {p.discountPercentage ? (
                    <div className="flex flex-col gap-1">
                      <div className="flex items-baseline gap-2">
                        <p className="text-body-large text-sage-700 font-bold">
                          {formatCurrency(p.basePrice - (p.basePrice * (p.discountPercentage / 100)))}
                        </p>
                        <span className="px-2 py-0.5 bg-error-btn text-white text-xs font-bold rounded-full">
                          {p.discountPercentage}% OFF
                        </span>
                      </div>
                      <p className="text-body-regular text-charcoal-400 line-through">
                        {formatCurrency(p.basePrice)}
                      </p>
                    </div>
                  ) : (
                    <p className="text-body-large text-sage-700 font-bold">
                      {formatCurrency(p.basePrice)}
                    </p>
                  )}
                </div>

                {p.subCategory && (
                  <StatusChip variant="brand">{p.subCategory.name}</StatusChip>
                )}
              </div>

                {/* Variant Count Badge */}
                    {p.variants && p.variants.length > 0 && (
                    <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-sage-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        <span className="text-label-small text-charcoal-400 font-medium">
                        {p.variants.length} variant{p.variants.length !== 1 ? 's' : ''}
                        </span>
                    </div>
                    )}

                <div className="space-y-2 pt-2">
                <div className="flex gap-2">
                    <Button 
                    variant="secondary" 
                    size="medium" 
                    fullWidth
                    onClick={() => openEdit(p)}
                    >
                    Edit
                    </Button>
                    <Button 
                    variant={p.isActive ? "error" : "success"}
                    size="medium"
                    onClick={() => removeProduct(p.id)}
                  >
                    {p.isActive ? 'Deactivate' : 'Activate'}
                  </Button>
                </div>
                <Button 
                    variant="ghost" 
                    size="small" 
                    fullWidth
                    onClick={() => openVariantModal(p)}
                >
                    Manage Variants ({p.variants?.length || 0})
                </Button>
                </div>
              </div>
            </div>
           );
        })}
        </div>
      )}

      {/* ADD / EDIT MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-charcoal-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 modal-backdrop-enter">
          <div className="bg-cream-50 rounded-2xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto modal-content-enter">
            <div className="bg-sage-500 p-8 rounded-t-2xl">
                <h2 className="text-display-h2 text-white font-bold">
                    {editing ? "Edit Product" : "Add New Product"}
                </h2>
                <p className="text-body-medium text-white/80 mt-2">
                    {editing
                    ? "Update product information"
                    : "Fill in details to create product"}
                </p>
                </div>

            <form onSubmit={saveProduct} className="p-6 space-y-5">
              <div>
                <label className="block text-label-medium text-charcoal-600 mb-2 font-semibold">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border-2 border-grey-stroke rounded-lg p-3 bg-white text-body-regular text-charcoal-600 focus:outline-none focus:border-sage-500 focus:ring-2 focus:ring-sage-100 transition-all"
                />
              </div>

              <div>
               <label className="block text-label-medium text-charcoal-600 mb-2 font-semibold">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  className="w-full border-2 border-grey-stroke rounded-lg p-3 bg-white text-body-regular text-charcoal-600 focus:outline-none focus:border-sage-500 focus:ring-2 focus:ring-sage-100 transition-all"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-label-medium text-charcoal-600 mb-2 font-semibold">
                    Base Price *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.001"
                    value={form.basePrice}
                    onChange={(e) =>
                      setForm({ ...form, basePrice: e.target.value })
                    }
                    className="w-full border-2 border-grey-stroke rounded-lg p-3 bg-white text-body-regular text-charcoal-600 focus:outline-none focus:border-sage-500 focus:ring-2 focus:ring-sage-100 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-label-medium text-charcoal-600 mb-2 font-semibold">
                    Category *
                  </label>
                  <select
                    required
                    value={form.subCategoryId}
                    onChange={(e) =>
                      setForm({ ...form, subCategoryId: e.target.value })
                    }
                    className="w-full border-2 border-grey-stroke rounded-lg p-3 bg-white text-body-regular text-charcoal-600 focus:outline-none focus:border-sage-500 focus:ring-2 focus:ring-sage-100 transition-all"
                  >
                    <option value="">Select category</option>
                    {subCategories.map((sc) => (
                      <option key={sc.id} value={sc.id}>
                        {sc.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-label-medium text-charcoal-600 mb-2 font-semibold">
                  Discount Percentage (Optional)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={form.discountPercentage}
                  onChange={(e) =>
                    setForm({ ...form, discountPercentage: e.target.value })
                  }
                  placeholder="e.g., 15 for 15% off"
                  className="w-full border-2 border-grey-stroke rounded-lg p-3 bg-white text-body-regular text-charcoal-600 focus:outline-none focus:border-sage-500 focus:ring-2 focus:ring-sage-100 transition-all"
                />
                <p className="text-xs text-charcoal-400 mt-1">
                  Leave empty for no discount
                </p>
              </div>
              

              {!editing && (
            <>
              <div className="border-t-2 border-grey-stroke pt-6 mt-2">
                <h3 className="text-card-h3 text-charcoal-700 mb-4">
                  Initial Variant (Required)
                </h3>
                <p className="text-body-regular text-charcoal-400 mb-4">
                  Every product must have at least one variant with stock and SKU
                </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-label-medium text-charcoal-600 mb-2 font-semibold">
                          Stock Qty <span className="text-error-text">*</span>
                        </label>
                        <input
                          type="number"
                          required
                          min="0"
                          value={form.stockQty}
                          onChange={(e) =>
                            setForm({ ...form, stockQty: e.target.value })
                          }
                          className="w-full border-2 border-grey-stroke rounded-lg p-3 bg-white text-body-regular text-charcoal-600 focus:outline-none focus:border-sage-500 focus:ring-2 focus:ring-sage-100 transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-label-medium text-charcoal-600 mb-2 font-semibold">
                          SKU <span className="text-error-text">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={form.sku}
                          onChange={(e) =>
                            setForm({ ...form, sku: e.target.value })
                          }
                          className="w-full border-2 border-grey-stroke rounded-lg p-3 bg-white text-body-regular text-charcoal-600 focus:outline-none focus:border-sage-500 focus:ring-2 focus:ring-sage-100 transition-all"
                        />
                      </div>
                    </div>

                    <h4 className="text-card-h3 text-charcoal-600 mt-5 mb-3">
                      Variant Attributes (Optional)
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-label-medium text-charcoal-600 mb-2 font-semibold">
                          Color
                        </label>
                        <input
                          type="text"
                          value={form.colorValue}
                          onChange={(e) =>
                            setForm({ ...form, colorValue: e.target.value })
                          }
                          className="w-full border-2 border-grey-stroke rounded-lg p-3 bg-white text-body-regular text-charcoal-600 focus:outline-none focus:border-sage-500 focus:ring-2 focus:ring-sage-100 transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-label-medium text-charcoal-600 mb-2 font-semibold">
                          Size
                        </label>
                        <input
                          type="text"
                          value={form.sizeValue}
                          onChange={(e) =>
                            setForm({ ...form, sizeValue: e.target.value })
                          }
                          className="w-full border-2 border-grey-stroke rounded-lg p-3 bg-white text-body-regular text-charcoal-600 focus:outline-none focus:border-sage-500 focus:ring-2 focus:ring-sage-100 transition-all"
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              <div className="flex gap-4 pt-6">
                <Button
                    type="button"
                    variant="secondary"
                    size="large"
                    fullWidth
                    onClick={closeModal}
                >
                    Cancel
                </Button>
                <Button
                    type="submit"
                    variant="primary"
                    size="large"
                    fullWidth
                >
                    {editing ? "Save Changes" : "Add Product"}
                </Button>
                </div>
            </form>
          </div>
        </div>
      )}

      {/* VARIANT MANAGEMENT MODAL */}
{showVariantModal && selectedProduct && (
  <div className="fixed inset-0 bg-charcoal-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 modal-backdrop-enter">
    <div className="bg-cream-50 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto modal-content-enter">
      {/* Modal Header */}
      <div className="bg-sage-500 p-8 rounded-t-2xl sticky top-0 z-10">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-display-h2 text-white font-bold">
              Manage Variants
            </h2>
            <p className="text-body-medium text-white/80 mt-2">
              {selectedProduct.name}
            </p>
          </div>
          <button
            onClick={closeVariantModal}
            className="text-white hover:text-cream-50 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* LEFT SIDE: Variant Form */}
          <div className="bg-white rounded-xl p-6 border-2 border-grey-stroke">
            <h3 className="text-card-h2 text-charcoal-600 mb-4">
              {editingVariant ? "Edit Variant" : "Add New Variant"}
            </h3>

            <form onSubmit={saveVariant} className="space-y-4">
              {/* Error Display */}
              {variantError && (
                <div className="bg-error-bg border-l-4 border-error-btn px-4 py-3 rounded">
                  <p className="text-sm text-error-text">{variantError}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-label-medium text-charcoal-600 mb-2 font-semibold">
                    Color
                  </label>
                  <input
                    type="text"
                    value={variantForm.colorValue}
                    onChange={(e) =>
                      setVariantForm({ ...variantForm, colorValue: e.target.value })
                    }
                    placeholder="e.g., Red, Blue"
                    className="w-full border-2 border-grey-stroke rounded-lg p-3 bg-white text-body-regular text-charcoal-600 focus:outline-none focus:border-sage-500 focus:ring-2 focus:ring-sage-100 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-label-medium text-charcoal-600 mb-2 font-semibold">
                    Size
                  </label>
                  <input
                    type="text"
                    value={variantForm.sizeValue}
                    onChange={(e) =>
                      setVariantForm({ ...variantForm, sizeValue: e.target.value })
                    }
                    placeholder="e.g., S, M, L"
                    className="w-full border-2 border-grey-stroke rounded-lg p-3 bg-white text-body-regular text-charcoal-600 focus:outline-none focus:border-sage-500 focus:ring-2 focus:ring-sage-100 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-label-medium text-charcoal-600 mb-2 font-semibold">
                  SKU <span className="text-error-text">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={variantForm.sku}
                  onChange={(e) =>
                    setVariantForm({ ...variantForm, sku: e.target.value })
                  }
                  placeholder="e.g., PROD-001-RED-M"
                  className="w-full border-2 border-grey-stroke rounded-lg p-3 bg-white text-body-regular text-charcoal-600 focus:outline-none focus:border-sage-500 focus:ring-2 focus:ring-sage-100 transition-all"
                />
                <p className="text-xs text-charcoal-400 mt-1">
                  Must be unique across all products
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-label-medium text-charcoal-600 mb-2 font-semibold">
                    Price (Optional)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.001"
                    value={variantForm.price}
                    onChange={(e) =>
                      setVariantForm({ ...variantForm, price: e.target.value })
                    }
                    placeholder="Leave empty for base price"
                    className="w-full border-2 border-grey-stroke rounded-lg p-3 bg-white text-body-regular text-charcoal-600 focus:outline-none focus:border-sage-500 focus:ring-2 focus:ring-sage-100 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-label-medium text-charcoal-600 mb-2 font-semibold">
                    Stock Quantity *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={variantForm.stockQty}
                    onChange={(e) =>
                      setVariantForm({ ...variantForm, stockQty: e.target.value })
                    }
                    className="w-full border-2 border-grey-stroke rounded-lg p-3 bg-white text-body-regular text-charcoal-600 focus:outline-none focus:border-sage-500 focus:ring-2 focus:ring-sage-100 transition-all"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                {editingVariant && (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setEditingVariant(null);
                      setVariantError(null); // Clear error
                      setVariantForm({
                        colorValue: "",
                        sizeValue: "",
                        sku: "",
                        price: "",
                        stockQty: "",
                      });
                    }}
                  >
                    Cancel Edit
                  </Button>
                )}
                <Button type="submit" variant="primary" fullWidth>
                  {editingVariant ? "Update Variant" : "Add Variant"}
                </Button>
              </div>
            </form>
          </div>

          {/* RIGHT SIDE: Variants List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-card-h2 text-charcoal-600">
                Existing Variants ({variants.length})
              </h3>
            </div>

            {variants.length === 0 ? (
              <div className="bg-grey-200 rounded-lg p-8 text-center border border-grey-stroke">
                <svg
                  className="w-12 h-12 mx-auto mb-3 text-charcoal-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
                <p className="text-body-medium text-charcoal-400">No variants yet</p>
                <p className="text-body-regular text-charcoal-400 mt-1">
                  Add your first variant using the form
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {variants.map((variant) => (
                  <div
                    key={variant.id}
                    className="bg-white rounded-lg p-4 border-2 border-grey-stroke hover:border-sage-300 transition-all"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex gap-2">
                        {variant.colorValue && (
                          <StatusChip variant="brand">
                            {variant.colorValue}
                          </StatusChip>
                        )}
                        {variant.sizeValue && (
                          <StatusChip variant="neutral">
                            {variant.sizeValue}
                          </StatusChip>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEditVariant(variant)}
                          className="text-sage-600 hover:text-sage-700 transition-colors"
                          title="Edit variant"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => removeVariant(variant.id)}
                          className="text-error-btn hover:text-error-text transition-colors"
                          title="Delete variant"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-body-regular">
                      <div>
                        <p className="text-label-small text-charcoal-400">SKU</p>
                        <p className="text-charcoal-600 font-medium">
                          {variant.sku || "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-label-small text-charcoal-400">STOCK</p>
                        <p className="text-charcoal-600 font-medium">
                          {variant.stockQty || 0} units
                        </p>
                      </div>
                      <div>
                        <p className="text-label-small text-charcoal-400">PRICE</p>
                        <p className="text-charcoal-600 font-medium">
                          {variant.price 
                            ? formatCurrency(variant.price) 
                            : `${formatCurrency(selectedProduct.basePrice)} (base)`}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Close Button */}
        <div className="mt-6 pt-6 border-t-2 border-grey-stroke">
          <Button
            variant="secondary"
            size="large"
            fullWidth
            onClick={closeVariantModal}
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  </div>
)}

<ConfirmModal
  isOpen={confirmModal.isOpen}
  onClose={() => setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: null })}
  onConfirm={confirmModal.onConfirm}
  title={confirmModal.title}
  message={confirmModal.message}
  confirmText={confirmModal.confirmText || "Confirm"}
  variant={confirmModal.variant || "danger"}
/>
    </div>
  );
};

export default Products;

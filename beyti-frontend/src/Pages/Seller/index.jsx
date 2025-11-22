import { useState, useEffect, Fragment } from "react";
import { 
  getSellers, 
  createSeller, 
  updateSeller, 
  deleteSeller, 
  createAddress, 
  createSellerAddress 
} from "../../services/api";

const Sellers = () => {
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Toggle mode: adding seller or address
  const [addingMode, setAddingMode] = useState("seller"); // "seller" or "address"

  // Seller form fields
  const [storeName, setStoreName] = useState("");
  const [phone, setPhone] = useState("");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState(null);

  // Address form fields
  const [selectedSellerId, setSelectedSellerId] = useState("");
  const [addressStreet, setAddressStreet] = useState("");
  const [addressCity, setAddressCity] = useState("");
  const [addressCountry, setAddressCountry] = useState("");
  const [addressRegion, setAddressRegion] = useState("");
  const [addressPostalCode, setAddressPostalCode] = useState("");
  const [addAddressError, setAddAddressError] = useState(null);

  // Edit seller
  const [editingId, setEditingId] = useState(null);
  const [editStoreName, setEditStoreName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editError, setEditError] = useState(null);

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, id: null, name: "" });

  // Expanded row state
  const [expandedRows, setExpandedRows] = useState(new Set());

  useEffect(() => {
    fetchSellers();
  }, []);

  const fetchSellers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getSellers();
      setSellers(data);
    } catch (err) {
      setError(err.message || "Failed to load sellers");
    } finally {
      setLoading(false);
    }
  };

  // --- Seller APIs ---
  const handleAddSeller = async () => {
    if (!storeName) return;
    setAdding(true);
    setAddError(null);
    try {
      await createSeller({ StoreName: storeName, Phone: phone });
      await fetchSellers();
      setStoreName("");
      setPhone("");
    } catch (err) {
      setAddError(err.message || "Failed to add seller");
    } finally {
      setAdding(false);
    }
  };

  const startEdit = (seller) => {
    setEditingId(seller.id);
    setEditStoreName(seller.storeName);
    setEditPhone(seller.phone || "");
    setEditError(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditStoreName("");
    setEditPhone("");
    setEditError(null);
  };

  const handleEditSeller = async () => {
    try {
      await updateSeller(editingId, { StoreName: editStoreName, Phone: editPhone });
      await fetchSellers();
      cancelEdit();
    } catch (err) {
      setEditError(err.message || "Failed to edit seller");
    }
  };

  const confirmDelete = (id, name) => {
    setDeleteConfirm({ show: true, id, name });
  };

  const cancelDelete = () => {
    setDeleteConfirm({ show: false, id: null, name: "" });
  };

  const handleDelete = async () => {
    try {
      await deleteSeller(deleteConfirm.id);
      setSellers(sellers.filter((s) => s.id !== deleteConfirm.id));
      cancelDelete();
    } catch (err) {
      alert(err.message || "Failed to delete seller");
    }
  };

  // --- Address APIs ---
  const handleAddAddress = async () => {
    if (!selectedSellerId || !addressStreet || !addressCity || !addressCountry) return;
    setAdding(true);
    setAddAddressError(null);

    try {
      // 1️⃣ Create the address
      const newAddress = await createAddress({
        Label: null,
        Street: addressStreet,
        City: addressCity,
        Region: addressRegion || null,
        PostalCode: addressPostalCode || null,
        Country: addressCountry,
        Latitude: null,
        Longitude: null,
        IsDefault: false
      });

      console.log("Address created:", newAddress);

      // 2️⃣ Link address to seller
      await createSellerAddress({
        SellerId: parseInt(selectedSellerId),
        AddressId: newAddress.id
      });

      // Clear form
      setSelectedSellerId("");
      setAddressStreet("");
      setAddressCity("");
      setAddressCountry("");
      setAddressRegion("");
      setAddressPostalCode("");

      await fetchSellers();
      
      // Show success message
      setAddAddressError(null);
    } catch (err) {
      console.error("Full error:", err);
      setAddAddressError(err.message || "Failed to add address");
    } finally {
      setAdding(false);
    }
  };

  const toggleRow = (sellerId) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(sellerId)) {
      newExpanded.delete(sellerId);
    } else {
      newExpanded.add(sellerId);
    }
    setExpandedRows(newExpanded);
  };

  const inputClasses = "w-full !border-2 !border-gray-400 rounded-lg p-3 !text-black !bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:!border-blue-500";

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen !bg-gray-50">
      <div className="text-center">
        <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-r-transparent"></div>
        <p className="mt-4 text-lg !text-gray-600">Loading sellers...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="flex items-center justify-center min-h-screen !bg-gray-50">
      <div className="max-w-md w-full !bg-white shadow-lg rounded-lg p-6 border-l-4 border-red-500">
        <h2 className="text-xl font-semibold !text-gray-800 mb-2">Error Loading Sellers</h2>
        <p className="!text-gray-600 mb-4">{error}</p>
        <button onClick={fetchSellers} className="w-full !bg-blue-600 hover:!bg-blue-700 !text-white py-2 px-4 rounded-lg">
          Retry
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen !bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold !text-gray-900">Seller Management</h1>
          <p className="mt-2 text-lg !text-gray-600">Manage sellers and their addresses</p>
        </div>

        {/* Toggle Button */}
        <div className="mb-6">
          <button
            onClick={() => setAddingMode(addingMode === "seller" ? "address" : "seller")}
            className="!bg-gradient-to-r !from-gray-600 !to-gray-700 hover:!from-gray-700 hover:!to-gray-800 !text-white px-6 py-3 rounded-lg font-semibold shadow-md transition-all"
          >
            {addingMode === "seller" ? "➕ Add Address Mode" : "👤 Add Seller Mode"}
          </button>
        </div>

        {/* Add Seller / Address Form */}
        {addingMode === "seller" ? (
          <div className="!bg-white shadow-lg rounded-xl border border-gray-200 p-6 mb-6">
            <h2 className="text-2xl font-semibold !text-gray-900 mb-4">Add Seller</h2>
            {addError && (
              <div className="mb-4 p-4 rounded-lg !bg-red-50 border-l-4 border-red-500">
                <p className="text-sm !text-red-700 font-medium">{addError}</p>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium !text-gray-700 mb-2">Store Name <span className="!text-red-500">*</span></label>
                <input type="text" value={storeName} onChange={e => setStoreName(e.target.value)} className={inputClasses} placeholder="Enter store name" />
              </div>
              <div>
                <label className="block text-sm font-medium !text-gray-700 mb-2">Phone</label>
                <input type="text" value={phone} onChange={e => setPhone(e.target.value)} className={inputClasses} placeholder="Enter phone number" />
              </div>
              <div className="flex items-end">
                <button onClick={handleAddSeller} disabled={adding || !storeName} className="w-full !bg-blue-600 hover:!bg-blue-700 !text-white py-3 px-6 rounded-lg font-semibold disabled:opacity-50">
                  {adding ? "Adding..." : "Add Seller"}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="!bg-white shadow-lg rounded-xl border border-gray-200 p-6 mb-6">
            <h2 className="text-2xl font-semibold !text-gray-900 mb-4">Add Address</h2>
            {addAddressError && (
              <div className="mb-4 p-4 rounded-lg !bg-red-50 border-l-4 border-red-500">
                <p className="text-sm !text-red-700 font-medium">{addAddressError}</p>
              </div>
            )}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium !text-gray-700 mb-2">Seller <span className="!text-red-500">*</span></label>
                  <select value={selectedSellerId} onChange={e => setSelectedSellerId(e.target.value)} className={inputClasses}>
                    <option value="">Select Seller</option>
                    {sellers.map(s => <option key={s.id} value={s.id}>{s.storeName}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium !text-gray-700 mb-2">Street <span className="!text-red-500">*</span></label>
                  <input type="text" value={addressStreet} onChange={e => setAddressStreet(e.target.value)} className={inputClasses} placeholder="Enter street address" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium !text-gray-700 mb-2">City <span className="!text-red-500">*</span></label>
                  <input type="text" value={addressCity} onChange={e => setAddressCity(e.target.value)} className={inputClasses} placeholder="Enter city" />
                </div>
                <div>
                  <label className="block text-sm font-medium !text-gray-700 mb-2">Country <span className="!text-red-500">*</span></label>
                  <input type="text" value={addressCountry} onChange={e => setAddressCountry(e.target.value)} className={inputClasses} placeholder="Enter country" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium !text-gray-700 mb-2">Region</label>
                  <input type="text" value={addressRegion} onChange={e => setAddressRegion(e.target.value)} className={inputClasses} placeholder="Enter region (optional)" />
                </div>
                <div>
                  <label className="block text-sm font-medium !text-gray-700 mb-2">Postal Code</label>
                  <input type="text" value={addressPostalCode} onChange={e => setAddressPostalCode(e.target.value)} className={inputClasses} placeholder="Enter postal code (optional)" />
                </div>
              </div>
              <button onClick={handleAddAddress} disabled={adding || !selectedSellerId || !addressStreet || !addressCity || !addressCountry} className="w-full !bg-blue-600 hover:!bg-blue-700 !text-white py-3 px-6 rounded-lg font-semibold disabled:opacity-50">
                {adding ? "Adding Address..." : "Add Address"}
              </button>
            </div>
          </div>
        )}

        {/* Sellers Table */}
        <div className="!bg-white shadow-lg rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 !bg-gradient-to-r !from-blue-50 !to-indigo-50">
            <h2 className="text-2xl font-semibold !text-gray-900">All Sellers</h2>
            <p className="mt-1 text-sm !text-gray-600">Manage your seller database</p>
          </div>

          {sellers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="!bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold !text-gray-600 uppercase tracking-wider w-12"></th>
                    <th className="px-6 py-4 text-left text-xs font-semibold !text-gray-600 uppercase tracking-wider">Store Name</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold !text-gray-600 uppercase tracking-wider">Phone</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold !text-gray-600 uppercase tracking-wider">Addresses</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold !text-gray-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="!bg-white divide-y divide-gray-200">
                  {sellers.map(seller => (
                    <Fragment key={seller.id}>
                      <tr className="hover:!bg-gray-50 transition-colors">
                        {editingId === seller.id ? (
                          <>
                            <td className="px-6 py-4"></td>
                            <td className="px-6 py-4">
                              <input type="text" value={editStoreName} onChange={e => setEditStoreName(e.target.value)} className={inputClasses} />
                            </td>
                            <td className="px-6 py-4">
                              <input type="text" value={editPhone} onChange={e => setEditPhone(e.target.value)} className={inputClasses} />
                            </td>
                            <td className="px-6 py-4"></td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex gap-2 justify-end">
                                <button onClick={handleEditSeller} className="!bg-green-600 hover:!bg-green-700 !text-white px-4 py-2 rounded-lg font-semibold">Save</button>
                                <button onClick={cancelEdit} className="!bg-gray-500 hover:!bg-gray-600 !text-white px-4 py-2 rounded-lg font-semibold">Cancel</button>
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="px-6 py-4">
                              {seller.sellerAddresses && seller.sellerAddresses.length > 0 && (
                                <button onClick={() => toggleRow(seller.id)} className="!text-gray-600 hover:!text-blue-600">
                                  <svg className={`w-5 h-5 transition-transform ${expandedRows.has(seller.id) ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                  </svg>
                                </button>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm font-medium !text-gray-900">{seller.storeName}</div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm !text-gray-900">{seller.phone || "N/A"}</div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="inline-flex px-3 py-1 text-xs font-medium rounded-full !bg-blue-100 !text-blue-800">
                                {seller.sellerAddresses?.length || 0} address{seller.sellerAddresses?.length !== 1 ? 'es' : ''}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex gap-2 justify-end">
                                <button onClick={() => startEdit(seller)} className="!bg-yellow-500 hover:!bg-yellow-600 !text-white p-2 rounded-lg" title="Edit Seller">
                                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                                <button onClick={() => confirmDelete(seller.id, seller.storeName)} className="!bg-red-600 hover:!bg-red-700 !text-white p-2 rounded-lg" title="Delete Seller">
                                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </td>
                          </>
                        )}
                      </tr>

                      {/* Expanded Address Details */}
                      {expandedRows.has(seller.id) && seller.sellerAddresses && seller.sellerAddresses.length > 0 && (
                        <tr className="!bg-gray-50">
                          <td colSpan="5" className="px-6 py-4">
                            <div className="ml-8 space-y-3">
                              <h4 className="font-semibold !text-gray-900 mb-3">Addresses:</h4>
                              {seller.sellerAddresses.map((sa, idx) => (
                                <div key={idx} className="!bg-white p-4 rounded-lg border border-gray-200">
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                    <div>
                                      <span className="font-medium !text-gray-600">Street:</span>
                                      <p className="!text-gray-900">{sa.address?.street || 'N/A'}</p>
                                    </div>
                                    <div>
                                      <span className="font-medium !text-gray-600">City:</span>
                                      <p className="!text-gray-900">{sa.address?.city || 'N/A'}</p>
                                    </div>
                                    <div>
                                      <span className="font-medium !text-gray-600">Region:</span>
                                      <p className="!text-gray-900">{sa.address?.region || 'N/A'}</p>
                                    </div>
                                    <div>
                                      <span className="font-medium !text-gray-600">Country:</span>
                                      <p className="!text-gray-900">{sa.address?.country || 'N/A'}</p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 px-6">
              <svg className="mx-auto h-12 w-12 !text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <h3 className="mt-4 text-lg font-medium !text-gray-900">No sellers yet</h3>
              <p className="mt-2 text-sm !text-gray-500">Get started by adding your first seller above.</p>
            </div>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {deleteConfirm.show && (
          <div className="fixed inset-0 !bg-black !bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="!bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
              <div className="flex items-center mb-4">
                <div className="!bg-red-100 p-3 rounded-full">
                  <svg className="w-6 h-6 !text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="ml-3 text-xl font-bold !text-gray-900">Confirm Delete</h3>
              </div>
              <p className="!text-gray-600 mb-6">
                Are you sure you want to delete <strong className="!text-gray-900">"{deleteConfirm.name}"</strong>? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button onClick={handleDelete} className="flex-1 !bg-red-600 hover:!bg-red-700 !text-white py-3 px-4 rounded-lg font-semibold">
                  Delete
                </button>
                <button onClick={cancelDelete} className="flex-1 !bg-gray-500 hover:!bg-gray-600 !text-white py-3 px-4 rounded-lg font-semibold">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sellers;
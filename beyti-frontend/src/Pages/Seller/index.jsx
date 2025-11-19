import { useState, useEffect } from 'react';
import { getSellers, createSeller } from '../../services/api';

const Sellers = () => {
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form fields
  const [storeName, setStoreName] = useState("");
  const [phone, setPhone] = useState("");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState(null);

  useEffect(() => {
    const fetchSellers = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getSellers();
        setSellers(data);
      } catch (err) {
        setError(err.message || 'Failed to load sellers');
      } finally {
        setLoading(false);
      }
    };

    fetchSellers();
  }, []);

  // -------------------------
  // Add Seller
  // -------------------------
  const handleAddSeller = async (e) => {
    e.preventDefault();
    setAdding(true);
    setAddError(null);

    try {
      const newSeller = {
      UserProfileId: 1,
      StoreName: storeName,
      Phone: phone,
      };

      await createSeller({
      UserProfileId: 1,
      StoreName: storeName,
      Phone: phone
      });

      // refresh list
      const updated = await getSellers();
      setSellers(updated);

      // reset form
      setStoreName("");
      setPhone("");
    } catch (err) {
      setAddError(err.message || "Failed to add seller");
    } finally {
      setAdding(false);
    }
  };

  // -------------------------
  // Loading
  // -------------------------
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-r-transparent"></div>
          <p className="mt-4 text-lg text-gray-600">Loading sellers...</p>
        </div>
      </div>
    );
  }

  // -------------------------
  // Error
  // -------------------------
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6 border-l-4 border-red-500">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Error Loading Sellers</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // -------------------------
  // UI
  // -------------------------
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Sellers</h1>
        <p className="text-gray-600 mb-8">Add new sellers and view all registered sellers</p>

        {/* ADD SELLER FORM */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Add Seller</h2>

          {addError && (
            <p className="mb-4 text-red-600">{addError}</p>
          )}

          <form onSubmit={handleAddSeller} className="space-y-4">

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Store Name
              </label>
              <input
                type="text"
                required
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full border-gray-300 rounded-lg"
                placeholder="Enter store name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full border-gray-300 rounded-lg"
                placeholder="Enter phone number"
              />
            </div>

            <button
              type="submit"
              disabled={adding}
              className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg"
            >
              {adding ? "Adding..." : "Add Seller"}
            </button>
          </form>
        </div>

        {/* SELLERS TABLE */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {sellers.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="mt-2 text-lg font-medium text-gray-900">No sellers found</h3>
              <p className="mt-1 text-gray-500">Add a seller above to get started.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Store Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phone
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sellers.map((seller, index) => (
                    <tr key={seller.id || index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {seller.storeName}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {seller.phone || "N/A"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {sellers.length > 0 && (
          <div className="mt-4 text-sm text-gray-500 text-center">
            Showing {sellers.length} seller{ sellers.length === 1 ? "" : "s" }
          </div>
        )}
      </div>
    </div>
  );
};

export default Sellers;

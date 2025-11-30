import { useEffect, useState } from 'react';
import { getFlaggedUsers, getUserViolations, suspendUser, reactivateUser, warnUser } from '../../../services/api';

export default function FlaggedUsers() {
  const [flaggedData, setFlaggedData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [violations, setViolations] = useState([]);
  const [loadingViolations, setLoadingViolations] = useState(false);
  const [activeSection, setActiveSection] = useState('flagged'); // flagged, suspended

  const fetchFlaggedUsers = async () => {
    try {
      setLoading(true);
      const data = await getFlaggedUsers();
      setFlaggedData(data);
    } catch (err) {
      console.error('Error fetching flagged users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlaggedUsers();
  }, []);

  const handleViewDetails = async (user) => {
    try {
      setLoadingViolations(true);
      setSelectedUser(user);
      setShowDetailsModal(true);
      const data = await getUserViolations(user.userId);
      setViolations(data.violations);
    } catch (err) {
      console.error('Error fetching violations:', err);
      alert('Error loading violations');
    } finally {
      setLoadingViolations(false);
    }
  };

  const handleCloseModal = () => {
    setShowDetailsModal(false);
    setSelectedUser(null);
    setViolations([]);
  };

  const handleSuspendUser = async (userId, userName) => {
    const reason = prompt(`Enter reason for suspending ${userName}:`);
    if (reason) {
      if (confirm(`Are you sure you want to suspend ${userName}? This will deactivate all their products/services.`)) {
        try {
          await suspendUser(userId, reason);
          alert('User suspended successfully!');
          handleCloseModal();
          fetchFlaggedUsers();
        } catch (err) {
          console.error('Error suspending user:', err);
          alert('Error suspending user');
        }
      }
    }
  };

  const handleReactivateUser = async (userId, userName) => {
    if (confirm(`Are you sure you want to reactivate ${userName}?`)) {
      try {
        await reactivateUser(userId);
        alert('User reactivated successfully!');
        fetchFlaggedUsers();
      } catch (err) {
        console.error('Error reactivating user:', err);
        alert('Error reactivating user');
      }
    }
  };

  const handleWarnUser = async (userId, userName) => {
    const message = prompt(`Enter warning message for ${userName}:`);
    if (message) {
      try {
        await warnUser(userId, message);
        alert('Warning sent to user!');
      } catch (err) {
        console.error('Error warning user:', err);
        alert('Error sending warning');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!flaggedData) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">Error loading flagged users</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header with Tabs */}
      <div className="bg-white rounded-lg shadow-md mb-6">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">User Moderation</h2>
          <p className="text-gray-600 text-sm mt-1">
            Manage users with policy violations and suspensions
          </p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveSection('flagged')}
            className={`px-6 py-3 font-medium transition ${
              activeSection === 'flagged'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            ⚠️ Flagged Users ({flaggedData.totalFlagged})
          </button>
          <button
            onClick={() => setActiveSection('suspended')}
            className={`px-6 py-3 font-medium transition ${
              activeSection === 'suspended'
                ? 'border-b-2 border-red-500 text-red-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            🚫 Suspended Users ({flaggedData.totalSuspended})
          </button>
        </div>

        {/* Stats */}
        <div className="p-6 flex gap-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-orange-600">{flaggedData.sellers.length}</p>
            <p className="text-xs text-gray-500">Flagged Sellers</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600">{flaggedData.serviceProviders.length}</p>
            <p className="text-xs text-gray-500">Flagged Providers</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">{flaggedData.totalSuspended}</p>
            <p className="text-xs text-gray-500">Suspended</p>
          </div>
        </div>
      </div>

      {/* Flagged Users Section */}
      {activeSection === 'flagged' && (
        <>
          {flaggedData.totalFlagged === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <div className="text-6xl mb-4">✅</div>
              <p className="text-gray-500 text-lg">No flagged users</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[...flaggedData.sellers, ...flaggedData.serviceProviders].map((user) => (
                <div key={user.userId} className="bg-white rounded-lg shadow-md overflow-hidden border-l-4 border-orange-500">
                  <div className="p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-xl font-bold ${
                          user.type === 'Seller' ? 'bg-orange-500' : 'bg-purple-500'
                        }`}>
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-3">
                          <h3 className="text-lg font-bold text-gray-800">{user.name}</h3>
                          <p className="text-sm text-gray-500">
                            {user.type === 'Seller' ? user.storeName : user.businessName}
                          </p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                        user.type === 'Seller' ? 'bg-orange-100 text-orange-800' : 'bg-purple-100 text-purple-800'
                      }`}>
                        {user.type}
                      </span>
                    </div>

                    {/* Flag Reason */}
                    <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm font-semibold text-yellow-800">
                        ⚠️ {user.flagReason}
                      </p>
                    </div>

                    {/* Stats */}
                    {user.type === 'Seller' && (
                      <div className="grid grid-cols-3 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-gray-800">{user.totalProducts}</p>
                          <p className="text-xs text-gray-500">Total</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-red-600">{user.inactiveProducts}</p>
                          <p className="text-xs text-gray-500">Inactive</p>
                        </div>
                        {user.inappropriateProducts > 0 && (
                          <div className="text-center">
                            <p className="text-2xl font-bold text-orange-600">{user.inappropriateProducts}</p>
                            <p className="text-xs text-gray-500">Flagged</p>
                          </div>
                        )}
                      </div>
                    )}

                    {user.type === 'ServiceProvider' && (
                      <div className="mb-4 p-4 bg-gray-50 rounded-lg space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Availability:</span>
                          <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                            user.availabilityStatus === 'Available' ? 'bg-green-100 text-green-800' : 
                            user.availabilityStatus === 'Busy' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {user.availabilityStatus}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Info */}
                    <div className="text-sm text-gray-500 mb-4">
                      <p>Phone: {user.phone || 'N/A'}</p>
                      <p>Created: {new Date(user.createdAt).toLocaleDateString()}</p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleViewDetails(user)}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition text-sm"
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => handleWarnUser(user.userId, user.name)}
                        className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg font-medium transition text-sm"
                      >
                        Warn
                      </button>
                      <button
                        onClick={() => handleSuspendUser(user.userId, user.name)}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition text-sm"
                      >
                        Suspend
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Suspended Users Section */}
      {activeSection === 'suspended' && (
        <>
          {flaggedData.suspendedUsers.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <div className="text-6xl mb-4">✅</div>
              <p className="text-gray-500 text-lg">No suspended users</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Suspended Date</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {flaggedData.suspendedUsers.map((user) => (
                    <tr key={user.userId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                            <span className="text-red-600 font-bold">{user.name.charAt(0).toUpperCase()}</span>
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">{user.name}</div>
                            <div className="text-sm text-gray-500">ID: {user.userId}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                          {user.roleType}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                          {user.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.updatedAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleReactivateUser(user.userId, user.name)}
                          className="text-green-600 hover:text-green-900 font-medium"
                        >
                          Reactivate
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-bold text-gray-800">{selectedUser.name}</h3>
                  <p className="text-gray-600">
                    {selectedUser.type === 'Seller' ? selectedUser.storeName : selectedUser.businessName}
                  </p>
                  <div className="mt-2 flex gap-2">
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                      selectedUser.type === 'Seller' ? 'bg-orange-100 text-orange-800' : 'bg-purple-100 text-purple-800'
                    }`}>
                      {selectedUser.type}
                    </span>
                    <span className="px-3 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                      {selectedUser.flagReason}
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {loadingViolations ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="text-gray-500 mt-4">Loading violations...</p>
                </div>
              ) : (
                <>
                  <h4 className="text-lg font-bold text-gray-800 mb-4">
                    Policy Violations ({violations.length})
                  </h4>

                  {violations.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No violations found</p>
                  ) : (
                    <div className="space-y-4">
                      {violations.map((violation, index) => (
                        <div key={index} className={`border rounded-lg p-4 ${
                          violation.violationType.includes('Inappropriate') 
                            ? 'border-orange-200 bg-orange-50' 
                            : 'border-red-200 bg-red-50'
                        }`}>
                          <div className="flex justify-between items-start mb-2">
                            <h5 className="font-semibold text-gray-800">{violation.name}</h5>
                            <span className={`px-2 py-1 text-xs font-semibold rounded ${
                              violation.violationType.includes('Inappropriate')
                                ? 'bg-orange-200 text-orange-800'
                                : 'bg-red-200 text-red-800'
                            }`}>
                              {violation.violationType}
                            </span>
                          </div>
                          {violation.description && (
                            <p className="text-sm text-gray-600 mb-2">{violation.description}</p>
                          )}
                          {violation.flaggedKeywords && violation.flaggedKeywords.length > 0 && (
                            <div className="mb-2">
                              <p className="text-xs font-semibold text-orange-800 mb-1">Flagged Keywords:</p>
                              <div className="flex flex-wrap gap-1">
                                {violation.flaggedKeywords.map((keyword, idx) => (
                                  <span key={idx} className="px-2 py-1 bg-orange-200 text-orange-800 text-xs rounded">
                                    {keyword}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          {violation.basePrice && (
                            <p className="text-sm text-gray-600">Price: ${violation.basePrice.toFixed(2)}</p>
                          )}
                          <p className="text-xs text-gray-400 mt-2">
                            Created: {new Date(violation.createdAt).toLocaleDateString()} | 
                            Updated: {new Date(violation.updatedAt).toLocaleDateString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => handleWarnUser(selectedUser.userId, selectedUser.name)}
                className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-2 rounded-lg font-medium transition"
              >
                Send Warning
              </button>
              <button
                onClick={() => handleSuspendUser(selectedUser.userId, selectedUser.name)}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium transition"
              >
                Suspend User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
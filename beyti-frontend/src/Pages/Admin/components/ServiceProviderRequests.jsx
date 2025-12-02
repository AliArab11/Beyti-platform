import { useEffect, useState } from 'react';
import { getServiceProviderRequests, approveServiceProviderRequest, rejectServiceProviderRequest } from '../../../services/api';

export default function ServiceProviderRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const data = await getServiceProviderRequests();
      setRequests(data);
    } catch (err) {
      console.error('Error fetching requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleApprove = async (id) => {
    if (confirm('Are you sure you want to approve this request?')) {
      try {
        setProcessingId(id);
        await approveServiceProviderRequest(id);
        
        // Remove the approved request from the list immediately
        setRequests(prev => prev.filter(req => req.id !== id));
        
        alert('Request approved successfully!');
      } catch (err) {
        console.error('Error approving request:', err);
        alert('Error approving request: ' + (err.message || 'Unknown error'));
      } finally {
        setProcessingId(null);
      }
    }
  };

  const handleReject = async (id) => {
    if (confirm('Are you sure you want to reject this request?')) {
      try {
        setProcessingId(id);
        await rejectServiceProviderRequest(id);
        
        // Remove the rejected request from the list immediately
        setRequests(prev => prev.filter(req => req.id !== id));
        
        alert('Request rejected successfully!');
      } catch (err) {
        console.error('Error rejecting request:', err);
        alert('Error rejecting request: ' + (err.message || 'Unknown error'));
      } finally {
        setProcessingId(null);
      }
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-12 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading requests...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-gray-800">Pending Service Provider Requests</h2>
        <p className="text-gray-600 text-sm mt-1">{requests.length} pending requests</p>
      </div>

      {requests.length === 0 ? (
        <div className="p-12 text-center">
          <div className="text-6xl mb-4">✅</div>
          <p className="text-gray-500 text-lg">No pending requests</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-200">
          {requests.map((request) => (
            <div key={request.id} className="p-6 hover:bg-gray-50 transition">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-800">{request.businessName}</h3>
                  <p className="text-gray-600 text-sm mt-1">Provider: {request.userDisplayName}</p>
                  {request.notes && (
                    <p className="text-gray-500 text-sm mt-2 bg-gray-50 p-3 rounded">
                      <strong>Notes:</strong> {request.notes}
                    </p>
                  )}
                  <p className="text-gray-400 text-xs mt-2">
                    Submitted: {new Date(request.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleApprove(request.id)}
                    disabled={processingId === request.id}
                    className={`px-6 py-2 rounded-lg font-medium transition ${
                      processingId === request.id
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-green-600 hover:bg-green-700 text-white'
                    }`}
                  >
                    {processingId === request.id ? '⏳ Processing...' : '✓ Approve'}
                  </button>
                  <button
                    onClick={() => handleReject(request.id)}
                    disabled={processingId === request.id}
                    className={`px-6 py-2 rounded-lg font-medium transition ${
                      processingId === request.id
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-red-600 hover:bg-red-700 text-white'
                    }`}
                  >
                    {processingId === request.id ? '⏳ Processing...' : '✕ Reject'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
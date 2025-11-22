import { useEffect, useState } from 'react';
import {
  getServiceProviderRequests,
  approveServiceProviderRequest,
  rejectServiceProviderRequest,
} from '../../services/api';

export default function ServiceProviderRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const data = await getServiceProviderRequests();
      setRequests(data);
    } catch (err) {
      console.error(err);
      alert('Error fetching requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleApprove = async (requestId) => {
    try {
      await approveServiceProviderRequest(requestId);
      fetchRequests();
    } catch (err) {
      console.error(err);
      alert('Error approving request.');
    }
  };

  const handleReject = async (requestId) => {
    try {
      await rejectServiceProviderRequest(requestId);
      fetchRequests();
    } catch (err) {
      console.error(err);
      alert('Error rejecting request.');
    }
  };

  if (loading) return <div>Loading requests...</div>;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Service Provider Registration Requests</h2>
      {requests.length === 0 ? (
        <p>No pending requests.</p>
      ) : (
        <table className="min-w-full bg-white border">
          <thead>
            <tr>
              <th className="border px-2 py-1">ID</th>
              <th className="border px-2 py-1">Service Provider</th>
              <th className="border px-2 py-1">Business Name</th>
              <th className="border px-2 py-1">Status</th>
              <th className="border px-2 py-1">Created At</th>
              <th className="border px-2 py-1">Actions</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((req) => (
              <tr key={req.id}>
                <td className="border px-2 py-1">{req.id}</td>
                <td className="border px-2 py-1">{req.userDisplayName}</td>
                <td className="border px-2 py-1">{req.businessName}</td>
                <td className="border px-2 py-1">{req.status}</td>
                <td className="border px-2 py-1">{new Date(req.createdAt).toLocaleString()}</td>
                <td className="border px-2 py-1 space-x-2">
                  <button
                    onClick={() => handleApprove(req.id)}
                    className="bg-green-600 text-white px-2 py-1 rounded"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(req.id)}
                    className="bg-red-600 text-white px-2 py-1 rounded"
                  >
                    Reject
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

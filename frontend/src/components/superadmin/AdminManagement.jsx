import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const AdminManagement = () => {
  const { currentUser } = useAuth();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [blockingAdmin, setBlockingAdmin] = useState(null);
  const [blockReason, setBlockReason] = useState('');

  useEffect(() => {
    loadAdmins();
  }, []);

  const loadAdmins = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:3000/superadmin/admins');
      setAdmins(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to load admins');
      setLoading(false);
      console.error('Error loading admins:', err);
    }
  };

  const handleToggleBlock = async (admin) => {
    const isCurrentlyBlocked = admin.blocked?.isBlocked || false;
    
    if (!isCurrentlyBlocked) {
      // Show confirmation modal for blocking
      setBlockingAdmin(admin);
      setBlockReason('');
      return;
    }

    // Unblock directly
    if (!window.confirm(`Are you sure you want to unblock ${admin.name}?`)) {
      return;
    }

    try {
      await axios.post(`http://localhost:3000/superadmin/admins/${admin._id}/toggle-block`, {
        blockedBy: currentUser?.name || 'Super Admin',
        reason: ''
      });
      
      alert(`Admin ${admin.name} has been unblocked successfully!`);
      loadAdmins();
    } catch (err) {
      console.error('Error toggling block status:', err);
      alert('Failed to update admin status');
    }
  };

  const confirmBlock = async () => {
    if (!blockingAdmin) return;

    try {
      await axios.post(`http://localhost:3000/superadmin/admins/${blockingAdmin._id}/toggle-block`, {
        blockedBy: currentUser?.name || 'Super Admin',
        reason: blockReason || 'Blocked by super admin'
      });
      
      alert(`Admin ${blockingAdmin.name} has been blocked successfully!`);
      setBlockingAdmin(null);
      setBlockReason('');
      loadAdmins();
    } catch (err) {
      console.error('Error blocking admin:', err);
      alert('Failed to block admin');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Admin Management</h2>
        <p className="text-sm text-gray-600 mt-1">View and manage all registered admins</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {admins.map((admin) => (
          <div
            key={admin._id}
            className={`bg-white rounded-xl shadow-lg overflow-hidden border-l-4 transition-all hover:shadow-xl ${
              admin.blocked?.isBlocked ? 'border-red-500 bg-red-50' : 'border-blue-500'
            }`}
          >
            <div className="p-6">
              {/* Admin Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-full ${
                    admin.blocked?.isBlocked ? 'bg-red-200' : 'bg-blue-100'
                  }`}>
                    <svg className={`w-6 h-6 ${
                      admin.blocked?.isBlocked ? 'text-red-600' : 'text-blue-600'
                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{admin.name}</h3>
                    {admin.blocked?.isBlocked && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-red-200 text-red-800">
                        🚫 Blocked
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Admin Details */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span className="text-gray-700">{admin.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span className="text-gray-700">{admin.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-gray-700">{admin.city || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-gray-600">Joined: {new Date(admin.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Blocked Info */}
              {admin.blocked?.isBlocked && (
                <div className="bg-red-100 border border-red-300 rounded-lg p-3 mb-4">
                  <p className="text-xs font-semibold text-red-800 mb-1">Blocked By:</p>
                  <p className="text-sm text-red-700">{admin.blocked.blockedBy}</p>
                  {admin.blocked.reason && (
                    <>
                      <p className="text-xs font-semibold text-red-800 mt-2 mb-1">Reason:</p>
                      <p className="text-sm text-red-700">{admin.blocked.reason}</p>
                    </>
                  )}
                  <p className="text-xs text-red-600 mt-2">
                    Blocked on: {new Date(admin.blocked.blockedAt).toLocaleString()}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleToggleBlock(admin)}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                    admin.blocked?.isBlocked
                      ? 'bg-green-500 text-white hover:bg-green-600'
                      : 'bg-red-500 text-white hover:bg-red-600'
                  }`}
                >
                  {admin.blocked?.isBlocked ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                      </svg>
                      Unblock
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                      </svg>
                      Block Admin
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}

        {admins.length === 0 && !loading && (
          <div className="col-span-full text-center py-12 bg-white rounded-lg shadow">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No admins found</h3>
            <p className="mt-1 text-sm text-gray-500">Admins can register through the registration page.</p>
          </div>
        )}
      </div>

      {/* Block Confirmation Modal */}
      {blockingAdmin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Block Admin</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to block <strong>{blockingAdmin.name}</strong>? 
              They will be immediately logged out and won't be able to login again until unblocked.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for blocking (optional)
              </label>
              <textarea
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                rows="3"
                placeholder="Enter reason for blocking this admin..."
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={confirmBlock}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
              >
                Confirm Block
              </button>
              <button
                onClick={() => {
                  setBlockingAdmin(null);
                  setBlockReason('');
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminManagement;

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const TechnicianDashboard = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [currentUser]);

  const loadData = async () => {
    if (!currentUser?.email) return;
    try {
      setError('');
      const res = await axios.get(`http://localhost:3000/complaints/technician/${currentUser.email}`);
      setComplaints(res.data || []);
    } catch (err) {
      console.error('Error loading technician complaints:', err);
      setError(err.response?.data?.message || 'Failed to load complaints');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleViewDetails = (complaint) => {
    setSelectedComplaint(complaint);
    setShowDetailsModal(true);
  };

  const handleStartWork = async (complaintId) => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await axios.post(`http://localhost:3000/complaints/${complaintId}/start`);
      setSuccess('Marked as in-progress');
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update complaint');
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (complaintId) => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await axios.post(`http://localhost:3000/complaints/${complaintId}/resolve`);
      setSuccess('Marked as resolved');
      await loadData();
      setShowDetailsModal(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update complaint');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">
                Technician Dashboard
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                Welcome, {currentUser?.name}
              </span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">My Workload</h2>
          {error && <span className="text-sm text-red-600">{error}</span>}
          {success && <span className="text-sm text-green-600">{success}</span>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total" value={complaints.length} color="from-gray-500 to-gray-700" emoji="📋" />
          <StatCard label="Pending" value={complaints.filter(c => c.status === 'assigned').length} color="from-yellow-400 to-amber-500" emoji="⏳" />
          <StatCard label="In Progress" value={complaints.filter(c => c.status === 'in-progress').length} color="from-blue-500 to-indigo-600" emoji="⚙️" />
          <StatCard label="Resolved" value={complaints.filter(c => c.status === 'resolved' || c.status === 'closed').length} color="from-green-500 to-emerald-600" emoji="✅" />
        </div>

        <div className="space-y-4">
          {complaints.length === 0 && (
            <div className="bg-white border border-dashed border-gray-300 rounded-xl p-10 text-center text-gray-500">
              No complaints assigned yet. Please wait for an admin to assign you a task.
            </div>
          )}

          {complaints.map((complaint) => (
            <ComplaintCard
              key={complaint._id}
              complaint={complaint}
              onView={() => handleViewDetails(complaint)}
              onStart={() => handleStartWork(complaint._id)}
              onResolve={() => handleResolve(complaint._id)}
              loading={loading}
            />
          ))}
        </div>
      </div>

      {showDetailsModal && selectedComplaint && (
        <DetailsModal
          complaint={selectedComplaint}
          onClose={() => setShowDetailsModal(false)}
          onStart={() => handleStartWork(selectedComplaint._id)}
          onResolve={() => handleResolve(selectedComplaint._id)}
          loading={loading}
        />
      )}
    </div>
  );
};

const statusMeta = {
  assigned: { label: 'Pending', color: 'bg-amber-100 text-amber-800', bar: 'from-amber-400 to-amber-500' },
  'in-progress': { label: 'In Progress', color: 'bg-blue-100 text-blue-800', bar: 'from-blue-500 to-indigo-600' },
  resolved: { label: 'Resolved', color: 'bg-emerald-100 text-emerald-800', bar: 'from-emerald-500 to-green-600' },
  closed: { label: 'Closed', color: 'bg-emerald-100 text-emerald-800', bar: 'from-emerald-500 to-green-600' },
};

const StatCard = ({ label, value, color, emoji }) => (
  <div className="relative overflow-hidden rounded-xl bg-gradient-to-br shadow-md text-white p-5" style={{ backgroundImage: `linear-gradient(to bottom right, var(--tw-gradient-stops))` }}>
    <div className={`absolute inset-0 opacity-90 bg-gradient-to-br ${color}`} />
    <div className="relative flex items-center justify-between">
      <div>
        <p className="text-sm uppercase tracking-wide font-semibold opacity-90">{label}</p>
        <p className="text-3xl font-bold mt-1">{value}</p>
      </div>
      <div className="text-3xl opacity-90">{emoji}</div>
    </div>
  </div>
);

const ComplaintCard = ({ complaint, onView, onStart, onResolve, loading }) => {
  const meta = statusMeta[complaint.status] || statusMeta.assigned;
  const adminName = complaint.assignedTo?.adminName || 'Unknown Admin';
  const assignedDate = complaint.technicianAssigned?.assignedAt;
  const started = complaint.status === 'in-progress';
  const resolved = complaint.status === 'resolved' || complaint.status === 'closed';

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 hover:shadow-lg transition-shadow">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${meta.color}`}>
              {meta.label}
            </span>
            <span className="text-xs text-gray-500">ID: {complaint._id.slice(-8).toUpperCase()}</span>
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">{complaint.title}</h3>
          <p className="text-gray-600 mb-3 line-clamp-2">{complaint.description}</p>

          <div className="flex flex-wrap gap-2 text-xs text-gray-700 mb-3">
            <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full">{complaint.category}</span>
            <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full">Priority: {complaint.priority}</span>
            <span className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded-full">Admin: {adminName}</span>
          </div>

          <div className="text-sm text-gray-600 space-y-1">
            <div>Assigned on: {assignedDate ? new Date(assignedDate).toLocaleString() : 'N/A'}</div>
            <div>Customer: {complaint.customerName} ({complaint.customerPhone})</div>
            <div>City: {complaint.customerCity}</div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2 w-full md:w-48">
          <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
            <div
              className={`h-full bg-gradient-to-r ${meta.bar} transition-all duration-700`}
              style={{ width: resolved ? '100%' : started ? '66%' : '33%' }}
            />
          </div>
          <button
            onClick={onView}
            className="px-4 py-2 text-sm font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100"
          >
            View details
          </button>
          {complaint.status === 'assigned' && (
            <button
              onClick={onStart}
              disabled={loading}
              className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
            >
              {loading ? 'Updating...' : 'Start work'}
            </button>
          )}
          {complaint.status === 'in-progress' && (
            <button
              onClick={onResolve}
              disabled={loading}
              className="px-4 py-2 text-sm font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:bg-gray-300"
            >
              {loading ? 'Updating...' : 'Mark resolved'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const DetailsModal = ({ complaint, onClose, onStart, onResolve, loading }) => {
  const meta = statusMeta[complaint.status] || statusMeta.assigned;
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-screen overflow-y-auto shadow-xl">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className={`px-3 py-1 text-xs font-semibold rounded-full inline-block ${meta.color}`}>
              {meta.label}
            </p>
            <h3 className="text-2xl font-bold text-gray-900 mt-2">{complaint.title}</h3>
            <p className="text-gray-600 mt-1">{complaint.description}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800 text-xl"
          >
            ×
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <InfoBox label="Category" value={complaint.category} />
          <InfoBox label="Priority" value={complaint.priority} />
          <InfoBox label="Admin" value={complaint.assignedTo?.adminName || 'Unknown'} />
          <InfoBox label="Customer" value={`${complaint.customerName} (${complaint.customerPhone})`} />
          <InfoBox label="City" value={complaint.customerCity} />
          <InfoBox label="Assigned On" value={complaint.technicianAssigned?.assignedAt ? new Date(complaint.technicianAssigned.assignedAt).toLocaleString() : 'N/A'} />
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
          <h4 className="font-semibold text-gray-900 mb-2">Customer Contact</h4>
          <div className="text-sm text-gray-700 space-y-1">
            <div>Email: {complaint.customerEmail}</div>
            <div>Phone: {complaint.customerPhone}</div>
            <div>City: {complaint.customerCity}</div>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          {complaint.status === 'assigned' && (
            <button
              onClick={onStart}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300"
            >
              {loading ? 'Updating...' : 'Start work'}
            </button>
          )}
          {complaint.status === 'in-progress' && (
            <button
              onClick={onResolve}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-300"
            >
              {loading ? 'Updating...' : 'Mark resolved'}
            </button>
          )}
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const InfoBox = ({ label, value }) => (
  <div className="bg-white border border-gray-200 rounded-lg p-3">
    <div className="text-xs text-gray-500 font-semibold uppercase tracking-wide">{label}</div>
    <div className="text-sm text-gray-900 mt-1">{value}</div>
  </div>
);

export default TechnicianDashboard;

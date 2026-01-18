import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

const ComplaintsManagement = () => {
  const { currentUser } = useAuth();
  const [unassignedComplaints, setUnassignedComplaints] = useState([]);
  const [myComplaints, setMyComplaints] = useState([]);
  const [availableTechnicians, setAvailableTechnicians] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('unassigned'); // 'unassigned' or 'assigned'
  const [showTechnicianModal, setShowTechnicianModal] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);

  useEffect(() => {
    loadComplaints();
    const interval = setInterval(loadComplaints, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, [currentUser]);

  const loadComplaints = async () => {
    try {
      // Load unassigned complaints (open status)
      const unassignedRes = await axios.get('http://localhost:3000/complaints/unassigned');
      setUnassignedComplaints(unassignedRes.data);

      // Load complaints taken by this admin
      const myRes = await axios.get(`http://localhost:3000/complaints/admin/${currentUser.email}`);
      setMyComplaints(myRes.data);

      // Load available technicians
      const techRes = await axios.get('http://localhost:3000/technicians/available');
      setAvailableTechnicians(techRes.data);
    } catch (err) {
      console.error('Error loading complaints:', err);
    }
  };

  const handleTakeComplaint = async (complaintId) => {
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await axios.post(`http://localhost:3000/complaints/${complaintId}/assign`, {
        adminEmail: currentUser.email,
        adminName: currentUser.name,
      });

      setSuccess(`Complaint taken successfully! Now assign it to a technician.`);
      setLoading(false);
      
      // Reload complaints
      setTimeout(() => {
        loadComplaints();
        setSuccess('');
      }, 2000);
    } catch (err) {
      setLoading(false);
      const message = err.response?.data?.message || 'Failed to take complaint';
      setError(message);
    }
  };

  const handleAssignTechnician = async (technicianEmail, technicianName) => {
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await axios.post(`http://localhost:3000/complaints/${selectedComplaint._id}/assign-technician`, {
        technicianEmail,
        technicianName,
      });

      setSuccess(`Complaint assigned to ${technicianName} successfully!`);
      setLoading(false);
      setShowTechnicianModal(false);
      setSelectedComplaint(null);
      
      // Reload complaints
      setTimeout(() => {
        loadComplaints();
        setSuccess('');
      }, 2000);
    } catch (err) {
      setLoading(false);
      const message = err.response?.data?.message || 'Failed to assign technician';
      setError(message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-900">Complaints Management</h2>
      </div>

      {/* Messages */}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <span className="flex-1">{success}</span>
          <span className="animate-spin">⏳</span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('unassigned')}
          className={`px-6 py-3 font-semibold border-b-2 transition-colors ${
            activeTab === 'unassigned'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Available Complaints ({unassignedComplaints.length})
        </button>
        <button
          onClick={() => setActiveTab('assigned')}
          className={`px-6 py-3 font-semibold border-b-2 transition-colors ${
            activeTab === 'assigned'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          My Complaints ({myComplaints.length})
        </button>
      </div>

      {/* Tab Content */}
      <div className="grid grid-cols-1 gap-4">
        {activeTab === 'unassigned' && (
          <div>
            {loading && (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin text-2xl">⏳</div>
              </div>
            )}

            {!loading && unassignedComplaints.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No available complaints at this moment.
              </div>
            )}

            {!loading &&
              unassignedComplaints.map((complaint) => (
                <div
                  key={complaint._id}
                  className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        {complaint.title}
                      </h3>
                      <p className="text-gray-600 mb-4">{complaint.description}</p>
                    </div>
                    <div className="flex gap-2">
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-semibold rounded-full">
                        {complaint.category}
                      </span>
                      <span
                        className={`px-3 py-1 text-sm font-semibold rounded-full ${
                          complaint.priority === 'urgent'
                            ? 'bg-red-100 text-red-800'
                            : complaint.priority === 'high'
                            ? 'bg-orange-100 text-orange-800'
                            : complaint.priority === 'medium'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {complaint.priority}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4 text-sm text-gray-600">
                    <div>
                      <span className="font-semibold">Customer:</span>{' '}
                      {complaint.customerName}
                    </div>
                    <div>
                      <span className="font-semibold">Email:</span>{' '}
                      {complaint.customerEmail}
                    </div>
                    <div>
                      <span className="font-semibold">Phone:</span>{' '}
                      {complaint.customerPhone}
                    </div>
                    <div>
                      <span className="font-semibold">City:</span>{' '}
                      {complaint.customerCity}
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={() => handleTakeComplaint(complaint._id)}
                      disabled={loading}
                      className="px-6 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors"
                    >
                      {loading ? 'Taking...' : 'Take Complaint'}
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}

        {activeTab === 'assigned' && (
          <div>
            {loading && (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin text-2xl">⏳</div>
              </div>
            )}

            {!loading && myComplaints.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                You haven't taken any complaints yet.
              </div>
            )}

            {!loading &&
              myComplaints.map((complaint) => (
                <div
                  key={complaint._id}
                  className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        {complaint.title}
                      </h3>
                      <p className="text-gray-600 mb-4">{complaint.description}</p>
                    </div>
                    <div className="flex gap-2">
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-semibold rounded-full">
                        {complaint.category}
                      </span>
                      <span
                        className={`px-3 py-1 text-sm font-semibold rounded-full ${
                          complaint.priority === 'urgent'
                            ? 'bg-red-100 text-red-800'
                            : complaint.priority === 'high'
                            ? 'bg-orange-100 text-orange-800'
                            : complaint.priority === 'medium'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {complaint.priority}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4 text-sm text-gray-600">
                    <div>
                      <span className="font-semibold">Customer:</span>{' '}
                      {complaint.customerName}
                    </div>
                    <div>
                      <span className="font-semibold">Email:</span>{' '}
                      {complaint.customerEmail}
                    </div>
                    <div>
                      <span className="font-semibold">Phone:</span>{' '}
                      {complaint.customerPhone}
                    </div>
                    <div>
                      <span className="font-semibold">Status:</span>{' '}
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                          complaint.status === 'taken'
                            ? 'bg-orange-100 text-orange-800'
                            : complaint.status === 'assigned'
                            ? 'bg-yellow-100 text-yellow-800'
                            : complaint.status === 'in-progress'
                            ? 'bg-blue-100 text-blue-800'
                            : complaint.status === 'resolved'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {complaint.status === 'taken' ? 'Taken by You' : complaint.status}
                      </span>
                    </div>
                  </div>

                  {complaint.assignedTo && complaint.assignedTo.takenAt && (
                    <div className="text-xs text-gray-500 mb-3">
                      Taken on: {new Date(complaint.assignedTo.takenAt).toLocaleString()}
                    </div>
                  )}

                  {complaint.technicianAssigned && complaint.technicianAssigned.technicianName && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg mb-3">
                      <span className="text-sm font-semibold text-green-900">
                        🔧 Assigned to: {complaint.technicianAssigned.technicianName}
                      </span>
                      <span className="text-xs text-green-700 block mt-1">
                        Assigned on: {new Date(complaint.technicianAssigned.assignedAt).toLocaleString()}
                      </span>
                    </div>
                  )}

                  {complaint.status === 'taken' && (
                    <div className="flex justify-end">
                      <button
                        onClick={() => {
                          setSelectedComplaint(complaint);
                          setShowTechnicianModal(true);
                        }}
                        disabled={loading}
                        className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                      >
                        Assign to Technician
                      </button>
                    </div>
                  )}
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Technician Assignment Modal */}
      {showTechnicianModal && selectedComplaint && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full max-h-[80vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">Assign Technician</h3>
            <p className="text-sm text-gray-600 mb-4">
              Complaint: <span className="font-semibold">{selectedComplaint.title}</span>
            </p>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md text-sm mb-4">
                {error}
              </div>
            )}

            <div className="space-y-3 mb-6">
              {availableTechnicians.length === 0 && (
                <div className="text-center py-4 text-gray-500">
                  No technicians found.
                </div>
              )}

              {availableTechnicians.map((technician) => {
                const busy = (technician.activeCount || 0) > 0;
                return (
                  <div
                    key={technician._id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex justify-between items-start gap-3">
                      <div>
                        <h4 className="font-semibold text-gray-900">{technician.name}</h4>
                        <p className="text-sm text-gray-600">{technician.email}</p>
                        <p className="text-xs text-gray-500 mt-1">📞 {technician.phone || 'N/A'}</p>
                        <p className="text-xs text-gray-500">📍 {technician.city || 'N/A'}</p>
                        <p className="text-xs text-gray-500 mt-1">Active complaints: {technician.activeCount || 0}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            busy ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                          }`}
                        >
                          {busy ? `Busy (${technician.activeCount})` : 'Available'}
                        </span>
                        <button
                          onClick={() => handleAssignTechnician(technician.email, technician.name)}
                          disabled={loading || busy}
                          className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-600 transition-colors"
                        >
                          {busy ? 'Engaged' : loading ? 'Assigning...' : 'Assign'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => {
                  setShowTechnicianModal(false);
                  setSelectedComplaint(null);
                  setError('');
                }}
                disabled={loading}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 disabled:bg-gray-200 transition-colors"
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

export default ComplaintsManagement;

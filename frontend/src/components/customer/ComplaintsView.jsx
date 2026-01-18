import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import ComplaintTimeline from './ComplaintTimeline';
import PaymentGateway from './PaymentGateway';

const ComplaintsView = () => {
  const { currentUser } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPaymentGateway, setShowPaymentGateway] = useState(false);
  const [selectedComplaintForPayment, setSelectedComplaintForPayment] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'other',
    priority: 'medium',
  });

  useEffect(() => {
    loadComplaints();
    const interval = setInterval(loadComplaints, 5000); // Auto-refresh every 5 seconds
    return () => clearInterval(interval);
  }, [currentUser]);

  // Handle Stripe redirect success
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get('payment');
    const sessionId = params.get('session_id');
    const complaintId = params.get('complaintId');

    if (paymentStatus === 'success' && sessionId && complaintId) {
      setSuccess('Confirming payment...');
      axios.post('http://localhost:3000/payments/stripe/confirm', {
        sessionId,
        complaintId,
      })
      .then(() => {
        setSuccess('Payment completed successfully');
        loadComplaints();
      })
      .catch((err) => {
        const message = err.response?.data?.message || 'Unable to confirm payment';
        setError(message);
      })
      .finally(() => {
        params.delete('payment');
        params.delete('session_id');
        params.delete('complaintId');
        const newUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}`;
        window.history.replaceState(null, '', newUrl);
        setTimeout(() => setSuccess(''), 3000);
      });
    }
  }, []);

  const loadComplaints = async () => {
    try {
      const response = await axios.get(`http://localhost:3000/complaints/customer/${currentUser.email}`);
      setComplaints(response.data);
    } catch (err) {
      console.error('Error loading complaints:', err);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const complaintData = {
        customerEmail: currentUser.email,
        customerName: currentUser.name,
        customerPhone: currentUser.phone || 'N/A',
        customerCity: currentUser.city || 'N/A',
        title: formData.title,
        description: formData.description,
        category: formData.category,
        priority: formData.priority,
      };

      await axios.post('http://localhost:3000/complaints/create', complaintData);
      
      setSuccess('Complaint submitted successfully! An admin will take it soon.');
      setLoading(false);
      setShowModal(false);
      setFormData({
        title: '',
        description: '',
        category: 'other',
        priority: 'medium',
      });
      
      loadComplaints();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setLoading(false);
      const message = err.response?.data?.message || 'Failed to submit complaint';
      setError(message);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">My Complaints</h2>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Submit New Complaint
        </button>
      </div>

      {/* Messages */}
      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-sm font-medium text-gray-500 mb-2">
            Total Complaints
          </h3>
          <p className="text-3xl font-bold text-gray-900">{complaints.length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Pending</h3>
          <p className="text-3xl font-bold text-yellow-600">
            {complaints.filter((c) => c.status === 'open' || c.status === 'taken').length}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-sm font-medium text-gray-500 mb-2">In Progress</h3>
          <p className="text-3xl font-bold text-blue-600">
            {complaints.filter((c) => c.status === 'assigned' || c.status === 'in-progress').length}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Resolved</h3>
          <p className="text-3xl font-bold text-green-600">
            {complaints.filter((c) => c.status === 'resolved' || c.status === 'closed').length}
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {complaints.length === 0 && (
          <div className="text-center py-8 text-gray-500 bg-white rounded-lg shadow-md">
            No complaints yet. Submit your first complaint above!
          </div>
        )}

        {complaints.map((complaint) => (
          <div
            key={complaint._id}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-4 bg-gray-50 rounded-xl border-2 border-gray-200"
          >
            {/* Complaint Details */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-md">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {complaint.title}
                  </h3>
                  <p className="text-gray-600 mb-3">{complaint.description}</p>
                </div>
              </div>

              <div className="flex gap-2 flex-wrap mb-4">
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
                  Priority: {complaint.priority}
                </span>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-700">Complaint ID:</span>
                  <span className="text-gray-600 font-mono text-xs">{complaint._id.slice(-8).toUpperCase()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-700">Submitted:</span>
                  <span className="text-gray-600">
                    {new Date(complaint.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {complaint.assignedTo && complaint.assignedTo.adminName && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <span className="text-sm font-semibold text-blue-900 block">
                    👤 Admin: {complaint.assignedTo.adminName}
                  </span>
                  <span className="text-xs text-blue-700">
                    {complaint.assignedTo.adminEmail}
                  </span>
                </div>
              )}

              {complaint.technicianAssigned && complaint.technicianAssigned.technicianName && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <span className="text-sm font-semibold text-green-900 block">
                    🔧 Technician: {complaint.technicianAssigned.technicianName}
                  </span>
                  <span className="text-xs text-green-700">
                    {complaint.technicianAssigned.technicianEmail}
                  </span>
                  {complaint.technicianAssigned.technicianPhone && (
                    <span className="text-xs text-green-700 block">
                      📞 {complaint.technicianAssigned.technicianPhone}
                    </span>
                  )}
                </div>
              )}

              {complaint.status === 'resolved' && complaint.payment?.status !== 'completed' && (
                <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-amber-900">Payment Required</div>
                    <div className="text-xs text-amber-700">Amount: ₹{complaint.payment?.amount || complaint.totalAmount || 500}</div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedComplaintForPayment(complaint);
                      setShowPaymentGateway(true);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700"
                  >
                    Pay with Stripe
                  </button>
                </div>
              )}
            </div>

            {/* Timeline */}
            <ComplaintTimeline complaint={complaint} />
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">Submit New Complaint</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Brief title for your issue"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="electrical">Electrical</option>
                  <option value="plumbing">Plumbing</option>
                  <option value="cleaning">Cleaning</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  rows="4"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Describe your issue in detail..."
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 p-3 rounded-md text-sm text-blue-800">
                <p className="font-semibold mb-1">📋 Note:</p>
                <p>Your complaint will be visible to all admins. An admin will take it and work on resolving it.</p>
              </div>

              <div className="flex space-x-2 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                >
                  {loading ? 'Submitting...' : 'Submit Complaint'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setError('');
                  }}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 disabled:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md text-sm">
                  {error}
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {showPaymentGateway && selectedComplaintForPayment && (
        <PaymentGateway
          complaint={selectedComplaintForPayment}
          onClose={() => {
            setShowPaymentGateway(false);
            setSelectedComplaintForPayment(null);
          }}
        />
      )}
    </div>
  );
};

export default ComplaintsView;

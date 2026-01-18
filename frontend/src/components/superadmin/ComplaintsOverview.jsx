import { useState, useEffect } from 'react';
import axios from 'axios';

const ComplaintsOverview = () => {
  const [complaints, setComplaints] = useState([]);
  const [filteredComplaints, setFilteredComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState(300);
  const [paymentNotes, setPaymentNotes] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);
  const [statistics, setStatistics] = useState(null);

  useEffect(() => {
    fetchComplaints();
    fetchStatistics();
  }, []);

  useEffect(() => {
    filterComplaints();
  }, [complaints, filter, searchTerm]);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:3000/superadmin/complaints/all');
      setComplaints(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch complaints');
      setLoading(false);
      console.error('Error fetching complaints:', err);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await axios.get('http://localhost:3000/superadmin/statistics');
      setStatistics(response.data);
    } catch (err) {
      console.error('Error fetching statistics:', err);
    }
  };

  const filterComplaints = () => {
    let filtered = [...complaints];

    // Apply status filter
    if (filter !== 'all') {
      filtered = filtered.filter(c => c.status === filter);
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(c =>
        c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.customerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.assignedTo?.adminName && c.assignedTo.adminName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (c.technicianAssigned?.technicianName && c.technicianAssigned.technicianName.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    setFilteredComplaints(filtered);
  };

  const handlePayTechnician = async (complaintId) => {
    try {
      setProcessingPayment(true);
      await axios.post(`http://localhost:3000/superadmin/complaints/${complaintId}/pay-technician`, {
        amount: paymentAmount,
        paidBy: 'admin',
        notes: paymentNotes || 'Payment completed by admin'
      });
      
      setPaymentAmount(300);
      setPaymentNotes('');
      setSelectedComplaint(null);
      fetchComplaints();
      setProcessingPayment(false);
    } catch (err) {
      console.error('Error paying technician:', err);
      alert('Failed to process payment');
      setProcessingPayment(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'open': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'taken': 'bg-blue-100 text-blue-800 border-blue-300',
      'assigned': 'bg-purple-100 text-purple-800 border-purple-300',
      'in-progress': 'bg-indigo-100 text-indigo-800 border-indigo-300',
      'resolved': 'bg-green-100 text-green-800 border-green-300',
      'closed': 'bg-gray-100 text-gray-800 border-gray-300'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'urgent': 'bg-red-500 text-white',
      'high': 'bg-orange-500 text-white',
      'medium': 'bg-yellow-500 text-white',
      'low': 'bg-green-500 text-white'
    };
    return colors[priority] || 'bg-gray-500 text-white';
  };

  const getPaymentStatusColor = (status) => {
    const colors = {
      'completed': 'text-green-600',
      'pending': 'text-yellow-600',
      'failed': 'text-red-600'
    };
    return colors[status] || 'text-gray-600';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Total Complaints</p>
                <h3 className="text-3xl font-bold mt-2">{statistics.complaints.total}</h3>
              </div>
              <div className="bg-blue-400 bg-opacity-50 rounded-full p-3">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Closed</p>
                <h3 className="text-3xl font-bold mt-2">{statistics.complaints.closed}</h3>
              </div>
              <div className="bg-green-400 bg-opacity-50 rounded-full p-3">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">In Progress</p>
                <h3 className="text-3xl font-bold mt-2">{statistics.complaints.inProgress}</h3>
              </div>
              <div className="bg-purple-400 bg-opacity-50 rounded-full p-3">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-pink-100 text-sm font-medium">Total Revenue</p>
                <h3 className="text-3xl font-bold mt-2">₹{statistics.revenue}</h3>
              </div>
              <div className="bg-pink-400 bg-opacity-50 rounded-full p-3">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by complaint, customer, admin, or technician..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {['all', 'open', 'taken', 'assigned', 'in-progress', 'resolved', 'closed'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === status
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Complaints Grid */}
      <div className="grid grid-cols-1 gap-4">
        {filteredComplaints.map((complaint) => (
          <div
            key={complaint._id}
            className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow overflow-hidden border-l-4"
            style={{
              borderLeftColor: complaint.priority === 'urgent' ? '#ef4444' :
                              complaint.priority === 'high' ? '#f97316' :
                              complaint.priority === 'medium' ? '#eab308' : '#22c55e'
            }}
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-gray-900 truncate">{complaint.title}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPriorityColor(complaint.priority)}`}>
                      {complaint.priority}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm">{complaint.description}</p>
                </div>
                <span className={`px-4 py-2 rounded-lg text-sm font-semibold border ${getStatusColor(complaint.status)}`}>
                  {complaint.status}
                </span>
              </div>

              {/* Complaint Lifecycle Timeline */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 mb-4">
                <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Complaint Lifecycle
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Customer Info */}
                  <div className="bg-white rounded-lg p-3 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="bg-blue-500 rounded-full p-1">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <h5 className="font-semibold text-sm text-gray-700">Customer</h5>
                    </div>
                    <p className="text-sm font-medium text-gray-900">{complaint.customerName}</p>
                    <p className="text-xs text-gray-600">{complaint.customerEmail}</p>
                    <p className="text-xs text-gray-600">{complaint.customerPhone}</p>
                    <p className="text-xs text-blue-600 font-medium mt-1">📍 {complaint.customerCity}</p>
                  </div>

                  {/* Admin Info */}
                  <div className="bg-white rounded-lg p-3 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="bg-purple-500 rounded-full p-1">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                      </div>
                      <h5 className="font-semibold text-sm text-gray-700">Admin</h5>
                    </div>
                    {complaint.assignedTo ? (
                      <>
                        <p className="text-sm font-medium text-gray-900">{complaint.assignedTo.adminName}</p>
                        <p className="text-xs text-gray-600">{complaint.assignedTo.adminEmail}</p>
                        <p className="text-xs text-green-600 mt-1">
                          ✓ Taken {new Date(complaint.assignedTo.takenAt).toLocaleDateString()}
                        </p>
                      </>
                    ) : (
                      <p className="text-xs text-gray-400 italic">Not assigned yet</p>
                    )}
                  </div>

                  {/* Technician Info */}
                  <div className="bg-white rounded-lg p-3 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="bg-green-500 rounded-full p-1">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <h5 className="font-semibold text-sm text-gray-700">Technician</h5>
                    </div>
                    {complaint.technicianAssigned ? (
                      <>
                        <p className="text-sm font-medium text-gray-900">{complaint.technicianAssigned.technicianName}</p>
                        <p className="text-xs text-gray-600">{complaint.technicianAssigned.technicianEmail}</p>
                        <p className="text-xs text-gray-600">{complaint.technicianAssigned.technicianPhone}</p>
                        <p className="text-xs text-green-600 mt-1">
                          ✓ Assigned {new Date(complaint.technicianAssigned.assignedAt).toLocaleDateString()}
                        </p>
                      </>
                    ) : (
                      <p className="text-xs text-gray-400 italic">Not assigned yet</p>
                    )}
                  </div>

                  {/* Status Progress */}
                  <div className="bg-white rounded-lg p-3 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="bg-indigo-500 rounded-full p-1">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      </div>
                      <h5 className="font-semibold text-sm text-gray-700">Progress</h5>
                    </div>
                    <div className="space-y-1">
                      {complaint.status === 'resolved' || complaint.status === 'closed' ? (
                        <p className="text-xs text-green-600 font-medium">✓ Task Resolved</p>
                      ) : (
                        <p className="text-xs text-gray-400">○ Not resolved yet</p>
                      )}
                      {complaint.status === 'closed' ? (
                        <p className="text-xs text-green-600 font-medium">✓ Task Closed</p>
                      ) : (
                        <p className="text-xs text-gray-400">○ Not closed yet</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Information */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Payment Status
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Customer Payment */}
                  <div className="bg-white rounded-lg p-3 shadow-sm">
                    <h5 className="font-semibold text-sm text-gray-700 mb-2">Customer Payment</h5>
                    <div className="space-y-1">
                      <p className={`text-sm font-bold ${getPaymentStatusColor(complaint.payment?.status || 'pending')}`}>
                        {complaint.payment?.status === 'completed' ? '✓ Paid' : '○ Pending'}
                      </p>
                      <p className="text-sm text-gray-700">Amount: ₹{complaint.payment?.amount || complaint.totalAmount}</p>
                      {complaint.payment?.paidAt && (
                        <p className="text-xs text-gray-600">
                          Paid on: {new Date(complaint.payment.paidAt).toLocaleDateString()}
                        </p>
                      )}
                      {complaint.payment?.transactionId && (
                        <p className="text-xs text-gray-600 font-mono">
                          Txn: {complaint.payment.transactionId.substring(0, 20)}...
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Technician Payment */}
                  <div className="bg-white rounded-lg p-3 shadow-sm">
                    <h5 className="font-semibold text-sm text-gray-700 mb-2">Technician Payment</h5>
                    <div className="space-y-1">
                      <p className={`text-sm font-bold ${getPaymentStatusColor(complaint.technicianPayment?.status || 'pending')}`}>
                        {complaint.technicianPayment?.status === 'completed' ? '✓ Paid' : '○ Pending'}
                      </p>
                      <p className="text-sm text-gray-700">Amount: ₹{complaint.technicianPayment?.amount || 300}</p>
                      {complaint.technicianPayment?.paidAt && (
                        <p className="text-xs text-gray-600">
                          Paid on: {new Date(complaint.technicianPayment.paidAt).toLocaleDateString()}
                        </p>
                      )}
                      {complaint.technicianAssigned && complaint.technicianPayment?.status !== 'completed' && complaint.status === 'closed' && (
                        <button
                          onClick={() => {
                            setSelectedComplaint(complaint._id);
                            setPaymentAmount(300);
                            setPaymentNotes('');
                          }}
                          className="mt-2 w-full px-3 py-1.5 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors text-sm font-medium"
                        >
                          Mark as Paid
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Metadata */}
              <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  {complaint.category}
                </span>
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Created: {new Date(complaint.createdAt).toLocaleString()}
                </span>
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Updated: {new Date(complaint.updatedAt).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredComplaints.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No complaints found</h3>
          <p className="mt-1 text-sm text-gray-500">Try adjusting your filters or search terms.</p>
        </div>
      )}

      {/* Payment Modal */}
      {selectedComplaint && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Pay Technician</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Amount (₹)
                </label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (optional)
                </label>
                <textarea
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  rows="3"
                  placeholder="Add any payment notes..."
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => handlePayTechnician(selectedComplaint)}
                  disabled={processingPayment}
                  className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium disabled:opacity-50"
                >
                  {processingPayment ? 'Processing...' : 'Confirm Payment'}
                </button>
                <button
                  onClick={() => {
                    setSelectedComplaint(null);
                    setPaymentAmount(300);
                    setPaymentNotes('');
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComplaintsOverview;

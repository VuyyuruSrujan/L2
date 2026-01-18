import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const FeedbackView = () => {
  const { currentUser } = useAuth();
  const [feedbacks, setFeedbacks] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resolvedComplaints, setResolvedComplaints] = useState([]);
  const [formData, setFormData] = useState({
    rating: 5,
    comment: '',
    complaintId: '',
  });

  useEffect(() => {
    loadData();
  }, [currentUser]);

  const feedbackComplaintIds = new Set(
    feedbacks.map((f) => (f.complaintId ? f.complaintId.toString() : ''))
  );
  const eligibleResolvedComplaints = resolvedComplaints.filter(
    (c) => !feedbackComplaintIds.has(c._id?.toString())
  );

  const loadData = async () => {
    if (!currentUser) return;
    setError('');
    try {
      const [feedbackRes, complaintsRes] = await Promise.all([
        axios.get(`http://localhost:3000/feedbacks/customer/${currentUser.id}`, {
          params: { email: currentUser.email },
        }),
        axios.get(`http://localhost:3000/complaints/customer/${currentUser.email}`),
      ]);

      const feedbackList = feedbackRes.data || [];
      setFeedbacks(feedbackList);

      const resolved = (complaintsRes.data || []).filter(
        (c) => c.status === 'resolved'
      );
      setResolvedComplaints(resolved);

      const responseFeedbackIds = new Set(
        feedbackList.map((f) => (f.complaintId ? f.complaintId.toString() : ''))
      );
      const firstEligible = resolved.find(
        (c) => !responseFeedbackIds.has(c._id?.toString())
      );
      setFormData((prev) => ({ ...prev, complaintId: firstEligible?._id || '' }));
    } catch (err) {
      const message = err.response?.data?.message || 'Unable to load feedbacks';
      setError(message);
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

    if (!formData.complaintId) {
      setError('Select a resolved complaint to review.');
      setLoading(false);
      return;
    }

    try {
      await axios.post('http://localhost:3000/feedbacks/create', {
        userId: currentUser.id,
        userEmail: currentUser.email,
        userName: currentUser.name,
        userRole: currentUser.role,
        rating: formData.rating,
        comment: formData.comment,
        complaintId: formData.complaintId,
      });

      setSuccess('Thanks for sharing your feedback!');
      setShowModal(false);
      setFormData({ rating: 5, comment: '', complaintId: '' });
      await loadData();
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to submit feedback';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">My Feedbacks</h2>
        <button
          onClick={() => setShowModal(true)}
          disabled={eligibleResolvedComplaints.length === 0}
          className={`px-4 py-2 rounded-md text-white transition-colors ${
            eligibleResolvedComplaints.length === 0
              ? 'bg-blue-300 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {eligibleResolvedComplaints.length === 0
            ? 'No resolved complaints'
            : 'Add Feedback'}
        </button>
      </div>

      <p className="text-sm text-gray-600 mb-4">
        You can submit feedback only after a complaint is resolved (before payment).
      </p>

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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-sm font-medium text-gray-500 mb-2">
            Total Feedbacks
          </h3>
          <p className="text-3xl font-bold text-gray-900">{feedbacks.length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-sm font-medium text-gray-500 mb-2">
            Average Rating
          </h3>
          <p className="text-3xl font-bold text-yellow-600">
            {feedbacks.length > 0
              ? (
                  feedbacks.reduce((acc, f) => acc + f.rating, 0) /
                  feedbacks.length
                ).toFixed(1)
              : '0'}{' '}
            / 5
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {feedbacks.map((feedback) => (
          <div key={feedback._id || feedback.id} className="bg-white shadow-md rounded-lg p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <span className="text-yellow-400 text-xl">
                  {'★'.repeat(feedback.rating)}
                </span>
                <span className="text-gray-300 text-xl">
                  {'★'.repeat(5 - feedback.rating)}
                </span>
              </div>
              <span className="text-sm text-gray-500">
                {new Date(feedback.createdAt).toLocaleDateString()}
              </span>
            </div>
            <p className="text-gray-700">{feedback.comment}</p>
            {feedback.complaintTitle && (
              <p className="text-sm text-gray-500 mt-2">Complaint: {feedback.complaintTitle}</p>
            )}
          </div>
        ))}
        {feedbacks.length === 0 && (
          <div className="bg-white shadow-md rounded-lg p-12 text-center">
            <p className="text-gray-500">No feedbacks yet</p>
            <p className="text-sm text-gray-400 mt-2">
              Share your experience with us!
            </p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Add Feedback</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Resolved Complaint
                </label>
                <select
                  value={formData.complaintId}
                  onChange={(e) => setFormData({ ...formData, complaintId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="" disabled>
                    Select a resolved complaint
                  </option>
                  {eligibleResolvedComplaints.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rating
                </label>
                <div className="flex items-center space-x-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFormData({ ...formData, rating: star })}
                      className={`text-3xl transition-colors ${
                        star <= formData.rating
                          ? 'text-yellow-400'
                          : 'text-gray-300'
                      } hover:text-yellow-400`}
                    >
                      ★
                    </button>
                  ))}
                  <span className="ml-2 text-gray-600">({formData.rating}/5)</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Your Feedback
                </label>
                <textarea
                  name="comment"
                  value={formData.comment}
                  onChange={handleInputChange}
                  required
                  rows="4"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Tell us about your experience..."
                />
              </div>
              <div className="flex space-x-2 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className={`flex-1 px-4 py-2 rounded-md transition-colors text-white ${
                    loading
                      ? 'bg-blue-300 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {loading ? 'Submitting...' : 'Submit'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeedbackView;

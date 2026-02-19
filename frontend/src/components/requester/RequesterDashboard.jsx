import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import Notifications from '../Notifications';
import VolunteerLocationMap from './VolunteerLocationMap';
import Chat from '../Chat';
import ChatList from '../ChatList';

const RequesterDashboard = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('create');
  const [helpRequests, setHelpRequests] = useState([]);
  const [statistics, setStatistics] = useState({});
  const [loading, setLoading] = useState(false);

  // Chat state
  const [showChat, setShowChat] = useState(false);
  const [selectedChatUser, setSelectedChatUser] = useState(null);
  const [chatOpenForRequest, setChatOpenForRequest] = useState(null);

  // Rating modal state
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingRequest, setRatingRequest] = useState(null);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);

  // Reviews state
  const [myReviews, setMyReviews] = useState([]);

  // Form state for creating help request
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'other',
    urgency: 'medium',
    latitude: '',
    longitude: '',
    address: ''
  });

  useEffect(() => {
    if (activeTab === 'myRequests') {
      fetchMyRequests();
    } else if (activeTab === 'create') {
      fetchStatistics();
    } else if (activeTab === 'myReviews') {
      fetchMyReviews();
    }
  }, [activeTab]);

  const fetchMyRequests = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:3000/help-requests/requester/${currentUser.email}`);
      setHelpRequests(response.data);
    } catch (error) {
      console.error('Error fetching requests:', error);
      alert('Failed to fetch your requests');
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await axios.get(`http://localhost:3000/statistics?role=requester&email=${currentUser.email}`);
      setStatistics(response.data);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  const fetchMyReviews = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:3000/feedbacks/user/${currentUser.id}?ratedUser=false`);
      setMyReviews(response.data);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      alert('Failed to fetch your reviews');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData({
            ...formData,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
          alert('Location captured successfully!');
        },
        (error) => {
          alert('Unable to get location. Please enter manually.');
        }
      );
    } else {
      alert('Geolocation is not supported by your browser');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.latitude || !formData.longitude) {
      alert('Please provide location coordinates');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post('http://localhost:3000/help-requests/create', {
        requesterEmail: currentUser.email,
        requesterName: currentUser.name,
        requesterPhone: currentUser.phone,
        requesterCity: currentUser.city,
        title: formData.title,
        description: formData.description,
        category: formData.category,
        urgency: formData.urgency,
        location: {
          latitude: parseFloat(formData.latitude),
          longitude: parseFloat(formData.longitude),
          address: formData.address
        }
      });

      alert('Help request created successfully!');
      setFormData({
        title: '',
        description: '',
        category: 'other',
        urgency: 'medium',
        latitude: '',
        longitude: '',
        address: ''
      });
      setActiveTab('myRequests');
    } catch (error) {
      console.error('Error creating request:', error);
      alert(error.response?.data?.message || 'Failed to create help request');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSelectChat = (userId, userName) => {
    setSelectedChatUser({ id: userId, name: userName });
    setShowChat(true);
  };

  const handleCloseChat = () => {
    setShowChat(false);
    setSelectedChatUser(null);
  };

  const toggleChatForRequest = (requestId) => {
    if (chatOpenForRequest === requestId) {
      setChatOpenForRequest(null);
    } else {
      setChatOpenForRequest(requestId);
    }
  };

  const handlePay = (request) => {
    (async () => {
      try {
        const body = { requestId: request._id || request.id, amount: 100 };
        const res = await fetch('http://localhost:3000/payments/create-checkout-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
        const data = await res.json();
        if (data && data.url) {
          window.location.href = data.url;
        } else {
          alert('Failed to create checkout session');
        }
      } catch (err) {
        console.error('Payment redirect error:', err);
        alert('Error initiating payment');
      }
    })();
  };

  const handleRate = (request) => {
    setRatingRequest(request);
    setRating(0);
    setComment('');
    setShowRatingModal(true);
  };

  const handleSubmitRating = async () => {
    if (rating === 0) {
      alert('Please select a rating');
      return;
    }
    if (!comment.trim()) {
      alert('Please provide a comment');
      return;
    }

    try {
      setSubmittingRating(true);
      const response = await axios.post('http://localhost:3000/feedbacks/create', {
        userId: currentUser.id,
        userEmail: currentUser.email,
        userName: currentUser.name,
        userRole: 'requester',
        helpRequestId: ratingRequest._id,
        helpRequestTitle: ratingRequest.title,
        ratedUserId: ratingRequest.assignedVolunteer.volunteerId,
        ratedUserRole: 'volunteer',
        rating: rating,
        comment: comment.trim()
      });

      alert('Rating submitted successfully! Thank you for your feedback.');
      setShowRatingModal(false);
      setRatingRequest(null);
      setRating(0);
      setComment('');
      fetchMyRequests(); // Refresh the list
    } catch (error) {
      console.error('Error submitting rating:', error);
      alert(error.response?.data?.message || 'Failed to submit rating');
    } finally {
      setSubmittingRating(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'bg-yellow-100 text-yellow-800';
      case 'accepted': return 'bg-blue-100 text-blue-800';
      case 'in-progress': return 'bg-purple-100 text-purple-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'urgent': return 'text-red-600 font-bold';
      case 'high': return 'text-orange-600 font-semibold';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-blue-600 text-white shadow-lg">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Local Support App</h1>
            <p className="text-sm">Welcome, {currentUser?.name}!</p>
          </div>
          <div className="flex items-center gap-3">
            <Notifications />
            <button
              onClick={() => navigate('/requester/profile')}
              className="bg-blue-700 hover:bg-blue-800 px-4 py-2 rounded-lg transition"
            >
              My Profile
            </button>
            <button
              onClick={handleLogout}
              className="bg-blue-700 hover:bg-blue-800 px-4 py-2 rounded-lg transition"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white shadow">
        <div className="container mx-auto px-4">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('create')}
              className={`py-4 px-2 border-b-2 font-medium ${
                activeTab === 'create'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Create Request
            </button>
            <button
              onClick={() => setActiveTab('myRequests')}
              className={`py-4 px-2 border-b-2 font-medium ${
                activeTab === 'myRequests'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              My Requests
            </button>
            <button
              onClick={() => setActiveTab('messages')}
              className={`py-4 px-2 border-b-2 font-medium ${
                activeTab === 'messages'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              💬 Messages
            </button>
            <button
              onClick={() => setActiveTab('myReviews')}
              className={`py-4 px-2 border-b-2 font-medium ${
                activeTab === 'myReviews'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              ⭐ My Reviews
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {activeTab === 'create' && (
          <div className="max-w-3xl mx-auto">
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-gray-500 text-sm font-medium">Total Requests</h3>
                <p className="text-3xl font-bold text-gray-900">{statistics.totalRequests || 0}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-gray-500 text-sm font-medium">Completed</h3>
                <p className="text-3xl font-bold text-green-600">{statistics.completed || 0}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-gray-500 text-sm font-medium">Pending</h3>
                <p className="text-3xl font-bold text-yellow-600">{statistics.pending || 0}</p>
              </div>
            </div>

            {/* Create Request Form */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-6">Request Help</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Brief description of help needed"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows="4"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Provide detailed information about the help you need"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="medical">Medical Assistance</option>
                      <option value="transportation">Transportation</option>
                      <option value="grocery">Grocery Shopping</option>
                      <option value="technical">Technical Help</option>
                      <option value="companionship">Companionship</option>
                      <option value="emergency">Emergency</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Urgency <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="urgency"
                      value={formData.urgency}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={getCurrentLocation}
                    className="mb-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
                  >
                    📍 Get Current Location
                  </button>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="number"
                      step="any"
                      name="latitude"
                      value={formData.latitude}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Latitude"
                      required
                    />
                    <input
                      type="number"
                      step="any"
                      name="longitude"
                      value={formData.longitude}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Longitude"
                      required
                    />
                  </div>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Address (optional)"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:bg-gray-400"
                >
                  {loading ? 'Creating...' : 'Submit Request'}
                </button>
              </form>
            </div>
          </div>
        )}

        {activeTab === 'myRequests' && (
          <div>
            <h2 className="text-2xl font-bold mb-6">My Help Requests</h2>
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            ) : helpRequests.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <p className="text-gray-500">You haven't created any help requests yet.</p>
                <button
                  onClick={() => setActiveTab('create')}
                  className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                >
                  Create Your First Request
                </button>
              </div>
            ) : (
              <div className="grid gap-4">
                {helpRequests.map((request) => (
                  <div key={request._id} className="bg-white rounded-lg shadow-lg p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{request.title}</h3>
                        <p className="text-sm text-gray-500">
                          {new Date(request.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(request.status)}`}>
                          {request.status.toUpperCase()}
                        </span>
                        <span className={`text-sm ${getUrgencyColor(request.urgency)}`}>
                          {request.urgency.toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <p className="text-gray-700 mb-4">{request.description}</p>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-semibold">Category:</span> {request.category}
                      </div>
                      <div>
                        <span className="font-semibold">Location:</span> {request.location.address || `${request.location.latitude}, ${request.location.longitude}`}
                      </div>
                    </div>
                    {request.assignedVolunteer && (
                      <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">Assigned Volunteer:</h4>
                          <div className="bg-blue-50 p-3 rounded">
                            <p><span className="font-medium">Name:</span> {request.assignedVolunteer.volunteerName}</p>
                            <p><span className="font-medium">Phone:</span> {request.assignedVolunteer.volunteerPhone}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              Accepted: {new Date(request.assignedVolunteer.acceptedAt).toLocaleString()}
                            </p>
                            {request.meetLink && (
                              <a
                                href="https://meet.google.com/nyn-ediw-fsg"
                                target="_blank"
                                rel="noreferrer"
                                className="mt-2 inline-flex items-center text-blue-700 hover:text-blue-900 font-semibold text-sm"
                              >
                                📞 Join Meet
                              </a>
                            )}
                          </div>
                        </div>
                        
                        {/* Chat button for assigned volunteers - replaced by Pay/Rate when completed */}
                        {request.assignedVolunteer && request.assignedVolunteer.volunteerId && (
                          <div className="mb-4">
                            {request.status === 'completed' ? (
                              <div className="grid grid-cols-2 gap-3">
                                <button
                                  onClick={() => handlePay(request)}
                                  className="w-full px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition"
                                >
                                  💳 Pay
                                </button>
                                <button
                                  onClick={() => handleRate(request)}
                                  className="w-full px-4 py-2 rounded-lg bg-yellow-500 text-white hover:bg-yellow-600 transition"
                                >
                                  ⭐ Rate / Review
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => toggleChatForRequest(request._id)}
                                className={`w-full px-4 py-2 rounded-lg transition ${
                                  chatOpenForRequest === request._id
                                    ? 'bg-gray-600 text-white hover:bg-gray-700'
                                    : 'bg-blue-600 text-white hover:bg-blue-700'
                                }`}
                              >
                                {chatOpenForRequest === request._id ? '✖ Close Chat' : '💬 Chat with Volunteer'}
                              </button>
                            )}
                          </div>
                        )}

                        {/* Inline Chat */}
                        {chatOpenForRequest === request._id && request.assignedVolunteer && (
                          <div className="mb-4">
                            <Chat
                              currentUserId={currentUser.id}
                              currentUserModel="Customer"
                              recipientId={request.assignedVolunteer.volunteerId}
                              recipientName={request.assignedVolunteer.volunteerName}
                              helpRequestId={request._id}
                              onClose={() => setChatOpenForRequest(null)}
                            />
                          </div>
                        )}
                        
                        {(request.status === 'in-progress' || request.status === 'accepted') && (
                          <VolunteerLocationMap 
                            requestId={request._id}
                            volunteerInfo={request.assignedVolunteer}
                          />
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Messages Tab */}
        {activeTab === 'messages' && (
          <div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <ChatList
                  currentUserId={currentUser.id}
                  onSelectChat={handleSelectChat}
                />
              </div>
              <div className="lg:col-span-2">
                {showChat && selectedChatUser ? (
                  <Chat
                    currentUserId={currentUser.id}
                    currentUserModel="Customer"
                    recipientId={selectedChatUser.id}
                    recipientName={selectedChatUser.name}
                    onClose={handleCloseChat}
                  />
                ) : (
                  <div className="bg-white rounded-lg shadow-lg p-12 text-center">
                    <svg
                      className="mx-auto h-16 w-16 text-gray-400 mb-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                    <p className="text-gray-500 text-lg">Select a conversation to start chatting</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* My Reviews Tab */}
        {activeTab === 'myReviews' && (
          <div>
            <h2 className="text-2xl font-bold mb-6">My Reviews</h2>
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            ) : myReviews.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <p className="text-gray-500">You haven't submitted any reviews yet.</p>
                <p className="text-sm text-gray-400 mt-2">Complete help requests and rate your volunteers to see reviews here.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {myReviews.map((review) => (
                  <div key={review._id} className="bg-white rounded-lg shadow-lg p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <span
                                key={star}
                                className={`text-2xl ${
                                  star <= review.rating ? 'text-yellow-400' : 'text-gray-300'
                                }`}
                              >
                                ★
                              </span>
                            ))}
                          </div>
                          <span className="text-lg font-semibold text-gray-900">
                            {review.rating}.0
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">
                          {review.helpRequestTitle}
                        </h3>
                        <p className="text-sm text-gray-500">
                          Reviewed on {new Date(review.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="bg-blue-50 px-3 py-1 rounded-full">
                        <p className="text-xs font-medium text-blue-700">Your Review</p>
                      </div>
                    </div>
                    <div className="mt-3">
                      <p className="text-gray-700 italic">"{review.comment}"</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Rating Modal */}
      {showRatingModal && ratingRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <div className="mb-4">
              <h3 className="text-xl font-bold text-gray-900">Rate Your Experience</h3>
              <p className="text-sm text-gray-600 mt-1">
                Rate your experience with {ratingRequest.assignedVolunteer?.volunteerName}
              </p>
            </div>

            {/* Star Rating */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rating <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2 justify-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="text-4xl focus:outline-none transition-transform hover:scale-110"
                  >
                    {star <= (hoverRating || rating) ? (
                      <span className="text-yellow-400">★</span>
                    ) : (
                      <span className="text-gray-300">☆</span>
                    )}
                  </button>
                ))}
              </div>
              {rating > 0 && (
                <p className="text-center mt-2 text-sm text-gray-600">
                  {rating === 1 && "Poor"}
                  {rating === 2 && "Fair"}
                  {rating === 3 && "Good"}
                  {rating === 4 && "Very Good"}
                  {rating === 5 && "Excellent"}
                </p>
              )}
            </div>

            {/* Comment */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Review <span className="text-red-500">*</span>
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows="4"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Share your experience with the volunteer..."
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRatingModal(false);
                  setRatingRequest(null);
                  setRating(0);
                  setComment('');
                }}
                disabled={submittingRating}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitRating}
                disabled={submittingRating || rating === 0 || !comment.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submittingRating ? 'Submitting...' : 'Submit Rating'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RequesterDashboard;

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import Notifications from '../Notifications';
import LocationTracker from './LocationTracker';
import Chat from '../Chat';
import ChatList from '../ChatList';

const VolunteerDashboard = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('available');
  const [availableRequests, setAvailableRequests] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [statistics, setStatistics] = useState({});
  const [loading, setLoading] = useState(false);
  const [isAvailable, setIsAvailable] = useState(currentUser?.isAvailable || true);
  const [selectedFilters, setSelectedFilters] = useState({
    category: '',
    city: currentUser?.city || ''
  });
  const [trackingRequestId, setTrackingRequestId] = useState(null);
  
  // Chat state
  const [showChat, setShowChat] = useState(false);
  const [selectedChatUser, setSelectedChatUser] = useState(null);
  const [chatOpenForRequest, setChatOpenForRequest] = useState(null);

  // Ratings state
  const [ratings, setRatings] = useState([]);

  useEffect(() => {
    if (activeTab === 'available') {
      fetchAvailableRequests();
    } else if (activeTab === 'myRequests') {
      fetchMyRequests();
    } else if (activeTab === 'ratings') {
      fetchRatings();
    }
    fetchStatistics();
  }, [activeTab, selectedFilters]);

  const fetchAvailableRequests = async () => {
    try {
      setLoading(true);
      let url = 'http://localhost:3000/help-requests/open?';
      if (selectedFilters.city) url += `city=${selectedFilters.city}&`;
      if (selectedFilters.category) url += `category=${selectedFilters.category}`;
      
      const response = await axios.get(url);
      setAvailableRequests(response.data);
    } catch (error) {
      console.error('Error fetching available requests:', error);
      alert('Failed to fetch available requests');
    } finally {
      setLoading(false);
    }
  };

  const fetchMyRequests = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:3000/help-requests/volunteer/${currentUser.email}`);
      setMyRequests(response.data);
    } catch (error) {
      console.error('Error fetching my requests:', error);
      alert('Failed to fetch your accepted requests');
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await axios.get(`http://localhost:3000/statistics?role=volunteer&userId=${currentUser.id}`);
      setStatistics(response.data);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  const fetchRatings = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:3000/feedbacks/user/${currentUser.id}?ratedUser=true`);
      setRatings(response.data);
    } catch (error) {
      console.error('Error fetching ratings:', error);
      alert('Failed to fetch ratings');
    } finally {
      setLoading(false);
    }
  };

  const toggleAvailability = async () => {
    try {
      const response = await axios.post('http://localhost:3000/volunteers/toggle-availability', {
        volunteerId: currentUser.id
      });
      setIsAvailable(response.data.isAvailable);
      alert(response.data.message);
    } catch (error) {
      console.error('Error toggling availability:', error);
      alert('Failed to update availability');
    }
  };

  const acceptRequest = async (requestId) => {
    try {
      const response = await axios.post(`http://localhost:3000/help-requests/${requestId}/accept`, {
        volunteerEmail: currentUser.email,
        volunteerName: currentUser.name,
        volunteerPhone: currentUser.phone
      });
      alert('Request accepted successfully!');
      fetchAvailableRequests();
      setActiveTab('myRequests');
    } catch (error) {
      console.error('Error accepting request:', error);
      alert(error.response?.data?.message || 'Failed to accept request');
    }
  };

  const startLocationTracking = (requestId) => {
    setTrackingRequestId(requestId);
  };

  const stopLocationTracking = () => {
    setTrackingRequestId(null);
  };

  const updateRequestStatus = async (requestId, status) => {
    try {
      if (status === 'in-progress') {
        startLocationTracking(requestId);
      } else if (status === 'completed') {
        stopLocationTracking();
      }
      
      await axios.post(`http://localhost:3000/help-requests/${requestId}/update-status`, {
        status,
        note: `Status updated to ${status} by volunteer`
      });
      alert(`Request marked as ${status}!`);
      fetchMyRequests();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
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

  const toggleChatForRequest = (requestId, userId, userName) => {
    if (chatOpenForRequest === requestId) {
      setChatOpenForRequest(null);
    } else {
      setChatOpenForRequest(requestId);
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

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'medical': return '🏥';
      case 'transportation': return '🚗';
      case 'grocery': return '🛒';
      case 'technical': return '💻';
      case 'companionship': return '🤝';
      case 'emergency': return '🚨';
      default: return '📋';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-green-600 text-white shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">Local Support App - Volunteer</h1>
              <p className="text-sm">Welcome, {currentUser?.name}!</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm">Status:</span>
                <button
                  onClick={toggleAvailability}
                  className={`px-4 py-2 rounded-lg font-semibold transition ${
                    isAvailable
                      ? 'bg-green-700 hover:bg-green-800'
                      : 'bg-gray-600 hover:bg-gray-700'
                  }`}
                >
                  {isAvailable ? '✓ Available' : '✗ Unavailable'}
                </button>
              </div>
              <Notifications />
              <button
                onClick={() => navigate('/volunteer/profile')}
                className="bg-green-700 hover:bg-green-800 px-4 py-2 rounded-lg transition"
              >
                My Profile
              </button>
              <button
                onClick={handleLogout}
                className="bg-green-700 hover:bg-green-800 px-4 py-2 rounded-lg transition"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Statistics Bar */}
      <div className="bg-white shadow">
        <div className="container mx-auto px-4 py-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-sm text-gray-500">Total Accepted</p>
              <p className="text-2xl font-bold text-gray-900">{statistics.totalAccepted || 0}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500">Completed</p>
              <p className="text-2xl font-bold text-green-600">{statistics.completed || 0}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500">In Progress</p>
              <p className="text-2xl font-bold text-blue-600">{statistics.inProgress || 0}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500">Rating</p>
              <p className="text-2xl font-bold text-yellow-600">
                ⭐ {statistics.rating?.average?.toFixed(1) || '0.0'} ({statistics.rating?.count || 0})
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white shadow">
        <div className="container mx-auto px-4">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('available')}
              className={`py-4 px-2 border-b-2 font-medium ${
                activeTab === 'available'
                  ? 'border-green-600 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Available Requests
            </button>
            <button
              onClick={() => setActiveTab('myRequests')}
              className={`py-4 px-2 border-b-2 font-medium ${
                activeTab === 'myRequests'
                  ? 'border-green-600 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              My Accepted Requests
            </button>
            <button
              onClick={() => setActiveTab('messages')}
              className={`py-4 px-2 border-b-2 font-medium ${
                activeTab === 'messages'
                  ? 'border-green-600 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              💬 Messages
            </button>
            <button
              onClick={() => setActiveTab('ratings')}
              className={`py-4 px-2 border-b-2 font-medium ${
                activeTab === 'ratings'
                  ? 'border-green-600 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              ⭐ My Ratings
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {activeTab === 'available' && (
          <div>
            {/* Filters */}
            <div className="bg-white rounded-lg shadow p-4 mb-6">
              <h3 className="font-semibold mb-4">Filters</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={selectedFilters.category}
                    onChange={(e) => setSelectedFilters({ ...selectedFilters, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">All Categories</option>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input
                    type="text"
                    value={selectedFilters.city}
                    onChange={(e) => setSelectedFilters({ ...selectedFilters, city: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Filter by city"
                  />
                </div>
              </div>
            </div>

            <h2 className="text-2xl font-bold mb-6">Available Help Requests</h2>
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
              </div>
            ) : availableRequests.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <p className="text-gray-500">No available requests at the moment.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {availableRequests.map((request) => (
                  <div key={request._id} className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-start gap-3">
                        <span className="text-4xl">{getCategoryIcon(request.category)}</span>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">{request.title}</h3>
                          <p className="text-sm text-gray-500">
                            Posted: {new Date(request.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <span className={`text-sm font-semibold ${getUrgencyColor(request.urgency)}`}>
                        {request.urgency.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-gray-700 mb-4">{request.description}</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm mb-4">
                      <div>
                        <span className="font-semibold">Category:</span> {request.category}
                      </div>
                      <div>
                        <span className="font-semibold">City:</span> {request.requesterCity}
                      </div>
                      <div>
                        <span className="font-semibold">Contact:</span> {request.requesterPhone}
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <button
                        onClick={() => acceptRequest(request._id)}
                        className="bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700 transition"
                      >
                        Accept Request
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'myRequests' && (
          <div>
            <h2 className="text-2xl font-bold mb-6">My Accepted Requests</h2>
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
              </div>
            ) : myRequests.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <p className="text-gray-500">You haven't accepted any requests yet.</p>
                <button
                  onClick={() => setActiveTab('available')}
                  className="mt-4 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
                >
                  Browse Available Requests
                </button>
              </div>
            ) : (
              <div className="grid gap-4">
                {myRequests.map((request) => (
                  <div key={request._id} className="bg-white rounded-lg shadow-lg p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{request.title}</h3>
                        <p className="text-sm text-gray-500">
                          Accepted: {new Date(request.assignedVolunteer?.acceptedAt).toLocaleString()}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(request.status)}`}>
                        {request.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-gray-700 mb-4">{request.description}</p>
                    <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                      <div>
                        <span className="font-semibold">Requester:</span> {request.requesterName}
                      </div>
                      <div>
                        <span className="font-semibold">Phone:</span> {request.requesterPhone}
                      </div>
                      <div>
                        <span className="font-semibold">City:</span> {request.requesterCity}
                      </div>
                      <div>
                        <span className="font-semibold">Category:</span> {request.category}
                      </div>
                    </div>
                    {request.meetLink && (
                      <div className="mb-4">
                        <a
                          href="https://meet.google.com/nyn-ediw-fsg"
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center text-blue-700 hover:text-blue-900 font-semibold text-sm"
                        >
                          📞 Join Meet
                        </a>
                      </div>
                    )}
                    
                    {/* Chat button - always visible for accepted requests */}
                    {(request.status === 'accepted' || request.status === 'in-progress') && (
                      <div className="mb-4">
                        <button
                          onClick={() => toggleChatForRequest(request._id, request.requesterId, request.requesterName)}
                          className={`w-full px-4 py-2 rounded-lg transition ${
                            chatOpenForRequest === request._id
                              ? 'bg-gray-600 text-white hover:bg-gray-700'
                              : 'bg-blue-600 text-white hover:bg-blue-700'
                          }`}
                        >
                          {chatOpenForRequest === request._id ? '✖ Close Chat' : '💬 Chat with Customer'}
                        </button>
                      </div>
                    )}

                    {/* Inline Chat */}
                    {chatOpenForRequest === request._id && (
                      <div className="mb-4">
                        <Chat
                          currentUserId={currentUser.id}
                          currentUserModel="Volunteer"
                          recipientId={request.requesterId}
                          recipientName={request.requesterName}
                          helpRequestId={request._id}
                          onClose={() => setChatOpenForRequest(null)}
                        />
                      </div>
                    )}

                    {request.status === 'accepted' && (
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => updateRequestStatus(request._id, 'in-progress')}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                        >
                          Start Help
                        </button>
                      </div>
                    )}
                    
                    {request.status === 'in-progress' && (
                      <div className="space-y-4">
                        {trackingRequestId === request._id && (
                          <LocationTracker 
                            requestId={request._id}
                            isTracking={true}
                            onStop={stopLocationTracking}
                          />
                        )}
                        {!trackingRequestId && (
                          <button
                            onClick={() => startLocationTracking(request._id)}
                            className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                          >
                            📍 Start Location Sharing
                          </button>
                        )}
                        <div className="flex justify-end">
                          <button
                            onClick={() => updateRequestStatus(request._id, 'completed')}
                            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
                          >
                            Mark as Completed
                          </button>
                        </div>
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
                    currentUserModel="Volunteer"
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

        {/* Ratings Tab */}
        {activeTab === 'ratings' && (
          <div>
            <h2 className="text-2xl font-bold mb-6">My Ratings & Reviews</h2>
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
              </div>
            ) : ratings.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <p className="text-gray-500">No ratings yet. Complete help requests to receive ratings from requesters!</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {ratings.map((rating) => (
                  <div key={rating._id} className="bg-white rounded-lg shadow-lg p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <span
                                key={star}
                                className={`text-2xl ${
                                  star <= rating.rating ? 'text-yellow-400' : 'text-gray-300'
                                }`}
                              >
                                ★
                              </span>
                            ))}
                          </div>
                          <span className="text-lg font-semibold text-gray-900">
                            {rating.rating}.0
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">
                          {rating.helpRequestTitle}
                        </h3>
                        <p className="text-sm text-gray-500">
                          By {rating.userName} • {new Date(rating.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3">
                      <p className="text-gray-700 italic">"{rating.comment}"</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default VolunteerDashboard;

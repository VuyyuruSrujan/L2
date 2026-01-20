import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import ComplaintsView from './ComplaintsView';
import PaymentView from './PaymentView';
import FeedbackView from './FeedbackView';
import Chat from '../Chat';
import ChatList from '../ChatList';

const CustomerDashboard = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('complaints');
  
  // Chat state
  const [showChat, setShowChat] = useState(false);
  const [selectedChatUser, setSelectedChatUser] = useState(null);

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

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">
                Customer Dashboard
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
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('complaints')}
                className={`${
                  activeTab === 'complaints'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
              >
                My Complaints
              </button>
              <button
                onClick={() => setActiveTab('payment')}
                className={`${
                  activeTab === 'payment'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
              >
                Payments
              </button>
              <button
                onClick={() => setActiveTab('feedback')}
                className={`${
                  activeTab === 'feedback'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
              >
                Feedback
              </button>
              <button
                onClick={() => setActiveTab('messages')}
                className={`${
                  activeTab === 'messages'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
              >
                💬 Messages
              </button>
            </nav>
          </div>
        </div>

        <div className="mt-6">
          {activeTab === 'complaints' && <ComplaintsView />}
          {activeTab === 'payment' && <PaymentView />}
          {activeTab === 'feedback' && <FeedbackView />}
          {activeTab === 'messages' && (
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
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerDashboard;

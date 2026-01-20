import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ChatList = ({ currentUserId, onSelectChat }) => {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchChats = async () => {
    if (!currentUserId) return;
    
    try {
      const response = await axios.get(`http://localhost:3000/api/messages/chats/${currentUserId}`);
      setChats(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching chats:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChats();
    
    // Poll for new messages every 5 seconds
    const interval = setInterval(fetchChats, 5000);
    
    return () => clearInterval(interval);
  }, [currentUserId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (chats.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <svg
          className="mx-auto h-12 w-12 text-gray-400 mb-4"
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
        <p className="text-lg font-medium">No conversations yet</p>
        <p className="text-sm mt-2">Start chatting with volunteers or customers</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg">
      <div className="bg-blue-600 text-white px-4 py-3 rounded-t-lg">
        <h3 className="font-semibold text-lg">Messages</h3>
        <p className="text-xs text-blue-100">Click on a conversation to chat</p>
      </div>
      
      <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
        {chats.map((chat) => {
          if (!chat.user) return null;
          
          return (
            <div
              key={chat.userId}
              onClick={() => onSelectChat(chat.userId, chat.user.name)}
              className="p-4 hover:bg-gray-50 cursor-pointer transition"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-semibold text-gray-900 truncate">
                      {chat.user.name}
                    </h4>
                    {chat.unreadCount > 0 && (
                      <span className="ml-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                        {chat.unreadCount}
                      </span>
                    )}
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-1">
                    <span className="inline-block px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                      {chat.user.role || 'User'}
                    </span>
                  </p>
                  
                  {chat.lastMessage && (
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-500 truncate">
                        {chat.lastMessage.message}
                      </p>
                      <span className="text-xs text-gray-400 ml-2 whitespace-nowrap">
                        {new Date(chat.lastMessage.createdAt).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ChatList;

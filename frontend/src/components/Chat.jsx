import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const Chat = ({ currentUserId, currentUserModel, recipientId, recipientName, helpRequestId = null, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const pollingIntervalRef = useRef(null);
  const previousMessageCount = useRef(0);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Fetch messages
  const fetchMessages = async (isInitial = false) => {
    if (!currentUserId || !recipientId) return;
    
    try {
      let url = `http://localhost:3000/api/messages/conversation/${currentUserId}/${recipientId}`;
      if (helpRequestId) {
        url += `?helpRequestId=${helpRequestId}`;
      }
      const response = await axios.get(url);
      const newMessages = response.data;
      
      // Only update if there are actually new messages
      if (JSON.stringify(newMessages) !== JSON.stringify(messages)) {
        setMessages(newMessages);
        
        // Only scroll if there are new messages (count increased)
        if (newMessages.length > previousMessageCount.current) {
          setTimeout(scrollToBottom, 100);
        }
        previousMessageCount.current = newMessages.length;
      }
      
      if (isInitial) {
        setLoading(false);
        previousMessageCount.current = newMessages.length;
        setTimeout(scrollToBottom, 100);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      if (isInitial) setLoading(false);
    }
  };

  // Send message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const response = await axios.post('http://localhost:3000/api/messages/send', {
        senderId: currentUserId,
        senderModel: currentUserModel,
        receiverId: recipientId,
        receiverModel: currentUserModel === 'Customer' ? 'Volunteer' : 'Customer',
        message: newMessage,
        helpRequestId
      });

      const updatedMessages = [...messages, response.data];
      setMessages(updatedMessages);
      previousMessageCount.current = updatedMessages.length;
      setNewMessage('');
      setTimeout(scrollToBottom, 100);
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message');
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchMessages(true);

    // Set up polling every 5 seconds
    pollingIntervalRef.current = setInterval(() => {
      fetchMessages(false);
    }, 5000);

    // Cleanup
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [currentUserId, recipientId]);

  // Remove the auto-scroll on messages change - we now handle it in fetchMessages and handleSendMessage

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="bg-blue-600 text-white px-4 py-3 rounded-t-lg flex justify-between items-center">
        <div>
          <h3 className="font-semibold text-lg">{recipientName}</h3>
          <p className="text-xs text-blue-100">Messages refresh every 5 seconds</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 text-2xl font-bold"
          >
            ×
          </button>
        )}
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50" style={{ maxHeight: '500px' }}>
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isSent = msg.senderId._id === currentUserId || msg.senderId === currentUserId;
            return (
              <div
                key={msg._id || index}
                className={`flex ${isSent ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    isSent
                      ? 'bg-blue-600 text-white rounded-br-none'
                      : 'bg-white border border-gray-300 text-gray-800 rounded-bl-none'
                  }`}
                >
                  <p className="break-words">{msg.message}</p>
                  <p
                    className={`text-xs mt-1 ${
                      isSent ? 'text-blue-100' : 'text-gray-500'
                    }`}
                  >
                    {new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-gray-200 rounded-b-lg">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className={`px-6 py-2 rounded-lg font-semibold transition ${
              newMessage.trim()
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
};

export default Chat;

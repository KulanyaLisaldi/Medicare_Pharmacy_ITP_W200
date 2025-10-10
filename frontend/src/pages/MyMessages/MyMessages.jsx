import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar/Navbar';
import Footer from '../../components/Footer/Footer';
import './MyMessages.css';

const stripContactHeader = (text) => {
  if (!text) return '';
  const removedCombined = text.replace(/^From:[\s\S]*?(\n\n|\r\n\r\n)/, '');
  const removedLines = removedCombined
    .replace(/^From:.*$/mi, '')
    .replace(/^Email:.*$/mi, '')
    .replace(/^Phone:.*$/mi, '')
    .replace(/^\s*\n/, '');
  const trimmed = removedLines.trimStart();
  return trimmed.length ? trimmed : text;
};

const MyMessages = () => {
  const { user, token } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [conversationMessages, setConversationMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [error, setError] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);

  const getDisplayName = (otherUser) => {
    if (!otherUser) return '';
    if (otherUser.role === 'admin') return 'Admin';
    if (otherUser.role === 'doctor') return `Dr. ${otherUser.firstName || ''} ${otherUser.lastName || ''}`.trim();
    return `${otherUser.firstName || ''} ${otherUser.lastName || ''}`.trim();
  };

  const getAvatarInitial = (otherUser) => {
    if (!otherUser) return 'U';
    if (otherUser.role === 'admin') return 'A';
    return otherUser.firstName?.charAt(0)?.toUpperCase() || 'U';
  };

  useEffect(() => {
    if (user && token) {
      fetchConversations();
    }
  }, [user, token]);

  // Refresh conversations every 30 seconds
  useEffect(() => {
    if (user && token) {
      const interval = setInterval(() => {
        fetchConversations();
      }, 30000); // Refresh every 30 seconds

      return () => clearInterval(interval);
    }
  }, [user, token]);

  // Refresh conversations when page becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user && token) {
        fetchConversations();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user, token]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5001/api/messages/customer/conversations', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Customer conversations data:', data);
        setConversations(data);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to fetch conversations');
      }
    } catch (err) {
      setError('Network error occurred');
      console.error('Error fetching conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchConversationMessages = async (conversationId) => {
    try {
      setMessagesLoading(true);
      const response = await fetch(`http://localhost:5001/api/messages/conversation/${conversationId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setConversationMessages(Array.isArray(data) ? data : data.data || []);
        
        // Mark messages as seen
        await fetch(`http://localhost:5001/api/messages/conversation/${conversationId}/seen`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to fetch messages');
      }
    } catch (err) {
      setError('Network error occurred');
      console.error('Error fetching messages:', err);
    } finally {
      setMessagesLoading(false);
    }
  };

  const handleConversationSelect = (conversation) => {
    setSelectedConversation(conversation);
    fetchConversationMessages(conversation._id);
  };

  const sendMessage = async () => {
    if (!messageText.trim() || !selectedConversation) return;

    try {
      setSendingMessage(true);
      // If replying, prepend a lightweight quote marker (client-side only)
      const composed = replyTo 
        ? `> ${replyTo.message}\n${messageText.trim()}` 
        : messageText.trim();

      // Create FormData for message with optional file
      const formData = new FormData();
      formData.append('receiverId', selectedConversation.otherUser._id);
      formData.append('message', composed);
      if (selectedConversation.lastMessage?.appointmentId) {
        formData.append('appointmentId', selectedConversation.lastMessage.appointmentId);
      }

      // Add uploaded file if exists
      if (uploadedFile) {
        formData.append('document', uploadedFile);
      }

      const response = await fetch('http://localhost:5001/api/messages/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        setMessageText('');
        setReplyTo(null);
        setUploadedFile(null);
        // Clear file input
        const fileInput = document.getElementById('message-file-upload');
        if (fileInput) fileInput.value = '';
        // Refresh conversation messages
        fetchConversationMessages(selectedConversation._id);
        // Refresh conversations list to update last message
        fetchConversations();
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to send message');
      }
    } catch (err) {
      setError('Network error occurred');
      console.error('Error sending message:', err);
    } finally {
      setSendingMessage(false);
    }
  };

  const deleteMessage = async (messageId) => {
    if (!window.confirm('Are you sure you want to delete this message?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5001/api/messages/${messageId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        // Refresh conversation messages
        fetchConversationMessages(selectedConversation._id);
        // Refresh conversations list to update last message
        fetchConversations();
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to delete message');
      }
    } catch (err) {
      setError('Network error occurred');
      console.error('Error deleting message:', err);
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    }
  };

  return (
    <div className="my-messages-page">
      <Navbar />
      
      <div className="my-messages-container">
        <div className="my-messages-header">
          <h1>My Messages</h1>
          <p>Communicate with your doctors about your appointments</p>
        </div>

        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading conversations...</p>
          </div>
        ) : error ? (
          <div className="error-container">
            <div className="error-icon">⚠️</div>
            <h3>Error</h3>
            <p>{error}</p>
            <button onClick={fetchConversations} className="retry-btn">
              Try Again
            </button>
          </div>
        ) : (
          <div className="messages-layout">
            {/* Conversations List */}
            <div className="conversations-sidebar">
              <div className="conversations-header">
                <h3>Conversations</h3>
                <button 
                  onClick={fetchConversations}
                  className="refresh-btn"
                  disabled={loading}
                >
                  {loading ? '⏳' : '🔄'}
                </button>
              </div>

              {conversations.length === 0 ? (
                <div className="no-conversations">
                  <div className="no-conversations-icon">💬</div>
                  <h4>No Conversations</h4>
                  <p>You don't have any message conversations yet.</p>
                  <p className="help-text">
                    Start a conversation by messaging a doctor from your appointments.
                  </p>
                </div>
              ) : (
                <div className="conversations-list">
                  {conversations.map((conversation) => (
                    <div 
                      key={conversation._id} 
                      className={`conversation-item ${selectedConversation?._id === conversation._id ? 'active' : ''}`}
                      onClick={() => handleConversationSelect(conversation)}
                    >
                      <div className="conversation-avatar">
                        {getAvatarInitial(conversation.otherUser)}
                      </div>
                      <div className="conversation-info">
                        <div className="conversation-name">{getDisplayName(conversation.otherUser)}</div>
                        <div className="conversation-preview">
                          {stripContactHeader(conversation.lastMessage?.message)?.substring(0, 50)}
                          {stripContactHeader(conversation.lastMessage?.message)?.length > 50 ? '...' : ''}
                        </div>
                        <div className="conversation-meta">
                          {conversation.unreadCount > 0 && (
                            <span className="unread-badge">{conversation.unreadCount}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Messages Area */}
            <div className="messages-main">
              {selectedConversation ? (
                <div className="conversation-view">
                  <div className="conversation-header">
                    <div className="conversation-title">
                      <div className="conversation-avatar-large">
                        {selectedConversation.otherUser?.firstName?.charAt(0)?.toUpperCase() || 'D'}
                      </div>
                      <div className="conversation-details">
                        <h3>{getDisplayName(selectedConversation.otherUser)}</h3>
                        <p>{selectedConversation.otherUser?.specialization}</p>
                      </div>
                    </div>
                  </div>

                  <div className="messages-container">
                    {messagesLoading ? (
                      <div className="loading-messages">
                        <div className="loading-spinner"></div>
                        <p>Loading messages...</p>
                      </div>
                    ) : (
                      <div className="messages-list">
                        {conversationMessages.map((message) => (
                          <div 
                            key={message._id} 
                            className={`message-item ${message.senderId._id === user._id ? 'sent' : 'received'}`}
                          >
                              <div className="message-content">
                                <div className="message-text">{stripContactHeader(message.message)}</div>
                                {message.documentPath && (
                                  <div className="message-document">
                                    <div className="document-item">
                                      <div className="document-icon">📄</div>
                                      <div className="document-info">
                                        <span className="document-name">
                                          {message.documentPath.split('/').pop()}
                                        </span>
                                        <button 
                                          className="view-document-btn"
                                          onClick={() => window.open(`http://localhost:5001${message.documentPath}`, '_blank')}
                                        >
                                          View Document
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                )}
                                <div className="message-meta">
                                  <span className="message-time">{formatTime(message.sentAt)}</span>
                                  <div className="message-actions">
                                    <button 
                                      className="reply-btn"
                                      onClick={() => {
                                        setReplyTo(message);
                                        const input = document.querySelector('.message-input input');
                                        if (input) input.focus();
                                      }}
                                    >Reply</button>
                                    {message.senderId._id === user._id && (
                                      <button 
                                        className="delete-btn"
                                        onClick={() => deleteMessage(message._id)}
                                        title="Delete message"
                                      >🗑️</button>
                                    )}
                                  </div>
                                </div>
                              </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="message-input-container">
                    {replyTo && (
                      <div className="reply-preview">
                        <div className="reply-title">Replying to</div>
                        <div className="reply-text">{replyTo.message}</div>
                        <button 
                          className="reply-cancel"
                          onClick={() => setReplyTo(null)}
                        >Cancel</button>
                      </div>
                    )}
                    
                    {/* File Upload Section */}
                    {uploadedFile && (
                      <div className="file-preview">
                        <div className="file-info">
                          <span className="file-icon">📄</span>
                          <span className="file-name">{uploadedFile.name}</span>
                          <button 
                            className="remove-file-btn"
                            onClick={() => {
                              setUploadedFile(null);
                              const fileInput = document.getElementById('message-file-upload');
                              if (fileInput) fileInput.value = '';
                            }}
                          >×</button>
                        </div>
                      </div>
                    )}

                    <div className="message-input">
                      <input
                        type="text"
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        placeholder="Type your message..."
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && messageText.trim() && !sendingMessage) {
                            sendMessage();
                          }
                        }}
                        disabled={sendingMessage}
                      />
                      <div className="message-input-actions">
                        <input
                          type="file"
                          id="message-file-upload"
                          className="file-upload-input"
                          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                              setUploadedFile(file);
                            }
                          }}
                        />
                        <label htmlFor="message-file-upload" className="file-upload-btn" title="Attach file">
                          📎
                        </label>
                        <button 
                          onClick={sendMessage}
                          disabled={!messageText.trim() || sendingMessage}
                          className="send-btn"
                        >
                          {sendingMessage ? 'Sending...' : 'Send'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="no-conversation-selected">
                  <div className="no-conversation-icon">💬</div>
                  <h3>Select a Conversation</h3>
                  <p>Choose a conversation from the list to start messaging.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default MyMessages;

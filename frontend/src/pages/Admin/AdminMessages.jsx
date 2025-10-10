import React, { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'

const stripContactHeader = (text) => {
  if (!text) return '';
  // Remove a leading combined header like: "From: ... | Email: ... | Phone: ..." followed by optional blank line(s)
  const removedCombined = text.replace(/^From:[\s\S]*?(\n\n|\r\n\r\n)/, '');
  // Also remove individual header lines if present
  const removedLines = removedCombined
    .replace(/^From:.*$/mi, '')
    .replace(/^Email:.*$/mi, '')
    .replace(/^Phone:.*$/mi, '')
    .replace(/^\s*\n/, '');
  const trimmed = removedLines.trimStart();
  return trimmed.length ? trimmed : text; // fall back if nothing matched
};

const AdminMessages = () => {
  const { token, user } = useAuth()
  const [messages, setMessages] = useState([])
  const [conversations, setConversations] = useState([])
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [messageText, setMessageText] = useState('')

  useEffect(() => {
    if (token) fetchConversations()
  }, [token])

  const fetchConversations = async () => {
    try {
      setLoading(true)
      const response = await fetch('http://localhost:5001/api/messages/doctor/conversations', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      setConversations(data.data || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleConversationSelect = async (conversation) => {
    setSelectedConversation(conversation)
    try {
      setMessagesLoading(true)
      const res = await fetch(`http://localhost:5001/api/messages/conversation/${conversation._id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      setMessages(data.data || [])
      await fetch(`http://localhost:5001/api/messages/conversation/${conversation._id}/seen`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      })
    } catch (e) {
      console.error(e)
    } finally {
      setMessagesLoading(false)
    }
  }

  const deleteMessage = async (messageId) => {
    if (!window.confirm('Delete this message?')) return
    try {
      const res = await fetch(`http://localhost:5001/api/messages/${messageId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        setMessages(prev => prev.filter(m => m._id !== messageId))
        fetchConversations()
      }
    } catch (e) {
      console.error(e)
    }
  }

  const sendReply = async (conversationId, text) => {
    try {
      const res = await fetch('http://localhost:5001/api/messages/reply', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ conversationId, message: text })
      })
      const data = await res.json()
      if (data?.data) setMessages(prev => [...prev, data.data])
      setMessageText('')
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="patient-messages-tab">
      <div className="messages-layout">
        <div className="conversations-list">
          <div className="conversations-header">
            <h3>Conversations</h3>
          </div>

          {loading ? (
            <div className="loading">Loading conversations...</div>
          ) : conversations.length === 0 ? (
            <div className="no-messages">
              <div className="no-messages-icon">💬</div>
              <h3>No Messages</h3>
              <p>You don't have any messages yet.</p>
            </div>
          ) : (
            <div className="conversations">
              {conversations.map((conversation) => (
                <div
                  key={conversation._id}
                  className={`conversation-item ${selectedConversation?._id === conversation._id ? 'active' : ''}`}
                  onClick={() => handleConversationSelect(conversation)}
                >
                  <div className="conversation-avatar">
                    {conversation.otherUser?.firstName?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div className="conversation-info">
                    <div className="conversation-name">
                      {conversation.otherUser?.firstName} {conversation.otherUser?.lastName}
                    </div>
                    <div className="conversation-preview">
                      {stripContactHeader(conversation.lastMessage?.message)?.substring(0, 50)}
                      {stripContactHeader(conversation.lastMessage?.message)?.length > 50 ? '...' : ''}
                    </div>
                    <div className="conversation-meta">
                      <span className="conversation-time">
                        {new Date(conversation.lastMessage?.sentAt).toLocaleDateString()}
                      </span>
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

        <div className="messages-area">
          {selectedConversation ? (
            <div className="conversation-view">
              <div className="conversation-header">
                <div className="conversation-title">
                  {selectedConversation.otherUser?.firstName} {selectedConversation.otherUser?.lastName}
                </div>
                <div className="conversation-actions">
                  <button onClick={() => setSelectedConversation(null)} className="close-conversation-btn">×</button>
                </div>
              </div>

              <div className="messages-list">
                {messagesLoading ? (
                  <div className="loading">Loading messages...</div>
                ) : (
                  messages.map((m) => (
                    <div key={m._id} className={`message-item ${m.senderId._id === selectedConversation.otherUser?._id ? 'received' : 'sent'}`}>
                      <div className="message-content">
                        <div className="message-text">{stripContactHeader(m.message)}</div>
                        <div className="message-meta">
                          <div className="message-time">{new Date(m.sentAt || m.createdAt).toLocaleTimeString()}</div>
                          {m.senderId._id === user?._id && (
                            <button className="delete-btn" onClick={() => deleteMessage(m._id)} title="Delete">🗑️</button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="message-input">
                <input
                  type="text"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Type your reply..."
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && messageText.trim()) {
                      sendReply(selectedConversation._id, messageText.trim())
                    }
                  }}
                />
                <div className="message-input-actions">
                  <button
                    onClick={() => {
                      if (messageText.trim()) {
                        sendReply(selectedConversation._id, messageText.trim())
                      }
                    }}
                    disabled={!messageText.trim()}
                    className="send-btn"
                  >
                    Send
                  </button>
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
    </div>
  )
}

export default AdminMessages



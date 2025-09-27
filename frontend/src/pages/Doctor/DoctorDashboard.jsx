import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../../layouts/DashboardLayout'
import { useAuth } from '../../context/AuthContext'
import './DoctorDashboard.css'
import { Home, Calendar, MessageSquare } from 'lucide-react'

const DoctorDashboard = () => {
	const navigate = useNavigate()
	const [activeSection, setActiveSection] = useState('overview')
	const [stats, setStats] = useState({
		todayAppointments: 0,
		weekAppointments: 0,
		monthAppointments: 0,
		todayBookings: [],
		upcomingAppointments: []
	})
	const [bookings, setBookings] = useState([])
	const [bookingsLoading, setBookingsLoading] = useState(false)
	const [bookingsError, setBookingsError] = useState('')
	const [filters, setFilters] = useState({
		date: ''
	})
	const [pagination, setPagination] = useState({
		currentPage: 1,
		totalPages: 1,
		totalCount: 0
	})
	const [expandedSlot, setExpandedSlot] = useState(null)
	const [selectedDocuments, setSelectedDocuments] = useState([])
	const [groupedBookings, setGroupedBookings] = useState({})
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState('')
	const [messages, setMessages] = useState([])
	const [selectedConversation, setSelectedConversation] = useState(null)
	const [conversationMessages, setConversationMessages] = useState([])
	const [messageText, setMessageText] = useState('')
	const [messagesLoading, setMessagesLoading] = useState(false)
	const [notifications, setNotifications] = useState([])
	const [unreadCount, setUnreadCount] = useState(0)
	const [showNotificationPopup, setShowNotificationPopup] = useState(false)
	const { token } = useAuth()

	useEffect(() => {
		const fetchStats = async () => {
			try {
				const response = await fetch('http://localhost:5001/api/bookings/doctor/stats', {
					headers: {
						'Authorization': `Bearer ${token}`
					}
				})
				const data = await response.json()
				if (response.ok) {
					setStats(data)
				} else {
					setError(data.message || 'Failed to fetch stats')
				}
			} catch (err) {
				setError('Network error. Please try again.')
			} finally {
				setLoading(false)
			}
		}

		if (token) {
			fetchStats()
		}
	}, [token])

	const fetchBookings = async (page = 1) => {
		setBookingsLoading(true)
		setBookingsError('')
		try {
			const queryParams = new URLSearchParams({
				page: page.toString(),
				limit: '10'
			})
			
			if (filters.date) {
				queryParams.append('date', filters.date)
			}

			const response = await fetch(`http://localhost:5001/api/bookings/doctor/bookings?${queryParams}`, {
				headers: {
					'Authorization': `Bearer ${token}`
				}
			})
			const data = await response.json()
			if (response.ok) {
				setBookings(data.bookings)
				const grouped = groupBookingsByDate(data.bookings)
				setGroupedBookings(grouped)
				setPagination({
					currentPage: data.currentPage,
					totalPages: data.totalPages,
					totalCount: data.totalCount
				})
			} else {
				setBookingsError(data.message || 'Failed to fetch bookings')
			}
		} catch (err) {
			setBookingsError('Network error. Please try again.')
		} finally {
			setBookingsLoading(false)
		}
	}


	const handleFilterChange = (filterType, value) => {
		setFilters(prev => ({
			...prev,
			[filterType]: value
		}))
	}

	const handleSlotClick = (booking) => {
		if (expandedSlot === booking._id) {
			setExpandedSlot(null)
		} else {
			setExpandedSlot(booking._id)
		}
	}

	const handleDocumentView = (documents) => {
		setSelectedDocuments(documents)
	}

	const closeDocumentViewer = () => {
		setSelectedDocuments([])
	}

	const groupBookingsByDate = (bookings) => {
		const grouped = {}
		bookings.forEach(booking => {
			const date = new Date(booking.date).toDateString()
			if (!grouped[date]) {
				grouped[date] = []
			}
			grouped[date].push(booking)
		})
		
		// Sort bookings within each date by start time
		Object.keys(grouped).forEach(date => {
			grouped[date].sort((a, b) => a.startTime.localeCompare(b.startTime))
		})
		
		return grouped
	}



	useEffect(() => {
		if (activeSection === 'appointments' && token) {
			fetchBookings()
		}
		if (activeSection === 'messages' && token) {
			fetchMessages()
		}
	}, [activeSection, token, filters])

	// Fetch notifications on component mount and set up real-time updates
	useEffect(() => {
		if (token) {
			fetchNotifications()
			
			// Set up polling for real-time updates every 30 seconds
			const interval = setInterval(() => {
				fetchNotifications()
			}, 30000)

			return () => clearInterval(interval)
		}
	}, [token])


	// Fetch doctor's conversations (patient messages)
	const fetchMessages = async () => {
		try {
			setMessagesLoading(true)
			const response = await fetch('http://localhost:5001/api/messages/doctor/conversations', {
				headers: {
					'Authorization': `Bearer ${token}`
				}
			})
			
			if (response.ok) {
				const data = await response.json()
				setMessages(data.data || [])
			} else {
				console.error('Failed to fetch messages')
			}
		} catch (error) {
			console.error('Error fetching messages:', error)
		} finally {
			setMessagesLoading(false)
		}
	}

	// Fetch messages in a specific conversation
	const fetchConversationMessages = async (conversationId) => {
		try {
			const response = await fetch(`http://localhost:5001/api/messages/conversation/${conversationId}`, {
				headers: {
					'Authorization': `Bearer ${token}`
				}
			})
			
			if (response.ok) {
				const data = await response.json()
				setConversationMessages(data.data || [])
			} else {
				console.error('Failed to fetch conversation messages')
			}
		} catch (error) {
			console.error('Error fetching conversation messages:', error)
		}
	}

	// Send a reply message
	const sendReply = async (conversationId, message) => {
		try {
			const response = await fetch('http://localhost:5001/api/messages/reply', {
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					conversationId,
					message
				})
			})

			if (response.ok) {
				// Refresh conversation messages
				await fetchConversationMessages(conversationId)
				// Refresh messages list
				await fetchMessages()
				setMessageText('')
			} else {
				console.error('Failed to send reply')
			}
		} catch (error) {
			console.error('Error sending reply:', error)
		}
	}

	// Handle conversation selection
	const handleConversationSelect = (conversation) => {
		setSelectedConversation(conversation)
		fetchConversationMessages(conversation._id)
	}

	// Fetch notifications
	const fetchNotifications = async () => {
		try {
			const response = await fetch('http://localhost:5001/api/bookings/doctor/notifications', {
				headers: {
					'Authorization': `Bearer ${token}`
				}
			})
			
			if (response.ok) {
				const data = await response.json()
				setNotifications(data)
				// Calculate unread count
				const unread = data.filter(n => !n.read).length
				setUnreadCount(unread)
			} else {
				console.error('Failed to fetch notifications')
			}
		} catch (error) {
			console.error('Error fetching notifications:', error)
		}
	}

	// Mark notification as read
	const markNotificationRead = async (notificationId) => {
		try {
			const response = await fetch(`http://localhost:5001/api/bookings/notifications/${notificationId}/read`, {
				method: 'PATCH',
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json'
				}
			})

			if (response.ok) {
				// Update local state
				setNotifications(prevNotifications => {
					const updated = prevNotifications.map(notification => 
						notification._id === notificationId ? { ...notification, read: true } : notification
					)
					return updated
				})
				// Update unread count
				setUnreadCount(prev => Math.max(0, prev - 1))
			} else {
				console.error('Failed to mark notification as read')
			}
		} catch (error) {
			console.error('Error marking notification as read:', error)
		}
	}

	const sidebar = [
		{ id: 'overview', label: 'Overview', icon: <Home size={18} /> },
		{ id: 'appointments', label: 'Appointments', icon: <Calendar size={18} /> },
		{ id: 'messages', label: 'Messages', icon: <MessageSquare size={18} /> },
	]

	const renderSection = () => {
		switch (activeSection) {
			case 'overview':
				if (loading) {
					return <div className="loading">Loading dashboard...</div>
				}
				
				if (error) {
					return <div className="error">Error: {error}</div>
				}

				return (
					<div className="doctor-overview">
						{/* Stats Grid */}
						<div className="doctor-stats">
							<div className="stat-card">
								<div className="stat-icon">📅</div>
								<h3>Today's Appointments</h3>
								<p className="stat-number">{stats.todayAppointments}</p>
								<span className="stat-change positive">Real-time count</span>
							</div>
							<div className="stat-card">
								<div className="stat-icon">📊</div>
								<h3>This Week</h3>
								<p className="stat-number">{stats.weekAppointments}</p>
								<span className="stat-change positive">Scheduled appointments</span>
							</div>
							<div className="stat-card">
								<div className="stat-icon">📈</div>
								<h3>This Month</h3>
								<p className="stat-number">{stats.monthAppointments}</p>
								<span className="stat-change positive">Monthly total</span>
							</div>
						</div>


						{/* Today's Appointments */}
						<div className="today-appointments">
							<h2>Upcoming Appointments</h2>
							<div className="appointments-list">
								{stats.todayBookings.length > 0 ? (
									stats.todayBookings.map((appointment, index) => (
										<div key={appointment._id || index} className="appointment-item">
											<div className="appointment-time">{appointment.startTime}</div>
											<div className="appointment-info">
												<div className="patient-name">{appointment.patientName}</div>
												<div className="appointment-duration">Slot #{appointment.slotNumber}</div>
											</div>
										</div>
									))
								) : (
									<div className="no-appointments">
										<p>No appointments scheduled for today</p>
									</div>
								)}
							</div>
						</div>


						{/* Quick Actions */}
						<div className="quick-actions-section">
							<h2>Quick Actions</h2>
							<div className="quick-actions-grid">
								<button 
									className="quick-action-btn"
									onClick={() => setActiveSection('appointments')}
								>
									
									<span>📅 Appointments</span>
								</button>
								<button 
									className="quick-action-btn"
									onClick={() => setShowNotificationPopup(true)}
								>
									
									<span>🔔 Notifications</span>
								</button>
								<button 
									className="quick-action-btn"
									onClick={() => setActiveSection('messages')}
								>
									
									<span>💬 Messages</span>
								</button>
							</div>
						</div>
					</div>
				);

			case 'appointments':
				return (
					<div className="appointments-section">
						<div className="appointments-header">
							<div className="header-content">
								<h2>Upcoming Appointments</h2>
								
							</div>
							<div className="appointments-filters">
								<input 
									type="date" 
									value={filters.date} 
									onChange={(e) => handleFilterChange('date', e.target.value)}
									className="filter-date"
									placeholder="Filter by date"
									min={new Date().toISOString().split('T')[0]}
								/>
								<button 
									onClick={() => fetchBookings(1)}
									className="refresh-btn"
								>
									🔄 Refresh
								</button>
							</div>
						</div>

						{bookingsLoading ? (
							<div className="loading">Loading appointments...</div>
						) : bookingsError ? (
							<div className="error">Error: {bookingsError}</div>
						) : (
							<>
								<div className="bookings-summary">
									<p>Total Upcoming Appointments: {pagination.totalCount}</p>
									
								</div>

								<div className="appointments-table-container">
									{Object.keys(groupedBookings).length > 0 ? (
										<div className="appointments-table-wrapper">
											<table className="appointments-table">
												<thead>
													<tr>
														<th>Date</th>
														<th>Time</th>
														<th>Slot</th>
														<th>Patient Name</th>
														<th>Age</th>
														<th>Gender</th>
														<th>Medical Conditions</th>
														<th>Documents</th>
														<th>Actions</th>
													</tr>
												</thead>
												<tbody>
													{Object.keys(groupedBookings)
											.sort((a, b) => new Date(a) - new Date(b))
														.flatMap((date) => 
															groupedBookings[date].map((booking) => (
																<React.Fragment key={booking._id}>
																	<tr className="appointment-row">
																		<td className="date-cell">
														<div className="date-info">
																				<div className="date-text">{date}</div>
																</div>
																		</td>
																		<td className="time-cell">
																			{booking.startTime}
																		</td>
																		<td className="slot-cell">
																			<span className="slot-badge">#{booking.slotNumber}</span>
																		</td>
																		<td className="patient-cell">
																			<div className="patient-name">{booking.patientName}</div>
																		</td>
																		<td className="age-cell">
																			{booking.patientAge} years
																		</td>
																		<td className="gender-cell">
																			{booking.patientGender}
																		</td>
																		<td className="condition-cell">
																			{booking.ongoingCondition === 'yes' && booking.notes ? (
																				<span className="medical-condition-text" title={booking.notes}>
																					{booking.notes.length > 50 ? booking.notes.substring(0, 50) + '...' : booking.notes}
																				</span>
																			) : (
																				<span className="no-condition-text">No Conditions</span>
																			)}
																		</td>
																		<td className="documents-cell">
																			{booking.documents && booking.documents.length > 0 ? (
																				<div className="documents-links">
																					{booking.documents.map((doc, index) => (
																						<button
																							key={index}
																							className="document-link"
																							onClick={() => window.open(`http://localhost:5001${doc.path}`, '_blank')}
																							title={doc.originalName}
																						>
																							📄 {doc.originalName.length > 20 ? doc.originalName.substring(0, 20) + '...' : doc.originalName}
																						</button>
																					))}
																		</div>
																			) : (
																				<span className="no-documents">No documents</span>
																			)}
																		</td>
																		<td className="actions-cell">
																	<button 
																				className="view-details-btn"
																				onClick={() => handleSlotClick(booking)}
																				title="View full details"
																			>
																				{expandedSlot === booking._id ? 'Hide' : 'View'}
																	</button>
																		</td>
																	</tr>
																{expandedSlot === booking._id && (
																		<tr className="details-row">
																			<td colSpan="9" className="details-cell">
																				<div className="appointment-details">
																					<div className="details-section">
																						<h4>Patient Details</h4>
																						<div className="details-grid">
																							<div className="detail-item">
																								<strong>Email:</strong> {booking.patientEmail || 'N/A'}
																			</div>
																							<div className="detail-item">
																								<strong>Phone:</strong> {booking.patientPhone || 'N/A'}
																			</div>
																							<div className="detail-item">
																								<strong>Medical Conditions:</strong> 
																								<span className={`condition-status ${booking.ongoingCondition === 'yes' ? 'has-condition' : 'no-condition'}`}>
																									{booking.ongoingCondition === 'yes' ? 'Yes' : 'No'}
																								</span>
																			</div>
																			</div>
																		</div>

																					{booking.ongoingCondition === 'yes' && booking.notes && (
																						<div className="details-section">
																							<h4>Medical Condition Details</h4>
																							<div className="medical-details">
																								<p className="medical-notes-red">{booking.notes}</p>
																							</div>
																						</div>
																					)}

																					{booking.notes && booking.ongoingCondition === 'no' && (
																						<div className="details-section">
																							<h4>Additional Notes</h4>
																							<div className="additional-notes">
																								<p className="notes-text">{booking.notes}</p>
																							</div>
																						</div>
																					)}

																		{booking.documents && booking.documents.length > 0 && (
																						<div className="details-section">
																							<h4>Attached Documents</h4>
																				<div className="documents-list">
																					{booking.documents.map((doc, index) => (
																						<div key={index} className="document-item">
																							<span className="document-name">{doc.originalName}</span>
																							<button 
																								className="view-doc-btn"
																								onClick={() => window.open(`http://localhost:5001${doc.path}`, '_blank')}
																							>
																											View Document
																							</button>
																						</div>
																					))}
																				</div>
																			</div>
																		)}
																			</div>
																			</td>
																		</tr>
																		)}
																</React.Fragment>
															))
																)}
												</tbody>
											</table>
												</div>
									) : (
										<div className="no-bookings">
											<p>No appointments found with the current filters.</p>
										</div>
									)}
								</div>

								{pagination.totalPages > 1 && (
									<div className="pagination">
										<button 
											onClick={() => fetchBookings(pagination.currentPage - 1)}
											disabled={pagination.currentPage === 1}
											className="pagination-btn"
										>
											← Previous
										</button>
										<span className="pagination-info">
											Page {pagination.currentPage} of {pagination.totalPages}
										</span>
										<button 
											onClick={() => fetchBookings(pagination.currentPage + 1)}
											disabled={pagination.currentPage === pagination.totalPages}
											className="pagination-btn"
										>
											Next →
										</button>
									</div>
								)}
							</>
						)}
					</div>
				);

			case 'messages':
				return (
					<div className="messages-section">
						<div className="messages-header">
							<h2>Patient Messages</h2>
							<button 
								onClick={fetchMessages}
								className="refresh-btn"
								disabled={messagesLoading}
							>
								{messagesLoading ? '⏳' : '🔄'} Refresh
							</button>
						</div>

						<div className="patient-messages-tab">
							<div className="messages-layout">
								{/* Conversations List */}
								<div className="conversations-list">
									<div className="conversations-header">
										<h3>Patient Conversations</h3>
									</div>

									{messagesLoading ? (
										<div className="loading">Loading conversations...</div>
									) : messages.length === 0 ? (
										<div className="no-messages">
											<div className="no-messages-icon">💬</div>
											<h3>No Messages</h3>
											<p>You don't have any patient messages yet.</p>
										</div>
									) : (
										<div className="conversations">
											{messages.map((conversation) => (
												<div 
													key={conversation._id} 
													className={`conversation-item ${selectedConversation?._id === conversation._id ? 'active' : ''}`}
													onClick={() => handleConversationSelect(conversation)}
												>
													<div className="conversation-avatar">
														{conversation.otherUser?.firstName?.charAt(0)?.toUpperCase() || 'P'}
													</div>
													<div className="conversation-info">
														<div className="conversation-name">
															{conversation.otherUser?.firstName} {conversation.otherUser?.lastName}
														</div>
														<div className="conversation-preview">
															{conversation.lastMessage?.message?.substring(0, 50)}
															{conversation.lastMessage?.message?.length > 50 ? '...' : ''}
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

								{/* Messages Area */}
								<div className="messages-area">
									{selectedConversation ? (
										<div className="conversation-view">
											<div className="conversation-header">
												<div className="conversation-title">
													{selectedConversation.otherUser?.firstName} {selectedConversation.otherUser?.lastName}
												</div>
												<div className="conversation-actions">
													<button 
														onClick={() => setSelectedConversation(null)}
														className="close-conversation-btn"
													>
														×
													</button>
												</div>
											</div>

											<div className="messages-list">
												{conversationMessages.map((message) => (
													<div 
														key={message._id} 
														className={`message-item ${message.senderId._id === selectedConversation.otherUser?._id ? 'received' : 'sent'}`}
													>
														<div className="message-content">
															<div className="message-text">{message.message}</div>
															<div className="message-time">
																{new Date(message.sentAt).toLocaleTimeString()}
															</div>
														</div>
													</div>
												))}
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
									) : (
										<div className="no-conversation-selected">
											<div className="no-conversation-icon">💬</div>
											<h3>Select a Conversation</h3>
											<p>Choose a patient conversation from the list to start messaging.</p>
										</div>
									)}
								</div>
							</div>
						</div>
					</div>
				);

			default:
				return null;
		}
	}


	return (
		<DashboardLayout 
			title="Doctor Dashboard" 
			sidebarItems={sidebar}
			onSectionChange={setActiveSection}
			activeSection={activeSection}
			notificationCount={unreadCount}
			notifications={notifications}
			onNotificationUpdate={markNotificationRead}
			showNotificationPopup={showNotificationPopup}
			setShowNotificationPopup={setShowNotificationPopup}
		>
			<div className="doctor-dashboard">
				{renderSection()}
			</div>
		</DashboardLayout>
	)
}

export default DoctorDashboard
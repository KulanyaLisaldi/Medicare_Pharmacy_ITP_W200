import React, { useState, useEffect } from 'react'
import DashboardLayout from '../../layouts/DashboardLayout'
import { useAuth } from '../../context/AuthContext'
import './DoctorDashboard.css'

const DoctorDashboard = () => {
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
	}, [activeSection, token, filters])

	const sidebar = [
		{ id: 'overview', label: 'Overview', icon: '🏠' },
		{ id: 'appointments', label: 'Appointments', icon: '📅' },
		{ id: 'messages', label: 'Notifications', icon: '💬' },
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

						{/* Quick Actions */}
						<div className="quick-actions-section">
							<h2>Quick Actions</h2>
							<div className="action-buttons">
								<button 
									className="action-btn secondary"
									onClick={() => setActiveSection('appointments')}
								>
									<span className="action-icon">📅</span>
									Appointments
								</button>
								<button className="action-btn secondary">
									<span className="action-icon">📋</span>
									View Patient History
								</button>
								<button 
									className="action-btn secondary"
									onClick={() => setActiveSection('messages')}
								>
									<span className="action-icon">💬</span>
									Notifications
								</button>
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

						{/* Recent Patient Updates */}
						<div className="patient-updates">
							<h2>Recent Patient Updates</h2>
							<div className="updates-list">
								<div className="update-item">
									<div className="update-icon">📊</div>
									<div className="update-content">
										<div className="update-title">Lab Results Ready</div>
										<div className="update-details">Blood work results for Sarah Wilson are now available</div>
										<div className="update-time">2 hours ago</div>
									</div>
									<button className="update-action">View</button>
								</div>
								<div className="update-item">
									<div className="update-icon">💊</div>
									<div className="update-content">
										<div className="update-title">Prescription Refill Request</div>
										<div className="update-details">Mike Brown requests refill for blood pressure medication</div>
										<div className="update-time">4 hours ago</div>
									</div>
									<button className="update-action">Review</button>
								</div>
								<div className="update-item">
									<div className="update-icon">📱</div>
									<div className="update-content">
										<div className="update-title">Patient Message</div>
										<div className="update-details">New message from Jennifer Lee regarding symptoms</div>
										<div className="update-time">6 hours ago</div>
									</div>
									<button className="update-action">Reply</button>
								</div>
							</div>
						</div>

						{/* Performance Summary */}
						<div className="performance-summary">
							<h2>Appointment Statistics</h2>
							<div className="performance-metrics">
								<div className="metric">
									<span className="metric-label">Today's Appointments</span>
									<span className="metric-value">{stats.todayAppointments}</span>
								</div>
								<div className="metric">
									<span className="metric-label">This Week</span>
									<span className="metric-value">{stats.weekAppointments}</span>
								</div>
								<div className="metric">
									<span className="metric-label">This Month</span>
									<span className="metric-value">{stats.monthAppointments}</span>
								</div>
								<div className="metric">
									<span className="metric-label">Upcoming</span>
									<span className="metric-value">{stats.upcomingAppointments.length}</span>
								</div>
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

								<div className="appointments-by-date">
									{Object.keys(groupedBookings).length > 0 ? (
										Object.keys(groupedBookings)
											.sort((a, b) => new Date(a) - new Date(b))
											.map((date) => (
												<div key={date} className="date-group">
													<div className="date-header">
														<h3>{date}</h3>
														<span className="slot-count">
															{groupedBookings[date].length} appointment{groupedBookings[date].length !== 1 ? 's' : ''}
														</span>
													</div>
													<div className="slots-grid">
														{groupedBookings[date].map((booking) => (
															<div key={booking._id} className="slot-card">
																<div 
																	className="slot-header"
																	onClick={() => handleSlotClick(booking)}
																>
																	<div className="slot-info">
																		<div className="slot-number">
																			No #{booking.slotNumber}
																		</div>
																		<div className="slot-time">
																			{booking.startTime}
																		</div>
																	</div>
																	<div className="view-text">
																		View
																	</div>
																</div>

																{expandedSlot === booking._id && (
																	<div className="slot-details">
																		<div className="patient-details">
																			<div className="detail-row">
																				<span className="detail-label">Patient Name:</span>
																				<span className="detail-value">{booking.patientName}</span>
																			</div>
																			<div className="detail-row">
																				<span className="detail-label">Age:</span>
																				<span className="detail-value">{booking.patientAge} years</span>
																			</div>
																			<div className="detail-row">
																				<span className="detail-label">Gender:</span>
																				<span className="detail-value">{booking.patientGender}</span>
																			</div>
																			<div className="detail-row">
																				<span className="detail-label">Ongoing Condition:</span>
																				<span className="detail-value">{booking.ongoingCondition}</span>
																			</div>
																		</div>

																		{booking.documents && booking.documents.length > 0 && (
																			<div className="documents-section">
																				<h4>📄 Attached Documents</h4>
																				<div className="documents-list">
																					{booking.documents.map((doc, index) => (
																						<div key={index} className="document-item">
																							<span className="document-name">{doc.originalName}</span>
																							<button 
																								className="view-doc-btn"
																								onClick={() => window.open(`http://localhost:5001/${doc.path}`, '_blank')}
																							>
																								View
																							</button>
																						</div>
																					))}
																				</div>
																			</div>
																		)}

																		{booking.notes && (
																			<div className="notes-section">
																				<h4>📝 Notes</h4>
																				<p>{booking.notes}</p>
																			</div>
																		)}
																	</div>
																)}
															</div>
														))}
													</div>
												</div>
											))
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
						<h2>Messages</h2>
						<p>Messages features coming soon...</p>
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
		>
			<div className="doctor-dashboard">
				{renderSection()}
			</div>
		</DashboardLayout>
	)
}

export default DoctorDashboard
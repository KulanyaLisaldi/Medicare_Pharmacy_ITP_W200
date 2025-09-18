import React, { useState } from 'react'
import DashboardLayout from '../../layouts/DashboardLayout'
import './DoctorDashboard.css'

const DoctorDashboard = () => {
	const [activeSection, setActiveSection] = useState('overview')

	const sidebar = [
		{ id: 'overview', label: 'Overview', icon: '🏠' },
		{ id: 'appointments', label: 'Appointments', icon: '📅' },
		{ id: 'messages', label: 'Messages', icon: '💬' },
	]

	const renderSection = () => {
		switch (activeSection) {
			case 'overview':
				return (
					<div className="doctor-overview">
						{/* Stats Grid */}
						<div className="doctor-stats">
							<div className="stat-card">
								<div className="stat-icon">📅</div>
								<h3>Today's Appointments</h3>
								<p className="stat-number">8</p>
								<span className="stat-change positive">+2 from yesterday</span>
							</div>
							<div className="stat-card">
								<div className="stat-icon">💬</div>
								<h3>Messages</h3>
								<p className="stat-number">12</p>
								<span className="stat-change positive">+5 from yesterday</span>
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
									Messages
								</button>
							</div>
						</div>

						{/* Today's Appointments */}
						<div className="today-appointments">
							<h2>Today's Appointments</h2>
							<div className="appointments-list">
								<div className="appointment-item">
									<div className="appointment-time">9:00 AM</div>
									<div className="appointment-info">
										<div className="patient-name">Emily Johnson</div>
										<div className="appointment-type">General Checkup</div>
										<div className="appointment-duration">30 min</div>
									</div>
									<div className="appointment-status confirmed">Confirmed</div>
								</div>
								<div className="appointment-item">
									<div className="appointment-time">10:30 AM</div>
									<div className="appointment-info">
										<div className="patient-name">Robert Smith</div>
										<div className="appointment-type">Follow-up</div>
										<div className="appointment-duration">45 min</div>
									</div>
									<div className="appointment-status confirmed">Confirmed</div>
								</div>
								<div className="appointment-item">
									<div className="appointment-time">2:00 PM</div>
									<div className="appointment-info">
										<div className="patient-name">Lisa Davis</div>
										<div className="appointment-type">Consultation</div>
										<div className="appointment-duration">60 min</div>
									</div>
									<div className="appointment-status pending">Pending</div>
								</div>
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
							<h2>This Week's Performance</h2>
							<div className="performance-metrics">
								<div className="metric">
									<span className="metric-label">Appointments</span>
									<span className="metric-value">42</span>
								</div>
								<div className="metric">
									<span className="metric-label">Patient Satisfaction</span>
									<span className="metric-value">4.9/5</span>
								</div>
								<div className="metric">
									<span className="metric-label">Prescriptions</span>
									<span className="metric-value">28</span>
								</div>
								<div className="metric">
									<span className="metric-label">Consultations</span>
									<span className="metric-value">35</span>
								</div>
							</div>
						</div>
					</div>
				);

			case 'appointments':
				return (
					<div className="appointments-section">
						<h2>Appointments</h2>
						<p>Appointment management features coming soon...</p>
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
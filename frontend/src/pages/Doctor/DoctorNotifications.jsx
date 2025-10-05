import React from 'react'
import DashboardLayout from '../../layouts/DashboardLayout'
import { useAuth } from '../../context/AuthContext'
import { Bell } from 'lucide-react'

const DoctorNotifications = () => {
	const { user } = useAuth()

	const sidebar = [
		{ id: 'overview', label: 'Overview', icon: <Bell size={18} /> },
		{ id: 'appointments', label: 'Appointments', icon: <Bell size={18} /> },
		{ id: 'messages', label: 'Messages', icon: <Bell size={18} /> },
	]

	return (
		<DashboardLayout 
			title="Doctor Notifications" 
			sidebarItems={sidebar}
		>
			<div className="doctor-notifications">
				<div className="notifications-header">
					<h1>Notifications Center</h1>
					<p>Stay updated with important notifications and alerts.</p>
				</div>
				
				<div className="notifications-content">
					<div className="info-card">
						<h2>🔔 Notification Center</h2>
						<p>This page will contain your notification management features including:</p>
						<ul>
							<li>View all notifications</li>
							<li>Mark notifications as read</li>
							<li>Notification preferences</li>
							<li>Alert settings</li>
						</ul>
					</div>
				</div>
			</div>
		</DashboardLayout>
	)
}

export default DoctorNotifications

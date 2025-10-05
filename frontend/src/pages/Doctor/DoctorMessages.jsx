import React from 'react'
import DashboardLayout from '../../layouts/DashboardLayout'
import { useAuth } from '../../context/AuthContext'
import { MessageSquare } from 'lucide-react'

const DoctorMessages = () => {
	const { user } = useAuth()

	const sidebar = [
		{ id: 'overview', label: 'Overview', icon: <MessageSquare size={18} /> },
		{ id: 'appointments', label: 'Appointments', icon: <MessageSquare size={18} /> },
		{ id: 'messages', label: 'Messages', icon: <MessageSquare size={18} /> },
	]

	return (
		<DashboardLayout 
			title="Doctor Messages" 
			sidebarItems={sidebar}
		>
			<div className="doctor-messages">
				<div className="messages-header">
					<h1>Patient Messages</h1>
					<p>Communicate with your patients through secure messaging.</p>
				</div>
				
				<div className="messages-content">
					<div className="info-card">
						<h2>💬 Patient Communication</h2>
						<p>This page will contain your messaging features including:</p>
						<ul>
							<li>View patient conversations</li>
							<li>Send and receive messages</li>
							<li>Message history</li>
							<li>Patient communication tools</li>
						</ul>
					</div>
				</div>
			</div>
		</DashboardLayout>
	)
}

export default DoctorMessages

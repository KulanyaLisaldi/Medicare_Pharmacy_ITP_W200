import React from 'react'
import DashboardLayout from '../../layouts/DashboardLayout'
import { useAuth } from '../../context/AuthContext'
import { Calendar } from 'lucide-react'

const DoctorAppointments = () => {
	const { user } = useAuth()

	const sidebar = [
		{ id: 'overview', label: 'Overview', icon: <Calendar size={18} /> },
		{ id: 'appointments', label: 'Appointments', icon: <Calendar size={18} /> },
		{ id: 'messages', label: 'Messages', icon: <Calendar size={18} /> },
	]

	return (
		<DashboardLayout 
			title="Doctor Appointments" 
			sidebarItems={sidebar}
		>
			<div className="doctor-appointments">
				<div className="appointments-header">
					<h1>Appointments Management</h1>
					<p>Manage your appointment schedule and patient bookings.</p>
				</div>
				
				<div className="appointments-content">
					<div className="info-card">
						<h2>📅 Appointment Management</h2>
						<p>This page will contain your appointment management features including:</p>
						<ul>
							<li>View upcoming appointments</li>
							<li>Manage appointment slots</li>
							<li>Patient booking details</li>
							<li>Schedule management</li>
						</ul>
					</div>
				</div>
			</div>
		</DashboardLayout>
	)
}

export default DoctorAppointments

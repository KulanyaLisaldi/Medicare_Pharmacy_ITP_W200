import React, { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import './DashboardLayout.css'
import { useAuth } from '../context/AuthContext'
import { LogOut } from 'lucide-react'

const DashboardLayout = ({ sidebarItems = [], title, children, onSectionChange, activeSection, notificationCount = 0, notifications = [] }) => {
	const location = useLocation()
	const navigate = useNavigate()
	const { user, logout, updateProfile } = useAuth()
	const [showProfileDropdown, setShowProfileDropdown] = useState(false)
	const [showAccountManagement, setShowAccountManagement] = useState(false)
	const [showPasswordChange, setShowPasswordChange] = useState(false)
	const [showNotificationPopup, setShowNotificationPopup] = useState(false)
	const [accountForm, setAccountForm] = useState({
		firstName: user?.firstName || '',
		lastName: user?.lastName || '',
		email: user?.email || '',
		phone: user?.phone || '',
		address: user?.address || ''
	})
	const [passwordForm, setPasswordForm] = useState({
		currentPassword: '',
		newPassword: '',
		confirmPassword: ''
	})

	const handleLogout = () => {
		logout()
		navigate('/login')
	}

	const handleSidebarItemClick = (item) => {
		if (item.path) {
			// External navigation
			navigate(item.path)
		} else if (item.id && onSectionChange) {
			// Internal section navigation
			onSectionChange(item.id)
		}
	}

	const isActiveItem = (item) => {
		if (item.path) {
			return location.pathname === item.path
		} else if (item.id && activeSection) {
			return activeSection === item.id
		}
		return false
	}

    const handleAccountUpdate = async (e) => {
        e.preventDefault()
        // Client-side validation: names letters/spaces, address required, SL phone
        const nameRegex = /^[A-Za-z ]+$/
        if (!nameRegex.test(accountForm.firstName)) { alert('First name should contain only letters and spaces'); return }
        if (!nameRegex.test(accountForm.lastName)) { alert('Last name should contain only letters and spaces'); return }
        if (!accountForm.address.trim()) { alert('Address is required'); return }
        const phoneRegex = /^07\d{8}$/
        if (accountForm.phone && !phoneRegex.test(accountForm.phone)) { alert('Phone must be 10 digits (Sri Lanka format: 07XXXXXXXX)'); return }
        try {
            await updateProfile(accountForm)
            setShowAccountManagement(false)
        } catch (error) {
            console.error('Error updating profile:', error)
        }
    }

	const handleChangePassword = async (e) => {
		e.preventDefault()
		if (passwordForm.newPassword !== passwordForm.confirmPassword) {
			alert('New passwords do not match')
			return
		}
		try {
			// Implement password change logic here
			setShowPasswordChange(false)
			setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
			// You can add a success toast here
		} catch (error) {
			console.error('Error changing password:', error)
			// You can add an error toast here
		}
	}

	return (
		<div className="dash">
			<aside className="dash-sidebar">
				<div className="dash-brand">MediCare</div>
				<nav className="dash-nav">
					{sidebarItems.map(item => (
						item.path ? (
							<Link
								key={item.path}
								to={item.path}
								className={`dash-link ${isActiveItem(item) ? 'active' : ''}`}
							>
								{item.icon && <span className="icon">{item.icon}</span>}
								<span>{item.label}</span>
							</Link>
						) : (
							<button
								key={item.id}
								onClick={() => handleSidebarItemClick(item)}
								className={`dash-link ${isActiveItem(item) ? 'active' : ''}`}
								style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer' }}
							>
								{item.icon && <span className="icon">{item.icon}</span>}
								<span>{item.label}</span>
							</button>
						)
					))}
				</nav>
				
				{/* Logout Button at Bottom */}
				<div className="sidebar-footer">
					<button
						onClick={handleLogout}
						className="dash-link logout-link"
						style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer' }}
					>
						<LogOut size={18} />
						<span>Logout</span>
					</button>
				</div>
			</aside>
			<main className="dash-main">
				<header className="dash-header">
					<div className="dash-header-left">
						<h1 className="dash-title">{title}</h1>
						<p className="dash-subtitle">Welcome back, {`${user?.firstName} ${user?.lastName}`}!</p>
					</div>
					<div className="dash-header-actions">
						{/* Notification Icon */}
						<div className="notification-container" style={{ position: 'relative' }}>
							<button 
								className="notification-icon" 
								title="Notifications"
								onClick={() => setShowNotificationPopup(!showNotificationPopup)}
								style={{ background: 'none', border: 'none', cursor: 'pointer', position: 'relative' }}
							>
								🔔
								{notificationCount > 0 && (
									<span className="notification-badge">{notificationCount}</span>
								)}
							</button>
							
							{/* Notification Popup */}
							{showNotificationPopup && (
								<div className="notification-popup">
									<div className="notification-popup-header">
										<h3>Notifications</h3>
										<button 
											onClick={() => setShowNotificationPopup(false)}
											className="close-popup-btn"
										>
											×
										</button>
									</div>
									<div className="notification-popup-content">
										{notifications.length === 0 ? (
											<div className="no-notifications">
												<div className="text-gray-400 text-2xl mb-2">🔔</div>
												<p className="text-gray-500 text-sm">No notifications</p>
											</div>
										) : (
											<div className="notification-list">
												{notifications.slice(0, 5).map(notification => (
													<div 
														key={notification.id} 
														className={`notification-item ${
															notification.priority === 'high' 
																? 'high-priority' 
																: notification.priority === 'medium'
																? 'medium-priority'
																: 'low-priority'
														}`}
													>
														<div className="notification-item-header">
															<span className="notification-icon-small">{notification.icon}</span>
															<span className="notification-title">{notification.title}</span>
															<span className="notification-time">
																{notification.timestamp.toLocaleTimeString()}
															</span>
														</div>
														<p className="notification-message">{notification.message}</p>
													</div>
												))}
												{notifications.length > 5 && (
													<div className="view-all-notifications">
														<button 
															onClick={() => {
																setShowNotificationPopup(false)
																onSectionChange && onSectionChange('messages')
															}}
															className="view-all-btn"
														>
															View All Notifications ({notifications.length})
														</button>
													</div>
												)}
											</div>
										)}
									</div>
								</div>
							)}
						</div>
						
						{/* Profile Dropdown */}
						<div className="profile-dropdown">
							<button 
								className="profile-trigger"
								onClick={() => setShowProfileDropdown(!showProfileDropdown)}
							>
								<div className="profile-avatar">
									{user?.firstName?.charAt(0)?.toUpperCase()}
								</div>
								<span className="profile-name">{`${user?.firstName} ${user?.lastName}`}</span>
								<span className="dropdown-arrow">▼</span>
							</button>
							
							{showProfileDropdown && (
								<div className="profile-dropdown-menu">
									<button 
										className="dropdown-item"
										onClick={() => {
											setShowAccountManagement(true)
											setShowProfileDropdown(false)
										}}
									>
										<span className="dropdown-icon">👤</span>
										View My Profile
									</button>
									{/* Show logout in dropdown on mobile */}
									<div className="mobile-logout">
										<div className="dropdown-divider"></div>
										<button className="dropdown-item logout-item" onClick={handleLogout}>
											<LogOut size={16} />
											Logout
										</button>
									</div>
								</div>
							)}
						</div>
					</div>
				</header>
				<section className="dash-content">{children}</section>
			</main>

			{/* Account Management Modal */}
			{showAccountManagement && (
				<div className="modal-overlay" onClick={() => setShowAccountManagement(false)}>
					<div className="modal account-modal" onClick={e => e.stopPropagation()}>
						<div className="modal-header">
							<h2>Account Management</h2>
							<button 
								className="close-btn" 
								onClick={() => setShowAccountManagement(false)}
							>
								×
							</button>
						</div>
						
						<div className="account-tabs">
							<button 
								className={`tab-btn ${!showPasswordChange ? 'active' : ''}`}
								onClick={() => setShowPasswordChange(false)}
							>
								Profile Information
							</button>
							<button 
								className={`tab-btn ${showPasswordChange ? 'active' : ''}`}
								onClick={() => setShowPasswordChange(true)}
							>
								Change Password
							</button>
						</div>

						{!showPasswordChange ? (
							<div className="account-form-section">
								<form onSubmit={handleAccountUpdate}>
									<div className="profile-info-grid">
										<div className="form-group">
											<label>First Name</label>
                                            <input
												type="text"
												value={accountForm.firstName}
                                                onChange={(e) => setAccountForm({...accountForm, firstName: e.target.value})}
                                                onKeyDown={(e) => {
                                                    if ((e.target.value || '').length === 0) {
                                                        const controlKeys = ['Backspace','Tab','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End','Delete']
                                                        if (!controlKeys.includes(e.key) && !/^[A-Za-z]$/.test(e.key)) e.preventDefault()
                                                    }
                                                }}
                                                onPaste={(e) => {
                                                    if ((e.target.value || '').length === 0) {
                                                        const pasted = (e.clipboardData || window.clipboardData).getData('text')
                                                        if (pasted && !/^[A-Za-z]/.test(pasted.trimStart())) e.preventDefault()
                                                    }
                                                }}
												required
											/>
										</div>
										<div className="form-group">
											<label>Last Name</label>
                                            <input
												type="text"
												value={accountForm.lastName}
                                                onChange={(e) => setAccountForm({...accountForm, lastName: e.target.value})}
                                                onKeyDown={(e) => {
                                                    if ((e.target.value || '').length === 0) {
                                                        const controlKeys = ['Backspace','Tab','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End','Delete']
                                                        if (!controlKeys.includes(e.key) && !/^[A-Za-z]$/.test(e.key)) e.preventDefault()
                                                    }
                                                }}
                                                onPaste={(e) => {
                                                    if ((e.target.value || '').length === 0) {
                                                        const pasted = (e.clipboardData || window.clipboardData).getData('text')
                                                        if (pasted && !/^[A-Za-z]/.test(pasted.trimStart())) e.preventDefault()
                                                    }
                                                }}
												required
											/>
										</div>
										<div className="form-group">
											<label>Email</label>
											<input
												type="email"
												value={accountForm.email}
												onChange={(e) => setAccountForm({...accountForm, email: e.target.value})}
												required
											/>
										</div>
										<div className="form-group">
											<label>Phone</label>
                                            <input
												type="tel"
												value={accountForm.phone}
												onChange={(e) => setAccountForm({...accountForm, phone: e.target.value})}
											/>
										</div>
										<div className="form-group">
											<label>Address</label>
											<input
												type="text"
												value={accountForm.address}
												onChange={(e) => setAccountForm({...accountForm, address: e.target.value})}
											/>
										</div>
									</div>
									<div className="modal-actions">
										<button type="button" className="cancel-btn" onClick={() => setShowAccountManagement(false)}>
											Cancel
										</button>
										<button type="submit" className="submit-btn">
											Update Profile
										</button>
									</div>
								</form>
							</div>
						) : (
							<div className="password-form-section">
								<form onSubmit={handleChangePassword}>
									<div className="form-group">
										<label>Current Password</label>
										<input
											type="password"
											value={passwordForm.currentPassword}
											onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
											required
										/>
									</div>
									<div className="form-group">
										<label>New Password</label>
										<input
											type="password"
											value={passwordForm.newPassword}
											onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
											required
										/>
									</div>
									<div className="form-group">
										<label>Confirm New Password</label>
										<input
											type="password"
											value={passwordForm.confirmPassword}
											onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
											required
										/>
									</div>
									<div className="modal-actions">
										<button type="button" className="cancel-btn" onClick={() => setShowPasswordChange(false)}>
											Cancel
										</button>
										<button type="submit" className="submit-btn">
											Change Password
										</button>
									</div>
								</form>
							</div>
						)}
					</div>
				</div>
			)}
		</div>
	)
}

export default DashboardLayout

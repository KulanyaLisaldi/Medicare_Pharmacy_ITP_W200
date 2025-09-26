import React, { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import './DashboardLayout.css'
import { useAuth } from '../context/AuthContext'
import { LogOut, Bell } from 'lucide-react'

const DashboardLayout = ({ sidebarItems = [], title, children, onSectionChange, activeSection, notificationCount = 0, notifications = [] }) => {
	const location = useLocation()
	const navigate = useNavigate()
	const { user, logout, updateProfile } = useAuth()
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
	const [fieldErrors, setFieldErrors] = useState({
		firstName: '',
		lastName: '',
		email: '',
		phone: '',
		newPassword: '',
		confirmPassword: ''
	})
	const [isChangingPassword, setIsChangingPassword] = useState(false)

	const handleLogout = () => {
		logout()
		navigate('/login')
	}

	// Validation functions for account form
	const preventInvalidNameChar = (e) => {
		const isNameField = e.target.name === 'firstName' || e.target.name === 'lastName';
		if (!isNameField) return;
		const key = e.key || '';
		if (e.type === 'keydown') {
			const controlKeys = ['Backspace','Tab','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End','Delete'];
			if (controlKeys.includes(key)) return;
			// Block any non-letter characters (including numbers, symbols, etc.)
			if (!/^[A-Za-z ]$/.test(key)) {
				e.preventDefault();
				if (/^[0-9]$/.test(key)) {
					setFieldErrors(prev => ({
						...prev,
						[e.target.name]: 'Numbers are not allowed in name fields'
					}));
				} else {
					setFieldErrors(prev => ({
						...prev,
						[e.target.name]: 'Only letters and spaces are allowed'
					}));
				}
			}
		}
	};

	const preventInvalidNamePaste = (e) => {
		const isNameField = e.target.name === 'firstName' || e.target.name === 'lastName';
		if (!isNameField) return;
		const pasted = (e.clipboardData || window.clipboardData).getData('text');
		if (pasted && !/^[A-Za-z ]+$/.test(pasted)) {
			e.preventDefault();
			if (/[0-9]/.test(pasted)) {
				setFieldErrors(prev => ({
					...prev,
					[e.target.name]: 'Numbers are not allowed in name fields'
				}));
			} else {
				setFieldErrors(prev => ({
					...prev,
					[e.target.name]: 'Only letters and spaces are allowed'
				}));
			}
		}
	};

	const handlePhoneKeyDown = (e) => {
		const { name } = e.target;
		if (name === 'phone') {
			const current = e.target.value || '';
			const key = e.key || '';
			
			// Allow control keys
			const controlKeys = ['Backspace','Tab','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End','Delete'];
			if (controlKeys.includes(key)) return;
			
			// Block any non-digit characters (letters, symbols, etc.)
			if (!/^[0-9]$/.test(key)) {
				e.preventDefault();
				if (/^[A-Za-z]$/.test(key)) {
					setFieldErrors(prev => ({
						...prev,
						[name]: 'Letters are not allowed in phone number'
					}));
				} else if (key === '-') {
					setFieldErrors(prev => ({
						...prev,
						[name]: 'Minus (-) values are not allowed'
					}));
				} else {
					setFieldErrors(prev => ({
						...prev,
						[name]: 'Only numbers are allowed in phone number'
					}));
				}
				return;
			}
			
			// Check length limit - exactly 10 digits
			if (/^[0-9]$/.test(key) && current.length >= 10) {
				e.preventDefault();
				setFieldErrors(prev => ({
					...prev,
					[name]: 'Phone number must be exactly 10 digits'
				}));
			}
		}
	};

	const handlePhonePaste = (e) => {
		const { name } = e.target;
		if (name === 'phone') {
			const pastedText = (e.clipboardData || window.clipboardData).getData('text');
			const digitsOnly = pastedText.replace(/\D/g, '');
			
			// Block if contains letters
			if (/[A-Za-z]/.test(pastedText)) {
				e.preventDefault();
				setFieldErrors(prev => ({
					...prev,
					[name]: 'Letters are not allowed in phone number'
				}));
			} else if (pastedText.includes('-')) {
				e.preventDefault();
				setFieldErrors(prev => ({
					...prev,
					[name]: 'Minus (-) values are not allowed'
				}));
			} else if (digitsOnly.length > 10) {
				e.preventDefault();
				setFieldErrors(prev => ({
					...prev,
					[name]: 'Phone number must be exactly 10 digits'
				}));
			} else if (!/^[0-9]+$/.test(pastedText)) {
				e.preventDefault();
				setFieldErrors(prev => ({
					...prev,
					[name]: 'Only numbers are allowed in phone number'
				}));
			}
		}
	};

	const handleAccountFormChange = (e) => {
		const { name, value } = e.target;
		
		// Special handling for phone field - clean and limit input
		if (name === 'phone') {
			// Remove all non-digit characters and limit to 10 digits
			const digitsOnly = value.replace(/\D/g, '').slice(0, 10);
			
			// Update the form with cleaned value
			setAccountForm(prev => ({ ...prev, [name]: digitsOnly }));
			
			// Check for letters in original input
			if (/[A-Za-z]/.test(value)) {
				setFieldErrors(prev => ({
					...prev,
					[name]: 'Letters are not allowed in phone number'
				}));
			} else if (value.trim() && digitsOnly.length === 10 && !/^07\d{8}$/.test(digitsOnly)) {
				setFieldErrors(prev => ({
					...prev,
					[name]: 'Phone must be 10 digits (Sri Lanka format: 07XXXXXXXX)'
				}));
			} else {
				setFieldErrors(prev => ({
					...prev,
					[name]: ''
				}));
			}
			return; // Exit early to prevent double setting
		}
		
		setAccountForm(prev => ({ ...prev, [name]: value }));
		
		// Clear field-specific error when user types
		if (fieldErrors[name]) {
			setFieldErrors(prev => ({
				...prev,
				[name]: ''
			}));
		}
		
		// Real-time validation for name fields
		if (name === 'firstName' || name === 'lastName') {
			if (/[0-9]/.test(value)) {
				setFieldErrors(prev => ({
					...prev,
					[name]: 'Numbers are not allowed in name fields'
				}));
			} else if (value.trim() && !/^[A-Za-z ]+$/.test(value)) {
				setFieldErrors(prev => ({
					...prev,
					[name]: 'Only letters and spaces are allowed'
				}));
			} else {
				setFieldErrors(prev => ({
					...prev,
					[name]: ''
				}));
			}
		}
		
		// Real-time validation for email field
		if (name === 'email') {
			if (value.trim() && !value.includes('@')) {
				setFieldErrors(prev => ({
					...prev,
					[name]: 'Email must contain @ symbol'
				}));
			} else if (value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
				setFieldErrors(prev => ({
					...prev,
					[name]: 'Please enter a valid email address'
				}));
			} else {
				setFieldErrors(prev => ({
					...prev,
					[name]: ''
				}));
			}
		}
	};

	const handlePasswordFormChange = (e) => {
		const { name, value } = e.target;
		
		setPasswordForm(prev => ({ ...prev, [name]: value }));
		
		// Clear field-specific error when user types
		if (fieldErrors[name]) {
			setFieldErrors(prev => ({
				...prev,
				[name]: ''
			}));
		}
		
		// Real-time validation for new password field
		if (name === 'newPassword') {
			const pwRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@#$%!]).{8,}$/;
			
			if (value.trim() && !pwRegex.test(value)) {
				setFieldErrors(prev => ({
					...prev,
					[name]: 'Password must be 8+ chars with uppercase, lowercase, number and special (@,#,$,%,!)'
				}));
			} else {
				setFieldErrors(prev => ({
					...prev,
					[name]: ''
				}));
			}
		}
		
		// Real-time validation for confirm password field
		if (name === 'confirmPassword') {
			if (value.trim() && value !== passwordForm.newPassword) {
				setFieldErrors(prev => ({
					...prev,
					[name]: 'Passwords do not match'
				}));
			} else {
				setFieldErrors(prev => ({
					...prev,
					[name]: ''
				}));
			}
		}
	};

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
        
        // Comprehensive validation
        let hasErrors = false;
        const newFieldErrors = {};
        
        // First name validation
        if (!accountForm.firstName.trim()) {
            newFieldErrors.firstName = 'First name is required';
            hasErrors = true;
        } else if (/[0-9]/.test(accountForm.firstName)) {
            newFieldErrors.firstName = 'Numbers are not allowed in name fields';
            hasErrors = true;
        } else if (!/^[A-Za-z ]+$/.test(accountForm.firstName)) {
            newFieldErrors.firstName = 'Only letters and spaces are allowed';
            hasErrors = true;
        } else {
            newFieldErrors.firstName = '';
        }
        
        // Last name validation
        if (!accountForm.lastName.trim()) {
            newFieldErrors.lastName = 'Last name is required';
            hasErrors = true;
        } else if (/[0-9]/.test(accountForm.lastName)) {
            newFieldErrors.lastName = 'Numbers are not allowed in name fields';
            hasErrors = true;
        } else if (!/^[A-Za-z ]+$/.test(accountForm.lastName)) {
            newFieldErrors.lastName = 'Only letters and spaces are allowed';
            hasErrors = true;
        } else {
            newFieldErrors.lastName = '';
        }
        
        // Email validation
        if (!accountForm.email.trim()) {
            newFieldErrors.email = 'Email is required';
            hasErrors = true;
        } else if (!accountForm.email.includes('@')) {
            newFieldErrors.email = 'Email must contain @ symbol';
            hasErrors = true;
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(accountForm.email)) {
            newFieldErrors.email = 'Please enter a valid email address';
            hasErrors = true;
        } else {
            newFieldErrors.email = '';
        }
        
        // Phone validation
        if (accountForm.phone.trim()) {
            const digitsOnly = accountForm.phone.replace(/\D/g, '');
            if (/[A-Za-z]/.test(accountForm.phone)) {
                newFieldErrors.phone = 'Letters are not allowed in phone number';
                hasErrors = true;
            } else if (digitsOnly.length !== 10) {
                newFieldErrors.phone = 'Phone number must be exactly 10 digits';
                hasErrors = true;
            } else if (!/^07\d{8}$/.test(digitsOnly)) {
                newFieldErrors.phone = 'Phone must be 10 digits (Sri Lanka format: 07XXXXXXXX)';
                hasErrors = true;
            } else {
                newFieldErrors.phone = '';
            }
        } else {
            newFieldErrors.phone = '';
        }
        
        // Address validation
        if (!accountForm.address.trim()) {
            alert('Address is required');
            return;
        }
        
        // Set field errors
        setFieldErrors(newFieldErrors);
        
        if (hasErrors) {
            return;
        }
        
        try {
            await updateProfile(accountForm)
            setShowAccountManagement(false)
            setFieldErrors({
                firstName: '',
                lastName: '',
                email: '',
                phone: '',
                newPassword: '',
                confirmPassword: ''
            });
        } catch (error) {
            console.error('Error updating profile:', error)
        }
    }

	const handleChangePassword = async (e) => {
		e.preventDefault()
		
		// Comprehensive password validation
		let hasErrors = false;
		const newFieldErrors = {};
		
		// Current password validation
		if (!passwordForm.currentPassword.trim()) {
			alert('Current password is required');
			return;
		}
		
		// New password validation
		const pwRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@#$%!]).{8,}$/;
		if (!passwordForm.newPassword.trim()) {
			newFieldErrors.newPassword = 'New password is required';
			hasErrors = true;
		} else if (!pwRegex.test(passwordForm.newPassword)) {
			newFieldErrors.newPassword = 'Password must be 8+ chars with uppercase, lowercase, number and special (@,#,$,%,!)';
			hasErrors = true;
		} else {
			newFieldErrors.newPassword = '';
		}
		
		// Confirm password validation
		if (!passwordForm.confirmPassword.trim()) {
			newFieldErrors.confirmPassword = 'Please confirm your new password';
			hasErrors = true;
		} else if (passwordForm.newPassword !== passwordForm.confirmPassword) {
			newFieldErrors.confirmPassword = 'Passwords do not match';
			hasErrors = true;
		} else {
			newFieldErrors.confirmPassword = '';
		}
		
		// Set field errors
		setFieldErrors(prev => ({
			...prev,
			...newFieldErrors
		}));
		
		if (hasErrors) {
			return;
		}
		
		try {
			setIsChangingPassword(true);
			const token = localStorage.getItem('token');
			if (!token) {
				alert('Please log in again');
				return;
			}

			const response = await fetch('http://localhost:5001/api/users/change-password', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${token}`
				},
				body: JSON.stringify({
					currentPassword: passwordForm.currentPassword,
					newPassword: passwordForm.newPassword
				})
			});

			const data = await response.json();

			if (response.ok) {
				// Success
				alert('Password changed successfully!');
				setShowPasswordChange(false);
				setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
				setFieldErrors(prev => ({
					...prev,
					newPassword: '',
					confirmPassword: ''
				}));
			} else {
				// Error
				alert(data.message || 'Failed to change password');
			}
		} catch (error) {
			console.error('Error changing password:', error);
			alert('Network error. Please try again.');
		} finally {
			setIsChangingPassword(false);
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
								<Bell size={20} />
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
														className="notification-item"
													>
														<div className="notification-item-header">
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
						
						{/* Profile Section */}
						<div className="profile-section">
							<button 
								className="profile-trigger"
								onClick={() => setShowAccountManagement(true)}
							>
								<div className="profile-avatar">
									{user?.firstName?.charAt(0)?.toUpperCase()}
								</div>
								<span className="profile-name">{`${user?.firstName} ${user?.lastName}`}</span>
							</button>
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
									<div className="profile-layout-grid">
										{/* Left Side - Profile Section */}
										<div className="profile-section">
											<div className="profile-avatar-large">
												{user?.firstName?.charAt(0)?.toUpperCase()}
											</div>
											<div className="profile-name-large">
												{`${user?.firstName} ${user?.lastName}`}
											</div>
											<div className="profile-email">
												{user?.email}
											</div>
										</div>
										
										{/* Right Side - Form Fields */}
										<div className="form-section">
											<div className="form-group">
												<label>First Name</label>
												<input
													type="text"
													name="firstName"
													value={accountForm.firstName}
													onChange={handleAccountFormChange}
													onKeyDown={preventInvalidNameChar}
													onPaste={preventInvalidNamePaste}
													required
													className={fieldErrors.firstName ? 'error' : ''}
												/>
												{fieldErrors.firstName && (
													<p className="field-error">{fieldErrors.firstName}</p>
												)}
											</div>
											<div className="form-group">
												<label>Last Name</label>
												<input
													type="text"
													name="lastName"
													value={accountForm.lastName}
													onChange={handleAccountFormChange}
													onKeyDown={preventInvalidNameChar}
													onPaste={preventInvalidNamePaste}
													required
													className={fieldErrors.lastName ? 'error' : ''}
												/>
												{fieldErrors.lastName && (
													<p className="field-error">{fieldErrors.lastName}</p>
												)}
											</div>
											<div className="form-group">
												<label>Email</label>
												<input
													type="email"
													name="email"
													value={accountForm.email}
													onChange={handleAccountFormChange}
													required
													className={fieldErrors.email ? 'error' : ''}
												/>
												{fieldErrors.email && (
													<p className="field-error">{fieldErrors.email}</p>
												)}
											</div>
											<div className="form-group">
												<label>Phone</label>
												<input
													type="tel"
													name="phone"
													value={accountForm.phone}
													onChange={handleAccountFormChange}
													onKeyDown={handlePhoneKeyDown}
													onPaste={handlePhonePaste}
													className={fieldErrors.phone ? 'error' : ''}
													placeholder="07XXXXXXXX"
												/>
												{fieldErrors.phone && (
													<p className="field-error">{fieldErrors.phone}</p>
												)}
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
											name="newPassword"
											value={passwordForm.newPassword}
											onChange={handlePasswordFormChange}
											required
											className={fieldErrors.newPassword ? 'error' : ''}
										/>
										{fieldErrors.newPassword && (
											<p className="field-error">{fieldErrors.newPassword}</p>
										)}
									</div>
									<div className="form-group">
										<label>Confirm New Password</label>
										<input
											type="password"
											name="confirmPassword"
											value={passwordForm.confirmPassword}
											onChange={handlePasswordFormChange}
											required
											className={fieldErrors.confirmPassword ? 'error' : ''}
										/>
										{fieldErrors.confirmPassword && (
											<p className="field-error">{fieldErrors.confirmPassword}</p>
										)}
									</div>
									<div className="modal-actions">
										<button type="button" className="cancel-btn" onClick={() => setShowPasswordChange(false)} disabled={isChangingPassword}>
											Cancel
										</button>
										<button type="submit" className="submit-btn" disabled={isChangingPassword}>
											{isChangingPassword ? 'Changing...' : 'Change Password'}
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

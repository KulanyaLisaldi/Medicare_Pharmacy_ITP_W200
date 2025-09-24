import React, { useState, useEffect } from 'react'
import DashboardLayout from '../../layouts/DashboardLayout'
import './DeliveryDashboard.css'
import { useAuth } from '../../context/AuthContext'

const DeliveryDashboard = () => {
	const [activeSection, setActiveSection] = useState('overview')
	const [deliveryStats, setDeliveryStats] = useState({
		activeDeliveries: 0,
		completedToday: 0,
		pending: 0,
		todayEarnings: 0
	})
	const [statsLoading, setStatsLoading] = useState(true)
	const [recentDeliveries, setRecentDeliveries] = useState([])
	const [recentDeliveriesLoading, setRecentDeliveriesLoading] = useState(true)
	const [notifications, setNotifications] = useState([])
	const [notificationCount, setNotificationCount] = useState(0)
	const { token } = useAuth()

	const sidebar = [
		{ id: 'overview', label: 'Overview', icon: '🏠' },
		{ id: 'assignments', label: 'Assignments', icon: '🛵' },
		{ id: 'history', label: 'History', icon: '🗂️' },
		{ id: 'earnings', label: 'Earnings', icon: '💰' },
		{ id: 'messages', label: 'Notifications', icon: '💬' },
	]

	const fetchDeliveryStats = async () => {
		try {
			setStatsLoading(true)
			const res = await fetch('http://localhost:5001/api/delivery/stats', {
				headers: { 'Authorization': `Bearer ${token}` }
			})
			
			// Check if response is HTML (error page) instead of JSON
			const contentType = res.headers.get('content-type')
			if (!contentType || !contentType.includes('application/json')) {
				throw new Error('Server returned HTML instead of JSON. Backend server may not be running.')
			}
			
			const data = await res.json()
			if (res.ok) {
				setDeliveryStats(data)
			} else {
				console.error('Failed to fetch delivery stats:', data.message)
			}
		} catch (error) {
			console.error('Error fetching delivery stats:', error)
			// Set default stats to prevent UI issues
			setDeliveryStats({
				activeDeliveries: 0,
				completedToday: 0,
				pending: 0,
				todayEarnings: 0
			})
		} finally {
			setStatsLoading(false)
		}
	}

	const fetchRecentDeliveries = async () => {
		try {
			setRecentDeliveriesLoading(true)
			const res = await fetch('http://localhost:5001/api/delivery/recent', {
				headers: { 'Authorization': `Bearer ${token}` }
			})
			
			// Check if response is HTML (error page) instead of JSON
			const contentType = res.headers.get('content-type')
			if (!contentType || !contentType.includes('application/json')) {
				throw new Error('Server returned HTML instead of JSON. Backend server may not be running.')
			}
			
			const data = await res.json()
			if (res.ok) {
				setRecentDeliveries(data)
			} else {
				console.error('Failed to fetch recent deliveries:', data.message)
			}
		} catch (error) {
			console.error('Error fetching recent deliveries:', error)
			// Set empty array to prevent UI issues
			setRecentDeliveries([])
		} finally {
			setRecentDeliveriesLoading(false)
		}
	}

	const fetchNotifications = async () => {
		try {
			const res = await fetch('http://localhost:5001/api/delivery/notifications', {
				headers: { 'Authorization': `Bearer ${token}` }
			})
			
			// Check if response is HTML (error page) instead of JSON
			const contentType = res.headers.get('content-type')
			if (!contentType || !contentType.includes('application/json')) {
				throw new Error('Server returned HTML instead of JSON. Backend server may not be running.')
			}
			
			const data = await res.json()
			if (res.ok) {
				// Transform notifications to match DashboardLayout expectations
				const transformedNotifications = data.map(notification => ({
					id: notification._id,
					title: notification.title,
					message: notification.message,
					icon: notification.type === 'handover' ? '🚨' : '🔔',
					timestamp: new Date(notification.createdAt),
					priority: notification.priority || 'medium',
					read: notification.read,
					type: notification.type,
					handoverReason: notification.handoverReason,
					handoverDetails: notification.handoverDetails
				}))
				
				setNotifications(transformedNotifications)
				setNotificationCount(transformedNotifications.filter(n => !n.read).length)
			} else {
				console.error('Failed to fetch notifications:', data.message)
			}
		} catch (error) {
			console.error('Error fetching notifications:', error)
			// Set empty array to prevent UI issues
			setNotifications([])
			setNotificationCount(0)
		}
	}

	const markNotificationAsRead = async (notificationId) => {
		try {
			const res = await fetch(`http://localhost:5001/api/delivery/notifications/${notificationId}/read`, {
				method: 'PATCH',
				headers: { 'Authorization': `Bearer ${token}` }
			})
			
			if (res.ok) {
				// Update local state
				setNotifications(prev => 
					prev.map(notification => 
						notification.id === notificationId 
							? { ...notification, read: true }
							: notification
					)
				)
				setNotificationCount(prev => Math.max(0, prev - 1))
			} else {
				console.error('Failed to mark notification as read')
			}
		} catch (error) {
			console.error('Error marking notification as read:', error)
		}
	}

	const fetchAllData = async () => {
		await Promise.all([fetchDeliveryStats(), fetchRecentDeliveries(), fetchNotifications()])
	}

	const getStatusBadgeColor = (status) => {
		switch (status) {
			case 'assigned':
				return 'bg-purple-100 text-purple-800'
			case 'accepted':
				return 'bg-indigo-100 text-indigo-800'
			case 'picked_up':
				return 'bg-yellow-100 text-yellow-800'
			case 'delivered':
				return 'bg-green-100 text-green-800'
			case 'failed':
				return 'bg-red-100 text-red-800'
			default:
				return 'bg-gray-100 text-gray-800'
		}
	}

	const getStatusText = (status) => {
		switch (status) {
			case 'assigned':
				return 'Assigned'
			case 'accepted':
				return 'Accepted'
			case 'picked_up':
				return 'Picked Up'
			case 'delivered':
				return 'Delivered'
			case 'failed':
				return 'Failed'
			default:
				return status
		}
	}

	const formatDate = (dateString) => {
		if (!dateString) return 'N/A'
		const date = new Date(dateString)
		return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
	}

	useEffect(() => {
		if (token) {
			fetchAllData()
		}
	}, [token])

	const renderSection = () => {
		switch (activeSection) {
			case 'overview':
				return (
					<div className="delivery-overview">
						{/* Header with refresh button */}
						<div className="flex items-center justify-between mb-6">
							{/*<h2>Delivery Overview</h2>*/}
							<button 
								onClick={fetchAllData}
								disabled={statsLoading || recentDeliveriesLoading}
								className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
							>
								<span>🔄</span>
								{(statsLoading || recentDeliveriesLoading) ? 'Refreshing...' : 'Refresh Data'}
							</button>
						</div>

						{/* Stats Grid */}
						<div className="delivery-stats">
							<div className="stat-card">
								<div className="stat-icon">🛵</div>
								<h3>Active Deliveries</h3>
								<p className="stat-number">
									{statsLoading ? '...' : deliveryStats.activeDeliveries}
								</p>
								<span className="stat-change positive">Orders picked up and in transit</span>
							</div>
							<div className="stat-card">
								<div className="stat-icon">✅</div>
								<h3>Completed Today</h3>
								<p className="stat-number">
									{statsLoading ? '...' : deliveryStats.completedToday}
								</p>
								<span className="stat-change positive">Successfully delivered</span>
							</div>
							<div className="stat-card">
								<div className="stat-icon">⏳</div>
								<h3>Pending</h3>
								<p className="stat-number">
									{statsLoading ? '...' : deliveryStats.pending}
								</p>
								<span className="stat-change neutral">Assigned but not picked up</span>
							</div>
							<div className="stat-card">
								<div className="stat-icon">💰</div>
								<h3>Today's Earnings</h3>
								<p className="stat-number">
									{statsLoading ? '...' : `Rs.${deliveryStats.todayEarnings}`}
								</p>
								<span className="stat-change positive">From completed deliveries</span>
							</div>
						</div>

						{/* Quick Actions */}
						<div className="quick-actions-section">
							<h2>Quick Actions</h2>
							<div className="action-buttons">
								<button 
									className="action-btn secondary"
									onClick={() => setActiveSection('assignments')}
								>
									<span className="action-icon">📱</span>
									Update Status
								</button>
								<button 
									className="action-btn secondary"
									onClick={() => setActiveSection('assignments')}
								>
									<span className="action-icon">📋</span>
									View Route
								</button>
								<button 
									className="action-btn secondary"
									onClick={() => setActiveSection('messages')}
								>
									<span className="action-icon">📞</span>
									Contact Support
								</button>
							</div>
						</div>

						{/* Recent Deliveries */}
						<div className="recent-deliveries">
							<h2>Recent Assignments</h2>
							<div className="deliveries-list">
								{recentDeliveriesLoading ? (
									<div className="text-center py-4">
										<div className="text-gray-500">Loading recent deliveries...</div>
									</div>
								) : recentDeliveries.length === 0 ? (
									<div className="text-center py-4">
										<div className="text-gray-500">No recent deliveries found</div>
									</div>
								) : (
									recentDeliveries.map((delivery) => (
										<div key={delivery._id} className="delivery-item">
											<div className="delivery-info">
												<div className="delivery-id">#{delivery.orderId?.slice(-8) || 'N/A'}</div>
												<div className="delivery-customer">{delivery.customerName || 'N/A'}</div>
												<div className="delivery-address">{delivery.address}</div>
												<div className="delivery-time">
													{delivery.status === 'delivered' && delivery.deliveredAt 
														? `Delivered: ${formatDate(delivery.deliveredAt)}`
														: delivery.status === 'picked_up' && delivery.pickedUpAt
														? `Picked up: ${formatDate(delivery.pickedUpAt)}`
														: `Assigned: ${formatDate(delivery.assignedAt || delivery.createdAt)}`
													}
												</div>
											</div>
											<div className={`delivery-status ${getStatusBadgeColor(delivery.status)}`}>
												{getStatusText(delivery.status)}
											</div>
										</div>
									))
								)}
							</div>
						</div>

						{/* Performance Summary */}
						<div className="performance-summary">
							<h2>This Week's Performance</h2>
							<div className="performance-metrics">
								<div className="metric">
									<span className="metric-label">Total Deliveries</span>
									<span className="metric-value">67</span>
								</div>
								<div className="metric">
									<span className="metric-label">On-Time Rate</span>
									<span className="metric-value">94%</span>
								</div>
								<div className="metric">
									<span className="metric-label">Customer Rating</span>
									<span className="metric-value">4.8/5</span>
								</div>
								<div className="metric">
									<span className="metric-label">Weekly Earnings</span>
									<span className="metric-value">$312.75</span>
								</div>
							</div>
						</div>
					</div>
				);

			case 'assignments':
				return <AssignmentsSection />;

			case 'history':
				return (
					<div className="history-section">
						<h2>Delivery History</h2>
						<p>Delivery history features coming soon...</p>
					</div>
				);

			case 'earnings':
				return (
					<div className="earnings-section">
						<h2>Earnings & Payments</h2>
						<p>Earnings and payment features coming soon...</p>
					</div>
				);

			case 'messages':
				return (
					<div className="messages-section">
						<div className="flex items-center justify-between mb-6">
							<h2>Notifications</h2>
							<button 
								onClick={fetchNotifications}
								className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
							>
								Refresh
							</button>
						</div>

						{notifications.length === 0 ? (
							<div className="text-center py-8">
								<div className="text-gray-400 text-4xl mb-4">🔔</div>
								<p className="text-gray-500">No notifications at the moment</p>
							</div>
						) : (
							<div className="space-y-4">
								{notifications.map(notification => (
									<div 
										key={notification._id} 
										className={`p-4 rounded-lg border-l-4 transition-opacity ${
											notification.priority === 'high' 
												? 'border-red-500 bg-red-50' 
												: notification.priority === 'medium'
												? 'border-yellow-500 bg-yellow-50'
												: 'border-blue-500 bg-blue-50'
										} ${notification.read ? 'opacity-60' : ''}`}
									>
										<div className="flex items-start gap-3">
											<div className="text-2xl">{notification.icon || '🔔'}</div>
											<div className="flex-1">
												<div className="flex items-center justify-between">
													<div className="flex items-center gap-2">
														<h3 className={`font-semibold ${notification.read ? 'text-gray-600' : 'text-gray-900'}`}>
															{notification.title}
														</h3>
														{!notification.read && (
															<span className="w-2 h-2 bg-blue-500 rounded-full"></span>
														)}
													</div>
													<span className="text-xs text-gray-500">
														{notification.timestamp ? notification.timestamp.toLocaleString() : 'Just now'}
													</span>
												</div>
												<div className={`mt-1 ${notification.read ? 'text-gray-500' : 'text-gray-700'}`}>
													{notification.type === 'handover' ? (
														<div className="space-y-2">
															<p className="whitespace-pre-line">{notification.message}</p>
															{notification.handoverReason && (
																<div className="bg-orange-100 border border-orange-200 rounded-lg p-3 mt-2">
																	<div className="flex items-start gap-2">
																		<span className="text-orange-600 font-semibold">📝 Handover Notes:</span>
																	</div>
																	<div className="mt-1 text-sm">
																		<p><strong>Reason:</strong> {notification.handoverReason}</p>
																		{notification.handoverDetails && (
																			<p className="mt-1"><strong>Details:</strong> {notification.handoverDetails}</p>
																		)}
																	</div>
																</div>
															)}
														</div>
													) : (
														<p>{notification.message}</p>
													)}
												</div>
												<div className="flex items-center gap-2 mt-2">
													<span className={`px-2 py-1 rounded-full text-xs font-medium ${
														notification.priority === 'high' 
															? 'bg-red-100 text-red-800' 
															: notification.priority === 'medium'
															? 'bg-yellow-100 text-yellow-800'
															: 'bg-blue-100 text-blue-800'
													}`}>
														{notification.priority === 'high' ? 'High Priority' : 
														 notification.priority === 'medium' ? 'Medium Priority' : 'Low Priority'}
													</span>
													<span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
														{notification.type === 'handover' ? 'Handover Request' : 
														 notification.type === 'order' ? 'New Order' : 'System'}
													</span>
													{notification.read ? (
														<span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
															Read
														</span>
													) : (
														<button
															onClick={() => markNotificationAsRead(notification.id)}
															className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
														>
															Mark as Read
														</button>
													)}
												</div>
											</div>
										</div>
									</div>
								))}
							</div>
						)}
					</div>
				);

			default:
				return null;
		}
	}

	return (
		<DashboardLayout 
			title="Delivery Dashboard" 
			sidebarItems={sidebar}
			onSectionChange={setActiveSection}
			activeSection={activeSection}
			notificationCount={notificationCount}
			notifications={notifications.filter(n => !n.read)}
		>
			<div className="delivery-dashboard">
				{renderSection()}
			</div>
		</DashboardLayout>
	)
}

export default DeliveryDashboard

function AssignmentsSection() {
    const { token } = useAuth();
    const [availableOrders, setAvailableOrders] = useState([]);
    const [assignedOrders, setAssignedOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [showOrderDetails, setShowOrderDetails] = useState(false);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [newStatus, setNewStatus] = useState('');
    const [failureReason, setFailureReason] = useState('');
    const [activeTab, setActiveTab] = useState('available'); // 'available' or 'assigned'
    const [showHandoverModal, setShowHandoverModal] = useState(false);
    const [handoverReason, setHandoverReason] = useState('');
    const [handoverDetails, setHandoverDetails] = useState('');
    const [selectedAssignmentForHandover, setSelectedAssignmentForHandover] = useState(null);
    const [openDropdowns, setOpenDropdowns] = useState(new Set());
    const [availableAgents, setAvailableAgents] = useState([]);
    const [selectedAgentId, setSelectedAgentId] = useState('');

    const loadAvailableOrders = async () => {
        try {
            const res = await fetch('http://localhost:5001/api/delivery/available', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            // Check if response is HTML (error page) instead of JSON
            const contentType = res.headers.get('content-type')
            if (!contentType || !contentType.includes('application/json')) {
                console.warn('Server returned HTML instead of JSON. Backend server may not be running.')
                setAvailableOrders([]);
                return;
            }
            
            const data = await res.json();
            if (!res.ok) {
                console.warn('Failed to load available orders:', data.message);
                setAvailableOrders([]);
                return;
            }
            setAvailableOrders(data);
        } catch (e) {
            console.error('Error loading available orders:', e);
            // Don't set global error for this function to avoid interfering with handover
            setAvailableOrders([]);
        }
    };

    const loadAssignedOrders = async () => {
        try {
            const res = await fetch('http://localhost:5001/api/delivery/assigned', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            // Check if response is HTML (error page) instead of JSON
            const contentType = res.headers.get('content-type')
            if (!contentType || !contentType.includes('application/json')) {
                console.warn('Server returned HTML instead of JSON. Backend server may not be running.')
                setAssignedOrders([]);
                return;
            }
            
            const data = await res.json();
            if (!res.ok) {
                console.warn('Failed to load assigned orders:', data.message);
                setAssignedOrders([]);
                return;
            }
            setAssignedOrders(data);
        } catch (e) {
            console.error('Error loading assigned orders:', e);
            // Don't set global error for this function to avoid interfering with handover
            setAssignedOrders([]);
        }
    };

    const loadAvailableDeliveryAgents = async () => {
        try {
            const res = await fetch('http://localhost:5001/api/delivery/agents/available', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            const contentType = res.headers.get('content-type')
            if (!contentType || !contentType.includes('application/json')) {
                console.warn('Server returned HTML instead of JSON. Backend server may not be running.')
                setAvailableAgents([]);
                return;
            }
            
            const data = await res.json();
            if (!res.ok) {
                console.warn('Failed to load available agents:', data.message);
                setAvailableAgents([]);
                return;
            }
            setAvailableAgents(data);
        } catch (e) {
            console.error('Error loading available agents:', e);
            setAvailableAgents([]);
        }
    };

    const loadAllData = async () => {
        setLoading(true);
        setError(''); // Clear any existing errors when loading data
        try {
            await Promise.all([loadAvailableOrders(), loadAssignedOrders()]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) loadAllData();
    }, [token]);

    // Clear error when handover modal is opened
    useEffect(() => {
        if (showHandoverModal) {
            setError('');
        }
    }, [showHandoverModal]);

    // Clear error when component mounts or token changes
    useEffect(() => {
        setError('');
    }, [token]);

    const acceptOrder = async (orderId) => {
        try {
            const res = await fetch(`http://localhost:5001/api/delivery/orders/${orderId}/accept`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            const data = await res.json();
            if (res.ok) {
                // Remove from available orders and add to assigned orders
                setAvailableOrders(prev => prev.filter(order => order._id !== orderId));
                setAssignedOrders(prev => [data.assignment, ...prev]);
                alert('Order accepted successfully!');
            } else {
                throw new Error(data.message || 'Failed to accept order');
            }
        } catch (error) {
            setError(error.message);
        }
    };

    const acceptHandoverOrder = async (orderId) => {
        try {
            const res = await fetch(`http://localhost:5001/api/delivery/orders/${orderId}/accept-handover`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            
            if (!res.ok) {
                const errorData = await res.json();
                console.error('Accept handover error:', errorData);
                throw new Error(errorData.message || 'Failed to accept handover order');
            }
            
            const data = await res.json();
            
            // Remove from available orders and add to assigned orders
            setAvailableOrders(prev => prev.filter(order => order._id !== orderId));
            setAssignedOrders(prev => [data.assignment, ...prev]);
            alert('Handover order accepted successfully! You are now responsible for this delivery.');
        } catch (error) {
            console.error('Accept handover error:', error);
            setError(error.message);
        }
    };

    const rejectOrder = async (orderId) => {
        try {
            const res = await fetch(`http://localhost:5001/api/delivery/orders/${orderId}/reject`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            const data = await res.json();
            if (res.ok) {
                // Remove from available orders
                setAvailableOrders(prev => prev.filter(order => order._id !== orderId));
                alert('Order rejected');
            } else {
                throw new Error(data.message || 'Failed to reject order');
            }
        } catch (error) {
            setError(error.message);
        }
    };

    const updateDeliveryStatus = async (assignmentId, status, reason = '') => {
        try {
            const updateData = { status };
            if (status === 'failed' && reason) {
                updateData.failureReason = reason;
            }
            
            const res = await fetch(`http://localhost:5001/api/delivery/assignments/${assignmentId}/status`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updateData)
            });
            
            const data = await res.json();
            if (res.ok) {
                setAssignedOrders(prev => prev.map(assignment => 
                    assignment._id === assignmentId ? data.assignment : assignment
                ));
                setShowStatusModal(false);
                setSelectedOrder(null);
                setNewStatus('');
                setFailureReason('');
            } else {
                throw new Error(data.message || 'Failed to update delivery status');
            }
        } catch (error) {
            setError(error.message);
        }
    };

    const initiateHandover = async (assignment) => {
        setSelectedAssignmentForHandover(assignment);
        setShowHandoverModal(true);
        setError(''); // Clear any existing errors
        setSelectedAgentId(''); // Reset agent selection
        setHandoverReason(''); // Reset reason
        setHandoverDetails(''); // Reset details
        // Load available agents when opening modal
        await loadAvailableDeliveryAgents();
    };

    const closeHandoverModal = () => {
        setShowHandoverModal(false);
        setSelectedAssignmentForHandover(null);
        setHandoverReason('');
        setHandoverDetails('');
        setSelectedAgentId('');
        setError(''); // Clear any errors when closing
        // Force clear error state
        setTimeout(() => setError(''), 0);
    };

    const submitHandover = async () => {
        
        if (!handoverReason.trim()) {
            setError('Please select a reason for handover from the dropdown menu.');
            return;
        }

        if (!selectedAgentId) {
            setError('Please select a delivery agent to hand over to.');
            return;
        }

        if (!selectedAssignmentForHandover || !selectedAssignmentForHandover.order) {
            setError('No assignment selected for handover. Please try again.');
            return;
        }

        // Clear any existing errors at the start
        setError('');

        try {
            console.log('Starting handover process...');
            
            // Call the backend API for handover
            console.log('Calling backend handover API...');
            console.log('Assignment ID being sent:', selectedAssignmentForHandover._id);
            console.log('Full assignment object:', selectedAssignmentForHandover);
            const res = await fetch(`http://localhost:5001/api/delivery/assignments/${selectedAssignmentForHandover._id}/handover`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    reason: handoverReason,
                    details: handoverDetails,
                    targetAgentId: selectedAgentId
                })
            });
            
            console.log('Backend API response status:', res.status);
            
            if (!res.ok) {
                let errorData;
                try {
                    errorData = await res.json();
                } catch (parseError) {
                    console.error('Failed to parse error response:', parseError);
                    errorData = { message: `HTTP ${res.status}: ${res.statusText}` };
                }
                console.error('Backend API error:', errorData);
                console.error('Response status:', res.status);
                console.error('Response headers:', Object.fromEntries(res.headers.entries()));
                throw new Error(errorData.message || `Failed to handover order (HTTP ${res.status})`);
            }
            
            const data = await res.json();
            console.log('Backend API success:', data);
            
            // Clear error state immediately after successful API call
            setError('');
            console.log('Cleared error state after successful API call');
            
            // Show success message immediately
            const selectedAgent = availableAgents.find(agent => agent._id === selectedAgentId);
            const agentName = selectedAgent ? `${selectedAgent.firstName} ${selectedAgent.lastName}` : 'Selected Agent';
            alert(`Handover request submitted successfully!\nReason: ${handoverReason}\nDetails: ${handoverDetails}\n\nOrder has been directly assigned to ${agentName}.`);
            
            // Force clear error state multiple times to prevent race conditions
            setError('');
            setTimeout(() => setError(''), 0);
            setTimeout(() => setError(''), 50);
            
            // Close modal immediately after success
            setShowHandoverModal(false);
            setHandoverReason('');
            setHandoverDetails('');
            setSelectedAssignmentForHandover(null);
            
            // Perform non-critical operations after modal is closed
            setTimeout(() => {
                performPostHandoverOperations();
            }, 100);
            
        } catch (error) {
            console.error('=== HANDOVER DEBUG END - ERROR ===');
            console.error('Handover error details:', error);
            console.error('Error message:', error.message);
            console.error('Error stack:', error.stack);
            
            // Only set error if it's actually a handover API error
            if (error.message && 
                !error.message.includes('loadAvailableOrders') && 
                !error.message.includes('refresh') &&
                !error.message.includes('notification') &&
                !error.message.includes('assigned orders')) {
                setError('Failed to submit handover request. Please try again.');
            } else {
                console.warn('Non-critical error during handover, not setting error state:', error.message);
                // Clear error state for non-critical errors
                setError('');
            }
        }
    };

    const performPostHandoverOperations = async () => {
        try {
            // Remove from assigned orders (backend has already processed the handover)
            console.log('Removing from assigned orders...');
            setAssignedOrders(prev => {
                const filtered = prev.filter(assignment => assignment._id !== selectedAssignmentForHandover._id);
                console.log('Assigned orders after removal:', filtered);
                return filtered;
            });
            
            // Refresh available orders to show the handed-over order to other agents
            console.log('Refreshing available orders...');
            await loadAvailableOrders();
            console.log('Available orders refreshed successfully');
            
            // Create notification for other delivery agents
            console.log('Creating notification...');
            const handoverNotification = {
                _id: `handover-${Date.now()}`,
                title: '🚨 Handover Request Available',
                message: `Order #${selectedAssignmentForHandover.order._id.slice(-8)} has been handed over due to: ${handoverReason}`,
                type: 'handover',
                priority: 'high',
                icon: '🚨',
                read: false,
                createdAt: new Date().toISOString(),
                orderId: selectedAssignmentForHandover.order._id,
                handoverReason: handoverReason,
                handoverDetails: handoverDetails
            };
            console.log('Notification created:', handoverNotification);
            
            // Add notification to the list
            console.log('Adding notification to list...');
            setNotifications(prev => {
                const updated = [handoverNotification, ...prev];
                console.log('Notifications after addition:', updated);
                return updated;
            });
            setNotificationCount(prev => {
                const newCount = prev + 1;
                console.log('Notification count updated to:', newCount);
                return newCount;
            });
            
            console.log('Post-handover operations completed successfully');
            
        } catch (error) {
            console.warn('Error in post-handover operations (non-critical):', error);
            // Don't set error state for post-handover operations
        }
    };

    const toggleDropdown = (assignmentId) => {
        setOpenDropdowns(prev => {
            const newSet = new Set(prev);
            if (newSet.has(assignmentId)) {
                newSet.delete(assignmentId);
            } else {
                newSet.add(assignmentId);
            }
            return newSet;
        });
    };

    const openStatusModal = (order, status) => {
        setSelectedOrder(order);
        setNewStatus(status);
        setShowStatusModal(true);
    };

    const handleStatusUpdate = () => {
        if (selectedOrder && newStatus) {
            updateDeliveryStatus(selectedOrder._id, newStatus, failureReason);
        }
    };

    const getStatusBadgeColor = (status) => {
        switch (status) {
            case 'available':
                return 'bg-blue-100 text-blue-800';
            case 'assigned':
                return 'bg-purple-100 text-purple-800';
            case 'accepted':
                return 'bg-indigo-100 text-indigo-800';
            case 'picked_up':
                return 'bg-yellow-100 text-yellow-800';
            case 'delivered':
                return 'bg-green-100 text-green-800';
            case 'failed':
                return 'bg-red-100 text-red-800';
            case 'rejected':
                return 'bg-gray-100 text-gray-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'available':
                return 'Available';
            case 'assigned':
                return 'Assigned';
            case 'accepted':
                return 'Accepted';
            case 'picked_up':
                return 'Picked Up';
            case 'delivered':
                return 'Delivered';
            case 'failed':
                return 'Failed';
            case 'rejected':
                return 'Rejected';
            default:
                return status;
        }
    };

    const deleteAssignment = async (assignmentId) => {
        if (!confirm('Are you sure you want to delete this assignment? The order will become available for other delivery agents.')) {
            return;
        }

        try {
            const res = await fetch(`http://localhost:5001/api/delivery/assignments/${assignmentId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const data = await res.json();
            
            if (res.ok) {
                // Remove from assigned orders
                setAssignedOrders(prev => prev.filter(assignment => assignment._id !== assignmentId));
                alert('Assignment deleted successfully! Order is now available for other delivery agents.');
                
                // Reload available orders to show the order again
                loadAvailableOrders();
            } else {
                throw new Error(data.message || 'Failed to delete assignment');
            }
        } catch (error) {
            console.error('Delete assignment error:', error);
            alert('Failed to delete assignment: ' + error.message);
        }
    };

    return (
        <div className="assignments-section">
            <div className="flex items-center justify-between mb-6">
                <h2>Delivery Assignments</h2>
                <button 
                    onClick={loadAllData}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                    Refresh
                </button>
            </div>

            {/* Tabs */}
            <div className="mb-6">
                <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                    <button
                        onClick={() => setActiveTab('available')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                            activeTab === 'available'
                                ? 'bg-white text-blue-600 shadow-sm'
                                : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                        Available Orders ({availableOrders.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('assigned')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                            activeTab === 'assigned'
                                ? 'bg-white text-blue-600 shadow-sm'
                                : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                        My Assignments ({assignedOrders.length})
                    </button>
                </div>
            </div>

            {error && (
                <div className="mb-4 px-4 py-3 bg-red-50 text-red-700 rounded-lg">
                    {error}
                </div>
            )}

            <div className="bg-white rounded-xl shadow overflow-x-auto">
                {loading ? (
                    <div className="p-8 text-center">
                        <div className="text-gray-500">Loading orders...</div>
                    </div>
                ) : (
                    <>
                        {activeTab === 'available' ? (
                            availableOrders.length === 0 ? (
                                <div className="p-8 text-center">
                                    <div className="text-gray-500">No available orders at the moment</div>
                                </div>
                            ) : (
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-left text-gray-600 bg-gray-50">
                                            <th className="p-4">Order ID</th>
                                            <th className="p-4">Customer Name</th>
                                            <th className="p-4">Address</th>
                                            <th className="p-4">Payment Type</th>
                                            <th className="p-4">Distance</th>
                                            <th className="p-4">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {availableOrders.map(order => (
                                            <tr key={order._id} className="border-t hover:bg-gray-50">
                                                <td className="p-4 font-mono text-blue-600">
                                                    <div className="flex items-center gap-2">
                                                    #{order._id.slice(-8)}
                                                        {order.isHandover && (
                                                            <span 
                                                                className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium"
                                                                title={`Handover Reason: ${order.handoverReason}\nDetails: ${order.handoverDetails || 'No additional details'}`}
                                                            >
                                                                🚨 Handover
                                                            </span>
                                                        )}
                                                    </div>
                                                    {order.isHandover && (
                                                        <div className="text-xs text-orange-600 mt-1">
                                                            Reason: {order.handoverReason}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="p-4 font-medium">
                                                    {order.user?.firstName} {order.user?.lastName}
                                                </td>
                                                <td className="p-4">
                                                    <div className="text-sm max-w-xs truncate" title={order.customer?.address}>
                                                        {order.customer?.address}
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    {order.paymentMethod === 'cod' ? (
                                                        <div>
                                                            <span className="px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-800">
                                                                COD
                                                            </span>
                                                            <div className="text-sm mt-1">
                                                                Rs.{Number(order.total || 0).toFixed(2)}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                                                            Online Paid
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="p-4">
                                                    <div className="text-sm">
                                                        {order.distance?.toFixed(1)} km
                                                    </div>
                                                </td>
                                                <td className="p-4 whitespace-nowrap">
                                                    <button
                                                        className={`px-3 py-1 text-white rounded text-xs mr-2 ${
                                                            order.isHandover 
                                                                ? 'bg-orange-600 hover:bg-orange-700' 
                                                                : 'bg-green-600 hover:bg-green-700'
                                                        }`}
                                                        onClick={() => order.isHandover ? acceptHandoverOrder(order._id) : acceptOrder(order._id)}
                                                    >
                                                        {order.isHandover ? 'Accept Handover' : 'Accept'}
                                                    </button>
                                                    <button
                                                        className="px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                                                        onClick={() => rejectOrder(order._id)}
                                                    >
                                                        Reject
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )
                        ) : (
                            assignedOrders.length === 0 ? (
                                <div className="p-8 text-center">
                                    <div className="text-gray-500">No assigned orders at the moment</div>
                                </div>
                            ) : (
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-left text-gray-600 bg-gray-50">
                                            <th className="p-4">Order ID</th>
                                            <th className="p-4">Customer Name</th>
                                            <th className="p-4">Contact</th>
                                            <th className="p-4">Address</th>
                                            <th className="p-4">Payment Type</th>
                                            <th className="p-4">Status</th>
                                            <th className="p-4">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {assignedOrders.map(assignment => (
                                            <tr key={assignment._id} className="border-t hover:bg-gray-50">
                                                <td className="p-4 font-mono text-blue-600">
                                                    #{assignment.order?._id?.slice(-8)}
                                                </td>
                                                <td className="p-4 font-medium">
                                                    {assignment.order?.user?.firstName} {assignment.order?.user?.lastName}
                                                </td>
                                                <td className="p-4">
                                                    <div className="text-sm">{assignment.order?.user?.phone}</div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="text-sm max-w-xs truncate" title={assignment.order?.customer?.address}>
                                                        {assignment.order?.customer?.address}
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    {assignment.order?.paymentMethod === 'cod' ? (
                                                        <div>
                                                            <span className="px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-800">
                                                                COD
                                                            </span>
                                                            <div className="text-sm mt-1">
                                                                Rs.{Number(assignment.order?.total || 0).toFixed(2)}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                                                            Online Paid
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="p-4">
                                                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadgeColor(assignment.status)}`}>
                                                        {getStatusText(assignment.status)}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex gap-2">
                                                    <button
                                                            className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 disabled:opacity-50"
                                                        disabled={loadingDetails}
                                                        onClick={async () => {
                                                            setLoadingDetails(true);
                                                            try {
                                                                const res = await fetch(`http://localhost:5001/api/delivery/orders/${assignment.order._id}/details`, {
                                                                    headers: { 'Authorization': `Bearer ${token}` }
                                                                });
                                                                const data = await res.json();
                                                                if (res.ok) {
                                                                    setSelectedOrder(data);
                                                                    setShowOrderDetails(true);
                                                                } else {
                                                                    throw new Error(data.message || 'Failed to fetch order details');
                                                                }
                                                            } catch (error) {
                                                                setError(error.message);
                                                            } finally {
                                                                setLoadingDetails(false);
                                                            }
                                                        }}
                                                    >
                                                        {loadingDetails ? 'Loading...' : 'View Details'}
                                                    </button>
                                                        
                                                        <div className="flex flex-col gap-1">
                                                            {/* Only show Update Status and Hand Over buttons if status is not delivered */}
                                                            {assignment.status !== 'delivered' && (
                                                                <>
                                                                    <button
                                                                        className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                                                                        onClick={() => toggleDropdown(assignment._id)}
                                                                    >
                                                                        Update Status
                                                                    </button>
                                                                    
                                                                    {openDropdowns.has(assignment._id) && (
                                                                        <div className="flex flex-col gap-1">
                                                    {assignment.status === 'assigned' && (
                                                        <button
                                                                                    className="px-3 py-1 bg-yellow-600 text-white rounded text-xs hover:bg-yellow-700"
                                                                                    onClick={() => {
                                                                                        openStatusModal(assignment, 'picked_up');
                                                                                        setOpenDropdowns(prev => {
                                                                                            const newSet = new Set(prev);
                                                                                            newSet.delete(assignment._id);
                                                                                            return newSet;
                                                                                        });
                                                                                    }}
                                                        >
                                                            Picked Up
                                                        </button>
                                                    )}
                                                    {assignment.status === 'picked_up' && (
                                                        <button
                                                                                    className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                                                                                    onClick={() => {
                                                                                        openStatusModal(assignment, 'delivered');
                                                                                        setOpenDropdowns(prev => {
                                                                                            const newSet = new Set(prev);
                                                                                            newSet.delete(assignment._id);
                                                                                            return newSet;
                                                                                        });
                                                                                    }}
                                                        >
                                                            Delivered
                                                        </button>
                                                    )}
                                                                            <button
                                                                                className="px-3 py-1 bg-orange-600 text-white rounded text-xs hover:bg-orange-700"
                                                                                onClick={() => {
                                                                                    initiateHandover(assignment);
                                                                                    setOpenDropdowns(prev => {
                                                                                        const newSet = new Set(prev);
                                                                                        newSet.delete(assignment._id);
                                                                                        return newSet;
                                                                                    });
                                                                                }}
                                                                                title="Emergency handover due to accident or emergency"
                                                                            >
                                                                                Hand Over Delivery
                                                                            </button>
                                                                            {/* Delete Assignment Button - Only show if not picked up or delivered */}
                                                                            {(assignment.status === 'assigned' || assignment.status === 'accepted') && (
                                                    <button
                                                        className="px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                                                                                    onClick={() => {
                                                                                        deleteAssignment(assignment._id);
                                                                                        setOpenDropdowns(prev => {
                                                                                            const newSet = new Set(prev);
                                                                                            newSet.delete(assignment._id);
                                                                                            return newSet;
                                                                                        });
                                                                                    }}
                                                                                    title="Delete assignment - order will become available for other agents"
                                                                                >
                                                                                    Delete Assignment
                                                    </button>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </>
                                                            )}
                                                            
                                                            
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )
                        )}
                    </>
                )}
            </div>

            {/* Order Details Modal */}
            {showOrderDetails && selectedOrder && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                    <div className="bg-white w-full max-w-4xl rounded-xl shadow-lg p-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-semibold">Order Details</h3>
                            <button
                                onClick={() => {
                                    setShowOrderDetails(false);
                                    setSelectedOrder(null);
                                }}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Customer Information */}
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h4 className="font-semibold text-lg mb-3 text-blue-600">Customer Information</h4>
                                <div className="space-y-2">
                                    <div>
                                        <span className="font-medium">Name:</span> {selectedOrder.order?.user?.firstName || selectedOrder.order?.customer?.name || 'N/A'} {selectedOrder.order?.user?.lastName || ''}
                                    </div>
                                    <div>
                                        <span className="font-medium">Phone:</span> {selectedOrder.order?.user?.phone || selectedOrder.order?.customer?.phone || 'N/A'}
                                    </div>
                                    <div>
                                        <span className="font-medium">Address:</span> {selectedOrder.order?.customer?.address || 'N/A'}
                                    </div>
                                    {selectedOrder.order?.customer?.notes && (
                                        <div>
                                            <span className="font-medium">Special Notes:</span> {selectedOrder.order?.customer?.notes}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Handover Information */}
                            {selectedOrder.handoverReason && (
                                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                                    <h4 className="font-semibold text-lg mb-3 text-orange-600 flex items-center gap-2">
                                        🚨 Handover Information
                                    </h4>
                                    <div className="space-y-2">
                                        <div>
                                            <span className="font-medium">Handover Reason:</span> 
                                            <span className="ml-2 px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-sm">
                                                {selectedOrder.handoverReason}
                                            </span>
                                        </div>
                                        {selectedOrder.handoverDetails && (
                                            <div>
                                                <span className="font-medium">Additional Notes:</span>
                                                <p className="mt-1 text-sm text-gray-700 bg-white p-2 rounded border">
                                                    {selectedOrder.handoverDetails}
                                                </p>
                                            </div>
                                        )}
                                        {selectedOrder.handoverAt && (
                                            <div>
                                                <span className="font-medium">Handed Over At:</span> 
                                                <span className="ml-2 text-sm text-gray-600">
                                                    {new Date(selectedOrder.handoverAt).toLocaleString()}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Order Information */}
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h4 className="font-semibold text-lg mb-3 text-blue-600">Order Information</h4>
                                <div className="space-y-2">
                                    <div>
                                        <span className="font-medium">Order ID:</span> #{selectedOrder.order?._id?.slice(-8)}
                                    </div>
                                    <div>
                                        <span className="font-medium">Order Date:</span> {new Date(selectedOrder.order?.createdAt).toLocaleString()}
                                    </div>
                                    <div>
                                        <span className="font-medium">Payment Method:</span> 
                                        {selectedOrder.order?.paymentMethod === 'cod' ? (
                                            <span className="ml-2 px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs">
                                                COD - Rs.{Number(selectedOrder.order?.total || 0).toFixed(2)}
                                            </span>
                                        ) : (
                                            <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                                                Online Paid
                                            </span>
                                        )}
                                    </div>
                                    <div>
                                        <span className="font-medium">Delivery Type:</span> {selectedOrder.order?.deliveryType === 'home_delivery' ? 'Home Delivery' : 'Pickup'}
                                    </div>
                                    <div>
                                        <span className="font-medium">Status:</span> 
                                        <span className={`ml-2 px-2 py-1 rounded-full text-xs ${getStatusBadgeColor(selectedOrder.status)}`}>
                                            {getStatusText(selectedOrder.status)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Product List */}
                        <div className="mt-6">
                            <h4 className="font-semibold text-lg mb-3 text-blue-600">Order Items</h4>
                            <div className="bg-white border rounded-lg overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="p-3 text-left">Product</th>
                                            <th className="p-3 text-left">Quantity</th>
                                            <th className="p-3 text-left">Price</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(selectedOrder.order?.items || selectedOrder.order?.orderList || []).map((item, index) => (
                                            <tr key={index} className="border-t">
                                                <td className="p-3">
                                                    <div className="font-medium">{item.name}</div>
                                                    <div className="text-gray-500 text-xs">{item.brand || 'Generic'}</div>
                                                </td>
                                                <td className="p-3">
                                                    <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">
                                                        {item.quantity} {item.quantity > 1 ? 'units' : 'unit'}
                                                    </span>
                                                </td>
                                                <td className="p-3 font-medium">Rs.{Number(item.price || 0).toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Delivery Notes */}
                        {selectedOrder.deliveryNotes && (
                            <div className="mt-6">
                                <h4 className="font-semibold text-lg mb-3 text-blue-600">Delivery Notes</h4>
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    {selectedOrder.deliveryNotes}
                                </div>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="mt-6 flex justify-end space-x-3">
                            <button
                                onClick={() => {
                                    setShowOrderDetails(false);
                                    setSelectedOrder(null);
                                }}
                                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Status Update Modal */}
            {showStatusModal && selectedOrder && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                    <div className="bg-white w-full max-w-md rounded-xl shadow-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">
                                Update Order Status
                            </h3>
                            <button
                                onClick={() => setShowStatusModal(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="mb-4">
                            <div className="text-sm text-gray-600 mb-2">
                                Order: #{selectedOrder.order?._id?.slice(-8) || selectedOrder._id?.slice(-8)}
                            </div>
                            <div className="text-sm text-gray-600 mb-2">
                                Customer: {selectedOrder.order?.user?.firstName} {selectedOrder.order?.user?.lastName}
                            </div>
                            <div className="text-sm text-gray-600 mb-4">
                                Address: {selectedOrder.order?.customer?.address}
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                New Status
                            </label>
                            <select
                                value={newStatus}
                                onChange={(e) => setNewStatus(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Select Status</option>
                                <option value="picked_up">Picked Up</option>
                                <option value="delivered">Delivered</option>
                                <option value="failed">Failed</option>
                            </select>
                        </div>

                        {newStatus === 'failed' && (
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Failure Reason
                                </label>
                                <select
                                    value={failureReason}
                                    onChange={(e) => setFailureReason(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-gray-400"
                                >
                                    <option value="">Select reason...</option>
                                    <option value="customer_not_available">Customer not available</option>
                                    <option value="wrong_address">Wrong address</option>
                                    <option value="customer_refused">Customer refused delivery</option>
                                    <option value="damaged_package">Package damaged</option>
                                    <option value="security_issue">Security issue</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                        )}

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowStatusModal(false)}
                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleStatusUpdate}
                                className={`px-4 py-2 text-white rounded-lg ${
                                    newStatus === 'delivered' 
                                        ? 'bg-green-600 hover:bg-green-700'
                                        : newStatus === 'picked_up'
                                        ? 'bg-yellow-600 hover:bg-yellow-700'
                                        : 'bg-red-600 hover:bg-red-700'
                                }`}
                            >
                                Update Status
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Emergency Handover Modal */}
            {showHandoverModal && selectedAssignmentForHandover && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                    <div className="bg-white w-full max-w-md rounded-xl shadow-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-orange-600">
                                🚨 Emergency Handover
                            </h3>
                            <button
                                onClick={closeHandoverModal}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                ×
                            </button>
                        </div>

                        <div className="mb-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                            <h4 className="font-medium text-orange-800 mb-2">Order Details</h4>
                            <p className="text-sm text-orange-700">
                                <strong>Order ID:</strong> #{selectedAssignmentForHandover.order?._id?.slice(-8)}<br/>
                                <strong>Customer:</strong> {selectedAssignmentForHandover.order?.user?.firstName} {selectedAssignmentForHandover.order?.user?.lastName}<br/>
                                <strong>Address:</strong> {selectedAssignmentForHandover.order?.customer?.address}
                            </p>
                        </div>

                        {error && (
                            <div className="mb-4 px-4 py-3 bg-red-50 text-red-700 rounded-lg">
                                {error}
                            </div>
                        )}

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Reason for Handover *
                            </label>
                            <select
                                value={handoverReason}
                                onChange={(e) => {
                                    setHandoverReason(e.target.value);
                                    if (error) setError(''); // Clear error when user selects a reason
                                }}
                                className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 ${
                                    error && !handoverReason.trim() 
                                        ? 'border-red-300 focus:ring-red-500' 
                                        : 'border-gray-300 focus:ring-orange-500'
                                }`}
                            >
                                <option value="">Select reason...</option>
                                <option value="accident">Vehicle Accident</option>
                                <option value="medical_emergency">Medical Emergency</option>
                                <option value="vehicle_breakdown">Vehicle Breakdown</option>
                                <option value="personal_emergency">Personal Emergency</option>
                                <option value="weather_conditions">Severe Weather Conditions</option>
                                <option value="other">Other Emergency</option>
                            </select>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Select Delivery Agent *
                            </label>
                            <select
                                value={selectedAgentId}
                                onChange={(e) => {
                                    setSelectedAgentId(e.target.value);
                                    if (error) setError(''); // Clear error when user selects an agent
                                }}
                                className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 ${
                                    error && !selectedAgentId 
                                        ? 'border-red-300 focus:ring-red-500' 
                                        : 'border-gray-300 focus:ring-orange-500'
                                }`}
                            >
                                <option value="">Select delivery agent...</option>
                                {availableAgents.map((agent) => (
                                    <option key={agent._id} value={agent._id}>
                                        {agent.firstName} {agent.lastName} ({agent.phone})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Additional Details (Optional)
                            </label>
                            <textarea
                                value={handoverDetails}
                                onChange={(e) => setHandoverDetails(e.target.value)}
                                placeholder="Provide additional details about the emergency..."
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                                rows="3"
                            />
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                            <p className="text-sm text-blue-700">
                                <strong>Note:</strong> The selected delivery agent will be directly assigned this order and will receive a notification. 
                                The order will be removed from your dashboard and assigned to the selected agent.
                            </p>
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={closeHandoverModal}
                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={submitHandover}
                                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                            >
                                Submit Handover Request
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
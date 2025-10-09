import React, { useState, useEffect } from 'react'
import DashboardLayout from '../../layouts/DashboardLayout'
import './DeliveryDashboard.css'
import { useAuth } from '../../context/AuthContext'
import { Home, Truck, History, Bell } from 'lucide-react'
import TrackingMap from '../../components/GoogleMap/TrackingMap'
import { useLocationTracking } from '../../hooks/useWebSocket'
import ErrorBoundary from '../../components/ErrorBoundary'

const DeliveryDashboard = () => {
	const [activeSection, setActiveSection] = useState('overview')
	const [deliveryStats, setDeliveryStats] = useState({
		activeDeliveries: 0,
		completedToday: 0,
		pending: 0
	})
	const [statsLoading, setStatsLoading] = useState(true)
	const [recentDeliveries, setRecentDeliveries] = useState([])
	const [recentDeliveriesLoading, setRecentDeliveriesLoading] = useState(true)
	const [notifications, setNotifications] = useState([])
	const [notificationCount, setNotificationCount] = useState(0)
	const [showNotificationPopup, setShowNotificationPopup] = useState(false)
	const { token } = useAuth()

	const sidebar = [
		{ id: 'overview', label: 'Overview', icon: <Home size={18} /> },
		{ id: 'assignments', label: 'Assignments', icon: <Truck size={18} /> },
		{ id: 'history', label: 'History', icon: <History size={18} /> },
		{ id: 'messages', label: 'Notifications', icon: <Bell size={18} /> },
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
				pending: 0
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

					</div>
				);

			case 'assignments':
				return <AssignmentsSection />;

			case 'history':
				return <HistorySection />;


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
		<ErrorBoundary>
			<DashboardLayout 
				title="Delivery Dashboard" 
				sidebarItems={sidebar}
				onSectionChange={setActiveSection}
				activeSection={activeSection}
				notificationCount={notificationCount}
				notifications={notifications.filter(n => !n.read)}
				onNotificationUpdate={markNotificationAsRead}
				showNotificationPopup={showNotificationPopup}
				setShowNotificationPopup={setShowNotificationPopup}
			>
				<div className="delivery-dashboard">
					{renderSection()}
				</div>
			</DashboardLayout>
		</ErrorBoundary>
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
    
    // GPS Tracking state
    const [showTrackingModal, setShowTrackingModal] = useState(false);
    const [trackingData, setTrackingData] = useState(null);
    const [trackingLoading, setTrackingLoading] = useState(false);
    const [currentLocation, setCurrentLocation] = useState(null);
    const [locationPermission, setLocationPermission] = useState(null);
    const [isTracking, setIsTracking] = useState(false);
    const [locationUpdateInterval, setLocationUpdateInterval] = useState(null);
    
    // WebSocket tracking hook - re-enabled
    const assignmentId = trackingData?.assignment?._id;
    const wsHook = useLocationTracking(assignmentId || null, (data) => {
        console.log('Real-time location update:', data);
        setCurrentLocation(data.location);
    });
    
    // Extract WebSocket hook values
    const wsTracking = wsHook?.isTracking || false;
    const wsLocation = wsHook?.currentLocation || null;
    const startTracking = wsHook?.startTracking || (() => {});
    const stopTracking = wsHook?.stopTracking || (() => {});
    const wsUpdateLocation = wsHook?.updateLocation || (() => {});
    const wsConnected = wsHook?.isConnected || false;

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

    // Cleanup location tracking on component unmount
    useEffect(() => {
        return () => {
            if (locationUpdateInterval) {
                clearInterval(locationUpdateInterval);
            }
            if (isTracking) {
                stopLocationTracking();
            }
        };
    }, [locationUpdateInterval, isTracking]);

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

    // GPS Tracking Functions
    const handleTrackOrder = async (assignmentId) => {
        setTrackingLoading(true);
        try {
            const res = await fetch(`http://localhost:5001/api/delivery/tracking/${assignmentId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            const data = await res.json();
            if (res.ok) {
                setTrackingData(data);
                setShowTrackingModal(true);
            } else {
                throw new Error(data.message || 'Failed to fetch tracking data');
            }
        } catch (error) {
            console.error('Track order error:', error);
            alert('Failed to load tracking data: ' + error.message);
        } finally {
            setTrackingLoading(false);
        }
    };

    const startLocationTracking = async () => {
        console.log('startLocationTracking called');
        if (!navigator.geolocation) {
            alert('Geolocation is not supported by this browser.');
            return;
        }

        try {
            // Request location permission
            const position = await getCurrentPosition();
            const locationData = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy
            };
            
            console.log('Location obtained:', locationData);
            setCurrentLocation(locationData);
            setLocationPermission('granted');
            setIsTracking(true);
            
            // Start WebSocket tracking
            if (trackingData?.assignment?._id && startTracking) {
                console.log('Starting WebSocket tracking');
                startTracking();
            }
            
            // Update location on server via WebSocket
            if (wsUpdateLocation) {
                console.log('Updating location via WebSocket');
                wsUpdateLocation(locationData);
            }
            
            // Set up interval to update location every 30 seconds
            const interval = setInterval(async () => {
                try {
                    const newPosition = await getCurrentPosition();
                    const newLocationData = {
                        latitude: newPosition.coords.latitude,
                        longitude: newPosition.coords.longitude,
                        accuracy: newPosition.coords.accuracy
                    };
                    
                    setCurrentLocation(newLocationData);
                    
                    // Update via WebSocket
                    if (wsUpdateLocation) {
                        wsUpdateLocation(newLocationData);
                    }
                } catch (error) {
                    console.error('Location update error:', error);
                }
            }, 30000); // Update every 30 seconds
            
            setLocationUpdateInterval(interval);
            console.log('Location tracking started successfully');
            
        } catch (error) {
            console.error('Location tracking error:', error);
            setLocationPermission('denied');
            alert('Location access denied. Please enable location services to use GPS tracking.');
        }
    };

    const stopLocationTracking = () => {
        console.log('stopLocationTracking called');
        if (locationUpdateInterval) {
            clearInterval(locationUpdateInterval);
            setLocationUpdateInterval(null);
        }
        setIsTracking(false);
        
        // Stop WebSocket tracking
        if (trackingData?.assignment?._id && stopTracking) {
            console.log('Stopping WebSocket tracking');
            stopTracking();
        }
        
        // Set offline status
        fetch('http://localhost:5001/api/delivery/status/online', {
            method: 'PATCH',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ isOnline: false })
        }).catch(error => console.error('Failed to set offline status:', error));
        
        console.log('Location tracking stopped');
    };

    const getCurrentPosition = () => {
        return new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 60000
            });
        });
    };

    const updateLocationOnServer = async (latitude, longitude, accuracy) => {
        try {
            await fetch('http://localhost:5001/api/delivery/location/update', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    latitude,
                    longitude,
                    accuracy
                })
            });
        } catch (error) {
            console.error('Failed to update location on server:', error);
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

    // Assignments Section
    //refresh button
    return (
        <div className="assignments-section">
            <div className="flex items-center justify-between mb-6">
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
                                                    
                                                    <button
                                                        className="px-3 py-1 bg-purple-600 text-white rounded text-xs hover:bg-purple-700 disabled:opacity-50"
                                                        disabled={loadingDetails}
                                                        onClick={() => handleTrackOrder(assignment._id)}
                                                    >
                                                        Track Order
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

            {/* GPS Tracking Modal */}
            {showTrackingModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white w-full max-w-6xl max-h-[90vh] rounded-xl shadow-lg p-6 overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-semibold text-gray-800">
                                Track Order {trackingData?.assignment?.order?.orderNumber || trackingData?.assignment?.order?._id?.slice(-8) || 'Loading...'}
                            </h3>
                            <button
                                onClick={() => {
                                    setShowTrackingModal(false);
                                    setTrackingData(null);
                                }}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>


                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
                            {/* Map Section */}
                            <div className="bg-gray-100 rounded-lg p-4">
                                <h4 className="text-lg font-medium mb-3">Live Tracking Map</h4>
                                {import.meta.env.VITE_GOOGLE_MAPS_API_KEY ? (
                                    <div className="h-80">
                                        <TrackingMap
                                            deliveryAgentLocation={currentLocation}
                                            deliveryAddress={{
                                                ...trackingData?.assignment?.order?.deliveryCoordinates,
                                                address: trackingData?.assignment?.order?.customer?.address
                                            }}
                                            orderNumber={trackingData?.assignment?.order?.orderNumber || trackingData?.assignment?.order?._id?.slice(-8)}
                                            isTracking={isTracking || wsTracking}
                                            onLocationUpdate={(location) => {
                                                setCurrentLocation(location);
                                                if (wsUpdateLocation) {
                                                    wsUpdateLocation(location);
                                                }
                                            }}
                                            apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
                                        />
                                    </div>
                                ) : (
                                    <div className="bg-white rounded-lg h-80 flex items-center justify-center border-2 border-dashed border-gray-300">
                                        <div className="text-center">
                                            <div className="text-gray-400 mb-2">
                                                <svg className="w-12 h-12 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                            <p className="text-sm text-gray-600">Google Maps API Key Required</p>
                                            <p className="text-xs text-gray-500 mt-1">Please add VITE_GOOGLE_MAPS_API_KEY to your .env file</p>
                                            <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
                                                <p className="text-xs text-yellow-700">
                                                    <strong>Quick Setup:</strong>
                                                </p>
                                                <ol className="text-xs text-yellow-600 mt-1 list-decimal list-inside">
                                                    <li>Get API key from Google Cloud Console</li>
                                                    <li>Create frontend/.env file</li>
                                                    <li>Add: VITE_GOOGLE_MAPS_API_KEY=your_key</li>
                                                    <li>Restart the development server</li>
                                                </ol>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                
                                {/* Location Status */}
                                <div className="mt-4 flex items-center justify-between">
                                    <div className="flex items-center">
                                        <div className={`w-3 h-3 rounded-full mr-2 ${(isTracking || wsTracking) ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                                        <span className="text-sm text-gray-600">
                                            {(isTracking || wsTracking) ? 'Location Tracking Active' : 'Click "Start Tracking" to begin GPS monitoring'}
                                        </span>
                                        {wsConnected && (
                                            <div className="ml-2 w-2 h-2 bg-green-500 rounded-full" title="WebSocket Connected"></div>
                                        )}
                                    </div>
                                    {(isTracking || wsTracking) ? (
                                        <button
                                            onClick={stopLocationTracking}
                                            className="px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                                        >
                                            Stop Tracking
                                        </button>
                                    ) : (
                                        <button
                                            onClick={startLocationTracking}
                                            className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                                        >
                                            Start Tracking
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Order Details Section */}
                            <div className="space-y-4">
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <h4 className="text-lg font-medium mb-3">Order Information</h4>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Order Number:</span>
                                            <span className="font-medium">#{trackingData.assignment?.order?.orderNumber || trackingData.assignment?.order?._id?.slice(-8)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Customer:</span>
                                            <span className="font-medium">{trackingData.assignment?.order?.customer?.name}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Phone:</span>
                                            <span className="font-medium">{trackingData.assignment?.order?.customer?.phone}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Status:</span>
                                            <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadgeColor(trackingData.assignment?.status)}`}>
                                                {getStatusText(trackingData.assignment?.status)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gray-50 rounded-lg p-4">
                                    <h4 className="text-lg font-medium mb-3">Delivery Address</h4>
                                    <p className="text-sm text-gray-700">{trackingData.assignment?.order?.customer?.address}</p>
                                    {trackingData.assignment?.order?.deliveryCoordinates && (
                                        <div className="mt-2 text-xs text-gray-500">
                                            <p>Coordinates: {trackingData.assignment.order.deliveryCoordinates.latitude?.toFixed(6)}, {trackingData.assignment.order.deliveryCoordinates.longitude?.toFixed(6)}</p>
                                        </div>
                                    )}
                                </div>

                                <div className="bg-gray-50 rounded-lg p-4">
                                    <h4 className="text-lg font-medium mb-3">Delivery Agent</h4>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Agent:</span>
                                            <span className="font-medium">{trackingData.assignment?.deliveryAgent?.name}</span>
                                        </div>
                                        {trackingData.assignment?.deliveryAgent?.currentLocation && (
                                            <>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Current Location:</span>
                                                    <span className="font-medium">
                                                        {trackingData.assignment.deliveryAgent.currentLocation.latitude?.toFixed(6)}, 
                                                        {trackingData.assignment.deliveryAgent.currentLocation.longitude?.toFixed(6)}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Last Updated:</span>
                                                    <span className="font-medium">
                                                        {trackingData.assignment.deliveryAgent.currentLocation.lastUpdated ? 
                                                            new Date(trackingData.assignment.deliveryAgent.currentLocation.lastUpdated).toLocaleTimeString() : 
                                                            'Never'
                                                        }
                                                    </span>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function HistorySection() {
    const { token } = useAuth();
    const [completedDeliveries, setCompletedDeliveries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedDelivery, setSelectedDelivery] = useState(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
    const [dateFilter, setDateFilter] = useState({
        startDate: '',
        endDate: ''
    });
    const [statusFilter, setStatusFilter] = useState('all');

    const fetchCompletedDeliveries = async (page = 1) => {
        try {
            setLoading(true);
            let url = `http://localhost:5001/api/delivery/completed?page=${page}&limit=10&status=${statusFilter}`;
            
            // Add date filters if provided
            if (dateFilter.startDate) {
                url += `&startDate=${dateFilter.startDate}`;
            }
            if (dateFilter.endDate) {
                url += `&endDate=${dateFilter.endDate}`;
            }
            
            
            const res = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            const contentType = res.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error('Server returned HTML instead of JSON. Backend server may not be running.');
            }
            
            const data = await res.json();
            if (res.ok) {
                setCompletedDeliveries(data.deliveries);
                setTotalPages(data.pagination.totalPages);
                setCurrentPage(data.pagination.currentPage);
            } else {
                throw new Error(data.message || 'Failed to fetch completed deliveries');
            }
        } catch (error) {
            console.error('Error fetching completed deliveries:', error);
            setError(error.message);
            setCompletedDeliveries([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) {
            fetchCompletedDeliveries(1);
        }
    }, [token, dateFilter, statusFilter]);

    const handlePageChange = (page) => {
        setCurrentPage(page);
        fetchCompletedDeliveries(page);
    };

    const handleDateFilterChange = (field, value) => {
        setDateFilter(prev => ({
            ...prev,
            [field]: value
        }));
        setCurrentPage(1); // Reset to first page when filter changes
    };

    const clearDateFilter = () => {
        setDateFilter({
            startDate: '',
            endDate: ''
        });
        setCurrentPage(1);
    };

    const handleStatusFilterChange = (status) => {
        setStatusFilter(status);
        setCurrentPage(1);
    };

    const clearAllFilters = () => {
        setDateFilter({
            startDate: '',
            endDate: ''
        });
        setStatusFilter('all');
        setCurrentPage(1);
    };

    const downloadHistory = async () => {
        try {
            setIsGeneratingPDF(true);
            
            // Generate HTML content for PDF
            const htmlContent = generatePDFContent();
            
            // Create a new window to print the content
            const printWindow = window.open('', '_blank');
            printWindow.document.write(htmlContent);
            printWindow.document.close();
            
            // Wait for content to load, then trigger print
            printWindow.onload = () => {
                printWindow.print();
                printWindow.close();
            };
            
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Failed to generate PDF. Please try again.');
        } finally {
            setIsGeneratingPDF(false);
        }
    };

    const generatePDFContent = () => {
        // Create HTML content for PDF
        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Delivery History Report</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        margin: 20px;
                        color: #333;
                    }
                    .header {
                        text-align: center;
                        border-bottom: 2px solid #2563eb;
                        padding-bottom: 20px;
                        margin-bottom: 30px;
                    }
                    .header h1 {
                        color: #2563eb;
                        margin: 0;
                        font-size: 28px;
                    }
                    .header p {
                        margin: 5px 0;
                        color: #666;
                    }
                    .summary {
                        background: #f8fafc;
                        padding: 15px;
                        border-radius: 8px;
                        margin-bottom: 30px;
                        border-left: 4px solid #2563eb;
                    }
                    .summary h3 {
                        margin: 0 0 10px 0;
                        color: #2563eb;
                    }
                    .summary-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                        gap: 15px;
                    }
                    .summary-item {
                        background: white;
                        padding: 10px;
                        border-radius: 6px;
                        border: 1px solid #e2e8f0;
                    }
                    .summary-label {
                        font-weight: bold;
                        color: #64748b;
                        font-size: 12px;
                        text-transform: uppercase;
                        margin-bottom: 5px;
                    }
                    .summary-value {
                        color: #1e293b;
                        font-size: 16px;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-top: 20px;
                        font-size: 12px;
                    }
                    th {
                        background: #2563eb;
                        color: white;
                        padding: 12px 8px;
                        text-align: left;
                        font-weight: bold;
                    }
                    td {
                        padding: 10px 8px;
                        border-bottom: 1px solid #e2e8f0;
                        vertical-align: top;
                    }
                    tr:nth-child(even) {
                        background: #f8fafc;
                    }
                    .status-delivered {
                        background: #dcfce7;
                        color: #166534;
                        padding: 4px 8px;
                        border-radius: 4px;
                        font-weight: bold;
                        font-size: 10px;
                    }
                    .status-failed {
                        background: #fef2f2;
                        color: #dc2626;
                        padding: 4px 8px;
                        border-radius: 4px;
                        font-weight: bold;
                        font-size: 10px;
                    }
                    .amount {
                        font-weight: bold;
                        color: #059669;
                    }
                    .footer {
                        margin-top: 40px;
                        text-align: center;
                        color: #64748b;
                        font-size: 12px;
                        border-top: 1px solid #e2e8f0;
                        padding-top: 20px;
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>Delivery History Report</h1>
                    <p>Generated on ${new Date().toLocaleString()}</p>
                    <p>Medicare Pharmacy Delivery System</p>
                </div>

                <div class="summary">
                    <h3>Report Summary</h3>
                    <div class="summary-grid">
                        <div class="summary-item">
                            <div class="summary-label">Total Deliveries</div>
                            <div class="summary-value">${completedDeliveries.length}</div>
                        </div>
                        <div class="summary-item">
                            <div class="summary-label">Status Filter</div>
                            <div class="summary-value">${statusFilter === 'all' ? 'All Completed' : statusFilter === 'delivered' ? 'Delivered Only' : 'Failed Only'}</div>
                        </div>
                        <div class="summary-item">
                            <div class="summary-label">Date Range</div>
                            <div class="summary-value">${dateFilter.startDate ? new Date(dateFilter.startDate).toLocaleDateString() : 'All Time'} - ${dateFilter.endDate ? new Date(dateFilter.endDate).toLocaleDateString() : 'Present'}</div>
                        </div>
                        <div class="summary-item">
                            <div class="summary-label">Total Amount</div>
                            <div class="summary-value">${formatCurrency(completedDeliveries.reduce((sum, delivery) => sum + (delivery.totalAmount || 0), 0))}</div>
                        </div>
                    </div>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th>Order ID</th>
                            <th>Customer</th>
                            <th>Address</th>
                            <th>Status</th>
                            <th>Amount</th>
                            <th>Payment</th>
                            <th>Assigned</th>
                            <th>Completed</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${completedDeliveries.map(delivery => `
                            <tr>
                                <td><strong>${delivery.orderNumber}</strong></td>
                                <td>
                                    <div><strong>${delivery.customerName}</strong></div>
                                    <div style="color: #64748b; font-size: 11px;">${delivery.customerPhone || 'N/A'}</div>
                                </td>
                                <td style="max-width: 200px; word-wrap: break-word;">${delivery.address}</td>
                                <td>
                                    <span class="status-${delivery.status}">${getStatusText(delivery.status)}</span>
                                </td>
                                <td class="amount">${formatCurrency(delivery.totalAmount)}</td>
                                <td>${delivery.paymentMethod === 'cod' ? 'COD' : 'Online'}</td>
                                <td>${formatDate(delivery.assignedAt)}</td>
                                <td>${delivery.status === 'delivered' ? formatDate(delivery.deliveredAt) : formatDate(delivery.failedAt)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>

                <div class="footer">
                    <p>This report was generated automatically by the Medicare Pharmacy Delivery System</p>
                    <p>For questions or support, please contact the system administrator</p>
                </div>
            </body>
            </html>
        `;

        return htmlContent;
    };

    const openDeliveryDetails = (delivery) => {
        setSelectedDelivery(delivery);
        setShowDetailsModal(true);
    };

    const getStatusBadgeColor = (status) => {
        switch (status) {
            case 'delivered':
                return 'bg-green-100 text-green-800';
            case 'failed':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'delivered':
                return 'Delivered';
            case 'failed':
                return 'Failed';
            default:
                return status;
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatCurrency = (amount) => {
        return `Rs.${Number(amount).toFixed(2)}`;
    };

    return (
        <div className="history-section">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-200px font-bold text-gray-900">Delivery History</h2>
                <div className="flex gap-3">
                    <button 
                        onClick={downloadHistory}
                        disabled={isGeneratingPDF || completedDeliveries.length === 0}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {isGeneratingPDF ? (
                            <>
                                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Generating...
                            </>
                        ) : (
                            <>
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Generate PDF
                            </>
                        )}
                    </button>
                    <button 
                        onClick={() => fetchCompletedDeliveries(currentPage)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        Refresh
                    </button>
                </div>
            </div>

            {/* Filter Controls */}
            <div className="mb-6">
                <div className="bg-white p-4 rounded-lg border">
                    <h3 className="text-lg font-semibold mb-4 text-gray-800">Filter Deliveries</h3>
                    
                    {/* Status Filter */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Delivery Status
                        </label>
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => handleStatusFilterChange('all')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    statusFilter === 'all'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                All Completed
                            </button>
                            <button
                                onClick={() => handleStatusFilterChange('delivered')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    statusFilter === 'delivered'
                                        ? 'bg-green-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                Delivered
                            </button>
                            <button
                                onClick={() => handleStatusFilterChange('failed')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    statusFilter === 'failed'
                                        ? 'bg-red-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                Failed
                            </button>
                        </div>
                    </div>

                    {/* Date Filter */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Delivery Date Range
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                            <div>
                                <label className="block text-xs text-gray-600 mb-1">
                                    Start Date
                                </label>
                                <input
                                    type="date"
                                    value={dateFilter.startDate}
                                    onChange={(e) => handleDateFilterChange('startDate', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-600 mb-1">
                                    End Date
                                </label>
                                <input
                                    type="date"
                                    value={dateFilter.endDate}
                                    onChange={(e) => handleDateFilterChange('endDate', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={clearDateFilter}
                                    className="px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
                                >
                                    Clear Dates
                                </button>
                                <button
                                    onClick={clearAllFilters}
                                    className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
                                >
                                    Clear All
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Active Filters Display */}
                    {(dateFilter.startDate || dateFilter.endDate || statusFilter !== 'all') && (
                        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                            <div className="text-sm text-gray-700">
                                <span className="font-medium">Active filters:</span>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {statusFilter !== 'all' && (
                                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                                            Status: {statusFilter === 'delivered' ? 'Delivered' : 'Failed'}
                                        </span>
                                    )}
                                    {dateFilter.startDate && (
                                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                                            From: {new Date(dateFilter.startDate).toLocaleDateString()}
                                        </span>
                                    )}
                                    {dateFilter.endDate && (
                                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                                            To: {new Date(dateFilter.endDate).toLocaleDateString()}
                                        </span>
                                    )}
                                </div>
                                <div className="mt-2 text-xs text-gray-600">
                                    📄 PDF will include {completedDeliveries.length} delivery record{completedDeliveries.length !== 1 ? 's' : ''} with current filters applied
                                </div>
                            </div>
                        </div>
                    )}
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
                        <div className="text-gray-500">Loading delivery history...</div>
                    </div>
                ) : completedDeliveries.length === 0 ? (
                    <div className="p-8 text-center">
                        <div className="text-gray-500">No completed deliveries found</div>
                    </div>
                ) : (
                    <>
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-gray-600 bg-gray-50">
                                    <th className="p-4">Order ID</th>
                                    <th className="p-4">Customer</th>
                                    <th className="p-4">Address</th>
                                    <th className="p-4">Amount</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4">Completed At</th>
                                    <th className="p-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {completedDeliveries.map((delivery) => (
                                    <tr key={delivery._id} className="border-t hover:bg-gray-50">
                                        <td className="p-4 font-mono text-blue-600">
                                            {delivery.orderNumber}
                                        </td>
                                        <td className="p-4">
                                            <div className="font-medium">{delivery.customerName}</div>
                                            <div className="text-xs text-gray-500">{delivery.customerPhone}</div>
                                        </td>
                                        <td className="p-4">
                                            <div className="text-sm max-w-xs truncate" title={delivery.address}>
                                                {delivery.address}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="font-medium">{formatCurrency(delivery.totalAmount)}</div>
                                            <div className="text-xs text-gray-500">
                                                {delivery.paymentMethod === 'cod' ? 'COD' : 'Online Paid'}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadgeColor(delivery.status)}`}>
                                                {getStatusText(delivery.status)}
                                            </span>
                                        </td>
                                        <td className="p-4 text-sm text-gray-600">
                                            {delivery.status === 'delivered' 
                                                ? formatDate(delivery.deliveredAt)
                                                : formatDate(delivery.failedAt)
                                            }
                                        </td>
                                        <td className="p-4">
                                            <button
                                                onClick={() => openDeliveryDetails(delivery)}
                                                className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                                            >
                                                View Details
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between px-4 py-3 border-t">
                                <div className="text-sm text-gray-700">
                                    Page {currentPage} of {totalPages}
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        disabled={currentPage === 1}
                                        className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                                    >
                                        Previous
                                    </button>
                                    <button
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                        className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Delivery Details Modal */}
            {showDetailsModal && selectedDelivery && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                    <div className="bg-white w-full max-w-4xl rounded-xl shadow-lg p-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-semibold">Delivery Details</h3>
                            <button
                                onClick={() => {
                                    setShowDetailsModal(false);
                                    setSelectedDelivery(null);
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
                                        <span className="font-medium">Name:</span> {selectedDelivery.customerName}
                                    </div>
                                    <div>
                                        <span className="font-medium">Phone:</span> {selectedDelivery.customerPhone}
                                    </div>
                                    <div>
                                        <span className="font-medium">Address:</span> {selectedDelivery.address}
                                    </div>
                                </div>
                            </div>

                            {/* Delivery Information */}
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h4 className="font-semibold text-lg mb-3 text-blue-600">Delivery Information</h4>
                                <div className="space-y-2">
                                    <div>
                                        <span className="font-medium">Order ID:</span> {selectedDelivery.orderNumber}
                                    </div>
                                    <div>
                                        <span className="font-medium">Status:</span> 
                                        <span className={`ml-2 px-2 py-1 rounded-full text-xs ${getStatusBadgeColor(selectedDelivery.status)}`}>
                                            {getStatusText(selectedDelivery.status)}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="font-medium">Assigned At:</span> {formatDate(selectedDelivery.assignedAt)}
                                    </div>
                                    <div>
                                        <span className="font-medium">Picked Up At:</span> {formatDate(selectedDelivery.pickedUpAt)}
                                    </div>
                                    <div>
                                        <span className="font-medium">Completed At:</span> {
                                            selectedDelivery.status === 'delivered' 
                                                ? formatDate(selectedDelivery.deliveredAt)
                                                : formatDate(selectedDelivery.failedAt)
                                        }
                                    </div>
                                    {selectedDelivery.failureReason && (
                                        <div>
                                            <span className="font-medium">Failure Reason:</span> {selectedDelivery.failureReason}
                                        </div>
                                    )}
                                    {selectedDelivery.deliveryNotes && (
                                        <div>
                                            <span className="font-medium">Delivery Notes:</span> {selectedDelivery.deliveryNotes}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Order Information */}
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h4 className="font-semibold text-lg mb-3 text-blue-600">Order Information</h4>
                                <div className="space-y-2">
                                    <div>
                                        <span className="font-medium">Total Amount:</span> {formatCurrency(selectedDelivery.totalAmount)}
                                    </div>
                                    <div>
                                        <span className="font-medium">Payment Method:</span> 
                                        {selectedDelivery.paymentMethod === 'cod' ? (
                                            <span className="ml-2 px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs">
                                                COD
                                            </span>
                                        ) : (
                                            <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                                                Online Paid
                                            </span>
                                        )}
                                    </div>
                                    <div>
                                        <span className="font-medium">Delivery Type:</span> {selectedDelivery.deliveryType === 'home_delivery' ? 'Home Delivery' : 'Pickup'}
                                    </div>
                                    <div>
                                        <span className="font-medium">Order Type:</span> {selectedDelivery.orderType === 'prescription' ? 'Prescription' : 'Product'}
                                    </div>
                                    {selectedDelivery.distance && (
                                        <div>
                                            <span className="font-medium">Distance:</span> {selectedDelivery.distance.toFixed(1)} km
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Handover Information */}
                            {selectedDelivery.isHandover && (
                                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                                    <h4 className="font-semibold text-lg mb-3 text-orange-600 flex items-center gap-2">
                                        🚨 Handover Information
                                    </h4>
                                    <div className="space-y-2">
                                        <div>
                                            <span className="font-medium">Handover Reason:</span> 
                                            <span className="ml-2 px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-sm">
                                                {selectedDelivery.handoverReason}
                                            </span>
                                        </div>
                                        {selectedDelivery.handoverDetails && (
                                            <div>
                                                <span className="font-medium">Additional Notes:</span>
                                                <p className="mt-1 text-sm text-gray-700 bg-white p-2 rounded border">
                                                    {selectedDelivery.handoverDetails}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Order Items */}
                        {selectedDelivery.items && selectedDelivery.items.length > 0 && (
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
                                            {selectedDelivery.items.map((item, index) => (
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
                                                    <td className="p-3 font-medium">{formatCurrency(item.price || 0)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="mt-6 flex justify-end space-x-3">
                            <button
                                onClick={() => {
                                    setShowDetailsModal(false);
                                    setSelectedDelivery(null);
                                }}
                                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
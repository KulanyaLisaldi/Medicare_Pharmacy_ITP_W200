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
	const { token } = useAuth()

	const sidebar = [
		{ id: 'overview', label: 'Overview', icon: '🏠' },
		{ id: 'assignments', label: 'Assignments', icon: '🛵' },
		{ id: 'history', label: 'History', icon: '🗂️' },
		{ id: 'earnings', label: 'Earnings', icon: '💰' },
		{ id: 'messages', label: 'Messages', icon: '💬' },
	]

	const fetchDeliveryStats = async () => {
		try {
			setStatsLoading(true)
			const res = await fetch('http://localhost:5001/api/delivery/stats', {
				headers: { 'Authorization': `Bearer ${token}` }
			})
			const data = await res.json()
			if (res.ok) {
				setDeliveryStats(data)
			} else {
				console.error('Failed to fetch delivery stats:', data.message)
			}
		} catch (error) {
			console.error('Error fetching delivery stats:', error)
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
			const data = await res.json()
			if (res.ok) {
				setRecentDeliveries(data)
			} else {
				console.error('Failed to fetch recent deliveries:', data.message)
			}
		} catch (error) {
			console.error('Error fetching recent deliveries:', error)
		} finally {
			setRecentDeliveriesLoading(false)
		}
	}

	const fetchAllData = async () => {
		await Promise.all([fetchDeliveryStats(), fetchRecentDeliveries()])
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
			title="Delivery Dashboard" 
			sidebarItems={sidebar}
			onSectionChange={setActiveSection}
			activeSection={activeSection}
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

    const loadAvailableOrders = async () => {
        try {
            const res = await fetch('http://localhost:5001/api/delivery/available', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed to load available orders');
            setAvailableOrders(data);
        } catch (e) {
            setError(e.message);
        }
    };

    const loadAssignedOrders = async () => {
        try {
            const res = await fetch('http://localhost:5001/api/delivery/assigned', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed to load assigned orders');
            setAssignedOrders(data);
        } catch (e) {
            setError(e.message);
        }
    };

    const loadAllData = async () => {
        setLoading(true);
        try {
            await Promise.all([loadAvailableOrders(), loadAssignedOrders()]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) loadAllData();
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
                                                    #{order._id.slice(-8)}
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
                                                        className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 mr-2"
                                                        onClick={() => acceptOrder(order._id)}
                                                    >
                                                        Accept
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
                                                <td className="p-4 whitespace-nowrap">
                                                    <button
                                                        className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 mr-2 disabled:opacity-50"
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
                                                    {assignment.status === 'assigned' && (
                                                        <button
                                                            className="px-3 py-1 bg-yellow-600 text-white rounded text-xs hover:bg-yellow-700 mr-2"
                                                            onClick={() => openStatusModal(assignment, 'picked_up')}
                                                        >
                                                            Picked Up
                                                        </button>
                                                    )}
                                                    {assignment.status === 'picked_up' && (
                                                        <button
                                                            className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 mr-2"
                                                            onClick={() => openStatusModal(assignment, 'delivered')}
                                                        >
                                                            Delivered
                                                        </button>
                                                    )}
                                                    <button
                                                        className="px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                                                        onClick={() => openStatusModal(assignment, 'failed')}
                                                    >
                                                        Failed
                                                    </button>
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
        </div>
    );
}
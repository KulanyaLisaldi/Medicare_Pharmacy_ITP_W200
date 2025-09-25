import React, { useEffect, useState } from 'react'
import DashboardLayout from '../../layouts/DashboardLayout'
import './PharmacistDashboard.css'
import { useAuth } from '../../context/AuthContext'
import { Home, Package, ClipboardList, BarChart3, Bell } from 'lucide-react'

const PharmacistDashboard = () => {
	const [activeSection, setActiveSection] = useState('overview')
	const [pendingOrdersCount, setPendingOrdersCount] = useState(0)
	const [recentOrders, setRecentOrders] = useState([])
	const [lowStockCount, setLowStockCount] = useState(0)
	const [lowStockProducts, setLowStockProducts] = useState([])
	const [processedTodayCount, setProcessedTodayCount] = useState(0)
	const [notifications, setNotifications] = useState([])
	const [allProducts, setAllProducts] = useState([])
	const [readNotifications, setReadNotifications] = useState(new Set())

	const { token } = useAuth()

	const sidebar = [
		{ id: 'overview', label: 'Overview', icon: <Home size={18} /> },
		{ id: 'orders', label: 'Orders', icon: <Package size={18} /> },
		{ id: 'inventory', label: 'Inventory', icon: <ClipboardList size={18} /> },
		{ id: 'reports', label: 'Reports', icon: <BarChart3 size={18} /> },
		{ id: 'messages', label: 'Notifications', icon: <Bell size={18} /> },
	]

	// Fetch orders data
	useEffect(() => {
		const fetchOrders = async () => {
			try {
				// Fetch both product orders and prescription orders
				const [productOrdersRes, prescriptionOrdersRes] = await Promise.all([
					fetch('http://localhost:5001/api/orders', { headers: { 'Authorization': `Bearer ${token}` } }),
					fetch('http://localhost:5001/api/prescriptions/pharmacist/orders', { headers: { 'Authorization': `Bearer ${token}` } })
				]);

				const productOrders = await productOrdersRes.json();
				const prescriptionOrders = await prescriptionOrdersRes.json();

				if (productOrdersRes.ok && prescriptionOrdersRes.ok) {
					// Process and combine both order types with proper orderType field
					const processedProductOrders = productOrders.map(order => ({
						...order,
						orderType: 'product'
					}));
					
					const processedPrescriptionOrders = prescriptionOrders.map(order => ({
						...order,
						orderType: 'prescription'
					}));
					
					const allOrders = [...processedProductOrders, ...processedPrescriptionOrders];
					
					// Calculate pending count from both order types
					const pending = allOrders.filter(order => order.status === 'pending').length;
					setPendingOrdersCount(pending);
					
					// Calculate processed orders for today
					const today = new Date();
					today.setHours(0, 0, 0, 0);
					const processedToday = allOrders.filter(order => {
						const orderDate = new Date(order.updatedAt || order.createdAt);
						orderDate.setHours(0, 0, 0, 0);
						return orderDate.getTime() === today.getTime() && 
							   (order.status === 'processing' || order.status === 'ready' || 
								order.status === 'out_for_delivery' || order.status === 'delivered' || 
								order.status === 'completed');
					}).length;
					setProcessedTodayCount(processedToday);
					
					// Get 3 most recent orders
					setRecentOrders(allOrders.slice(0, 3));
				}
			} catch (error) {
				console.error('Error fetching orders:', error);
			}
		}
		if (token) fetchOrders()
	}, [token])

	// Fetch low stock products
	useEffect(() => {
		const fetchLowStockProducts = async () => {
			try {
				const res = await fetch('http://localhost:5001/api/products', {
					headers: { 'Authorization': `Bearer ${token}` }
				})
				const data = await res.json()
				if (res.ok) {
					// Store all products for expiry checking
					setAllProducts(data)
					
					// Filter products with stock less than 20
					const lowStock = data.filter(product => (product.stock || 0) < 20)
					setLowStockCount(lowStock.length)
					setLowStockProducts(lowStock.slice(0, 5)) // Show top 5 low stock items
				}
			} catch (error) {
				console.error('Error fetching low stock products:', error)
			}
		}
		if (token) fetchLowStockProducts()
	}, [token])

	// Generate notifications
	useEffect(() => {
		const generateNotifications = () => {
			const notificationList = []

			// New orders notifications
			if (recentOrders.length > 0) {
				recentOrders.slice(0, 3).forEach(order => {
					notificationList.push({
						id: `order-${order._id}`,
						type: 'order',
						title: 'New Order',
						message: `${order.orderType === 'prescription' ? 'New prescription uploaded by' : 'New product order from'} ${order.customer?.name || 'Customer'}`,
						timestamp: new Date(order.createdAt),
						priority: 'high',
						icon: order.orderType === 'prescription' ? '📄' : '📦'
					})
				})
			}

			// Stock alerts notifications
			lowStockProducts.slice(0, 3).forEach(product => {
				const stock = product.stock || 0
				notificationList.push({
					id: `stock-${product._id}`,
					type: 'stock',
					title: 'Stock Alert',
					message: `${product.name} stock is below threshold (${stock} units left)`,
					timestamp: new Date(),
					priority: stock <= 5 ? 'high' : stock <= 10 ? 'medium' : 'low',
					icon: '⚠️'
				})
			})

			// Expiry alerts - filter products expiring within 30 days
			const today = new Date()
			const thirtyDaysFromNow = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000))
			
			// Filter products expiring within 30 days
			const expiringProducts = allProducts.filter(product => {
				if (!product.expiryDate) return false
				const expiryDate = new Date(product.expiryDate)
				return expiryDate >= today && expiryDate <= thirtyDaysFromNow
			})

			expiringProducts.forEach(product => {
				const expiryDate = new Date(product.expiryDate)
				const daysLeft = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24))
				
				notificationList.push({
					id: `expiry-${product._id}`,
					type: 'expiry',
					title: 'Expiry Alert',
					message: `${product.name} will expire in ${daysLeft} days`,
					timestamp: new Date(),
					priority: daysLeft <= 7 ? 'high' : daysLeft <= 15 ? 'medium' : 'low',
					icon: '⏰'
				})
			})

			// Sort by timestamp (newest first)
			notificationList.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
			setNotifications(notificationList)
		}

		generateNotifications()
	}, [recentOrders, lowStockProducts, allProducts])

	// Function to mark notification as read
	const markNotificationAsRead = (notificationId) => {
		setReadNotifications(prev => new Set([...prev, notificationId]))
	}

	// Function to mark all notifications as read
	const markAllNotificationsAsRead = () => {
		const allNotificationIds = notifications.map(n => n.id)
		setReadNotifications(new Set(allNotificationIds))
	}

	const renderSection = () => {
		switch (activeSection) {
			case 'overview':
				return (
					<div className="pharmacist-overview">
						{/* Stats Grid */}
						<div className="pharmacist-stats">
							<div className="stat-card">
								<div className="stat-icon">📦</div>
								<h3>Pending Orders</h3>
								<p className="stat-number">{pendingOrdersCount}</p>
								<span className="stat-change positive">Real-time count</span>
							</div>
							<div className="stat-card">
								<div className="stat-icon">⚠️</div>
								<h3>Low Stock Items</h3>
								<p className="stat-number">{lowStockCount}</p>
								<span className="stat-change negative">Stock level below 20</span>
							</div>
							<div className="stat-card">
								<div className="stat-icon">✅</div>
								<h3>Processed Today</h3>
								<p className="stat-number">{processedTodayCount}</p>
								<span className="stat-change positive">Real-time count</span>
							</div>
						</div>

						{/* Quick Actions */}
						<div className="quick-actions-section">
							<h2>Quick Actions</h2>
							<div className="action-buttons">
								<button 
									className="action-btn secondary"
									onClick={() => setActiveSection('orders')}
								>
									<span className="action-icon">📋</span>
									Process Order
								</button>
								<button 
									className="action-btn secondary"
									onClick={() => setActiveSection('inventory')}
								>
									<span className="action-icon">📦</span>
									Check Inventory
								</button>
								<button 
									className="action-btn secondary"
									onClick={() => setActiveSection('messages')}
								>
									<span className="action-icon">👥</span>
									Customer Query
								</button>
							</div>
						</div>

						{/* Recent Orders */}
						<div className="recent-orders">
							<h2>Recent Orders</h2>
							<div className="orders-list">
								{recentOrders.length === 0 ? (
									<div className="text-gray-500 text-center py-4">No recent orders</div>
								) : (
									recentOrders.map(order => (
										<div key={order._id} className="order-item">
											<div className="order-info">
												<div className="order-id">#{order._id.slice(-8)}</div>
												<div className="order-customer">{order.customer?.name || 'Unknown'}</div>
												<div className="order-items">{order.items?.length || 0} items</div>
												<div className="order-time">{new Date(order.createdAt).toLocaleTimeString()}</div>
											</div>
											<div className={`order-status ${order.status}`}>{order.status.replace('_', ' ')}</div>
										</div>
									))
								)}
							</div>
						</div>

						{/* Inventory Alerts */}
						<div className="inventory-alerts">
							<h2>Low Stock Alerts</h2>
							<div className="alerts-list">
								{lowStockProducts.length === 0 ? (
									<div className="text-gray-500 text-center py-4">No low stock items</div>
								) : (
									lowStockProducts.map(product => {
										const stock = product.stock || 0
										const alertLevel = stock <= 5 ? 'high' : stock <= 10 ? 'medium' : 'low'
										const icon = stock <= 5 ? '🔴' : stock <= 10 ? '🟡' : '🟢'
										
										return (
											<div key={product._id} className={`alert-item ${alertLevel}`}>
												<div className="alert-icon">{icon}</div>
												<div className="alert-content">
													<div className="alert-title">{product.name}</div>
													<div className="alert-details">Only {stock} units remaining</div>
												</div>
												<button className="alert-action">Reorder</button>
											</div>
										)
									})
								)}
							</div>
						</div>

					</div>
				);

            case 'orders':
                return <OrdersSection />;

            case 'inventory':
                return <InventorySection />;


			case 'reports':
				return (
					<div className="reports-section">
						<h2>Reports & Analytics</h2>
						<p>Reports and analytics features coming soon...</p>
					</div>
				);

			case 'messages':
				return (
					<div className="notifications-section">
						<div className="flex items-center justify-between mb-6">
							<h2 className="text-2xl font-semibold text-gray-900">Notifications</h2>
							<div className="flex items-center gap-2">
								<span className="text-sm text-gray-500">{notifications.length} notifications</span>
								<button 
									onClick={markAllNotificationsAsRead}
									className="px-3 py-1 text-xs bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
								>
									Mark All Read
								</button>
							</div>
						</div>

						{notifications.length === 0 ? (
							<div className="text-center py-12">
								<div className="text-gray-400 text-4xl mb-4">🔔</div>
								<h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
								<p className="text-gray-500">You're all caught up! No new notifications at the moment.</p>
							</div>
						) : (
							<div className="space-y-4">
								{notifications.map(notification => {
									const isRead = readNotifications.has(notification.id)
									return (
										<div 
											key={notification.id} 
											className={`p-4 rounded-lg border-l-4 transition-opacity ${
												notification.priority === 'high' 
													? 'border-red-500 bg-red-50' 
													: notification.priority === 'medium'
													? 'border-yellow-500 bg-yellow-50'
													: 'border-blue-500 bg-blue-50'
											} ${isRead ? 'opacity-60' : ''}`}
										>
											<div className="flex items-start gap-3">
												<div className="text-2xl">{notification.icon}</div>
												<div className="flex-1">
													<div className="flex items-center justify-between">
														<div className="flex items-center gap-2">
															<h3 className={`font-semibold ${isRead ? 'text-gray-600' : 'text-gray-900'}`}>
																{notification.title}
															</h3>
															{!isRead && (
																<span className="w-2 h-2 bg-blue-500 rounded-full"></span>
															)}
														</div>
														<div className="flex items-center gap-2">
															<span className="text-xs text-gray-500">
																{notification.timestamp.toLocaleTimeString()}
															</span>
															{!isRead && (
																<button
																	onClick={() => markNotificationAsRead(notification.id)}
																	className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
																>
																	Mark Read
																</button>
															)}
														</div>
													</div>
													<p className={`mt-1 ${isRead ? 'text-gray-500' : 'text-gray-700'}`}>
														{notification.message}
													</p>
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
															{notification.type === 'order' ? 'Order' : 
															 notification.type === 'stock' ? 'Stock' : 'Expiry'}
														</span>
														{isRead && (
															<span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
																Read
															</span>
														)}
													</div>
												</div>
											</div>
										</div>
									)
								})}
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
			title="Pharmacist Dashboard" 
			sidebarItems={sidebar}
			onSectionChange={setActiveSection}
			activeSection={activeSection}
			notificationCount={notifications.filter(n => !readNotifications.has(n.id)).length}
			notifications={notifications.filter(n => !readNotifications.has(n.id))}
		>
			<div className="pharmacist-dashboard">
				{renderSection()}
			</div>
		</DashboardLayout>
	)
}

function InventorySection() {
    const { token } = useAuth();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [query, setQuery] = useState('');

    const emptyForm = { name: '', category: '', subcategory: '', brand: '', dosageForm: '', strength: '', packSize: '', batchNumber: '', manufacturingDate: '', expiryDate: '', description: '', price: 0, stock: 0, prescriptionRequired: false, tags: [] };
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState(emptyForm);
    const [fieldErrors, setFieldErrors] = useState({
        price: '',
        stock: ''
    });
    const [editing, setEditing] = useState(null);

    // Validation functions for price and stock fields
    const handleNumericKeyDown = (e) => {
        const { name } = e.target;
        if (name === 'price' || name === 'stock') {
            const key = e.key || '';
            const controlKeys = ['Backspace','Tab','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End','Delete'];
            if (controlKeys.includes(key)) return;
            
            // Block minus (-) character
            if (key === '-') {
                e.preventDefault();
                setFieldErrors(prev => ({
                    ...prev,
                    [name]: 'Cannot enter negative values'
                }));
            }
        }
    };

    const handleNumericPaste = (e) => {
        const { name } = e.target;
        if (name === 'price' || name === 'stock') {
            const pastedText = (e.clipboardData || window.clipboardData).getData('text');
            
            // Block if contains minus
            if (pastedText.includes('-')) {
                e.preventDefault();
                setFieldErrors(prev => ({
                    ...prev,
                    [name]: 'Cannot enter negative values'
                }));
            }
        }
    };

    const handleNumericChange = (e) => {
        const { name, value } = e.target;
        
        // Convert to number and ensure it's not negative
        const numericValue = parseFloat(value);
        
        if (value.trim() && (isNaN(numericValue) || numericValue < 0)) {
            setFieldErrors(prev => ({
                ...prev,
                [name]: 'Cannot enter negative values'
            }));
        } else if (value.trim() && numericValue === 0 && value !== '0') {
            setFieldErrors(prev => ({
                ...prev,
                [name]: 'Value must be a valid number'
            }));
        } else {
            setFieldErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
        
        // Update the form with the numeric value
        setForm(prev => ({ ...prev, [name]: numericValue || 0 }));
    };

    const load = async () => {
        try {
            const res = await fetch(`http://localhost:5001/api/products${query ? `?q=${encodeURIComponent(query)}` : ''}`, { headers: { 'Authorization': `Bearer ${token}` } });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed to load products');
            setItems(data);
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); /* eslint-disable-next-line */ }, [token]);

    const openCreate = () => { setEditing(null); setForm(emptyForm); setShowForm(true); };
    const openEdit = (p) => { setEditing(p); setForm({ ...p }); setShowForm(true); };

    const save = async (e) => {
        e.preventDefault();
        
        // Validate price and stock fields
        let hasErrors = false;
        const newFieldErrors = {};
        
        if (form.price < 0) {
            newFieldErrors.price = 'Price cannot be negative';
            hasErrors = true;
        } else {
            newFieldErrors.price = '';
        }
        
        if (form.stock < 0) {
            newFieldErrors.stock = 'Stock cannot be negative';
            hasErrors = true;
        } else {
            newFieldErrors.stock = '';
        }
        
        setFieldErrors(newFieldErrors);
        
        if (hasErrors) {
            return;
        }
        
        const method = editing ? 'PUT' : 'POST';
        const url = editing ? `http://localhost:5001/api/products/${editing._id}` : 'http://localhost:5001/api/products';
        const res = await fetch(url, { method, headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
        const data = await res.json();
        if (res.ok) {
            setShowForm(false);
            setEditing(null);
            setForm(emptyForm);
            setFieldErrors({ price: '', stock: '' });
            load();
        } else {
            setError(data.message || 'Save failed');
        }
    };

    const remove = async (id) => {
        const res = await fetch(`http://localhost:5001/api/products/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
        if (res.ok) setItems(prev => prev.filter(x => x._id !== id));
    };

    return (
        <div className="inventory-section">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
                {/*<h2>Inventory Management</h2>*/}
                <div className="flex gap-2">
                    <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search products..." className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-0 focus:border-gray-400" />
                    <button className="btn-outline" onClick={load}>Search</button>
                    <button className="btn-primary" onClick={openCreate}>Add Product</button>
                </div>
            </div>

            {error && <div className="mb-3 px-3 py-2 rounded bg-red-50 text-red-700 text-sm">{error}</div>}

            <div className="bg-white rounded-xl shadow overflow-x-auto">
                {loading ? (
                    <div className="p-6">Loading...</div>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left text-gray-600">
                                <th className="p-2">Name</th>
                                <th className="p-2">Category</th>
                                <th className="p-2">Details</th>
                                <th className="p-2">Pack Size</th>
                                <th className="p-2">Price</th>
                                <th className="p-2">Stock</th>
                                <th className="p-2">Expiry</th>
                                <th className="p-2">Prescription</th>
                                <th className="p-2">Added Date</th>
                                <th className="p-2">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map(p => (
                                <tr key={p._id} className="border-t">
                                    <td className="p-2">
                                        <div className="text-gray-800 font-medium">{p.name}</div>
                                        <div className="text-gray-500 text-xs max-w-xs truncate" title={p.description}>{p.description}</div>
                                    </td>
                                    <td className="p-2">{p.category}</td>
                                    <td className="p-2">
                                        <div className="text-xs text-gray-600">
                                            <div><span className="text-gray-500">Brand:</span> {p.brand || '-'}</div>
                                            <div><span className="text-gray-500">Form:</span> {p.dosageForm || '-'}</div>
                                            <div><span className="text-gray-500">Strength:</span> {p.strength || '-'}</div>
                                        </div>
                                    </td>
                                    <td className="p-2">{p.packSize}</td>
                                    <td className="p-2">Rs.{Number(p.price ?? 0).toFixed(2)}</td>
                                    <td className="p-2">{p.stock}</td>
                                    <td className="p-2 text-xs">{p.expiryDate ? new Date(p.expiryDate).toLocaleDateString() : '-'}</td>
                                    <td className="p-2 text-xs">{p.prescriptionRequired ? 'Required' : 'Not Required'}</td>
									<td className="p-2 text-xs">{p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '-'}</td>
                                    <td className="p-2 whitespace-nowrap">
										<button className="btn-outline mr-2 px-2 py-1 text-xs" onClick={() => openEdit(p)}>Edit</button>
										<button className="btn-danger px-2 py-1 text-xs" onClick={() => remove(p._id)}>Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {showForm && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                    <div className="bg-white w-full max-w-3xl max-h-[85vh] overflow-y-auto rounded-xl shadow-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="text-lg font-semibold">{editing ? 'Edit Product' : 'Add Product'}</div>
                            <button onClick={() => { setShowForm(false); setEditing(null); }} className="text-gray-500 hover:text-gray-700">✕</button>
                        </div>
                        <form onSubmit={save} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm text-gray-600">Name</label>
                                <input className="mt-1 w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-0 focus:border-gray-400" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-600">Brand</label>
                                <input className="mt-1 w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-0 focus:border-gray-400" value={form.brand} onChange={e => setForm({ ...form, brand: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-600">Category</label>
                                <select className="mt-1 w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-0 focus:border-gray-400" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                                    <option value="">Select</option>
                                    <option>Pain Relief</option>
                                    <option>Antibiotics</option>
                                    <option>Allergy</option>
                                    <option>Cold, Flu & Respiratory</option>
                                    <option>Diabetes & Endocrine</option>
                                    <option>Skin Care Medicines</option>
                                    <option>Vitamins, Minerals & Supplements</option>
                                    <option>Neurology</option>
                                    <option>Eye & Ear Medicines</option>
                                    <option>Women’s Health / Pregnancy / Contraceptives</option>
                                    <option>Injectables & IV Solutions</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm text-gray-600">Subcategory</label>
                                <select className="mt-1 w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-0 focus:border-gray-400" value={form.subcategory} onChange={e => setForm({ ...form, subcategory: e.target.value })}>
                                    <option value="">Select</option>
                                    <option>Tablet</option>
                                    <option>Capsule</option>
                                    <option>Syrup</option>
                                    <option>Cream</option>
                                    <option>Ointment</option>
                                    <option>Drops</option>
                                    <option>Inhaler</option>
                                    <option>Patch</option>
                                    <option>Gel</option>
                                    <option>Spray</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm text-gray-600">Dosage Form</label>
                                <select className="mt-1 w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-0 focus:border-gray-400" value={form.dosageForm} onChange={e => setForm({ ...form, dosageForm: e.target.value })}>
                                    <option value="">Select</option>
                                    <option>Tablet</option>
                                    <option>Capsule</option>
                                    <option>Syrup / Oral liquid</option>
                                    <option>Injection (IV, IM, SC)</option>
                                    <option>Cream / Ointment</option>
                                    <option>Eye drops / Ear drops</option>
                                    <option>Inhaler</option>
                                    <option>Patch</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm text-gray-600">Strength</label>
                                <input className="mt-1 w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-0 focus:border-gray-400" value={form.strength} onChange={e => setForm({ ...form, strength: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-600">Pack Size</label>
                                <input className="mt-1 w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-0 focus:border-gray-400" placeholder="e.g., 10 tablets/strip" value={form.packSize} onChange={e => setForm({ ...form, packSize: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-600">Batch Number</label>
                                <input className="mt-1 w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-0 focus:border-gray-400" value={form.batchNumber} onChange={e => setForm({ ...form, batchNumber: e.target.value })} />
                            </div>
                            {/* Removed Added Date field; createdAt is automatic */}
                            <div>
                                <label className="block text-sm text-gray-600">Expiry Date</label>
                                <input 
                                    type="date" 
                                    className="mt-1 w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-0 focus:border-gray-400" 
                                    value={form.expiryDate} 
                                    onChange={e => setForm({ ...form, expiryDate: e.target.value })} 
                                    min={new Date().toISOString().split('T')[0]}
                                    required
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm text-gray-600">Description</label>
                                <textarea className="mt-1 w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-0 focus:border-gray-400" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm text-gray-600">Tags</label>
                                <div className="mt-1 grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                                    {['Pain','Fever','Analgesic','Anti-inflammatory','Allergy','Non-drowsy','Cold','Acid Reflux','Pregnancy','Vitamin'].map(t => (
                                        <label key={t} className="flex items-center gap-2">
                                            <input type="checkbox" checked={form.tags?.includes(t)} onChange={e => {
                                                const next = new Set(form.tags || []);
                                                if (e.target.checked) next.add(t); else next.delete(t);
                                                setForm({ ...form, tags: Array.from(next) });
                                            }} />
                                            <span>{t}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm text-gray-600">Unit Price</label>
                                <input 
                                    type="number" 
                                    name="price"
                                    min="0" 
                                    step="0.01" 
                                    className={`mt-1 w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-0 focus:border-gray-400 ${fieldErrors.price ? 'border-red-500 bg-red-50' : ''}`} 
                                    value={form.price} 
                                    onChange={handleNumericChange}
                                    onKeyDown={handleNumericKeyDown}
                                    onPaste={handleNumericPaste}
                                />
                                {fieldErrors.price && (
                                    <p className="text-xs text-red-600 mt-1">{fieldErrors.price}</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm text-gray-600">Quantity</label>
                                <input 
                                    type="number" 
                                    name="stock"
                                    min="0" 
                                    className={`mt-1 w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-0 focus:border-gray-400 ${fieldErrors.stock ? 'border-red-500 bg-red-50' : ''}`} 
                                    value={form.stock} 
                                    onChange={handleNumericChange}
                                    onKeyDown={handleNumericKeyDown}
                                    onPaste={handleNumericPaste}
                                />
                                {fieldErrors.stock && (
                                    <p className="text-xs text-red-600 mt-1">{fieldErrors.stock}</p>
                                )}
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm text-gray-600">Prescription Required</label>
                                <div className="flex gap-6 mt-1">
                                    <label className="flex items-center gap-2">
                                        <input type="radio" name="rx" checked={form.prescriptionRequired === true} onChange={() => setForm({ ...form, prescriptionRequired: true })} />
                                        <span>Yes</span>
                                    </label>
                                    <label className="flex items-center gap-2">
                                        <input type="radio" name="rx" checked={form.prescriptionRequired === false} onChange={() => setForm({ ...form, prescriptionRequired: false })} />
                                        <span>No</span>
                                    </label>
                                </div>
                            </div>
                            <div className="md:col-span-2 flex justify-end gap-3 mt-2">
                                <button type="button" className="btn-outline" onClick={() => { setShowForm(false); setEditing(null); }}>Cancel</button>
                                <button className="btn-primary" type="submit">{editing ? 'Save' : 'Add Product'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default PharmacistDashboard

function OrdersSection() {
    const { token } = useAuth();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selected, setSelected] = useState(null);
    const [selectedItemsWithDetails, setSelectedItemsWithDetails] = useState([]);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [notes, setNotes] = useState('');
    const [filterStatus, setFilterStatus] = useState('all'); // all, pending, processing
    const [showProductSelection, setShowProductSelection] = useState(false);
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [availableProducts, setAvailableProducts] = useState([]);
    const [loadingProducts, setLoadingProducts] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredProducts, setFilteredProducts] = useState([]);

    const load = async () => {
        try {
            // Fetch both product orders and prescription orders
            const [productOrdersRes, prescriptionOrdersRes] = await Promise.all([
                fetch('http://localhost:5001/api/orders', { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch('http://localhost:5001/api/prescriptions/pharmacist/orders', { headers: { 'Authorization': `Bearer ${token}` } })
            ]);

            const productOrders = await productOrdersRes.json();
            const prescriptionOrders = await prescriptionOrdersRes.json();

            if (!productOrdersRes.ok) throw new Error(productOrders.message || 'Failed to load product orders');
            if (!prescriptionOrdersRes.ok) throw new Error(prescriptionOrders.message || 'Failed to load prescription orders');

            // Process and combine both order types with proper orderType field
            const processedProductOrders = productOrders.map(order => ({
                ...order,
                orderType: 'product'
            }));
            
            const processedPrescriptionOrders = prescriptionOrders.map(order => ({
                ...order,
                orderType: 'prescription'
            }));
            
            const allOrders = [...processedProductOrders, ...processedPrescriptionOrders];
            setOrders(allOrders);
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); /* eslint-disable-next-line */ }, [token]);

    // Handle search filtering
    useEffect(() => {
        if (searchTerm.trim()) {
            const filtered = availableProducts.filter(product =>
                product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                product.category.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredProducts(filtered);
        } else {
            setFilteredProducts(availableProducts);
        }
    }, [searchTerm, availableProducts]);

    const openDetails = async (o) => { 
        setSelected(o); 
        setNotes(o.pharmacistNotes || ''); 
        setLoadingDetails(true);
        
        // Fetch product details for each item
        const itemsWithDetails = await getOrderItemsWithDetails(o);
        setSelectedItemsWithDetails(itemsWithDetails);
        setLoadingDetails(false);
    };
    
    const closeDetails = () => { 
        setSelected(null); 
        setSelectedItemsWithDetails([]);
    };

    const updateStatus = async (id, patch) => {
        const res = await fetch(`http://localhost:5001/api/orders/${id}`, { 
            method: 'PATCH', 
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, 
            body: JSON.stringify(patch) 
        });
        const data = await res.json();
        if (res.ok) { 
            setOrders(prev => prev.map(o => o._id === id ? data : o)); 
            setSelected(data); 
        }
    };

    const markOOS = async (orderId, idx, value) => {
        await updateStatus(orderId, { items: [{ index: idx, outOfStock: value }] });
    };

    const saveNotes = async () => {
        if (!selected) return;
        await updateStatus(selected._id, { pharmacistNotes: notes });
    };

    const confirmPrep = async () => {
        if (!selected) return;
        const res = await fetch(`http://localhost:5001/api/orders/${selected._id}/confirm-preparation`, { 
            method: 'POST', 
            headers: { 'Authorization': `Bearer ${token}` } 
        });
        const data = await res.json();
        if (res.ok) { 
            setOrders(prev => prev.map(o => o._id === selected._id ? data : o)); 
            setSelected(data); 
        }
    };

    const verifyOrder = async (orderId) => {
        await updateStatus(orderId, { status: 'approved' });
    };

    const markAsProcessing = async (orderId) => {
        await updateStatus(orderId, { status: 'processing' });
    };

    const markAsReady = async (orderId) => {
        await updateStatus(orderId, { status: 'ready' });
    };

    const fetchAvailableProducts = async () => {
        setLoadingProducts(true);
        try {
            const res = await fetch('http://localhost:5001/api/products', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                setAvailableProducts(data);
                setFilteredProducts(data); // Initialize filtered products
            } else {
                setError(data.message || 'Failed to fetch products');
            }
        } catch (e) {
            setError(e.message);
        } finally {
            setLoadingProducts(false);
        }
    };

    const openProductSelection = async () => {
        await fetchAvailableProducts();
        setSelectedProducts([]);
        setSearchTerm(''); // Reset search
        setShowProductSelection(true);
    };

    // Search products function
    const handleSearch = (searchValue) => {
        setSearchTerm(searchValue);
        if (!searchValue.trim()) {
            setFilteredProducts(availableProducts);
        } else {
            const filtered = availableProducts.filter(product =>
                product.name.toLowerCase().includes(searchValue.toLowerCase()) ||
                product.description.toLowerCase().includes(searchValue.toLowerCase()) ||
                product.category.toLowerCase().includes(searchValue.toLowerCase())
            );
            setFilteredProducts(filtered);
        }
    };

    const closeProductSelection = () => {
        setShowProductSelection(false);
        setSelectedProducts([]);
        setSearchTerm('');
        setFilteredProducts([]);
    };

    const addProductToSelection = (product) => {
        // Check if product has stock
        if ((product.stock || 0) <= 0) {
            setError('This product is out of stock');
            return;
        }

        const existing = selectedProducts.find(p => p.productId === product._id);
        if (existing) {
            // Check if adding one more would exceed stock
            if (existing.quantity + 1 > (product.stock || 0)) {
                setError(`Cannot add more. Only ${product.stock} units available in stock.`);
                return;
            }
            setSelectedProducts(selectedProducts.map(p => 
                p.productId === product._id 
                    ? { ...p, quantity: p.quantity + 1, lineTotal: (p.quantity + 1) * p.price }
                    : p
            ));
        } else {
            setSelectedProducts([...selectedProducts, {
                productId: product._id,
                name: product.name,
                price: product.price,
                quantity: 1,
                lineTotal: product.price,
                stockQuantity: product.stock || 0
            }]);
        }
    };

    const updateProductQuantity = (productId, quantity) => {
        if (quantity <= 0) {
            setSelectedProducts(selectedProducts.filter(p => p.productId !== productId));
        } else {
            // Find the product to check stock
            const product = availableProducts.find(p => p._id === productId);
            if (product && quantity > (product.stock || 0)) {
                setError(`Cannot set quantity to ${quantity}. Only ${product.stock} units available in stock.`);
                return;
            }
            setSelectedProducts(selectedProducts.map(p => 
                p.productId === productId 
                    ? { ...p, quantity, lineTotal: quantity * p.price }
                    : p
            ));
        }
    };

    const removeProductFromSelection = (productId) => {
        setSelectedProducts(selectedProducts.filter(p => p.productId !== productId));
    };

    const sendProductListToCustomer = async () => {
        if (!selected || selectedProducts.length === 0) return;


        try {
            const res = await fetch(`http://localhost:5001/api/prescriptions/${selected._id}/order-list`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ orderList: selectedProducts })
            });

            const data = await res.json();
            if (res.ok) {
                setShowProductSelection(false);
                setSelectedProducts([]);
                load(); // Refresh orders
                setSelected(null); // Close details modal
            } else {
                setError(data.message || 'Failed to send product list');
            }
        } catch (error) {
            setError('Network error. Please try again.');
        }
    };

    // Helper function to clean prescription file path
    const getPrescriptionFileUrl = (prescriptionFile) => {
        if (!prescriptionFile) return '';
        
        // If the file path already includes uploads/prescriptions, extract just the filename
        if (prescriptionFile.includes('uploads/prescriptions/')) {
            const filename = prescriptionFile.split('/').pop();
            return `http://localhost:5001/uploads/prescriptions/${filename}`;
        }
        
        // If it's just a filename, add the uploads/prescriptions prefix
        return `http://localhost:5001/uploads/prescriptions/${prescriptionFile}`;
    };

    // Filter orders based on status
    const filteredOrders = orders.filter(order => {
        if (filterStatus === 'all') return true;
        return order.status === filterStatus;
    });

    // Get order items with product details
    const getOrderItemsWithDetails = async (order) => {
        const itemsWithDetails = await Promise.all(
            order.items.map(async (item) => {
                if (item.productId) {
                    try {
                        const res = await fetch(`http://localhost:5001/api/products/${item.productId}`, {
                            headers: { 'Authorization': `Bearer ${token}` }
                        });
                        const product = await res.json();
                        if (res.ok) {
                            return {
                                ...item,
                                dosageForm: product.dosageForm,
                                strength: product.strength,
                                batchNumber: product.batchNumber,
                                expiryDate: product.expiryDate,
                                prescriptionRequired: product.prescriptionRequired
                            };
                        }
                    } catch (error) {
                        console.error('Error fetching product details:', error);
                    }
                }
                return item;
            })
        );
        return itemsWithDetails;
    };

    return (
        <div className="orders-section">
            <div className="flex items-center justify-between mb-4">
                <h2>New Orders List</h2>
                <div className="flex gap-2">
                    <select 
                        value={filterStatus} 
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:border-gray-400"
                    >
                        <option value="all">All Orders</option>
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                    </select>
                    <button onClick={load} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        Refresh
                    </button>
                </div>
            </div>
            
            {error && <div className="mb-3 px-3 py-2 rounded bg-red-50 text-red-700 text-sm">{error}</div>}
            
            <div className="bg-white rounded-xl shadow overflow-x-auto">
                {loading ? (
                    <div className="p-6">Loading...</div>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left text-gray-600 bg-gray-50">
                                <th className="p-3">Order ID</th>
                                <th className="p-3">Customer Info</th>
                                <th className="p-3">Order Type</th>
                                <th className="p-3">Status</th>
                                <th className="p-3">Amount</th>
                                <th className="p-3">Note</th>
                                <th className="p-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredOrders.map(o => (
                                <tr key={o._id} className="border-t hover:bg-gray-50">
                                    <td className="p-3 font-mono text-blue-600">#{o._id.slice(-8)}</td>
                                    <td className="p-3">
                                        <div className="text-sm font-medium">{o.customer?.name}</div>
                                        <div className="text-xs text-gray-500">{o.customer?.phone}</div>
                                        <div className="text-xs text-gray-500 max-w-xs truncate" title={o.orderType === 'prescription' ? o.prescriptionDetails?.patientAddress : o.customer?.address}>
                                            {o.orderType === 'prescription' ? o.prescriptionDetails?.patientAddress : o.customer?.address}
                                        </div>
                                    </td>
                                    <td className="p-3">
                                        <span className={`px-2 py-1 rounded-full text-xs ${
                                            o.orderType === 'prescription' 
                                                ? 'bg-purple-100 text-purple-800' 
                                                : 'bg-blue-100 text-blue-800'
                                        }`}>
                                            {o.orderType === 'prescription' ? 'Prescription Order' : 'Product Order'}
                                        </span>
                                    </td>
                                    <td className="p-3">
                                        <span className={`px-2 py-1 rounded-full text-xs ${
                                            o.status === 'pending' 
                                                ? 'bg-yellow-100 text-yellow-800'
                                                : o.status === 'processing'
                                                ? 'bg-blue-100 text-blue-800'
                                                : 'bg-green-100 text-green-800'
                                        }`}>
                                            {o.status === 'pending' ? 'Pending' : 
                                             o.status === 'processing' ? 'Processing' : 
                                             o.status.charAt(0).toUpperCase() + o.status.slice(1).replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="p-3 font-semibold">Rs. {Number(o.total || 0).toFixed(2)}</td>
                                    <td className="p-3">
                                        <div className="text-xs text-gray-600 max-w-xs truncate" title={o.pharmacistNotes || 'No notes'}>
                                            {o.pharmacistNotes || '-'}
                                        </div>
                                    </td>
                                    <td className="p-3 whitespace-nowrap">
                                        <button 
                                            className="btn-outline mr-2 px-3 py-1 text-xs" 
                                            onClick={() => openDetails(o)}
                                        >
                                            View Details
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {selected && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                    <div className="bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl shadow-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="text-lg font-semibold">Order Details - #{selected._id.slice(-8)}</div>
                            <button onClick={closeDetails} className="text-gray-500 hover:text-gray-700 text-xl">✕</button>
                        </div>
                        
                        {/* Order Information */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h3 className="font-semibold mb-3">Customer Information</h3>
                                <div className="space-y-2">
                                    <div><span className="text-gray-600">Name:</span> {selected.customer?.name}</div>
                                    <div><span className="text-gray-600">Phone:</span> {selected.customer?.phone}</div>
                                    <div><span className="text-gray-600">Address:</span> {selected.orderType === 'prescription' ? selected.prescriptionDetails?.patientAddress : selected.customer?.address}</div>
                                    {selected.customer?.notes && (
                                        <div><span className="text-gray-600">Notes:</span> {selected.customer.notes}</div>
                                    )}
                                </div>
                            </div>
                            
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h3 className="font-semibold mb-3">Order Information</h3>
                                <div className="space-y-2">
                                    <div><span className="text-gray-600">Status:</span> 
                                        <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                                            selected.status === 'pending' 
                                                ? 'bg-yellow-100 text-yellow-800'
                                                : selected.status === 'processing'
                                                ? 'bg-blue-100 text-blue-800'
                                                : 'bg-green-100 text-green-800'
                                        }`}>
                                            {selected.status === 'pending' ? 'Pending' : 
                                             selected.status === 'processing' ? 'Processing' : 
                                             selected.status.charAt(0).toUpperCase() + selected.status.slice(1).replace('_', ' ')}
                                        </span>
                                    </div>
                                    <div><span className="text-gray-600">Payment:</span> 
                                        <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                                            selected.paymentMethod === 'cod' 
                                                ? 'bg-orange-100 text-orange-800' 
                                                : 'bg-green-100 text-green-800'
                                        }`}>
                                            {selected.paymentMethod === 'cod' ? 'COD' : 'Online'}
                                        </span>
                                    </div>
                                    <div><span className="text-gray-600">Delivery:</span> {selected.deliveryType === 'pickup' ? 'Pickup' : 'Home Delivery'}</div>
                                    <div><span className="text-gray-600">Total:</span> Rs.{Number(selected.total || 0).toFixed(2)}</div>
                                </div>
                            </div>
                        </div>

                        {/* Order Details */}
                        <div className="mb-6">
                            {selected.orderType === 'prescription' ? (
                                <div>
                                    <h3 className="font-semibold mb-3">Prescription Details</h3>
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <p><span className="font-medium">Prescription Number:</span> {selected.prescriptionDetails?.prescriptionNumber}</p>
                                            </div>
                                        </div>
                                        {selected.prescriptionFile && (
                                            <div className="mt-4">
                                                <p className="font-medium mb-2">Prescription File:</p>
                                                <a 
                                                    href={getPrescriptionFileUrl(selected.prescriptionFile)} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 hover:text-blue-800 underline"
                                                >
                                                    View Prescription File
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div>
                            <h3 className="font-semibold mb-3">Product List</h3>
                            {loadingDetails ? (
                                <div className="bg-gray-50 rounded-lg p-6 text-center">
                                    <div className="text-gray-500">Loading product details...</div>
                                </div>
                            ) : (
                                <div className="bg-gray-50 rounded-lg overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead>
                                            <tr className="text-left text-gray-600 bg-gray-100">
                                                <th className="p-3">Product Name</th>
                                                <th className="p-3">Dosage Form</th>
                                                <th className="p-3">Strength</th>
                                                <th className="p-3">Quantity</th>
                                                <th className="p-3">Batch No.</th>
                                                <th className="p-3">Expiry Date</th>
                                                <th className="p-3">Price</th>
                                                <th className="p-3">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                            {selectedItemsWithDetails.map((it, idx) => (
                                            <tr key={idx} className="border-t">
                                                    <td className="p-3 font-medium">{it.name}</td>
                                                    <td className="p-3">{it.dosageForm || '-'}</td>
                                                    <td className="p-3">{it.strength || '-'}</td>
                                                    <td className="p-3">{it.quantity}</td>
                                                    <td className="p-3">{it.batchNumber || '-'}</td>
                                                    <td className="p-3">{it.expiryDate ? new Date(it.expiryDate).toLocaleDateString() : '-'}</td>
                                                    <td className="p-3">Rs.{Number(it.price||0).toFixed(2)}</td>
                                                    <td className="p-3">Rs.{Number(it.lineTotal|| (it.price||0)*(it.quantity||1)).toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                    </div>
                                    )}
                            </div>
                            )}
                        </div>

                        {/* Pharmacist Notes */}
                        <div className="mb-6">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Pharmacist Notes</label>
                            <textarea 
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-gray-400" 
                                rows="3"
                                value={notes} 
                                onChange={e => setNotes(e.target.value)} 
                                placeholder="Add notes about this order..."
                            />
                            <div className="mt-2">
                                <button className="btn-outline px-4 py-2" onClick={saveNotes}>Save Notes</button>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-3">
                            {selected.orderType === 'prescription' && selected.status === 'pending' && (!selected.orderList || selected.orderList.length === 0) && (
                                <button 
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                    onClick={openProductSelection}
                                >
                                    Verify & Select Products
                                </button>
                            )}
                            
                            {selected.orderType === 'prescription' && selected.status === 'pending' && selected.orderList && selected.orderList.length > 0 && (
                                <div className="text-center text-gray-600">
                                    <p className="mb-2">Waiting for customer confirmation...</p>
                                    <p className="text-sm">Products selected. Customer needs to confirm the order.</p>
                                </div>
                            )}
                            
                            {selected.orderType === 'product' && selected.status === 'pending' && (
                                <button 
                                    className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
                                    onClick={() => verifyOrder(selected._id)}
                                >
                                    Verify Order
                                </button>
                            )}
                            
                            {selected.status === 'approved' && (
                                <button 
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                    onClick={() => markAsProcessing(selected._id)}
                                >
                                    Mark as Processing
                                </button>
                            )}
                            
                            {selected.status === 'processing' && (
                                <button 
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                                    onClick={confirmPrep}
                                >
                                    {selected.deliveryType === 'pickup' ? 'Mark Ready for Pickup' : 'Mark Ready for Delivery'}
                                </button>
                            )}
                            
                            <button 
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                                onClick={() => updateStatus(selected._id, { status: 'canceled' })}
                            >
                                Cancel Order
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Product Selection Modal */}
            {showProductSelection && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                    <div className="bg-white w-full max-w-6xl max-h-[90vh] overflow-y-auto rounded-xl shadow-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">
                                Select Products for Prescription Order
                            </h3>
                            <button
                                onClick={closeProductSelection}
                                className="text-gray-500 hover:text-gray-700 text-xl"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Available Products */}
                            <div>
                                <div className="flex justify-between items-center mb-3">
                                    <h4 className="font-semibold">Available Products</h4>
                                    <span className="text-sm text-gray-500">
                                        {filteredProducts.length} products
                                    </span>
                                </div>
                                
                                {/* Search Bar */}
                                <div className="mb-4">
                                    <input
                                        type="text"
                                        placeholder="Search products by name, description, or category..."
                                        value={searchTerm}
                                        onChange={(e) => handleSearch(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                    />
                                </div>

                                    {loadingProducts ? (
                                    <div className="text-center py-4">Loading products...</div>
                                ) : (
                                    <div className="space-y-2 max-h-96 overflow-y-auto">
                                        {filteredProducts.length === 0 ? (
                                            <div className="text-center py-4 text-gray-500">
                                                {searchTerm ? 'No products found matching your search' : 'No products available'}
                                            </div>
                                        ) : (
                                            filteredProducts.map(product => (
                                                <div key={product._id} className="border rounded-lg p-3 hover:bg-gray-50">
                                                    <div className="flex justify-between items-start">
                                                    <div className="flex-1">
                                                            <h5 className="font-medium">{product.name}</h5>
                                                        <p className="text-sm text-gray-600">{product.description}</p>
                                                            <div className="flex items-center gap-4 mt-1">
                                                                <p className="text-sm font-semibold text-green-600">
                                                                    Rs.{Number(product.price).toFixed(2)}
                                                                </p>
                                                                <p className={`text-xs px-2 py-1 rounded-full ${
                                                                    (product.stock || 0) > 0 
                                                                        ? 'bg-green-100 text-green-800' 
                                                                        : 'bg-red-100 text-red-800'
                                                                }`}>
                                                                    Stock: {product.stock || 0} units
                                                                </p>
                                                            </div>
                                                    </div>
                                                    <button
                                                            onClick={() => addProductToSelection(product)}
                                                            disabled={(product.stock || 0) <= 0}
                                                            className={`ml-2 px-3 py-1 rounded text-xs ${
                                                                (product.stock || 0) > 0
                                                                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                                                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                            }`}
                                                        >
                                                            {(product.stock || 0) > 0 ? 'Add' : 'Out of Stock'}
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                                )}
                            </div>

                            {/* Selected Products */}
                            <div>
                                <h4 className="font-semibold mb-3">Selected Products</h4>
                                {selectedProducts.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500">
                                        No products selected
                                    </div>
                                ) : (
                                    <div className="space-y-2 max-h-96 overflow-y-auto">
                                        {selectedProducts.map(product => (
                                            <div key={product.productId} className="border rounded-lg p-3 bg-gray-50">
                                                <div className="flex justify-between items-center">
                                                    <div className="flex-1">
                                                        <h5 className="font-medium">{product.name}</h5>
                                                        <p className="text-sm text-gray-600">
                                                            Rs.{Number(product.price).toFixed(2)} each
                                                        </p>
                                                        <p className="text-xs text-gray-500 mt-1">
                                                            Stock: {product.stockQuantity || 0} units
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => updateProductQuantity(product.productId, product.quantity - 1)}
                                                            className="w-6 h-6 bg-gray-300 text-gray-700 rounded flex items-center justify-center text-sm"
                                                        >
                                                            -
                                                        </button>
                                                        <span className="w-8 text-center">{product.quantity}</span>
                                                        <button
                                                            onClick={() => updateProductQuantity(product.productId, product.quantity + 1)}
                                                            disabled={product.quantity >= (product.stockQuantity || 0)}
                                                            className={`w-6 h-6 rounded flex items-center justify-center text-sm ${
                                                                product.quantity >= (product.stockQuantity || 0)
                                                                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                                                    : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                                                            }`}
                                                        >
                                                            +
                                                        </button>
                                                        <button
                                                            onClick={() => removeProductFromSelection(product.productId)}
                                                            className="ml-2 px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                                                        >
                                                            Remove
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="mt-2 text-right">
                                                    <span className="font-semibold">
                                                        Total: Rs.{Number(product.lineTotal).toFixed(2)}
                                            </span>
                                        </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Total and Actions */}
                                {selectedProducts.length > 0 && (
                                    <div className="mt-4 border-t pt-4">
                                        <div className="flex justify-between items-center mb-4">
                                            <span className="text-lg font-semibold">Total Amount:</span>
                                            <span className="text-xl font-bold text-green-600">
                                                Rs.{selectedProducts.reduce((sum, p) => sum + p.lineTotal, 0).toFixed(2)}
                                            </span>
                                        </div>
                                        <div className="flex gap-3">
                                    <button
                                                onClick={closeProductSelection}
                                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                                onClick={sendProductListToCustomer}
                                                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                                            >
                                                Send to Customer
                                    </button>
                                </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

import React, { useEffect, useState } from 'react'
import DashboardLayout from '../../layouts/DashboardLayout'
import './PharmacistDashboard.css'
import { useAuth } from '../../context/AuthContext'

const PharmacistDashboard = () => {
	const [activeSection, setActiveSection] = useState('overview')
	const [pendingOrdersCount, setPendingOrdersCount] = useState(0)
	const [recentOrders, setRecentOrders] = useState([])

	const { token } = useAuth()

	const sidebar = [
		{ id: 'overview', label: 'Overview', icon: '🏠' },
		{ id: 'orders', label: 'Orders', icon: '📦' },
		{ id: 'inventory', label: 'Inventory', icon: '📋' },
		{ id: 'prescriptions', label: 'Prescriptions', icon: '💊' },
		{ id: 'reports', label: 'Reports', icon: '📊' },
		{ id: 'messages', label: 'Messages', icon: '💬' },
	]

	// Fetch orders data
	useEffect(() => {
		const fetchOrders = async () => {
			try {
				const res = await fetch('http://localhost:5001/api/orders', {
					headers: { 'Authorization': `Bearer ${token}` }
				})
				const data = await res.json()
				if (res.ok) {
					const pending = data.filter(order => order.status === 'pending').length
					setPendingOrdersCount(pending)
					// Get 3 most recent orders
					setRecentOrders(data.slice(0, 3))
				}
			} catch (error) {
				console.error('Error fetching orders:', error)
			}
		}
		if (token) fetchOrders()
	}, [token])

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
								<p className="stat-number">7</p>
								<span className="stat-change negative">+2 from yesterday</span>
							</div>
							<div className="stat-card">
								<div className="stat-icon">✅</div>
								<h3>Processed Today</h3>
								<p className="stat-number">24</p>
								<span className="stat-change positive">+3 from yesterday</span>
							</div>
							<div className="stat-card">
								<div className="stat-icon">💊</div>
								<h3>Prescriptions</h3>
								<p className="stat-number">15</p>
								<span className="stat-change positive">+2 from yesterday</span>
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
									onClick={() => setActiveSection('prescriptions')}
								>
									<span className="action-icon">💊</span>
									Fill Prescription
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
								<div className="alert-item high">
									<div className="alert-icon">🔴</div>
									<div className="alert-content">
										<div className="alert-title">Paracetamol 500mg</div>
										<div className="alert-details">Only 15 tablets remaining</div>
									</div>
									<button className="alert-action">Reorder</button>
								</div>
								<div className="alert-item medium">
									<div className="alert-icon">🟡</div>
									<div className="alert-content">
										<div className="alert-title">Ibuprofen 400mg</div>
										<div className="alert-details">Only 25 tablets remaining</div>
									</div>
									<button className="alert-action">Reorder</button>
								</div>
								<div className="alert-item low">
									<div className="alert-icon">🟢</div>
									<div className="alert-content">
										<div className="alert-title">Vitamin C 1000mg</div>
										<div className="alert-details">Only 30 tablets remaining</div>
									</div>
									<button className="alert-action">Reorder</button>
								</div>
							</div>
						</div>

						{/* Performance Summary */}
						<div className="performance-summary">
							<h2>Today's Performance</h2>
							<div className="performance-metrics">
								<div className="metric">
									<span className="metric-label">Orders Processed</span>
									<span className="metric-value">24</span>
								</div>
								<div className="metric">
									<span className="metric-label">Customer Satisfaction</span>
									<span className="metric-value">4.9/5</span>
								</div>
								<div className="metric">
									<span className="metric-label">Prescriptions Filled</span>
									<span className="metric-value">15</span>
								</div>
								<div className="metric">
									<span className="metric-label">Revenue Generated</span>
									<span className="metric-value">$1,245.80</span>
								</div>
							</div>
						</div>
					</div>
				);

            case 'orders':
                return <OrdersSection />;

            case 'inventory':
                return <InventorySection />;

			case 'prescriptions':
				return <PrescriptionsSection />;

			case 'reports':
				return (
					<div className="reports-section">
						<h2>Reports & Analytics</h2>
						<p>Reports and analytics features coming soon...</p>
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
			title="Pharmacist Dashboard" 
			sidebarItems={sidebar}
			onSectionChange={setActiveSection}
			activeSection={activeSection}
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
    const [editing, setEditing] = useState(null);

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
        const method = editing ? 'PUT' : 'POST';
        const url = editing ? `http://localhost:5001/api/products/${editing._id}` : 'http://localhost:5001/api/products';
        const res = await fetch(url, { method, headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
        const data = await res.json();
        if (res.ok) {
            setShowForm(false);
            setEditing(null);
            setForm(emptyForm);
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
                                <input type="date" className="mt-1 w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-0 focus:border-gray-400" value={form.expiryDate} onChange={e => setForm({ ...form, expiryDate: e.target.value })} />
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
                                <input type="number" min="0" step="0.01" className="mt-1 w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-0 focus:border-gray-400" value={form.price} onChange={e => setForm({ ...form, price: Number(e.target.value) })} />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-600">Quantity</label>
                                <input type="number" min="0" className="mt-1 w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-0 focus:border-gray-400" value={form.stock} onChange={e => setForm({ ...form, stock: Number(e.target.value) })} />
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

    const load = async () => {
        try {
            const res = await fetch('http://localhost:5001/api/orders', { headers: { 'Authorization': `Bearer ${token}` } });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed to load orders');
            setOrders(data);
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); /* eslint-disable-next-line */ }, [token]);

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
                                <th className="p-3">Date/Time</th>
                                <th className="p-3">Customer Name</th>
                                <th className="p-3">Contact</th>
                                <th className="p-3">Delivery Address</th>
                                <th className="p-3">Payment Method</th>
                                <th className="p-3">Status</th>
                                <th className="p-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredOrders.map(o => (
                                <tr key={o._id} className="border-t hover:bg-gray-50">
                                    <td className="p-3 font-mono text-blue-600">#{o._id.slice(-8)}</td>
                                    <td className="p-3">
                                        <div className="text-sm">{new Date(o.createdAt).toLocaleDateString()}</div>
                                        <div className="text-xs text-gray-500">{new Date(o.createdAt).toLocaleTimeString()}</div>
                                    </td>
                                    <td className="p-3 font-medium">{o.customer?.name}</td>
                                    <td className="p-3">{o.customer?.phone}</td>
                                    <td className="p-3">
                                        {o.deliveryType === 'home_delivery' ? (
                                            <div className="text-sm max-w-xs truncate" title={o.customer?.address}>
                                                {o.customer?.address}
                                            </div>
                                        ) : (
                                            <span className="text-gray-500">Pickup</span>
                                        )}
                                    </td>
                                    <td className="p-3">
                                        <span className={`px-2 py-1 rounded-full text-xs ${
                                            o.paymentMethod === 'cod' 
                                                ? 'bg-orange-100 text-orange-800' 
                                                : 'bg-green-100 text-green-800'
                                        }`}>
                                            {o.paymentMethod === 'cod' ? 'COD' : 'Online'}
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
                                    <td className="p-3 whitespace-nowrap">
                                        <button 
                                            className="btn-outline mr-2 px-3 py-1 text-xs" 
                                            onClick={() => openDetails(o)}
                                        >
                                            View Details
                                        </button>
                                        {o.status === 'pending' && (
                                            <button 
                                                className="btn-primary mr-2 px-3 py-1 text-xs" 
                                                onClick={() => verifyOrder(o._id)}
                                            >
                                                Verify
                                            </button>
                                        )}
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
                                    <div><span className="text-gray-600">Address:</span> {selected.customer?.address}</div>
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

                        {/* Product List */}
                        <div className="mb-6">
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
                                                <th className="p-3">Prescription</th>
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
                                                    <td className="p-3">
                                                        {it.prescriptionRequired ? (
                                                            <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">Required</span>
                                                        ) : (
                                                            <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">OTC</span>
                                                        )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
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
                            {selected.status === 'pending' && (
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
        </div>
    );
}

// Prescriptions Section Component
function PrescriptionsSection() {
    const { token } = useAuth();
    const [prescriptions, setPrescriptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState('all');
    const [selectedPrescription, setSelectedPrescription] = useState(null);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectForm, setRejectForm] = useState({
        pharmacistNotes: ''
    });
    const [showOrderListModal, setShowOrderListModal] = useState(false);
    const [products, setProducts] = useState([]);
    const [orderList, setOrderList] = useState([]);
    const [productSearch, setProductSearch] = useState('');
    const [loadingProducts, setLoadingProducts] = useState(false);

    useEffect(() => {
        if (token) {
            fetchPrescriptions();
        }
    }, [token, filter]);

    const fetchPrescriptions = async () => {
        try {
            setLoading(true);
            const url = filter === 'all' 
                ? 'http://localhost:5001/api/prescriptions/admin/all'
                : `http://localhost:5001/api/prescriptions/admin/all?status=${filter}`;
            
            const res = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            
            if (res.ok) {
                setPrescriptions(data);
            } else {
                setError(data.message || 'Failed to fetch prescriptions');
            }
        } catch (error) {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };


    const handleVerifyPrescription = (prescription) => {
        setSelectedPrescription(prescription);
        setOrderList([]);
        setShowOrderListModal(true);
        fetchProducts();
    };

    const handleRejectPrescription = (prescription) => {
        setSelectedPrescription(prescription);
        setRejectForm({
            pharmacistNotes: ''
        });
        setShowRejectModal(true);
    };


    const rejectPrescription = async () => {
        if (!selectedPrescription) return;

        try {
            const res = await fetch(`http://localhost:5001/api/prescriptions/${selectedPrescription._id}/status`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    status: 'rejected',
                    pharmacistNotes: rejectForm.pharmacistNotes
                })
            });

            const data = await res.json();
            if (res.ok) {
                setShowRejectModal(false);
                setSelectedPrescription(null);
                fetchPrescriptions();
            } else {
                setError(data.message || 'Failed to reject prescription');
            }
        } catch (error) {
            setError('Network error. Please try again.');
        }
    };

    const openOrderListModal = async () => {
        setShowOrderListModal(true);
        await fetchProducts();
    };

    const fetchProducts = async () => {
        setLoadingProducts(true);
        try {
            const res = await fetch(`http://localhost:5001/api/prescriptions/products?search=${productSearch}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                setProducts(data);
            } else {
                setError(data.message || 'Failed to fetch products');
            }
        } catch (error) {
            setError('Network error. Please try again.');
        } finally {
            setLoadingProducts(false);
        }
    };

    const addToOrderList = (product) => {
        const existingItem = orderList.find(item => item.productId === product._id);
        if (existingItem) {
            setOrderList(orderList.map(item => 
                item.productId === product._id 
                    ? { ...item, quantity: item.quantity + 1, totalPrice: (item.quantity + 1) * item.unitPrice }
                    : item
            ));
        } else {
            setOrderList([...orderList, {
                productId: product._id,
                productName: product.name,
                quantity: 1,
                unitPrice: product.price,
                totalPrice: product.price
            }]);
        }
    };

    const updateOrderItemQuantity = (productId, quantity) => {
        if (quantity <= 0) {
            setOrderList(orderList.filter(item => item.productId !== productId));
        } else {
            setOrderList(orderList.map(item => 
                item.productId === productId 
                    ? { ...item, quantity, totalPrice: quantity * item.unitPrice }
                    : item
            ));
        }
    };

    const removeFromOrderList = (productId) => {
        setOrderList(orderList.filter(item => item.productId !== productId));
    };

    const sendOrderList = async () => {
        if (!selectedPrescription || orderList.length === 0) return;

        try {
            const res = await fetch(`http://localhost:5001/api/prescriptions/${selectedPrescription._id}/order-list`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ orderList })
            });

            const data = await res.json();
            if (res.ok) {
                setShowOrderListModal(false);
                setOrderList([]);
                setSelectedPrescription(null);
                fetchPrescriptions();
            } else {
                setError(data.message || 'Failed to send order list');
            }
        } catch (error) {
            setError('Network error. Please try again.');
        }
    };

    const updatePrescriptionWorkflow = async (prescriptionId, newStatus) => {
        try {
            const res = await fetch(`http://localhost:5001/api/prescriptions/${prescriptionId}/workflow`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: newStatus })
            });

            const data = await res.json();
            if (res.ok) {
                fetchPrescriptions();
            } else {
                setError(data.message || 'Failed to update prescription status');
            }
        } catch (error) {
            setError('Network error. Please try again.');
        }
    };

    const downloadPrescriptionFile = async (prescriptionId) => {
        try {
            const res = await fetch(`http://localhost:5001/api/prescriptions/${prescriptionId}/download`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `prescription-${prescriptionId}.pdf`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            } else {
                setError('Failed to download prescription file');
            }
        } catch (error) {
            setError('Network error. Please try again.');
        }
    };

    const previewPrescriptionFile = async (prescriptionId, fileName) => {
        try {
            const res = await fetch(`http://localhost:5001/api/prescriptions/${prescriptionId}/download`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                
                // Check file type for proper preview
                const fileExtension = fileName ? fileName.split('.').pop().toLowerCase() : 'unknown';
                
                if (fileExtension === 'pdf') {
                    // For PDFs, open in new tab
                    window.open(url, '_blank');
                } else if (['jpg', 'jpeg', 'png', 'gif'].includes(fileExtension)) {
                    // For images, open in new tab
                    window.open(url, '_blank');
                } else {
                    // For other file types, try to open in new tab
                    window.open(url, '_blank');
                }
                
                // Clean up the URL after a delay to allow the browser to load it
                setTimeout(() => {
                    window.URL.revokeObjectURL(url);
                }, 10000);
            } else {
                const errorData = await res.json();
                setError(`Failed to preview prescription file: ${errorData.message || 'Unknown error'}`);
            }
        } catch (error) {
            setError(`Network error: ${error.message}`);
        }
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            'uploaded': { color: 'bg-blue-100 text-blue-800', text: 'Uploaded' },
            'under_review': { color: 'bg-yellow-100 text-yellow-800', text: 'Under Review' },
            'verified': { color: 'bg-green-100 text-green-800', text: 'Verified' },
            'order_list_sent': { color: 'bg-purple-100 text-purple-800', text: 'Order List Sent' },
            'approved': { color: 'bg-green-100 text-green-800', text: 'Approved' },
            'preparing': { color: 'bg-purple-100 text-purple-800', text: 'Preparing' },
            'ready_for_delivery': { color: 'bg-orange-100 text-orange-800', text: 'Ready for Delivery' },
            'delivered': { color: 'bg-green-100 text-green-800', text: 'Delivered' },
            'rejected': { color: 'bg-red-100 text-red-800', text: 'Rejected' },
            'cancelled': { color: 'bg-red-100 text-red-800', text: 'Cancelled' }
        };
        
        const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800', text: status };
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
                {config.text}
            </span>
        );
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="prescriptions-section">
            <div className="flex items-center justify-between mb-6">
                <h2>Prescription Management</h2>
                <button 
                    onClick={fetchPrescriptions}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                    Refresh
                </button>
            </div>

            {/* Filter Buttons */}
            <div className="mb-6">
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            filter === 'all' 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                        }`}
                    >
                        All Prescriptions
                    </button>
                    <button
                        onClick={() => setFilter('approved')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            filter === 'approved' 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                        }`}
                    >
                        Approved
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
                        <div className="text-gray-500">Loading prescriptions...</div>
                    </div>
                ) : (
                    <>
                        {prescriptions.length === 0 ? (
                            <div className="p-8 text-center">
                                <div className="text-gray-500">No prescriptions found</div>
                            </div>
                        ) : (
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-left text-gray-600 bg-gray-50">
                                        <th className="p-4">Prescription #</th>
                                        <th className="p-4">Customer Info</th>
                                        <th className="p-4">Prescription File</th>
                                        <th className="p-4">Status</th>
                                        <th className="p-4">Amount</th>
                                        <th className="p-4">Notes</th>
                                        <th className="p-4">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {prescriptions.map((prescription) => (
                                        <tr key={prescription._id} className="border-t hover:bg-gray-50">
                                            <td className="p-4">
                                                <div className="font-mono text-blue-600">
                                                    {prescription.prescriptionNumber}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {formatDate(prescription.createdAt)}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="font-medium">{prescription.patientName}</div>
                                                <div className="text-sm text-gray-600">{prescription.phone}</div>
                                                <div className="text-xs text-gray-500 max-w-xs truncate" title={prescription.address}>
                                                    {prescription.address}
                                                </div>
                                                {prescription.user && (
                                                    <div className="text-xs text-gray-500 mt-1">
                                                        User: {prescription.user.firstName} {prescription.user.lastName}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="p-4">
                                                <div className="text-sm text-gray-600 mb-2">
                                                    {prescription.originalFileName}
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => downloadPrescriptionFile(prescription._id)}
                                                        className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                                                    >
                                                        Download
                                                    </button>
                                                    <button
                                                        onClick={() => previewPrescriptionFile(prescription._id, prescription.originalFileName)}
                                                        className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                                                    >
                                                        Preview
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                {getStatusBadge(prescription.status)}
                                            </td>
                                            <td className="p-4">
                                                {prescription.totalAmount > 0 ? (
                                                    <div className="font-medium text-green-600">
                                                        Rs. {prescription.totalAmount.toFixed(2)}
                                                    </div>
                                                ) : (
                                                    <div className="text-gray-500">Not calculated</div>
                                                )}
                                            </td>
                                            <td className="p-4">
                                                <div className="max-w-xs">
                                                    {prescription.notes && (
                                                        <div className="text-sm text-gray-600 mb-1">
                                                            <span className="font-medium">Customer:</span> {prescription.notes}
                                                        </div>
                                                    )}
                                                    {prescription.pharmacistNotes && (
                                                        <div className="text-sm text-blue-600">
                                                            <span className="font-medium">Pharmacist:</span> {prescription.pharmacistNotes}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex gap-2">
                                                    {prescription.status === 'uploaded' && (
                                                        <>
                                                            <button
                                                                onClick={() => handleVerifyPrescription(prescription)}
                                                                className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                                                            >
                                                                Verify
                                                            </button>
                                                            <button
                                                                onClick={() => handleRejectPrescription(prescription)}
                                                                className="px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                                                            >
                                                                Reject
                                                            </button>
                                                        </>
                                                    )}
                                                    
                                                    {prescription.status === 'approved' && (
                                                        <button
                                                            onClick={() => updatePrescriptionWorkflow(prescription._id, 'preparing')}
                                                            className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                                                        >
                                                            Start Processing
                                                        </button>
                                                    )}
                                                    
                                                    {prescription.status === 'preparing' && (
                                                        <button
                                                            onClick={() => updatePrescriptionWorkflow(prescription._id, 'ready_for_delivery')}
                                                            className="px-3 py-1 bg-orange-600 text-white rounded text-xs hover:bg-orange-700"
                                                        >
                                                            Ready for Delivery
                                                        </button>
                                                    )}
                                                    
                                                    {prescription.status === 'ready_for_delivery' && (
                                                        <button
                                                            onClick={() => updatePrescriptionWorkflow(prescription._id, 'delivered')}
                                                            className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                                                        >
                                                            Mark as Delivered
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </>
                )}
            </div>



            {/* Reject Prescription Modal */}
            {showRejectModal && selectedPrescription && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                    <div className="bg-white w-full max-w-md rounded-xl shadow-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-red-600">
                                Reject Prescription
                            </h3>
                            <button
                                onClick={() => setShowRejectModal(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="mb-4">
                            <div className="text-sm text-gray-600 mb-2">
                                Prescription: {selectedPrescription.prescriptionNumber}
                            </div>
                            <div className="text-sm text-gray-600 mb-2">
                                Patient: {selectedPrescription.patientName}
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Rejection Reason *
                            </label>
                            <textarea
                                value={rejectForm.pharmacistNotes}
                                onChange={(e) => setRejectForm({ ...rejectForm, pharmacistNotes: e.target.value })}
                                rows={4}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                                placeholder="Please provide a detailed reason for rejecting this prescription..."
                                required
                            />
                            {!rejectForm.pharmacistNotes && (
                                <p className="text-red-500 text-xs mt-1">Rejection reason is required</p>
                            )}
                        </div>

                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <div className="flex items-center">
                                <span className="text-red-500 mr-2">⚠️</span>
                                <span className="text-red-700 text-sm">
                                    This action will reject the prescription order. The customer will be notified with the rejection reason.
                                </span>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowRejectModal(false)}
                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={rejectPrescription}
                                disabled={!rejectForm.pharmacistNotes.trim()}
                                className={`px-4 py-2 rounded-lg ${
                                    rejectForm.pharmacistNotes.trim() 
                                        ? 'bg-red-600 text-white hover:bg-red-700' 
                                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                }`}
                            >
                                Reject Prescription
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Order List Modal */}
            {showOrderListModal && selectedPrescription && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                    <div className="bg-white w-full max-w-6xl rounded-xl shadow-lg p-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-green-600">
                                Create Order List for Prescription #{selectedPrescription.prescriptionNumber}
                            </h3>
                            <button
                                onClick={() => setShowOrderListModal(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Product Selection */}
                            <div>
                                <h4 className="text-md font-semibold mb-3">Available Products</h4>
                                
                                {/* Product Dropdown */}
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Quick Select Product
                                    </label>
                                    <select
                                        onChange={(e) => {
                                            const productId = e.target.value;
                                            if (productId) {
                                                const product = products.find(p => p._id === productId);
                                                if (product) addToOrderList(product);
                                                e.target.value = ''; // Reset selection
                                            }
                                        }}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                    >
                                        <option value="">Choose a product to add...</option>
                                        {products.map(product => (
                                            <option key={product._id} value={product._id}>
                                                {product.name} - Rs. {product.price} (Stock: {product.stock})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                
                                {/* Search */}
                                <div className="mb-4">
                                    <input
                                        type="text"
                                        placeholder="Search products..."
                                        value={productSearch}
                                        onChange={(e) => setProductSearch(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && fetchProducts()}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                    />
                                    <button
                                        onClick={fetchProducts}
                                        className="mt-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                                    >
                                        Search Products
                                    </button>
                                </div>

                                {/* Products List */}
                                <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
                                    {loadingProducts ? (
                                        <div className="p-4 text-center">Loading products...</div>
                                    ) : (
                                        products.map(product => (
                                            <div key={product._id} className="p-3 border-b border-gray-100 hover:bg-gray-50">
                                                <div className="flex justify-between items-center">
                                                    <div className="flex-1">
                                                        <h5 className="font-medium text-gray-900">{product.name}</h5>
                                                        <p className="text-sm text-gray-600">{product.description}</p>
                                                        <p className="text-sm text-green-600 font-medium">Rs. {product.price}</p>
                                                        <p className="text-xs text-gray-500">Stock: {product.stock}</p>
                                                    </div>
                                                    <button
                                                        onClick={() => addToOrderList(product)}
                                                        className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                                                    >
                                                        Add
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Order List */}
                            <div>
                                <h4 className="text-md font-semibold mb-3">Order List</h4>
                                
                                <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
                                    {orderList.length === 0 ? (
                                        <div className="p-4 text-center text-gray-500">No items in order list</div>
                                    ) : (
                                        orderList.map((item, index) => (
                                            <div key={index} className="p-3 border-b border-gray-100">
                                                <div className="flex justify-between items-center">
                                                    <div className="flex-1">
                                                        <h5 className="font-medium text-gray-900">{item.productName}</h5>
                                                        <p className="text-sm text-gray-600">Rs. {item.unitPrice} each</p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => updateOrderItemQuantity(item.productId, item.quantity - 1)}
                                                            className="w-6 h-6 bg-gray-200 text-gray-600 rounded hover:bg-gray-300"
                                                        >
                                                            -
                                                        </button>
                                                        <span className="w-8 text-center">{item.quantity}</span>
                                                        <button
                                                            onClick={() => updateOrderItemQuantity(item.productId, item.quantity + 1)}
                                                            className="w-6 h-6 bg-gray-200 text-gray-600 rounded hover:bg-gray-300"
                                                        >
                                                            +
                                                        </button>
                                                        <span className="w-16 text-right font-medium">Rs. {item.totalPrice.toFixed(2)}</span>
                                                        <button
                                                            onClick={() => removeFromOrderList(item.productId)}
                                                            className="w-6 h-6 bg-red-200 text-red-600 rounded hover:bg-red-300"
                                                        >
                                                            ×
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>

                                {/* Total */}
                                {orderList.length > 0 && (
                                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                                        <div className="flex justify-between items-center">
                                            <span className="font-semibold text-green-800">Total Amount:</span>
                                            <span className="text-lg font-bold text-green-800">
                                                Rs. {orderList.reduce((sum, item) => sum + item.totalPrice, 0).toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="flex justify-end gap-3 mt-4">
                                    <button
                                        onClick={() => setShowOrderListModal(false)}
                                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={sendOrderList}
                                        disabled={orderList.length === 0}
                                        className={`px-4 py-2 rounded-lg ${
                                            orderList.length > 0 
                                                ? 'bg-green-600 text-white hover:bg-green-700' 
                                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                        }`}
                                    >
                                        Send Order List to Customer
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
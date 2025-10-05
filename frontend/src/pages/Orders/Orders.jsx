import React, { useEffect, useMemo, useState } from 'react'
import Navbar from '../../components/Navbar/Navbar'
import Footer from '../../components/Footer/Footer'
import { useAuth } from '../../context/AuthContext'
import jsPDF from 'jspdf'

const Orders = () => {
  const { user, token } = useAuth()
  const [orders, setOrders] = useState([])
  const [prescriptions, setPrescriptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [showOrderModal, setShowOrderModal] = useState(false)

  useEffect(() => {
    if (user && token) {
      fetchAllOrders()
    }
  }, [user, token])

  const fetchAllOrders = async () => {
    try {
      setLoading(true)
      setError('')
      
      // Fetch both product orders and prescription orders
      const [ordersRes, prescriptionsRes] = await Promise.all([
        fetch('http://localhost:5001/api/orders/mine', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('http://localhost:5001/api/prescriptions/customer/orders', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ])

      const ordersData = await ordersRes.json()
      const prescriptionsData = await prescriptionsRes.json()

      if (!ordersRes.ok) {
        throw new Error(ordersData?.message || 'Failed to load product orders')
      }
      if (!prescriptionsRes.ok) {
        throw new Error(prescriptionsData?.message || 'Failed to load prescription orders')
      }

      setOrders(ordersData || [])
      setPrescriptions(prescriptionsData || [])
    } catch (err) {
      setError(err.message)
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Process orders for display
  const allOrders = useMemo(() => {
    const productOrders = orders.map(order => ({
      ...order,
      type: 'product',
      orderNumber: order._id,
      date: order.createdAt,
      status: order.status,
      total: order.total,
      items: order.items
    }))

    const prescriptionOrders = prescriptions.map(prescription => ({
      ...prescription,
      type: 'prescription',
      orderNumber: prescription.prescriptionDetails?.prescriptionNumber || prescription._id,
      date: prescription.createdAt,
      status: prescription.status,
      total: prescription.total || 0,
      items: prescription.orderList || []
    }))

    return [...productOrders, ...prescriptionOrders].sort((a, b) => new Date(b.date) - new Date(a.date))
  }, [orders, prescriptions])

  const totalOrders = useMemo(() => allOrders.length, [allOrders])

  const openOrderDetails = (order) => {
    setSelectedOrder(order)
    setShowOrderModal(true)
  }

  const closeOrderDetails = () => {
    setSelectedOrder(null)
    setShowOrderModal(false)
  }

  const confirmOrder = async (action) => {
    if (!selectedOrder) return;

    try {
      const res = await fetch(`http://localhost:5001/api/prescriptions/${selectedOrder._id}/confirm`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action })
      });

      const data = await res.json();
      if (res.ok) {
        // Refresh orders after confirmation
        await fetchAllOrders();
        setShowOrderModal(false);
        setSelectedOrder(null);
        alert(data.message);
      } else {
        alert(data.message || 'Failed to process confirmation');
      }
    } catch (error) {
      alert('Network error. Please try again.');
    }
  }

  const deleteOrder = async (orderId) => {
    if (!confirm('Are you sure you want to delete this order? This action cannot be undone and the stock will be restored.')) {
      return;
    }

    try {
      const res = await fetch(`http://localhost:5001/api/orders/${orderId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await res.json();
      if (res.ok) {
        // Refresh orders after deletion
        await fetchAllOrders();
        // Notify other components that stock has been updated
        window.dispatchEvent(new Event('order:placed'));
        alert(data.message || 'Order deleted successfully');
      } else {
        alert(data.message || 'Failed to delete order');
      }
    } catch (error) {
      alert('Network error. Please try again.');
    }
  }

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

  const generateInvoicePDF = (order) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(24);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(0, 100, 200);
    doc.text('MediCare Pharmacy', 20, 30);
    
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text('Your Trusted Healthcare Partner', 20, 40);
    
    // Invoice title
    doc.setFontSize(20);
    doc.setTextColor(0, 0, 0);
    doc.setFont(undefined, 'bold');
    doc.text('INVOICE', 20, 55);
    
    // Order details section
    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    doc.text(`Invoice #: ${order._id.slice(-8)}`, 20, 70);
    doc.text(`Date: ${formatDate(order.date)}`, 20, 80);
    doc.text(`Order Type: ${order.type === 'prescription' ? 'Prescription Order' : 'Product Order'}`, 20, 90);
    doc.text(`Status: ${order.status.charAt(0).toUpperCase() + order.status.slice(1).replace('_', ' ')}`, 20, 100);
    doc.text(`Payment: ${order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment'}`, 20, 110);
    doc.text(`Delivery: ${order.deliveryType === 'pickup' ? 'Store Pickup' : 'Home Delivery'}`, 20, 120);
    
    // Customer information
    doc.setFont(undefined, 'bold');
    doc.text('Bill To:', 20, 140);
    doc.setFont(undefined, 'normal');
    doc.text(`${order.customer?.name || order.prescriptionDetails?.patientName || 'N/A'}`, 20, 150);
    doc.text(`${order.customer?.phone || order.prescriptionDetails?.patientPhone || 'N/A'}`, 20, 160);
    doc.text(`${order.customer?.address || order.prescriptionDetails?.patientAddress || 'N/A'}`, 20, 170);
    
    // Products table
    const items = order.items || order.orderList || [];
    if (items.length > 0) {
      let yPosition = 190;
      
      // Table header
      doc.setFont(undefined, 'bold');
      doc.setFillColor(240, 240, 240);
      doc.rect(20, yPosition - 5, 170, 10, 'F');
      doc.text('Product Name', 25, yPosition);
      doc.text('Qty', 120, yPosition);
      doc.text('Unit Price', 140, yPosition);
      doc.text('Total', 170, yPosition);
      
      yPosition += 15;
      
      // Table content
      doc.setFont(undefined, 'normal');
      let subtotal = 0;
      
      items.forEach((item, index) => {
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 30;
        }
        
        const itemTotal = Number(item.lineTotal || item.totalPrice || (item.price || item.unitPrice || 0) * (item.quantity || 1));
        subtotal += itemTotal;
        
        doc.text(item.name || item.productName || 'N/A', 25, yPosition);
        doc.text(`${item.quantity || 1}`, 120, yPosition);
        doc.text(`Rs.${Number(item.price || item.unitPrice || 0).toFixed(2)}`, 140, yPosition);
        doc.text(`Rs.${itemTotal.toFixed(2)}`, 170, yPosition);
        yPosition += 10;
      });
      
      // Total section
      yPosition += 10;
      doc.setFont(undefined, 'bold');
      doc.text(`Subtotal: Rs.${subtotal.toFixed(2)}`, 140, yPosition);
      yPosition += 10;
      doc.text(`Total Amount: Rs.${Number(order.total || 0).toFixed(2)}`, 140, yPosition);
    }
    
    // Footer
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text('Thank you for choosing MediCare Pharmacy!', 20, 280);
    doc.text('For any queries, contact us at: support@medicare.com', 20, 290);
    doc.text('Generated on: ' + new Date().toLocaleString(), 20, 300);
    
    // Save the PDF
    doc.save(`invoice-${order._id.slice(-8)}.pdf`);
  };

  const getStatusBadge = (status, type) => {
    const statusConfig = {
      // Product order statuses
      'pending': { color: 'bg-yellow-100 text-yellow-800', text: 'Pending' },
      'approved': { color: 'bg-blue-100 text-blue-800', text: 'Approved' },
      'processing': { color: 'bg-purple-100 text-purple-800', text: 'Processing' },
      'ready': { color: 'bg-green-100 text-green-800', text: 'Ready' },
      'out_for_delivery': { color: 'bg-orange-100 text-orange-800', text: 'Out for Delivery' },
      'delivered': { color: 'bg-green-100 text-green-800', text: 'Delivered' },
      'completed': { color: 'bg-green-100 text-green-800', text: 'Completed' },
      'canceled': { color: 'bg-red-100 text-red-800', text: 'Canceled' },
      'failed': { color: 'bg-red-100 text-red-800', text: 'Failed' },
      
      // Prescription order statuses
      'uploaded': { color: 'bg-blue-100 text-blue-800', text: 'Prescription Uploaded' },
      'under_review': { color: 'bg-yellow-100 text-yellow-800', text: 'Under Review' },
      'verified': { color: 'bg-green-100 text-green-800', text: 'Verified' },
      'order_list_sent': { color: 'bg-purple-100 text-purple-800', text: 'Order List Sent' },
      'preparing': { color: 'bg-purple-100 text-purple-800', text: 'Preparing Medicines' },
      'ready_for_delivery': { color: 'bg-orange-100 text-orange-800', text: 'Ready for Delivery' },
      'rejected': { color: 'bg-red-100 text-red-800', text: 'Rejected' },
      'cancelled': { color: 'bg-red-100 text-red-800', text: 'Cancelled' }
    }
    
    const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800', text: status }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    )
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <section className="py-12 bg-gray-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">Loading orders...</div>
          </div>
        </section>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <section className="py-12 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
            <div className="text-gray-600">Total Orders: <span className="font-semibold">{totalOrders}</span></div>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          {allOrders.length === 0 ? (
            <div className="p-6 bg-white rounded-xl shadow text-center">
              <p className="text-gray-600">You have no orders yet.</p>
              <p className="text-sm text-gray-500 mt-2">Start by adding products to cart or uploading a prescription.</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-600 bg-gray-50">
                    <th className="p-4">Order ID</th>
                    <th className="p-4">Order Type</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Total</th>
                    <th className="p-4">Date</th>
                    <th className="p-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {allOrders.map((order) => (
                    <tr key={order._id} className="border-t hover:bg-gray-50">
                      <td className="p-4">
                        <div className="font-mono text-blue-600">
                          #{order._id.slice(-8)}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                          {order.orderType === 'prescription' ? 'Prescription Order' : 'Product Order'}
                        </span>
                      </td>
                      <td className="p-4">
                        {getStatusBadge(order.status, order.type)}
                      </td>
                      <td className="p-4 font-semibold">
                        Rs. {Number(order.total || 0).toFixed(2)}
                      </td>
                      <td className="p-4 text-gray-600">
                        {formatDate(order.date)}
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <button 
                            onClick={() => openOrderDetails(order)}
                            className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                          >
                            View Details
                          </button>
                          {order.status === 'pending' && (
                            <button 
                              onClick={() => deleteOrder(order._id)}
                              className="px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                              title="Delete order (only allowed for pending orders)"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* Order Details Modal */}
      {showOrderModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Order Details - #{selectedOrder._id.slice(-8)}
              </h3>
              <button
                onClick={closeOrderDetails}
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                ✕
              </button>
            </div>

            {/* Order Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-3">Customer Information</h4>
                <div className="space-y-2">
                  <div><span className="text-gray-600">Name:</span> {selectedOrder.customer?.name}</div>
                  <div><span className="text-gray-600">Phone:</span> {selectedOrder.customer?.phone}</div>
                  <div><span className="text-gray-600">Address:</span> {selectedOrder.type === 'prescription' ? selectedOrder.prescriptionDetails?.patientAddress : selectedOrder.customer?.address}</div>
                  {selectedOrder.customer?.notes && (
                    <div><span className="text-gray-600">Notes:</span> {selectedOrder.customer.notes}</div>
                  )}
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-3">Order Information</h4>
                <div className="space-y-2">
                  <div><span className="text-gray-600">Status:</span> {getStatusBadge(selectedOrder.status, selectedOrder.type)}</div>
                  <div><span className="text-gray-600">Payment:</span> {selectedOrder.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online'}</div>
                  <div><span className="text-gray-600">Delivery:</span> {selectedOrder.deliveryType === 'pickup' ? 'Pickup' : 'Home Delivery'}</div>
                  <div><span className="text-gray-600">Total:</span> Rs.{Number(selectedOrder.total || 0).toFixed(2)}</div>
                  <div><span className="text-gray-600">Date:</span> {formatDate(selectedOrder.date)}</div>
                </div>
              </div>
            </div>

            {/* Prescription Details */}
            {selectedOrder.type === 'prescription' && (
              <div className="mb-6">
                <h4 className="font-semibold mb-3">Prescription Details</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p><span className="font-medium">Prescription Number:</span> {selectedOrder.prescriptionDetails?.prescriptionNumber}</p>
                    </div>
                  </div>
                  {selectedOrder.prescriptionFile && (
                    <div className="mt-4">
                      <p className="font-medium mb-2">Prescription File:</p>
                      <a 
                        href={getPrescriptionFileUrl(selectedOrder.prescriptionFile)} 
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
            )}

            {/* Product List */}
            {((selectedOrder.items && selectedOrder.items.length > 0) || (selectedOrder.orderList && selectedOrder.orderList.length > 0)) && (
              <div className="mb-6">
                <h4 className="font-semibold mb-3">Product List</h4>
                <div className="bg-gray-50 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-600 bg-gray-100">
                        <th className="p-3">Product Name</th>
                        <th className="p-3">Quantity</th>
                        <th className="p-3">Unit Price</th>
                        <th className="p-3">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(selectedOrder.items || selectedOrder.orderList || []).map((item, idx) => (
                        <tr key={idx} className="border-t">
                          <td className="p-3 font-medium">{item.name || item.productName}</td>
                          <td className="p-3">{item.quantity}</td>
                          <td className="p-3">Rs.{Number(item.price || item.unitPrice || 0).toFixed(2)}</td>
                          <td className="p-3 font-semibold">Rs.{Number(item.lineTotal || item.totalPrice || (item.price || item.unitPrice || 0) * (item.quantity || 1)).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t bg-gray-100">
                        <td colSpan="3" className="p-3 font-semibold text-right">Total Amount:</td>
                        <td className="p-3 font-bold text-lg">Rs.{Number(selectedOrder.total || 0).toFixed(2)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => generateInvoicePDF(selectedOrder)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Generate Invoice PDF
              </button>
              {selectedOrder.type === 'prescription' && selectedOrder.status === 'pending' && selectedOrder.orderList && selectedOrder.orderList.length > 0 && (
                <>
                  <button
                    onClick={() => confirmOrder('reject')}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Reject Order
                  </button>
                  <button
                    onClick={() => confirmOrder('confirm')}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Confirm Order
                  </button>
                </>
              )}
              {selectedOrder.status === 'pending' && (
                <button
                  onClick={() => {
                    deleteOrder(selectedOrder._id);
                    closeOrderDetails();
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Delete Order
                </button>
              )}
              <button
                onClick={closeOrderDetails}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}

export default Orders



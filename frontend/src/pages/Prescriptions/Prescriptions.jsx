import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../../components/Navbar/Navbar'
import Footer from '../../components/Footer/Footer'
import { useAuth } from '../../context/AuthContext'

const Prescriptions = () => {
  const { user, token } = useAuth()
  const [prescriptions, setPrescriptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all')
  const [selectedPrescription, setSelectedPrescription] = useState(null)
  const [showOrderDetails, setShowOrderDetails] = useState(false)

  useEffect(() => {
    if (token) {
      fetchPrescriptions()
    }
  }, [token, filter])

  const fetchPrescriptions = async () => {
    try {
      setLoading(true)
      const url = filter === 'all' 
        ? 'http://localhost:5001/api/prescriptions/user'
        : `http://localhost:5001/api/prescriptions/user?status=${filter}`
      
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      
      if (res.ok) {
        setPrescriptions(data)
      } else {
        setError(data.message || 'Failed to fetch prescriptions')
      }
    } catch (error) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      'uploaded': { color: 'bg-blue-100 text-blue-800', text: 'Prescription Uploaded – Awaiting Review' },
      'under_review': { color: 'bg-yellow-100 text-yellow-800', text: 'Under Review' },
      'verified': { color: 'bg-green-100 text-green-800', text: 'Verified' },
      'order_list_sent': { color: 'bg-purple-100 text-purple-800', text: 'Order List Sent - Awaiting Confirmation' },
      'approved': { color: 'bg-green-100 text-green-800', text: 'Approved' },
      'preparing': { color: 'bg-purple-100 text-purple-800', text: 'Preparing Medicines' },
      'ready_for_delivery': { color: 'bg-orange-100 text-orange-800', text: 'Ready for Delivery' },
      'delivered': { color: 'bg-green-100 text-green-800', text: 'Delivered' },
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

  const confirmOrderList = async (prescriptionId) => {
    try {
      const res = await fetch(`http://localhost:5001/api/prescriptions/${prescriptionId}/confirm-order`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      const data = await res.json()
      if (res.ok) {
        fetchPrescriptions() // Refresh the list
        setShowOrderDetails(false)
        setSelectedPrescription(null)
      } else {
        setError(data.message || 'Failed to confirm order list')
      }
    } catch (error) {
      setError('Network error. Please try again.')
    }
  }

  const viewOrderDetails = (prescription) => {
    setSelectedPrescription(prescription)
    setShowOrderDetails(true)
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Please log in to view your prescriptions</h1>
          <Link to="/login" className="btn-primary">Sign In</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Prescriptions</h1>
          <p className="text-gray-600">Track your prescription orders and their status</p>
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
              onClick={() => setFilter('uploaded')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'uploaded' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              Awaiting Review
            </button>
            <button
              onClick={() => setFilter('under_review')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'under_review' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              Under Review
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
            <button
              onClick={() => setFilter('delivered')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'delivered' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              Delivered
            </button>
          </div>
        </div>

        {/* Upload New Prescription Button */}
        <div className="mb-6">
          <Link 
            to="/upload-prescription"
            className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <span>📄</span>
            Upload New Prescription
          </Link>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading prescriptions...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <span className="text-red-500 mr-2">⚠️</span>
              <span className="text-red-700">{error}</span>
            </div>
          </div>
        )}

        {/* Prescriptions List */}
        {!loading && !error && (
          <>
            {prescriptions.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl text-gray-400">📄</span>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No prescriptions found</h3>
                <p className="text-gray-600 mb-6">
                  {filter === 'all' 
                    ? "You haven't uploaded any prescriptions yet."
                    : `No prescriptions found with status: ${filter}`
                  }
                </p>
                <Link 
                  to="/upload-prescription"
                  className="btn-primary"
                >
                  Upload Your First Prescription
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {prescriptions.map((prescription) => (
                  <div key={prescription._id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {prescription.prescriptionNumber}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Patient: {prescription.patientName}
                        </p>
                        <p className="text-sm text-gray-500">
                          Created: {formatDate(prescription.createdAt)}
                        </p>
                      </div>
                      <div className="text-right">
                        {getStatusBadge(prescription.status)}
                        {prescription.totalAmount > 0 && (
                          <p className="text-sm font-medium text-gray-900 mt-2">
                            Rs. {prescription.totalAmount.toFixed(2)}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Phone:</span> {prescription.phone}
                        </p>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Address:</span> {prescription.address}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Payment:</span> {prescription.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online'}
                        </p>
                        {prescription.notes && (
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Notes:</span> {prescription.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    {prescription.pharmacistNotes && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                        <p className="text-sm text-blue-800">
                          <span className="font-medium">Pharmacist Notes:</span> {prescription.pharmacistNotes}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-500">
                        File: {prescription.originalFileName}
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => viewOrderDetails(prescription)}
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                          View Details
                        </button>
                        {prescription.status === 'order_list_sent' && (
                          <button 
                            onClick={() => confirmOrderList(prescription._id)}
                            className="text-green-600 hover:text-green-700 text-sm font-medium"
                          >
                            Confirm Order
                          </button>
                        )}
                        {prescription.status === 'uploaded' && (
                          <button className="text-red-600 hover:text-red-700 text-sm font-medium">
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Order Details Modal */}
      {showOrderDetails && selectedPrescription && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-4xl rounded-xl shadow-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Prescription Details - #{selectedPrescription.prescriptionNumber}
              </h3>
              <button
                onClick={() => setShowOrderDetails(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Prescription Info */}
              <div>
                <h4 className="text-md font-semibold mb-3">Prescription Information</h4>
                <div className="space-y-2">
                  <p><span className="font-medium">Patient:</span> {selectedPrescription.patientName}</p>
                  <p><span className="font-medium">Phone:</span> {selectedPrescription.patientPhone}</p>
                  <p><span className="font-medium">Address:</span> {selectedPrescription.patientAddress}</p>
                  <p><span className="font-medium">Status:</span> {getStatusBadge(selectedPrescription.status)}</p>
                  <p><span className="font-medium">Created:</span> {formatDate(selectedPrescription.createdAt)}</p>
                  {selectedPrescription.pharmacistNotes && (
                    <p><span className="font-medium">Pharmacist Notes:</span> {selectedPrescription.pharmacistNotes}</p>
                  )}
                </div>
              </div>

              {/* Order List */}
              {selectedPrescription.orderList && selectedPrescription.orderList.length > 0 && (
                <div>
                  <h4 className="text-md font-semibold mb-3">Order List</h4>
                  <div className="space-y-3">
                    {selectedPrescription.orderList.map((item, index) => (
                      <div key={index} className="p-3 border border-gray-200 rounded-lg">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h5 className="font-medium text-gray-900">{item.productName}</h5>
                            <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                            <p className="text-sm text-gray-600">Unit Price: Rs. {item.unitPrice}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-gray-900">Rs. {item.totalPrice.toFixed(2)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {/* Total */}
                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-green-800">Total Amount:</span>
                        <span className="text-lg font-bold text-green-800">
                          Rs. {selectedPrescription.orderList.reduce((sum, item) => sum + item.totalPrice, 0).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowOrderDetails(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
              {selectedPrescription.status === 'order_list_sent' && (
                <button
                  onClick={() => confirmOrderList(selectedPrescription._id)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Confirm Order List
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}

export default Prescriptions

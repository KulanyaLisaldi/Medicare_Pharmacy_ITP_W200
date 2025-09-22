import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar/Navbar'
import Footer from '../../components/Footer/Footer'
import { useAuth } from '../../context/AuthContext'

const UploadPrescription = () => {
  const { user, token } = useAuth()
  const navigate = useNavigate()
  
  const [formData, setFormData] = useState({
    patientName: user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : '',
    phone: user?.phone || '',
    address: user?.address || '',
    prescriptionFile: null,
    paymentMethod: 'cod',
    notes: ''
  })
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf']
      if (!allowedTypes.includes(file.type)) {
        setError('Please upload a valid image (JPEG, PNG, GIF) or PDF file')
        return
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB')
        return
      }
      
      setFormData(prev => ({
        ...prev,
        prescriptionFile: file
      }))
      setError('')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    
    if (!formData.patientName || !formData.phone || !formData.address || !formData.prescriptionFile) {
      setError('Please fill in all required fields and upload a prescription')
      return
    }

    setLoading(true)
    
    try {
      const formDataToSend = new FormData()
      formDataToSend.append('patientName', formData.patientName)
      formDataToSend.append('phone', formData.phone)
      formDataToSend.append('address', formData.address)
      formDataToSend.append('prescriptionFile', formData.prescriptionFile)
      formDataToSend.append('paymentMethod', formData.paymentMethod)
      formDataToSend.append('notes', formData.notes)

      const response = await fetch('http://localhost:5001/api/prescriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend
      })

      const data = await response.json()
      
      if (response.ok) {
        setSuccess('Prescription order placed successfully! You can view the status in your prescriptions section.')
        setFormData({
          patientName: user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : '',
          phone: user?.phone || '',
          address: user?.address || '',
          prescriptionFile: null,
          paymentMethod: 'cod',
          notes: ''
        })
        // Reset file input
        document.getElementById('prescriptionFile').value = ''
      } else {
        setError(data.message || 'Failed to upload prescription')
      }
    } catch (error) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    navigate('/login')
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">📄</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Upload Prescription</h1>
            <p className="text-gray-600">Upload your prescription and we'll prepare your medicines</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <span className="text-red-500 mr-2">⚠️</span>
                <span className="text-red-700">{error}</span>
              </div>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center">
                <span className="text-green-500 mr-2">✅</span>
                <span className="text-green-700">{success}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Patient Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Patient Information</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Patient Name *
                </label>
                <input
                  type="text"
                  name="patientName"
                  value={formData.patientName}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter patient name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter phone number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Delivery Address *
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  required
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter complete delivery address"
                />
              </div>
            </div>

            {/* Prescription Upload */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Prescription Upload</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Prescription *
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-green-400 transition-colors">
                  <input
                    type="file"
                    id="prescriptionFile"
                    name="prescriptionFile"
                    onChange={handleFileChange}
                    accept="image/*,.pdf"
                    required
                    className="hidden"
                  />
                  <label htmlFor="prescriptionFile" className="cursor-pointer">
                    <div className="space-y-2">
                      <div className="text-4xl text-gray-400">📄</div>
                      <div className="text-sm text-gray-600">
                        {formData.prescriptionFile ? (
                          <span className="text-green-600 font-medium">{formData.prescriptionFile.name}</span>
                        ) : (
                          <>
                            Click to upload prescription<br />
                            <span className="text-xs text-gray-500">Supports: JPG, PNG, GIF, PDF (Max 5MB)</span>
                          </>
                        )}
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Payment Method</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Choose Payment Method
                </label>
                <div className="space-y-2">
                  <label className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cod"
                      checked={formData.paymentMethod === 'cod'}
                      onChange={handleInputChange}
                      className="mr-3"
                    />
                    <div>
                      <div className="font-medium text-gray-900">Cash on Delivery (COD)</div>
                      <div className="text-sm text-gray-500">Pay when your order is delivered</div>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Additional Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Notes (Optional)
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Any special instructions or notes for the pharmacist..."
              />
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Placing Order...
                  </>
                ) : (
                  'Place Prescription Order'
                )}
              </button>
            </div>
          </form>

          {/* Information Box */}
          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start">
              <span className="text-blue-500 mr-2 mt-0.5">ℹ️</span>
              <div className="text-sm text-blue-700">
                <p className="font-medium mb-1">What happens next?</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Your prescription will be reviewed by our pharmacist</li>
                  <li>We'll prepare your medicines and calculate the total cost</li>
                  <li>You'll receive a confirmation with the order details</li>
                  <li>Your order will be delivered to the provided address</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}

export default UploadPrescription

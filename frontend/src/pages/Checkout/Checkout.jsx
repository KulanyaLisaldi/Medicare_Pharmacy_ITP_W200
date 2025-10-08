import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar/Navbar'
import Footer from '../../components/Footer/Footer'
import { useAuth } from '../../context/AuthContext'

const getCart = () => {
  try { return JSON.parse(localStorage.getItem('cart') || '[]'); } catch { return []; }
}

const Checkout = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [cart, setCart] = useState([])
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    paymentMethod: 'cod',
    deliveryType: 'home_delivery',
    notes: ''
  })
  const [subtotal, setSubtotal] = useState(0)
  const [fieldErrors, setFieldErrors] = useState({
    name: '',
    phone: ''
  })
  // Prescription upload state
  const [prescriptionFile, setPrescriptionFile] = useState(null)
  const [prescriptionPreviewUrl, setPrescriptionPreviewUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadedPrescriptionMeta, setUploadedPrescriptionMeta] = useState(null)
  const [uploadError, setUploadError] = useState('')
  

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }
    
    const cartData = getCart()
    if (cartData.length === 0) {
      navigate('/cart')
      return
    }
    
    setCart(cartData)
    setSubtotal(cartData.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0))
    
    // Pre-fill user data if available
    if (user.firstName || user.lastName) {
      const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim()
      setFormData(prev => ({ ...prev, name: fullName }))
    }
    if (user.phone) setFormData(prev => ({ ...prev, phone: user.phone }))
  }, [user, navigate])

  // Validation functions
  const preventInvalidNameChar = (e) => {
    const isNameField = e.target.name === 'name';
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
    const isNameField = e.target.name === 'name';
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear field-specific error when user types
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    
    // Real-time validation for name field
    if (name === 'name') {
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
    
    // Real-time validation for phone field
    if (name === 'phone') {
      // Remove all non-digit characters and limit to 10 digits
      const digitsOnly = value.replace(/\D/g, '').slice(0, 10);
      
      // Update the form with cleaned value
      setFormData(prev => ({ ...prev, [name]: digitsOnly }));
      
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
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.name || !formData.phone || !formData.address) {
      alert('Please fill in all required fields')
      return
    }

    // If a prescription was uploaded, place prescription order flow
    if (uploadedPrescriptionMeta?.fileName) {
      try {
        const resp = await fetch('http://localhost:5001/api/prescriptions/create-order', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            prescriptionFile: uploadedPrescriptionMeta.fileName,
            prescriptionDetails: {
              patientName: formData.name,
              patientPhone: formData.phone,
              patientAddress: formData.address,
              notes: formData.notes || ''
            },
            paymentMethod: formData.paymentMethod,
            deliveryType: formData.deliveryType,
            customer: {
              name: formData.name,
              phone: formData.phone,
              address: formData.address,
              notes: formData.notes || ''
            },
            total: 0
          })
        })
        const data = await resp.json()
        if (!resp.ok) {
          throw new Error(data?.message || 'Failed to place prescription order')
        }
        alert('Prescription uploaded and order created successfully!')
        // Reset local cart because this is a prescription-only order
        localStorage.removeItem('cart')
        window.dispatchEvent(new Event('order:placed'))
        navigate('/orders')
        return
      } catch (err) {
        alert(err.message)
        return
      }
    }

    // Build order payload for API (regular product order)
    const payload = {
      items: cart.map(it => ({
        productId: it._id || it.id || undefined,
        name: it.name,
        price: it.price,
        quantity: it.quantity || 1
      })),
      total: subtotal,
      paymentMethod: formData.paymentMethod,
      deliveryType: formData.deliveryType,
      customer: {
        name: formData.name,
        phone: formData.phone,
        address: formData.address,
        notes: formData.notes || ''
      }
    }

    try {
      // First check stock availability
      const stockCheckResp = await fetch('http://localhost:5001/api/orders/check-stock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ items: payload.items })
      })
      
      const stockData = await stockCheckResp.json()
      
      if (!stockCheckResp.ok) {
        throw new Error(stockData?.message || 'Failed to check stock')
      }

      // If any items are out of stock, show detailed error
      if (!stockData.allInStock) {
        const outOfStockItems = stockData.items.filter(item => !item.available)
        const errorMessage = `The following items are out of stock:\n${outOfStockItems.map(item => 
          `• ${item.name} (Requested: ${item.requestedQuantity}, Available: ${item.availableStock})`
        ).join('\n')}\n\nPlease remove these items from your cart and try again.`
        alert(errorMessage)
        return
      }

      // All items are in stock, proceed with order creation
      const resp = await fetch('http://localhost:5001/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(payload)
      })
      const data = await resp.json()
      if (!resp.ok) {
        // Handle specific stock-related errors from order creation
        if (data.stockCheck && !data.stockCheck.allInStock) {
          const outOfStockItems = data.stockCheck.items.filter(item => !item.available)
          const errorMessage = `Some items became out of stock while processing your order:\n${outOfStockItems.map(item => 
            `• ${item.name} (Requested: ${item.requestedQuantity}, Available: ${item.availableStock})`
          ).join('\n')}\n\nPlease update your cart and try again.`
          alert(errorMessage)
          return
        }
        throw new Error(data?.message || 'Failed to place order')
      }
      alert('Order placed successfully!')
      localStorage.removeItem('cart')
      window.dispatchEvent(new Event('cart:update'))
      window.dispatchEvent(new Event('order:placed'))
      navigate('/orders')
    } catch (err) {
      alert(err.message)
    }
  }

  const onSelectPrescription = (file) => {
    if (!file) return
    setPrescriptionFile(file) // always set so the Upload button is enabled
    setUploadError('')
    if (file.type && file.type.startsWith('image/')) {
      setPrescriptionPreviewUrl(URL.createObjectURL(file))
    } else {
      setPrescriptionPreviewUrl('')
    }
  }

  const handleUploadPrescription = async () => {
    if (!prescriptionFile) return
    // Validate on click to provide clear feedback
    const allowed = ['image/jpeg', 'image/jpg', 'application/pdf']
    if (!allowed.includes(prescriptionFile.type)) {
      setUploadError('Invalid file type. Only PDF, JPG and JPEG are allowed.')
      return
    }
    if (prescriptionFile.size > 10 * 1024 * 1024) {
      setUploadError('Prescription must be less than 10MB in size')
      return
    }
    setUploading(true)
    setUploadProgress(0)
    try {
      const form = new FormData()
      form.append('prescriptionFile', prescriptionFile)

      const resp = await fetch('http://localhost:5001/api/prescriptions/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: form
      })
      const data = await resp.json()
      if (!resp.ok) throw new Error(data?.message || 'Upload failed')
      setUploadedPrescriptionMeta({ fileName: data.fileName, filePath: data.filePath })
      const publicUrl = `http://localhost:5001/uploads/prescriptions/${data.fileName}`
      alert(`Prescription uploaded successfully.\n\nURL: ${publicUrl}`)
    } catch (err) {
      alert(err.message)
    } finally {
      setUploading(false)
      setUploadProgress(100)
    }
  }

  const removePrescription = () => {
    setPrescriptionFile(null)
    setPrescriptionPreviewUrl('')
    setUploadedPrescriptionMeta(null)
    setUploadProgress(0)
  }

  if (!user) {
    return null // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <section className="py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Order Summary */
            }
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Summary</h2>
              
              <div className="space-y-4">
                {cart.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center py-3 border-b border-gray-200">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{item.name}</h3>
                      <p className="text-sm text-gray-600">Qty: {item.quantity || 1}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Rs.{item.price?.toFixed ? item.price.toFixed(2) : item.price} each</p>
                      <p className="font-semibold text-gray-900">
                        Rs.{((item.price || 0) * (item.quantity || 1)).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-900">Total</span>
                  <span className="text-xl font-bold text-gray-900">Rs.{subtotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Prescription Upload inside Order Summary */}
              <div id="prescription-upload" className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Prescription (optional)
                </label>
                <div className="rounded-lg border border-dashed border-gray-300 p-4">
                  {!prescriptionFile && !uploadedPrescriptionMeta && (
                    <div className="flex items-center justify-between gap-3">
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,application/pdf"
                        onChange={(e) => onSelectPrescription(e.target.files?.[0])}
                      />
                      <button
                        type="button"
                        onClick={handleUploadPrescription}
                        disabled={!prescriptionFile || uploading}
                        className="bg-gray-800 text-white px-3 py-2 rounded disabled:opacity-50"
                      >
                        {uploading ? 'Uploading...' : 'Upload'}
                      </button>
                    </div>
                  )}

                  {(prescriptionFile || uploadedPrescriptionMeta) && (
                    <div className="flex items-center gap-4">
                      {prescriptionPreviewUrl ? (
                        <img src={prescriptionPreviewUrl} alt="Prescription preview" className="w-20 h-20 object-cover rounded" />
                      ) : (
                        <div className="text-sm text-gray-700">
                          {uploadedPrescriptionMeta?.fileName || prescriptionFile?.name}
                        </div>
                      )}
                      {!uploadedPrescriptionMeta && (
                        <button
                          type="button"
                          onClick={handleUploadPrescription}
                          disabled={uploading}
                          className="bg-blue-600 text-white px-3 py-2 rounded disabled:opacity-50"
                        >
                          {uploading ? 'Uploading...' : 'Confirm Upload'}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={removePrescription}
                        className="text-red-600 px-3 py-2"
                      >
                        Remove
                      </button>
                    </div>
                  )}

                  {uploadProgress > 0 && uploadProgress < 100 && (
                    <div className="mt-2 h-2 bg-gray-200 rounded">
                      <div className="h-2 bg-blue-600 rounded" style={{ width: `${uploadProgress}%` }} />
                    </div>
                  )}
                </div>
                {uploadedPrescriptionMeta && (
                  <p className="text-xs text-green-700 mt-2">
                    Prescription uploaded: <a className="underline text-blue-700" href={`http://localhost:5001/uploads/prescriptions/${uploadedPrescriptionMeta.fileName}`} target="_blank" rel="noreferrer">{uploadedPrescriptionMeta.fileName}</a>
                  </p>
                )}
                {!uploadedPrescriptionMeta && (
                  <p className="text-xs text-gray-500 mt-2">Max 10MB; PDF/JPG/JPEG only</p>
                )}
                {uploadError && (
                  <p className="text-xs text-red-600 mt-1">{uploadError}</p>
                )}
              </div>
            </div>

            

            {/* Customer Details & Payment */}
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Customer Details & Payment</h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Customer Information */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      onKeyDown={preventInvalidNameChar}
                      onPaste={preventInvalidNamePaste}
                      required
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${fieldErrors.name ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                      placeholder="Enter your full name"
                    />
                    {fieldErrors.name && (
                      <p className="text-xs text-red-600 mt-1">{fieldErrors.name}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      onKeyDown={handlePhoneKeyDown}
                      onPaste={handlePhonePaste}
                      required
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${fieldErrors.phone ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                      placeholder="07XXXXXXXX"
                    />
                    {fieldErrors.phone && (
                      <p className="text-xs text-red-600 mt-1">{fieldErrors.phone}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Delivery Address *
                    </label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      required
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter your complete delivery address"
                    />
                  </div>
                </div>

                

                {/* Delivery Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Delivery Type *
                  </label>
                  <select
                    name="deliveryType"
                    value={formData.deliveryType}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="pickup">Pickup</option>
                    <option value="home_delivery">Home delivery</option>
                  </select>
                </div>

                {/* Payment Options */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Method *
                  </label>
                  <select
                    name="paymentMethod"
                    value={formData.paymentMethod}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="cod">Cash on Delivery (COD)</option>
                    <option value="online">Online Payment (Coming Soon)</option>
                  </select>
                </div>

                {/* Customer Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Special Notes for Pharmacist/Delivery
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Any special instructions or notes..."
                  />
                </div>

                {/* Submit Button */}
                <div className="pt-4">
                  <button
                    type="submit"
                    className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                  >
                    {uploadedPrescriptionMeta ? 'Place Prescription Order' : 'Place Order'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  )
}

export default Checkout

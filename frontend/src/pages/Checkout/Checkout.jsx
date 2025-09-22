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

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.name || !formData.phone || !formData.address) {
      alert('Please fill in all required fields')
      return
    }

    // Build order payload for API
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
      navigate('/orders')
    } catch (err) {
      alert(err.message)
    }
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
            {/* Order Summary */}
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
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter your full name"
                    />
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
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter your phone number"
                    />
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
                    Place Order
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

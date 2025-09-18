import React, { useMemo, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar/Navbar'
import Footer from '../../components/Footer/Footer'
import { useAuth } from '../../context/AuthContext'

const getCart = () => {
  try { return JSON.parse(localStorage.getItem('cart') || '[]'); } catch { return []; }
}

const Cart = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [cart, setCart] = useState(getCart())
  const [stockStatus, setStockStatus] = useState({})
  const [loadingStock, setLoadingStock] = useState(false)
  const subtotal = useMemo(() => cart.reduce((s, i) => s + (i.price || 0) * (i.quantity || 1), 0), [cart])

  // Check stock status for cart items
  const checkStockStatus = async () => {
    if (cart.length === 0) return
    
    setLoadingStock(true)
    try {
      const items = cart.map(item => ({
        productId: item._id || item.id,
        name: item.name,
        quantity: item.quantity || 1
      }))
      
      const response = await fetch('http://localhost:5001/api/orders/check-stock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ items })
      })
      
      const data = await response.json()
      if (response.ok && data.items) {
        const statusMap = {}
        data.items.forEach(item => {
          statusMap[item.productId] = {
            available: item.available,
            availableStock: item.availableStock,
            requestedQuantity: item.requestedQuantity,
            message: item.message
          }
        })
        setStockStatus(statusMap)
      }
    } catch (error) {
      console.error('Failed to check stock status:', error)
    } finally {
      setLoadingStock(false)
    }
  }

  // Update cart when localStorage changes
  useEffect(() => {
    const handleStorageChange = () => {
      setCart(getCart())
    }
    
    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('cart:update', handleStorageChange)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('cart:update', handleStorageChange)
    }
  }, [])

  // Check stock status when cart changes
  useEffect(() => {
    if (user && cart.length > 0) {
      checkStockStatus()
    }
  }, [cart, user])

  const clearCart = () => {
    localStorage.removeItem('cart')
    setCart([])
    window.dispatchEvent(new Event('cart:update'))
  }

  const removeItem = (productId) => {
    const updated = cart.filter(it => it._id !== productId)
    setCart(updated)
    localStorage.setItem('cart', JSON.stringify(updated))
    window.dispatchEvent(new Event('cart:update'))
  }

  const proceedToCheckout = () => {
    if (cart.length === 0) {
      alert('Your cart is empty. Add some products first!')
      return
    }
    
    // Check if any items are out of stock
    const outOfStockItems = cart.filter(item => {
      const productId = item._id || item.id
      const status = stockStatus[productId]
      return status && !status.available
    })
    
    if (outOfStockItems.length > 0) {
      alert('Some items in your cart are out of stock. Please remove them before proceeding to checkout.')
      return
    }
    
    navigate('/checkout')
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <section className="py-12 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">My Cart</h1>
          {!user ? (
            <div className="p-6 bg-white rounded-xl shadow text-center">Please sign in to view your cart.</div>
          ) : (
            <div className="bg-white rounded-xl shadow overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-600">
                    <th className="p-2">Product</th>
                    <th className="p-2">Price</th>
                    <th className="p-2">Qty</th>
                    <th className="p-2">Stock Status</th>
                    <th className="p-2">Total</th>
                    <th className="p-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {cart.length === 0 ? (
                    <tr className="border-t">
                      <td className="p-2 text-center text-gray-500" colSpan="6">No items in cart.</td>
                    </tr>
                  ) : (
                    cart.map((item, idx) => {
                      const productId = item._id || item.id
                      const status = stockStatus[productId]
                      const isOutOfStock = status && !status.available
                      
                      return (
                        <tr key={idx} className={`border-t ${isOutOfStock ? 'bg-red-50' : ''}`}>
                          <td className="p-2">
                            <div className="font-medium">{item.name}</div>
                            {isOutOfStock && (
                              <div className="text-xs text-red-600 mt-1">
                                Requested: {status.requestedQuantity}, Available: {status.availableStock}
                              </div>
                            )}
                          </td>
                          <td className="p-2">Rs.{item.price?.toFixed ? item.price.toFixed(2) : item.price}</td>
                          <td className="p-2">{item.quantity || 1}</td>
                          <td className="p-2">
                            {loadingStock ? (
                              <span className="text-gray-500 text-xs">Checking...</span>
                            ) : status ? (
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                status.available 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {status.available ? 'In Stock' : 'Out of Stock'}
                              </span>
                            ) : (
                              <span className="text-gray-500 text-xs">Unknown</span>
                            )}
                          </td>
                          <td className="p-2">Rs.{((item.price || 0) * (item.quantity || 1)).toFixed(2)}</td>
                          <td className="p-2">
                            <button
                              onClick={() => removeItem(item._id)}
                              className="text-red-600 hover:text-red-700"
                              title="Remove item"
                            >
                              🗑️
                            </button>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-6 flex items-center justify-between">
            <div className="text-gray-700">Subtotal</div>
            <div className="text-xl font-semibold">Rs.{subtotal.toFixed(2)}</div>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-end">
            <button
              onClick={clearCart}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Clear All Items
            </button>
            <button
              onClick={proceedToCheckout}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Proceed to Checkout
            </button>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  )
}

export default Cart



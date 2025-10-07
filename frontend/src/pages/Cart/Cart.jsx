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
  const [confirmRemoveId, setConfirmRemoveId] = useState('')
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const subtotal = useMemo(() => cart.reduce((s, i) => s + (i.price || 0) * (i.quantity || 1), 0), [cart])


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


  const clearCart = async () => {
    try {
      // Release all reserved stock for items in cart
      for (const item of cart) {
        try {
          await fetch('http://localhost:5001/api/orders/release-stock', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
              productId: item._id,
              quantity: item.quantity || 1
            })
          })
        } catch (error) {
          console.error(`Failed to release stock for ${item.name}:`, error)
        }
      }
    } catch (error) {
      console.error('Clear cart error:', error)
    }
    
    localStorage.removeItem('cart')
    setCart([])
    window.dispatchEvent(new Event('cart:update'))
    window.dispatchEvent(new Event('order:placed'))
  }

  const removeItem = async (productId) => {
    // Find the item to get its quantity
    const itemToRemove = cart.find(it => it._id === productId)
    if (!itemToRemove) return
    
    try {
      // Release the reserved stock
      const response = await fetch('http://localhost:5001/api/orders/release-stock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          productId: productId,
          quantity: itemToRemove.quantity || 1
        })
      })
      
      const data = await response.json()
      if (!response.ok) {
        console.error('Failed to release stock:', data.message)
        // Continue with cart removal even if stock release fails
      }
      
      // Remove from cart
      const updated = cart.filter(it => it._id !== productId)
      setCart(updated)
      localStorage.setItem('cart', JSON.stringify(updated))
      window.dispatchEvent(new Event('cart:update'))
      window.dispatchEvent(new Event('order:placed'))
      
    } catch (error) {
      console.error('Remove item error:', error)
      // Continue with cart removal even if stock release fails
      const updated = cart.filter(it => it._id !== productId)
      setCart(updated)
      localStorage.setItem('cart', JSON.stringify(updated))
      window.dispatchEvent(new Event('cart:update'))
    }
  }

  const proceedToCheckout = () => {
    if (cart.length === 0) {
      alert('Your cart is empty. Add some products first!')
      return
    }
    
    navigate('/checkout')
  }

  // Adjust quantity with backend stock reservation/release
  const updateQuantity = async (productId, nextQuantity) => {
    const current = cart.find(it => it._id === productId)
    if (!current) return
    const currentQty = Number(current.quantity || 1)
    const desiredQty = Math.max(1, Number(nextQuantity) || 1)
    if (desiredQty === currentQty) return

    try {
      if (desiredQty > currentQty) {
        // Need to reserve the difference
        const diff = desiredQty - currentQty
        const response = await fetch('http://localhost:5001/api/orders/reserve-stock', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ productId, quantity: diff })
        })
        const data = await response.json()
        if (!response.ok) {
          alert(data.message || 'Failed to reserve additional stock')
          return
        }
      } else {
        // Release the difference
        const diff = currentQty - desiredQty
        try {
          await fetch('http://localhost:5001/api/orders/release-stock', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ productId, quantity: diff })
          })
        } catch (e) {
          console.error('release-stock failed', e)
        }
      }

      const updated = cart.map(it => it._id === productId ? { ...it, quantity: desiredQty } : it)
      setCart(updated)
      localStorage.setItem('cart', JSON.stringify(updated))
      window.dispatchEvent(new Event('cart:update'))
      window.dispatchEvent(new Event('order:placed'))
    } catch (error) {
      console.error('updateQuantity error', error)
    }
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
            <div className="bg-white rounded-xl shadow overflow-hidden">
              {/* Desktop/Table */}
              <table className="w-full text-sm hidden md:table">
                <thead>
                  <tr className="text-left text-gray-600">
                    <th className="p-2">Product</th>
                    <th className="p-2">Price</th>
                    <th className="p-2">Qty</th>
                    <th className="p-2">Total</th>
                    <th className="p-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {cart.length === 0 ? (
                    <tr className="border-t">
                      <td className="p-6 text-center text-gray-500" colSpan="5">🛒 Your cart is empty.
                        <button onClick={() => navigate('/products')} className="ml-3 inline-flex items-center px-3 py-1.5 border border-gray-300 rounded hover:bg-gray-50 text-gray-700">Start Shopping</button>
                      </td>
                    </tr>
                  ) : (
                    cart.map((item, idx) => {
                      return (
                        <tr key={idx} className="border-t">
                          <td className="p-2">
                            <div className="font-medium">{item.name}</div>
                          </td>
                          <td className="p-2">Rs.{item.price?.toFixed ? item.price.toFixed(2) : item.price}</td>
                          <td className="p-2">
                            <div className="inline-flex items-center gap-2">
                              <button
                                type="button"
                                className={`px-2 py-1 rounded border border-gray-300 hover:bg-gray-100 active:scale-95 transition ${((item.quantity || 1) <= 1) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                onClick={() => ((item.quantity || 1) > 1) && updateQuantity(item._id, (item.quantity || 1) - 1)}
                                aria-label="Decrease quantity"
                              >
                                -
                              </button>
                              <input
                                type="number"
                                min="1"
                                className="w-16 px-2 py-1 border border-gray-300 rounded text-center"
                                value={item.quantity || 1}
                                onChange={(e) => updateQuantity(item._id, e.target.value)}
                              />
                              <button
                                type="button"
                                className="px-2 py-1 rounded border border-gray-300 hover:bg-gray-100 active:scale-95 transition"
                                onClick={() => updateQuantity(item._id, (item.quantity || 1) + 1)}
                                aria-label="Increase quantity"
                              >
                                +
                              </button>
                            </div>
                          </td>
                          <td className="p-2">Rs.{((item.price || 0) * (item.quantity || 1)).toFixed(2)}</td>
                          <td className="p-2">
                            {confirmRemoveId === item._id ? (
                              <div className="flex items-center gap-2">
                                <span className="text-sm">Remove?</span>
                                <button onClick={() => { setConfirmRemoveId(''); removeItem(item._id) }} className="px-2 py-0.5 text-white bg-red-600 rounded text-xs">Yes</button>
                                <button onClick={() => setConfirmRemoveId('')} className="px-2 py-0.5 border rounded text-xs">Cancel</button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setConfirmRemoveId(item._id)}
                                className="text-red-600 hover:text-red-700"
                                title="Remove item"
                              >
                                🗑️
                              </button>
                            )}
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>

              {/* Mobile Cards */}
              <div className="md:hidden divide-y">
                {cart.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">🛒 Your cart is empty.
                    <div>
                      <button onClick={() => navigate('/products')} className="mt-3 inline-flex items-center px-3 py-1.5 border border-gray-300 rounded hover:bg-gray-50 text-gray-700">Start Shopping</button>
                    </div>
                  </div>
                ) : (
                  cart.map((item, idx) => (
                    <div key={idx} className="p-4">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 mb-1">{item.name}</div>
                        <div className="text-gray-600 mb-2">Rs.{item.price?.toFixed ? item.price.toFixed(2) : item.price}</div>
                        <div className="flex items-center justify-between">
                          <div className="inline-flex items-center gap-2">
                            <button type="button" className={`px-2 py-1 rounded border border-gray-300 hover:bg-gray-100 active:scale-95 transition ${((item.quantity || 1) <= 1) ? 'opacity-50 cursor-not-allowed' : ''}`} onClick={() => ((item.quantity || 1) > 1) && updateQuantity(item._id, (item.quantity || 1) - 1)}>-</button>
                            <input type="number" min="1" className="w-16 px-2 py-1 border border-gray-300 rounded text-center" value={item.quantity || 1} onChange={(e) => updateQuantity(item._id, e.target.value)} />
                            <button type="button" className="px-2 py-1 rounded border border-gray-300 hover:bg-gray-100 active:scale-95 transition" onClick={() => updateQuantity(item._id, (item.quantity || 1) + 1)}>+</button>
                          </div>
                          <div className="text-gray-900 font-semibold">Rs.{((item.price || 0) * (item.quantity || 1)).toFixed(2)}</div>
                        </div>
                        <div className="mt-2">
                          {confirmRemoveId === item._id ? (
                            <div className="flex items-center gap-2">
                              <span className="text-sm">Remove?</span>
                              <button onClick={() => { setConfirmRemoveId(''); removeItem(item._id) }} className="px-2 py-0.5 text-white bg-red-600 rounded text-xs">Yes</button>
                              <button onClick={() => setConfirmRemoveId('')} className="px-2 py-0.5 border rounded text-xs">Cancel</button>
                            </div>
                          ) : (
                            <button onClick={() => setConfirmRemoveId(item._id)} className="text-red-600 hover:text-red-700 text-sm">Remove</button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Subtotal / actions */}
          <div className="mt-6 flex flex-col sm:flex-row gap-6 sm:justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowClearConfirm(true)}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Clear All Items
              </button>
              <button
                onClick={() => navigate('/products')}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Continue Shopping
              </button>
            </div>

            <div className="sm:ml-auto sm:w-96 w-full">
              <div className="border rounded-xl p-4 bg-white shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-gray-700">Subtotal</div>
                  <div className="text-xl font-semibold text-blue-600">Rs.{subtotal.toFixed(2)}</div>
                </div>
                <button
                  onClick={proceedToCheckout}
                  className="w-full px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Proceed to Checkout
                </button>
              </div>
            </div>
          </div>

          {/* Clear confirmation modal */}
          {showClearConfirm && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl shadow-lg p-6 w-[90%] max-w-md">
                <div className="text-lg font-semibold mb-2">Clear All Items?</div>
                <div className="text-sm text-gray-600 mb-4">This will remove all items from your cart.</div>
                <div className="flex justify-end gap-2">
                  <button onClick={() => setShowClearConfirm(false)} className="px-4 py-2 border rounded">Cancel</button>
                  <button onClick={() => { setShowClearConfirm(false); clearCart() }} className="px-4 py-2 bg-red-600 text-white rounded">Clear</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
      <Footer />
    </div>
  )
}

export default Cart



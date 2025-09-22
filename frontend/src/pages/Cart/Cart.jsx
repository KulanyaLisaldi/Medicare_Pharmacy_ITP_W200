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
                    <th className="p-2">Total</th>
                    <th className="p-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {cart.length === 0 ? (
                    <tr className="border-t">
                      <td className="p-2 text-center text-gray-500" colSpan="5">No items in cart.</td>
                    </tr>
                  ) : (
                    cart.map((item, idx) => {
                      return (
                        <tr key={idx} className="border-t">
                          <td className="p-2">
                            <div className="font-medium">{item.name}</div>
                          </td>
                          <td className="p-2">Rs.{item.price?.toFixed ? item.price.toFixed(2) : item.price}</td>
                          <td className="p-2">{item.quantity || 1}</td>
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



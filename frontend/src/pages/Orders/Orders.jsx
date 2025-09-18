import React, { useEffect, useMemo, useState } from 'react'
import Navbar from '../../components/Navbar/Navbar'
import Footer from '../../components/Footer/Footer'
import { useAuth } from '../../context/AuthContext'

const Orders = () => {
  const { user } = useAuth()
  const [orders, setOrders] = useState([])

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const resp = await fetch('http://localhost:5001/api/orders/mine', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        })
        const data = await resp.json()
        if (!resp.ok) throw new Error(data?.message || 'Failed to load orders')
        setOrders(data)
      } catch (err) {
        console.error(err)
      }
    }
    if (user) fetchOrders()
  }, [user])

  const totalOrders = useMemo(() => orders.length, [orders])

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <section className="py-12 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
            <div className="text-gray-600">Total Orders: <span className="font-semibold">{totalOrders}</span></div>
          </div>

          {orders.length === 0 ? (
            <div className="p-6 bg-white rounded-xl shadow text-center">You have no orders yet.</div>
          ) : (
            <div className="bg-white rounded-xl shadow overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-600">
                    <th className="p-3">Order ID</th>
                    <th className="p-3">Date</th>
                    <th className="p-3">Items</th>
                    <th className="p-3">Total</th>
                    <th className="p-3">Payment</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order._id || order.id} className="border-t">
                      <td className="p-3 font-mono">#{order._id || order.id}</td>
                      <td className="p-3">{new Date(order.createdAt).toLocaleString()}</td>
                      <td className="p-3">
                        <div className="space-y-1">
                          {order.items.map((it, idx) => (
                            <div key={idx} className="text-gray-800">
                              {it.name} × {it.quantity || 1}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="p-3 font-semibold">Rs.{Number(order.total || 0).toFixed(2)}</td>
                      <td className="p-3 capitalize">{order.paymentMethod === 'cod' ? 'Cash on Delivery' : order.paymentMethod}</td>
                      <td className="p-3 capitalize">{order.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
      <Footer />
    </div>
  )
}

export default Orders



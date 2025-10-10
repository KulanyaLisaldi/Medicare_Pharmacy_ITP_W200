import React, { useEffect, useState } from 'react'
import Navbar from '../../components/Navbar/Navbar'
import Footer from '../../components/Footer/Footer'
import { useAuth } from '../../context/AuthContext'

const Contact = () => {
  const [formData, setFormData] = useState({ fullName: '', email: '', phone: '', message: '' })
  const [status, setStatus] = useState(null)
  const { user, token } = useAuth()

  useEffect(() => {
    if (!user) return
    const computedFullName = `${user.firstName || ''} ${user.lastName || ''}`.trim()
    setFormData(prev => ({
      ...prev,
      fullName: computedFullName || prev.fullName,
      email: user.email || prev.email,
      phone: user.phone || prev.phone
    }))
  }, [user])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const { fullName, email, phone, message } = formData
    if (!fullName || !email || !message) {
      setStatus({ type: 'error', message: 'Please fill in name, email, and message.' })
      return
    }

    try {
      const res = await fetch('http://localhost:5001/api/messages/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          fullName,
          email,
          phone,
          message
        })
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.message || 'Failed to send message')
      }

      setStatus({ type: 'success', message: 'Message sent. Our admin will reply soon.' })
      setFormData(prev => ({ ...prev, message: '' }))
    } catch (err) {
      setStatus({ type: 'error', message: err.message })
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-10 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800">Contact Us</h1>
          <p className="mt-3 text-gray-600">We'd love to hear from you. Reach out with any questions.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="p-6 rounded-lg border border-gray-200 shadow-sm">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                    <input id="fullName" name="fullName" type="text" value={formData.fullName} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Your full name" />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                    <input id="email" name="email" type="email" value={formData.email} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="you@example.com" />
                  </div>
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="07XXXXXXXX" />
                </div>
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">Message *</label>
                  <textarea id="message" name="message" rows={6} value={formData.message} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Write your message here..." />
                </div>

                {status && (
                  <div className={status.type === 'error' ? 'text-red-600 text-sm' : 'text-green-600 text-sm'}>
                    {status.message}
                  </div>
                )}

                <div className="pt-2">
                  <button type="submit" className="inline-flex items-center px-6 py-2.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    Send Message
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div className="space-y-6">
            <div className="p-6 rounded-lg border border-gray-200 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-800">Contact Information</h2>
              <div className="mt-4 space-y-3 text-gray-700">
                <div className="flex items-start gap-3">
                  <svg className="h-5 w-5 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  <span>123 Healthcare St, Medical City, MC 12345</span>
                </div>
                <div className="flex items-start gap-3">
                  <svg className="h-5 w-5 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                  <a href="tel:+94718351964" className="hover:underline">+94 718351964</a>
                </div>
                <div className="flex items-start gap-3">
                  <svg className="h-5 w-5 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  <a href="mailto:medicare892@gmail.com" className="hover:underline">medicare892@gmail.com</a>
                </div>
              </div>
            </div>
            <div className="p-6 rounded-lg border border-gray-200 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-800">Business Hours</h2>
              <ul className="mt-4 space-y-2 text-gray-700">
                <li>Mon - Fri: 9:00 AM - 6:00 PM</li>
                <li>Sat: 9:00 AM - 2:00 PM</li>
                <li>Sun: Closed</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}

export default Contact



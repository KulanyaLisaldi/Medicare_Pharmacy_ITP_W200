import React, { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import Navbar from '../../components/Navbar/Navbar'
import Footer from '../../components/Footer/Footer'

const Appointments = () => {
  const [searchParams] = useSearchParams()
  const doctorId = searchParams.get('doctor')
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [selectedSession, setSelectedSession] = useState(null)
  const [form, setForm] = useState({ 
    patientName: '', 
    patientEmail: '', 
    patientPhone: '', 
    patientNIC: '',
    patientAge: '',
    patientGender: '',
    patientAddress: '',
    ongoingCondition: '',
    notes: '' 
  })
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const load = async () => {
      if (!doctorId) {
        setError('No doctor selected')
        setLoading(false)
        return
      }
      try {
        const res = await fetch(`http://localhost:5001/api/appointments/doctor/${doctorId}`)
        if (!res.ok) throw new Error('Failed to load sessions')
        const data = await res.json()
        setSessions(data)
      } catch (e) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [doctorId])

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <section className="py-12 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Available Channels</h1>
          {loading && <div className="py-20 text-center text-gray-600">Loading...</div>}
          {error && <div className="py-20 text-center text-red-600">{error}</div>}

          {!loading && !error && (
            sessions.length === 0 ? (
              <div className="py-20 text-center text-gray-600">No sessions available</div>
            ) : (
              <div className="space-y-4">
                {sessions.map(s => (
                  <div key={s._id} className="bg-white rounded-xl shadow border border-gray-100 p-5">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div>
                        <div className="text-gray-900 font-semibold">{s.title || 'Consultation'}</div>
                        <div className="text-gray-600 text-sm">
                          {new Date(s.date).toLocaleDateString()} • {s.startTime} - {s.endTime} {s.location ? `• ${s.location}` : ''}
                        </div>
                        <div className="text-sm mt-1 text-gray-500">Active Appointments: {s.bookedCount} / {s.capacity} {s.bookedCount >= s.capacity && <span className="text-red-600 ml-2">Session Full</span>}</div>
                      </div>
                      <div className="flex gap-3">
                        <button onClick={() => { setSelectedSession(s); setShowModal(true); setMessage(''); }} disabled={s.bookedCount >= s.capacity} className={`px-4 py-2 rounded-lg font-medium ${s.bookedCount >= s.capacity ? 'bg-gray-300 text-gray-600' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
                          {s.bookedCount >= s.capacity ? 'Full' : 'Book'}
                        </button>
                        <Link to={`/doctors/${doctorId}`} className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 font-medium">Doctor Profile</Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </section>
      {showModal && selectedSession && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-2xl rounded-xl shadow-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Book Appointment</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <div className="text-sm text-gray-600 mb-4">
              {new Date(selectedSession.date).toLocaleDateString()} • {selectedSession.startTime} - {selectedSession.endTime} {selectedSession.location ? `• ${selectedSession.location}` : ''}
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              // Validate required fields
              if (!form.patientName || !form.patientEmail || !form.patientPhone || !form.patientNIC || 
                  !form.patientAge || !form.patientGender || !form.patientAddress || !form.ongoingCondition) {
                setMessage('Please fill in all required fields');
                return;
              }
              setShowModal(false);
              setShowConfirmation(true);
            }} className="space-y-4">
              {/* Patient Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input 
                  required 
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                  value={form.patientName} 
                  onChange={e => setForm({ ...form, patientName: e.target.value })} 
                  placeholder="Enter your full name"
                />
              </div>

              {/* Email and Phone */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
                  <input 
                    type="email" 
                    required 
                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                    value={form.patientEmail} 
                    onChange={e => setForm({ ...form, patientEmail: e.target.value })} 
                    placeholder="your.email@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                  <input 
                    required 
                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                    value={form.patientPhone} 
                    onChange={e => setForm({ ...form, patientPhone: e.target.value })} 
                    placeholder="+94 77 123 4567"
                  />
                </div>
              </div>

              {/* NIC and Age */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">NIC Number *</label>
                  <input 
                    required 
                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                    value={form.patientNIC} 
                    onChange={e => setForm({ ...form, patientNIC: e.target.value })} 
                    placeholder="123456789V"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Age *</label>
                  <input 
                    type="number" 
                    required 
                    min="1" 
                    max="120"
                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                    value={form.patientAge} 
                    onChange={e => setForm({ ...form, patientAge: e.target.value })} 
                    placeholder="25"
                  />
                </div>
              </div>

              {/* Gender */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Gender *</label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input 
                      type="radio" 
                      name="gender" 
                      value="male" 
                      checked={form.patientGender === 'male'}
                      onChange={e => setForm({ ...form, patientGender: e.target.value })}
                      className="mr-2"
                    />
                    Male
                  </label>
                  <label className="flex items-center">
                    <input 
                      type="radio" 
                      name="gender" 
                      value="female" 
                      checked={form.patientGender === 'female'}
                      onChange={e => setForm({ ...form, patientGender: e.target.value })}
                      className="mr-2"
                    />
                    Female
                  </label>
                  <label className="flex items-center">
                    <input 
                      type="radio" 
                      name="gender" 
                      value="other" 
                      checked={form.patientGender === 'other'}
                      onChange={e => setForm({ ...form, patientGender: e.target.value })}
                      className="mr-2"
                    />
                    Other
                  </label>
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
                <textarea 
                  required 
                  rows="3"
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                  value={form.patientAddress} 
                  onChange={e => setForm({ ...form, patientAddress: e.target.value })} 
                  placeholder="Enter your complete address"
                />
              </div>

              {/* Ongoing Condition */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Do you have any ongoing medical conditions? *</label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input 
                      type="radio" 
                      name="ongoingCondition" 
                      value="yes" 
                      checked={form.ongoingCondition === 'yes'}
                      onChange={e => setForm({ ...form, ongoingCondition: e.target.value })}
                      className="mr-2"
                    />
                    Yes
                  </label>
                  <label className="flex items-center">
                    <input 
                      type="radio" 
                      name="ongoingCondition" 
                      value="no" 
                      checked={form.ongoingCondition === 'no'}
                      onChange={e => setForm({ ...form, ongoingCondition: e.target.value })}
                      className="mr-2"
                    />
                    No
                  </label>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
                <textarea 
                  rows="3"
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                  value={form.notes} 
                  onChange={e => setForm({ ...form, notes: e.target.value })} 
                  placeholder="Any additional information you'd like to share with the doctor"
                />
              </div>

              {message && (
                <div className={`text-sm p-3 rounded-lg ${message.includes('success') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                  {message}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)} 
                  className="px-6 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-medium"
                >
                  Review & Confirm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmation && selectedSession && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-2xl rounded-xl shadow-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Confirm Your Appointment</h2>
              <button 
                onClick={() => {
                  setShowConfirmation(false);
                  setShowModal(true);
                }} 
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                ✕
              </button>
            </div>

            {/* Appointment Details */}
            <div className="space-y-6">
              {/* Appointment Number & Queue Position */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-blue-900">Appointment Number</h3>
                    <p className="text-2xl font-bold text-blue-600">
                      #{selectedSession.bookedCount + 1} of {selectedSession.capacity}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-blue-700">Queue Position</p>
                    <p className="text-lg font-semibold text-blue-600">
                      {selectedSession.bookedCount + 1}
                    </p>
                  </div>
                </div>
              </div>

              {/* Doctor Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Doctor Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Doctor</p>
                    <p className="font-medium text-gray-900">
                      Dr. {selectedSession.doctorName || 'Loading...'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Specialization</p>
                    <p className="font-medium text-gray-900">
                      {selectedSession.specialization || 'General Practice'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Appointment Details */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Appointment Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Date</p>
                    <p className="font-medium text-gray-900">
                      {new Date(selectedSession.date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Time</p>
                    <p className="font-medium text-gray-900">
                      {selectedSession.startTime} - {selectedSession.endTime}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Channel</p>
                    <p className="font-medium text-gray-900 capitalize">
                      {selectedSession.mode || 'Physical'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Location</p>
                    <p className="font-medium text-gray-900">
                      {selectedSession.location || (selectedSession.mode === 'video' ? 'Online Video Call' : 'Clinic Location')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Fee & Payment */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Fee & Payment</h3>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Consultation Fee</p>
                    <p className="text-2xl font-bold text-gray-900">
                      LKR {selectedSession.price || '2,500'}.00
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Payment Method</p>
                    <p className="font-medium text-gray-900 capitalize">
                      {selectedSession.paymentType || 'Online'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Patient Information Summary */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Patient Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Name</p>
                    <p className="font-medium text-gray-900">{form.patientName}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Email</p>
                    <p className="font-medium text-gray-900">{form.patientEmail}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Phone</p>
                    <p className="font-medium text-gray-900">{form.patientPhone}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">NIC</p>
                    <p className="font-medium text-gray-900">{form.patientNIC}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Age</p>
                    <p className="font-medium text-gray-900">{form.patientAge} years</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Gender</p>
                    <p className="font-medium text-gray-900 capitalize">{form.patientGender}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-gray-600">Address</p>
                    <p className="font-medium text-gray-900">{form.patientAddress}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Ongoing Conditions</p>
                    <p className="font-medium text-gray-900 capitalize">{form.ongoingCondition}</p>
                  </div>
                  {form.notes && (
                    <div className="md:col-span-2">
                      <p className="text-gray-600">Notes</p>
                      <p className="font-medium text-gray-900">{form.notes}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between gap-4 pt-4 border-t">
                <button 
                  onClick={() => {
                    setShowConfirmation(false);
                    setShowModal(true);
                  }}
                  className="px-6 py-3 rounded-lg border border-gray-300 hover:bg-gray-50 font-medium"
                >
                  ← Back to Edit
                </button>
                <button 
                  onClick={async () => {
                    setSubmitting(true);
                    setMessage('');
                    try {
                      const res = await fetch('http://localhost:5001/api/bookings', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          appointmentId: selectedSession._id,
                          patientName: form.patientName,
                          patientEmail: form.patientEmail,
                          patientPhone: form.patientPhone,
                          patientNIC: form.patientNIC,
                          patientAge: parseInt(form.patientAge),
                          patientGender: form.patientGender,
                          patientAddress: form.patientAddress,
                          ongoingCondition: form.ongoingCondition,
                          notes: form.notes
                        })
                      })
                      const data = await res.json()
                      if (!res.ok) throw new Error(data.message || 'Failed to book')
                      
                      // Show success message
                      setMessage(`✅ Appointment booked successfully! Your appointment number is: ${data.booking?.appointmentNumber || 'Generated'}`)
                      
                      // Optimistic update of booked count
                      setSessions(prev => prev.map(s => s._id === selectedSession._id ? { ...s, bookedCount: s.bookedCount + 1 } : s))
                      
                      // Reset form and close modals
                      setForm({ 
                        patientName: '', 
                        patientEmail: '', 
                        patientPhone: '', 
                        patientNIC: '',
                        patientAge: '',
                        patientGender: '',
                        patientAddress: '',
                        ongoingCondition: '',
                        notes: '' 
                      })
                      setShowConfirmation(false)
                      setShowModal(false)
                    } catch (e) {
                      setMessage(`❌ ${e.message}`)
                    } finally {
                      setSubmitting(false)
                    }
                  }}
                  disabled={submitting}
                  className="px-8 py-3 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 font-medium"
                >
                  {submitting ? 'Confirming...' : '✓ Confirm Booking'}
                </button>
              </div>

              {/* Success/Error Message */}
              {message && (
                <div className={`text-sm p-4 rounded-lg ${message.includes('✅') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                  {message}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}

export default Appointments



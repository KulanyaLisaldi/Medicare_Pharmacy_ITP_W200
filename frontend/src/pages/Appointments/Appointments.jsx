import React, { useEffect, useState } from 'react'
import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar/Navbar'
import Footer from '../../components/Footer/Footer'
import { useAuth } from '../../context/AuthContext'

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
    patientFirstName: '', 
    patientLastName: '', 
    patientEmail: '', 
    patientPhone: '', 
    patientAge: '',
    patientGender: '',
    ongoingCondition: '',
    notes: '' 
  })
  const [uploadedFile, setUploadedFile] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [doctorInfo, setDoctorInfo] = useState(null)
  const [showDoctorProfile, setShowDoctorProfile] = useState(false)
  
  const { user, isCustomer } = useAuth()
  const navigate = useNavigate()
  
  // Helper function to get slot time based on slot number
  const getSlotTime = (session, slotNumber) => {
    if (session.timeSlots && session.timeSlots.length > 0) {
      const slot = session.timeSlots.find(s => s.slotNumber === slotNumber)
      return slot ? slot.time : session.startTime
    }
    return session.startTime
  }

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
    
    // Refresh sessions data every 30 seconds to keep booked count accurate
    const interval = setInterval(load, 30000)
    return () => clearInterval(interval)
  }, [doctorId])

  // Fetch doctor information
  useEffect(() => {
    const fetchDoctorInfo = async () => {
      if (!doctorId) return
      
      try {
        const res = await fetch(`http://localhost:5001/api/users/public/doctors/${doctorId}`)
        if (res.ok) {
          const doctor = await res.json()
          setDoctorInfo(doctor)
        }
      } catch (error) {
        console.error('Error fetching doctor info:', error)
      }
    }
    fetchDoctorInfo()
  }, [doctorId])

  // Auto-fill email when user is logged in
  useEffect(() => {
    if (user && user.email) {
      setForm(prev => ({ ...prev, patientEmail: user.email }))
    }
  }, [user])

  // Handle Book button click - check authentication
  const handleBookClick = (session) => {
    if (!user) {
      // User not logged in, redirect to login page
      navigate('/login')
      return
    }
    
    if (!isCustomer()) {
      // User is logged in but not a customer, show message
      alert('Only customers can book appointments. Please log in with a customer account.')
      return
    }
    
    // User is authenticated as customer, proceed to booking
    setSelectedSession(session)
    setShowModal(true)
    setMessage('')
  }

  // Handle doctor profile view
  const handleDoctorProfileClick = () => {
    setShowDoctorProfile(true)
  }


  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <section className="py-12 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Doctor Information Card */}
          {doctorInfo && (
            <div className="bg-gray-200 rounded-xl shadow-sm border border-gray-400 p-4 sm:p-6 mb-6 sm:mb-8">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-blue-100 flex items-center justify-center text-xl sm:text-2xl flex-shrink-0">
                    👨‍⚕️
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-lg sm:text-2xl font-bold text-gray-900 truncate">
                      Dr. {doctorInfo.firstName} {doctorInfo.lastName}
                    </h2>
                    <p className="text-blue-600 text-sm sm:text-lg font-medium">
                      {doctorInfo.specialization || 'General Medicine'}
                    </p>
                    {doctorInfo.experienceYears > 0 && (
                      <p className="text-gray-600 text-xs sm:text-sm">
                        {doctorInfo.experienceYears} years of experience
                      </p>
                    )}
                    {doctorInfo.practicingGovernmentHospital && (
                      <p className="text-gray-600 text-xs sm:text-sm truncate">
                        {doctorInfo.practicingGovernmentHospital}
                      </p>
                    )}
                  </div>
                </div>
                <button 
                  onClick={handleDoctorProfileClick}
                  className="text-blue-600 hover:text-blue-800 underline text-xs sm:text-sm font-medium self-start sm:self-center whitespace-nowrap"
                >
                  View Profile
                </button>
              </div>
            </div>
          )}

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
                        <button onClick={() => handleBookClick(s)} disabled={s.bookedCount >= s.capacity} className={`px-4 py-2 rounded-lg font-medium ${s.bookedCount >= s.capacity ? 'bg-gray-300 text-gray-600' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
                          {s.bookedCount >= s.capacity ? 'Full' : 'Book'}
                        </button>
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
            
            {/* Session Information */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">Session Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-blue-700 font-medium">Session Start Time</p>
                  <p className="text-blue-900 font-semibold">{selectedSession.startTime}</p>
                </div>
                <div>
                  <p className="text-blue-700 font-medium">Your Appointment Number</p>
                  <p className="text-blue-900 font-semibold">Slot #{selectedSession.bookedCount + 1}</p>
                </div>
                <div>
                  <p className="text-blue-700 font-medium">Time</p>
                  <p className="text-blue-900 font-semibold">{getSlotTime(selectedSession, selectedSession.bookedCount + 1)}</p>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-blue-200">
                <p className="text-blue-700 text-sm">
                  <span className="font-medium">Date:</span> {new Date(selectedSession.date).toLocaleDateString()} • 
                  <span className="font-medium"> Duration:</span> {selectedSession.startTime} - {selectedSession.endTime}
                  {selectedSession.location && ` • ${selectedSession.location}`}
                </p>
              </div>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              // Validate required fields
              if (!form.patientFirstName || !form.patientLastName || !form.patientEmail || !form.patientPhone || 
                  !form.patientAge || !form.patientGender || !form.ongoingCondition) {
                setMessage('Please fill in all required fields');
                return;
              }
              setShowModal(false);
              setShowConfirmation(true);
            }} className="space-y-4">
              {/* Patient Name */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                  <input 
                    required 
                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                    value={form.patientFirstName} 
                    onChange={e => setForm({ ...form, patientFirstName: e.target.value })} 
                    placeholder="Enter your first name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                  <input 
                    required 
                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                    value={form.patientLastName} 
                    onChange={e => setForm({ ...form, patientLastName: e.target.value })} 
                    placeholder="Enter your last name"
                  />
                </div>
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

              {/* Age */}
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

              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Attach File (Optional)</label>
                <div className="mt-1">
                  <input
                    type="file"
                    id="file-upload"
                    className="hidden"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        setUploadedFile(file);
                      }
                    }}
                  />
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    {uploadedFile ? uploadedFile.name : 'Choose file to upload'}
                  </label>
                  {uploadedFile && (
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-sm text-green-600">✓ {uploadedFile.name}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setUploadedFile(null);
                          document.getElementById('file-upload').value = '';
                        }}
                        className="text-sm text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Supported formats: PDF, DOC, DOCX, JPG, PNG (Max 10MB)
                </p>
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
                      Slot #{selectedSession.bookedCount + 1} of {selectedSession.capacity}
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
                      {doctorInfo ? `Dr. ${doctorInfo.firstName} ${doctorInfo.lastName}` : 'Loading...'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Specialization</p>
                    <p className="font-medium text-gray-900">
                      {doctorInfo ? doctorInfo.specialization || 'General Practice' : 'Loading...'}
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
                      {selectedSession.startTime}
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
                    <p className="font-medium text-gray-900">{form.patientFirstName} {form.patientLastName}</p>
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
                    <p className="text-gray-600">Age</p>
                    <p className="font-medium text-gray-900">{form.patientAge} years</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Gender</p>
                    <p className="font-medium text-gray-900 capitalize">{form.patientGender}</p>
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
                  {uploadedFile && (
                    <div className="md:col-span-2">
                      <p className="text-gray-600">Attached File</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm text-green-600">📎 {uploadedFile.name}</span>
                        <span className="text-xs text-gray-500">
                          ({(uploadedFile.size / 1024 / 1024).toFixed(2)} MB)
                        </span>
                      </div>
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
                      // Create FormData for file upload
                      const formData = new FormData();
                      formData.append('appointmentId', selectedSession._id);
                      formData.append('patientFirstName', form.patientFirstName);
                      formData.append('patientLastName', form.patientLastName);
                      formData.append('patientEmail', form.patientEmail);
                      formData.append('patientPhone', form.patientPhone);
                      formData.append('patientAge', parseInt(form.patientAge));
                      formData.append('patientGender', form.patientGender);
                      formData.append('ongoingCondition', form.ongoingCondition);
                      formData.append('notes', form.notes);
                      
                      // Add uploaded file if exists
                      if (uploadedFile) {
                        formData.append('documents', uploadedFile);
                      }

                      const res = await fetch('http://localhost:5001/api/bookings', {
                        method: 'POST',
                        body: formData
                      })
                      const data = await res.json()
                      if (!res.ok) throw new Error(data.message || 'Failed to book')
                      
                      // Show success message
                      setMessage(`✅ Appointment booked successfully! Your appointment number is: ${data.booking?.appointmentNumber || 'Generated'}`)
                      
                      // Refresh sessions data to get accurate booked count
                      const refreshRes = await fetch(`http://localhost:5001/api/appointments/doctor/${doctorId}`)
                      if (refreshRes.ok) {
                        const refreshData = await refreshRes.json()
                        setSessions(refreshData)
                      } else {
                        // Fallback to optimistic update if refresh fails
                        setSessions(prev => prev.map(s => s._id === selectedSession._id ? { ...s, bookedCount: s.bookedCount + 1 } : s))
                      }
                      
                      // Reset form and close modals
                      setForm({ 
                        patientFirstName: '', 
                        patientLastName: '', 
                        patientEmail: '', 
                        patientPhone: '', 
                        patientAge: '',
                        patientGender: '',
                        ongoingCondition: '',
                        notes: '' 
                      })
                      setUploadedFile(null)
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

      {/* Doctor Profile Modal */}
      {showDoctorProfile && doctorInfo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-2xl rounded-xl shadow-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Doctor Profile</h2>
              <button 
                onClick={() => setShowDoctorProfile(false)}
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6">
              {/* Doctor Header */}
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-2xl">
                  👨‍⚕️
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    Dr. {doctorInfo.firstName} {doctorInfo.lastName}
                  </h3>
                  <p className="text-blue-600 text-lg font-medium">
                    {doctorInfo.specialization || 'General Medicine'}
                  </p>
                </div>
              </div>

              {/* Doctor Information */}
              <div className="space-y-6">
                {/* Basic Information */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Basic Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Full Name</p>
                      <p className="font-medium text-gray-900">
                        Dr. {doctorInfo.firstName} {doctorInfo.lastName}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Specialization</p>
                      <p className="font-medium text-gray-900">
                        {doctorInfo.specialization || 'General Medicine'}
                      </p>
                    </div>
                    {doctorInfo.registrationNumber && (
                      <div>
                        <p className="text-sm text-gray-600">Registration Number</p>
                        <p className="font-medium text-gray-900">
                          {doctorInfo.registrationNumber}
                        </p>
                      </div>
                    )}
                    {doctorInfo.experienceYears > 0 && (
                      <div>
                        <p className="text-sm text-gray-600">Experience</p>
                        <p className="font-medium text-gray-900">
                          {doctorInfo.experienceYears} years
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Professional Details */}
                {doctorInfo.practicingGovernmentHospital && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Professional Details</h4>
                    <div>
                      <p className="text-sm text-gray-600">Current Hospital</p>
                      <p className="font-medium text-gray-900">
                        {doctorInfo.practicingGovernmentHospital}
                      </p>
                    </div>
                  </div>
                )}

                {/* Contact Information */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Contact Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {doctorInfo.email && (
                      <div>
                        <p className="text-sm text-gray-600">Email</p>
                        <p className="font-medium text-gray-900">{doctorInfo.email}</p>
                      </div>
                    )}
                    {doctorInfo.phone && (
                      <div>
                        <p className="text-sm text-gray-600">Phone</p>
                        <p className="font-medium text-gray-900">{doctorInfo.phone}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t">
                  <button 
                    onClick={() => setShowDoctorProfile(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}

export default Appointments



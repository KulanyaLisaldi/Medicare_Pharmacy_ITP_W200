import React, { useEffect, useState } from 'react'
import Navbar from '../../components/Navbar/Navbar'
import Footer from '../../components/Footer/Footer'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const Doctors = () => {
  const [doctors, setDoctors] = useState([])
  const [filteredDoctors, setFilteredDoctors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSpecialization, setSelectedSpecialization] = useState('')
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [selectedDoctor, setSelectedDoctor] = useState(null)
  
  const { user, isCustomer } = useAuth()
  const navigate = useNavigate()

  // Common specializations
  const specializations = [
    'All Specialists',
    'Cardiology',
    'Dermatology', 
    'Pediatrics',
    'Neurology',
    'Orthopedics',
    'Gynecology',
    'Psychiatry',
    'General Medicine',
    'Ophthalmology',
    'ENT',
    'Urology'
  ]

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const res = await fetch('http://localhost:5001/api/users/public/doctors')
        if (!res.ok) throw new Error('Failed to load doctors')
        const data = await res.json()
        setDoctors(data)
        setFilteredDoctors(data)
      } catch (e) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    fetchDoctors()
  }, [])

  // Group doctors by specialization
  const groupDoctorsBySpecialization = (doctorsList) => {
    const grouped = {}
    
    doctorsList.forEach(doctor => {
      const specialization = doctor.specialization || 'General Medicine'
      if (!grouped[specialization]) {
        grouped[specialization] = []
      }
      grouped[specialization].push(doctor)
    })
    
    return grouped
  }

  // Search and filter functionality
  useEffect(() => {
    let filtered = doctors

    // Filter by specialization
    if (selectedSpecialization && selectedSpecialization !== 'All Specialists') {
      filtered = filtered.filter(doctor => {
        const doctorSpecialization = (doctor.specialization || 'General Medicine').toLowerCase()
        return doctorSpecialization.includes(selectedSpecialization.toLowerCase())
      })
    }

    // Filter by search term
    if (searchTerm.trim()) {
      filtered = filtered.filter(doctor => {
        const fullName = `${doctor.firstName} ${doctor.lastName}`.toLowerCase()
        const specialization = (doctor.specialization || '').toLowerCase()
        const searchLower = searchTerm.toLowerCase()
        
        return fullName.includes(searchLower) || specialization.includes(searchLower)
      })
    }

    setFilteredDoctors(filtered)
  }, [searchTerm, selectedSpecialization, doctors])

  // Get grouped doctors for display
  const groupedDoctors = groupDoctorsBySpecialization(filteredDoctors)

  // Handle channel click - allow viewing sessions without authentication
  const handleChannelClick = (doctorId) => {
    // Allow all users to view available sessions
    navigate(`/appointments?doctor=${doctorId}`)
  }

  // Handle profile view - open modal
  const handleProfileClick = (doctor) => {
    setSelectedDoctor(doctor)
    setShowProfileModal(true)
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold mb-4">Find Your Specialist</h1>
            <p className="text-xl text-blue-100 mb-8">
              Browse available specialists and book an appointment with qualified doctors
            </p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by doctor name or specialization..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-6 py-4 text-gray-900 rounded-lg text-lg focus:outline-none focus:ring-4 focus:ring-blue-300 shadow-lg"
                />
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                  
                </div>
              </div>
              {searchTerm && (
                <p className="mt-2 text-blue-100">
                  {filteredDoctors.length} doctor{filteredDoctors.length !== 1 ? 's' : ''} found
                </p>
              )}
            </div>
          </div>
        </div>
       </section>

       {/* Specialization Filter Section */}
       <section className="py-8 bg-white border-b border-gray-200">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
           <div className="text-center mb-6">
             <h2 className="text-2xl font-bold text-gray-900 mb-2">Browse by Specialization</h2>
             <p className="text-gray-600">Filter doctors by their medical specialization</p>
           </div>
           
           <div className="flex flex-wrap justify-center gap-3">
             {specializations.map((specialization) => (
               <button
                 key={specialization}
                 onClick={() => {
                   setSelectedSpecialization(specialization)
                   setSearchTerm('') // Clear search when selecting specialization
                 }}
                 className={`px-6 py-3 rounded-full text-sm font-medium transition-all duration-200 ${
                   selectedSpecialization === specialization
                     ? 'bg-blue-600 text-white shadow-lg transform scale-105'
                     : 'bg-gray-100 text-gray-700 hover:bg-blue-50 hover:text-blue-600 hover:shadow-md'
                 }`}
               >
                 {specialization}
               </button>
             ))}
           </div>
           
         </div>
       </section>

       {/* Doctors Section */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold text-gray-900">Available Specialists</h2>
            <p className="text-gray-600 mt-2">Choose from our qualified medical professionals</p>
          </div>

          {loading && (
            <div className="text-center py-20 text-gray-600">Loading doctors...</div>
          )}
          {error && (
            <div className="text-center py-20 text-red-600">{error}</div>
          )}

          {!loading && !error && (
            <>
              {filteredDoctors.length === 0 && (searchTerm || selectedSpecialization) ? (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-6xl mb-4"></div>
                  <h3 className="text-xl font-medium text-gray-900 mb-2">No doctors found</h3>
                  <p className="text-gray-600">
                    {searchTerm 
                      ? 'Try adjusting your search terms' 
                      : `No doctors found in ${selectedSpecialization}`
                    }
                  </p>
                </div>
              ) : (
                <div className="space-y-12">
                  {Object.entries(groupedDoctors).map(([specialization, doctors]) => (
                    <div key={specialization} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                      {/* Category Header */}
                      <div className="px-6 py-4 border-b border-gray-200">
                        <div>
                          <h3 className="text-2xl font-bold text-gray-900">{specialization}</h3>
                          <p className="text-gray-600 font-medium">
                            {doctors.length} doctor{doctors.length !== 1 ? 's' : ''} available
                          </p>
                        </div>
                      </div>

                      {/* Doctors Grid */}
                      <div className="p-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                          {doctors.map((doc) => (
                            <div key={doc._id} className="bg-gray-50 rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
                              <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-xl">
                                  👨‍⚕️
                                </div>
                                <div>
                                  <h4 className="text-lg font-semibold text-gray-900">Dr. {doc.firstName} {doc.lastName}</h4>
                                  <p className="text-blue-600 text-sm font-medium">{doc.specialization || 'General Medicine'}</p>
                                </div>
                              </div>

                              <div className="space-y-1 text-gray-600 text-sm mb-4">
                                {doc.practicingGovernmentHospital && (
                                  <p className="flex items-center gap-2">
                                    <span className="text-gray-400">🏥</span>
                                    {doc.practicingGovernmentHospital}
                                  </p>
                                )}
                                {doc.experienceYears > 0 && (
                                  <p className="flex items-center gap-2">
                                    <span className="text-gray-400">⏰</span>
                                    {doc.experienceYears} years experience
                                  </p>
                                )}
                              </div>

                              <div className="flex gap-2">
                                <button 
                                  onClick={() => handleProfileClick(doc)}
                                  className="flex-1 text-center border border-blue-600 text-blue-600 hover:bg-blue-50 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
                                >
                                  View Profile
                                </button>
                                <button 
                                  onClick={() => handleChannelClick(doc._id)}
                                  className="flex-1 text-center bg-blue-600 text-white hover:bg-blue-700 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
                                >
                                  Channel
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Doctor Profile Modal */}
      {showProfileModal && selectedDoctor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-2xl rounded-xl shadow-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Doctor Profile</h2>
              <button 
                onClick={() => setShowProfileModal(false)}
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
                    Dr. {selectedDoctor.firstName} {selectedDoctor.lastName}
                  </h3>
                  <p className="text-blue-600 text-lg font-medium">
                    {selectedDoctor.specialization || 'General Medicine'}
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
                        Dr. {selectedDoctor.firstName} {selectedDoctor.lastName}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Specialization</p>
                      <p className="font-medium text-gray-900">
                        {selectedDoctor.specialization || 'General Medicine'}
                      </p>
                    </div>
                    {selectedDoctor.registrationNumber && (
                      <div>
                        <p className="text-sm text-gray-600">Registration Number</p>
                        <p className="font-medium text-gray-900">
                          {selectedDoctor.registrationNumber}
                        </p>
                      </div>
                    )}
                    {selectedDoctor.experienceYears > 0 && (
                      <div>
                        <p className="text-sm text-gray-600">Experience</p>
                        <p className="font-medium text-gray-900">
                          {selectedDoctor.experienceYears} years
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Professional Details */}
                {selectedDoctor.practicingGovernmentHospital && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Professional Details</h4>
                    <div>
                      <p className="text-sm text-gray-600">Current Hospital</p>
                      <p className="font-medium text-gray-900">
                        {selectedDoctor.practicingGovernmentHospital}
                      </p>
                    </div>
                  </div>
                )}

                {/* Contact Information */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Contact Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedDoctor.email && (
                      <div>
                        <p className="text-sm text-gray-600">Email</p>
                        <p className="font-medium text-gray-900">{selectedDoctor.email}</p>
                      </div>
                    )}
                    {selectedDoctor.phone && (
                      <div>
                        <p className="text-sm text-gray-600">Phone</p>
                        <p className="font-medium text-gray-900">{selectedDoctor.phone}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t">
                  <button 
                    onClick={() => setShowProfileModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                  >
                    Close
                  </button>
                  <button 
                    onClick={() => {
                      setShowProfileModal(false)
                      handleChannelClick(selectedDoctor._id)
                    }}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                  >
                    View Available Sessions
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

export default Doctors



import React, { useEffect, useState } from 'react'
import Navbar from '../../components/Navbar/Navbar'
import Footer from '../../components/Footer/Footer'
import { Link } from 'react-router-dom'

const Doctors = () => {
  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const res = await fetch('http://localhost:5001/api/users/public/doctors')
        if (!res.ok) throw new Error('Failed to load doctors')
        const data = await res.json()
        setDoctors(data)
      } catch (e) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    fetchDoctors()
  }, [])

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold text-gray-900">Our Doctors</h1>
            <p className="text-gray-600 mt-2">Qualified specialists available for consultations</p>
          </div>

          {loading && (
            <div className="text-center py-20 text-gray-600">Loading doctors...</div>
          )}
          {error && (
            <div className="text-center py-20 text-red-600">{error}</div>
          )}

          {!loading && !error && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {doctors.map((doc) => (
                <div key={doc._id} className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-2xl">
                        👨‍⚕️
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">Dr. {doc.firstName} {doc.lastName}</h3>
                        <p className="text-blue-600 font-medium">{doc.specialization || 'General Medicine'}</p>
                      </div>
                    </div>

                    <div className="mt-4 space-y-1 text-gray-600 text-sm">
                      {doc.practicingGovernmentHospital && (
                        <p>Hospital: {doc.practicingGovernmentHospital}</p>
                      )}
                      {doc.experienceYears > 0 && (
                        <p>Experience: {doc.experienceYears} years</p>
                      )}
                      {doc.registrationNumber && (
                        <p>Reg No: {doc.registrationNumber}</p>
                      )}
                    </div>

                    <div className="mt-6 flex gap-3">
                      <Link to={`/doctors/${doc._id}`} className="flex-1 text-center border border-blue-600 text-blue-600 hover:bg-blue-50 rounded-lg px-4 py-2 font-medium">
                        View Profile
                      </Link>
                      <Link to={`/appointments?doctor=${doc._id}`} className="flex-1 text-center bg-blue-600 text-white hover:bg-blue-700 rounded-lg px-4 py-2 font-medium">
                        Channel
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  )
}

export default Doctors



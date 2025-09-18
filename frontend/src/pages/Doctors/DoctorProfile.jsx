import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import Navbar from '../../components/Navbar/Navbar'
import Footer from '../../components/Footer/Footer'

const DoctorProfile = () => {
  const { id } = useParams()
  const [doctor, setDoctor] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchDoctor = async () => {
      try {
        const res = await fetch(`http://localhost:5001/api/users/public/doctors/${id}`)
        if (!res.ok) throw new Error('Failed to load doctor profile')
        const data = await res.json()
        setDoctor(data)
      } catch (e) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    fetchDoctor()
  }, [id])

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <section className="py-12 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading && <div className="text-center py-20 text-gray-600">Loading...</div>}
          {error && <div className="text-center py-20 text-red-600">{error}</div>}
          {!loading && !error && doctor && (
            <div className="bg-white rounded-xl shadow border border-gray-100 p-8">
              <div className="flex flex-col md:flex-row gap-6 items-start">
                <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center text-4xl">👨‍⚕️</div>
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-gray-900">Dr. {doctor.firstName} {doctor.lastName}</h1>
                  <p className="text-blue-600 font-medium mt-1">{doctor.specialization || 'General Medicine'}</p>
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-gray-700">
                    {doctor.practicingGovernmentHospital && (
                      <div>
                        <div className="text-xs uppercase text-gray-500">Hospital</div>
                        <div>{doctor.practicingGovernmentHospital}</div>
                      </div>
                    )}
                    {doctor.experienceYears > 0 && (
                      <div>
                        <div className="text-xs uppercase text-gray-500">Experience</div>
                        <div>{doctor.experienceYears} years</div>
                      </div>
                    )}
                    {doctor.registrationNumber && (
                      <div>
                        <div className="text-xs uppercase text-gray-500">Registration No</div>
                        <div>{doctor.registrationNumber}</div>
                      </div>
                    )}
                    {doctor.membership && (
                      <div>
                        <div className="text-xs uppercase text-gray-500">Membership</div>
                        <div>{doctor.membership}</div>
                      </div>
                    )}
                    {doctor.achievements && (
                      <div className="sm:col-span-2">
                        <div className="text-xs uppercase text-gray-500">Achievements</div>
                        <div>{doctor.achievements}</div>
                      </div>
                    )}
                    {doctor.specialNote && (
                      <div className="sm:col-span-2">
                        <div className="text-xs uppercase text-gray-500">Special Note</div>
                        <div>{doctor.specialNote}</div>
                      </div>
                    )}
                  </div>
                  <div className="mt-6 flex gap-3">
                    <Link to={`/appointments?doctor=${doctor._id}`} className="bg-blue-600 text-white hover:bg-blue-700 rounded-lg px-5 py-2 font-medium">Channel</Link>
                    <Link to="/doctors" className="border border-gray-300 hover:bg-gray-50 rounded-lg px-5 py-2 font-medium">Back to Doctors</Link>
                  </div>
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

export default DoctorProfile



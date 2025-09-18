import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar/Navbar';
import Footer from '../../components/Footer/Footer';
import { toast } from 'react-hot-toast';

const UserAppointments = () => {
  const { user, token } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // all, upcoming, past, cancelled
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  useEffect(() => {
    if (user && token) {
      fetchUserAppointments();
    }
  }, [user, token]);

  const fetchUserAppointments = async () => {
    try {
      setLoading(true);
      console.log('Fetching appointments with token:', token ? 'Token present' : 'No token');
      
      const response = await fetch('http://localhost:5001/api/bookings/user', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Appointments data:', data);
        setAppointments(data);
      } else {
        const errorData = await response.json();
        console.error('Error response:', errorData);
        setError(errorData.message || 'Failed to fetch appointments');
      }
    } catch (err) {
      setError('Network error occurred');
      console.error('Error fetching appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  const cancelAppointment = async (appointmentId) => {
    try {
      const response = await fetch(`http://localhost:5001/api/bookings/${appointmentId}/cancel`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        toast.success('Appointment cancelled successfully');
        fetchUserAppointments(); // Refresh the list
        setShowCancelModal(false);
        setSelectedAppointment(null);
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to cancel appointment');
      }
    } catch (err) {
      toast.error('Network error occurred');
      console.error('Error cancelling appointment:', err);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'no_show': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'confirmed': return '✅';
      case 'completed': return '🏥';
      case 'cancelled': return '❌';
      case 'no_show': return '👻';
      default: return '❓';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const isUpcoming = (appointment) => {
    const appointmentDate = new Date(appointment.date);
    const now = new Date();
    return appointmentDate > now && appointment.status !== 'cancelled' && appointment.status !== 'completed';
  };

  const isPast = (appointment) => {
    const appointmentDate = new Date(appointment.date);
    const now = new Date();
    return appointmentDate <= now || appointment.status === 'completed';
  };

  const filteredAppointments = appointments.filter(appointment => {
    switch (filter) {
      case 'upcoming': return isUpcoming(appointment);
      case 'past': return isPast(appointment);
      case 'cancelled': return appointment.status === 'cancelled';
      default: return true;
    }
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your appointments...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Appointments</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button 
              onClick={fetchUserAppointments}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Appointments</h1>
          <p className="text-gray-600">Manage your medical appointments and bookings</p>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { key: 'all', label: 'All Appointments', count: appointments.length },
                { key: 'upcoming', label: 'Upcoming', count: appointments.filter(isUpcoming).length },
                { key: 'past', label: 'Past', count: appointments.filter(isPast).length },
                { key: 'cancelled', label: 'Cancelled', count: appointments.filter(a => a.status === 'cancelled').length }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    filter === tab.key
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                  <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                    filter === tab.key
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Appointments List */}
        {filteredAppointments.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📅</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {filter === 'all' ? 'No Appointments Found' : `No ${filter.charAt(0).toUpperCase() + filter.slice(1)} Appointments`}
            </h3>
            <p className="text-gray-600 mb-6">
              {filter === 'all' 
                ? "You haven't booked any appointments yet."
                : `You don't have any ${filter} appointments.`
              }
            </p>
            <a
              href="/doctors"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Book an Appointment
            </a>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredAppointments.map((appointment) => (
              <div key={appointment._id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Appointment Header */}
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(appointment.status)}`}>
                          <span className="mr-1">{getStatusIcon(appointment.status)}</span>
                          {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1).replace('_', ' ')}
                        </div>
                        <div className="text-sm text-gray-500">
                          Ref: {appointment.referenceNo}
                        </div>
                        {appointment.slotNumber && (
                          <div className="text-sm text-blue-600 font-medium">
                            Slot #{appointment.slotNumber}
                          </div>
                        )}
                      </div>

                      {/* Doctor Info */}
                      <div className="mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          Dr. {appointment.doctorName}
                        </h3>
                        <p className="text-gray-600">{appointment.specialization}</p>
                      </div>

                      {/* Appointment Details */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 mb-2">Appointment Details</h4>
                          <div className="space-y-1 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <span>📅</span>
                              <span>{formatDate(appointment.date)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span>🕐</span>
                              <span>{formatTime(appointment.startTime)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span>🏥</span>
                              <span>{appointment.channel === 'online' ? 'Online Consultation' : 'In-Person'}</span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-sm font-medium text-gray-900 mb-2">Payment Info</h4>
                          <div className="space-y-1 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <span>💰</span>
                              <span>LKR {appointment.paymentStatus === 'paid' ? 'Paid' : 'Pending'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span>💳</span>
                              <span className="capitalize">{appointment.paymentStatus}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Notes */}
                      {appointment.notes && (
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-gray-900 mb-1">Notes</h4>
                          <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                            {appointment.notes}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 ml-4">
                      {isUpcoming(appointment) && appointment.status !== 'cancelled' && (
                        <button
                          onClick={() => {
                            setSelectedAppointment(appointment);
                            setShowCancelModal(true);
                          }}
                          className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                        >
                          Cancel
                        </button>
                      )}
                      
                      {appointment.status === 'completed' && (
                        <button className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors">
                          View Prescription
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="text-red-500 text-2xl">⚠️</div>
              <h3 className="text-lg font-semibold text-gray-900">Cancel Appointment</h3>
            </div>
            
            <p className="text-gray-600 mb-6">
              Are you sure you want to cancel your appointment with Dr. {selectedAppointment.doctorName} 
              on {formatDate(selectedAppointment.date)} at {formatTime(selectedAppointment.startTime)}?
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setSelectedAppointment(null);
                }}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Keep Appointment
              </button>
              <button
                onClick={() => cancelAppointment(selectedAppointment._id)}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default UserAppointments;

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar/Navbar';
import Footer from '../../components/Footer/Footer';

const UserAppointments = () => {
  const { user, token } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // all, upcoming, past, cancelled

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

  const downloadAppointmentDetails = (appointment) => {
    // Create HTML content for PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Appointment Details - ${appointment.referenceNo}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 40px;
            line-height: 1.8;
            color: #333;
          }
          .header {
            text-align: center;
            border-bottom: 3px solid #2563eb;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .header h1 {
            color: #2563eb;
            margin: 0;
            font-size: 28px;
          }
          .header p {
            color: #666;
            margin: 5px 0 0 0;
            font-size: 14px;
          }
          .info-item {
            margin-bottom: 15px;
            font-size: 16px;
          }
          .info-item strong {
            color: #2563eb;
            font-weight: bold;
            margin-right: 10px;
          }
          .notes {
            margin-top: 20px;
            padding: 15px;
            background: #f8fafc;
            border-left: 4px solid #2563eb;
            border-radius: 4px;
          }
          .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 12px;
          }
          @media print {
            body { margin: 20px; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>MediCare</h1>
          <p>Appointment Details</p>
        </div>

        <div class="info-item">
          <strong>Appointment Reference Number:</strong> ${appointment.referenceNo}
        </div>
        
        <div class="info-item">
          <strong>Slot Number:</strong> ${appointment.slotNumber || 'N/A'}
        </div>
        
        <div class="info-item">
          <strong>Date:</strong> ${formatDate(appointment.date)}
        </div>
        
        <div class="info-item">
          <strong>Time:</strong> ${appointment.slotTime ? formatTime(appointment.slotTime) : formatTime(appointment.startTime)}
        </div>
        
        <div class="info-item">
          <strong>Doctor Name:</strong> Dr. ${appointment.doctorName}
        </div>
        
        <div class="info-item">
          <strong>Specialization:</strong> ${appointment.specialization}
        </div>
        
        <div class="info-item">
          <strong>Patient Name:</strong> ${appointment.patientName}
        </div>
        
        <div class="info-item">
          <strong>Email:</strong> ${appointment.patientEmail}
        </div>
        
        <div class="info-item">
          <strong>Phone:</strong> ${appointment.patientPhone}
        </div>
        
        <div class="info-item">
          <strong>Gender:</strong> ${appointment.patientGender}
        </div>
        
        <div class="info-item">
          <strong>Age:</strong> ${appointment.patientAge}
        </div>
        
        <div class="info-item">
          <strong>Ongoing Condition:</strong> ${appointment.ongoingCondition}
        </div>

        ${appointment.notes ? `
        <div class="notes">
          <strong>Notes:</strong> ${appointment.notes}
        </div>
        ` : ''}

        <div class="footer">
          <p>Generated on ${new Date().toLocaleString()}</p>
          <p>MediCare - Your Health, Our Priority</p>
        </div>
      </body>
      </html>
    `;

    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Wait for content to load, then trigger print
    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
      
      // Close the window after a delay
      setTimeout(() => {
        printWindow.close();
      }, 1000);
    };
  };

  const isUpcoming = (appointment) => {
    const appointmentDate = new Date(appointment.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of today
    
    // Debug logging
    console.log('Appointment:', appointment.referenceNo, 'Date:', appointmentDate, 'Today:', today, 'Is Upcoming:', appointmentDate >= today);
    
    return appointmentDate >= today;
  };

  const isPast = (appointment) => {
    const appointmentDate = new Date(appointment.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of today
    
    // Debug logging
    console.log('Appointment:', appointment.referenceNo, 'Date:', appointmentDate, 'Today:', today, 'Is Past:', appointmentDate < today);
    
    return appointmentDate < today;
  };

  const filteredAppointments = appointments.filter(appointment => {
    switch (filter) {
      case 'upcoming': return isUpcoming(appointment);
      case 'past': return isPast(appointment);
      case 'cancelled': return false; // No cancelled appointments since status field was removed
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
                { key: 'past', label: 'Past', count: appointments.filter(isPast).length }
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
            {filteredAppointments.map((appointment) => {
              // Debug: Log appointment data to check for reschedule fields
              console.log('Appointment data:', {
                id: appointment._id,
                rescheduleReason: appointment.appointmentId?.rescheduleReason,
                rescheduledAt: appointment.appointmentId?.rescheduledAt,
                doctorName: appointment.doctorName
              });
              
              return (
              <div key={appointment._id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      

                      {/* Doctor Info */}
                      <div className="mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          Dr. {appointment.doctorName}
                        </h3>
                        <p className="text-gray-600">{appointment.specialization}</p>
                      </div>

                      {/* Appointment Details */}
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Appointment Details</h4>
                        <div className="space-y-1 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <span>📅</span>
                            <span>{formatDate(appointment.date)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span>🕐</span>
                            <span>{appointment.slotTime ? formatTime(appointment.slotTime) : formatTime(appointment.startTime)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Reschedule Alert */}
                      {appointment.appointmentId?.rescheduleReason && (
                        <div className="mb-4">
                          <div className="bg-red-100 border-2 border-red-300 rounded-lg p-4 shadow-sm">
                            <div className="flex items-start gap-3">
                              <div className="text-red-600 text-xl">🚨</div>
                              <div className="flex-1">
                                <h4 className="text-base font-bold text-red-900 mb-2">⚠️ APPOINTMENT RESCHEDULED</h4>
                                <div className="bg-white rounded p-3 border border-red-200">
                                  <p className="text-sm font-semibold text-red-800 mb-1">Reschedule Reason:</p>
                                  <p className="text-sm text-red-700 font-medium">
                                    {appointment.appointmentId.rescheduleReason}
                                  </p>
                                  {appointment.appointmentId.rescheduledAt && (
                                    <p className="text-xs text-red-600 mt-2 pt-2 border-t border-red-200">
                                      <strong>Rescheduled on:</strong> {new Date(appointment.appointmentId.rescheduledAt).toLocaleDateString('en-US', {
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 ml-4">
                      <button
                        onClick={() => downloadAppointmentDetails(appointment)}
                        className="px-4 py-2 text-sm font-medium text-green-600 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
                      >
                        📄 Download PDF
                      </button>
                      
                    </div>
                  </div>
                </div>
              </div>
              );
            })}
          </div>
        )}
      </div>


      <Footer />
    </div>
  );
};

export default UserAppointments;

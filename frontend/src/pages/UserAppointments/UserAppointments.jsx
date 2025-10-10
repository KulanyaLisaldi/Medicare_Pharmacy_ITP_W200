import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar/Navbar';
import Footer from '../../components/Footer/Footer';
import { jsPDF } from 'jspdf';

const UserAppointments = () => {
  const { user, token } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // all, upcoming, past, cancelled
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [messageError, setMessageError] = useState('');
  const [messageSuccess, setMessageSuccess] = useState('');

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

  // Handle message modal opening
  const handleMessageClick = (appointment) => {
    setSelectedAppointment(appointment);
    setShowMessageModal(true);
    setMessageText('');
    setUploadedFile(null);
    setMessageError('');
    setMessageSuccess('');
  };

  // Handle sending message
  const handleSendMessage = async () => {
    if (!messageText.trim()) {
      setMessageError('Please enter a message');
      return;
    }

    if (!selectedAppointment) {
      setMessageError('No appointment selected');
      return;
    }

    setSendingMessage(true);
    setMessageError('');
    setMessageSuccess('');

    try {
      // Create FormData for message with optional file
      const formData = new FormData();
      formData.append('receiverId', selectedAppointment.doctorId._id || selectedAppointment.doctorId);
      formData.append('message', messageText.trim());
      formData.append('appointmentId', selectedAppointment._id);

      // Add uploaded file if exists
      if (uploadedFile) {
        formData.append('document', uploadedFile);
      }

      const response = await fetch('http://localhost:5001/api/messages/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        setMessageSuccess('Message sent successfully!');
        setMessageText('');
        setUploadedFile(null);
        
        // Close modal after 2 seconds
        setTimeout(() => {
          setShowMessageModal(false);
          setMessageSuccess('');
        }, 2000);
        
        // Show success message with link to messages
        setTimeout(() => {
          alert('Message sent successfully! You can view your conversations in the "My Messages" section.');
        }, 2500);
      } else {
        const errorData = await response.json();
        setMessageError(errorData.message || 'Failed to send message');
      }
    } catch (err) {
      setMessageError('Network error. Please try again.');
    } finally {
      setSendingMessage(false);
    }
  };

  const downloadAppointmentDetails = async (appointment) => {
    try {
      console.log('Starting PDF generation for appointment:', appointment);
      
      // Try to import jsPDF dynamically if not available
      let PDF;
      if (typeof jsPDF === 'undefined') {
        console.log('jsPDF not available, importing dynamically...');
        const jsPDFModule = await import('jspdf');
        PDF = jsPDFModule.jsPDF;
        console.log('jsPDF imported successfully:', PDF);
      } else {
        console.log('jsPDF available:', jsPDF);
        PDF = jsPDF;
      }
      
      // Create new PDF document
      console.log('Creating PDF document...');
      const doc = new PDF();
      
      // Set up colors
      const primaryColor = [37, 99, 235]; // Blue
      const secondaryColor = [102, 102, 102]; // Gray
      const accentColor = [16, 185, 129]; // Green
      
      // User-Friendly Header
      doc.setFillColor(...primaryColor);
      doc.rect(0, 0, 210, 45, 'F');
      
      // MediCare Title
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('MediCare', 105, 15, { align: 'center' });
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text('Your Health, Our Priority', 105, 25, { align: 'center' });
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Appointment Confirmation', 105, 35, { align: 'center' });
      
      // Reset colors
      doc.setTextColor(0, 0, 0);
      
      // Main content area
      let yPosition = 55;
      const leftMargin = 20;
      const rightMargin = 190;
      
      // Reference Number Section
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...primaryColor);
      doc.text('Reference Number:', leftMargin, yPosition);
      
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text(String(appointment.referenceNo || 'N/A'), leftMargin + 5, yPosition + 8);
      
      yPosition += 20;
      
      // Appointment Time Section
      const appointmentTime = appointment.slotTime ? formatTime(appointment.slotTime) : (appointment.startTime ? formatTime(appointment.startTime) : 'N/A');
      const appointmentDate = appointment.date ? formatDate(appointment.date) : 'N/A';
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...primaryColor);
      doc.text('Appointment Time:', leftMargin, yPosition);
      
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text(`${appointmentDate} at ${appointmentTime}`, leftMargin + 5, yPosition + 8);
      
      yPosition += 25;
      
      // Patient Information Section
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...primaryColor);
      doc.text('Patient Information', leftMargin, yPosition);
      yPosition += 15;
      
      const patientDetails = [
        { label: 'Name', value: String(appointment.patientName || 'N/A') },
        { label: 'Age', value: String(appointment.patientAge || 'N/A') },
        { label: 'Gender', value: String(appointment.patientGender || 'N/A') },
        { label: 'Phone', value: String(appointment.patientPhone || 'N/A') },
        { label: 'Email', value: String(appointment.patientEmail || 'N/A') },
        { label: 'Ongoing Condition', value: String(appointment.ongoingCondition || 'N/A') }
      ];
      
      patientDetails.forEach(detail => {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
        doc.text(`${detail.label}: ${detail.value}`, leftMargin + 10, yPosition);
        yPosition += 8;
      });
      
      yPosition += 10;
      
      // Doctor Details Section
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...primaryColor);
      doc.text('Doctor Details', leftMargin, yPosition);
      yPosition += 15;
      
      const doctorDetails = [
        { label: 'Doctor', value: String(appointment.doctorName ? `Dr. ${appointment.doctorName}` : 'N/A') },
        { label: 'Specialization', value: String(appointment.specialization || 'N/A') }
      ];
      
      doctorDetails.forEach(detail => {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
        doc.text(`${detail.label}: ${detail.value}`, leftMargin + 10, yPosition);
        yPosition += 8;
      });
      
      yPosition += 10;
      
      // Notes Section
      if (appointment.notes) {
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...primaryColor);
        doc.text('Notes', leftMargin, yPosition);
        yPosition += 15;
        
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
        doc.text(String(appointment.notes), leftMargin + 10, yPosition);
        yPosition += 15;
      }
      
      // Footer
      yPosition += 10;
      doc.setFontSize(10);
      doc.setTextColor(...secondaryColor);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, leftMargin, yPosition);
      doc.text('Support: support@medicare.com', leftMargin, yPosition + 8);
      
      // Add page border
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.5);
      doc.rect(10, 10, 190, 280, 'S');
      
      // Download the PDF
      const referenceNo = appointment.referenceNo || 'unknown';
      const filename = `appointment-${referenceNo}-${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(filename);
      
      console.log('PDF generated successfully');
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        appointment: appointment
      });
      alert(`Failed to generate PDF: ${error.message}. Please try again.`);
    }
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
                rescheduleReason: appointment.rescheduleReason,
                rescheduledAt: appointment.rescheduledAt,
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
                      {appointment.rescheduleReason && (
                        <div className="mb-4">
                          <div className="bg-red-100 border-2 border-red-300 rounded-lg p-4 shadow-sm">
                            <div className="flex items-start gap-3">
                              <div className="text-red-600 text-xl">🚨</div>
                              <div className="flex-1">
                                <h4 className="text-base font-bold text-red-900 mb-2">⚠️ APPOINTMENT RESCHEDULED</h4>
                                <div className="bg-white rounded p-3 border border-red-200">
                                  <p className="text-sm font-semibold text-red-800 mb-1">Reschedule Reason:</p>
                                  <p className="text-sm text-red-700 font-medium">
                                    {appointment.rescheduleReason}
                                  </p>
                                  {appointment.rescheduledAt && (
                                    <p className="text-xs text-red-600 mt-2 pt-2 border-t border-red-200">
                                      <strong>Rescheduled on:</strong> {new Date(appointment.rescheduledAt).toLocaleDateString('en-US', {
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
                      <button
                        onClick={() => handleMessageClick(appointment)}
                        className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        💬 Message Doctor
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

      {/* Message Modal */}
      {showMessageModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-2xl rounded-xl shadow-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Message Doctor</h2>
              <button 
                onClick={() => setShowMessageModal(false)}
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6">
              {/* Doctor Information */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">Sending message to:</h3>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-xl">
                    👨‍⚕️
                  </div>
                  <div>
                    <p className="font-medium text-blue-900">
                      Dr. {selectedAppointment.doctorId?.firstName || selectedAppointment.doctorName} {selectedAppointment.doctorId?.lastName || ''}
                    </p>
                    <p className="text-sm text-blue-700">
                      {selectedAppointment.doctorId?.specialization || selectedAppointment.specialization}
                    </p>
                  </div>
                </div>
              </div>

              {/* Message Form */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Message *
                  </label>
                  <textarea
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Type your message to the doctor..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={4}
                    required
                  />
                </div>

                {/* File Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Attach Document (Optional)
                  </label>
                  <div className="mt-1">
                    <input
                      type="file"
                      id="message-file-upload"
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
                      htmlFor="message-file-upload"
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
                            document.getElementById('message-file-upload').value = '';
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

                {/* Error/Success Messages */}
                {messageError && (
                  <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg p-3 text-sm">
                    {messageError}
                  </div>
                )}
                {messageSuccess && (
                  <div className="bg-green-50 text-green-700 border border-green-200 rounded-lg p-3 text-sm">
                    {messageSuccess}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button 
                    onClick={() => setShowMessageModal(false)}
                    className="px-6 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 font-medium"
                    disabled={sendingMessage}
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSendMessage}
                    disabled={sendingMessage || !messageText.trim()}
                    className="px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 font-medium"
                  >
                    {sendingMessage ? 'Sending...' : 'Send Message'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default UserAppointments;

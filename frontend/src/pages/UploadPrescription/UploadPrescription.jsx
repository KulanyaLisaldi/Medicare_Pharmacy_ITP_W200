import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar/Navbar';
import Footer from '../../components/Footer/Footer';
import { useAuth } from '../../context/AuthContext';

const UploadPrescription = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    prescriptionFile: null,
    patientName: '',
    patientPhone: '',
    patientAddress: '',
    notes: '',
    paymentMethod: 'cod',
    deliveryType: 'home_delivery'
  });
  const [fieldErrors, setFieldErrors] = useState({
    patientName: '',
    patientPhone: ''
  });

  // Auto-fill user data when component mounts
  useEffect(() => {
    if (user) {
      // Auto-fill patient name with user's full name
      if (user.firstName || user.lastName) {
        const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
        setFormData(prev => ({ ...prev, patientName: fullName }));
      }
      
      // Auto-fill patient phone with user's phone
      if (user.phone) {
        setFormData(prev => ({ ...prev, patientPhone: user.phone }));
      }
    }
  }, [user]);

  const handleFileChange = (e) => {
    setFormData({ ...formData, prescriptionFile: e.target.files[0] });
  };

  // Validation functions
  const preventInvalidNameChar = (e) => {
    const isNameField = e.target.name === 'patientName';
    if (!isNameField) return;
    const key = e.key || '';
    if (e.type === 'keydown') {
      const controlKeys = ['Backspace','Tab','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End','Delete'];
      if (controlKeys.includes(key)) return;
      // Block any non-letter characters (including numbers, symbols, etc.)
      if (!/^[A-Za-z ]$/.test(key)) {
        e.preventDefault();
        if (/^[0-9]$/.test(key)) {
          setFieldErrors(prev => ({
            ...prev,
            [e.target.name]: 'Numbers are not allowed in name fields'
          }));
        } else {
          setFieldErrors(prev => ({
            ...prev,
            [e.target.name]: 'Only letters and spaces are allowed'
          }));
        }
      }
    }
  };

  const preventInvalidNamePaste = (e) => {
    const isNameField = e.target.name === 'patientName';
    if (!isNameField) return;
    const pasted = (e.clipboardData || window.clipboardData).getData('text');
    if (pasted && !/^[A-Za-z ]+$/.test(pasted)) {
      e.preventDefault();
      if (/[0-9]/.test(pasted)) {
        setFieldErrors(prev => ({
          ...prev,
          [e.target.name]: 'Numbers are not allowed in name fields'
        }));
      } else {
        setFieldErrors(prev => ({
          ...prev,
          [e.target.name]: 'Only letters and spaces are allowed'
        }));
      }
    }
  };

  const handlePhoneKeyDown = (e) => {
    const { name } = e.target;
    if (name === 'patientPhone') {
      const current = e.target.value || '';
      const key = e.key || '';
      
      // Allow control keys
      const controlKeys = ['Backspace','Tab','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End','Delete'];
      if (controlKeys.includes(key)) return;
      
      // Block any non-digit characters (letters, symbols, etc.)
      if (!/^[0-9]$/.test(key)) {
        e.preventDefault();
        if (/^[A-Za-z]$/.test(key)) {
          setFieldErrors(prev => ({
            ...prev,
            [name]: 'Letters are not allowed in phone number'
          }));
        } else if (key === '-') {
          setFieldErrors(prev => ({
            ...prev,
            [name]: 'Minus (-) values are not allowed'
          }));
        } else {
          setFieldErrors(prev => ({
            ...prev,
            [name]: 'Only numbers are allowed in phone number'
          }));
        }
        return;
      }
      
      // Check length limit - exactly 10 digits
      if (/^[0-9]$/.test(key) && current.length >= 10) {
        e.preventDefault();
        setFieldErrors(prev => ({
          ...prev,
          [name]: 'Phone number must be exactly 10 digits'
        }));
      }
    }
  };

  const handlePhonePaste = (e) => {
    const { name } = e.target;
    if (name === 'patientPhone') {
      const pastedText = (e.clipboardData || window.clipboardData).getData('text');
      const digitsOnly = pastedText.replace(/\D/g, '');
      
      // Block if contains letters
      if (/[A-Za-z]/.test(pastedText)) {
        e.preventDefault();
        setFieldErrors(prev => ({
          ...prev,
          [name]: 'Letters are not allowed in phone number'
        }));
      } else if (pastedText.includes('-')) {
        e.preventDefault();
        setFieldErrors(prev => ({
          ...prev,
          [name]: 'Minus (-) values are not allowed'
        }));
      } else if (digitsOnly.length > 10) {
        e.preventDefault();
        setFieldErrors(prev => ({
          ...prev,
          [name]: 'Phone number must be exactly 10 digits'
        }));
      } else if (!/^[0-9]+$/.test(pastedText)) {
        e.preventDefault();
        setFieldErrors(prev => ({
          ...prev,
          [name]: 'Only numbers are allowed in phone number'
        }));
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    setFormData({ ...formData, [name]: value });
    
    // Clear field-specific error when user types
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    
    // Real-time validation for name field
    if (name === 'patientName') {
      if (/[0-9]/.test(value)) {
        setFieldErrors(prev => ({
          ...prev,
          [name]: 'Numbers are not allowed in name fields'
        }));
      } else if (value.trim() && !/^[A-Za-z ]+$/.test(value)) {
        setFieldErrors(prev => ({
          ...prev,
          [name]: 'Only letters and spaces are allowed'
        }));
      } else {
        setFieldErrors(prev => ({
          ...prev,
          [name]: ''
        }));
      }
    }
    
    // Real-time validation for phone field
    if (name === 'patientPhone') {
      // Remove all non-digit characters and limit to 10 digits
      const digitsOnly = value.replace(/\D/g, '').slice(0, 10);
      
      // Update the form with cleaned value
      setFormData(prev => ({ ...prev, [name]: digitsOnly }));
      
      // Check for letters in original input
      if (/[A-Za-z]/.test(value)) {
        setFieldErrors(prev => ({
          ...prev,
          [name]: 'Letters are not allowed in phone number'
        }));
      } else if (value.trim() && digitsOnly.length === 10 && !/^07\d{8}$/.test(digitsOnly)) {
        setFieldErrors(prev => ({
          ...prev,
          [name]: 'Phone must be 10 digits (Sri Lanka format: 07XXXXXXXX)'
        }));
      } else {
        setFieldErrors(prev => ({
          ...prev,
          [name]: ''
        }));
      }
      return; // Exit early to prevent double setting
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // First upload the prescription file
      const formDataToSend = new FormData();
      formDataToSend.append('prescriptionFile', formData.prescriptionFile);

      const uploadResponse = await fetch('http://localhost:5001/api/prescriptions/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend
      });

      const uploadData = await uploadResponse.json();

      if (!uploadResponse.ok) {
        throw new Error(uploadData.message || 'Failed to upload prescription');
      }

      // Then create the prescription order
      const orderData = {
        prescriptionFile: uploadData.fileName,
        prescriptionDetails: {
          patientName: formData.patientName,
          patientPhone: formData.patientPhone,
          patientAddress: formData.patientAddress,
          notes: formData.notes,
          prescriptionNumber: uploadData.prescriptionNumber
        },
        customer: {
          name: user.firstName + ' ' + user.lastName,
          phone: user.phone || formData.patientPhone,
          address: formData.patientAddress || user.address,
          notes: formData.notes
        },
        paymentMethod: formData.paymentMethod,
        deliveryType: formData.deliveryType,
        total: 0 // Will be calculated by pharmacist
      };

      const orderResponse = await fetch('http://localhost:5001/api/prescriptions/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(orderData)
      });

      const orderResult = await orderResponse.json();

      if (!orderResponse.ok) {
        throw new Error(orderResult.message || 'Failed to create prescription order');
      }

      setSuccess('Prescription order created successfully! Our pharmacist will review it and contact you soon.');
      setFormData({
        prescriptionFile: null,
        patientName: '',
        patientPhone: '',
        patientAddress: '',
        notes: '',
        paymentMethod: 'cod',
        deliveryType: 'home_delivery'
      });

      // Reset file input
      const fileInput = document.getElementById('prescriptionFile');
      if (fileInput) fileInput.value = '';

    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Please log in to upload prescription</h1>
          <button onClick={() => navigate('/login')} className="btn-primary">Sign In</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Upload Prescription</h1>
          
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <span className="text-red-500 mr-2">⚠️</span>
                <span className="text-red-700">{error}</span>
              </div>
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center">
                <span className="text-green-500 mr-2">✅</span>
                <span className="text-green-700">{success}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Prescription File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prescription File *
              </label>
              <input
                type="file"
                id="prescriptionFile"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">Supported formats: PDF, JPG, JPEG, PNG</p>
            </div>

            {/* Patient Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="patientName"
                  value={formData.patientName}
                  onChange={handleInputChange}
                  onKeyDown={preventInvalidNameChar}
                  onPaste={preventInvalidNamePaste}
                  required
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${fieldErrors.patientName ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                />
                {fieldErrors.patientName && (
                  <p className="text-xs text-red-600 mt-1">{fieldErrors.patientName}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="patientPhone"
                  value={formData.patientPhone}
                  onChange={handleInputChange}
                  onKeyDown={handlePhoneKeyDown}
                  onPaste={handlePhonePaste}
                  required
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${fieldErrors.patientPhone ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                  placeholder="07XXXXXXXX"
                />
                {fieldErrors.patientPhone && (
                  <p className="text-xs text-red-600 mt-1">{fieldErrors.patientPhone}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Delivery Address *
              </label>
              <textarea
                name="patientAddress"
                value={formData.patientAddress}
                onChange={handleInputChange}
                required
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>


            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Any special instructions or notes..."
              />
            </div>

            {/* Payment and Delivery Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Method
                </label>
                <select
                  name="paymentMethod"
                  value={formData.paymentMethod}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="cod">Cash on Delivery</option>
                  <option value="online">Online Payment</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Delivery Type
                </label>
                <select
                  name="deliveryType"
                  value={formData.deliveryType}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="home_delivery">Home Delivery</option>
                  <option value="pickup">Pickup from Store</option>
                </select>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
              >
                {loading ? 'Creating Order...' : 'Create Prescription Order'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default UploadPrescription;

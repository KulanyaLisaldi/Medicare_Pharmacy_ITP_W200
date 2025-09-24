import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Auth.css';
import { toast } from 'react-hot-toast';
import slide1 from '../../assets/slide1.jpg';

const Register = () => {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
        address: '',
        phone: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [registrationSuccess, setRegistrationSuccess] = useState(false);
    const [userEmail, setUserEmail] = useState('');
    const [fieldErrors, setFieldErrors] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
        address: '',
        phone: ''
    });
    
    const { register } = useAuth();
    const navigate = useNavigate();

    const preventInvalidFirstChar = (e) => {
        const isNameField = e.target.name === 'firstName' || e.target.name === 'lastName';
        if (!isNameField) return;
            const key = e.key || '';
            if (e.type === 'keydown') {
                // Allow control keys (Backspace, Tab, Arrow keys, etc.)
                const controlKeys = ['Backspace','Tab','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End','Delete'];
                if (controlKeys.includes(key)) return;
            // Block any non-letter characters (including numbers, symbols, etc.)
            if (!/^[A-Za-z ]$/.test(key)) {
                    e.preventDefault();
                // Show error message for numbers
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

    const preventInvalidPasteFirstChar = (e) => {
        const isNameField = e.target.name === 'firstName' || e.target.name === 'lastName';
        if (!isNameField) return;
            const pasted = (e.clipboardData || window.clipboardData).getData('text');
        if (pasted && !/^[A-Za-z ]+$/.test(pasted)) {
                e.preventDefault();
            // Show error message for pasted content with numbers
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

    const handleChange = (e) => {
        const { name, value } = e.target;
        
        setFormData({
            ...formData,
            [name]: value
        });
        
        // Clear general error when user types
        setError('');
        
        // Clear field-specific error when user types
        if (fieldErrors[name]) {
            setFieldErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
        
        // Real-time validation for name fields
        if (name === 'firstName' || name === 'lastName') {
            // Check if the value contains numbers
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
        
        // Real-time validation for email field
        if (name === 'email') {
            if (value.trim() && !value.includes('@')) {
                setFieldErrors(prev => ({
                    ...prev,
                    [name]: 'Email must contain @ symbol'
                }));
            } else if (value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                setFieldErrors(prev => ({
                    ...prev,
                    [name]: 'Please enter a valid email address'
                }));
            } else {
                setFieldErrors(prev => ({
                    ...prev,
                    [name]: ''
                }));
            }
        }
        
        // Real-time validation for phone field
        if (name === 'phone') {
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

    const validateForm = () => {
        let hasErrors = false;
        const newFieldErrors = { ...fieldErrors };
        
        // Names: letters and spaces only
        const nameRegex = /^[A-Za-z ]+$/;
        if (!nameRegex.test(formData.firstName)) {
            if (/[0-9]/.test(formData.firstName)) {
                newFieldErrors.firstName = 'Numbers are not allowed in first name';
            } else {
                newFieldErrors.firstName = 'First name should contain only letters and spaces';
            }
            hasErrors = true;
        } else {
            newFieldErrors.firstName = '';
        }
        
        if (!nameRegex.test(formData.lastName)) {
            if (/[0-9]/.test(formData.lastName)) {
                newFieldErrors.lastName = 'Numbers are not allowed in last name';
            } else {
                newFieldErrors.lastName = 'Last name should contain only letters and spaces';
            }
            hasErrors = true;
        } else {
            newFieldErrors.lastName = '';
        }
        
        // Email validation
        if (!formData.email.trim()) {
            newFieldErrors.email = 'Email is required';
            hasErrors = true;
        } else if (!formData.email.includes('@')) {
            newFieldErrors.email = 'Email must contain @ symbol';
            hasErrors = true;
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newFieldErrors.email = 'Please enter a valid email address';
            hasErrors = true;
        } else {
            newFieldErrors.email = '';
        }
        
        setFieldErrors(newFieldErrors);
        
        if (hasErrors) {
            setError('Please fix the errors in the form');
            return false;
        }
        // Address required
        if (!formData.address.trim()) {
            setError('Address is required for delivery');
            return false;
        }
        
        // Phone validation
        const digitsOnly = formData.phone.replace(/\D/g, '');
        if (!formData.phone.trim()) {
            newFieldErrors.phone = 'Phone number is required';
            hasErrors = true;
        } else if (/[A-Za-z]/.test(formData.phone)) {
            newFieldErrors.phone = 'Letters are not allowed in phone number';
            hasErrors = true;
        } else if (digitsOnly.length > 10) {
            newFieldErrors.phone = 'Phone number must be exactly 10 digits';
            hasErrors = true;
        } else if (!/^07\d{8}$/.test(formData.phone)) {
            newFieldErrors.phone = 'Phone must be 10 digits (Sri Lanka format: 07XXXXXXXX)';
            hasErrors = true;
        } else {
            newFieldErrors.phone = '';
        }
        
        if (hasErrors) {
            setFieldErrors(newFieldErrors);
            setError('Please fix the errors in the form');
            return false;
        }
        // Password complexity
        const pwRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@#$%!]).{8,}$/;
        if (!pwRegex.test(formData.password)) {
            setError('Password must be 8+ chars with uppercase, lowercase, number and special (@,#,$,%,!)');
            return false;
        }
        // Confirm
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return false;
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        setLoading(true);
        setError('');

        // Remove confirmPassword before sending to API
        const { confirmPassword, ...registrationData } = formData;

        const result = await register(registrationData);
        
        if (result.success) {
            setUserEmail(formData.email);
            setRegistrationSuccess(true);
            toast.success('Account created successfully! Please check your email for verification.');
        } else {
            setError(result.message);
            toast.error(result.message || 'Registration failed');
        }
        
        setLoading(false);
    };

    if (registrationSuccess) {
        return (
            <div className="auth-container" style={{
                backgroundImage: `url(${slide1})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat'
            }}>
                <div className="auth-card" style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)'
                }}>
                    <div className="auth-header">
                        <div className="auth-logo">
                            <div className="logo-icon">M</div>
                            <h1>MediCare</h1>
                        </div>
                        <h2>Account Created Successfully! 🎉</h2>
                        <p>Please verify your email to continue</p>
                    </div>

                    <div className="verification-message">
                        <div className="verification-icon">📧</div>
                        <h3>Check Your Email</h3>
                        <p>
                            We've sent a verification link to <strong>{userEmail}</strong>
                        </p>
                        <p>
                            Click the link in your email to verify your account and get started with MediCare.
                        </p>
                        
                        <div className="verification-steps">
                            <div className="step">
                                <span className="step-number">1</span>
                                <span>Check your email inbox</span>
                            </div>
                            <div className="step">
                                <span className="step-number">2</span>
                                <span>Click the verification link</span>
                            </div>
                            <div className="step">
                                <span className="step-number">3</span>
                                <span>Log in to your account</span>
                            </div>
                        </div>

                        <div className="verification-actions">
                            <button 
                                onClick={() => navigate('/login')} 
                                className="auth-button secondary"
                            >
                                Go to Login
                            </button>
                            <button 
                                onClick={() => setRegistrationSuccess(false)} 
                                className="auth-button"
                            >
                                Create Another Account
                            </button>
                        </div>
                    </div>

                    <div className="auth-footer">
                        <p>
                            Didn't receive the email?{' '}
                            <Link to="/login" className="auth-link">
                                Check spam folder or contact support
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-container" style={{
            backgroundImage: `url(${slide1})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
        }}>
            <div className="auth-card" style={{
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '2rem',
                alignItems: 'center',
                minHeight: '500px',
                maxWidth: '800px',
                width: '80%',
                margin: '0 auto'
            }}>
                {/* Left Side - Text Content */}
                <div className="auth-text-content" style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    padding: '2rem',
                    color: 'white'
                }}>
                    <div className="auth-logo" style={{ marginBottom: '2rem' }}>
                        <div className="logo-icon" style={{
                            width: '60px',
                            height: '60px',
                            backgroundColor: 'rgba(255, 255, 255, 0.2)',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '24px',
                            fontWeight: 'bold',
                            color: 'white',
                            marginBottom: '1rem'
                        }}>M</div>
                        <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: '0' }}>MediCare</h1>
                    </div>
                    <h2 style={{ fontSize: '2rem', fontWeight: '600', marginBottom: '1rem' }}>Join Our Community</h2>
                    <p style={{ fontSize: '1.1rem', opacity: '0.9', lineHeight: '1.6' }}>
                        Create your account and start your healthcare journey with us. 
                        Get access to medical services, book appointments, and manage your health records.
                    </p>
                    <div style={{ marginTop: '2rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                            <div style={{ width: '8px', height: '8px', backgroundColor: 'white', borderRadius: '50%', marginRight: '12px' }}></div>
                            <span>Free Registration</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                            <div style={{ width: '8px', height: '8px', backgroundColor: 'white', borderRadius: '50%', marginRight: '12px' }}></div>
                            <span>Secure & Private</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <div style={{ width: '8px', height: '8px', backgroundColor: 'white', borderRadius: '50%', marginRight: '12px' }}></div>
                            <span>24/7 Support</span>
                        </div>
                    </div>
                    </div>

                {/* Right Side - Form */}
                <div className="auth-form-container" style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    padding: '2rem'
                }}>
                    <div className="auth-header" style={{ marginBottom: '2rem', textAlign: 'center' }}>
                        <h2 style={{ color: 'black', fontSize: '1.8rem', fontWeight: '600', marginBottom: '0.5rem', textAlign: 'center' }}>Create Account</h2>
                        <p style={{ color: 'rgba(15, 15, 15, 0.8)', fontSize: '0.9rem', textAlign: 'center' }}>Join MediCare Today!</p>
                </div>

                <form onSubmit={handleSubmit} className="auth-form">
                    {error && (
                        <div className="error-message">
                            {error}
                        </div>
                    )}

                    <div className="form-group">
                        <label htmlFor="firstName">First Name</label>
                        <input
                            type="text"
                            id="firstName"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleChange}
                            onKeyDown={preventInvalidFirstChar}
                            onPaste={preventInvalidPasteFirstChar}
                            required
                            placeholder="Enter your first name"
                            className={fieldErrors.firstName ? 'error' : ''}
                        />
                        {fieldErrors.firstName && (
                            <div className="field-error">
                                {fieldErrors.firstName}
                            </div>
                        )}
                    </div>

                    <div className="form-group">
                        <label htmlFor="lastName">Last Name</label>
                        <input
                            type="text"
                            id="lastName"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleChange}
                            onKeyDown={preventInvalidFirstChar}
                            onPaste={preventInvalidPasteFirstChar}
                            required
                            placeholder="Enter your last name"
                            className={fieldErrors.lastName ? 'error' : ''}
                        />
                        {fieldErrors.lastName && (
                            <div className="field-error">
                                {fieldErrors.lastName}
                            </div>
                        )}
                    </div>

                    <div className="form-group">
                        <label htmlFor="email">Email Address</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            placeholder="Enter your email"
                            className={fieldErrors.email ? 'error' : ''}
                        />
                        {fieldErrors.email && (
                            <div className="field-error">
                                {fieldErrors.email}
                            </div>
                        )}
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="password">Password</label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                placeholder="Enter password"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="confirmPassword">Confirm Password</label>
                            <input
                                type="password"
                                id="confirmPassword"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                required
                                placeholder="Confirm password"
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="address">Address</label>
                        <textarea
                            id="address"
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            required
                            placeholder="Enter your address"
                            rows="3"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="phone">Phone Number</label>
                        <input
                            type="tel"
                            id="phone"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            required
                            placeholder="Enter your phone number"
                            className={fieldErrors.phone ? 'error' : ''}
                        />
                        {fieldErrors.phone && (
                            <div className="field-error">
                                {fieldErrors.phone}
                            </div>
                        )}
                    </div>

                    <button 
                        type="submit" 
                        className="auth-button"
                        disabled={loading}
                    >
                        {loading ? 'Creating Account...' : 'Create Account'}
                    </button>
                </form>

                    <div className="auth-footer" style={{ marginTop: '1.5rem' }}>
                    <p>
                        Already have an account?{' '}
                        <Link to="/login" className="auth-link">
                            Sign in here
                        </Link>
                    </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;

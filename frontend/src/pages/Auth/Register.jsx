import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Auth.css';
import { toast } from 'react-hot-toast';

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
    
    const { register } = useAuth();
    const navigate = useNavigate();

    const preventInvalidFirstChar = (e) => {
        const isNameField = e.target.name === 'firstName' || e.target.name === 'lastName';
        if (!isNameField) return;
        const current = e.target.value || '';
        // Block first character if not a letter (A-Z or a-z)
        if (current.length === 0) {
            // Handle key presses
            const key = e.key || '';
            if (e.type === 'keydown') {
                // Allow control keys (Backspace, Tab, Arrow keys, etc.)
                const controlKeys = ['Backspace','Tab','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End','Delete'];
                if (controlKeys.includes(key)) return;
                if (!/^[A-Za-z]$/.test(key)) {
                    e.preventDefault();
                }
            }
        }
    };

    const preventInvalidPasteFirstChar = (e) => {
        const isNameField = e.target.name === 'firstName' || e.target.name === 'lastName';
        if (!isNameField) return;
        const current = e.target.value || '';
        if (current.length === 0) {
            const pasted = (e.clipboardData || window.clipboardData).getData('text');
            if (pasted && !/^[A-Za-z]/.test(pasted.trimStart())) {
                e.preventDefault();
            }
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setError(''); // Clear error when user types
    };

    const validateForm = () => {
        // Names: letters and spaces only
        const nameRegex = /^[A-Za-z ]+$/;
        if (!nameRegex.test(formData.firstName)) {
            setError('First name should contain only letters and spaces');
            return false;
        }
        if (!nameRegex.test(formData.lastName)) {
            setError('Last name should contain only letters and spaces');
            return false;
        }
        // Address required
        if (!formData.address.trim()) {
            setError('Address is required for delivery');
            return false;
        }
        // Phone: Sri Lanka 10 digits starting with 07
        const phoneRegex = /^07\d{8}$/;
        if (!phoneRegex.test(formData.phone)) {
            setError('Phone must be 10 digits (Sri Lanka format: 07XXXXXXXX)');
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
            <div className="auth-container">
                <div className="auth-card">
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
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <div className="auth-logo">
                        <div className="logo-icon">M</div>
                        <h1>MediCare</h1>
                    </div>
                    <h2>Create Account</h2>
                    <p>Join MediCare for better healthcare</p>
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
                        />
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
                        />
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
                        />
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
                        />
                    </div>

                    <button 
                        type="submit" 
                        className="auth-button"
                        disabled={loading}
                    >
                        {loading ? 'Creating Account...' : 'Create Account'}
                    </button>
                </form>

                <div className="auth-footer">
                    <p>
                        Already have an account?{' '}
                        <Link to="/login" className="auth-link">
                            Sign in here
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;

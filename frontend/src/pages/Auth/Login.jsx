import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Auth.css';
import { toast } from 'react-hot-toast';
import { GoogleLogin } from '@react-oauth/google';
import slide2 from '../../assets/slide2.jpg';

const Login = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState({
        email: '',
        password: ''
    });
    
    const { login } = useAuth();
    const navigate = useNavigate();

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
    };

    const validateForm = () => {
        let hasErrors = false;
        const newFieldErrors = { ...fieldErrors };
        
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
        
        // Password validation
        if (!formData.password.trim()) {
            newFieldErrors.password = 'Password is required';
            hasErrors = true;
        } else {
            newFieldErrors.password = '';
        }
        
        setFieldErrors(newFieldErrors);
        
        if (hasErrors) {
            setError('Please fix the errors in the form');
            return false;
        }
        
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validate form before submission
        if (!validateForm()) {
            return;
        }
        
        setLoading(true);
        setError('');

        const result = await login(formData.email, formData.password);
        
        if (result.success) {
            toast.success('Login successful');
            // Redirect based on user role
            const user = result.user;
            console.log('Login successful, user role:', user.role);
            
            // Clear any existing error
            setError('');
            
            // Navigate based on user role
            switch (user.role) {
                case 'admin':
                    console.log('Redirecting admin to dashboard');
                    navigate('/admin/dashboard');
                    break;
                case 'doctor':
                    console.log('Redirecting doctor to dashboard');
                    navigate('/doctor/dashboard');
                    break;
                case 'pharmacist':
                    console.log('Redirecting pharmacist to dashboard');
                    navigate('/pharmacist/dashboard');
                    break;
                case 'delivery_agent':
                    console.log('Redirecting delivery agent to dashboard');
                    navigate('/delivery/dashboard');
                    break;
                case 'customer':
                    console.log('Redirecting customer to home page');
                    navigate('/');
                    break;
                default:
                    console.log('Unknown role, redirecting to home page');
                    navigate('/');
                    break;
            }
        } else {
            setError(result.message);
            toast.error(result.message || 'Login failed');
        }
        
        setLoading(false);
    };

    return (
        <div className="auth-container" style={{
            backgroundImage: `url(${slide2})`,
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
                    <h2>Welcome Back</h2>
                    <p>Sign in to your account to continue</p>
                </div>

                <form onSubmit={handleSubmit} className="auth-form">
                    {error && (
                        <div className="error-message" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                            <span>{error}</span>
                            {error.toLowerCase().includes('verify') && (
                                <button
                                    type="button"
                                    className="auth-link"
                                    onClick={async ()=>{
                                        try{
                                            const res = await fetch('http://localhost:5001/api/users/resend-verification', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ email: formData.email })
                                            });
                                            const data = await res.json();
                                            if(res.ok){
                                                toast.success(data.message || 'Verification email sent');
                                            }else{
                                                toast.error(data.message || 'Failed to send');
                                            }
                                        }catch(e){
                                            toast.error('Network error');
                                        }
                                    }}
                                >
                                    Resend
                                </button>
                            )}
                        </div>
                    )}

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

                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            placeholder="Enter your password"
                            className={fieldErrors.password ? 'error' : ''}
                        />
                        {fieldErrors.password && (
                            <div className="field-error">
                                {fieldErrors.password}
                            </div>
                        )}
                    </div>

                    <button 
                        type="submit" 
                        className="auth-button"
                        disabled={loading}
                    >
                        {loading ? 'Signing In...' : 'Sign In'}
                    </button>
                </form>

                <div className="auth-footer">
                    <div style={{ marginBottom: '12px' }}>
                        <GoogleLogin
                            onSuccess={async (credentialResponse) => {
                                try{
                                    const idToken = credentialResponse.credential;
                                    // decode minimal data client-side to get sub/email if available
                                    const payload = JSON.parse(atob(idToken.split('.')[1]));
                                    const response = await fetch('http://localhost:5001/api/users/auth/google', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ email: payload.email, name: payload.name, sub: payload.sub })
                                    });
                                    const data = await response.json();
                                    if (response.ok) {
                                        toast.success('Logged in with Google');
                                        // Reuse existing auth flow
                                        localStorage.setItem('token', data.token);
                                        window.location.href = '/';
                                    } else {
                                        toast.error(data.message || 'Google login failed');
                                    }
                                }catch(e){
                                    toast.error('Google login error');
                                }
                            }}
                            onError={() => toast.error('Google login failed')}
                        />
                    </div>
                    <p>
                        Don't have an account?{' '}
                        <Link to="/register" className="auth-link">
                            Sign up here
                        </Link>
                    </p>
                    <Link to="/forgot-password" className="auth-link">
                        Forgot your password?
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Login;

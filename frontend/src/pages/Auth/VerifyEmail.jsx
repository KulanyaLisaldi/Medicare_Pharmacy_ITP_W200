import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import './Auth.css';

const VerifyEmail = () => {
    const [params] = useSearchParams();
    const [status, setStatus] = useState('verifying');
    const [isAlreadyVerified, setIsAlreadyVerified] = useState(false);
    const hasVerifiedRef = useRef(false);
    const navigate = useNavigate();

    useEffect(() => {
        const token = params.get('token');
        
        // Prevent multiple verification attempts
        if (hasVerifiedRef.current) return;
        
        const verify = async () => {
            // Mark as verified immediately to prevent race conditions
            hasVerifiedRef.current = true;
            
            try {
                const res = await fetch(`http://localhost:5001/api/users/verify-email?token=${token}`);
                const data = await res.json();
                if (res.ok) {
                    if (data.alreadyVerified) {
                        setIsAlreadyVerified(true);
                    }
                    setStatus('success');
                    // Redirect to login after 3 seconds
                    setTimeout(() => {
                        navigate('/login');
                    }, 3000);
                } else {
                    setStatus('error');
                }
            } catch (e) {
                setStatus('error');
            }
        };
        
        if (token) {
            verify();
        } else {
            hasVerifiedRef.current = true;
            setStatus('error');
        }
    }, [params, navigate]);

    if (status === 'verifying') {
        return (
            <div className="auth-container">
                <div className="auth-card">
                    <div className="auth-header">
                        <div className="auth-logo">
                            <div className="logo-icon">M</div>
                            <h1>MediCare</h1>
                        </div>
                        <h2>Verifying Your Email</h2>
                        <p>Please wait while we verify your account...</p>
                    </div>
                    
                    <div className="verification-message">
                        <div className="verification-icon">⏳</div>
                        <div className="loading-spinner"></div>
                        <p>Verifying your email address...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (status === 'success') {
        return (
            <div className="auth-container">
                <div className="auth-card">
                    <div className="auth-header">
                        <div className="auth-logo">
                            <div className="logo-icon">M</div>
                            <h1>MediCare</h1>
                        </div>
                        <h2>{isAlreadyVerified ? 'Email Already Verified! ✅' : 'Email Verified Successfully! 🎉'}</h2>
                        <p>{isAlreadyVerified ? 'Your account is ready to use!' : 'Welcome to MediCare!'}</p>
                    </div>
                    
                    <div className="verification-message">
                        <div className="verification-icon">✅</div>
                        <h3>{isAlreadyVerified ? 'Account Ready' : 'Account Activated'}</h3>
                        <p>
                            {isAlreadyVerified 
                                ? 'Your email was already verified! You can now access your MediCare account.'
                                : 'Your email has been successfully verified! You\'re now ready to access your MediCare account.'
                            }
                        </p>
                        {!isAlreadyVerified && (
                            <p>
                                We've sent you a welcome email with your account details.
                            </p>
                        )}
                        
                        <div className="verification-actions">
                            <button 
                                onClick={() => navigate('/login')} 
                                className="auth-button"
                            >
                                Login Now
                            </button>
                        </div>
                        
                        <p className="redirect-message">
                            Redirecting to login page in a few seconds...
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    if (status === 'error') {
        return (
            <div className="auth-container">
                <div className="auth-card">
                    <div className="auth-header">
                        <div className="auth-logo">
                            <div className="logo-icon">M</div>
                            <h1>MediCare</h1>
                        </div>
                        <h2>Verification Failed</h2>
                        <p>Something went wrong with the verification</p>
                    </div>
                    
                    <div className="verification-message">
                        <div className="verification-icon">❌</div>
                        <h3>Verification Error</h3>
                        <p>
                            The verification link is invalid or has expired. This could happen if:
                        </p>
                        <ul className="error-list">
                            <li>The link was already used</li>
                            <li>The link has expired (24 hours)</li>
                            <li>The link was copied incorrectly</li>
                        </ul>
                        
                        <div className="verification-actions">
                            <button 
                                onClick={() => navigate('/login')} 
                                className="auth-button secondary"
                            >
                                Go to Login
                            </button>
                            <button 
                                onClick={() => navigate('/register')} 
                                className="auth-button"
                            >
                                Create New Account
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return null;
};

export default VerifyEmail;



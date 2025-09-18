import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';

const ForgotPassword = () => {
    const { requestPasswordReset } = useAuth();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);

    const submit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const res = await requestPasswordReset(email);
        if (res.success) toast.success(res.message || 'If exists, email sent');
        else toast.error(res.message || 'Failed to send email');
        setLoading(false);
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <h2>Forgot Password</h2>
                    <p>Enter your email to receive a reset link</p>
                </div>
                <form onSubmit={submit} className="auth-form">
                    <div className="form-group">
                        <label>Email</label>
                        <input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} required />
                    </div>
                    <button type="submit" className="auth-button" disabled={loading}>
                        {loading ? 'Sending...' : 'Send Reset Link'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ForgotPassword;



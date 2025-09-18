import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';

const ResetPassword = () => {
    const { resetPassword } = useAuth();
    const [params] = useSearchParams();
    const navigate = useNavigate();
    const token = params.get('token');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [loading, setLoading] = useState(false);

    const submit = async (e) => {
        e.preventDefault();
        if (password !== confirm) {
            toast.error('Passwords do not match');
            return;
        }
        setLoading(true);
        const res = await resetPassword(token, password);
        if (res.success) {
            toast.success(res.message || 'Password reset');
            navigate('/login');
        } else {
            toast.error(res.message || 'Reset failed');
        }
        setLoading(false);
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <h2>Reset Password</h2>
                    <p>Enter your new password</p>
                </div>
                <form onSubmit={submit} className="auth-form">
                    <div className="form-group">
                        <label>New Password</label>
                        <input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} required />
                    </div>
                    <div className="form-group">
                        <label>Confirm Password</label>
                        <input type="password" value={confirm} onChange={(e)=>setConfirm(e.target.value)} required />
                    </div>
                    <button type="submit" className="auth-button" disabled={loading}>
                        {loading ? 'Resetting...' : 'Reset Password'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ResetPassword;



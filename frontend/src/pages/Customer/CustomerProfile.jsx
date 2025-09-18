import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import './CustomerProfile.css';
import { toast } from 'react-hot-toast';

const CustomerProfile = () => {
    const { user, updateProfile, changePassword } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [formData, setFormData] = useState({
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        address: user?.address || '',
        phone: user?.phone || ''
    });
    const [pwdForm, setPwdForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const preventInvalidFirstChar = (e) => {
        const isNameField = e.target.name === 'firstName' || e.target.name === 'lastName';
        if (!isNameField) return;
        const current = e.target.value || '';
        if (current.length === 0 && e.type === 'keydown') {
            const key = e.key || '';
            const controlKeys = ['Backspace','Tab','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End','Delete'];
            if (!controlKeys.includes(key) && !/^[A-Za-z]$/.test(key)) e.preventDefault();
        }
    };

    const preventInvalidPasteFirstChar = (e) => {
        const isNameField = e.target.name === 'firstName' || e.target.name === 'lastName';
        if (!isNameField) return;
        const current = e.target.value || '';
        if (current.length === 0) {
            const pasted = (e.clipboardData || window.clipboardData).getData('text');
            if (pasted && !/^[A-Za-z]/.test(pasted.trimStart())) e.preventDefault();
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        // Client-side validations: names letters+spaces, SL phone, address non-empty
        const nameRegex = /^[A-Za-z ]+$/;
        if (!nameRegex.test(formData.firstName)) {
            toast.error('First name should contain only letters and spaces');
            setLoading(false);
            return;
        }
        if (!nameRegex.test(formData.lastName)) {
            toast.error('Last name should contain only letters and spaces');
            setLoading(false);
            return;
        }
        if (!formData.address.trim()) {
            toast.error('Address is required');
            setLoading(false);
            return;
        }
        const phoneRegex = /^07\d{8}$/;
        if (!phoneRegex.test(formData.phone)) {
            toast.error('Phone must be 10 digits (Sri Lanka format: 07XXXXXXXX)');
            setLoading(false);
            return;
        }

        const result = await updateProfile(formData);
        
        if (result.success) {
            setMessage('Profile updated successfully!');
            toast.success('Profile updated');
            setIsEditing(false);
        } else {
            setMessage(result.message);
            toast.error(result.message || 'Update failed');
        }
        
        setLoading(false);
    };

    const submitPassword = async (e) => {
        e.preventDefault();
        if (pwdForm.newPassword !== pwdForm.confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }
        setLoading(true);
        const res = await changePassword(pwdForm.currentPassword, pwdForm.newPassword);
        if (res.success) {
            toast.success('Password updated');
            setPwdForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } else {
            toast.error(res.message || 'Update failed');
        }
        setLoading(false);
    };

    const handleEdit = () => {
        setIsEditing(true);
        setFormData({
            firstName: user?.firstName || '',
            lastName: user?.lastName || '',
            address: user?.address || '',
            phone: user?.phone || ''
        });
    };

    const handleCancel = () => {
        setIsEditing(false);
        setFormData({
            firstName: user?.firstName || '',
            lastName: user?.lastName || '',
            address: user?.address || '',
            phone: user?.phone || ''
        });
    };

    if (!user) {
        return <div className="loading">Loading...</div>;
    }

    return (
        <div className="customer-profile">
            <div className="profile-container">
                <div className="profile-header">
                    <h1>Profile</h1>
                    <p>Manage your account information</p>
                </div>

                {message && (
                    <div className={`message ${message.includes('successfully') ? 'success' : 'error'}`}>
                        {message}
                    </div>
                )}
                <div className="profile-grid">
                    <div className="column-left">
                        <div className="profile-card">
                            <div className="profile-info">
                                <div className="profile-avatar">
                                    <span>{user.firstName.charAt(0).toUpperCase()}</span>
                                </div>
                                <div className="profile-details">
                                    <h2>{`${user.firstName} ${user.lastName}`}</h2>
                                    <p className="user-role">Customer</p>
                                    <p className="user-email">{user.email}</p>
                                </div>
                            </div>
                            {!isEditing ? (
                                <div className="profile-actions">
                                    <button onClick={handleEdit} className="edit-btn">
                                        Edit Profile
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="edit-form">
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
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="address">Address</label>
                                        <textarea
                                            id="address"
                                            name="address"
                                            value={formData.address}
                                            onChange={handleChange}
                                            required
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
                                        />
                                    </div>
                                    <div className="form-actions">
                                        <button 
                                            type="submit" 
                                            className="save-btn"
                                            disabled={loading}
                                        >
                                            {loading ? 'Saving...' : 'Save Changes'}
                                        </button>
                                        <button 
                                            type="button" 
                                            onClick={handleCancel}
                                            className="cancel-btn"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                    <div className="column-right">
                        <div className="profile-stats">
                            <div className="stat-item">
                                <h3>Member Since</h3>
                                <p>{new Date(user.createdAt).toLocaleDateString()}</p>
                            </div>
                            <div className="stat-item">
                                <h3>Account Status</h3>
                                <span className={`status ${user.isActive ? 'active' : 'inactive'}`}>
                                    {user.isActive ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                        </div>
                        <div className="profile-card">
                            <h3>Change Password</h3>
                            <form onSubmit={submitPassword} className="edit-form">
                                <div className="form-group">
                                    <label>Current Password</label>
                                    <input type="password" value={pwdForm.currentPassword} onChange={(e)=>setPwdForm({...pwdForm, currentPassword: e.target.value})} required />
                                </div>
                                <div className="form-group">
                                    <label>New Password</label>
                                    <input type="password" value={pwdForm.newPassword} onChange={(e)=>setPwdForm({...pwdForm, newPassword: e.target.value})} required />
                                </div>
                                <div className="form-group">
                                    <label>Confirm Password</label>
                                    <input type="password" value={pwdForm.confirmPassword} onChange={(e)=>setPwdForm({...pwdForm, confirmPassword: e.target.value})} required />
                                </div>
                                <div className="form-actions">
                                    <button type="submit" className="save-btn" disabled={loading}>{loading ? 'Saving...' : 'Update Password'}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CustomerProfile;

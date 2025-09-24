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
    const [fieldErrors, setFieldErrors] = useState({
        firstName: '',
        lastName: '',
        phone: '',
        newPassword: '',
        confirmPassword: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        
        // Special handling for phone field - clean and limit input
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
        
        setFormData(prev => ({ ...prev, [name]: value }));
        
        // Clear field-specific error when user types
        if (fieldErrors[name]) {
            setFieldErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
        
        // Real-time validation for name fields
        if (name === 'firstName' || name === 'lastName') {
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
    };

    const preventInvalidNameChar = (e) => {
        const isNameField = e.target.name === 'firstName' || e.target.name === 'lastName';
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
        const isNameField = e.target.name === 'firstName' || e.target.name === 'lastName';
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
        if (name === 'phone') {
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
        if (name === 'phone') {
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

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        
        setPwdForm(prev => ({ ...prev, [name]: value }));
        
        // Clear field-specific error when user types
        if (fieldErrors[name]) {
            setFieldErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
        
        // Real-time validation for new password field
        if (name === 'newPassword') {
            const pwRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@#$%!]).{8,}$/;
            
            if (value.trim() && !pwRegex.test(value)) {
                setFieldErrors(prev => ({
                    ...prev,
                    [name]: 'Password must be 8+ chars with uppercase, lowercase, number and special (@,#,$,%,!)'
                }));
            } else {
                setFieldErrors(prev => ({
                    ...prev,
                    [name]: ''
                }));
            }
        }
        
        // Real-time validation for confirm password field
        if (name === 'confirmPassword') {
            if (value.trim() && value !== pwdForm.newPassword) {
                setFieldErrors(prev => ({
                    ...prev,
                    [name]: 'Passwords do not match'
                }));
            } else {
                setFieldErrors(prev => ({
                    ...prev,
                    [name]: ''
                }));
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        // Comprehensive validation
        let hasErrors = false;
        const newFieldErrors = {};
        
        // First name validation
        if (!formData.firstName.trim()) {
            newFieldErrors.firstName = 'First name is required';
            hasErrors = true;
        } else if (/[0-9]/.test(formData.firstName)) {
            newFieldErrors.firstName = 'Numbers are not allowed in name fields';
            hasErrors = true;
        } else if (!/^[A-Za-z ]+$/.test(formData.firstName)) {
            newFieldErrors.firstName = 'Only letters and spaces are allowed';
            hasErrors = true;
        } else {
            newFieldErrors.firstName = '';
        }
        
        // Last name validation
        if (!formData.lastName.trim()) {
            newFieldErrors.lastName = 'Last name is required';
            hasErrors = true;
        } else if (/[0-9]/.test(formData.lastName)) {
            newFieldErrors.lastName = 'Numbers are not allowed in name fields';
            hasErrors = true;
        } else if (!/^[A-Za-z ]+$/.test(formData.lastName)) {
            newFieldErrors.lastName = 'Only letters and spaces are allowed';
            hasErrors = true;
        } else {
            newFieldErrors.lastName = '';
        }
        
        // Address validation
        if (!formData.address.trim()) {
            toast.error('Address is required');
            setLoading(false);
            return;
        }
        
        // Phone validation
        if (!formData.phone.trim()) {
            newFieldErrors.phone = 'Phone number is required';
            hasErrors = true;
        } else {
            const digitsOnly = formData.phone.replace(/\D/g, '');
            if (/[A-Za-z]/.test(formData.phone)) {
                newFieldErrors.phone = 'Letters are not allowed in phone number';
                hasErrors = true;
            } else if (digitsOnly.length !== 10) {
                newFieldErrors.phone = 'Phone number must be exactly 10 digits';
                hasErrors = true;
            } else if (!/^07\d{8}$/.test(digitsOnly)) {
                newFieldErrors.phone = 'Phone must be 10 digits (Sri Lanka format: 07XXXXXXXX)';
                hasErrors = true;
            } else {
                newFieldErrors.phone = '';
            }
        }
        
        // Set field errors
        setFieldErrors(newFieldErrors);
        
        if (hasErrors) {
            setLoading(false);
            return;
        }

        const result = await updateProfile(formData);
        
        if (result.success) {
            setMessage('Profile updated successfully!');
            toast.success('Profile updated');
            setIsEditing(false);
            setFieldErrors({
                firstName: '',
                lastName: '',
                phone: '',
                newPassword: '',
                confirmPassword: ''
            });
        } else {
            setMessage(result.message);
            toast.error(result.message || 'Update failed');
        }
        
        setLoading(false);
    };

    const submitPassword = async (e) => {
        e.preventDefault();
        
        // Comprehensive password validation
        let hasErrors = false;
        const newFieldErrors = {};
        
        // Current password validation
        if (!pwdForm.currentPassword.trim()) {
            toast.error('Current password is required');
            return;
        }
        
        // New password validation
        const pwRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@#$%!]).{8,}$/;
        if (!pwdForm.newPassword.trim()) {
            newFieldErrors.newPassword = 'New password is required';
            hasErrors = true;
        } else if (!pwRegex.test(pwdForm.newPassword)) {
            newFieldErrors.newPassword = 'Password must be 8+ chars with uppercase, lowercase, number and special (@,#,$,%,!)';
            hasErrors = true;
        } else {
            newFieldErrors.newPassword = '';
        }
        
        // Confirm password validation
        if (!pwdForm.confirmPassword.trim()) {
            newFieldErrors.confirmPassword = 'Please confirm your new password';
            hasErrors = true;
        } else if (pwdForm.newPassword !== pwdForm.confirmPassword) {
            newFieldErrors.confirmPassword = 'Passwords do not match';
            hasErrors = true;
        } else {
            newFieldErrors.confirmPassword = '';
        }
        
        // Set field errors
        setFieldErrors(prev => ({
            ...prev,
            ...newFieldErrors
        }));
        
        if (hasErrors) {
            return;
        }
        
        setLoading(true);
        const res = await changePassword(pwdForm.currentPassword, pwdForm.newPassword);
        if (res.success) {
            toast.success('Password updated');
            setPwdForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
            setFieldErrors(prev => ({
                ...prev,
                newPassword: '',
                confirmPassword: ''
            }));
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
                                            onKeyDown={preventInvalidNameChar}
                                            onPaste={preventInvalidNamePaste}
                                            required
                                            className={fieldErrors.firstName ? 'error' : ''}
                                        />
                                        {fieldErrors.firstName && (
                                            <p className="field-error">{fieldErrors.firstName}</p>
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
                                            onKeyDown={preventInvalidNameChar}
                                            onPaste={preventInvalidNamePaste}
                                            required
                                            className={fieldErrors.lastName ? 'error' : ''}
                                        />
                                        {fieldErrors.lastName && (
                                            <p className="field-error">{fieldErrors.lastName}</p>
                                        )}
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
                                            onKeyDown={handlePhoneKeyDown}
                                            onPaste={handlePhonePaste}
                                            required
                                            className={fieldErrors.phone ? 'error' : ''}
                                            placeholder="07XXXXXXXX"
                                        />
                                        {fieldErrors.phone && (
                                            <p className="field-error">{fieldErrors.phone}</p>
                                        )}
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
                                    <input 
                                        type="password" 
                                        name="newPassword"
                                        value={pwdForm.newPassword} 
                                        onChange={handlePasswordChange} 
                                        required 
                                        className={fieldErrors.newPassword ? 'error' : ''}
                                    />
                                    {fieldErrors.newPassword && (
                                        <p className="field-error">{fieldErrors.newPassword}</p>
                                    )}
                                </div>
                                <div className="form-group">
                                    <label>Confirm Password</label>
                                    <input 
                                        type="password" 
                                        name="confirmPassword"
                                        value={pwdForm.confirmPassword} 
                                        onChange={handlePasswordChange} 
                                        required 
                                        className={fieldErrors.confirmPassword ? 'error' : ''}
                                    />
                                    {fieldErrors.confirmPassword && (
                                        <p className="field-error">{fieldErrors.confirmPassword}</p>
                                    )}
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

import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check if user is logged in on app start
        if (token) {
            fetchUserProfile();
        } else {
            setLoading(false);
        }
    }, [token]);

    const fetchUserProfile = async () => {
        try {
            const response = await fetch('http://localhost:5001/api/users/profile', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const userData = await response.json();
                setUser(userData);
            } else {
                // Token is invalid, clear it
                logout();
            }
        } catch (error) {
            console.error('Error fetching user profile:', error);
            logout();
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        try {
            const response = await fetch('http://localhost:5001/api/users/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                setUser(data.user);
                setToken(data.token);
                localStorage.setItem('token', data.token);
                return { success: true, user: data.user };
            } else {
                return { success: false, message: data.message };
            }
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, message: 'Network error occurred' };
        }
    };

    const register = async (userData) => {
        try {
            const response = await fetch('http://localhost:5001/api/users/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });

            const data = await response.json();

            if (response.ok) {
                // Don't automatically set user and token since email verification is required
                // Only set user and token if verification is not required (for future use)
                if (!data.requiresVerification) {
                    setUser(data.user);
                    setToken(data.token);
                    localStorage.setItem('token', data.token);
                }
                return { success: true, user: data.user, message: data.message };
            } else {
                return { success: false, message: data.message };
            }
        } catch (error) {
            console.error('Registration error:', error);
            return { success: false, message: 'Network error occurred' };
        }
    };

    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('token');
    };

    const refresh = async () => {
        if (!token) return null;
        try {
            const response = await fetch('http://localhost:5001/api/users/refresh', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            if (response.ok) {
                const data = await response.json();
                setToken(data.token);
                localStorage.setItem('token', data.token);
                return data.token;
            } else {
                logout();
                return null;
            }
        } catch (error) {
            console.error('Refresh error:', error);
            logout();
            return null;
        }
    };

    const updateProfile = async (profileData) => {
        try {
            const response = await fetch(`http://localhost:5001/api/users/profile/${user._id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(profileData)
            });

            const data = await response.json();

            if (response.ok) {
                setUser(data.user);
                return { success: true, user: data.user };
            } else {
                return { success: false, message: data.message };
            }
        } catch (error) {
            console.error('Profile update error:', error);
            return { success: false, message: 'Network error occurred' };
        }
    };

    const requestPasswordReset = async (email) => {
        try {
            const response = await fetch('http://localhost:5001/api/users/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            const data = await response.json();
            return { success: response.ok, message: data.message };
        } catch (error) {
            console.error('Request reset error:', error);
            return { success: false, message: 'Network error occurred' };
        }
    };

    const resetPassword = async (tokenParam, password) => {
        try {
            const response = await fetch('http://localhost:5001/api/users/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: tokenParam, password })
            });
            const data = await response.json();
            return { success: response.ok, message: data.message };
        } catch (error) {
            console.error('Reset password error:', error);
            return { success: false, message: 'Network error occurred' };
        }
    };

    const changePassword = async (currentPassword, newPassword) => {
        try {
            const response = await fetch('http://localhost:5001/api/users/change-password', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ currentPassword, newPassword })
            });
            const data = await response.json();
            return { success: response.ok, message: data.message };
        } catch (error) {
            console.error('Change password error:', error);
            return { success: false, message: 'Network error occurred' };
        }
    };

    const isAdmin = () => user?.role === 'admin';
    const isDoctor = () => user?.role === 'doctor';
    const isPharmacist = () => user?.role === 'pharmacist';
    const isDeliveryAgent = () => user?.role === 'delivery_agent';
    const isCustomer = () => user?.role === 'customer';
    const isStaff = () => ['doctor', 'pharmacist', 'delivery_agent', 'admin'].includes(user?.role);

    const value = {
        user,
        token,
        loading,
        login,
        register,
        logout,
        refresh,
        updateProfile,
        requestPasswordReset,
        resetPassword,
        changePassword,
        isAdmin,
        isDoctor,
        isPharmacist,
        isDeliveryAgent,
        isCustomer,
        isStaff
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

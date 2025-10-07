import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import './AdminDashboard.css';
import DashboardLayout from '../../layouts/DashboardLayout';
import { BarChart3, Users, Package, ShoppingCart, Calendar, Truck, FileText, MessageSquare } from 'lucide-react';
import { toast } from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

const AdminDashboard = () => {
    const { user } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterRole, setFilterRole] = useState('all');
    const [editUser, setEditUser] = useState(null);
    const [editForm, setEditForm] = useState({ 
        firstName: '', 
        lastName: '', 
        email: '', 
        role: '', 
        isActive: true, 
        address: '', 
        phone: '',
        specialization: '',
        licenseNumber: '',
        experience: '',
        vehicleNumber: '',
        practicingGovernmentHospital: '',
        achievements: '',
        membership: '',
        registrationNumber: '',
        otherSpecialization: '',
        experienceYears: '',
        specialNote: ''
    });
    const [showCreateStaff, setShowCreateStaff] = useState(false);
    const [selectedRole, setSelectedRole] = useState('doctor');
    const [createForm, setCreateForm] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        phone: '',
        address: '',
        specialization: '',
        practicingGovernmentHospital: '',
        achievements: '',
        membership: '',
        registrationNumber: '',
        otherSpecialization: '',
        experienceYears: '',
        specialNote: '',
        licenseNumber: '',
        experience: '',
        vehicleNumber: ''
    });
    const [createFormErrors, setCreateFormErrors] = useState({
        firstName: '',
        lastName: '',
        phone: '',
        password: '',
        email: '',
        experienceYears: '',
        experience: ''
    });
    const [searchQuery, setSearchQuery] = useState('');
    const [activeSection, setActiveSection] = useState('overview');
    const [recentUsers, setRecentUsers] = useState([]);
    const [productsCount, setProductsCount] = useState(0);
    const [notifications, setNotifications] = useState([]);
    const [notificationCount, setNotificationCount] = useState(0);
    const [showNotificationPopup, setShowNotificationPopup] = useState(false);
    // Orders state
    const [orders, setOrders] = useState([]);
    const [ordersLoading, setOrdersLoading] = useState(false);
    const [ordersError, setOrdersError] = useState('');
    const [orderSearch, setOrderSearch] = useState('');
    const [orderStatus, setOrderStatus] = useState('all');
    const [orderPayment, setOrderPayment] = useState('all');
    const [orderSort, setOrderSort] = useState('newest');

    const sidebarItems = [
        { id: 'overview', label: 'Overview', icon: <BarChart3 size={18} /> },
        { id: 'users', label: 'Users', icon: <Users size={18} /> },
        { id: 'inventory', label: 'Inventory', icon: <Package size={18} /> },
        { id: 'orders', label: 'Orders', icon: <ShoppingCart size={18} /> },
        { id: 'appointments', label: 'Appointments', icon: <Calendar size={18} /> },
        { id: 'delivery', label: 'Delivery', icon: <Truck size={18} /> },
        { id: 'reports', label: 'Reports', icon: <FileText size={18} /> },
        { id: 'messages', label: 'Messages', icon: <MessageSquare size={18} /> },
    ];

    useEffect(() => {
        fetchUsers();
    }, [user]);

    useEffect(() => {
        // Get recently registered users (last 5 users)
        if (users.length > 0) {
            const recent = users
                .sort((a, b) => new Date(b.createdAt || new Date()) - new Date(a.createdAt || new Date()))
                .slice(0, 5);
            setRecentUsers(recent);
        }
    }, [users]);

    useEffect(() => {
        const loadProductsCount = async () => {
            try {
                const res = await fetch('http://localhost:5001/api/products');
                if (!res.ok) return;
                const data = await res.json();
                setProductsCount(Array.isArray(data) ? data.length : 0);
            } catch (e) {
                // ignore count errors in overview
            }
        };
        loadProductsCount();
    }, []);

    // Fetch orders for admin Orders section
    useEffect(() => {
        const loadOrders = async () => {
            if (activeSection !== 'orders') return;
            try {
                setOrdersLoading(true);
                setOrdersError('');
                const res = await fetch('http://localhost:5001/api/orders', {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data?.message || 'Failed to load orders');
                setOrders(Array.isArray(data) ? data : []);
            } catch (e) {
                setOrdersError(e.message);
            } finally {
                setOrdersLoading(false);
            }
        };
        loadOrders();
    }, [activeSection]);

    const fetchUsers = async () => {
        try {
            const response = await fetch('http://localhost:5001/api/users/all', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                setUsers(data);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    // Simple CSV export for orders
    const exportOrdersCSV = (rows) => {
        try {
            const headers = ['Order ID','Customer','Phone','Items','Total','Date','Payment','Status'];
            const lines = [headers.join(',')];
            rows.forEach(o => {
                const count = Array.isArray(o.items) ? o.items.reduce((s,it)=>s+(it.quantity||0),0) : 0;
                const row = [
                    `#${(o._id||'').slice(-6)}`,
                    (o?.customer?.name||'').replace(/,/g,' '),
                    (o?.customer?.phone||'').replace(/,/g,' '),
                    count,
                    Number(o.total||0).toFixed(2),
                    new Date(o.createdAt||Date.now()).toLocaleDateString(),
                    (o.paymentMethod||'cod').toUpperCase(),
                    (o.status||'pending')
                ];
                lines.push(row.join(','));
            });
            const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'orders.csv';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (e) {
            console.error('Export failed', e);
        }
    };

    const formatStatus = (s) => {
        switch (s) {
            case 'pending': return 'on way' === 'on way' && 'pending'.length ? 'pending' : 'Pending';
            case 'ready': return 'await';
            case 'out_for_delivery': return 'on way';
            case 'picked_up': return 'on way';
            case 'delivered': return 'delivered';
            case 'canceled': return 'canceled';
            case 'failed': return 'failed';
            default: return s || 'pending';
        }
    };

    // Generate admin notifications
    useEffect(() => {
        const generateNotifications = () => {
            const notificationList = [];

            // New users notifications (last 3 users)
            if (recentUsers.length > 0) {
                recentUsers.slice(0, 3).forEach(user => {
                    notificationList.push({
                        _id: `user-${user._id}`,
                        id: `user-${user._id}`,
                        type: 'user',
                        title: 'New User Registered',
                        message: `${user.firstName} ${user.lastName} (${user.role}) joined the system`,
                        icon: '👤',
                        timestamp: new Date(user.createdAt || Date.now()),
                        read: false
                    });
                });
            }

            // System notifications (placeholder for future use)
            const now = new Date();
            notificationList.push({
                _id: 'system-welcome',
                id: 'system-welcome',
                type: 'system',
                title: 'System Status',
                message: 'All systems are operational',
                icon: '✅',
                timestamp: now,
                read: false
            });

            setNotifications(notificationList);
            setNotificationCount(notificationList.filter(n => !n.read).length);
        };

        generateNotifications();
    }, [recentUsers]);

    // Function to mark notification as read
    const markNotificationAsRead = (notificationId) => {
        setNotifications(prev =>
            prev.map(notification =>
                notification._id === notificationId || notification.id === notificationId
                    ? { ...notification, read: true }
                    : notification
            )
        );
        setNotificationCount(prev => Math.max(0, prev - 1));
    };

    const handleCreateStaff = async (e) => {
        e.preventDefault();
        
        // Validate email before submission
        if (!createForm.email.trim()) {
            setCreateFormErrors(prev => ({
                ...prev,
                email: 'Email is required'
            }));
            toast.error('Please enter an email address');
            return;
        } else if (!createForm.email.includes('@')) {
            setCreateFormErrors(prev => ({
                ...prev,
                email: 'Email must contain @ symbol'
            }));
            toast.error('Please enter a valid email address');
            return;
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(createForm.email)) {
            setCreateFormErrors(prev => ({
                ...prev,
                email: 'Please enter a valid email address'
            }));
            toast.error('Please enter a valid email address');
            return;
        }
        
        // Validate password before submission
        const pwRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@#$%!]).{8,}$/;
        if (!pwRegex.test(createForm.password)) {
            setCreateFormErrors(prev => ({
                ...prev,
                password: 'Password must be 8+ chars with uppercase, lowercase, number and special (@,#,$,%,!)'
            }));
            toast.error('Please fix the password requirements');
            return;
        }
        
        // Validate experience fields for negative values
        if (createForm.experienceYears && parseFloat(createForm.experienceYears) < 0) {
            setCreateFormErrors(prev => ({
                ...prev,
                experienceYears: 'Cannot enter negative values'
            }));
            toast.error('Experience years cannot be negative');
            return;
        }
        
        if (createForm.experience && parseFloat(createForm.experience) < 0) {
            setCreateFormErrors(prev => ({
                ...prev,
                experience: 'Cannot enter negative values'
            }));
            toast.error('Experience cannot be negative');
            return;
        }
        
        try {
            const formData = {
                ...createForm,
                role: selectedRole,
                experience: createForm.experienceYears ? Number(createForm.experienceYears) : undefined,
                experienceYears: createForm.experienceYears ? Number(createForm.experienceYears) : undefined
            };
            
            const response = await fetch('http://localhost:5001/api/users/staff', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok) {
                if (data.emailSent) {
                    toast.success(`✅ ${data.message}`);
                } else {
                    toast.success(`⚠️ ${data.message}`, {
                        duration: 6000,
                        icon: '⚠️'
                    });
                }
                
                setShowCreateStaff(false);
                setCreateForm({
                    firstName: '', lastName: '', email: '', password: '', phone: '', address: '',
                    specialization: '', practicingGovernmentHospital: '', achievements: '', membership: '',
                    registrationNumber: '', otherSpecialization: '', experienceYears: '', specialNote: '',
                    licenseNumber: '', experience: '', vehicleNumber: ''
                });
                fetchUsers();
            } else {
                toast.error(data.message || 'Error creating staff member');
            }
        } catch (error) {
            console.error('Error creating staff:', error);
            toast.error('Error creating staff member');
        }
    };

    const toggleUserStatus = async (userId) => {
        try {
            const response = await fetch(`http://localhost:5001/api/users/${userId}/toggle-status`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                toast.success('User status updated successfully!');
                fetchUsers();
            }
        } catch (error) {
            console.error('Error toggling user status:', error);
            toast.error('Failed to update user status');
        }
    };

    const deleteUser = async (userId) => {
        if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            try {
                const response = await fetch(`http://localhost:5001/api/users/${userId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    toast.success('User deleted successfully!');
                    fetchUsers();
                }
            } catch (error) {
                console.error('Error deleting user:', error);
                toast.error('Failed to delete user');
            }
        }
    };

    // Validation functions for create form
    const preventInvalidNameChar = (e, formType = 'create') => {
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
                    const errorSetter = formType === 'create' ? setCreateFormErrors : setEditFormErrors;
                    errorSetter(prev => ({
                        ...prev,
                        [e.target.name]: 'Numbers are not allowed in name fields'
                    }));
                } else {
                    const errorSetter = formType === 'create' ? setCreateFormErrors : setEditFormErrors;
                    errorSetter(prev => ({
                        ...prev,
                        [e.target.name]: 'Only letters and spaces are allowed'
                    }));
                }
            }
        }
    };

    const preventInvalidNamePaste = (e, formType = 'create') => {
        const isNameField = e.target.name === 'firstName' || e.target.name === 'lastName';
        if (!isNameField) return;
        const pasted = (e.clipboardData || window.clipboardData).getData('text');
        if (pasted && !/^[A-Za-z ]+$/.test(pasted)) {
            e.preventDefault();
            if (/[0-9]/.test(pasted)) {
                const errorSetter = formType === 'create' ? setCreateFormErrors : setEditFormErrors;
                errorSetter(prev => ({
                    ...prev,
                    [e.target.name]: 'Numbers are not allowed in name fields'
                }));
            } else {
                const errorSetter = formType === 'create' ? setCreateFormErrors : setEditFormErrors;
                errorSetter(prev => ({
                    ...prev,
                    [e.target.name]: 'Only letters and spaces are allowed'
                }));
            }
        }
    };

    const handlePhoneKeyDown = (e, formType = 'create') => {
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
                const errorSetter = formType === 'create' ? setCreateFormErrors : setEditFormErrors;
                if (/^[A-Za-z]$/.test(key)) {
                    errorSetter(prev => ({
                        ...prev,
                        [name]: 'Letters are not allowed in phone number'
                    }));
                } else if (key === '-') {
                    errorSetter(prev => ({
                        ...prev,
                        [name]: 'Minus (-) values are not allowed'
                    }));
                } else {
                    errorSetter(prev => ({
                        ...prev,
                        [name]: 'Only numbers are allowed in phone number'
                    }));
                }
                return;
            }
            
            // Check length limit - exactly 10 digits
            if (/^[0-9]$/.test(key) && current.length >= 10) {
                e.preventDefault();
                const errorSetter = formType === 'create' ? setCreateFormErrors : setEditFormErrors;
                errorSetter(prev => ({
                    ...prev,
                    [name]: 'Phone number must be exactly 10 digits'
                }));
            }
        }
    };

    const handlePhonePaste = (e, formType = 'create') => {
        const { name } = e.target;
        if (name === 'phone') {
            const pastedText = (e.clipboardData || window.clipboardData).getData('text');
            const digitsOnly = pastedText.replace(/\D/g, '');
            const errorSetter = formType === 'create' ? setCreateFormErrors : setEditFormErrors;
            
            // Block if contains letters
            if (/[A-Za-z]/.test(pastedText)) {
                e.preventDefault();
                errorSetter(prev => ({
                    ...prev,
                    [name]: 'Letters are not allowed in phone number'
                }));
            } else if (pastedText.includes('-')) {
                e.preventDefault();
                errorSetter(prev => ({
                    ...prev,
                    [name]: 'Minus (-) values are not allowed'
                }));
            } else if (digitsOnly.length > 10) {
                e.preventDefault();
                errorSetter(prev => ({
                    ...prev,
                    [name]: 'Phone number must be exactly 10 digits'
                }));
            } else if (!/^[0-9]+$/.test(pastedText)) {
                e.preventDefault();
                errorSetter(prev => ({
                    ...prev,
                    [name]: 'Only numbers are allowed in phone number'
                }));
            }
        }
    };

    const handleExperienceKeyDown = (e, formType = 'create') => {
        const { name } = e.target;
        if (name === 'experienceYears' || name === 'experience') {
            const key = e.key || '';
            const errorSetter = formType === 'create' ? setCreateFormErrors : setEditFormErrors;
            
            // Allow control keys
            const controlKeys = ['Backspace','Tab','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End','Delete'];
            if (controlKeys.includes(key)) return;
            
            // Block minus (-) character
            if (key === '-') {
                e.preventDefault();
                errorSetter(prev => ({
                    ...prev,
                    [name]: 'Cannot enter negative values'
                }));
            }
        }
    };

    const handleExperiencePaste = (e, formType = 'create') => {
        const { name } = e.target;
        if (name === 'experienceYears' || name === 'experience') {
            const pastedText = (e.clipboardData || window.clipboardData).getData('text');
            const errorSetter = formType === 'create' ? setCreateFormErrors : setEditFormErrors;
            
            // Block if contains minus
            if (pastedText.includes('-')) {
                e.preventDefault();
                errorSetter(prev => ({
                    ...prev,
                    [name]: 'Cannot enter negative values'
                }));
            }
        }
    };

    const handleCreateFormChange = (e) => {
        const { name, value } = e.target;
        
        setCreateForm(prev => ({ ...prev, [name]: value }));
        
        // Clear field-specific error when user types
        if (createFormErrors[name]) {
            setCreateFormErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
        
        // Real-time validation for name fields
        if (name === 'firstName' || name === 'lastName') {
            if (/[0-9]/.test(value)) {
                setCreateFormErrors(prev => ({
                    ...prev,
                    [name]: 'Numbers are not allowed in name fields'
                }));
            } else if (value.trim() && !/^[A-Za-z ]+$/.test(value)) {
                setCreateFormErrors(prev => ({
                    ...prev,
                    [name]: 'Only letters and spaces are allowed'
                }));
            } else {
                setCreateFormErrors(prev => ({
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
            setCreateForm(prev => ({ ...prev, [name]: digitsOnly }));
            
            // Check for letters in original input
            if (/[A-Za-z]/.test(value)) {
                setCreateFormErrors(prev => ({
                    ...prev,
                    [name]: 'Letters are not allowed in phone number'
                }));
            } else if (value.trim() && digitsOnly.length === 10 && !/^07\d{8}$/.test(digitsOnly)) {
                setCreateFormErrors(prev => ({
                    ...prev,
                    [name]: 'Phone must be 10 digits (Sri Lanka format: 07XXXXXXXX)'
                }));
            } else {
                setCreateFormErrors(prev => ({
                    ...prev,
                    [name]: ''
                }));
            }
            return; // Exit early to prevent double setting
        }
        
        // Real-time validation for email field
        if (name === 'email') {
            if (value.trim() && !value.includes('@')) {
                setCreateFormErrors(prev => ({
                    ...prev,
                    [name]: 'Email must contain @ symbol'
                }));
            } else if (value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                setCreateFormErrors(prev => ({
                    ...prev,
                    [name]: 'Please enter a valid email address'
                }));
            } else {
                setCreateFormErrors(prev => ({
                    ...prev,
                    [name]: ''
                }));
            }
        }
        
        // Real-time validation for password field
        if (name === 'password') {
            // Password complexity validation
            const pwRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@#$%!]).{8,}$/;
            
            if (value.trim() && !pwRegex.test(value)) {
                setCreateFormErrors(prev => ({
                    ...prev,
                    [name]: 'Password must be 8+ chars with uppercase, lowercase, number and special (@,#,$,%,!)'
                }));
            } else {
                setCreateFormErrors(prev => ({
                    ...prev,
                    [name]: ''
                }));
            }
        }
        
        // Real-time validation for experience fields
        if (name === 'experienceYears' || name === 'experience') {
            const numericValue = parseFloat(value);
            
            if (value.trim() && (isNaN(numericValue) || numericValue < 0)) {
                setCreateFormErrors(prev => ({
                    ...prev,
                    [name]: 'Cannot enter negative values'
                }));
            } else if (value.trim() && numericValue === 0 && value !== '0') {
                setCreateFormErrors(prev => ({
                    ...prev,
                    [name]: 'Experience must be a valid number'
                }));
            } else {
                setCreateFormErrors(prev => ({
                    ...prev,
                    [name]: ''
                }));
            }
        }
    };

    const openEdit = (u) => {
        setEditUser(u);
        setEditForm({ 
            firstName: u.firstName || '', 
            lastName: u.lastName || '', 
            email: u.email || '', 
            role: u.role || '', 
            isActive: u.isActive !== undefined ? u.isActive : true, 
            address: u.address || '', 
            phone: u.phone || '',
            specialization: u.specialization || '',
            licenseNumber: u.licenseNumber || '',
            experience: u.experience || '',
            vehicleNumber: u.vehicleNumber || '',
            practicingGovernmentHospital: u.practicingGovernmentHospital || '',
            achievements: u.achievements || '',
            membership: u.membership || '',
            registrationNumber: u.registrationNumber || '',
            otherSpecialization: u.otherSpecialization || '',
            experienceYears: u.experienceYears || '',
            specialNote: u.specialNote || ''
        });
    }

    const handleRoleChange = (newRole) => {
        setEditForm(prev => ({
            ...prev,
            role: newRole,
            // Clear role-specific fields when role changes
            specialization: '',
            licenseNumber: '',
            experience: '',
            vehicleNumber: '',
            practicingGovernmentHospital: '',
            achievements: '',
            membership: '',
            otherSpecialization: '',
            experienceYears: '',
            specialNote: ''
        }));
    }

    const submitEdit = async (e) => {
        e.preventDefault();
        try {
            // Prepare form data with proper field mapping
            const formData = {
                ...editForm,
                experience: editForm.role === 'pharmacist' ? (editForm.experience ? Number(editForm.experience) : 0) : undefined,
                experienceYears: editForm.role === 'doctor' ? (editForm.experienceYears ? Number(editForm.experienceYears) : 0) : undefined
            };

            const response = await fetch(`http://localhost:5001/api/users/${editUser._id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            if (response.ok) {
                toast.success('User updated successfully!');
                setEditUser(null);
                fetchUsers();
            } else {
                const data = await response.json();
                toast.error(data.message || 'Update failed');
            }
        } catch (error) {
            console.error('Error updating user:', error);
            toast.error('Update failed');
        }
    }

    const getRoleColor = (role) => {
        const colors = {
            admin: '#dc2626',
            doctor: '#2563eb',
            pharmacist: '#059669',
            delivery_agent: '#7c3aed',
            customer: '#6b7280'
        };
        return colors[role] || '#6b7280';
    };

    const formatRegistrationDate = (dateString) => {
        if (!dateString) return 'Recently';
        
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) return 'Today';
        if (diffDays === 2) return 'Yesterday';
        if (diffDays <= 7) return `${diffDays - 1} days ago`;
        
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
        });
    };

    // Generate user registration growth data
    const generateUserGrowthData = () => {
        const last7Days = [];
        const userCounts = [];
        
        // Generate last 7 days
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            last7Days.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
            
            // Simulate realistic user growth data
            // Base growth with some randomness and weekend effects
            const isWeekend = date.getDay() === 0 || date.getDay() === 6;
            const baseGrowth = isWeekend ? 1 : 3; // Less growth on weekends
            const randomFactor = Math.floor(Math.random() * 4);
            const totalGrowth = Math.max(0, baseGrowth + randomFactor);
            
            userCounts.push(totalGrowth);
        }
        
        return { labels: last7Days, data: userCounts };
    };

    // Chart configuration
    const chartData = {
        labels: generateUserGrowthData().labels,
        datasets: [
            {
                label: 'New Users',
                data: generateUserGrowthData().data,
                borderColor: '#2563eb',
                backgroundColor: 'rgba(37, 99, 235, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#2563eb',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 6,
                pointHoverRadius: 8,
            }
        ]
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false
            },
            title: {
                display: true,
                text: 'User Registration Growth (Last 7 Days)',
                font: {
                    size: 16,
                    weight: '600'
                },
                color: '#1f2937'
            },
            tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                titleColor: '#ffffff',
                bodyColor: '#ffffff',
                borderColor: '#2563eb',
                borderWidth: 1,
                cornerRadius: 8,
                displayColors: false,
                callbacks: {
                    label: function(context) {
                        return `New Users: ${context.parsed.y}`;
                    }
                }
            }
        },
        scales: {
            x: {
                grid: {
                    display: false
                },
                ticks: {
                    color: '#6b7280',
                    font: {
                        size: 12
                    }
                }
            },
            y: {
                beginAtZero: true,
                grid: {
                    color: 'rgba(0, 0, 0, 0.05)'
                },
                ticks: {
                    color: '#6b7280',
                    font: {
                        size: 12
                    },
                    callback: function(value) {
                        return value;
                    }
                }
            }
        },
        elements: {
            point: {
                hoverBackgroundColor: '#2563eb'
            }
        }
    };

    // Export functions
    const exportToPDF = () => {
        if (filteredUsers.length === 0) {
            toast.error('No users to export');
            return;
        }

        try {
            const doc = new jsPDF();
            
            // Add title
            doc.setFontSize(20);
            doc.text('MediCare Pharmacy - User List', 14, 22);
            doc.setFontSize(12);
            doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 32);
            doc.text(`Total Users: ${filteredUsers.length}`, 14, 42);

            // Prepare data for table
            const tableData = filteredUsers.map(user => [
                `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'N/A',
                user.email || 'N/A',
                (user.role || '').replace('_', ' '),
                user.isActive ? 'Active' : 'Inactive',
                user.isVerified ? 'Verified' : 'Unverified',
                user.phone || 'N/A'
            ]);

            // Add table
            autoTable(doc, {
                head: [['Name', 'Email', 'Role', 'Status', 'Verification', 'Phone']],
                body: tableData,
                startY: 50,
                styles: {
                    fontSize: 10,
                    cellPadding: 3
                },
                headStyles: {
                    fillColor: [37, 99, 235],
                    textColor: 255
                },
                alternateRowStyles: {
                    fillColor: [248, 250, 252]
                },
                margin: { top: 50, right: 14, bottom: 20, left: 14 }
            });

            // Save PDF
            doc.save(`MediCare_Users_${new Date().toISOString().split('T')[0]}.pdf`);
            toast.success('User list exported to PDF successfully!');
        } catch (error) {
            console.error('Error exporting to PDF:', error);
            toast.error('Failed to export to PDF');
        }
    };



    const filteredUsers = users.filter(user => {
        const matchesRole = filterRole === 'all' || user.role === filterRole;
        const matchesSearch = searchQuery === '' || 
            `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesRole && matchesSearch;
    });

    const renderSection = () => {
        switch (activeSection) {
            case 'overview':
                return (
                    <div className="admin-overview">
                        {/* Stats Grid */}
                        <div className="admin-stats">
                            <div className="stat-card">
                                <div className="stat-icon">👥</div>
                                <h3>Total Users</h3>
                                <p className="stat-number">{users.length}</p>
                                <span className="stat-change positive">+{generateUserGrowthData().data.slice(-1)[0]} this week</span>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon">👨‍⚕️</div>
                                <h3>Doctors</h3>
                                <p className="stat-number">{users.filter(u => u.role === 'doctor').length}</p>
                                <span className="stat-change positive">Active medical staff</span>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon">💊</div>
                                <h3>Pharmacists</h3>
                                <p className="stat-number">{users.filter(u => u.role === 'pharmacist').length}</p>
                                <span className="stat-change positive">Pharmacy team</span>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon">🚚</div>
                                <h3>Delivery Agents</h3>
                                <p className="stat-number">{users.filter(u => u.role === 'delivery_agent').length}</p>
                                <span className="stat-change positive">Delivery team</span>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon">👤</div>
                                <h3>Customers</h3>
                                <p className="stat-number">{users.filter(u => u.role === 'customer').length}</p>
                                <span className="stat-change positive">Registered customers</span>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon">📦</div>
                                <h3>Total Products</h3>
                                <p className="stat-number">{productsCount}</p>
                                <span className="stat-change neutral">Inventory items</span>
                            </div>
                        </div>
                        
                        {/* User Growth Chart */}
                        <div className="chart-section">
                            <div className="chart-container">
                                <Line data={chartData} options={chartOptions} />
                            </div>
                        </div>
                        
                        {/* Recently Registered Users */}
                        <div className="recent-users-section">
                            <div className="section-header">
                                <h2>Recently Registered Users</h2>
                                <button 
                                    onClick={() => setActiveSection('users')}
                                    className="view-all-btn"
                                >
                                    View All Users
                                </button>
                            </div>
                            
                            <div className="recent-users-list">
                                {recentUsers.length > 0 ? (
                                    recentUsers.map((user, index) => (
                                        <div key={user._id || index} className="recent-user-card">
                                            <div className="user-avatar-large">
                                                {user.firstName?.charAt(0)?.toUpperCase() || 'U'}
                                            </div>
                                            <div className="user-details">
                                                <div className="user-name">
                                                    {`${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown User'}
                                                </div>
                                                <div className="user-email">{user.email || 'No email'}</div>
                                                <div className="user-role">
                                                    <span 
                                                        className="role-badge-small"
                                                        style={{ backgroundColor: getRoleColor(user.role) }}
                                                    >
                                                        {user.role?.replace('_', ' ') || 'Unknown'}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="user-meta">
                                                <div className="registration-date">
                                                    {formatRegistrationDate(user.createdAt)}
                                                </div>
                                                <div className={`verification-status ${user.isVerified ? 'verified' : 'unverified'}`}>
                                                    {user.isVerified ? '✓ Verified' : '⏳ Pending'}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="no-recent-users">
                                        <div className="no-data-icon">👥</div>
                                        <p>No recent users found</p>
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        {/* Quick Actions */}
                        <div className="quick-actions-section">
                            <h2>Quick Actions</h2>
                            <div className="action-buttons">
                                <button className="action-btn secondary" onClick={() => setActiveSection('users')}>
                                    <span className="action-icon">👥</span>
                                    Manage Users
                                </button>
                                <button className="action-btn secondary" onClick={() => setActiveSection('inventory')}>
                                    <span className="action-icon">📦</span>
                                    Manage Inventory
                                </button>
                                <button className="action-btn secondary" onClick={() => setActiveSection('orders')}>
                                    <span className="action-icon">🛒</span>
                                    View Orders
                                </button>
                                <button className="action-btn secondary" onClick={() => setActiveSection('appointments')}>
                                    <span className="action-icon">📅</span>
                                    Manage Appointments
                                </button>
                            </div>
                        </div>
                    </div>
                );
            
            case 'users':
                return (
                    <div className="users-section">
                        <div className="section-header">
                            <h2>User Management</h2>
                            <div className="header-actions">
                                <div className="export-buttons">
                                    <button 
                                        onClick={exportToPDF}
                                        className="export-btn pdf"
                                        title="Export to PDF"
                                    >
                                        📄 Export PDF
                                    </button>
                                </div>
                                <button 
                                    onClick={() => setShowCreateStaff(true)}
                                    className="create-staff-btn"
                                >
                                    <span className="btn-icon">➕</span>
                                    Create Staff Member
                                </button>
                            </div>
                        </div>

                        <div className="filter-bar">
                            <div className="search-box">
                                <input
                                    type="text"
                                    placeholder="Search users by name or email..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="search-input"
                                />
                                <span className="search-icon"></span>
                            </div>
                            <div className="filter-controls">
                                <label>Filter by role: </label>
                                <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} className="filter-select">
                                    <option value="all">All Roles</option>
                                    <option value="admin">Admin</option>
                                    <option value="doctor">Doctor</option>
                                    <option value="pharmacist">Pharmacist</option>
                                    <option value="delivery_agent">Delivery Agent</option>
                                    <option value="customer">Customer</option>
                                </select>
                            </div>
                        </div>
                        
                        {/*<div className="export-info">
                            <span className="export-note">
                                📄 Export {filteredUsers.length} users to PDF
                            </span>
                        </div>*/}

                        <div className="users-table-container">
                            <div className="table-header">
                                <span>Showing {filteredUsers.length} of {users.length} users</span>
                            </div>
                            <div className="users-table">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Name</th>
                                            <th>Email</th>
                                            <th>Role</th>
                                            <th>Status</th>
                                            <th>Verification</th>
                                            <th>Phone</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredUsers.map(user => (
                                            <tr key={user._id}>
                                                <td>
                                                    <div className="user-info-cell">
                                                        <div className="user-avatar">
                                                            {user.firstName?.charAt(0)?.toUpperCase()}
                                                        </div>
                                                        <span>{`${user.firstName} ${user.lastName}`}</span>
                                                    </div>
                                                </td>
                                                <td>{user.email}</td>
                                                <td>
                                                    <span 
                                                        className="role-badge"
                                                        style={{ backgroundColor: getRoleColor(user.role) }}
                                                    >
                                                        {user.role.replace('_', ' ')}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className={`status-badge ${user.isActive ? 'active' : 'inactive'}`}>
                                                        {user.isActive ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className={`verification-badge ${user.isVerified ? 'verified' : 'unverified'}`}>
                                                        {user.isVerified ? 'Verified' : 'Unverified'}
                                                    </span>
                                                </td>
                                                <td>{user.phone || 'N/A'}</td>
                                                <td>
                                                    <div className="action-buttons">
                                                        <button 
                                                            onClick={() => toggleUserStatus(user._id)}
                                                            className={`toggle-btn ${user.isActive ? 'deactivate' : 'activate'}`}
                                                            title={user.isActive ? 'Deactivate User' : 'Activate User'}
                                                        >
                                                            {user.isActive ? '⏸️' : '▶️'}
                                                        </button>
                                                        <button 
                                                            onClick={() => openEdit(user)}
                                                            className="edit-btn"
                                                            title="Edit User"
                                                        >
                                                            ✏️
                                                        </button>

                                                        <button 
                                                            onClick={() => deleteUser(user._id)}
                                                            className="delete-btn"
                                                            title="Delete User"
                                                        >
                                                            🗑️
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                );












            case 'inventory':
                return (
                    <div className="inventory-section">
                        <h2>Inventory Management</h2>
                        <p>Inventory management features coming soon...</p>
                    </div>
                );

            case 'orders':
                // Derive metrics
                const filtered = orders.filter(o => {
                    const matchesSearch = !orderSearch || (
                        (o._id || '').toLowerCase().includes(orderSearch.toLowerCase()) ||
                        (o?.customer?.name || '').toLowerCase().includes(orderSearch.toLowerCase())
                    );
                    const matchesStatus = orderStatus === 'all' || (o.status || 'pending') === orderStatus;
                    const matchesPayment = orderPayment === 'all' || (o.paymentMethod || 'cod') === orderPayment;
                    return matchesSearch && matchesStatus && matchesPayment;
                }).sort((a,b)=>{
                    if (orderSort === 'newest') return new Date(b.createdAt||0) - new Date(a.createdAt||0);
                    if (orderSort === 'oldest') return new Date(a.createdAt||0) - new Date(b.createdAt||0);
                    if (orderSort === 'amount_desc') return (b.total||0)-(a.total||0);
                    if (orderSort === 'amount_asc') return (a.total||0)-(b.total||0);
                    return 0;
                });

                const countBy = (status) => orders.filter(o => (o.status||'pending') === status).length;

                return (
                    <div className="orders-section">
                        {/* Summary cards */}
                        <div className="orders-kpis">
                            <div className="kpi-card new">
                                <div className="kpi-title">New orders</div>
                                <div className="kpi-value">{countBy('pending')}</div>
                            </div>
                            <div className="kpi-card accept">
                                <div className="kpi-title">Await accepting</div>
                                <div className="kpi-value">{countBy('ready')}</div>
                            </div>
                            <div className="kpi-card onway">
                                <div className="kpi-title">On way orders</div>
                                <div className="kpi-value">{countBy('out_for_delivery') + countBy('picked_up')}</div>
                            </div>
                            <div className="kpi-card delivered">
                                <div className="kpi-title">Delivered orders</div>
                                <div className="kpi-value">{countBy('delivered')}</div>
                            </div>
                        </div>

                        {/* Toolbar */}
                        <div className="orders-toolbar">
                            <div className="search-box">
                                <input className="search-input" placeholder="Search by order ID or customer" value={orderSearch} onChange={e=>setOrderSearch(e.target.value)} />
                            </div>
                            <div className="toolbar-right">
                                <button className="export-btn pdf" onClick={() => exportOrdersCSV(filtered)}>Export</button>
                                <select className="filter-select" value={orderSort} onChange={e=>setOrderSort(e.target.value)}>
                                    <option value="newest">Sort: newest</option>
                                    <option value="oldest">Sort: oldest</option>
                                    <option value="amount_desc">Amount: high → low</option>
                                    <option value="amount_asc">Amount: low → high</option>
                                </select>
                                <select className="filter-select" value={orderStatus} onChange={e=>setOrderStatus(e.target.value)}>
                                    <option value="all">All statuses</option>
                                    <option value="pending">Pending</option>
                                    <option value="ready">Ready</option>
                                    <option value="out_for_delivery">On way</option>
                                    <option value="picked_up">Picked up</option>
                                    <option value="delivered">Delivered</option>
                                    <option value="canceled">Canceled</option>
                                    <option value="failed">Failed</option>
                                </select>
                                <select className="filter-select" value={orderPayment} onChange={e=>setOrderPayment(e.target.value)}>
                                    <option value="all">All payments</option>
                                    <option value="cod">Cash on delivery</option>
                                    <option value="card">Card</option>
                                    <option value="paypal">PayPal</option>
                                </select>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="orders-table-container">
                            {ordersLoading ? (
                                <div className="loading">Loading orders...</div>
                            ) : ordersError ? (
                                <div className="error-box">{ordersError}</div>
                            ) : (
                                <div className="orders-table">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Order</th>
                                                <th>Customer</th>
                                                <th>Items</th>
                                                <th>Total</th>
                                                <th>Date</th>
                                                <th>Payment</th>
                                                <th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filtered.map(o => (
                                                <tr key={o._id}>
                                                    <td>#{(o._id||'').slice(-6)}</td>
                                                    <td>
                                                        <div className="order-customer">
                                                            <div className="name">{o?.customer?.name || '-'}</div>
                                                            <div className="sub">{o?.customer?.phone || ''}</div>
                                                        </div>
                                                    </td>
                                                    <td>{Array.isArray(o.items) ? o.items.reduce((s,it)=>s+(it.quantity||0),0) : 0}</td>
                                                    <td>${Number(o.total||0).toFixed(2)}</td>
                                                    <td>{new Date(o.createdAt||Date.now()).toLocaleDateString()}</td>
                                                    <td className="payment-cell">{(o.paymentMethod||'cod').toUpperCase()}</td>
                                                    <td>
                                                        <span className={`order-status ${o.status||'pending'}`}>
                                                            {formatStatus(o.status)}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    {filtered.length === 0 && (
                                        <div className="empty-state">No orders match your filters.</div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                );

            case 'appointments':
                return (
                    <div className="appointments-section">
                        {/*<h2>Appointment Management</h2>*/}
                        <div className="space-y-6">
                            <ChannelCreator />
                            <AdminAppointments />
                        </div>
                    </div>
                );

            case 'delivery':
                return (
                    <div className="delivery-section">
                        <h2>Delivery Management</h2>
                        <p>Delivery management features coming soon...</p>
                    </div>
                );

            case 'reports':
                return (
                    <div className="reports-section">
                        <h2>Reports & Analytics</h2>
                        <p>Generate comprehensive reports and analytics...</p>
                    </div>
                );

                case 'messages':
                return (
                    <div className="messages-section">
                        <h2>Messages</h2>
                        <p>Messages features coming soon...</p>
                    </div>
                );

            default:
                return null;
        }
    };

    if (loading) {
        return <div className="loading">Loading...</div>;
    }



    //admin dashboard

    return (
        <DashboardLayout 
            title="Admin Dashboard" 
            sidebarItems={sidebarItems}
            onSectionChange={setActiveSection}
            activeSection={activeSection}
            notificationCount={notificationCount}
            notifications={notifications.filter(n => !n.read)}
            onNotificationUpdate={markNotificationAsRead}
            showNotificationPopup={showNotificationPopup}
            setShowNotificationPopup={setShowNotificationPopup}
        >
            <div className="admin-dashboard">
                {renderSection()}
 
                {/* Create Staff Modal */}
                {showCreateStaff && (
                    <div className="modal-overlay">
                        <div className="modal">
                            <div className="modal-header">
                                <h2>Create Staff Member</h2>
                                <button 
                                    onClick={() => setShowCreateStaff(false)}
                                    className="close-btn"
                                >
                                    ×
                                </button>
                            </div>
                            
                            <form onSubmit={handleCreateStaff} className="create-staff-form">
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Role</label>
                                        <select 
                                            value={selectedRole} 
                                            onChange={(e) => setSelectedRole(e.target.value)}
                                        >
                                            <option value="doctor">Doctor</option>
                                            <option value="pharmacist">Pharmacist</option>
                                            <option value="delivery_agent">Delivery Agent</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>First Name</label>
                                        <input
                                            type="text"
                                            name="firstName"
                                            value={createForm.firstName}
                                            onChange={handleCreateFormChange}
                                            onKeyDown={(e) => preventInvalidNameChar(e, 'create')}
                                            onPaste={(e) => preventInvalidNamePaste(e, 'create')}
                                            required
                                            className={createFormErrors.firstName ? 'border-red-500 bg-red-50' : ''}
                                        />
                                        {createFormErrors.firstName && (
                                            <p className="text-xs text-red-600 mt-1">{createFormErrors.firstName}</p>
                                        )}
                                    </div>
                                    <div className="form-group">
                                        <label>Last Name</label>
                                        <input
                                            type="text"
                                            name="lastName"
                                            value={createForm.lastName}
                                            onChange={handleCreateFormChange}
                                            onKeyDown={(e) => preventInvalidNameChar(e, 'create')}
                                            onPaste={(e) => preventInvalidNamePaste(e, 'create')}
                                            required
                                            className={createFormErrors.lastName ? 'border-red-500 bg-red-50' : ''}
                                        />
                                        {createFormErrors.lastName && (
                                            <p className="text-xs text-red-600 mt-1">{createFormErrors.lastName}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Email</label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={createForm.email}
                                            onChange={handleCreateFormChange}
                                            required
                                            className={createFormErrors.email ? 'border-red-500 bg-red-50' : ''}
                                        />
                                        {createFormErrors.email && (
                                            <p className="text-xs text-red-600 mt-1">{createFormErrors.email}</p>
                                        )}
                                    </div>
                                    <div className="form-group">
                                        <label>Password</label>
                                        <input
                                            type="password"
                                            name="password"
                                            value={createForm.password}
                                            onChange={handleCreateFormChange}
                                            required
                                            className={createFormErrors.password ? 'border-red-500 bg-red-50' : ''}
                                        />
                                        {createFormErrors.password && (
                                            <p className="text-xs text-red-600 mt-1">{createFormErrors.password}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Phone</label>
                                        <input
                                            type="tel"
                                            name="phone"
                                            value={createForm.phone}
                                            onChange={handleCreateFormChange}
                                            onKeyDown={(e) => handlePhoneKeyDown(e, 'create')}
                                            onPaste={(e) => handlePhonePaste(e, 'create')}
                                            required
                                            className={createFormErrors.phone ? 'border-red-500 bg-red-50' : ''}
                                            placeholder="07XXXXXXXX"
                                        />
                                        {createFormErrors.phone && (
                                            <p className="text-xs text-red-600 mt-1">{createFormErrors.phone}</p>
                                        )}
                                    </div>
                                    <div className="form-group">
                                        <label>Registration Number</label>
                                        <input
                                            type="text"
                                            value={createForm.registrationNumber}
                                            onChange={(e) => setCreateForm({...createForm, registrationNumber: e.target.value})}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Address</label>
                                    <textarea
                                        value={createForm.address}
                                        onChange={(e) => setCreateForm({...createForm, address: e.target.value})}
                                        required
                                    />
                                </div>

                                {selectedRole === 'doctor' && (
                                    <div className="doctor-fields">
                                        <h3>Doctor-Specific Information</h3>
                                        <div className="form-row">
                                            <div className="form-group">
                                                <label>Specialization</label>
                                                <select
                                                    value={createForm.specialization}
                                                    onChange={(e) => setCreateForm({...createForm, specialization: e.target.value})}
                                                    required
                                                >
                                                    <option value="">Select Specialization</option>
                                                    <option value="Cardiology">Cardiology</option>
                                                    <option value="Neurology">Neurology</option>
                                                    <option value="Orthopedics">Orthopedics</option>
                                                    <option value="Pediatrics">Pediatrics</option>
                                                    <option value="Dermatology">Dermatology</option>
                                                    <option value="Oncology">Oncology</option>
                                                    <option value="Psychiatry">Psychiatry</option>
                                                    <option value="Surgery">Surgery</option>
                                                    <option value="Internal Medicine">Internal Medicine</option>
                                                    <option value="Emergency Medicine">Emergency Medicine</option>
                                                    <option value="Other">Other</option>
                                                </select>
                                            </div>
                                            <div className="form-group">
                                                <label>Experience (Years)</label>
                                                <input
                                                    type="number"
                                                    name="experienceYears"
                                                    value={createForm.experienceYears}
                                                    onChange={handleCreateFormChange}
                                                    onKeyDown={(e) => handleExperienceKeyDown(e, 'create')}
                                                    onPaste={(e) => handleExperiencePaste(e, 'create')}
                                                    required
                                                    className={createFormErrors.experienceYears ? 'border-red-500 bg-red-50' : ''}
                                                />
                                                {createFormErrors.experienceYears && (
                                                    <p className="text-xs text-red-600 mt-1">{createFormErrors.experienceYears}</p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="form-row">
                                            <div className="form-group">
                                                <label>Practicing Government Hospital</label>
                                                <input
                                                    type="text"
                                                    value={createForm.practicingGovernmentHospital}
                                                    onChange={(e) => setCreateForm({...createForm, practicingGovernmentHospital: e.target.value})}
                                                    placeholder="Hospital name if applicable"
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label>Other Specialization</label>
                                                <input
                                                    type="text"
                                                    value={createForm.otherSpecialization}
                                                    onChange={(e) => setCreateForm({...createForm, otherSpecialization: e.target.value})}
                                                    placeholder="Additional specializations"
                                                />
                                            </div>
                                        </div>

                                        <div className="form-group">
                                            <label>Achievements</label>
                                            <textarea
                                                value={createForm.achievements}
                                                onChange={(e) => setCreateForm({...createForm, achievements: e.target.value})}
                                                placeholder="Professional achievements, awards, etc."
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label>Membership</label>
                                            <textarea
                                                value={createForm.membership}
                                                onChange={(e) => setCreateForm({...createForm, membership: e.target.value})}
                                                placeholder="Professional memberships, associations, etc."
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label>Special Note</label>
                                            <textarea
                                                value={createForm.specialNote}
                                                onChange={(e) => setCreateForm({...createForm, specialNote: e.target.value})}
                                                placeholder="Any additional notes or special requirements"
                                            />
                                        </div>
                                    </div>
                                )}

                                {selectedRole === 'pharmacist' && (
                                    <div className="doctor-fields">
                                        <h3>Pharmacist-Specific Information</h3>
                                        <div className="form-row">
                                            <div className="form-group">
                                                <label>License Number</label>
                                                <input
                                                    type="text"
                                                    value={createForm.licenseNumber}
                                                    onChange={(e) => setCreateForm({...createForm, licenseNumber: e.target.value})}
                                                    required
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label>Experience (years)</label>
                                                <input
                                                    type="number"
                                                    name="experience"
                                                    value={createForm.experience}
                                                    onChange={handleCreateFormChange}
                                                    onKeyDown={(e) => handleExperienceKeyDown(e, 'create')}
                                                    onPaste={(e) => handleExperiencePaste(e, 'create')}
                                                    required
                                                    className={createFormErrors.experience ? 'border-red-500 bg-red-50' : ''}
                                                />
                                                {createFormErrors.experience && (
                                                    <p className="text-xs text-red-600 mt-1">{createFormErrors.experience}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {selectedRole === 'delivery_agent' && (
                                    <div className="doctor-fields">
                                        <h3>Delivery Agent-Specific Information</h3>
                                        <div className="form-group">
                                            <label>Vehicle Number</label>
                                            <input
                                                type="text"
                                                value={createForm.vehicleNumber}
                                                onChange={(e) => setCreateForm({...createForm, vehicleNumber: e.target.value})}
                                                required
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="modal-actions">
                                    <button type="submit" className="submit-btn">Create Staff Member</button>
                                    <button 
                                        type="button" 
                                        onClick={() => setShowCreateStaff(false)}
                                        className="cancel-btn"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Edit User Modal */}
                {editUser && (
                    <div className="modal-overlay">
                        <div className="modal">
                            <div className="modal-header">
                                <h2>Edit User</h2>
                                <button 
                                    onClick={() => setEditUser(null)}
                                    className="close-btn"
                                >
                                    ×
                                </button>
                            </div>

                            <form onSubmit={submitEdit} className="create-staff-form">
                                {/* Basic Information */}
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>First Name</label>
                                        <input
                                            type="text"
                                            value={editForm.firstName}
                                            onChange={(e) => setEditForm({...editForm, firstName: e.target.value})}
                                            onKeyDown={(e) => {
                                                if ((e.target.value || '').length === 0) {
                                                    const controlKeys = ['Backspace','Tab','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End','Delete'];
                                                    if (!controlKeys.includes(e.key) && !/^[A-Za-z]$/.test(e.key)) e.preventDefault();
                                                }
                                            }}
                                            onPaste={(e) => {
                                                if ((e.target.value || '').length === 0) {
                                                    const pasted = (e.clipboardData || window.clipboardData).getData('text');
                                                    if (pasted && !/^[A-Za-z]/.test(pasted.trimStart())) e.preventDefault();
                                                }
                                            }}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Last Name</label>
                                        <input
                                            type="text"
                                            value={editForm.lastName}
                                            onChange={(e) => setEditForm({...editForm, lastName: e.target.value})}
                                            onKeyDown={(e) => {
                                                if ((e.target.value || '').length === 0) {
                                                    const controlKeys = ['Backspace','Tab','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End','Delete'];
                                                    if (!controlKeys.includes(e.key) && !/^[A-Za-z]$/.test(e.key)) e.preventDefault();
                                                }
                                            }}
                                            onPaste={(e) => {
                                                if ((e.target.value || '').length === 0) {
                                                    const pasted = (e.clipboardData || window.clipboardData).getData('text');
                                                    if (pasted && !/^[A-Za-z]/.test(pasted.trimStart())) e.preventDefault();
                                                }
                                            }}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Email</label>
                                        <input
                                            type="email"
                                            value={editForm.email}
                                            onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Phone</label>
                                        <input
                                            type="tel"
                                            value={editForm.phone}
                                            onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                                        />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Address</label>
                                        <input
                                            type="text"
                                            value={editForm.address}
                                            onChange={(e) => setEditForm({...editForm, address: e.target.value})}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Registration Number</label>
                                        <input
                                            type="text"
                                            value={editForm.registrationNumber}
                                            onChange={(e) => setEditForm({...editForm, registrationNumber: e.target.value})}
                                        />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Role</label>
                                        <select
                                            value={editForm.role}
                                            onChange={(e)=> handleRoleChange(e.target.value)}
                                        >
                                            <option value="customer">Customer</option>
                                            <option value="doctor">Doctor</option>
                                            <option value="pharmacist">Pharmacist</option>
                                            <option value="delivery_agent">Delivery Agent</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Status</label>
                                        <select
                                            value={editForm.isActive ? 'active' : 'inactive'}
                                            onChange={(e)=> setEditForm({...editForm, isActive: e.target.value==='active'})}
                                        >
                                            <option value="active">Active</option>
                                            <option value="inactive">Inactive</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Doctor-specific fields */}
                                {editForm.role === 'doctor' && (
                                    <div className="doctor-fields">
                                        <h3>Doctor-Specific Information</h3>
                                        <div className="form-row">
                                            <div className="form-group">
                                                <label>Specialization</label>
                                                <select
                                                    value={editForm.specialization}
                                                    onChange={(e) => setEditForm({...editForm, specialization: e.target.value})}
                                                >
                                                    <option value="">Select Specialization</option>
                                                    <option value="Cardiology">Cardiology</option>
                                                    <option value="Neurology">Neurology</option>
                                                    <option value="Orthopedics">Orthopedics</option>
                                                    <option value="Pediatrics">Pediatrics</option>
                                                    <option value="Dermatology">Dermatology</option>
                                                    <option value="Oncology">Oncology</option>
                                                    <option value="Psychiatry">Psychiatry</option>
                                                    <option value="General Medicine">General Medicine</option>
                                                    <option value="Surgery">Surgery</option>
                                                    <option value="Emergency Medicine">Emergency Medicine</option>
                                                </select>
                                            </div>
                                            <div className="form-group">
                                                <label>Experience (Years)</label>
                                                <input
                                                    type="number"
                                                    value={editForm.experienceYears}
                                                    onChange={(e) => setEditForm({...editForm, experienceYears: e.target.value})}
                                                    min="0"
                                                />
                                            </div>
                                        </div>

                                        <div className="form-row">
                                            <div className="form-group">
                                                <label>Practicing Government Hospital</label>
                                                <input
                                                    type="text"
                                                    value={editForm.practicingGovernmentHospital}
                                                    onChange={(e) => setEditForm({...editForm, practicingGovernmentHospital: e.target.value})}
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label>Other Specialization</label>
                                                <input
                                                    type="text"
                                                    value={editForm.otherSpecialization}
                                                    onChange={(e) => setEditForm({...editForm, otherSpecialization: e.target.value})}
                                                />
                                            </div>
                                        </div>

                                        <div className="form-group">
                                            <label>Achievements</label>
                                            <textarea
                                                value={editForm.achievements}
                                                onChange={(e) => setEditForm({...editForm, achievements: e.target.value})}
                                                placeholder="Enter achievements and awards"
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label>Membership</label>
                                            <textarea
                                                value={editForm.membership}
                                                onChange={(e) => setEditForm({...editForm, membership: e.target.value})}
                                                placeholder="Enter professional memberships"
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label>Special Note</label>
                                            <textarea
                                                value={editForm.specialNote}
                                                onChange={(e) => setEditForm({...editForm, specialNote: e.target.value})}
                                                placeholder="Enter any special notes or additional information"
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Pharmacist-specific fields */}
                                {editForm.role === 'pharmacist' && (
                                    <div className="doctor-fields">
                                        <h3>Pharmacist-Specific Information</h3>
                                        <div className="form-row">
                                            <div className="form-group">
                                                <label>License Number</label>
                                                <input
                                                    type="text"
                                                    value={editForm.licenseNumber}
                                                    onChange={(e) => setEditForm({...editForm, licenseNumber: e.target.value})}
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label>Experience (Years)</label>
                                                <input
                                                    type="number"
                                                    value={editForm.experience}
                                                    onChange={(e) => setEditForm({...editForm, experience: e.target.value})}
                                                    min="0"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Delivery Agent-specific fields */}
                                {editForm.role === 'delivery_agent' && (
                                    <div className="doctor-fields">
                                        <h3>Delivery Agent-Specific Information</h3>
                                        <div className="form-group">
                                            <label>Vehicle Number</label>
                                            <input
                                                type="text"
                                                value={editForm.vehicleNumber}
                                                onChange={(e) => setEditForm({...editForm, vehicleNumber: e.target.value})}
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="modal-actions">
                                    <button type="submit" className="submit-btn">Save Changes</button>
                                    <button 
                                        type="button" 
                                        onClick={() => setEditUser(null)}
                                        className="cancel-btn"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default AdminDashboard;




// ChannelCreator Component

function ChannelCreator() {
    const { token } = useAuth();
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState({ 
        doctorId: '', 
        title: 'Consultation', 
        specialization: '', 
        location: '', 
        date: '', 
        startTime: '', 
        endTime: '', 
        capacity: 10, 
        price: 0, 
        paymentType: 'online', 
        mode: 'physical', 
        notes: '',
        slotDuration: 10
    });
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState({
        capacity: '',
        price: '',
        slotDuration: ''
    });

    useEffect(() => {
        const loadDoctors = async () => {
            try {
                const res = await fetch('http://localhost:5001/api/users/role/doctor', { headers: { 'Authorization': `Bearer ${token}` } });
                if (!res.ok) throw new Error('Failed to load doctors');
                const data = await res.json();
                setDoctors(data);
            } catch (e) {
                setError(e.message);
            } finally {
                setLoading(false);
            }
        };
        loadDoctors();
    }, [token]);

    const handleKeyDown = (e) => {
        const { name } = e.target;
        
        // Prevent minus (-) character in numeric fields
        if ((name === 'capacity' || name === 'price' || name === 'slotDuration') && e.key === '-') {
            e.preventDefault();
            setFieldErrors(prev => ({
                ...prev,
                [name]: 'Minus (-) values are not allowed'
            }));
        }
    };

    const handlePaste = (e) => {
        const { name } = e.target;
        
        // Prevent pasting content with minus (-) in numeric fields
        if (name === 'capacity' || name === 'price' || name === 'slotDuration') {
            const pastedText = (e.clipboardData || window.clipboardData).getData('text');
            if (pastedText.includes('-')) {
                e.preventDefault();
                setFieldErrors(prev => ({
                    ...prev,
                    [name]: 'Minus (-) values are not allowed'
                }));
            }
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        
        // Auto-populate specialization when doctor is selected
        if (name === 'doctorId' && value) {
            const selectedDoctor = doctors.find(d => d._id === value);
            if (selectedDoctor && selectedDoctor.specialization) {
                setForm(prev => ({ 
                    ...prev, 
                    [name]: value, 
                    specialization: selectedDoctor.specialization 
                }));
                return;
            }
        }
        
        // Clear field-specific error when user types
        if (fieldErrors[name]) {
            setFieldErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
        
        // Real-time validation for numeric fields
        if (name === 'capacity' || name === 'price' || name === 'slotDuration') {
            const numericValue = parseFloat(value);
            
            if (value.trim() && (isNaN(numericValue) || numericValue < 0)) {
                setFieldErrors(prev => ({
                    ...prev,
                    [name]: 'Cannot enter negative values'
                }));
            } else if (value.trim() && numericValue === 0 && (name === 'capacity' || name === 'slotDuration')) {
                setFieldErrors(prev => ({
                    ...prev,
                    [name]: 'Value must be greater than 0'
                }));
            } else {
                setFieldErrors(prev => ({
                    ...prev,
                    [name]: ''
                }));
            }
        }
        
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        try {
            const res = await fetch('http://localhost:5001/api/appointments', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    doctorId: form.doctorId,
                    title: form.title,
                    specialization: form.specialization,
                    location: form.location,
                    date: form.date,
                    startTime: form.startTime,
                    endTime: form.endTime,
                    capacity: Number(form.capacity),
                    price: Number(form.price),
                    paymentType: form.paymentType,
                    mode: form.mode,
                    notes: form.notes,
                    slotDuration: Number(form.slotDuration)
                })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed to create channel');
            setMessage('Channel created');
            setForm({ doctorId: '', title: 'Consultation', specialization: '', location: '', date: '', startTime: '', endTime: '', capacity: 10, price: 0, paymentType: 'online', mode: 'physical', notes: '', slotDuration: 10 });
            // Auto-refresh page after successful appointment creation
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } catch (e) {
            setError(e.message);
        }
    };

    const validate = () => {
        let hasErrors = false;
        const newFieldErrors = { ...fieldErrors };
        
        if (!form.doctorId) { setError('Please select a doctor'); return false; }
        if (!form.date || !form.startTime || !form.endTime) { setError('Please provide date and time'); return false; }
        if (form.startTime >= form.endTime) { setError('End time must be after start time'); return false; }
        
        // Validate capacity
        const capacity = Number(form.capacity);
        if (isNaN(capacity) || capacity < 0) {
            newFieldErrors.capacity = 'Cannot enter negative values';
            hasErrors = true;
        } else if (capacity < 1) {
            newFieldErrors.capacity = 'Capacity must be at least 1';
            hasErrors = true;
        } else {
            newFieldErrors.capacity = '';
        }
        
        // Validate price
        const price = Number(form.price);
        if (isNaN(price) || price < 0) {
            newFieldErrors.price = 'Cannot enter negative values';
            hasErrors = true;
        } else {
            newFieldErrors.price = '';
        }
        
        // Validate slot duration
        const slotDuration = Number(form.slotDuration);
        if (isNaN(slotDuration) || slotDuration < 0) {
            newFieldErrors.slotDuration = 'Cannot enter negative values';
            hasErrors = true;
        } else if (slotDuration < 1) {
            newFieldErrors.slotDuration = 'Slot duration must be at least 1 minute';
            hasErrors = true;
        } else {
            newFieldErrors.slotDuration = '';
        }
        
        setFieldErrors(newFieldErrors);
        
        if (hasErrors) {
            setError('Please fix the errors in the form');
            return false;
        }
        
        return true;
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;
        await handleSubmit(e);
    };

    return (
        <div className="bg-white rounded-xl shadow p-6">
            <div className="mb-4">
                <div className="text-lg font-semibold text-gray-900">Create Channel</div>
                <div className="text-sm text-gray-500">Publish doctor availability patients can book</div>
            </div>

            {loading && <div>Loading doctors...</div>}
            {error && <div className="mb-3 px-3 py-2 rounded bg-red-50 text-red-700 text-sm">{error}</div>}
            {message && <div className="mb-3 px-3 py-2 rounded bg-green-50 text-green-700 text-sm">{message}</div>}

            {!loading && (
                <form onSubmit={onSubmit} className="space-y-5">
                    <div>
                        <div className="text-sm font-medium text-gray-700 mb-2">Doctor & Specialty</div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm text-gray-600">Doctor</label>
                                <select name="doctorId" value={form.doctorId} onChange={handleChange} required className="mt-1 w-full border rounded-lg px-3 py-2">
                                    <option value="">Select doctor</option>
                                    {doctors.map(d => (
                                        <option key={d._id} value={d._id}>Dr. {d.firstName} {d.lastName} ({d.specialization || 'General'})</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm text-gray-600">Specialization</label>
                                <input 
                                    name="specialization" 
                                    value={form.specialization} 
                                    onChange={handleChange} 
                                    placeholder="Auto-filled from selected doctor" 
                                    className="mt-1 w-full border rounded-lg px-3 py-2 bg-gray-50" 
                                    readOnly={form.doctorId ? true : false}
                                />
                                {form.doctorId && (
                                    <p className="text-xs text-gray-500 mt-1">✓ Auto-filled from doctor's specialization</p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div>
                        <div className="text-sm font-medium text-gray-700 mb-2">Session Details</div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm text-gray-600">Title</label>
                                <input name="title" value={form.title} onChange={handleChange} className="mt-1 w-full border rounded-lg px-3 py-2" />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-600">Location</label>
                                <input name="location" value={form.location} onChange={handleChange} placeholder="Hospital/Clinic or Online" className="mt-1 w-full border rounded-lg px-3 py-2" />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-600">Date</label>
                                <input type="date" name="date" value={form.date} onChange={handleChange} required min={new Date().toISOString().split('T')[0]} className="mt-1 w-full border rounded-lg px-3 py-2" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-gray-600">Start</label>
                                    <input type="time" name="startTime" value={form.startTime} onChange={handleChange} required className="mt-1 w-full border rounded-lg px-3 py-2" />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-600">End</label>
                                    <input type="time" name="endTime" value={form.endTime} onChange={handleChange} required className="mt-1 w-full border rounded-lg px-3 py-2" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <div className="text-sm font-medium text-gray-700 mb-2">Capacity & Fees</div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm text-gray-600">Max Patients</label>
                                <input 
                                    type="number" 
                                    min="1" 
                                    name="capacity" 
                                    value={form.capacity} 
                                    onChange={handleChange}
                                    onKeyDown={handleKeyDown}
                                    onPaste={handlePaste}
                                    className={`mt-1 w-full border rounded-lg px-3 py-2 ${fieldErrors.capacity ? 'border-red-500 bg-red-50' : ''}`} 
                                />
                                {fieldErrors.capacity && (
                                    <p className="text-xs text-red-600 mt-1">{fieldErrors.capacity}</p>
                                )}
                                <p className="text-xs text-gray-500 mt-1">Total slots available</p>
                            </div>
                            <div>
                                <label className="block text-sm text-gray-600">Slot Duration (min)</label>
                                <input 
                                    type="number" 
                                    min="5" 
                                    max="60" 
                                    name="slotDuration" 
                                    value={form.slotDuration} 
                                    onChange={handleChange}
                                    onKeyDown={handleKeyDown}
                                    onPaste={handlePaste}
                                    className={`mt-1 w-full border rounded-lg px-3 py-2 ${fieldErrors.slotDuration ? 'border-red-500 bg-red-50' : ''}`} 
                                />
                                {fieldErrors.slotDuration && (
                                    <p className="text-xs text-red-600 mt-1">{fieldErrors.slotDuration}</p>
                                )}
                                <p className="text-xs text-gray-500 mt-1">Time per appointment</p>
                            </div>
                            <div>
                                <label className="block text-sm text-gray-600">Consultation Fee</label>
                                <input 
                                    type="number" 
                                    min="0" 
                                    step="0.01" 
                                    name="price" 
                                    value={form.price} 
                                    onChange={handleChange}
                                    onKeyDown={handleKeyDown}
                                    onPaste={handlePaste}
                                    className={`mt-1 w-full border rounded-lg px-3 py-2 ${fieldErrors.price ? 'border-red-500 bg-red-50' : ''}`} 
                                />
                                {fieldErrors.price && (
                                    <p className="text-xs text-red-600 mt-1">{fieldErrors.price}</p>
                                )}
                                <p className="text-xs text-gray-500 mt-1">LKR per appointment</p>
                            </div>
                            <div>
                                <label className="block text-sm text-gray-600">Payment Method</label>
                                <select name="paymentType" value={form.paymentType} onChange={handleChange} className="mt-1 w-full border rounded-lg px-3 py-2">
                                    <option value="online">Online</option>
                                    <option value="cash">Cash on Arrival</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div>
                        <div className="text-sm font-medium text-gray-700 mb-2">Mode</div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <label className="flex items-center gap-2 border rounded-lg px-3 py-2 cursor-pointer">
                                <input type="radio" name="mode" value="physical" checked={form.mode === 'physical'} onChange={handleChange} />
                                <span>Physical</span>
                            </label>
                            <label className="flex items-center gap-2 border rounded-lg px-3 py-2 cursor-pointer">
                                <input type="radio" name="mode" value="video" checked={form.mode === 'video'} onChange={handleChange} />
                                <span>Video</span>
                            </label>
                            <label className="flex items-center gap-2 border rounded-lg px-3 py-2 cursor-pointer">
                                <input type="radio" name="mode" value="audio" checked={form.mode === 'audio'} onChange={handleChange} />
                                <span>Audio</span>
                            </label>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm text-gray-600">Notes</label>
                        <textarea name="notes" value={form.notes} onChange={handleChange} className="mt-1 w-full border rounded-lg px-3 py-2" />
                    </div>

                    {/* Time Slots Preview */}
                    {form.startTime && form.endTime && form.capacity && form.slotDuration && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <h4 className="text-sm font-semibold text-blue-900 mb-3">📅 Generated Time Slots Preview</h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                {(() => {
                                    const slots = [];
                                    const startTime = form.startTime;
                                    const endTime = form.endTime;
                                    const capacity = Number(form.capacity);
                                    const slotDuration = Number(form.slotDuration);
                                    
                                    // Parse start and end times
                                    const [startHour, startMin] = startTime.split(':').map(Number);
                                    const [endHour, endMin] = endTime.split(':').map(Number);
                                    
                                    const startMinutes = startHour * 60 + startMin;
                                    const endMinutes = endHour * 60 + endMin;
                                    const totalDuration = endMinutes - startMinutes;
                                    
                                    // Calculate number of slots
                                    const maxSlots = Math.floor(totalDuration / slotDuration);
                                    const actualSlots = Math.min(capacity, maxSlots);
                                    
                                    for (let i = 0; i < actualSlots; i++) {
                                        const slotMinutes = startMinutes + (i * slotDuration);
                                        const slotHour = Math.floor(slotMinutes / 60);
                                        const slotMin = slotMinutes % 60;
                                        const timeString = `${slotHour.toString().padStart(2, '0')}:${slotMin.toString().padStart(2, '0')}`;
                                        
                                        slots.push(
                                            <div key={i} className="bg-white border border-blue-200 rounded px-2 py-1 text-xs text-center">
                                                <div className="font-medium">#{i + 1}</div>
                                                <div className="text-blue-600">{timeString}</div>
                                            </div>
                                        );
                                    }
                                    
                                    return slots;
                                })()}
                            </div>
                            <p className="text-xs text-blue-700 mt-2">
                                {form.capacity} slots • {form.slotDuration} min each • {form.startTime} - {form.endTime}
                            </p>
                        </div>
                    )}

                    <div className="flex justify-end">
                        <button type="submit" className="btn-primary">Create Channel</button>
                    </div>
                </form>
            )}
        </div>
    );
}

function AdminAppointments() {
    const { token } = useAuth();
    const [stats, setStats] = useState({ today: 0, week: 0, month: 0, statusCounts: {}, upcoming: [] });
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showReschedule, setShowReschedule] = useState(false);
    const [selected, setSelected] = useState(null);
    const [resForm, setResForm] = useState({ date: '', startTime: '', endTime: '', reason: '' });

    useEffect(() => {
        const load = async () => {
            try {
                const [statsRes, listRes] = await Promise.all([
                    fetch('http://localhost:5001/api/bookings/stats', { headers: { 'Authorization': `Bearer ${token}` } }),
                    fetch('http://localhost:5001/api/bookings', { headers: { 'Authorization': `Bearer ${token}` } })
                ]);
                const statsData = await statsRes.json();
                const listData = await listRes.json();
                if (!statsRes.ok) throw new Error(statsData.message || 'Failed to load stats');
                if (!listRes.ok) throw new Error(listData.message || 'Failed to load bookings');
                setStats(statsData);
                setBookings(listData);
            } catch (e) {
                setError(e.message);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [token]);

    const [channels, setChannels] = useState([]);
    useEffect(() => {
        const loadChannels = async () => {
            const res = await fetch('http://localhost:5001/api/appointments', { headers: { 'Authorization': `Bearer ${token}` } });
            const data = await res.json();
            if (res.ok) setChannels(data);
        };
        loadChannels();
    }, [token]);

    const deleteChannel = async (id) => {
        // Find the channel to get its details
        const channel = channels.find(c => c._id === id);
        if (!channel) return;
        
        // Show confirmation dialog
        const confirmed = window.confirm(
            `Are you sure you want to delete this channel?\n\n` +
            `Channel: ${channel.title || 'Consultation'}\n` +
            `Date: ${new Date(channel.date).toLocaleDateString()}\n` +
            `Time: ${channel.startTime} - ${channel.endTime}\n\n` +
            `This will also delete ALL appointments under this channel!\n` +
            `This action cannot be undone.`
        );
        
        if (!confirmed) return;
        
        try {
            const res = await fetch(`http://localhost:5001/api/appointments/${id}`, { 
                method: 'DELETE', 
                headers: { 'Authorization': `Bearer ${token}` } 
            });
            
            if (res.ok) {
                const data = await res.json();
                alert(`Channel deleted successfully!\n\nDeleted ${data.deletedBookingsCount || 0} associated appointments.`);
                setChannels(prev => prev.filter(c => c._id !== id));
            } else {
                const errorData = await res.json();
                alert(`Error: ${errorData.message || 'Failed to delete channel'}`);
            }
        } catch (error) {
            alert(`Error: ${error.message}`);
        }
    };

    const cancelChannel = async (id) => {
        // Find the channel to get its details
        const channel = channels.find(c => c._id === id);
        if (!channel) return;
        
        // Show confirmation dialog
        const confirmed = window.confirm(
            `Are you sure you want to cancel this channel?\n\n` +
            `Channel: ${channel.title || 'Consultation'}\n` +
            `Date: ${new Date(channel.date).toLocaleDateString()}\n` +
            `Time: ${channel.startTime} - ${channel.endTime}\n\n` +
            `This will make the channel inactive and prevent new bookings.\n` +
            `Existing bookings will remain but patients should be notified.`
        );
        
        if (!confirmed) return;
        
        try {
            const res = await fetch(`http://localhost:5001/api/appointments/${id}/cancel`, { 
                method: 'PATCH', 
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } 
            });
            
            if (res.ok) {
                const data = await res.json();
                alert(`Channel canceled successfully!\n\n${data.affectedBookings || 0} existing bookings are affected.\nPatients should be notified about the cancellation.`);
                setChannels(prev => prev.map(c => c._id === id ? { ...c, isActive: false, status: 'cancelled' } : c));
            } else {
                const errorData = await res.json();
                alert(`Error: ${errorData.message || 'Failed to cancel channel'}`);
            }
        } catch (error) {
            alert(`Error: ${error.message}`);
        }
    };



    const openReschedule = (b) => { setSelected(b); setResForm({ date: b.date?.slice(0,10) || '', startTime: b.startTime || '', endTime: b.endTime || '', reason: '' }); setShowReschedule(true); };

    const submitReschedule = async (e) => {
        e.preventDefault();
        
        // Validate required fields
        if (!resForm.reason.trim()) {
            alert('Please provide a reschedule reason');
            return;
        }
        
        try {
            const res = await fetch(`http://localhost:5001/api/appointments/${selected._id}`, {
                method: 'PATCH', 
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, 
                body: JSON.stringify({
                    date: resForm.date,
                    startTime: resForm.startTime,
                    endTime: resForm.endTime,
                    rescheduleReason: resForm.reason // Backend expects 'rescheduleReason' field
                })
            });
            const data = await res.json();
            if (res.ok) {
                setShowReschedule(false);
                // Auto-refresh page after successful reschedule to show updated date/time
                window.location.reload();
            } else {
                alert(`Error: ${data.message || 'Failed to reschedule appointment'}`);
            }
        } catch (error) {
            console.error('Reschedule error:', error);
            alert('Network error occurred. Please try again.');
        }
    };


    if (loading) return <div>Loading...</div>;
    if (error) return <div className="text-red-600">{error}</div>;

    return (
        <div className="admin-appointments-ui">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-xl shadow p-4">
                    <div className="text-gray-500 text-sm">Total Today</div>
                    <div className="text-2xl font-bold">{stats.today}</div>
                </div>
                <div className="bg-white rounded-xl shadow p-4">
                    <div className="text-gray-500 text-sm">This Week</div>
                    <div className="text-2xl font-bold">{stats.week}</div>
                </div>
                <div className="bg-white rounded-xl shadow p-4">
                    <div className="text-gray-500 text-sm">This Month</div>
                    <div className="text-2xl font-bold">{stats.month}</div>
                </div>
            </div>



            <div className="bg-white rounded-xl shadow p-4">
                <div className="mb-3">
                    <div className="font-semibold text-gray-800">Appointments</div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left text-gray-600">
                                <th className="p-2">Appointment ID</th>
                                <th className="p-2">Patient</th>
                                <th className="p-2">Doctor</th>
                                <th className="p-2">Date & Time</th>
                                <th className="p-2">Payment</th>
                                <th className="p-2">Channel</th>
                            </tr>
                        </thead>
                        <tbody>
                            {bookings.map(b => (
                                <tr key={b._id} className="border-t">
                                    <td className="p-2 text-gray-800">{b.referenceNo}</td>
                                    <td className="p-2">
                                        <div className="text-gray-800 font-medium">{b.patientName}</div>
                                        <div className="text-gray-500">{b.patientEmail} • {b.patientPhone}</div>
                                    </td>
                                    <td className="p-2">
                                        <div className="text-gray-800">Dr. {b.doctorName}</div>
                                        <div className="text-gray-500 text-xs">{b.specialization}</div>
                                    </td>
                                    <td className="p-2 text-gray-700">{new Date(b.date).toLocaleDateString()} • {b.startTime}</td>
                                    <td className="p-2 capitalize">{b.paymentStatus}</td>
                                    <td className="p-2 capitalize">{b.channel}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow p-4 mt-6">
                <div className="flex items-center justify-between mb-3">
                    <div className="font-semibold text-gray-800">Created Channels</div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left text-gray-600">
                                <th className="p-2">Channel ID</th>
                                <th className="p-2">Doctor</th>
                                <th className="p-2">Specialty</th>
                                <th className="p-2">Date & Time</th>
                                <th className="p-2">Slots</th>
                                <th className="p-2">Fee</th>
                                <th className="p-2">Mode</th>
                                <th className="p-2">Status</th>
                                <th className="p-2">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {channels.map(c => (
                                <tr key={c._id} className="border-top">
                                    <td className="p-2 text-gray-800 font-mono text-xs">{c.appointmentNo}</td>
                                    <td className="p-2">
                                        <div className="font-medium">Dr. {c.doctorId?.firstName} {c.doctorId?.lastName}</div>
                                        <div className="text-xs text-gray-500">{c.doctorId?.specialization || 'General'}</div>
                                    </td>
                                    <td className="p-2">{c.specialization || '-'}</td>
                                    <td className="p-2">
                                        <div className="font-medium">{new Date(c.date).toLocaleDateString()}</div>
                                        <div className="text-xs text-gray-500">{c.startTime} - {c.endTime}</div>
                                    </td>
                                    <td className="p-2">
                                        <div className="flex items-center gap-1">
                                            <span className={`px-2 py-1 rounded text-xs ${c.bookedCount >= c.capacity ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                                {c.bookedCount}/{c.capacity}
                                            </span>
                                            {c.slotDuration && (
                                                <span className="text-xs text-gray-500">({c.slotDuration}min)</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-2">
                                        <div className="font-medium">LKR {c.price}</div>
                                        <div className="text-xs text-gray-500 capitalize">{c.paymentType}</div>
                                    </td>
                                    <td className="p-2">
                                        <span className={`px-2 py-1 rounded text-xs capitalize ${
                                            c.mode === 'physical' ? 'bg-blue-100 text-blue-700' :
                                            c.mode === 'video' ? 'bg-purple-100 text-purple-700' :
                                            'bg-orange-100 text-orange-700'
                                        }`}>
                                            {c.mode}
                                        </span>
                                    </td>
                                    <td className="p-2">
                                        <span className={`px-2 py-1 rounded text-xs ${
                                            c.status === 'scheduled' ? 'bg-yellow-100 text-yellow-700' :
                                            c.status === 'active' ? 'bg-green-100 text-green-700' :
                                            c.status === 'fully_booked' ? 'bg-red-100 text-red-700' :
                                            c.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                                            'bg-gray-100 text-gray-600'
                                        }`}>
                                            {c.status?.replace('_', ' ') || (c.isActive ? 'Active' : 'Inactive')}
                                        </span>
                                    </td>
                                    <td className="p-2">
                                        <div className="flex gap-1">
                                            <button 
                                                className="bg-blue-600 text-white text-xs px-2 py-1 rounded hover:bg-blue-700" 
                                                onClick={() => openReschedule(c)}
                                                title="Reschedule Channel"
                                            >
                                                📅 Reschedule
                                            </button>
                                            <button 
                                                className="btn-outline text-xs px-2 py-1" 
                                                onClick={() => deleteChannel(c._id)}
                                                title="Delete Channel"
                                            >
                                                🗑️
                                            </button>
                                            <button 
                                                className="bg-red-600 text-white text-xs px-2 py-1 rounded hover:bg-red-700" 
                                                onClick={() => cancelChannel(c._id)}
                                                title="Cancel Channel"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {showReschedule && selected && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                    <div className="bg-white w-full max-w-lg rounded-xl shadow-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-semibold">Reschedule Channel</h2>
                            <button onClick={() => setShowReschedule(false)} className="text-gray-500 hover:text-gray-700">✕</button>
                        </div>
                        
                        {/* Fixed Channel Details */}
                        <div className="bg-gray-50 rounded-lg p-4 mb-4">
                            <h3 className="text-sm font-semibold text-gray-700 mb-3">Channel Details (Fixed)</h3>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div>
                                    <span className="text-gray-600">Channel ID:</span>
                                    <span className="ml-2 font-medium">{selected.appointmentNo}</span>
                                </div>
                                <div>
                                    <span className="text-gray-600">Doctor:</span>
                                    <span className="ml-2 font-medium">Dr. {selected.doctorId?.firstName} {selected.doctorId?.lastName}</span>
                                </div>
                                <div>
                                    <span className="text-gray-600">Specialty:</span>
                                    <span className="ml-2 font-medium">{selected.specialization || 'General'}</span>
                                </div>
                                <div>
                                    <span className="text-gray-600">Slots:</span>
                                    <span className="ml-2 font-medium">{selected.bookedCount}/{selected.capacity}</span>
                                </div>
                                <div>
                                    <span className="text-gray-600">Fee:</span>
                                    <span className="ml-2 font-medium">LKR {selected.price}</span>
                                </div>
                                <div>
                                    <span className="text-gray-600">Mode:</span>
                                    <span className="ml-2 font-medium capitalize">{selected.mode}</span>
                                </div>
                            </div>
                        </div>
                        
                        {/* Changeable Fields */}
                        <div className="mb-4">
                            <h3 className="text-sm font-semibold text-gray-700 mb-3">Reschedule Details (Changeable)</h3>
                        </div>
                        <form onSubmit={submitReschedule} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm text-gray-700">Date</label>
                                <input 
                                    type="date" 
                                    value={resForm.date} 
                                    onChange={e => setResForm({ ...resForm, date: e.target.value })} 
                                    min={new Date().toISOString().split('T')[0]}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-700">Start</label>
                                <input type="time" value={resForm.startTime} onChange={e => setResForm({ ...resForm, startTime: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-700">End</label>
                                <input type="time" value={resForm.endTime} onChange={e => setResForm({ ...resForm, endTime: e.target.value })} />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm text-gray-700">Reschedule Reason *</label>
                                <textarea 
                                    value={resForm.reason} 
                                    onChange={e => setResForm({ ...resForm, reason: e.target.value })} 
                                    placeholder="Please provide a reason for rescheduling this appointment..."
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    rows="3"
                                    required
                                />
                            </div>
                            <div className="md:col-span-2 flex justify-end gap-3 mt-2">
                                <button type="button" className="btn-outline" onClick={() => setShowReschedule(false)}>Close</button>
                                <button type="submit" className="btn-primary">Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}

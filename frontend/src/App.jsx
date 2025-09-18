
import { Route, Routes, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { useAuth } from './context/AuthContext'

import HomePage from "./pages/HomePage/HomePage"
import AboutUs from "./pages/AboutUs/AboutUs"
import Login from "./pages/Auth/Login"
import Register from "./pages/Auth/Register"
import ForgotPassword from "./pages/Auth/ForgotPassword"
import ResetPassword from "./pages/Auth/ResetPassword"
import VerifyEmail from "./pages/Auth/VerifyEmail"
import AdminDashboard from "./pages/Admin/AdminDashboard"
import CustomerProfile from "./pages/Customer/CustomerProfile"
import DoctorDashboard from "./pages/Doctor/DoctorDashboard"
import PharmacistDashboard from "./pages/Pharmacist/PharmacistDashboard"
import DeliveryDashboard from "./pages/Delivery/DeliveryDashboard"
import Doctors from "./pages/Doctors/Doctors"
import DoctorProfile from "./pages/Doctors/DoctorProfile"
import Appointments from "./pages/Appointments/Appointments"
import UserAppointments from "./pages/UserAppointments/UserAppointments"
import Products from "./pages/Products/Products"
import Cart from "./pages/Cart/Cart"
import Checkout from "./pages/Checkout/Checkout"
import Orders from "./pages/Orders/Orders"

const App = () => {
  return (
    <AuthProvider>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<HomePage />} /> 
        <Route path="/about" element={<AboutUs />} /> 
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        
        {/* Default Dashboard Route - Redirects based on user role */}
        <Route path="/dashboard" element={<DashboardRedirect />} />
        
        {/* Admin Routes */}
        <Route path="/admin/dashboard" element={<RequireRole roles={["admin"]}><AdminDashboard /></RequireRole>} />
        
        {/* Role Dashboards */}
        <Route path="/doctor/dashboard" element={<RequireRole roles={["doctor","admin"]}><DoctorDashboard /></RequireRole>} /> 
        <Route path="/pharmacist/dashboard" element={<RequireRole roles={["pharmacist","admin"]}><PharmacistDashboard /></RequireRole>} /> 
        <Route path="/delivery/dashboard" element={<RequireRole roles={["delivery_agent","admin"]}><DeliveryDashboard /></RequireRole>} /> 
        
        {/* Customer Routes */}
        <Route path="/profile" element={<RequireAuth><CustomerProfile /></RequireAuth>} />
        
        {/* Placeholder Routes */}
        <Route path="/products" element={<Products />} /> 
        <Route path="/cart" element={<RequireAuth><Cart /></RequireAuth>} /> 
        <Route path="/checkout" element={<RequireAuth><Checkout /></RequireAuth>} /> 
        <Route path="/doctors" element={<Doctors />} /> 
        <Route path="/doctors/:id" element={<DoctorProfile />} /> 
        <Route path="/contact" element={<div className="min-h-screen bg-white flex items-center justify-center"><h1 className="text-4xl font-bold text-blue-600">Contact Us Page - Coming Soon</h1></div>} /> 
        <Route path="/appointments" element={<Appointments />} /> 
        <Route path="/my-appointments" element={<RequireAuth><UserAppointments /></RequireAuth>} /> 
        <Route path="/orders" element={<RequireAuth><Orders /></RequireAuth>} /> 
        <Route path="/prescriptions" element={<div className="min-h-screen bg-white flex items-center justify-center"><h1 className="text-4xl font-bold text-blue-600">Prescriptions Page - Coming Soon</h1></div>} /> 
        
        {/* Catch-all route for authenticated users */}
        <Route path="*" element={<CatchAllRoute />} />
      </Routes>
    </AuthProvider>
  )
}

export default App

// Dashboard Redirect Component
const DashboardRedirect = () => {
  const { user, loading } = useAuth();
  
  if (loading) return null;
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  // Redirect based on user role
  switch (user.role) {
    case 'admin':
      return <Navigate to="/admin/dashboard" replace />;
    case 'doctor':
      return <Navigate to="/doctor/dashboard" replace />;
    case 'pharmacist':
      return <Navigate to="/pharmacist/dashboard" replace />;
    case 'delivery_agent':
      return <Navigate to="/delivery/dashboard" replace />;
    case 'customer':
      return <Navigate to="/" replace />;
    default:
      return <Navigate to="/" replace />;
  }
};

// Catch All Route Component
const CatchAllRoute = () => {
  const { user, loading } = useAuth();
  
  if (loading) return null;
  
  if (!user) {
    return <Navigate to="/" replace />;
  }
  
  // For authenticated users, redirect to their dashboard
  switch (user.role) {
    case 'admin':
      return <Navigate to="/admin/dashboard" replace />;
    case 'doctor':
      return <Navigate to="/doctor/dashboard" replace />;
    case 'pharmacist':
      return <Navigate to="/pharmacist/dashboard" replace />;
    case 'delivery_agent':
      return <Navigate to="/delivery/dashboard" replace />;
    case 'customer':
      return <Navigate to="/" replace />;
    default:
      return <Navigate to="/" replace />;
  }
};

// Guards
const RequireAuth = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

const RequireRole = ({ roles, children }) => {
  const { user, loading } = useAuth();
  console.log('RequireRole check:', { user, loading, roles });
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (!roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
};
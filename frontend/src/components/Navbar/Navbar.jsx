import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { LogOut } from 'lucide-react'
import './Navbar.css'

const Navbar = () => {
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { user, logout, isAdmin } = useAuth()
  const [cartCount, setCartCount] = useState(0)

  useEffect(() => {
    const calc = () => {
      try {
        const cart = JSON.parse(localStorage.getItem('cart') || '[]')
        const count = cart.reduce((s, i) => s + (i.quantity || 1), 0)
        setCartCount(count)
      } catch {
        setCartCount(0)
      }
    }
    calc()
    const onStorage = (e) => { if (e.key === 'cart') calc() }
    const onCustom = () => calc()
    window.addEventListener('storage', onStorage)
    window.addEventListener('cart:update', onCustom)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('cart:update', onCustom)
    }
  }, [])
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
    setIsProfileOpen(false)
  }

  const getDashboardLink = () => {
    if (!user) return '/login'
    switch (user.role) {
      case 'admin': return '/admin/dashboard'
      case 'doctor': return '/doctor/dashboard'
      case 'pharmacist': return '/pharmacist/dashboard'
      case 'delivery_agent': return '/delivery/dashboard'
      case 'customer': return '/profile'
      default: return '/login'
    }
  }

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-content">
          {/* Logo */}
          <div className="logo">
            <Link to="/" className="logo-link">
              <div className="logo-icon">M</div>
              <span className="logo-text">MediCare</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="nav-links">
            <Link to="/" className="nav-item">Home</Link>
            <Link to="/products" className="nav-item">Products</Link>
            <Link to="/doctors" className="nav-item">Doctors</Link>
            <Link to="/about" className="nav-item">About Us</Link>
            <Link to="/contact" className="nav-item">Contact Us</Link>
          </div>

          {/* Right Side Buttons */}
          <div className="auth-buttons">
            {!user ? (
              <>
                <Link to="/login" className="nav-item">Sign In</Link>
                <Link to="/register" className="btn-primary">Sign Up</Link>
              </>
            ) : (
              <>
                {/* Cart Icon (visible for logged-in users only) */}
                <Link to="/cart" className="nav-item relative">
                  🛒
                  {cartCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs rounded-full px-1.5 py-0.5">{cartCount}</span>
                  )}
                </Link>

                {/* Profile Dropdown */}
                <div className="profile-dropdown">
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="profile-btn"
                  >
                    <div className="profile-icon">
                      {user.firstName.charAt(0).toUpperCase()}
                    </div>
                    <span className="profile-name">{`${user.firstName} ${user.lastName}`}</span>
                    <svg className="profile-caret" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {isProfileOpen && (
                    <div className="dropdown-menu">
                      <div className="dropdown-header">
                        <div className="font-medium">{`${user.firstName} ${user.lastName}`}</div>
                        <div className="role">{user.role}</div>
                      </div>
                      <Link to="/profile" className="dropdown-item">My Profile</Link>
                      {user.role === 'customer' && (
                        <>
                          <Link to="/my-appointments" className="dropdown-item">My Appointments</Link>
                          <Link to="/orders" className="dropdown-item">Orders</Link>
                          <Link to="/prescriptions" className="dropdown-item">Prescriptions</Link>
                        </>
                      )}
                      {isAdmin() && (
                        <Link to="/admin/dashboard" className="dropdown-item">Admin Panel</Link>
                      )}
                      <hr />
                      <button onClick={handleLogout} className="dropdown-logout">
                        <LogOut size={16} />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="mobile-menu-btn">
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              <svg className="hamburger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="mobile-menu">
          <Link to="/" className="mobile-item">Home</Link>
          <Link to="/products" className="mobile-item">Products</Link>
          <Link to="/doctors" className="mobile-item">Doctors</Link>
          <Link to="/about" className="mobile-item">About Us</Link>
          <Link to="/contact" className="mobile-item">Contact Us</Link>

          {!user ? (
            <div className="mobile-auth">
              <Link to="/login" className="btn-primary">Sign In</Link>
              <Link to="/register" className="btn-outline">Sign Up</Link>
            </div>
          ) : (
            <div className="mobile-auth">
              <Link to={getDashboardLink()} className="btn-primary">
                {user.role === 'customer' ? 'My Profile' : 'Dashboard'}
              </Link>
              <button onClick={handleLogout} className="btn-danger">
                <LogOut size={16} />
                Sign Out
              </button>
            </div>
          )}
        </div>
      )}
    </nav>
  )
}

export default Navbar

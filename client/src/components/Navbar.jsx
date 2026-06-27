import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Home, User, LogOut, Menu, X, Bell, Heart, ChevronDown } from 'lucide-react';
import './Navbar.css';

const Navbar = ({ role = 'buyer' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const token = localStorage.getItem('token') || localStorage.getItem('sellerToken') || localStorage.getItem('adminToken');
  const user = JSON.parse(localStorage.getItem('user')) || JSON.parse(localStorage.getItem('sellerUser')) || JSON.parse(localStorage.getItem('adminUser'));
  const isLoggedIn = !!token && !!user;

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('sellerToken');
    localStorage.removeItem('sellerUser');
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    setShowProfileMenu(false);
    window.location.href = '/buyer/';
  };

  const isHome = location.pathname === '/';

  return (
    <nav className={`navbar estify-navbar-light ${isHome ? 'navbar-home-active' : ''}`}>
      <div className="nav-container">
        
        {/* Logo Section */}
        <Link to="/" className="nav-logo estify-logo-box">
          <div className="estify-house-icon">
            <Home size={18} color="white" fill="white" />
          </div>
          <span className="estify-logo-text">HomeFind</span>
        </Link>
        
        {/* Navigation Links */}
        <div className={`nav-links ${isOpen ? 'active' : ''}`}>
          <Link to="/properties?type=Villa" className="nav-link" onClick={() => setIsOpen(false)}>Villa</Link>
          <Link to="/properties?type=Penthouse" className="nav-link" onClick={() => setIsOpen(false)}>Penthouse</Link>
          <Link to="/properties?type=PG" className="nav-link" onClick={() => setIsOpen(false)}>PG</Link>
          <Link to="/properties?type=Land" className="nav-link" onClick={() => setIsOpen(false)}>Land</Link>
          <Link to="/properties?type=House" className="nav-link" onClick={() => setIsOpen(false)}>House</Link>
          <Link to="/contact" className="nav-link" onClick={() => setIsOpen(false)}>Contact</Link>
          <Link to="/properties?deals=true" className="nav-link" onClick={() => setIsOpen(false)}>Deals</Link>
          <Link to="/agents" className="nav-link" onClick={() => setIsOpen(false)}>Agent</Link>
        </div>

        {/* Right side actions */}
        <div className="nav-right-grouped" style={{ flex: 'none', gap: '15px' }}>
          
          {isLoggedIn ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', position: 'relative' }}>
              <Link to="/properties?favorites=true" className="estify-nav-action-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Heart size={20} color="#64748b" />
              </Link>
              <button className="estify-nav-action-icon" onClick={async () => await window.customAlert(`Recent alerts: ${(user.notifications || []).filter(n=>!n.read).length} unread alerts.`)}>
                <Bell size={20} color="#64748b" />
                {(user.notifications || []).filter(n=>!n.read).length > 0 && <span className="estify-nav-badge">{(user.notifications || []).filter(n=>!n.read).length}</span>}
              </button>
              
              {/* Profile click navigates directly to profile details page */}
              <div className="estify-nav-user-wrapper" onClick={() => navigate('/profile')}>
                {user.photo ? (
                  <img src={user.photo} alt="Avatar" className="estify-nav-avatar" />
                ) : (
                  <div className="estify-nav-avatar" style={{ background: '#cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                    <User size={16} />
                  </div>
                )}
                <span className="estify-nav-username">Hi, {user.name.split(' ')[0]}</span>
              </div>
            </div>
          ) : (
            <div className="nav-auth-buttons" style={{ gap: '10px' }}>
              <Link to="/login" className="btn estify-btn-login">Log In</Link>
              <Link to="/register" className="btn estify-btn-register">Register</Link>
            </div>
          )}

          <button className="mobile-menu-btn" onClick={() => setIsOpen(!isOpen)} style={{ color: '#0f172a' }}>
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
        
      </div>
    </nav>
  );
};

export default Navbar;

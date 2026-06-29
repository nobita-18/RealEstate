import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Home, User, LogOut, Menu, X, Bell, Heart } from 'lucide-react';
import './Navbar.css';

const Navbar = ({ role = 'buyer' }) => {
  const [isOpen, setIsOpen] = useState(false);
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
    setIsOpen(false);
    window.location.href = '/buyer/';
  };

  const isHome = location.pathname === '/';

  return (
    <>
      {/* Semi-transparent backdrop blur when mobile drawer is open */}
      <div className={`nav-backdrop ${isOpen ? 'active' : ''}`} onClick={() => setIsOpen(false)} />

      <nav className={`navbar estify-navbar-light ${isHome ? 'navbar-home-active' : ''}`}>
        <div className="nav-container">
          
          {/* Logo Section */}
          <Link to="/" className="nav-logo estify-logo-box">
            <div className="estify-house-icon">
              <Home size={18} color="white" fill="white" />
            </div>
            <span className="estify-logo-text">HomeFind</span>
          </Link>
          
          {/* Slide-out Sidebar Drawer for Mobile, Normal links for Desktop */}
          <div className={`nav-links ${isOpen ? 'active' : ''}`}>
            
            {/* Unique stylish header inside the drawer for mobile view */}
            <div className="show-mobile drawer-header" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', paddingBottom: '15px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="estify-house-icon" style={{ width: '28px', height: '28px', background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', borderRadius: '6px' }}>
                <Home size={14} color="white" fill="white" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontWeight: '800', color: '#ffffff', fontSize: '1.05rem', letterSpacing: '-0.3px', lineHeight: 1.1 }}>HomeFind Menu</span>
                <span style={{ color: '#94a3b8', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '2px' }}>Premium Portal</span>
              </div>
            </div>

            <Link to="/properties?type=Villa" className="nav-link" onClick={() => setIsOpen(false)}>Villa</Link>
            <Link to="/properties?type=Penthouse" className="nav-link" onClick={() => setIsOpen(false)}>Penthouse</Link>
            <Link to="/properties?type=PG" className="nav-link" onClick={() => setIsOpen(false)}>PG</Link>
            <Link to="/properties?type=Land" className="nav-link" onClick={() => setIsOpen(false)}>Land</Link>
            <Link to="/properties?type=House" className="nav-link" onClick={() => setIsOpen(false)}>House</Link>
            <Link to="/contact" className="nav-link" onClick={() => setIsOpen(false)}>Contact</Link>
            <Link to="/properties?deals=true" className="nav-link" onClick={() => setIsOpen(false)}>Deals</Link>
            <Link to="/agents" className="nav-link" onClick={() => setIsOpen(false)}>Agent</Link>

            {/* Mobile-only Auth buttons inside Drawer */}
            {!isLoggedIn ? (
              <div className="nav-mobile-auth-buttons show-mobile">
                <Link to="/login" className="btn estify-btn-login" onClick={() => setIsOpen(false)} style={{ width: '100%', padding: '12px', color: '#3b82f6', border: '1px solid #3b82f6' }}>Log In</Link>
                <Link to="/register" className="btn estify-btn-register" onClick={() => setIsOpen(false)} style={{ width: '100%', padding: '12px', background: '#3b82f6', color: '#fff', textAlign: 'center' }}>Register</Link>
              </div>
            ) : (
              <div className="nav-mobile-profile show-mobile">
                <button 
                  onClick={handleLogout} 
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '12px',
                    background: 'rgba(239, 68, 68, 0.1)',
                    color: '#f87171',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    borderRadius: '8px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    marginTop: '10px'
                  }}
                >
                  <LogOut size={16} /> Log Out
                </button>
              </div>
            )}
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
              /* Desktop Auth buttons (hidden on mobile header to prevent overlap) */
              <div className="nav-auth-buttons hide-mobile" style={{ gap: '10px' }}>
                <Link to="/login" className="btn estify-btn-login">Log In</Link>
                <Link to="/register" className="btn estify-btn-register">Register</Link>
              </div>
            )}

            {/* Hamburger button (floating above side drawer if open) */}
            <button className="mobile-menu-btn" onClick={() => setIsOpen(!isOpen)} style={{ color: isOpen ? '#ffffff' : '#0f172a', zIndex: 1000, transition: 'color 0.2s ease' }}>
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
          
        </div>
      </nav>
    </>
  );
};

export default Navbar;

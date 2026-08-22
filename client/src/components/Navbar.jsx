import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Home, User, LogOut, Menu, X, Bell, Heart } from 'lucide-react';
import axios from 'axios';
import { getAssetUrl } from '../api';
import './Navbar.css';

const Navbar = ({ role = 'buyer' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const token = localStorage.getItem('token') || localStorage.getItem('sellerToken') || localStorage.getItem('adminToken');
  const user = JSON.parse(localStorage.getItem('user')) || JSON.parse(localStorage.getItem('sellerUser')) || JSON.parse(localStorage.getItem('adminUser'));
  const isLoggedIn = !!token && !!user;

  const [notifs, setNotifs] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    if (isLoggedIn && user?.id) {
      axios.get(`${window.API_BASE_URL || 'https://realestatelisting-u2kp.onrender.com'}/api/users/${user.id}`)
        .then(res => {
          setNotifs(res.data.notifications || []);
        })
        .catch(err => console.error("Error loading notifications in navbar:", err));
    }
  }, [isLoggedIn]);

  const handleMarkAllAsRead = async () => {
    const updatedNotifs = notifs.map(n => ({ ...n, read: true }));
    setNotifs(updatedNotifs);
    const storedUser = JSON.parse(localStorage.getItem('user')) || JSON.parse(localStorage.getItem('sellerUser')) || JSON.parse(localStorage.getItem('adminUser'));
    if (storedUser) {
      storedUser.notifications = updatedNotifs;
      const storageKey = localStorage.getItem('sellerUser') ? 'sellerUser' : localStorage.getItem('adminUser') ? 'adminUser' : 'user';
      localStorage.setItem(storageKey, JSON.stringify(storedUser));
    }
    try {
      await axios.put(`${window.API_BASE_URL || "https://realestatelisting-u2kp.onrender.com"}/api/users/${user.id}`, { notifications: updatedNotifs });
    } catch(err) {
      console.error("Failed to sync read notifications", err);
    }
  };

  const handleMarkOneAsRead = async (notifId) => {
    const updatedNotifs = notifs.map(n => n.id === notifId ? { ...n, read: true } : n);
    setNotifs(updatedNotifs);
    const storedUser = JSON.parse(localStorage.getItem('user')) || JSON.parse(localStorage.getItem('sellerUser')) || JSON.parse(localStorage.getItem('adminUser'));
    if (storedUser) {
      storedUser.notifications = updatedNotifs;
      const storageKey = localStorage.getItem('sellerUser') ? 'sellerUser' : localStorage.getItem('adminUser') ? 'adminUser' : 'user';
      localStorage.setItem(storageKey, JSON.stringify(storedUser));
    }
    try {
      await axios.put(`${window.API_BASE_URL || "https://realestatelisting-u2kp.onrender.com"}/api/users/${user.id}`, { notifications: updatedNotifs });
    } catch(err) {
      console.error("Failed to sync read notification", err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('sellerToken');
    localStorage.removeItem('sellerUser');
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    setIsOpen(false);
    window.location.href = '/buyer/index.html';
  };

  const isHome = location.pathname === '/';

  const isActive = (path, searchParamKey, searchParamValue) => {
    const cleanPath = path.replace(/\/$/, "");
    const currentPath = location.pathname.replace(/\/$/, "");
    if (currentPath !== cleanPath) return false;
    if (searchParamKey) {
      const params = new URLSearchParams(location.search);
      return params.get(searchParamKey) === searchParamValue;
    }
    if (path === '/properties') {
      const params = new URLSearchParams(location.search);
      return !params.has('type') && !params.has('deals') && !params.has('favorites');
    }
    return true;
  };

  return (
    <>
      {/* Semi-transparent backdrop blur when mobile drawer is open */}
      <div className={`nav-backdrop ${isOpen ? 'active' : ''}`} onClick={() => setIsOpen(false)} />

      <nav className={`navbar estify-navbar-light ${isHome ? 'navbar-home-active' : ''}`}>
        <div className="nav-container">
          
          {/* Logo Section */}
          <Link to="/" className="nav-logo estify-logo-box" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <img src="/logo.jpg" alt="HomeFind Logo" style={{ width: '32px', height: '32px', borderRadius: '8px', objectFit: 'cover', boxShadow: '0 0 10px rgba(0, 210, 255, 0.3)' }} />
            <span className="estify-logo-text">HomeFind</span>
          </Link>
          
          {/* Slide-out Sidebar Drawer for Mobile, Normal links for Desktop */}
          <div className={`nav-links ${isOpen ? 'active' : ''}`}>
            
            {/* Unique stylish header inside the drawer for mobile view */}
            <div className="show-mobile drawer-header" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', paddingBottom: '15px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <img src="/logo.jpg" alt="HomeFind Logo" style={{ width: '28px', height: '28px', borderRadius: '6px', objectFit: 'cover' }} />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontWeight: '800', color: '#ffffff', fontSize: '1.05rem', letterSpacing: '-0.3px', lineHeight: 1.1 }}>HomeFind Menu</span>
                <span style={{ color: '#94a3b8', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '2px' }}>Premium Portal</span>
              </div>
            </div>

            <Link to="/properties?type=Villa" className={`nav-link ${isActive('/properties', 'type', 'Villa') ? 'active' : ''}`} onClick={() => setIsOpen(false)}>Villa</Link>
            <Link to="/properties?type=Penthouse" className={`nav-link ${isActive('/properties', 'type', 'Penthouse') ? 'active' : ''}`} onClick={() => setIsOpen(false)}>Penthouse</Link>
            <Link to="/properties?type=PG" className={`nav-link ${isActive('/properties', 'type', 'PG') ? 'active' : ''}`} onClick={() => setIsOpen(false)}>PG</Link>
            <Link to="/properties?type=Land" className={`nav-link ${isActive('/properties', 'type', 'Land') ? 'active' : ''}`} onClick={() => setIsOpen(false)}>Land</Link>
            <Link to="/properties?type=House" className={`nav-link ${isActive('/properties', 'type', 'House') ? 'active' : ''}`} onClick={() => setIsOpen(false)}>House</Link>
            <Link to="/contact" className={`nav-link ${isActive('/contact') ? 'active' : ''}`} onClick={() => setIsOpen(false)}>Contact</Link>
            <Link to="/properties?deals=true" className={`nav-link ${isActive('/properties', 'deals', 'true') ? 'active' : ''}`} onClick={() => setIsOpen(false)}>Deals</Link>
            <Link to="/agents" className={`nav-link ${isActive('/agents') ? 'active' : ''}`} onClick={() => setIsOpen(false)}>Agent</Link>

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

          <div className="nav-right-grouped" style={{ display: 'flex', alignItems: 'center', flex: 'none', gap: '15px' }}>
            
            {isLoggedIn ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', position: 'relative' }}>
                <Link to="/properties?favorites=true" className="estify-nav-action-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Heart size={20} color="#64748b" />
                </Link>
                <button className="estify-nav-action-icon" onClick={() => setShowNotifications(!showNotifications)}>
                  <Bell size={20} color="#64748b" />
                  {notifs.filter(n=>!n.read).length > 0 && <span className="estify-nav-badge">{notifs.filter(n=>!n.read).length}</span>}
                </button>

                {showNotifications && (
                  <div className="notifs-dropdown glass" style={{
                    position: 'absolute',
                    top: '50px',
                    right: '0',
                    width: '320px',
                    maxHeight: '400px',
                    overflowY: 'auto',
                    background: '#fff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '12px',
                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                    zIndex: 1001,
                    display: 'flex',
                    flexDirection: 'column',
                    animation: 'slideDown 0.2s ease'
                  }}>
                    <div style={{ padding: '12px 15px', borderBottom: '1px solid #cbd5e1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: '700', fontSize: '0.9rem', color: '#1e293b' }}>Notifications</span>
                      {notifs.some(n=>!n.read) && (
                        <button onClick={handleMarkAllAsRead} style={{ background: 'none', border: 'none', color: '#3b82f6', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer' }}>
                          Mark all as read
                        </button>
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      {notifs.length === 0 ? (
                        <span style={{ padding: '20px', textAlign: 'center', fontSize: '0.85rem', color: '#64748b' }}>No notifications yet.</span>
                      ) : (
                        notifs.map(n => (
                          <div 
                            key={n.id} 
                            onClick={() => handleMarkOneAsRead(n.id)}
                            style={{ 
                              padding: '12px 15px', 
                              borderBottom: '1px solid #f1f5f9', 
                              cursor: 'pointer',
                              background: n.read ? '#fff' : '#f8fafc',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '4px',
                              textAlign: 'left'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <span style={{ fontSize: '0.85rem', fontWeight: n.read ? '500' : '700', color: '#334155', lineHeight: '1.25' }}>{n.message}</span>
                              {!n.read && <span style={{ width: '8px', height: '8px', background: '#3b82f6', borderRadius: '50%', flexShrink: 0, marginTop: '4px' }}></span>}
                            </div>
                            <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{n.date ? new Date(n.date).toLocaleString() : 'Just now'}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
                
                {/* Profile click navigates directly to profile details page */}
                <div className="estify-nav-user-wrapper" onClick={() => navigate('/profile')}>
                  {user.photo ? (
                    <img 
                      src={getAssetUrl(user.photo)} 
                      alt="Avatar" 
                      className="estify-nav-avatar" 
                      onError={(e) => {
                        e.target.onerror = null; 
                        e.target.src = "/images/default/default-avatar.jpg";
                      }} 
                    />
                  ) : (
                    <div className="estify-nav-avatar" style={{ background: '#cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                      <User size={16} />
                    </div>
                  )}
                  <span className="estify-nav-username">Hi, {(user.name || user.email || 'User').split(' ')[0]}</span>
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

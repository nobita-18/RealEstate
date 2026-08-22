import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { User, Settings, Shield, Edit2, Check, LogOut, Heart, MapPin, Key, Bell, MessageSquare, Calendar } from 'lucide-react';
import PropertyCard from '../../components/PropertyCard';
import { getAssetUrl } from '../../api';
import './BuyerProfile.css';

const BuyerProfile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [message, setMessage] = useState('');
  const [properties, setProperties] = useState([]);
  const [myEnquiries, setMyEnquiries] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [activeTab, setActiveTab] = useState('details'); // 'details', 'favorites', 'enquiries', 'bookings', 'settings'
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Settings forms
  const [passwordData, setPasswordData] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [notifications, setNotifications] = useState({ emailAlerts: true, smsAlerts: false });

  const fetchProfileAndData = async (storedUser) => {
    try {
      // Fetch properties
      const propsRes = await axios.get((window.API_BASE_URL || 'https://realestatelisting-u2kp.onrender.com') + '/api/properties');
      if (Array.isArray(propsRes.data)) {
        setProperties(propsRes.data);
      }
      
      // Fetch enquiries
      const enqRes = await axios.get(`${window.API_BASE_URL || "https://realestatelisting-u2kp.onrender.com"}/api/enquiries/user/${storedUser.id}`);
      if (Array.isArray(enqRes.data)) {
        setMyEnquiries(enqRes.data);
      }

      // Fetch bookings
      const bkRes = await axios.get(`${window.API_BASE_URL || "https://realestatelisting-u2kp.onrender.com"}/api/bookings/buyer/${storedUser.id}`);
      if (Array.isArray(bkRes.data)) {
        setMyBookings(bkRes.data.sort((a, b) => new Date(b.date) - new Date(a.date)));
      }
    } catch (err) {
      console.error("Failed to load profile data dependencies", err);
    }
  };

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (storedUser) {
      // Redirect to seller dashboard if user is seller
      if (storedUser.role === 'seller') {
        window.location.href = '/seller/index.html?portal=seller';
        return;
      }
      setUser(storedUser);
      setFormData(storedUser);
      setNotifications({
        emailAlerts: storedUser.emailAlerts ?? true,
        smsAlerts: storedUser.smsAlerts ?? false
      });
      fetchProfileAndData(storedUser);
    } else {
      navigate('/login');
    }
  }, [navigate]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    if (formData.pincode && !/^\d{6}$/.test(formData.pincode)) {
      setMessage('Error: Pincode must contain exactly 6 digits.');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    try {
      const res = await axios.put(`${window.API_BASE_URL || "https://realestatelisting-u2kp.onrender.com"}/api/users/${user.id}`, formData);
      setUser(res.data);
      localStorage.setItem('user', JSON.stringify(res.data));
      setIsEditing(false);
      setMessage('Profile updated successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('Error: Failed to update profile');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type === 'image/jpeg' || file.type === 'image/png') {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFormData({ ...formData, photo: reader.result });
        };
        reader.readAsDataURL(file);
      } else {
        setMessage('Error: Only JPG or PNG format allowed');
        setTimeout(() => setMessage(''), 3000);
      }
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage('Error: Passwords do not match.');
      setTimeout(() => setMessage(''), 3000);
      return;
    }
    if (passwordData.newPassword.length < 8) {
      setMessage('Error: Password must be at least 8 characters.');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    try {
      await axios.put(`${window.API_BASE_URL || "https://realestatelisting-u2kp.onrender.com"}/api/users/${user.id}`, { password: passwordData.newPassword, plainPassword: passwordData.newPassword });
      setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
      setMessage('Password changed successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('Error: Failed to change password.');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleNotificationChange = async (name, value) => {
    const updated = { ...notifications, [name]: value };
    setNotifications(updated);
    try {
      const res = await axios.put(`${window.API_BASE_URL || "https://realestatelisting-u2kp.onrender.com"}/api/users/${user.id}`, updated);
      localStorage.setItem('user', JSON.stringify(res.data));
    } catch (err) {
      console.error(err);
    }
  };

  const handleFavoriteToggle = async (propertyId, isSaved) => {
    if (!isSaved) {
      const storedUser = JSON.parse(localStorage.getItem('user'));
      if (!storedUser) return;
      const updatedFavs = (storedUser.favorites || []).filter(id => String(id) !== String(propertyId));
      const updated = { ...storedUser, favorites: updatedFavs };
      setUser(updated);
      localStorage.setItem('user', JSON.stringify(updated));
      try {
        await axios.put(`${window.API_BASE_URL || "https://realestatelisting-u2kp.onrender.com"}/api/users/${storedUser.id}`, { favorites: updatedFavs });
      } catch (err) {
        console.error('Failed to sync favorite with server', err);
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('sellerToken');
    localStorage.removeItem('sellerUser');
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    window.location.href = '/buyer/';
  };

  if (!user) return <div className="page-container loading">Loading profile...</div>;

  const favoriteProps = properties.filter(p => user.favorites?.includes(p.id));

  return (
    <div className="profile-page page-container fade-in">
      <style>{`
        @media (max-width: 768px) {
          .profile-header {
            overflow: visible !important;
            display: flex !important;
            flex-direction: column !important;
            background: #ffffff !important;
            border: 1px solid #e2e8f0 !important;
            margin-bottom: 1.5rem !important;
            padding: 0 !important;
          }
          .profile-cover {
            height: 80px !important;
            background: linear-gradient(135deg, #38bdf8, #0284c7) !important;
            width: 100% !important;
            margin: 0 !important;
          }
          .profile-header-content {
            flex-direction: column !important;
            align-items: center !important;
            text-align: center !important;
            margin-top: 0 !important;
            padding: 16px !important;
            position: relative !important;
            z-index: 10 !important;
            width: 100% !important;
            box-sizing: border-box !important;
            gap: 12px !important;
          }
          .profile-avatar-wrapper {
            width: 90px !important;
            height: 90px !important;
            border: 3px solid #ffffff !important;
            background: #f1f5f9 !important;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1) !important;
            margin-top: -45px !important;
            margin-bottom: 4px !important;
          }
          .profile-titles {
            margin-bottom: 12px !important;
            width: 100% !important;
          }
          .profile-titles h1 {
            font-size: 1.4rem !important;
            color: #0f172a !important;
            margin-bottom: 4px !important;
          }
          .profile-actions {
            width: 100% !important;
            margin-top: 5px !important;
          }
          .profile-actions > div {
            flex-direction: column !important;
            width: 100% !important;
            gap: 8px !important;
          }
          .profile-actions .btn {
            width: 100% !important;
            justify-content: center !important;
            border-radius: 30px !important;
          }
          .profile-section {
            padding: 1.25rem !important;
            border-width: 1px !important;
          }
          .profile-tabs-wrapper {
            flex-wrap: nowrap !important;
            overflow-x: auto !important;
            -webkit-overflow-scrolling: touch !important;
          }
          .profile-tab-btn {
            flex-shrink: 0 !important;
          }
          .profile-page .profile-section {
            opacity: 1 !important;
            transform: none !important;
            animation: none !important;
          }
          .profile-page .profile-section .input-group,
          .profile-page .profile-section .edit-field {
            opacity: 1 !important;
            transform: none !important;
            animation: none !important;
          }
        }
      `}</style>
      {/* Top Header Card */}
      <div className="profile-header glass" style={isMobile ? {
        display: 'flex',
        flexDirection: 'column',
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        marginBottom: '1.5rem',
        overflow: 'visible',
        padding: '0'
      } : {}}>
        <div className="profile-cover" style={isMobile ? {
          height: '80px',
          background: 'linear-gradient(135deg, #38bdf8, #0284c7)',
          width: '100%',
          margin: '0',
          borderRadius: '12px 12px 0 0'
        } : {}}></div>
        <div className="profile-header-content" style={isMobile ? {
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          marginTop: '0',
          padding: '16px',
          position: 'relative',
          zIndex: 10,
          width: '100%',
          boxSizing: 'border-box',
          gap: '12px'
        } : {}}>
          <div className="profile-avatar-wrapper" style={isMobile ? {
            width: '90px',
            height: '90px',
            border: '3px solid #ffffff',
            background: '#f1f5f9',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            marginTop: '-45px',
            marginBottom: '4px',
            borderRadius: '50%',
            position: 'relative',
            overflow: 'hidden'
          } : {}}>
            {user.photo ? (
              <img 
                src={getAssetUrl(user.photo)} 
                alt="Profile" 
                className="profile-avatar" 
                onError={(e) => {
                  e.target.onerror = null; 
                  e.target.src = "/images/default/default-avatar.jpg";
                }} 
              />
            ) : (
              <div className="profile-avatar-placeholder">
                <User size={64} />
              </div>
            )}
            {isEditing && (
              <div className="avatar-edit-overlay">
                <Settings size={20} />
              </div>
            )}
          </div>
          <div className="profile-titles" style={isMobile ? { marginBottom: '12px', width: '100%' } : {}}>
            <h1 style={isMobile ? { fontSize: '1.4rem', color: '#0f172a', marginBottom: '4px' } : {}}>{user.name}</h1>
            <span className={`role-badge ${user.role || 'buyer'}`} style={isMobile ? { display: 'inline-block', padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '700' } : {}}>{user.role || 'Buyer'}</span>
            <p style={{ margin: '5px 0 0 0', color: 'var(--text-light)', fontSize: '0.9rem' }}>Member Since: {user.memberSince || 'N/A'}</p>
          </div>
          
          <div className="profile-actions" style={isMobile ? { width: '100%', marginTop: '5px' } : {}}>
            {isEditing ? (
              <button className="btn btn-primary" onClick={handleSave} style={isMobile ? { width: '100%', justifyContent: 'center', borderRadius: '30px' } : {}}>
                <Check size={16} /> Save Changes
              </button>
            ) : (
              <div style={isMobile ? {
                display: 'flex',
                flexDirection: 'column',
                width: '100%',
                gap: '8px'
              } : { display: 'flex', gap: '1rem' }}>
                <button className="btn btn-outline" onClick={() => setIsEditing(true)} style={isMobile ? { width: '100%', justifyContent: 'center', borderRadius: '30px' } : {}}>
                  <Edit2 size={16} /> Edit Profile
                </button>
                <button className="btn btn-outline" onClick={handleLogout} style={isMobile ? {
                  width: '100%',
                  justifyContent: 'center',
                  borderRadius: '30px',
                  borderColor: '#ef4444',
                  color: '#ef4444'
                } : { borderColor: '#ef4444', color: '#ef4444' }}>
                  <LogOut size={16} /> Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {message && <div className={`profile-message ${message.includes('Error') ? 'error' : 'success'}`}>{message}</div>}

      {/* Tabs navigation options */}
      <div className="profile-tabs-wrapper glass" style={isMobile ? {
        display: 'flex',
        flexDirection: 'row',
        flexWrap: 'nowrap',
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch',
        gap: '8px',
        padding: '8px 12px',
        borderRadius: '12px',
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        marginBottom: '1rem'
      } : {}}>
        <button className={`profile-tab-btn ${activeTab === 'details' ? 'active' : ''}`} onClick={() => setActiveTab('details')} style={isMobile ? { flexShrink: 0, fontSize: '0.8rem', padding: '8px 12px', borderRadius: '8px' } : {}}>
          <User size={16} /> Profile Details
        </button>
        <button className={`profile-tab-btn ${activeTab === 'favorites' ? 'active' : ''}`} onClick={() => setActiveTab('favorites')} style={isMobile ? { flexShrink: 0, fontSize: '0.8rem', padding: '8px 12px', borderRadius: '8px' } : {}}>
          <Heart size={16} /> Favorite Properties
        </button>
        <button className={`profile-tab-btn ${activeTab === 'enquiries' ? 'active' : ''}`} onClick={() => setActiveTab('enquiries')} style={isMobile ? { flexShrink: 0, fontSize: '0.8rem', padding: '8px 12px', borderRadius: '8px' } : {}}>
          <MessageSquare size={16} /> Enquiries Sent
        </button>
        <button className={`profile-tab-btn ${activeTab === 'bookings' ? 'active' : ''}`} onClick={() => setActiveTab('bookings')} style={isMobile ? { flexShrink: 0, fontSize: '0.8rem', padding: '8px 12px', borderRadius: '8px' } : {}}>
          <Calendar size={16} /> Bookings & Visits
        </button>
        <button className={`profile-tab-btn ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')} style={isMobile ? { flexShrink: 0, fontSize: '0.8rem', padding: '8px 12px', borderRadius: '8px' } : {}}>
          <Settings size={16} /> Account Settings
        </button>
      </div>

      <div className="profile-tab-content-area">
        
        {/* 1. PROFILE DETAILS TAB */}
        {activeTab === 'details' && (
          <div className="profile-grid fade-in-tab">
            {/* PERSONAL INFORMATION */}
            <div className="profile-section glass">
              <h2><User size={20} /> Personal Information</h2>
              {isEditing ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div className="edit-field">
                    <label>Full Name *</label>
                    <input type="text" name="name" value={formData.name || ''} onChange={handleInputChange} required />
                  </div>
                  <div className="edit-field">
                    <label>Email Address *</label>
                    <input type="email" name="email" value={formData.email || ''} onChange={handleInputChange} disabled />
                  </div>
                  <div className="edit-field">
                    <label>Mobile Number *</label>
                    <input type="tel" name="mobile" value={formData.mobile || ''} onChange={handleInputChange} required />
                  </div>
                  <div className="edit-field">
                    <label>Profile Picture</label>
                    <input type="file" accept="image/*" onChange={handlePhotoUpload} />
                  </div>
                </div>
              ) : (
                <div className="form-grid" style={{ gridTemplateColumns: '1fr' }}>
                  <div className="input-group">
                    <label>Full Name</label>
                    <p>{user.name}</p>
                  </div>
                  <div className="input-group">
                    <label>Email Address</label>
                    <p>{user.email}</p>
                  </div>
                  <div className="input-group">
                    <label>Mobile Number</label>
                    <p>{user.mobile}</p>
                  </div>
                </div>
              )}
            </div>

            {/* ADDRESS INFORMATION */}
            <div className="profile-section glass">
              <h2><MapPin size={20} /> Address Information</h2>
              {isEditing ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div className="edit-field">
                    <label>Address</label>
                    <input type="text" name="address" value={formData.address || ''} onChange={handleInputChange} />
                  </div>
                  <div className="edit-field">
                    <label>City</label>
                    <input type="text" name="city" value={formData.city || ''} onChange={handleInputChange} />
                  </div>
                  <div className="edit-field">
                    <label>State</label>
                    <input type="text" name="state" value={formData.state || ''} onChange={handleInputChange} />
                  </div>
                  <div className="edit-field">
                    <label>Pincode (Exactly 6 Digits)</label>
                    <input type="text" name="pincode" value={formData.pincode || ''} onChange={handleInputChange} />
                  </div>
                </div>
              ) : (
                <div className="form-grid" style={{ gridTemplateColumns: '1fr' }}>
                  <div className="input-group">
                    <label>Address</label>
                    <p>{user.address || ''}</p>
                  </div>
                  <div className="input-group">
                    <label>City</label>
                    <p>{user.city || ''}</p>
                  </div>
                  <div className="input-group">
                    <label>State</label>
                    <p>{user.state || ''}</p>
                  </div>
                  <div className="input-group">
                    <label>Pincode</label>
                    <p>{user.pincode || ''}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 2. FAVORITES TAB */}
        {activeTab === 'favorites' && (
          <div className="profile-section glass full-tab-width fade-in-tab">
            <h2><Heart size={20} fill="#ef4444" color="#ef4444" /> Favorite Properties</h2>
            {favoriteProps.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px', background: 'var(--secondary-color)', borderRadius: '15px', border: '1px dashed var(--border-color)' }}>
                <p style={{ color: 'var(--text-light)', margin: '0 0 15px 0' }}>You have no favorite properties yet.</p>
                <button className="btn btn-primary btn-sm" onClick={() => navigate('/properties')}>Explore Properties</button>
              </div>
            ) : (
              <div className="properties-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                {favoriteProps.map((prop, idx) => (
                  <PropertyCard 
                    key={prop.id} 
                    property={prop} 
                    index={idx}
                    onFavoriteToggle={handleFavoriteToggle}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* 3. ENQUIRIES TAB */}
        {activeTab === 'enquiries' && (
          <div className="profile-section glass full-tab-width fade-in-tab">
            <h2><MessageSquare size={20} /> Enquiries Sent</h2>
            {myEnquiries.length === 0 ? (
              <p style={{ color: 'var(--text-light)' }}>You have not sent any enquiries yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {myEnquiries.map(enq => (
                  <div key={enq.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--secondary-color)', padding: '15px 20px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                    <div>
                      <h4 style={{ color: 'var(--text-main)', margin: '0 0 5px 0' }}>Enquiry for: {enq.propertyTitle || `Property ID: ${enq.propertyId}`}</h4>
                      <p style={{ color: 'var(--text-light)', margin: 0, fontSize: '0.85rem' }}>Message: "{enq.message}"</p>
                    </div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--primary-color)', fontWeight: 'bold' }}>{enq.date ? enq.date.split('T')[0] : 'N/A'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Bookings & Visits TAB */}
        {activeTab === 'bookings' && (
          <div className="profile-section glass full-tab-width fade-in-tab">
            <h2><Calendar size={20} /> Bookings & Visits</h2>
            {myBookings.length === 0 ? (
              <p style={{ color: 'var(--text-light)' }}>You have not scheduled any visits or bookings yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {myBookings.map(bk => (
                  <div key={bk.id} style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', background: 'var(--secondary-color)', padding: '15px 20px', borderRadius: '12px', border: '1px solid var(--border-color)', gap: '15px' }}>
                    <div>
                      <h4 style={{ color: 'var(--text-main)', margin: '0 0 5px 0' }}>{bk.propertyTitle || `Property ID: HF${bk.propertyId}`}</h4>
                      <p style={{ color: 'var(--text-light)', margin: '0 0 5px 0', fontSize: '0.85rem' }}>
                        Proposed Offer: <strong>${(bk.expectedPrice || 0).toLocaleString()}</strong>
                      </p>
                      {bk.statusReason && (
                        <p style={{ color: 'var(--primary-color)', margin: 0, fontSize: '0.85rem', fontStyle: 'italic' }}>
                          Note: {bk.statusReason}
                        </p>
                      )}
                    </div>
                    <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--primary-color)', fontWeight: 'bold' }}>
                        🗓️ {bk.date ? new Date(bk.date).toLocaleString() : 'N/A'}
                      </span>
                      <span style={{ 
                        padding: '4px 10px', 
                        borderRadius: '20px', 
                        fontSize: '0.75rem', 
                        fontWeight: '700',
                        textTransform: 'uppercase',
                        background: bk.status === 'Approved' ? 'rgba(16, 185, 129, 0.15)' : bk.status === 'Rejected' ? 'rgba(239, 68, 68, 0.15)' : bk.status === 'completed' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                        color: bk.status === 'Approved' ? '#10b981' : bk.status === 'Rejected' ? '#ef4444' : bk.status === 'completed' ? '#3b82f6' : '#f59e0b'
                      }}>
                        {bk.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 4. Account Settings TAB */}
        {activeTab === 'settings' && (
          <div className="profile-section glass full-tab-width fade-in-tab">
            <h2><Settings size={20} /> Settings</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>
              {/* Change Password */}
              <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <h3 style={{ color: 'var(--primary-color)', fontSize: '1.1rem', margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Key size={16} /> Change Password
                </h3>
                <div className="edit-field">
                  <label>New Password *</label>
                  <input 
                    type="password" 
                    placeholder="Enter new password" 
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    required 
                  />
                </div>
                <div className="edit-field">
                  <label>Confirm Password *</label>
                  <input 
                    type="password" 
                    placeholder="Confirm new password" 
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    required 
                  />
                </div>
                <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start', marginTop: '10px' }}>Update Password</button>
              </form>

              {/* Notification Preferences */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <h3 style={{ color: 'var(--primary-color)', fontSize: '1.1rem', margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Bell size={16} /> Notification Preferences
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: 'var(--secondary-color)', padding: '20px', borderRadius: '10px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-main)', cursor: 'pointer', fontWeight: '500' }}>
                    <input 
                      type="checkbox" 
                      checked={notifications.emailAlerts}
                      onChange={(e) => handleNotificationChange('emailAlerts', e.target.checked)}
                      style={{ width: '18px', height: '18px' }}
                    />
                    Receive Email alerts for new deals
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-main)', cursor: 'pointer', fontWeight: '500' }}>
                    <input 
                      type="checkbox" 
                      checked={notifications.smsAlerts}
                      onChange={(e) => handleNotificationChange('smsAlerts', e.target.checked)}
                      style={{ width: '18px', height: '18px' }}
                    />
                    Receive SMS notification when favorited owner posts property
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default BuyerProfile;

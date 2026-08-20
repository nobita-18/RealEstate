import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ShieldCheck, Lock, Eye, EyeOff, Mail, ArrowRight, ShieldAlert, Key } from 'lucide-react';
import './AdminLogin.css';

import { useSignIn, useUser } from '@clerk/clerk-react';

const ClerkAuthHandler = ({ onSyncStart, onSyncSuccess, onSyncError }) => {
  const { signIn, isLoaded } = useSignIn();
  const { user, isSignedIn } = useUser();

  useEffect(() => {
    const syncClerkUser = async () => {
      if (isSignedIn && user) {
        try {
          onSyncStart();
          const email = user.primaryEmailAddress?.emailAddress;
          const activeAccount = user.externalAccounts.find(acc => acc.verification?.status === 'verified') || user.externalAccounts[0];
          const provider = activeAccount?.provider === 'oauth_google' || activeAccount?.verification?.strategy === 'oauth_google' ? 'google' : 'facebook';

          if (!email) {
            onSyncError('Could not retrieve email from Clerk social account.');
            return;
          }

          const res = await axios.post((window.API_BASE_URL || 'https://realestatelisting-u2kp.onrender.com') + '/api/auth/social-login', { 
            email: email, 
            provider: provider,
            role: 'admin'
          });
          
          const loggedUser = res.data.user;
          
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('sellerToken');
          localStorage.removeItem('sellerUser');
          localStorage.removeItem('adminToken');
          localStorage.removeItem('adminUser');

          localStorage.setItem('token', res.data.token);
          localStorage.setItem('user', JSON.stringify(loggedUser));
          localStorage.setItem('adminToken', res.data.token);
          localStorage.setItem('adminUser', JSON.stringify(loggedUser));

          onSyncSuccess(loggedUser);
        } catch (err) {
          onSyncError(err.response?.data?.message || 'This account is not authorized as Admin.');
        }
      }
    };

    syncClerkUser();
  }, [isSignedIn, user]);

  const handleSocialLogin = async (platform) => {
    if (!isLoaded) {
      alert("Clerk authentication library is still loading. Please try again.");
      return;
    }
    localStorage.setItem('socialRegisterRole', 'admin');
    try {
      await signIn.authenticateWithRedirect({
        strategy: platform === 'google' ? 'oauth_google' : 'oauth_facebook',
        redirectUrl: window.location.origin + window.location.pathname,
        redirectUrlComplete: window.location.origin + window.location.pathname
      });
    } catch (err) {
      console.error('Clerk redirect error:', err);
      onSyncError('Social login redirection failed.');
    }
  };

  return (
    <div className="social-buttons-row">
      <button className="social-btn google-btn" type="button" onClick={() => handleSocialLogin('google')}>
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
        </svg>
        <span>Google</span>
      </button>
      <button className="social-btn facebook-btn" type="button" onClick={() => handleSocialLogin('facebook')}>
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" fill="#1877F2"/>
        </svg>
        <span>Facebook</span>
      </button>
    </div>
  );
};

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Forgot Passcode States
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState(1);
  const [forgotEmail, setForgotEmail] = useState('');
  const [enteredOtp, setEnteredOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const navigate = useNavigate();

  // Load persistence if cookie/remember is checked
  useEffect(() => {
    const saved = localStorage.getItem('rememberAdminEmail');
    if (saved) {
      setEmail(saved);
      setRememberMe(true);
    }
  }, []);

  const handleSocialSyncStart = () => {
    setIsSubmitting(true);
    setError('');
  };

  const handleSocialSyncSuccess = (loggedUser) => {
    setIsSubmitting(false);
    navigate('/dashboard');
  };

  const handleSocialSyncError = (errMsg) => {
    setIsSubmitting(false);
    setError(errMsg);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    try {
      const res = await axios.post((window.API_BASE_URL || 'https://realestatelisting-u2kp.onrender.com') + '/api/auth/login', { 
        identifier: email, 
        password 
      });
      
      if (res.data.user.role !== 'admin') {
        setError('Unauthorized access. Admin role required.');
        setIsSubmitting(false);
        return;
      }
      
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('sellerToken');
      localStorage.removeItem('sellerUser');
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');

      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      localStorage.setItem('adminToken', res.data.token);
      localStorage.setItem('adminUser', JSON.stringify(res.data.user));

      if (rememberMe) {
        localStorage.setItem('rememberAdminEmail', email);
      } else {
        localStorage.removeItem('rememberAdminEmail');
      }

      navigate('/dashboard'); 
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication failed');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="admin-login-wrapper">
      
      {/* Interactive Background Rising Bubbles */}
      <div className="estify-register-particles">
        <div className="particle p1"></div>
        <div className="particle p2"></div>
        <div className="particle p3"></div>
      </div>

      <div className="admin-secure-box rotating-card-entrance">
        
        {/* Mobile Logo Header */}
        <div className="hero-logo-container mobile-only-logo" style={{ marginBottom: '20px', justifyContent: 'center', alignItems: 'center' }}>
          <img src="/logo.jpg" alt="HomeFind Logo" style={{ width: '32px', height: '32px', borderRadius: '8px', objectFit: 'cover' }} />
          <div className="logo-text-group" style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', marginLeft: '10px' }}>
            <span className="logo-brand" style={{ fontWeight: '800', fontSize: '1.25rem', color: '#00ff80', textShadow: '0 0 10px rgba(0, 255, 128, 0.4)' }}>HomeFind</span>
            <span className="logo-tagline" style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: '#555' }}>Admin Portal</span>
          </div>
        </div>

        <div className="admin-header">
          <ShieldCheck size={50} className="shield-icon" />
          <h2>SYSTEM ACCESS</h2>
          <p>Restricted Cyber Area</p>
        </div>

        {error && <div className="admin-error">{error}</div>}

        <form onSubmit={handleLogin} className="admin-form">
          
          {/* Email input */}
          <div className="cyber-input-group">
            <Mail size={18} className="cyber-icon" />
            <input 
              type="text" 
              placeholder="Admin ID (Email / Mobile)" 
              required
              disabled={isSubmitting}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          
          {/* Password input with toggle */}
          <div className="cyber-input-group" style={{ position: 'relative' }}>
            <Lock size={18} className="cyber-icon" />
            <input 
              type={showPassword ? "text" : "password"} 
              placeholder="Passcode" 
              required
              disabled={isSubmitting}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button 
              type="button" 
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: '5px',
                background: 'transparent',
                border: 'none',
                color: '#00ff80',
                cursor: 'pointer',
                outline: 'none',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {/* Options row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', fontSize: '0.8rem', color: '#888', marginBottom: '15px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{ accentColor: '#00ff80' }}
              />
              <span>Remember me</span>
            </label>
            <a 
              href="#forgot" 
              onClick={() => { setShowForgotModal(true); setForgotStep(1); }}
              style={{ color: '#00ff80', textDecoration: 'none', fontWeight: 'bold' }}
            >
              Forgot Passcode?
            </a>
          </div>

          <button type="submit" className="btn-cyber-scan" disabled={isSubmitting}>
            <span>{isSubmitting ? 'AUTHENTICATING...' : 'AUTHENTICATE'}</span>
            <div className="scan-line"></div>
          </button>
        </form>

        {/* Social Authentication */}
        {(() => {
          const isClerkAvailable = typeof window !== 'undefined' && 
            (window.location.hostname.includes('localhost') || 
             window.location.hostname.includes('127.0.0.1') || 
             !import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || 
             !import.meta.env.VITE_CLERK_PUBLISHABLE_KEY.startsWith('pk_test_'));
          
          if (!isClerkAvailable) return null;

          return (
            <>
              <div style={{ display: 'flex', alignItems: 'center', textalign: 'center', color: '#555', fontSize: '0.8rem', margin: '20px 0' }}>
                <span style={{ flex: 1, borderBottom: '1px solid #222' }}></span>
                <span style={{ padding: '0 10px' }}>OR SCAN WITH</span>
                <span style={{ flex: 1, borderBottom: '1px solid #222' }}></span>
              </div>
              <ClerkAuthHandler 
                onSyncStart={handleSocialSyncStart}
                onSyncSuccess={handleSocialSyncSuccess}
                onSyncError={handleSocialSyncError}
              />
            </>
          );
        })()}

      </div>

      {/* Forgot Passcode Modal Overlay */}
      {showForgotModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '90%', maxWidth: '400px', background: '#0a0a0a', border: '1px solid #00ff80', padding: '30px', borderRadius: '15px', boxShadow: '0 0 30px rgba(0, 255, 128, 0.2)', textAlign: 'center' }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '1.25rem', color: '#00ff80', fontWeight: 'bold', fontFamily: 'monospace', letterSpacing: '2px' }}>FORGOT PASSCODE</h3>
            
            {forgotStep === 1 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', textAlign: 'left', fontFamily: 'monospace' }}>
                <p style={{ fontSize: '0.85rem', color: '#888', margin: 0, lineHeight: 1.4 }}>Enter admin Email or Mobile to generate verification OTP code.</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <label style={{ fontSize: '0.8rem', color: '#00ff80' }}>IDENTIFIER</label>
                  <input 
                    type="text" 
                    placeholder="Enter email or mobile number" 
                    value={forgotEmail} 
                    onChange={e => setForgotEmail(e.target.value)}
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #333', outline: 'none', background: '#111', color: '#fff', boxSizing: 'border-box' }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  <button 
                    onClick={() => setShowForgotModal(false)} 
                    style={{ flex: 1, padding: '12px', borderRadius: '8px', background: '#222', border: '1px solid #333', cursor: 'pointer', fontWeight: 'bold', color: '#888' }}
                  >
                    CANCEL
                  </button>
                  <button 
                    onClick={async () => {
                      if (!forgotEmail) {
                        await window.customAlert('Please enter email or mobile number.');
                        return;
                      }
                      try {
                        await axios.post((window.API_BASE_URL || 'https://realestatelisting-u2kp.onrender.com') + '/api/auth/send-otp', { identifier: forgotEmail });
                        setForgotStep(2);
                        await window.customAlert(`🔑 Passcode OTP has been sent! Check backend console/smtp logs.`);
                      } catch (err) {
                        await window.customAlert(err.response?.data?.message || 'Failed to send OTP.');
                      }
                    }} 
                    style={{ flex: 1, padding: '12px', borderRadius: '8px', background: 'transparent', border: '1px solid #00ff80', color: '#00ff80', cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    SEND OTP
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', textAlign: 'left', fontFamily: 'monospace' }}>
                <p style={{ fontSize: '0.85rem', color: '#888', margin: 0 }}>Enter 6-digit OTP and new admin Passcode.</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <label style={{ fontSize: '0.8rem', color: '#00ff80' }}>ENTER OTP</label>
                  <input 
                    type="text" 
                    placeholder="6-digit OTP" 
                    value={enteredOtp} 
                    onChange={e => setEnteredOtp(e.target.value)}
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #333', outline: 'none', background: '#111', color: '#fff', boxSizing: 'border-box' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <label style={{ fontSize: '0.8rem', color: '#00ff80' }}>NEW PASSCODE</label>
                  <input 
                    type="password" 
                    placeholder="Enter new passcode" 
                    value={newPassword} 
                    onChange={e => setNewPassword(e.target.value)}
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #333', outline: 'none', background: '#111', color: '#fff', boxSizing: 'border-box' }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  <button 
                    onClick={() => { setForgotStep(1); setEnteredOtp(''); }} 
                    style={{ flex: 1, padding: '12px', borderRadius: '8px', background: '#222', border: '1px solid #333', cursor: 'pointer', fontWeight: 'bold', color: '#888' }}
                  >
                    BACK
                  </button>
                  <button 
                    onClick={async () => {
                      if (!enteredOtp) {
                        await window.customAlert('Please enter the OTP code.');
                        return;
                      }
                      if (!newPassword || newPassword.length < 6) {
                        await window.customAlert('Passcode must be at least 6 characters.');
                        return;
                      }
                      try {
                        await axios.post((window.API_BASE_URL || 'https://realestatelisting-u2kp.onrender.com') + '/api/auth/reset-password', { identifier: forgotEmail, newPassword, otp: enteredOtp });
                        await window.customAlert('Passcode reset successfully! You can now log in.');
                        setShowForgotModal(false);
                        setForgotStep(1);
                        setForgotEmail('');
                        setEnteredOtp('');
                        setNewPassword('');
                      } catch (err) {
                        await window.customAlert(err.response?.data?.message || 'Failed to reset passcode.');
                      }
                    }} 
                    style={{ flex: 1, padding: '12px', borderRadius: '8px', background: '#00ff80', color: '#000', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    RESET PASSCODE
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminLogin;

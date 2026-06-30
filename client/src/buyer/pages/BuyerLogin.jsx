import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { 
  Eye, EyeOff, ShieldAlert, CheckCircle, Sparkles, Mail, Lock, ArrowRight,
  ShieldCheck, HelpCircle, Search, MapPin, Shield, Gift, Home, Check
} from 'lucide-react';
import { useSignIn, useUser } from '@clerk/clerk-react';
import './BuyerLogin.css';

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
            provider: provider 
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
          
          if (loggedUser.role === 'seller') {
            localStorage.setItem('sellerToken', res.data.token);
            localStorage.setItem('sellerUser', JSON.stringify(loggedUser));
          } else if (loggedUser.role === 'admin') {
            localStorage.setItem('adminToken', res.data.token);
            localStorage.setItem('adminUser', JSON.stringify(loggedUser));
          }

          onSyncSuccess(loggedUser);
        } catch (err) {
          onSyncError(err.response?.data?.message || 'This account is not registered. Please register first.');
        }
      }
    };

    syncClerkUser();
  }, [isSignedIn, user]);

  const handleSocialLogin = async (platform) => {
    if (!isLoaded) {
      alert("Clerk authentication library is still loading or blocked by your browser network. Please verify that your Clerk Publishable Key is correct and try again.");
      return;
    }
    localStorage.setItem('socialRegisterRole', 'buyer');
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

const BuyerLogin = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successData, setSuccessData] = useState(null); // stores user info upon login
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState(1);
  const [forgotEmail, setForgotEmail] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [enteredOtp, setEnteredOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showSocialModal, setShowSocialModal] = useState(null); // 'google', 'facebook', or null

  const handleSocialSyncStart = () => {
    setIsSubmitting(true);
    setError('');
  };

  const handleSocialSyncSuccess = (loggedUser) => {
    setSuccessData(loggedUser);
    setIsSubmitting(false);
    setTimeout(() => {
      if (loggedUser.role === 'seller') {
        window.location.href = '/seller/dashboard';
      } else if (loggedUser.role === 'admin') {
        window.location.href = '/admin/dashboard';
      } else {
        window.location.href = '/buyer/';
      }
    }, 2000);
  };

  const handleSocialSyncError = (errMsg) => {
    setError(errMsg);
    setIsSubmitting(false);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const res = await axios.post((window.API_BASE_URL || 'https://realestatelisting-u2kp.onrender.com') + '/api/auth/login', { identifier, password });
      
      const loggedUser = res.data.user;
      
      if (loggedUser.role === 'admin') {
        setError('Invalid credentials.');
        setIsSubmitting(false);
        return;
      }
      
      // Clear any pre-existing sessions to prevent multi-role conflicts and redirect loops
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('sellerToken');
      localStorage.removeItem('sellerUser');
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');

      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(loggedUser));
      
      if (loggedUser.role === 'seller') {
        localStorage.setItem('sellerToken', res.data.token);
        localStorage.setItem('sellerUser', JSON.stringify(loggedUser));
      } else if (loggedUser.role === 'admin') {
        localStorage.setItem('adminToken', res.data.token);
        localStorage.setItem('adminUser', JSON.stringify(loggedUser));
      }

      setSuccessData(loggedUser);
      setIsSubmitting(false);

      // Auto-redirect after 2 seconds to show the welcome splash
      setTimeout(() => {
        if (loggedUser.role === 'seller') {
          window.location.href = '/seller/dashboard';
        } else if (loggedUser.role === 'admin') {
          window.location.href = '/admin/dashboard';
        } else {
          window.location.href = '/buyer/';
        }
      }, 2000);

    } catch (err) {
      setError(err.response?.data?.message || 'Authentication failed. Please verify credentials.');
      setIsSubmitting(false);
    }
  };

  const handlePortalRedirect = () => {
    if (successData.role === 'seller') {
      window.location.href = '/seller/dashboard';
    } else if (successData.role === 'admin') {
      window.location.href = '/admin/dashboard';
    } else {
      window.location.href = '/buyer/';
    }
  };

  // SUCCESS / WELCOME OVERLAY MODAL
  if (successData) {
    const isSeller = successData.role === 'seller';
    const isAdmin = successData.role === 'admin';
    const roleLabel = isSeller ? 'Seller Portal' : (isAdmin ? 'Admin Console' : 'Buyer Lounge');
    const portalThemeClass = isSeller ? 'seller-theme' : (isAdmin ? 'admin-theme' : 'buyer-theme');
    
    return (
      <div className="estify-login-success-overlay">
        <div className="login-sparkle-container">
          {[...Array(15)].map((_, i) => (
            <div key={i} className={`sparkle-star sparkle-${i}`}>✨</div>
          ))}
        </div>

        <div className={`luxury-welcome-card ${portalThemeClass}`}>
          <div className="keycard-orb-wrapper">
            <div className="orb-glowing-ring"></div>
            <div className="orb-inner-circle">
              <Sparkles className="glowing-key-icon" size={32} />
            </div>
          </div>

          <h1 className="luxury-welcome-title">Welcome Back</h1>
          <h2 className="luxury-welcome-username">{successData.name}</h2>
          
          <div className="luxury-role-badge">
            <span className="role-dot"></span>
            {roleLabel}
          </div>

          <div className="luxury-session-box">
            <div className="session-detail">
              <span className="detail-name">SESSION ID</span>
              <span className="detail-val">{successData.id}</span>
            </div>
            <div className="session-detail">
              <span className="detail-name">IP STATUS</span>
              <span className="detail-val">SECURED &bull; ACTIVE</span>
            </div>
          </div>

          <div className="luxury-loader-wrapper">
            <div className="luxury-loader-bar"></div>
            <span className="luxury-loader-text">Configuring Secure Access Portal...</span>
          </div>

          <button onClick={handlePortalRedirect} className="luxury-enter-btn">
            <span>ENTER PORTAL</span>
            <ArrowRight size={18} className="enter-arrow-icon" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="estify-login-page-wrapper">
      <div className="estify-login-page-inner-grid">
        
        {/* LEFT & CENTER: The main split-screen desktop login container */}
        <div className="estify-login-desktop-main-card">
          
          <div className="estify-login-split-layout">
            
            {/* 1. HERO AREA (LEFT - 55%) */}
            <div className="estify-login-hero-pane">
              <div className="hero-backdrop-img"></div>
              <div className="hero-overlay-shade"></div>
              
              {/* Logo Branding */}
              <div className="hero-logo-container">
                <div className="hero-house-icon">
                  <Home size={16} color="white" fill="white" />
                </div>
                <div className="logo-text-group">
                  <span className="logo-brand">HomeFind</span>
                  <span className="logo-tagline">Real Estate Platform</span>
                </div>
              </div>

              {/* Main Headline */}
              <div className="hero-headline-group">
                <h1>
                  Find Your<br />
                  Dream <span className="highlight-home">Home<span className="gold-underline"></span></span>
                </h1>
                <p className="hero-subtitle">
                  Buy, rent, or sell properties with ease. Your perfect space is just a click away.
                </p>
              </div>

              {/* Floating Feature Badges */}
              <div className="hero-feature-badges-pill">
                <div className="badge-item">
                  <div className="badge-icon-box purple-bg">
                    <ShieldCheck size={14} color="#8b5cf6" />
                  </div>
                  <span>Verified Listings</span>
                </div>
                <div className="badge-item">
                  <div className="badge-icon-box green-bg">
                    <Shield size={14} color="#10b981" />
                  </div>
                  <span>Secure Deals</span>
                </div>
                <div className="badge-item">
                  <div className="badge-icon-box orange-bg">
                    <HelpCircle size={14} color="#f97316" />
                  </div>
                  <span>24/7 Support</span>
                </div>
              </div>

              {/* Floating Customer Reviews */}
              <div className="hero-reviews-floating-card floating">
                <div className="avatar-overlap-stack">
                  <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=80" alt="User 1" />
                  <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=80&q=80" alt="User 2" />
                  <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=80&q=80" alt="User 3" />
                  <img src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=80&q=80" alt="User 4" />
                </div>
                <div className="review-text-group">
                  <div className="stars-row">⭐⭐⭐⭐⭐</div>
                  <span className="review-subtitle">Trusted by 10K+ happy customers</span>
                </div>
              </div>

            </div>



            {/* 2. LOGIN CARD AREA (RIGHT - 45%) */}
            <div className="estify-login-form-pane">
              <div className="login-form-card scale-in-entrance">
                
                {/* Sketch illustration */}
                <div className="sketch-house-illustration">
                  <svg className="house-svg" viewBox="0 0 100 60" fill="none" stroke="#cbd5e1" strokeWidth="1.5">
                    <path d="M10 50 L10 25 L50 5 L90 25 L90 50 Z" />
                    <path d="M40 50 L40 32 L60 32 L60 50" />
                    <rect x="20" y="28" width="12" height="12" rx="2" />
                    <rect x="68" y="28" width="12" height="12" rx="2" />
                    <circle cx="50" cy="20" r="4" />
                  </svg>
                </div>

                <div className="login-header-group">
                  <h2>Welcome Back!</h2>
                  <p>Sign in to continue to your account</p>
                </div>

                {error && (
                  <div className="error-message fade-in-shake">
                    <ShieldAlert size={16} />
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleLogin} className="login-inputs-form">
                  
                  {/* Email Input */}
                  <div className="input-group">
                    <label>Email Address / User ID</label>
                    <div className="input-with-icon-wrapper">
                      <Mail size={16} className="input-icon" />
                      <input 
                        type="text" 
                        placeholder="Enter your email or User ID" 
                        value={identifier}
                        disabled={isSubmitting}
                        onChange={(e) => setIdentifier(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {/* Password Input */}
                  <div className="input-group">
                    <label>Password</label>
                    <div className="input-with-icon-wrapper">
                      <Lock size={16} className="input-icon" />
                      <input 
                        type={showPassword ? "text" : "password"} 
                        placeholder="Enter your password" 
                        value={password}
                        disabled={isSubmitting}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                      <button 
                        type="button" 
                        className="pwd-toggle-btn"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Options row */}
                  <div className="login-options-row">
                    <label className="remember-me-checkbox">
                      <input 
                        type="checkbox" 
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                      />
                      <span>Remember me</span>
                    </label>
                    <a href="#forgot" className="forgot-pwd-link" onClick={() => { setShowForgotModal(true); setForgotStep(1); }}>
                      Forgot Password?
                    </a>
                  </div>

                  {/* Sign In submit Button */}
                  <button type="submit" className="estify-login-gradient-btn" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <div className="spinner-loader"></div>
                    ) : (
                      <>
                        <span>Sign In</span>
                        <ArrowRight size={16} className="arrow-icon" />
                      </>
                    )}
                  </button>

                </form>

                {/* Social Login */}
                {(() => {
                  const isClerkAvailable = typeof window !== 'undefined' && 
                    (window.location.hostname.includes('localhost') || 
                     window.location.hostname.includes('127.0.0.1') || 
                     !import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || 
                     !import.meta.env.VITE_CLERK_PUBLISHABLE_KEY.startsWith('pk_test_'));
                  
                  if (!isClerkAvailable) return null;

                  return (
                    <>
                      <div className="social-login-divider">
                        <span>or continue with</span>
                      </div>
                      <ClerkAuthHandler 
                        onSyncStart={handleSocialSyncStart}
                        onSyncSuccess={handleSocialSyncSuccess}
                        onSyncError={handleSocialSyncError}
                      />
                    </>
                  );
                })()}

                {/* Sign up prompt footer */}
                <div className="login-signup-prompt">
                  <span>Don't have an account?</span>
                  <Link to="/register" className="signup-highlight-link">Sign Up</Link>
                </div>

              </div>
            </div>

          </div>

          {/* 3. BOTTOM FEATURES BAR (Only on desktop container) */}
          <div className="estify-login-bottom-features-bar">
            <div className="footer-feature-glass-card">
              <div className="circle-icon-wrap blue-theme">
                <Search size={16} />
              </div>
              <div className="feature-text">
                <h5>Smart Search</h5>
                <p>Find properties that match you</p>
              </div>
            </div>
            <div className="footer-feature-glass-card">
              <div className="circle-icon-wrap green-theme">
                <MapPin size={16} />
              </div>
              <div className="feature-text">
                <h5>Prime Locations</h5>
                <p>Best locations near you</p>
              </div>
            </div>
            <div className="footer-feature-glass-card">
              <div className="circle-icon-wrap pink-theme">
                <ShieldCheck size={16} />
              </div>
              <div className="feature-text">
                <h5>Safe & Secure</h5>
                <p>Your data is always protected</p>
              </div>
            </div>
            <div className="footer-feature-glass-card">
              <div className="circle-icon-wrap purple-theme">
                <Gift size={16} />
              </div>
              <div className="feature-text">
                <h5>Best Deals</h5>
                <p>Get the best prices & offers</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      {showForgotModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(10px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="custom-modal-box" style={{ width: '90%', maxWidth: '400px', background: '#fff', padding: '25px', borderRadius: '15px', border: '1px solid #e2e8f0', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '1.2rem', color: '#0f172a', fontWeight: '800' }}>Forgot Password</h3>
            {forgotStep === 1 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', textAlign: 'left' }}>
                <p style={{ fontSize: '0.9rem', color: '#475569', margin: 0 }}>Enter your registered Email or Mobile number to receive a 6-digit OTP code.</p>
                <div className="input-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: '600' }}>Email Address / Mobile</label>
                  <input 
                    type="text" 
                    placeholder="Enter email or mobile number" 
                    value={forgotEmail} 
                    onChange={e => setForgotEmail(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', background: '#fff', color: '#333' }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  <button 
                    onClick={() => setShowForgotModal(false)} 
                    style={{ flex: 1, padding: '10px', borderRadius: '8px', background: '#f1f5f9', border: '1px solid #cbd5e1', cursor: 'pointer', fontWeight: 'bold', color: '#475569' }}
                  >
                    Cancel
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
                        await window.customAlert(`🔑 OTP verification code has been sent in real-time! If local SMTP is not configured, check the backend server logs/terminal output.`);
                      } catch (err) {
                        await window.customAlert(err.response?.data?.message || 'Failed to send OTP code.');
                      }
                    }} 
                    style={{ flex: 1, padding: '10px', borderRadius: '8px', background: '#3b82f6', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    Send OTP
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', textAlign: 'left' }}>
                <p style={{ fontSize: '0.9rem', color: '#475569', margin: 0 }}>Enter the 6-digit OTP and your new password below.</p>
                <div className="input-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: '600' }}>Enter OTP</label>
                  <input 
                    type="text" 
                    placeholder="6-digit OTP" 
                    value={enteredOtp} 
                    onChange={e => setEnteredOtp(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', background: '#fff', color: '#333' }}
                  />
                </div>
                <div className="input-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: '600' }}>New Password</label>
                  <input 
                    type="password" 
                    placeholder="Enter new password" 
                    value={newPassword} 
                    onChange={e => setNewPassword(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', background: '#fff', color: '#333' }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  <button 
                    onClick={() => { setForgotStep(1); setEnteredOtp(''); }} 
                    style={{ flex: 1, padding: '10px', borderRadius: '8px', background: '#f1f5f9', border: '1px solid #cbd5e1', cursor: 'pointer', fontWeight: 'bold', color: '#475569' }}
                  >
                    Back
                  </button>
                  <button 
                    onClick={async () => {
                      if (!enteredOtp) {
                        await window.customAlert('Please enter the OTP verification code.');
                        return;
                      }
                      if (!newPassword || newPassword.length < 6) {
                        await window.customAlert('Password must be at least 6 characters.');
                        return;
                      }
                      try {
                        await axios.post((window.API_BASE_URL || 'https://realestatelisting-u2kp.onrender.com') + '/api/auth/reset-password', { identifier: forgotEmail, newPassword, otp: enteredOtp });
                        await window.customAlert('Password reset successfully! You can now log in.');
                        setShowForgotModal(false);
                        setForgotStep(1);
                        setForgotEmail('');
                        setEnteredOtp('');
                        setNewPassword('');
                      } catch (err) {
                        await window.customAlert(err.response?.data?.message || 'Failed to reset password.');
                      }
                    }} 
                    style={{ flex: 1, padding: '10px', borderRadius: '8px', background: '#10b981', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    Reset Password
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

export default BuyerLogin;

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { 
  UserPlus, Eye, EyeOff, User, Briefcase, MapPin, Shield, CheckCircle, Sparkles,
  Building, Compass, ArrowLeft, Upload, Image, ShieldAlert, Home, UserCheck
} from 'lucide-react';
import './BuyerRegister.css';

const BuyerRegister = () => {
  const [role, setRole] = useState(''); // 'buyer', 'seller', or empty for step 1
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [successData, setSuccessData] = useState(null); // stores user info upon success
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [photo, setPhoto] = useState(null);

  // Address
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');

  // Seller specific
  const [companyName, setCompanyName] = useState('');
  const [sellerType, setSellerType] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [gstNumber, setGstNumber] = useState('');

  const [passwordStrength, setPasswordStrength] = useState(0);

  // Calculate password strength whenever password changes
  useEffect(() => {
    if (!password) {
      setPasswordStrength(0);
      return;
    }
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;
    
    const finalStrength = Math.min(4, Math.floor((strength / 5) * 4) || 1);
    setPasswordStrength(finalStrength);
  }, [password]);

  const handleFileDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setPhoto(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      setPhoto(e.target.files[0]);
    }
  };

  // Dynamic progress tracker percentage
  const getProgress = () => {
    let fields = [name, email, mobile, password, confirmPassword];
    if (role === 'seller') {
      fields.push(sellerType, address, city, state, pincode, panNumber, aadhaarNumber);
    } else {
      fields.push(address, city, state, pincode);
    }
    let filled = fields.filter(val => !!val && String(val).trim() !== '').length;
    if (photo) filled++;
    const total = fields.length + 1;
    return Math.min(100, Math.floor((filled / total) * 100));
  };

  const validate = () => {
    if (!name.trim()) return 'Full Name is required.';
    if (!/^[a-zA-Z\s]+$/.test(name)) return 'Full Name must contain alphabets only.';
    if (role === 'buyer' && name.trim().length < 3) return 'Full Name must be at least 3 characters.';

    if (!email) return 'Email Address is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Please enter a valid Email Address.';
    if (email.length > 100) return 'Email Address must be at most 100 characters.';

    if (!mobile) return 'Mobile Number is required.';
    if (!/^\d{10}$/.test(mobile)) return 'Mobile Number must contain 10 digits.';

    if (!password) return 'Password is required.';
    if (password.length < 8 || password.length > 20) return 'Password must be between 8 and 20 characters.';
    if (!/[A-Z]/.test(password)) return 'Password must contain one uppercase letter.';
    if (!/[a-z]/.test(password)) return 'Password must contain one lowercase letter.';
    if (!/\d/.test(password)) return 'Password must contain one number.';
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return 'Password must contain one special character.';

    if (password !== confirmPassword) return 'Passwords do not match.';

    if (role === 'seller') {
      if (!sellerType) return 'Seller Type is required.';
      if (!address.trim()) return 'Address is required.';
      if (!city.trim()) return 'City is required.';
      if (!state.trim()) return 'State is required.';
      if (!pincode) return 'Pincode must contain 6 digits.';
      if (!/^\d{6}$/.test(pincode)) return 'Pincode must contain 6 digits.';

      if (!panNumber) return 'PAN Number is required.';
      if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(panNumber.toUpperCase())) return 'PAN Number is invalid.';
      if (!aadhaarNumber) return 'Aadhaar Number is required.';
      if (!/^\d{12}$/.test(aadhaarNumber)) return 'Aadhaar Number must contain 12 digits.';
      if (gstNumber && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gstNumber.toUpperCase())) return 'GST Number is invalid.';
    } else {
      if (pincode && !/^\d{6}$/.test(pincode)) return 'Pincode must contain 6 digits.';
    }
    return null;
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    const valError = validate();
    if (valError) {
      setError(valError);
      window.scrollTo(0, 0);
      return;
    }
    setError('');
    setIsSubmitting(true);

    const submitData = new FormData();
    submitData.append('name', name);
    submitData.append('email', email);
    submitData.append('mobile', mobile);
    submitData.append('password', password);
    submitData.append('plainPassword', password);
    submitData.append('role', role);
    submitData.append('address', address || 'Not Provided');
    submitData.append('city', city || 'Not Provided');
    submitData.append('state', state || 'Not Provided');
    submitData.append('pincode', pincode || 'Not Provided');

    if (photo) {
      submitData.append('photo', photo);
    }

    if (role === 'seller') {
      submitData.append('companyName', companyName);
      submitData.append('sellerType', sellerType);
      submitData.append('panNumber', panNumber.toUpperCase());
      submitData.append('aadhaarNumber', aadhaarNumber);
      if (gstNumber) submitData.append('gstNumber', gstNumber.toUpperCase());
    }

    try {
      const res = await axios.post('http://localhost:5000/api/auth/register', submitData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      if (role === 'seller') {
        localStorage.setItem('sellerToken', res.data.token);
        localStorage.setItem('sellerUser', JSON.stringify(res.data.user));
      }
      
      setSuccessData(res.data.user);
      setIsSubmitting(false);

      // Soft auto-redirect after 3.5 seconds to show visual completion
      setTimeout(() => {
        if (role === 'seller') {
          window.location.href = `/seller/dashboard?registered=true&name=${encodeURIComponent(res.data.user.name)}`;
        } else {
          window.location.href = `/buyer/?registered=true&name=${encodeURIComponent(res.data.user.name)}&role=buyer`;
        }
      }, 3500);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
      setIsSubmitting(false);
      window.scrollTo(0, 0);
    }
  };

  const handlePortalRedirect = () => {
    if (role === 'seller') {
      window.location.href = '/seller/dashboard';
    } else {
      window.location.href = '/buyer/';
    }
  };

  const handleSocialRegister = async (platform) => {
    let selectedRole = role;
    if (!selectedRole) {
      const isBuyer = await window.customConfirm("Would you like to register as a Buyer? (Cancel for Seller)", "Select Registration Role");
      selectedRole = isBuyer ? 'buyer' : 'seller';
    }

    const mockUser = {
      id: selectedRole === 'seller' ? "SEL0011" : "BUY0011",
      name: selectedRole === 'seller' ? "TestSE" : "Buyer Lingam",
      email: selectedRole === 'seller' ? "TESTSELL@gmail.com" : "buyer.lingam@gmail.com",
      role: selectedRole,
      mobile: selectedRole === 'seller' ? "4567890321" : "8667732090",
      photo: "/images/default/default-avatar.jpg",
      status: "active",
      memberSince: "24-06-2026"
    };

    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('sellerToken');
    localStorage.removeItem('sellerUser');
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');

    localStorage.setItem('token', 'mock-oauth-token-register');
    localStorage.setItem('user', JSON.stringify(mockUser));
    if (selectedRole === 'seller') {
      localStorage.setItem('sellerToken', 'mock-oauth-token-register');
      localStorage.setItem('sellerUser', JSON.stringify(mockUser));
    }

    setSuccessData(mockUser);
    setTimeout(() => {
      if (selectedRole === 'seller') {
        window.location.href = `/seller/dashboard?registered=true&name=${encodeURIComponent(mockUser.name)}`;
      } else {
        window.location.href = `/buyer/?registered=true&name=${encodeURIComponent(mockUser.name)}&role=buyer`;
      }
    }, 2000);
  };


  return (
    <div className="estify-register-page-wrapper">
      
      {/* Registration Successful POPUP Modal Overlay */}
      {successData && (
        <div className="registration-success-overlay">
          <div className="registration-success-modal fade-in-scale">
            
            {/* Confetti particles */}
            <div className="confetti-container">
              <div className="confetti-popper popper-left">🎉</div>
              <div className="confetti-popper popper-right">🎉</div>
              {[...Array(12)].map((_, i) => (
                <div key={i} className={`confetti-piece color-${i % 4} piece-${i}`}></div>
              ))}
            </div>

            <div className="success-checkmark-circle">
              <div className="success-checkmark-inner">
                <CheckCircle size={36} />
              </div>
            </div>

            <h2 className="success-title">Welcome to HomeFind!</h2>
            <p className="success-subtitle">Your luxury account has been successfully created.</p>

            <div className="success-role-card">
              <div className="detail-row">
                <span className="detail-label">Full Name</span>
                <span className="detail-value">{successData.name}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Designated Role</span>
                <span className="detail-value role-highlight">{successData.role?.toUpperCase()}</span>
              </div>
            </div>

            <p className="success-explore">Entering portal protocols automatically...</p>
            
            <button className="success-home-btn" onClick={handlePortalRedirect}>
              <Home size={18} /> Enter Portal Immediately
            </button>
          </div>
        </div>
      )}

      {/* Main Split Screen Container */}
      <div className={`estify-register-split-container ${successData ? 'modal-open-blur' : ''}`}>
        
        {/* LEFT COLUMN: Luxury Villa Backdrop */}
        <div className="estify-register-image-pane">
          <div className="estify-register-image-backdrop"></div>
          <svg className="estify-register-compass-watermark" viewBox="0 0 100 100" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5">
            <circle cx="50" cy="50" r="45" />
            <circle cx="50" cy="50" r="38" strokeDasharray="1 2" />
            <path d="M50 5 L50 95 M5 50 L95 50" />
            <path d="M50 5 L53 47 L95 50 L53 53 L50 95 L47 53 L5 50 L47 47 Z" fill="rgba(255,255,255,0.02)" />
            <path d="M50 5 L47 47 L5 50 L47 47 Z" fill="rgba(255,255,255,0.03)" />
            <path d="M50 95 L53 53 L95 50 L53 53 Z" fill="rgba(255,255,255,0.03)" />
            <text x="50" y="12" fill="rgba(255,255,255,0.2)" fontSize="5" textAnchor="middle">N</text>
            <text x="50" y="92" fill="rgba(255,255,255,0.2)" fontSize="5" textAnchor="middle">S</text>
            <text x="92" y="52" fill="rgba(255,255,255,0.2)" fontSize="5" textAnchor="middle">E</text>
            <text x="8" y="52" fill="rgba(255,255,255,0.2)" fontSize="5" textAnchor="middle">W</text>
          </svg>
          <div className="estify-register-stats-container">
            <div className="estify-register-stat-item">
              <Building size={24} />
              <span>1000+ Premium Listings</span>
            </div>
            <div className="estify-register-stat-item">
              <Shield size={24} />
              <span>Verified Agents</span>
            </div>
            <div className="estify-register-stat-item">
              <UserCheck size={24} />
              <span>30,000+ Properties</span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Glassmorphic Registration Card */}
        <div className="estify-register-form-pane">
          
          {/* Floating background decorative bubbles */}
          <div className="estify-register-particles">
            <div className="particle p1"></div>
            <div className="particle p2"></div>
            <div className="particle p3"></div>
            <div className="particle p4"></div>
            <div className="particle p5"></div>
          </div>

          <div className="estify-register-card glass scale-in-entrance">
            
            {/* Header Brand Logo */}
            <div className="estify-register-logo-box">
              <div className="estify-register-house-icon">
                <Home size={18} color="white" fill="white" />
              </div>
              <span className="estify-register-logo-text">HomeFind</span>
            </div>

            <div className="estify-register-header">
              <h1>
                {!role ? 'CREATE ACCOUNT' : role === 'seller' ? 'SELLER REGISTRATION' : 'BUYER REGISTRATION'}
              </h1>
              <p>Join LuxeBlue to discover and list premium properties.</p>
            </div>

            {error && (
              <div className="error-message fade-in-shake">
                <ShieldAlert size={16} />
                <span>{error}</span>
              </div>
            )}

            {/* STEP 1: Role Selection inside same split layout */}
            {!role && (
              <div className="role-selection-inner">
                <h3>I want to register as:</h3>
                <div className="role-grid">
                  <div onClick={() => setRole('buyer')} className="role-select-card buyer-card">
                    <User size={40} className="role-card-icon" />
                    <h4>Buyer</h4>
                    <p>Search & acquire luxury properties</p>
                  </div>
                  <div onClick={() => setRole('seller')} className="role-select-card seller-card">
                    <Briefcase size={40} className="role-card-icon" />
                    <h4>Seller</h4>
                    <p>Post & sell/lease real estates</p>
                  </div>
                </div>
                <div className="social-login-divider">
                  <span>or signup with</span>
                </div>

                <div className="social-buttons-row">
                  <button className="social-btn google-btn" type="button" onClick={() => handleSocialRegister('google')}>
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                    </svg>
                    <span>Google</span>
                  </button>
                  <button className="social-btn facebook-btn" type="button" onClick={() => handleSocialRegister('facebook')}>
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" fill="#1877F2"/>
                    </svg>
                    <span>Facebook</span>
                  </button>
                </div>

                <div className="auth-footer-link-wrapper">
                  <span>Already have an account?</span>
                  <Link to="/login" className="estify-register-login-pill-btn">Log In</Link>
                </div>
              </div>
            )}

            {/* STEP 2: The Registration Form */}
            {role && (
              <form className="auth-form" onSubmit={handleRegisterSubmit}>
                
                {/* 1. PERSONAL INFORMATION */}
                <h3 className="section-title personal-title">
                  <User size={16} /> Personal Info{role === 'seller' && 'rmation'}
                </h3>
                
                <div className="form-layout-grid">
                  {/* Left part of Personal Info (Input fields) */}
                  <div className="inputs-block">
                    <div className="input-group">
                      <label>Full Name <span className="req-stars">**</span></label>
                      <input 
                        type="text" 
                        placeholder="Enter full name" 
                        value={name}
                        disabled={isSubmitting}
                        onChange={(e) => setName(e.target.value)}
                        required 
                      />
                    </div>
                    <div className="input-group">
                      <label>Email Address <span className="req-stars">**</span></label>
                      <input 
                        type="email" 
                        placeholder="Enter email address" 
                        value={email}
                        disabled={isSubmitting}
                        onChange={(e) => setEmail(e.target.value)}
                        required 
                      />
                    </div>
                    <div className="input-group">
                      <label>Mobile Number <span className="req-stars">**</span></label>
                      <input 
                        type="tel" 
                        placeholder="Enter 10 digit mobile number" 
                        value={mobile}
                        disabled={isSubmitting}
                        onChange={(e) => setMobile(e.target.value)}
                        required 
                      />
                    </div>
                  </div>

                  {/* Right part of Personal Info (Profile picture upload) */}
                  <div className="upload-block">
                    <label>Profile Picture</label>
                    {role === 'buyer' ? (
                      <div 
                        className="buyer-upload-circle"
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={handleFileDrop}
                        onClick={() => !isSubmitting && document.getElementById('photo-input').click()}
                      >
                        <input 
                          type="file" 
                          id="photo-input" 
                          accept="image/*" 
                          style={{ display: 'none' }} 
                          disabled={isSubmitting}
                          onChange={handleFileSelect} 
                        />
                        {photo ? (
                          <div className="uploaded-preview">
                            <Image size={20} color="#2563eb" />
                            <span className="file-name">{photo.name.substring(0, 15)}</span>
                          </div>
                        ) : (
                          <>
                            <Upload size={20} color="#64748b" />
                            <span className="upload-title">Upload</span>
                            <span className="upload-subtitle">DRAG & DROP OR<br/>CLICK TO UPLOAD</span>
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="seller-file-upload-box">
                        <input 
                          type="file" 
                          accept="image/*"
                          disabled={isSubmitting}
                          onChange={(e) => setPhoto(e.target.files[0])}
                          className="seller-file-input"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Password / Security Section */}
                <h3 className="section-title security-title">
                  <Shield size={16} /> Security
                </h3>
                <div className="form-grid-2">
                  <div className="input-group">
                    <label>Password <span className="req-stars">**</span></label>
                    <div className="password-input-wrapper">
                      <input 
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter password"
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
                    {/* Password Strength Bars */}
                    {password && (
                      <div className="password-strength-meter">
                        <div className={`strength-bar ${passwordStrength >= 1 ? 'active-red' : ''}`}></div>
                        <div className={`strength-bar ${passwordStrength >= 2 ? 'active-orange' : ''}`}></div>
                        <div className={`strength-bar ${passwordStrength >= 3 ? 'active-green' : ''}`}></div>
                        <div className={`strength-bar ${passwordStrength >= 4 ? 'active-blue' : ''}`}></div>
                      </div>
                    )}
                  </div>

                  <div className="input-group">
                    <label>Confirm Password <span className="req-stars">**</span></label>
                    <div className="password-input-wrapper">
                      <input 
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Re-enter password"
                        value={confirmPassword}
                        disabled={isSubmitting}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                      />
                      <button 
                        type="button" 
                        className="pwd-toggle-btn"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* 2. BUSINESS INFORMATION (Seller only) */}
                {role === 'seller' && (
                  <>
                    <h3 className="section-title business-title">
                      <Briefcase size={16} /> Business Information
                    </h3>
                    <div className="form-grid-2">
                      <div className="input-group">
                        <label>Company Name (Optional)</label>
                        <input 
                          type="text" 
                          placeholder="Enter company name" 
                          value={companyName}
                          disabled={isSubmitting}
                          onChange={(e) => setCompanyName(e.target.value)}
                        />
                      </div>
                      <div className="input-group">
                        <label>Seller Type <span className="req-stars">**</span></label>
                        <select value={sellerType} onChange={(e) => setSellerType(e.target.value)} required disabled={isSubmitting}>
                          <option value="">Select Seller Type</option>
                          <option value="Individual">Individual</option>
                          <option value="Builder">Builder</option>
                          <option value="Agent">Agent</option>
                        </select>
                      </div>
                    </div>
                  </>
                )}

                {/* 3. ADDRESS INFORMATION */}
                <h3 className="section-title address-title">
                  <MapPin size={16} /> Address Information {role === 'buyer' && '(Optional)'}
                </h3>
                <div className="form-grid-2">
                  <div className="input-group">
                    <label>Address {role === 'seller' && <span className="req-stars">**</span>}</label>
                    <input 
                      type="text" 
                      placeholder="Street details" 
                      value={address}
                      disabled={isSubmitting}
                      onChange={(e) => setAddress(e.target.value)}
                      required={role === 'seller'} 
                    />
                  </div>
                  <div className="input-group">
                    <label>City {role === 'seller' && <span className="req-stars">**</span>}</label>
                    <input 
                      type="text" 
                      placeholder="City" 
                      value={city}
                      disabled={isSubmitting}
                      onChange={(e) => setCity(e.target.value)}
                      required={role === 'seller'} 
                    />
                  </div>
                  <div className="input-group">
                    <label>State {role === 'seller' && <span className="req-stars">**</span>}</label>
                    <input 
                      type="text" 
                      placeholder="State" 
                      value={state}
                      disabled={isSubmitting}
                      onChange={(e) => setState(e.target.value)}
                      required={role === 'seller'} 
                    />
                  </div>
                  <div className="input-group">
                    <label>Pincode {role === 'seller' && <span className="req-stars">**</span>}</label>
                    <input 
                      type="text" 
                      placeholder="6 digit pincode" 
                      value={pincode}
                      disabled={isSubmitting}
                      onChange={(e) => setPincode(e.target.value)}
                      required={role === 'seller'} 
                    />
                  </div>
                </div>

                {/* 4. VERIFICATION INFORMATION (Seller only) */}
                {role === 'seller' && (
                  <>
                    <h3 className="section-title verification-title">
                      <Shield size={16} /> Verification Information
                    </h3>
                    <div className="form-grid-2">
                      <div className="input-group">
                        <label>PAN Number <span className="req-stars">**</span></label>
                        <input 
                          type="text" 
                          placeholder="Format: ABCDE1234F" 
                          value={panNumber}
                          disabled={isSubmitting}
                          onChange={(e) => setPanNumber(e.target.value)}
                          required 
                        />
                      </div>
                      <div className="input-group">
                        <label>Aadhaar Number <span className="req-stars">**</span></label>
                        <input 
                          type="text" 
                          placeholder="12 digit Aadhaar number" 
                          value={aadhaarNumber}
                          disabled={isSubmitting}
                          onChange={(e) => setAadhaarNumber(e.target.value)}
                          required 
                        />
                      </div>
                      <div className="input-group full-width-field">
                        <label>GST Number (Optional)</label>
                        <input 
                          type="text" 
                          placeholder="15 digit GST Number" 
                          value={gstNumber}
                          disabled={isSubmitting}
                          onChange={(e) => setGstNumber(e.target.value)}
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Dynamic animated completion progress bar */}
                <div className="form-progress-container">
                  <div className="form-progress-bar" style={{ width: `${getProgress()}%` }}></div>
                </div>

                {/* Submit Register Button */}
                <button type="submit" className="estify-register-metal-btn w-100" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <div className="spinner-loader"></div>
                  ) : (
                    'Register'
                  )}
                </button>
                
                {/* Form Footer links */}
                <div className="form-footer-action-row">
                  <button type="button" onClick={() => setRole('')} className="estify-register-back-btn" disabled={isSubmitting}>
                    <ArrowLeft size={14} /> Back to Role Select
                  </button>
                  <div className="login-prompt-wrapper">
                    <span>Already have an account?</span>
                    <Link to="/login" className="login-link">Log In</Link>
                  </div>
                </div>

              </form>
            )}

          </div>
        </div>

      </div>
    </div>
  );
};

export default BuyerRegister;

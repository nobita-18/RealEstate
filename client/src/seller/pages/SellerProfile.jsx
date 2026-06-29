import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  User, LogOut, Mail, Phone, Building, Briefcase, 
  MapPin, Key, Bell, BarChart2, Shield, Settings, CheckCircle, CreditCard 
} from 'lucide-react';
import '../pages/SellerRegister.css';
import { getAssetUrl } from '../../api';

const SellerProfile = ({ isDashboardView = false, initialProfile = null, onProfileUpdate = null }) => {
  const navigate = useNavigate();
  const sellerUser = JSON.parse(localStorage.getItem('sellerUser')) || JSON.parse(localStorage.getItem('user'));
  const [properties, setProperties] = useState([]);
  const [message, setMessage] = useState('');
  
  // Settings forms
  const [passwordData, setPasswordData] = useState({ newPassword: '', confirmPassword: '' });
  const [notifications, setNotifications] = useState({ emailAlerts: true, smsAlerts: false });

  const [sellerStats, setSellerStats] = useState({
    total: 0,
    approved: 0,
    rejected: 0,
    waiting: 0
  });

  // Edit / View state
  const [isEditing, setIsEditing] = useState(true);
  const [errors, setErrors] = useState({});
  const [allUsers, setAllUsers] = useState([]);
  const [profileData, setProfileData] = useState(null);
  const [locInput, setLocInput] = useState('');

  const mapProfileToFormData = (profile) => {
    if (!profile) return {};
    return {
      name: profile.name || '',
      email: profile.email || '',
      mobile: profile.mobile || '',
      dob: profile.dob || '',
      gender: profile.gender || '',
      photo: profile.photo || '',
      
      companyName: profile.companyName || '',
      businessType: profile.businessType || 'Individual Agent',
      reraNumber: profile.reraNumber || '',
      gstNumber: profile.gstNumber || '',
      businessEmail: profile.businessEmail || '',
      businessPhone: profile.businessPhone || '',
      websiteUrl: profile.websiteUrl || '',
      experience: profile.experience !== undefined ? profile.experience : '',
      
      addressLine1: profile.addressLine1 || profile.address || '',
      addressLine2: profile.addressLine2 || '',
      city: profile.city || '',
      state: profile.state || '',
      pincode: profile.pincode || '',
      country: profile.country || 'India',
      
      idType: profile.idType || 'Aadhaar',
      idNumber: profile.idNumber || '',
      aadhaarUpload: profile.aadhaarUpload || '',
      panUpload: profile.panUpload || '',
      selfieUpload: profile.selfieUpload || '',
      addressProofUpload: profile.addressProofUpload || '',
      termsAccepted: profile.termsAccepted || false,
      
      specialization: profile.specialization || [],
      preferredLocations: Array.isArray(profile.preferredLocations)
        ? profile.preferredLocations
        : (profile.preferredLocations ? profile.preferredLocations.split(',').map(s => s.trim()).filter(Boolean) : []),
      bankHolderName: profile.bankHolderName || '',
      bankAccountNumber: profile.bankAccountNumber || '',
      ifscCode: profile.ifscCode || '',
      upiId: profile.upiId || ''
    };
  };

  const [formData, setFormData] = useState(() => mapProfileToFormData(initialProfile || sellerUser));

  const fetchMyProperties = () => {
    if (!sellerUser) return;
    axios.get((window.API_BASE_URL || 'https://realestatelisting-u2kp.onrender.com') + '/api/properties?status=all')
      .then(res => {
        const myProps = res.data.filter(p => String(p.ownerId) === String(sellerUser.id));
        setProperties(myProps);
        setSellerStats({
          total: myProps.length,
          approved: myProps.filter(p => p.status === 'approved').length,
          rejected: myProps.filter(p => p.status === 'rejected').length,
          waiting: myProps.filter(p => p.status === 'pending' || !p.status).length
        });
      })
      .catch(err => console.error('Failed to load profile stats'));
  };

  // Fetch all users for RERA uniqueness check on mount
  useEffect(() => {
    axios.get((window.API_BASE_URL || 'https://realestatelisting-u2kp.onrender.com') + '/api/users')
      .then(res => {
        setAllUsers(res.data);
      })
      .catch(err => console.error('Failed to fetch users list for uniqueness check'));
  }, []);

  // Synchronize profile data
  useEffect(() => {
    if (initialProfile) {
      const mapped = mapProfileToFormData(initialProfile);
      setProfileData(mapped);
      if (!isEditing) {
        setFormData(mapped);
      }
    } else if (sellerUser && sellerUser.id) {
      axios.get(`${window.API_BASE_URL || "https://realestatelisting-u2kp.onrender.com"}/api/users/${sellerUser.id}`)
        .then(res => {
          const mapped = mapProfileToFormData(res.data);
          setProfileData(mapped);
          if (!isEditing) {
            setFormData(mapped);
          }
        })
        .catch(err => console.error('Failed to fetch profile details on mount:', err));
    }
  }, [initialProfile?.id, initialProfile?.name, initialProfile?.photo, initialProfile?.email, isEditing]);

  useEffect(() => {
    if (!sellerUser) {
      navigate('/login');
      return;
    }
    fetchMyProperties();
    setNotifications({
      emailAlerts: sellerUser.emailAlerts ?? true,
      smsAlerts: sellerUser.smsAlerts ?? false
    });
  }, [sellerUser?.id, navigate]);

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
      await axios.put(`${window.API_BASE_URL || "https://realestatelisting-u2kp.onrender.com"}/api/users/${sellerUser.id}`, { password: passwordData.newPassword, plainPassword: passwordData.newPassword });
      setPasswordData({ newPassword: '', confirmPassword: '' });
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
      const res = await axios.put(`${window.API_BASE_URL || "https://realestatelisting-u2kp.onrender.com"}/api/users/${sellerUser.id}`, updated);
      if (localStorage.getItem('user')) {
        localStorage.setItem('user', JSON.stringify(res.data));
      } else {
        localStorage.setItem('sellerUser', JSON.stringify(res.data));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('sellerToken');
    localStorage.removeItem('sellerUser');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    window.location.href = '/buyer/';
  };

  const handleFileUpload = async (e, field) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Clear any previous error for this field
    setErrors(prev => {
      const copy = { ...prev };
      delete copy[field];
      return copy;
    });

    // File Validation: size max 5MB, format PDF, JPG, PNG (or only JPG, PNG for photo and selfieUpload)
    let allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    let isImgOnly = (field === 'photo' || field === 'selfieUpload');
    if (isImgOnly) {
      allowedTypes = ['image/jpeg', 'image/png'];
    }

    if (!allowedTypes.includes(file.type)) {
      const errMsg = isImgOnly ? 'Upload only JPG or PNG files.' : 'Upload only JPG, PNG or PDF files.';
      setErrors(prev => ({ ...prev, [field]: errMsg }));
      await window.customAlert(errMsg);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      const errMsg = 'Maximum file size allowed is 5MB.';
      setErrors(prev => ({ ...prev, [field]: errMsg }));
      await window.customAlert(errMsg);
      return;
    }
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({
        ...prev,
        [field]: reader.result
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleSpecializationChange = (spec) => {
    const specs = [...formData.specialization];
    if (specs.includes(spec)) {
      const idx = specs.indexOf(spec);
      specs.splice(idx, 1);
    } else {
      specs.push(spec);
    }
    setFormData(prev => ({
      ...prev,
      specialization: specs
    }));
  };

  const handleAddLocation = (e) => {
    if (e.key === 'Enter' || e.type === 'click') {
      if (e) e.preventDefault();
      const parts = locInput.split(',').map(s => s.trim()).filter(Boolean);
      const newLocs = [...formData.preferredLocations];
      parts.forEach(part => {
        if (!newLocs.includes(part)) {
          newLocs.push(part);
        }
      });
      setFormData(prev => ({
        ...prev,
        preferredLocations: newLocs
      }));
      setLocInput('');
      setErrors(prev => {
        const copy = { ...prev };
        delete copy.preferredLocations;
        return copy;
      });
    }
  };

  const handleRemoveLocation = (loc) => {
    setFormData(prev => ({
      ...prev,
      preferredLocations: prev.preferredLocations.filter(l => l !== loc)
    }));
  };

  const validateBase64File = (base64Str, allowedMimeTypes, fieldLabel) => {
    if (!base64Str) return null;
    if (!base64Str.startsWith('data:')) return null; // Already uploaded URL/placeholder
    
    const parts = base64Str.split(';');
    if (parts.length < 2) return null;
    
    const mime = parts[0].split(':')[1];
    if (!allowedMimeTypes.includes(mime)) {
      if (allowedMimeTypes.includes('application/pdf')) {
        return 'Upload only JPG, PNG or PDF files.';
      } else {
        return 'Upload only JPG or PNG files.';
      }
    }
    
    const base64Data = parts[1].split(',')[1];
    const sizeInBytes = Math.round((base64Data.length * 3) / 4);
    if (sizeInBytes > 5 * 1024 * 1024) {
      return 'Maximum file size allowed is 5MB.';
    }
    
    return null;
  };

  const validateForm = () => {
    const errs = {};
    
    // Personal Information
    if (!formData.name) {
      errs.name = 'Full Name is required.';
    } else if (formData.name.trim().length < 3) {
      errs.name = 'Full Name must be at least 3 characters.';
    }
    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errs.email = 'Enter a valid email address.';
    }
    if (!formData.mobile || !/^\d{10}$/.test(formData.mobile)) {
      errs.mobile = 'Mobile number must contain 10 digits.';
    }
    if (!formData.dob) {
      errs.dob = 'Date of birth is required.';
    } else {
      const birthDate = new Date(formData.dob);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      if (age < 18) {
        errs.dob = 'Seller must be at least 18 years old.';
      }
    }
    if (!formData.gender) {
      errs.gender = 'Gender is required.';
    }
    
    // Profile Photo validation
    const photoErr = validateBase64File(formData.photo, ['image/jpeg', 'image/png'], 'Profile Photo');
    if (photoErr) errs.photo = photoErr;
    
    // Business Information
    if (!formData.companyName) {
      errs.companyName = 'Business Name is required.';
    }
    if (!formData.businessType) {
      errs.businessType = 'Business Type is required.';
    }
    if (formData.reraNumber && formData.reraNumber.trim() !== '') {
      const isDuplicate = allUsers.some(u => 
        String(u.id) !== String(sellerUser.id) && 
        u.role === 'seller' && 
        u.reraNumber && 
        String(u.reraNumber).trim().toLowerCase() === formData.reraNumber.trim().toLowerCase()
      );
      if (isDuplicate) {
        errs.reraNumber = 'RERA Number must be unique. This number is already registered.';
      }
    }
    if (formData.gstNumber && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(formData.gstNumber.toUpperCase())) {
      errs.gstNumber = 'GST Number is invalid.';
    }
    if (!formData.businessEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.businessEmail)) {
      errs.businessEmail = 'Enter a valid email address.';
    }
    if (!formData.businessPhone || !/^\d{10}$/.test(formData.businessPhone)) {
      errs.businessPhone = 'Mobile number must contain 10 digits.';
    }
    if (formData.websiteUrl && !/^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/.test(formData.websiteUrl)) {
      errs.websiteUrl = 'Enter a valid Website URL.';
    }
    if (formData.experience === undefined || formData.experience === '') {
      errs.experience = 'Years of Experience is required.';
    } else if (Number(formData.experience) < 0) {
      errs.experience = 'Years of Experience must be a positive number.';
    }
    
    // Address Information
    if (!formData.addressLine1) {
      errs.addressLine1 = 'Address Line 1 is required.';
    }
    if (!formData.city) {
      errs.city = 'City is required.';
    }
    if (!formData.state) {
      errs.state = 'State is required.';
    }
    if (!formData.pincode || !/^\d{6}$/.test(formData.pincode)) {
      errs.pincode = 'Pincode must contain 6 digits.';
    }
    if (!formData.country) {
      errs.country = 'Country is required.';
    }
    
    // Verification Information
    if (!formData.idNumber) {
      errs.idNumber = 'ID Number is required.';
    }
    
    const aadhaarErr = validateBase64File(formData.aadhaarUpload, ['image/jpeg', 'image/png', 'application/pdf'], 'Aadhaar Upload');
    if (aadhaarErr) errs.aadhaarUpload = aadhaarErr;
    
    const panErr = validateBase64File(formData.panUpload, ['image/jpeg', 'image/png', 'application/pdf'], 'PAN Upload');
    if (panErr) errs.panUpload = panErr;

    if (!formData.selfieUpload) {
      errs.selfieUpload = 'Selfie Verification is required.';
    } else {
      const selfieErr = validateBase64File(formData.selfieUpload, ['image/jpeg', 'image/png'], 'Selfie Verification');
      if (selfieErr) errs.selfieUpload = selfieErr;
    }

    if (!formData.addressProofUpload) {
      errs.addressProofUpload = 'Address Proof Upload is required.';
    } else {
      const proofErr = validateBase64File(formData.addressProofUpload, ['image/jpeg', 'image/png', 'application/pdf'], 'Address Proof Upload');
      if (proofErr) errs.addressProofUpload = proofErr;
    }

    if (!formData.termsAccepted) {
      errs.termsAccepted = 'Please accept Terms & Conditions.';
    }
    
    // Additional Real Estate Seller Fields
    if (!formData.preferredLocations || formData.preferredLocations.length === 0) {
      errs.preferredLocations = 'Preferred Selling Locations is required.';
    }
    if (!formData.bankHolderName) {
      errs.bankHolderName = 'Bank Account Holder Name is required.';
    }
    if (!formData.bankAccountNumber) {
      errs.bankAccountNumber = 'Bank Account Number is required.';
    } else if (!/^\d+$/.test(formData.bankAccountNumber)) {
      errs.bankAccountNumber = 'Bank Account Number must be a valid number.';
    }
    if (!formData.ifscCode) {
      errs.ifscCode = 'IFSC Code is required.';
    } else if (!/^[A-Z]{4}0[A-Z0-9]{6}$/i.test(formData.ifscCode)) {
      errs.ifscCode = 'IFSC Code is invalid. Format: SBIN0001234';
    }
    if (formData.upiId && !/^[a-zA-Z0-9\.\-_]{3,}@[a-zA-Z]{3,}$/.test(formData.upiId)) {
      errs.upiId = 'UPI ID is invalid. e.g. name@upi';
    }
    
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSaveProfile = async (e) => {
    if (e) e.preventDefault();
    if (!validateForm()) {
      setMessage('Error: Please fix all validation errors before saving.');
      window.scrollTo(0, 0);
      setTimeout(() => setMessage(''), 4000);
      return;
    }
    
    try {
      const res = await axios.put(`${window.API_BASE_URL || "https://realestatelisting-u2kp.onrender.com"}/api/users/${sellerUser.id}`, formData);
      if (localStorage.getItem('user')) {
        localStorage.setItem('user', JSON.stringify(res.data));
      }
      localStorage.setItem('sellerUser', JSON.stringify(res.data));
      
      const mapped = mapProfileToFormData(res.data);
      setFormData(mapped);
      setProfileData(mapped);
      
      setMessage('Profile updated successfully!');
      if (onProfileUpdate) {
        onProfileUpdate(res.data);
      }
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error(err);
      setMessage('Error: Failed to update profile details.');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  if (!sellerUser) return null;

  // Shared dynamic styles depending on dark / light portal background
  const inputStyle = isDashboardView ? {
    width: '100%',
    padding: '10px 14px',
    background: '#ffffff',
    border: '1.5px solid #cbd5e1',
    borderRadius: '8px',
    color: '#1e293b',
    outline: 'none',
    fontSize: '0.95rem',
    transition: 'all 0.2s ease',
    marginTop: '5px'
  } : {
    width: '100%',
    padding: '10px 14px',
    background: 'rgba(0,0,0,0.3)',
    border: '1px solid rgba(196,167,97,0.4)',
    borderRadius: '8px',
    color: '#fff',
    outline: 'none',
    fontSize: '0.95rem',
    transition: 'all 0.2s ease',
    marginTop: '5px'
  };

  const labelStyle = isDashboardView ? {
    color: 'var(--sd-text-muted)',
    fontSize: '0.85rem',
    display: 'block',
    fontWeight: 600
  } : {
    color: '#888',
    fontSize: '0.85rem',
    display: 'block'
  };

  const valueStyle = isDashboardView ? {
    color: 'var(--sd-text-main)',
    fontSize: '1.05rem',
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  } : {
    color: '#fff',
    fontSize: '1.05rem',
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  };

  const renderPersonalSection = () => {
    if (isEditing) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={labelStyle}>Full Name *</label>
            <input 
              type="text" 
              value={formData.name} 
              onChange={e => setFormData({...formData, name: e.target.value})} 
              style={inputStyle}
            />
            {errors.name && <div className="seller-profile-error" style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '4px' }}>{errors.name}</div>}
          </div>
          <div>
            <label style={labelStyle}>Email Address *</label>
            <input 
              type="email" 
              value={formData.email} 
              onChange={e => setFormData({...formData, email: e.target.value})} 
              style={inputStyle}
            />
            {errors.email && <div className="seller-profile-error" style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '4px' }}>{errors.email}</div>}
          </div>
          <div>
            <label style={labelStyle}>Mobile Number *</label>
            <input 
              type="text" 
              value={formData.mobile} 
              onChange={e => setFormData({...formData, mobile: e.target.value})} 
              style={inputStyle}
            />
            {errors.mobile && <div className="seller-profile-error" style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '4px' }}>{errors.mobile}</div>}
          </div>
          <div>
            <label style={labelStyle}>Date of Birth *</label>
            <input 
              type="date" 
              value={formData.dob} 
              onChange={e => setFormData({...formData, dob: e.target.value})} 
              style={inputStyle}
            />
            {errors.dob && <div className="seller-profile-error" style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '4px' }}>{errors.dob}</div>}
          </div>
          <div>
            <label style={labelStyle}>Gender *</label>
            <select 
              value={formData.gender} 
              onChange={e => setFormData({...formData, gender: e.target.value})} 
              style={inputStyle}
            >
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
            {errors.gender && <div className="seller-profile-error" style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '4px' }}>{errors.gender}</div>}
          </div>
          <div>
            <label style={labelStyle}>Profile Photo</label>
            <input 
              type="file" 
              accept="image/*" 
              onChange={e => handleFileUpload(e, 'photo')} 
              style={inputStyle}
            />
            {formData.photo && (
              <img src={formData.photo} alt="Preview" style={{ width: '60px', height: '60px', borderRadius: '50%', marginTop: '10px', objectFit: 'cover' }} />
            )}
            {errors.photo && <div className="seller-profile-error" style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '4px' }}>{errors.photo}</div>}
          </div>
        </div>
      );
    }

    const defaultAvatarUrl = '/images/default/default-avatar.jpg';
    const profileImgUrl = formData.photo ? formData.photo : defaultAvatarUrl;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <img 
          src={profileImgUrl} 
          alt="Profile" 
          style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', margin: '0 auto 10px auto', border: '2px solid rgba(196,167,97,0.4)' }} 
          onError={(e) => { e.target.onerror = null; e.target.src = defaultAvatarUrl; }}
        />
        <div className="seller-profile-field">
          <label style={labelStyle}>Full Name</label>
          <div style={valueStyle}>{formData.name || 'Not Provided'}</div>
        </div>
        <div className="seller-profile-field">
          <label style={labelStyle}>Email Address</label>
          <div style={valueStyle}><Mail size={14} color="var(--sd-text-muted)"/> {formData.email || 'Not Provided'}</div>
        </div>
        <div className="seller-profile-field">
          <label style={labelStyle}>Mobile Number</label>
          <div style={valueStyle}><Phone size={14} color="var(--sd-text-muted)"/> {formData.mobile || 'Not Provided'}</div>
        </div>
        <div className="seller-profile-field">
          <label style={labelStyle}>Date of Birth</label>
          <div style={valueStyle}>{formData.dob || 'Not Provided'}</div>
        </div>
        <div className="seller-profile-field">
          <label style={labelStyle}>Gender</label>
          <div style={valueStyle}>{formData.gender || 'Not Provided'}</div>
        </div>
      </div>
    );
  };

  const renderBusinessSection = () => {
    if (isEditing) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={labelStyle}>Business Name *</label>
            <input 
              type="text" 
              value={formData.companyName} 
              onChange={e => setFormData({...formData, companyName: e.target.value})} 
              style={inputStyle}
            />
            {errors.companyName && <div className="seller-profile-error" style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '4px' }}>{errors.companyName}</div>}
          </div>
          <div>
            <label style={labelStyle}>Business Type *</label>
            <select 
              value={formData.businessType} 
              onChange={e => setFormData({...formData, businessType: e.target.value})} 
              style={inputStyle}
            >
              <option value="Individual Agent">Individual Agent</option>
              <option value="Agency">Agency</option>
              <option value="Builder">Builder</option>
            </select>
            {errors.businessType && <div className="seller-profile-error" style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '4px' }}>{errors.businessType}</div>}
          </div>
          <div>
            <label style={labelStyle}>RERA Number (Optional)</label>
            <input 
              type="text" 
              value={formData.reraNumber} 
              onChange={e => setFormData({...formData, reraNumber: e.target.value})} 
              style={inputStyle}
            />
            {errors.reraNumber && <div className="seller-profile-error" style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '4px' }}>{errors.reraNumber}</div>}
          </div>
          <div>
            <label style={labelStyle}>GST Number (Optional)</label>
            <input 
              type="text" 
              value={formData.gstNumber} 
              onChange={e => setFormData({...formData, gstNumber: e.target.value})} 
              style={inputStyle}
              placeholder="Format: 22AAAAA1111A1Z1"
            />
            {errors.gstNumber && <div className="seller-profile-error" style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '4px' }}>{errors.gstNumber}</div>}
          </div>
          <div>
            <label style={labelStyle}>Business Email *</label>
            <input 
              type="email" 
              value={formData.businessEmail} 
              onChange={e => setFormData({...formData, businessEmail: e.target.value})} 
              style={inputStyle}
            />
            {errors.businessEmail && <div className="seller-profile-error" style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '4px' }}>{errors.businessEmail}</div>}
          </div>
          <div>
            <label style={labelStyle}>Business Phone *</label>
            <input 
              type="text" 
              value={formData.businessPhone} 
              onChange={e => setFormData({...formData, businessPhone: e.target.value})} 
              style={inputStyle}
            />
            {errors.businessPhone && <div className="seller-profile-error" style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '4px' }}>{errors.businessPhone}</div>}
          </div>
          <div>
            <label style={labelStyle}>Website URL (Optional)</label>
            <input 
              type="text" 
              value={formData.websiteUrl} 
              onChange={e => setFormData({...formData, websiteUrl: e.target.value})} 
              style={inputStyle}
              placeholder="e.g. https://myagency.com"
            />
            {errors.websiteUrl && <div className="seller-profile-error" style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '4px' }}>{errors.websiteUrl}</div>}
          </div>
          <div>
            <label style={labelStyle}>Years of Experience *</label>
            <input 
              type="number" 
              value={formData.experience} 
              onChange={e => setFormData({...formData, experience: e.target.value})} 
              style={inputStyle}
            />
            {errors.experience && <div className="seller-profile-error" style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '4px' }}>{errors.experience}</div>}
          </div>
        </div>
      );
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div className="seller-profile-field">
          <label style={labelStyle}>Business Name</label>
          <div style={valueStyle}><Building size={14} color="var(--sd-text-muted)"/> {formData.companyName || 'Not Provided'}</div>
        </div>
        <div className="seller-profile-field">
          <label style={labelStyle}>Business Type</label>
          <div style={valueStyle}>{formData.businessType || 'Not Provided'}</div>
        </div>
        <div className="seller-profile-field">
          <label style={labelStyle}>RERA Number</label>
          <div style={valueStyle}>{formData.reraNumber || 'Not Provided'}</div>
        </div>
        <div className="seller-profile-field">
          <label style={labelStyle}>GST Number</label>
          <div style={valueStyle}>{formData.gstNumber || 'Not Provided'}</div>
        </div>
        <div className="seller-profile-field">
          <label style={labelStyle}>Business Email</label>
          <div style={valueStyle}>{formData.businessEmail || 'Not Provided'}</div>
        </div>
        <div className="seller-profile-field">
          <label style={labelStyle}>Business Phone</label>
          <div style={valueStyle}>{formData.businessPhone || 'Not Provided'}</div>
        </div>
        <div className="seller-profile-field">
          <label style={labelStyle}>Website URL</label>
          <div style={valueStyle}>{formData.websiteUrl || 'Not Provided'}</div>
        </div>
        <div className="seller-profile-field">
          <label style={labelStyle}>Years of Experience</label>
          <div style={valueStyle}>{formData.experience !== '' ? `${formData.experience} Years` : 'Not Provided'}</div>
        </div>
      </div>
    );
  };

  const renderAddressSection = () => {
    const states = ['Tamil Nadu', 'Karnataka', 'Maharashtra', 'Delhi', 'Kerala', 'Andhra Pradesh', 'Telangana'];
    if (isEditing) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={labelStyle}>Address Line 1 *</label>
            <input 
              type="text" 
              value={formData.addressLine1} 
              onChange={e => setFormData({...formData, addressLine1: e.target.value})} 
              style={inputStyle}
            />
            {errors.addressLine1 && <div className="seller-profile-error" style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '4px' }}>{errors.addressLine1}</div>}
          </div>
          <div>
            <label style={labelStyle}>Address Line 2 (Optional)</label>
            <input 
              type="text" 
              value={formData.addressLine2} 
              onChange={e => setFormData({...formData, addressLine2: e.target.value})} 
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>City *</label>
            <input 
              type="text" 
              value={formData.city} 
              onChange={e => setFormData({...formData, city: e.target.value})} 
              style={inputStyle}
            />
            {errors.city && <div className="seller-profile-error" style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '4px' }}>{errors.city}</div>}
          </div>
          <div>
            <label style={labelStyle}>State *</label>
            <select 
              value={formData.state} 
              onChange={e => setFormData({...formData, state: e.target.value})} 
              style={inputStyle}
            >
              <option value="">Select State</option>
              {states.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            {errors.state && <div className="seller-profile-error" style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '4px' }}>{errors.state}</div>}
          </div>
          <div>
            <label style={labelStyle}>Pincode *</label>
            <input 
              type="text" 
              value={formData.pincode} 
              onChange={e => setFormData({...formData, pincode: e.target.value})} 
              style={inputStyle}
            />
            {errors.pincode && <div className="seller-profile-error" style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '4px' }}>{errors.pincode}</div>}
          </div>
          <div>
            <label style={labelStyle}>Country *</label>
            <select 
              value={formData.country} 
              onChange={e => setFormData({...formData, country: e.target.value})} 
              style={inputStyle}
            >
              <option value="India">India</option>
              <option value="USA">USA</option>
              <option value="UK">UK</option>
            </select>
            {errors.country && <div className="seller-profile-error" style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '4px' }}>{errors.country}</div>}
          </div>
        </div>
      );
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div className="seller-profile-field">
          <label style={labelStyle}>Address Line 1</label>
          <div style={valueStyle}>{formData.addressLine1 || 'Not Provided'}</div>
        </div>
        <div className="seller-profile-field">
          <label style={labelStyle}>Address Line 2</label>
          <div style={valueStyle}>{formData.addressLine2 || 'Not Provided'}</div>
        </div>
        <div className="seller-profile-field">
          <label style={labelStyle}>City</label>
          <div style={valueStyle}>{formData.city || 'Not Provided'}</div>
        </div>
        <div className="seller-profile-field">
          <label style={labelStyle}>State</label>
          <div style={valueStyle}>{formData.state || 'Not Provided'}</div>
        </div>
        <div className="seller-profile-field">
          <label style={labelStyle}>Pincode</label>
          <div style={valueStyle}>{formData.pincode || 'Not Provided'}</div>
        </div>
        <div className="seller-profile-field">
          <label style={labelStyle}>Country</label>
          <div style={valueStyle}>{formData.country || 'Not Provided'}</div>
        </div>
      </div>
    );
  };

  const renderVerificationSection = () => {
    if (isEditing) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={labelStyle}>ID Type *</label>
            <select 
              value={formData.idType} 
              onChange={e => setFormData({...formData, idType: e.target.value})} 
              style={inputStyle}
            >
              <option value="Aadhaar">Aadhaar</option>
              <option value="PAN">PAN</option>
              <option value="Passport">Passport</option>
              <option value="Driving License">Driving License</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>ID Number *</label>
            <input 
              type="text" 
              value={formData.idNumber} 
              onChange={e => setFormData({...formData, idNumber: e.target.value})} 
              style={inputStyle}
            />
            {errors.idNumber && <div className="seller-profile-error" style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '4px' }}>{errors.idNumber}</div>}
          </div>
          <div>
            <label style={labelStyle}>Aadhaar Upload</label>
            <input 
              type="file" 
              onChange={e => handleFileUpload(e, 'aadhaarUpload')} 
              style={inputStyle}
            />
            {formData.aadhaarUpload && <div style={{ fontSize: '0.8rem', color: '#10b981', marginTop: '4px' }}>✓ Aadhaar File Loaded</div>}
            {errors.aadhaarUpload && <div className="seller-profile-error" style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '4px' }}>{errors.aadhaarUpload}</div>}
          </div>
          <div>
            <label style={labelStyle}>PAN Upload</label>
            <input 
              type="file" 
              onChange={e => handleFileUpload(e, 'panUpload')} 
              style={inputStyle}
            />
            {formData.panUpload && <div style={{ fontSize: '0.8rem', color: '#10b981', marginTop: '4px' }}>✓ PAN File Loaded</div>}
            {errors.panUpload && <div className="seller-profile-error" style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '4px' }}>{errors.panUpload}</div>}
          </div>
          <div>
            <label style={labelStyle}>Selfie Verification *</label>
            <input 
              type="file" 
              accept="image/*" 
              onChange={e => handleFileUpload(e, 'selfieUpload')} 
              style={inputStyle}
            />
            {formData.selfieUpload && <img src={formData.selfieUpload} alt="Selfie Preview" style={{ width: '60px', height: '60px', marginTop: '10px', objectFit: 'cover', borderRadius: '8px' }} />}
            {errors.selfieUpload && <div className="seller-profile-error" style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '4px' }}>{errors.selfieUpload}</div>}
          </div>
          <div>
            <label style={labelStyle}>Address Proof Upload *</label>
            <input 
              type="file" 
              onChange={e => handleFileUpload(e, 'addressProofUpload')} 
              style={inputStyle}
            />
            {formData.addressProofUpload && <div style={{ fontSize: '0.8rem', color: '#10b981', marginTop: '4px' }}>✓ Address Proof Loaded</div>}
            {errors.addressProofUpload && <div className="seller-profile-error" style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '4px' }}>{errors.addressProofUpload}</div>}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '10px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: isDashboardView ? '#1e293b' : '#ccc', fontSize: '0.9rem' }}>
              <input 
                type="checkbox" 
                checked={formData.termsAccepted} 
                onChange={e => setFormData({...formData, termsAccepted: e.target.checked})} 
                style={{ width: '16px', height: '16px' }}
              />
              I accept the Terms & Conditions *
            </label>
            {errors.termsAccepted && <div className="seller-profile-error" style={{ color: '#ef4444', fontSize: '0.8rem' }}>{errors.termsAccepted}</div>}
          </div>
        </div>
      );
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div className="seller-profile-field">
          <label style={labelStyle}>ID Type</label>
          <div style={valueStyle}>{formData.idType || 'Not Provided'}</div>
        </div>
        <div className="seller-profile-field">
          <label style={labelStyle}>ID Number</label>
          <div style={valueStyle}>{formData.idNumber || 'Not Provided'}</div>
        </div>
        <div className="seller-profile-field">
          <label style={labelStyle}>Aadhaar Status</label>
          <div style={valueStyle}>{formData.aadhaarUpload ? 'Uploaded' : 'Not Provided'}</div>
        </div>
        <div className="seller-profile-field">
          <label style={labelStyle}>PAN Status</label>
          <div style={valueStyle}>{formData.panUpload ? 'Uploaded' : 'Not Provided'}</div>
        </div>
        <div className="seller-profile-field">
          <label style={labelStyle}>Selfie Verification</label>
          <div style={valueStyle}>
            {formData.selfieUpload ? (
              <img src={formData.selfieUpload} alt="Selfie" style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px', marginTop: '5px' }} />
            ) : 'Not Provided'}
          </div>
        </div>
        <div className="seller-profile-field">
          <label style={labelStyle}>Address Proof Status</label>
          <div style={valueStyle}>{formData.addressProofUpload ? 'Uploaded' : 'Not Provided'}</div>
        </div>
        <div className="seller-profile-field">
          <label style={labelStyle}>Terms Accepted</label>
          <div style={valueStyle}>{formData.termsAccepted ? 'Yes' : 'No'}</div>
        </div>
      </div>
    );
  };

  const renderAdditionalSection = () => {
    const specs = ['Apartment', 'Villa', 'Plot', 'Commercial'];
    if (isEditing) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={labelStyle}>Property Specialization</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '5px' }}>
              {specs.map(spec => (
                <label key={spec} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: isDashboardView ? '#1e293b' : '#ccc', fontSize: '0.85rem', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={formData.specialization.includes(spec)} 
                    onChange={() => handleSpecializationChange(spec)} 
                  />
                  {spec}
                </label>
              ))}
            </div>
          </div>
          <div>
            <label style={labelStyle}>Preferred Selling Locations * (Type and press Enter or add comma-separated)</label>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '6px',
              padding: '6px 10px',
              background: isDashboardView ? '#ffffff' : 'rgba(0,0,0,0.3)',
              border: isDashboardView ? '1.5px solid #cbd5e1' : '1px solid rgba(196,167,97,0.4)',
              borderRadius: '8px',
              minHeight: '42px',
              alignItems: 'center',
              marginTop: '5px'
            }}>
              {Array.isArray(formData.preferredLocations) && formData.preferredLocations.map(loc => (
                <span key={loc} style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: isDashboardView ? '#f1f5f9' : 'rgba(196,167,97,0.2)',
                  color: isDashboardView ? '#1e293b' : '#fff',
                  border: isDashboardView ? '1px solid #cbd5e1' : '1px solid rgba(196,167,97,0.4)',
                  padding: '3px 8px',
                  borderRadius: '16px',
                  fontSize: '0.85rem'
                }}>
                  {loc}
                  <button 
                    type="button" 
                    onClick={() => handleRemoveLocation(loc)} 
                    style={{
                      background: 'none',
                      border: 'none',
                      color: isDashboardView ? '#64748b' : '#ffdf80',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    ×
                  </button>
                </span>
              ))}
              <input 
                type="text" 
                value={locInput}
                onChange={e => setLocInput(e.target.value)}
                onKeyDown={handleAddLocation}
                placeholder={(!formData.preferredLocations || formData.preferredLocations.length === 0) ? "e.g. Tambaram, Guindy" : "Add more..."}
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: isDashboardView ? '#1e293b' : '#fff',
                  fontSize: '0.9rem',
                  minWidth: '120px',
                  padding: '4px 0'
                }}
              />
            </div>
            {errors.preferredLocations && <div className="seller-profile-error" style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '4px' }}>{errors.preferredLocations}</div>}
          </div>
          <div>
            <label style={labelStyle}>Total Properties Listed (Read Only)</label>
            <input 
              type="text" 
              value={properties.length} 
              style={inputStyle}
              disabled
            />
          </div>
          <div>
            <label style={labelStyle}>Account Status (Read Only)</label>
            <input 
              type="text" 
              value={sellerUser.status ? sellerUser.status.toUpperCase() : 'PENDING'} 
              style={inputStyle}
              disabled
            />
          </div>
          <div>
            <label style={labelStyle}>Bank Account Holder Name *</label>
            <input 
              type="text" 
              value={formData.bankHolderName} 
              onChange={e => setFormData({...formData, bankHolderName: e.target.value})} 
              style={inputStyle}
            />
            {errors.bankHolderName && <div className="seller-profile-error" style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '4px' }}>{errors.bankHolderName}</div>}
          </div>
          <div>
            <label style={labelStyle}>Bank Account Number *</label>
            <input 
              type="text" 
              value={formData.bankAccountNumber} 
              onChange={e => setFormData({...formData, bankAccountNumber: e.target.value})} 
              style={inputStyle}
            />
            {errors.bankAccountNumber && <div className="seller-profile-error" style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '4px' }}>{errors.bankAccountNumber}</div>}
          </div>
          <div>
            <label style={labelStyle}>IFSC Code *</label>
            <input 
              type="text" 
              value={formData.ifscCode} 
              onChange={e => setFormData({...formData, ifscCode: e.target.value})} 
              style={inputStyle}
            />
            {errors.ifscCode && <div className="seller-profile-error" style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '4px' }}>{errors.ifscCode}</div>}
          </div>
          <div>
            <label style={labelStyle}>UPI ID (Optional)</label>
            <input 
              type="text" 
              value={formData.upiId} 
              onChange={e => setFormData({...formData, upiId: e.target.value})} 
              style={inputStyle}
            />
          </div>
        </div>
      );
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div className="seller-profile-field">
          <label style={labelStyle}>Property Specialization</label>
          <div style={valueStyle}>{formData.specialization.length > 0 ? formData.specialization.join(', ') : 'Not Provided'}</div>
        </div>
        <div className="seller-profile-field">
          <label style={labelStyle}>Preferred Locations</label>
          <div style={valueStyle}>
            {Array.isArray(formData.preferredLocations) && formData.preferredLocations.length > 0 
              ? formData.preferredLocations.join(', ') 
              : 'Not Provided'}
          </div>
        </div>
        <div className="seller-profile-field">
          <label style={labelStyle}>Total Properties Listed</label>
          <div style={valueStyle}>{properties.length}</div>
        </div>
        <div className="seller-profile-field">
          <label style={labelStyle}>Account Status</label>
          <div style={valueStyle}><span style={{ textTransform: 'uppercase', color: sellerUser.status === 'deactivated' ? '#ef4444' : '#10b981', fontWeight: 'bold' }}>{sellerUser.status || 'ACTIVE'}</span></div>
        </div>
        <div className="seller-profile-field">
          <label style={labelStyle}>Bank Account Holder Name</label>
          <div style={valueStyle}>{formData.bankHolderName || 'Not Provided'}</div>
        </div>
        <div className="seller-profile-field">
          <label style={labelStyle}>Bank Account Number</label>
          <div style={valueStyle}>{formData.bankAccountNumber || 'Not Provided'}</div>
        </div>
        <div className="seller-profile-field">
          <label style={labelStyle}>IFSC Code</label>
          <div style={valueStyle}>{formData.ifscCode || 'Not Provided'}</div>
        </div>
        <div className="seller-profile-field">
          <label style={labelStyle}>UPI ID</label>
          <div style={valueStyle}>{formData.upiId || 'Not Provided'}</div>
        </div>
      </div>
    );
  };

  const renderHeaderActions = () => {
    return (
      <div style={{ display: 'flex', gap: '10px' }}>
        <button onClick={handleSaveProfile} className="sd-btn-primary" style={{ padding: '8px 15px', fontWeight: 'bold', width: 'auto', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', outline: 'none', border: 'none', borderRadius: '8px' }}>
          <CheckCircle size={16} /> Save Changes
        </button>
        <button 
          type="button" 
          onClick={() => { 
            setErrors({}); 
            if (profileData) setFormData({ ...profileData }); 
          }} 
          className="sd-btn-reply" 
          style={{ padding: '8px 15px', background: '#e2e8f0', color: '#475569', fontWeight: 'bold', width: 'auto', cursor: 'pointer', outline: 'none', border: 'none', borderRadius: '8px' }}
        >
          Cancel
        </button>
      </div>
    );
  };

  if (isDashboardView) {
    return (
      <div style={{ width: '100%', fontFamily: "'Inter', sans-serif" }}>
        {/* Header Section */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--sd-border)', paddingBottom: '20px', marginBottom: '30px' }}>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <div style={{ width: '70px', height: '70px', borderRadius: '50%', overflow: 'hidden', border: '2px solid var(--sd-primary)' }}>
               <img src={getAssetUrl(formData.photo) || '/images/default/default-avatar.jpg'} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div>
              <h1 style={{ color: 'var(--sd-text-main)', margin: '0 0 5px 0', fontSize: '1.8rem', fontWeight: 700 }}>{formData.name}</h1>
              <p style={{ color: 'var(--sd-text-muted)', margin: 0, fontSize: '0.95rem' }}>Role: Seller | ID: {sellerUser.id} | Since: {sellerUser.memberSince || 'Not Provided'}</p>
            </div>
          </div>
          {renderHeaderActions()}
        </div>

        {message && (
          <div style={{ 
            padding: '12px', 
            borderRadius: '8px', 
            marginBottom: '20px', 
            textAlign: 'center', 
            fontWeight: 'bold',
            background: message.includes('Error') ? 'var(--sd-danger-light)' : 'var(--sd-success-light)',
            color: message.includes('Error') ? 'var(--sd-danger)' : 'var(--sd-success)',
            border: message.includes('Error') ? '1px solid var(--sd-danger)' : '1px solid var(--sd-success)'
          }}>
            {message}
          </div>
        )}

        <div className="seller-profile-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '25px', textShadow: 'none' }}>
          
          {/* Card 1: PERSONAL INFORMATION */}
          <div className="sd-panel" style={{ padding: '25px' }}>
            <h3 style={{ color: 'var(--sd-text-main)', margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.2rem', fontWeight: 600 }}>
              <User size={20} color="var(--sd-primary)"/> Personal Information
            </h3>
            {renderPersonalSection()}
          </div>

          {/* Card 2: BUSINESS INFORMATION */}
          <div className="sd-panel" style={{ padding: '25px' }}>
            <h3 style={{ color: 'var(--sd-text-main)', margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.2rem', fontWeight: 600 }}>
              <Briefcase size={20} color="var(--sd-primary)"/> Business Information
            </h3>
            {renderBusinessSection()}
          </div>

          {/* Card 3: ADDRESS INFORMATION */}
          <div className="sd-panel" style={{ padding: '25px' }}>
            <h3 style={{ color: 'var(--sd-text-main)', margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.2rem', fontWeight: 600 }}>
              <MapPin size={20} color="var(--sd-primary)"/> Address Information
            </h3>
            {renderAddressSection()}
          </div>

          {/* Card 4: VERIFICATION INFORMATION */}
          <div className="sd-panel" style={{ padding: '25px' }}>
            <h3 style={{ color: 'var(--sd-text-main)', margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.2rem', fontWeight: 600 }}>
              <Shield size={20} color="var(--sd-primary)"/> Verification Information
            </h3>
            {renderVerificationSection()}
          </div>

          {/* Card 5: BANK & SPECIALIZATION DETAILS */}
          <div className="sd-panel" style={{ padding: '25px', gridColumn: 'span 2' }}>
            <h3 style={{ color: 'var(--sd-text-main)', margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.2rem', fontWeight: 600 }}>
              <CreditCard size={20} color="var(--sd-primary)"/> Additional Seller & Bank Details
            </h3>
            {renderAdditionalSection()}
          </div>

          {/* PROPERTY SUMMARY */}
          <div className="sd-panel" style={{ padding: '25px', gridColumn: 'span 2' }}>
            <h3 style={{ color: 'var(--sd-text-main)', margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.2rem', fontWeight: 600 }}>
              <BarChart2 size={20} color="var(--sd-primary)"/> Property Performance Summary
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', textAlign: 'center' }}>
              <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '10px', border: '1px solid var(--sd-border)' }}>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--sd-primary)' }}>{sellerStats.total}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--sd-text-muted)', marginTop: '5px', fontWeight: 600 }}>TOTAL LISTINGS</div>
              </div>
              <div style={{ background: '#f0fdf4', padding: '15px', borderRadius: '10px', border: '1px solid #bbf7d0' }}>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--sd-success)' }}>{sellerStats.approved}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--sd-text-muted)', marginTop: '5px', fontWeight: 600 }}>ACTIVE PROPERTIES</div>
              </div>
              <div style={{ background: '#fffbeb', padding: '15px', borderRadius: '10px', border: '1px solid #fef3c7' }}>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--sd-warning)' }}>{sellerStats.waiting}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--sd-text-muted)', marginTop: '5px', fontWeight: 600 }}>PENDING APPROVAL</div>
              </div>
              <div style={{ background: '#fef2f2', padding: '15px', borderRadius: '10px', border: '1px solid #fee2e2' }}>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--sd-danger)' }}>{sellerStats.rejected}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--sd-text-muted)', marginTop: '5px', fontWeight: 600 }}>REJECTED</div>
              </div>
            </div>
          </div>

          {/* SETTINGS */}
          <div className="sd-panel" style={{ padding: '25px', gridColumn: 'span 2' }}>
            <h3 style={{ color: 'var(--sd-text-main)', margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.2rem', fontWeight: 600 }}>
              <Settings size={20} color="var(--sd-primary)"/> Settings
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>
              
              {/* Change Password */}
              <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <label style={{ color: 'var(--sd-text-main)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}><Key size={14}/> Change Password</label>
                <input 
                  type="password" 
                  placeholder="New Password" 
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  style={{ background: '#fff', border: '1.5px solid #cbd5e1', padding: '10px', borderRadius: '8px', color: 'var(--sd-text-main)', outline: 'none' }}
                  required 
                />
                <input 
                  type="password" 
                  placeholder="Confirm New Password" 
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  style={{ background: '#fff', border: '1.5px solid #cbd5e1', padding: '10px', borderRadius: '8px', color: 'var(--sd-text-main)', outline: 'none' }}
                  required 
                />
                <button type="submit" className="sd-btn-primary" style={{ cursor: 'pointer', padding: '10px 15px', fontWeight: 'bold', width: 'fit-content', border: 'none', borderRadius: '8px' }}>
                  Update Password
                </button>
              </form>

              {/* Alerts Preferences */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <label style={{ color: 'var(--sd-text-main)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}><Bell size={14}/> Notification Preferences</label>
                <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '10px', border: '1px solid var(--sd-border)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--sd-text-main)', cursor: 'pointer', fontSize: '0.9rem' }}>
                    <input 
                      type="checkbox" 
                      checked={notifications.emailAlerts}
                      onChange={(e) => handleNotificationChange('emailAlerts', e.target.checked)}
                      style={{ accentColor: 'var(--sd-primary)' }}
                    />
                    Email alerts on new inquiries
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--sd-text-main)', cursor: 'pointer', fontSize: '0.9rem' }}>
                    <input 
                      type="checkbox" 
                      checked={notifications.smsAlerts}
                      onChange={(e) => handleNotificationChange('smsAlerts', e.target.checked)}
                      style={{ accentColor: 'var(--sd-primary)' }}
                    />
                    SMS notification on property approval status change
                  </label>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="seller-register-container" style={{ padding: '50px 20px', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div className="seller-pan-bg"></div>
      <div className="seller-overlay"></div>
      
      <div className="seller-glass-card" style={{ maxWidth: '900px', width: '100%', position: 'relative', zIndex: 3, padding: '40px', background: 'rgba(10, 15, 30, 0.9)', borderRadius: '30px', border: '1px solid rgba(196, 167, 97, 0.5)', backdropFilter: 'blur(20px)' }}>
        
        {/* Header Section */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(196,167,97,0.3)', paddingBottom: '20px', marginBottom: '30px' }}>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <div style={{ width: '70px', height: '70px', borderRadius: '50%', overflow: 'hidden', border: '2px solid #ffdf80' }}>
               <img src={getAssetUrl(formData.photo) || '/images/default/default-avatar.jpg'} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div>
              <h1 style={{ color: '#ffdf80', margin: '0 0 5px 0', fontSize: '1.8rem' }}>{formData.name}</h1>
              <p style={{ color: '#aaa', margin: 0, fontSize: '0.95rem' }}>Role: Seller | ID: {sellerUser.id} | Since: {sellerUser.memberSince || 'Not Provided'}</p>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {renderHeaderActions()}
            <button onClick={handleLogout} className="btn-grand-gold" style={{ background: 'transparent', border: '2px solid rgba(255, 51, 102, 0.6)', color: '#ff3366', padding: '8px 20px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', borderRadius: '8px' }}>
              <LogOut size={16} /> Logout
            </button>
          </div>
        </div>

        {message && (
          <div style={{ 
            padding: '12px', 
            borderRadius: '8px', 
            marginBottom: '20px', 
            textAlign: 'center', 
            fontWeight: 'bold',
            background: message.includes('Error') ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
            color: message.includes('Error') ? '#f87171' : '#34d399',
            border: message.includes('Error') ? '1px solid #ef4444' : '1px solid #10b981'
          }}>
            {message}
          </div>
        )}

        <div className="seller-profile-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '25px', textShadow: 'none' }}>
          
          {/* Card 1: PERSONAL INFORMATION */}
          <div className="seller-profile-section info-personal" style={{ background: 'rgba(255,255,255,0.02)', padding: '25px', borderRadius: '15px', border: '1px solid rgba(196,167,97,0.2)' }}>
            <h3 style={{ color: '#ffdf80', margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.2rem' }}>
              <User size={20} color="#c4a761"/> Personal Information
            </h3>
            {renderPersonalSection()}
          </div>

          {/* Card 2: BUSINESS INFORMATION */}
          <div className="seller-profile-section info-business" style={{ background: 'rgba(255,255,255,0.02)', padding: '25px', borderRadius: '15px', border: '1px solid rgba(196,167,97,0.2)' }}>
            <h3 style={{ color: '#ffdf80', margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.2rem' }}>
              <Briefcase size={20} color="#c4a761"/> Business Information
            </h3>
            {renderBusinessSection()}
          </div>

          {/* Card 3: ADDRESS INFORMATION */}
          <div className="seller-profile-section info-address" style={{ background: 'rgba(255,255,255,0.02)', padding: '25px', borderRadius: '15px', border: '1px solid rgba(196,167,97,0.2)' }}>
            <h3 style={{ color: '#ffdf80', margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.2rem' }}>
              <MapPin size={20} color="#c4a761"/> Address Information
            </h3>
            {renderAddressSection()}
          </div>

          {/* Card 4: VERIFICATION INFORMATION */}
          <div className="seller-profile-section info-verification" style={{ background: 'rgba(255,255,255,0.02)', padding: '25px', borderRadius: '15px', border: '1px solid rgba(196,167,97,0.2)' }}>
            <h3 style={{ color: '#ffdf80', margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.2rem' }}>
              <Shield size={20} color="#c4a761"/> Verification Information
            </h3>
            {renderVerificationSection()}
          </div>

          {/* Card 5: BANK & SPECIALIZATION DETAILS */}
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '25px', borderRadius: '15px', border: '1px solid rgba(196,167,97,0.2)', gridColumn: 'span 2' }}>
            <h3 style={{ color: '#ffdf80', margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.2rem' }}>
              <CreditCard size={20} color="#c4a761"/> Additional Seller & Bank Details
            </h3>
            {renderAdditionalSection()}
          </div>

          {/* PROPERTY SUMMARY */}
          <div className="seller-profile-section info-stats" style={{ background: 'rgba(255,255,255,0.02)', padding: '25px', borderRadius: '15px', border: '1px solid rgba(196,167,97,0.2)', gridColumn: 'span 2' }}>
            <h3 style={{ color: '#ffdf80', margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.2rem' }}>
              <BarChart2 size={20} color="#c4a761"/> Property Performance Summary
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', textAlign: 'center' }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '15px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ffdf80' }}>{sellerStats.total}</div>
                <div style={{ fontSize: '0.75rem', color: '#aaa', marginTop: '5px' }}>TOTAL LISTINGS</div>
              </div>
              <div style={{ background: 'rgba(16, 185, 129, 0.05)', padding: '15px', borderRadius: '10px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#34d399' }}>{sellerStats.approved}</div>
                <div style={{ fontSize: '0.75rem', color: '#aaa', marginTop: '5px' }}>ACTIVE PROPERTIES</div>
              </div>
              <div style={{ background: 'rgba(245, 158, 11, 0.05)', padding: '15px', borderRadius: '10px', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#fbbf24' }}>{sellerStats.waiting}</div>
                <div style={{ fontSize: '0.75rem', color: '#aaa', marginTop: '5px' }}>PENDING APPROVAL</div>
              </div>
              <div style={{ background: 'rgba(239, 68, 68, 0.05)', padding: '15px', borderRadius: '10px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f87171' }}>{sellerStats.rejected}</div>
                <div style={{ fontSize: '0.75rem', color: '#aaa', marginTop: '5px' }}>REJECTED</div>
              </div>
            </div>
          </div>

          {/* SETTINGS */}
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '25px', borderRadius: '15px', border: '1px solid rgba(196,167,97,0.2)', gridColumn: 'span 2' }}>
            <h3 style={{ color: '#ffdf80', margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.2rem' }}>
              <Settings size={20} color="#c4a761"/> Settings
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>
              
              {/* Change Password */}
              <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <label style={{ color: '#ffdf80', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}><Key size={14}/> Change Password</label>
                <input 
                  type="password" 
                  placeholder="New Password" 
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(196,167,97,0.4)', padding: '10px', borderRadius: '8px', color: '#fff', outline: 'none' }}
                  required 
                />
                <input 
                  type="password" 
                  placeholder="Confirm New Password" 
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(196,167,97,0.4)', padding: '10px', borderRadius: '8px', color: '#fff', outline: 'none' }}
                  required 
                />
                <button type="submit" className="btn-grand-gold" style={{ cursor: 'pointer', padding: '10px 15px', background: '#c4a761', border: 'none', color: '#000', fontWeight: 'bold', borderRadius: '8px', width: 'fit-content' }}>
                  Update Password
                </button>
              </form>

              {/* Alerts Preferences */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <label style={{ color: '#ffdf80', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}><Bell size={14}/> Notification Preferences</label>
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '15px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#ccc', cursor: 'pointer', fontSize: '0.9rem' }}>
                    <input 
                      type="checkbox" 
                      checked={notifications.emailAlerts}
                      onChange={(e) => handleNotificationChange('emailAlerts', e.target.checked)}
                      style={{ accentColor: '#c4a761' }}
                    />
                    Email alerts on new inquiries
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#ccc', cursor: 'pointer', fontSize: '0.9rem' }}>
                    <input 
                      type="checkbox" 
                      checked={notifications.smsAlerts}
                      onChange={(e) => handleNotificationChange('smsAlerts', e.target.checked)}
                      style={{ accentColor: '#c4a761' }}
                    />
                    SMS notification on property approval status change
                  </label>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default SellerProfile;

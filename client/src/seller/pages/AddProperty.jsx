import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Upload, ChevronLeft, Home, Building, MapPin, Users, Map } from 'lucide-react';
import './SellerDashboard.css';

const FormContext = React.createContext(null);

const lookupPincode = (pin) => {
  if (!pin || pin.length !== 6) return null;
  const exacts = {
    '600001': { city: 'Chennai', state: 'Tamil Nadu' },
    '600020': { city: 'Chennai', state: 'Tamil Nadu' },
    '560001': { city: 'Bengaluru', state: 'Karnataka' },
    '400001': { city: 'Mumbai', state: 'Maharashtra' },
    '110001': { city: 'Delhi', state: 'Delhi' },
    '500001': { city: 'Hyderabad', state: 'Telangana' }
  };
  if (exacts[pin]) return exacts[pin];
  
  const prefix = pin.substring(0, 2);
  switch (prefix) {
    case '11': return { city: 'Delhi', state: 'Delhi' };
    case '40': return { city: 'Mumbai', state: 'Maharashtra' };
    case '41': return { city: 'Pune', state: 'Maharashtra' };
    case '42': return { city: 'Thane', state: 'Maharashtra' };
    case '43': return { city: 'Aurangabad', state: 'Maharashtra' };
    case '44': return { city: 'Nagpur', state: 'Maharashtra' };
    case '50': return { city: 'Hyderabad', state: 'Telangana' };
    case '56': return { city: 'Bengaluru', state: 'Karnataka' };
    case '57': return { city: 'Mysuru', state: 'Karnataka' };
    case '60': return { city: 'Chennai', state: 'Tamil Nadu' };
    case '61': return { city: 'Thanjavur', state: 'Tamil Nadu' };
    case '62': return { city: 'Madurai', state: 'Tamil Nadu' };
    case '63': return { city: 'Coimbatore', state: 'Tamil Nadu' };
    case '64': return { city: 'Coimbatore', state: 'Tamil Nadu' };
    case '70': return { city: 'Kolkata', state: 'West Bengal' };
    case '38': return { city: 'Ahmedabad', state: 'Gujarat' };
    case '39': return { city: 'Surat', state: 'Gujarat' };
    default: return { city: 'Chennai', state: 'Tamil Nadu' };
  }
};

const InputField = ({ label, name, type = 'text', required = true, ...props }) => {
  const context = React.useContext(FormContext);
  if (!context) return null;
  const { formData, setFormData } = context;
  
  return (
    <div className="sd-form-group" style={props.style}>
      <label>{label}</label>
      {type === 'checkbox' ? (
        <div style={{ display: 'flex', alignItems: 'center', height: '44px' }}>
          <input 
            type="checkbox" 
            checked={!!formData[name]} 
            onChange={e => setFormData({...formData, [name]: e.target.checked})} 
            style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: 'var(--sd-primary)' }}
            {...props} 
          />
        </div>
      ) : type === 'select' ? (
        <select
          required={required}
          value={formData[name] ?? ''}
          onChange={e => {
            const val = e.target.value;
            setFormData(prev => {
              const next = { ...prev, [name]: val };
              if (name === 'state') {
                next.city = ''; 
              }
              return next;
            });
          }}
          className="sd-form-control"
          {...props}
        >
          <option value="">Select {label}</option>
          {props.options?.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      ) : (
        <input 
          type={type} 
          required={required} 
          value={formData[name] ?? ''} 
          onChange={e => setFormData({...formData, [name]: e.target.value})} 
          className="sd-form-control"
          {...props} 
        />
      )}
    </div>
  );
};

const AddProperty = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    mobile: '',
    email: '',
    propertyType: 'House',
    bedrooms: '1',
    bathrooms: '1',
    builtupArea: '',
    floorNumber: '',
    terraceArea: '',
    landArea: '',
    parkingSpaces: '1',
    pgName: '',
    monthlyRent: '',
    securityDeposit: '',
    pgType: 'Boys',
    sharingType: '1 Sharing',
    numberOfBeds: '',
    availableRooms: '',
    foodAvailable: false,
    plotNumber: '',
    surveyNumber: ''
  });
  const [images, setImages] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();
  const sellerUser = JSON.parse(localStorage.getItem('sellerUser'));

  useEffect(() => {
    if (formData.pincode && formData.pincode.length === 6) {
      const match = lookupPincode(formData.pincode);
      if (match) {
        setFormData(prev => ({
          ...prev,
          city: match.city,
          state: match.state
        }));
      }
    }
  }, [formData.pincode]);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setError('');
    setImages(files);
  };

  const validateForm = () => {
    if (!/^[a-zA-Z\s]+$/.test(formData.city)) return "City must contain only alphabets.";
    if (!/^\d{6}$/.test(formData.pincode)) return "Pincode must be exactly 6 digits.";
    if (!/^\d{10}$/.test(formData.mobile)) return "Mobile number must be exactly 10 digits.";
    if (!formData.address) return "Address is required.";
    if (!formData.state) return "State is required.";
    if (!formData.email) return "Email is required.";
    if (formData.description.length < 20) return "Description must be at least 20 characters long.";

    for (let i = 0; i < images.length; i++) {
      if (images[i].size > 5 * 1024 * 1024) return `Image ${images[i].name} exceeds 5MB size limit.`;
    }

    if (formData.propertyType !== 'PG' && formData.title.length < 10) return "Title must be at least 10 characters long.";

    if (formData.propertyType === 'House') {
      if (Number(formData.price) <= 0) return "Price must be greater than 0.";
      if (Number(formData.bedrooms) < 1 || Number(formData.bedrooms) > 10) return "Bedrooms must be between 1 and 10.";
      if (Number(formData.bathrooms) < 1 || Number(formData.bathrooms) > 10) return "Bathrooms must be between 1 and 10.";
      if (Number(formData.builtupArea) <= 100) return "Built-up area must be greater than 100.";
      if (images.length < 2) return "At least 2 images required.";
    }

    if (formData.propertyType === 'Penthouse') {
      if (Number(formData.price) <= 100000) return "Price must be greater than 1,00,000 for a Penthouse.";
      if (Number(formData.floorNumber) <= 0) return "Floor number must be greater than 0.";
      if (images.length < 3) return "At least 3 images required for a Penthouse.";
    }

    if (formData.propertyType === 'Villa') {
      if (Number(formData.price) <= 0) return "Price must be greater than 0.";
      if (Number(formData.landArea) <= 500) return "Land area must be greater than 500.";
      if (Number(formData.parkingSpaces) < 1) return "At least 1 parking space required.";
      if (images.length < 3) return "At least 3 images required for a Villa.";
    }

    if (formData.propertyType === 'PG') {
      if (!formData.pgName || formData.pgName.length < 5) return "PG Name must be at least 5 characters.";
      if (Number(formData.monthlyRent) <= 0) return "Monthly Rent must be greater than 0.";
      if (Number(formData.securityDeposit) < 0) return "Security Deposit cannot be negative.";
      if (images.length < 2) return "At least 2 images required.";
    }

    if (formData.propertyType === 'Land') {
      if (Number(formData.price) <= 0) return "Price must be greater than 0.";
      if (!formData.plotNumber) return "Plot Number is required.";
      if (!formData.surveyNumber) return "Survey Number is required.";
      if (images.length < 2) return "At least 2 images required.";
    }

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      const data = new FormData();
      
      let title = formData.title;
      let price = formData.price;
      if (formData.propertyType === 'PG') {
        title = formData.pgName;
        price = formData.monthlyRent;
      }
      
      data.append('propertyType', formData.propertyType);
      data.append('title', title);
      data.append('price', price);
      data.append('description', formData.description);
      data.append('address', formData.address);
      data.append('city', formData.city);
      data.append('state', formData.state);
      data.append('pincode', formData.pincode);
      data.append('mobile', formData.mobile);
      data.append('email', formData.email);

      if (formData.propertyType === 'House') {
        data.append('bedrooms', formData.bedrooms);
        data.append('bathrooms', formData.bathrooms);
        data.append('builtupArea', formData.builtupArea);
        data.append('parkingSpaces', formData.parkingSpaces);
      } else if (formData.propertyType === 'Penthouse') {
        data.append('floorNumber', formData.floorNumber);
        data.append('terraceArea', formData.terraceArea);
      } else if (formData.propertyType === 'Villa') {
        data.append('landArea', formData.landArea);
        data.append('parkingSpaces', formData.parkingSpaces);
      } else if (formData.propertyType === 'PG') {
        data.append('securityDeposit', formData.securityDeposit);
        data.append('pgType', formData.pgType);
        data.append('sharingType', formData.sharingType);
        data.append('numberOfBeds', formData.numberOfBeds);
        data.append('availableRooms', formData.availableRooms);
        data.append('foodAvailable', formData.foodAvailable);
      } else if (formData.propertyType === 'Land') {
        data.append('landArea', formData.landArea);
        data.append('plotNumber', formData.plotNumber);
        data.append('surveyNumber', formData.surveyNumber);
      }

      data.append('ownerId', sellerUser.id);
      data.append('location', `${formData.address}, ${formData.city}, ${formData.state} ${formData.pincode}`);
      
      images.forEach(img => {
        data.append('images', img);
      });

      await axios.post((window.API_BASE_URL || 'https://realestatelisting-u2kp.onrender.com') + '/api/properties', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setSuccess('Property submitted successfully! Awaiting Admin Approval.');
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add property');
    }
  };

  return (
    <div className="sd-layout sd-form-layout fade-in" style={{ justifyContent: 'center', padding: '40px 20px' }}>
      <div className="sd-panel" style={{ maxWidth: '900px', width: '100%', margin: '0 auto', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.08)' }}>
        <Link to="/dashboard" style={{ color: 'var(--sd-primary)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', marginBottom: '24px', fontWeight: '600', fontSize: '0.95rem' }}>
          <ChevronLeft size={18} style={{ marginRight: '4px' }} /> Back to Dashboard
        </Link>
        <h1 className="sd-panel-title" style={{ fontSize: '1.75rem', marginBottom: '8px' }}>New Listing Submission</h1>
        <p style={{ color: 'var(--sd-text-muted)', marginBottom: '32px', fontSize: '0.95rem' }}>Submit a new property to the network for admin review. Fill in all the details accurately.</p>
        
        {error && <div style={{ background: 'var(--sd-danger-light)', color: 'var(--sd-danger)', padding: '12px 16px', borderRadius: '8px', marginBottom: '24px', fontSize: '0.9rem', fontWeight: '500' }}>{error}</div>}
        {success && <div style={{ background: 'var(--sd-success-light)', color: 'var(--sd-success)', padding: '12px 16px', borderRadius: '8px', marginBottom: '24px', fontSize: '0.9rem', fontWeight: '500' }}>{success}</div>}

        <FormContext.Provider value={{ formData, setFormData }}>
          <form onSubmit={handleSubmit} className="sd-form-grid">
          
          <div className="sd-form-group" style={{ gridColumn: 'span 2' }}>
            <label>Property Type</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', marginTop: '8px' }}>
              {[
                { type: 'House', icon: <Home size={24} />, desc: 'Independent House' },
                { type: 'Penthouse', icon: <Building size={24} />, desc: 'Luxury Top Floor' },
                { type: 'Villa', icon: <MapPin size={24} />, desc: 'Premium Villa' },
                { type: 'PG', icon: <Users size={24} />, desc: 'Paying Guest' },
                { type: 'Land', icon: <Map size={24} />, desc: 'Empty Plot' }
              ].map(item => (
                <div 
                  key={item.type}
                  onClick={() => setFormData({...formData, propertyType: item.type})}
                  style={{
                    border: formData.propertyType === item.type ? '2px solid var(--sd-primary)' : '1px solid var(--sd-border)',
                    background: formData.propertyType === item.type ? 'var(--sd-primary-light)' : '#fff',
                    borderRadius: '12px',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: formData.propertyType === item.type ? '0 4px 12px rgba(59, 130, 246, 0.15)' : 'none',
                    textAlign: 'center'
                  }}
                >
                  <div style={{ color: formData.propertyType === item.type ? 'var(--sd-primary)' : 'var(--sd-text-muted)', marginBottom: '8px' }}>
                    {item.icon}
                  </div>
                  <span style={{ fontWeight: formData.propertyType === item.type ? '700' : '500', color: formData.propertyType === item.type ? 'var(--sd-primary)' : 'var(--sd-text-main)', fontSize: '0.9rem' }}>{item.type}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--sd-text-muted)', marginTop: '4px' }}>{item.desc}</span>
                </div>
              ))}
            </div>
          </div>

          {formData.propertyType !== 'PG' ? (
            <>
              <div className="sd-form-group" style={{ gridColumn: 'span 2' }}>
                <label>Property Title</label>
                <input type="text" required className="sd-form-control" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="e.g. Modern Villa in Anna Nagar (Min 10 chars)" />
              </div>
              <InputField label="Price (₹)" name="price" type="number" />
            </>
          ) : (
            <>
              <div className="sd-form-group" style={{ gridColumn: 'span 2' }}>
                <label>PG Name</label>
                <input type="text" required className="sd-form-control" value={formData.pgName} onChange={e => setFormData({...formData, pgName: e.target.value})} placeholder="e.g. Sunrise Men's PG" />
              </div>
              <InputField label="Monthly Rent (₹)" name="monthlyRent" type="number" />
              <InputField label="Security Deposit (₹)" name="securityDeposit" type="number" />
            </>
          )}

          <InputField label="Address (Street/Area)" name="address" style={{ gridColumn: 'span 2' }} />
          <InputField 
            label="State" 
            name="state" 
            type="select" 
            options={['Tamil Nadu', 'Karnataka', 'Maharashtra', 'Delhi', 'Telangana', 'West Bengal', 'Gujarat']} 
          />
          <InputField 
            label="City" 
            name="city" 
            type="select" 
            options={
              formData.state === 'Tamil Nadu' ? ['Chennai', 'Coimbatore', 'Madurai', 'Thanjavur'] :
              formData.state === 'Karnataka' ? ['Bengaluru', 'Mysuru'] :
              formData.state === 'Maharashtra' ? ['Mumbai', 'Pune', 'Thane', 'Aurangabad', 'Nagpur'] :
              formData.state === 'Delhi' ? ['Delhi'] :
              formData.state === 'Telangana' ? ['Hyderabad'] :
              formData.state === 'West Bengal' ? ['Kolkata'] :
              formData.state === 'Gujarat' ? ['Ahmedabad', 'Surat'] :
              []
            } 
            disabled={!formData.state}
          />
          <InputField label="Pincode" name="pincode" placeholder="Exactly 6 digits" />
          
          <InputField label="Mobile Number" name="mobile" type="tel" placeholder="10 digits" />
          <InputField label="Email Address" name="email" type="email" />

          {formData.propertyType === 'House' && (
            <>
              <InputField label="Bedrooms (1-10)" name="bedrooms" type="number" min="1" max="10" />
              <InputField label="Bathrooms (1-10)" name="bathrooms" type="number" min="1" max="10" />
              <InputField label="Built-up Area (sq ft)" name="builtupArea" type="number" />
            </>
          )}

          {formData.propertyType === 'Penthouse' && (
            <>
              <InputField label="Floor Number" name="floorNumber" type="number" />
              <InputField label="Terrace Area (sq ft)" name="terraceArea" type="number" />
            </>
          )}

          {formData.propertyType === 'Villa' && (
            <>
              <InputField label="Land Area (sq ft)" name="landArea" type="number" />
              <InputField label="Parking Spaces" name="parkingSpaces" type="number" min="1" />
            </>
          )}

          {formData.propertyType === 'PG' && (
            <>
              <div className="sd-form-group">
                <label>PG Type</label>
                <select value={formData.pgType} onChange={e => setFormData({...formData, pgType: e.target.value})} className="sd-form-control">
                  <option value="Boys">Boys</option>
                  <option value="Girls">Girls</option>
                  <option value="Co-ed">Co-ed</option>
                </select>
              </div>
              <div className="sd-form-group">
                <label>Sharing Type</label>
                <select value={formData.sharingType} onChange={e => setFormData({...formData, sharingType: e.target.value})} className="sd-form-control">
                  <option value="1 Sharing">1 Sharing</option>
                  <option value="2 Sharing">2 Sharing</option>
                  <option value="3 Sharing">3+ Sharing</option>
                </select>
              </div>
              <InputField label="Number of Beds" name="numberOfBeds" type="number" />
              <InputField label="Available Rooms" name="availableRooms" type="number" />
              <InputField label="Food Available" name="foodAvailable" type="checkbox" required={false} />
            </>
          )}

          {formData.propertyType === 'Land' && (
            <>
              <InputField label="Land Area (sq ft)" name="landArea" type="number" />
              <InputField label="Plot Number" name="plotNumber" />
              <InputField label="Survey Number" name="surveyNumber" />
            </>
          )}

          <div className="sd-form-group" style={{ gridColumn: 'span 2' }}>
            <label>Detailed Description</label>
            <textarea required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="sd-form-control" rows={5} placeholder="Describe the property highlights, amenities, and nearby facilities... (Min 20 chars)" />
          </div>

          <div className="sd-form-group" style={{ gridColumn: 'span 2' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Upload size={16} /> Upload Property Images
              <span style={{ fontWeight: 'normal', color: 'var(--sd-text-muted)', fontSize: '0.85rem' }}>(Min {['Penthouse', 'Villa'].includes(formData.propertyType) ? 3 : 2}, Max 10, Max 5MB/each)</span>
            </label>
            
            <div style={{ position: 'relative', width: '100%', height: '140px', border: '2px dashed var(--sd-primary)', borderRadius: '12px', background: 'var(--sd-primary-light)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}>
              <input 
                type="file" 
                multiple 
                accept="image/*"
                onChange={handleImageChange}
                style={{ position: 'absolute', width: '100%', height: '100%', opacity: 0, cursor: 'pointer', zIndex: 10 }}
              />
              <Upload size={32} color="var(--sd-primary)" style={{ marginBottom: '10px' }} />
              <span style={{ color: 'var(--sd-primary)', fontWeight: '600' }}>
                {images.length > 0 ? `${images.length} Image(s) Selected` : 'Click or Drag & Drop Images Here'}
              </span>
            </div>

            {images.length > 0 && (
              <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', marginTop: '16px', paddingBottom: '8px' }}>
                {images.map((img, idx) => (
                  <img 
                    key={idx} 
                    src={URL.createObjectURL(img)} 
                    alt={`preview-${idx}`} 
                    style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--sd-border)' }} 
                  />
                ))}
              </div>
            )}
          </div>
          
          <button type="submit" className="sd-btn-primary" style={{ gridColumn: 'span 2', justifyContent: 'center', padding: '14px', fontSize: '1.05rem', marginTop: '16px' }}>
            SUBMIT LISTING FOR APPROVAL
          </button>
        </form>
        </FormContext.Provider>
      </div>
    </div>
  );
};

export default AddProperty;

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { Search, MapPin, Building, ShieldCheck, Headphones, Home, Users, Check, Gift, Compass } from 'lucide-react';
import PropertyCard from '../../components/PropertyCard';
import './BuyerHome.css';

const BuyerHome = () => {
  const [properties, setProperties] = useState([]);
  const [featuredProperties, setFeaturedProperties] = useState([]);
  const [recs, setRecs] = useState([]);
  const [searchTab, setSearchTab] = useState('Buy'); // 'Buy', 'Rent', 'PG'
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Premium Welcome Screen States
  const [showWelcome, setShowWelcome] = useState(false);
  const [welcomeFadeOut, setWelcomeFadeOut] = useState(false);
  
  // Registration success modal states
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [registeredName, setRegisteredName] = useState('');
  const [registeredRole, setRegisteredRole] = useState('Buyer');

  const navigate = useNavigate();

  useEffect(() => {
    // Add active class to body for navbar animation control
    document.body.classList.add('welcome-active');
    document.body.classList.remove('welcome-finished');

    // Welcome screen fades out after 500ms
    const fadeTimer = setTimeout(() => {
      setWelcomeFadeOut(true);
      setIsLoaded(true); // Triggers main page element animations
      document.body.classList.remove('welcome-active');
      document.body.classList.add('welcome-finished');
    }, 500);

    // Welcome screen completely unmounts after 800ms (500ms active + 300ms transition)
    const unmountTimer = setTimeout(() => {
      setShowWelcome(false);
    }, 800);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(unmountTimer);
      document.body.classList.remove('welcome-active', 'welcome-finished');
    };
  }, []);

  useEffect(() => {
    axios.get((window.API_BASE_URL || 'https://realestatelisting-u2kp.onrender.com') + '/api/properties')
      .then(res => {
        const approvedProps = res.data.filter(p => !p.status || p.status === 'approved');
        setProperties(approvedProps);
        setFeaturedProperties(approvedProps.slice(0, 4));
      })
      .catch(err => console.error(err));
  }, []);

  useEffect(() => {
    if (properties.length === 0) return;

    const user = JSON.parse(localStorage.getItem('user'));
    const favorites = (user?.favorites || []).map(id => String(id));
    const viewedIds = JSON.parse(localStorage.getItem('viewedPropertyIds') || '[]');

    let bookingsPromise = Promise.resolve([]);
    let enquiriesPromise = Promise.resolve([]);
    if (user?.id) {
      bookingsPromise = axios.get((window.API_BASE_URL || 'https://realestatelisting-u2kp.onrender.com') + `/api/bookings?buyerId=${user.id}`)
        .then(res => Array.isArray(res.data) ? res.data : [])
        .catch(() => []);
      enquiriesPromise = axios.get((window.API_BASE_URL || 'https://realestatelisting-u2kp.onrender.com') + `/api/enquiries?buyerId=${user.id}`)
        .then(res => Array.isArray(res.data) ? res.data : [])
        .catch(() => []);
    }

    Promise.all([bookingsPromise, enquiriesPromise]).then(([bookings, enquiries]) => {
      const bookedIds = bookings.map(b => String(b.propertyId));
      const enquiredIds = enquiries.map(e => String(e.propertyId));
      const interactedIds = [...new Set([...favorites, ...bookedIds, ...enquiredIds, ...viewedIds])];

      if (interactedIds.length === 0) {
        const rated = properties.map(p => {
          const avg = p.reviews && p.reviews.length > 0
            ? p.reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / p.reviews.length
            : 0;
          return { ...p, ratingScore: avg };
        })
        .sort((a, b) => b.ratingScore - a.ratingScore)
        .slice(0, 4);
        setRecs(rated);
      } else {
        const favoredProps = properties.filter(p => favorites.includes(String(p.id)));
        const bookedProps = properties.filter(p => bookedIds.includes(String(p.id)));
        const enquiredProps = properties.filter(p => enquiredIds.includes(String(p.id)));
        const viewedProps = properties.filter(p => viewedIds.includes(String(p.id)));

        const prefTypes = {};
        const prefCities = {};
        let totalPrice = 0;
        let totalInteractions = 0;

        favoredProps.forEach(p => {
          if (p.propertyType) prefTypes[p.propertyType] = (prefTypes[p.propertyType] || 0) + 1.5;
          if (p.city) prefCities[p.city.toLowerCase()] = (prefCities[p.city.toLowerCase()] || 0) + 1.5;
          totalPrice += (p.price || 0) * 1.5;
          totalInteractions += 1.5;
        });

        enquiredProps.forEach(p => {
          if (p.propertyType) prefTypes[p.propertyType] = (prefTypes[p.propertyType] || 0) + 2;
          if (p.city) prefCities[p.city.toLowerCase()] = (prefCities[p.city.toLowerCase()] || 0) + 2;
          totalPrice += (p.price || 0) * 2;
          totalInteractions += 2;
        });

        bookedProps.forEach(p => {
          if (p.propertyType) prefTypes[p.propertyType] = (prefTypes[p.propertyType] || 0) + 4;
          if (p.city) prefCities[p.city.toLowerCase()] = (prefCities[p.city.toLowerCase()] || 0) + 4;
          totalPrice += (p.price || 0) * 4;
          totalInteractions += 4;
        });

        viewedProps.forEach(p => {
          if (p.propertyType) prefTypes[p.propertyType] = (prefTypes[p.propertyType] || 0) + 1;
          if (p.city) prefCities[p.city.toLowerCase()] = (prefCities[p.city.toLowerCase()] || 0) + 1;
          totalPrice += p.price || 0;
          totalInteractions += 1;
        });

        const averagePrice = totalInteractions > 0 ? totalPrice / totalInteractions : 0;

        const scored = properties
          .filter(p => !interactedIds.includes(String(p.id)))
          .map(p => {
            let score = 0;
            if (p.propertyType && prefTypes[p.propertyType]) {
              score += prefTypes[p.propertyType] * 3;
            }
            if (p.city && prefCities[p.city.toLowerCase()]) {
              score += prefCities[p.city.toLowerCase()] * 2;
            }
            if (p.price && averagePrice > 0) {
              const diff = Math.abs(p.price - averagePrice) / averagePrice;
              if (diff <= 0.25) score += 2;
              else if (diff <= 0.5) score += 1;
            }
            const avg = p.reviews && p.reviews.length > 0
              ? p.reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / p.reviews.length
              : 0;
            score += avg * 0.5;

            return { ...p, recScore: score };
          });

        const recommended = scored
          .filter(p => p.recScore > 0)
          .sort((a, b) => b.recScore - a.recScore)
          .slice(0, 4);

        if (recommended.length > 0) {
          setRecs(recommended);
        } else {
          const rated = properties.map(p => {
            const avg = p.reviews && p.reviews.length > 0
              ? p.reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / p.reviews.length
              : 0;
            return { ...p, ratingScore: avg };
          })
          .sort((a, b) => b.ratingScore - a.ratingScore)
          .slice(0, 4);
          setRecs(rated);
        }
      }
    });
  }, [properties]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('registered') === 'true') {
      setRegisteredName(params.get('name') || 'User');
      const roleVal = params.get('role') || 'Buyer';
      setRegisteredRole(roleVal.charAt(0).toUpperCase() + roleVal.slice(1));
      setShowRegisterModal(true);
    }
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    navigate(`/properties?search=${searchQuery}`);
  };

  const handleCloseModal = () => {
    setShowRegisterModal(false);
    // Clear URL parameters
    navigate('/', { replace: true });
  };

  return (
    <div className={`homefind-landing-container ${showRegisterModal ? 'modal-open-blur' : ''} ${isLoaded ? 'is-active' : ''}`}>
      
      {/* Welcome Screen Overlay */}
      {showWelcome && (
        <div className={`homefind-welcome-overlay ${welcomeFadeOut ? 'fade-out' : ''}`}>
          <div className="welcome-bg-image"></div>
          <div className="welcome-content">
            <div className="welcome-logo-wrapper">
              <img src="/logo.jpg" alt="HomeFind Logo" style={{ width: '52px', height: '52px', borderRadius: '12px', objectFit: 'cover', boxShadow: '0 0 20px rgba(37, 99, 235, 0.5)' }} />
              <span className="welcome-logo-text">HomeFind</span>
            </div>
            <h2 className="welcome-message">Welcome to HomeFind</h2>
          </div>
        </div>
      )}
      {/* Registration Successful Modal Overlay */}
      {showRegisterModal && (
        <div className="registration-success-overlay">
          <div className="registration-success-modal">
            {/* Confetti celebration container */}
            <div className="confetti-container">
              <div className="confetti-popper popper-left">🎉</div>
              <div className="confetti-popper popper-right">🎉</div>
              {[...Array(12)].map((_, i) => (
                <div key={i} className={`confetti-piece color-${i % 4} piece-${i}`}></div>
              ))}
            </div>

            {/* Checkmark circle */}
            <div className="success-checkmark-circle">
              <div className="success-checkmark-inner">
                <Check size={28} strokeWidth={3} />
              </div>
            </div>

            {/* Modal Heading */}
            <h2 className="success-title">Registration Successful!</h2>
            <p className="success-subtitle">Welcome to DreamHomes Real Estate Portal</p>

            {/* Role details box */}
            <div className="success-role-card">
              <div className="success-role-avatar">
                <Users size={20} className="success-avatar-icon" />
              </div>
              <div className="success-role-details">
                <div className="detail-row">
                  <span className="detail-label">Role</span>
                  <span className="detail-separator">:</span>
                  <span className="detail-value role-highlight">{registeredRole}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">User Name</span>
                  <span className="detail-separator">:</span>
                  <span className="detail-value name-highlight">{registeredName}</span>
                </div>
              </div>
            </div>

            {/* Modal helper text */}
            <p className="success-thankyou">Thank you for joining us.</p>
            <p className="success-explore">You can now explore amazing properties.</p>

            {/* Action button */}
            <button className="success-home-btn" onClick={handleCloseModal}>
              <Home size={18} /> Go to Home
            </button>
          </div>
        </div>
      )}
      
      {/* Hero Banner Section */}
      <section className="homefind-hero-banner">
        <div className="homefind-hero-left">
          <h1 className="homefind-hero-title">
            Find Your <br/>
            <span className="homefind-hero-title-blue">Dream Home</span>
          </h1>
          <p className="homefind-hero-subtitle">
            Discover the best properties 🏡 <br/>
            your perfect place to live.
          </p>
          
          {/* Tabbed Search widget */}
          <div className="homefind-search-widget animate-slide-down">
            <div className="homefind-search-tabs">
              <button className={`homefind-search-tab ${searchTab === 'Buy' ? 'active' : ''}`} onClick={() => setSearchTab('Buy')}>Buy</button>
              <button className={`homefind-search-tab ${searchTab === 'Rent' ? 'active' : ''}`} onClick={() => setSearchTab('Rent')}>Rent</button>
              <button className={`homefind-search-tab ${searchTab === 'PG' ? 'active' : ''}`} onClick={() => setSearchTab('PG')}>PG</button>
            </div>
            
            <form onSubmit={handleSearchSubmit} className="homefind-search-form">
              <div className="homefind-search-input-group">
                <Search size={18} color="#94a3b8" />
                <input 
                  type="text" 
                  placeholder="Search for properties, location..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <button type="submit" className="homefind-search-submit-btn">
                <Search size={16} />
              </button>
            </form>
          </div>

          {/* Stats section inside hero */}
          <div className="homefind-hero-stats">
            <div className="homefind-stat-item">
              <div className="homefind-stat-icon-wrapper">
                <Home size={18} />
              </div>
              <div className="homefind-stat-text-group">
                <span className="homefind-stat-number">1500+</span>
                <span className="homefind-stat-label">Properties</span>
              </div>
            </div>

            <div className="homefind-stat-item">
              <div className="homefind-stat-icon-wrapper">
                <Users size={18} />
              </div>
              <div className="homefind-stat-text-group">
                <span className="homefind-stat-number">850+</span>
                <span className="homefind-stat-label">Happy Clients</span>
              </div>
            </div>

            <div className="homefind-stat-item">
              <div className="homefind-stat-icon-wrapper">
                <Building size={18} />
              </div>
              <div className="homefind-stat-text-group">
                <span className="homefind-stat-number">200+</span>
                <span className="homefind-stat-label">Builders</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Right overlapping villa image */}
        <div className="homefind-hero-right">
          <img 
            src="/images/default/hero-villa.jpg" 
            alt="Overlapping Luxury Villa" 
            className="homefind-hero-villa-img" 
          />
        </div>
      </section>

      {/* Featured Properties Section */}
      <section className="homefind-featured-section">
        <div className="homefind-section-header">
          <h2 className="homefind-section-title">Featured Properties</h2>
          <Link to="/properties" className="homefind-view-all">View All</Link>
        </div>

        <div className="homefind-cards-grid animate-slide-up">
          {featuredProperties.length > 0 ? (
            featuredProperties.map((prop, idx) => (
              <PropertyCard key={prop.id} property={prop} index={idx} />
            ))
          ) : (
            <p style={{ color: '#64748b', textAlign: 'center', gridColumn: 'span 4' }}>Loading newest dream properties...</p>
          )}
        </div>
      </section>

      {/* AI Recommended Properties Section */}
      {recs.length > 0 && (
        <section className="homefind-featured-section" style={{ marginTop: '40px', padding: '24px', borderRadius: '15px', background: 'linear-gradient(135deg, rgba(37,99,235,0.03) 0%, rgba(0,210,255,0.03) 100%)', border: '1px solid rgba(37,99,235,0.1)' }}>
          <div className="homefind-section-header" style={{ textAlign: 'left', marginBottom: '15px' }}>
            <h2 className="homefind-section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>🤖 AI Recommended For You</h2>
          </div>
          <div className="homefind-cards-grid animate-slide-up">
            {recs.map((prop, idx) => (
              <PropertyCard key={prop.id} property={prop} index={idx} />
            ))}
          </div>
        </section>
      )}

      {/* Categories Horizontal Pills */}
      <section className="homefind-categories-section">
        <div className="homefind-categories-flex">
          <div className="homefind-category-pill" onClick={() => navigate('/properties')}>
            <span>📍</span>
            <span>Top Locations</span>
          </div>
          <div className="homefind-category-pill" onClick={() => navigate('/properties')}>
            <span>🏢</span>
            <span>New Projects</span>
          </div>
          <div className="homefind-category-pill" onClick={() => navigate('/properties')}>
            <span>🛠️</span>
            <span>Under Construction</span>
          </div>
          <div className="homefind-category-pill" onClick={() => navigate('/properties')}>
            <span>🔑</span>
            <span>Ready to Move</span>
          </div>
          <div className="homefind-category-pill" onClick={() => navigate('/profile')}>
            <span>👥</span>
            <span>Top Agents</span>
          </div>
          <div className="homefind-category-pill" onClick={() => navigate('/properties?deals=true')}>
            <span>🏷️</span>
            <span>Best Deals</span>
          </div>
        </div>
      </section>

      {/* Verification & trust badges banner (bottom bar) */}
      <section className="homefind-trust-banner">
        <div className="homefind-trust-grid">
          <div className="homefind-trust-item">
            <div className="homefind-trust-icon-box">
              <ShieldCheck size={24} />
            </div>
            <div className="homefind-trust-text">
              <h4>Trusted & Secure</h4>
              <p>Your information is safe with us.</p>
            </div>
          </div>

          <div className="homefind-trust-item">
            <div className="homefind-trust-icon-box rupee-box">
              <span className="rupee-char">₹</span>
            </div>
            <div className="homefind-trust-text">
              <h4>Best Price</h4>
              <p>Get the best deals at the best price.</p>
            </div>
          </div>

          <div className="homefind-trust-item">
            <div className="homefind-trust-icon-box">
              <Headphones size={24} />
            </div>
            <div className="homefind-trust-text">
              <h4>24/7 Support</h4>
              <p>We are always here to help you.</p>
            </div>
          </div>

          <div className="homefind-trust-item">
            <div className="homefind-trust-icon-box">
              <Home size={24} />
            </div>
            <div className="homefind-trust-text">
              <h4>Wide Range</h4>
              <p>Explore a wide range of properties.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default BuyerHome;

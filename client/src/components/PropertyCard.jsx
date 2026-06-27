import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Heart } from 'lucide-react';
import './PropertyCard.css';

const fallbacks = [
  '/images/default/fallback-1.jpg',
  '/images/default/fallback-2.jpg',
  '/images/default/fallback-3.jpg',
  '/images/default/fallback-4.jpg'
];

const PropertyCard = ({ property, index = 0, onFavoriteToggle }) => {
  const [isSaved, setIsSaved] = useState(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    return user?.favorites?.some(id => String(id) === String(property.id)) || false;
  });
  const [animate, setAnimate] = useState(false);
  const [particles, setParticles] = useState([]);

  // Indian currency formatting
  const formatIndianCurrency = (priceVal) => {
    if (!priceVal) return '₹ 0';
    const num = Number(priceVal);
    if (isNaN(num)) return `₹ ${priceVal}`;
    if (num >= 10000000) {
      return `₹ ${(num / 10000000).toFixed(2)} Cr`;
    } else if (num >= 100000) {
      return `₹ ${(num / 100000).toFixed(2)} Lakhs`;
    } else {
      return `₹ ${num.toLocaleString('en-IN')}`;
    }
  };

  const handleSaveToggle = async (e) => {
    e.preventDefault();
    const currentUser = JSON.parse(localStorage.getItem('user'));
    if (!currentUser) {
      await window.customAlert("Please login to save properties.");
      return;
    }

    const newSavedState = !isSaved;
    setIsSaved(newSavedState);
    
    // Heartbeat pulse & floating particle burst
    setAnimate(true);
    setTimeout(() => setAnimate(false), 500);

    if (newSavedState) {
      const newParticles = Array.from({ length: 6 }).map((_, i) => {
        const angle = (i * 60 * Math.PI) / 180;
        const dist = 20 + Math.random() * 20;
        return {
          id: Date.now() + i,
          x: Math.cos(angle) * dist,
          y: Math.sin(angle) * dist
        };
      });
      setParticles(newParticles);
      setTimeout(() => setParticles([]), 800);
    }

    let favs = currentUser.favorites || [];
    const normalizedId = isNaN(Number(property.id)) ? property.id : Number(property.id);
    if (newSavedState) {
      if (!favs.some(id => String(id) === String(property.id))) {
        favs.push(normalizedId);
      }
    } else {
      favs = favs.filter(id => String(id) !== String(property.id));
    }
    currentUser.favorites = favs;
    localStorage.setItem('user', JSON.stringify(currentUser));

    if (onFavoriteToggle) {
      onFavoriteToggle(property.id, newSavedState);
    }
    
    try {
      await fetch(`http://localhost:5000/api/users/${currentUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ favorites: favs })
      });
    } catch(err) {
      console.error('Failed to sync favorite with server', err);
    }
  };

  let badgeType = 'popular';
  if (property.isFeatured) badgeType = 'featured';
  else if (property.isNew) badgeType = 'new';
  const imgUrl = property.images && property.images[0] 
    ? (property.images[0].startsWith('http') ? property.images[0] : `http://localhost:5000${property.images[0]}`) 
    : fallbacks[index % fallbacks.length];

  return (
    <div className="estify-prop-card">
      <div className="estify-prop-img-wrapper">
        <img src={imgUrl} alt={property.title} className="estify-prop-img" />
        <div className={`estify-prop-badge ${badgeType}`}>
          {badgeType.toUpperCase()}
        </div>
        <button onClick={handleSaveToggle} className={`estify-prop-save-btn ${isSaved ? 'saved' : ''} ${animate ? 'animate-heart' : ''}`} style={{ position: 'absolute' }}>
          <Heart size={15} fill={isSaved ? "#ef4444" : "none"} color={isSaved ? "#ef4444" : "#64748b"} />
          {particles.map(p => (
            <span 
              key={p.id} 
              className="heart-particle" 
              style={{
                '--x': `${p.x}px`,
                '--y': `${p.y}px`
              }}
            />
          ))}
        </button>
        <span className="estify-prop-photos-badge">{property.images ? property.images.length : 0} Photos</span>
      </div>

      <div className="estify-prop-info">
        <h4 className="estify-prop-card-title">{property.title}</h4>
        <div className="estify-prop-location">
          <MapPin size={14} color="#94a3b8" />
          <span>{property.city ? `${property.city}, ${property.state}` : property.location}</span>
        </div>
        <div className="estify-prop-price-row">
          <span className="estify-prop-price">{formatIndianCurrency(property.price)}{property.propertyType === 'PG' && '/mo'}</span>
          {property.propertyType !== 'PG' && property.propertyType !== 'Land' && (
            <span className="estify-prop-per-sqft">₹{Math.floor(property.price / (property.builtupArea || property.area || 1500))}/sq.ft</span>
          )}
          {property.propertyType === 'PG' && property.securityDeposit && (
            <span className="estify-prop-per-sqft">Dep: {formatIndianCurrency(property.securityDeposit)}</span>
          )}
        </div>

        {/* Specs grid */}
        <div className="estify-prop-specs-grid">
          {property.propertyType === 'PG' ? (
            <>
              <div className="estify-prop-spec-item">
                <span className="estify-prop-spec-val">{property.pgType || 'Co-ed'}</span>
                <span>Type</span>
              </div>
              <div className="estify-prop-spec-item">
                <span className="estify-prop-spec-val">{property.sharingType || '1'}</span>
                <span>Sharing</span>
              </div>
              <div className="estify-prop-spec-item">
                <span className="estify-prop-spec-val">{property.foodAvailable ? 'Yes' : 'No'}</span>
                <span>Food</span>
              </div>
            </>
          ) : property.propertyType === 'Land' ? (
            <>
              <div className="estify-prop-spec-item">
                <span className="estify-prop-spec-val">{property.landArea || property.area} Sq.ft</span>
                <span>Area</span>
              </div>
              <div className="estify-prop-spec-item">
                <span className="estify-prop-spec-val">{property.plotNumber || 'N/A'}</span>
                <span>Plot No</span>
              </div>
            </>
          ) : (
            <>
              <div className="estify-prop-spec-item">
                <span className="estify-prop-spec-val">{property.builtupArea || property.area || '1500'} Sq.ft</span>
                <span>Area</span>
              </div>
              <div className="estify-prop-spec-item">
                <span className="estify-prop-spec-val">{property.bedrooms || '3'} Beds</span>
                <span>Bedrooms</span>
              </div>
              <div className="estify-prop-spec-item">
                <span className="estify-prop-spec-val">{property.bathrooms || '2'} Baths</span>
                <span>Baths</span>
              </div>
            </>
          )}
        </div>

        {/* Outline tags */}
        <div className="estify-prop-tags">
          <span className="estify-prop-tag-item">{property.propertyType}</span>
          <span className="estify-prop-tag-item">{property.isNew ? 'New' : 'Ready to Move'}</span>
        </div>

        <div className="estify-prop-buttons">
          <button className={`estify-btn-outline ${isSaved ? 'saved' : ''} ${animate ? 'animate-heart' : ''}`} onClick={handleSaveToggle} style={{ position: 'relative' }}>
            <Heart size={14} fill={isSaved ? "#ef4444" : "none"} color={isSaved ? "#ef4444" : "#0f172a"} /> Save
            {particles.map(p => (
              <span 
                key={p.id} 
                className="heart-particle" 
                style={{
                  '--x': `${p.x}px`,
                  '--y': `${p.y}px`
                }}
              />
            ))}
          </button>
          <Link to={`/properties/${property.id}`} className="estify-btn-primary" style={{ display: 'block', textDecoration: 'none', textAlign: 'center' }}>
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PropertyCard;

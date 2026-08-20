import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { Search, Filter, SlidersHorizontal, MapPin, DollarSign, Bed, Square } from 'lucide-react';
import PropertyCard from '../../components/PropertyCard';
import './BuyerPropertyListing.css';

const BuyerPropertyListing = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const initialSearch = searchParams.get('search') || '';
  const initialType = searchParams.get('type') || 'Any';
  const initialCategory = searchParams.get('category') || '';
  const initialDeals = searchParams.get('deals') === 'true';
  const initialFavorites = searchParams.get('favorites') === 'true';
  
  // Filter States
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    title: initialSearch,
    location: '',
    maxPrice: '',
    minArea: '',
    bhk: '',
    type: initialType,
    furnished: 'Any',
    category: initialCategory,
    deals: initialDeals,
    favorites: initialFavorites,
    pgSharing: 'Any',
    pgGender: 'Any',
    pgFood: 'Any',
    landType: 'Any',
    sortBy: 'default'
  });
  
  const [searchMode, setSearchMode] = useState('standard'); // 'standard' or 'ai'
  const [aiSearchPrompt, setAiSearchPrompt] = useState('');
  const [parsedAiFilters, setParsedAiFilters] = useState(null);
  const [userBookings, setUserBookings] = useState([]);
  const [userEnquiries, setUserEnquiries] = useState([]);

  const [userFavorites, setUserFavorites] = useState(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    return (user?.favorites || []).map(id => String(id));
  });

  const parseAISearch = (prompt) => {
    const text = prompt.toLowerCase();
    const parsed = {
      type: 'Any',
      bhk: '',
      maxPrice: '',
      minArea: '',
      location: '',
      title: ''
    };

    // 1. Detect property type
    if (text.includes('villa')) parsed.type = 'Villa';
    else if (text.includes('pg') || text.includes('paying guest') || text.includes('hostel')) parsed.type = 'PG';
    else if (text.includes('land') || text.includes('plot') || text.includes('ground')) parsed.type = 'Land';
    else if (text.includes('penthouse')) parsed.type = 'Penthouse';
    else if (text.includes('house') || text.includes('home')) parsed.type = 'House';

    // 2. Detect BHK
    const bhkRegex = /(\d+)\s*(?:bhk|bedroom|bed)/i;
    const bhkMatch = text.match(bhkRegex);
    if (bhkMatch) {
      parsed.bhk = bhkMatch[1];
    }

    // 3. Detect price/budget
    const priceRegex = /(?:under|below|budget|within|price|max|maximum)\s*(?:of)?\s*(?:rs\.?|inr|₹)?\s*([\d.]+)\s*(lakh|l|crore|cr|k|thousand)?/i;
    const priceMatch = text.match(priceRegex);
    if (priceMatch) {
      let num = parseFloat(priceMatch[1]);
      const unit = (priceMatch[2] || '').toLowerCase();
      if (unit === 'lakh' || unit === 'l') {
        num = num * 100000;
      } else if (unit === 'crore' || unit === 'cr') {
        num = num * 10000000;
      } else if (unit === 'k' || unit === 'thousand') {
        num = num * 1000;
      }
      parsed.maxPrice = num.toString();
    }

    // 4. Detect minimum area
    const areaRegex = /(\d+)\s*(?:sqft|sq\.ft|square\s*feet|sq\s*feet|area)/i;
    const areaMatch = text.match(areaRegex);
    if (areaMatch) {
      parsed.minArea = areaMatch[1];
    }

    // 5. Detect location
    const uniqueCities = [...new Set(properties.map(p => (p.city || '').toLowerCase()).filter(Boolean))];
    const foundCity = uniqueCities.find(city => text.includes(city));
    if (foundCity) {
      parsed.location = foundCity.charAt(0).toUpperCase() + foundCity.slice(1);
    } else {
      const locRegex = /(?:in|at)\s+([a-zA-Z\s]+)/i;
      const locMatch = text.match(locRegex);
      if (locMatch) {
        const potentialLoc = locMatch[1].trim().split(' ')[0];
        const stopWords = ['a', 'the', 'budget', 'under', 'below', 'cheap', 'best', 'lakh', 'crore', 'lakhs', 'crores', 'sqft', 'bhk'];
        if (!stopWords.includes(potentialLoc.toLowerCase())) {
          parsed.location = potentialLoc.charAt(0).toUpperCase() + potentialLoc.slice(1);
        }
      }
    }

    return parsed;
  };

  const getAIRecommendations = () => {
    const bookedIds = userBookings.map(b => String(b.propertyId));
    const enquiredIds = userEnquiries.map(e => String(e.propertyId));
    const interactedIds = [...new Set([...userFavorites, ...bookedIds, ...enquiredIds])];

    if (interactedIds.length === 0) {
      return [...properties]
        .map(p => {
          const avgRating = p.reviews && p.reviews.length > 0 
            ? p.reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / p.reviews.length 
            : 0;
          return { ...p, ratingScore: avgRating };
        })
        .sort((a, b) => b.ratingScore - a.ratingScore)
        .slice(0, 4);
    }

    const favoredProps = properties.filter(p => userFavorites.includes(String(p.id)));
    const bookedProps = properties.filter(p => bookedIds.includes(String(p.id)));
    const enquiredProps = properties.filter(p => enquiredIds.includes(String(p.id)));

    const favoriteTypes = {};
    const favoriteCities = {};
    let totalPrice = 0;
    let totalInteractions = 0;

    favoredProps.forEach(p => {
      if (p.propertyType) favoriteTypes[p.propertyType] = (favoriteTypes[p.propertyType] || 0) + 1;
      if (p.city) favoriteCities[p.city.toLowerCase()] = (favoriteCities[p.city.toLowerCase()] || 0) + 1;
      totalPrice += p.price || 0;
      totalInteractions += 1;
    });

    enquiredProps.forEach(p => {
      if (p.propertyType) favoriteTypes[p.propertyType] = (favoriteTypes[p.propertyType] || 0) + 1.5;
      if (p.city) favoriteCities[p.city.toLowerCase()] = (favoriteCities[p.city.toLowerCase()] || 0) + 1.5;
      totalPrice += (p.price || 0) * 1.5;
      totalInteractions += 1.5;
    });

    bookedProps.forEach(p => {
      if (p.propertyType) favoriteTypes[p.propertyType] = (favoriteTypes[p.propertyType] || 0) + 3;
      if (p.city) favoriteCities[p.city.toLowerCase()] = (favoriteCities[p.city.toLowerCase()] || 0) + 3;
      totalPrice += (p.price || 0) * 3;
      totalInteractions += 3;
    });

    const averagePrice = totalInteractions > 0 ? totalPrice / totalInteractions : 0;

    const scored = properties
      .filter(p => !interactedIds.includes(String(p.id)))
      .map(p => {
        let score = 0;
        if (p.propertyType && favoriteTypes[p.propertyType]) {
          score += favoriteTypes[p.propertyType] * 3;
        }
        if (p.city && favoriteCities[p.city.toLowerCase()]) {
          score += favoriteCities[p.city.toLowerCase()] * 2;
        }
        if (p.price && averagePrice > 0) {
          const priceDiffRatio = Math.abs(p.price - averagePrice) / averagePrice;
          if (priceDiffRatio <= 0.25) {
            score += 2;
          } else if (priceDiffRatio <= 0.5) {
            score += 1;
          }
        }
        const avgRating = p.reviews && p.reviews.length > 0 
          ? p.reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / p.reviews.length 
          : 0;
        score += avgRating * 0.5;

        return { ...p, recScore: score };
      });

    return scored
      .filter(p => p.recScore > 0)
      .sort((a, b) => b.recScore - a.recScore)
      .slice(0, 4);
  };

  useEffect(() => {
    axios.get((window.API_BASE_URL || 'https://realestatelisting-u2kp.onrender.com') + '/api/properties')
      .then(res => {
        setProperties(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });

    const user = JSON.parse(localStorage.getItem('user'));
    if (user?.id) {
      axios.get((window.API_BASE_URL || 'https://realestatelisting-u2kp.onrender.com') + `/api/bookings?buyerId=${user.id}`)
        .then(res => {
          if (Array.isArray(res.data)) setUserBookings(res.data);
        }).catch(err => console.error("Error loading user bookings for AI recommendations:", err));

      axios.get((window.API_BASE_URL || 'https://realestatelisting-u2kp.onrender.com') + `/api/enquiries?buyerId=${user.id}`)
        .then(res => {
          if (Array.isArray(res.data)) setUserEnquiries(res.data);
        }).catch(err => console.error("Error loading user enquiries for AI recommendations:", err));
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const newType = params.get('type') || 'Any';
    const newDeals = params.get('deals') === 'true';
    const newFavorites = params.get('favorites') === 'true';
    const newSearch = params.get('search') || '';
    const newCategory = params.get('category') || '';
    
    setFilters(prev => ({
      ...prev,
      type: newType,
      deals: newDeals,
      favorites: newFavorites,
      title: newSearch,
      category: newCategory
    }));
  }, [location.search]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const filteredProperties = properties.filter(prop => {
    let matches = true;

    if (filters.title && !prop.title.toLowerCase().includes(filters.title.toLowerCase())) {
      matches = false;
    }
    if (filters.location && !prop.location.toLowerCase().includes(filters.location.toLowerCase())) {
      matches = false;
    }
    if (filters.maxPrice && prop.price > Number(filters.maxPrice)) {
      matches = false;
    }
    // Check if it is Land
    const isLand = filters.type === 'Land' || prop.propertyType === 'Land';
    // Check if it is PG
    const isPG = filters.type === 'PG' || prop.propertyType === 'PG';

    if (filters.minArea && prop.area < Number(filters.minArea)) {
      matches = false;
    }
    if (!isLand && !isPG && filters.bhk && prop.bedrooms !== Number(filters.bhk)) {
      matches = false;
    }
    // Exact logic for Rent, PG, Buy, and specific property types
    if (filters.type !== 'Any') {
      if (filters.type === 'Rent') {
        if (prop.propertyFor !== 'Rent' || prop.propertyType === 'PG') matches = false;
      } else if (filters.type === 'PG') {
        if (prop.propertyType !== 'PG') matches = false;
      } else if (filters.type === 'Buy') {
        if (prop.propertyFor === 'Rent' || prop.propertyType === 'PG') matches = false;
      } else if (['Villa', 'Penthouse', 'Land', 'House'].includes(filters.type)) {
        if (prop.propertyType !== filters.type) matches = false;
      }
    }
    // Furnished Status (Mock Logic - skip for Land)
    if (!isLand && filters.furnished !== 'Any') {
      if (filters.furnished === 'Furnished' && !prop.description.toLowerCase().includes('furnished')) matches = false;
      if (filters.furnished === 'Unfurnished' && prop.description.toLowerCase().includes('furnished')) matches = false;
    }

    // Dynamic PG Filters
    if (isPG) {
      if (filters.pgSharing !== 'Any') {
        const desc = prop.description.toLowerCase();
        if (filters.pgSharing === 'Single' && !desc.includes('single')) matches = false;
        if (filters.pgSharing === 'Double' && !desc.includes('double') && !desc.includes('2 sharing')) matches = false;
        if (filters.pgSharing === 'Triple' && !desc.includes('triple') && !desc.includes('3 sharing')) matches = false;
      }
      if (filters.pgGender !== 'Any') {
        const desc = prop.description.toLowerCase();
        const title = prop.title.toLowerCase();
        const text = desc + ' ' + title;
        if (filters.pgGender === 'Boys' && !text.includes('boys') && !text.includes('men') && !text.includes('male')) matches = false;
        if (filters.pgGender === 'Girls' && !text.includes('girls') && !text.includes('female') && !text.includes('women') && !text.includes('ladies')) matches = false;
      }
      if (filters.pgFood !== 'Any') {
        const desc = prop.description.toLowerCase();
        if (filters.pgFood === 'Yes' && !desc.includes('food') && !desc.includes('meal') && !desc.includes('breakfast') && !desc.includes('dinner')) matches = false;
      }
    }

    // Dynamic Land Filters
    if (isLand) {
      if (filters.landType !== 'Any') {
        const desc = prop.description.toLowerCase();
        const title = prop.title.toLowerCase();
        const text = desc + ' ' + title;
        if (filters.landType === 'Residential' && !text.includes('residential') && !text.includes('housing')) matches = false;
        if (filters.landType === 'Commercial' && !text.includes('commercial') && !text.includes('business') && !text.includes('shop')) matches = false;
        if (filters.landType === 'Agricultural' && !text.includes('agricultural') && !text.includes('farm') && !text.includes('cultivation')) matches = false;
      }
    }
    // Category (Projects filter)
    if (filters.category === 'Projects') {
      // Dummy logic to simulate new project filtering
      if (!prop.title.toLowerCase().includes('project') && !prop.description.toLowerCase().includes('new')) matches = false;
    }
    // Favorites filter
    if (filters.favorites) {
      if (!userFavorites.includes(String(prop.id))) {
        matches = false;
      }
    }
    // Specific property type category filtering
    if (filters.category) {
      if (['Villa', 'Penthouse', 'PG', 'Land', 'House'].includes(filters.category)) {
        if (prop.propertyType !== filters.category) matches = false;
      }
    }

    return matches;
  });

  let displayProperties = [...filteredProperties];
  if (filters.deals) {
    const categories = ['House', 'PG', 'Villa', 'Penthouse', 'Land'];
    const dealsGrouped = [];
    categories.forEach(cat => {
      const catProps = filteredProperties.filter(p => {
        const type = p.propertyType ? p.propertyType.toLowerCase() : '';
        if (cat === 'House') {
          return type === 'house' || type === 'home';
        }
        if (cat === 'Villa') {
          return type === 'villa' || type === 'vill';
        }
        return type === cat.toLowerCase();
      });
      // Sort this category by price descending (highest value first)
      catProps.sort((a, b) => (b.price || 0) - (a.price || 0));
      // Display the single highest valued property from this category
      if (catProps.length > 0) {
        dealsGrouped.push(catProps[0]);
      }
    });
    displayProperties = dealsGrouped;
  }

  // Sort displayProperties based on selection
  if (filters.sortBy === 'priceAsc') {
    displayProperties.sort((a, b) => (a.price || 0) - (b.price || 0));
  } else if (filters.sortBy === 'priceDesc') {
    displayProperties.sort((a, b) => (b.price || 0) - (a.price || 0));
  } else if (filters.sortBy === 'newest') {
    displayProperties.sort((a, b) => new Date(b.createdAt || b.date || 0) - new Date(a.createdAt || a.date || 0));
  }

  const clearFilters = () => {
    setFilters({
      title: '',
      location: '',
      maxPrice: '',
      minArea: '',
      bhk: '',
      type: 'Any',
      furnished: 'Any',
      category: '',
      deals: false,
      favorites: false,
      pgSharing: 'Any',
      pgGender: 'Any',
      pgFood: 'Any',
      landType: 'Any',
      sortBy: 'default'
    });
  };

  const handleAISearchSubmit = (e) => {
    e.preventDefault();
    if (!aiSearchPrompt.trim()) return;
    const parsed = parseAISearch(aiSearchPrompt);
    setParsedAiFilters(parsed);
    setFilters(prev => ({
      ...prev,
      type: parsed.type || 'Any',
      bhk: parsed.bhk || '',
      maxPrice: parsed.maxPrice || '',
      minArea: parsed.minArea || '',
      location: parsed.location || '',
      title: parsed.title || ''
    }));
  };

  const handleClearAISearch = () => {
    setAiSearchPrompt('');
    setParsedAiFilters(null);
    clearFilters();
  };

  const handleFavoriteToggle = (propertyId, isSaved) => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
      setUserFavorites((user.favorites || []).map(id => String(id)));
    }
  };

  return (
    <div className="property-listing page-container fade-in">
      <div className="listing-header">
        <h1>{filters.favorites ? 'Your Favorite Properties' : 'Properties for Sale'}</h1>
        <p>{filters.favorites ? 'Manage and view your favorited properties.' : 'Explore our premium collection of verified properties.'}</p>
      </div>

      {!filters.favorites && (
        <>
          {/* AI Recommendations Carousel */}
          {getAIRecommendations().length > 0 && (
            <div className="ai-recommendations-section glass" style={{ marginBottom: '30px', padding: '24px', borderRadius: '15px', background: 'linear-gradient(135deg, rgba(37,99,235,0.05) 0%, rgba(0,210,255,0.05) 100%)', border: '1px solid rgba(37,99,235,0.15)', textAlign: 'left' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.2rem', color: '#1e293b', marginBottom: '15px', fontWeight: '700' }}>
                🤖 AI RECOMMENDED FOR YOU
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                {getAIRecommendations().map(p => (
                  <PropertyCard key={p.id} property={p} index={p.id} onFavoriteToggle={handleFavoriteToggle} />
                ))}
              </div>
            </div>
          )}

          {/* Search Mode Toggles */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
            <button 
              onClick={() => setSearchMode('standard')}
              style={{
                padding: '8px 16px',
                borderRadius: '20px',
                border: 'none',
                background: searchMode === 'standard' ? '#3b82f6' : '#f1f5f9',
                color: searchMode === 'standard' ? '#fff' : '#64748b',
                fontWeight: '700',
                cursor: 'pointer',
                fontSize: '0.85rem',
                transition: 'all 0.2s'
              }}
            >
              Standard Search
            </button>
            <button 
              onClick={() => setSearchMode('ai')}
              style={{
                padding: '8px 16px',
                borderRadius: '20px',
                border: 'none',
                background: searchMode === 'ai' ? '#3b82f6' : '#f1f5f9',
                color: searchMode === 'ai' ? '#fff' : '#64748b',
                fontWeight: '700',
                cursor: 'pointer',
                fontSize: '0.85rem',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              🤖 AI Assistant Search
            </button>
          </div>

          <div className="listing-controls glass animate-slide-down" style={{ textAlign: 'left' }}>
            {searchMode === 'standard' ? (
              <div className="search-bar primary-search">
                <Search size={20} className="text-muted" />
                <input 
                  type="text" 
                  name="title"
                  placeholder="Search by property name..." 
                  value={filters.title}
                  onChange={handleFilterChange}
                />
              </div>
            ) : (
              <form onSubmit={handleAISearchSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
                  <div className="search-bar primary-search" style={{ flex: 1 }}>
                    <Search size={20} className="text-muted" />
                    <input 
                      type="text" 
                      placeholder="Ask AI search (e.g. 'I want a 3 BHK Villa in Bangalore under 90 Lakhs')..." 
                      value={aiSearchPrompt}
                      onChange={e => setAiSearchPrompt(e.target.value)}
                    />
                  </div>
                  <button type="submit" className="sd-btn-primary" style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '0 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                    Parse
                  </button>
                  {parsedAiFilters && (
                    <button type="button" onClick={handleClearAISearch} className="sd-btn-primary" style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '0 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                      Clear
                    </button>
                  )}
                </div>
                {parsedAiFilters && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', padding: '10px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.85rem' }}>
                    <span style={{ fontWeight: '700', color: '#475569' }}>AI Parsed Filters:</span>
                    {parsedAiFilters.type !== 'Any' && <span style={{ background: '#eff6ff', color: '#1d4ed8', padding: '2px 8px', borderRadius: '12px', fontWeight: '600' }}>Type: {parsedAiFilters.type}</span>}
                    {parsedAiFilters.bhk && <span style={{ background: '#eff6ff', color: '#1d4ed8', padding: '2px 8px', borderRadius: '12px', fontWeight: '600' }}>BHK: {parsedAiFilters.bhk}</span>}
                    {parsedAiFilters.maxPrice && <span style={{ background: '#eff6ff', color: '#1d4ed8', padding: '2px 8px', borderRadius: '12px', fontWeight: '600' }}>Budget: ₹{Number(parsedAiFilters.maxPrice).toLocaleString()}</span>}
                    {parsedAiFilters.minArea && <span style={{ background: '#eff6ff', color: '#1d4ed8', padding: '2px 8px', borderRadius: '12px', fontWeight: '600' }}>Area: {parsedAiFilters.minArea} sqft</span>}
                    {parsedAiFilters.location && <span style={{ background: '#eff6ff', color: '#1d4ed8', padding: '2px 8px', borderRadius: '12px', fontWeight: '600' }}>Location: {parsedAiFilters.location}</span>}
                  </div>
                )}
              </form>
            )}
            
            <div className="sort-selector" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '700' }}>SORT:</span>
              <select 
                name="sortBy" 
                value={filters.sortBy || 'default'} 
                onChange={handleFilterChange}
                style={{
                  padding: '8px 12px',
                  borderRadius: '20px',
                  border: '1px solid #cbd5e1',
                  background: '#fff',
                  fontSize: '0.85rem',
                  fontWeight: '700',
                  color: '#475569',
                  cursor: 'pointer',
                  outline: 'none',
                  transition: 'all 0.2s'
                }}
              >
                <option value="default">Default</option>
                <option value="priceAsc">Price: Low to High</option>
                <option value="priceDesc">Price: High to Low</option>
                <option value="newest">Newest First</option>
              </select>
            </div>

            <button 
              className={`btn ${showFilters ? 'btn-primary' : 'btn-outline'} filter-toggle-btn`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <SlidersHorizontal size={18} /> {showFilters ? 'Hide Filters' : 'Advanced Filters'}
            </button>
          </div>

          {showFilters && (
            <div className="advanced-filters glass fade-in">
              {/* Category Selector at the top of filters to switch layouts */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '15px', marginBottom: '15px' }}>
                <span style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#1e293b' }}>Select Property Type:</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {['Any', 'House', 'Villa', 'Penthouse', 'PG', 'Land'].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => handleFilterChange({ target: { name: 'type', value: t } })}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '20px',
                        fontSize: '0.8rem',
                        fontWeight: '700',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        border: filters.type === t ? '1px solid #3b82f6' : '1px solid #cbd5e1',
                        background: filters.type === t ? '#eff6ff' : '#fff',
                        color: filters.type === t ? '#1d4ed8' : '#475569'
                      }}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic Filter Grid based on selected type */}
              {filters.type === 'PG' ? (
                /* PG Specific Filters */
                <div className="filter-grid">
                  <div className="input-group">
                    <label><MapPin size={14} /> Location</label>
                    <input 
                      type="text" 
                      name="location" 
                      placeholder="City or Area" 
                      value={filters.location}
                      onChange={handleFilterChange}
                    />
                  </div>
                  <div className="input-group">
                    <label><DollarSign size={14} /> Max Monthly Rent ($)</label>
                    <input 
                      type="number" 
                      name="maxPrice" 
                      placeholder="e.g. 5000" 
                      value={filters.maxPrice}
                      onChange={handleFilterChange}
                    />
                  </div>
                  <div className="input-group">
                    <label>Sharing Type</label>
                    <select name="pgSharing" value={filters.pgSharing} onChange={handleFilterChange}>
                      <option value="Any">Any Sharing</option>
                      <option value="Single">Single Room</option>
                      <option value="Double">Double Sharing</option>
                      <option value="Triple">Triple Sharing</option>
                    </select>
                  </div>
                  <div className="input-group">
                    <label>Preferred Tenants</label>
                    <select name="pgGender" value={filters.pgGender} onChange={handleFilterChange}>
                      <option value="Any">Any Gender</option>
                      <option value="Boys">Boys / Men</option>
                      <option value="Girls">Girls / Women</option>
                    </select>
                  </div>
                  <div className="input-group">
                    <label>Food Facility</label>
                    <select name="pgFood" value={filters.pgFood} onChange={handleFilterChange}>
                      <option value="Any">Food Optional</option>
                      <option value="Yes">Food Included</option>
                    </select>
                  </div>
                </div>
              ) : filters.type === 'Land' ? (
                /* Land Specific Filters */
                <div className="filter-grid">
                  <div className="input-group">
                    <label><MapPin size={14} /> Location</label>
                    <input 
                      type="text" 
                      name="location" 
                      placeholder="City or Area" 
                      value={filters.location}
                      onChange={handleFilterChange}
                    />
                  </div>
                  <div className="input-group">
                    <label><DollarSign size={14} /> Max Land Price ($)</label>
                    <input 
                      type="number" 
                      name="maxPrice" 
                      placeholder="e.g. 5000000" 
                      value={filters.maxPrice}
                      onChange={handleFilterChange}
                    />
                  </div>
                  <div className="input-group">
                    <label><Square size={14} /> Min Area (sqft)</label>
                    <input 
                      type="number" 
                      name="minArea" 
                      placeholder="e.g. 2400" 
                      value={filters.minArea}
                      onChange={handleFilterChange}
                    />
                  </div>
                  <div className="input-group">
                    <label>Zoning / Land Type</label>
                    <select name="landType" value={filters.landType} onChange={handleFilterChange}>
                      <option value="Any">Any Land Type</option>
                      <option value="Residential">Residential Plot</option>
                      <option value="Commercial">Commercial Site</option>
                      <option value="Agricultural">Agricultural Land</option>
                    </select>
                  </div>
                </div>
              ) : (
                /* General / Default Filters (House, Villa, Penthouse, etc.) */
                <div className="filter-grid">
                  <div className="input-group">
                    <label><MapPin size={14} /> Location</label>
                    <input 
                      type="text" 
                      name="location" 
                      placeholder="City or Area" 
                      value={filters.location}
                      onChange={handleFilterChange}
                    />
                  </div>
                  <div className="input-group">
                    <label><DollarSign size={14} /> Max Price ($)</label>
                    <input 
                      type="number" 
                      name="maxPrice" 
                      placeholder="e.g. 1000000" 
                      value={filters.maxPrice}
                      onChange={handleFilterChange}
                    />
                  </div>
                  <div className="input-group">
                    <label><Bed size={14} /> BHK (Bedrooms)</label>
                    <select name="bhk" value={filters.bhk} onChange={handleFilterChange}>
                      <option value="">Any BHK</option>
                      <option value="1">1 BHK</option>
                      <option value="2">2 BHK</option>
                      <option value="3">3 BHK</option>
                      <option value="4">4+ BHK</option>
                    </select>
                  </div>
                  <div className="input-group">
                    <label><Square size={14} /> Min Area (sqft)</label>
                    <input 
                      type="number" 
                      name="minArea" 
                      placeholder="e.g. 1500" 
                      value={filters.minArea}
                      onChange={handleFilterChange}
                    />
                  </div>
                  <div className="input-group">
                    <label>Purpose</label>
                    <select name="type" value={filters.type} onChange={handleFilterChange}>
                      <option value="Any">Buy & Rent</option>
                      <option value="Sale">Buy</option>
                      <option value="Rent">Rent</option>
                    </select>
                  </div>
                  <div className="input-group">
                    <label>Furnishing</label>
                    <select name="furnished" value={filters.furnished} onChange={handleFilterChange}>
                      <option value="Any">Any Furnishing</option>
                      <option value="Furnished">Fully Furnished</option>
                      <option value="Unfurnished">Unfurnished</option>
                    </select>
                  </div>
                </div>
              )}
              <div className="filter-actions" style={{ marginTop: '15px' }}>
                <button className="btn btn-outline btn-sm" onClick={clearFilters}>Clear All Filters</button>
              </div>
            </div>
          )}
        </>
      )}

      {loading ? (
        <div className="loading">Loading properties...</div>
      ) : (
        <div className="properties-grid animate-slide-up">
          {displayProperties.length > 0 ? (
            displayProperties.map(prop => (
              <PropertyCard key={prop.id} property={prop} onFavoriteToggle={handleFavoriteToggle} />
            ))
          ) : (
            <div className="no-results glass">
              <h3>{filters.favorites ? 'No favorite properties saved' : 'No properties found matching your criteria'}</h3>
              <p>{filters.favorites ? 'Browse listings and click the heart icon to save properties.' : 'Try adjusting your search or clearing some filters.'}</p>
              {!filters.favorites && <button className="btn btn-primary mt-3" onClick={clearFilters}>Clear Filters</button>}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BuyerPropertyListing;


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
    landType: 'Any'
  });
  const [userFavorites, setUserFavorites] = useState(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    return (user?.favorites || []).map(id => String(id));
  });

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
    // Deals filter
    if (filters.deals) {
      if (prop.price > 10000000) matches = false; // Only show 'deals' under a certain price for simulation
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
      // Sort this category by views descending (best properties)
      catProps.sort((a, b) => (b.views || 0) - (a.views || 0));
      // Display only the top 5 best properties from this category
      dealsGrouped.push(...catProps.slice(0, 5));
    });
    displayProperties = dealsGrouped;
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
      landType: 'Any'
    });
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
          <div className="listing-controls glass animate-slide-down">
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


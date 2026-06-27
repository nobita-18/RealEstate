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
    favorites: initialFavorites
  });
  const [userFavorites, setUserFavorites] = useState(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    return (user?.favorites || []).map(id => String(id));
  });

  useEffect(() => {
    axios.get('http://localhost:5000/api/properties')
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
    if (filters.minArea && prop.area < Number(filters.minArea)) {
      matches = false;
    }
    if (filters.bhk && prop.bedrooms !== Number(filters.bhk)) {
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
    // Furnished Status (Mock Logic)
    if (filters.furnished !== 'Any') {
      if (filters.furnished === 'Furnished' && !prop.description.toLowerCase().includes('furnished')) matches = false;
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
      furnished: 'Any'
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
              <div className="filter-actions">
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


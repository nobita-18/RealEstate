import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { MapPin, Bed, Square, ArrowLeft, Mail, Info } from 'lucide-react';
import './BuyerPropertyDetails.css';
import { getAssetUrl } from '../../api';

const BuyerPropertyDetails = () => {
  const { id } = useParams();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [enquirySent, setEnquirySent] = useState(false);
  const [alreadyEnquired, setAlreadyEnquired] = useState(false);
  
  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const currentUser = JSON.parse(localStorage.getItem('user')) || JSON.parse(localStorage.getItem('sellerUser'));

  useEffect(() => {
    const token = localStorage.getItem('token') || localStorage.getItem('sellerToken');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    
    axios.get(`${window.API_BASE_URL || "https://realestatelisting-u2kp.onrender.com"}/api/properties/${id}${window.location.search}`, { headers })
      .then(res => {
        setProperty(res.data);
        setReviews(res.data.reviews || []);
        setLoading(false);
        
        // Check if current user has already enquired
        const user = JSON.parse(localStorage.getItem('user'));
        if (user && res.data.inquiries) {
          const hasEnquired = res.data.inquiries.some(inq => String(inq.userId) === String(user.id));
          if (hasEnquired) {
            setAlreadyEnquired(true);
          }
        }
      })
      .catch(err => {
        setError('Property not found.');
        setLoading(false);
      });
  }, [id]);

  const handleEnquiry = async () => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
      await window.customAlert("Please log in to send an enquiry!");
      return;
    }
    axios.post((window.API_BASE_URL || 'https://realestatelisting-u2kp.onrender.com') + '/api/enquiries', {
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      userMobile: user.mobile,
      propertyId: property.id,
      propertyTitle: property.title,
      message: `I am interested in ${property.title}`
    }).then(() => {
      setEnquirySent(true);
    }).catch(async () => {
      await window.customAlert("Failed to send enquiry.");
    });
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
      await window.customAlert("Please log in to leave a review!");
      return;
    }
    if (rating < 1 || rating > 5) {
      await window.customAlert("Please select a rating of at least 1 star!");
      return;
    }
    if (comment.length < 10 || comment.length > 1000) {
      await window.customAlert("Comment must be between 10 and 1000 characters long!");
      return;
    }
    
    axios.post(`${window.API_BASE_URL || "https://realestatelisting-u2kp.onrender.com"}/api/properties/${id}/reviews`, {
      userId: user.id,
      userName: user.name,
      rating,
      comment
    }).then(res => {
      setReviews([...reviews, res.data]);
      setComment('');
      setRating(0);
    }).catch(async () => {
      await window.customAlert("Failed to submit review.");
    });
  };

  if (loading) return <div className="page-container fade-in">Loading...</div>;
  if (error) return <div className="page-container fade-in"><h2>{error}</h2><Link to="/properties">Back to properties</Link></div>;

  return (
    <div className="property-details page-container fade-in">
      <Link to="/properties" className="back-link">
        <ArrowLeft size={18} /> Back to Search
      </Link>

      <div className="details-header">
        <h1>{property.title}</h1>
        <p className="location-tag"><MapPin size={20} /> {property.city ? `${property.address}, ${property.city}, ${property.state} ${property.pincode}` : property.location}</p>
      </div>

      <div className="details-grid">
        <div className="details-main">
          <div className="main-image-container">
            <img src={property.images && property.images[0] ? getAssetUrl(property.images[0]) : ''} alt={property.title} className="main-image" />
          </div>

          <div className="info-section glass">
            <h2><Info size={24} className="icon-blue" /> Property Description</h2>
            <p>{property.description}</p>
            
            <div className="features-list" style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginTop: '20px'}}>
              <div className="feature-item">
                <MapPin size={24} className="icon-blue" />
                <div>
                  <strong>Type</strong>
                  <p>{property.propertyType}</p>
                </div>
              </div>

              {property.propertyType === 'PG' ? (
                <>
                  <div className="feature-item"><Bed size={24} className="icon-blue" /><div><strong>Available Rooms</strong><p>{property.availableRooms}</p></div></div>
                  <div className="feature-item"><Bed size={24} className="icon-blue" /><div><strong>Number of Beds</strong><p>{property.numberOfBeds}</p></div></div>
                  <div className="feature-item"><Square size={24} className="icon-blue" /><div><strong>Sharing Type</strong><p>{property.sharingType}</p></div></div>
                  <div className="feature-item"><Info size={24} className="icon-blue" /><div><strong>Food Available</strong><p>{property.foodAvailable ? 'Yes' : 'No'}</p></div></div>
                  <div className="feature-item"><Info size={24} className="icon-blue" /><div><strong>PG Type</strong><p>{property.pgType}</p></div></div>
                </>
              ) : property.propertyType === 'Land' ? (
                <>
                  <div className="feature-item"><Square size={24} className="icon-blue" /><div><strong>Land Area</strong><p>{property.landArea || property.area} sqft</p></div></div>
                  <div className="feature-item"><MapPin size={24} className="icon-blue" /><div><strong>Plot Number</strong><p>{property.plotNumber}</p></div></div>
                  <div className="feature-item"><Info size={24} className="icon-blue" /><div><strong>Survey Number</strong><p>{property.surveyNumber}</p></div></div>
                </>
              ) : (
                <>
                  <div className="feature-item"><Bed size={24} className="icon-blue" /><div><strong>Bedrooms</strong><p>{property.bedrooms || '1'}</p></div></div>
                  <div className="feature-item"><Square size={24} className="icon-blue" /><div><strong>Bathrooms</strong><p>{property.bathrooms || '1'}</p></div></div>
                  <div className="feature-item"><Square size={24} className="icon-blue" /><div><strong>Built-up Area</strong><p>{property.builtupArea || property.area} sqft</p></div></div>
                  {property.propertyType === 'Penthouse' && <div className="feature-item"><Info size={24} className="icon-blue" /><div><strong>Floor Number</strong><p>{property.floorNumber}</p></div></div>}
                  {property.propertyType === 'Penthouse' && <div className="feature-item"><Square size={24} className="icon-blue" /><div><strong>Terrace Area</strong><p>{property.terraceArea} sqft</p></div></div>}
                  {property.propertyType === 'Villa' && <div className="feature-item"><Square size={24} className="icon-blue" /><div><strong>Land Area</strong><p>{property.landArea} sqft</p></div></div>}
                  {property.propertyType === 'Villa' && <div className="feature-item"><Info size={24} className="icon-blue" /><div><strong>Parking Spaces</strong><p>{property.parkingSpaces}</p></div></div>}
                </>
              )}
            </div>
          </div>

          {/* Reviews Section */}
          <div className="reviews-section glass" style={{ marginTop: '30px', padding: '24px', borderRadius: '12px' }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.5rem', marginBottom: '20px', color: '#1e293b' }}>
              ⭐ Customer Reviews ({reviews.length})
            </h2>
            
            {/* Reviews List */}
            <div className="reviews-list" style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '30px' }}>
              {reviews.map((rev) => (
                <div key={rev.id} style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontWeight: '600', color: '#334155' }}>{rev.userName}</span>
                    <span style={{ fontSize: '0.85rem', color: '#64748b' }}>{new Date(rev.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div style={{ color: '#f59e0b', fontSize: '1.1rem', marginBottom: '6px' }}>
                    {'★'.repeat(rev.rating) + '☆'.repeat(5 - rev.rating)}
                  </div>
                  <p style={{ color: '#475569', fontSize: '0.95rem', margin: 0, whiteSpace: 'pre-wrap' }}>{rev.comment}</p>
                </div>
              ))}
              {reviews.length === 0 && (
                <p style={{ color: '#64748b', fontStyle: 'italic', margin: 0 }}>No reviews yet for this property.</p>
              )}
            </div>

            {/* Write a Review Section */}
            {(enquirySent || alreadyEnquired) ? (
              <form onSubmit={handleReviewSubmit} style={{ borderTop: '2px solid #e2e8f0', paddingTop: '20px' }}>
                <style>{`
                  .review-textarea {
                    width: 100%;
                    padding: 12px;
                    border-radius: 8px;
                    border: 1.5px solid #cbd5e1;
                    font-size: 0.95rem;
                    font-family: inherit;
                    transition: border-color 0.2s, box-shadow 0.2s;
                    outline: none;
                  }
                  .review-textarea:hover {
                    border-color: #94a3b8;
                  }
                  .review-textarea:focus {
                    border-color: #3b82f6;
                    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
                  }
                  .star-btn {
                    cursor: pointer;
                    font-size: 2.25rem;
                    transition: color 0.15s, transform 0.1s;
                    display: inline-block;
                  }
                  .star-btn:hover {
                    transform: scale(1.15);
                  }
                `}</style>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '16px', color: '#1e293b' }}>Review</h3>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#475569' }}>Rating</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span 
                        key={star} 
                        onClick={() => setRating(star)} 
                        className="star-btn"
                        style={{ color: star <= rating ? 'gold' : '#cbd5e1' }}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                  {rating === 0 && (
                    <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '6px', fontStyle: 'italic' }}>
                      Click on a star to start your review.
                    </p>
                  )}
                </div>

                {rating > 0 && (
                  <div className="fade-in" style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#475569' }}>Comment</label>
                    <textarea 
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      rows={4}
                      placeholder="Share your experience (text, special characters, and emojis are all welcome! 😊)"
                      className="review-textarea"
                      required
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '0.85rem' }}>
                      <span style={{ color: comment.length < 10 || comment.length > 1000 ? '#ef4444' : '#10b981' }}>
                        {comment.length < 10 ? 'Minimum 10 characters required' : comment.length > 1000 ? 'Exceeded maximum length!' : 'Valid length'}
                      </span>
                      <span style={{ color: '#64748b' }}>{comment.length} / 1000</span>
                    </div>
                  </div>
                )}

                {rating > 0 && (
                  <button type="submit" className="btn btn-primary" style={{ padding: '10px 24px', fontSize: '1rem' }}>
                    Submit Review
                  </button>
                )}
              </form>
            ) : (
              <div style={{ background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '8px', padding: '16px', textAlign: 'center', color: '#64748b' }}>
                🔒 Review option will be enabled after you send an enquiry to the owner.
              </div>
            )}
          </div>
        </div>

        <div className="details-sidebar">
          <div className="price-card glass">
            <h3>{property.propertyType === 'PG' ? 'Monthly Rent' : 'Asking Price'}</h3>
            <div className="price-tag">
              ${property.price.toLocaleString()}
              {property.propertyType === 'PG' && <span style={{fontSize: '1rem', color: '#666', fontWeight: 'normal'}}>/month</span>}
            </div>
            
            {property.propertyType === 'PG' && property.securityDeposit && (
              <div style={{marginTop: '10px', fontSize: '1.1rem', color: '#444'}}>
                <strong>Security Deposit:</strong> ${property.securityDeposit.toLocaleString()}
              </div>
            )}

            <div style={{marginTop: '20px'}}>
              {currentUser && property && String(property.ownerId) === String(currentUser.id) ? (
                <a 
                  href={`/seller/edit-property/${property.id}`} 
                  className="btn btn-primary w-100" 
                  style={{
                    padding: '15px', 
                    fontSize: '1.1rem', 
                    textDecoration: 'none', 
                    display: 'block', 
                    textAlign: 'center', 
                    background: '#3b82f6',
                    color: '#fff',
                    borderRadius: '8px',
                    fontWeight: 'bold'
                  }}
                >
                  Edit Property
                </a>
              ) : (enquirySent || alreadyEnquired) ? (
                <div className="enquiry-success" style={{background: '#d4edda', color: '#155724', padding: '15px', borderRadius: '10px', textAlign: 'center', fontWeight: 'bold'}}>
                  ✓ {alreadyEnquired ? 'Enquiry already sent' : 'Enquiry Sent Successfully!'}
                </div>
              ) : (
                <button className="btn btn-primary w-100" onClick={handleEnquiry} style={{padding: '15px', fontSize: '1.1rem'}}>
                  <Mail size={18} style={{marginRight: '8px', verticalAlign: 'middle'}}/> Contact Owner
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuyerPropertyDetails;


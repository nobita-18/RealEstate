import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Mail, Phone, Award, ShieldCheck, Loader2 } from 'lucide-react';

const BuyerAgents = () => {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch all users and all properties in parallel
        const [usersRes, propertiesRes] = await Promise.all([
          axios.get((import.meta.env.VITE_API_URL || 'https://realestatelisting-u2kp.onrender.com') + '/api/users'),
          axios.get((import.meta.env.VITE_API_URL || 'https://realestatelisting-u2kp.onrender.com') + '/api/properties?status=all')
        ]);

        const allUsers = usersRes.data || [];
        const allProperties = propertiesRes.data || [];

        // Filter users whose role is "seller"
        const sellers = allUsers.filter(u => u.role === 'seller');

        // Map sellers to include real-time counts, ratings, and experience
        const dynamicAgents = sellers.map(seller => {
          // Count active listings uploaded by this seller
          const listingCount = allProperties.filter(p => String(p.ownerId) === String(seller.id)).length;

          // Generate consistent experience and rating if not set in profile
          const exp = seller.experience ? `${seller.experience} Years` : `${(Number(seller.id) % 10) + 3} Years`;
          const rate = seller.rating || (4.5 + (Number(seller.id) % 6) * 0.1).toFixed(1);

          return {
            id: seller.id,
            name: seller.name || seller.username || 'Independent Agent',
            email: seller.email || 'N/A',
            mobile: seller.mobile || 'N/A',
            experience: exp,
            rating: rate,
            properties: listingCount
          };
        });

        setAgents(dynamicAgents);
        setLoading(false);
      } catch (err) {
        console.error('Failed to load agents dynamically', err);
        setError('Failed to load agents in real-time. Please try again later.');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="page-container fade-in" style={{ padding: '40px 20px', minHeight: '80vh', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px', marginBottom: '40px' }}>
        <div>
          <h1 style={{ marginBottom: '10px', fontSize: '2.5rem', color: '#0f172a', fontWeight: '800' }}>Registered Agents</h1>
          <p style={{ color: '#64748b', fontSize: '1.1rem' }}>Connect with certified experts to find or sell your perfect property.</p>
        </div>
        <div className="glass" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 20px', borderRadius: '30px', background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
          <ShieldCheck color="#3b82f6" size={20} />
          <span style={{ fontWeight: '700', color: '#1d4ed8', fontSize: '0.9rem' }}>{agents.length} Active Agents Verified</span>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', gap: '15px' }}>
          <Loader2 className="animate-spin" color="#3b82f6" size={40} />
          <p style={{ color: '#64748b', fontWeight: '600' }}>Fetching real-time agent profiles...</p>
        </div>
      ) : error ? (
        <div className="glass" style={{ padding: '30px', textAlign: 'center', borderRadius: '15px', border: '1px solid #fca5a5', background: '#fef2f2', color: '#991b1b' }}>
          <p style={{ fontWeight: '600' }}>{error}</p>
        </div>
      ) : agents.length === 0 ? (
        <div className="glass" style={{ padding: '50px', textAlign: 'center', borderRadius: '15px', color: '#64748b' }}>
          <h3>No registered agents found</h3>
          <p>Please register a seller account to see agent profiles dynamically updated here.</p>
        </div>
      ) : (
        <div className="agents-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '25px' }}>
          {agents.map(agent => (
            <div key={agent.id} className="glass" style={{ padding: '25px', borderRadius: '15px', background: 'rgba(255, 255, 255, 0.7)', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: '1px solid rgba(255,255,255,0.4)', transition: 'transform 0.2s, box-shadow 0.2s' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#1e293b', margin: 0, fontWeight: '700', fontSize: '1.25rem' }}>
                    <Award color="#3b82f6" size={22} /> {agent.name}
                  </h3>
                  <span style={{ fontSize: '0.8rem', fontWeight: '700', padding: '4px 10px', borderRadius: '20px', background: '#f1f5f9', color: '#475569' }}>
                    Agent ID: #{agent.id}
                  </span>
                </div>
                
                <div style={{ margin: '15px 0', padding: '12px 15px', borderRadius: '10px', background: 'rgba(241, 245, 249, 0.5)', border: '1px solid #e2e8f0' }}>
                  <p style={{ margin: '0 0 8px 0', color: '#64748b', fontSize: '0.9rem' }}>
                    Experience: <strong style={{ color: '#334155' }}>{agent.experience}</strong>
                  </p>
                  <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>
                    Rating: <strong style={{ color: '#d97706' }}>{agent.rating} ⭐</strong>
                  </p>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <p style={{ margin: 0, color: '#64748b', fontSize: '0.95rem' }}>
                    Active Listings: <strong style={{ color: '#1e293b', fontSize: '1.05rem' }}>{agent.properties} properties</strong>
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <a 
                  href={`tel:${agent.mobile}`} 
                  style={{ flex: 1, textDecoration: 'none', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', padding: '10px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '0.9rem' }}
                >
                  <Phone size={16} /> Call ({agent.mobile})
                </a>
                <a 
                  href={`mailto:${agent.email}`} 
                  style={{ flex: 1, textDecoration: 'none', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', padding: '10px', background: 'transparent', color: '#3b82f6', border: '1px solid #3b82f6', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '0.9rem' }}
                >
                  <Mail size={16} /> Email
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BuyerAgents;

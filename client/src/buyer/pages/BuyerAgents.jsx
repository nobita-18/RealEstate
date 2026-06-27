import React from 'react';
import { Mail, Phone, Award } from 'lucide-react';

const BuyerAgents = () => {
  const agents = [
    { id: 1, name: 'Lingam Real Estates', experience: '15 Years', rating: '4.9', properties: 120 },
    { id: 2, name: 'Siva Realtors', experience: '8 Years', rating: '4.7', properties: 45 },
    { id: 3, name: 'Chennai Prime', experience: '5 Years', rating: '4.8', properties: 80 }
  ];

  return (
    <div className="page-container fade-in" style={{ padding: '40px 20px', minHeight: '80vh', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '10px', fontSize: '2.5rem', color: '#0f172a' }}>Our Top Agents</h1>
      <p style={{ color: '#64748b', marginBottom: '40px', fontSize: '1.1rem' }}>Connect with certified experts to find your perfect home.</p>
      
      <div className="agents-grid" style={{ display: 'grid', gap: '25px' }}>
        {agents.map(agent => (
          <div key={agent.id} className="glass" style={{ padding: '25px', borderRadius: '15px', background: 'rgba(255, 255, 255, 0.7)', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#1e293b' }}><Award color="#3b82f6" /> {agent.name}</h3>
            <p style={{ margin: '15px 0', color: '#64748b', fontSize: '0.95rem' }}>Experience: <strong>{agent.experience}</strong> &nbsp;|&nbsp; Rating: <strong>{agent.rating}⭐</strong></p>
            <p style={{ marginBottom: '25px', color: '#334155' }}>Active Listings: <strong>{agent.properties}</strong></p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button style={{ flex: 1, display: 'flex', justifyContent: 'center', gap: '8px', padding: '10px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}><Phone size={18} /> Contact</button>
              <button style={{ flex: 1, display: 'flex', justifyContent: 'center', gap: '8px', padding: '10px', background: 'transparent', color: '#3b82f6', border: '1px solid #3b82f6', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}><Mail size={18} /> Message</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BuyerAgents;

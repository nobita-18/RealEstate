import React from 'react';

const SellerNavbar = () => {
  return (
    <nav style={{ padding: '1rem 2rem', background: 'var(--surface-color)', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '1.5rem', alignItems: 'center', overflowX: 'auto', backdropFilter: 'blur(12px)' }} className="glass">
      <div style={{ fontWeight: 'bold', marginRight: '1rem', color: 'var(--primary-color)' }}>Quick Filters:</div>
      {['Villa', 'Penthouse', 'PG', 'Land', 'House', 'Contact', 'Deals', 'Agent'].map(item => (
        <button key={item} className="btn btn-outline" style={{ padding: '0.4rem 1rem', fontSize: '0.9rem' }}>
          {item}
        </button>
      ))}
    </nav>
  );
};

export default SellerNavbar;

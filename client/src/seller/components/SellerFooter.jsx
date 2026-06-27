import React from 'react';
import { useLocation } from 'react-router-dom';

const SellerFooter = () => {
  const location = useLocation();
  // We can show it everywhere except login/register if we want, or hide on dashboard if dashboard has no scrolling footer.
  // Actually, dashboard has a fixed sidebar, so a global footer might look weird under it. Let's hide it on dashboard as well.
  if (location.pathname === '/login' || location.pathname === '/register' || location.pathname === '/dashboard') return null;

  return (
    <footer style={{ background: '#ffffff', borderTop: '1px solid #e2e8f0', padding: '24px', textAlign: 'center', marginTop: 'auto', marginLeft: '260px', color: '#64748b', fontSize: '0.9rem', fontFamily: "'Inter', sans-serif" }}>
      <p style={{ fontWeight: '600', color: '#0f172a', margin: '0 0 8px 0' }}>HomeFind Seller Portal</p>
      <p style={{ margin: 0 }}>© {new Date().getFullYear()} HomeFind Inc. All rights reserved.</p>
    </footer>
  );
};

export default SellerFooter;

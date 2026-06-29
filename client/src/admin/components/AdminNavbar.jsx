import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Shield, Home } from 'lucide-react';

const AdminNavbar = () => {
  const location = useLocation();
  if (location.pathname === '/login') return null;

  return (
    <nav style={{ background: '#0a0a0a', borderBottom: '2px solid #e74c3c', padding: '15px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 1000 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
        <Shield size={30} color="#e74c3c" />
        <span style={{ fontSize: '1.6rem', fontWeight: '900', color: '#fff', textTransform: 'uppercase', letterSpacing: '2px' }}>Admin Protocol</span>
      </div>
      
      <div style={{ display: 'flex', gap: '30px', alignItems: 'center' }}>
        <Link to="/dashboard" style={{ color: '#fff', textDecoration: 'none', fontWeight: 'bold' }}>Command Center</Link>
      </div>
    </nav>
  );
};

export default AdminNavbar;

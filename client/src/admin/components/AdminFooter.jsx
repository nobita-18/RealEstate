import React from 'react';
import { useLocation } from 'react-router-dom';

const AdminFooter = () => {
  const location = useLocation();
  if (location.pathname === '/login') return null;

  return (
    <footer style={{ background: '#000', borderTop: '2px solid #e74c3c', padding: '20px', textAlign: 'center', marginTop: 'auto' }}>
      <p style={{ color: '#fff', fontSize: '1rem', fontWeight: 'bold', margin: '0 0 5px 0' }}>ADMINISTRATION ENCLAVE</p>
      <p style={{ color: '#555', fontSize: '0.8rem', margin: 0 }}>Restricted Command Environment. All actions are strictly logged.</p>
    </footer>
  );
};

export default AdminFooter;

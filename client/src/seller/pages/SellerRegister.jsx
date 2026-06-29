import React, { useEffect } from 'react';

const SellerRegister = () => {
  useEffect(() => {
    window.location.href = '/buyer/register';
  }, []);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#0f172a', color: '#ffffff', fontFamily: 'sans-serif' }}>
      <p>Redirecting to Unified Registration portal...</p>
    </div>
  );
};

export default SellerRegister;

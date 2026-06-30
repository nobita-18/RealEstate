import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import SellerRegister from './pages/SellerRegister';
import SellerLogin from './pages/SellerLogin';
import SellerDashboard from './pages/SellerDashboard';
import AddProperty from './pages/AddProperty';
import EditProperty from './pages/EditProperty';
import SellerProfile from './pages/SellerProfile';
import SellerFooter from './components/SellerFooter';
import PageTransition from '../components/PageTransition';

import { getSafeLocalStorage } from '../api';

function AppContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const hideFooter = ['/login', '/register'].includes(location.pathname);

  useEffect(() => {
    const isPublicRoute = ['/login', '/register'].includes(location.pathname);

    // If logged in as buyer, redirect to buyer home
    const user = getSafeLocalStorage('user');
    if (user && !isPublicRoute) {
      if (user.role === 'buyer') {
        window.location.href = '/buyer/';
        return;
      }
    }

    // If logged in as admin, redirect to admin dashboard
    const adminUser = getSafeLocalStorage('adminUser');
    if (adminUser && !isPublicRoute) {
      window.location.href = '/admin/dashboard';
      return;
    }

    // If not logged in as seller and trying to access protected seller routes:
    const sellerUser = getSafeLocalStorage('sellerUser');
    
    if (!sellerUser && !isPublicRoute) {
      navigate('/login');
    } else if (sellerUser && isPublicRoute) {
      // If already logged in as seller and trying to access login/register, redirect to dashboard
      navigate('/dashboard');
    }
  }, [location, navigate]);

  return (
    <div className="app-wrapper seller-theme" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <PageTransition>
        <Routes>
          <Route path="/register" element={<SellerRegister />} />
          <Route path="/login" element={<SellerLogin />} />
          <Route path="/dashboard" element={<SellerDashboard />} />
          <Route path="/profile" element={<Navigate to="/dashboard" state={{ tab: 'settings' }} replace />} />
          <Route path="/add-property" element={<AddProperty />} />
          <Route path="/edit-property/:id" element={<EditProperty />} />
          <Route path="/index.html" element={<Navigate to="/login" replace />} />
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </PageTransition>
      {!hideFooter && <SellerFooter />}
    </div>
  );
}

function App() {
  return (
    <Router basename="/seller">
      <AppContent />
    </Router>
  );
}

export default App;

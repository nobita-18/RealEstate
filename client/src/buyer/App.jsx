import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import BuyerHome from './pages/BuyerHome';
import BuyerLogin from './pages/BuyerLogin';
import BuyerRegister from './pages/BuyerRegister';
import BuyerPropertyListing from './pages/BuyerPropertyListing';
import BuyerPropertyDetails from './pages/BuyerPropertyDetails';
import BuyerProfile from './pages/BuyerProfile';
import BuyerAgents from './pages/BuyerAgents';
import BuyerBlog from './pages/BuyerBlog';
import BuyerContact from './pages/BuyerContact';

import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PageTransition from '../components/PageTransition';

import { getSafeLocalStorage } from '../api';

function AppContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const hideNavbarFooter = ['/login', '/register'].includes(location.pathname);

  useEffect(() => {
    const isProfileRoute = location.pathname === '/profile';
    const isPublicAuthRoute = ['/login', '/register'].includes(location.pathname);

    const sellerUser = getSafeLocalStorage('sellerUser');
    const adminUser = getSafeLocalStorage('adminUser');
    const user = getSafeLocalStorage('user');

    // Conflict Resolution: If logged in as a buyer, clean up any seller/admin keys to prevent redirect loops
    if (user && user.role === 'buyer') {
      if (localStorage.getItem('sellerUser') || localStorage.getItem('adminUser')) {
        localStorage.removeItem('sellerUser');
        localStorage.removeItem('sellerToken');
        localStorage.removeItem('adminUser');
        localStorage.removeItem('adminToken');
      }
    }

    if (sellerUser && (!user || user.role !== 'buyer')) {
      window.location.href = '/seller/dashboard';
      return;
    }
    
    if (adminUser && (!user || user.role !== 'buyer')) {
      window.location.href = '/admin/dashboard';
      return;
    }
    
    if (user) {
      if (user.role === 'buyer') {
        if (isPublicAuthRoute) {
          navigate('/');
        }
      }
    } else {
      if (isProfileRoute) {
        navigate('/login');
      }
    }
  }, [location, navigate]);

  return (
    <div className="app-wrapper buyer-theme">
      {!hideNavbarFooter && <Navbar role="buyer" />}
      <PageTransition>
        <Routes>
          <Route path="/" element={<BuyerHome />} />
          <Route path="/login" element={<BuyerLogin />} />
          <Route path="/register" element={<BuyerRegister />} />
          <Route path="/properties" element={<BuyerPropertyListing />} />
          <Route path="/properties/:id" element={<BuyerPropertyDetails />} />
          <Route path="/profile" element={<BuyerProfile />} />
          <Route path="/agents" element={<BuyerAgents />} />
          <Route path="/blog" element={<BuyerBlog />} />
          <Route path="/contact" element={<BuyerContact />} />
          <Route path="/index.html" element={<Navigate to="/" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </PageTransition>
      {!hideNavbarFooter && <Footer />}
    </div>
  );
}

function App() {
  return (
    <Router basename="/buyer">
      <AppContent />
    </Router>
  );
}

export default App;

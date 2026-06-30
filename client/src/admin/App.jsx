import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import AdminNavbar from './components/AdminNavbar';
import AdminFooter from './components/AdminFooter';

import { getSafeLocalStorage } from '../api';

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const isPublicRoute = location.pathname === '/login';

    // If logged in as buyer, redirect to buyer home
    const user = getSafeLocalStorage('user');
    if (user && !isPublicRoute) {
      if (user.role === 'buyer') {
        window.location.href = '/buyer/';
        return;
      }
    }

    // If logged in as seller, redirect to seller dashboard
    const sellerUser = getSafeLocalStorage('sellerUser');
    if (sellerUser && !isPublicRoute) {
      window.location.href = '/seller/dashboard';
      return;
    }

    // If not logged in as admin and trying to access protected admin routes:
    const adminUser = getSafeLocalStorage('adminUser');

    if (!adminUser && !isPublicRoute) {
      navigate('/login');
    } else if (adminUser && isPublicRoute) {
      navigate('/dashboard');
    }
  }, [location, navigate]);

  return (
    <div className="app-wrapper admin-theme" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#111' }}>
      <AdminNavbar />
      <div style={{ flex: 1 }}>
        <Routes>
          <Route path="/login" element={<AdminLogin />} />
          <Route path="/dashboard" element={<AdminDashboard />} />
          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </div>
      <AdminFooter />
    </div>
  );
}

function App() {
  return (
    <Router basename="/admin">
      <AppContent />
    </Router>
  );
}

export default App;

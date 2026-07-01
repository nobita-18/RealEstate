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

    const user = getSafeLocalStorage('user');
    const sellerUser = getSafeLocalStorage('sellerUser');
    const adminUser = getSafeLocalStorage('adminUser');

    // Conflict Resolution: If logged in as admin, ensure primary 'user' matches adminUser, preventing loops
    if (adminUser) {
      if (!user || user.role !== 'admin') {
        localStorage.setItem('user', JSON.stringify(adminUser));
        const adminToken = localStorage.getItem('adminToken');
        if (adminToken) {
          localStorage.setItem('token', adminToken);
        }
      }
      if (localStorage.getItem('sellerUser')) {
        localStorage.removeItem('sellerUser');
        localStorage.removeItem('sellerToken');
      }
    }

    // If logged in as buyer, redirect to buyer home
    if (user && !adminUser && !isPublicRoute) {
      if (user.role === 'buyer') {
        window.location.href = '/buyer/';
        return;
      }
    }

    // If logged in as seller, redirect to seller dashboard
    if (sellerUser && !adminUser && !isPublicRoute) {
      window.location.href = '/seller/dashboard';
      return;
    }

    // If not logged in as admin and trying to access protected admin routes:
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
          <Route path="/index.html" element={<Navigate to="/login" replace />} />
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
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

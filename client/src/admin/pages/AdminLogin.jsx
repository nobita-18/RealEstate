import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ShieldCheck, Lock } from 'lucide-react';
import './AdminLogin.css';
const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', { identifier: email, password });
      
      if (res.data.user.role !== 'admin') {
        setError('Unauthorized access. Admin role required.');
        return;
      }
      
      // Clear any pre-existing sessions to prevent multi-role conflicts and redirect loops
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('sellerToken');
      localStorage.removeItem('sellerUser');
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');

      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      localStorage.setItem('adminToken', res.data.token);
      localStorage.setItem('adminUser', JSON.stringify(res.data.user));
      navigate('/dashboard'); 
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication failed');
    }
  };

  return (
    <div className="admin-login-wrapper">
      <div className="admin-secure-box">
        <div className="admin-header">
          <ShieldCheck size={50} className="shield-icon" />
          <h2>SYSTEM ACCESS</h2>
          <p>Restricted Area</p>
        </div>

        {error && <div className="admin-error">{error}</div>}

        <form onSubmit={handleLogin} className="admin-form">
          <div className="cyber-input-group">
            <Lock size={18} className="cyber-icon" />
            <input 
              type="email" 
              placeholder="Admin ID (Email)" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          
          <div className="cyber-input-group">
            <Lock size={18} className="cyber-icon" />
            <input 
              type="password" 
              placeholder="Passcode" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button type="submit" className="btn-cyber-scan">
            <span>AUTHENTICATE</span>
            <div className="scan-line"></div>
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;

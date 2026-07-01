import React from 'react';
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="estify-page-footer">
      <div className="footer-container">
        
        {/* Main Grid */}
        <div className="footer-grid">
          
          {/* Col 1: Real Estate */}
          <div className="footer-col">
            <h3>Real Estate</h3>
            <p>Find your dream property in our exclusive collection of luxury and modern homes.</p>
          </div>

          {/* Col 2: Quick Links */}
          <div className="footer-col">
            <h4>Quick Links</h4>
            <ul>
              <li><Link to="/">Home</Link></li>
              <li><Link to="/properties">Properties</Link></li>
              <li><Link to="/login">Login</Link></li>
              <li><a href="/admin/login">Admin</a></li>
            </ul>
          </div>

          {/* Col 3: Contact Us */}
          <div className="footer-col">
            <h4>Contact Us</h4>
            <ul>
              <li className="contact-item">contact@luxeblue.com</li>
              <li className="contact-item">+1 (555) 123-4567</li>
              <li className="contact-item">123 Sky Blue Ave, Cloud City</li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom-bar">
          
          {/* Logo */}
          <div className="footer-logo" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <img src="/logo.jpg" alt="HomeFind Logo" style={{ width: '28px', height: '28px', borderRadius: '6px', objectFit: 'cover' }} />
            <span className="footer-logo-text">HomeFind</span>
          </div>

          {/* Copyright details */}
          <div className="footer-copyright-text">
            © 2026 HomeFind, a LuxeBlue Company. All properties are subject to prior sale, change or withdrawal without notice. <Link to="/privacy">Privacy Policy</Link> | <Link to="/terms">Terms of Service</Link>
          </div>

          {/* Social Icons */}
          <div className="footer-social-icons">
            <a href="https://facebook.com" target="_blank" rel="noreferrer" className="social-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
            </a>
            <a href="https://twitter.com" target="_blank" rel="noreferrer" className="social-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="social-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>
            </a>
            <a href="https://instagram.com" target="_blank" rel="noreferrer" className="social-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
            </a>
          </div>

        </div>

      </div>
    </footer>
  );
};

export default Footer;

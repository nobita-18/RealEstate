import React, { useState } from 'react';
import { MapPin, Phone, Mail, Send } from 'lucide-react';

const BuyerContact = () => {
  const [sent, setSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <div className="page-container fade-in" style={{ padding: '40px 20px', minHeight: '80vh', maxWidth: '1200px', margin: '0 auto', display: 'flex', gap: '40px', flexWrap: 'wrap' }}>
      
      <div style={{ flex: '1 1 400px' }}>
        <h1 style={{ marginBottom: '20px', fontSize: '2.5rem', color: '#0f172a' }}>Get In Touch</h1>
        <p style={{ color: '#64748b', marginBottom: '40px', fontSize: '1.1rem', lineHeight: '1.6' }}>
          Have questions about a property or need help with your account? Our support team is here to assist you 24/7.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ padding: '15px', background: '#e0e7ff', borderRadius: '50%', color: '#3b82f6' }}><MapPin size={24} /></div>
            <div>
              <h4 style={{ margin: 0, color: '#1e293b' }}>Head Office</h4>
              <p style={{ margin: 0, color: '#64748b' }}>123 Estate Avenue, Chennai, TN</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ padding: '15px', background: '#e0e7ff', borderRadius: '50%', color: '#3b82f6' }}><Phone size={24} /></div>
            <div>
              <h4 style={{ margin: 0, color: '#1e293b' }}>Phone Number</h4>
              <p style={{ margin: 0, color: '#64748b' }}>+91 98765 43210</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ padding: '15px', background: '#e0e7ff', borderRadius: '50%', color: '#3b82f6' }}><Mail size={24} /></div>
            <div>
              <h4 style={{ margin: 0, color: '#1e293b' }}>Email Address</h4>
              <p style={{ margin: 0, color: '#64748b' }}>support@luxeblue.com</p>
            </div>
          </div>
        </div>
      </div>

      <div style={{ flex: '1 1 500px', background: 'rgba(255,255,255,0.9)', padding: '40px', borderRadius: '20px', boxShadow: '0 20px 40px rgba(0,0,0,0.08)' }}>
        {sent ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{ width: '80px', height: '80px', background: '#dcfce7', color: '#22c55e', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <Send size={40} />
            </div>
            <h2>Message Sent!</h2>
            <p style={{ color: '#64748b' }}>We'll get back to you within 24 hours.</p>
            <button onClick={() => setSent(false)} style={{ marginTop: '20px', padding: '10px 20px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Send Another</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h2 style={{ margin: '0 0 10px', color: '#1e293b' }}>Send a Message</h2>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: '#475569', fontWeight: '600' }}>Your Name</label>
              <input type="text" required style={{ width: '100%', padding: '12px 15px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }} placeholder="John Doe" />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: '#475569', fontWeight: '600' }}>Email Address</label>
              <input type="email" required style={{ width: '100%', padding: '12px 15px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }} placeholder="john@example.com" />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: '#475569', fontWeight: '600' }}>Message</label>
              <textarea required rows="5" style={{ width: '100%', padding: '12px 15px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', resize: 'vertical' }} placeholder="How can we help you?"></textarea>
            </div>
            <button type="submit" style={{ padding: '15px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
              <Send size={18} /> Send Inquiry
            </button>
          </form>
        )}
      </div>

    </div>
  );
};

export default BuyerContact;

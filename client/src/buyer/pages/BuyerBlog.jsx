import React from 'react';
import { Calendar, User, ArrowRight } from 'lucide-react';

const BuyerBlog = () => {
  const posts = [
    { id: 1, title: 'Top 5 Emerging Neighborhoods in 2026', author: 'Siva K.', date: 'Jun 10, 2026', snippet: 'Discover the hidden gems in the real estate market that are poised for massive growth this year.' },
    { id: 2, title: 'A First-Time Buyer’s Guide to Mortgages', author: 'Financial Team', date: 'Jun 05, 2026', snippet: 'Navigating loan interest rates, down payments, and securing your dream home without stress.' },
    { id: 3, title: 'Decor Trends: Minimalist Luxury', author: 'Interior Desk', date: 'May 28, 2026', snippet: 'How to furnish your new apartment with a modern, clean, and luxurious aesthetic on a budget.' }
  ];

  return (
    <div className="page-container fade-in" style={{ padding: '40px 20px', minHeight: '80vh', maxWidth: '1000px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '10px', fontSize: '2.5rem', color: '#0f172a' }}>Real Estate Insights</h1>
      <p style={{ color: '#64748b', marginBottom: '40px', fontSize: '1.1rem' }}>Read our latest articles on market trends and buying guides.</p>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
        {posts.map(post => (
          <div key={post.id} style={{ padding: '30px', borderRadius: '15px', background: 'rgba(255, 255, 255, 0.8)', boxShadow: '0 5px 15px rgba(0,0,0,0.03)', border: '1px solid #e2e8f0' }}>
            <h2 style={{ color: '#1e293b', marginBottom: '15px' }}>{post.title}</h2>
            <div style={{ display: 'flex', gap: '20px', color: '#94a3b8', fontSize: '0.9rem', marginBottom: '20px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><User size={16} /> {post.author}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><Calendar size={16} /> {post.date}</span>
            </div>
            <p style={{ color: '#475569', lineHeight: '1.6', marginBottom: '20px' }}>{post.snippet}</p>
            <button style={{ background: 'none', border: 'none', color: '#3b82f6', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', padding: 0 }}>
              Read Full Article <ArrowRight size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BuyerBlog;

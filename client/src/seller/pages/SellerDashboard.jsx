import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import SellerProfile from './SellerProfile';
import { 
  Home, Plus, Edit2, Eye, Trash2, Settings, List, 
  MessageSquare, Star, Bell, Users, FileText, LogOut,
  ChevronDown, ChevronUp, Check, X, ArrowUp
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import './SellerDashboard.css';
import { getAssetUrl, getSafeLocalStorage } from '../../api';

const fallbacks = [
  '/images/default/no-image.png',
];

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#64748b'];

const makeString = (val) => {
  if (Array.isArray(val)) {
    return val.filter(Boolean)[0] || '';
  }
  return typeof val === 'string' ? val : String(val || '');
};

const SellerDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const sellerUser = getSafeLocalStorage('sellerUser');
  
  const getFilteredNotifications = (notifs) => {
    return (notifs || []).filter(notif => 
      notif.message && (notif.message.includes('APPROVED') || notif.message.includes('REJECTED') || notif.message.includes('DELETED'))
    );
  };
  
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isPropertyMenuOpen, setIsPropertyMenuOpen] = useState(false);
  
  const [properties, setProperties] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [users, setUsers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [sellerProfile, setSellerProfile] = useState(sellerUser || null);
  const [selectedPropertyId, setSelectedPropertyId] = useState(null);

  // Registration success modal states
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [registeredName, setRegisteredName] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('registered') === 'true') {
      setRegisteredName(params.get('name') || 'Seller');
      setShowRegisterModal(true);
    }
  }, []);

  const handleCloseModal = () => {
    setShowRegisterModal(false);
    navigate('/dashboard', { replace: true });
  };

  useEffect(() => {
    if (location.state && location.state.tab) {
      if (location.state.tab === 'settings' || location.state.tab === 'profile') {
        setActiveTab('profile');
      } else {
        setActiveTab(location.state.tab);
      }
    }
  }, [location]);

  useEffect(() => {
    if (!sellerUser || sellerUser.role !== 'seller') {
      navigate('/login');
      return;
    }
    fetchData();
  }, [sellerUser?.id]);

  const fetchData = async () => {
    try {
      // Fetch Properties
      const propsRes = await axios.get((window.API_BASE_URL || 'https://realestatelisting-u2kp.onrender.com') + '/api/properties?status=all');
      const myProps = propsRes.data.filter(p => String(p.ownerId) === String(sellerUser.id));
      setProperties(myProps);

      // Fetch Inquiries (Messages)
      // Since enquiries endpoint doesn't filter by owner on the backend easily yet,
      // we fetch all and filter where propertyId matches myProps
      const inqRes = await axios.get((window.API_BASE_URL || 'https://realestatelisting-u2kp.onrender.com') + '/api/enquiries');
      const myPropIds = myProps.map(p => String(p.id));
      const myInquiries = inqRes.data.filter(i => myPropIds.includes(String(i.propertyId)));
      setInquiries(myInquiries.sort((a, b) => new Date(b.date) - new Date(a.date)));

      // Fetch Users for Buyer Profiles
      const userRes = await axios.get((window.API_BASE_URL || 'https://realestatelisting-u2kp.onrender.com') + '/api/users');
      setUsers(userRes.data.filter(u => u.role === 'buyer'));

      // Fetch Bookings/Transactions
      const transRes = await axios.get((window.API_BASE_URL || 'https://realestatelisting-u2kp.onrender.com') + '/api/bookings');
      setTransactions(transRes.data.filter(t => myPropIds.includes(String(t.propertyId))));

      // Fetch Seller Profile to get real-time notifications
      if (sellerUser && sellerUser.id) {
        const sellerProfileRes = await axios.get(`${window.API_BASE_URL || "https://realestatelisting-u2kp.onrender.com"}/api/users/${sellerUser.id}`);
        setSellerProfile(sellerProfileRes.data);
      }

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('sellerToken');
    localStorage.removeItem('sellerUser');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    window.location.href = '/buyer/';
  };

  const handleSelectNotifications = async () => {
    setActiveTab('notifications');
    const filteredNotifs = getFilteredNotifications(sellerProfile?.notifications);
    if (filteredNotifs.some(n => !n.read)) {
      const updatedNotifs = sellerProfile.notifications.map(n => {
        const isFiltered = n.message && (n.message.includes('REJECTED') || n.message.includes('DELETED'));
        if (isFiltered) {
          return { ...n, read: true };
        }
        return n;
      });
      const updatedProfile = { ...sellerProfile, notifications: updatedNotifs };
      setSellerProfile(updatedProfile);
      try {
        await axios.put(`${window.API_BASE_URL || "https://realestatelisting-u2kp.onrender.com"}/api/users/${sellerUser.id}`, { notifications: updatedNotifs });
      } catch (err) {
        console.error("Failed to mark notifications as read on server:", err);
      }
    }
  };

  // Stats
  const liveCount = properties.filter(p => p.status === 'approved').length;
  const waitingCount = properties.filter(p => p.status === 'pending' || p.hasPendingChanges === true || p.status === 'pending_delete').length;
  const rejectedCount = properties.filter(p => p.status === 'rejected').length;

  // Gather all reviews for properties owned by this seller
  const allReviews = [];
  properties.forEach(p => {
    if (p.reviews && p.reviews.length > 0) {
      p.reviews.forEach(r => {
        allReviews.push({
          ...r,
          propertyId: p.id,
          propertyTitle: p.title
        });
      });
    }
  });
  allReviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  // Chart Data (Mocked realistically based on requests)
  const viewsData = [
    { name: 'May 1', views: 300 },
    { name: 'May 7', views: 500 },
    { name: 'May 14', views: 400 },
    { name: 'May 21', views: 700 },
    { name: 'May 28', views: 550 },
  ];

  const pieData = properties.slice(0, 5).map((p, i) => ({
    name: makeString(p.title).substring(0, 15) + '...',
    value: p.views || 0
  }));

  // Render Sidebar
  const renderSidebar = () => (
    <aside className="sd-sidebar">
      <div className="sd-brand">
        <Home className="sd-brand-icon" size={24} />
        <div>
          HomeFind
          <span className="sd-brand-sub">Seller Dashboard</span>
        </div>
      </div>

      <div className="sd-menu-group">
        <button className={`sd-menu-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
          <div className="sd-menu-item-inner"><Home size={18} /> Dashboard</div>
        </button>
      </div>

      <div className="sd-menu-section">
        <div className="sd-menu-section-title" onClick={() => setIsPropertyMenuOpen(!isPropertyMenuOpen)}>
          PROPERTY DETAILS
          {isPropertyMenuOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </div>
        {isPropertyMenuOpen && (
          <div className="sd-submenu">
            <button className={`sd-submenu-item`} onClick={() => navigate('/add-property')}>
              <Plus size={16} /> Add Property
            </button>
            <button className={`sd-submenu-item ${activeTab === 'edit-property' ? 'active' : ''}`} onClick={() => setActiveTab('edit-property')}>
              <Edit2 size={16} /> Edit Property
            </button>
            <button className={`sd-submenu-item ${activeTab === 'view-property' ? 'active' : ''}`} onClick={() => setActiveTab('view-property')}>
              <Eye size={16} /> View Property
            </button>
            <button className={`sd-submenu-item ${activeTab === 'delete-property' ? 'active' : ''}`} onClick={() => setActiveTab('delete-property')}>
              <Trash2 size={16} /> Delete Property
            </button>
          </div>
        )}
      </div>

      <div className="sd-menu-group" style={{ marginTop: '16px' }}>
        <button className={`sd-menu-item ${activeTab === 'product-details' ? 'active' : ''}`} onClick={() => setActiveTab('product-details')}>
          <div className="sd-menu-item-inner"><List size={18} /> Product Details</div>
          <span className="sd-badge">{properties.length}</span>
        </button>
        <button className={`sd-menu-item ${activeTab === 'messages' ? 'active' : ''}`} onClick={() => setActiveTab('messages')}>
          <div className="sd-menu-item-inner"><MessageSquare size={18} /> Messages</div>
          {inquiries.length > 0 && <span className="sd-badge">{inquiries.length}</span>}
        </button>
        <button className={`sd-menu-item ${activeTab === 'reviews' ? 'active' : ''}`} onClick={() => setActiveTab('reviews')}>
          <div className="sd-menu-item-inner"><Star size={18} /> Reviews</div>
        </button>
        <button className={`sd-menu-item ${activeTab === 'notifications' ? 'active' : ''}`} onClick={handleSelectNotifications}>
          <div className="sd-menu-item-inner" style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Bell size={18} /> Notifications</span>
            {getFilteredNotifications(sellerProfile?.notifications).filter(n => !n.read).length > 0 && (
              <span className="sd-badge" style={{ margin: 0 }}>
                {getFilteredNotifications(sellerProfile?.notifications).filter(n => !n.read).length}
              </span>
            )}
          </div>
        </button>
        <button className={`sd-menu-item ${activeTab === 'buyer-profiles' ? 'active' : ''}`} onClick={() => setActiveTab('buyer-profiles')}>
          <div className="sd-menu-item-inner"><Users size={18} /> Buyer Profiles</div>
        </button>
        <button className={`sd-menu-item ${activeTab === 'transactions' ? 'active' : ''}`} onClick={() => setActiveTab('transactions')}>
          <div className="sd-menu-item-inner"><FileText size={18} /> Transaction Details</div>
        </button>
        <button className={`sd-menu-item ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>
          <div className="sd-menu-item-inner"><Settings size={18} /> Profile & Settings</div>
        </button>
      </div>

      <div className="sd-logout-container">
        <button className="sd-menu-item" onClick={handleLogout}>
          <div className="sd-menu-item-inner"><LogOut size={18} /> Logout</div>
        </button>
      </div>
    </aside>
  );

  const renderDashboard = () => (
    <>
      <div className="sd-cards-grid">
        <div className="sd-card">
          <div className="sd-card-header">
            <div>
              <h3 className="sd-card-title">Total Properties</h3>
              <p className="sd-card-value">{properties.length}</p>
            </div>
            <div className="sd-card-icon blue"><Home size={20} /></div>
          </div>
          <div className="sd-card-footer">All your listed properties</div>
        </div>
        <div className="sd-card">
          <div className="sd-card-header">
            <div>
              <h3 className="sd-card-title live">Live Properties</h3>
              <p className="sd-card-value">{liveCount}</p>
            </div>
            <div className="sd-card-icon green"><Check size={20} /></div>
          </div>
          <div className="sd-card-footer">Properties live on site</div>
        </div>
        <div className="sd-card">
          <div className="sd-card-header">
            <div>
              <h3 className="sd-card-title waiting">Waiting Approval</h3>
              <p className="sd-card-value">{waitingCount}</p>
            </div>
            <div className="sd-card-icon orange"><Settings size={20} /></div>
          </div>
          <div className="sd-card-footer">Under review</div>
        </div>
        <div className="sd-card">
          <div className="sd-card-header">
            <div>
              <h3 className="sd-card-title rejected">Rejected Properties</h3>
              <p className="sd-card-value">{rejectedCount}</p>
            </div>
            <div className="sd-card-icon red"><X size={20} /></div>
          </div>
          <div className="sd-card-footer">Not approved</div>
        </div>
      </div>

      <div className="sd-row-2">
        <div className="sd-panel">
          <div className="sd-panel-header">
            <h2 className="sd-panel-title">Your Properties</h2>
            <a href="#" className="sd-view-all" onClick={() => setActiveTab('view-property')}>View All</a>
          </div>
          <table className="sd-table">
            <thead>
              <tr>
                <th>Property</th>
                <th>Location</th>
                <th>Price</th>
                <th>Status</th>
                <th>Views</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {properties.slice(0, 4).map(prop => (
                <tr key={prop.id}>
                  <td>
                    <div className="sd-prop-cell">
                      <img 
                        src={prop.images && prop.images[0] ? getAssetUrl(prop.images[0]) : fallbacks[0]} 
                        alt="" 
                        className="sd-prop-img" 
                        onError={(e) => { e.target.onerror = null; e.target.src = fallbacks[0]; }}
                      />
                      <div>
                        <p className="sd-prop-name">{makeString(prop.title).substring(0, 20)}...</p>
                        <p className="sd-prop-id">ID: HF{prop.id}</p>
                      </div>
                    </div>
                  </td>
                  <td>{makeString(prop.location).substring(0, 15)}</td>
                  <td>₹{Number(prop.price || 0).toLocaleString('en-IN')}</td>
                  <td>
                    <span className={`sd-status ${prop.status === 'approved' ? 'live' : (prop.status === 'pending' || prop.status === 'pending_delete') ? 'pending' : prop.status === 'deleted' ? 'deleted' : 'rejected'}`}>
                      {prop.status === 'approved' 
                        ? (prop.hasPendingChanges ? 'Live (Edit Pending)' : 'Live') 
                        : prop.status === 'pending_delete' 
                          ? 'Pending Deletion' 
                          : prop.status === 'pending' 
                            ? 'Pending' 
                            : prop.status === 'deleted' 
                              ? 'Deleted' 
                              : 'Rejected'}
                    </span>
                  </td>
                  <td>{prop.views || 0}</td>
                  <td>
                    <div className="sd-actions">
                      <button className="sd-action-btn" onClick={() => { setSelectedPropertyId(prop.id); setActiveTab('view-property-detail'); }}><Eye size={14} /></button>
                      {prop.status !== 'deleted' && (
                        <>
                          <button className="sd-action-btn" onClick={() => navigate(`/edit-property/${prop.id}`)}><Edit2 size={14} /></button>
                          <button className="sd-action-btn" onClick={() => handlePropertyAction('delete', prop)}><Trash2 size={14} /></button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="sd-panel">
          <div className="sd-panel-header">
            <h2 className="sd-panel-title">Messages</h2>
            <a href="#" className="sd-view-all" onClick={() => setActiveTab('messages')}>View All</a>
          </div>
          <div className="sd-messages">
            {inquiries.slice(0, 2).map((inq, idx) => (
              <div key={idx} className="sd-msg-item">
                <div className="sd-msg-header">
                  <div className="sd-msg-avatar">{(inq.name || inq.userName || 'Anonymous').charAt(0)}</div>
                  <div className="sd-msg-meta" style={{flex: 1}}>
                    <h4>{inq.name || inq.userName || 'Anonymous'} <span className="sd-msg-tag">New</span> <span className="sd-msg-time">{inq.date ? new Date(inq.date).toLocaleDateString() : 'N/A'}</span></h4>
                    <p className="sd-msg-contact">{inq.email || inq.userEmail || 'N/A'} <br/> {inq.mobile || inq.userMobile || 'N/A'}</p>
                    <p className="sd-msg-text">I am interested in Property ID {inq.propertyId}. Please contact me.</p>
                    <button className="sd-btn-reply">Reply</button>
                  </div>
                </div>
              </div>
            ))}
            {inquiries.length === 0 && <p style={{color: '#64748b'}}>No recent messages.</p>}
          </div>
        </div>
      </div>

      <div className="sd-row-3">
        <div className="sd-panel">
          <h2 className="sd-panel-title" style={{marginBottom: '20px'}}>Property Views (Analytics)</h2>
          <div className="sd-chart-stat">
            <p className="sd-chart-stat-val">2,450</p>
            <p className="sd-chart-stat-trend"><ArrowUp size={14}/> 18% from last month</p>
          </div>
          <div style={{height: '200px'}}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={viewsData}>
                <defs>
                  <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                <Tooltip />
                <Area type="monotone" dataKey="views" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorViews)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="sd-panel">
          <h2 className="sd-panel-title" style={{marginBottom: '20px'}}>Views by Property (Top 5)</h2>
          <div style={{height: '250px', width: '100%'}}>
            {properties.length === 0 || pieData.reduce((sum, item) => sum + item.value, 0) === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#64748b', fontSize: '0.9rem', textAlign: 'center', gap: '8px' }}>
                <div style={{ width: '120px', height: '120px', borderRadius: '50%', border: '6px dashed #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', color: '#94a3b8' }}>
                  0 Views
                </div>
                <span style={{ fontWeight: '500', color: '#64748b' }}>No property views recorded yet</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{fontSize: '12px', paddingTop: '10px'}}/>
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="sd-panel">
          <div className="sd-panel-header">
            <h2 className="sd-panel-title">Reviews</h2>
            <a href="#" className="sd-view-all" onClick={() => setActiveTab('reviews')}>View All</a>
          </div>
          <div className="sd-messages">
            {allReviews.slice(0, 2).map((rev, idx) => (
              <div key={idx} className="sd-msg-item">
                <div className="sd-msg-header">
                  <div className="sd-msg-avatar" style={{background: COLORS[idx % COLORS.length]}}>{(rev.userName || 'Anonymous').charAt(0)}</div>
                  <div className="sd-msg-meta" style={{flex: 1}}>
                    <h4>{rev.userName || 'Anonymous'} <span className="sd-msg-time">{new Date(rev.createdAt).toLocaleDateString()}</span></h4>
                    <div style={{color: '#f59e0b', margin: '4px 0'}}>{'★'.repeat(rev.rating) + '☆'.repeat(5 - rev.rating)}</div>
                    <p className="sd-msg-text">{rev.comment}</p>
                    <span className="sd-msg-tag" style={{background: '#eff6ff', color: '#3b82f6'}}>Property: {makeString(rev.propertyTitle)}</span>
                  </div>
                </div>
              </div>
            ))}
            {allReviews.length === 0 && <p style={{color: '#64748b'}}>No property reviews recorded yet.</p>}
          </div>
        </div>
      </div>

      <div className="sd-row-2" style={{gridTemplateColumns: '1fr 1fr'}}>
        <div className="sd-panel">
          <div className="sd-panel-header">
            <h2 className="sd-panel-title">Recent Buyer Inquiries</h2>
          </div>
          <table className="sd-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Mobile</th>
                <th>Location/City</th>
                <th>Property ID</th>
              </tr>
            </thead>
            <tbody>
              {inquiries.slice(0, 3).map((inq, idx) => (
                <tr key={idx}>
                  <td style={{fontWeight: 600}}>{inq.name || inq.userName || 'Anonymous'}</td>
                  <td>{inq.mobile || inq.userMobile || 'N/A'}</td>
                  <td>{inq.city || inq.userCity || 'Unknown'}</td>
                  <td>HF{inq.propertyId}</td>
                </tr>
              ))}
              {inquiries.length === 0 && <tr><td colSpan="4">No inquiries yet.</td></tr>}
            </tbody>
          </table>
        </div>

        <div className="sd-panel">
          <div className="sd-panel-header">
            <h2 className="sd-panel-title">Transaction Details (Recent)</h2>
            <a href="#" className="sd-view-all" onClick={() => setActiveTab('transactions')}>View All</a>
          </div>
          <table className="sd-table">
            <thead>
              <tr>
                <th>Property</th>
                <th>Buyer</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {transactions.slice(0, 3).map((txn, idx) => (
                <tr key={idx}>
                  <td style={{fontWeight: 600}}>HF{txn.propertyId}</td>
                  <td>User #{txn.buyerId}</td>
                  <td>₹{txn.billingAmount?.toLocaleString('en-IN') || 'N/A'}</td>
                  <td><span className={`sd-status ${txn.status === 'paid' ? 'completed' : 'pending'}`}>{txn.status || 'Pending'}</span></td>
                </tr>
              ))}
              {transactions.length === 0 && <tr><td colSpan="4">No transactions yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );


  const renderSimpleTable = (title, cols, dataRender) => (
    <div className="sd-panel">
      <h2 className="sd-panel-title" style={{marginBottom: '24px'}}>{title}</h2>
      <table className="sd-table">
        <thead>
          <tr>{cols.map((c, i) => <th key={i}>{c}</th>)}</tr>
        </thead>
        <tbody>
          {dataRender()}
        </tbody>
      </table>
    </div>
  );

  const [searchQuery, setSearchQuery] = useState('');

  const handlePropertyAction = async (action, prop) => {
    if (action === 'delete') {
      const reason = await window.customPrompt('Enter reason for deletion request:');
      if (reason === null) return; // Cancel clicked
      if (!reason.trim()) {
        await window.customAlert('A reason is required to request deletion!');
        return;
      }
      try {
        await axios.put(`${window.API_BASE_URL || "https://realestatelisting-u2kp.onrender.com"}/api/properties/${prop.id}/delete-request`, { reason });
        await window.customAlert('Deletion request sent to admin for approval!');
        fetchData();
      } catch (err) {
        console.error(err);
        await window.customAlert('Failed to send deletion request.');
      }
    } else if (action === 'edit' || action === 'modify') {
      navigate(`/edit-property/${prop.id}`);
    } else if (action === 'view') {
      setSelectedPropertyId(prop.id);
      setActiveTab('view-property-detail');
    } else {
      await window.customAlert(`Action ${action} is not fully implemented yet.`);
    }
  };

  const renderManageProperties = (mode) => {
    const filteredProps = properties.filter(p => 
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      p.location.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
      <div className="sd-panel">
        <div className="sd-panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 className="sd-panel-title">{mode.charAt(0).toUpperCase() + mode.slice(1)} Properties</h2>
          <input 
            type="text" 
            placeholder="Search properties..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', outline: 'none' }}
          />
        </div>
        <table className="sd-table">
          <thead>
            <tr>
              <th>Property</th>
              <th>Location</th>
              <th>Price</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredProps.map(p => (
              <tr key={p.id}>
                <td>
                  <div className="sd-prop-cell">
                    <img 
                      src={p.images && p.images[0] ? getAssetUrl(p.images[0]) : fallbacks[0]} 
                      alt="" 
                      className="sd-prop-img"
                      onError={(e) => { e.target.onerror = null; e.target.src = fallbacks[0]; }}
                    />
                    <div>
                      <p className="sd-prop-name">{makeString(p.title).substring(0, 20)}...</p>
                      <p className="sd-prop-id">ID: HF{p.id}</p>
                    </div>
                  </div>
                </td>
                <td>{makeString(p.location) || 'N/A'}</td>
                <td>₹{Number(p.price || 0).toLocaleString('en-IN')}</td>
                <td><span className={`sd-status ${p.status === 'approved' ? 'live' : (p.status === 'pending' || p.status === 'pending_delete') ? 'pending' : p.status === 'deleted' ? 'deleted' : 'rejected'}`}>
                  {p.status === 'approved' 
                    ? (p.hasPendingChanges ? 'Live (Edit Pending)' : 'Live') 
                    : p.status === 'pending_delete' 
                      ? 'Pending Deletion' 
                      : p.status === 'pending' 
                        ? 'Pending' 
                        : p.status === 'deleted' 
                          ? 'Deleted' 
                          : 'Rejected'}
                </span></td>
                <td>
                  {p.status === 'deleted' ? (
                    <span style={{ color: '#94a3b8', fontSize: '0.9rem', fontStyle: 'italic' }}>N/A</span>
                  ) : (
                    <button 
                      className="sd-btn-primary" 
                      style={{padding: '6px 12px', fontSize: '0.8rem', background: mode === 'delete' ? '#ef4444' : '#3b82f6'}}
                      onClick={() => handlePropertyAction(mode, p)}
                    >
                      {mode.toUpperCase()}
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {filteredProps.length === 0 && <tr><td colSpan="5">No properties match your filter.</td></tr>}
          </tbody>
        </table>
      </div>
    );
  };

  const renderViewContent = () => {
    switch (activeTab) {
      case 'dashboard': return renderDashboard();
      case 'edit-property': return renderManageProperties('edit');
      case 'view-property': return renderManageProperties('view');
      case 'delete-property': return renderManageProperties('delete');
      case 'view-property-detail': return renderPropertyDetail();
      case 'product-details':
        return (
          <div className="sd-panel">
            <h2 className="sd-panel-title" style={{marginBottom: '24px'}}>Product Details & Metrics</h2>
            <div className="sd-cards-grid">
              <div className="sd-card"><div className="sd-card-header"><h3 className="sd-card-title">Total</h3><p className="sd-card-value">{properties.length}</p></div></div>
              <div className="sd-card"><div className="sd-card-header"><h3 className="sd-card-title live">Approved</h3><p className="sd-card-value">{liveCount}</p></div></div>
              <div className="sd-card"><div className="sd-card-header"><h3 className="sd-card-title rejected">Rejected</h3><p className="sd-card-value">{rejectedCount}</p></div></div>
              <div className="sd-card"><div className="sd-card-header"><h3 className="sd-card-title waiting">User Clicks/Enquiries</h3><p className="sd-card-value">{inquiries.length}</p></div></div>
            </div>
          </div>
        );
      case 'messages':
        return renderSimpleTable('Messages & Inquiries', ['Date', 'Buyer Name', 'Email', 'Mobile', 'Property ID'], () => (
          inquiries.map(inq => (
            <tr key={inq.id}>
              <td>{inq.date ? new Date(inq.date).toLocaleDateString() : 'N/A'}</td>
              <td>{inq.name || inq.userName || 'Anonymous'}</td>
              <td>{inq.email || inq.userEmail || 'N/A'}</td>
              <td>{inq.mobile || inq.userMobile || 'N/A'}</td>
              <td>HF{inq.propertyId}</td>
            </tr>
          ))
        ));
      case 'buyer-profiles':
        return renderSimpleTable('Buyer Profiles', ['Buyer ID', 'Name', 'Email', 'Role'], () => (
          users.map(u => (
            <tr key={u.id}>
              <td>{u.id}</td>
              <td>{u.name || u.username}</td>
              <td>{u.email}</td>
              <td>{u.role}</td>
            </tr>
          ))
        ));
      case 'transactions':
        return renderSimpleTable('Transaction Details', ['Property ID', 'Buyer ID', 'Amount', 'Status'], () => (
          transactions.map(t => (
            <tr key={t.id}>
              <td>HF{t.propertyId}</td>
              <td>{t.buyerId}</td>
              <td>₹{t.billingAmount}</td>
              <td><span className={`sd-status ${t.status === 'paid' ? 'completed' : 'pending'}`}>{t.status}</span></td>
            </tr>
          ))
        ));
      case 'profile':
        return <SellerProfile isDashboardView={true} initialProfile={sellerProfile} onProfileUpdate={fetchData} />;
      case 'reviews':
        return renderSimpleTable('Property Reviews', ['Date', 'Buyer Name', 'Rating', 'Property', 'Comment'], () => (
          allReviews.length === 0 ? (
            <tr><td colSpan="5" style={{textAlign: 'center', color: '#64748b'}}>No property reviews recorded yet.</td></tr>
          ) : (
            allReviews.map((rev, idx) => (
              <tr key={idx}>
                <td>{new Date(rev.createdAt).toLocaleDateString()}</td>
                <td>{rev.userName || 'Anonymous'}</td>
                <td style={{color: '#f59e0b', fontWeight: 'bold'}}>{'★'.repeat(rev.rating) + '☆'.repeat(5 - rev.rating)}</td>
                <td>{makeString(rev.propertyTitle)} (ID: HF{rev.propertyId})</td>
                <td style={{maxWidth: '300px', wordBreak: 'break-word'}}>{rev.comment}</td>
              </tr>
            ))
          )
        ));
      case 'notifications':
        const filteredNotifs = getFilteredNotifications(sellerProfile?.notifications);
        const sortedNotifs = [...filteredNotifs].sort((a, b) => new Date(b.date) - new Date(a.date));
        return (
          <div className="sd-panel">
            <h2 className="sd-panel-title" style={{ marginBottom: '24px' }}>Notifications</h2>
            <div className="sd-notifications-container">
              {sortedNotifs.map((notif, idx) => {
                let typeClass = 'deleted';
                if (notif.message.includes('APPROVED')) typeClass = 'approved';
                else if (notif.message.includes('REJECTED')) typeClass = 'rejected';

                let title = 'ℹ️ Property Deleted';
                if (notif.message.includes('APPROVED')) title = '✅ Property Approved';
                else if (notif.message.includes('REJECTED')) title = '❌ Property Rejected';

                return (
                  <div key={idx} className={`sd-notification-item ${typeClass}`}>
                    <div className="sd-notification-header">
                      <span className="sd-notification-title">{title}</span>
                      <span className="sd-notification-time">
                        {new Date(notif.date).toLocaleString()}
                      </span>
                    </div>
                    <p className="sd-notification-message">{notif.message}</p>
                    {notif.reason && (
                      <div className="sd-notification-reason-box">
                        <strong>Reason:</strong> {notif.reason}
                      </div>
                    )}
                  </div>
                );
              })}
              {sortedNotifs.length === 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', color: '#64748b' }}>
                  <Bell size={48} color="#cbd5e1" style={{ marginBottom: '16px' }}/>
                  <h3 style={{ color: '#64748b', margin: 0 }}>No new notifications at this time.</h3>
                </div>
              )}
            </div>
          </div>
        );
      default:
        return renderDashboard();
    }
  };

  const renderPropertyDetail = () => {
    const prop = properties.find(p => p.id === selectedPropertyId);
    if (!prop) return <div className="sd-panel"><p>Property not found.</p></div>;

    return (
      <div className="sd-panel fade-in" style={{ padding: '30px' }}>
        <button 
          className="sd-btn-primary" 
          onClick={() => setActiveTab('dashboard')} 
          style={{ width: 'auto', display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', marginBottom: '20px', background: '#475569' }}
        >
          &larr; Back to Dashboard
        </button>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #e2e8f0', paddingBottom: '15px' }}>
            <div>
              <h2 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#1e293b', margin: '0 0 5px 0' }}>{prop.title}</h2>
              <p style={{ color: '#64748b', margin: 0 }}>ID: HF{prop.id} | Type: {prop.propertyType} | Status: <span className={`sd-status ${prop.status === 'approved' ? 'live' : (prop.status === 'pending' || prop.status === 'pending_delete') ? 'pending' : prop.status === 'deleted' ? 'deleted' : 'rejected'}`}>
                {prop.status === 'approved' 
                  ? (prop.hasPendingChanges ? 'Live (Edit Pending)' : 'Live') 
                  : prop.status === 'pending_delete' 
                    ? 'Pending Deletion' 
                    : prop.status === 'pending' 
                      ? 'Pending' 
                      : prop.status === 'deleted'
                        ? 'Deleted'
                        : 'Rejected'}
              </span></p>
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#3b82f6' }}>
              ₹{Number(prop.price || 0).toLocaleString('en-IN')}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
            {/* Left side: Images */}
            <div>
              <div style={{ width: '100%', height: '300px', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0', marginBottom: '15px' }}>
                <img 
                  src={prop.images && prop.images[0] ? getAssetUrl(prop.images[0]) : fallbacks[0]} 
                  alt="" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => { e.target.onerror = null; e.target.src = fallbacks[0]; }}
                />
              </div>
              {prop.images && prop.images.length > 1 && (
                <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '5px' }}>
                  {prop.images.map((img, idx) => (
                    <img 
                      key={idx} 
                      src={getAssetUrl(img)} 
                      alt="" 
                      style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #cbd5e1', cursor: 'pointer' }}
                      onError={(e) => { e.target.onerror = null; e.target.src = fallbacks[0]; }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Right side: Parameters */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div className="glass" style={{ padding: '20px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#334155' }}>Property Specifications</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 20px', fontSize: '0.9rem' }}>
                  <div><strong>Address:</strong> {prop.address || 'N/A'}</div>
                  <div><strong>City/State:</strong> {prop.city || 'N/A'}, {prop.state || 'N/A'}</div>
                  <div><strong>Pincode:</strong> {prop.pincode || 'N/A'}</div>
                  <div><strong>Mobile:</strong> {prop.mobile || 'N/A'}</div>
                  <div><strong>Email:</strong> {prop.email || 'N/A'}</div>
                  {prop.propertyType === 'House' && (
                    <>
                      <div><strong>Bedrooms:</strong> {prop.bedrooms || '1'}</div>
                      <div><strong>Bathrooms:</strong> {prop.bathrooms || '1'}</div>
                      <div><strong>Built-up Area:</strong> {prop.builtupArea || prop.area || 'N/A'} sqft</div>
                      <div><strong>Parking Spaces:</strong> {prop.parkingSpaces || '1'}</div>
                    </>
                  )}
                  {prop.propertyType === 'Penthouse' && (
                    <>
                      <div><strong>Floor Number:</strong> {prop.floorNumber || 'N/A'}</div>
                      <div><strong>Terrace Area:</strong> {prop.terraceArea || 'N/A'} sqft</div>
                    </>
                  )}
                  {prop.propertyType === 'Villa' && (
                    <>
                      <div><strong>Land Area:</strong> {prop.landArea || 'N/A'} sqft</div>
                      <div><strong>Parking Spaces:</strong> {prop.parkingSpaces || '1'}</div>
                    </>
                  )}
                  {prop.propertyType === 'PG' && (
                    <>
                      <div><strong>Security Deposit:</strong> ₹{prop.securityDeposit || 'N/A'}</div>
                      <div><strong>PG Type:</strong> {prop.pgType || 'Boys'}</div>
                      <div><strong>Sharing:</strong> {prop.sharingType || '1 Sharing'}</div>
                      <div><strong>Beds:</strong> {prop.numberOfBeds || 'N/A'}</div>
                      <div><strong>Food Available:</strong> {prop.foodAvailable ? 'Yes' : 'No'}</div>
                    </>
                  )}
                  {prop.propertyType === 'Land' && (
                    <>
                      <div><strong>Land Area:</strong> {prop.landArea || prop.area || 'N/A'} sqft</div>
                      <div><strong>Plot/Survey:</strong> {prop.plotNumber || 'N/A'} / {prop.surveyNumber || 'N/A'}</div>
                    </>
                  )}
                </div>
              </div>

              <div>
                <h4 style={{ margin: '0 0 5px 0', color: '#334155' }}>Description</h4>
                <p style={{ fontSize: '0.9rem', color: '#475569', lineHeight: '1.4', margin: 0 }}>{prop.description}</p>
              </div>

              {prop.status !== 'deleted' && (
                <div style={{ display: 'flex', gap: '15px', marginTop: '15px' }}>
                  <button 
                    className="sd-btn-primary" 
                    onClick={() => navigate(`/edit-property/${prop.id}`)}
                    style={{ flex: 1, padding: '10px', fontSize: '0.95rem' }}
                  >
                    Edit Property
                  </button>
                  <button 
                    className="sd-btn-primary" 
                    onClick={() => handlePropertyAction('delete', prop)}
                    style={{ flex: 1, padding: '10px', fontSize: '0.95rem', background: '#ef4444' }}
                  >
                    Request Deletion
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`sd-layout fade-in ${showRegisterModal ? 'modal-open-blur' : ''}`}>
      {showRegisterModal && (
        <div className="registration-success-overlay">
          <div className="registration-success-modal">
            {/* Confetti celebration container */}
            <div className="confetti-container">
              <div className="confetti-popper popper-left">🎉</div>
              <div className="confetti-popper popper-right">🎉</div>
              {[...Array(12)].map((_, i) => (
                <div key={i} className={`confetti-piece color-${i % 4} piece-${i}`}></div>
              ))}
            </div>

            {/* Checkmark circle */}
            <div className="success-checkmark-circle">
              <div className="success-checkmark-inner">
                <Check size={28} strokeWidth={3} />
              </div>
            </div>

            {/* Modal Heading */}
            <h2 className="success-title">Registration Successful!</h2>
            <p className="success-subtitle">Welcome to DreamHomes Real Estate Portal</p>

            {/* Role details box */}
            <div className="success-role-card">
              <div className="success-role-avatar">
                <Users size={20} className="success-avatar-icon" />
              </div>
              <div className="success-role-details">
                <div className="detail-row">
                  <span className="detail-label">Role</span>
                  <span className="detail-separator">:</span>
                  <span className="detail-value role-highlight">Seller</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">User Name</span>
                  <span className="detail-separator">:</span>
                  <span className="detail-value name-highlight">{registeredName}</span>
                </div>
              </div>
            </div>

            {/* Modal helper text */}
            <p className="success-thankyou">Thank you for joining us.</p>
            <p className="success-explore">You can now start listing your properties.</p>

            {/* Action button */}
            <button className="success-home-btn" onClick={handleCloseModal}>
              <Home size={18} /> Go to Dashboard
            </button>
          </div>
        </div>
      )}
      {renderSidebar()}
      <main className="sd-main">
        <header className="sd-header">
          <div className="sd-welcome">
            <h1>Welcome back, Seller!</h1>
            <p>Here's what's happening with your properties.</p>
          </div>
          <div className="sd-header-actions">
            <button className="sd-btn-primary" onClick={() => navigate('/add-property')}>
              <Plus size={18} /> Add Property
            </button>
            <div className="sd-user-profile" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('profile')}>
              <img 
                src={getAssetUrl(sellerProfile?.photo) || '/images/default/default-avatar.jpg'} 
                alt="Seller" 
                className="sd-user-avatar" 
                onError={(e) => { e.target.onerror = null; e.target.src = '/images/default/default-avatar.jpg'; }}
              />
              <div className="sd-user-info">
                <span className="sd-user-name">{sellerProfile?.name || sellerUser?.name || 'Seller Name'}</span>
                <span className="sd-user-email">{sellerProfile?.email || sellerUser?.email || 'seller@email.com'}</span>
              </div>
            </div>
          </div>
        </header>

        {renderViewContent()}
      </main>
    </div>
  );
};

export default SellerDashboard;

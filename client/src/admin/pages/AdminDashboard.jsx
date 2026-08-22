import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ShieldCheck, Activity, CheckCircle, XCircle, Trash2, Users, Eye, EyeOff, Info, UserCheck, UserX, X, BarChart } from 'lucide-react';
import { ResponsiveContainer, BarChart as ReChartsBarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import './AdminLogin.css'; 
import { getSafeLocalStorage } from '../../api'; 

const CustomUserTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div style={{
        background: '#111',
        border: '1px solid #00ff80',
        padding: '10px 14px',
        borderRadius: '6px',
        fontFamily: 'monospace',
        color: '#fff',
        fontSize: '0.85rem',
        boxShadow: '0 4px 12px rgba(0,0,0,0.6)'
      }}>
        <p style={{ margin: '0 0 6px 0', color: '#00ff80', fontWeight: 'bold', fontSize: '0.9rem', borderBottom: '1px solid #333', paddingBottom: '3px' }}>
          {data.name.toUpperCase()} STATUS
        </p>
        <p style={{ margin: '4px 0', display: 'flex', justifyContent: 'space-between', gap: '15px' }}>
          <span style={{ color: '#aaa' }}>Total Count:</span>
          <strong style={{ color: '#fff' }}>{data.count}</strong>
        </p>
        <p style={{ margin: '4px 0', display: 'flex', justifyContent: 'space-between', gap: '15px' }}>
          <span style={{ color: '#aaa' }}>Activated:</span>
          <strong style={{ color: '#00ff80' }}>{data.active}</strong>
        </p>
        <p style={{ margin: '4px 0', display: 'flex', justifyContent: 'space-between', gap: '15px' }}>
          <span style={{ color: '#aaa' }}>Deactivated:</span>
          <strong style={{ color: '#ff3366' }}>{data.deactivated}</strong>
        </p>
      </div>
    );
  }
  return null;
};

const CustomTypeTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div style={{
        background: '#111',
        border: '1px solid #00ff80',
        padding: '10px 14px',
        borderRadius: '6px',
        fontFamily: 'monospace',
        color: '#fff',
        fontSize: '0.85rem',
        boxShadow: '0 4px 12px rgba(0,0,0,0.6)'
      }}>
        <p style={{ margin: '0 0 6px 0', color: '#00ff80', fontWeight: 'bold', fontSize: '0.9rem', borderBottom: '1px solid #333', paddingBottom: '3px' }}>
          {data.name.toUpperCase()}
        </p>
        <p style={{ margin: '4px 0', display: 'flex', justifyContent: 'space-between', gap: '15px' }}>
          <span style={{ color: '#aaa' }}>Total Count:</span>
          <strong style={{ color: '#fff' }}>{data.count}</strong>
        </p>
        <p style={{ margin: '4px 0', display: 'flex', justifyContent: 'space-between', gap: '15px' }}>
          <span style={{ color: '#aaa' }}>Active (Approved):</span>
          <strong style={{ color: '#00ff80' }}>{data.accepted}</strong>
        </p>
        <p style={{ margin: '4px 0', display: 'flex', justifyContent: 'space-between', gap: '15px' }}>
          <span style={{ color: '#aaa' }}>Pending Review:</span>
          <strong style={{ color: '#f59e0b' }}>{data.pending}</strong>
        </p>
        <p style={{ margin: '4px 0', display: 'flex', justifyContent: 'space-between', gap: '15px' }}>
          <span style={{ color: '#aaa' }}>Rejected:</span>
          <strong style={{ color: '#ff3366' }}>{data.rejected}</strong>
        </p>
      </div>
    );
  }
  return null;
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const adminUser = getSafeLocalStorage('adminUser');
  const [pendingProps, setPendingProps] = useState([]);
  const [propertiesList, setPropertiesList] = useState([]);
  const [userStats, setUserStats] = useState({ buyers: 0, sellers: 0 }); 
  const [usersList, setUsersList] = useState([]);
  const [selectedAdminProperty, setSelectedAdminProperty] = useState(null);
  const [logs, setLogs] = useState([]);
  const [logSearchText, setLogSearchText] = useState('');
  const [logTypeFilter, setLogTypeFilter] = useState('ALL');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [selectedTypeData, setSelectedTypeData] = useState(null);
  
  // Modals
  const [activeModalUser, setActiveModalUser] = useState(null);
  const [activeModalProps, setActiveModalProps] = useState(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetchProperties();
    fetchUsers();
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await axios.get((window.API_BASE_URL || 'https://realestatelisting-u2kp.onrender.com') + '/api/logs');
      if (Array.isArray(res.data)) {
        setLogs(res.data);
      }
    } catch (err) {
      console.error("Failed to fetch system logs:", err);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await axios.get((window.API_BASE_URL || 'https://realestatelisting-u2kp.onrender.com') + '/api/users');
      if (Array.isArray(res.data)) {
         setUsersList(res.data);
         const buyers = res.data.filter(u => u.role === 'buyer' || u.role === undefined).length;
         const sellers = res.data.filter(u => u.role === 'seller').length;
         setUserStats({ buyers, sellers });
      }
    } catch (err) {
      console.log("Using baseline user metrics", err);
    }
  };

  const fetchProperties = async () => {
    try {
      const res = await axios.get((window.API_BASE_URL || 'https://realestatelisting-u2kp.onrender.com') + '/api/properties?status=all');
      const activeProperties = res.data.filter(p => p.status !== 'deleted');
      setPropertiesList(activeProperties);
      setPendingProps(activeProperties.filter(p => p.status === 'pending' || p.hasPendingChanges === true || p.status === 'pending_delete'));
    } catch (err) {
      console.error(err);
    }
  };

  const handleStatus = async (id, status) => {
    const actionText = status === 'approved' ? 'approve' : 'reject';
    const reason = await window.customPrompt(`Enter reason for status change (${actionText.toUpperCase()}):`, status === 'approved' ? 'Property meets all listing standards.' : '');
    if (reason === null) return; // Cancel clicked
    if (!reason.trim()) {
      await window.customAlert("A reason is required to change property status!");
      return;
    }

    try {
      await axios.put(`${window.API_BASE_URL || "https://realestatelisting-u2kp.onrender.com"}/api/properties/${id}/status`, { status, reason });
      fetchProperties(); // Refresh list
      fetchLogs();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteProperty = async (id) => {
    if (await window.customConfirm("VAPORIZE PROPERTY: Are you sure you want to delete this property?")) {
      const reason = await window.customPrompt("Enter reason for DELETION:");
      if (reason === null) return; // Cancel clicked
      if (!reason.trim()) {
        await window.customAlert("A reason is required to delete this property!");
        return;
      }

      try {
        await axios.delete(`${window.API_BASE_URL || "https://realestatelisting-u2kp.onrender.com"}/api/properties/${id}`, { data: { reason } });
        fetchProperties();
        fetchLogs();
        if (activeModalProps) {
          // If we delete inside modal, update modal view
          setActiveModalProps(prev => ({
            ...prev,
            props: prev.props.filter(p => p.id !== id)
          }));
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    const nextStatus = currentStatus === 'deactivated' ? 'active' : 'deactivated';
    try {
      await axios.put(`${window.API_BASE_URL || "https://realestatelisting-u2kp.onrender.com"}/api/users/${id}/status`, { status: nextStatus });
      fetchUsers();
      fetchLogs();
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  const handleDeleteUser = async (id, role) => {
    if (role === 'admin') {
      await window.customAlert("System Action Denied: Cannot delete Supreme Admin Nodes.");
      return;
    }
    if (await window.customConfirm('WARNING: Are you sure you want to permanently vaporize this user data node?')) {
      try {
        await axios.delete(`${window.API_BASE_URL || "https://realestatelisting-u2kp.onrender.com"}/api/users/${id}`);
        fetchUsers();
        fetchLogs();
      } catch (err) {
        console.error("Failed to delete user", err);
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('sellerToken');
    localStorage.removeItem('sellerUser');
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    window.location.href = '/buyer/';
  };

  const openUserView = (userObj) => {
    setActiveModalUser(userObj);
  };

  const openSellerProps = (userObj) => {
    const sellerProps = propertiesList.filter(p => String(p.ownerId) === String(userObj.id));
    setActiveModalProps({
      seller: userObj,
      props: sellerProps
    });
  };

  const getPropertyTypeData = () => {
    const types = {
      'House': { name: 'House', count: 0, accepted: 0, pending: 0, rejected: 0 },
      'Apartment': { name: 'Apartment', count: 0, accepted: 0, pending: 0, rejected: 0 },
      'Villa': { name: 'Villa', count: 0, accepted: 0, pending: 0, rejected: 0 },
      'Land': { name: 'Land', count: 0, accepted: 0, pending: 0, rejected: 0 },
      'PG': { name: 'PG', count: 0, accepted: 0, pending: 0, rejected: 0 },
      'Penthouse': { name: 'Penthouse', count: 0, accepted: 0, pending: 0, rejected: 0 }
    };
    propertiesList.forEach(p => {
      const type = p.propertyType;
      let matchedKey = null;
      if (type) {
        matchedKey = Object.keys(types).find(k => k.toLowerCase() === type.toLowerCase());
      }
      if (matchedKey) {
        types[matchedKey].count++;
        const isPending = p.status === 'pending' || p.hasPendingChanges === true || p.status === 'pending_delete';
        const isRejected = p.status === 'rejected';
        
        if (isPending) {
          types[matchedKey].pending++;
        } else if (isRejected) {
          types[matchedKey].rejected++;
        } else {
          types[matchedKey].accepted++; // Active/Approved
        }
      }
    });
    return Object.values(types);
  };

  const getUserRoleData = () => {
    const roles = {
      'Buyer': { name: 'Buyer', count: 0, active: 0, pending: 0, deactivated: 0, color: '#00d2ff' },
      'Seller': { name: 'Seller', count: 0, active: 0, pending: 0, deactivated: 0, color: '#00ff80' },
      'Admin': { name: 'Admin', count: 0, active: 0, pending: 0, deactivated: 0, color: '#a855f7' }
    };
    usersList.forEach(u => {
      let roleKey = null;
      if (u.role === 'buyer') roleKey = 'Buyer';
      else if (u.role === 'seller') roleKey = 'Seller';
      else if (u.role === 'admin') roleKey = 'Admin';

      if (roleKey) {
        roles[roleKey].count++;
        const status = (u.status || 'active').toLowerCase();
        if (status === 'pending') {
          roles[roleKey].pending++;
        } else if (status === 'deactivated' || status === 'suspended' || status === 'inactive') {
          roles[roleKey].deactivated++;
        } else {
          roles[roleKey].active++;
        }
      }
    });
    return Object.values(roles);
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = (log.message || '').toLowerCase().includes(logSearchText.toLowerCase()) || 
                          (log.type || '').toLowerCase().includes(logSearchText.toLowerCase());
    if (logTypeFilter === 'ALL') return matchesSearch;
    return matchesSearch && log.type === logTypeFilter;
  });

  return (
    <div className="admin-login-wrapper" style={{ alignItems: 'flex-start', paddingTop: '50px', minHeight: '100vh', paddingBottom: '100px' }}>
      <div className="admin-secure-box" style={{ maxWidth: '1100px', width: '95%' }}>
        <style>{`
          .admin-scrollable-chart::-webkit-scrollbar {
            height: 12px !important;
            display: block !important;
          }
          .admin-scrollable-chart::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.15) !important;
            border-radius: 6px !important;
          }
          .admin-scrollable-chart::-webkit-scrollbar-thumb {
            background: #00ff80 !important;
            border-radius: 6px !important;
            border: 2px solid #111 !important;
            cursor: pointer !important;
          }
          .admin-buttons-scroll::-webkit-scrollbar {
            display: none !important;
          }
        `}</style>
        
        {/* Dashboard Header */}
        <div className="admin-header-flex">
          <div style={{ textAlign: 'left' }}>
            <h2 style={{ fontSize: isMobile ? '1.1rem' : '1.8rem', letterSpacing: isMobile ? '1px' : '2px', wordBreak: 'break-all', fontFamily: 'monospace', color: '#00ff80', margin: '0 0 5px 0' }}>SYSTEM_CORE_ONLINE</h2>
            <p style={{ margin: 0, fontSize: isMobile ? '0.75rem' : '0.9rem', color: '#888' }}>Welcome, {adminUser?.name || 'Administrator'} | Secure Panel Protocol</p>
          </div>
          <button onClick={handleLogout} className="btn-cyber-scan" style={{ width: 'auto', padding: '10px 20px', margin: 0 }}>
            <span>LOGOUT</span>
            <div className="scan-line"></div>
          </button>
        </div>

        {/* Counter Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginTop: '30px' }}>
          <div style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid #e74c3c', padding: '25px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
               <h3 style={{ color: '#e74c3c', margin: '0 0 10px 0', fontFamily: 'monospace', fontSize: '1rem' }}>SELLER NODES</h3>
               <div style={{ color: '#fff', fontSize: '2.5rem', fontWeight: '900', fontFamily: 'monospace' }}>{userStats.sellers}</div>
            </div>
            <Users size={40} color="#e74c3c" opacity={0.3} />
          </div>
          <div style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid #00d2ff', padding: '25px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
               <h3 style={{ color: '#00d2ff', margin: '0 0 10px 0', fontFamily: 'monospace', fontSize: '1rem' }}>BUYER NODES</h3>
               <div style={{ color: '#fff', fontSize: '2.5rem', fontWeight: '900', fontFamily: 'monospace' }}>{userStats.buyers}</div>
            </div>
            <Users size={40} color="#00d2ff" opacity={0.3} />
          </div>
          <div style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid #00ff80', padding: '25px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
               <h3 style={{ color: '#00ff80', margin: '0 0 10px 0', fontFamily: 'monospace', fontSize: '1rem' }}>TOTAL PROPERTIES</h3>
               <div style={{ color: '#fff', fontSize: '2.5rem', fontWeight: '900', fontFamily: 'monospace' }}>{propertiesList.length}</div>
            </div>
            <Activity size={40} color="#00ff80" opacity={0.3} />
          </div>
          <div style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid #f59e0b', padding: '25px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
               <h3 style={{ color: '#f59e0b', margin: '0 0 10px 0', fontFamily: 'monospace', fontSize: '1rem' }}>PENDING REVIEW</h3>
               <div style={{ color: '#fff', fontSize: '2.5rem', fontWeight: '900', fontFamily: 'monospace' }}>{pendingProps.length}</div>
            </div>
            <CheckCircle size={40} color="#f59e0b" opacity={0.3} />
          </div>
        </div>

        {/* SYSTEM ANALYTICS & DIAGNOSTICS */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(450px, 1fr))', gap: '20px', marginTop: '20px' }}>
          {/* Chart 1: Properties by Type */}
          <div style={{ padding: '25px', border: '1px solid #333', background: 'rgba(0,0,0,0.5)', borderRadius: '12px' }}>
            <h3 style={{ color: '#00ff80', fontFamily: 'monospace', fontSize: '1.1rem', margin: '0 0 20px 0', borderBottom: '1px solid #333', paddingBottom: '10px' }}>
              📊 PROPERTIES BY TYPE
            </h3>
            
            <div style={{ width: '100%', height: '250px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <ReChartsBarChart data={getPropertyTypeData()}>
                  <XAxis dataKey="name" stroke="#888" fontSize={isMobile ? 9 : 11} tickLine={false} />
                  <YAxis stroke="#888" fontSize={11} tickLine={false} />
                  <Tooltip content={<CustomTypeTooltip />} />
                  <Bar dataKey="count" fill="#00ff80" radius={[4, 4, 0, 0]} style={{ cursor: 'pointer' }}>
                    {getPropertyTypeData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={['#00ff80', '#00d2ff', '#ffdf80', '#ff3366', '#a855f7'][index % 5]} />
                    ))}
                  </Bar>
                </ReChartsBarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: User Node Distribution */}
          <div style={{ padding: '25px', border: '1px solid #333', background: 'rgba(0,0,0,0.5)', borderRadius: '12px' }}>
            <h3 style={{ color: '#00ff80', fontFamily: 'monospace', fontSize: '1.1rem', margin: '0 0 20px 0', borderBottom: '1px solid #333', paddingBottom: '10px' }}>
              📊 USER NODE DISTRIBUTION
            </h3>
            <div style={{ width: '100%', height: '250px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <ReChartsBarChart data={getUserRoleData()}>
                  <XAxis dataKey="name" stroke="#888" fontSize={11} tickLine={false} />
                  <YAxis stroke="#888" fontSize={11} tickLine={false} />
                  <Tooltip content={<CustomUserTooltip />} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]} style={{ cursor: 'pointer' }}>
                    {getUserRoleData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </ReChartsBarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* PROPERTY MODERATION SECTION */}
        <div style={{ padding: '30px', border: '1px solid #333', background: 'rgba(0,0,0,0.5)', marginTop: '20px' }}>
          <h3 style={{ color: '#00ff80', fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.25rem', borderBottom: '1px solid #333', paddingBottom: '15px' }}>
            <Activity size={20} /> PENDING PROPERTY MODERATION 
          </h3>
          
          {pendingProps.length === 0 ? (
            <p style={{ color: '#aaa', fontFamily: 'monospace', marginTop: '20px' }}>[ No pending properties detected ]</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
              {pendingProps.map(prop => (
                <div key={prop.id} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '25px 35px',
                  border: '1px solid #333',
                  background: 'rgba(0,0,0,0.3)',
                  borderRadius: '8px',
                  gap: '15px',
                  flexDirection: isMobile ? 'column' : 'row',
                  textAlign: isMobile ? 'center' : 'left'
                }}>
                  <div style={{ textAlign: isMobile ? 'center' : 'left', flex: 1 }}>
                    <h4 style={{ color: 'white', margin: '0 0 8px 0', fontSize: '1.25rem' }}>{prop.title}</h4>
                    <p style={{ color: '#aaa', margin: 0, fontSize: '1rem' }}>Seller ID: {prop.ownerId} | Location: {prop.location} | Price: ₹{prop.price.toLocaleString('en-IN')}</p>
                  </div>
                  <div className="admin-buttons-scroll" style={{
                    display: 'flex',
                    gap: '10px',
                    alignItems: 'center',
                    justifyContent: isMobile ? 'flex-start' : 'flex-end',
                    flexWrap: 'nowrap',
                    overflowX: 'auto',
                    WebkitOverflowScrolling: 'touch',
                    width: isMobile ? '100%' : 'auto',
                    paddingBottom: isMobile ? '5px' : '0'
                  }}>
                    <button onClick={() => setSelectedAdminProperty(prop)} style={{ background: '#00d2ff', color: 'black', border: 'none', padding: '10px 18px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 'bold', borderRadius: '4px' }}>
                      <Eye size={16} /> View
                    </button>
                    <button onClick={() => handleStatus(prop.id, 'approved')} style={{ background: '#00ff80', color: 'black', border: 'none', padding: '10px 18px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 'bold', borderRadius: '4px' }}>
                      <CheckCircle size={16} /> Accept
                    </button>
                    <button onClick={() => handleStatus(prop.id, 'rejected')} style={{ background: '#333', color: 'white', border: '1px solid #ff3366', padding: '10px 18px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', borderRadius: '4px' }}>
                      <XCircle size={16} color="#ff3366" /> Reject
                    </button>
                    <button onClick={() => handleDeleteProperty(prop.id)} style={{ background: 'transparent', color: '#ff3366', border: 'none', padding: '8px', cursor: 'pointer' }}>
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* REGISTERED USERS DIRECTORY */}
        <div style={{ padding: '30px', border: '1px solid #333', background: 'rgba(0,0,0,0.5)', marginTop: '20px' }}>
          <h3 style={{ color: '#00d2ff', fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.25rem', borderBottom: '1px solid #333', paddingBottom: '15px' }}>
            <Users size={20} /> REGISTERED USERS DIRECTORY 
          </h3>
          <div style={{ marginTop: '20px', background: '#111', border: '1px solid #333', overflowX: 'auto' }}>
             <table style={{ width: '100%', borderCollapse: 'collapse', color: '#fff', fontFamily: 'monospace', textAlign: 'left', fontSize: '0.95rem' }}>
               <thead>
                 <tr style={{ background: '#222', borderBottom: '2px solid #00d2ff' }}>
                   <th style={{ padding: '18px' }}>USER ID</th>
                   <th style={{ padding: '18px' }}>NAME</th>
                   <th style={{ padding: '18px' }}>ROLE</th>
                   <th style={{ padding: '18px' }}>EMAIL</th>
                   <th style={{ padding: '18px' }}>MOBILE</th>
                   <th style={{ padding: '18px' }}>STATUS</th>
                   <th style={{ padding: '18px' }}>MEMBER SINCE</th>
                   <th style={{ padding: '18px', textAlign: 'right' }}>ACTIONS</th>
                 </tr>
               </thead>
               <tbody>
                 {usersList.map((usr, idx) => (
                   <tr key={usr.id || idx} style={{ borderBottom: '1px solid #333' }}>
                     <td style={{ padding: '18px', color: '#00d2ff', fontWeight: 'bold' }}>{usr.id}</td>
                     <td style={{ padding: '18px', fontWeight: 'bold' }}>{usr.name || 'System User'}</td>
                     <td style={{ padding: '18px' }}>
                       {usr.role === 'admin' ? (
                         <span style={{ background: 'rgba(0,255,128,0.1)', color: '#00ff80', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem' }}>ADMIN</span>
                       ) : usr.role === 'seller' ? (
                         <span style={{ background: 'rgba(196,167,97,0.1)', color: '#ffdf80', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem' }}>SELLER</span>
                       ) : (
                         <span style={{ background: 'rgba(0,210,255,0.1)', color: '#00d2ff', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem' }}>BUYER</span>
                       )}
                     </td>
                     <td style={{ padding: '18px', color: '#aaa' }}>{usr.email}</td>
                     <td style={{ padding: '18px', color: '#aaa' }}>{usr.mobile || 'N/A'}</td>
                     <td style={{ padding: '18px' }}>
                       <span style={{ 
                         padding: '3px 8px', 
                         borderRadius: '4px', 
                         fontSize: '0.8rem', 
                         fontWeight: 'bold',
                         background: usr.status === 'deactivated' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                         color: usr.status === 'deactivated' ? '#f87171' : '#34d399'
                       }}>
                         {(usr.status || 'active').toUpperCase()}
                       </span>
                     </td>
                     <td style={{ padding: '18px', color: '#aaa' }}>{usr.memberSince || 'N/A'}</td>
                     <td style={{ padding: '18px', textAlign: 'right' }}>
                       <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center', minWidth: '120px' }}>
                         {/* VIEW USER DETAIL */}
                         <button onClick={() => openUserView(usr)} style={{ background: 'transparent', border: 'none', color: '#00d2ff', cursor: 'pointer' }} title="View User Details">
                           <Info size={18} />
                         </button>

                         {/* VIEW SELLER PROPERTIES */}
                         {usr.role === 'seller' && (
                           <button onClick={() => openSellerProps(usr)} style={{ background: 'transparent', border: 'none', color: '#ffdf80', cursor: 'pointer' }} title="View Seller Properties">
                             <BarChart size={18} />
                           </button>
                         )}

                         {/* ACTIVATE/DEACTIVATE */}
                         {usr.role !== 'admin' && (
                           <button onClick={() => handleToggleStatus(usr.id, usr.status)} style={{ background: 'transparent', border: 'none', color: usr.status === 'deactivated' ? '#10b981' : '#f59e0b', cursor: 'pointer' }} title={usr.status === 'deactivated' ? 'Activate User' : 'Deactivate User'}>
                             {usr.status === 'deactivated' ? <UserCheck size={18} /> : <UserX size={18} />}
                           </button>
                         )}

                         {/* DELETE USER */}
                         <button onClick={() => handleDeleteUser(usr.id, usr.role)} style={{ background: 'transparent', color: usr.role === 'admin' ? '#555' : '#ff3366', border: 'none', cursor: usr.role === 'admin' ? 'not-allowed' : 'pointer' }} disabled={usr.role === 'admin'} title="Delete User Node">
                           <Trash2 size={18} />
                         </button>
                       </div>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
             {usersList.length === 0 && <p style={{ padding: '20px', color: '#555', textAlign: 'center' }}>[ Database Empty ]</p>}
          </div>
        </div>

        {/* SYSTEM SECURITY & ACTIVITY LOGS (TERMINAL VIEW) */}
        <div style={{ padding: '30px', border: '1px solid #333', background: 'rgba(0,0,0,0.6)', marginTop: '20px', fontFamily: 'monospace' }}>
          <h3 style={{ color: '#00ff80', borderBottom: '1px solid #333', paddingBottom: '15px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: 0, fontSize: '1.25rem', flexWrap: 'wrap', gap: '15px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><ShieldCheck size={20} /> SYSTEM SECURITY & ACTIVITY MONITORING</span>
            <span style={{ fontSize: '0.8rem', color: '#888' }}>STATUS: ONLINE</span>
          </h3>

          {/* Filters Bar */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
            <select
              value={logTypeFilter}
              onChange={e => setLogTypeFilter(e.target.value)}
              style={{ background: '#111', color: '#00ff80', border: '1px solid #333', padding: '8px 12px', outline: 'none', fontFamily: 'monospace', borderRadius: '4px', fontSize: '0.85rem' }}
            >
              <option value="ALL">ALL EVENT TYPES</option>
              <option value="LOGIN">LOGIN</option>
              <option value="REGISTRATION">REGISTRATION</option>
              <option value="DELETION">PROPERTY DELETION</option>
              <option value="USER_DELETION">USER DELETION</option>
              <option value="USER_STATUS_CHANGE">USER STATUS CHANGE</option>
              <option value="ENQUIRY">ENQUIRY</option>
              <option value="BOOKING">BOOKING</option>
            </select>
            <input 
              type="text"
              placeholder="Search logs by message or type..."
              value={logSearchText}
              onChange={e => setLogSearchText(e.target.value)}
              style={{ background: '#111', color: '#00ff80', border: '1px solid #333', padding: '8px 12px', outline: 'none', fontFamily: 'monospace', flex: 1, borderRadius: '4px', fontSize: '0.85rem' }}
            />
          </div>

          <div style={{
            background: '#0a0d14',
            border: '1px solid #222',
            borderRadius: '6px',
            padding: '20px',
            marginTop: '20px',
            maxHeight: '300px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            boxShadow: 'inset 0 0 10px rgba(0,0,0,0.8)'
          }}>
            {filteredLogs.length === 0 ? (
              <div style={{ color: '#666', textAlign: 'center', padding: '20px' }}>[ No matching system events found ]</div>
            ) : (
              filteredLogs.map((log) => {
                let badgeColor = '#00d2ff'; // LOGIN
                let dotColor = '#00d2ff';
                if (log.type === 'DELETION') {
                  badgeColor = '#ff3366';
                  dotColor = '#ff3366';
                } else if (log.type === 'REGISTRATION') {
                  badgeColor = '#a855f7';
                  dotColor = '#a855f7';
                } else if (log.type === 'USER_DELETION') {
                  badgeColor = '#ff9900';
                  dotColor = '#ff9900';
                } else if (log.type === 'USER_STATUS_CHANGE') {
                  badgeColor = '#eab308';
                  dotColor = '#eab308';
                }

                return (
                  <div key={log.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', fontSize: '0.9rem', borderBottom: '1px solid #111', paddingBottom: '8px', color: '#ddd' }}>
                    <span style={{ color: '#666', flexShrink: 0 }}>[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                    <span style={{ 
                      color: badgeColor, 
                      fontWeight: 'bold', 
                      flexShrink: 0, 
                      border: `1px solid ${badgeColor}`, 
                      padding: '1px 6px', 
                      borderRadius: '3px', 
                      fontSize: '0.75rem',
                      background: `rgba(${log.type === 'DELETION' ? '255,51,102' : log.type === 'REGISTRATION' ? '168,85,247' : '0,210,255'}, 0.05)`
                    }}>
                      {log.type}
                    </span>
                    <span style={{ flex: 1, textAlign: 'left', wordBreak: 'break-all' }}>
                      {log.message}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* VIEW USER DETAILS MODAL */}
      {activeModalUser && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#151922', border: '2px solid #00d2ff', borderRadius: '20px', width: '90%', maxWidth: '550px', padding: '30px', color: '#fff', position: 'relative', textAlign: 'left', fontFamily: 'monospace' }}>
            <button onClick={() => setActiveModalUser(null)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: '#aaa', cursor: 'pointer' }}>
              <X size={24} />
            </button>
            
            <h3 style={{ color: '#00d2ff', fontSize: '1.4rem', borderBottom: '1px solid #333', paddingBottom: '10px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Info size={20}/> USER ARCHIVE: {activeModalUser.id}
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxHeight: '450px', overflowY: 'auto', paddingRight: '5px' }}>
              <div>
                <span style={{ color: '#888', display: 'block', fontSize: '0.8rem' }}>FULL NAME</span>
                <span style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{activeModalUser.name}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div>
                  <span style={{ color: '#888', display: 'block', fontSize: '0.8rem' }}>EMAIL</span>
                  <span>{activeModalUser.email}</span>
                </div>
                <div>
                  <span style={{ color: '#888', display: 'block', fontSize: '0.8rem' }}>MOBILE</span>
                  <span>{activeModalUser.mobile || 'N/A'}</span>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div>
                  <span style={{ color: '#888', display: 'block', fontSize: '0.8rem' }}>ROLE</span>
                  <span style={{ textTransform: 'uppercase', color: activeModalUser.role === 'seller' ? '#ffdf80' : '#00d2ff' }}>{activeModalUser.role}</span>
                </div>
                <div>
                  <span style={{ color: '#888', display: 'block', fontSize: '0.8rem' }}>STATUS</span>
                  <span style={{ color: activeModalUser.status === 'deactivated' ? '#ef4444' : '#10b981' }}>{(activeModalUser.status || 'active').toUpperCase()}</span>
                </div>
              </div>
              <div>
                <span style={{ color: '#888', display: 'block', fontSize: '0.8rem' }}>MEMBER SINCE</span>
                <span>{activeModalUser.memberSince || 'N/A'}</span>
              </div>

              {/* ADDRESS DETAILS */}
              <div style={{ borderTop: '1px solid #333', paddingTop: '15px', marginTop: '5px' }}>
                <span style={{ color: '#00d2ff', display: 'block', fontWeight: 'bold', marginBottom: '10px', fontSize: '0.9rem' }}>ADDRESS DETAILS</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div>
                    <span style={{ color: '#888', fontSize: '0.75rem', display: 'block' }}>ADDRESS</span>
                    <span>{activeModalUser.address || 'Not Provided'}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
                    <div>
                      <span style={{ color: '#888', fontSize: '0.75rem', display: 'block' }}>CITY</span>
                      <span>{activeModalUser.city || 'Not Provided'}</span>
                    </div>
                    <div>
                      <span style={{ color: '#888', fontSize: '0.75rem', display: 'block' }}>STATE</span>
                      <span>{activeModalUser.state || 'Not Provided'}</span>
                    </div>
                    <div>
                      <span style={{ color: '#888', fontSize: '0.75rem', display: 'block' }}>PINCODE</span>
                      <span>{activeModalUser.pincode || 'Not Provided'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* BUSINESS & VERIFICATION DETAILS (Seller Only) */}
              {activeModalUser.role === 'seller' && (
                <div style={{ borderTop: '1px solid #333', paddingTop: '15px', marginTop: '5px' }}>
                  <span style={{ color: '#ffdf80', display: 'block', fontWeight: 'bold', marginBottom: '10px', fontSize: '0.9rem' }}>BUSINESS & VERIFICATION ARCHIVE</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                      <div>
                        <span style={{ color: '#888', fontSize: '0.75rem', display: 'block' }}>COMPANY NAME</span>
                        <span>{activeModalUser.companyName || 'Not Provided'}</span>
                      </div>
                      <div>
                        <span style={{ color: '#888', fontSize: '0.75rem', display: 'block' }}>SELLER TYPE</span>
                        <span>{activeModalUser.sellerType || 'N/A'}</span>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                      <div>
                        <span style={{ color: '#888', fontSize: '0.75rem', display: 'block' }}>PAN</span>
                        <span style={{ fontFamily: 'monospace' }}>{activeModalUser.panNumber || 'N/A'}</span>
                      </div>
                      <div>
                        <span style={{ color: '#888', fontSize: '0.75rem', display: 'block' }}>AADHAAR</span>
                        <span style={{ fontFamily: 'monospace' }}>{activeModalUser.aadhaarNumber || 'N/A'}</span>
                      </div>
                      <div>
                        <span style={{ color: '#888', fontSize: '0.75rem', display: 'block' }}>GST</span>
                        <span style={{ fontFamily: 'monospace' }}>{activeModalUser.gstNumber || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* VIEW SELLER PROPERTIES MODAL */}
      {activeModalProps && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#151922', border: '2px solid #ffdf80', borderRadius: '20px', width: '90%', maxWidth: '750px', padding: '30px', color: '#fff', position: 'relative', textAlign: 'left', fontFamily: 'monospace' }}>
            <button onClick={() => setActiveModalProps(null)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: '#aaa', cursor: 'pointer' }}>
              <X size={24} />
            </button>
            
            <h3 style={{ color: '#ffdf80', fontSize: '1.4rem', borderBottom: '1px solid #333', paddingBottom: '10px', marginBottom: '20px' }}>
              PROPERTIES LISTING FOR: {activeModalProps.seller.name} ({activeModalProps.seller.id})
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxHeight: '450px', overflowY: 'auto', paddingRight: '5px' }}>
              {activeModalProps.props.length === 0 ? (
                <p style={{ color: '#aaa', textAlign: 'center', padding: '30px' }}>[ No properties submitted by this seller ]</p>
              ) : (
                activeModalProps.props.map(prop => (
                  <div key={prop.id} className="admin-seller-property-item">
                    <div>
                      <h4 style={{ color: 'white', margin: '0 0 5px 0' }}>{prop.title}</h4>
                      <p style={{ color: '#aaa', margin: 0, fontSize: '0.85rem' }}>Type: {prop.propertyType} | City: {prop.location} | Status: <span style={{ color: prop.status === 'approved' ? '#10b981' : prop.status === 'rejected' ? '#ef4444' : '#fbbf24' }}>{(prop.status || 'pending').toUpperCase()}</span></p>
                    </div>
                    <div className="admin-seller-property-actions">
                      {prop.status === 'pending' && (
                        <>
                          <button onClick={() => handleStatus(prop.id, 'approved')} style={{ background: '#10b981', color: 'black', border: 'none', padding: '5px 10px', cursor: 'pointer', fontWeight: 'bold' }}>Accept</button>
                          <button onClick={() => handleStatus(prop.id, 'rejected')} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '5px 10px', cursor: 'pointer' }}>Reject</button>
                        </>
                      )}
                      <button onClick={() => handleDeleteProperty(prop.id)} style={{ background: 'transparent', color: '#ff3366', border: 'none', cursor: 'pointer' }}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* REVIEW PROPERTY MODAL */}
      {selectedAdminProperty && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#151922', border: '2px solid #00ff80', borderRadius: '20px', width: '90%', maxWidth: '750px', padding: '30px', color: '#fff', position: 'relative', textAlign: 'left', fontFamily: 'monospace' }}>
            <button onClick={() => setSelectedAdminProperty(null)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: '#aaa', cursor: 'pointer' }}>
              <X size={24} />
            </button>
            
            <h3 style={{ color: '#00ff80', fontSize: '1.4rem', borderBottom: '1px solid #333', paddingBottom: '10px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={22}/> PROPERTY MODERATION PANEL
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxHeight: '500px', overflowY: 'auto', paddingRight: '5px' }}>
              
              {selectedAdminProperty.status === 'pending_delete' && (
                <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ff3366', padding: '15px', borderRadius: '8px', color: '#f87171' }}>
                  <strong>⚠️ DELETION REQUEST DETECTED:</strong>
                  <p style={{ margin: '5px 0 0 0', fontSize: '0.9rem' }}>Reason provided by seller: "{selectedAdminProperty.deleteReason}"</p>
                </div>
              )}

              {selectedAdminProperty.hasPendingChanges && (
                <div style={{ background: 'rgba(250, 204, 21, 0.15)', border: '1px solid #fbbf24', padding: '15px', borderRadius: '8px', color: '#facc15' }}>
                  <strong>📝 PENDING EDITS DETECTED:</strong>
                  <p style={{ margin: '5px 0 0 0', fontSize: '0.9rem' }}>The seller has modified this listing. Please compare the changes below.</p>
                </div>
              )}

              {/* Grid Comparison or standard display */}
              <div style={{ display: 'grid', gridTemplateColumns: selectedAdminProperty.hasPendingChanges ? '1fr 1fr' : '1fr', gap: '20px' }}>
                
                {/* Left/Standard Column: Current / Proposed Version */}
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '15px', borderRadius: '8px', border: '1px solid #222' }}>
                  <h4 style={{ color: '#00d2ff', margin: '0 0 10px 0' }}>{selectedAdminProperty.hasPendingChanges ? 'ORIGINAL APPROVED DATA' : 'PROPERTY SPECIFICATIONS'}</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem' }}>
                    <div><strong>Title:</strong> {selectedAdminProperty.title}</div>
                    <div><strong>Price:</strong> ₹{Number(selectedAdminProperty.price || 0).toLocaleString('en-IN')}</div>
                    <div><strong>Type:</strong> {selectedAdminProperty.propertyType}</div>
                    <div><strong>Description:</strong> {selectedAdminProperty.description}</div>
                    <div><strong>Location:</strong> {selectedAdminProperty.location}</div>
                  </div>
                </div>

                {/* Right Column: Proposed Version (Only if edit pending) */}
                {selectedAdminProperty.hasPendingChanges && selectedAdminProperty.pendingChanges && (
                  <div style={{ background: 'rgba(0, 255, 128, 0.05)', padding: '15px', borderRadius: '8px', border: '1px solid #00ff80' }}>
                    <h4 style={{ color: '#00ff80', margin: '0 0 10px 0' }}>PROPOSED UPDATES</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem' }}>
                      <div><strong>Title:</strong> {selectedAdminProperty.pendingChanges.title || selectedAdminProperty.title}</div>
                      <div><strong>Price:</strong> ₹{Number(selectedAdminProperty.pendingChanges.price || selectedAdminProperty.price).toLocaleString('en-IN')}</div>
                      <div><strong>Type:</strong> {selectedAdminProperty.pendingChanges.propertyType || selectedAdminProperty.propertyType}</div>
                      <div><strong>Description:</strong> {selectedAdminProperty.pendingChanges.description || selectedAdminProperty.description}</div>
                      <div><strong>Location:</strong> {selectedAdminProperty.pendingChanges.location || selectedAdminProperty.location}</div>
                    </div>
                  </div>
                )}

              </div>

              {/* Images preview */}
              <div>
                <span style={{ color: '#888', display: 'block', fontSize: '0.8rem', marginBottom: '8px' }}>IMAGES ARCHIVE</span>
                <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '5px' }}>
                  {(selectedAdminProperty.hasPendingChanges && selectedAdminProperty.pendingChanges?.images 
                    ? selectedAdminProperty.pendingChanges.images 
                    : selectedAdminProperty.images || []
                  ).map((img, idx) => (
                    <img 
                      key={idx} 
                      src={img.startsWith('http') ? img : `${window.API_BASE_URL || "https://realestatelisting-u2kp.onrender.com"}${img}`} 
                      alt="" 
                      style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #333' }}
                    />
                  ))}
                </div>
              </div>

              {/* Moderation Controls */}
              <div style={{ borderTop: '1px solid #333', paddingTop: '20px', display: 'flex', gap: '15px', justifyContent: 'flex-end' }}>
                {selectedAdminProperty.status === 'pending_delete' ? (
                  <>
                    <button 
                      onClick={() => {
                        handleStatus(selectedAdminProperty.id, 'approved');
                        setSelectedAdminProperty(null);
                      }} 
                      style={{ background: '#ff3366', color: 'white', border: 'none', padding: '10px 20px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                      Approve Deletion
                    </button>
                    <button 
                      onClick={() => {
                        handleStatus(selectedAdminProperty.id, 'rejected');
                        setSelectedAdminProperty(null);
                      }} 
                      style={{ background: '#333', color: '#fff', border: '1px solid #ff3366', padding: '10px 20px', cursor: 'pointer' }}
                    >
                      Reject Deletion
                    </button>
                  </>
                ) : (
                  <>
                    <button 
                      onClick={() => {
                        handleStatus(selectedAdminProperty.id, 'approved');
                        setSelectedAdminProperty(null);
                      }} 
                      style={{ background: '#00ff80', color: 'black', border: 'none', padding: '10px 20px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                      {selectedAdminProperty.hasPendingChanges ? 'Approve Edits' : 'Approve Property'}
                    </button>
                    <button 
                      onClick={() => {
                        handleStatus(selectedAdminProperty.id, 'rejected');
                        setSelectedAdminProperty(null);
                      }} 
                      style={{ background: '#333', color: '#ff3366', border: '1px solid #ff3366', padding: '10px 20px', cursor: 'pointer' }}
                    >
                      {selectedAdminProperty.hasPendingChanges ? 'Reject Edits' : 'Reject Property'}
                    </button>
                  </>
                )}
                <button onClick={() => setSelectedAdminProperty(null)} style={{ background: '#222', color: '#aaa', border: 'none', padding: '10px 20px', cursor: 'pointer' }}>
                  Close
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ShieldCheck, Activity, CheckCircle, XCircle, Trash2, Users, Eye, EyeOff, Info, UserCheck, UserX, X, BarChart } from 'lucide-react';
import './AdminLogin.css'; 

import { getSafeLocalStorage } from '../../api';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const adminUser = getSafeLocalStorage('adminUser');
  const [pendingProps, setPendingProps] = useState([]);
  const [propertiesList, setPropertiesList] = useState([]);
  const [userStats, setUserStats] = useState({ buyers: 0, sellers: 0 }); 
  const [usersList, setUsersList] = useState([]);
  const [selectedAdminProperty, setSelectedAdminProperty] = useState(null);
  const [logs, setLogs] = useState([]);
  
  // Modals
  const [activeModalUser, setActiveModalUser] = useState(null);
  const [activeModalProps, setActiveModalProps] = useState(null);

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

  return (
    <div className="admin-login-wrapper" style={{ alignItems: 'flex-start', paddingTop: '50px', minHeight: '100vh', paddingBottom: '100px' }}>
      <div className="admin-secure-box" style={{ maxWidth: '1100px', width: '95%' }}>
        
        {/* Dashboard Header */}
        <div className="admin-header-flex">
          <div style={{ textAlign: 'left' }}>
            <h2>SYSTEM_CORE_ONLINE</h2>
            <p>Welcome, {adminUser?.name || 'Administrator'} | Secure Panel Protocol</p>
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
                <div key={prop.id} className="admin-moderation-item">
                  <div style={{ textAlign: 'left' }}>
                    <h4 style={{ color: 'white', margin: '0 0 5px 0' }}>{prop.title}</h4>
                    <p style={{ color: '#aaa', margin: 0, fontSize: '0.9rem' }}>Seller ID: {prop.ownerId} | Location: {prop.location} | Price: ₹{prop.price.toLocaleString('en-IN')}</p>
                  </div>
                  <div className="admin-moderation-actions">
                    <button onClick={() => setSelectedAdminProperty(prop)} style={{ background: '#00d2ff', color: 'black', border: 'none', padding: '8px 15px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 'bold' }}>
                      <Eye size={16} /> View
                    </button>
                    <button onClick={() => handleStatus(prop.id, 'approved')} style={{ background: '#00ff80', color: 'black', border: 'none', padding: '8px 15px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 'bold' }}>
                      <CheckCircle size={16} /> Accept
                    </button>
                    <button onClick={() => handleStatus(prop.id, 'rejected')} style={{ background: '#333', color: 'white', border: '1px solid #ff3366', padding: '8px 15px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
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
             <table style={{ width: '100%', borderCollapse: 'collapse', color: '#fff', fontFamily: 'monospace', textAlign: 'left' }}>
               <thead>
                 <tr style={{ background: '#222', borderBottom: '2px solid #00d2ff' }}>
                   <th style={{ padding: '15px' }}>USER ID</th>
                   <th style={{ padding: '15px' }}>NAME</th>
                   <th style={{ padding: '15px' }}>ROLE</th>
                   <th style={{ padding: '15px' }}>EMAIL</th>
                   <th style={{ padding: '15px' }}>MOBILE</th>
                   <th style={{ padding: '15px' }}>STATUS</th>
                   <th style={{ padding: '15px' }}>MEMBER SINCE</th>
                   <th style={{ padding: '15px', textAlign: 'right' }}>ACTIONS</th>
                 </tr>
               </thead>
               <tbody>
                 {usersList.map((usr, idx) => (
                   <tr key={usr.id || idx} style={{ borderBottom: '1px solid #333' }}>
                     <td style={{ padding: '15px', color: '#00d2ff', fontWeight: 'bold' }}>{usr.id}</td>
                     <td style={{ padding: '15px', fontWeight: 'bold' }}>{usr.name || 'System User'}</td>
                     <td style={{ padding: '15px' }}>
                       {usr.role === 'admin' ? (
                         <span style={{ background: 'rgba(0,255,128,0.1)', color: '#00ff80', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem' }}>ADMIN</span>
                       ) : usr.role === 'seller' ? (
                         <span style={{ background: 'rgba(196,167,97,0.1)', color: '#ffdf80', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem' }}>SELLER</span>
                       ) : (
                         <span style={{ background: 'rgba(0,210,255,0.1)', color: '#00d2ff', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem' }}>BUYER</span>
                       )}
                     </td>
                     <td style={{ padding: '15px', color: '#aaa' }}>{usr.email}</td>
                     <td style={{ padding: '15px', color: '#aaa' }}>{usr.mobile || 'N/A'}</td>
                     <td style={{ padding: '15px' }}>
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
                     <td style={{ padding: '15px', color: '#aaa' }}>{usr.memberSince || 'N/A'}</td>
                     <td style={{ padding: '15px', textAlign: 'right' }}>
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
          <h3 style={{ color: '#00ff80', borderBottom: '1px solid #333', paddingBottom: '15px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: 0, fontSize: '1.25rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><ShieldCheck size={20} /> SYSTEM SECURITY & ACTIVITY MONITORING</span>
            <span style={{ fontSize: '0.8rem', color: '#888' }}>STATUS: ONLINE</span>
          </h3>

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
            {logs.length === 0 ? (
              <div style={{ color: '#666', textAlign: 'center', padding: '20px' }}>[ No system events recorded ]</div>
            ) : (
              logs.map((log) => {
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

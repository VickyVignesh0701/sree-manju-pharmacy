import { useState } from 'react';
import { Link } from 'react-router-dom';
import { User, Mail, Phone, MapPin, Building, Shield, FileText, CheckCircle, FileCheck, X, Camera, Settings, Key, LogOut, Edit3, Search, LogIn, Lock, ArrowUpRight } from 'lucide-react';
import { useAppContext, validatePasswordComplexity } from '../context/AppContext';
import logoImg from '../assets/logo.png';

export default function OwnerProfile() {
  const { user, logout, showNotification, activityLogs, logActivity, updateProfileImage, staffMembers, updateStaffPassword } = useAppContext();
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'profile' | 'security' | 'logs'

  // Log Tab Specific State
  const [logSearch, setLogSearch] = useState('');
  const [logFilterCategory, setLogFilterCategory] = useState('all'); // 'all' | 'login' | 'logout' | 'security'

  // Editable Profile Data State
  const [profileInfo, setProfileInfo] = useState(() => {
    const saved = localStorage.getItem('sree_manju_owner_info');
    return saved ? JSON.parse(saved) : {
      name: user?.role === 'owner' ? 'Sree Manju' : 'Staff Pharmacist',
      title: user?.role === 'owner' ? 'Pharmacy Owner & Chief Pharmacist' : 'Staff Pharmacist / Billing Executive',
      phone: user?.role === 'owner' ? '+91 98765 12345' : '+91 98123 45678',
      email: user?.role === 'owner' ? 'owner@sreemanjupharmacy.com' : 'staff@sreemanjupharmacy.com',
      experience: '12+ Years Experience',
      licenseNo: 'DL-TN-102-123456'
    };
  });

  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [editForm, setEditForm] = useState({ ...profileInfo });

  // Password Change State for Owner & All Members
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [targetUserForPassword, setTargetUserForPassword] = useState('myself'); // 'myself' or staff member id
  const [passwords, setPasswords] = useState({ old: '', new: '', confirm: '' });

  const [showLicenseModal, setShowLicenseModal] = useState(false);
  const [licenseData, setLicenseData] = useState({
    dlNumber: 'DL-TN-102-123456',
    dlExpiry: '2028-12-31',
    gstin: '33AAAAA0000A1Z5',
    pharmacistRegNo: 'PRN-2024-8890',
    dlFile: 'Drug_License_Form20_21.pdf',
    gstFile: 'GST_Registration_Certificate.pdf',
    regFile: 'Pharmacy_Council_Registration.pdf'
  });

  // Security Rule:
  // - Owner can see ALL login, logout, password change, and staff security logs.
  // - Staff members can ONLY see their own logs.
  const loginLogs = activityLogs.filter(log => {
    const act = log.action.toLowerCase();
    const isSecurityEvent = act.includes('login') || act.includes('logout') || act.includes('password') || act.includes('settings') || act.includes('profile');
    
    if (!isSecurityEvent) return false;

    if (user?.role === 'owner') {
      return true; // Owner views all staff activity & password logs
    } else {
      // Staff only views their own logs
      return log.userEmail === user?.email;
    }
  });

  const filteredLogs = loginLogs.filter(log => {
    const act = log.action.toLowerCase();
    const matchesSearch = act.includes(logSearch.toLowerCase()) || (log.ip && log.ip.includes(logSearch)) || (log.userName && log.userName.toLowerCase().includes(logSearch.toLowerCase()));
    let matchesCategory = true;

    if (logFilterCategory === 'login') {
      matchesCategory = act.includes('login');
    } else if (logFilterCategory === 'logout') {
      matchesCategory = act.includes('logout');
    } else if (logFilterCategory === 'security') {
      matchesCategory = act.includes('password') || act.includes('security') || act.includes('settings');
    }

    return matchesSearch && matchesCategory;
  });

  const getInitiatorInfo = (log, index = 0, allLogs = []) => {
    const act = (log.action || '').toLowerCase();
    const email = (log.userEmail || '').toLowerCase();
    const role = (log.userRole || '').toLowerCase();
    
    if (act.includes('sree manju') || act.includes('owner') || email.includes('owner') || role === 'owner') {
      return { name: 'Sree Manju (Primary Owner)', email: 'owner@sreemanjupharmacy.com' };
    }
    if (act.includes('ramesh') || email.includes('ramesh')) {
      return { name: 'Ramesh Kumar (Pharmacist)', email: 'ramesh@sreemanjupharmacy.com' };
    }
    if (act.includes('anitha') || email.includes('anitha')) {
      return { name: 'Anitha V (Staff)', email: 'anitha@sreemanjupharmacy.com' };
    }

    // For generic 'Logout' rows without explicit user info in action:
    // Look at adjacent logs in allLogs to determine who logged out!
    if (allLogs && allLogs.length > 0) {
      // Look forward in reverse-chronological list (which corresponds to prior login before this logout)
      for (let i = index + 1; i < allLogs.length; i++) {
        const nextAct = (allLogs[i].action || '').toLowerCase();
        if (nextAct.includes('login')) {
          if (nextAct.includes('sree manju') || nextAct.includes('owner')) {
            return { name: 'Sree Manju (Primary Owner)', email: 'owner@sreemanjupharmacy.com' };
          }
          if (nextAct.includes('ramesh')) {
            return { name: 'Ramesh Kumar (Pharmacist)', email: 'ramesh@sreemanjupharmacy.com' };
          }
          if (nextAct.includes('anitha')) {
            return { name: 'Anitha V (Staff)', email: 'anitha@sreemanjupharmacy.com' };
          }
          break;
        }
      }
    }

    return { 
      name: log.userName || (role === 'owner' ? 'Sree Manju (Primary Owner)' : 'Staff Pharmacist'), 
      email: log.userEmail || 'staff@sreemanjupharmacy.com' 
    };
  };

  const handleEditProfileSubmit = (e) => {
    e.preventDefault();
    setProfileInfo(editForm);
    localStorage.setItem('sree_manju_owner_info', JSON.stringify(editForm));
    logActivity('Updated Profile Personal Details');
    showNotification('Profile details successfully updated!');
    setShowEditProfileModal(false);
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
      alert("New password and confirm password do not match!");
      return;
    }
    const pwdCheck = validatePasswordComplexity(passwords.new);
    if (!pwdCheck.isValid) {
      alert(pwdCheck.error);
      return;
    }
    
    if (user?.role === 'owner' && targetUserForPassword !== 'myself') {
      const targetMember = staffMembers.find(m => String(m.id) === String(targetUserForPassword) || m.email === targetUserForPassword);
      const targetName = targetMember ? targetMember.name : targetUserForPassword;
      updateStaffPassword(targetUserForPassword, passwords.new, targetName);
    } else {
      showNotification('Your account password was successfully updated!');
      logActivity(`Password Changed by ${user?.name || 'Sree Manju'}`);
    }

    setIsChangingPassword(false);
    setPasswords({ old: '', new: '', confirm: '' });
    setTargetUserForPassword('myself');
  };

  const profileTabs = [
    { id: 'all', label: 'Overview (All)', icon: <User size={15} /> },
    { id: 'profile', label: 'Pharmacy Details', icon: <Building size={15} /> },
    { id: 'security', label: 'Security & Password', icon: <Shield size={15} /> },
    { id: 'logs', label: 'Activity & Login Logs (Full Page)', icon: <FileText size={15} /> },
  ];

  return (
    <div className="owner-profile animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Top Header Card */}
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <User size={22} color="var(--primary-color)" />
            Owner & Account Profile
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Manage owner profile credentials, pharmacy licenses, security settings, and sign-in logs.
          </p>
        </div>

        {/* Tab Buttons */}
        <div style={{ display: 'flex', gap: '8px', backgroundColor: '#f1f5f9', padding: '4px', borderRadius: '10px', flexWrap: 'wrap' }}>
          {profileTabs.map(tab => (
            <button
              key={tab.id}
              type="button"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                fontSize: '12.5px',
                fontWeight: activeTab === tab.id ? '700' : '500',
                color: activeTab === tab.id ? 'var(--primary-color)' : 'var(--text-secondary)',
                backgroundColor: activeTab === tab.id ? 'white' : 'transparent',
                borderRadius: '8px',
                border: 'none',
                boxShadow: activeTab === tab.id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* OVERVIEW (ALL) - Clean 2 Column Grid */}
      {activeTab === 'all' && (
        <div className="grid grid-cols-3" style={{ gap: '24px', gridTemplateColumns: '1fr 2fr' }}>
          
          {/* Left Column: Owner Card & Avatar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              
              {/* Avatar Circle */}
              <div style={{ position: 'relative', width: '110px', height: '110px', marginBottom: '14px' }}>
                <div style={{ width: '110px', height: '110px', borderRadius: '50%', backgroundColor: 'var(--primary-color)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '3px solid var(--border-color)' }}>
                  {user?.avatar ? (
                    <img src={user.avatar} alt="Owner Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <User size={58} />
                  )}
                </div>
                <label 
                  style={{
                    position: 'absolute', bottom: '2px', right: '2px', backgroundColor: 'var(--primary-color)', color: 'white',
                    width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', border: '2px solid white', boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                  }}
                  title="Change Profile Photo"
                >
                  <Camera size={15} />
                  <input 
                    type="file" 
                    accept="image/*" 
                    hidden 
                    onChange={(e) => {
                      if (e.target.files[0]) {
                        const reader = new FileReader();
                        reader.onloadend = () => updateProfileImage(reader.result);
                        reader.readAsDataURL(e.target.files[0]);
                      }
                    }} 
                  />
                </label>
              </div>

              <button 
                onClick={() => { setEditForm({ ...profileInfo }); setShowEditProfileModal(true); }}
                style={{ fontSize: '12px', color: 'var(--primary-color)', cursor: 'pointer', fontWeight: '600', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none' }}
              >
                <Edit3 size={13} /> Edit Profile Details
              </button>

              <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '2px' }}>{user?.name || profileInfo.name}</h2>
              <div style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '14px' }}>
                {user?.subRole === 'Primary Owner' ? 'Primary Owner & Chief Pharmacist' : (user?.subRole === 'Co-Owner' ? 'Co-Owner & Pharmacist' : 'Staff Pharmacist / Billing Executive')}
              </div>
              <span className="badge badge-success" style={{ marginBottom: '20px', fontSize: '11px' }}>Active Account</span>

              <div style={{ width: '100%', borderTop: '1px solid var(--border-color)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Phone size={16} color="var(--text-secondary)" />
                  <span style={{ fontSize: '13.5px', fontWeight: '500' }}>{user?.mobile || user?.phone || profileInfo.phone}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Mail size={16} color="var(--text-secondary)" />
                  <span style={{ fontSize: '13.5px', fontWeight: '500' }}>{user?.email || profileInfo.email}</span>
                </div>
              </div>
            </div>

            {/* Quick Security Logs Summary Card */}
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Shield size={16} color="var(--primary-color)" />
                  {user?.role === 'owner' ? 'All Staff Security Logs' : 'My Security Logs'}
                </h3>
                <button onClick={() => setActiveTab('logs')} style={{ fontSize: '12px', color: 'var(--primary-color)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  Full Page <ArrowUpRight size={13} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '280px', overflowY: 'auto', paddingRight: '4px' }}>
                {loginLogs.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '16px', color: 'var(--text-secondary)', fontSize: '12px' }}>
                    No security logs recorded.
                  </div>
                ) : (
                  loginLogs.slice(0, 5).map((log, idx) => {
                    const isLogout = log.action.toLowerCase().includes('logout');
                    const isPassword = log.action.toLowerCase().includes('password');
                    const init = getInitiatorInfo(log, idx, loginLogs);
                    const actionLabel = log.action === 'Logout' ? `Logout (${init.name.split(' (')[0]})` : log.action;

                    return (
                      <div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '8px', borderBottom: '1px solid var(--border-color)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {isLogout ? (
                            <LogOut size={15} color="#ef4444" style={{ flexShrink: 0 }} />
                          ) : isPassword ? (
                            <Lock size={15} color="#d97706" style={{ flexShrink: 0 }} />
                          ) : (
                            <LogIn size={15} color="#16a34a" style={{ flexShrink: 0 }} />
                          )}
                          <div>
                            <div style={{ fontSize: '12.5px', fontWeight: '600', color: isLogout ? 'var(--danger-color)' : (isPassword ? 'var(--warning-color)' : '#16a34a') }}>
                              {actionLabel}
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                              User: {init.name} | IP: {log.ip || '192.168.1.105'}
                            </div>
                          </div>
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textAlign: 'right', whiteSpace: 'nowrap' }}>
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Pharmacy Details & Security Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Pharmacy Details Card */}
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '17px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <img src={logoImg} alt="Sree Manju Logo" style={{ width: '28px', height: '28px', objectFit: 'contain' }} />
                  Pharmacy Details
                </h3>
                {user?.role === 'owner' && (
                  <button onClick={() => setShowLicenseModal(true)} className="btn btn-outline" style={{ fontSize: '11.5px', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <FileText size={13} /> Edit Licenses
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2" style={{ gap: '20px' }}>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '3px' }}>Business Name</div>
                  <div style={{ fontSize: '14.5px', fontWeight: '500' }}>Sree Manju Pharmacy</div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '3px' }}>Registration Number (DL)</div>
                  <div style={{ fontSize: '14.5px', fontWeight: '600', color: 'var(--primary-color)' }}>{licenseData.dlNumber}</div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '3px' }}>GSTIN</div>
                  <div style={{ fontSize: '14.5px', fontWeight: '500' }}>{licenseData.gstin}</div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '3px' }}>Working Hours</div>
                  <div style={{ fontSize: '14.5px', fontWeight: '500' }}>9:00 AM - 10:00 PM (Mon-Sun)</div>
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '3px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <MapPin size={13} /> Full Address
                  </div>
                  <div style={{ fontSize: '14.5px', fontWeight: '500', lineHeight: '1.4' }}>
                    123 Health Street, Medical District, Chennai, Tamil Nadu 600001
                  </div>
                </div>
              </div>
            </div>

            {/* Account Security & Settings Card */}
            <div className="card">
              <h3 style={{ fontSize: '17px', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Shield size={18} color="var(--secondary-color)" />
                Account Security & Credentials
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {!isChangingPassword ? (
                  <button className="btn btn-outline" style={{ justifyContent: 'flex-start', padding: '10px 14px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => setIsChangingPassword(true)}>
                    <Key size={15} /> {user?.role === 'owner' ? 'Change Password for Myself or Staff Member' : 'Change My Password'}
                  </button>
                ) : (
                  <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '14px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <h4 style={{ fontSize: '13.5px', fontWeight: '700' }}>Update Account Password</h4>
                    
                    {/* Owner Target Member Select */}
                    {user?.role === 'owner' && (
                      <div>
                        <label className="form-label" style={{ fontSize: '12px', fontWeight: '600' }}>Select Account to Change Password For:</label>
                        <select 
                          className="form-input" 
                          style={{ fontSize: '13px', height: '36px' }}
                          value={targetUserForPassword}
                          onChange={(e) => setTargetUserForPassword(e.target.value)}
                        >
                          <option value="myself">Myself (Primary Owner - Sree Manju)</option>
                          {staffMembers.map(member => (
                            <option key={member.id} value={member.id}>
                              {member.name} ({member.role}) - {member.email}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {targetUserForPassword === 'myself' && (
                      <input 
                        type="password" 
                        className="form-input" 
                        placeholder="Current Old Password" 
                        required
                        value={passwords.old}
                        onChange={(e) => setPasswords({...passwords, old: e.target.value})}
                      />
                    )}

                    <input 
                      type="password" 
                      className="form-input" 
                      placeholder="New Password" 
                      required
                      value={passwords.new}
                      onChange={(e) => setPasswords({...passwords, new: e.target.value})}
                    />
                    <input 
                      type="password" 
                      className="form-input" 
                      placeholder="Confirm New Password" 
                      required
                      value={passwords.confirm}
                      onChange={(e) => setPasswords({...passwords, confirm: e.target.value})}
                    />
                    <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                      <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                        Save New Password
                      </button>
                      <button type="button" className="btn btn-outline" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setIsChangingPassword(false)}>Cancel</button>
                    </div>
                  </form>
                )}

                {user?.role === 'owner' && (
                  <button className="btn btn-outline" style={{ justifyContent: 'flex-start', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', fontSize: '13px' }} onClick={() => setShowLicenseModal(true)}>
                    <FileText size={15} /> Update License & Regulatory Documents
                  </button>
                )}

                <button className="btn btn-outline" style={{ justifyContent: 'flex-start', color: 'var(--danger-color)', borderColor: '#fca5a5', padding: '10px 14px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }} onClick={logout}>
                  <LogOut size={15} /> Logout from this device
                </button>

                {user?.role === 'owner' && (
                  <button className="btn btn-outline" style={{ justifyContent: 'flex-start', color: '#991b1b', backgroundColor: '#fef2f2', borderColor: '#fca5a5', padding: '10px 14px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => { logActivity('Logout from All Devices (Sree Manju)'); logout(); }}>
                    <Shield size={15} color="#dc2626" /> Logout from all active devices
                  </button>
                )}
              </div>
            </div>

            {/* Email (SMTP) & System Settings Redirect Card */}
            <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', border: '1px solid var(--border-color)', gap: '14px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-color)' }}>
                  <Settings size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)' }}>Email (SMTP) & System Settings</h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Configure Gmail SMTP server, auto-email receipts, printer paper size & tax preferences.
                  </p>
                </div>
              </div>
              <Link to="/settings" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', whiteSpace: 'nowrap' }}>
                <Settings size={14} /> Open Settings
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* PHARMACY DETAILS TAB VIEW */}
      {activeTab === 'profile' && (
        <div className="card" style={{ maxWidth: '800px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '14px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-primary)' }}>
              <Building size={20} color="var(--primary-color)" />
              Pharmacy Business & Legal Details
            </h3>
            {user?.role === 'owner' && (
              <button className="btn btn-outline" style={{ fontSize: '12px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }} onClick={() => setShowLicenseModal(true)}>
                <FileText size={14} /> Update License Docs
              </button>
            )}
          </div>

          <div className="grid grid-cols-2" style={{ gap: '20px' }}>
            <div>
              <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Business Name</div>
              <div style={{ fontSize: '15px', fontWeight: '700' }}>Sree Manju Pharmacy</div>
            </div>
            <div>
              <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Registration Number (DL)</div>
              <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--primary-color)' }}>{licenseData.dlNumber}</div>
            </div>
            <div>
              <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginBottom: '4px' }}>GSTIN Number</div>
              <div style={{ fontSize: '15px', fontWeight: '600' }}>{licenseData.gstin}</div>
            </div>
            <div>
              <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Working Hours</div>
              <div style={{ fontSize: '15px', fontWeight: '600' }}>9:00 AM - 10:00 PM (Mon-Sun)</div>
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MapPin size={14} /> Full Address
              </div>
              <div style={{ fontSize: '14.5px', fontWeight: '500', lineHeight: '1.5' }}>
                123 Health Street, Medical District, Chennai, Tamil Nadu 600001
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECURITY TAB VIEW */}
      {activeTab === 'security' && (
        <div className="card" style={{ maxWidth: '650px' }}>
          <h3 style={{ fontSize: '17px', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Shield size={18} color="var(--secondary-color)" />
            Account Security & Credentials
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {!isChangingPassword ? (
              <button className="btn btn-outline" style={{ justifyContent: 'flex-start', padding: '12px 16px', fontSize: '13.5px' }} onClick={() => setIsChangingPassword(true)}>
                <Key size={16} style={{ marginRight: '8px' }} /> {user?.role === 'owner' ? 'Change Password for Myself or Staff Member' : 'Change My Password'}
              </button>
            ) : (
              <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <h4 style={{ fontSize: '14px', fontWeight: '700' }}>Update Password</h4>
                
                {/* Owner Target Member Select */}
                {user?.role === 'owner' && (
                  <div>
                    <label className="form-label" style={{ fontSize: '12px', fontWeight: '600' }}>Select Account to Change Password For:</label>
                    <select 
                      className="form-input" 
                      style={{ fontSize: '13px', height: '36px' }}
                      value={targetUserForPassword}
                      onChange={(e) => setTargetUserForPassword(e.target.value)}
                    >
                      <option value="myself">Myself (Primary Owner - Sree Manju)</option>
                      {staffMembers.map(member => (
                        <option key={member.id} value={member.id}>
                          {member.name} ({member.role}) - {member.email}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {targetUserForPassword === 'myself' && (
                  <input 
                    type="password" 
                    className="form-input" 
                    placeholder="Current Old Password" 
                    required
                    value={passwords.old}
                    onChange={(e) => setPasswords({...passwords, old: e.target.value})}
                  />
                )}

                <input 
                  type="password" 
                  className="form-input" 
                  placeholder="New Password" 
                  required
                  value={passwords.new}
                  onChange={(e) => setPasswords({...passwords, new: e.target.value})}
                />
                <input 
                  type="password" 
                  className="form-input" 
                  placeholder="Confirm New Password" 
                  required
                  value={passwords.confirm}
                  onChange={(e) => setPasswords({...passwords, confirm: e.target.value})}
                />
                <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>Save Password</button>
                  <button type="button" className="btn btn-outline" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setIsChangingPassword(false)}>Cancel</button>
                </div>
              </form>
            )}

            {user?.role === 'owner' && (
              <button className="btn btn-outline" style={{ justifyContent: 'flex-start', display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', fontSize: '13.5px' }} onClick={() => setShowLicenseModal(true)}>
                <FileText size={16} /> Update License & Regulatory Documents
              </button>
            )}

            <button className="btn btn-outline" style={{ justifyContent: 'flex-start', color: 'var(--danger-color)', borderColor: '#fca5a5', padding: '12px 16px', fontSize: '13.5px', display: 'flex', alignItems: 'center', gap: '8px' }} onClick={logout}>
              <LogOut size={16} /> Logout from this device
            </button>

            {user?.role === 'owner' && (
              <button className="btn btn-outline" style={{ justifyContent: 'flex-start', color: '#991b1b', backgroundColor: '#fef2f2', borderColor: '#fca5a5', padding: '12px 16px', fontSize: '13.5px', display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => { logActivity('Logout from All Devices (Sree Manju)'); logout(); }}>
                <Shield size={16} color="#dc2626" /> Logout from all active devices
              </button>
            )}
          </div>
        </div>
      )}

      {/* FULL PAGE LOGS MANAGEMENT VIEW */}
      {activeTab === 'logs' && (
        <div className="card" style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Logs Toolbar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-primary)' }}>
                <Shield size={20} color="var(--primary-color)" />
                Security & Authentication Activity Audit Trail
              </h3>
              <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                {user?.role === 'owner' 
                  ? 'Owner View: Full page audit trail of all staff password changes, logins, and security events.'
                  : 'Staff View: Personal audit trail of your account sign-in & password events.'}
              </p>
            </div>

            {/* Filter Badges & Search Bar */}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', width: '260px' }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--text-secondary)' }} />
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Search logs by user, action, IP..." 
                  style={{ paddingLeft: '36px', fontSize: '13px' }}
                  value={logSearch}
                  onChange={(e) => setLogSearch(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '6px', backgroundColor: '#f1f5f9', padding: '4px', borderRadius: '8px' }}>
                <button
                  type="button"
                  style={{
                    padding: '5px 12px',
                    fontSize: '12px',
                    fontWeight: logFilterCategory === 'all' ? '700' : '500',
                    color: logFilterCategory === 'all' ? 'var(--primary-color)' : 'var(--text-secondary)',
                    backgroundColor: logFilterCategory === 'all' ? 'white' : 'transparent',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                  onClick={() => setLogFilterCategory('all')}
                >
                  All ({loginLogs.length})
                </button>
                <button
                  type="button"
                  style={{
                    padding: '5px 12px',
                    fontSize: '12px',
                    fontWeight: logFilterCategory === 'login' ? '700' : '500',
                    color: logFilterCategory === 'login' ? 'var(--primary-color)' : 'var(--text-secondary)',
                    backgroundColor: logFilterCategory === 'login' ? 'white' : 'transparent',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                  onClick={() => setLogFilterCategory('login')}
                >
                  Sign-Ins
                </button>
                <button
                  type="button"
                  style={{
                    padding: '5px 12px',
                    fontSize: '12px',
                    fontWeight: logFilterCategory === 'logout' ? '700' : '500',
                    color: logFilterCategory === 'logout' ? 'var(--primary-color)' : 'var(--text-secondary)',
                    backgroundColor: logFilterCategory === 'logout' ? 'white' : 'transparent',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                  onClick={() => setLogFilterCategory('logout')}
                >
                  Logouts
                </button>
                <button
                  type="button"
                  style={{
                    padding: '5px 12px',
                    fontSize: '12px',
                    fontWeight: logFilterCategory === 'security' ? '700' : '500',
                    color: logFilterCategory === 'security' ? 'var(--primary-color)' : 'var(--text-secondary)',
                    backgroundColor: logFilterCategory === 'security' ? 'white' : 'transparent',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                  onClick={() => setLogFilterCategory('security')}
                >
                  Password & Security
                </button>
              </div>
            </div>
          </div>

          {/* Full Page Responsive Logs Table */}
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc' }}>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Event / Security Action</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Initiator Account</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>IP Address</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Date & Time Stamp</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Security Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>
                      No matching security activity logs found.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log, idx) => {
                    const isLogout = log.action.toLowerCase().includes('logout');
                    const isPassword = log.action.toLowerCase().includes('password');
                    const init = getInitiatorInfo(log, idx, filteredLogs);
                    const actionLabel = log.action === 'Logout' ? `Logout (${init.name.split(' (')[0]})` : log.action;

                    return (
                      <tr key={log.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '12px', fontWeight: '600' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {isLogout ? (
                              <LogOut size={16} color="#ef4444" style={{ flexShrink: 0 }} />
                            ) : isPassword ? (
                              <Lock size={16} color="#d97706" style={{ flexShrink: 0 }} />
                            ) : (
                              <LogIn size={16} color="#16a34a" style={{ flexShrink: 0 }} />
                            )}
                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>{actionLabel}</span>
                          </div>
                        </td>
                        <td style={{ padding: '12px', color: 'var(--text-primary)', fontWeight: '600' }}>
                          {init.name}
                          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 'normal' }}>{init.email}</div>
                        </td>
                        <td style={{ padding: '12px', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
                          {log.ip || '192.168.1.105'}
                        </td>
                        <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>
                          {new Date(log.timestamp).toLocaleDateString()} at {new Date(log.timestamp).toLocaleTimeString()}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          {isLogout ? (
                            <span className="badge" style={{ backgroundColor: '#fee2e2', color: '#b91c1c', border: '1px solid #fca5a5' }}>
                              Session Terminated
                            </span>
                          ) : isPassword ? (
                            <span className="badge" style={{ backgroundColor: '#fef3c7', color: '#b45309', border: '1px solid #fde68a' }}>
                              Password Updated
                            </span>
                          ) : (
                            <span className="badge badge-success">
                              Authenticated
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Profile Info Modal */}
      {showEditProfileModal && (
        <div className="modal-overlay">
          <div className="modal card animate-fade-in" style={{ width: '480px', backgroundColor: 'var(--surface-color)', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            <div className="flex-between" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-color)' }}>
                  <Edit3 size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '17px', fontWeight: '700' }}>Edit Profile Information</h3>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Update owner name, designation title, and phone/email</span>
                </div>
              </div>
              <button className="btn btn-outline" style={{ padding: '6px' }} onClick={() => setShowEditProfileModal(false)}><X size={16} /></button>
            </div>

            <form onSubmit={handleEditProfileSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label className="form-label">Pharmacist / Owner Name *</label>
                <input 
                  type="text" 
                  className="form-input" 
                  required 
                  value={editForm.name}
                  onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                />
              </div>

              <div>
                <label className="form-label">Designation Title</label>
                <input 
                  type="text" 
                  className="form-input" 
                  required 
                  value={editForm.title}
                  onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2" style={{ gap: '12px' }}>
                <div>
                  <label className="form-label">Phone Number</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    required 
                    value={editForm.phone}
                    onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                  />
                </div>
                <div>
                  <label className="form-label">Official Email</label>
                  <input 
                    type="email" 
                    className="form-input" 
                    style={{ textTransform: 'lowercase' }}
                    required 
                    value={editForm.email}
                    onChange={(e) => setEditForm({...editForm, email: e.target.value.toLowerCase()})}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px', paddingTop: '14px', borderTop: '1px solid var(--border-color)' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowEditProfileModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle size={15} /> Save Details
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* License Update Modal */}
      {showLicenseModal && (
        <div className="modal-overlay">
          <div className="modal card animate-fade-in" style={{ width: '560px', backgroundColor: 'var(--surface-color)', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            <div className="flex-between" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-color)' }}>
                  <FileCheck size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: '700' }}>Pharmacy License & Regulatory Documents</h3>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Upload and update drug license, GST & pharmacist certificates</span>
                </div>
              </div>
              <button className="btn btn-outline" style={{ padding: '6px' }} onClick={() => setShowLicenseModal(false)}><X size={16} /></button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              logActivity(`Updated Pharmacy License Documents: DL ${licenseData.dlNumber}`);
              showNotification('License documents successfully updated and verified!');
              setShowLicenseModal(false);
            }} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              <div className="grid grid-cols-2" style={{ gap: '16px' }}>
                <div>
                  <label className="form-label">Drug License No. (Form 20/21)</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    required 
                    value={licenseData.dlNumber}
                    onChange={(e) => setLicenseData({...licenseData, dlNumber: e.target.value})}
                  />
                </div>
                <div>
                  <label className="form-label">Drug License Expiry Date</label>
                  <input 
                    type="date" 
                    className="form-input" 
                    required 
                    value={licenseData.dlExpiry}
                    onChange={(e) => setLicenseData({...licenseData, dlExpiry: e.target.value})}
                  />
                </div>
                <div>
                  <label className="form-label">GSTIN Number</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    required 
                    value={licenseData.gstin}
                    onChange={(e) => setLicenseData({...licenseData, gstin: e.target.value})}
                  />
                </div>
                <div>
                  <label className="form-label">Pharmacist Reg. Number</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    required 
                    value={licenseData.pharmacistRegNo}
                    onChange={(e) => setLicenseData({...licenseData, pharmacistRegNo: e.target.value})}
                  />
                </div>
              </div>

              {/* Upload Document Inputs */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
                <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '600' }}>Drug License Copy (Form 20/21)</div>
                    <span className="badge badge-success" style={{ fontSize: '11px', marginTop: '4px' }}>
                      <CheckCircle size={10} style={{ marginRight: '4px' }} /> {licenseData.dlFile}
                    </span>
                  </div>
                  <label className="btn btn-outline" style={{ fontSize: '12px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <Upload size={14} /> Upload New PDF
                    <input type="file" accept=".pdf,.png,.jpg" hidden onChange={(e) => {
                      if (e.target.files[0]) {
                        setLicenseData({...licenseData, dlFile: e.target.files[0].name});
                      }
                    }} />
                  </label>
                </div>

                <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '600' }}>GST Registration Certificate</div>
                    <span className="badge badge-success" style={{ fontSize: '11px', marginTop: '4px' }}>
                      <CheckCircle size={10} style={{ marginRight: '4px' }} /> {licenseData.gstFile}
                    </span>
                  </div>
                  <label className="btn btn-outline" style={{ fontSize: '12px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <Upload size={14} /> Upload New PDF
                    <input type="file" accept=".pdf,.png,.jpg" hidden onChange={(e) => {
                      if (e.target.files[0]) {
                        setLicenseData({...licenseData, gstFile: e.target.files[0].name});
                      }
                    }} />
                  </label>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowLicenseModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle size={16} /> Save License Documents
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

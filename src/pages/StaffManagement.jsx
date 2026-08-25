import { useState } from 'react';
import { UserCheck, UserPlus, Search, Shield, Phone, Mail, Clock, CheckCircle, X, Key, Eye, EyeOff, Users } from 'lucide-react';
import { useAppContext, validatePasswordComplexity } from '../context/AppContext';

export default function StaffManagement() {
  const { user, staffMembers, registeredUsers, addStaffMember, toggleStaffStatus, updateStaffPassword } = useAppContext();

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);

  // State to track visible passwords per staff ID: { [memberId]: boolean }
  const [visiblePasswords, setVisiblePasswords] = useState({});

  // Password Reset Modal State
  const [passwordModalMember, setPasswordModalMember] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [newStaff, setNewStaff] = useState({
    name: '',
    role: 'Pharmacist',
    email: '',
    phone: '',
    shift: 'Morning (8:00 AM - 4:00 PM)',
    tempPassword: ''
  });

  if (user?.role !== 'owner') {
    return (
      <div className="card animate-fade-in" style={{ textAlign: 'center', padding: '60px 20px', maxWidth: '600px', margin: '40px auto' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#fee2e2', color: 'var(--danger-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto' }}>
          <Shield size={32} />
        </div>
        <h2 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '8px' }}>Access Restricted (Owner Only)</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6', marginBottom: '24px' }}>
          Only the primary **Pharmacy Owner** has administrative permissions to view passwords, register, or change credentials for staff members.
        </p>
        <a href="/" className="btn btn-primary">Return to Dashboard</a>
      </div>
    );
  }

  const togglePasswordVisibility = (id) => {
    setVisiblePasswords(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const filteredStaff = (staffMembers || []).filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(search.toLowerCase()) ||
                          member.role.toLowerCase().includes(search.toLowerCase()) ||
                          member.phone.includes(search);
    let matchesRole = true;
    if (roleFilter !== 'all') {
      matchesRole = member.role.toLowerCase().includes(roleFilter.toLowerCase());
    }
    return matchesSearch && matchesRole;
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newStaff.name || !newStaff.email || !newStaff.phone) {
      alert("Please fill in all required fields!");
      return;
    }
    const pwdCheck = validatePasswordComplexity(newStaff.tempPassword);
    if (!pwdCheck.isValid) {
      alert(pwdCheck.error);
      return;
    }
    addStaffMember(newStaff);
    setShowModal(false);
    setNewStaff({
      name: '',
      role: 'Pharmacist',
      email: '',
      phone: '',
      shift: 'Morning (8:00 AM - 4:00 PM)',
      tempPassword: ''
    });
  };

  const handlePasswordResetSubmit = (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert("New password and confirm password do not match!");
      return;
    }
    const pwdCheck = validatePasswordComplexity(newPassword);
    if (!pwdCheck.isValid) {
      alert(pwdCheck.error);
      return;
    }

    updateStaffPassword(passwordModalMember.id, newPassword, passwordModalMember.name);
    setPasswordModalMember(null);
    setNewPassword('');
    setConfirmPassword('');
  };

  const primaryOwnerCount = (registeredUsers || []).filter(u => u.role === 'primary_owner' || u.role === 'owner').length || 1;
  const coOwnerCount = (registeredUsers || []).filter(u => u.role === 'co_owner').length;
  const staffCount = (staffMembers || []).length;

  return (
    <div className="staff-management-page animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header Card */}
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <UserCheck size={24} color="var(--primary-color)" />
            Staff & Team Management
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Register co-owners, view active staff passwords, and manage credentials for team members.
          </p>
        </div>

        <button className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }} onClick={() => setShowModal(true)}>
          <UserPlus size={18} /> Register New Staff
        </button>
      </div>

      {/* System Quota Capacity Banner */}
      <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', padding: '12px 18px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ fontSize: '13px', fontWeight: '700', color: '#15803d', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Users size={18} color="#16a34a" /> OWNER &amp; STAFF CREDENTIALS CAPACITY
        </div>
        <div style={{ fontSize: '13px', color: '#166534', fontWeight: '600', display: 'flex', gap: '20px' }}>
          <span>• Primary Owner: <strong style={{ color: '#15803d' }}>{primaryOwnerCount}/1</strong></span>
          <span>• Co-Owner: <strong style={{ color: '#15803d' }}>{coOwnerCount}/1</strong></span>
          <span>• Staff: <strong style={{ color: '#15803d' }}>{staffCount} (Unlimited)</strong></span>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="card" style={{ padding: '16px', display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', width: '280px' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--text-secondary)' }} />
          <input 
            type="text" 
            className="form-input" 
            placeholder="Search staff by name, role, phone..." 
            style={{ paddingLeft: '38px', height: '38px' }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#f8fafc', padding: '4px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', height: '38px' }}>
          <Shield size={16} color="var(--text-secondary)" />
          <select 
            style={{ background: 'transparent', border: 'none', outline: 'none', cursor: 'pointer', fontSize: '13px', color: 'var(--text-primary)' }}
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="all">All Roles & Members</option>
            <option value="co-owner">Co-Owner</option>
            <option value="pharmacist">Pharmacist</option>
            <option value="staff">Staff</option>
          </select>
        </div>
      </div>

      {/* Staff Grid */}
      <div className="grid grid-cols-3" style={{ gap: '20px' }}>
        {filteredStaff.map(member => {
          const isPasswordShown = visiblePasswords[member.id];
          const pwd = member.password || (member.role.includes('Owner') ? 'ownerpassword123' : 'staff12345');

          return (
            <div key={member.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}>
              <div className="flex-between" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: member.role.includes('Owner') ? 'var(--primary-color)' : '#e0f2fe', color: member.role.includes('Owner') ? 'white' : 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '16px' }}>
                    {member.name.charAt(0)}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: '700' }}>{member.name}</h3>
                    <span className="badge badge-success" style={{ fontSize: '11px', marginTop: '2px', backgroundColor: member.role.includes('Owner') ? '#e0f2fe' : '#ecfdf5', color: member.role.includes('Owner') ? '#0369a1' : '#15803d' }}>
                      {member.role}
                    </span>
                  </div>
                </div>

                <span className={`badge ${member.status === 'Active' ? 'badge-success' : 'badge-danger'}`}>
                  {member.status}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Phone size={15} color="var(--primary-color)" /> {member.phone}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Mail size={15} color="var(--primary-color)" /> {member.email}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Clock size={15} color="var(--primary-color)" /> {member.shift || 'General Shift'}
                </div>

                {/* Owner Only View Staff Current Password Field */}
                <div style={{ backgroundColor: '#f8fafc', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', marginTop: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '500' }}>Current Password (Owner View)</div>
                    <div style={{ fontSize: '13.5px', fontWeight: '700', fontFamily: 'monospace', color: 'var(--text-primary)', marginTop: '2px' }}>
                      {isPasswordShown ? pwd : '••••••••••••'}
                    </div>
                  </div>
                  <button 
                    type="button"
                    onClick={() => togglePasswordVisibility(member.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary-color)', padding: '4px' }}
                    title={isPasswordShown ? "Hide Password" : "Show Password"}
                  >
                    {isPasswordShown ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Actions Row */}
              <div style={{ marginTop: 'auto', paddingTop: '14px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                
                <button 
                  className="btn btn-outline" 
                  style={{ padding: '4px 10px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                  onClick={() => setPasswordModalMember(member)}
                  title="Change Password"
                >
                  <Key size={13} color="var(--primary-color)" /> Change Password
                </button>
                
                {!member.role.includes('Owner') && (
                  <button 
                    className={`btn ${member.status === 'Active' ? 'btn-outline' : 'btn-primary'}`} 
                    style={{ padding: '4px 10px', fontSize: '12px' }}
                    onClick={() => toggleStaffStatus(member.id)}
                  >
                    {member.status === 'Active' ? 'Deactivate' : 'Activate'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Owner Staff Password Change Modal */}
      {passwordModalMember && (
        <div className="modal-overlay">
          <div className="modal card animate-fade-in" style={{ width: '450px', backgroundColor: 'var(--surface-color)', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            <div className="flex-between" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '14px', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#b45309' }}>
                  <Key size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '17px', fontWeight: '700' }}>Change Staff Password</h3>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Owner reset for {passwordModalMember.name}</span>
                </div>
              </div>
              <button className="btn btn-outline" style={{ padding: '6px' }} onClick={() => setPasswordModalMember(null)}><X size={16} /></button>
            </div>

            <form onSubmit={handlePasswordResetSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label className="form-label">Staff Member</label>
                <input 
                  type="text" 
                  className="form-input" 
                  disabled 
                  value={`${passwordModalMember.name} (${passwordModalMember.role})`}
                  style={{ backgroundColor: '#f8fafc', fontWeight: '600' }}
                />
              </div>

              {/* Show Existing Current Password */}
              <div style={{ backgroundColor: '#f1f5f9', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600' }}>Current Active Password</div>
                <div style={{ fontSize: '14px', fontWeight: '700', fontFamily: 'monospace', color: 'var(--primary-color)', marginTop: '2px' }}>
                  {passwordModalMember.password || (passwordModalMember.role.includes('Owner') ? 'ownerpassword123' : 'staff12345')}
                </div>
              </div>

              <div>
                <label className="form-label">New Password *</label>
                <input 
                  type="password" 
                  className="form-input" 
                  placeholder="Enter new password" 
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>

              <div>
                <label className="form-label">Confirm New Password *</label>
                <input 
                  type="password" 
                  className="form-input" 
                  placeholder="Confirm new password" 
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px', paddingTop: '14px', borderTop: '1px solid var(--border-color)' }}>
                <button type="button" className="btn btn-outline" onClick={() => setPasswordModalMember(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle size={15} /> Save New Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Registration Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal card animate-fade-in" style={{ width: '520px', backgroundColor: 'var(--surface-color)', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            <div className="flex-between" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-color)' }}>
                  <UserPlus size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: '700' }}>Register Staff Member</h3>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Primary Owner creation of staff account</span>
                </div>
              </div>
              <button className="btn btn-outline" style={{ padding: '6px' }} onClick={() => setShowModal(false)}><X size={16} /></button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="form-label">Full Name *</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Dr. Rajesh Verma" 
                  required
                  value={newStaff.name}
                  onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2" style={{ gap: '16px' }}>
                <div>
                  <label className="form-label">System Role *</label>
                  <select 
                    className="form-input" 
                    value={newStaff.role}
                    onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value })}
                  >
                    <option value="Co-Owner">Co-Owner</option>
                    <option value="Pharmacist">Pharmacist</option>
                    <option value="Staff">Staff</option>
                  </select>
                </div>

                <div>
                  <label className="form-label">Working Shift</label>
                  <select 
                    className="form-input" 
                    value={newStaff.shift}
                    onChange={(e) => setNewStaff({ ...newStaff, shift: e.target.value })}
                  >
                    <option value="Morning (8:00 AM - 4:00 PM)">Morning Shift</option>
                    <option value="Evening (2:00 PM - 10:00 PM)">Evening Shift</option>
                    <option value="Night Shift (10:00 PM - 6:00 AM)">Night Shift</option>
                    <option value="Full Time (General)">Full Time</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2" style={{ gap: '16px' }}>
                <div>
                  <label className="form-label">Mobile Number (10 Digits) *</label>
                  <input 
                    type="tel" 
                    className="form-input" 
                    placeholder="Enter 10-Digit Mobile Number" 
                    maxLength={10}
                    required
                    value={newStaff.phone}
                    onChange={(e) => {
                      const onlyNums = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setNewStaff({ ...newStaff, phone: onlyNums });
                    }}
                  />
                </div>

                <div>
                  <label className="form-label">Email Address *</label>
                  <input 
                    type="email" 
                    className="form-input" 
                    placeholder="staff@sreemanjupharmacy.com" 
                    style={{ textTransform: 'lowercase' }}
                    required
                    value={newStaff.email}
                    onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value.toLowerCase() })}
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Set Initial Login Password *</label>
                <input 
                  type="password" 
                  className="form-input" 
                  placeholder="Set initial password for login" 
                  required
                  value={newStaff.tempPassword}
                  onChange={(e) => setNewStaff({ ...newStaff, tempPassword: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle size={16} /> Register & Grant Access
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

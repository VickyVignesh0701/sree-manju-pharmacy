import { useState } from 'react';
import { UserCheck, UserPlus, Search, Shield, Phone, Mail, Clock, CheckCircle, X, Key, Users, AlertCircle } from 'lucide-react';
import { useAppContext, validatePasswordComplexity } from '../context/AppContext';

const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).toLowerCase());
};

export default function StaffManagement() {
  const { user, staffMembers, staffLoading, staffError, addStaffMember, toggleStaffStatus, updateStaffPassword } = useAppContext();

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [modalError, setModalError] = useState('');
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Password Reset Modal State
  const [passwordModalMember, setPasswordModalMember] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetModalError, setResetModalError] = useState('');
  const [resetSubmitted, setResetSubmitted] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

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

  const filteredStaff = (staffMembers || []).filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(search.toLowerCase()) ||
                          member.role.toLowerCase().includes(search.toLowerCase()) ||
                          (member.phone || '').includes(search);
    let matchesRole = true;
    if (roleFilter !== 'all') {
      matchesRole = member.role.toLowerCase().includes(roleFilter.toLowerCase());
    }
    return matchesSearch && matchesRole;
  });

  const handleOpenModal = () => {
    setModalError('');
    setFormSubmitted(false);
    setNewStaff({
      name: '',
      role: 'Pharmacist',
      email: '',
      phone: '',
      shift: 'Morning (8:00 AM - 4:00 PM)',
      tempPassword: ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormSubmitted(true);
    setModalError('');

    if (!newStaff.name || !newStaff.name.trim()) {
      setModalError('Full Name is required.');
      return;
    }
    if (!newStaff.email || !newStaff.email.trim() || !isValidEmail(newStaff.email)) {
      setModalError('Valid Email Address is required (e.g. staff@domain.com).');
      return;
    }
    if (!newStaff.phone || !newStaff.phone.trim() || newStaff.phone.trim().length !== 10) {
      setModalError('Valid 10-digit Mobile Phone Number is required.');
      return;
    }
    if (!newStaff.tempPassword) {
      setModalError('Initial Access Password is required.');
      return;
    }
    const pwdCheck = validatePasswordComplexity(newStaff.tempPassword);
    if (!pwdCheck.isValid) {
      setModalError(pwdCheck.error);
      return;
    }

    setIsSaving(true);
    const result = await addStaffMember({
      ...newStaff,
      name: newStaff.name.trim(),
      email: newStaff.email.trim().toLowerCase(),
      phone: newStaff.phone.trim()
    });
    setIsSaving(false);

    if (!result.success) {
      setModalError(result.error);
      return;
    }

    setShowModal(false);
    setFormSubmitted(false);
    setModalError('');
  };

  const handlePasswordResetSubmit = async (e) => {
    e.preventDefault();
    setResetSubmitted(true);
    setResetModalError('');

    if (!newPassword) {
      setResetModalError('New password is required.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setResetModalError('New password and confirm password do not match.');
      return;
    }
    const pwdCheck = validatePasswordComplexity(newPassword);
    if (!pwdCheck.isValid) {
      setResetModalError(pwdCheck.error);
      return;
    }

    setIsResetting(true);
    const result = await updateStaffPassword(passwordModalMember.id, newPassword, passwordModalMember.name);
    setIsResetting(false);

    if (!result.success) {
      setResetModalError(result.error);
      return;
    }

    setPasswordModalMember(null);
    setNewPassword('');
    setConfirmPassword('');
    setResetSubmitted(false);
    setResetModalError('');
  };

  return (
    <div className="staff-management">
      {staffError && (
        <div className="card" style={{ marginBottom: '16px', backgroundColor: '#fef2f2', border: '1px solid #fca5a5', color: '#991b1b', fontSize: '13px', fontWeight: '600' }}>
          ⚠️ {staffError}
        </div>
      )}
      {staffLoading && staffMembers.length === 0 && (
        <div className="card" style={{ marginBottom: '16px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          Loading staff…
        </div>
      )}
      {/* Top Banner Header */}
      <div className="card flex-between" style={{ marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={22} color="var(--primary-color)" /> Staff Members & Access Password Audit
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Manage pharmacy employees, view login passwords, update shifts, and reset credentials.
          </p>
        </div>

        <button className="btn btn-primary" onClick={handleOpenModal} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <UserPlus size={18} /> Add New Staff Member
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between' }}>
          
          <div style={{ position: 'relative', width: '320px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-secondary)' }} />
            <input 
              type="text" 
              className="form-input" 
              placeholder="Search staff name, role or phone..." 
              style={{ paddingLeft: '36px' }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            {['all', 'Pharmacist', 'Cashier', 'Inventory Manager', 'Co-Owner'].map(r => (
              <button
                key={r}
                type="button"
                className={`btn ${roleFilter === r ? 'btn-primary' : 'btn-outline'}`}
                style={{ fontSize: '12px', padding: '6px 14px', borderRadius: '20px' }}
                onClick={() => setRoleFilter(r)}
              >
                {r === 'all' ? 'All Roles' : r}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Staff Grid */}
      <div className="grid grid-cols-3" style={{ gap: '20px' }}>
        {filteredStaff.map(member => {
          return (
            <div key={member.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '14px', position: 'relative' }}>
              <div className="flex-between" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: '#0284c7', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '16px' }}>
                    {member.name.charAt(0)}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)' }}>{member.name}</h3>
                    <span style={{ fontSize: '11px', backgroundColor: '#e0f2fe', color: '#0369a1', fontWeight: '700', padding: '2px 8px', borderRadius: '12px', textTransform: 'uppercase' }}>
                      {member.role}
                    </span>
                  </div>
                </div>

                <button 
                  onClick={() => toggleStaffStatus(member.id)}
                  className={`btn ${member.status === 'Active' ? 'btn-outline' : 'btn-primary'}`}
                  style={{ padding: '4px 10px', fontSize: '11.5px', borderRadius: '14px' }}
                  title="Toggle Staff Active / Suspended Status"
                >
                  {member.status}
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Mail size={15} color="var(--primary-color)" /> {member.email}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Phone size={15} color="var(--primary-color)" /> {member.phone}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Clock size={15} color="var(--primary-color)" /> {member.shift || 'General Shift'}
                </div>
              </div>

              {/* Credentials status - no system should ever be able to show a
                  password back, whether it's hashed server-side or not, so
                  this no longer has a reveal control. */}
              <div style={{ backgroundColor: '#f8fafc', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '10px 12px', marginTop: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                    Account Credentials
                  </span>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: member.credentialsSet ? '#16a34a' : '#b45309', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {member.credentialsSet ? <CheckCircle size={13} /> : <AlertCircle size={13} />}
                    {member.credentialsSet ? 'Password set' : 'Not set up yet'}
                  </span>
                </div>
              </div>

              {/* Reset Password Button */}
              <div style={{ marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid var(--border-color)' }}>
                <button 
                  className="btn btn-outline" 
                  style={{ width: '100%', padding: '6px 12px', fontSize: '12px', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '6px' }}
                  onClick={() => {
                    setResetModalError('');
                    setResetSubmitted(false);
                    setPasswordModalMember(member);
                  }}
                >
                  <Key size={14} /> Change Staff Password
                </button>
              </div>

            </div>
          );
        })}
      </div>

      {/* ADD STAFF MODAL */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="card" style={{ width: '480px', padding: '24px', borderRadius: '16px', backgroundColor: '#ffffff', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UserPlus size={20} color="var(--primary-color)" /> Register New Staff Member
              </h3>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }} onClick={() => setShowModal(false)}>
                <X size={18} />
              </button>
            </div>

            {/* Error Banner */}
            {modalError && (
              <div style={{ backgroundColor: '#fef2f2', border: '1px solid #f87171', borderRadius: '10px', padding: '10px 14px', marginBottom: '16px', color: '#991b1b', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={18} color="#dc2626" style={{ flexShrink: 0 }} />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label className="form-label" style={{ fontSize: '12px', fontWeight: '600' }}>Staff Full Name *</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Ramesh Kumar"
                  style={{ borderColor: formSubmitted && !newStaff.name.trim() ? '#ef4444' : 'var(--border-color)' }}
                  value={newStaff.name}
                  onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="form-label" style={{ fontSize: '12px', fontWeight: '600' }}>Staff Role *</label>
                  <select 
                    className="form-input"
                    value={newStaff.role}
                    onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value })}
                  >
                    <option value="Pharmacist">Pharmacist</option>
                    <option value="Cashier">Cashier</option>
                    <option value="Inventory Manager">Inventory Manager</option>
                    <option value="Co-Owner">Co-Owner</option>
                  </select>
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: '12px', fontWeight: '600' }}>Mobile (10 Digits) *</label>
                  <input 
                    type="tel" 
                    className="form-input" 
                    maxLength={10}
                    placeholder="10-digit mobile"
                    style={{ borderColor: formSubmitted && (!newStaff.phone.trim() || newStaff.phone.trim().length !== 10) ? '#ef4444' : 'var(--border-color)' }}
                    value={newStaff.phone}
                    onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                  />
                </div>
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '12px', fontWeight: '600' }}>Email Address *</label>
                <input 
                  type="email" 
                  className="form-input" 
                  placeholder="ramesh@sreemanjupharmacy.com"
                  style={{ textTransform: 'lowercase', borderColor: formSubmitted && (!newStaff.email.trim() || !isValidEmail(newStaff.email)) ? '#ef4444' : 'var(--border-color)' }}
                  value={newStaff.email}
                  onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value.toLowerCase() })}
                />
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '12px', fontWeight: '600' }}>Initial Access Password *</label>
                <input 
                  type="password" 
                  className="form-input" 
                  placeholder="Set login password (8-16 chars)"
                  style={{ borderColor: formSubmitted && !newStaff.tempPassword ? '#ef4444' : 'var(--border-color)' }}
                  value={newStaff.tempPassword}
                  onChange={(e) => setNewStaff({ ...newStaff, tempPassword: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '12px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)} disabled={isSaving}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={isSaving} style={{ opacity: isSaving ? 0.7 : 1 }}>
                  {isSaving ? 'Saving…' : 'Save Staff Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CHANGE PASSWORD MODAL */}
      {passwordModalMember && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="card" style={{ width: '420px', padding: '24px', borderRadius: '16px', backgroundColor: '#ffffff', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: '700', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Key size={18} color="var(--primary-color)" /> Change Password: {passwordModalMember.name}
              </h3>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }} onClick={() => setPasswordModalMember(null)}>
                <X size={18} />
              </button>
            </div>

            {/* Error Banner */}
            {resetModalError && (
              <div style={{ backgroundColor: '#fef2f2', border: '1px solid #f87171', borderRadius: '10px', padding: '10px 14px', marginBottom: '16px', color: '#991b1b', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={18} color="#dc2626" style={{ flexShrink: 0 }} />
                <span>{resetModalError}</span>
              </div>
            )}

            <form onSubmit={handlePasswordResetSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label className="form-label" style={{ fontSize: '12px', fontWeight: '600' }}>New Password *</label>
                <input 
                  type="password" 
                  className="form-input" 
                  placeholder="Set new password (8-16 chars)"
                  style={{ borderColor: resetSubmitted && !newPassword ? '#ef4444' : 'var(--border-color)' }}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '12px', fontWeight: '600' }}>Confirm New Password *</label>
                <input 
                  type="password" 
                  className="form-input" 
                  placeholder="Confirm new password"
                  style={{ borderColor: resetSubmitted && (!confirmPassword || confirmPassword !== newPassword) ? '#ef4444' : 'var(--border-color)' }}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '12px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setPasswordModalMember(null)} disabled={isResetting}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={isResetting} style={{ opacity: isResetting ? 0.7 : 1 }}>
                  {isResetting ? 'Updating…' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

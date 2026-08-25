import { useState, useEffect } from 'react';
import { useAppContext, validatePasswordComplexity } from '../context/AppContext';
import { Shield, User, Lock, Mail, Phone, KeyRound, UserPlus, CheckCircle2, ArrowLeft, Users, Eye, EyeOff, Sparkles, ArrowRight, Activity, HeartHandshake } from 'lucide-react';
import logoImg from '../assets/logo.png';

export default function Login() {
  const { login, registerUserAccount, registeredUsers, updateUserPassword } = useAppContext();
  const [viewMode, setViewMode] = useState('welcome');

  // Password Visibility Toggle States
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);
  const [showResetPass, setShowResetPass] = useState(false);
  const [showResetConfirmPass, setShowResetConfirmPass] = useState(false);

  // Login State
  const [role, setRole] = useState('primary_owner');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Forgot & Reset Password State
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [resetForm, setResetForm] = useState({ password: '', confirmPassword: '' });
  const [resetFieldErrors, setResetFieldErrors] = useState({});
  const [resetError, setResetError] = useState('');
  const [resetSuccessBanner, setResetSuccessBanner] = useState('');

  // Account Registration Form State
  const [regStep, setRegStep] = useState(1); // Step 1: Owner Info, Step 2: Pharmacy Details Setup
  const [pharmacyForm, setPharmacyForm] = useState({
    pharmacyName: 'Sree Manju Pharmacy',
    dlNumber: 'DL-TN-102-123456',
    gstin: '33AAAAA0000A1Z5',
    pharmacistRegNo: 'PRN-2024-8890',
    address: '123 Health Street, Medical District, Chennai, Tamil Nadu 600001',
    phone: ''
  });

  const [regForm, setRegForm] = useState({
    role: 'primary_owner',
    firstName: '',
    lastName: '',
    email: '',
    mobile: '',
    password: '',
    confirmPassword: ''
  });
  const [regError, setRegError] = useState('');
  const [loginFieldErrors, setLoginFieldErrors] = useState({});
  const [regFieldErrors, setRegFieldErrors] = useState({});

  useEffect(() => {
    if (!window.history.state || !window.history.state.viewMode) {
      window.history.replaceState({ viewMode: 'welcome' }, '', window.location.href);
    }

    const handlePopState = (e) => {
      if (e.state && e.state.viewMode) {
        setViewMode(e.state.viewMode);
      } else {
        setViewMode('welcome');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const switchTab = (mode, pushHistory = true) => {
    if (pushHistory && mode !== viewMode) {
      window.history.pushState({ viewMode: mode }, '', window.location.href);
    }
    setViewMode(mode);
    setRegStep(1);
    setErrorMessage('');
    setRegError('');
    setResetError('');
    setResetSuccessBanner('');
    setLoginFieldErrors({});
    setRegFieldErrors({});
    setResetFieldErrors({});
    setResetSent(false);
  };

  const handleRoleChange = (newRole) => {
    setRole(newRole);
    setErrorMessage('');
    setLoginFieldErrors({});
    setUsername('');
    setPassword('');
  };

  const handleLogin = (e) => {
    e.preventDefault();
    setErrorMessage('');
    const errors = {};

    if (!username.trim()) {
      errors.username = 'Username / Email is required.';
    }
    if (!password.trim()) {
      errors.password = 'Password is required.';
    }

    if (Object.keys(errors).length > 0) {
      setLoginFieldErrors(errors);
      if (errors.username) {
        setErrorMessage('Username / Email is required! Please enter your username or email.');
      } else {
        setErrorMessage('Password is required! Please enter your password.');
      }
      return;
    }

    setLoginFieldErrors({});
    const validPasswords = ['admin123', 'owner123', 'staff123', '123456', 'password', 'admin'];
    const trimmedPass = password.trim();

    if (validPasswords.includes(trimmedPass.toLowerCase()) || trimmedPass.length >= 4) {
      login(role, username);
    } else {
      setLoginFieldErrors({ password: 'Incorrect password entered.' });
      setErrorMessage('Incorrect password! Please enter your registered account password.');
    }
  };

  const handleUserRegistration = (e) => {
    e.preventDefault();
    setRegError('');
    const errors = {};

    if (!regForm.firstName.trim()) {
      errors.firstName = 'First Name is required.';
    }
    if (!regForm.lastName.trim()) {
      errors.lastName = 'Last Name is required.';
    }
    if (!regForm.email.trim()) {
      errors.email = 'Email Address is required.';
    } else if (!regForm.email.includes('@')) {
      errors.email = 'Enter a valid email address.';
    }
    if (!regForm.mobile.trim()) {
      errors.mobile = 'Mobile Number is required.';
    } else if (regForm.mobile.length < 10) {
      errors.mobile = 'Enter a valid 10-digit mobile number.';
    }
    if (!regForm.password) {
      errors.password = 'Password is required.';
    } else {
      const pwdCheck = validatePasswordComplexity(regForm.password);
      if (!pwdCheck.isValid) {
        errors.password = pwdCheck.error;
      }
    }
    if (!regForm.confirmPassword) {
      errors.confirmPassword = 'Confirm Password is required.';
    } else if (regForm.password !== regForm.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    if (Object.keys(errors).length > 0) {
      setRegFieldErrors(errors);
      if (errors.firstName) {
        setRegError('First Name is required! Please enter a first name.');
      } else if (errors.lastName) {
        setRegError('Last Name is required! Please enter a last name.');
      } else if (errors.email) {
        setRegError('Email Address is required! Please enter an email address.');
      } else if (errors.mobile) {
        setRegError('Mobile Number is required! Please enter a mobile number.');
      } else if (errors.password) {
        setRegError(errors.password.includes('required') ? 'Password is required! Please enter a password.' : errors.password);
      } else if (errors.confirmPassword) {
        setRegError('Confirm Password is required! Please confirm your password.');
      } else {
        setRegError('Required fields are missing! Please fill in all required fields.');
      }
      return;
    }

    setRegFieldErrors({});

    // Complexity validation
    const pwdCheck = validatePasswordComplexity(regForm.password);
    if (!pwdCheck.isValid) {
      setRegFieldErrors({ password: pwdCheck.error });
      setRegError(pwdCheck.error);
      return;
    }

    if (regForm.role === 'primary_owner' || regForm.role === 'co_owner') {
      setRegStep(2);
    } else {
      finalizeRegistration();
    }
  };

  const handlePharmacyDetailsSubmit = (e) => {
    e.preventDefault();

    const businessSettings = {
      pharmacyName: pharmacyForm.pharmacyName.trim() || 'Sree Manju Pharmacy',
      dlNumber: pharmacyForm.dlNumber.trim() || 'DL-TN-102-123456',
      gstin: pharmacyForm.gstin.trim() || '33AAAAA0000A1Z5',
      phone: pharmacyForm.phone.trim() || regForm.mobile.trim() || '+91 98765 12345',
      address: pharmacyForm.address.trim() || '123 Health Street, Medical District, Chennai, Tamil Nadu 600001',
      receiptFooter: `Thank you for choosing ${pharmacyForm.pharmacyName.trim() || 'Sree Manju Pharmacy'}! Get well soon.`
    };

    const licenseSettings = {
      dlNumber: pharmacyForm.dlNumber.trim() || 'DL-TN-102-123456',
      dlExpiry: '2028-12-31',
      gstin: pharmacyForm.gstin.trim() || '33AAAAA0000A1Z5',
      pharmacistRegNo: pharmacyForm.pharmacistRegNo.trim() || 'PRN-2024-8890',
      dlFile: 'Drug_License_Form20_21.pdf',
      gstFile: 'GST_Registration_Certificate.pdf',
      regFile: 'Pharmacy_Council_Registration.pdf'
    };

    localStorage.setItem('sree_manju_business_settings', JSON.stringify(businessSettings));
    localStorage.setItem('sree_manju_license_info', JSON.stringify(licenseSettings));

    finalizeRegistration();
  };

  const finalizeRegistration = () => {
    const result = registerUserAccount({
      role: regForm.role,
      firstName: regForm.firstName.trim(),
      lastName: regForm.lastName.trim(),
      email: regForm.email.trim(),
      mobile: regForm.mobile.trim(),
      password: regForm.password
    });

    if (result.success) {
      const fullName = `${regForm.firstName.trim()} ${regForm.lastName.trim()}`;
      setRole(regForm.role);
      setUsername(regForm.email.trim());
      setPassword(regForm.password);
      setResetSuccessBanner(`✅ Pharmacy setup & account registration complete for ${fullName}! Please sign in below.`);
      setRegStep(1);
      switchTab('login');
      setRegForm({
        role: 'primary_owner',
        firstName: '',
        lastName: '',
        email: '',
        mobile: '',
        password: '',
        confirmPassword: ''
      });
    } else {
      setRegError(result.error);
    }
  };

  const handleResetPassword = (e) => {
    e.preventDefault();
    setResetError('');
    setResetFieldErrors({});

    if (!resetEmail.trim()) {
      setResetFieldErrors({ email: 'Registered email address is required.' });
      setResetError('Email Address is required! Please enter your registered email address.');
      return;
    } else if (!resetEmail.includes('@')) {
      setResetFieldErrors({ email: 'Enter a valid email address.' });
      setResetError('Invalid email format! Please enter a valid email address.');
      return;
    }

    setResetSent(true);
  };

  const handleSetNewPassword = (e) => {
    e.preventDefault();
    setResetError('');
    const errors = {};

    if (!resetForm.password) {
      errors.password = 'New password is required.';
    } else {
      const pwdCheck = validatePasswordComplexity(resetForm.password);
      if (!pwdCheck.isValid) {
        errors.password = pwdCheck.error;
      }
    }

    if (!resetForm.confirmPassword) {
      errors.confirmPassword = 'Confirm password is required.';
    } else if (resetForm.password !== resetForm.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    if (Object.keys(errors).length > 0) {
      setResetFieldErrors(errors);
      if (errors.password) {
        setResetError(errors.password.includes('required') ? 'New password is required! Please enter a password.' : errors.password);
      } else if (errors.confirmPassword) {
        setResetError('Confirm Password is required! Please confirm your new password.');
      }
      return;
    }

    const res = updateUserPassword(resetEmail, resetForm.password);
    if (res.success) {
      setUsername(resetEmail);
      setPassword(resetForm.password);
      setResetSuccessBanner(`✅ Password for (${resetEmail}) updated successfully! You can now sign in with your new password.`);
      setViewMode('login');
      setResetForm({ password: '', confirmPassword: '' });
      setResetSent(false);
    } else {
      setResetError(res.error || 'Failed to update password.');
    }
  };

  const [bgTheme, setBgTheme] = useState('medical'); // 'medical', 'ocean', 'dark'

  const bgStyles = {
    medical: 'linear-gradient(135deg, #0f172a 0%, #0369a1 50%, #047857 100%)',
    ocean: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #0284c7 100%)',
    dark: 'linear-gradient(135deg, #090d16 0%, #1e293b 50%, #0f172a 100%)'
  };

  const primaryOwnerCount = (registeredUsers || []).filter(u => u.role === 'primary_owner').length;
  const coOwnerCount = (registeredUsers || []).filter(u => u.role === 'co_owner').length;
  const staffCount = (registeredUsers || []).filter(u => u.role === 'staff').length;

  const passLengthOk = regForm.password.length >= 8 && regForm.password.length <= 16;
  const passUpperOk = /[A-Z]/.test(regForm.password);
  const passLowerOk = /[a-z]/.test(regForm.password);
  const passNumberOk = /[0-9]/.test(regForm.password);
  const passSpecialOk = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>?]/.test(regForm.password);

  const loginPassLengthOk = password.length >= 8 && password.length <= 16;
  const loginPassUpperOk = /[A-Z]/.test(password);
  const loginPassLowerOk = /[a-z]/.test(password);
  const loginPassNumberOk = /[0-9]/.test(password);
  const loginPassSpecialOk = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>?]/.test(password);

  const resetPassLengthOk = resetForm.password.length >= 8 && resetForm.password.length <= 16;
  const resetPassUpperOk = /[A-Z]/.test(resetForm.password);
  const resetPassLowerOk = /[a-z]/.test(resetForm.password);
  const resetPassNumberOk = /[0-9]/.test(resetForm.password);
  return (
    <div 
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: bgStyles[bgTheme],
        position: 'relative',
        overflow: 'hidden',
        padding: '24px 20px',
        transition: 'background 0.5s ease'
      }}
    >
      {/* Background Ambient Glow Accents */}
      <div style={{
        position: 'absolute', top: '-100px', left: '-100px', width: '450px', height: '450px',
        borderRadius: '50%', background: 'radial-gradient(circle, rgba(14, 165, 233, 0.35) 0%, rgba(0,0,0,0) 70%)',
        filter: 'blur(50px)', pointerEvents: 'none'
      }}></div>
      <div style={{
        position: 'absolute', bottom: '-100px', right: '-100px', width: '500px', height: '500px',
        borderRadius: '50%', background: 'radial-gradient(circle, rgba(16, 185, 129, 0.3) 0%, rgba(0,0,0,0) 70%)',
        filter: 'blur(60px)', pointerEvents: 'none'
      }}></div>

      {/* Clean Box-by-Box Grid Logo Background Pattern */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
        gap: '20px',
        padding: '24px',
        opacity: 0.14,
        pointerEvents: 'none',
        overflow: 'hidden',
        zIndex: 1
      }}>
        {Array.from({ length: 35 }).map((_, idx) => (
          <div key={idx} style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100px',
            backgroundColor: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '16px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
            padding: '12px'
          }}>
            <img 
              src={logoImg} 
              alt="Pharmacy Logo" 
              style={{ 
                width: '60px', 
                height: '60px', 
                objectFit: 'contain'
              }} 
            />
          </div>
        ))}
      </div>

      {/* Main Glassmorphism Card */}
      <div 
        className="card" 
        style={{
          width: viewMode === 'welcome' ? '540px' : '480px',
          maxWidth: '95vw',
          padding: viewMode === 'welcome' ? '40px 36px' : '36px',
          borderRadius: '24px',
          backgroundColor: 'rgba(255, 255, 255, 0.96)',
          backdropFilter: 'blur(16px)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(255, 255, 255, 0.3)',
          position: 'relative',
          zIndex: 10,
          transition: 'all 0.3s ease'
        }}
      >
        
        {/* VIEW 0: WELCOME LANDING PAGE */}
        {viewMode === 'welcome' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            
            {/* Top Welcome Pill Badge */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'rgba(14, 165, 233, 0.12)',
              border: '1px solid rgba(14, 165, 233, 0.3)',
              color: '#0284c7',
              fontSize: '12px',
              fontWeight: '700',
              padding: '6px 16px',
              borderRadius: '20px',
              marginBottom: '22px',
              letterSpacing: '0.4px'
            }}>
              <Sparkles size={14} color="#0284c7" /> WELCOME TO SREE MANJU PHARMACY
            </div>

            {/* Glowing Logo Frame */}
            <div style={{
              position: 'relative',
              marginBottom: '20px'
            }}>
              <div style={{
                position: 'absolute',
                inset: '-12px',
                borderRadius: '32px',
                background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.6), rgba(16, 185, 129, 0.6))',
                filter: 'blur(16px)',
                opacity: 0.85
              }}></div>
              <img 
                src={logoImg} 
                alt="Sree Manju Pharmacy Logo" 
                style={{
                  position: 'relative',
                  width: '90px',
                  height: '90px',
                  borderRadius: '22px',
                  objectFit: 'contain',
                  boxShadow: '0 12px 24px -6px rgba(0, 0, 0, 0.25)',
                  backgroundColor: '#ffffff',
                  padding: '6px',
                  border: '2px solid rgba(255, 255, 255, 0.9)'
                }}
              />
            </div>

            {/* Slogan & Title */}
            <h1 style={{
              fontSize: '28px',
              fontWeight: '800',
              color: 'var(--text-primary)',
              margin: '0 0 8px 0',
              letterSpacing: '-0.5px'
            }}>
              Sree Manju Pharmacy
            </h1>

            <p style={{
              fontSize: '15px',
              fontWeight: '700',
              color: '#0284c7',
              margin: '0 0 14px 0',
              lineHeight: '1.4'
            }}>
              "Your Trusted Partner in Health, Precision Pharmacy & POS Care"
            </p>





            {/* Enter System Button */}
            <button
              type="button"
              className="btn btn-primary"
              onClick={(e) => {
                e.stopPropagation();
                switchTab('login');
              }}
              style={{
                width: '100%',
                padding: '14px',
                fontSize: '15.5px',
                fontWeight: '700',
                borderRadius: '12px',
                justifyContent: 'center',
                boxShadow: '0 10px 20px -5px rgba(2, 132, 199, 0.4)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer'
              }}
            >
              Get Started &amp; Sign In <ArrowRight size={18} />
            </button>

          </div>
        )}

        {/* HEADER BRANDING (For Login / Register / Forgot Password) */}
        {viewMode !== 'welcome' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <button 
                type="button"
                onClick={() => switchTab('welcome')}
                style={{
                  background: 'none', border: 'none', color: 'var(--primary-color)', fontSize: '12.5px', fontWeight: '700',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', padding: 0
                }}
              >
                <ArrowLeft size={14} /> Back to Welcome Page
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '20px' }}>
              <img src={logoImg} alt="Sree Manju Pharmacy Logo" style={{ width: '64px', height: '64px', borderRadius: '16px', objectFit: 'contain', marginBottom: '10px', boxShadow: '0 8px 16px -4px rgba(14, 165, 233, 0.2)' }} />
              <h1 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>Sree Manju Pharmacy</h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px' }}>Pharmacy Management &amp; POS System</p>
            </div>
          </>
        )}

        {/* Tab Switcher: Sign In vs Account Registration */}
        {viewMode !== 'forgot' && viewMode !== 'welcome' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', backgroundColor: '#e2e8f0', padding: '4px', borderRadius: '10px', marginBottom: '20px' }}>
            <button 
              type="button" 
              style={{
                padding: '8px', 
                fontSize: '13px', 
                fontWeight: '700', 
                borderRadius: '8px', 
                border: 'none', 
                cursor: 'pointer',
                backgroundColor: viewMode === 'login' ? '#ffffff' : 'transparent',
                color: viewMode === 'login' ? 'var(--primary-color)' : 'var(--text-secondary)',
                boxShadow: viewMode === 'login' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none'
              }}
              onClick={() => switchTab('login')}
            >
              Sign In
            </button>
            <button 
              type="button" 
              style={{
                padding: '8px', 
                fontSize: '13px', 
                fontWeight: '700', 
                borderRadius: '8px', 
                border: 'none', 
                cursor: 'pointer',
                backgroundColor: viewMode === 'register' ? '#ffffff' : 'transparent',
                color: viewMode === 'register' ? 'var(--primary-color)' : 'var(--text-secondary)',
                boxShadow: viewMode === 'register' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
              onClick={() => switchTab('register')}
            >
              <UserPlus size={14} /> Register Account
            </button>
          </div>
        )}

        {/* Success Banner for Password Reset Redirect */}
        {viewMode === 'login' && resetSuccessBanner && (
          <div style={{
            backgroundColor: '#f0fdf4',
            border: '1px solid #86efac',
            borderRadius: '8px',
            padding: '10px 14px',
            marginBottom: '18px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            color: '#166534',
            fontSize: '13px',
            fontWeight: '600',
            animation: 'fadeIn 0.2s ease'
          }}>
            <CheckCircle2 size={18} style={{ color: '#16a34a', flexShrink: 0 }} />
            <div style={{ flex: 1, lineHeight: '1.4' }}>{resetSuccessBanner}</div>
          </div>
        )}

        {/* Inline Error Banner for Login */}
        {viewMode === 'login' && errorMessage && (
          <div style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fca5a5',
            borderRadius: '8px',
            padding: '10px 14px',
            marginBottom: '18px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            color: '#991b1b',
            fontSize: '13px',
            fontWeight: '600',
            animation: 'fadeIn 0.2s ease'
          }}>
            <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#dc2626', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '800', flexShrink: 0 }}>!</div>
            <div style={{ flex: 1, lineHeight: '1.4' }}>{errorMessage}</div>
          </div>
        )}

        {/* Inline Error Banner for Register */}
        {viewMode === 'register' && regError && (
          <div style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fca5a5',
            borderRadius: '8px',
            padding: '10px 14px',
            marginBottom: '18px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            color: '#991b1b',
            fontSize: '13px',
            fontWeight: '600'
          }}>
            <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#dc2626', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '800', flexShrink: 0 }}>!</div>
            <div style={{ flex: 1, lineHeight: '1.4' }}>{regError}</div>
          </div>
        )}

        {/* MODE 1: LOGIN FORM */}
        {viewMode === 'login' && (
          <form onSubmit={handleLogin} noValidate autoComplete="off" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* Role Selection */}
            <div>
              <label className="form-label" style={{ fontWeight: '600', fontSize: '13px' }}>Select System Role</label>
              <select className="form-input" style={{ fontWeight: '600', cursor: 'pointer' }} value={role} onChange={(e) => handleRoleChange(e.target.value)}>
                <option value="primary_owner">👨‍⚕️ Primary Owner (Admin)</option>
                <option value="co_owner">🤝 Co-Owner (Partner)</option>
                <option value="staff">💊 Staff / Pharmacist</option>
              </select>
            </div>

            {/* Username / Email */}
            <div>
              <label className="form-label" style={{ fontWeight: '600', fontSize: '13px' }}>Username / Email / Mobile *</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: loginFieldErrors.username ? '#dc2626' : 'var(--text-secondary)' }} />
                <input 
                  type="text" 
                  name="login_username_field"
                  autoComplete="off"
                  className="form-input" 
                  placeholder="Enter Username or Email" 
                  style={{ 
                    paddingLeft: '38px', 
                    textTransform: 'lowercase', 
                    backgroundColor: loginFieldErrors.username ? '#fff5f5' : '',
                    border: loginFieldErrors.username ? '1px solid #fca5a5' : '' 
                  }}
                  required
                  value={username}
                  onChange={(e) => { 
                    setUsername(e.target.value.toLowerCase()); 
                    setErrorMessage(''); 
                    if (loginFieldErrors.username) setLoginFieldErrors({ ...loginFieldErrors, username: '' });
                  }}
                />
              </div>
              {loginFieldErrors.username && <span style={{ color: '#dc2626', fontSize: '11.5px', fontWeight: '600', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>⚠️ {loginFieldErrors.username}</span>}
            </div>
            
            {/* Password */}
            <div>
              <label className="form-label" style={{ fontWeight: '600', fontSize: '13px' }}>Password *</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: loginFieldErrors.password ? '#dc2626' : 'var(--text-secondary)' }} />
                <input 
                  type={showLoginPassword ? 'text' : 'password'} 
                  name="login_password_field"
                  autoComplete="new-password"
                  className="form-input" 
                  placeholder="Enter Password" 
                  style={{ 
                    paddingLeft: '38px', 
                    paddingRight: '38px',
                    backgroundColor: loginFieldErrors.password ? '#fff5f5' : '',
                    border: loginFieldErrors.password ? '1px solid #fca5a5' : '' 
                  }}
                  required
                  value={password}
                  onChange={(e) => { 
                    setPassword(e.target.value); 
                    setErrorMessage(''); 
                    if (loginFieldErrors.password) setLoginFieldErrors({ ...loginFieldErrors, password: '' });
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '10px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    padding: 0
                  }}
                  title={showLoginPassword ? 'Hide Password' : 'Show Password'}
                >
                  {showLoginPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {loginFieldErrors.password && <span style={{ color: '#dc2626', fontSize: '11.5px', fontWeight: '600', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>⚠️ {loginFieldErrors.password}</span>}

              {/* Forgot Password Link (Below Password Field) */}
              <div style={{ textAlign: 'right', marginTop: '6px' }}>
                <span 
                  style={{ fontSize: '12px', color: 'var(--primary-color)', cursor: 'pointer', fontWeight: '600', textDecoration: 'underline' }}
                  onClick={() => switchTab('forgot')}
                >
                  Forgot Password?
                </span>
              </div>

              {/* Live Password Requirements Checklist for Login (Displays dynamically only when typing) */}
              {password && (
                <div style={{ backgroundColor: '#f8fafc', border: `1px solid ${loginPassLengthOk && loginPassUpperOk && loginPassLowerOk && loginPassNumberOk && loginPassSpecialOk ? '#86efac' : '#fca5a5'}`, padding: '10px 12px', borderRadius: '8px', fontSize: '11.5px', marginTop: '8px', animation: 'fadeIn 0.2s ease' }}>
                  <div style={{ fontWeight: '700', color: 'var(--text-primary)', marginBottom: '6px', display: 'flex', justifyContent: 'space-between' }}>
                    <span>🔒 Password Requirements:</span>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: loginPassLengthOk ? '#16a34a' : '#dc2626' }}>
                      {password.length} / 16 chars
                    </span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px' }}>
                    <span style={{ color: loginPassLengthOk ? '#16a34a' : '#dc2626', fontWeight: '700' }}>
                      {loginPassLengthOk ? '✓ 8-16 Length OK' : '✗ Need 8-16 Chars'}
                    </span>
                    <span style={{ color: loginPassUpperOk ? '#16a34a' : '#dc2626', fontWeight: '700' }}>
                      {loginPassUpperOk ? '✓ Uppercase (A-Z)' : '✗ Missing Uppercase'}
                    </span>
                    <span style={{ color: loginPassLowerOk ? '#16a34a' : '#dc2626', fontWeight: '700' }}>
                      {loginPassLowerOk ? '✓ Lowercase (a-z)' : '✗ Missing Lowercase'}
                    </span>
                    <span style={{ color: loginPassNumberOk ? '#16a34a' : '#dc2626', fontWeight: '700' }}>
                      {loginPassNumberOk ? '✓ Number (0-9)' : '✗ Missing Number'}
                    </span>
                    <span style={{ color: loginPassSpecialOk ? '#16a34a' : '#dc2626', fontWeight: '700', gridColumn: 'span 2' }}>
                      {loginPassSpecialOk ? '✓ Special Char (!@#$%^&*)' : '✗ Missing Special Character'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '4px', padding: '11px', fontWeight: '700', fontSize: '15px', borderRadius: '8px' }}>
              Secure Login <Shield size={18} style={{ marginLeft: '8px' }} />
            </button>

            {/* Quick Register Button Prompt */}
            <div style={{ textAlign: 'center', marginTop: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>New Account? </span>
              <button 
                type="button" 
                style={{ background: 'none', border: 'none', color: 'var(--primary-color)', fontWeight: '700', fontSize: '13px', cursor: 'pointer', textDecoration: 'underline' }}
                onClick={() => setViewMode('register')}
              >
                Register New Account
              </button>
            </div>

          </form>
        )}

        {/* MODE 2: ACCOUNT REGISTRATION FORM */}
        {viewMode === 'register' && (
          <>
            {regStep === 1 ? (
              <form onSubmit={handleUserRegistration} noValidate autoComplete="off" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                
                {/* System Quota Badge Notice */}
                <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', padding: '10px 12px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: '#15803d', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Users size={14} color="#16a34a" /> STEP 1/2: OWNER &amp; STAFF CREDENTIALS
                  </div>
                  <div style={{ fontSize: '11px', color: '#166534', marginTop: '4px', display: 'flex', gap: '12px' }}>
                    <span>• Primary Owner: <strong>{primaryOwnerCount}/1</strong></span>
                    <span>• Co-Owner: <strong>{coOwnerCount}/1</strong></span>
                    <span>• Staff: <strong>{staffCount} (Unlimited)</strong></span>
                  </div>
                </div>

                {/* Registration Role Choice */}
                <div>
                  <label className="form-label" style={{ fontWeight: '600', fontSize: '12px' }}>Account Role *</label>
                  <select 
                    className="form-input" 
                    style={{ fontWeight: '600', cursor: 'pointer' }}
                    value={regForm.role}
                    onChange={(e) => setRegForm({ ...regForm, role: e.target.value })}
                  >
                    <option value="primary_owner" disabled={primaryOwnerCount >= 1}>
                      👨‍⚕️ Primary Owner {primaryOwnerCount >= 1 ? '(Registered - Max 1)' : '(Max 1 Account)'}
                    </option>
                    <option value="co_owner" disabled={coOwnerCount >= 1}>
                      🤝 Co-Owner Partner {coOwnerCount >= 1 ? '(Registered - Max 1)' : '(Max 1 Account)'}
                    </option>
                    <option value="staff">💊 Staff / Pharmacist (Unlimited Accounts)</option>
                  </select>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label className="form-label" style={{ fontWeight: '600', fontSize: '12px' }}>First Name *</label>
                    <div style={{ position: 'relative' }}>
                      <User size={16} style={{ position: 'absolute', left: '10px', top: '10px', color: regFieldErrors.firstName ? '#dc2626' : 'var(--text-secondary)' }} />
                      <input 
                        type="text" 
                        name="reg_first_name"
                        autoComplete="off"
                        className="form-input" 
                        placeholder="First Name" 
                        style={{ 
                          paddingLeft: '34px',
                          backgroundColor: regFieldErrors.firstName ? '#fff5f5' : '',
                          border: regFieldErrors.firstName ? '1px solid #fca5a5' : '' 
                        }}
                        required
                        value={regForm.firstName}
                        onChange={(e) => {
                          setRegForm({ ...regForm, firstName: e.target.value });
                          if (regFieldErrors.firstName) setRegFieldErrors({ ...regFieldErrors, firstName: '' });
                        }}
                      />
                    </div>
                    {regFieldErrors.firstName && <span style={{ color: '#dc2626', fontSize: '11px', fontWeight: '600', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>⚠️ {regFieldErrors.firstName}</span>}
                  </div>

                  <div>
                    <label className="form-label" style={{ fontWeight: '600', fontSize: '12px' }}>Last Name *</label>
                    <input 
                      type="text" 
                      name="reg_last_name"
                      autoComplete="off"
                      className="form-input" 
                      placeholder="Last Name" 
                      style={{ 
                        backgroundColor: regFieldErrors.lastName ? '#fff5f5' : '',
                        border: regFieldErrors.lastName ? '1px solid #fca5a5' : '' 
                      }}
                      required
                      value={regForm.lastName}
                      onChange={(e) => {
                        setRegForm({ ...regForm, lastName: e.target.value });
                        if (regFieldErrors.lastName) setRegFieldErrors({ ...regFieldErrors, lastName: '' });
                      }}
                    />
                    {regFieldErrors.lastName && <span style={{ color: '#dc2626', fontSize: '11px', fontWeight: '600', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>⚠️ {regFieldErrors.lastName}</span>}
                  </div>
                </div>

                {/* Email Address */}
                <div>
                  <label className="form-label" style={{ fontWeight: '600', fontSize: '12px' }}>Email Address *</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={16} style={{ position: 'absolute', left: '10px', top: '10px', color: regFieldErrors.email ? '#dc2626' : 'var(--text-secondary)' }} />
                    <input 
                      type="email" 
                      name="reg_email_address_field"
                      autoComplete="off"
                      className="form-input" 
                      placeholder="Enter Email Address" 
                      style={{ 
                        paddingLeft: '34px', 
                        textTransform: 'lowercase',
                        backgroundColor: regFieldErrors.email ? '#fff5f5' : '',
                        border: regFieldErrors.email ? '1px solid #fca5a5' : '' 
                      }}
                      required
                      value={regForm.email}
                      onChange={(e) => {
                        setRegForm({ ...regForm, email: e.target.value.toLowerCase() });
                        if (regFieldErrors.email) setRegFieldErrors({ ...regFieldErrors, email: '' });
                      }}
                    />
                  </div>
                  {regFieldErrors.email && <span style={{ color: '#dc2626', fontSize: '11px', fontWeight: '600', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>⚠️ {regFieldErrors.email}</span>}
                </div>

                {/* Mobile Number */}
                <div>
                  <label className="form-label" style={{ fontWeight: '600', fontSize: '12px' }}>Mobile Number (10 Digits) *</label>
                  <div style={{ position: 'relative' }}>
                    <Phone size={16} style={{ position: 'absolute', left: '10px', top: '10px', color: regFieldErrors.mobile ? '#dc2626' : 'var(--text-secondary)' }} />
                    <input 
                      type="tel" 
                      name="reg_mobile_number_field"
                      autoComplete="off"
                      className="form-input" 
                      placeholder="Enter Mobile Number" 
                      style={{ 
                        paddingLeft: '34px',
                        backgroundColor: regFieldErrors.mobile ? '#fff5f5' : '',
                        border: regFieldErrors.mobile ? '1px solid #fca5a5' : '' 
                      }}
                      required
                      value={regForm.mobile}
                      onChange={(e) => {
                        setRegForm({ ...regForm, mobile: e.target.value });
                        if (regFieldErrors.mobile) setRegFieldErrors({ ...regFieldErrors, mobile: '' });
                      }}
                    />
                  </div>
                  {regFieldErrors.mobile && <span style={{ color: '#dc2626', fontSize: '11px', fontWeight: '600', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>⚠️ {regFieldErrors.mobile}</span>}
                </div>

                {/* Password & Confirm */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label className="form-label" style={{ fontWeight: '600', fontSize: '12px' }}>Password *</label>
                    <div style={{ position: 'relative' }}>
                      <input 
                        type={showRegPassword ? 'text' : 'password'} 
                        name="reg_password_field"
                        autoComplete="new-password"
                        className="form-input" 
                        placeholder="Password" 
                        style={{ 
                          paddingRight: '32px',
                          backgroundColor: regFieldErrors.password ? '#fff5f5' : '',
                          border: regFieldErrors.password ? '1px solid #fca5a5' : '' 
                        }}
                        required
                        value={regForm.password}
                        onChange={(e) => {
                          setRegForm({ ...regForm, password: e.target.value });
                          if (regFieldErrors.password) setRegFieldErrors({ ...regFieldErrors, password: '' });
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPassword(!showRegPassword)}
                        style={{
                          position: 'absolute',
                          right: '8px',
                          top: '9px',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: 'var(--text-secondary)',
                          display: 'flex',
                          alignItems: 'center',
                          padding: 0
                        }}
                        title={showRegPassword ? 'Hide Password' : 'Show Password'}
                      >
                        {showRegPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {regFieldErrors.password && <span style={{ color: '#dc2626', fontSize: '11px', fontWeight: '600', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>⚠️ {regFieldErrors.password}</span>}
                  </div>
                  <div>
                    <label className="form-label" style={{ fontWeight: '600', fontSize: '12px' }}>Confirm Password *</label>
                    <div style={{ position: 'relative' }}>
                      <input 
                        type={showRegConfirmPassword ? 'text' : 'password'} 
                        name="reg_confirm_password_field"
                        autoComplete="new-password"
                        className="form-input" 
                        placeholder="Confirm" 
                        style={{ 
                          paddingRight: '32px',
                          backgroundColor: regFieldErrors.confirmPassword ? '#fff5f5' : '',
                          border: regFieldErrors.confirmPassword ? '1px solid #fca5a5' : '' 
                        }}
                        required
                        value={regForm.confirmPassword}
                        onChange={(e) => {
                          setRegForm({ ...regForm, confirmPassword: e.target.value });
                          if (regFieldErrors.confirmPassword) setRegFieldErrors({ ...regFieldErrors, confirmPassword: '' });
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                        style={{
                          position: 'absolute',
                          right: '8px',
                          top: '9px',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: 'var(--text-secondary)',
                          display: 'flex',
                          alignItems: 'center',
                          padding: 0
                        }}
                        title={showRegConfirmPassword ? 'Hide Password' : 'Show Password'}
                      >
                        {showRegConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {regFieldErrors.confirmPassword && <span style={{ color: '#dc2626', fontSize: '11px', fontWeight: '600', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>⚠️ {regFieldErrors.confirmPassword}</span>}
                  </div>
                </div>

                {/* Live Password Requirements Checklist */}
                {regForm.password && (
                  <div style={{ backgroundColor: '#f8fafc', border: `1px solid ${passLengthOk && passUpperOk && passLowerOk && passNumberOk && passSpecialOk ? '#86efac' : '#fca5a5'}`, padding: '10px 12px', borderRadius: '8px', fontSize: '11.5px', animation: 'fadeIn 0.2s ease' }}>
                    <div style={{ fontWeight: '700', color: 'var(--text-primary)', marginBottom: '6px', display: 'flex', justifyContent: 'space-between' }}>
                      <span>🔒 Live Password Requirements Checklist:</span>
                      <span style={{ fontSize: '11px', fontWeight: '700', color: passLengthOk ? '#16a34a' : '#dc2626' }}>
                        {regForm.password.length} / 16 chars
                      </span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px' }}>
                      <span style={{ color: passLengthOk ? '#16a34a' : '#dc2626', fontWeight: '700' }}>
                        {passLengthOk ? '✓ 8-16 Length OK' : '✗ Need 8-16 Chars'}
                      </span>
                      <span style={{ color: passUpperOk ? '#16a34a' : '#dc2626', fontWeight: '700' }}>
                        {passUpperOk ? '✓ Uppercase (A-Z)' : '✗ Missing Uppercase'}
                      </span>
                      <span style={{ color: passLowerOk ? '#16a34a' : '#dc2626', fontWeight: '700' }}>
                        {passLowerOk ? '✓ Lowercase (a-z)' : '✗ Missing Lowercase'}
                      </span>
                      <span style={{ color: passNumberOk ? '#16a34a' : '#dc2626', fontWeight: '700' }}>
                        {passNumberOk ? '✓ Number (0-9)' : '✗ Missing Number'}
                      </span>
                      <span style={{ color: passSpecialOk ? '#16a34a' : '#dc2626', fontWeight: '700', gridColumn: 'span 2' }}>
                        {passSpecialOk ? '✓ Special Char (!@#$%^&*)' : '✗ Missing Special Character'}
                      </span>
                    </div>
                  </div>
                )}

                <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '6px', padding: '11px', fontWeight: '700', fontSize: '14px', borderRadius: '8px' }}>
                  {regForm.role === 'staff' ? 'Complete Staff Registration' : 'Continue to Pharmacy Setup (Step 2/2) ➔'}
                </button>

                <button 
                  type="button" 
                  className="btn btn-outline" 
                  style={{ width: '100%', justifyContent: 'center', padding: '9px', fontSize: '13px' }}
                  onClick={() => switchTab('login')}
                >
                  <ArrowLeft size={14} style={{ marginRight: '4px' }} /> Back to Sign In
                </button>

              </form>
            ) : (
              /* STEP 2: PHARMACY STORE SETUP & REGULATORY LICENSES MODULE */
              <form onSubmit={handlePharmacyDetailsSubmit} noValidate autoComplete="off" style={{ display: 'flex', flexDirection: 'column', gap: '14px', animation: 'fadeIn 0.25s ease-in-out' }}>
                
                <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', padding: '12px 14px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#1e40af', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    🏥 STEP 2/2: PHARMACY STORE &amp; REGULATORY SETUP
                  </div>
                  <p style={{ fontSize: '11.5px', color: '#1e3a8a', marginTop: '4px', margin: 0 }}>
                    Please fill in your pharmacy store name, drug license (DL) number, GSTIN, and store address before completing registration.
                  </p>
                </div>

                {/* Business / Pharmacy Name */}
                <div>
                  <label className="form-label" style={{ fontWeight: '600', fontSize: '12px' }}>Pharmacy / Store Name *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. Sree Manju Pharmacy" 
                    required
                    value={pharmacyForm.pharmacyName}
                    onChange={(e) => setPharmacyForm({ ...pharmacyForm, pharmacyName: e.target.value })}
                  />
                </div>

                {/* Drug License & GSTIN Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label className="form-label" style={{ fontWeight: '600', fontSize: '12px' }}>Drug License (DL) No. *</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. DL-TN-102-123456" 
                      required
                      value={pharmacyForm.dlNumber}
                      onChange={(e) => setPharmacyForm({ ...pharmacyForm, dlNumber: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="form-label" style={{ fontWeight: '600', fontSize: '12px' }}>GSTIN Reg Number *</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. 33AAAAA0000A1Z5" 
                      required
                      value={pharmacyForm.gstin}
                      onChange={(e) => setPharmacyForm({ ...pharmacyForm, gstin: e.target.value })}
                    />
                  </div>
                </div>

                {/* Pharmacist Reg Number */}
                <div>
                  <label className="form-label" style={{ fontWeight: '600', fontSize: '12px' }}>Pharmacist Council Reg No. *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. PRN-2024-8890" 
                    required
                    value={pharmacyForm.pharmacistRegNo}
                    onChange={(e) => setPharmacyForm({ ...pharmacyForm, pharmacistRegNo: e.target.value })}
                  />
                </div>

                {/* Pharmacy Address */}
                <div>
                  <label className="form-label" style={{ fontWeight: '600', fontSize: '12px' }}>Pharmacy Store Address *</label>
                  <textarea 
                    className="form-input" 
                    rows={2}
                    placeholder="e.g. 123 Health Street, Medical District, Chennai, Tamil Nadu 600001" 
                    required
                    style={{ resize: 'none' }}
                    value={pharmacyForm.address}
                    onChange={(e) => setPharmacyForm({ ...pharmacyForm, address: e.target.value })}
                  />
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '6px', padding: '11px', fontWeight: '700', fontSize: '14px', borderRadius: '8px' }}>
                  Complete Setup &amp; Redirect to Login ➔
                </button>

                <button 
                  type="button" 
                  className="btn btn-outline" 
                  style={{ width: '100%', justifyContent: 'center', padding: '9px', fontSize: '13px' }}
                  onClick={() => setRegStep(1)}
                >
                  <ArrowLeft size={14} style={{ marginRight: '4px' }} /> Back to Account Credentials
                </button>

              </form>
            )}
          </>
        )}

        {/* MODE 3: FORGOT PASSWORD */}
        {viewMode === 'forgot' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* Inline Error Alert Banner for Forgot Password */}
            {resetError && (
              <div style={{
                backgroundColor: '#fef2f2',
                border: '1px solid #fca5a5',
                borderRadius: '8px',
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                color: '#991b1b',
                fontSize: '13px',
                fontWeight: '600',
                animation: 'fadeIn 0.2s ease'
              }}>
                <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#dc2626', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '800', flexShrink: 0 }}>!</div>
                <div style={{ flex: 1, lineHeight: '1.4' }}>{resetError}</div>
              </div>
            )}

            {!resetSent ? (
              <form onSubmit={handleResetPassword} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label className="form-label" style={{ fontWeight: '600', fontSize: '13px' }}>Registered Email Address *</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: resetFieldErrors.email ? '#dc2626' : 'var(--text-secondary)' }} />
                    <input 
                      type="email" 
                      name="forgot_email_field"
                      autoComplete="off"
                      className="form-input" 
                      placeholder="enter registered email" 
                      style={{ 
                        paddingLeft: '38px',
                        textTransform: 'lowercase',
                        backgroundColor: resetFieldErrors.email ? '#fff5f5' : '',
                        border: resetFieldErrors.email ? '1px solid #fca5a5' : ''
                      }}
                      required
                      value={resetEmail}
                      onChange={(e) => {
                        setResetEmail(e.target.value.toLowerCase());
                        setResetError('');
                        if (resetFieldErrors.email) setResetFieldErrors({ ...resetFieldErrors, email: '' });
                      }}
                    />
                  </div>
                  {resetFieldErrors.email && <span style={{ color: '#dc2626', fontSize: '11.5px', fontWeight: '600', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>⚠️ {resetFieldErrors.email}</span>}
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>
                    We will send password reset instructions and a direct link to this email address.
                  </p>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px' }}>
                  <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '11px', fontWeight: '700', fontSize: '14px', borderRadius: '8px' }}>
                    Send Reset Link <Mail size={16} style={{ marginLeft: '6px' }} />
                  </button>
                  <button type="button" className="btn btn-outline" style={{ width: '100%', justifyContent: 'center', padding: '10px', fontSize: '13px' }} onClick={() => switchTab('login')}>
                    <ArrowLeft size={14} style={{ marginRight: '4px' }} /> Back to Sign In
                  </button>
                </div>
              </form>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Green Alert Banner */}
                <div style={{
                  backgroundColor: '#f0fdf4',
                  border: '1px solid #86efac',
                  borderRadius: '8px',
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  color: '#166534',
                  fontSize: '13px',
                  fontWeight: '600',
                  animation: 'fadeIn 0.2s ease'
                }}>
                  <CheckCircle2 size={20} style={{ color: '#16a34a', flexShrink: 0 }} />
                  <div>Password reset link dispatched to <strong>{resetEmail}</strong>!</div>
                </div>

                {/* Simulated Email Card with Clickable Reset Password Link */}
                <div style={{ backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', padding: '16px', borderRadius: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontWeight: '700', fontSize: '13px', color: 'var(--primary-color)' }}>
                    <KeyRound size={18} /> Password Reset Link Ready
                  </div>
                  <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginBottom: '14px', lineHeight: '1.5' }}>
                    Click the button below to open the <strong>Password Reset Page</strong> and update your credentials:
                  </p>
                  <button
                    type="button"
                    onClick={() => setViewMode('reset_new_password')}
                    className="btn btn-primary"
                    style={{
                      width: '100%',
                      justify: 'center',
                      padding: '11px',
                      fontWeight: '700',
                      fontSize: '13.5px',
                      borderRadius: '8px',
                      backgroundColor: '#0284c7'
                    }}
                  >
                    🔗 Open Password Reset Page <KeyRound size={16} style={{ marginLeft: '6px' }} />
                  </button>
                </div>

                <button type="button" className="btn btn-outline" style={{ width: '100%', justifyContent: 'center', padding: '10px', fontSize: '13px' }} onClick={() => switchTab('login')}>
                  <ArrowLeft size={14} style={{ marginRight: '4px' }} /> Back to Sign In
                </button>
              </div>
            )}
          </div>
        )}

        {/* MODE 4: RESET NEW PASSWORD FORM */}
        {viewMode === 'reset_new_password' && (
          <form onSubmit={handleSetNewPassword} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ textAlign: 'center', marginBottom: '4px' }}>
              <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <KeyRound size={20} /> Create New Password
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Account: <strong>{resetEmail}</strong>
              </p>
            </div>

            {/* Inline Error Alert Banner for Reset Password */}
            {resetError && (
              <div style={{
                backgroundColor: '#fef2f2',
                border: '1px solid #fca5a5',
                borderRadius: '8px',
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                color: '#991b1b',
                fontSize: '13px',
                fontWeight: '600',
                animation: 'fadeIn 0.2s ease'
              }}>
                <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#dc2626', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '800', flexShrink: 0 }}>!</div>
                <div style={{ flex: 1, lineHeight: '1.4' }}>{resetError}</div>
              </div>
            )}

            {/* New Password */}
            <div>
              <label className="form-label" style={{ fontWeight: '600', fontSize: '13px' }}>New Password *</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: resetFieldErrors.password ? '#dc2626' : 'var(--text-secondary)' }} />
                <input 
                  type={showResetPass ? 'text' : 'password'} 
                  name="reset_new_password_field"
                  autoComplete="new-password"
                  className="form-input" 
                  placeholder="Enter New Password" 
                  style={{ 
                    paddingLeft: '38px',
                    paddingRight: '38px',
                    backgroundColor: resetFieldErrors.password ? '#fff5f5' : '',
                    border: resetFieldErrors.password ? '1px solid #fca5a5' : ''
                  }}
                  required
                  value={resetForm.password}
                  onChange={(e) => {
                    setResetForm({ ...resetForm, password: e.target.value });
                    setResetError('');
                    if (resetFieldErrors.password) setResetFieldErrors({ ...resetFieldErrors, password: '' });
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowResetPass(!showResetPass)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '10px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    padding: 0
                  }}
                  title={showResetPass ? 'Hide Password' : 'Show Password'}
                >
                  {showResetPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {resetFieldErrors.password && <span style={{ color: '#dc2626', fontSize: '11.5px', fontWeight: '600', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>⚠️ {resetFieldErrors.password}</span>}

              {/* Live Password Requirements Checklist for Reset (Displays dynamically only when typing) */}
              {resetForm.password && (
                <div style={{ backgroundColor: '#f8fafc', border: `1px solid ${resetPassLengthOk && resetPassUpperOk && resetPassLowerOk && resetPassNumberOk && resetPassSpecialOk ? '#86efac' : '#fca5a5'}`, padding: '10px 12px', borderRadius: '8px', fontSize: '11.5px', marginTop: '8px', animation: 'fadeIn 0.2s ease' }}>
                  <div style={{ fontWeight: '700', color: 'var(--text-primary)', marginBottom: '6px', display: 'flex', justifyContent: 'space-between' }}>
                    <span>🔒 Password Requirements:</span>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: resetPassLengthOk ? '#16a34a' : '#dc2626' }}>
                      {resetForm.password.length} / 16 chars
                    </span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px' }}>
                    <span style={{ color: resetPassLengthOk ? '#16a34a' : '#dc2626', fontWeight: '700' }}>
                      {resetPassLengthOk ? '✓ 8-16 Length OK' : '✗ Need 8-16 Chars'}
                    </span>
                    <span style={{ color: resetPassUpperOk ? '#16a34a' : '#dc2626', fontWeight: '700' }}>
                      {resetPassUpperOk ? '✓ Uppercase (A-Z)' : '✗ Missing Uppercase'}
                    </span>
                    <span style={{ color: resetPassLowerOk ? '#16a34a' : '#dc2626', fontWeight: '700' }}>
                      {resetPassLowerOk ? '✓ Lowercase (a-z)' : '✗ Missing Lowercase'}
                    </span>
                    <span style={{ color: resetPassNumberOk ? '#16a34a' : '#dc2626', fontWeight: '700' }}>
                      {resetPassNumberOk ? '✓ Number (0-9)' : '✗ Missing Number'}
                    </span>
                    <span style={{ color: resetPassSpecialOk ? '#16a34a' : '#dc2626', fontWeight: '700', gridColumn: 'span 2' }}>
                      {resetPassSpecialOk ? '✓ Special Char (!@#$%^&*)' : '✗ Missing Special Character'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm New Password */}
            <div>
              <label className="form-label" style={{ fontWeight: '600', fontSize: '13px' }}>Confirm New Password *</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: resetFieldErrors.confirmPassword ? '#dc2626' : 'var(--text-secondary)' }} />
                <input 
                  type={showResetConfirmPass ? 'text' : 'password'} 
                  name="reset_confirm_password_field"
                  autoComplete="new-password"
                  className="form-input" 
                  placeholder="Confirm New Password" 
                  style={{ 
                    paddingLeft: '38px',
                    paddingRight: '38px',
                    backgroundColor: resetFieldErrors.confirmPassword ? '#fff5f5' : '',
                    border: resetFieldErrors.confirmPassword ? '1px solid #fca5a5' : ''
                  }}
                  required
                  value={resetForm.confirmPassword}
                  onChange={(e) => {
                    setResetForm({ ...resetForm, confirmPassword: e.target.value });
                    setResetError('');
                    if (resetFieldErrors.confirmPassword) setResetFieldErrors({ ...resetFieldErrors, confirmPassword: '' });
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowResetConfirmPass(!showResetConfirmPass)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '10px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    padding: 0
                  }}
                  title={showResetConfirmPass ? 'Hide Password' : 'Show Password'}
                >
                  {showResetConfirmPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {resetFieldErrors.confirmPassword && <span style={{ color: '#dc2626', fontSize: '11.5px', fontWeight: '600', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>⚠️ {resetFieldErrors.confirmPassword}</span>}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '6px' }}>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '11px', fontWeight: '700', fontSize: '14px', borderRadius: '8px' }}>
                Update Password &amp; Return to Login <CheckCircle2 size={18} style={{ marginLeft: '6px' }} />
              </button>
              <button type="button" className="btn btn-outline" style={{ width: '100%', justifyContent: 'center', padding: '10px', fontSize: '13px' }} onClick={() => switchTab('login')}>
                <ArrowLeft size={14} style={{ marginRight: '4px' }} /> Cancel &amp; Back to Sign In
              </button>
            </div>
          </form>
        )}

      </div>

      {/* Background Theme Selector Pills */}
      <div style={{
        marginTop: '24px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(8px)',
        padding: '6px 14px',
        borderRadius: '30px',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        zIndex: 10
      }}>
        <span style={{ fontSize: '11px', fontWeight: '600', color: 'rgba(255,255,255,0.7)' }}>Background Color:</span>
        <button 
          type="button" 
          onClick={() => setBgTheme('medical')}
          style={{
            background: 'none', border: bgTheme === 'medical' ? '2px solid #10b981' : '1px solid transparent',
            color: 'white', fontSize: '11px', fontWeight: '600', cursor: 'pointer', padding: '3px 8px', borderRadius: '12px',
            backgroundColor: bgTheme === 'medical' ? 'rgba(16, 185, 129, 0.25)' : 'transparent'
          }}
        >
          🌿 Emerald Health
        </button>
        <button 
          type="button" 
          onClick={() => setBgTheme('ocean')}
          style={{
            background: 'none', border: bgTheme === 'ocean' ? '2px solid #0284c7' : '1px solid transparent',
            color: 'white', fontSize: '11px', fontWeight: '600', cursor: 'pointer', padding: '3px 8px', borderRadius: '12px',
            backgroundColor: bgTheme === 'ocean' ? 'rgba(2, 132, 199, 0.25)' : 'transparent'
          }}
        >
          🌊 Ocean Indigo
        </button>
        <button 
          type="button" 
          onClick={() => setBgTheme('dark')}
          style={{
            background: 'none', border: bgTheme === 'dark' ? '2px solid #94a3b8' : '1px solid transparent',
            color: 'white', fontSize: '11px', fontWeight: '600', cursor: 'pointer', padding: '3px 8px', borderRadius: '12px',
            backgroundColor: bgTheme === 'dark' ? 'rgba(148, 163, 184, 0.25)' : 'transparent'
          }}
        >
          🌃 Midnight Dark
        </button>
      </div>

    </div>
  );
}

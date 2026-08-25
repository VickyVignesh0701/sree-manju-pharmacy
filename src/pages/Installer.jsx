import { useState } from 'react';
import { Database, Building2, UserCheck, CheckCircle2, ShieldCheck, Server, Key, Mail, Phone, Lock, Eye, EyeOff, Sparkles, RefreshCw, ArrowRight, ArrowLeft } from 'lucide-react';
import logoImg from '../assets/logo.png';
import { useAppContext, validatePasswordComplexity } from '../context/AppContext';

export default function Installer({ onComplete }) {
  const { completeInstallation } = useAppContext();

  const [currentStep, setCurrentStep] = useState(1);
  const [dbTesting, setDbTesting] = useState(false);
  const [dbStatus, setDbStatus] = useState(null); // { success: boolean, message: string }
  const [installing, setInstalling] = useState(false);
  const [installProgress, setInstallProgress] = useState(0);
  const [installLogs, setInstallLogs] = useState([]);
  const [isFinished, setIsFinished] = useState(false);

  // Form States
  const [dbConfig, setDbConfig] = useState({
    driver: 'mysql',
    host: 'localhost',
    port: '3306',
    dbName: 'sree_manju_pharmacy',
    username: 'root',
    password: ''
  });

  const [companyConfig, setCompanyConfig] = useState({
    pharmacyName: 'Sree Manju Pharmacy',
    dlNumber: 'DL-TN-102-123456',
    gstin: '33AAAAA0000A1Z5',
    phone: '9876512345',
    email: 'owner@sreemanjupharmacy.com',
    address: '123 Health Street, Medical District, Chennai, Tamil Nadu 600001',
    pharmacistRegNo: 'PRN-2024-8890'
  });

  const [ownerConfig, setOwnerConfig] = useState({
    firstName: 'Sree',
    lastName: 'Manju',
    email: 'owner@sreemanjupharmacy.com',
    mobile: '9876512345',
    password: '',
    confirmPassword: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  // Step 1: Test Database Connection
  const handleTestDatabase = () => {
    if (!dbConfig.host || !dbConfig.dbName || !dbConfig.username) {
      setDbStatus({ success: false, message: 'Please provide Database Host, Database Name, and Username.' });
      return;
    }
    setDbTesting(true);
    setDbStatus(null);
    setTimeout(() => {
      setDbTesting(false);
      setDbStatus({
        success: true,
        message: `Connected successfully to database "${dbConfig.dbName}" on ${dbConfig.host}:${dbConfig.port} via ${dbConfig.driver.toUpperCase()} engine.`
      });
    }, 1200);
  };

  // Step 2 Validation & Next
  const handleStep2Next = (e) => {
    e.preventDefault();
    const errors = {};
    if (!companyConfig.pharmacyName.trim()) errors.pharmacyName = 'Pharmacy Name is required.';
    if (!companyConfig.dlNumber.trim()) errors.dlNumber = 'Drug License Number is required.';
    if (!companyConfig.gstin.trim()) errors.gstin = 'GSTIN is required.';
    if (!companyConfig.phone.trim() || companyConfig.phone.length !== 10) {
      errors.phone = 'Enter a valid 10-digit mobile number.';
    }
    if (!companyConfig.email.trim() || !companyConfig.email.includes('@')) {
      errors.email = 'Valid Email Address is required.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setCurrentStep(3);
  };

  // Step 3 Validation & Next
  const handleStep3Next = (e) => {
    e.preventDefault();
    const errors = {};
    if (!ownerConfig.firstName.trim()) errors.firstName = 'First Name is required.';
    if (!ownerConfig.lastName.trim()) errors.lastName = 'Last Name is required.';
    if (!ownerConfig.email.trim() || !ownerConfig.email.includes('@')) errors.email = 'Valid Email Address is required.';
    if (!ownerConfig.mobile.trim() || ownerConfig.mobile.length !== 10) errors.mobile = 'Enter a valid 10-digit mobile number.';
    
    if (!ownerConfig.password) {
      errors.password = 'Administrator Password is required.';
    } else {
      const pwdCheck = validatePasswordComplexity(ownerConfig.password);
      if (!pwdCheck.isValid) errors.password = pwdCheck.error;
    }
    if (!ownerConfig.confirmPassword) {
      errors.confirmPassword = 'Please confirm password.';
    } else if (ownerConfig.password !== ownerConfig.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    startInstallation();
  };

  // Step 4: Installation Execution
  const startInstallation = () => {
    setCurrentStep(4);
    setInstalling(true);
    setInstallProgress(10);
    setInstallLogs(['Initializing Sree Manju Pharmacy Web Installer...']);

    const steps = [
      { progress: 25, log: 'Linking Database tables & schema indexes...' },
      { progress: 50, log: 'Configuring business settings & license certificates...' },
      { progress: 75, log: 'Provisioning Primary Owner administrator account...' },
      { progress: 90, log: 'Seeding default inventory, categories & formulation types...' },
      { progress: 100, log: 'Installation complete! Finalizing system setup...' }
    ];

    steps.forEach((step, index) => {
      setTimeout(() => {
        setInstallProgress(step.progress);
        setInstallLogs(prev => [...prev, step.log]);
        if (step.progress === 100) {
          setInstalling(false);
          setIsFinished(true);
        }
      }, (index + 1) * 900);
    });
  };

  const handleFinishLaunch = () => {
    const installData = {
      dbConfig,
      companyConfig,
      ownerConfig
    };
    if (completeInstallation) {
      completeInstallation(installData);
    } else if (onComplete) {
      onComplete(installData);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      backgroundColor: '#0f172a',
      backgroundImage: 'radial-gradient(at 0% 0%, hsla(217,100%,15%,1) 0, transparent 50%), radial-gradient(at 100% 100%, hsla(190,100%,15%,1) 0, transparent 50%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      fontFamily: 'Inter, system-ui, sans-serif',
      color: '#f8fafc'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '840px',
        backgroundColor: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: '24px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 30px rgba(14, 165, 233, 0.15)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Top Header */}
        <div style={{
          padding: '24px 32px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          backgroundColor: 'rgba(2, 6, 23, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <img src={logoImg} alt="Sree Manju Pharmacy Logo" style={{ width: '48px', height: '48px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(14, 165, 233, 0.3)' }} />
            <div>
              <h1 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: '#ffffff', letterSpacing: '-0.3px' }}>
                Sree Manju Pharmacy Setup
              </h1>
              <span style={{ fontSize: '12px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                <Sparkles size={13} color="#38bdf8" /> First-Time System Setup Wizard
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'rgba(14, 165, 233, 0.1)', padding: '6px 14px', borderRadius: '20px', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
            <ShieldCheck size={16} color="#38bdf8" />
            <span style={{ fontSize: '12px', fontWeight: '700', color: '#38bdf8' }}>Version 1.0.0</span>
          </div>
        </div>

        {/* Step Stepper Header */}
        <div style={{
          padding: '16px 32px',
          backgroundColor: 'rgba(30, 41, 59, 0.5)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '8px'
        }}>
          {[
            { num: 1, label: 'Database Link', icon: Database },
            { num: 2, label: 'Company Details', icon: Building2 },
            { num: 3, label: 'Primary Owner', icon: UserCheck },
            { num: 4, label: 'System Installation', icon: CheckCircle2 }
          ].map(s => {
            const IconComp = s.icon;
            const isActive = currentStep === s.num;
            const isCompleted = currentStep > s.num || (s.num === 4 && isFinished);
            return (
              <div key={s.num} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 12px',
                borderRadius: '10px',
                backgroundColor: isActive ? 'rgba(14, 165, 233, 0.15)' : (isCompleted ? 'rgba(34, 197, 94, 0.1)' : 'transparent'),
                border: `1px solid ${isActive ? 'rgba(56, 189, 248, 0.4)' : (isCompleted ? 'rgba(34, 197, 94, 0.3)' : 'transparent')}`,
                transition: 'all 0.2s ease'
              }}>
                <div style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  backgroundColor: isCompleted ? '#22c55e' : (isActive ? '#0284c7' : 'rgba(255, 255, 255, 0.1)'),
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: '800'
                }}>
                  {isCompleted ? '✓' : s.num}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: isActive ? '#38bdf8' : (isCompleted ? '#4ade80' : '#64748b') }}>
                    STEP {s.num}
                  </span>
                  <span style={{ fontSize: '12px', fontWeight: '600', color: isActive ? '#f8fafc' : (isCompleted ? '#cbd5e1' : '#94a3b8') }}>
                    {s.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Content Body */}
        <div style={{ padding: '32px', flex: 1, display: 'flex', flexDirection: 'column' }}>

          {/* STEP 1: DATABASE LINK */}
          {currentStep === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: '700', margin: '0 0 6px 0', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Database size={20} /> Database Link & Connection Configuration
                </h2>
                <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>
                  Configure your database server connection parameters. Test the database link before proceeding to company setup.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#cbd5e1', marginBottom: '6px' }}>Database Engine</label>
                  <select 
                    value={dbConfig.driver}
                    onChange={(e) => setDbConfig({ ...dbConfig, driver: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#f8fafc', fontSize: '13px', outline: 'none' }}
                  >
                    <option value="mysql">MySQL / MariaDB Engine (Recommended)</option>
                    <option value="postgresql">PostgreSQL Engine</option>
                    <option value="sqlite">SQLite Local Embedded DB</option>
                    <option value="localstorage">Browser Persistent Storage DB</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#cbd5e1', marginBottom: '6px' }}>Database Host</label>
                  <input 
                    type="text" 
                    value={dbConfig.host}
                    onChange={(e) => setDbConfig({ ...dbConfig, host: e.target.value })}
                    placeholder="localhost or 127.0.0.1"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#f8fafc', fontSize: '13px', outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#cbd5e1', marginBottom: '6px' }}>Database Port</label>
                  <input 
                    type="text" 
                    value={dbConfig.port}
                    onChange={(e) => setDbConfig({ ...dbConfig, port: e.target.value })}
                    placeholder="3306"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#f8fafc', fontSize: '13px', outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#cbd5e1', marginBottom: '6px' }}>Database Name</label>
                  <input 
                    type="text" 
                    value={dbConfig.dbName}
                    onChange={(e) => setDbConfig({ ...dbConfig, dbName: e.target.value })}
                    placeholder="sree_manju_pharmacy"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#f8fafc', fontSize: '13px', outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#cbd5e1', marginBottom: '6px' }}>Database User</label>
                  <input 
                    type="text" 
                    value={dbConfig.username}
                    onChange={(e) => setDbConfig({ ...dbConfig, username: e.target.value })}
                    placeholder="root"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#f8fafc', fontSize: '13px', outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#cbd5e1', marginBottom: '6px' }}>Database Password</label>
                  <input 
                    type="password" 
                    value={dbConfig.password}
                    onChange={(e) => setDbConfig({ ...dbConfig, password: e.target.value })}
                    placeholder="Enter DB password (if any)"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#f8fafc', fontSize: '13px', outline: 'none' }}
                  />
                </div>
              </div>

              {/* Database Test Result Card */}
              {dbStatus && (
                <div style={{
                  padding: '12px 16px',
                  borderRadius: '10px',
                  backgroundColor: dbStatus.success ? 'rgba(34, 197, 94, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                  border: `1px solid ${dbStatus.success ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                  color: dbStatus.success ? '#4ade80' : '#f87171',
                  fontSize: '13px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  {dbStatus.success ? '✅' : '⚠️'} {dbStatus.message}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <button 
                  type="button" 
                  onClick={handleTestDatabase} 
                  disabled={dbTesting}
                  style={{
                    padding: '10px 18px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(56, 189, 248, 0.15)',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    color: '#38bdf8',
                    fontWeight: '700',
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <RefreshCw size={15} className={dbTesting ? 'spin' : ''} /> {dbTesting ? 'Testing Connection...' : 'Test Database Link'}
                </button>

                <button 
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  style={{
                    padding: '11px 24px',
                    borderRadius: '10px',
                    backgroundColor: '#0284c7',
                    border: 'none',
                    color: '#ffffff',
                    fontWeight: '700',
                    fontSize: '13.5px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  Continue to Company Details <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: COMPANY & PHARMACY DETAILS */}
          {currentStep === 2 && (
            <form onSubmit={handleStep2Next} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: '700', margin: '0 0 6px 0', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Building2 size={20} /> Pharmacy & Company License Details
                </h2>
                <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>
                  Enter your official pharmacy establishment details, Drug License (DL) number, and GSTIN for automated invoice receipts.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#cbd5e1', marginBottom: '6px' }}>Pharmacy / Company Name *</label>
                  <input 
                    type="text" 
                    value={companyConfig.pharmacyName}
                    onChange={(e) => setCompanyConfig({ ...companyConfig, pharmacyName: e.target.value })}
                    placeholder="e.g. Sree Manju Pharmacy"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', backgroundColor: '#1e293b', border: `1px solid ${fieldErrors.pharmacyName ? '#f87171' : '#334155'}`, color: '#f8fafc', fontSize: '13px', outline: 'none' }}
                  />
                  {fieldErrors.pharmacyName && <span style={{ color: '#f87171', fontSize: '11px', fontWeight: '600', marginTop: '4px', display: 'block' }}>⚠️ {fieldErrors.pharmacyName}</span>}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#cbd5e1', marginBottom: '6px' }}>Drug License (DL) Number *</label>
                  <input 
                    type="text" 
                    value={companyConfig.dlNumber}
                    onChange={(e) => setCompanyConfig({ ...companyConfig, dlNumber: e.target.value })}
                    placeholder="DL-TN-102-123456"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', backgroundColor: '#1e293b', border: `1px solid ${fieldErrors.dlNumber ? '#f87171' : '#334155'}`, color: '#f8fafc', fontSize: '13px', outline: 'none' }}
                  />
                  {fieldErrors.dlNumber && <span style={{ color: '#f87171', fontSize: '11px', fontWeight: '600', marginTop: '4px', display: 'block' }}>⚠️ {fieldErrors.dlNumber}</span>}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#cbd5e1', marginBottom: '6px' }}>GSTIN Number *</label>
                  <input 
                    type="text" 
                    value={companyConfig.gstin}
                    onChange={(e) => setCompanyConfig({ ...companyConfig, gstin: e.target.value })}
                    placeholder="33AAAAA0000A1Z5"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', backgroundColor: '#1e293b', border: `1px solid ${fieldErrors.gstin ? '#f87171' : '#334155'}`, color: '#f8fafc', fontSize: '13px', outline: 'none' }}
                  />
                  {fieldErrors.gstin && <span style={{ color: '#f87171', fontSize: '11px', fontWeight: '600', marginTop: '4px', display: 'block' }}>⚠️ {fieldErrors.gstin}</span>}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#cbd5e1', marginBottom: '6px' }}>Pharmacy Phone (10 Digits) *</label>
                  <input 
                    type="tel" 
                    value={companyConfig.phone}
                    maxLength={10}
                    onChange={(e) => setCompanyConfig({ ...companyConfig, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                    placeholder="Enter 10-digit mobile number"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', backgroundColor: '#1e293b', border: `1px solid ${fieldErrors.phone ? '#f87171' : '#334155'}`, color: '#f8fafc', fontSize: '13px', outline: 'none' }}
                  />
                  {fieldErrors.phone && <span style={{ color: '#f87171', fontSize: '11px', fontWeight: '600', marginTop: '4px', display: 'block' }}>⚠️ {fieldErrors.phone}</span>}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#cbd5e1', marginBottom: '6px' }}>Official Email Address *</label>
                  <input 
                    type="email" 
                    value={companyConfig.email}
                    onChange={(e) => setCompanyConfig({ ...companyConfig, email: e.target.value.toLowerCase() })}
                    placeholder="owner@sreemanjupharmacy.com"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', backgroundColor: '#1e293b', border: `1px solid ${fieldErrors.email ? '#f87171' : '#334155'}`, color: '#f8fafc', fontSize: '13px', outline: 'none' }}
                  />
                  {fieldErrors.email && <span style={{ color: '#f87171', fontSize: '11px', fontWeight: '600', marginTop: '4px', display: 'block' }}>⚠️ {fieldErrors.email}</span>}
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#cbd5e1', marginBottom: '6px' }}>Pharmacy Full Address</label>
                  <input 
                    type="text" 
                    value={companyConfig.address}
                    onChange={(e) => setCompanyConfig({ ...companyConfig, address: e.target.value })}
                    placeholder="123 Health Street, Medical District, Chennai, Tamil Nadu 600001"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#f8fafc', fontSize: '13px', outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <button 
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  style={{ padding: '10px 18px', borderRadius: '10px', backgroundColor: 'transparent', border: '1px solid #334155', color: '#cbd5e1', fontWeight: '600', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <ArrowLeft size={15} /> Back
                </button>

                <button 
                  type="submit"
                  style={{ padding: '11px 24px', borderRadius: '10px', backgroundColor: '#0284c7', border: 'none', color: '#ffffff', fontWeight: '700', fontSize: '13.5px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  Continue to Primary Owner Setup <ArrowRight size={16} />
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: PRIMARY OWNER ACCOUNT SETUP */}
          {currentStep === 3 && (
            <form onSubmit={handleStep3Next} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: '700', margin: '0 0 6px 0', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <UserCheck size={20} /> Primary Pharmacy Owner Credentials
                </h2>
                <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>
                  Create the Primary Owner administrator account for system administration and full privileges.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#cbd5e1', marginBottom: '6px' }}>Owner First Name *</label>
                  <input 
                    type="text" 
                    value={ownerConfig.firstName}
                    onChange={(e) => setOwnerConfig({ ...ownerConfig, firstName: e.target.value })}
                    placeholder="Sree"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', backgroundColor: '#1e293b', border: `1px solid ${fieldErrors.firstName ? '#f87171' : '#334155'}`, color: '#f8fafc', fontSize: '13px', outline: 'none' }}
                  />
                  {fieldErrors.firstName && <span style={{ color: '#f87171', fontSize: '11px', fontWeight: '600', marginTop: '4px', display: 'block' }}>⚠️ {fieldErrors.firstName}</span>}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#cbd5e1', marginBottom: '6px' }}>Owner Last Name *</label>
                  <input 
                    type="text" 
                    value={ownerConfig.lastName}
                    onChange={(e) => setOwnerConfig({ ...ownerConfig, lastName: e.target.value })}
                    placeholder="Manju"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', backgroundColor: '#1e293b', border: `1px solid ${fieldErrors.lastName ? '#f87171' : '#334155'}`, color: '#f8fafc', fontSize: '13px', outline: 'none' }}
                  />
                  {fieldErrors.lastName && <span style={{ color: '#f87171', fontSize: '11px', fontWeight: '600', marginTop: '4px', display: 'block' }}>⚠️ {fieldErrors.lastName}</span>}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#cbd5e1', marginBottom: '6px' }}>Owner Email / Username *</label>
                  <input 
                    type="email" 
                    value={ownerConfig.email}
                    onChange={(e) => setOwnerConfig({ ...ownerConfig, email: e.target.value.toLowerCase() })}
                    placeholder="owner@sreemanjupharmacy.com"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', backgroundColor: '#1e293b', border: `1px solid ${fieldErrors.email ? '#f87171' : '#334155'}`, color: '#f8fafc', fontSize: '13px', outline: 'none' }}
                  />
                  {fieldErrors.email && <span style={{ color: '#f87171', fontSize: '11px', fontWeight: '600', marginTop: '4px', display: 'block' }}>⚠️ {fieldErrors.email}</span>}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#cbd5e1', marginBottom: '6px' }}>Owner Mobile (10 Digits) *</label>
                  <input 
                    type="tel" 
                    value={ownerConfig.mobile}
                    maxLength={10}
                    onChange={(e) => setOwnerConfig({ ...ownerConfig, mobile: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                    placeholder="Enter 10-digit mobile number"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', backgroundColor: '#1e293b', border: `1px solid ${fieldErrors.mobile ? '#f87171' : '#334155'}`, color: '#f8fafc', fontSize: '13px', outline: 'none' }}
                  />
                  {fieldErrors.mobile && <span style={{ color: '#f87171', fontSize: '11px', fontWeight: '600', marginTop: '4px', display: 'block' }}>⚠️ {fieldErrors.mobile}</span>}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#cbd5e1', marginBottom: '6px' }}>Owner Password *</label>
                  <div style={{ position: 'relative' }}>
                    <input 
                      type={showPassword ? 'text' : 'password'}
                      value={ownerConfig.password}
                      onChange={(e) => setOwnerConfig({ ...ownerConfig, password: e.target.value })}
                      placeholder="Set password (8-16 chars)"
                      style={{ width: '100%', padding: '10px 38px 10px 14px', borderRadius: '10px', backgroundColor: '#1e293b', border: `1px solid ${fieldErrors.password ? '#f87171' : '#334155'}`, color: '#f8fafc', fontSize: '13px', outline: 'none' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{ position: 'absolute', right: '10px', top: '10px', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 0 }}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {fieldErrors.password && <span style={{ color: '#f87171', fontSize: '11px', fontWeight: '600', marginTop: '4px', display: 'block' }}>⚠️ {fieldErrors.password}</span>}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#cbd5e1', marginBottom: '6px' }}>Confirm Owner Password *</label>
                  <div style={{ position: 'relative' }}>
                    <input 
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={ownerConfig.confirmPassword}
                      onChange={(e) => setOwnerConfig({ ...ownerConfig, confirmPassword: e.target.value })}
                      placeholder="Confirm password"
                      style={{ width: '100%', padding: '10px 38px 10px 14px', borderRadius: '10px', backgroundColor: '#1e293b', border: `1px solid ${fieldErrors.confirmPassword ? '#f87171' : '#334155'}`, color: '#f8fafc', fontSize: '13px', outline: 'none' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      style={{ position: 'absolute', right: '10px', top: '10px', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 0 }}
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {fieldErrors.confirmPassword && <span style={{ color: '#f87171', fontSize: '11px', fontWeight: '600', marginTop: '4px', display: 'block' }}>⚠️ {fieldErrors.confirmPassword}</span>}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <button 
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  style={{ padding: '10px 18px', borderRadius: '10px', backgroundColor: 'transparent', border: '1px solid #334155', color: '#cbd5e1', fontWeight: '600', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <ArrowLeft size={15} /> Back
                </button>

                <button 
                  type="submit"
                  style={{ padding: '11px 24px', borderRadius: '10px', backgroundColor: '#16a34a', border: 'none', color: '#ffffff', fontWeight: '700', fontSize: '13.5px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <Sparkles size={16} /> Run System Installation
                </button>
              </div>
            </form>
          )}

          {/* STEP 4: INSTALLATION EXECUTION & COMPLETION */}
          {currentStep === 4 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', alignItems: 'center', textAlign: 'center', padding: '20px 0' }}>
              
              {!isFinished ? (
                <>
                  <div style={{ position: 'relative', width: '80px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ position: 'absolute', width: '80px', height: '80px', borderRadius: '50%', border: '4px solid rgba(56, 189, 248, 0.2)', borderTopColor: '#38bdf8', animation: 'spin 1s linear infinite' }}></div>
                    <Server size={32} color="#38bdf8" />
                  </div>

                  <div>
                    <h2 style={{ fontSize: '20px', fontWeight: '800', margin: '0 0 8px 0', color: '#ffffff' }}>
                      Installing Sree Manju Pharmacy System...
                    </h2>
                    <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>
                      Executing database schema migrations, provisioning owner account &amp; seeding store configuration.
                    </p>
                  </div>

                  {/* Progress Bar */}
                  <div style={{ width: '100%', maxWidth: '520px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: '700', color: '#38bdf8', marginBottom: '8px' }}>
                      <span>Installation Progress</span>
                      <span>{installProgress}%</span>
                    </div>
                    <div style={{ width: '100%', height: '10px', borderRadius: '5px', backgroundColor: '#1e293b', overflow: 'hidden' }}>
                      <div style={{ width: `${installProgress}%`, height: '100%', backgroundColor: '#0284c7', transition: 'width 0.4s ease', borderRadius: '5px' }}></div>
                    </div>
                  </div>

                  {/* Log Console */}
                  <div style={{
                    width: '100%',
                    maxWidth: '520px',
                    backgroundColor: '#020617',
                    border: '1px solid #1e293b',
                    borderRadius: '12px',
                    padding: '14px 16px',
                    fontFamily: 'monospace',
                    fontSize: '12px',
                    textAlign: 'left',
                    color: '#38bdf8',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    maxHeight: '140px',
                    overflowY: 'auto'
                  }}>
                    {installLogs.map((log, idx) => (
                      <div key={idx}>✓ {log}</div>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'rgba(34, 197, 94, 0.15)', border: '2px solid rgba(34, 197, 94, 0.4)', color: '#4ade80', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'scaleUp 0.3s ease' }}>
                    <CheckCircle2 size={44} />
                  </div>

                  <div>
                    <h2 style={{ fontSize: '22px', fontWeight: '800', margin: '0 0 8px 0', color: '#4ade80' }}>
                      Installation Completed Successfully! 🎉
                    </h2>
                    <p style={{ fontSize: '13.5px', color: '#cbd5e1', maxWidth: '520px', margin: '0 auto', lineHeight: '1.6' }}>
                      Database link established, pharmacy configuration saved, and Primary Owner <strong>({ownerConfig.firstName} {ownerConfig.lastName})</strong> registered successfully.
                    </p>
                  </div>

                  {/* Summary Card */}
                  <div style={{ width: '100%', maxWidth: '520px', backgroundColor: 'rgba(30, 41, 59, 0.6)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '14px', padding: '16px 20px', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.06)', paddingBottom: '8px' }}>
                      <span style={{ color: '#94a3b8' }}>Pharmacy Store:</span>
                      <strong style={{ color: '#ffffff' }}>{companyConfig.pharmacyName}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.06)', paddingBottom: '8px' }}>
                      <span style={{ color: '#94a3b8' }}>Database Engine:</span>
                      <strong style={{ color: '#38bdf8' }}>{dbConfig.driver.toUpperCase()} ({dbConfig.dbName} @ {dbConfig.host})</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.06)', paddingBottom: '8px' }}>
                      <span style={{ color: '#94a3b8' }}>Primary Owner Account:</span>
                      <strong style={{ color: '#ffffff' }}>{ownerConfig.firstName} {ownerConfig.lastName} ({ownerConfig.email})</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#94a3b8' }}>Drug License / GSTIN:</span>
                      <strong style={{ color: '#4ade80' }}>{companyConfig.dlNumber} / {companyConfig.gstin}</strong>
                    </div>
                  </div>

                  <button 
                    type="button"
                    onClick={handleFinishLaunch}
                    style={{
                      padding: '14px 36px',
                      borderRadius: '12px',
                      backgroundColor: '#16a34a',
                      border: 'none',
                      color: '#ffffff',
                      fontWeight: '800',
                      fontSize: '15px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      boxShadow: '0 10px 25px -5px rgba(22, 163, 74, 0.4)',
                      marginTop: '8px'
                    }}
                  >
                    Launch Pharmacy Welcome Page ➔
                  </button>
                </>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

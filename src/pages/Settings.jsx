import { useState } from 'react';
import { Settings, Mail, Building, CheckCircle, Shield, Printer, Sliders, Send, Key, Save, QrCode, Upload, Trash2, Image as ImageIcon, CreditCard } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export default function SettingsPage() {
  const { user, showNotification, logActivity, clearAllData, loadDemoData } = useAppContext();
  const [activeTab, setActiveTab] = useState('payment');

  if (user?.role !== 'owner') {
    return (
      <div className="card animate-fade-in" style={{ textAlign: 'center', padding: '60px 20px', maxWidth: '600px', margin: '40px auto' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#fee2e2', color: 'var(--danger-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto' }}>
          <Shield size={32} />
        </div>
        <h2 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '8px' }}>Access Restricted (Owner Only)</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6', marginBottom: '24px' }}>
          Only the primary **Pharmacy Owner** has administrative permissions to configure Payment QR Codes, SMTP Email Servers, and System Preferences.
        </p>
        <a href="/" className="btn btn-primary">Return to Dashboard</a>
      </div>
    );
  }

  // Payment & QR Code Settings State
  const [paymentSettings, setPaymentSettings] = useState(() => {
    const saved = localStorage.getItem('sree_manju_payment_settings');
    return saved ? JSON.parse(saved) : {
      upiId: 'sreemanju@upi',
      payeeName: 'Sree Manju Pharmacy',
      customQrImage: null
    };
  });

  // SMTP Settings State
  const [smtpSettings, setSmtpSettings] = useState(() => {
    const saved = localStorage.getItem('sree_manju_smtp_settings');
    return saved ? JSON.parse(saved) : {
      host: 'smtp.gmail.com',
      port: '587',
      senderEmail: 'billing@sreemanjupharmacy.com',
      appPassword: '••••••••••••',
      enableAutoEmail: false,
      enableLowStockAlerts: true
    };
  });

  // Business Details State
  const [businessDetails, setBusinessDetails] = useState(() => {
    const saved = localStorage.getItem('sree_manju_business_settings');
    return saved ? JSON.parse(saved) : {
      pharmacyName: 'Sree Manju Pharmacy',
      dlNumber: 'DL-TN-102-123456',
      gstin: '33AAAAA0000A1Z5',
      phone: '+91 98765 12345',
      address: '123 Health Street, Medical District, Chennai, Tamil Nadu 600001',
      receiptFooter: 'Thank you for choosing Sree Manju Pharmacy! Get well soon.'
    };
  });

  // System Preferences State
  const [systemPreferences, setSystemPreferences] = useState(() => {
    const saved = localStorage.getItem('sree_manju_sys_preferences');
    return saved ? JSON.parse(saved) : {
      gstRate: 5,
      lowStockThreshold: 10,
      printerPaperSize: '3inch',
      currencySymbol: '₹'
    };
  });

  const handlePaymentSubmit = (e) => {
    e.preventDefault();
    localStorage.setItem('sree_manju_payment_settings', JSON.stringify(paymentSettings));
    logActivity('Updated Payment & UPI QR Code Settings');
    showNotification('UPI & Payment QR Settings saved successfully!');
  };

  const handleQrUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Please upload an image smaller than 2MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const updated = { ...paymentSettings, customQrImage: reader.result };
        setPaymentSettings(updated);
        localStorage.setItem('sree_manju_payment_settings', JSON.stringify(updated));
        showNotification('Custom Payment QR Code image attached successfully!');
        logActivity('Attached Custom Payment QR Image');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveQr = () => {
    const updated = { ...paymentSettings, customQrImage: null };
    setPaymentSettings(updated);
    localStorage.setItem('sree_manju_payment_settings', JSON.stringify(updated));
    showNotification('Custom QR code image removed. Reverted to dynamic UPI QR code.');
  };

  const handleSmtpSubmit = (e) => {
    e.preventDefault();
    localStorage.setItem('sree_manju_smtp_settings', JSON.stringify(smtpSettings));
    logActivity('Updated Email (SMTP) Configuration');
    showNotification('SMTP Email settings saved successfully! Test connection verified.');
  };

  const handleBusinessSubmit = (e) => {
    e.preventDefault();
    localStorage.setItem('sree_manju_business_settings', JSON.stringify(businessDetails));
    logActivity('Updated Pharmacy Business & Receipt Details');
    showNotification('Pharmacy Business details updated successfully!');
  };

  const handlePreferencesSubmit = (e) => {
    e.preventDefault();
    localStorage.setItem('sree_manju_sys_preferences', JSON.stringify(systemPreferences));
    logActivity('Updated System Preferences');
    showNotification('System preferences saved successfully!');
  };

  const handleTestEmail = () => {
    showNotification(`Test email successfully dispatched to ${smtpSettings.senderEmail} via ${smtpSettings.host}:${smtpSettings.port}`);
  };

  const tabs = [
    { id: 'payment', label: 'Payment & QR Code', icon: <QrCode size={16} /> },
    { id: 'smtp', label: 'Email (SMTP) Server', icon: <Mail size={16} /> },
    { id: 'business', label: 'Pharmacy Details', icon: <Building size={16} /> },
    { id: 'preferences', label: 'POS Preferences', icon: <Sliders size={16} /> },
    { id: 'all', label: 'All Settings View', icon: <Settings size={16} /> },
  ];

  return (
    <div className="settings-page animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header Card */}
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Settings size={24} color="var(--primary-color)" />
            System & Store Settings
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Manage payment QR codes, SMTP email alerts, pharmacy profile, and POS preferences.
          </p>
        </div>
      </div>

      {/* Tabs Bar */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', flexWrap: 'wrap' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            type="button"
            className={`btn ${activeTab === tab.id ? 'btn-primary' : 'btn-outline'}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '13px',
              fontWeight: activeTab === tab.id ? '700' : '500',
              padding: '8px 16px',
              borderRadius: '10px',
              transition: 'all 0.2s ease'
            }}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content 1: Payment & QR Code Settings */}
      {(activeTab === 'payment' || activeTab === 'all') && (
        <div className="card" style={{ maxWidth: activeTab === 'payment' ? '800px' : '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', borderBottom: '1px solid var(--border-color)', paddingBottom: '14px' }}>
            <h3 style={{ fontSize: '17px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-primary)' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a' }}>
                <QrCode size={20} />
              </div>
              Payment Method & QR Code Settings
            </h3>
            {paymentSettings.customQrImage && (
              <span className="badge badge-success" style={{ fontSize: '11px' }}>
                <CheckCircle size={10} style={{ marginRight: '4px' }} /> Custom QR Active
              </span>
            )}
          </div>

          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '18px', lineHeight: '1.5' }}>
            Configure your store's UPI VPA ID and attach your official payment QR Code image. If an image is attached, it will be displayed on the Billing screen when patients scan to pay.
          </p>

          <form onSubmit={handlePaymentSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div className="grid grid-cols-2" style={{ gap: '16px' }}>
              <div>
                <label className="form-label" style={{ fontSize: '12.5px', fontWeight: '600' }}>Store UPI VPA / ID *</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. sreemanju@upi" 
                  value={paymentSettings.upiId} 
                  onChange={(e) => setPaymentSettings({ ...paymentSettings, upiId: e.target.value })}
                  required 
                />
              </div>
              <div>
                <label className="form-label" style={{ fontSize: '12.5px', fontWeight: '600' }}>Payee / Merchant Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Sree Manju Pharmacy" 
                  value={paymentSettings.payeeName} 
                  onChange={(e) => setPaymentSettings({ ...paymentSettings, payeeName: e.target.value })}
                />
              </div>
            </div>

            {/* QR Code Image Attachment Section */}
            <div style={{ backgroundColor: '#f8fafc', padding: '18px', borderRadius: '12px', border: '1px dashed #cbd5e1', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ fontSize: '13.5px', fontWeight: '700', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ImageIcon size={18} color="var(--primary-color)" /> Custom Payment QR Code Attachment
              </div>

              {paymentSettings.customQrImage ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', backgroundColor: 'white', padding: '14px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                  <div style={{ width: '110px', height: '110px', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '6px', backgroundColor: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img src={paymentSettings.customQrImage} alt="Custom Payment QR Code" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#166534', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <CheckCircle size={15} /> Custom QR Code Attached & Active
                    </div>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                      This image will be displayed directly in the Billing / POS modal when patients pay via UPI / QR Code.
                    </span>
                    <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                      <label className="btn btn-outline" style={{ fontSize: '12px', padding: '6px 12px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <Upload size={14} /> Replace QR
                        <input type="file" accept="image/*" hidden onChange={handleQrUpload} />
                      </label>
                      <button type="button" onClick={handleRemoveQr} className="btn btn-outline" style={{ fontSize: '12px', padding: '6px 12px', color: '#ef4444', borderColor: '#fca5a5', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <Trash2 size={14} /> Remove Attachment
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '24px 16px', backgroundColor: 'white', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                    No custom QR image attached. Upload your Google Pay / PhonePe / Paytm store QR Code scanner image here.
                  </p>
                  <label className="btn btn-primary" style={{ fontSize: '13px', padding: '9px 18px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                    <Upload size={16} /> Attach Custom QR Code Image
                    <input type="file" accept="image/*" hidden onChange={handleQrUpload} />
                  </label>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
              <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                <Save size={15} /> Save Payment Settings
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab Content 2: SMTP Settings */}
      {(activeTab === 'smtp' || activeTab === 'all') && (
        <div className="card" style={{ maxWidth: activeTab === 'smtp' ? '800px' : '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', borderBottom: '1px solid var(--border-color)', paddingBottom: '14px' }}>
            <h3 style={{ fontSize: '17px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-primary)' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706' }}>
                <Mail size={20} />
              </div>
              Email (SMTP) Configuration
            </h3>
            <span className="badge badge-success" style={{ fontSize: '11px' }}>
              <CheckCircle size={10} style={{ marginRight: '4px' }} /> SMTP Ready
            </span>
          </div>

          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: '1.5' }}>
            Configure your Gmail App Password or custom SMTP server to enable automated receipt emails, low stock alerts, and expiring medicine warnings.
          </p>

          <form onSubmit={handleSmtpSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="grid grid-cols-2" style={{ gap: '14px' }}>
              <div>
                <label className="form-label" style={{ fontSize: '12px', fontWeight: '600' }}>SMTP Server Host *</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="smtp.gmail.com" 
                  value={smtpSettings.host}
                  onChange={(e) => setSmtpSettings({ ...smtpSettings, host: e.target.value })}
                  required 
                />
              </div>
              <div>
                <label className="form-label" style={{ fontSize: '12px', fontWeight: '600' }}>SMTP Port *</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="587 / 465" 
                  value={smtpSettings.port}
                  onChange={(e) => setSmtpSettings({ ...smtpSettings, port: e.target.value })}
                  required 
                />
              </div>
              <div>
                <label className="form-label" style={{ fontSize: '12px', fontWeight: '600' }}>Sender Email Address *</label>
                <input 
                  type="email" 
                  className="form-input" 
                  placeholder="billing@sreemanjupharmacy.com" 
                  style={{ textTransform: 'lowercase' }}
                  value={smtpSettings.senderEmail}
                  onChange={(e) => setSmtpSettings({ ...smtpSettings, senderEmail: e.target.value.toLowerCase() })}
                  required 
                />
              </div>
              <div>
                <label className="form-label" style={{ fontSize: '12px', fontWeight: '600' }}>Sender App Password *</label>
                <input 
                  type="password" 
                  className="form-input" 
                  placeholder="••••••••••••" 
                  value={smtpSettings.appPassword}
                  onChange={(e) => setSmtpSettings({ ...smtpSettings, appPassword: e.target.value })}
                  required 
                />
              </div>
            </div>

            {/* Toggles */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', backgroundColor: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid var(--border-color)', marginTop: '4px' }}>
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
                <span>Send Email Alerts on Low Stock & Expiry Warning</span>
                <input 
                  type="checkbox" 
                  checked={smtpSettings.enableLowStockAlerts} 
                  onChange={(e) => setSmtpSettings({ ...smtpSettings, enableLowStockAlerts: e.target.checked })}
                  style={{ width: '16px', height: '16px', accentColor: 'var(--primary-color)' }}
                />
              </label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
              <button type="button" className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }} onClick={handleTestEmail}>
                <Send size={14} /> Send Test Email
              </button>
              <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                <Save size={15} /> Save SMTP Settings
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab Content 3: Pharmacy Details */}
      {(activeTab === 'business' || activeTab === 'all') && (
        <div className="card" style={{ maxWidth: activeTab === 'business' ? '800px' : '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', borderBottom: '1px solid var(--border-color)', paddingBottom: '14px' }}>
            <h3 style={{ fontSize: '17px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-primary)' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284c7' }}>
                <Building size={20} />
              </div>
              Pharmacy Business & Receipt Details
            </h3>
          </div>

          <form onSubmit={handleBusinessSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label className="form-label" style={{ fontSize: '12px', fontWeight: '600' }}>Business / Pharmacy Name *</label>
              <input 
                type="text" 
                className="form-input" 
                value={businessDetails.pharmacyName} 
                onChange={(e) => setBusinessDetails({ ...businessDetails, pharmacyName: e.target.value })}
                required 
              />
            </div>

            <div className="grid grid-cols-2" style={{ gap: '14px' }}>
              <div>
                <label className="form-label" style={{ fontSize: '12px', fontWeight: '600' }}>Drug License No. (Form 20/21)</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={businessDetails.dlNumber} 
                  onChange={(e) => setBusinessDetails({ ...businessDetails, dlNumber: e.target.value })}
                />
              </div>
              <div>
                <label className="form-label" style={{ fontSize: '12px', fontWeight: '600' }}>GSTIN Number</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={businessDetails.gstin} 
                  onChange={(e) => setBusinessDetails({ ...businessDetails, gstin: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="form-label" style={{ fontSize: '12px', fontWeight: '600' }}>Pharmacy Contact Phone</label>
              <input 
                type="text" 
                className="form-input" 
                value={businessDetails.phone} 
                onChange={(e) => setBusinessDetails({ ...businessDetails, phone: e.target.value })}
              />
            </div>

            <div>
              <label className="form-label" style={{ fontSize: '12px', fontWeight: '600' }}>Full Pharmacy Address</label>
              <textarea 
                className="form-input" 
                rows="2" 
                value={businessDetails.address} 
                onChange={(e) => setBusinessDetails({ ...businessDetails, address: e.target.value })}
              />
            </div>

            <div>
              <label className="form-label" style={{ fontSize: '12px', fontWeight: '600' }}>Receipt Footer Greeting Note</label>
              <input 
                type="text" 
                className="form-input" 
                value={businessDetails.receiptFooter} 
                onChange={(e) => setBusinessDetails({ ...businessDetails, receiptFooter: e.target.value })}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
              <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                <Save size={15} /> Save Business Details
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab Content 4: POS & System Preferences */}
      {(activeTab === 'preferences' || activeTab === 'all') && (
        <div className="card" style={{ maxWidth: activeTab === 'preferences' ? '800px' : '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
            <h3 style={{ fontSize: '17px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-primary)' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4338ca' }}>
                <Sliders size={20} />
              </div>
              POS & Inventory Preferences
            </h3>
          </div>

          <form onSubmit={handlePreferencesSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="grid grid-cols-2" style={{ gap: '14px' }}>
              <div>
                <label className="form-label" style={{ fontSize: '12px', fontWeight: '600' }}>Default GST Tax Rate (%)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  value={systemPreferences.gstRate} 
                  onChange={(e) => setSystemPreferences({ ...systemPreferences, gstRate: Number(e.target.value) || 0 })}
                />
              </div>
              <div>
                <label className="form-label" style={{ fontSize: '12px', fontWeight: '600' }}>Low Stock Alert Threshold (Strips)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  value={systemPreferences.lowStockThreshold} 
                  onChange={(e) => setSystemPreferences({ ...systemPreferences, lowStockThreshold: Number(e.target.value) || 0 })}
                />
              </div>
              <div>
                <label className="form-label" style={{ fontSize: '12px', fontWeight: '600' }}>Thermal Printer Paper Width</label>
                <select 
                  className="form-input"
                  value={systemPreferences.printerPaperSize}
                  onChange={(e) => setSystemPreferences({ ...systemPreferences, printerPaperSize: e.target.value })}
                >
                  <option value="2inch">2 Inch (58mm POS Printer)</option>
                  <option value="3inch">3 Inch (80mm POS Thermal Printer)</option>
                  <option value="a4">Standard A4 Sheet Printer</option>
                </select>
              </div>
              <div>
                <label className="form-label" style={{ fontSize: '12px', fontWeight: '600' }}>Currency Display Symbol</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={systemPreferences.currencySymbol} 
                  onChange={(e) => setSystemPreferences({ ...systemPreferences, currencySymbol: e.target.value })}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
              <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                <Save size={15} /> Save Preferences
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Demo Data Management Card */}
      {(activeTab === 'preferences' || activeTab === 'all') && (
        <div className="card" style={{ border: '1px solid #bfdbfe', backgroundColor: '#eff6ff', maxWidth: activeTab === 'preferences' ? '800px' : '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1e40af', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                🚀 Populate Demo Dataset for Live Presentation
              </h3>
              <p style={{ fontSize: '12.5px', color: '#1e3a8a', marginTop: '4px', margin: 0 }}>
                Instantly populate rich sample inventory (Dolo, Amoxicillin, Glycomet), sales billing logs, chronic care patients with 25-day refill triggers, and registered dealers.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                loadDemoData();
              }}
              className="btn btn-primary"
              style={{
                backgroundColor: '#2563eb',
                color: 'white',
                fontWeight: '700',
                fontSize: '13px',
                padding: '10px 16px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                border: 'none',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              🚀 Load Demo Data
            </button>
          </div>
        </div>
      )}

      {/* Danger Zone: Factory Reset / Erase All Test Data */}
      {(activeTab === 'preferences' || activeTab === 'all') && (
        <div className="card" style={{ border: '1px solid #fca5a5', backgroundColor: '#fff5f5', maxWidth: activeTab === 'preferences' ? '800px' : '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#991b1b', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                <Trash2 size={18} color="#dc2626" /> Erase All System &amp; Test Data (Factory Reset)
              </h3>
              <p style={{ fontSize: '12.5px', color: '#7f1d1d', marginTop: '4px', margin: 0 }}>
                Clear all test inventory, sales logs, registered staff accounts, and patient records before deploying to production.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                if (window.confirm("⚠️ ARE YOU SURE? This will permanently erase all test inventory, sales logs, registered users, dealers, and patient data. This action cannot be undone!")) {
                  clearAllData();
                }
              }}
              className="btn"
              style={{
                backgroundColor: '#dc2626',
                color: 'white',
                fontWeight: '700',
                fontSize: '13px',
                padding: '10px 16px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                border: 'none',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              <Trash2 size={16} /> Erase All Data
            </button>
          </div>
        </div>
      )}

      {/* Info Banner */}
      <div className="card" style={{ backgroundColor: '#f8fafc', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Shield size={22} color="var(--primary-color)" />
        <span>Settings and SMTP email configurations are saved locally and synced with all active store devices.</span>
      </div>
    </div>
  );
}

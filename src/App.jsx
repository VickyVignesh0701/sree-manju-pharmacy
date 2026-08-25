import { useState } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingCart, Users, User, Activity, Tags, AlertTriangle, Clock, BarChart2, Mail, Copy, Check, ClipboardList, UserCheck, FlaskConical, Settings, Send, HeartHandshake, BellRing } from 'lucide-react';
import logoImg from './assets/logo.png';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import MedicineDetails from './pages/MedicineDetails';
import StockOverview from './pages/StockOverview';
import OutOfStock from './pages/OutOfStock';
import ExpiryAlerts from './pages/ExpiryAlerts';
import Billing from './pages/Billing';
import Categories from './pages/Categories';
import Formulations from './pages/Formulations';
import Dealers from './pages/Dealers';
import DealerDetails from './pages/DealerDetails';
import Patients from './pages/Patients';
import PatientDetails from './pages/PatientDetails';
import RegularCustomers from './pages/RegularCustomers';
import SalesLog from './pages/SalesLog';
import ActivityLog from './pages/ActivityLog';
import StaffManagement from './pages/StaffManagement';
import OwnerProfile from './pages/OwnerProfile';
import SettingsPage from './pages/Settings';
import Login from './pages/Login';
import { AppProvider, useAppContext } from './context/AppContext';
import './index.css';

function Sidebar() {
  const { user, regularPatients = [] } = useAppContext();
  const location = useLocation();
  const path = location.pathname;

  // Calculate pending 25-day alerts count for sidebar badge
  const pendingRefillAlerts = regularPatients.filter(p => {
    const lastDate = p.lastPurchaseDate ? new Date(p.lastPurchaseDate) : new Date();
    const daysPassed = Math.floor(Math.abs(new Date() - lastDate) / (1000 * 60 * 60 * 24));
    return daysPassed >= (p.reminderDays || 25);
  }).length;

  return (
    <div className="sidebar">
      <div className="brand" style={{ gap: '10px', alignItems: 'center' }}>
        <img src={logoImg} alt="Sree Manju Pharmacy Logo" style={{ width: '34px', height: '34px', borderRadius: '8px', objectFit: 'contain' }} />
        <span style={{ fontWeight: '700', fontSize: '18px', color: 'var(--text-primary)' }}>Sree Manju</span>
      </div>
      
      <div className="nav-menu">
        <div className="nav-section-title">Main / Sales</div>
        <Link to="/" className={`nav-item ${path === '/' ? 'active' : ''}`}>
          <LayoutDashboard size={18} />
          Dashboard
        </Link>
        <Link to="/billing" className={`nav-item ${path === '/billing' ? 'active' : ''}`}>
          <ShoppingCart size={18} />
          Billing / POS
        </Link>
        <Link to="/regular-customers" className={`nav-item ${path === '/regular-customers' ? 'active' : ''}`} style={{ position: 'relative' }}>
          <HeartHandshake size={18} />
          Regular Customers
          {pendingRefillAlerts > 0 && (
            <span style={{ marginLeft: 'auto', backgroundColor: '#f59e0b', color: '#78350f', fontSize: '10px', fontWeight: '800', padding: '2px 7px', borderRadius: '10px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
              <BellRing size={10} /> {pendingRefillAlerts}
            </span>
          )}
        </Link>
        <Link to="/sales-log" className={`nav-item ${path === '/sales-log' ? 'active' : ''}`}>
          <Activity size={18} />
          Sales Log
        </Link>

        <div className="nav-section-title">Inventory Control</div>
        <Link to="/inventory" className={`nav-item ${path === '/inventory' ? 'active' : ''}`}>
          <Package size={18} />
          Inventory / Stock
        </Link>
        <Link to="/stock-overview" className={`nav-item ${path === '/stock-overview' ? 'active' : ''}`}>
          <BarChart2 size={18} />
          Overall Stock
        </Link>
        <Link to="/out-of-stock" className={`nav-item ${path === '/out-of-stock' ? 'active' : ''}`}>
          <AlertTriangle size={18} />
          Out of Stock
        </Link>
        <Link to="/expiry-alerts" className={`nav-item ${path === '/expiry-alerts' ? 'active' : ''}`}>
          <Clock size={18} />
          Expiry Alerts
        </Link>
        <Link to="/categories" className={`nav-item ${path === '/categories' ? 'active' : ''}`}>
          <Tags size={18} />
          Categories
        </Link>
        <Link to="/formulations" className={`nav-item ${path === '/formulations' ? 'active' : ''}`}>
          <FlaskConical size={18} />
          Formulation Types
        </Link>

        <div className="nav-section-title">Directory & Logs</div>
        <Link to="/patients" className={`nav-item ${path === '/patients' ? 'active' : ''}`}>
          <User size={18} />
          Patients
        </Link>
        <Link to="/dealers" className={`nav-item ${path === '/dealers' ? 'active' : ''}`}>
          <Users size={18} />
          Dealers
        </Link>
        <Link to="/activity-log" className={`nav-item ${path === '/activity-log' ? 'active' : ''}`}>
          <ClipboardList size={18} />
          Activity Log
        </Link>
        {user?.role === 'owner' && (
          <Link to="/staff" className={`nav-item ${path === '/staff' ? 'active' : ''}`}>
            <UserCheck size={18} />
            Staff Members
          </Link>
        )}
        <Link to="/profile" className={`nav-item ${path === '/profile' ? 'active' : ''}`}>
          <User size={18} />
          {user?.role === 'owner' ? 'Owner Profile' : 'My Profile'}
        </Link>
        {user?.role === 'owner' && (
          <Link to="/settings" className={`nav-item ${path === '/settings' ? 'active' : ''}`}>
            <Settings size={18} />
            Settings
          </Link>
        )}
      </div>
    </div>
  );
}

function Header() {
  const location = useLocation();
  const getTitle = () => {
    switch (location.pathname) {
      case '/': return 'Dashboard';
      case '/billing': return 'Billing & Checkout';
      case '/regular-customers': return 'Regular & Chronic Care Patients (25-Day Refill Alerts)';
      case '/sales-log': return 'Sales Log & Receipts';
      case '/inventory': return 'Inventory Management';
      case '/stock-overview': return 'Overall Stock Details';
      case '/out-of-stock': return 'Low Stock & Out of Stock';
      case '/expiry-alerts': return 'Expiry Tracking';
      case '/categories': return 'Medicine Categories';
      case '/formulations': return 'Formulation Types Management';
      case '/patients': return 'Patient Directory';
      case '/dealers': return 'Dealers Directory';
      case '/activity-log': return 'Inventory & Dealer Activity Logs';
      case '/staff': return 'Staff & Team Management';
      case '/profile': return 'Owner Profile';
      case '/settings': return 'System & Email Settings';
      default: 
        if (location.pathname.startsWith('/inventory/')) return 'Medicine Details';
        if (location.pathname.startsWith('/dealers/')) return 'Dealer Details';
        if (location.pathname.startsWith('/patients/')) return 'Patient Prescription History';
        return 'Pharmacy App';
    }
  };

  const { user } = useAppContext();

  return (
    <header className="header flex-between">
      <h1 className="header-title">{getTitle()}</h1>
      <Link 
        to="/profile" 
        className="user-profile" 
        style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}
        title="Click to view Owner Profile"
      >
        {user?.avatar ? (
          <img src={user.avatar} alt="Profile" style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--primary-color)' }} />
        ) : (
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--primary-color)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <User size={20} />
          </div>
        )}
        <span style={{ fontSize: '14px', fontWeight: '600' }}>{user?.name}</span>
        <span className="badge badge-success">Online Server</span>
      </Link>
    </header>
  );
}

function DealerEmailModal() {
  const { activeEmail, closeEmail, showNotification } = useAppContext();
  const [copied, setCopied] = useState(false);

  if (!activeEmail) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(`To: ${activeEmail.email}\nSubject: ${activeEmail.subject}\n\n${activeEmail.body}`);
    setCopied(true);
    showNotification('Email content copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendEmail = () => {
    showNotification(`📧 Refill Reminder / Email notification sent successfully to ${activeEmail.email}!`);
    closeEmail();
  };

  return (
    <div className="modal-overlay">
      <div className="modal card animate-fade-in" style={{ width: '520px', backgroundColor: 'var(--surface-color)', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
        <div className="flex-between" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-color)' }}>
              <Mail size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '17px', fontWeight: '700' }}>Email Alert Dispatch</h3>
              <span className="badge badge-warning" style={{ fontSize: '11px' }}>{activeEmail.type}</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px' }}>
          <div>
            <label className="form-label" style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Recipient Email</label>
            <input className="form-input" value={activeEmail.email} readOnly style={{ backgroundColor: '#f8fafc', fontWeight: '600' }} />
          </div>
          <div>
            <label className="form-label" style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Subject</label>
            <input className="form-input" value={activeEmail.subject} readOnly style={{ backgroundColor: '#f8fafc', fontWeight: '500' }} />
          </div>
          <div>
            <label className="form-label" style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Email Content Dispatch</label>
            <textarea 
              className="form-input" 
              rows="7" 
              value={activeEmail.body} 
              readOnly 
              style={{ backgroundColor: '#f8fafc', fontFamily: 'monospace', fontSize: '13px', lineHeight: '1.4' }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
          <button className="btn btn-outline" onClick={handleCopy} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
            {copied ? <Check size={14} color="green" /> : <Copy size={14} />} {copied ? 'Copied!' : 'Copy Text'}
          </button>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-outline" onClick={closeEmail} style={{ fontSize: '13px' }}>Close</button>
            <button className="btn btn-primary" onClick={handleSendEmail} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
              <Send size={14} /> Send Email Notification
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MainApp() {
  const { user } = useAppContext();
  const basename = window.location.pathname.includes('/pharmacy/sree-manju-pharmacy') ? '/pharmacy/sree-manju-pharmacy' : '/';

  return (
    <BrowserRouter basename={basename}>
      {!user ? (
        <Login />
      ) : (
        <div className="app-container">
          <Sidebar />
          <main className="main-content">
            <Header />
            <div className="page-content animate-fade-in">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/billing" element={<Billing />} />
                <Route path="/regular-customers" element={<RegularCustomers />} />
                <Route path="/sales-log" element={<SalesLog />} />
                <Route path="/inventory" element={<Inventory />} />
                <Route path="/inventory/:id" element={<MedicineDetails />} />
                <Route path="/stock-overview" element={<StockOverview />} />
                <Route path="/out-of-stock" element={<OutOfStock />} />
                <Route path="/expiry-alerts" element={<ExpiryAlerts />} />
                <Route path="/categories" element={<Categories />} />
                <Route path="/formulations" element={<Formulations />} />
                <Route path="/patients" element={<Patients />} />
                <Route path="/patients/:id" element={<PatientDetails />} />
                <Route path="/dealers" element={<Dealers />} />
                <Route path="/dealers/:id" element={<DealerDetails />} />
                <Route path="/activity-log" element={<ActivityLog />} />
                <Route path="/staff" element={<StaffManagement />} />
                <Route path="/profile" element={<OwnerProfile />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Routes>
            </div>
            <DealerEmailModal />
          </main>
        </div>
      )}
    </BrowserRouter>
  );
}

function App() {
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}

export default App;

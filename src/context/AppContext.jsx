import { createContext, useContext, useState, useEffect } from 'react';
import { register as registerApi, logoutApi } from '../services/auth';
import { apiGet, apiPost, apiRequest } from '../services/api';

const AppContext = createContext();

export const useAppContext = () => useContext(AppContext);

// Re-exported so every existing `import { validatePasswordComplexity } from
// '../context/AppContext'` across the app keeps working unchanged. The real
// implementation lives in src/utils/validation.js - pulled out specifically
// so it has zero dependencies and can be unit tested without pulling in React.
export { validatePasswordComplexity } from '../utils/validation.js';

export const AppProvider = ({ children }) => {
  const [isInstalled, setIsInstalled] = useState(() => {
    const savedInstalled = localStorage.getItem('sree_manju_installed');
    if (savedInstalled !== null) {
      try {
        return JSON.parse(savedInstalled);
      } catch (e) {
        console.error(e);
      }
    }
    return false;
  });

  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('sree_manju_user');
    return saved ? JSON.parse(saved) : null;
  });

  // Dealer returns and orders were removed from here: real ones now go
  // through the actual backend (POST /stock/dealer-return, POST
  // /dealers/purchases, POST /purchase-verification), called directly from
  // DealerDetails.jsx where there's real batch/medicine context to work
  // with. This local state operated on fake data no page reads anymore.

  // Staff is now server-backed (GET/POST /staff, PATCH /staff/{id}/status,
  // POST /staff/{id}/password) - see refreshStaff below.
  const [staffMembers, setStaffMembers] = useState([]);
  const [staffLoading, setStaffLoading] = useState(false);
  const [staffError, setStaffError] = useState('');

  const [activeEmail, setActiveEmail] = useState(null);

  // Notifications (Toast)
  const [notification, setNotification] = useState(null);

  const showNotification = (message) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 4000);
  };

  const logActivity = (action) => {
    const newLog = { 
      id: Date.now(), 
      action, 
      timestamp: new Date().toISOString(), 
      ip: '192.168.1.105',
      userEmail: user?.email || (user?.role === 'owner' ? 'owner@sreemanjupharmacy.com' : 'staff@sreemanjupharmacy.com'),
      userName: user?.name || (user?.role === 'owner' ? 'Sree Manju' : 'Staff Pharmacist'),
      userRole: user?.role || 'owner'
    };
    setActivityLogs(prevLogs => {
      const updated = [newLog, ...(prevLogs || [])];
      localStorage.setItem('sree_manju_logs', JSON.stringify(updated));
      return updated;
    });
  };

  // Comprehensive Demo Datasets for Demo / Testing
  const demoInventory = [
    {
      id: 101,
      name: 'Dolo 650mg Tablet',
      genericName: 'Paracetamol 650mg',
      category: 'Analgesic',
      formulation: 'Tablet',
      manufacturer: 'Micro Labs Ltd',
      batchNo: 'DL2026-901',
      expiryDate: '2027-11-30',
      tabletsPerStrip: 15,
      totalStripsPurchased: 150,
      totalTablets: 2250,
      totalPurchasedTablets: 2250,
      stripPurchasePrice: 22.5,
      stripMrp: 30.0,
      stripSellingPrice: 28.0,
      tabletSellingPrice: 1.87,
      unitLabel: 'strip',
      dealerId: 1,
      location: 'Rack A - Shelf 2'
    },
    {
      id: 102,
      name: 'Amoxicillin 500mg Capsule',
      genericName: 'Amoxicillin Trihydrate',
      category: 'Antibiotic',
      formulation: 'Capsule',
      manufacturer: 'Sun Pharma',
      batchNo: 'AMX2026-44',
      expiryDate: '2027-06-30',
      tabletsPerStrip: 10,
      totalStripsPurchased: 4, // Low Stock Trigger
      totalTablets: 40,
      totalPurchasedTablets: 40,
      stripPurchasePrice: 55.0,
      stripMrp: 75.0,
      stripSellingPrice: 70.0,
      tabletSellingPrice: 7.0,
      unitLabel: 'strip',
      dealerId: 1,
      location: 'Rack B - Shelf 1'
    },
    {
      id: 103,
      name: 'Metformin 500mg (Glycomet)',
      genericName: 'Metformin Hydrochloride',
      category: 'Cardiovascular',
      formulation: 'Tablet',
      manufacturer: 'USV Pvt Ltd',
      batchNo: 'GLY2026-12',
      expiryDate: '2028-01-15',
      tabletsPerStrip: 15,
      totalStripsPurchased: 90,
      totalTablets: 1350,
      totalPurchasedTablets: 1350,
      stripPurchasePrice: 18.0,
      stripMrp: 26.0,
      stripSellingPrice: 24.0,
      tabletSellingPrice: 1.6,
      unitLabel: 'strip',
      dealerId: 2,
      location: 'Rack C - Shelf 3'
    },
    {
      id: 104,
      name: 'Pantoprazole 40mg (Pan 40)',
      genericName: 'Pantoprazole Sodium',
      category: 'Analgesic',
      formulation: 'Tablet',
      manufacturer: 'Alkem Laboratories',
      batchNo: 'PAN2026-88',
      expiryDate: '2027-09-20',
      tabletsPerStrip: 10,
      totalStripsPurchased: 120,
      totalTablets: 1200,
      totalPurchasedTablets: 1200,
      stripPurchasePrice: 42.0,
      stripMrp: 60.0,
      stripSellingPrice: 54.0,
      tabletSellingPrice: 5.4,
      unitLabel: 'strip',
      dealerId: 2,
      location: 'Rack A - Shelf 1'
    },
    {
      id: 105,
      name: 'Cetirizine 10mg (Cetzine)',
      genericName: 'Cetirizine Dihydrochloride',
      category: 'Respiratory',
      formulation: 'Tablet',
      manufacturer: 'Dr. Reddy Labs',
      batchNo: 'CTZ2025-09',
      expiryDate: '2026-08-15', // Expired Trigger
      tabletsPerStrip: 10,
      totalStripsPurchased: 25,
      totalTablets: 250,
      totalPurchasedTablets: 250,
      stripPurchasePrice: 12.0,
      stripMrp: 18.0,
      stripSellingPrice: 16.0,
      tabletSellingPrice: 1.6,
      unitLabel: 'strip',
      dealerId: 3,
      location: 'Rack D - Shelf 4'
    },
    {
      id: 106,
      name: 'Benadryl Cough Syrup 100ml',
      genericName: 'Diphenhydramine HCI',
      category: 'Respiratory',
      formulation: 'Syrup',
      manufacturer: 'Johnson & Johnson',
      batchNo: 'BND2026-55',
      expiryDate: '2027-12-31',
      tabletsPerStrip: 1,
      totalStripsPurchased: 35,
      totalTablets: 35,
      totalPurchasedTablets: 35,
      stripPurchasePrice: 85.0,
      stripMrp: 115.0,
      stripSellingPrice: 105.0,
      tabletSellingPrice: 105.0,
      unitLabel: 'bottle',
      dealerId: 3,
      location: 'Syrup Shelf B'
    }
  ];

  const demoSales = [
    {
      id: 1,
      invoiceNo: 'INV-2026-001',
      customerName: 'Rajesh Kumar',
      customerPhone: '+91 98401 23456',
      date: new Date(Date.now() - 3600000 * 2).toISOString(),
      paymentMode: 'Cash',
      totalAmount: 480.0,
      discountAmount: 20.0,
      finalAmount: 460.0,
      billedBy: 'Primary Owner',
      items: [
        { name: 'Dolo 650mg Tablet', quantity: 2, unitLabel: 'strip', price: 28.0, subtotal: 56.0 },
        { name: 'Pantoprazole 40mg (Pan 40)', quantity: 3, unitLabel: 'strip', price: 54.0, subtotal: 162.0 },
        { name: 'Metformin 500mg (Glycomet)', quantity: 10, unitLabel: 'strip', price: 24.0, subtotal: 240.0 }
      ]
    },
    {
      id: 2,
      invoiceNo: 'INV-2026-002',
      customerName: 'Sunita Sharma',
      customerPhone: '+91 97890 54321',
      date: new Date(Date.now() - 3600000 * 5).toISOString(),
      paymentMode: 'UPI QR',
      totalAmount: 840.0,
      discountAmount: 40.0,
      finalAmount: 800.0,
      billedBy: 'Staff Pharmacist',
      items: [
        { name: 'Amoxicillin 500mg Capsule', quantity: 2, unitLabel: 'strip', price: 70.0, subtotal: 140.0 },
        { name: 'Benadryl Cough Syrup 100ml', quantity: 2, unitLabel: 'bottle', price: 105.0, subtotal: 210.0 },
        { name: 'Pantoprazole 40mg (Pan 40)', quantity: 9, unitLabel: 'strip', price: 54.0, subtotal: 486.0 }
      ]
    },
    {
      id: 3,
      invoiceNo: 'INV-2026-003',
      customerName: 'K. Murugan',
      customerPhone: '+91 94441 87654',
      date: new Date(Date.now() - 3600000 * 24).toISOString(),
      paymentMode: 'Card',
      totalAmount: 1250.0,
      discountAmount: 50.0,
      finalAmount: 1200.0,
      billedBy: 'Primary Owner',
      items: [
        { name: 'Dolo 650mg Tablet', quantity: 5, unitLabel: 'strip', price: 28.0, subtotal: 140.0 },
        { name: 'Metformin 500mg (Glycomet)', quantity: 15, unitLabel: 'strip', price: 24.0, subtotal: 360.0 },
        { name: 'Benadryl Cough Syrup 100ml', quantity: 7, unitLabel: 'bottle', price: 105.0, subtotal: 735.0 }
      ]
    }
  ];

  const demoRegularPatients = [
    {
      id: 201,
      name: 'Ramesh G (Chronic Care)',
      phone: '+91 98409 88776',
      email: 'ramesh.g@gmail.com',
      condition: 'Diabetes & Hypertension',
      doctorName: 'Dr. K. Swaminathan (Diabetologist)',
      hospitalName: 'Apollo Hospitals, Chennai',
      lastPurchaseDate: new Date(Date.now() - 26 * 24 * 3600 * 1000).toISOString(),
      regularMedicines: ['Metformin 500mg (Glycomet)', 'Atorvastatin 10mg', 'Telmisartan 40mg'],
      refillCycleDays: 30,
      discountPercent: 10
    },
    {
      id: 202,
      name: 'Lakshmi Ammal',
      phone: '+91 97901 11223',
      email: 'lakshmi.ammal@yahoo.com',
      condition: 'Cardiac & BP Care',
      doctorName: 'Dr. V. Rajesh (Cardiologist)',
      hospitalName: 'Fortis Malar, Chennai',
      lastPurchaseDate: new Date(Date.now() - 14 * 24 * 3600 * 1000).toISOString(),
      regularMedicines: ['Ecosprin 75mg', 'Clopidogrel 75mg', 'Pantoprazole 40mg (Pan 40)'],
      refillCycleDays: 30,
      discountPercent: 12
    },
    {
      id: 203,
      name: 'Dr. S. Vijay',
      phone: '+91 94432 55443',
      email: 'dr.svijay@clinic.org',
      condition: 'Asthma & Respiratory',
      doctorName: 'Self / Pulmonologist',
      hospitalName: 'Vijaya Hospital, Chennai',
      lastPurchaseDate: new Date(Date.now() - 28 * 24 * 3600 * 1000).toISOString(),
      regularMedicines: ['Benadryl Cough Syrup 100ml', 'Cetirizine 10mg (Cetzine)'],
      refillCycleDays: 30,
      discountPercent: 15
    }
  ];

  const demoPatients = [
    { id: 301, name: 'Rajesh Kumar', phone: '+91 98401 23456', age: 42, gender: 'Male', address: 'T. Nagar, Chennai', visits: 5 },
    { id: 302, name: 'Sunita Sharma', phone: '+91 97890 54321', age: 35, gender: 'Female', address: 'Velachery, Chennai', visits: 3 },
    { id: 303, name: 'K. Murugan', phone: '+91 94441 87654', age: 58, gender: 'Male', address: 'Anna Nagar, Chennai', visits: 8 }
  ];

  const demoDealers = [
    {
      id: 1,
      name: 'Sun Pharma Wholesalers Ltd',
      representativeName: 'Suresh Kumar',
      contactNumber: '+91 98400 11223',
      email: 'orders@sunpharma-wholesalers.com',
      address: '45 Pharma Zone, Guindy Industrial Estate, Chennai - 600032',
      gstin: '33AAACS1234F1Z9',
      drugLicense: 'DL-TN-20B-998877',
      pendingOrders: 1
    },
    {
      id: 2,
      name: 'Cipla Healthcare Distributors',
      representativeName: 'M. Ramesh',
      contactNumber: '+91 98400 33445',
      email: 'sales@cipla-distributors.in',
      address: '12 Medical Complex, Kilpauk, Chennai - 600010',
      gstin: '33AAACC5566G1Z2',
      drugLicense: 'DL-TN-20B-445566',
      pendingOrders: 0
    },
    {
      id: 3,
      name: 'Mankind Pharma Supply Co',
      representativeName: 'Anand Sharma',
      contactNumber: '+91 98400 55667',
      email: 'supply@mankind-pharma.com',
      address: '88 Healthcare Avenue, Vadapalani, Chennai - 600026',
      gstin: '33AAACM8899H1Z4',
      drugLicense: 'DL-TN-20B-112233',
      pendingOrders: 0
    }
  ];

  const demoDealerOrders = [
    {
      id: 401,
      orderNo: 'ORD-2026-8821',
      dealerId: 1,
      dealerName: 'Sun Pharma Wholesalers Ltd',
      dealerEmail: 'orders@sunpharma-wholesalers.com',
      medicineName: 'Amoxicillin 500mg Capsule',
      quantity: 50,
      unitLabel: 'strip',
      expectedDate: '2026-08-28',
      status: 'Dispatched',
      orderedDate: new Date(Date.now() - 86400000).toISOString(),
      totalCost: 2750.0
    },
    {
      id: 402,
      orderNo: 'ORD-2026-8822',
      dealerId: 2,
      dealerName: 'Cipla Healthcare Distributors',
      dealerEmail: 'sales@cipla-distributors.in',
      medicineName: 'Metformin 500mg (Glycomet)',
      quantity: 100,
      unitLabel: 'strip',
      expectedDate: '2026-08-24',
      status: 'Received',
      orderedDate: new Date(Date.now() - 3 * 86400000).toISOString(),
      totalCost: 1800.0
    }
  ];

  const demoDealerReturns = [
    {
      id: 501,
      returnNo: 'RET-2026-101',
      dealerName: 'Mankind Pharma Supply Co',
      medicineName: 'Cetirizine 10mg (Cetzine)',
      quantity: 15,
      unitLabel: 'strip',
      reason: 'Expired Stock / Near Expiry',
      date: new Date(Date.now() - 2 * 86400000).toISOString(),
      status: 'Returned'
    }
  ];

  const demoLogs = [
    {
      id: 601,
      action: 'Loaded Complete Demo Dataset across Inventory, Sales, Patients & Dealers',
      timestamp: new Date().toISOString(),
      ip: '192.168.1.105',
      userName: 'Vignesh R',
      userRole: 'owner',
      userEmail: 'vicky07se@gmail.com'
    },
    {
      id: 602,
      action: 'Billed Invoice #INV-2026-003 to K. Murugan (₹1,200.00)',
      timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
      ip: '192.168.1.105',
      userName: 'Vignesh R',
      userRole: 'owner',
      userEmail: 'vicky07se@gmail.com'
    },
    {
      id: 603,
      action: 'System Alert: 25-Day Chronic Care Refill Due for Patient: Ramesh G',
      timestamp: new Date(Date.now() - 3600000 * 12).toISOString(),
      ip: '192.168.1.105',
      userName: 'System Alert',
      userRole: 'system',
      userEmail: 'system@sreemanjupharmacy.com'
    }
  ];

  const [activityLogs, setActivityLogs] = useState(() => {
    const saved = localStorage.getItem('sree_manju_logs');
    return saved ? JSON.parse(saved) : [];
  });

  const loadDemoData = () => {
    localStorage.setItem('sree_manju_inventory', JSON.stringify(demoInventory));
    localStorage.setItem('sree_manju_sales', JSON.stringify(demoSales));
    localStorage.setItem('sree_manju_patients', JSON.stringify(demoPatients));
    localStorage.setItem('sree_manju_regular_patients', JSON.stringify(demoRegularPatients));
    localStorage.setItem('sree_manju_dealers', JSON.stringify(demoDealers));
    localStorage.setItem('sree_manju_dealer_orders', JSON.stringify(demoDealerOrders));
    localStorage.setItem('sree_manju_dealer_returns', JSON.stringify(demoDealerReturns));
    localStorage.setItem('sree_manju_logs', JSON.stringify(demoLogs));

    setInventory(demoInventory);
    setSales(demoSales);
    setPatients(demoPatients);
    setRegularPatients(demoRegularPatients);
    setDealers(demoDealers);
    setDealerOrders(demoDealerOrders);
    setDealerReturns(demoDealerReturns);
    setActivityLogs(demoLogs);

    showNotification('🚀 Full Demo Dataset loaded across all modules (Inventory, Sales, Patients & Dealers)!');
  };

  const clearAllData = () => {
    localStorage.removeItem('sree_manju_inventory');
    localStorage.removeItem('sree_manju_sales');
    localStorage.removeItem('sree_manju_dealers');
    localStorage.removeItem('sree_manju_dealer_orders');
    localStorage.removeItem('sree_manju_dealer_returns');
    localStorage.removeItem('sree_manju_patients');
    localStorage.removeItem('sree_manju_regular_patients');
    localStorage.removeItem('sree_manju_logs');
    localStorage.removeItem('sree_manju_user');
    localStorage.setItem('sree_manju_registered_users', JSON.stringify([]));
    localStorage.setItem('sree_manju_staff', JSON.stringify([]));
    
    setInventory([]);
    setSales([]);
    setDealers([]);
    setDealerOrders([]);
    setDealerReturns([]);
    setPatients([]);
    setRegularPatients([]);
    setActivityLogs([]);
    setRegisteredUsers([]);
    setStaffMembers([]);
    setTodaySalesAmount(0);
    setUser(null);

    showNotification('🧹 All system data & accounts erased! Redirected to registration.');
  };

  // Inventory is now server-backed (api/medicines.php via GET /medicines),
  // not localStorage - see refreshInventory below. It starts empty and is
  // populated once a user is authenticated.
  const [inventory, setInventory] = useState([]);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [inventoryError, setInventoryError] = useState('');

  // Sales data lives entirely in the real API now (GET /sales/list) and is
  // fetched directly by the pages that need it (SalesLog.jsx, Dashboard.jsx)
  // rather than mirrored into context state.

  // Patients are now server-backed and created automatically by the backend
  // whenever a real sale is made (see api/patients.php: upsertPatientFromSale)
  // - there is no manual "add patient" flow, matching how it worked before.
  const [patients, setPatients] = useState([]);
  const [patientsLoading, setPatientsLoading] = useState(false);
  const [patientsError, setPatientsError] = useState('');

  // Regular / VIP chronic-care patients - also server-backed now.
  const [regularPatients, setRegularPatients] = useState([]);
  const [regularPatientsLoading, setRegularPatientsLoading] = useState(false);
  const [regularPatientsError, setRegularPatientsError] = useState('');

  const refreshPatients = async () => {
    setPatientsLoading(true);
    setPatientsError('');
    try {
      const data = await apiGet('patients');
      setPatients((data.patients || []).map(p => ({ ...p, lastVisit: p.last_visit })));
    } catch (err) {
      setPatientsError(err.message || 'Could not load patients from the server.');
    } finally {
      setPatientsLoading(false);
    }
  };

  const refreshRegularPatients = async () => {
    setRegularPatientsLoading(true);
    setRegularPatientsError('');
    try {
      const data = await apiGet('regular-patients');
      setRegularPatients((data.regular_patients || []).map(p => ({
        ...p,
        condition: p.condition_name,
        regularMedicines: p.regular_medicines ? p.regular_medicines.split(',').map(m => m.trim()).filter(Boolean) : [],
        courseDays: p.refill_cycle_days,
        reminderDays: p.reminder_days_before,
        lastPurchaseDate: p.last_purchase_date
      })));
    } catch (err) {
      setRegularPatientsError(err.message || 'Could not load regular customers from the server.');
    } finally {
      setRegularPatientsLoading(false);
    }
  };

  const addOrUpdateRegularPatient = async (patientData) => {
    try {
      await apiPost('regular-patients', {
        id: regularPatients.some(p => p.id === patientData.id) ? patientData.id : undefined,
        name: patientData.name,
        phone: patientData.phone,
        email: patientData.email,
        condition: patientData.condition,
        regular_medicines: patientData.regularMedicines,
        courseDays: patientData.courseDays,
        reminderDays: patientData.reminderDays,
        notes: patientData.notes,
        lastPurchaseDate: patientData.lastPurchaseDate
      });
      await refreshRegularPatients();
      logActivity(`Registered / Updated Regular Customer: ${patientData.name}`);
      showNotification(`Saved regular patient ${patientData.name} (${patientData.reminderDays || 25}-Day Auto Refill Alert Active)!`);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message || 'Could not save this regular customer. Please try again.' };
    }
  };

  // Helper to send real emails via PHP SMTP endpoint if configured
  const dispatchRealEmail = async (emailData) => {
    try {
      const savedConfig = localStorage.getItem('sree_manju_smtp_config');
      let config = savedConfig ? JSON.parse(savedConfig) : null;
      if (!config) {
        const res = await fetch('/pharmacy/sree-manju-pharmacy/api/smtp_mailer.php');
        const data = await res.json();
        if (data.success && data.config) config = data.config;
      }
      if (config && config.username && config.password) {
        const payload = {
          action: 'send',
          host: config.host || 'smtp.gmail.com',
          port: config.port || 587,
          encryption: config.encryption || 'tls',
          username: config.username,
          password: config.password,
          fromAddress: config.fromAddress || config.username,
          fromName: config.fromName || 'Sree Manju Pharmacy Notifications',
          toAddress: emailData.email,
          subject: emailData.subject,
          body: emailData.body
        };
        fetch('/pharmacy/sree-manju-pharmacy/api/smtp_mailer.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }).catch(err => console.warn('Email dispatch warning:', err));
      }
    } catch (e) {
      console.warn('Real email dispatch check warning:', e);
    }
  };

  const sendRefillEmailReminder = (patient) => {
    const ownerEmail = user?.email || 'owner@sreemanjupharmacy.com';
    const medsList = (patient.regularMedicines || []).join(', ') || 'Monthly Prescriptions';
    
    const lastDate = patient.lastPurchaseDate ? new Date(patient.lastPurchaseDate) : new Date();
    const daysPassed = Math.floor(Math.abs(new Date() - lastDate) / (1000 * 60 * 60 * 24));

    const emailObj = {
      type: 'Internal Pharmacy Staff Refill Alert',
      dealerName: 'Pharmacy Staff / Owner',
      email: ownerEmail,
      subject: `[INTERNAL PHARMACY ALERT] 25-Day Refill Due for Patient: ${patient.name}`,
      body: `INTERNAL PHARMACY ALERT (SREE MANJU PHARMACY)\n----------------------------------------\nPatient Refill Reminder Triggered (25+ Days Completed)\n\n• Patient Name: ${patient.name}\n• Phone Number: ${patient.phone}\n• Patient Email: ${patient.email || 'N/A'}\n• Chronic Condition: ${patient.condition || 'Regular Care'}\n• Regular Monthly Medicines: ${medsList}\n• Last Billing Date: ${new Date(patient.lastPurchaseDate).toLocaleDateString()}\n• Days Completed: ${daysPassed} Days (Threshold: 25 Days)\n\nREQUIRED ACTION FOR PHARMACY STAFF:\n1. Contact patient at ${patient.phone} or send WhatsApp refill reminder.\n2. Open Billing screen & load prefilled 30-day refill cart.\n\nSent automatically to Pharmacy Owner (${ownerEmail})`
    };

    setActiveEmail(emailObj);
    dispatchRealEmail(emailObj);
    logActivity(`Internal 25-Day Refill Alert Generated for Staff: ${patient.name}`);
  };

  // Dealer list is now server-backed (GET/POST /dealers) - see refreshDealers.
  // Orders and returns below are still local-only; that's the bigger
  // purchase-order workflow (real multi-item purchase orders, receiving,
  // and per-item verification) lives entirely in DealerDetails.jsx now,
  // calling api/dealers.php and api/purchase_verification.php directly.
  const [dealers, setDealers] = useState([]);
  const [dealersLoading, setDealersLoading] = useState(false);
  const [dealersError, setDealersError] = useState('');

  // Categories/formulations are now server-backed (GET/POST /categories,
  // /formulations) - see refreshCatalog below.
  const [categories, setCategories] = useState([]);
  const [formulations, setFormulations] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogError, setCatalogError] = useState('');



  // Maps a backend medicines row onto the shape the rest of the app already
  // expects (Billing, Dashboard, SalesLog, etc. all read these field names).
  // current_stock_base_units is the live, batch-derived tablet-equivalent
  // count - it's what's authoritative, not the legacy total_tablets column.
  const mapMedicineFromApi = (row) => ({
    id: row.id,
    name: row.name,
    genericName: row.generic_name || '',
    strength: '',
    category: row.category || 'General',
    formulation: row.formulation || 'Tablet',
    tabletsPerStrip: Number(row.tablets_per_strip) || 1,
    totalTablets: Number(row.current_stock_base_units) || 0,
    totalPurchasedTablets: Number(row.total_purchased_tablets) || Number(row.current_stock_base_units) || 0,
    pricePerStrip: Number(row.strip_selling_price) || 0,
    expiry: row.expiry_date || '',
    // The backend links a dealer by id; resolve the name from the (now also
    // server-backed) dealers list at render time via dealerId, rather than
    // guessing from text.
    dealer: '',
    dealerId: row.dealer_id || null,
    unitLabel: row.unit_label || 'strip',
    minimumStock: Number(row.minimum_stock) || 0,
    barcode: row.barcode || ''
  });

  const refreshInventory = async () => {
    setInventoryLoading(true);
    setInventoryError('');
    try {
      const data = await apiGet('medicines?limit=200');
      setInventory((data.medicines || []).map(mapMedicineFromApi));
    } catch (err) {
      setInventoryError(err.message || 'Could not load inventory from the server.');
    } finally {
      setInventoryLoading(false);
    }
  };

  const refreshCatalog = async () => {
    setCatalogLoading(true);
    setCatalogError('');
    try {
      const [catData, formData] = await Promise.all([apiGet('categories'), apiGet('formulations')]);
      setCategories(catData.categories || []);
      setFormulations((formData.formulations || []).map(f => ({ ...f, unitLabel: f.default_unit_label })));
    } catch (err) {
      setCatalogError(err.message || 'Could not load categories/formulations from the server.');
    } finally {
      setCatalogLoading(false);
    }
  };

  const addCategory = async (catData) => {
    try {
      await apiPost('categories', { name: catData.name, description: catData.description });
      await refreshCatalog();
      logActivity(`Added Category: ${catData.name}`);
      showNotification(`New medicine category added: ${catData.name}`);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message || 'Could not add the category. Please try again.' };
    }
  };

  const addFormulation = async (formulationData) => {
    try {
      await apiPost('formulations', {
        name: formulationData.name,
        description: formulationData.description,
        default_unit_label: formulationData.unitLabel
      });
      await refreshCatalog();
      logActivity(`Added Formulation Type: ${formulationData.name}`);
      showNotification(`New formulation type added: ${formulationData.name}`);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message || 'Could not add the formulation. Please try again.' };
    }
  };

  const deleteFormulation = async (id, name) => {
    try {
      await apiRequest(`formulations/${id}`, { method: 'DELETE' });
      await refreshCatalog();
      logActivity(`Deleted Formulation Type: ${name}`);
      showNotification(`Formulation type "${name}" removed.`);
      return { success: true };
    } catch (err) {
      showNotification(err.message || `Could not remove "${name}" - it may still be in use by a medicine.`);
      return { success: false, error: err.message };
    }
  };

  const refreshDealers = async () => {
    setDealersLoading(true);
    setDealersError('');
    try {
      const data = await apiGet('dealers');
      const mapped = (data.dealers || []).map(d => ({
        id: d.id,
        name: d.name,
        contactPerson: d.representative_name || '',
        phone: d.contact_number || '',
        email: d.email || '',
        address: d.address || '',
        gstin: d.gstin || '',
        drugLicense: d.drug_license || '',
        pendingOrders: Number(d.pending_orders) || 0
      }));
      setDealers(mapped);
    } catch (err) {
      setDealersError(err.message || 'Could not load dealers from the server.');
    } finally {
      setDealersLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      refreshInventory(); refreshDealers(); refreshCatalog(); refreshPatients(); refreshRegularPatients();
      if (user.role === 'owner') refreshStaff();
    }
  }, [user]);

  // Turns the Inventory "add medicine" form's chosen formulation into one of
  // the pack-unit labels api/stock.php actually accepts.
  const unitLabelForFormulation = (formulation) => {
    const map = {
      Tablet: 'strip', Capsule: 'strip',
      Syrup: 'bottle', Suspension: 'bottle',
      Ointment: 'tube',
      Drops: 'vial', Injection: 'vial',
      Spray: 'inhaler', Inhaler: 'inhaler',
      Powder: 'sachet'
    };
    return map[formulation] || 'strip';
  };

  const addProduct = async (product) => {
    const unitLabel = unitLabelForFormulation(product.formulation);
    const tabletsPerStrip = Number(product.tabletsPerStrip) || 1;
    try {
      const created = await apiPost('medicines', {
        name: product.name,
        generic_name: product.genericName,
        category: product.category,
        formulation: product.formulation,
        tablets_per_strip: tabletsPerStrip,
        strip_selling_price: Number(product.pricePerStrip) || 0,
        unit_label: unitLabel,
        expiry_date: product.expiry || null,
        barcode: product.barcode ? product.barcode.trim() : null
      });
      const medicineId = created.medicine_id;

      const totalTablets = Number(product.totalTablets) || 0;
      if (totalTablets > 0) {
        // unit_label 'strip' packs use tabletsPerStrip; every other pack
        // type (bottle/tube/vial/...) is already 1-per-unit, so the form's
        // "total initial stock" number is the pack quantity as-is.
        const packQuantity = unitLabel === 'strip'
          ? Math.max(Math.round(totalTablets / tabletsPerStrip), 1)
          : totalTablets;
        await apiPost('stock/receive', {
          medicine_id: medicineId,
          batch_number: `INIT-${medicineId}`,
          expiry_date: product.expiry,
          quantity: packQuantity,
          reason: 'Initial stock at creation'
        });
      }

      await refreshInventory();
      logActivity(`Added Medicine: ${product.name}`);
      showNotification(`Added new medicine: ${product.name}.`);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message || 'Could not add the medicine. Please try again.' };
    }
  };

  const addDealer = async (dealer) => {
    try {
      await apiPost('dealers', {
        name: dealer.name,
        representative_name: dealer.contactPerson,
        contact_number: dealer.phone,
        email: dealer.email,
        address: dealer.address,
        gstin: dealer.gstin,
        drug_license: dealer.drugLicense
      });
      await refreshDealers();
      logActivity(`Added Dealer: ${dealer.name}`);
      showNotification(`Registered new dealer: ${dealer.name}.`);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message || 'Could not add the dealer. Please try again.' };
    }
  };

  const [registeredUsers, setRegisteredUsers] = useState(() => {
    const saved = localStorage.getItem('sree_manju_registered_users');
    return saved ? JSON.parse(saved) : [];
  });

  // Real account creation and authentication now happen against the backend
  // (see src/services/auth.js: register / authenticate / requestPasswordReset /
  // confirmPasswordReset), which hashes passwords server-side and is the only
  // place a password is ever checked. This function just records the
  // non-sensitive registration facts locally afterward, for the role-count
  // hints shown during sign-up in Login.jsx. It never sees or stores a
  // password, and it does not enforce the one-owner/one-co-owner rule -
  // the backend is the source of truth for that.
  const recordRegisteredUser = ({ role, firstName, lastName, email, mobile }) => {
    const fullName = `${firstName} ${lastName}`.trim();
    const newUser = { id: Date.now(), role, name: fullName, email, mobile };
    const updated = [newUser, ...registeredUsers.filter(u => u.email.toLowerCase() !== email.toLowerCase())];
    setRegisteredUsers(updated);
    localStorage.setItem('sree_manju_registered_users', JSON.stringify(updated));

    const displayRoleLabel = role === 'primary_owner' ? 'Primary Owner' : (role === 'co_owner' ? 'Co-Owner' : 'Staff Pharmacist');
    logActivity(`Registered New Account (${displayRoleLabel}): ${fullName} (${email})`);
  };

  // Called once the backend has verified credentials (login) or a valid
  // session token exists. Stores only what the UI needs to display - never
  // a password.
  const setAuthenticatedUser = (apiUser) => {
    const sysRole = (apiUser.role || '').toLowerCase() === 'owner' ? 'owner' : 'staff';
    const u = { role: sysRole, subRole: apiUser.role_label || apiUser.role, name: apiUser.name, email: apiUser.email, id: apiUser.id };
    setUser(u);
    localStorage.setItem('sree_manju_user', JSON.stringify(u));
    logActivity(`Login (${apiUser.name} - ${apiUser.role})`);
  };

  const logout = () => {
    const currentName = user?.name || (user?.role === 'owner' ? 'Sree Manju' : 'Staff Pharmacist');
    const currentEmail = user?.email || (user?.role === 'owner' ? 'owner@sreemanjupharmacy.com' : 'staff@sreemanjupharmacy.com');
    logActivity(`Logout (${currentName} - ${currentEmail})`);
    setUser(null);
    localStorage.removeItem('sree_manju_user');
    setInventory([]);
    setInventoryError('');
    setDealers([]);
    setDealersError('');
    setCategories([]);
    setFormulations([]);
    setCatalogError('');
    setPatients([]);
    setPatientsError('');
    setRegularPatients([]);
    setRegularPatientsError('');
    setStaffMembers([]);
    setStaffError('');
    logoutApi().catch(() => {}); // best-effort - local state is already cleared either way
  };

  const updateProfileImage = (avatarUrl) => {
    setUser(prev => {
      const updated = { ...prev, avatar: avatarUrl };
      localStorage.setItem('sree_manju_user', JSON.stringify(updated));
      return updated;
    });
    showNotification('Profile picture updated successfully!');
    logActivity('Updated Profile Picture');
  };

  const refreshStaff = async () => {
    setStaffLoading(true);
    setStaffError('');
    try {
      const data = await apiGet('staff');
      setStaffMembers((data.staff || []).map(s => ({ ...s, joinDate: s.join_date, credentialsSet: true })));
    } catch (err) {
      setStaffError(err.message || 'Could not load staff from the server.');
    } finally {
      setStaffLoading(false);
    }
  };

  const addStaffMember = async (staffData) => {
    try {
      await apiPost('staff', {
        name: staffData.name,
        role: staffData.role,
        email: staffData.email,
        phone: staffData.phone,
        shift: staffData.shift,
        tempPassword: staffData.tempPassword
      });
      await refreshStaff();
      logActivity(`Registered New Staff Member: ${staffData.name} (${staffData.role})`);
      showNotification(`Successfully registered staff member ${staffData.name}!`);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message || 'Could not add this staff member. Please try again.' };
    }
  };

  const toggleStaffStatus = async (id) => {
    const member = staffMembers.find(m => m.id === id);
    try {
      const result = await apiRequest(`staff/${id}/status`, { method: 'PATCH' });
      await refreshStaff();
      logActivity(`${result.status} Staff Access: ${member?.name || id}`);
      showNotification(`Updated staff status for ${member?.name || 'staff member'} to ${result.status}`);
    } catch (err) {
      showNotification(err.message || 'Could not update this staff member\'s status.');
    }
  };

  const updateStaffPassword = async (staffId, newPassword, targetStaffName) => {
    try {
      await apiPost(`staff/${staffId}/password`, { password: newPassword });
      await refreshStaff();
      logActivity(`Owner updated password for staff member: ${targetStaffName || staffId}`);
      showNotification(`Password successfully updated for ${targetStaffName || 'staff member'}!`);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message || 'Could not update this password. Please try again.' };
    }
  };

  const removeExpiredStock = (id, name) => {
    setInventory(inventory.filter(i => i.id !== id));
    logActivity(`Removed Expired Stock: ${name}`);
    showNotification(`Successfully disposed of expired stock: ${name}`);
  };

  // returnSale was removed: real returns now go through POST /returns/customer
  // (per line item, per batch), called directly from SalesLog.jsx - see
  // api/returns.php: customerReturn. This function operated on the dead
  // local `sales` array and would never have matched real invoice data.


  // processSale was removed: Billing.jsx creates sales through the real
  // /sales API (see pharmacyApi.sales.create), not through this context.
  // This function was dead code left over from before that migration, and
  // dangerous to keep around - it wrote directly to localStorage copies of
  // inventory/patients/sales that no longer reflect the server.

  const getUnitName = (formulation) => {
    switch (formulation) {
      case 'Syrup':
      case 'Spray':
      case 'Drops': return 'bottle';
      case 'Ointment': return 'tube';
      case 'Injection': return 'vial';
      case 'Tablet':
      case 'Capsule': return 'tab';
      default: return 'unit';
    }
  };

  const getPackName = (formulation) => {
    switch (formulation) {
      case 'Tablet':
      case 'Capsule': return 'strip';
      default: return 'pack';
    }
  };

  const getStockDisplay = (item) => {
    const unit = getUnitName(item.formulation);
    const pack = getPackName(item.formulation);

    if (item.tabletsPerStrip === 1) {
      return `${item.totalTablets} ${unit}s`;
    }
    const strips = Math.floor(item.totalTablets / item.tabletsPerStrip);
    const loose = item.totalTablets % item.tabletsPerStrip;
    
    if (loose === 0) return `${strips} ${pack}s`;
    if (strips === 0) return `${loose} ${unit}s`;
    return `${strips} ${pack}s, ${loose} ${unit}s`;
  };

  const completeInstallation = async (installData) => {
    const { companyConfig, ownerConfig } = installData;

    // dbConfig / mailConfig intentionally aren't persisted here - they contain
    // a database password and SMTP credentials, which belong in the server's
    // .env file, never in browser storage.

    const businessSettings = {
      pharmacyName: companyConfig.pharmacyName || 'Sree Manju Pharmacy',
      dlNumber: companyConfig.dlNumber || 'DL-TN-102-123456',
      gstin: companyConfig.gstin || '33AAAAA0000A1Z5',
      phone: companyConfig.phone || '+91 98765 12345',
      email: companyConfig.email || 'owner@sreemanjupharmacy.com',
      address: companyConfig.address || '123 Health Street, Medical District, Chennai, Tamil Nadu 600001',
      receiptFooter: `Thank you for choosing ${companyConfig.pharmacyName || 'Sree Manju Pharmacy'}! Get well soon.`
    };
    localStorage.setItem('sree_manju_business_settings', JSON.stringify(businessSettings));

    const licenseSettings = {
      dlNumber: companyConfig.dlNumber || 'DL-TN-102-123456',
      dlExpiry: '2028-12-31',
      gstin: companyConfig.gstin || '33AAAAA0000A1Z5',
      pharmacistRegNo: companyConfig.pharmacistRegNo || 'PRN-2024-8890',
      dlFile: 'Drug_License_Form20_21.pdf',
      gstFile: 'GST_Registration_Certificate.pdf',
      regFile: 'Pharmacy_Council_Registration.pdf'
    };
    localStorage.setItem('sree_manju_license_info', JSON.stringify(licenseSettings));

    const fullName = `${ownerConfig.firstName.trim()} ${ownerConfig.lastName.trim()}`;

    // The owner account is created for real here (hashed server-side) rather
    // than just being written into local demo state with its password intact.
    await registerApi({
      role: 'primary_owner',
      firstName: ownerConfig.firstName.trim(),
      lastName: ownerConfig.lastName.trim(),
      email: ownerConfig.email.trim(),
      mobile: ownerConfig.mobile.trim(),
      password: ownerConfig.password
    });

    const ownerUser = {
      id: Date.now(),
      firstName: ownerConfig.firstName.trim(),
      lastName: ownerConfig.lastName.trim(),
      name: fullName,
      email: ownerConfig.email.trim(),
      mobile: ownerConfig.mobile.trim(),
      role: 'primary_owner'
    };

    const updatedRegUsers = [ownerUser];
    setRegisteredUsers(updatedRegUsers);
    localStorage.setItem('sree_manju_registered_users', JSON.stringify(updatedRegUsers));

    localStorage.setItem('sree_manju_installed', JSON.stringify(true));
    setIsInstalled(true);

    logActivity(`Completed First-Time Web Installer Setup for ${companyConfig.pharmacyName}`);
    showNotification(`🎉 Web Installation Completed for ${companyConfig.pharmacyName}! Welcome page ready.`);
  };

  const reRunInstaller = () => {
    localStorage.setItem('sree_manju_installed', JSON.stringify(false));
    setIsInstalled(false);
    showNotification('System reset to Installation Wizard mode.');
  };

  return (
    <AppContext.Provider value={{
      isInstalled,
      completeInstallation,
      reRunInstaller,
      user,
      setAuthenticatedUser,
      logout,
      inventory,
      dealers,
      patients,
      patientsLoading,
      patientsError,
      refreshPatients,
      addProduct,
      inventoryLoading,
      inventoryError,
      refreshInventory,
      addDealer,
      dealersLoading,
      dealersError,
      refreshDealers,
      getStockDisplay,
      getUnitName,
      getPackName,
      updateProfileImage,
      activityLogs,
      logActivity,
      showNotification,
      removeExpiredStock,
      activeEmail,
      closeEmail: () => setActiveEmail(null),
      categories,
      addCategory,
      catalogLoading,
      catalogError,
      refreshCatalog,
      formulations,
      addFormulation,
      deleteFormulation,
      staffMembers,
      staffLoading,
      staffError,
      refreshStaff,
      addStaffMember,
      toggleStaffStatus,
      updateStaffPassword,
      regularPatients,
      regularPatientsLoading,
      regularPatientsError,
      refreshRegularPatients,
      addOrUpdateRegularPatient,
      sendRefillEmailReminder,
      clearAllData,
      loadDemoData,
      recordRegisteredUser,
      registeredUsers
    }}>
      {children}

      {/* Global Toast Notification */}
      {notification && (
        <div style={{
          position: 'fixed', bottom: '24px', right: '24px', backgroundColor: '#1e293b', color: 'white',
          padding: '16px 24px', borderRadius: '8px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
          display: 'flex', alignItems: 'center', gap: '12px', zIndex: 9999, animation: 'fadeIn 0.3s ease-out'
        }}>
          <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }}></span>
          {notification}
        </div>
      )}
    </AppContext.Provider>
  );
};

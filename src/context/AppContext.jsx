import { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext();

export const useAppContext = () => useContext(AppContext);

export const validatePasswordComplexity = (password) => {
  if (!password) {
    return { isValid: false, error: "Password is required." };
  }
  const len = password.length;
  if (len < 8 || len > 16) {
    return { isValid: false, error: `Password length must be 8 to 16 characters (Current: ${len} characters).` };
  }

  const missing = [];
  if (!/[A-Z]/.test(password)) missing.push("1+ Uppercase letter (A-Z)");
  if (!/[a-z]/.test(password)) missing.push("1+ Lowercase letter (a-z)");
  if (!/[0-9]/.test(password)) missing.push("1+ Number (0-9)");
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>?]/.test(password)) missing.push("1+ Special character (!@#$%^&*)");

  if (missing.length > 0) {
    return { 
      isValid: false, 
      error: `Missing required character(s): ${missing.join(', ')}` 
    };
  }
  return { isValid: true, error: "" };
};

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

  const initialDealerReturns = [
    { id: 1, dealerName: 'PharmaCorp India', medicineName: 'Amoxicillin 500mg', quantity: 20, reason: 'Near Expiry / Slow Moving', date: '2026-08-21T10:00:00.000Z', status: 'Returned' }
  ];

  const [dealerReturns, setDealerReturns] = useState(() => {
    const saved = localStorage.getItem('sree_manju_dealer_returns');
    return saved ? JSON.parse(saved) : initialDealerReturns;
  });

  const initialStaff = [
    { id: 1, name: 'Sree Manju', role: 'Primary Owner', email: 'owner@sreemanjupharmacy.com', phone: '+91 98765 12345', password: 'ownerpassword123', status: 'Active', shift: 'Full Day / General', joinDate: '2024-01-15' },
    { id: 2, name: 'Ramesh Kumar', role: 'Pharmacist', email: 'ramesh@sreemanjupharmacy.com', phone: '+91 98123 45678', password: 'rameshpass123', status: 'Active', shift: 'Morning (8:00 AM - 4:00 PM)', joinDate: '2024-06-01' },
    { id: 3, name: 'Anitha V', role: 'Staff', email: 'anitha@sreemanjupharmacy.com', phone: '+91 97890 12345', password: 'anithapass123', status: 'Active', shift: 'Evening (2:00 PM - 10:00 PM)', joinDate: '2025-02-10' }
  ];

  const [staffMembers, setStaffMembers] = useState(() => {
    const saved = localStorage.getItem('sree_manju_staff');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    const savedRegistered = localStorage.getItem('sree_manju_registered_users');
    if (savedRegistered) {
      try {
        const regUsers = JSON.parse(savedRegistered);
        return regUsers.map(u => ({
          id: u.id || Date.now(),
          name: u.name || `${u.firstName} ${u.lastName}`,
          email: u.email,
          phone: u.mobile || u.phone || '',
          role: u.role === 'primary_owner' ? 'Primary Owner' : (u.role === 'co_owner' ? 'Co-Owner' : 'Staff Pharmacist'),
          status: 'Active',
          password: u.password,
          shift: 'Morning (8:00 AM - 4:00 PM)'
        }));
      } catch (e) {
        console.error(e);
      }
    }
    return [];
  });

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
    return saved ? JSON.parse(saved) : demoLogs;
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

  // Inventory: Tracking by tablets to allow fractional strip sales
  const [inventory, setInventory] = useState(() => {
    const saved = localStorage.getItem('sree_manju_inventory');
    return saved ? JSON.parse(saved) : demoInventory;
  });

  // Sales tracking
  const [sales, setSales] = useState(() => {
    const saved = localStorage.getItem('sree_manju_sales');
    return saved ? JSON.parse(saved) : demoSales;
  });
  const [todaySalesAmount, setTodaySalesAmount] = useState(0);

  // Patients / Customers
  const [patients, setPatients] = useState(() => {
    const saved = localStorage.getItem('sree_manju_patients');
    return saved ? JSON.parse(saved) : demoPatients;
  });

  // Regular / VIP Chronic Care Patients
  const [regularPatients, setRegularPatients] = useState(() => {
    const saved = localStorage.getItem('sree_manju_regular_patients');
    return saved ? JSON.parse(saved) : demoRegularPatients;
  });

  const addOrUpdateRegularPatient = (patientData) => {
    const existingIndex = regularPatients.findIndex(p => p.id === patientData.id || (p.phone && p.phone === patientData.phone));
    let updated;
    if (existingIndex >= 0) {
      updated = regularPatients.map((p, idx) => idx === existingIndex ? { ...p, ...patientData } : p);
    } else {
      updated = [ { id: Date.now(), ...patientData }, ...regularPatients ];
    }
    setRegularPatients(updated);
    localStorage.setItem('sree_manju_regular_patients', JSON.stringify(updated));
    logActivity(`Registered / Updated Regular Customer: ${patientData.name}`);
    showNotification(`Saved regular patient ${patientData.name} (25-Day Auto Refill Alert Active)!`);
  };

  const sendRefillEmailReminder = (patient) => {
    const ownerEmail = user?.email || 'owner@sreemanjupharmacy.com';
    const medsList = (patient.regularMedicines || []).join(', ') || 'Monthly Prescriptions';
    
    const lastDate = patient.lastPurchaseDate ? new Date(patient.lastPurchaseDate) : new Date();
    const daysPassed = Math.floor(Math.abs(new Date() - lastDate) / (1000 * 60 * 60 * 24));

    setActiveEmail({
      type: 'Internal Pharmacy Staff Refill Alert',
      dealerName: 'Pharmacy Staff / Owner',
      email: ownerEmail,
      subject: `[INTERNAL PHARMACY ALERT] 25-Day Refill Due for Patient: ${patient.name}`,
      body: `INTERNAL PHARMACY ALERT (SREE MANJU PHARMACY)\n----------------------------------------\nPatient Refill Reminder Triggered (25+ Days Completed)\n\n• Patient Name: ${patient.name}\n• Phone Number: ${patient.phone}\n• Patient Email: ${patient.email || 'N/A'}\n• Chronic Condition: ${patient.condition || 'Regular Care'}\n• Regular Monthly Medicines: ${medsList}\n• Last Billing Date: ${new Date(patient.lastPurchaseDate).toLocaleDateString()}\n• Days Completed: ${daysPassed} Days (Threshold: 25 Days)\n\nREQUIRED ACTION FOR PHARMACY STAFF:\n1. Contact patient at ${patient.phone} or send WhatsApp refill reminder.\n2. Open Billing screen & load prefilled 30-day refill cart.\n\nSent automatically to Pharmacy Owner (${ownerEmail})`
    });
    logActivity(`Internal 25-Day Refill Alert Generated for Staff: ${patient.name}`);
  };

  // Dealers tracking
  const [dealers, setDealers] = useState(() => {
    const saved = localStorage.getItem('sree_manju_dealers');
    return saved ? JSON.parse(saved) : demoDealers;
  });

  const [dealerOrders, setDealerOrders] = useState(() => {
    const saved = localStorage.getItem('sree_manju_dealer_orders');
    return saved ? JSON.parse(saved) : demoDealerOrders;
  });

  const [categories, setCategories] = useState(() => {
    const saved = localStorage.getItem('sree_manju_categories');
    return saved ? JSON.parse(saved) : [
      { id: 1, name: 'Antibiotic', description: 'Antibacterial medicines & broad-spectrum antibiotics' },
      { id: 2, name: 'Analgesic', description: 'Pain relief & fever reducing medications' },
      { id: 3, name: 'Respiratory', description: 'Cough syrups, inhalers & asthma treatments' },
      { id: 4, name: 'NSAID', description: 'Non-steroidal anti-inflammatory drugs' },
      { id: 5, name: 'Cardiovascular', description: 'Heart, blood pressure & cholesterol medication' },
      { id: 6, name: 'Dermatology', description: 'Skin ointments, creams & topical treatments' },
      { id: 7, name: 'Vitamins & Supplements', description: 'Dietary supplements & immunity boosters' }
    ];
  });

  // Formulation Types (persisted to localStorage)
  const [formulations, setFormulations] = useState(() => {
    const saved = localStorage.getItem('sree_manju_formulations');
    return saved ? JSON.parse(saved) : [
      { id: 1, name: 'Tablet', unitLabel: 'strip', description: 'Oral solid dose packaged in blisters/strips' },
      { id: 2, name: 'Capsule', unitLabel: 'strip', description: 'Gelatin shell capsules packaged in strips' },
      { id: 3, name: 'Syrup', unitLabel: 'bottle', description: 'Oral liquid formulation in bottles' },
      { id: 4, name: 'Injection', unitLabel: 'vial', description: 'Sterile liquid or powder in vials or ampoules' },
      { id: 5, name: 'Ointment', unitLabel: 'tube', description: 'Topical cream or gel in collapsible tubes' },
      { id: 6, name: 'Drops', unitLabel: 'bottle', description: 'Ophthalmic, otic or oral liquid drop bottles' },
      { id: 7, name: 'Spray', unitLabel: 'bottle', description: 'Nasal or topical aerosol spray containers' },
      { id: 8, name: 'Inhaler', unitLabel: 'device', description: 'Respiratory inhaler device containers' },
      { id: 9, name: 'Suspension', unitLabel: 'bottle', description: 'Liquid mixture containing undissolved particles' },
      { id: 10, name: 'Powder', unitLabel: 'sachet', description: 'Medicinal powder or oral rehydration sachets' }
    ];
  });

  const addFormulation = (formulationData) => {
    const newForm = { id: Date.now(), ...formulationData };
    const updated = [...formulations, newForm];
    setFormulations(updated);
    localStorage.setItem('sree_manju_formulations', JSON.stringify(updated));
    logActivity(`Added Formulation Type: ${formulationData.name}`);
    showNotification(`New formulation type added: ${formulationData.name}`);
  };

  const deleteFormulation = (id, name) => {
    const updated = formulations.filter(f => f.id !== id);
    setFormulations(updated);
    localStorage.setItem('sree_manju_formulations', JSON.stringify(updated));
    logActivity(`Deleted Formulation Type: ${name}`);
    showNotification(`Formulation type "${name}" removed.`);
  };

  const addCategory = (catData) => {
    const newCat = { id: Date.now(), ...catData };
    const updated = [...categories, newCat];
    setCategories(updated);
    localStorage.setItem('sree_manju_categories', JSON.stringify(updated));
    logActivity(`Added Category: ${catData.name}`);
    showNotification(`New medicine category added: ${catData.name}`);
  };



  useEffect(() => {
    // Calculate today's sales (simplified for demo: assuming all sales in state are today)
    const total = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    setTodaySalesAmount(total);
  }, [sales]);

  const addProduct = (product) => {
    setInventory([...inventory, { id: Date.now(), totalPurchasedTablets: product.totalTablets, ...product }]);
    logActivity(`Added Stock: ${product.name}`);
    showNotification(`Added new medicine: ${product.name}. Email alert sent to Owner via Gmail.`);
  };

  const addDealer = (dealer) => {
    setDealers([...dealers, { id: Date.now(), ...dealer, pendingOrders: 0 }]);
    logActivity(`Added Dealer: ${dealer.name}`);
    showNotification(`Registered new dealer: ${dealer.name}. Email alert sent to Owner via Gmail.`);
  };

  const [registeredUsers, setRegisteredUsers] = useState(() => {
    const saved = localStorage.getItem('sree_manju_registered_users');
    return saved ? JSON.parse(saved) : [];
  });

  const registerUserAccount = (userData) => {
    const role = userData.role || 'primary_owner';
    const fullName = `${userData.firstName} ${userData.lastName}`.trim();

    // Check Role Registration Limits: Only 1 Primary Owner & Only 1 Co-Owner allowed!
    if (role === 'primary_owner') {
      const existingPrimary = registeredUsers.find(u => u.role === 'primary_owner');
      if (existingPrimary) {
        return { success: false, error: `Only 1 Primary Owner allowed! (${existingPrimary.name} is registered as Primary Owner).` };
      }
    } else if (role === 'co_owner') {
      const existingCoOwner = registeredUsers.find(u => u.role === 'co_owner');
      if (existingCoOwner) {
        return { success: false, error: `Only 1 Co-Owner allowed! (${existingCoOwner.name} is registered as Co-Owner).` };
      }
    }

    // Password complexity check
    const pwdCheck = validatePasswordComplexity(userData.password);
    if (!pwdCheck.isValid) {
      return { success: false, error: pwdCheck.error };
    }

    // Duplicate check
    const duplicate = registeredUsers.find(u => u.email.toLowerCase() === userData.email.toLowerCase() || (userData.mobile && u.mobile === userData.mobile));
    if (duplicate) {
      return { success: false, error: `An account with email (${userData.email}) or mobile (${userData.mobile}) is already registered!` };
    }

    const newUser = {
      id: Date.now(),
      ...userData,
      name: fullName,
      role
    };

    const updated = [newUser, ...registeredUsers];
    setRegisteredUsers(updated);
    localStorage.setItem('sree_manju_registered_users', JSON.stringify(updated));

    const displayRoleLabel = role === 'primary_owner' ? 'Primary Owner' : (role === 'co_owner' ? 'Co-Owner' : 'Staff Pharmacist');

    const newStaffMember = {
      id: newUser.id,
      name: fullName,
      email: userData.email,
      phone: userData.mobile,
      role: displayRoleLabel,
      status: 'Active',
      password: userData.password,
      shift: 'Morning (8:00 AM - 4:00 PM)'
    };

    setStaffMembers(prev => {
      let filtered = prev.filter(s => s.email.toLowerCase() !== userData.email.toLowerCase());
      if (role === 'primary_owner') {
        filtered = filtered.filter(s => s.role !== 'Primary Owner');
      } else if (role === 'co_owner') {
        filtered = filtered.filter(s => s.role !== 'Co-Owner');
      }
      const updatedStaff = [newStaffMember, ...filtered];
      localStorage.setItem('sree_manju_staff', JSON.stringify(updatedStaff));
      return updatedStaff;
    });

    logActivity(`Registered New Account (${displayRoleLabel}): ${fullName} (${userData.email})`);
    showNotification(`Account registered successfully for ${fullName} as ${displayRoleLabel}! Please sign in.`);
    return { success: true };
  };

  const updateUserPassword = (email, newPassword) => {
    const pwdCheck = validatePasswordComplexity(newPassword);
    if (!pwdCheck.isValid) {
      return { success: false, error: pwdCheck.error };
    }
    const updated = registeredUsers.map(u => {
      if (u.email.toLowerCase() === email.toLowerCase()) {
        return { ...u, password: newPassword };
      }
      return u;
    });
    setRegisteredUsers(updated);
    localStorage.setItem('sree_manju_registered_users', JSON.stringify(updated));
    logActivity(`Password Reset: Updated password for ${email}`);
    showNotification(`Password updated successfully for ${email}.`);
    return { success: true };
  };

  const login = (role, emailOrUsername) => {
    const matchedUser = (registeredUsers || []).find(u => 
      u.email.toLowerCase() === (emailOrUsername || '').toLowerCase() || 
      (u.mobile && u.mobile.includes(emailOrUsername))
    );
    const matchedStaff = (staffMembers || []).find(s => s.email.toLowerCase() === (emailOrUsername || '').toLowerCase());
    
    let name = role === 'primary_owner' ? 'Primary Owner' : (role === 'co_owner' ? 'Co-Owner Partner' : 'Staff Member');
    let email = emailOrUsername || (role === 'staff' ? 'staff@sreemanjupharmacy.com' : 'owner@sreemanjupharmacy.com');
    let mobile = '';

    if (matchedUser) {
      name = matchedUser.name;
      email = matchedUser.email;
      mobile = matchedUser.mobile;
    } else if (matchedStaff) {
      name = matchedStaff.name;
      email = matchedStaff.email;
    }

    const sysRole = role === 'staff' ? 'staff' : 'owner';
    const u = { role: sysRole, subRole: role, name, email, mobile };
    setUser(u);
    localStorage.setItem('sree_manju_user', JSON.stringify(u));
    logActivity(`Login (${name} - ${role})`);
  };

  const logout = () => {
    const currentName = user?.name || (user?.role === 'owner' ? 'Sree Manju' : 'Staff Pharmacist');
    const currentEmail = user?.email || (user?.role === 'owner' ? 'owner@sreemanjupharmacy.com' : 'staff@sreemanjupharmacy.com');
    logActivity(`Logout (${currentName} - ${currentEmail})`);
    setUser(null);
    localStorage.removeItem('sree_manju_user');
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

  const addStaffMember = (staffData) => {
    const newStaffObj = {
      id: Date.now(),
      name: staffData.name,
      role: staffData.role,
      email: staffData.email,
      phone: staffData.phone,
      password: staffData.tempPassword || 'staff12345',
      shift: staffData.shift,
      status: 'Active',
      joinDate: new Date().toISOString().split('T')[0]
    };
    const updated = [newStaffObj, ...staffMembers];
    setStaffMembers(updated);
    localStorage.setItem('sree_manju_staff', JSON.stringify(updated));
    logActivity(`Registered New Staff Member: ${staffData.name} (${staffData.role})`);
    showNotification(`Successfully registered staff member ${staffData.name}!`);
  };

  const toggleStaffStatus = (id) => {
    const updated = staffMembers.map(m => {
      if (m.id === id) {
        const newStatus = m.status === 'Active' ? 'Deactivated' : 'Active';
        logActivity(`${newStatus} Staff Access: ${m.name}`);
        showNotification(`Updated staff status for ${m.name} to ${newStatus}`);
        return { ...m, status: newStatus };
      }
      return m;
    });
    setStaffMembers(updated);
    localStorage.setItem('sree_manju_staff', JSON.stringify(updated));
  };

  const updateStaffPassword = (staffIdOrEmail, newPassword, targetStaffName) => {
    const updatedStaff = staffMembers.map(member => {
      if (member.id === staffIdOrEmail || member.email === staffIdOrEmail) {
        return { ...member, password: newPassword, passwordLastUpdated: new Date().toISOString() };
      }
      return member;
    });
    setStaffMembers(updatedStaff);
    localStorage.setItem('sree_manju_staff', JSON.stringify(updatedStaff));
    logActivity(`Owner updated password for staff member: ${targetStaffName || staffIdOrEmail}`);
    showNotification(`Password successfully updated for ${targetStaffName || 'staff member'}!`);
  };

  const removeExpiredStock = (id, name) => {
    setInventory(inventory.filter(i => i.id !== id));
    logActivity(`Removed Expired Stock: ${name}`);
    showNotification(`Successfully disposed of expired stock: ${name}`);
  };

  const returnSale = (saleId) => {
    const saleToReturn = sales.find(s => s.id === saleId);
    if (!saleToReturn) return false;

    if (saleToReturn.status === 'Returned') {
      showNotification(`This sale has already been returned and refunded.`);
      return false;
    }
    
    // 1. Calculate exact tablets to add back to inventory stock
    const updatedInventory = inventory.map(item => {
      const returnedItem = saleToReturn.items.find(c => c.id === item.id);
      if (returnedItem) {
        const isStrip = (returnedItem.unitType || 'strip') === 'strip';
        const tabletsPerStrip = item.tabletsPerStrip || 1;
        const tabsToRestore = isStrip ? (returnedItem.quantity * tabletsPerStrip) : returnedItem.quantity;
        return {
          ...item,
          totalTablets: item.totalTablets + tabsToRestore
        };
      }
      return item;
    });

    // 2. Mark sale as Returned in sales history audit log
    const updatedSales = sales.map(s => s.id === saleId ? { ...s, status: 'Returned', returnedAt: new Date().toISOString() } : s);
    
    setInventory(updatedInventory);
    localStorage.setItem('sree_manju_inventory', JSON.stringify(updatedInventory));
    setSales(updatedSales);
    localStorage.setItem('sree_manju_sales', JSON.stringify(updatedSales));
    logActivity(`Processed Return & Restock for Sale #${saleId} (Refund Amount: ₹${saleToReturn.totalAmount.toFixed(2)})`);
    showNotification(`Return & Refund of ₹${saleToReturn.totalAmount.toFixed(2)} processed successfully! Stock restored.`);
    return true;
  };

  const requestMedicine = (dealerName, medicineName, quantity) => {
    let targetEmail = 'orders@supplier.com';
    setDealers(prev => prev.map(d => {
      if (d.name.toLowerCase().includes(dealerName.toLowerCase()) || dealerName.toLowerCase().includes(d.name.toLowerCase())) {
        targetEmail = d.email || targetEmail;
        return { ...d, pendingOrders: d.pendingOrders + 1 };
      }
      return d;
    }));
    const newOrder = { id: Date.now(), dealerName, medicineName, quantity: Number(quantity), date: new Date().toISOString(), status: 'Pending Delivery' };
    setDealerOrders(prev => {
      const updated = [newOrder, ...prev];
      localStorage.setItem('sree_manju_dealer_orders', JSON.stringify(updated));
      return updated;
    });
    logActivity(`Requested Medicine: ${medicineName} (${quantity} ${quantity === 1 ? 'strip' : 'strips'}) from ${dealerName}`);
    showNotification(`Purchase order for ${quantity} ${quantity === 1 ? 'strip' : 'strips'} of ${medicineName} sent to ${dealerName}.`);

    // Trigger Dealer Email Dispatch
    setActiveEmail({
      type: 'Purchase Order Request',
      dealerName,
      email: targetEmail,
      subject: `[PURCHASE ORDER] Sree Manju Pharmacy - Request for ${medicineName}`,
      body: `Dear ${dealerName} Sales Team,\n\nPlease process the following purchase order request for Sree Manju Pharmacy:\n\n• Medicine Requested: ${medicineName}\n• Quantity: ${quantity} strips\n• Order Date: ${new Date().toLocaleDateString()}\n• Requested By: Owner (Sree Manju Pharmacy)\n\nPlease confirm receipt of this order and reply with estimated delivery timeline.\n\nThank you,\nSree Manju Pharmacy`
    });
  };

  const receiveMedicineOrder = (orderId) => {
    const order = dealerOrders.find(o => o.id === orderId || String(o.id) === String(orderId));
    if (!order || order.status === 'Received & Restocked') return;

    // 1. Update order status
    setDealerOrders(prev => {
      const updated = prev.map(o => (o.id === orderId || String(o.id) === String(orderId)) ? { ...o, status: 'Received & Restocked' } : o);
      localStorage.setItem('sree_manju_dealer_orders', JSON.stringify(updated));
      return updated;
    });

    // 2. Decrement dealer pending orders
    setDealers(prev => prev.map(d => {
      if (d.name.toLowerCase().includes(order.dealerName.toLowerCase()) || order.dealerName.toLowerCase().includes(d.name.toLowerCase())) {
        return { ...d, pendingOrders: Math.max(0, d.pendingOrders - 1) };
      }
      return d;
    }));

    // 3. Add to inventory stock
    setInventory(prev => {
      const orderMedClean = (order.medicineName || '').toLowerCase().trim();
      const existingIndex = prev.findIndex(item => {
        const itemClean = (item.name || '').toLowerCase().trim();
        return itemClean === orderMedClean || (orderMedClean && (itemClean.includes(orderMedClean) || orderMedClean.includes(itemClean)));
      });

      let updatedInventory;
      if (existingIndex >= 0) {
        updatedInventory = prev.map((item, idx) => idx === existingIndex ? {
          ...item,
          totalTablets: (Number(item.totalTablets) || 0) + (Number(order.quantity) || 0),
          totalPurchasedTablets: (Number(item.totalPurchasedTablets) || Number(item.totalTablets) || 0) + (Number(order.quantity) || 0)
        } : item);
      } else {
        const newMed = {
          id: Date.now(),
          name: order.medicineName,
          genericName: order.medicineName,
          strength: 'Standard',
          category: 'General',
          formulation: 'Tablet',
          tabletsPerStrip: 10,
          totalPurchasedTablets: Number(order.quantity) || 0,
          totalTablets: Number(order.quantity) || 0,
          pricePerStrip: 50.00,
          expiry: new Date(Date.now() + 31536000000).toISOString().split('T')[0],
          dealer: order.dealerName
        };
        updatedInventory = [...prev, newMed];
      }
      localStorage.setItem('sree_manju_inventory', JSON.stringify(updatedInventory));
      return updatedInventory;
    });

    logActivity(`Stock Received: ${order.medicineName} (${order.quantity} ${order.quantity === 1 ? 'strip' : 'strips'}) from ${order.dealerName}`);
    showNotification(`Received ${order.quantity} ${order.quantity === 1 ? 'strip' : 'strips'} of ${order.medicineName}. Inventory automatically updated!`);
  };

  const undoReceivedOrder = (orderId) => {
    const order = dealerOrders.find(o => o.id === orderId || String(o.id) === String(orderId));
    if (!order || order.status !== 'Received & Restocked') return;

    setDealerOrders(prev => {
      const updated = prev.map(o => (o.id === orderId || String(o.id) === String(orderId)) ? { ...o, status: 'Pending Delivery' } : o);
      localStorage.setItem('sree_manju_dealer_orders', JSON.stringify(updated));
      return updated;
    });

    setDealers(prev => prev.map(d => {
      if (d.name.toLowerCase().includes(order.dealerName.toLowerCase()) || order.dealerName.toLowerCase().includes(d.name.toLowerCase())) {
        return { ...d, pendingOrders: d.pendingOrders + 1 };
      }
      return d;
    }));

    setInventory(prev => {
      const orderMedClean = (order.medicineName || '').toLowerCase().trim();
      const updated = prev.map(item => {
        const itemClean = (item.name || '').toLowerCase().trim();
        if (itemClean === orderMedClean || (orderMedClean && (itemClean.includes(orderMedClean) || orderMedClean.includes(itemClean)))) {
          return {
            ...item,
            totalTablets: Math.max(0, (Number(item.totalTablets) || 0) - (Number(order.quantity) || 0))
          };
        }
        return item;
      });
      localStorage.setItem('sree_manju_inventory', JSON.stringify(updated));
      return updated;
    });

    logActivity(`Undid Received Order: ${order.medicineName} (${order.quantity} ${order.quantity === 1 ? 'strip' : 'strips'}) from ${order.dealerName}`);
    showNotification(`Reverted order for ${order.medicineName}. Stock deducted back.`);
  };

  const deleteMedicineOrder = (orderId) => {
    const order = dealerOrders.find(o => o.id === orderId || String(o.id) === String(orderId));
    if (!order) return;
    if (order.status === 'Pending Delivery') {
      setDealers(prev => prev.map(d => {
        if (d.name.toLowerCase().includes(order.dealerName.toLowerCase()) || order.dealerName.toLowerCase().includes(d.name.toLowerCase())) {
          return { ...d, pendingOrders: Math.max(0, d.pendingOrders - 1) };
        }
        return d;
      }));
    }
    setDealerOrders(prev => {
      const updated = prev.filter(o => o.id !== orderId && String(o.id) !== String(orderId));
      localStorage.setItem('sree_manju_dealer_orders', JSON.stringify(updated));
      return updated;
    });
    logActivity(`Cancelled Order Request: ${order.medicineName}`);
    showNotification(`Order request cancelled.`);
  };

  const undoStockReturn = (returnId) => {
    const ret = dealerReturns.find(r => r.id === returnId || String(r.id) === String(returnId));
    if (!ret) return;

    setInventory(prev => {
      let restored = false;
      const updated = prev.map(item => {
        const itemClean = (item.name || '').toLowerCase().trim();
        const retClean = (ret.medicineName || '').toLowerCase().trim();
        if (
          (ret.medicineId && String(item.id) === String(ret.medicineId)) ||
          (itemClean && retClean && itemClean === retClean) ||
          (itemClean && retClean && (itemClean.includes(retClean) || retClean.includes(itemClean)))
        ) {
          restored = true;
          return {
            ...item,
            totalTablets: (Number(item.totalTablets) || 0) + (Number(ret.quantity) || 0)
          };
        }
        return item;
      });

      if (!restored && ret.medicineName) {
        updated.push({
          id: ret.medicineId || Date.now(),
          name: ret.medicineName,
          genericName: ret.medicineName,
          strength: 'N/A',
          category: 'General',
          formulation: 'Tablet',
          tabletsPerStrip: 10,
          totalPurchasedTablets: Number(ret.quantity) || 0,
          totalTablets: Number(ret.quantity) || 0,
          pricePerStrip: 50.00,
          expiry: '2027-12-31',
          dealer: ret.dealerName || 'Supplier'
        });
      }

      localStorage.setItem('sree_manju_inventory', JSON.stringify(updated));
      return updated;
    });

    setDealerReturns(prev => {
      const updatedReturns = prev.map(r => {
        if (r.id === returnId || String(r.id) === String(returnId)) {
          return {
            ...r,
            status: 'Restored'
          };
        }
        return r;
      });
      localStorage.setItem('sree_manju_dealer_returns', JSON.stringify(updatedReturns));
      return updatedReturns;
    });

    logActivity(`Cancelled Stock Return: ${ret.medicineName} (${ret.quantity} ${ret.quantity === 1 ? 'strip' : 'strips'})`);
    showNotification(`Stock return cancelled. ${ret.quantity} ${ret.quantity === 1 ? 'strip' : 'strips'} restored back to inventory.`);
  };

  const returnStockToDealer = (medicineId, quantity, reason, dealerName) => {
    let medName = '';
    let targetEmail = 'returns@supplier.com';
    const updatedInventory = inventory.map(item => {
      if (item.id === medicineId) {
        medName = item.name;
        return {
          ...item,
          totalTablets: Math.max(0, item.totalTablets - Number(quantity))
        };
      }
      return item;
    });

    const foundDealer = dealers.find(d => d.name.toLowerCase().includes(dealerName.toLowerCase()) || dealerName.toLowerCase().includes(d.name.toLowerCase()));
    if (foundDealer && foundDealer.email) targetEmail = foundDealer.email;

    setInventory(updatedInventory);
    localStorage.setItem('sree_manju_inventory', JSON.stringify(updatedInventory));

    const newReturn = { id: Date.now(), dealerName, medicineName: medName, medicineId, quantity: Number(quantity), reason, date: new Date().toISOString(), status: 'Returned' };
    const updatedReturns = [newReturn, ...dealerReturns];
    setDealerReturns(updatedReturns);
    localStorage.setItem('sree_manju_dealer_returns', JSON.stringify(updatedReturns));

    logActivity(`Returned to Dealer: ${medName} (${quantity} ${quantity === 1 ? 'strip' : 'strips'}) to ${dealerName} [${reason}]`);
    showNotification(`Returned ${quantity} ${quantity === 1 ? 'strip' : 'strips'} of ${medName} to ${dealerName}. Email dispatch ready.`);

    // Trigger Dealer Email Dispatch
    setActiveEmail({
      type: 'Stock Return Notice',
      dealerName,
      email: targetEmail,
      subject: `[STOCK RETURN NOTICE] Sree Manju Pharmacy - Return of ${medName}`,
      body: `Dear ${dealerName} Accounts Team,\n\nPlease find details of returned inventory stock from Sree Manju Pharmacy:\n\n• Returned Medicine: ${medName}\n• Quantity Returned: ${quantity} strips\n• Return Reason: ${reason}\n• Date of Return: ${new Date().toLocaleDateString()}\n\nPlease credit our pharmacy account accordingly upon receipt of returned goods.\n\nThank you,\nSree Manju Pharmacy`
    });
  };

  const processSale = (cart, patientInfo, totalAmount, paymentMode = 'Cash') => {
    // 1. Record the sale
    const newSale = {
      id: Date.now(),
      date: new Date().toISOString(),
      patient: patientInfo,
      items: cart,
      totalAmount,
      paymentMode: paymentMode || 'Cash',
      status: 'Completed'
    };
    const updatedSales = [...sales, newSale];
    setSales(updatedSales);
    localStorage.setItem('sree_manju_sales', JSON.stringify(updatedSales));

    // 2. Record or update patient
    if (patientInfo && patientInfo.name) {
      setPatients(prev => {
        const existing = prev.find(p => p.phone === patientInfo.phone);
        if (existing) {
          return prev.map(p => p.phone === patientInfo.phone ? { ...p, lastVisit: newSale.date } : p);
        } else {
          logActivity(`Added Patient: ${patientInfo.name}`);
          return [...prev, { id: Date.now(), ...patientInfo, lastVisit: newSale.date }];
        }
      });
    }

    // 3. Decrease the inventory stock (calculating full strips vs loose tablets)
    const updatedInventory = inventory.map(item => {
      const cartItem = cart.find(c => c.id === item.id);
      if (cartItem) {
        const tabsToDeduct = (cartItem.unitType === 'strip') 
          ? (cartItem.quantity * (item.tabletsPerStrip || 1)) 
          : cartItem.quantity;
        return {
          ...item,
          totalTablets: Math.max(0, item.totalTablets - tabsToDeduct)
        };
      }
      return item;
    });
    setInventory(updatedInventory);
    localStorage.setItem('sree_manju_inventory', JSON.stringify(updatedInventory));

    // 4. Update Regular Patient last purchase date if matching
    if (patientInfo && (patientInfo.phone || patientInfo.name)) {
      setRegularPatients(prev => {
        const cleanPhone = (patientInfo.phone || '').replace(/\D/g, '');
        const updatedReg = prev.map(p => {
          const pClean = (p.phone || '').replace(/\D/g, '');
          if ((cleanPhone && pClean && cleanPhone === pClean) || (p.name.toLowerCase() === (patientInfo.name || '').toLowerCase())) {
            return { ...p, lastPurchaseDate: newSale.date };
          }
          return p;
        });
        localStorage.setItem('sree_manju_regular_patients', JSON.stringify(updatedReg));
        return updatedReg;
      });
    }
    
    showNotification(`Sale completed for ₹${totalAmount.toFixed(2)}. Email receipt & alert sent via Gmail.`);
  };

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

  const completeInstallation = (installData) => {
    const { dbConfig, companyConfig, ownerConfig } = installData;

    localStorage.setItem('sree_manju_db_config', JSON.stringify(dbConfig));

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
    const ownerUser = {
      id: Date.now(),
      firstName: ownerConfig.firstName.trim(),
      lastName: ownerConfig.lastName.trim(),
      name: fullName,
      email: ownerConfig.email.trim(),
      mobile: ownerConfig.mobile.trim(),
      password: ownerConfig.password,
      role: 'primary_owner'
    };

    const updatedRegUsers = [ownerUser];
    setRegisteredUsers(updatedRegUsers);
    localStorage.setItem('sree_manju_registered_users', JSON.stringify(updatedRegUsers));

    const newStaffMember = {
      id: ownerUser.id,
      name: fullName,
      email: ownerConfig.email.trim(),
      phone: ownerConfig.mobile.trim(),
      role: 'Primary Owner',
      status: 'Active',
      password: ownerConfig.password,
      shift: 'Full Day / General'
    };

    setStaffMembers([newStaffMember]);
    localStorage.setItem('sree_manju_staff', JSON.stringify([newStaffMember]));

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
      login,
      logout,
      inventory,
      sales,
      dealers,
      patients,
      todaySalesAmount,
      addProduct,
      addDealer,
      processSale,
      getStockDisplay,
      getUnitName,
      getPackName,
      updateProfileImage,
      activityLogs,
      logActivity,
      showNotification,
      removeExpiredStock,
      returnSale,
      requestMedicine,
      returnStockToDealer,
      receiveMedicineOrder,
      undoReceivedOrder,
      deleteMedicineOrder,
      undoStockReturn,
      activeEmail,
      closeEmail: () => setActiveEmail(null),
      dealerOrders,
      dealerReturns,
      categories,
      addCategory,
      formulations,
      addFormulation,
      deleteFormulation,
      staffMembers,
      addStaffMember,
      toggleStaffStatus,
      updateStaffPassword,
      regularPatients,
      addOrUpdateRegularPatient,
      sendRefillEmailReminder,
      clearAllData,
      loadDemoData,
      registerUserAccount,
      registeredUsers,
      updateUserPassword
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

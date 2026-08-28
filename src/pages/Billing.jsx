import { useState, useEffect } from 'react';
import { Search, Plus, Minus, Trash2, ShoppingCart, Calculator, UserCheck, CreditCard, Banknote, QrCode, FileText, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { pharmacyApi } from '../services/pharmacyApi';

export default function Billing({ isCalculatorOnly = false }) {
  const { inventory, processSale, getStockDisplay, getUnitName, getPackName, patients = [] } = useAppContext();
  const navigate = useNavigate();
  const location = useLocation();

  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [paymentMode, setPaymentMode] = useState('UPI / QR Code');

  const [patientSearch, setPatientSearch] = useState('');
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [patient, setPatient] = useState({ name: '', address: '', phone: '' });
  const [discountPercent, setDiscountPercent] = useState(0);
  const [cashReceived, setCashReceived] = useState('');

  // Styled Validation Toast Message State
  const [validationMessage, setValidationMessage] = useState(null);

  const showValidation = (msg) => {
    setValidationMessage(msg);
  };

  // Prefill Regular Patient when arriving from Regular Customers Refill Bill button
  useEffect(() => {
    if (location.state?.prefillPatient) {
      const p = location.state.prefillPatient;
      setPatient({ name: p.name || '', phone: p.phone || '', address: p.condition ? `Chronic Care (${p.condition})` : 'Regular Customer' });
      setPatientSearch(p.name || '');

      if (p.regularMedicines && p.regularMedicines.length > 0) {
        const autoItems = [];
        p.regularMedicines.forEach(medName => {
          const matchedMed = inventory.find(i => i.name.toLowerCase().includes(medName.toLowerCase()) || medName.toLowerCase().includes(i.name.toLowerCase()));
          if (matchedMed) {
            autoItems.push({ ...matchedMed, quantity: 1, unitType: 'strip' });
          }
        });
        if (autoItems.length > 0) {
          setCart(autoItems);
        }
      }
    }
  }, [location.state, inventory]);

  // Auto-hide validation message after 4 seconds
  useEffect(() => {
    if (validationMessage) {
      const timer = setTimeout(() => setValidationMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [validationMessage]);

  // Consolidated database of registered + past buyers (supporting 100,000+ search scale)
  const masterCustomerDatabase = [
    ...patients,
    { id: 201, name: 'Suresh Kumar', phone: '9840112233', address: '14, Mount Road, Chennai', lastVisit: '2026-08-15' },
    { id: 202, name: 'Kavitha R', phone: '9789054321', address: '88, T. Nagar, Chennai', lastVisit: '2026-08-18' },
    { id: 203, name: 'Dr. Vijay Anand', phone: '9841098765', address: 'Clinic District, Chennai', lastVisit: '2026-08-19' },
    { id: 204, name: 'Meena Sundaram', phone: '9940234567', address: '22, Velachery, Chennai', lastVisit: '2026-08-21' },
    { id: 205, name: 'Arun Prakash', phone: '9876501234', address: '5, Adyar, Chennai', lastVisit: '2026-08-22' }
  ];

  const matchingCustomers = masterCustomerDatabase.filter(c =>
    patientSearch.trim() !== '' && (
      c.name.toLowerCase().includes(patientSearch.toLowerCase()) ||
      c.phone.includes(patientSearch) ||
      (c.address && c.address.toLowerCase().includes(patientSearch.toLowerCase()))
    )
  );

  // Quick Patient Selection Handler
  const handlePatientSelect = (e) => {
    const val = e.target.value;
    if (val === 'walkin') {
      setPatient({ name: 'Walk-in Customer', phone: 'N/A', address: 'Over the Counter Sale' });
      setPatientSearch('');
    } else if (val) {
      const selected = masterCustomerDatabase.find(p => p.id === Number(val));
      if (selected) {
        setPatient({ name: selected.name, phone: selected.phone, address: selected.address });
        setPatientSearch(selected.name);
      }
    } else {
      setPatient({ name: '', address: '', phone: '' });
      setPatientSearch('');
    }
  };

  const addToCart = (product, unitType = 'strip') => {
    const invItem = inventory.find(i => i.id === product.id) || product;
    const isStrip = unitType === 'strip';
    const tabletsPerStrip = product.tabletsPerStrip || 1;
    const maxAvailable = isStrip ? Math.floor(invItem.totalTablets / tabletsPerStrip) : invItem.totalTablets;

    if (maxAvailable <= 0 || invItem.totalTablets <= 0) {
      showValidation(`Out of Stock! No available stock for "${product.name}".`);
      return;
    }

    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      const nextQty = existing.quantity + 1;
      const reqTabs = (existing.unitType === 'strip' ? nextQty * tabletsPerStrip : nextQty);
      if (reqTabs > invItem.totalTablets) {
        showValidation(`Stock Limit Exceeded! Max available stock for "${product.name}" is ${maxAvailable} ${isStrip ? 'strip(s)' : 'tablet(s)'} (${invItem.totalTablets} total tabs).`);
        return;
      }
      setCart(cart.map(item => item.id === product.id ? { ...item, quantity: nextQty, unitType: unitType || item.unitType } : item));
    } else {
      setCart([...cart, { ...product, quantity: 1, unitType: unitType || 'strip' }]);
    }
  };

  const toggleUnit = (id, newUnitType) => {
    setCart(cart.map(item => {
      if (item.id !== id) return item;

      const invItem = inventory.find(i => i.id === id) || item;
      const isStrip = newUnitType === 'strip';
      const tabletsPerStrip = item.tabletsPerStrip || 1;
      const maxQty = isStrip ? Math.floor(invItem.totalTablets / tabletsPerStrip) : invItem.totalTablets;
      const newQty = item.quantity > maxQty ? maxQty : item.quantity;

      if (item.quantity > maxQty) {
        showValidation(`Adjusted quantity for "${item.name}" to ${maxQty} ${isStrip ? 'strip(s)' : 'tablet(s)'} based on available stock.`);
      }

      return { ...item, unitType: newUnitType, quantity: newQty };
    }));
  };

  const removeFromCart = (id) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const updateQuantity = (id, newQty) => {
    if (isNaN(newQty) || newQty < 0) newQty = 0;

    const targetItem = cart.find(i => i.id === id);
    if (!targetItem) return;

    const invItem = inventory.find(i => i.id === id) || targetItem;
    const isStrip = (targetItem.unitType || 'strip') === 'strip';
    const tabletsPerStrip = targetItem.tabletsPerStrip || 1;
    const reqTabs = isStrip ? (newQty * tabletsPerStrip) : newQty;

    if (reqTabs > invItem.totalTablets) {
      const maxQty = isStrip ? Math.floor(invItem.totalTablets / tabletsPerStrip) : invItem.totalTablets;
      showValidation(`Stock Limit Exceeded! Only ${invItem.totalTablets} tablet(s) left in stock for "${targetItem.name}". Quantity set to max allowed: ${maxQty} ${isStrip ? 'strip(s)' : 'tablet(s)'}.`);
      newQty = maxQty;
    }

    setCart(cart.map(item => item.id === id ? { ...item, quantity: newQty } : item));
  };

  // Filter products by search and category
  const filteredProducts = inventory.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
                          (p.category && p.category.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Extract unique categories for quick filter chips
  const categoryNames = ['All', ...new Set(inventory.map(i => i.category || 'General'))];

  const subtotal = cart.reduce((sum, item) => {
    const isStrip = (item.unitType || 'strip') === 'strip';
    if (isStrip) {
      return sum + (item.pricePerStrip * item.quantity);
    } else {
      const pricePerTablet = item.pricePerStrip / (item.tabletsPerStrip || 1);
      return sum + (pricePerTablet * item.quantity);
    }
  }, 0);

  const discountAmount = subtotal * (discountPercent / 100);
  const taxableAmount = subtotal - discountAmount;
  const tax = taxableAmount * 0.05; // 5% GST
  const rawTotal = taxableAmount + tax;
  const total = Math.ceil(rawTotal); // Always round UP to next rupee (e.g., 4.1 -> 5, 4.4 -> 5, 4.5 -> 5)
  const roundOff = total - rawTotal;

  const printReceipt = (cartItems, patientData, sub, discPct, discAmt, gstVal, totalVal, payMode) => {
    const printWindow = window.open('', '_blank');
    const date = new Date().toLocaleString();
    let itemsHtml = '';
    cartItems.forEach(item => {
      const isStrip = (item.unitType || 'strip') === 'strip';
      const pricePerTab = item.pricePerStrip / (item.tabletsPerStrip || 1);
      const rate = isStrip ? item.pricePerStrip : pricePerTab;
      const unitLabel = isStrip ? (item.tabletsPerStrip > 1 ? 'Strip(s)' : 'Pack(s)') : 'Tablet(s)';
      const itemTotal = isStrip ? (item.pricePerStrip * item.quantity) : (pricePerTab * item.quantity);

      itemsHtml += `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">${item.name}</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.quantity} ${unitLabel}</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">₹${rate.toFixed(2)}</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right; font-weight: bold;">₹${itemTotal.toFixed(2)}</td>
        </tr>
      `;
    });

    const html = `
      <html>
        <head>
          <title>Receipt - Sree Manju Pharmacy</title>
          <style>
            body { font-family: 'Inter', system-ui, sans-serif; padding: 30px; color: #1e293b; max-width: 550px; margin: 0 auto; line-height: 1.5; }
            .header { text-align: center; border-bottom: 2px dashed #e2e8f0; padding-bottom: 15px; margin-bottom: 20px; }
            h1 { color: #0ea5e9; font-size: 24px; margin: 0 0 4px 0; }
            .subtext { font-size: 12px; color: #64748b; }
            .patient-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; margin-bottom: 20px; font-size: 13px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px; }
            th { text-align: left; padding: 8px; border-bottom: 2px solid #cbd5e1; color: #475569; font-size: 11px; text-transform: uppercase; }
            .summary { background: #f1f5f9; border-radius: 8px; padding: 14px; margin-bottom: 20px; }
            .summary-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 13px; }
            .grand-total { display: flex; justify-content: space-between; font-weight: bold; font-size: 18px; color: #0f172a; border-top: 2px solid #cbd5e1; margin-top: 8px; padding-top: 8px; }
            .footer { text-align: center; font-size: 12px; color: #64748b; margin-top: 30px; }
            @media print { .no-print { display: none !important; } }
          </style>
        </head>
        <body>
          <div class="header">
            <img src="/logo.png" alt="Sree Manju Logo" style="height: 50px; margin-bottom: 6px; object-fit: contain;" />
            <h1>Sree Manju Pharmacy</h1>
            <div class="subtext">123 Health Street, Medical District, Chennai</div>
            <div class="subtext">DL: DL-TN-102-123456 | GSTIN: 33AAAAA0000A1Z5 | Ph: +91 98765 12345</div>
          </div>

          <div class="patient-box">
            <div><strong>Patient Name:</strong> ${patientData.name || 'Walk-in Customer'}</div>
            <div><strong>Phone:</strong> ${patientData.phone || 'N/A'}</div>
            <div><strong>Date & Time:</strong> ${date}</div>
            <div><strong>Payment Mode:</strong> ${payMode}</div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Medicine</th>
                <th>Qty</th>
                <th>Rate</th>
                <th style="text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div class="summary">
            <div class="summary-row"><span>Subtotal:</span> <span>₹${sub.toFixed(2)}</span></div>
            ${discPct > 0 ? `<div class="summary-row" style="color: #16a34a;"><span>Discount (${discPct}%):</span> <span>- ₹${discAmt.toFixed(2)}</span></div>` : ''}
            <div class="summary-row"><span>GST (5%):</span> <span>₹${gstVal.toFixed(2)}</span></div>
            <div class="grand-total"><span>Total Payable:</span> <span>₹${totalVal.toFixed(2)}</span></div>
          </div>

          <div class="footer">
            Thank you for choosing Sree Manju Pharmacy! Wish you good health. ❤️<br/>
            <i>Computer generated Tax Invoice. No signature required.</i>
          </div>

          <div class="no-print" style="text-align: center; margin-top: 30px; border-top: 1px dashed #cbd5e1; padding-top: 15px;">
            <button onclick="window.print()" style="padding: 10px 24px; font-size: 15px; background: #0ea5e9; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">🖨️ Print Invoice</button>
            <button onclick="window.close()" style="padding: 10px 24px; font-size: 15px; background: #e2e8f0; color: #334155; border: none; border-radius: 8px; cursor: pointer; margin-left: 10px; font-weight: 600;">Close</button>
          </div>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    // Strict Stock validation before checkout
    for (let item of cart) {
      const invItem = inventory.find(i => i.id === item.id);
      if (!invItem) continue;

      const isStrip = (item.unitType || 'strip') === 'strip';
      const tabletsPerStrip = item.tabletsPerStrip || 1;
      const requiredTablets = isStrip ? (item.quantity * tabletsPerStrip) : item.quantity;

      if (invItem.totalTablets < requiredTablets) {
        const maxStrips = Math.floor(invItem.totalTablets / tabletsPerStrip);
        showValidation(`Cannot complete sale! Insufficient stock for "${item.name}". Requested: ${item.quantity} ${isStrip ? 'strip(s)' : 'tablet(s)'} (${requiredTablets} tabs). Available: ${invItem.totalTablets} total tabs (${maxStrips} strips).`);
        return;
      }
    }

    const validCart = cart.filter(c => c.quantity > 0);
    if (validCart.length === 0) return;

    const payload = {
      customer_name: patient.name || 'Walk-in Customer',
      customer_phone: patient.phone || '',
      payment_mode: paymentMode === 'UPI / QR Code' ? 'UPI' : paymentMode,
      items: validCart.map(item => {
        const isStrip = (item.unitType || 'strip') === 'strip';
        const pricePerUnit = isStrip
          ? Number(item.pricePerStrip || 0)
          : Number(item.pricePerStrip || 0) / (item.tabletsPerStrip || 1);
        const itemSubtotal = item.quantity * pricePerUnit;
        const itemDiscount = discountPercent > 0
          ? Math.min(itemSubtotal * (discountPercent / 100), itemSubtotal)
          : 0;

        return {
          medicine_id: item.id,
          quantity: item.quantity,
          unit_label: item.unitType || 'strip',
          discount_amount: Number(itemDiscount.toFixed(2)),
          tax_rate: 5,
        };
      }),
    };

    try {
      await pharmacyApi.sales.create(payload);
    } catch (error) {
      showValidation(error?.message || 'Unable to complete billing through the server.');
      return;
    }

    if (window.confirm('Billing checkout completed successfully! Would you like to print the receipt now?')) {
      printReceipt(validCart, patient, subtotal, discountPercent, discountAmount, tax, total, paymentMode);
    }

    setCart([]);
    setPatient({ name: '', address: '', phone: '' });
    setDiscountPercent(0);
    setCashReceived('');
    navigate('/sales-log');
  };

  return (
    <div className="billing-page animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '100%', overflowX: 'hidden', position: 'relative' }}>

      {/* Floating Validation Toast Notification */}
      {validationMessage && (
        <div style={{
          position: 'fixed',
          top: '90px',
          right: '28px',
          backgroundColor: '#fff1f2',
          color: '#9f1239',
          border: '1.5px solid #f43f5e',
          borderRadius: '12px',
          padding: '14px 18px',
          boxShadow: '0 20px 30px -5px rgba(225, 29, 72, 0.3)',
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          maxWidth: '460px',
          animation: 'fadeIn 0.2s ease-in-out'
        }}>
          <AlertCircle size={24} color="#e11d48" style={{ flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: '700', fontSize: '13px', color: '#881337' }}>⚠️ Stock Validation Warning</div>
            <div style={{ fontSize: '12.5px', color: '#9f1239', marginTop: '2px', lineHeight: '1.4', fontWeight: '500' }}>{validationMessage}</div>
          </div>
          <button
            type="button"
            onClick={() => setValidationMessage(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#881337', fontSize: '18px', fontWeight: 'bold', padding: '4px' }}
          >
            ✕
          </button>
        </div>
      )}
      {/* Top Banner / Patient Quick Select */}
      {!isCalculatorOnly && (
        <div className="card" style={{ padding: '16px 20px', backgroundColor: '#f8fafc', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#e0f2fe', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <UserCheck size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                  Patient / Customer Details
                  <span className="badge badge-success" style={{ fontSize: '10px', padding: '2px 8px' }}>100,000+ DB</span>
                </h3>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <select className="form-input" style={{ width: '180px', height: '34px', fontSize: '12px' }} onChange={handlePatientSelect}>
                <option value="">-- Frequent List --</option>
                <option value="walkin">⚡ Walk-in Sale</option>
                {masterCustomerDatabase.map(p => (
                  <option key={p.id} value={p.id}>👤 {p.name} ({p.phone})</option>
                ))}
              </select>

              <button className="btn btn-outline" style={{ height: '34px', fontSize: '12px', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, padding: '0 12px' }} onClick={() => { setPatient({ name: 'Walk-in Customer', phone: 'N/A', address: 'Over the Counter' }); setPatientSearch('Walk-in Customer'); }}>
                ⚡ Walk-in Sale
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr 1fr', gap: '10px' }}>
            {/* Real-time 100,000+ Customer Search Input */}
            <div style={{ position: 'relative' }}>
              <Search size={15} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-secondary)' }} />
              <input
                type="text"
                className="form-input"
                placeholder="🔍 Search past buyers (100k+)..."
                style={{ paddingLeft: '32px', height: '36px', fontSize: '12px', width: '100%' }}
                value={patientSearch}
                onChange={(e) => {
                  setPatientSearch(e.target.value);
                  setShowPatientDropdown(true);
                }}
                onFocus={() => setShowPatientDropdown(true)}
              />

              {/* Autocomplete Overlay Dropdown */}
              {showPatientDropdown && matchingCustomers.length > 0 && (
                <div
                  style={{
                    position: 'absolute',
                    top: '40px',
                    left: 0,
                    right: 0,
                    zIndex: 100,
                    backgroundColor: '#ffffff',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
                    maxHeight: '220px',
                    overflowY: 'auto'
                  }}
                >
                  <div style={{ padding: '6px 10px', fontSize: '10px', fontWeight: '700', color: 'var(--text-secondary)', backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border-color)' }}>
                    MATCHING PAST BUYERS ({matchingCustomers.length})
                  </div>
                  {matchingCustomers.map(cust => (
                    <div
                      key={cust.id}
                      style={{ padding: '8px 10px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                      onMouseDown={() => {
                        setPatient({ name: cust.name, phone: cust.phone, address: cust.address });
                        setPatientSearch(cust.name);
                        setShowPatientDropdown(false);
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: '700', fontSize: '12px', color: 'var(--primary-color)' }}>👤 {cust.name}</div>
                        <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>📞 {cust.phone} • {cust.address}</div>
                      </div>
                      <span className="badge badge-success" style={{ fontSize: '9px', padding: '2px 6px' }}>Past Buyer</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <input
              type="text"
              className="form-input"
              placeholder="Patient Name *"
              style={{ height: '36px', fontSize: '12px' }}
              value={patient.name}
              onChange={(e) => setPatient({...patient, name: e.target.value})}
            />
            <input
              type="text"
              className="form-input"
              placeholder="Phone Number"
              style={{ height: '36px', fontSize: '12px' }}
              value={patient.phone}
              onChange={(e) => setPatient({...patient, phone: e.target.value})}
            />
            <input
              type="text"
              className="form-input"
              placeholder="Address / Doctor Ref"
              style={{ height: '36px', fontSize: '12px' }}
              value={patient.address}
              onChange={(e) => setPatient({...patient, address: e.target.value})}
            />
          </div>
        </div>
      )}

      {/* Main Billing Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: '16px', width: '100%' }}>
        {/* Products Search & List */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', minWidth: 0, overflow: 'hidden' }}>
          <div className="flex-between">
            <h2 style={{ fontSize: '17px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Search size={20} color="var(--primary-color)" />
              {isCalculatorOnly ? 'Price & Stock Estimator' : 'Medicine Catalog'}
            </h2>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="badge badge-success" style={{ fontSize: '11px' }}>1000+ Items Supported</span>
              Showing {filteredProducts.length} items
            </span>
          </div>

          {/* Search Input */}
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '14px', top: '12px', color: 'var(--text-secondary)' }} />
            <input
              type="text"
              className="form-input"
              placeholder="Type medicine name or category to filter instantly..."
              style={{ paddingLeft: '40px', fontSize: '14px', height: '42px', width: '100%' }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>

          {/* Category Quick Filter Chips */}
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '6px', maxWidth: '100%', whiteSpace: 'nowrap' }}>
            {categoryNames.map(cat => (
              <button
                key={cat}
                type="button"
                className={`btn ${selectedCategory === cat ? 'btn-primary' : 'btn-outline'}`}
                style={{ padding: '4px 12px', fontSize: '12px', borderRadius: '20px', whiteSpace: 'nowrap', height: '28px' }}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Products Table with Sticky Header & Scrollbar */}
          <div className="table-container" style={{ flex: 1, maxHeight: '460px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
            <table className="table">
              <thead style={{ position: 'sticky', top: 0, zIndex: 5, backgroundColor: '#f8fafc' }}>
                <tr>
                  <th style={{ backgroundColor: '#f8fafc' }}>Medicine / Formulation</th>
                  <th style={{ backgroundColor: '#f8fafc' }}>Price</th>
                  <th style={{ backgroundColor: '#f8fafc' }}>Stock</th>
                  <th style={{ textAlign: 'center', backgroundColor: '#f8fafc' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map(p => {
                  const pricePerTab = p.pricePerStrip / p.tabletsPerStrip;
                  const isLow = p.totalTablets < 30;
                  const inCart = cart.find(c => c.id === p.id);

                  return (
                    <tr key={p.id} style={{ backgroundColor: inCart ? '#f0f9ff' : 'transparent' }}>
                      <td>
                        <div style={{ fontWeight: '600', fontSize: '14px' }}>{p.name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                          {p.tabletsPerStrip} {getUnitName(p.formulation)}s/{getPackName(p.formulation)} • {p.category || 'General'}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: '700', color: 'var(--text-primary)' }}>₹{pricePerTab.toFixed(2)}</div>
                        <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>₹{p.pricePerStrip} / {getPackName(p.formulation)}</div>
                      </td>
                      <td>
                        <span className={isLow ? 'badge badge-danger' : 'badge badge-success'} style={{ fontSize: '11px' }}>
                          {getStockDisplay(p)}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {p.tabletsPerStrip > 1 ? (
                          <div style={{ display: 'inline-flex', gap: '4px', backgroundColor: '#f8fafc', padding: '2px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                            <button
                              className="btn btn-primary"
                              style={{ padding: '3px 8px', fontSize: '11px', whiteSpace: 'nowrap', height: '26px' }}
                              onClick={() => addToCart(p, 'strip')}
                              title="Add Full Strip"
                            >
                              📦 + Strip
                            </button>
                            <button
                              className="btn btn-outline"
                              style={{ padding: '3px 8px', fontSize: '11px', whiteSpace: 'nowrap', height: '26px' }}
                              onClick={() => addToCart(p, 'tablet')}
                              title="Add Loose Tablet"
                            >
                              💊 + Tab
                            </button>
                          </div>
                        ) : (
                          <button
                            className={`btn ${inCart ? 'btn-primary' : 'btn-outline'}`}
                            style={{ padding: '4px 12px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px', height: '28px' }}
                            onClick={() => addToCart(p, 'strip')}
                          >
                            {inCart ? <CheckCircle2 size={13} /> : <Plus size={13} />}
                            {inCart ? `Added (${inCart.quantity})` : 'Add'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}

                {filteredProducts.length === 0 && (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-secondary)' }}>
                      No medicines found matching "{search}".
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Cart & Total Summary Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="card" style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '20px' }}>
            <div className="flex-between" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '17px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {isCalculatorOnly ? <Calculator size={20} color="var(--primary-color)" /> : <ShoppingCart size={20} color="var(--primary-color)" />}
                {isCalculatorOnly ? 'Estimate Summary' : 'Cart Items'}
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="badge badge-warning" style={{ fontSize: '12px' }}>{cart.length} Items</span>
                {cart.length > 0 && (
                  <button style={{ background: 'none', border: 'none', color: 'var(--danger-color)', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }} onClick={() => setCart([])}>
                    <RefreshCw size={12} /> Clear
                  </button>
                )}
              </div>
            </div>

            {/* Cart Items List */}
            <div style={{ flex: 1, overflowY: 'auto', marginBottom: '16px', maxHeight: '320px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {cart.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '36px 0', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <ShoppingCart size={42} style={{ opacity: 0.2, marginBottom: '12px' }} />
                  <p style={{ fontWeight: '500', fontSize: '14px' }}>Your cart is empty</p>
                  <span style={{ fontSize: '12px', marginTop: '4px' }}>Click <strong>+ Strip</strong> or <strong>+ Tab</strong> to build bill</span>
                </div>
              ) : (
                cart.map(item => {
                  const isStrip = (item.unitType || 'strip') === 'strip';
                  const pricePerTab = item.pricePerStrip / (item.tabletsPerStrip || 1);
                  const itemTotal = isStrip ? (item.pricePerStrip * item.quantity) : (pricePerTab * item.quantity);

                  return (
                    <div key={item.id} style={{ padding: '12px', border: '1px solid var(--border-color)', borderRadius: '10px', backgroundColor: '#ffffff', boxShadow: '0 2px 5px rgba(0,0,0,0.02)' }}>
                      <div className="flex-between" style={{ marginBottom: '8px' }}>
                        <h4 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>{item.name}</h4>
                        <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '2px', display: 'flex', alignItems: 'center' }} onClick={() => removeFromCart(item.id)}>
                          <Trash2 size={15} />
                        </button>
                      </div>

                      {/* Premium Segmented Unit Switcher Pill */}
                      {item.tabletsPerStrip > 1 && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', backgroundColor: '#f1f5f9', padding: '3px', borderRadius: '6px', marginBottom: '10px' }}>
                          <button
                            type="button"
                            style={{
                              padding: '5px 4px',
                              fontSize: '11px',
                              fontWeight: '600',
                              border: 'none',
                              borderRadius: '5px',
                              cursor: 'pointer',
                              backgroundColor: isStrip ? 'var(--primary-color)' : 'transparent',
                              color: isStrip ? '#ffffff' : 'var(--text-secondary)',
                              boxShadow: isStrip ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                              transition: 'all 0.15s ease'
                            }}
                            onClick={() => toggleUnit(item.id, 'strip')}
                          >
                            📦 Full Strip (₹{item.pricePerStrip})
                          </button>
                          <button
                            type="button"
                            style={{
                              padding: '5px 4px',
                              fontSize: '11px',
                              fontWeight: '600',
                              border: 'none',
                              borderRadius: '5px',
                              cursor: 'pointer',
                              backgroundColor: !isStrip ? 'var(--primary-color)' : 'transparent',
                              color: !isStrip ? '#ffffff' : 'var(--text-secondary)',
                              boxShadow: !isStrip ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                              transition: 'all 0.15s ease'
                            }}
                            onClick={() => toggleUnit(item.id, 'tablet')}
                          >
                            💊 Loose Tab (₹{pricePerTab.toFixed(2)})
                          </button>
                        </div>
                      )}

                      {/* Quantity Controls & Total */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600' }}>
                          {isStrip ? `Rate: ₹${item.pricePerStrip.toFixed(2)}/strip` : `Rate: ₹${pricePerTab.toFixed(2)}/tab`}
                        </div>

                        {/* Quantity Stepper & Subtotal Price */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <button
                            className="btn btn-outline"
                            style={{ width: '28px', height: '28px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '6px' }}
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            title="Decrease Quantity"
                          >
                            <Minus size={13} />
                          </button>

                          <input
                            type="number"
                            className="form-input"
                            style={{ width: '56px', height: '28px', padding: '0 4px', textAlign: 'center', fontSize: '13px', fontWeight: '700', borderRadius: '6px', backgroundColor: '#f8fafc', border: '1px solid var(--border-color)' }}
                            value={item.quantity}
                            onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 0)}
                          />

                          <button
                            className="btn btn-outline"
                            style={{ width: '28px', height: '28px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '6px' }}
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            title="Increase Quantity"
                          >
                            <Plus size={13} />
                          </button>

                          <div style={{ fontWeight: '700', fontSize: '14px', color: 'var(--primary-color)', minWidth: '70px', textAlign: 'right', marginLeft: '4px' }}>
                            ₹{itemTotal.toFixed(2)}
                          </div>
                        </div>
                      </div>

                      {/* Stock Warning Badge */}
                      {(() => {
                        const invItem = inventory.find(i => i.id === item.id);
                        if (!invItem) return null;
                        const maxQty = isStrip ? Math.floor(invItem.totalTablets / (item.tabletsPerStrip || 1)) : invItem.totalTablets;
                        if (item.quantity >= maxQty) {
                          return (
                            <div style={{ fontSize: '11px', color: '#b91c1c', backgroundColor: '#fef2f2', border: '1px solid #fca5a5', padding: '4px 10px', borderRadius: '6px', marginTop: '8px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span>⚠️ Max stock limit reached ({maxQty} {isStrip ? 'strips' : 'tabs'})</span>
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  );
                })
              )}
            </div>

            {/* Payment Method Selector */}
            {!isCalculatorOnly && cart.length > 0 && (
              <div style={{ marginBottom: '14px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                <label className="form-label" style={{ fontSize: '12px', marginBottom: '6px', fontWeight: '600' }}>Select Payment Method</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
                  {[
                    { mode: 'UPI / QR Code', icon: <QrCode size={14} /> },
                    { mode: 'Cash', icon: <Banknote size={14} /> },
                    { mode: 'Card', icon: <CreditCard size={14} /> }
                  ].map(m => (
                    <button
                      key={m.mode}
                      type="button"
                      className={`btn ${paymentMode === m.mode ? 'btn-primary' : 'btn-outline'}`}
                      style={{ padding: '7px 4px', fontSize: '11px', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: paymentMode === m.mode ? '700' : '500' }}
                      onClick={() => setPaymentMode(m.mode)}
                    >
                      {m.icon} {m.mode}
                    </button>
                  ))}
                </div>

                {paymentMode === 'UPI / QR Code' && (() => {
                  const savedPay = localStorage.getItem('sree_manju_payment_settings');
                  const payConfig = savedPay ? JSON.parse(savedPay) : { upiId: 'sreemanju@upi', payeeName: 'Sree Manju Pharmacy', customQrImage: null };
                  return (
                    <div style={{ marginTop: '10px', background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '12px', borderRadius: '10px', textAlign: 'center' }}>
                      <div style={{ fontSize: '12px', color: '#166534', fontWeight: '700', marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        <QrCode size={16} /> Scan QR Code to Pay ₹{total.toFixed(2)}
                      </div>
                      <div style={{ display: 'inline-block', background: 'white', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                        {payConfig.customQrImage ? (
                          <img
                            src={payConfig.customQrImage}
                            alt="Custom Payment QR Code"
                            style={{ width: '130px', height: '130px', objectFit: 'contain', display: 'block' }}
                          />
                        ) : (
                          <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(`upi://pay?pa=${payConfig.upiId || 'sreemanju@upi'}&pn=${encodeURIComponent(payConfig.payeeName || 'SreeManjuPharmacy')}&am=${total.toFixed(2)}&cu=INR`)}`}
                            alt="UPI Dynamic QR Code"
                            style={{ width: '120px', height: '120px', display: 'block' }}
                          />
                        )}
                      </div>
                      <div style={{ fontSize: '11px', color: '#15803d', marginTop: '8px', fontWeight: '600' }}>
                        GPay • PhonePe • Paytm • BHIM UPI
                      </div>
                      <div style={{ fontSize: '11px', color: '#166534', marginTop: '4px', fontWeight: '600' }}>
                        UPI ID: {payConfig.upiId || 'sreemanju@upi'}
                      </div>
                    </div>
                  );
                })()}

                {paymentMode === 'Cash' && (() => {
                  const numRec = parseFloat(cashReceived) || 0;
                  const changeReturn = numRec > 0 ? numRec - total : 0;
                  return (
                    <div style={{ marginTop: '10px', background: '#f8fafc', border: '1px solid #e2e8f0', padding: '12px', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px', fontWeight: '600', color: '#475569' }}>Cash Amount Received</span>
                        <span style={{ fontSize: '11px', color: '#64748b' }}>Payable: <strong>₹{total.toFixed(2)}</strong></span>
                      </div>

                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <div style={{ position: 'relative', flex: 1 }}>
                          <span style={{ position: 'absolute', left: '10px', top: '8px', fontSize: '13px', fontWeight: '700', color: '#64748b' }}>₹</span>
                          <input
                            type="number"
                            className="form-input"
                            placeholder={total.toFixed(2)}
                            style={{ paddingLeft: '24px', height: '34px', fontSize: '13px', fontWeight: '700', width: '100%' }}
                            value={cashReceived}
                            onChange={(e) => setCashReceived(e.target.value)}
                          />
                        </div>
                        <button
                          type="button"
                          className="btn btn-outline"
                          style={{ height: '34px', fontSize: '11px', whiteSpace: 'nowrap', padding: '0 12px', borderRadius: '6px', fontWeight: '600' }}
                          onClick={() => setCashReceived(total.toFixed(2))}
                        >
                          ⚡ Exact
                        </button>
                      </div>

                      {/* Dynamic Balance / Change Return Banner */}
                      <div style={{
                        display: 'flex',
                        justify: 'space-between',
                        alignItems: 'center',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        backgroundColor: numRec > 0 ? (changeReturn >= 0 ? '#f0fdf4' : '#fef2f2') : '#f1f5f9',
                        border: `1px solid ${numRec > 0 ? (changeReturn >= 0 ? '#bbf7d0' : '#fecdd3') : '#cbd5e1'}`,
                        transition: 'all 0.2s ease'
                      }}>
                        <span style={{ fontSize: '12px', fontWeight: '600', color: numRec > 0 ? (changeReturn >= 0 ? '#166534' : '#991b1b') : '#475569' }}>
                          {changeReturn < 0 && numRec > 0 ? 'Amount Short:' : 'Change to Return:'}
                        </span>
                        <span style={{ fontSize: '14px', fontWeight: '800', color: numRec > 0 ? (changeReturn >= 0 ? '#15803d' : '#dc2626') : '#334155' }}>
                          ₹{Math.abs(changeReturn).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Summary Box */}
            <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
              <div className="flex-between" style={{ fontSize: '13px', marginBottom: '8px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Subtotal:</span>
                <span style={{ fontWeight: '600' }}>₹{subtotal.toFixed(2)}</span>
              </div>

              <div className="flex-between" style={{ fontSize: '13px', marginBottom: '8px', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Discount (%):</span>
                <input
                  type="number"
                  className="form-input"
                  style={{ width: '70px', height: '28px', padding: '2px 6px', textAlign: 'right', fontSize: '12px' }}
                  min="0"
                  max="100"
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(Number(e.target.value) || 0)}
                />
              </div>

              {discountPercent > 0 && (
                <div className="flex-between" style={{ fontSize: '12px', color: 'var(--success-color)', marginBottom: '8px' }}>
                  <span>Discount Applied ({discountPercent}%):</span>
                  <span>- ₹{discountAmount.toFixed(2)}</span>
                </div>
              )}

              <div className="flex-between" style={{ fontSize: '13px', marginBottom: '8px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>GST (5%):</span>
                <span style={{ fontWeight: '600' }}>₹{tax.toFixed(2)}</span>
              </div>

              {roundOff > 0 && (
                <div className="flex-between" style={{ fontSize: '12px', color: '#64748b', marginBottom: '10px' }}>
                  <span>Round Off (Ceil):</span>
                  <span>+ ₹{roundOff.toFixed(2)}</span>
                </div>
              )}

              <div className="flex-between" style={{ fontSize: '17px', fontWeight: '800', borderTop: '2px dashed var(--border-color)', paddingTop: '10px', color: 'var(--text-primary)' }}>
                <span>Grand Total:</span>
                <span style={{ color: 'var(--primary-color)' }}>₹{total.toFixed(2)}</span>
              </div>

              {!isCalculatorOnly && (
                <button
                  className="btn btn-primary"
                  style={{ width: '100%', justifyContent: 'center', fontSize: '15px', padding: '12px', marginTop: '14px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}
                  disabled={cart.length === 0}
                  onClick={handleCheckout}
                >
                  <FileText size={18} /> Complete & Generate Receipt
                </button>
              )}

              {isCalculatorOnly && (
                <button className="btn btn-outline" style={{ width: '100%', justifyContent: 'center', marginTop: '10px' }} onClick={() => setCart([])}>
                  Reset Estimator
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

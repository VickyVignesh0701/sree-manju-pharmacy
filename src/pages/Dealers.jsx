import { useState } from 'react';
import { Building2, Phone, Mail, Search, Filter, Undo2, Send, Clock, CheckCircle, RotateCcw, Trash2, AlertCircle } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';

export default function Dealers() {
  const { 
    dealers, addDealer, inventory, dealerOrders, dealerReturns, 
    requestMedicine, returnStockToDealer, receiveMedicineOrder,
    undoReceivedOrder, deleteMedicineOrder, undoStockReturn
  } = useAppContext();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('dealers'); // dealers, orders, returns
  const [showModal, setShowModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [modalError, setModalError] = useState('');
  const [formSubmitted, setFormSubmitted] = useState(false);

  const [orderModalError, setOrderModalError] = useState('');
  const [orderFormSubmitted, setOrderFormSubmitted] = useState(false);

  const [returnModalError, setReturnModalError] = useState('');
  const [returnFormSubmitted, setReturnFormSubmitted] = useState(false);

  const [newDealer, setNewDealer] = useState({ name: '', contactPerson: '', phone: '', email: '', pendingOrders: 0 });
  const [newOrder, setNewOrder] = useState({ dealerName: '', medName: '', qty: 50 });
  const [newReturn, setNewReturn] = useState({ dealerName: '', medId: '', qty: 10, reason: 'Unsold / Slow Moving' });

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, pending, received, returns

  const getDealerStats = (dealerName, defaultPending = 0) => {
    const pending = dealerOrders.filter(o => o.dealerName === dealerName && o.status === 'Pending Delivery').length + (defaultPending || 0);
    const received = dealerOrders.filter(o => o.dealerName === dealerName && o.status === 'Received').length;
    const returned = dealerReturns.filter(r => r.dealerName === dealerName).length;
    return { pending, received, returned };
  };

  const filteredDealers = dealers.filter(d => {
    const matchesSearch = d.name.toLowerCase().includes(search.toLowerCase()) || 
                          d.contactPerson.toLowerCase().includes(search.toLowerCase()) ||
                          d.phone.includes(search);
    
    const stats = getDealerStats(d.name, d.pendingOrders);
    let matchesStatus = true;

    if (statusFilter === 'pending') {
      matchesStatus = stats.pending > 0;
    } else if (statusFilter === 'received') {
      matchesStatus = stats.received > 0;
    } else if (statusFilter === 'returns') {
      matchesStatus = stats.returned > 0;
    }

    return matchesSearch && matchesStatus;
  });

  const handleOpenModal = () => {
    setModalError('');
    setFormSubmitted(false);
    setNewDealer({ name: '', contactPerson: '', phone: '', email: '', pendingOrders: 0 });
    setShowModal(true);
  };

  const handleAddDealer = () => {
    setFormSubmitted(true);
    setModalError('');

    const missingFields = [];
    if (!newDealer.name || !newDealer.name.trim()) missingFields.push('Company Name');
    if (!newDealer.phone || !newDealer.phone.trim()) missingFields.push('Phone Number');

    if (missingFields.length > 0) {
      setModalError(`Required field missing: ${missingFields.join(' & ')} is required.`);
      return;
    }

    addDealer({
      ...newDealer,
      name: newDealer.name.trim(),
      phone: newDealer.phone.trim(),
      email: newDealer.email ? newDealer.email.trim() : 'N/A'
    });
    setShowModal(false);
    setFormSubmitted(false);
    setModalError('');
    setNewDealer({ name: '', contactPerson: '', phone: '', email: '', pendingOrders: 0 });
  };

  const handleOpenOrderModal = () => {
    setOrderModalError('');
    setOrderFormSubmitted(false);
    setNewOrder({ dealerName: '', medName: '', qty: 50 });
    setShowOrderModal(true);
  };

  const handleSubmitOrder = () => {
    setOrderFormSubmitted(true);
    setOrderModalError('');

    const missing = [];
    if (!newOrder.dealerName) missing.push('Supplier / Dealer');
    if (!newOrder.medName || !newOrder.medName.trim()) missing.push('Medicine Name');
    if (!newOrder.qty || Number(newOrder.qty) <= 0) missing.push('Valid Quantity');

    if (missing.length > 0) {
      setOrderModalError(`Required field missing: ${missing.join(', ')} is required.`);
      return;
    }

    requestMedicine(newOrder.dealerName, newOrder.medName.trim(), Number(newOrder.qty));
    setShowOrderModal(false);
    setOrderFormSubmitted(false);
    setOrderModalError('');
    setNewOrder({ dealerName: '', medName: '', qty: 50 });
  };

  const handleOpenReturnModal = () => {
    setReturnModalError('');
    setReturnFormSubmitted(false);
    setNewReturn({ dealerName: '', medId: '', qty: 10, reason: 'Unsold / Slow Moving' });
    setShowReturnModal(true);
  };

  const handleSubmitReturn = () => {
    setReturnFormSubmitted(true);
    setReturnModalError('');

    const missing = [];
    if (!newReturn.dealerName) missing.push('Supplier / Dealer');
    if (!newReturn.medId) missing.push('Medicine to Return');
    if (!newReturn.qty || Number(newReturn.qty) <= 0) missing.push('Valid Quantity');

    if (missing.length > 0) {
      setReturnModalError(`Required field missing: ${missing.join(', ')} is required.`);
      return;
    }

    returnStockToDealer(newReturn.medId, Number(newReturn.qty), newReturn.reason, newReturn.dealerName);
    setShowReturnModal(false);
    setReturnFormSubmitted(false);
    setReturnModalError('');
    setNewReturn({ dealerName: '', medId: '', qty: 10, reason: 'Unsold / Slow Moving' });
  };

  return (
    <div className="dealers">
      {/* Top Tab Bar */}
      <div className="card" style={{ marginBottom: '24px', padding: '16px' }}>
        <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '16px' }}>
          <button 
            className={`btn ${activeTab === 'dealers' ? 'btn-primary' : 'btn-outline'}`}
            style={{ borderRadius: '20px', padding: '8px 20px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}
            onClick={() => setActiveTab('dealers')}
          >
            <Building2 size={16} /> Registered Dealers ({dealers.length})
          </button>
          <button 
            className={`btn ${activeTab === 'orders' ? 'btn-primary' : 'btn-outline'}`}
            style={{ borderRadius: '20px', padding: '8px 20px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}
            onClick={() => setActiveTab('orders')}
          >
            <Send size={16} /> Medicine Requests ({dealerOrders.length})
          </button>
          <button 
            className={`btn ${activeTab === 'returns' ? 'btn-primary' : 'btn-outline'}`}
            style={{ borderRadius: '20px', padding: '8px 20px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}
            onClick={() => setActiveTab('returns')}
          >
            <Undo2 size={16} /> Returns to Dealers ({dealerReturns.length})
          </button>
        </div>

        {activeTab === 'dealers' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="flex-between">
              <h2 style={{ fontSize: '18px', fontWeight: '600' }}>Registered Suppliers</h2>
              <button className="btn btn-primary" onClick={handleOpenModal}>
                Add New Dealer
              </button>
            </div>
            
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap', backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div style={{ position: 'relative', width: '250px' }}>
                <Search size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-secondary)' }} />
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Search dealer, contact, phone..." 
                  style={{ paddingLeft: '38px', backgroundColor: 'white' }}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'white', padding: '4px 12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <Filter size={16} color="var(--text-secondary)" />
                <select 
                  style={{ background: 'transparent', border: 'none', outline: 'none', cursor: 'pointer', fontSize: '14px', color: 'var(--text-primary)' }}
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Dealers</option>
                  <option value="pending">Dealers with Pending Orders</option>
                  <option value="received">Dealers with Received Orders</option>
                  <option value="returns">Dealers with Returned Stock</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="flex-between">
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '4px' }}>Medicine Purchase Requests</h2>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Log of all stock order requests sent to suppliers and dealers.</p>
            </div>
            <button className="btn btn-primary" onClick={handleOpenOrderModal} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Send size={16} /> New Purchase Request
            </button>
          </div>
        )}

        {activeTab === 'returns' && (
          <div className="flex-between">
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '4px' }}>Stock Returns to Suppliers</h2>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Log of all unsold, damaged, or expiring stock returned back to distributors.</p>
            </div>
            <button className="btn btn-primary" onClick={handleOpenReturnModal} style={{ backgroundColor: 'var(--warning-color)', borderColor: 'var(--warning-color)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Undo2 size={16} /> New Stock Return
            </button>
          </div>
        )}
      </div>

      {/* TAB 1: REGISTERED DEALERS GRID */}
      {activeTab === 'dealers' && (
        <div className="grid grid-cols-3">
          {filteredDealers.map(dealer => (
            <div key={dealer.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="flex-between" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--primary-color)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Building2 size={20} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: '600' }}>{dealer.name}</h3>
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{dealer.contactPerson}</span>
                  </div>
                </div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Phone size={16} /> {dealer.phone}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Mail size={16} /> {dealer.email}
                </div>
              </div>

              <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {(() => {
                  const stats = getDealerStats(dealer.name, dealer.pendingOrders);
                  return (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px', fontSize: '12px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        Pending: <span className={stats.pending > 0 ? 'badge badge-warning' : 'badge'}>{stats.pending}</span>
                      </span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        Received: <span className="badge badge-success">{stats.received}</span>
                      </span>
                      {stats.returned > 0 && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          Returned: <span className="badge badge-danger">{stats.returned}</span>
                        </span>
                      )}
                    </div>
                  );
                })()}

                <button className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '13px', width: '100%', justifyContent: 'center' }} onClick={() => navigate(`/dealers/${dealer.id}`)}>
                  View Dealer Details & History
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: MEDICINE ORDERS */}
      {activeTab === 'orders' && (
        <div className="card">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Supplier / Dealer</th>
                  <th>Medicine Name</th>
                  <th>Requested Qty</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {dealerOrders.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-secondary)' }}>
                      No purchase orders recorded yet.
                    </td>
                  </tr>
                ) : (
                  dealerOrders.map(order => (
                    <tr key={order.id}>
                      <td>{new Date(order.date).toLocaleString()}</td>
                      <td><div style={{ fontWeight: '600' }}>{order.dealerName}</div></td>
                      <td><span style={{ fontWeight: '500', color: 'var(--primary-color)' }}>{order.medicineName}</span></td>
                      <td>{order.quantity} {order.quantity === 1 ? 'strip' : 'strips'}</td>
                      <td>
                        {order.status === 'Received & Restocked' ? (
                          <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <CheckCircle size={12} /> Received & Restocked
                          </span>
                        ) : (
                          <span className="badge badge-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={12} /> Pending Delivery
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: 'center', display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        {order.status !== 'Received & Restocked' ? (
                          <>
                            <button 
                              className="btn btn-primary" 
                              style={{ padding: '6px 12px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px', backgroundColor: 'var(--secondary-color)', borderColor: 'var(--secondary-color)' }}
                              onClick={() => receiveMedicineOrder(order.id)}
                            >
                              <CheckCircle size={14} /> Mark Received
                            </button>
                            <button 
                              className="btn btn-outline" 
                              style={{ padding: '6px 10px', fontSize: '12px', color: 'var(--danger-color)', borderColor: 'var(--border-color)' }}
                              onClick={() => deleteMedicineOrder(order.id)}
                              title="Cancel Request"
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
                        ) : (
                          <button 
                            className="btn btn-outline" 
                            style={{ padding: '6px 12px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--warning-color)', border: '1px solid var(--warning-color)' }}
                            onClick={() => undoReceivedOrder(order.id)}
                          >
                            <RotateCcw size={14} /> Undo / Revert
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: DEALER RETURNS */}
      {activeTab === 'returns' && (
        <div className="card">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Supplier / Dealer</th>
                  <th>Returned Medicine</th>
                  <th>Quantity</th>
                  <th>Reason for Return</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {dealerReturns.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-secondary)' }}>
                      No stock returns recorded yet.
                    </td>
                  </tr>
                ) : (
                  dealerReturns.map(ret => (
                    <tr key={ret.id}>
                      <td>{new Date(ret.date).toLocaleString()}</td>
                      <td><div style={{ fontWeight: '600' }}>{ret.dealerName}</div></td>
                      <td><span style={{ fontWeight: '500', color: 'var(--primary-color)' }}>{ret.medicineName}</span></td>
                      <td>{ret.quantity} {ret.quantity === 1 ? 'strip' : 'strips'}</td>
                      <td><span className="badge badge-warning">{ret.reason}</span></td>
                      <td>
                        {ret.status === 'Restored' ? (
                          <span className="badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', backgroundColor: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd', fontWeight: '600' }}>
                            <RotateCcw size={12} /> Restored
                          </span>
                        ) : (
                          <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <CheckCircle size={12} /> {ret.status}
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {ret.status === 'Restored' ? (
                          <span style={{ fontSize: '12px', color: '#16a34a', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            ✓ Stock Restored
                          </span>
                        ) : (
                          <button 
                            className="btn btn-outline" 
                            style={{ padding: '6px 12px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--danger-color)', border: '1px solid var(--danger-color)' }}
                            onClick={() => undoStockReturn(ret.id)}
                          >
                            <RotateCcw size={14} /> Cancel Return & Restore Stock
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="modal card animate-fade-in" style={{ width: '420px', backgroundColor: 'var(--surface-color)', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', padding: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Building2 size={20} color="var(--primary-color)" /> Add New Supplier / Dealer
            </h3>

            {/* Modal Error Alert Banner */}
            {modalError && (
              <div style={{
                backgroundColor: '#fef2f2',
                border: '1px solid #f87171',
                borderRadius: '10px',
                padding: '10px 14px',
                marginBottom: '16px',
                color: '#991b1b',
                fontSize: '13px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <AlertCircle size={18} color="#dc2626" style={{ flexShrink: 0 }} />
                <span>{modalError}</span>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label className="form-label" style={{ fontWeight: '600', fontSize: '13px' }}>Company Name *</label>
                <input 
                  type="text"
                  className="form-input" 
                  placeholder="e.g. PharmaCorp India Pvt Ltd"
                  style={{
                    height: '40px',
                    borderColor: formSubmitted && !newDealer.name.trim() ? '#ef4444' : 'var(--border-color)',
                    backgroundColor: formSubmitted && !newDealer.name.trim() ? '#fef2f2' : '#ffffff'
                  }}
                  value={newDealer.name} 
                  onChange={(e) => {
                    setNewDealer({...newDealer, name: e.target.value});
                    if (modalError && e.target.value.trim()) setModalError('');
                  }} 
                  autoFocus
                />
                {formSubmitted && !newDealer.name.trim() && (
                  <span style={{ fontSize: '11.5px', color: '#dc2626', fontWeight: '600', marginTop: '4px', display: 'block' }}>
                    ⚠️ Company Name is required.
                  </span>
                )}
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: '600', fontSize: '13px' }}>Contact Person</label>
                <input 
                  type="text"
                  className="form-input" 
                  placeholder="e.g. Rajesh Kumar"
                  style={{ height: '40px' }}
                  value={newDealer.contactPerson} 
                  onChange={(e) => setNewDealer({...newDealer, contactPerson: e.target.value})} 
                />
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: '600', fontSize: '13px' }}>Phone Number *</label>
                <input 
                  type="text"
                  className="form-input" 
                  placeholder="e.g. +91 98765 43210"
                  style={{ 
                    height: '40px',
                    borderColor: formSubmitted && !newDealer.phone.trim() ? '#ef4444' : 'var(--border-color)',
                    backgroundColor: formSubmitted && !newDealer.phone.trim() ? '#fef2f2' : '#ffffff'
                  }}
                  value={newDealer.phone} 
                  onChange={(e) => {
                    setNewDealer({...newDealer, phone: e.target.value});
                    if (modalError && e.target.value.trim()) setModalError('');
                  }} 
                />
                {formSubmitted && !newDealer.phone.trim() && (
                  <span style={{ fontSize: '11.5px', color: '#dc2626', fontWeight: '600', marginTop: '4px', display: 'block' }}>
                    ⚠️ Phone Number is required.
                  </span>
                )}
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: '600', fontSize: '13px' }}>Email (Optional)</label>
                <input 
                  type="email"
                  className="form-input" 
                  placeholder="e.g. sales@pharmacorp.in (Optional)"
                  style={{ height: '40px', textTransform: 'lowercase' }}
                  value={newDealer.email} 
                  onChange={(e) => setNewDealer({...newDealer, email: e.target.value.toLowerCase()})} 
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleAddDealer}>Save Dealer</button>
            </div>
          </div>
        </div>
      )}

      {/* NEW PURCHASE REQUEST MODAL */}
      {showOrderModal && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="modal card animate-fade-in" style={{ width: '440px', backgroundColor: 'var(--surface-color)', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', padding: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Send size={20} color="var(--primary-color)" /> Create Purchase Request
            </h3>

            {/* Modal Error Alert Banner */}
            {orderModalError && (
              <div style={{
                backgroundColor: '#fef2f2',
                border: '1px solid #f87171',
                borderRadius: '10px',
                padding: '10px 14px',
                marginBottom: '16px',
                color: '#991b1b',
                fontSize: '13px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <AlertCircle size={18} color="#dc2626" style={{ flexShrink: 0 }} />
                <span>{orderModalError}</span>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label className="form-label" style={{ fontWeight: '600', fontSize: '13px' }}>Select Dealer / Supplier *</label>
                <select 
                  className="form-input"
                  style={{
                    height: '40px',
                    borderColor: orderFormSubmitted && !newOrder.dealerName ? '#ef4444' : 'var(--border-color)',
                    backgroundColor: orderFormSubmitted && !newOrder.dealerName ? '#fef2f2' : '#ffffff'
                  }}
                  value={newOrder.dealerName}
                  onChange={(e) => {
                    setNewOrder({...newOrder, dealerName: e.target.value});
                    if (orderModalError && e.target.value) setOrderModalError('');
                  }}
                >
                  <option value="">-- Choose Supplier --</option>
                  {dealers.map(d => (
                    <option key={d.id} value={d.name}>{d.name}</option>
                  ))}
                </select>
                {orderFormSubmitted && !newOrder.dealerName && (
                  <span style={{ fontSize: '11.5px', color: '#dc2626', fontWeight: '600', marginTop: '4px', display: 'block' }}>
                    ⚠️ Supplier selection is required.
                  </span>
                )}
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: '600', fontSize: '13px' }}>Medicine Name *</label>
                <input 
                  type="text"
                  className="form-input" 
                  placeholder="e.g. Paracetamol 650mg" 
                  style={{
                    height: '40px',
                    borderColor: orderFormSubmitted && !newOrder.medName.trim() ? '#ef4444' : 'var(--border-color)',
                    backgroundColor: orderFormSubmitted && !newOrder.medName.trim() ? '#fef2f2' : '#ffffff'
                  }}
                  value={newOrder.medName} 
                  onChange={(e) => {
                    setNewOrder({...newOrder, medName: e.target.value});
                    if (orderModalError && e.target.value.trim()) setOrderModalError('');
                  }} 
                />
                {orderFormSubmitted && !newOrder.medName.trim() && (
                  <span style={{ fontSize: '11.5px', color: '#dc2626', fontWeight: '600', marginTop: '4px', display: 'block' }}>
                    ⚠️ Medicine Name is required.
                  </span>
                )}
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: '600', fontSize: '13px' }}>Quantity (Strips) *</label>
                <input 
                  type="number" 
                  className="form-input" 
                  style={{
                    height: '40px',
                    borderColor: orderFormSubmitted && (!newOrder.qty || Number(newOrder.qty) <= 0) ? '#ef4444' : 'var(--border-color)',
                    backgroundColor: orderFormSubmitted && (!newOrder.qty || Number(newOrder.qty) <= 0) ? '#fef2f2' : '#ffffff'
                  }}
                  value={newOrder.qty} 
                  onChange={(e) => {
                    setNewOrder({...newOrder, qty: Number(e.target.value)});
                    if (orderModalError && Number(e.target.value) > 0) setOrderModalError('');
                  }} 
                />
                {orderFormSubmitted && (!newOrder.qty || Number(newOrder.qty) <= 0) && (
                  <span style={{ fontSize: '11.5px', color: '#dc2626', fontWeight: '600', marginTop: '4px', display: 'block' }}>
                    ⚠️ Valid Quantity is required.
                  </span>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
              <button className="btn btn-outline" onClick={() => setShowOrderModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSubmitOrder}>
                Submit Order Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NEW STOCK RETURN MODAL */}
      {showReturnModal && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="modal card animate-fade-in" style={{ width: '440px', backgroundColor: 'var(--surface-color)', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', padding: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Undo2 size={20} color="var(--warning-color)" /> Return Unsold / Expired Stock
            </h3>

            {/* Modal Error Alert Banner */}
            {returnModalError && (
              <div style={{
                backgroundColor: '#fef2f2',
                border: '1px solid #f87171',
                borderRadius: '10px',
                padding: '10px 14px',
                marginBottom: '16px',
                color: '#991b1b',
                fontSize: '13px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <AlertCircle size={18} color="#dc2626" style={{ flexShrink: 0 }} />
                <span>{returnModalError}</span>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label className="form-label" style={{ fontWeight: '600', fontSize: '13px' }}>Select Supplier / Dealer *</label>
                <select 
                  className="form-input"
                  style={{
                    height: '40px',
                    borderColor: returnFormSubmitted && !newReturn.dealerName ? '#ef4444' : 'var(--border-color)',
                    backgroundColor: returnFormSubmitted && !newReturn.dealerName ? '#fef2f2' : '#ffffff'
                  }}
                  value={newReturn.dealerName}
                  onChange={(e) => {
                    setNewReturn({...newReturn, dealerName: e.target.value});
                    if (returnModalError && e.target.value) setReturnModalError('');
                  }}
                >
                  <option value="">-- Choose Supplier --</option>
                  {dealers.map(d => (
                    <option key={d.id} value={d.name}>{d.name}</option>
                  ))}
                </select>
                {returnFormSubmitted && !newReturn.dealerName && (
                  <span style={{ fontSize: '11.5px', color: '#dc2626', fontWeight: '600', marginTop: '4px', display: 'block' }}>
                    ⚠️ Supplier selection is required.
                  </span>
                )}
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: '600', fontSize: '13px' }}>Select Medicine to Return *</label>
                <select 
                  className="form-input"
                  style={{
                    height: '40px',
                    borderColor: returnFormSubmitted && !newReturn.medId ? '#ef4444' : 'var(--border-color)',
                    backgroundColor: returnFormSubmitted && !newReturn.medId ? '#fef2f2' : '#ffffff'
                  }}
                  value={newReturn.medId}
                  onChange={(e) => {
                    setNewReturn({...newReturn, medId: Number(e.target.value)});
                    if (returnModalError && e.target.value) setReturnModalError('');
                  }}
                >
                  <option value="">-- Select Inventory Item --</option>
                  {inventory.map(item => (
                    <option key={item.id} value={item.id}>{item.name} (Stock: {item.totalTablets}) - Supplier: {item.dealer}</option>
                  ))}
                </select>
                {returnFormSubmitted && !newReturn.medId && (
                  <span style={{ fontSize: '11.5px', color: '#dc2626', fontWeight: '600', marginTop: '4px', display: 'block' }}>
                    ⚠️ Medicine selection is required.
                  </span>
                )}
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: '600', fontSize: '13px' }}>Quantity to Return (Strips) *</label>
                <input 
                  type="number" 
                  className="form-input" 
                  style={{
                    height: '40px',
                    borderColor: returnFormSubmitted && (!newReturn.qty || Number(newReturn.qty) <= 0) ? '#ef4444' : 'var(--border-color)',
                    backgroundColor: returnFormSubmitted && (!newReturn.qty || Number(newReturn.qty) <= 0) ? '#fef2f2' : '#ffffff'
                  }}
                  value={newReturn.qty} 
                  onChange={(e) => {
                    setNewReturn({...newReturn, qty: Number(e.target.value)});
                    if (returnModalError && Number(e.target.value) > 0) setReturnModalError('');
                  }} 
                />
                {returnFormSubmitted && (!newReturn.qty || Number(newReturn.qty) <= 0) && (
                  <span style={{ fontSize: '11.5px', color: '#dc2626', fontWeight: '600', marginTop: '4px', display: 'block' }}>
                    ⚠️ Valid Quantity is required.
                  </span>
                )}
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: '600', fontSize: '13px' }}>Reason for Return</label>
                <select 
                  className="form-input" 
                  style={{ height: '40px' }}
                  value={newReturn.reason} 
                  onChange={(e) => setNewReturn({...newReturn, reason: e.target.value})}
                >
                  <option value="Unsold / Slow Moving">Unsold / Slow Moving</option>
                  <option value="Near Expiry / Expired">Near Expiry / Expired</option>
                  <option value="Damaged Packaging">Damaged Packaging</option>
                  <option value="Excess Shipment">Excess Shipment</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
              <button className="btn btn-outline" onClick={() => setShowReturnModal(false)}>Cancel</button>
              <button 
                className="btn btn-primary" 
                style={{ backgroundColor: 'var(--warning-color)', borderColor: 'var(--warning-color)' }}
                onClick={handleSubmitReturn}
              >
                Confirm Return
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

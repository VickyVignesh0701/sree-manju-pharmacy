import { useState, useEffect } from 'react';
import { Building2, Phone, Mail, Search, Filter, Undo2, Send, CheckCircle, ClipboardList } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { apiGet } from '../services/api';

export default function Dealers() {
  const { 
    dealers, addDealer, inventory,
    dealersLoading, dealersError
  } = useAppContext();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('dealers'); // dealers, orders, returns
  const [showModal, setShowModal] = useState(false);
  const [modalError, setModalError] = useState('');
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [isSavingDealer, setIsSavingDealer] = useState(false);

  const [newDealer, setNewDealer] = useState({ name: '', contactPerson: '', phone: '', email: '', pendingOrders: 0 });

  // Real purchase orders across every dealer - creating and receiving them
  // happens on each dealer's own page, where medicines/batches for that
  // specific dealer are in context. This tab is the cross-dealer overview.
  const [purchases, setPurchases] = useState([]);
  const [purchasesLoading, setPurchasesLoading] = useState(false);
  const [purchasesError, setPurchasesError] = useState('');

  useEffect(() => {
    if (activeTab !== 'orders' || purchases.length > 0) return;
    setPurchasesLoading(true);
    setPurchasesError('');
    apiGet('dealers/purchases')
      .then(data => setPurchases(data.purchases || []))
      .catch(err => setPurchasesError(err.message || 'Could not load purchase orders.'))
      .finally(() => setPurchasesLoading(false));
  }, [activeTab]);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, pending, received

  const getDealerStats = (dealerId, defaultPending = 0) => {
    const dealerPOs = purchases.filter(p => p.dealer_id === dealerId);
    const pending = dealerPOs.filter(p => p.status === 'Ordered').length + (defaultPending || 0);
    const received = dealerPOs.filter(p => p.status === 'Received').length;
    return { pending, received };
  };

  const filteredDealers = dealers.filter(d => {
    const matchesSearch = d.name.toLowerCase().includes(search.toLowerCase()) || 
                          d.contactPerson.toLowerCase().includes(search.toLowerCase()) ||
                          d.phone.includes(search);
    
    const stats = getDealerStats(d.id, d.pendingOrders);
    let matchesStatus = true;

    if (statusFilter === 'pending') {
      matchesStatus = stats.pending > 0;
    } else if (statusFilter === 'received') {
      matchesStatus = stats.received > 0;
    }

    return matchesSearch && matchesStatus;
  });

  const handleOpenModal = () => {
    setModalError('');
    setFormSubmitted(false);
    setNewDealer({ name: '', contactPerson: '', phone: '', email: '', pendingOrders: 0 });
    setShowModal(true);
  };

  const handleAddDealer = async () => {
    setFormSubmitted(true);
    setModalError('');

    if (!newDealer.name || !newDealer.name.trim()) {
      setModalError('Company / Dealer Name is required.');
      return;
    }

    const cleanPhone = newDealer.phone.replace(/\D/g, '');
    if (!newDealer.phone || !newDealer.phone.trim() || cleanPhone.length !== 10) {
      setModalError('Valid 10-digit Phone Number is required.');
      return;
    }

    if (newDealer.email && newDealer.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newDealer.email.trim())) {
      setModalError('Valid Email Address format is required (e.g. sales@company.com).');
      return;
    }

    setIsSavingDealer(true);
    const result = await addDealer({
      ...newDealer,
      name: newDealer.name.trim(),
      contactPerson: newDealer.contactPerson ? newDealer.contactPerson.trim() : 'Sales Executive',
      phone: cleanPhone,
      email: newDealer.email ? newDealer.email.trim().toLowerCase() : 'N/A'
    });
    setIsSavingDealer(false);

    if (!result.success) {
      setModalError(result.error);
      return;
    }

    setShowModal(false);
    setFormSubmitted(false);
    setModalError('');
    setNewDealer({ name: '', contactPerson: '', phone: '', email: '', pendingOrders: 0 });
  };

  return (
    <div className="dealers">
      {dealersError && (
        <div className="card" style={{ marginBottom: '16px', backgroundColor: '#fef2f2', border: '1px solid #fca5a5', color: '#991b1b', fontSize: '13px', fontWeight: '600' }}>
          ⚠️ {dealersError}
        </div>
      )}
      {dealersLoading && dealers.length === 0 && (
        <div className="card" style={{ marginBottom: '16px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          Loading dealers…
        </div>
      )}
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
            <ClipboardList size={16} /> Purchase Orders
          </button>
          <button 
            className={`btn ${activeTab === 'returns' ? 'btn-primary' : 'btn-outline'}`}
            style={{ borderRadius: '20px', padding: '8px 20px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}
            onClick={() => setActiveTab('returns')}
          >
            <Undo2 size={16} /> Returns to Dealers
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
                </select>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '4px' }}>Purchase Orders — All Dealers</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              To create or receive a purchase order, open the specific dealer's page — batches and pricing are entered there, in context.
            </p>
          </div>
        )}

        {activeTab === 'returns' && (
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '4px' }}>Returns to Dealers</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Returns are processed from a specific dealer's page, since they need a real batch to return stock from.
            </p>
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

      {/* TAB 2: PURCHASE ORDERS (real data, cross-dealer) */}
      {activeTab === 'orders' && (
        <div className="card">
          {purchasesError && (
            <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fca5a5', color: '#991b1b', fontSize: '13px', fontWeight: '600', padding: '10px', borderRadius: '8px', marginBottom: '14px' }}>
              ⚠️ {purchasesError}
            </div>
          )}
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Order No.</th>
                  <th>Dealer</th>
                  <th>Ordered On</th>
                  <th>Status</th>
                  <th>Total Cost</th>
                  <th style={{ textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {purchasesLoading ? (
                  <tr><td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-secondary)' }}>Loading purchase orders…</td></tr>
                ) : purchases.length === 0 ? (
                  <tr><td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-secondary)' }}>No purchase orders recorded yet.</td></tr>
                ) : (
                  purchases.map(po => (
                    <tr key={po.id}>
                      <td style={{ fontWeight: '600' }}>{po.order_no}</td>
                      <td>{po.dealer_name}</td>
                      <td style={{ fontSize: '13px' }}>{new Date(po.ordered_at).toLocaleString()}</td>
                      <td>
                        <span className="badge" style={{
                          backgroundColor: po.status === 'Received' ? '#dcfce7' : po.status === 'Ordered' ? '#fef3c7' : po.status === 'Cancelled' ? '#fee2e2' : '#f1f5f9',
                          color: po.status === 'Received' ? '#15803d' : po.status === 'Ordered' ? '#b45309' : po.status === 'Cancelled' ? '#b91c1c' : '#475569',
                          fontWeight: '600'
                        }}>
                          {po.status}
                        </span>
                      </td>
                      <td>₹{Number(po.total_cost).toFixed(2)}</td>
                      <td style={{ textAlign: 'center' }}>
                        <button className="btn btn-outline" style={{ padding: '5px 12px', fontSize: '12px' }} onClick={() => navigate(`/dealers/${po.dealer_id}`)}>
                          {po.status === 'Ordered' ? 'Receive & Verify' : 'View Dealer'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: RETURNS TO DEALERS */}
      {activeTab === 'returns' && (
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <Undo2 size={40} style={{ opacity: 0.25, marginBottom: '12px' }} />
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', maxWidth: '420px', margin: '0 auto' }}>
            Returns are processed per dealer, since a return needs a real batch of stock to pull from. Open a dealer's page and use "Return Stock" there.
          </p>
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
              <button className="btn btn-outline" onClick={() => setShowModal(false)} disabled={isSavingDealer}>Cancel</button>
              <button className="btn btn-primary" onClick={handleAddDealer} disabled={isSavingDealer} style={{ opacity: isSavingDealer ? 0.7 : 1 }}>
                {isSavingDealer ? 'Saving…' : 'Save Dealer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

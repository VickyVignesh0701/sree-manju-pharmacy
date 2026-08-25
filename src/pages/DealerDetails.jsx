import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { ArrowLeft, Building2, Phone, Mail, PackageSearch, Send, Undo2 } from 'lucide-react';

export default function DealerDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { dealers, inventory, getUnitName, getPackName, requestMedicine, returnStockToDealer } = useAppContext();

  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [selectedMed, setSelectedMed] = useState(null);
  
  const [orderData, setOrderData] = useState({ medName: '', qty: 50 });
  const [returnData, setReturnData] = useState({ qty: 10, reason: 'Unsold / Slow Moving' });

  const dealer = dealers.find(d => d.id.toString() === id);

  if (!dealer) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <h2>Dealer not found!</h2>
        <button className="btn btn-primary" onClick={() => navigate('/dealers')} style={{ marginTop: '16px' }}>Go Back</button>
      </div>
    );
  }

  const dealerMedicines = inventory.filter(item => 
    item.dealer.toLowerCase().includes(dealer.name.toLowerCase()) || 
    dealer.name.toLowerCase().includes(item.dealer.toLowerCase())
  );

  return (
    <div className="dealer-details">
      <button className="btn btn-outline" style={{ marginBottom: '24px' }} onClick={() => navigate('/dealers')}>
        <ArrowLeft size={18} /> Back to Dealers
      </button>

      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '20px' }}>
          <div style={{ width: '60px', height: '60px', borderRadius: '12px', backgroundColor: 'var(--primary-color)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Building2 size={32} />
          </div>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '4px' }}>{dealer.name}</h1>
            <div style={{ color: 'var(--text-secondary)', fontSize: '14px', display: 'flex', gap: '12px', alignItems: 'center' }}>
              <span>{dealer.contactPerson}</span>
            </div>
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <button className="btn btn-primary" onClick={() => setShowOrderModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Send size={16} /> Request / Order Stock
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3" style={{ gap: '24px' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <Phone size={20} color="var(--primary-color)" style={{ marginTop: '2px' }} />
            <div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Phone Number</div>
              <div style={{ fontSize: '16px', fontWeight: '600' }}>{dealer.phone}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <Mail size={20} color="var(--primary-color)" style={{ marginTop: '2px' }} />
            <div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Email Address</div>
              <div style={{ fontSize: '16px', fontWeight: '600' }}>{dealer.email}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <PackageSearch size={20} color="var(--warning-color)" style={{ marginTop: '2px' }} />
            <div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Pending Orders</div>
              <div style={{ fontSize: '16px', fontWeight: '600' }} className={dealer.pendingOrders > 0 ? 'text-warning' : 'text-success'}>
                {dealer.pendingOrders} Active
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          Medicines Purchased from {dealer.name}
        </h2>

        <div className="table-container" style={{ overflowY: 'auto', maxHeight: '500px' }}>
          <table className="table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Medicine Name</th>
                <th>Category</th>
                <th>Boxes</th>
                <th>Packs / Strips</th>
                <th>Total Units Bought</th>
                <th>Avg. Price</th>
                <th style={{ textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {dealerMedicines.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                    No medicines recorded from this dealer.
                  </td>
                </tr>
              ) : (
                dealerMedicines.map(item => {
                  const totalPurchased = item.totalPurchasedTablets || item.totalTablets;
                  const packs = Math.floor(totalPurchased / item.tabletsPerStrip);
                  const boxes = Math.floor(packs / 10);
                  return (
                    <tr key={item.id}>
                      <td>
                        <div style={{ fontWeight: '500' }}>{item.name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{item.tabletsPerStrip} {getUnitName(item.formulation)}s/{getPackName(item.formulation)}</div>
                      </td>
                      <td><span className="badge badge-success">{item.category}</span></td>
                      <td>{boxes} <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>boxes</span></td>
                      <td>{packs} <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{getPackName(item.formulation)}s</span></td>
                      <td>
                        <div style={{ fontWeight: '600' }}>{totalPurchased}</div> <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{getUnitName(item.formulation)}s</span>
                      </td>
                      <td>{item.averagePrice ? `₹${item.averagePrice.toFixed(2)}` : '-'}</td>
                      <td style={{ textAlign: 'center' }}>
                        <button 
                          className="btn btn-outline" 
                          style={{ padding: '4px 8px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--warning-color)', border: '1px solid var(--warning-color)' }}
                          onClick={() => {
                            setSelectedMed(item);
                            setShowReturnModal(true);
                          }}
                        >
                          <Undo2 size={14} /> Return to Dealer
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order / Request Medicine Modal */}
      {showOrderModal && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="modal card" style={{ width: '420px', backgroundColor: 'var(--surface-color)' }}>
            <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Send size={18} color="var(--primary-color)" /> Order / Request Medicine
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label className="form-label">Medicine Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Amoxicillin 500mg"
                  value={orderData.medName} 
                  onChange={(e) => setOrderData({...orderData, medName: e.target.value})} 
                />
              </div>
              <div>
                <label className="form-label">Quantity to Order (Units/Strips)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  value={orderData.qty} 
                  onChange={(e) => setOrderData({...orderData, qty: Number(e.target.value)})} 
                />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
              <button className="btn btn-outline" onClick={() => setShowOrderModal(false)}>Cancel</button>
              <button 
                className="btn btn-primary" 
                onClick={() => {
                  if (!orderData.medName) {
                    alert('Please enter medicine name');
                    return;
                  }
                  requestMedicine(dealer.name, orderData.medName, orderData.qty);
                  setShowOrderModal(false);
                  setOrderData({ medName: '', qty: 50 });
                }}
              >
                Send Request Email
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Return Stock to Dealer Modal */}
      {showReturnModal && selectedMed && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="modal card" style={{ width: '420px', backgroundColor: 'var(--surface-color)' }}>
            <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Undo2 size={18} color="var(--warning-color)" /> Return Stock to {dealer.name}
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Item: <strong>{selectedMed.name}</strong> (Available Stock: {selectedMed.totalTablets} {getUnitName(selectedMed.formulation)}s)
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label className="form-label">Quantity to Return</label>
                <input 
                  type="number" 
                  className="form-input" 
                  max={selectedMed.totalTablets}
                  value={returnData.qty} 
                  onChange={(e) => setReturnData({...returnData, qty: Number(e.target.value)})} 
                />
              </div>
              <div>
                <label className="form-label">Reason for Return</label>
                <select 
                  className="form-input" 
                  value={returnData.reason} 
                  onChange={(e) => setReturnData({...returnData, reason: e.target.value})}
                >
                  <option value="Unsold / Slow Moving">Unsold / Slow Moving</option>
                  <option value="Near Expiry / Expired">Near Expiry / Expired</option>
                  <option value="Damaged Packaging">Damaged Packaging</option>
                  <option value="Excess Shipment">Excess Shipment</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
              <button className="btn btn-outline" onClick={() => setShowReturnModal(false)}>Cancel</button>
              <button 
                className="btn btn-primary" 
                style={{ backgroundColor: 'var(--warning-color)', borderColor: 'var(--warning-color)' }}
                onClick={() => {
                  returnStockToDealer(selectedMed.id, returnData.qty, returnData.reason, dealer.name);
                  setShowReturnModal(false);
                  setSelectedMed(null);
                }}
              >
                Confirm Return to Dealer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

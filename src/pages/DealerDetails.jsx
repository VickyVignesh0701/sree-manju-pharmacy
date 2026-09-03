import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { apiGet, apiPost } from '../services/api';
import { ArrowLeft, Building2, Phone, Mail, PackageSearch, Send, Undo2, Plus, Trash2, ClipboardCheck, X, CheckCircle2 } from 'lucide-react';

const REJECTION_REASONS = ['Wrong Product', 'Damaged', 'Shortage', 'Extra Item', 'Other'];

export default function DealerDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { dealers, inventory, getUnitName, getPackName } = useAppContext();

  const dealer = dealers.find(d => d.id.toString() === id);

  const [purchases, setPurchases] = useState([]);
  const [purchasesLoading, setPurchasesLoading] = useState(true);
  const [purchasesError, setPurchasesError] = useState('');

  const loadPurchases = async () => {
    setPurchasesLoading(true);
    setPurchasesError('');
    try {
      const data = await apiGet('dealers/purchases');
      setPurchases((data.purchases || []).filter(p => dealer && p.dealer_id === dealer.id));
    } catch (err) {
      setPurchasesError(err.message || 'Could not load purchase orders.');
    } finally {
      setPurchasesLoading(false);
    }
  };

  useEffect(() => { if (dealer) loadPurchases(); }, [dealer?.id]);

  // New Purchase Order modal
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderItems, setOrderItems] = useState([{ medicine_id: '', quantity: 1, unit_label: 'strip', batch_number: '', expiry_date: '', purchase_price: '' }]);
  const [orderError, setOrderError] = useState('');
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);

  // Receive / Verify modal
  const [verifyOrder, setVerifyOrder] = useState(null);
  const [verifyItems, setVerifyItems] = useState([]);
  const [verifyError, setVerifyError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  // Return-to-dealer modal
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnMedId, setReturnMedId] = useState('');
  const [returnBatches, setReturnBatches] = useState([]);
  const [returnBatchNumber, setReturnBatchNumber] = useState('');
  const [returnQty, setReturnQty] = useState(1);
  const [returnReason, setReturnReason] = useState('Unsold / Slow Moving');
  const [returnError, setReturnError] = useState('');
  const [isReturning, setIsReturning] = useState(false);

  if (!dealer) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <h2>Dealer not found!</h2>
        <button className="btn btn-primary" onClick={() => navigate('/dealers')} style={{ marginTop: '16px' }}>Go Back</button>
      </div>
    );
  }

  const dealerMedicines = inventory.filter(item => item.dealerId === dealer.id);

  // --- New Purchase Order ---
  const updateOrderItem = (idx, field, value) => {
    setOrderItems(prev => prev.map((it, i) => i === idx ? { ...it, [field]: value } : it));
  };
  const addOrderRow = () => setOrderItems(prev => [...prev, { medicine_id: '', quantity: 1, unit_label: 'strip', batch_number: '', expiry_date: '', purchase_price: '' }]);
  const removeOrderRow = (idx) => setOrderItems(prev => prev.filter((_, i) => i !== idx));

  const handleCreateOrder = async () => {
    setOrderError('');
    for (const item of orderItems) {
      if (!item.medicine_id || !item.quantity || !item.batch_number.trim() || !item.expiry_date || !item.purchase_price) {
        setOrderError('Every line needs a medicine, quantity, batch number, expiry date, and purchase price.');
        return;
      }
    }
    setIsCreatingOrder(true);
    try {
      await apiPost('dealers/purchases', {
        dealer_id: dealer.id,
        items: orderItems.map(it => ({
          medicine_id: Number(it.medicine_id),
          quantity: Number(it.quantity),
          unit_label: it.unit_label,
          batch_number: it.batch_number.trim(),
          expiry_date: it.expiry_date,
          purchase_price: Number(it.purchase_price)
        }))
      });
      setShowOrderModal(false);
      setOrderItems([{ medicine_id: '', quantity: 1, unit_label: 'strip', batch_number: '', expiry_date: '', purchase_price: '' }]);
      await loadPurchases();
    } catch (err) {
      setOrderError(err.message || 'Could not create this purchase order.');
    } finally {
      setIsCreatingOrder(false);
    }
  };

  // --- Receive / Verify ---
  const openVerifyModal = async (order) => {
    setVerifyError('');
    try {
      const data = await apiGet(`dealers/purchases/${order.id}`);
      const items = data.purchase.items || [];
      setVerifyItems(items.map(it => ({
        purchase_item_id: it.id,
        medicine_id: it.medicine_id,
        medicine_name: it.medicine_name,
        ordered_quantity: Number(it.quantity),
        unit_label: it.unit_label,
        received_quantity: Number(it.quantity),
        accepted_quantity: Number(it.quantity),
        batch_number: it.batch_number,
        expiry_date: it.expiry_date,
        purchase_price: it.purchase_price,
        rejection_reason: ''
      })));
      setVerifyOrder(data.purchase);
    } catch (err) {
      setPurchasesError(err.message || 'Could not load this purchase order.');
    }
  };

  const updateVerifyItem = (idx, field, value) => {
    setVerifyItems(prev => prev.map((it, i) => {
      if (i !== idx) return it;
      const updated = { ...it, [field]: value };
      // Keep accepted in sync by default when received changes, so the
      // common "everything arrived fine" case needs no extra clicks.
      if (field === 'received_quantity') updated.accepted_quantity = Math.min(Number(value) || 0, it.ordered_quantity);
      return updated;
    }));
  };

  const handleSubmitVerification = async () => {
    setVerifyError('');
    const payloadItems = [];
    for (const it of verifyItems) {
      const received = Number(it.received_quantity) || 0;
      const accepted = Number(it.accepted_quantity) || 0;
      const rejected = received - accepted;
      if (received <= 0) {
        setVerifyError(`Enter a received quantity for ${it.medicine_name}.`);
        return;
      }
      if (accepted > received || accepted < 0) {
        setVerifyError(`Accepted quantity for ${it.medicine_name} must be between 0 and the received quantity.`);
        return;
      }
      if (rejected > 0 && !it.rejection_reason) {
        setVerifyError(`Select a rejection reason for ${it.medicine_name} (${rejected} unit(s) not accepted).`);
        return;
      }
      if (accepted > 0 && (!it.batch_number || !it.expiry_date)) {
        setVerifyError(`Batch number and expiry date are required for accepted stock (${it.medicine_name}).`);
        return;
      }
      payloadItems.push({
        purchase_item_id: it.purchase_item_id,
        medicine_id: it.medicine_id,
        received_quantity: received,
        accepted_quantity: accepted,
        rejected_quantity: rejected,
        unit_label: it.unit_label,
        batch_number: it.batch_number,
        expiry_date: it.expiry_date,
        purchase_price: Number(it.purchase_price) || 0,
        rejection_reason: rejected > 0 ? it.rejection_reason : undefined
      });
    }

    setIsVerifying(true);
    try {
      await apiPost('purchase-verification', { purchase_order_id: verifyOrder.id, items: payloadItems });
      setVerifyOrder(null);
      await loadPurchases();
    } catch (err) {
      setVerifyError(err.message || 'Could not process this receipt.');
    } finally {
      setIsVerifying(false);
    }
  };

  // --- Return to dealer ---
  const openReturnModal = () => {
    setReturnError('');
    setReturnMedId('');
    setReturnBatches([]);
    setReturnBatchNumber('');
    setShowReturnModal(true);
  };

  const handlePickReturnMedicine = async (medId) => {
    setReturnMedId(medId);
    setReturnBatches([]);
    setReturnBatchNumber('');
    if (!medId) return;
    try {
      const data = await apiGet(`batches/${medId}`);
      setReturnBatches(data.batches || []);
      if ((data.batches || []).length > 0) setReturnBatchNumber(data.batches[0].batch_number);
    } catch (err) {
      setReturnError(err.message || 'Could not load batches for this medicine.');
    }
  };

  const handleConfirmReturn = async () => {
    setReturnError('');
    if (!returnMedId || !returnBatchNumber) {
      setReturnError('Select a medicine and a batch to return.');
      return;
    }
    if (returnQty < 1) {
      setReturnError('Return quantity must be at least 1.');
      return;
    }
    setIsReturning(true);
    try {
      await apiPost('stock/dealer-return', {
        medicine_id: Number(returnMedId),
        quantity: Number(returnQty),
        batch_number: returnBatchNumber,
        reason: returnReason
      });
      setShowReturnModal(false);
    } catch (err) {
      setReturnError(err.message || 'Could not process this return - it may exceed what is available in the selected batch.');
    } finally {
      setIsReturning(false);
    }
  };

  const statusBadge = (status) => {
    const map = {
      Draft: { bg: '#f1f5f9', color: '#475569' },
      Ordered: { bg: '#fef3c7', color: '#b45309' },
      Received: { bg: '#dcfce7', color: '#15803d' },
      Cancelled: { bg: '#fee2e2', color: '#b91c1c' },
      'Partially Accepted': { bg: '#fef3c7', color: '#b45309' },
    };
    const s = map[status] || map.Draft;
    return <span className="badge" style={{ backgroundColor: s.bg, color: s.color, fontWeight: '600' }}>{status}</span>;
  };

  return (
    <div className="dealer-details">
      <button className="btn btn-outline" style={{ marginBottom: '24px' }} onClick={() => navigate('/dealers')}>
        <ArrowLeft size={18} /> Back to Dealers
      </button>

      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '20px', flexWrap: 'wrap' }}>
          <div style={{ width: '60px', height: '60px', borderRadius: '12px', backgroundColor: 'var(--primary-color)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Building2 size={32} />
          </div>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '4px' }}>{dealer.name}</h1>
            <div style={{ color: 'var(--text-secondary)', fontSize: '14px', display: 'flex', gap: '12px', alignItems: 'center' }}>
              <span>{dealer.contactPerson}</span>
            </div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px' }}>
            <button className="btn btn-outline" onClick={openReturnModal} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--warning-color)', borderColor: 'var(--warning-color)' }}>
              <Undo2 size={16} /> Return Stock
            </button>
            <button className="btn btn-primary" onClick={() => setShowOrderModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Send size={16} /> New Purchase Order
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
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Purchase Orders</div>
              <div style={{ fontSize: '16px', fontWeight: '600' }}>{purchases.length} total</div>
            </div>
          </div>
        </div>
      </div>

      {/* Purchase Orders */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>Purchase Orders</h2>
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
                <th>Ordered On</th>
                <th>Status</th>
                <th>Total Cost</th>
                <th style={{ textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {purchasesLoading ? (
                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-secondary)' }}>Loading purchase orders…</td></tr>
              ) : purchases.length === 0 ? (
                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-secondary)' }}>No purchase orders yet for this dealer.</td></tr>
              ) : (
                purchases.map(po => (
                  <tr key={po.id}>
                    <td style={{ fontWeight: '600' }}>{po.order_no}</td>
                    <td style={{ fontSize: '13px' }}>{new Date(po.ordered_at).toLocaleString()}</td>
                    <td>{statusBadge(po.status)}</td>
                    <td>₹{Number(po.total_cost).toFixed(2)}</td>
                    <td style={{ textAlign: 'center' }}>
                      {po.status === 'Ordered' ? (
                        <button className="btn btn-primary" style={{ padding: '5px 12px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '5px' }} onClick={() => openVerifyModal(po)}>
                          <ClipboardCheck size={13} /> Receive & Verify
                        </button>
                      ) : (
                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>
          Medicines Purchased from {dealer.name}
        </h2>

        <div className="table-container" style={{ overflowY: 'auto', maxHeight: '500px' }}>
          <table className="table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Medicine Name</th>
                <th>Category</th>
                <th>Current Stock</th>
              </tr>
            </thead>
            <tbody>
              {dealerMedicines.length === 0 ? (
                <tr>
                  <td colSpan="3" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                    No medicines currently linked to this dealer.
                  </td>
                </tr>
              ) : (
                dealerMedicines.map(item => (
                  <tr key={item.id}>
                    <td>
                      <div style={{ fontWeight: '500' }}>{item.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{item.tabletsPerStrip} {getUnitName(item.formulation)}s/{getPackName(item.formulation)}</div>
                    </td>
                    <td><span className="badge badge-success">{item.category}</span></td>
                    <td><div style={{ fontWeight: '600' }}>{item.totalTablets} {getUnitName(item.formulation)}s</div></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Purchase Order Modal */}
      {showOrderModal && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="modal card" style={{ width: '760px', maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto', backgroundColor: 'var(--surface-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                <Send size={18} color="var(--primary-color)" /> New Purchase Order — {dealer.name}
              </h3>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setShowOrderModal(false)}><X size={20} /></button>
            </div>

            {orderError && (
              <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fca5a5', color: '#991b1b', fontSize: '13px', fontWeight: '600', padding: '10px', borderRadius: '8px', marginBottom: '14px' }}>
                ⚠️ {orderError}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {orderItems.map((item, idx) => (
                <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr auto', gap: '8px', alignItems: 'center', padding: '10px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
                  <select className="form-input" value={item.medicine_id} onChange={(e) => updateOrderItem(idx, 'medicine_id', e.target.value)}>
                    <option value="">Select medicine…</option>
                    {inventory.map(med => <option key={med.id} value={med.id}>{med.name}</option>)}
                  </select>
                  <input type="number" min="1" className="form-input" placeholder="Qty" value={item.quantity} onChange={(e) => updateOrderItem(idx, 'quantity', e.target.value)} />
                  <select className="form-input" value={item.unit_label} onChange={(e) => updateOrderItem(idx, 'unit_label', e.target.value)}>
                    <option value="strip">Strip</option>
                    <option value="bottle">Bottle</option>
                    <option value="vial">Vial</option>
                    <option value="tube">Tube</option>
                    <option value="sachet">Sachet</option>
                    <option value="box">Box</option>
                  </select>
                  <input type="text" className="form-input" placeholder="Batch #" value={item.batch_number} onChange={(e) => updateOrderItem(idx, 'batch_number', e.target.value)} />
                  <input type="date" className="form-input" value={item.expiry_date} onChange={(e) => updateOrderItem(idx, 'expiry_date', e.target.value)} />
                  <input type="number" min="0" step="0.01" className="form-input" placeholder="₹ Price" value={item.purchase_price} onChange={(e) => updateOrderItem(idx, 'purchase_price', e.target.value)} />
                  <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger-color)' }} onClick={() => removeOrderRow(idx)} disabled={orderItems.length === 1}>
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>

            <button className="btn btn-outline" style={{ marginTop: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }} onClick={addOrderRow}>
              <Plus size={14} /> Add Another Medicine
            </button>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
              <button className="btn btn-outline" onClick={() => setShowOrderModal(false)} disabled={isCreatingOrder}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCreateOrder} disabled={isCreatingOrder} style={{ opacity: isCreatingOrder ? 0.7 : 1 }}>
                {isCreatingOrder ? 'Creating…' : 'Create Purchase Order'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receive & Verify Modal */}
      {verifyOrder && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="modal card" style={{ width: '840px', maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto', backgroundColor: 'var(--surface-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                <ClipboardCheck size={18} color="var(--primary-color)" /> Receive & Verify — {verifyOrder.order_no}
              </h3>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setVerifyOrder(null)}><X size={20} /></button>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
              Confirm what actually arrived. Anything not accepted needs a reason — it's excluded from stock and the order stays open on those units.
            </p>

            {verifyError && (
              <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fca5a5', color: '#991b1b', fontSize: '13px', fontWeight: '600', padding: '10px', borderRadius: '8px', marginBottom: '14px' }}>
                ⚠️ {verifyError}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {verifyItems.map((item, idx) => {
                const rejected = (Number(item.received_quantity) || 0) - (Number(item.accepted_quantity) || 0);
                return (
                  <div key={idx} style={{ border: '1px solid var(--border-color)', borderRadius: '10px', padding: '14px' }}>
                    <div style={{ fontWeight: '600', marginBottom: '10px' }}>
                      {item.medicine_name} <span style={{ fontWeight: '400', color: 'var(--text-secondary)', fontSize: '12px' }}>(Ordered: {item.ordered_quantity} {item.unit_label}s)</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '10px' }}>
                      <div>
                        <label className="form-label" style={{ fontSize: '11px' }}>Received Qty</label>
                        <input type="number" min="0" className="form-input" value={item.received_quantity} onChange={(e) => updateVerifyItem(idx, 'received_quantity', e.target.value)} />
                      </div>
                      <div>
                        <label className="form-label" style={{ fontSize: '11px' }}>Accepted Qty</label>
                        <input type="number" min="0" className="form-input" value={item.accepted_quantity} onChange={(e) => updateVerifyItem(idx, 'accepted_quantity', e.target.value)} />
                      </div>
                      <div>
                        <label className="form-label" style={{ fontSize: '11px' }}>Batch Number</label>
                        <input type="text" className="form-input" value={item.batch_number} onChange={(e) => updateVerifyItem(idx, 'batch_number', e.target.value)} />
                      </div>
                      <div>
                        <label className="form-label" style={{ fontSize: '11px' }}>Expiry Date</label>
                        <input type="date" className="form-input" value={item.expiry_date} onChange={(e) => updateVerifyItem(idx, 'expiry_date', e.target.value)} />
                      </div>
                    </div>
                    {rejected > 0 && (
                      <div>
                        <label className="form-label" style={{ fontSize: '11px', color: 'var(--danger-color)' }}>
                          {rejected} unit(s) not accepted — reason required
                        </label>
                        <select className="form-input" value={item.rejection_reason} onChange={(e) => updateVerifyItem(idx, 'rejection_reason', e.target.value)}>
                          <option value="">Select reason…</option>
                          {REJECTION_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
              <button className="btn btn-outline" onClick={() => setVerifyOrder(null)} disabled={isVerifying}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSubmitVerification} disabled={isVerifying} style={{ opacity: isVerifying ? 0.7 : 1, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle2 size={16} /> {isVerifying ? 'Submitting…' : 'Confirm Receipt'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Return Stock to Dealer Modal */}
      {showReturnModal && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="modal card" style={{ width: '440px', backgroundColor: 'var(--surface-color)' }}>
            <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Undo2 size={18} color="var(--warning-color)" /> Return Stock to {dealer.name}
            </h3>

            {returnError && (
              <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fca5a5', color: '#991b1b', fontSize: '13px', fontWeight: '600', padding: '10px', borderRadius: '8px', marginBottom: '14px' }}>
                ⚠️ {returnError}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label className="form-label">Medicine</label>
                <select className="form-input" value={returnMedId} onChange={(e) => handlePickReturnMedicine(e.target.value)}>
                  <option value="">Select medicine…</option>
                  {dealerMedicines.map(med => <option key={med.id} value={med.id}>{med.name}</option>)}
                </select>
              </div>
              {returnMedId && (
                <div>
                  <label className="form-label">Batch to Return</label>
                  <select className="form-input" value={returnBatchNumber} onChange={(e) => setReturnBatchNumber(e.target.value)}>
                    {returnBatches.length === 0 ? (
                      <option value="">No available batches</option>
                    ) : returnBatches.map(b => (
                      <option key={b.batch_number} value={b.batch_number}>
                        {b.batch_number} — {b.quantity} in stock, expires {b.expiry_date}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="form-label">Quantity to Return</label>
                <input type="number" min="1" className="form-input" value={returnQty} onChange={(e) => setReturnQty(Math.max(1, Number(e.target.value) || 1))} />
              </div>
              <div>
                <label className="form-label">Reason for Return</label>
                <select className="form-input" value={returnReason} onChange={(e) => setReturnReason(e.target.value)}>
                  <option value="Unsold / Slow Moving">Unsold / Slow Moving</option>
                  <option value="Near Expiry / Expired">Near Expiry / Expired</option>
                  <option value="Damaged Packaging">Damaged Packaging</option>
                  <option value="Excess Shipment">Excess Shipment</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
              <button className="btn btn-outline" onClick={() => setShowReturnModal(false)} disabled={isReturning}>Cancel</button>
              <button
                className="btn btn-primary"
                style={{ backgroundColor: 'var(--warning-color)', borderColor: 'var(--warning-color)', opacity: isReturning ? 0.7 : 1 }}
                onClick={handleConfirmReturn}
                disabled={isReturning}
              >
                {isReturning ? 'Processing…' : 'Confirm Return to Dealer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

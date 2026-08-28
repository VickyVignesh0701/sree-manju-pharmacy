import { useEffect, useMemo, useState } from 'react';
import { Clock3, CreditCard, Minus, Plus, Trash2, RotateCcw, ShoppingCart } from 'lucide-react';
import { getPendingBills, cancelPendingBill, subscribePendingBills, updatePendingBill } from '../utils/pendingBillsStore';
import { useNavigate } from 'react-router-dom';

export default function CartList() {
  const navigate = useNavigate();
  const [bills, setBills] = useState(() => getPendingBills());

  useEffect(() => subscribePendingBills(setBills), []);

  const pendingTotal = useMemo(
    () => bills.reduce((sum, bill) => sum + Number(bill.total || 0), 0),
    [bills]
  );

  const changeQuantity = (bill, itemId, delta) => {
    const cart = bill.cart.map((item) => {
      if (item.id !== itemId) return item;
      return { ...item, quantity: Math.max(1, Number(item.quantity || 0) + delta) };
    });
    const total = cart.reduce((sum, item) => {
      const qty = Number(item.quantity || 0);
      const unitPrice = Number(item.pricePerStrip || item.price || item.sellingPrice || 0);
      return sum + qty * unitPrice;
    }, 0);
    updatePendingBill(bill.id, { cart, total });
  };

  const removeItem = (bill, itemId) => {
    const cart = bill.cart.filter((item) => item.id !== itemId);
    if (!cart.length) {
      cancelPendingBill(bill.id);
      return;
    }
    const total = cart.reduce((sum, item) => {
      const qty = Number(item.quantity || 0);
      const unitPrice = Number(item.pricePerStrip || item.price || item.sellingPrice || 0);
      return sum + qty * unitPrice;
    }, 0);
    updatePendingBill(bill.id, { cart, total });
  };

  return (
    <div className="animate-fade-in" style={{ display: 'grid', gap: 16 }}>
      <div className="card" style={{ padding: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}><ShoppingCart size={21} /> Cart List</h2>
            <div style={{ marginTop: 5, color: 'var(--text-secondary)', fontSize: 13 }}>
              Bills prepared for customers who have not paid yet.
            </div>
          </div>
          <div className="badge badge-warning" style={{ fontSize: 13, padding: '7px 10px' }}>
            {bills.length} pending • ₹{pendingTotal.toFixed(2)}
          </div>
        </div>
      </div>

      {bills.length === 0 ? (
        <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>
          <ShoppingCart size={42} style={{ opacity: 0.25 }} />
          <h3 style={{ color: 'var(--text-primary)', margin: '10px 0 5px' }}>No Pending Bills</h3>
          <div style={{ fontSize: 13 }}>Saved customer bills will appear here.</div>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => navigate('/billing')}>
            Create New Bill
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {bills.map((bill) => (
            <div key={bill.id} className="card" style={{ padding: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                <div>
                  <strong>{bill.billNumber}</strong>
                  <div style={{ fontSize: 13, marginTop: 3 }}>
                    {bill.patient?.name || 'Walk-in Customer'} {bill.patient?.phone ? `• ${bill.patient.phone}` : ''}
                  </div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: 11, marginTop: 4 }}>
                    <Clock3 size={11} style={{ verticalAlign: 'middle' }} /> {new Date(bill.updatedAt || bill.createdAt).toLocaleString()}
                  </div>
                </div>
                <strong style={{ fontSize: 18 }}>₹{Number(bill.total || 0).toFixed(2)}</strong>
              </div>

              <div style={{ display: 'grid', gap: 8, marginTop: 12 }}>
                {bill.cart.map((item) => (
                  <div key={item.id} style={{ border: '1px solid var(--border-color)', borderRadius: 9, padding: 9, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <strong style={{ fontSize: 13 }}>{item.name}</strong>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{item.unitType || 'strip'}</div>
                    </div>
                    <button className="btn btn-outline" aria-label="Decrease quantity" style={{ minWidth: 36, minHeight: 36, padding: 5 }} onClick={() => changeQuantity(bill, item.id, -1)}><Minus size={14} /></button>
                    <strong style={{ minWidth: 22, textAlign: 'center' }}>{item.quantity}</strong>
                    <button className="btn btn-outline" aria-label="Increase quantity" style={{ minWidth: 36, minHeight: 36, padding: 5 }} onClick={() => changeQuantity(bill, item.id, 1)}><Plus size={14} /></button>
                    <button className="btn btn-outline" aria-label="Remove medicine" style={{ minWidth: 36, minHeight: 36, padding: 5, color: 'var(--danger-color)' }} onClick={() => removeItem(bill, item.id)}><Trash2 size={14} /></button>
                  </div>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginTop: 12 }}>
                <button className="btn btn-outline" onClick={() => navigate('/billing', { state: { resumePendingBill: bill } })}><RotateCcw size={15} /> Resume</button>
                <button className="btn btn-primary" onClick={() => navigate('/billing', { state: { resumePendingBill: bill, autoPay: true } })}><CreditCard size={15} /> Pay Now</button>
                <button className="btn btn-outline" style={{ color: 'var(--danger-color)' }} onClick={() => cancelPendingBill(bill.id)}><Trash2 size={15} /> Cancel</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

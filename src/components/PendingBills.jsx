import React from 'react';
import { Clock, CreditCard, Trash2, ShoppingCart } from 'lucide-react';

/**
 * PendingBills keeps prepared bills separate from the active checkout.
 * The parent owns persistence and payment so desktop and Android can use
 * the same server-backed workflow.
 */
export default function PendingBills({ bills = [], onResume, onPay, onCancel }) {
  if (!bills.length) {
    return (
      <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-secondary)' }}>
        <ShoppingCart size={36} style={{ opacity: 0.25, marginBottom: 8 }} />
        <div style={{ fontWeight: 600 }}>No pending bills</div>
        <div style={{ fontSize: 12, marginTop: 4 }}>Saved bills waiting for payment will appear here.</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: 10 }}>
      {bills.map((bill) => (
        <div key={bill.id} style={{ border: '1px solid var(--border-color)', borderRadius: 10, padding: 12, background: '#fff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{bill.billNumber || `Pending #${bill.id}`}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 3 }}>
                {bill.patient?.name || bill.customerName || 'Walk-in Customer'}
              </div>
            </div>
            <span className="badge badge-warning" style={{ height: 'fit-content' }}>PENDING</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontSize: 12 }}>
            <span><Clock size={12} style={{ verticalAlign: 'middle' }} /> {bill.createdAt ? new Date(bill.createdAt).toLocaleString() : 'Saved bill'}</span>
            <strong>₹{Number(bill.total || 0).toFixed(2)}</strong>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginTop: 10 }}>
            <button className="btn btn-outline" type="button" onClick={() => onResume?.(bill)}>Resume</button>
            <button className="btn btn-primary" type="button" onClick={() => onPay?.(bill)}><CreditCard size={14} /> Pay Now</button>
            <button className="btn btn-outline" type="button" onClick={() => onCancel?.(bill)} style={{ color: 'var(--danger-color)' }}><Trash2 size={14} /> Cancel</button>
          </div>
        </div>
      ))}
    </div>
  );
}

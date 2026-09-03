import React from 'react';
import { ShoppingCart, Clock3, Plus, Minus, Trash2, X } from 'lucide-react';

/**
 * BillingSideMenu is a reusable navigation/cart drawer for desktop and Android.
 * The parent owns the cart state so the same component can later be wired to
 * the server-backed checkout and pending-bill workflow.
 */
export default function BillingSideMenu({
  cart = [],
  pendingCount = 0,
  activeView = 'billing',
  onViewChange,
  onIncrease,
  onDecrease,
  onRemove,
  onAddMore,
  onPayBill,
  onClose,
  open = true,
}) {
  if (!open) return null;

  const itemCount = cart.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  const total = cart.reduce(
    (sum, item) => sum + Number(item.quantity || 0) * Number(item.price || item.sellingPrice || 0),
    0
  );

  return (
    <aside
      aria-label="Billing menu"
      style={{
        width: 'min(360px, 92vw)',
        maxWidth: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--card-background, #fff)',
        borderRight: '1px solid var(--border-color, #e5e7eb)',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderBottom: '1px solid var(--border-color, #e5e7eb)' }}>
        <strong>Billing</strong>
        {onClose && <button type="button" className="btn btn-outline" aria-label="Close billing menu" onClick={onClose}><X size={18} /></button>}
      </div>

      <nav style={{ padding: 10, display: 'grid', gap: 6 }}>
        <button type="button" className={activeView === 'billing' ? 'btn btn-primary' : 'btn btn-outline'} onClick={() => onViewChange?.('billing')}>
          <ShoppingCart size={16} /> Current Bill {itemCount > 0 && `(${itemCount})`}
        </button>
        <button type="button" className={activeView === 'pending' ? 'btn btn-primary' : 'btn btn-outline'} onClick={() => onViewChange?.('pending')}>
          <Clock3 size={16} /> Pending Bills {pendingCount > 0 && `(${pendingCount})`}
        </button>
      </nav>

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: 10 }}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>Cart</div>

        {cart.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-secondary, #6b7280)' }}>
            <ShoppingCart size={34} style={{ opacity: 0.25 }} />
            <div style={{ marginTop: 8 }}>Cart is empty</div>
            <button type="button" className="btn btn-outline" style={{ marginTop: 10 }} onClick={onAddMore}>Add medicines</button>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 8 }}>
            {cart.map((item) => {
              const price = Number(item.price || item.sellingPrice || 0);
              const quantity = Number(item.quantity || 0);
              return (
                <div key={item.id ?? item.medicineId} style={{ border: '1px solid var(--border-color, #e5e7eb)', borderRadius: 10, padding: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    <strong style={{ fontSize: 13 }}>{item.name || item.medicineName || 'Medicine'}</strong>
                    <button type="button" className="btn btn-outline" aria-label={`Remove ${item.name || 'medicine'}`} onClick={() => onRemove?.(item)} style={{ padding: 5 }}><Trash2 size={14} /></button>
                  </div>
                  <div style={{ marginTop: 7, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <button type="button" className="btn btn-outline" aria-label="Decrease quantity" onClick={() => onDecrease?.(item)} style={{ minWidth: 36, minHeight: 36, padding: 6 }}><Minus size={15} /></button>
                      <span style={{ minWidth: 28, textAlign: 'center', fontWeight: 700 }}>{quantity}</span>
                      <button type="button" className="btn btn-outline" aria-label="Increase quantity" onClick={() => onIncrease?.(item)} style={{ minWidth: 36, minHeight: 36, padding: 6 }}><Plus size={15} /></button>
                    </div>
                    <strong>₹{(price * quantity).toFixed(2)}</strong>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div style={{ borderTop: '1px solid var(--border-color, #e5e7eb)', padding: 12, display: 'grid', gap: 8 }}>
        <button type="button" className="btn btn-outline" onClick={onAddMore}>
          <Plus size={16} /> Add More Items
        </button>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15 }}>
          <strong>Total</strong><strong>₹{total.toFixed(2)}</strong>
        </div>
        <button type="button" className="btn btn-primary" disabled={!cart.length} onClick={onPayBill} style={{ minHeight: 46, fontSize: 15 }}>
          <ShoppingCart size={17} /> Pay Bill
        </button>
      </div>
    </aside>
  );
}

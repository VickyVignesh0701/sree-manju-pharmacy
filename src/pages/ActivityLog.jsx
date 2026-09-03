import { useState, useEffect } from 'react';
import { Search, ClipboardList, PackageCheck, Undo2, Trash2, PlusCircle, ShieldCheck, ShoppingCart } from 'lucide-react';
import { apiGet } from '../services/api';

// Groups every real backend action name (see logActivity() call sites across
// api/*.php) into the tabs/badges this page shows. Unknown actions fall back
// to a generic badge rather than being hidden, so nothing silently vanishes
// as new action types get added.
const ACTION_GROUPS = {
  sale_completed: 'sales',
  stock_sale: 'sales',
  stock_purchase_received: 'received',
  purchase_created: 'received',
  purchase_received: 'received',
  purchase_receipt_verified: 'received',
  customer_return_completed: 'returned',
  dealer_return_completed: 'returned',
  stock_customer_return: 'returned',
  stock_disposed: 'disposals',
  login: 'account',
  password_reset_requested: 'account',
  password_reset_completed: 'account',
  staff_registered: 'account',
};

function describeLog(log) {
  const d = log.details || {};
  switch (log.action) {
    case 'login': return `${log.user_name || 'A user'} logged in`;
    case 'password_reset_requested': return `Password reset requested for ${log.user_name || 'a staff account'}`;
    case 'password_reset_completed': return 'Password reset completed';
    case 'staff_registered': return `${d.name || 'A new account'} registered as ${d.role || 'Staff'}`;
    case 'dealer_created': return `Registered dealer "${d.name}"`;
    case 'medicine_created': return `Added medicine "${d.name}" to inventory`;
    case 'medicine_deleted': return 'Deleted a medicine from inventory';
    case 'category_created': return `Added category "${d.name}"`;
    case 'category_deleted': return 'Deleted a category';
    case 'formulation_created': return `Added formulation type "${d.name}"`;
    case 'formulation_deleted': return 'Deleted a formulation type';
    case 'sale_completed': return `Completed sale ${d.invoice_no || ''} for ₹${Number(d.final_amount || 0).toFixed(2)}`;
    case 'stock_sale': return `Sold ${d.quantity ?? ''} ${d.unit_label || 'unit'}(s)`;
    case 'stock_purchase_received': return `Received ${d.quantity ?? ''} ${d.unit_label || 'unit'}(s), batch ${d.batch_number || 'N/A'}`;
    case 'stock_customer_return': return `Customer returned ${d.quantity ?? ''} unit(s), batch ${d.batch_number || 'N/A'}`;
    case 'customer_return_completed': return `Processed return for invoice ${d.invoice_no || ''} — refund ₹${Number(d.refund_amount || 0).toFixed(2)}`;
    case 'dealer_return_completed': return `Returned ${d.quantity ?? ''} unit(s) to dealer (${d.return_no || ''})`;
    case 'stock_disposed': return `Disposed ${d.quantity ?? ''} unit(s) — reason: ${d.reason || 'not specified'}`;
    case 'purchase_created': return `Created purchase order ${d.order_no || ''}`;
    case 'purchase_received': return `Received purchase order shipment (${d.receipt_no || ''})`;
    case 'purchase_receipt_verified': return 'Verified a purchase receipt';
    case 'regular_patient_created': return `Registered regular patient "${d.name}"`;
    case 'regular_patient_updated': return `Updated regular patient "${d.name}"`;
    case 'reconciliation_fixed': return 'Fixed a stock reconciliation mismatch';
    case 'reconciliation_fixed_all': return `Fixed ${d.count ?? 'all'} stock reconciliation mismatch(es)`;
    default: return log.action.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }
}

function getEventBadge(action) {
  const group = ACTION_GROUPS[action];
  const badges = {
    received: { bg: '#dcfce7', color: '#15803d', border: '#86efac', icon: PackageCheck, label: 'Stock Received' },
    returned: { bg: '#fef3c7', color: '#b45309', border: '#fde68a', icon: Undo2, label: 'Return' },
    disposals: { bg: '#fee2e2', color: '#b91c1c', border: '#fca5a5', icon: Trash2, label: 'Disposal' },
    sales: { bg: '#e0f2fe', color: '#0369a1', border: '#7dd3fc', icon: ShoppingCart, label: 'Sale' },
    account: { bg: '#f3e8ff', color: '#6b21a8', border: '#d8b4fe', icon: ShieldCheck, label: 'Account' },
  };
  const b = badges[group] || { bg: '#f1f5f9', color: '#475569', border: '#cbd5e1', icon: PlusCircle, label: 'Activity' };
  const Icon = b.icon;
  return (
    <span className="badge" style={{ backgroundColor: b.bg, color: b.color, border: `1px solid ${b.border}`, display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: '600' }}>
      <Icon size={13} /> {b.label}
    </span>
  );
}

export default function ActivityLog() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    apiGet('activity?limit=300')
      .then(data => setLogs(data.logs || []))
      .catch(err => setError(err.message || 'Could not load the activity log.'))
      .finally(() => setLoading(false));
  }, []);

  const filteredLogs = logs.filter(log => {
    const description = describeLog(log).toLowerCase();
    const matchesSearch = description.includes(search.toLowerCase()) || (log.user_name || '').toLowerCase().includes(search.toLowerCase());
    const matchesTab = activeTab === 'all' || ACTION_GROUPS[log.action] === activeTab;
    return matchesSearch && matchesTab;
  });

  const tabCount = (group) => logs.filter(l => group === 'all' || ACTION_GROUPS[l.action] === group).length;

  return (
    <div className="activity-log-page animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {error && (
        <div className="card" style={{ backgroundColor: '#fef2f2', border: '1px solid #fca5a5', color: '#991b1b', fontSize: '13px', fontWeight: '600' }}>
          ⚠️ {error.includes('permission') || error.toLowerCase().includes('role')
            ? 'The activity log is only visible to Owner and Co-Owner accounts.'
            : error}
        </div>
      )}

      {/* Header Card */}
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ClipboardList size={22} color="var(--primary-color)" />
            Activity & Audit Log
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Full audit trail across sales, stock, dealers, returns, and account activity — recorded server-side.
          </p>
        </div>

        <div style={{ position: 'relative', width: '280px' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--text-secondary)' }} />
          <input
            type="text"
            className="form-input"
            placeholder="Search activity logs..."
            style={{ paddingLeft: '38px', height: '38px' }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Sub-Menu Tabs */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        {[
          { key: 'all', label: `All Activity (${tabCount('all')})`, color: 'var(--primary-color)' },
          { key: 'sales', label: `🛒 Sales (${tabCount('sales')})`, color: '#0369a1' },
          { key: 'received', label: `📦 Stock Received (${tabCount('received')})`, color: '#16a34a' },
          { key: 'returned', label: `🔄 Returns (${tabCount('returned')})`, color: '#d97706' },
          { key: 'disposals', label: `🗑️ Disposals (${tabCount('disposals')})`, color: '#dc2626' },
          { key: 'account', label: `🔐 Account & Security (${tabCount('account')})`, color: '#6b21a8' },
        ].map(tab => (
          <button
            key={tab.key}
            className="btn"
            style={{
              padding: '8px 16px', fontSize: '13px', borderRadius: '8px', fontWeight: '600',
              backgroundColor: activeTab === tab.key ? tab.color : 'var(--surface-color)',
              color: activeTab === tab.key ? 'white' : 'var(--text-secondary)',
              border: '1px solid var(--border-color)'
            }}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Logs Table */}
      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Type</th>
                <th>Activity Description</th>
                <th>Initiator</th>
                <th>IP Address</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Loading activity log…</td></tr>
              ) : filteredLogs.length === 0 ? (
                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>No logs found matching this filter.</td></tr>
              ) : (
                filteredLogs.map(log => (
                  <tr key={log.id}>
                    <td style={{ fontSize: '13px', whiteSpace: 'nowrap' }}>
                      {new Date(log.timestamp).toLocaleDateString()} {new Date(log.timestamp).toLocaleTimeString()}
                    </td>
                    <td>{getEventBadge(log.action)}</td>
                    <td style={{ fontWeight: '500', color: 'var(--text-primary)' }}>{describeLog(log)}</td>
                    <td><span className="badge badge-success" style={{ fontSize: '11px' }}>{log.user_name || 'System'}{log.user_role ? ` (${log.user_role})` : ''}</span></td>
                    <td style={{ fontSize: '12px', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{log.ip_address || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

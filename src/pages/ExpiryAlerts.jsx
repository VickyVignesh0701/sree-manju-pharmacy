import { useState } from 'react';
import { Calendar, Search, AlertCircle, Trash2 } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';

export default function ExpiryAlerts() {
  const { inventory, getUnitName, removeExpiredStock } = useAppContext();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, expired, expiring-soon

  const today = new Date();
  today.setHours(0,0,0,0);

  const threeMonthsFromNow = new Date();
  threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
  threeMonthsFromNow.setHours(23,59,59,999);

  const expiringItems = inventory.filter(item => {
    const expiry = new Date(item.expiry);
    return expiry <= threeMonthsFromNow;
  }).sort((a, b) => new Date(a.expiry) - new Date(b.expiry));

  const filteredItems = expiringItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) || 
                          item.category.toLowerCase().includes(search.toLowerCase());
    
    let matchesType = true;
    const expiry = new Date(item.expiry);
    const isExpired = expiry < today;

    if (filterType === 'expired') {
      matchesType = isExpired;
    } else if (filterType === 'expiring-soon') {
      matchesType = !isExpired;
    }

    return matchesSearch && matchesType;
  });

  const expiredCount = expiringItems.filter(i => new Date(i.expiry) < today).length;
  const soonCount = expiringItems.length - expiredCount;

  return (
    <div className="expiry-alerts">
      <div className="grid grid-cols-2" style={{ marginBottom: '24px', gap: '24px' }}>
        <div className="card" style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#fee2e2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AlertCircle size={24} />
          </div>
          <div>
            <div style={{ color: '#991b1b', fontWeight: '700', fontSize: '18px' }}>Expired Medicines</div>
            <div style={{ color: '#b91c1c', fontSize: '14px' }}>{expiredCount} items must be removed from shelves immediately.</div>
          </div>
        </div>

        <div className="card" style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#fef3c7', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Calendar size={24} />
          </div>
          <div>
            <div style={{ color: '#92400e', fontWeight: '700', fontSize: '18px' }}>Expiring Soon (3 Months)</div>
            <div style={{ color: '#b45309', fontSize: '14px' }}>{soonCount} items require clearance or return to supplier.</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex-between" style={{ marginBottom: '16px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '600' }}>Expiry Tracking List</h2>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ position: 'relative', width: '200px' }}>
              <Search size={14} style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--text-secondary)' }} />
              <input 
                type="text" 
                className="form-input" 
                placeholder="Search medicine..." 
                style={{ padding: '8px 8px 8px 32px', fontSize: '13px' }}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            
            <select 
              className="form-input" 
              style={{ fontSize: '13px', cursor: 'pointer', width: '160px' }}
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">All Alerts</option>
              <option value="expired">Already Expired</option>
              <option value="expiring-soon">Expiring Soon</option>
            </select>
          </div>
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Medicine Name</th>
                <th>Category</th>
                <th>Supplier</th>
                <th>Current Stock</th>
                <th>Expiry Date</th>
                <th>Status</th>
                <th>Days Left</th>
                <th style={{ textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map(item => {
                const isExpired = new Date(item.expiry) < today;
                const daysLeft = Math.ceil((new Date(item.expiry) - new Date()) / (1000 * 60 * 60 * 24));
                return (
                  <tr key={item.id} style={{ backgroundColor: isExpired ? '#fff5f5' : 'transparent' }}>
                    <td>
                      <div style={{ fontWeight: '600', cursor: 'pointer', color: 'var(--primary-color)' }} onClick={() => navigate(`/inventory/${item.id}`)}>
                        {item.name}
                      </div>
                    </td>
                    <td>{item.category}</td>
                    <td>{item.dealer}</td>
                    <td>{item.totalTablets} {getUnitName(item.formulation)}s</td>
                    <td>
                      <span style={{ fontWeight: '700', color: isExpired ? 'var(--danger-color)' : 'var(--warning-color)' }}>
                        {new Date(item.expiry).toLocaleDateString()}
                      </span>
                    </td>
                    <td>
                      {isExpired ? (
                        <span className="badge badge-danger">EXPIRED</span>
                      ) : (
                        <span className="badge badge-warning">Expiring Soon</span>
                      )}
                    </td>
                    <td>
                      <span style={{ fontWeight: '600', color: daysLeft < 0 ? 'var(--danger-color)' : 'inherit' }}>
                        {daysLeft} Days
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {isExpired && (
                        <button 
                          className="btn btn-outline" 
                          style={{ padding: '4px 8px', color: 'var(--danger-color)', border: '1px solid var(--danger-color)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to permanently dispose of ${item.totalTablets} ${getUnitName(item.formulation)}s of ${item.name}?`)) {
                              removeExpiredStock(item.id, item.name);
                            }
                          }}
                        >
                          <Trash2 size={14} /> Dispose
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>
                    No expiry alerts match your current criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

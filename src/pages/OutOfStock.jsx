import { useState } from 'react';
import { AlertTriangle, Search, Phone, Send } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export default function OutOfStock() {
  const { inventory, dealers, getUnitName, requestMedicine } = useAppContext();
  const [search, setSearch] = useState('');

  // Define low stock threshold (e.g. less than 30 units)
  const lowStockItems = inventory.filter(item => item.totalTablets < 30);

  const filteredItems = lowStockItems.filter(item => 
    item.name.toLowerCase().includes(search.toLowerCase()) || 
    item.dealer.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="out-of-stock">
      <div className="card" style={{ marginBottom: '24px', backgroundColor: '#fef2f2', border: '1px solid #fecaca' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#fee2e2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AlertTriangle size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#991b1b' }}>Out of Stock & Low Stock Alerts</h2>
            <div style={{ color: '#b91c1c', fontSize: '14px' }}>
              You have <strong>{lowStockItems.length}</strong> items that are running low or completely out of stock. Please reorder immediately.
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex-between" style={{ marginBottom: '16px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '600' }}>Items Requiring Restock</h2>
          <div style={{ position: 'relative', width: '250px' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-secondary)' }} />
            <input 
              type="text" 
              className="form-input" 
              placeholder="Search medicine or dealer..." 
              style={{ paddingLeft: '38px' }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Medicine Name</th>
                <th>Current Stock</th>
                <th>Status</th>
                <th>Supplier / Dealer</th>
                <th>Contact</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map(item => {
                const dealerDetails = dealers.find(d => d.name.toLowerCase().includes(item.dealer.toLowerCase()) || item.dealer.toLowerCase().includes(d.name.toLowerCase()));
                return (
                  <tr key={item.id} style={{ backgroundColor: item.totalTablets === 0 ? '#fff5f5' : 'transparent' }}>
                    <td>
                      <div style={{ fontWeight: '600' }}>{item.name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{item.category}</div>
                    </td>
                    <td>
                      <span style={{ fontSize: '18px', fontWeight: '700', color: item.totalTablets === 0 ? 'var(--danger-color)' : '#f59e0b' }}>
                        {item.totalTablets} <span style={{ fontSize: '12px', fontWeight: 'normal' }}>{getUnitName(item.formulation)}s</span>
                      </span>
                    </td>
                    <td>
                      {item.totalTablets === 0 ? (
                        <span className="badge badge-danger">Out of Stock</span>
                      ) : (
                        <span className="badge badge-warning">Low Stock</span>
                      )}
                    </td>
                    <td><div style={{ fontWeight: '500' }}>{item.dealer}</div></td>
                    <td>
                      {dealerDetails ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}>
                          <Phone size={14} color="var(--text-secondary)" /> {dealerDetails.phone}
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>N/A</span>
                      )}
                    </td>
                    <td>
                      <button 
                        className="btn btn-primary" 
                        style={{ padding: '6px 12px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }} 
                        onClick={() => {
                          requestMedicine(item.dealer, item.name, 100);
                        }}
                      >
                        <Send size={14} /> Quick Reorder
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>
                    No low stock items found matching your search. All good!
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

import { useState } from 'react';
import { Package, TrendingUp, IndianRupee, Search, ChevronRight } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';

export default function StockOverview() {
  const { inventory, getStockDisplay } = useAppContext();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const totalValue = inventory.reduce((sum, item) => {
    const pricePerTab = item.pricePerStrip / item.tabletsPerStrip;
    return sum + (pricePerTab * item.totalTablets);
  }, 0);

  const totalTablets = inventory.reduce((sum, item) => sum + item.totalTablets, 0);

  const filteredInventory = inventory.filter(item => 
    item.name.toLowerCase().includes(search.toLowerCase()) || 
    item.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="stock-overview">
      <div className="grid grid-cols-3" style={{ marginBottom: '24px' }}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#e0f2fe', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Package size={24} />
          </div>
          <div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Total Unique Medicines</div>
            <div style={{ fontSize: '24px', fontWeight: '700' }}>{inventory.length}</div>
          </div>
        </div>
        
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#ecfdf5', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <TrendingUp size={24} />
          </div>
          <div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Total Stock (Units)</div>
            <div style={{ fontSize: '24px', fontWeight: '700' }}>{totalTablets}</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#fef3c7', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IndianRupee size={24} />
          </div>
          <div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Total Stock Value (Est)</div>
            <div style={{ fontSize: '24px', fontWeight: '700' }}>₹{totalValue.toFixed(2)}</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex-between" style={{ marginBottom: '16px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600' }}>Overall Stock Details</h2>
          <div style={{ position: 'relative', width: '250px' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-secondary)' }} />
            <input 
              type="text" 
              className="form-input" 
              placeholder="Search medicine or category..." 
              style={{ paddingLeft: '38px', backgroundColor: 'var(--surface-color)' }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="table-container" style={{ maxHeight: '500px', overflowY: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Medicine Name</th>
                <th>Category</th>
                <th>Stock Level</th>
                <th>Price / Unit</th>
                <th>Total Value</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredInventory.map(item => {
                const pricePerTab = item.pricePerStrip / item.tabletsPerStrip;
                const value = pricePerTab * item.totalTablets;
                return (
                  <tr key={item.id}>
                    <td>
                      <div style={{ fontWeight: '500' }}>{item.name}</div>
                    </td>
                    <td><span className="badge badge-success">{item.category}</span></td>
                    <td>
                      <span style={{ color: item.totalTablets < 30 ? 'var(--danger-color)' : 'inherit', fontWeight: item.totalTablets < 30 ? '600' : 'normal' }}>
                        {getStockDisplay(item)}
                      </span>
                    </td>
                    <td>₹{pricePerTab.toFixed(2)}</td>
                    <td style={{ fontWeight: '600' }}>₹{value.toFixed(2)}</td>
                    <td>
                      <button className="btn btn-outline" style={{ padding: '4px 8px', fontSize: '12px' }} onClick={() => navigate(`/inventory/${item.id}`)}>
                        View <ChevronRight size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredInventory.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>
                    No items found.
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

import { useState } from 'react';
import { AlertTriangle, TrendingUp, Package, Users, Search, Filter, BellRing, HeartHandshake } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { Link, useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const { inventory, todaySalesAmount, sales, getStockDisplay, regularPatients = [] } = useAppContext();
  const navigate = useNavigate();
  const [salesSearch, setSalesSearch] = useState('');
  const [salesDateFilter, setSalesDateFilter] = useState('today');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Find regular patients due for internal pharmacy 25-day refill alert
  const dueRefillPatients = regularPatients.filter(p => {
    const lastDate = p.lastPurchaseDate ? new Date(p.lastPurchaseDate) : new Date();
    const daysPassed = Math.floor(Math.abs(new Date() - lastDate) / (1000 * 60 * 60 * 24));
    return daysPassed >= (p.reminderDays || 25);
  });

  // Find expiring soon
  const expiringSoon = inventory
    .filter(item => new Date(item.expiry) < new Date(new Date().setMonth(new Date().getMonth() + 3)))
    .slice(0, 5); // limit to 5

  // Find low stock (e.g. less than 20 tablets total)
  const lowStock = inventory.filter(item => item.totalTablets < 30);

  const filteredSales = sales.filter(sale => {
    const patientName = sale.patient?.name?.toLowerCase() || 'walk-in customer';
    const matchesSearch = patientName.includes(salesSearch.toLowerCase()) || 
                          (sale.patient?.phone && sale.patient.phone.includes(salesSearch));
    
    let matchesDate = true;
    if (salesDateFilter !== 'all') {
      const saleDate = new Date(sale.date);
      const today = new Date();
      if (salesDateFilter === 'today') {
        matchesDate = saleDate.toDateString() === today.toDateString();
      } else if (salesDateFilter === 'month') {
        matchesDate = saleDate.getMonth() === today.getMonth() && saleDate.getFullYear() === today.getFullYear();
      } else if (salesDateFilter === 'year') {
        matchesDate = saleDate.getFullYear() === today.getFullYear();
      } else if (salesDateFilter === 'custom') {
        if (startDate && endDate) {
          const start = new Date(startDate);
          start.setHours(0,0,0,0);
          const end = new Date(endDate);
          end.setHours(23,59,59,999);
          matchesDate = saleDate >= start && saleDate <= end;
        }
      }
    }
    
    return matchesSearch && matchesDate;
  });

  return (
    <div className="dashboard grid">
      
      {/* Internal Pharmacy Refill Alert Banner for Staff */}
      {dueRefillPatients.length > 0 && (
        <div 
          className="card hover-row" 
          style={{ 
            background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)', 
            border: '1.5px solid #fdba74', 
            borderRadius: '12px', 
            padding: '16px 20px', 
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(245, 158, 11, 0.15)'
          }}
          onClick={() => navigate('/regular-customers')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ backgroundColor: '#f59e0b', color: 'white', padding: '10px', borderRadius: '10px' }}>
                <BellRing size={22} />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: '#c2410c' }}>
                  ⚡ INTERNAL PHARMACY REFILL ALERT FOR STAFF
                </h4>
                <p style={{ margin: '2px 0 0 0', fontSize: '13px', color: '#9a3412', fontWeight: '600' }}>
                  {dueRefillPatients.length} Regular Patient(s) have completed 25+ days! Refill course due: {dueRefillPatients.map(p => p.name).join(', ')}.
                </p>
              </div>
            </div>
            <button className="btn" style={{ backgroundColor: '#c2410c', color: 'white', fontWeight: '700', fontSize: '12px', padding: '8px 16px', borderRadius: '8px', border: 'none' }}>
              View Staff Refill Alerts &rarr;
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3">
        <div className="card">
          <div className="flex-between">
            <h3 className="stat-label">Total Sales Today</h3>
            <TrendingUp size={20} color="var(--primary-color)" />
          </div>
          <div className="stat-value">₹ {todaySalesAmount.toFixed(2)}</div>
          <div style={{ marginTop: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
            From {sales.length} transactions today
          </div>
        </div>
        <div className="card hover-row" style={{ cursor: 'pointer' }} onClick={() => navigate('/stock-overview')}>
          <div className="flex-between">
            <h3 className="stat-label">Products in Stock</h3>
            <Package size={20} color="var(--secondary-color)" />
          </div>
          <div className="stat-value">{inventory.length}</div>
        </div>
        <div className="card hover-row" style={{ cursor: 'pointer' }} onClick={() => navigate('/out-of-stock')}>
          <div className="flex-between">
            <h3 className="stat-label">Low Stock Alerts</h3>
            <Users size={20} color="var(--warning-color)" />
          </div>
          <div className="stat-value">{lowStock.length}</div>
        </div>
      </div>

      <div className="grid grid-cols-2" style={{ marginBottom: '24px' }}>
        <div className="card">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
            <div className="flex-between">
              <h3 style={{ fontSize: '16px', fontWeight: '600' }}>Sales Log</h3>
              <button className="btn btn-outline" style={{ padding: '4px 8px', fontSize: '12px' }} onClick={() => {
                if (filteredSales.length === 0) return alert('No sales to export');
                let csv = 'Sale ID,Time,Patient Name,Phone,Total Items,Total Amount (INR)\n';
                filteredSales.forEach(sale => {
                  const time = new Date(sale.date).toLocaleString();
                  csv += `${sale.id},"${time}","${sale.patient?.name || 'Walk-in'}","${sale.patient?.phone || 'N/A'}",${sale.items.length},${sale.totalAmount.toFixed(2)}\n`;
                });
                const blob = new Blob([csv], { type: 'text/csv' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `sree_manju_sales_${new Date().toISOString().split('T')[0]}.csv`;
                a.click();
              }}>
                Export CSV
              </button>
            </div>
            
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div style={{ position: 'relative', width: '200px' }}>
                <Search size={14} style={{ position: 'absolute', left: '8px', top: '8px', color: 'var(--text-secondary)' }} />
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Search patient..." 
                  style={{ padding: '6px 8px 6px 28px', fontSize: '12px', backgroundColor: 'white' }}
                  value={salesSearch}
                  onChange={(e) => setSalesSearch(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: 'white', padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                <Filter size={12} color="var(--text-secondary)" />
                <select 
                  style={{ background: 'transparent', border: 'none', outline: 'none', cursor: 'pointer', fontSize: '12px', color: 'var(--text-primary)' }}
                  value={salesDateFilter}
                  onChange={(e) => setSalesDateFilter(e.target.value)}
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="month">This Month</option>
                  <option value="year">This Year</option>
                  <option value="custom">Custom Range</option>
                </select>
              </div>

              {salesDateFilter === 'custom' && (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input 
                    type="date" 
                    className="form-input" 
                    style={{ padding: '4px 8px', fontSize: '12px', width: '120px', backgroundColor: 'white' }} 
                    value={startDate} 
                    onChange={(e) => setStartDate(e.target.value)} 
                  />
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>to</span>
                  <input 
                    type="date" 
                    className="form-input" 
                    style={{ padding: '4px 8px', fontSize: '12px', width: '120px', backgroundColor: 'white' }} 
                    value={endDate} 
                    onChange={(e) => setEndDate(e.target.value)} 
                  />
                </div>
              )}
            </div>
          </div>
          <div style={{ height: '200px', backgroundColor: '#f8fafc', borderRadius: '8px', overflowY: 'auto' }}>
            {filteredSales.length === 0 ? (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                No sales found matching criteria.
              </div>
            ) : (
              <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {filteredSales.map(sale => (
                  <div key={sale.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', backgroundColor: 'white', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '14px' }}>{sale.patient?.name || 'Walk-in Customer'}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{sale.items.length} items</div>
                    </div>
                    <div style={{ fontWeight: '600', color: 'var(--primary-color)' }}>
                      ₹{sale.totalAmount.toFixed(2)}
                    </div>
                  </div>
                )).reverse()}
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="flex-between" style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600' }}>Quick Actions</h3>
          </div>
          <div className="grid grid-cols-2" style={{ gap: '16px' }}>
            <Link to="/inventory" className="btn btn-outline" style={{ height: '80px', display: 'flex', flexDirection: 'column', justifyContent: 'center', textDecoration: 'none' }}>
              <Package size={24} style={{ marginBottom: '8px', color: 'var(--primary-color)' }} />
              Add Product
            </Link>
            <Link to="/billing" className="btn btn-outline" style={{ height: '80px', display: 'flex', flexDirection: 'column', justifyContent: 'center', textDecoration: 'none' }}>
              <TrendingUp size={24} style={{ marginBottom: '8px', color: 'var(--secondary-color)' }} />
              New Sale
            </Link>
            <Link to="/dealers" className="btn btn-outline" style={{ height: '80px', display: 'flex', flexDirection: 'column', justifyContent: 'center', textDecoration: 'none' }}>
              <Users size={24} style={{ marginBottom: '8px', color: 'var(--warning-color)' }} />
              Manage Dealers
            </Link>
            <Link to="/profile" className="btn btn-outline" style={{ height: '80px', display: 'flex', flexDirection: 'column', justifyContent: 'center', textDecoration: 'none' }}>
              <Users size={24} style={{ marginBottom: '8px', color: 'var(--danger-color)' }} />
              Owner Profile
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2">
        {/* Expiry Alerts */}
        <div className="card">
          <div className="flex-between hover-row" style={{ marginBottom: '16px', cursor: 'pointer', padding: '8px', borderRadius: '8px' }} onClick={() => navigate('/expiry-alerts')}>
            <h3 style={{ fontSize: '16px', fontWeight: '600' }}>Expiry Reminders (Next 3 Months)</h3>
            <AlertTriangle size={20} color="var(--danger-color)" />
          </div>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Medicine Name</th>
                  <th>Expiry Date</th>
                </tr>
              </thead>
              <tbody>
                {expiringSoon.map(item => (
                  <tr key={item.id} className="hover-row" style={{ cursor: 'pointer' }} onClick={() => navigate(`/inventory/${item.id}`)}>
                    <td>{item.name}</td>
                    <td>
                      <span style={{ color: 'var(--danger-color)', fontWeight: '600' }}>
                        {item.expiry}
                      </span>
                    </td>
                  </tr>
                ))}
                {expiringSoon.length === 0 && (
                  <tr>
                    <td colSpan="2" style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>All stocks are well within expiry.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="card">
          <div className="flex-between hover-row" style={{ marginBottom: '16px', cursor: 'pointer', padding: '8px', borderRadius: '8px' }} onClick={() => navigate('/out-of-stock')}>
            <h3 style={{ fontSize: '16px', fontWeight: '600' }}>Low Stock Alerts</h3>
            <Package size={20} color="var(--warning-color)" />
          </div>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Medicine Name</th>
                  <th>Remaining Stock</th>
                </tr>
              </thead>
              <tbody>
                {lowStock.map(item => (
                  <tr key={item.id} className="hover-row" style={{ cursor: 'pointer' }} onClick={() => navigate(`/inventory/${item.id}`)}>
                    <td>{item.name}</td>
                    <td>
                      <span className="badge badge-danger">{getStockDisplay(item)}</span>
                    </td>
                  </tr>
                ))}
                {lowStock.length === 0 && (
                  <tr>
                    <td colSpan="2" style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Stock levels are healthy.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

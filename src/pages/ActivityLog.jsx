import { useState } from 'react';
import { Search, ClipboardList, PackageCheck, Undo2, Send, Trash2, PlusCircle, UserCheck } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export default function ActivityLog() {
  const { activityLogs } = useAppContext();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // all, received, returned, requests, disposals

  // Filter out pure login/logout logs, keeping only Inventory & Dealer actions
  const inventoryDealerLogs = activityLogs.filter(log => {
    const act = log.action.toLowerCase();
    const isLoginEvent = act.includes('login') || act.includes('logout') || act.includes('password');
    return !isLoginEvent;
  });

  const filteredLogs = inventoryDealerLogs.filter(log => {
    const act = log.action.toLowerCase();
    const matchesSearch = act.includes(search.toLowerCase());
    let matchesTab = true;

    if (activeTab === 'received') {
      matchesTab = act.includes('received');
    } else if (activeTab === 'returned') {
      matchesTab = act.includes('returned') || act.includes('undid');
    } else if (activeTab === 'requests') {
      matchesTab = act.includes('requested') || act.includes('order');
    } else if (activeTab === 'disposals') {
      matchesTab = act.includes('removed') || act.includes('disposed');
    }

    return matchesSearch && matchesTab;
  });

  const getEventBadge = (action) => {
    const act = action.toLowerCase();

    if (act.includes('received')) {
      return (
        <span className="badge" style={{ backgroundColor: '#dcfce7', color: '#15803d', border: '1px solid #86efac', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: '600' }}>
          <PackageCheck size={13} /> Stock Received
        </span>
      );
    }
    if (act.includes('returned')) {
      return (
        <span className="badge" style={{ backgroundColor: '#fef3c7', color: '#b45309', border: '1px solid #fde68a', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: '600' }}>
          <Undo2 size={13} /> Returned to Dealer
        </span>
      );
    }
    if (act.includes('requested')) {
      return (
        <span className="badge" style={{ backgroundColor: '#e0f2fe', color: '#0369a1', border: '1px solid #7dd3fc', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: '600' }}>
          <Send size={13} /> Purchase Order Request
        </span>
      );
    }
    if (act.includes('removed') || act.includes('disposed')) {
      return (
        <span className="badge" style={{ backgroundColor: '#fee2e2', color: '#b91c1c', border: '1px solid #fca5a5', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: '600' }}>
          <Trash2 size={13} /> Expired Stock Removed
        </span>
      );
    }
    if (act.includes('added stock') || act.includes('added dealer')) {
      return (
        <span className="badge" style={{ backgroundColor: '#f3e8ff', color: '#6b21a8', border: '1px solid #d8b4fe', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: '600' }}>
          <PlusCircle size={13} /> System Addition
        </span>
      );
    }
    return (
      <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
        <UserCheck size={13} /> Activity
      </span>
    );
  };

  return (
    <div className="activity-log-page animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header Card */}
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ClipboardList size={22} color="var(--primary-color)" />
            Inventory & Dealer Activity Logs
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Audit trail separating received shipments, supplier returns, purchase orders, and stock adjustments.
          </p>
        </div>

        {/* Search */}
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
        <button 
          className="btn" 
          style={{ padding: '8px 16px', fontSize: '13px', borderRadius: '8px', fontWeight: '600', backgroundColor: activeTab === 'all' ? 'var(--primary-color)' : 'var(--surface-color)', color: activeTab === 'all' ? 'white' : 'var(--text-secondary)', border: '1px solid var(--border-color)' }}
          onClick={() => setActiveTab('all')}
        >
          All Activity ({inventoryDealerLogs.length})
        </button>
        <button 
          className="btn" 
          style={{ padding: '8px 16px', fontSize: '13px', borderRadius: '8px', fontWeight: '600', backgroundColor: activeTab === 'received' ? '#16a34a' : 'var(--surface-color)', color: activeTab === 'received' ? 'white' : 'var(--text-secondary)', border: '1px solid var(--border-color)' }}
          onClick={() => setActiveTab('received')}
        >
          📦 Stock Received
        </button>
        <button 
          className="btn" 
          style={{ padding: '8px 16px', fontSize: '13px', borderRadius: '8px', fontWeight: '600', backgroundColor: activeTab === 'returned' ? '#d97706' : 'var(--surface-color)', color: activeTab === 'returned' ? 'white' : 'var(--text-secondary)', border: '1px solid var(--border-color)' }}
          onClick={() => setActiveTab('returned')}
        >
          🔄 Stock Returned to Dealer
        </button>
        <button 
          className="btn" 
          style={{ padding: '8px 16px', fontSize: '13px', borderRadius: '8px', fontWeight: '600', backgroundColor: activeTab === 'requests' ? '#0284c7' : 'var(--surface-color)', color: activeTab === 'requests' ? 'white' : 'var(--text-secondary)', border: '1px solid var(--border-color)' }}
          onClick={() => setActiveTab('requests')}
        >
          📩 Purchase Order Requests
        </button>
        <button 
          className="btn" 
          style={{ padding: '8px 16px', fontSize: '13px', borderRadius: '8px', fontWeight: '600', backgroundColor: activeTab === 'disposals' ? '#dc2626' : 'var(--surface-color)', color: activeTab === 'disposals' ? 'white' : 'var(--text-secondary)', border: '1px solid var(--border-color)' }}
          onClick={() => setActiveTab('disposals')}
        >
          🗑️ Expired Stock Disposals
        </button>
      </div>

      {/* Logs Table */}
      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Operation Type</th>
                <th>Activity Description</th>
                <th>Initiator</th>
                <th>IP Address</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                    No logs found matching this filter.
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => (
                  <tr key={log.id}>
                    <td style={{ fontSize: '13px', whiteSpace: 'nowrap' }}>
                      {new Date(log.timestamp).toLocaleDateString()} {new Date(log.timestamp).toLocaleTimeString()}
                    </td>
                    <td>{getEventBadge(log.action)}</td>
                    <td style={{ fontWeight: '500', color: 'var(--text-primary)' }}>{log.action}</td>
                    <td><span className="badge badge-success" style={{ fontSize: '11px' }}>Owner</span></td>
                    <td style={{ fontSize: '12px', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{log.ip}</td>
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

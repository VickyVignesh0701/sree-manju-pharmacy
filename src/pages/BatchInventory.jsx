import { useEffect, useMemo, useState } from 'react';
import { RefreshCw, Search, Package, AlertTriangle, Clock3 } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { apiGet } from '../services/api';

export default function BatchInventory() {
  const { inventory = [] } = useAppContext();
  const [medicineId, setMedicineId] = useState('');
  const [batches, setBatches] = useState([]);
  const [search, setSearch] = useState('');
  const [includeExpired, setIncludeExpired] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const medicines = useMemo(() => [...inventory].sort((a, b) => String(a.name).localeCompare(String(b.name))), [inventory]);

  const loadBatches = async () => {
    if (!medicineId) { setBatches([]); return; }
    setLoading(true); setError('');
    try {
      const query = includeExpired ? '?include_expired=true' : '';
      const data = await apiGet(`batches/${encodeURIComponent(medicineId)}${query}`);
      setBatches(data.batches || []);
    } catch (e) {
      setError(e.message || 'Unable to load batches.');
      if (e.status !== 401) setBatches([]);
    } finally { setLoading(false); }
  };

  useEffect(() => { loadBatches(); }, [medicineId, includeExpired]);

  const filtered = batches.filter(b => String(b.batch_number).toLowerCase().includes(search.toLowerCase()));
  const total = filtered.reduce((sum, b) => sum + Number(b.quantity || 0), 0);

  return (
    <div>
      <div className="flex-between" style={{ marginBottom: 20 }}>
        <div><h2 style={{ margin: 0 }}>Batch Inventory</h2><p style={{ color: 'var(--text-secondary)', marginTop: 5 }}>View saleable stock by batch and expiry. Billing uses FEFO from these batches.</p></div>
        <button className="btn btn-outline" onClick={loadBatches} disabled={loading}><RefreshCw size={15} /> Refresh</button>
      </div>
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto', gap: 12, alignItems: 'end' }}>
          <div><label className="form-label">Medicine</label><select className="form-input" value={medicineId} onChange={e => setMedicineId(e.target.value)}><option value="">Select medicine</option>{medicines.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select></div>
          <div><label className="form-label">Search Batch</label><div style={{ position: 'relative' }}><Search size={16} style={{ position: 'absolute', left: 10, top: 11 }} /><input className="form-input" style={{ paddingLeft: 34 }} value={search} onChange={e => setSearch(e.target.value)} placeholder="Batch number" /></div></div>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center', paddingBottom: 10 }}><input type="checkbox" checked={includeExpired} onChange={e => setIncludeExpired(e.target.checked)} /> Include expired</label>
        </div>
      </div>
      {error && <div className="card" style={{ marginBottom: 16, borderColor: '#fecaca', background: '#fef2f2', color: '#991b1b' }}><AlertTriangle size={16} /> {error}</div>}
      <div className="card" style={{ marginBottom: 16 }}><div className="flex-between"><span style={{ fontWeight: 700 }}>Available batch quantity</span><strong>{total}</strong></div></div>
      {!medicineId ? <div className="card" style={{ textAlign: 'center', padding: 50, color: 'var(--text-secondary)' }}><Package size={36} /><p>Select a medicine to view its batches.</p></div> : <div className="card" style={{ overflowX: 'auto' }}>{loading ? <p>Loading batches…</p> : filtered.length === 0 ? <p style={{ color: 'var(--text-secondary)' }}>No batches found.</p> : <table className="data-table"><thead><tr><th>Batch</th><th>Expiry</th><th>Qty</th><th>Purchase</th><th>MRP</th><th>Selling</th><th>FEFO</th></tr></thead><tbody>{filtered.map((b, index) => <tr key={b.id}><td><strong>{b.batch_number}</strong></td><td>{b.expiry_date}</td><td>{b.quantity}</td><td>₹{Number(b.purchase_price || 0).toFixed(2)}</td><td>₹{Number(b.mrp || 0).toFixed(2)}</td><td>₹{Number(b.selling_price || 0).toFixed(2)}</td><td>{index === 0 ? <span className="badge badge-success"><Clock3 size={12} /> Next</span> : <span className="badge">Later</span>}</td></tr>)}</tbody></table>}</div>}
    </div>
  );
}

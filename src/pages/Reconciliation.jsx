import { useState, useEffect } from 'react';
import { ShieldAlert, RefreshCw, CheckCircle2, Wrench } from 'lucide-react';
import { apiGet, apiPost } from '../services/api';

export default function Reconciliation() {
  const [mismatches, setMismatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [fixingId, setFixingId] = useState(null);
  const [fixingAll, setFixingAll] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiGet('reconciliation');
      setMismatches(data.mismatches || []);
    } catch (err) {
      setError(err.message || 'Could not load the reconciliation report.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const fixOne = async (medicineId) => {
    setFixingId(medicineId);
    try {
      await apiPost('reconciliation', { medicine_id: medicineId });
      await load();
    } catch (err) {
      setError(err.message || 'Could not fix this medicine.');
    } finally {
      setFixingId(null);
    }
  };

  const fixAll = async () => {
    setFixingAll(true);
    try {
      await apiPost('reconciliation', {});
      await load();
    } catch (err) {
      setError(err.message || 'Could not fix all mismatches.');
    } finally {
      setFixingAll(false);
    }
  };

  return (
    <div className="reconciliation-page animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShieldAlert size={22} color="var(--warning-color)" />
            Stock Reconciliation
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Compares each medicine's displayed stock total against the real sum of its batches. A mismatch here means something
            wrote to stock without going through the normal batch flow — it won't affect what's sellable, but the number shown
            elsewhere in the app could be wrong until fixed.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-outline" onClick={load} disabled={loading} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <RefreshCw size={14} /> Refresh
          </button>
          {mismatches.length > 0 && (
            <button className="btn btn-primary" onClick={fixAll} disabled={fixingAll} style={{ opacity: fixingAll ? 0.7 : 1, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <Wrench size={14} /> {fixingAll ? 'Fixing…' : `Fix All (${mismatches.length})`}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="card" style={{ backgroundColor: '#fef2f2', border: '1px solid #fca5a5', color: '#991b1b', fontSize: '13px', fontWeight: '600' }}>
          ⚠️ {error}
        </div>
      )}

      <div className="card">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Checking stock data…</div>
        ) : mismatches.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
            <CheckCircle2 size={40} color="#16a34a" style={{ marginBottom: '10px' }} />
            <p>No mismatches found. Every medicine's stock total matches its real batch data.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Medicine</th>
                  <th>Displayed Stock</th>
                  <th>Real Batch Total</th>
                  <th style={{ textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {mismatches.map(m => (
                  <tr key={m.medicine_id}>
                    <td style={{ fontWeight: '600' }}>{m.name}</td>
                    <td style={{ color: '#b91c1c' }}>{m.aggregate_base_quantity} units</td>
                    <td style={{ color: '#15803d' }}>{m.batch_base_quantity} units</td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        className="btn btn-outline"
                        style={{ padding: '5px 12px', fontSize: '12px' }}
                        onClick={() => fixOne(m.medicine_id)}
                        disabled={fixingId === m.medicine_id}
                      >
                        {fixingId === m.medicine_id ? 'Fixing…' : 'Fix This'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

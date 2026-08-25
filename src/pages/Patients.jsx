import { Search, User, Phone, MapPin, Calendar, Filter } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Patients() {
  const { patients } = useAppContext();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('all'); // all, today, month, year, custom
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const filteredPatients = patients.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.phone.includes(search);
    
    let matchesDate = true;
    if (dateFilter !== 'all') {
      const visitDate = new Date(p.lastVisit);
      const today = new Date();
      
      if (dateFilter === 'today') {
        matchesDate = visitDate.toDateString() === today.toDateString();
      } else if (dateFilter === 'month') {
        matchesDate = visitDate.getMonth() === today.getMonth() && visitDate.getFullYear() === today.getFullYear();
      } else if (dateFilter === 'year') {
        matchesDate = visitDate.getFullYear() === today.getFullYear();
      } else if (dateFilter === 'custom') {
        if (startDate && endDate) {
          const start = new Date(startDate);
          start.setHours(0,0,0,0);
          const end = new Date(endDate);
          end.setHours(23,59,59,999);
          matchesDate = visitDate >= start && visitDate <= end;
        }
      }
    }
    
    return matchesSearch && matchesDate;
  });

  return (
    <div className="patients">
      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600' }}>Patient Directory</h2>
          
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap', backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <div style={{ position: 'relative', width: '250px' }}>
              <Search size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-secondary)' }} />
              <input 
                type="text" 
                className="form-input" 
                placeholder="Search patient name or phone..." 
                style={{ paddingLeft: '38px', backgroundColor: 'white' }}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'white', padding: '4px 12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <Filter size={16} color="var(--text-secondary)" />
              <select 
                style={{ background: 'transparent', border: 'none', outline: 'none', cursor: 'pointer', fontSize: '14px', color: 'var(--text-primary)' }}
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="month">This Month</option>
                <option value="year">This Year</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>
            
            {dateFilter === 'custom' && (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input 
                  type="date" 
                  className="form-input" 
                  style={{ padding: '6px', fontSize: '13px', width: '130px', backgroundColor: 'white' }} 
                  value={startDate} 
                  onChange={(e) => setStartDate(e.target.value)} 
                />
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>to</span>
                <input 
                  type="date" 
                  className="form-input" 
                  style={{ padding: '6px', fontSize: '13px', width: '130px', backgroundColor: 'white' }} 
                  value={endDate} 
                  onChange={(e) => setEndDate(e.target.value)} 
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3">
        {filteredPatients.map(patient => (
          <div key={patient.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="flex-between" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#e0f2fe', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <User size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: '600' }}>{patient.name}</h3>
                  <span className="badge badge-success" style={{ fontSize: '11px', marginTop: '4px' }}>Registered</span>
                </div>
              </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px', color: 'var(--text-secondary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Phone size={16} /> {patient.phone || 'No phone'}
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <MapPin size={16} style={{ marginTop: '2px' }} /> {patient.address || 'No address'}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar size={16} /> Last Visit: {new Date(patient.lastVisit).toLocaleDateString()}
              </div>
            </div>

            <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'center' }}>
              <button className="btn btn-outline" style={{ width: '100%', fontSize: '13px' }} onClick={() => navigate(`/patients/${patient.id}`)}>
                View Prescription History
              </button>
            </div>
          </div>
        ))}
        {filteredPatients.length === 0 && (
          <div style={{ gridColumn: 'span 3', textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
            No patients found matching "{search}".
          </div>
        )}
      </div>
    </div>
  );
}

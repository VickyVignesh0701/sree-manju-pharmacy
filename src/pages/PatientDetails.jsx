import { useParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { ArrowLeft, User, Phone, MapPin, Calendar, FileText } from 'lucide-react';

export default function PatientDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { patients, sales, inventory, getUnitName } = useAppContext();

  const patient = patients.find(p => p.id.toString() === id);

  if (!patient) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <h2>Patient not found!</h2>
        <button className="btn btn-primary" onClick={() => navigate('/patients')} style={{ marginTop: '16px' }}>Go Back</button>
      </div>
    );
  }

  // Find all sales/prescriptions for this patient based on phone or name
  const patientSales = sales.filter(s => 
    (s.patient?.phone && s.patient.phone === patient.phone) || 
    (s.patient?.name && s.patient.name === patient.name)
  ).sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div className="patient-details">
      <button className="btn btn-outline" style={{ marginBottom: '24px' }} onClick={() => navigate('/patients')}>
        <ArrowLeft size={18} /> Back to Directory
      </button>

      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '20px' }}>
          <div style={{ width: '60px', height: '60px', borderRadius: '12px', backgroundColor: '#e0f2fe', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <User size={32} />
          </div>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '4px' }}>{patient.name}</h1>
            <div style={{ color: 'var(--text-secondary)', fontSize: '14px', display: 'flex', gap: '12px', alignItems: 'center' }}>
              <span className="badge badge-success">Registered Patient</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3" style={{ gap: '24px' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <Phone size={20} color="var(--primary-color)" style={{ marginTop: '2px' }} />
            <div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Phone Number</div>
              <div style={{ fontSize: '16px', fontWeight: '600' }}>{patient.phone}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <MapPin size={20} color="var(--primary-color)" style={{ marginTop: '2px' }} />
            <div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Address</div>
              <div style={{ fontSize: '16px', fontWeight: '600' }}>{patient.address}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <Calendar size={20} color="var(--primary-color)" style={{ marginTop: '2px' }} />
            <div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Last Visit</div>
              <div style={{ fontSize: '16px', fontWeight: '600' }}>{new Date(patient.lastVisit).toLocaleDateString()}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileText size={20} color="var(--primary-color)" /> Prescription & Purchase History
        </h2>

        {patientSales.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
            <FileText size={48} style={{ opacity: 0.2, margin: '0 auto 16px' }} />
            <p>No prescription or purchase history found for this patient.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {patientSales.map(sale => (
              <div key={sale.id} style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '16px' }}>
                <div className="flex-between" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: '600' }}>Invoice #{sale.id}</span>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                      {new Date(sale.date).toLocaleString()}
                    </span>
                  </div>
                  <div style={{ fontWeight: '700', color: 'var(--primary-color)' }}>
                    ₹{sale.totalAmount.toFixed(2)}
                  </div>
                </div>

                <table className="table" style={{ width: '100%', fontSize: '14px' }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '8px', backgroundColor: '#f8fafc' }}>Medicine</th>
                      <th style={{ padding: '8px', backgroundColor: '#f8fafc' }}>Qty</th>
                      <th style={{ padding: '8px', backgroundColor: '#f8fafc' }}>Price/Unit</th>
                      <th style={{ padding: '8px', backgroundColor: '#f8fafc', textAlign: 'right' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sale.items.map((item, idx) => {
                      const pricePerTab = item.pricePerStrip / item.tabletsPerStrip;
                      const invItem = inventory.find(i => i.id === item.id) || {};
                      const unit = getUnitName ? getUnitName(invItem.formulation) : 'unit';
                      return (
                        <tr key={idx}>
                          <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{item.name}</td>
                          <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{item.quantity} {unit}s</td>
                          <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>₹{pricePerTab.toFixed(2)}</td>
                          <td style={{ padding: '8px', borderBottom: '1px solid #eee', textAlign: 'right' }}>
                            ₹{(pricePerTab * item.quantity).toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

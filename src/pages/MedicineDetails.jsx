import { useParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { ArrowLeft, Package, Building2, Phone, Mail, Calendar, IndianRupee, Activity } from 'lucide-react';

export default function MedicineDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { inventory, dealers, getStockDisplay, getUnitName, getPackName } = useAppContext();

  const medicine = inventory.find(item => item.id.toString() === id);

  if (!medicine) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <h2>Medicine not found!</h2>
        <button className="btn btn-primary" onClick={() => navigate('/inventory')} style={{ marginTop: '16px' }}>Go Back</button>
      </div>
    );
  }

  const dealer = dealers.find(d => d.id === medicine.dealerId) || 
    { name: 'Not linked yet', contactPerson: 'Unknown', phone: 'N/A', email: 'N/A', pendingOrders: 0 };

  const pricePerTab = medicine.pricePerStrip / medicine.tabletsPerStrip;
  const unit = getUnitName(medicine.formulation);
  const pack = getPackName(medicine.formulation);

  return (
    <div className="medicine-details">
      <button className="btn btn-outline" style={{ marginBottom: '24px' }} onClick={() => navigate('/inventory')}>
        <ArrowLeft size={18} /> Back to Inventory
      </button>

      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '20px' }}>
          <div style={{ width: '60px', height: '60px', borderRadius: '12px', backgroundColor: '#e0f2fe', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Activity size={32} />
          </div>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '4px' }}>{medicine.name} <span style={{ color: 'var(--text-secondary)', fontWeight: 'normal', fontSize: '20px' }}>({medicine.strength})</span></h1>
            <div style={{ color: 'var(--text-secondary)', fontSize: '14px', display: 'flex', gap: '12px', alignItems: 'center' }}>
              <span>{medicine.genericName}</span>
              <span style={{ color: '#cbd5e1' }}>|</span>
              <span className="badge badge-success">{medicine.category}</span>
              <span className="badge" style={{ backgroundColor: '#e2e8f0', color: 'var(--text-secondary)' }}>{medicine.formulation || 'N/A'}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3" style={{ gap: '24px', marginBottom: '32px' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <Package size={20} color="var(--primary-color)" style={{ marginTop: '2px' }} />
            <div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Current Stock</div>
              <div style={{ fontSize: '18px', fontWeight: '600', color: medicine.totalTablets < 30 ? 'var(--danger-color)' : 'inherit' }}>
                {getStockDisplay(medicine)}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>Total {medicine.totalTablets} {unit}s</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <IndianRupee size={20} color="var(--primary-color)" style={{ marginTop: '2px' }} />
            <div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Pricing Info</div>
              <div style={{ fontSize: '18px', fontWeight: '600' }}>₹{medicine.pricePerStrip.toFixed(2)} <span style={{ fontSize: '14px', fontWeight: '400', color: 'var(--text-secondary)' }}>/ {pack}</span></div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>₹{pricePerTab.toFixed(2)} per {unit} ({medicine.tabletsPerStrip} {unit}s/{pack})</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <Calendar size={20} color="var(--primary-color)" style={{ marginTop: '2px' }} />
            <div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Expiry Date</div>
              <div style={{ fontSize: '18px', fontWeight: '600', color: new Date(medicine.expiry) < new Date(new Date().setMonth(new Date().getMonth() + 2)) ? 'var(--danger-color)' : 'inherit' }}>
                {medicine.expiry}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Building2 size={20} color="var(--primary-color)" />
          Supplier / Dealer Information
        </h2>
        
        <div className="grid grid-cols-2" style={{ gap: '24px' }}>
          <div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Company Name</div>
            <div style={{ fontSize: '16px', fontWeight: '600' }}>{dealer.name}</div>
          </div>
          <div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Contact Person</div>
            <div style={{ fontSize: '16px', fontWeight: '500' }}>{dealer.contactPerson}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Phone size={18} color="var(--text-secondary)" />
            <span style={{ fontSize: '15px' }}>{dealer.phone}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Mail size={18} color="var(--text-secondary)" />
            <span style={{ fontSize: '15px' }}>{dealer.email}</span>
          </div>
        </div>

        <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--border-color)' }}>
          <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '16px', color: 'var(--text-secondary)' }}>Inventory Flow from this Dealer</h4>
          <div className="grid grid-cols-3" style={{ gap: '16px' }}>
            <div style={{ padding: '16px', backgroundColor: '#e0f2fe', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ fontSize: '13px', color: '#0369a1', marginBottom: '8px' }}>Total Purchased</div>
              <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--primary-color)' }}>{medicine.totalPurchasedTablets || medicine.totalTablets} <span style={{ fontSize: '12px', fontWeight: 'normal' }}>{unit}s</span></div>
            </div>
            <div style={{ padding: '16px', backgroundColor: '#fee2e2', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ fontSize: '13px', color: '#b91c1c', marginBottom: '8px' }}>Total Sold</div>
              <div style={{ fontSize: '20px', fontWeight: '700', color: '#ef4444' }}>{(medicine.totalPurchasedTablets || medicine.totalTablets) - medicine.totalTablets} <span style={{ fontSize: '12px', fontWeight: 'normal' }}>{unit}s</span></div>
            </div>
            <div style={{ padding: '16px', backgroundColor: '#d1fae5', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ fontSize: '13px', color: '#047857', marginBottom: '8px' }}>Current Stock</div>
              <div style={{ fontSize: '20px', fontWeight: '700', color: '#10b981' }}>{medicine.totalTablets} <span style={{ fontSize: '12px', fontWeight: 'normal' }}>{unit}s</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

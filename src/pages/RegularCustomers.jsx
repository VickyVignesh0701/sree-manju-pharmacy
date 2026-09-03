import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  HeartHandshake, Search, BellRing, Plus, 
  Mail, ShoppingCart, UserCheck, CheckCircle2, AlertTriangle, 
  X, Phone, Pill, AlertCircle
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';

const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).toLowerCase());
};

export default function RegularCustomers() {
  const { 
    regularPatients = [], 
    addOrUpdateRegularPatient, 
    sendRefillEmailReminder,
    showNotification,
    regularPatientsLoading,
    regularPatientsError
  } = useAppContext();

  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, due_alert, overdue, active
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedPatientForModal, setSelectedPatientForModal] = useState(null);
  const [modalError, setModalError] = useState('');
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form State for Adding / Editing Regular Customer
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    condition: 'Hypertension & Diabetes',
    regularMedicines: [],
    courseDays: 30,
    reminderDays: 25,
    notes: ''
  });

  const [medicineInput, setMedicineInput] = useState('');

  // Calculate Days Passed & Refill Status for each regular customer
  const enrichedPatients = regularPatients.map(patient => {
    const lastDate = patient.lastPurchaseDate ? new Date(patient.lastPurchaseDate) : new Date();
    const now = new Date();
    const diffTime = Math.abs(now - lastDate);
    const daysPassed = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    const courseDays = patient.courseDays || 30;
    const reminderDays = patient.reminderDays || 25;
    
    let alertStatus = 'active'; // active, due_alert, overdue
    if (daysPassed >= courseDays) {
      alertStatus = 'overdue';
    } else if (daysPassed >= reminderDays) {
      alertStatus = 'due_alert';
    }

    return {
      ...patient,
      daysPassed,
      alertStatus,
      daysRemaining: Math.max(0, courseDays - daysPassed)
    };
  });

  // Filtered List
  const filteredPatients = enrichedPatients.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                          p.phone.includes(search) || 
                          (p.condition && p.condition.toLowerCase().includes(search.toLowerCase()));
    
    if (filterStatus === 'all') return matchesSearch;
    if (filterStatus === 'due_alert') return matchesSearch && p.alertStatus === 'due_alert';
    if (filterStatus === 'overdue') return matchesSearch && p.alertStatus === 'overdue';
    if (filterStatus === 'active') return matchesSearch && p.alertStatus === 'active';
    return matchesSearch;
  });

  // Stats Counters
  const dueAlertCount = enrichedPatients.filter(p => p.alertStatus === 'due_alert').length;
  const overdueCount = enrichedPatients.filter(p => p.alertStatus === 'overdue').length;
  const activeCount = enrichedPatients.filter(p => p.alertStatus === 'active').length;

  const handleOpenAddModal = (p = null) => {
    setModalError('');
    setFormSubmitted(false);
    if (p) {
      setSelectedPatientForModal(p);
      setFormData({
        name: p.name || '',
        phone: p.phone || '',
        email: p.email || '',
        condition: p.condition || 'Chronic Care',
        regularMedicines: p.regularMedicines || [],
        courseDays: p.courseDays || 30,
        reminderDays: p.reminderDays || 25,
        notes: p.notes || ''
      });
    } else {
      setSelectedPatientForModal(null);
      setFormData({
        name: '',
        phone: '',
        email: '',
        condition: 'Hypertension & Diabetes',
        regularMedicines: [],
        courseDays: 30,
        reminderDays: 25,
        notes: ''
      });
    }
    setIsAddModalOpen(true);
  };

  const handleAddMedicineChip = () => {
    if (!medicineInput.trim()) return;
    if (!formData.regularMedicines.includes(medicineInput.trim())) {
      setFormData({
        ...formData,
        regularMedicines: [...formData.regularMedicines, medicineInput.trim()]
      });
    }
    setMedicineInput('');
  };

  const handleRemoveMedicineChip = (medName) => {
    setFormData({
      ...formData,
      regularMedicines: formData.regularMedicines.filter(m => m !== medName)
    });
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    setFormSubmitted(true);
    setModalError('');

    if (!formData.name.trim()) {
      setModalError('Patient Full Name is required.');
      return;
    }
    if (!formData.phone.trim() || formData.phone.trim().length !== 10) {
      setModalError('Valid 10-digit Mobile Phone Number is required.');
      return;
    }
    if (formData.email.trim() && !isValidEmail(formData.email)) {
      setModalError('Please enter a valid Email Address format.');
      return;
    }

    setIsSaving(true);
    const result = await addOrUpdateRegularPatient({
      id: selectedPatientForModal ? selectedPatientForModal.id : Date.now(),
      ...formData,
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      email: formData.email.trim().toLowerCase(),
      lastPurchaseDate: selectedPatientForModal?.lastPurchaseDate || new Date().toISOString()
    });
    setIsSaving(false);

    if (!result.success) {
      setModalError(result.error);
      return;
    }

    setIsAddModalOpen(false);
    setFormSubmitted(false);
    setModalError('');
  };

  const handleQuickRefillBill = (patient) => {
    navigate('/billing', { state: { prefillPatient: patient } });
    showNotification(`⚡ Loaded regular patient details for ${patient.name} into Billing POS!`);
  };

  return (
    <div className="regular-customers" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {regularPatientsError && (
        <div className="card" style={{ backgroundColor: '#fef2f2', border: '1px solid #fca5a5', color: '#991b1b', fontSize: '13px', fontWeight: '600' }}>
          ⚠️ {regularPatientsError}
        </div>
      )}
      {regularPatientsLoading && regularPatients.length === 0 && (
        <div className="card" style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
          Loading regular customers…
        </div>
      )}

      {/* Top Banner Alert / Welcome Card */}
      <div className="card" style={{ background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', color: 'white', borderRadius: '16px', padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: '8px', borderRadius: '10px' }}>
                <HeartHandshake size={24} color="#ffffff" />
              </div>
              <h2 style={{ fontSize: '20px', fontWeight: '700', margin: 0 }}>Regular & Chronic Care Patients</h2>
              <span style={{ backgroundColor: '#f59e0b', color: '#78350f', fontSize: '11px', fontWeight: '700', padding: '3px 10px', borderRadius: '20px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <BellRing size={12} /> 25-Day Auto-Alert active
              </span>
            </div>
            <p style={{ fontSize: '13.5px', color: '#e0f2fe', margin: 0, maxWidth: '650px' }}>
              Internal Pharmacy Refill Tracker. Automatically generates internal alert notifications for pharmacy staff & owner after 25 days (5 days before 30-day chronic medicine course runs out).
            </p>
          </div>

          <button 
            className="btn" 
            style={{ backgroundColor: '#ffffff', color: '#0369a1', fontWeight: '700', padding: '10px 20px', borderRadius: '10px', border: 'none', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', cursor: 'pointer' }}
            onClick={() => handleOpenAddModal()}
          >
            <Plus size={18} /> Register Regular Patient
          </button>
        </div>
      </div>

      {/* Overview Stat Widgets */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div className="card flex-between" style={{ padding: '16px 20px', borderLeft: '4px solid #0284c7' }}>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase' }}>Total Regular Patients</div>
            <div style={{ fontSize: '24px', fontWeight: '800', marginTop: '4px', color: '#0369a1' }}>{enrichedPatients.length}</div>
          </div>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284c7' }}>
            <UserCheck size={22} />
          </div>
        </div>

        <div className="card flex-between" style={{ padding: '16px 20px', borderLeft: '4px solid #f59e0b', backgroundColor: '#fffbe6' }}>
          <div>
            <div style={{ fontSize: '12px', color: '#b45309', fontWeight: '700', textTransform: 'uppercase' }}>⚡ 25-Day Refill Alerts Due</div>
            <div style={{ fontSize: '24px', fontWeight: '800', marginTop: '4px', color: '#d97706' }}>{dueAlertCount} Patients</div>
          </div>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706' }}>
            <BellRing size={22} />
          </div>
        </div>

        <div className="card flex-between" style={{ padding: '16px 20px', borderLeft: '4px solid #ef4444' }}>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase' }}>Overdue Course (&gt;30 Days)</div>
            <div style={{ fontSize: '24px', fontWeight: '800', marginTop: '4px', color: '#dc2626' }}>{overdueCount} Patients</div>
          </div>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
            <AlertTriangle size={22} />
          </div>
        </div>

        <div className="card flex-between" style={{ padding: '16px 20px', borderLeft: '4px solid #10b981' }}>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase' }}>Active Stocked Patients</div>
            <div style={{ fontSize: '24px', fontWeight: '800', marginTop: '4px', color: '#16a34a' }}>{activeCount} Patients</div>
          </div>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
            <CheckCircle2 size={22} />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card">
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between' }}>
          
          <div style={{ position: 'relative', width: '320px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-secondary)' }} />
            <input 
              type="text" 
              className="form-input" 
              placeholder="Search patient name, phone or medicine..." 
              style={{ paddingLeft: '36px' }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Filter Pills */}
          <div style={{ display: 'flex', gap: '8px' }}>
            {[
              { id: 'all', label: `All (${enrichedPatients.length})` },
              { id: 'due_alert', label: `⚡ 25-Day Alerts Due (${dueAlertCount})` },
              { id: 'overdue', label: `Overdue (${overdueCount})` },
              { id: 'active', label: `Active Supply (${activeCount})` }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                className={`btn ${filterStatus === tab.id ? 'btn-primary' : 'btn-outline'}`}
                style={{ fontSize: '12px', padding: '6px 12px', borderRadius: '20px' }}
                onClick={() => setFilterStatus(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

        </div>
      </div>

      {/* Regular Patients Table */}
      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Patient Details</th>
                <th>Chronic Condition</th>
                <th>Regular Monthly Medicines</th>
                <th>Last Billing Date</th>
                <th>30-Day Course Status</th>
                <th>Refill Alert Status</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPatients.map(patient => {
                const daysPct = Math.min(100, Math.round((patient.daysPassed / (patient.courseDays || 30)) * 100));

                return (
                  <tr key={patient.id} className="hover-row">
                    <td>
                      <div>
                        <div style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {patient.name}
                          <span style={{ fontSize: '10px', backgroundColor: '#e0f2fe', color: '#0369a1', fontWeight: '700', padding: '1px 6px', borderRadius: '4px' }}>
                            ⭐ VIP REGULAR
                          </span>
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Phone size={12} /> {patient.phone}
                          {patient.email && <span>• 📧 {patient.email}</span>}
                        </div>
                      </div>
                    </td>

                    <td>
                      <span className="badge" style={{ backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', fontWeight: '600' }}>
                        {patient.condition || 'General Regular Care'}
                      </span>
                    </td>

                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {patient.regularMedicines && patient.regularMedicines.length > 0 ? (
                          patient.regularMedicines.map((med, idx) => (
                            <div key={idx} style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--primary-color)', fontWeight: '600' }}>
                              <Pill size={12} /> {med}
                            </div>
                          ))
                        ) : (
                          <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>No specific medicine set</span>
                        )}
                      </div>
                    </td>

                    <td>
                      <div style={{ fontSize: '12.5px', fontWeight: '600' }}>
                        {new Date(patient.lastPurchaseDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                        {patient.daysPassed} days ago
                      </div>
                    </td>

                    {/* Progress Bar & Day Counter */}
                    <td style={{ minWidth: '160px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', fontWeight: '700', marginBottom: '4px' }}>
                        <span>Day {patient.daysPassed} of {patient.courseDays || 30}</span>
                        <span style={{ color: patient.daysRemaining <= 5 ? '#d97706' : '#16a34a' }}>
                          {patient.daysRemaining > 0 ? `${patient.daysRemaining} days left` : 'Finished'}
                        </span>
                      </div>
                      <div style={{ width: '100%', height: '7px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                        <div 
                          style={{ 
                            width: `${daysPct}%`, 
                            height: '100%', 
                            backgroundColor: patient.alertStatus === 'overdue' ? '#dc2626' : (patient.alertStatus === 'due_alert' ? '#f59e0b' : '#10b981'),
                            borderRadius: '4px',
                            transition: 'width 0.3s ease'
                          }} 
                        />
                      </div>
                    </td>

                    {/* Status Alert Badge */}
                    <td>
                      {patient.alertStatus === 'due_alert' && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '6px 10px', borderRadius: '20px', fontSize: '11.5px', fontWeight: '700', backgroundColor: '#fff7ed', color: '#c2410c', border: '1px solid #ffedd5', boxShadow: '0 0 10px rgba(245, 158, 11, 0.2)' }}>
                          <BellRing size={13} color="#c2410c" className="animate-pulse" /> ⚡ 25-Day Alert (Refill Due!)
                        </span>
                      )}
                      {patient.alertStatus === 'overdue' && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '6px 10px', borderRadius: '20px', fontSize: '11.5px', fontWeight: '700', backgroundColor: '#fef2f2', color: '#991b1b', border: '1px solid #fecdd3' }}>
                          <AlertTriangle size={13} color="#dc2626" /> Overdue (&gt;30 Days)
                        </span>
                      )}
                      {patient.alertStatus === 'active' && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '6px 10px', borderRadius: '20px', fontSize: '11.5px', fontWeight: '600', backgroundColor: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0' }}>
                          <CheckCircle2 size={13} color="#166534" /> Stocked (Day {patient.daysPassed})
                        </span>
                      )}
                    </td>

                    {/* Action Buttons */}
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                        
                        <button 
                          className="btn btn-outline" 
                          style={{ padding: '6px 10px', fontSize: '11.5px', display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#0284c7', borderColor: '#bae6fd' }}
                          title="Generate Internal Refill Email Alert for Pharmacy Owner/Staff"
                          onClick={() => sendRefillEmailReminder(patient)}
                        >
                          <Mail size={13} /> Staff Alert
                        </button>

                        <button 
                          className="btn btn-primary" 
                          style={{ padding: '6px 12px', fontSize: '11.5px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          onClick={() => handleQuickRefillBill(patient)}
                        >
                          <ShoppingCart size={13} /> Refill Bill
                        </button>

                        <button 
                          className="btn btn-outline" 
                          style={{ padding: '6px 8px', fontSize: '11.5px' }}
                          onClick={() => handleOpenAddModal(patient)}
                          title="Edit Regular Patient Details"
                        >
                          Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredPatients.length === 0 && (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                    No regular customers found. Click <strong>"Register Regular Patient"</strong> above to add one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Regular Patient Modal */}
      {isAddModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="card" style={{ width: '560px', maxWidth: '95vw', padding: '24px', borderRadius: '16px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)', backgroundColor: '#ffffff' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                <HeartHandshake size={20} color="var(--primary-color)" /> 
                {selectedPatientForModal ? 'Edit Regular Customer' : 'Register New Regular Customer'}
              </h3>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }} onClick={() => setIsAddModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            {/* Error Banner */}
            {modalError && (
              <div style={{ backgroundColor: '#fef2f2', border: '1px solid #f87171', borderRadius: '10px', padding: '10px 14px', marginBottom: '16px', color: '#991b1b', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={18} color="#dc2626" style={{ flexShrink: 0 }} />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitForm} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="form-label" style={{ fontSize: '12px', fontWeight: '600' }}>Patient Full Name *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. K. Rajagopal"
                    style={{ borderColor: formSubmitted && !formData.name.trim() ? '#ef4444' : 'var(--border-color)' }}
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '12px', fontWeight: '600' }}>Mobile (10 Digits) *</label>
                  <input 
                    type="tel" 
                    className="form-input" 
                    maxLength={10}
                    placeholder="10-digit mobile"
                    style={{ borderColor: formSubmitted && (!formData.phone.trim() || formData.phone.trim().length !== 10) ? '#ef4444' : 'var(--border-color)' }}
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="form-label" style={{ fontSize: '12px', fontWeight: '600' }}>Email Address (Optional)</label>
                  <input 
                    type="email" 
                    className="form-input" 
                    placeholder="patient@gmail.com"
                    style={{ textTransform: 'lowercase', borderColor: formSubmitted && formData.email.trim() && !isValidEmail(formData.email) ? '#ef4444' : 'var(--border-color)' }}
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value.toLowerCase() })}
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '12px', fontWeight: '600' }}>Chronic Health Condition</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. Hypertension & Diabetes"
                    value={formData.condition}
                    onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                  />
                </div>
              </div>

              {/* Regular Medicines Tag Input */}
              <div>
                <label className="form-label" style={{ fontSize: '12px', fontWeight: '600' }}>Regular Monthly Medicines</label>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Type medicine (e.g. Telmisartan 40mg)..."
                    value={medicineInput}
                    onChange={(e) => setMedicineInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddMedicineChip(); } }}
                  />
                  <button type="button" className="btn btn-outline" style={{ whiteSpace: 'nowrap' }} onClick={handleAddMedicineChip}>
                    + Add Med
                  </button>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {formData.regularMedicines.map((med, idx) => (
                    <span key={idx} style={{ fontSize: '12px', backgroundColor: '#e0f2fe', color: '#0369a1', padding: '4px 10px', borderRadius: '16px', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <Pill size={12} /> {med}
                      <X size={12} style={{ cursor: 'pointer' }} onClick={() => handleRemoveMedicineChip(med)} />
                    </span>
                  ))}
                </div>
              </div>

              {/* Refill Cycle Alert Days Config */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                <div>
                  <label className="form-label" style={{ fontSize: '11.5px', fontWeight: '600', color: 'var(--text-secondary)' }}>Full Supply Course Duration</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <input 
                      type="number" 
                      className="form-input" 
                      style={{ fontWeight: '700' }}
                      value={formData.courseDays}
                      onChange={(e) => setFormData({ ...formData, courseDays: Number(e.target.value) || 30 })}
                    />
                    <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>Days</span>
                  </div>
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '11.5px', fontWeight: '600', color: '#c2410c' }}>⚡ Reminder Alert Trigger</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <input 
                      type="number" 
                      className="form-input" 
                      style={{ fontWeight: '700', borderColor: '#fcd34d' }}
                      value={formData.reminderDays}
                      onChange={(e) => setFormData({ ...formData, reminderDays: Number(e.target.value) || 25 })}
                    />
                    <span style={{ fontSize: '12px', fontWeight: '600', color: '#c2410c' }}>Days</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '12px', fontWeight: '600' }}>Dosage Notes / Directions</label>
                <textarea 
                  className="form-input" 
                  rows="2" 
                  placeholder="e.g. Takes 1 tablet daily after breakfast"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setIsAddModalOpen(false)} disabled={isSaving}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ padding: '8px 24px', fontWeight: '700', opacity: isSaving ? 0.7 : 1 }} disabled={isSaving}>
                  {isSaving ? 'Saving…' : 'Save Regular Patient'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}

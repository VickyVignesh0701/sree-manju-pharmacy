import { useState } from 'react';
import { FlaskConical, Package, Search, Plus, X, Trash2, CheckCircle, AlertCircle } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export default function Formulations() {
  const { inventory, formulations = [], addFormulation, deleteFormulation, catalogLoading, catalogError } = useAppContext();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalError, setModalError] = useState('');
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newForm, setNewForm] = useState({ name: '', unitLabel: 'strip', description: '' });

  // Map inventory items to formulations
  const formulationMap = {};

  (formulations || []).forEach(form => {
    formulationMap[form.name] = {
      ...form,
      itemsCount: 0,
      medicines: []
    };
  });

  (inventory || []).forEach(item => {
    const fName = item.formulation || 'Tablet';
    if (!formulationMap[fName]) {
      formulationMap[fName] = {
        id: fName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        name: fName,
        unitLabel: 'unit',
        description: 'Pharmaceutical drug formulation',
        itemsCount: 0,
        medicines: []
      };
    }
    formulationMap[fName].itemsCount += 1;
    formulationMap[fName].medicines.push(item);
  });

  const formulationsList = Object.values(formulationMap).filter(f => 
    f.name.toLowerCase().includes(search.toLowerCase()) ||
    (f.description && f.description.toLowerCase().includes(search.toLowerCase())) ||
    (f.unitLabel && f.unitLabel.toLowerCase().includes(search.toLowerCase()))
  );

  const handleOpenModal = () => {
    setModalError('');
    setFormSubmitted(false);
    setNewForm({ name: '', unitLabel: 'strip', description: '' });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormSubmitted(true);
    setModalError('');

    if (!newForm.name || !newForm.name.trim()) {
      setModalError('Formulation Type Name is required! Please enter a formulation name.');
      return;
    }
    const existing = formulations.find(f => f.name.toLowerCase() === newForm.name.trim().toLowerCase());
    if (existing) {
      setModalError('This formulation type name already exists!');
      return;
    }

    setIsSaving(true);
    const result = await addFormulation({
      name: newForm.name.trim(),
      unitLabel: newForm.unitLabel.trim() || 'strip',
      description: newForm.description.trim() || 'Custom formulation type'
    });
    setIsSaving(false);

    if (!result.success) {
      setModalError(result.error);
      return;
    }

    setShowModal(false);
    setFormSubmitted(false);
    setModalError('');
    setNewForm({ name: '', unitLabel: 'strip', description: '' });
  };

  const handleDelete = async (id, name, itemsCount) => {
    if (itemsCount > 0) {
      alert(`Cannot delete "${name}" because there are currently ${itemsCount} medicine(s) using this formulation type.`);
      return;
    }
    if (window.confirm(`Are you sure you want to delete formulation type "${name}"?`)) {
      const result = await deleteFormulation(id, name);
      if (!result.success) {
        alert(result.error || `Could not delete "${name}".`);
      }
    }
  };

  return (
    <div className="formulations-page animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {catalogError && (
        <div className="card" style={{ backgroundColor: '#fef2f2', border: '1px solid #fca5a5', color: '#991b1b', fontSize: '13px', fontWeight: '600' }}>
          ⚠️ {catalogError}
        </div>
      )}
      {/* Header Card */}
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FlaskConical size={24} color="var(--primary-color)" />
            Formulation Types Management
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Define dosage forms (Tablets, Syrups, Injections, Ointments) available in medicine entry dropdowns.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ position: 'relative', width: '280px' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--text-secondary)' }} />
            <input 
              type="text" 
              className="form-input" 
              placeholder="Search formulations..." 
              style={{ paddingLeft: '38px', height: '38px' }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <button className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', height: '38px' }} onClick={handleOpenModal}>
            <Plus size={18} /> Add Formulation Type
          </button>
        </div>
      </div>

      {/* Formulations Grid */}
      <div className="grid grid-cols-3" style={{ gap: '20px' }}>
        {formulationsList.map(form => (
          <div key={form.id || form.name} className="card hover-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '20px', position: 'relative' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284c7' }}>
                    <FlaskConical size={20} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)' }}>{form.name}</h3>
                    <span style={{ fontSize: '11px', color: '#0284c7', backgroundColor: '#f0f9ff', border: '1px solid #bae6fd', padding: '1px 8px', borderRadius: '12px', fontWeight: '600' }}>
                      Unit: {form.unitLabel || 'unit'}
                    </span>
                  </div>
                </div>

                {form.itemsCount === 0 && form.id && (
                  <button 
                    onClick={() => handleDelete(form.id, form.name, form.itemsCount)} 
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '4px', borderRadius: '6px' }}
                    title="Delete Formulation"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>

              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5', marginBottom: '16px', minHeight: '38px' }}>
                {form.description}
              </p>
            </div>

            <div style={{ paddingTop: '14px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
              <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Package size={14} /> Active Medicines:
              </span>
              <span className="badge badge-primary" style={{ fontSize: '12px', fontWeight: '700', padding: '2px 8px' }}>
                {form.itemsCount} product{form.itemsCount === 1 ? '' : 's'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Add Formulation Popup Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal card animate-fade-in" style={{ width: '480px', backgroundColor: 'var(--surface-color)', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', padding: '24px' }}>
            <div className="flex-between" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284c7' }}>
                  <FlaskConical size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>Add New Formulation Type</h3>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Define custom dosage form packaging and unit classification</span>
                </div>
              </div>
              <button className="btn btn-outline" style={{ padding: '6px' }} onClick={() => setShowModal(false)}>
                <X size={16} />
              </button>
            </div>

            {/* Modal Error Alert Banner */}
            {modalError && (
              <div style={{
                backgroundColor: '#fef2f2',
                border: '1px solid #f87171',
                borderRadius: '10px',
                padding: '10px 14px',
                marginBottom: '16px',
                color: '#991b1b',
                fontSize: '13px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <AlertCircle size={18} color="#dc2626" style={{ flexShrink: 0 }} />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="form-label" style={{ fontWeight: '600', fontSize: '13px' }}>Formulation Type Name *</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Suspension, Powder, Sachet, Patch..." 
                  style={{
                    height: '40px',
                    fontSize: '14px',
                    borderColor: formSubmitted && !newForm.name.trim() ? '#ef4444' : 'var(--border-color)',
                    backgroundColor: formSubmitted && !newForm.name.trim() ? '#fef2f2' : '#ffffff'
                  }}
                  value={newForm.name} 
                  onChange={(e) => {
                    setNewForm({ ...newForm, name: e.target.value });
                    if (modalError && e.target.value.trim()) setModalError('');
                  }}
                  autoFocus
                />
                {formSubmitted && !newForm.name.trim() && (
                  <span style={{ fontSize: '11.5px', color: '#dc2626', fontWeight: '600', marginTop: '4px', display: 'block' }}>
                    ⚠️ Formulation Type Name is required.
                  </span>
                )}
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: '600', fontSize: '13px' }}>Default Package / Selling Unit</label>
                <select 
                  className="form-input" 
                  style={{ height: '40px', fontSize: '14px' }}
                  value={newForm.unitLabel} 
                  onChange={(e) => setNewForm({ ...newForm, unitLabel: e.target.value })}
                >
                  <option value="strip">Strip (Tablets / Capsules)</option>
                  <option value="bottle">Bottle (Syrups / Drops / Liquid)</option>
                  <option value="tube">Tube (Ointment / Gel / Cream)</option>
                  <option value="vial">Vial / Ampoule (Injections)</option>
                  <option value="sachet">Sachet / Pack (Powders / ORS)</option>
                  <option value="device">Device / Puff (Inhalers)</option>
                  <option value="box">Box / Kit</option>
                </select>
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: '600', fontSize: '13px' }}>Description / Clinical Usage</label>
                <textarea 
                  className="form-input" 
                  rows="3" 
                  placeholder="Brief description of dosage form packaging or administration..." 
                  style={{ resize: 'vertical' }}
                  value={newForm.description} 
                  onChange={(e) => setNewForm({ ...newForm, description: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)} disabled={isSaving}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', opacity: isSaving ? 0.7 : 1 }} disabled={isSaving}>
                  <CheckCircle size={16} /> {isSaving ? 'Saving…' : 'Save Formulation Type'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

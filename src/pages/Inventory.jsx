import { useState } from 'react';
import { Search, Plus, AlertCircle } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';

export default function Inventory() {
  const { inventory, formulations = [], addProduct, getStockDisplay, inventoryLoading, inventoryError } = useAppContext();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isFormulationOpen, setIsFormulationOpen] = useState(false);
  const [modalError, setModalError] = useState('');
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newProduct, setNewProduct] = useState({ 
    name: '', genericName: '', strength: '', category: 'Antibiotic', formulation: 'Tablet',
    tabletsPerStrip: 10, totalTablets: 500, 
    pricePerStrip: 45, expiry: '', dealer: 'Apollo Pharma Distributors', barcode: ''
  });

  const defaultFormList = ['Tablet', 'Capsule', 'Syrup', 'Ointment', 'Spray', 'Drops', 'Injection', 'Suspension', 'Powder', 'Inhaler'];
  const formulationsList = Array.from(new Set([
    ...formulations.map(f => f.name),
    ...defaultFormList,
    ...inventory.map(i => i.formulation).filter(Boolean)
  ]));

  const categoryOptions = [
    'Antibiotic', 'Analgesic', 'Respiratory', 'NSAID', 'Cardiovascular', 
    'Antidiabetic', 'Dermatology', 'Vitamins & Supplements', 'Gastrointestinal', 
    'Ophthalmic', 'Pain Relief', 'General Medicine'
  ];

  const categories = ['All', ...new Set([...categoryOptions, ...inventory.map(item => item.category).filter(Boolean)])];

  // Dynamic formulation helper for smart labels, placeholders & units
  const getFormulationMeta = (formulation) => {
    switch (formulation) {
      case 'Syrup':
        return {
          dosageLabel: 'Strength / Volume (ml / Litre)',
          dosagePlaceholder: 'e.g. 100ml, 200ml, 1 Litre',
          packLabel: 'Price per Bottle (₹)',
          unitsLabel: 'Bottles per Box / Pack',
          unitHelper: 'e.g. 1 bottle per box',
          stockLabel: 'Total Initial Stock (In Bottles)',
          unitSingle: 'bottle',
          unitPlural: 'bottles',
          isLiquidOrTube: true
        };
      case 'Ointment':
        return {
          dosageLabel: 'Strength / Weight (g / Grams)',
          dosagePlaceholder: 'e.g. 15g, 30g, 50g',
          packLabel: 'Price per Tube / Pack (₹)',
          unitsLabel: 'Tubes per Pack',
          unitHelper: 'e.g. 1 tube per box',
          stockLabel: 'Total Initial Stock (In Tubes)',
          unitSingle: 'tube',
          unitPlural: 'tubes',
          isLiquidOrTube: true
        };
      case 'Drops':
      case 'Spray':
      case 'Injection':
        return {
          dosageLabel: 'Strength / Volume (ml / Ampoule)',
          dosagePlaceholder: 'e.g. 2ml, 5ml, 10ml, 50ml',
          packLabel: 'Price per Vial / Ampoule (₹)',
          unitsLabel: 'Vials per Pack',
          unitHelper: 'e.g. 1 vial per pack',
          stockLabel: 'Total Initial Stock (In Vials/Units)',
          unitSingle: 'vial',
          unitPlural: 'vials',
          isLiquidOrTube: true
        };
      case 'Capsule':
        return {
          dosageLabel: 'Strength / Dosage (mg / mcg)',
          dosagePlaceholder: 'e.g. 250mg, 500mg',
          packLabel: 'Price per Strip / Pack (₹)',
          unitsLabel: 'Capsules per Strip',
          unitHelper: 'e.g. 10 capsules in 1 strip',
          stockLabel: 'Total Initial Stock (In Capsules)',
          unitSingle: 'capsule',
          unitPlural: 'capsules',
          isLiquidOrTube: false
        };
      default: // Tablet, Bandage, etc.
        return {
          dosageLabel: 'Strength / Dosage (mg / Volume)',
          dosagePlaceholder: 'e.g. 500mg, 650mg, 1000mg',
          packLabel: 'Price per Strip / Pack (₹)',
          unitsLabel: 'Tablets per Strip',
          unitHelper: 'e.g. 10 tablets in 1 strip',
          stockLabel: 'Total Initial Stock (In Tablets)',
          unitSingle: 'tablet',
          unitPlural: 'tablets',
          isLiquidOrTube: false
        };
    }
  };

  const currentMeta = getFormulationMeta(newProduct.formulation);

  // Auto-adjust tabletsPerStrip when switching to liquid/ointment if set to default 10
  const handleFormulationChange = (newForm) => {
    const meta = getFormulationMeta(newForm);
    setNewProduct(prev => ({
      ...prev,
      formulation: newForm,
      tabletsPerStrip: meta.isLiquidOrTube ? 1 : (prev.tabletsPerStrip === 1 ? 10 : prev.tabletsPerStrip)
    }));
  };

  const handleOpenModal = () => {
    setModalError('');
    setFormSubmitted(false);
    setNewProduct({ 
      name: '', genericName: '', strength: '', category: 'Antibiotic', formulation: 'Tablet',
      tabletsPerStrip: 10, totalTablets: 500, 
      pricePerStrip: 45, expiry: '', dealer: 'Apollo Pharma Distributors', barcode: ''
    });
    setShowModal(true);
  };

  const handleAddProduct = async () => {
    setFormSubmitted(true);
    setModalError('');

    const missingFields = [];
    if (!newProduct.name || !newProduct.name.trim()) missingFields.push('Medicine Trade Name');
    if (!newProduct.expiry) missingFields.push('Expiry Date');

    if (missingFields.length > 0) {
      setModalError(`Required field missing: ${missingFields.join(' & ')} is required before saving.`);
      return;
    }

    setIsSaving(true);
    const result = await addProduct({
      ...newProduct,
      tabletsPerStrip: Number(newProduct.tabletsPerStrip) || 1,
      pricePerStrip: Number(newProduct.pricePerStrip) || 0,
      totalTablets: Number(newProduct.totalTablets) || 0
    });
    setIsSaving(false);

    if (!result.success) {
      setModalError(result.error);
      return;
    }

    setShowModal(false);
    setModalError('');
    setFormSubmitted(false);
    setNewProduct({ 
      name: '', genericName: '', strength: '', category: 'Antibiotic', formulation: 'Tablet',
      tabletsPerStrip: 10, totalTablets: 0, 
      pricePerStrip: 0, expiry: '', dealer: '', barcode: ''
    });
  };

  const handleRowClick = (id) => {
    navigate(`/inventory/${id}`);
  };

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) || 
                          item.genericName.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Calculate live preview metrics
  const calculatedUnitPrice = (newProduct.pricePerStrip && newProduct.tabletsPerStrip) 
    ? (Number(newProduct.pricePerStrip) / Number(newProduct.tabletsPerStrip)).toFixed(2) 
    : '0.00';

  const calculatedStripsCount = (newProduct.totalTablets && newProduct.tabletsPerStrip) 
    ? Math.floor(Number(newProduct.totalTablets) / Number(newProduct.tabletsPerStrip)) 
    : 0;

  const calculatedLooseTabsCount = (newProduct.totalTablets && newProduct.tabletsPerStrip) 
    ? (Number(newProduct.totalTablets) % Number(newProduct.tabletsPerStrip)) 
    : 0;

  return (
    <div className="inventory">
      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="flex-between">
          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ position: 'relative', width: '300px' }}>
              <Search size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-secondary)' }} />
              <input 
                type="text" 
                className="form-input" 
                placeholder="Search medicines..." 
                style={{ paddingLeft: '38px' }}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            
            <select 
              className="form-input" 
              style={{ width: '200px', cursor: 'pointer' }}
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat === 'All' ? 'All Categories' : cat}</option>
              ))}
            </select>
          </div>
          
          <button className="btn btn-primary" onClick={handleOpenModal}>
            <Plus size={18} />
            Add New Medicine
          </button>
        </div>
      </div>

      {inventoryError && (
        <div className="card" style={{ marginBottom: '16px', backgroundColor: '#fef2f2', border: '1px solid #fca5a5', color: '#991b1b', fontSize: '13px', fontWeight: '600' }}>
          ⚠️ {inventoryError}
        </div>
      )}

      <div className="card">
        {inventoryLoading && inventory.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading inventory…</div>
        ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Medicine Name</th>
                <th>Category</th>
                <th>Price (Per Pack/Strip)</th>
                <th>Price (Per Unit)</th>
                <th>Units / Pack</th>
                <th>Current Stock</th>
                <th>Expiry Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredInventory.map(item => {
                const perTab = item.pricePerStrip / item.tabletsPerStrip;
                return (
                  <tr key={item.id} onClick={() => handleRowClick(item.id)} style={{ cursor: 'pointer' }} className="hover-row">
                    <td>
                      <div style={{ fontWeight: '600' }}>{item.name} <span style={{ fontWeight: 'normal', color: 'var(--text-secondary)' }}>({item.strength})</span></div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{item.genericName}</div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span className="badge badge-success">{item.category}</span>
                        <span className="badge" style={{ backgroundColor: '#e2e8f0', color: 'var(--text-secondary)' }}>{item.formulation || 'N/A'}</span>
                      </div>
                    </td>
                    <td>₹{Number(item.pricePerStrip).toFixed(2)}</td>
                    <td>₹{perTab.toFixed(2)}</td>
                    <td>{item.tabletsPerStrip}</td>
                    <td>
                      <span style={{ color: item.totalTablets < 30 ? 'var(--danger-color)' : 'inherit', fontWeight: item.totalTablets < 30 ? '600' : 'normal' }}>
                        {getStockDisplay(item)}
                      </span>
                    </td>
                    <td>
                      <span style={{ color: new Date(item.expiry) < new Date(new Date().setMonth(new Date().getMonth() + 2)) ? 'var(--danger-color)' : 'inherit' }}>
                        {item.expiry}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {filteredInventory.length === 0 && (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>
                    No medicines found matching "{search}"
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="modal card" style={{ width: '720px', maxWidth: '95vw', backgroundColor: '#ffffff', borderRadius: '16px', padding: '28px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}>
            
            {/* Modal Header */}
            <div className="flex-between" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  💊 Add New Medicine
                </h3>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px', display: 'block' }}>
                  Enter medicine specifications, pricing breakdown, and initial inventory stock.
                </span>
              </div>
              <button 
                type="button"
                style={{ background: '#f1f5f9', border: 'none', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} 
                onClick={() => setShowModal(false)}
              >
                ✕
              </button>
            </div>

            {/* Error Validation Banner */}
            {modalError && (
              <div style={{
                backgroundColor: '#fef2f2',
                border: '1px solid #f87171',
                borderRadius: '10px',
                padding: '12px 16px',
                marginBottom: '16px',
                color: '#991b1b',
                fontSize: '13px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                boxShadow: '0 2px 4px rgba(239, 68, 68, 0.1)'
              }}>
                <AlertCircle size={20} color="#dc2626" style={{ flexShrink: 0 }} />
                <div style={{ flex: 1 }}>{modalError}</div>
              </div>
            )}

            {/* 2-Column Responsive Form Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 20px', maxHeight: '72vh', overflowY: 'auto', paddingRight: '6px' }}>
              
              {/* Medicine Name */}
              <div style={{ gridColumn: 'span 2' }}>
                <label className="form-label" style={{ fontWeight: '600', fontSize: '13px' }}>Medicine Trade Name *</label>
                <input 
                  type="text"
                  className="form-input" 
                  placeholder="e.g. Amoxicillin 500mg / Dolo 650mg"
                  style={{ 
                    height: '40px', 
                    fontSize: '14px',
                    borderColor: formSubmitted && !newProduct.name.trim() ? '#ef4444' : 'var(--border-color)',
                    backgroundColor: formSubmitted && !newProduct.name.trim() ? '#fef2f2' : '#ffffff'
                  }}
                  value={newProduct.name} 
                  onChange={(e) => {
                    setNewProduct({...newProduct, name: e.target.value});
                    if (modalError && e.target.value.trim()) setModalError('');
                  }} 
                  autoFocus
                />
                {formSubmitted && !newProduct.name.trim() && (
                  <span style={{ fontSize: '11.5px', color: '#dc2626', fontWeight: '600', marginTop: '4px', display: 'block' }}>
                    ⚠️ Medicine Trade Name is required.
                  </span>
                )}
              </div>

              {/* Generic Name */}
              <div>
                <label className="form-label" style={{ fontWeight: '600', fontSize: '13px' }}>Generic / Chemical Name</label>
                <input 
                  type="text"
                  className="form-input" 
                  placeholder="e.g. Amoxicillin Trihydrate"
                  value={newProduct.genericName} 
                  onChange={(e) => setNewProduct({...newProduct, genericName: e.target.value})} 
                />
              </div>

              {/* Strength / Volume */}
              <div>
                <label className="form-label" style={{ fontWeight: '600', fontSize: '13px' }}>{currentMeta.dosageLabel}</label>
                <input 
                  type="text"
                  className="form-input" 
                  placeholder={currentMeta.dosagePlaceholder}
                  value={newProduct.strength} 
                  onChange={(e) => setNewProduct({...newProduct, strength: e.target.value})} 
                />
              </div>

              {/* Category Dropdown with Scroll */}
              <div style={{ position: 'relative' }}>
                <label className="form-label" style={{ fontWeight: '600', fontSize: '13px' }}>Category *</label>
                <div 
                  onClick={() => { setIsCategoryOpen(!isCategoryOpen); setIsFormulationOpen(false); }}
                  className="form-input"
                  style={{
                    display: 'flex',
                    justify: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                    backgroundColor: '#fff',
                    fontSize: '13.5px',
                    fontWeight: '500',
                    userSelect: 'none'
                  }}
                >
                  <span>{newProduct.category}</span>
                  <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>▼</span>
                </div>

                {isCategoryOpen && (
                  <>
                    <div style={{ position: 'fixed', inset: 0, zIndex: 999 }} onClick={() => setIsCategoryOpen(false)} />
                    <div 
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        marginTop: '4px',
                        maxHeight: '180px',
                        overflowY: 'auto',
                        backgroundColor: '#ffffff',
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px',
                        boxShadow: '0 10px 20px rgba(0,0,0,0.15)',
                        zIndex: 1000,
                        padding: '4px'
                      }}
                    >
                      {categoryOptions.map(cat => (
                        <div
                          key={cat}
                          onClick={() => {
                            setNewProduct({ ...newProduct, category: cat });
                            setIsCategoryOpen(false);
                          }}
                          style={{
                            padding: '8px 12px',
                            fontSize: '13px',
                            fontWeight: newProduct.category === cat ? '700' : '500',
                            color: newProduct.category === cat ? 'var(--primary-color)' : 'var(--text-primary)',
                            backgroundColor: newProduct.category === cat ? '#f0fdf4' : 'transparent',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'flex',
                            justify: 'space-between',
                            alignItems: 'center'
                          }}
                          onMouseEnter={(e) => { if (newProduct.category !== cat) e.currentTarget.style.backgroundColor = '#f8fafc'; }}
                          onMouseLeave={(e) => { if (newProduct.category !== cat) e.currentTarget.style.backgroundColor = 'transparent'; }}
                        >
                          <span>{cat}</span>
                          {newProduct.category === cat && <span style={{ color: 'var(--primary-color)', fontWeight: 'bold' }}>✓</span>}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Formulation Type Dropdown with Scroll */}
              <div style={{ position: 'relative' }}>
                <label className="form-label" style={{ fontWeight: '600', fontSize: '13px' }}>Formulation Type *</label>
                <div 
                  onClick={() => { setIsFormulationOpen(!isFormulationOpen); setIsCategoryOpen(false); }}
                  className="form-input"
                  style={{
                    display: 'flex',
                    justify: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                    backgroundColor: '#fff',
                    fontSize: '13.5px',
                    fontWeight: '600',
                    color: 'var(--primary-color)',
                    userSelect: 'none'
                  }}
                >
                  <span>{newProduct.formulation}</span>
                  <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>▼</span>
                </div>

                {isFormulationOpen && (
                  <>
                    <div style={{ position: 'fixed', inset: 0, zIndex: 999 }} onClick={() => setIsFormulationOpen(false)} />
                    <div 
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        marginTop: '4px',
                        maxHeight: '180px',
                        overflowY: 'auto',
                        backgroundColor: '#ffffff',
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px',
                        boxShadow: '0 10px 20px rgba(0,0,0,0.15)',
                        zIndex: 1000,
                        padding: '4px'
                      }}
                    >
                      {formulationsList.map(form => (
                        <div
                          key={form}
                          onClick={() => {
                            handleFormulationChange(form);
                            setIsFormulationOpen(false);
                          }}
                          style={{
                            padding: '8px 12px',
                            fontSize: '13px',
                            fontWeight: newProduct.formulation === form ? '700' : '500',
                            color: newProduct.formulation === form ? 'var(--primary-color)' : 'var(--text-primary)',
                            backgroundColor: newProduct.formulation === form ? '#f0fdf4' : 'transparent',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'flex',
                            justify: 'space-between',
                            alignItems: 'center'
                          }}
                          onMouseEnter={(e) => { if (newProduct.formulation !== form) e.currentTarget.style.backgroundColor = '#f8fafc'; }}
                          onMouseLeave={(e) => { if (newProduct.formulation !== form) e.currentTarget.style.backgroundColor = 'transparent'; }}
                        >
                          <span>{form}</span>
                          {newProduct.formulation === form && <span style={{ color: 'var(--primary-color)', fontWeight: 'bold' }}>✓</span>}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Units per Strip/Pack */}
              <div>
                <label className="form-label" style={{ fontWeight: '600', fontSize: '13px' }}>{currentMeta.unitsLabel}</label>
                <input 
                  type="number" 
                  className="form-input" 
                  placeholder="10"
                  value={newProduct.tabletsPerStrip} 
                  onChange={(e) => setNewProduct({...newProduct, tabletsPerStrip: Number(e.target.value)})} 
                />
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px', display: 'block' }}>{currentMeta.unitHelper}</span>
              </div>

              {/* Price per Strip/Pack */}
              <div>
                <label className="form-label" style={{ fontWeight: '600', fontSize: '13px' }}>{currentMeta.packLabel}</label>
                <input 
                  type="number" 
                  className="form-input" 
                  placeholder="45"
                  value={newProduct.pricePerStrip} 
                  onChange={(e) => setNewProduct({...newProduct, pricePerStrip: Number(e.target.value)})} 
                />
                <div style={{ fontSize: '11px', color: 'var(--primary-color)', fontWeight: '600', marginTop: '4px' }}>
                  ⚡ Rate: ₹{calculatedUnitPrice} / {currentMeta.unitSingle}
                </div>
              </div>

              {/* Total Initial Stock */}
              <div>
                <label className="form-label" style={{ fontWeight: '600', fontSize: '13px' }}>{currentMeta.stockLabel}</label>
                <input 
                  type="number" 
                  className="form-input" 
                  placeholder="500"
                  value={newProduct.totalTablets} 
                  onChange={(e) => setNewProduct({...newProduct, totalTablets: Number(e.target.value)})} 
                />
                <div style={{ fontSize: '11px', color: 'var(--success-color)', fontWeight: '600', marginTop: '4px' }}>
                  📦 Stock Summary: {currentMeta.isLiquidOrTube ? `${newProduct.totalTablets} ${currentMeta.unitPlural}` : `${calculatedStripsCount} strips${calculatedLooseTabsCount > 0 ? `, ${calculatedLooseTabsCount} loose ${currentMeta.unitPlural}` : ''}`}
                </div>
              </div>

              {/* Expiry Date */}
              <div>
                <label className="form-label" style={{ fontWeight: '600', fontSize: '13px' }}>Expiry Date *</label>
                <input 
                  type="date" 
                  className="form-input" 
                  style={{
                    borderColor: formSubmitted && !newProduct.expiry ? '#ef4444' : 'var(--border-color)',
                    backgroundColor: formSubmitted && !newProduct.expiry ? '#fef2f2' : '#ffffff'
                  }}
                  value={newProduct.expiry} 
                  onChange={(e) => {
                    setNewProduct({...newProduct, expiry: e.target.value});
                    if (modalError && e.target.value) setModalError('');
                  }} 
                />
                {formSubmitted && !newProduct.expiry && (
                  <span style={{ fontSize: '11.5px', color: '#dc2626', fontWeight: '600', marginTop: '4px', display: 'block' }}>
                    ⚠️ Expiry Date is required.
                  </span>
                )}
              </div>

              {/* Dealer / Supplier */}
              <div>
                <label className="form-label" style={{ fontWeight: '600', fontSize: '13px' }}>Supplier / Dealer Name</label>
                <input 
                  type="text"
                  className="form-input" 
                  placeholder="e.g. Apollo Pharma Distributors / Sun Pharma Supply"
                  value={newProduct.dealer} 
                  onChange={(e) => setNewProduct({...newProduct, dealer: e.target.value})} 
                />
              </div>

              {/* Barcode - lets this medicine be scanned straight into the
                  Billing cart. Optional; scan a real barcode if you have a
                  hardware scanner (it types into whatever field is focused). */}
              <div>
                <label className="form-label" style={{ fontWeight: '600', fontSize: '13px' }}>Barcode (optional)</label>
                <input 
                  type="text"
                  className="form-input" 
                  placeholder="Scan or type the barcode"
                  value={newProduct.barcode || ''} 
                  onChange={(e) => setNewProduct({...newProduct, barcode: e.target.value.trim()})} 
                />
              </div>
            </div>

            {/* Modal Footer Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
              <button className="btn btn-outline" style={{ padding: '8px 20px', borderRadius: '8px' }} onClick={() => setShowModal(false)} disabled={isSaving}>
                Cancel
              </button>
              <button className="btn btn-primary" style={{ padding: '8px 24px', borderRadius: '8px', fontWeight: '600', opacity: isSaving ? 0.7 : 1 }} onClick={handleAddProduct} disabled={isSaving}>
                {isSaving ? 'Saving…' : 'Save Medicine to Inventory'}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

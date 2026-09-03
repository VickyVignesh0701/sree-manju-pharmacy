import { useState } from 'react';
import { Tags, Package, Search, ChevronRight, Plus, X, CheckCircle, FolderPlus, AlertCircle } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';

export default function Categories() {
  const { inventory, categories = [], addCategory, catalogLoading, catalogError } = useAppContext();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalError, setModalError] = useState('');
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newCat, setNewCat] = useState({ name: '', description: '' });

  // Map inventory items to categories
  const categoriesMap = {};

  // First seed with registered categories
  (categories || []).forEach(cat => {
    const catName = typeof cat === 'string' ? cat : cat.name;
    categoriesMap[catName] = {
      name: catName,
      description: cat.description || 'Pharmacy Medicine Category',
      itemsCount: 0,
      totalStock: 0,
      medicines: []
    };
  });

  // Then populate with actual inventory items
  (inventory || []).forEach(item => {
    const cat = item.category || 'Uncategorized';
    if (!categoriesMap[cat]) {
      categoriesMap[cat] = {
        name: cat,
        description: 'Pharmacy Medicine Category',
        itemsCount: 0,
        totalStock: 0,
        medicines: []
      };
    }
    categoriesMap[cat].itemsCount += 1;
    categoriesMap[cat].totalStock += item.totalTablets;
    categoriesMap[cat].medicines.push(item);
  });

  const categoriesList = Object.values(categoriesMap).filter(cat => 
    cat.name.toLowerCase().includes(search.toLowerCase()) ||
    (cat.description && cat.description.toLowerCase().includes(search.toLowerCase()))
  );

  const handleOpenModal = () => {
    setModalError('');
    setFormSubmitted(false);
    setNewCat({ name: '', description: '' });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormSubmitted(true);
    setModalError('');

    if (!newCat.name || !newCat.name.trim()) {
      setModalError('Category Name is required! Please enter a category name.');
      return;
    }
    if (categoriesMap[newCat.name.trim()]) {
      setModalError('This category name already exists!');
      return;
    }

    setIsSaving(true);
    const result = await addCategory({ name: newCat.name.trim(), description: newCat.description.trim() });
    setIsSaving(false);

    if (!result.success) {
      setModalError(result.error);
      return;
    }

    setShowModal(false);
    setFormSubmitted(false);
    setModalError('');
    setNewCat({ name: '', description: '' });
  };

  return (
    <div className="categories-page animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {catalogError && (
        <div className="card" style={{ backgroundColor: '#fef2f2', border: '1px solid #fca5a5', color: '#991b1b', fontSize: '13px', fontWeight: '600' }}>
          ⚠️ {catalogError}
        </div>
      )}
      {/* Header Card */}
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Tags size={24} color="var(--primary-color)" />
            Medicine Categories
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Organize pharmaceutical stock by therapeutic classification and drug formulations.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ position: 'relative', width: '280px' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--text-secondary)' }} />
            <input 
              type="text" 
              className="form-input" 
              placeholder="Search categories..." 
              style={{ paddingLeft: '38px', height: '38px' }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <button className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', height: '38px' }} onClick={handleOpenModal}>
            <Plus size={18} /> Add Category
          </button>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-3" style={{ gap: '20px' }}>
        {categoriesList.map(category => (
          <div key={category.name} className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div className="flex-between" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '14px', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '46px', height: '46px', borderRadius: '12px', backgroundColor: '#e0f2fe', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Tags size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: '17px', fontWeight: '700' }}>{category.name}</h3>
                  <span className="badge badge-success" style={{ fontSize: '11px', marginTop: '2px', backgroundColor: category.itemsCount > 0 ? '#ecfdf5' : '#f1f5f9', color: category.itemsCount > 0 ? '#15803d' : '#64748b' }}>
                    {category.itemsCount} {category.itemsCount === 1 ? 'medicine' : 'medicines'}
                  </span>
                </div>
              </div>
            </div>

            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '14px', lineHeight: '1.4' }}>
              {category.description}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
              <div className="flex-between" style={{ fontSize: '13px', backgroundColor: '#f8fafc', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Package size={15} /> Total Stock Units:
                </span>
                <span style={{ fontWeight: '700', color: category.totalStock > 0 ? 'var(--text-primary)' : 'var(--danger-color)' }}>
                  {category.totalStock} units
                </span>
              </div>
              
              <div style={{ marginTop: '4px' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Included Items ({category.medicines.length}):
                </div>
                
                {category.medicines.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {category.medicines.slice(0, 3).map(med => (
                      <div key={med.id} className="flex-between" style={{ fontSize: '12px', padding: '6px 10px', backgroundColor: '#ffffff', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '160px', fontWeight: '500' }}>{med.name}</span>
                        <span style={{ color: 'var(--text-secondary)', fontWeight: '600' }}>{med.totalTablets} left</span>
                      </div>
                    ))}
                    {category.medicines.length > 3 && (
                      <div style={{ fontSize: '11px', color: 'var(--primary-color)', textAlign: 'center', marginTop: '2px', fontWeight: '500' }}>
                        + {category.medicines.length - 3} more medicines
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontStyle: 'italic', padding: '12px', textAlign: 'center', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px dashed var(--border-color)' }}>
                    No medicines in this category yet.
                  </div>
                )}
              </div>
            </div>

            <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
              <button 
                className="btn btn-outline" 
                style={{ width: '100%', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px' }}
                onClick={() => navigate('/inventory')}
              >
                View in Inventory <ChevronRight size={16} />
              </button>
            </div>
          </div>
        ))}

        {categoriesList.length === 0 && (
          <div style={{ gridColumn: 'span 3', textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
            No categories found matching "{search}".
          </div>
        )}
      </div>

      {/* Add Category Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal card animate-fade-in" style={{ width: '480px', backgroundColor: 'var(--surface-color)', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            <div className="flex-between" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-color)' }}>
                  <FolderPlus size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: '700' }}>Add New Medicine Category</h3>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Create therapeutic or formulation category</span>
                </div>
              </div>
              <button className="btn btn-outline" style={{ padding: '6px' }} onClick={() => setShowModal(false)}><X size={16} /></button>
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
                <label className="form-label">Category Name *</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Cardiovascular, Dermatology, Antidiabetic" 
                  style={{
                    borderColor: formSubmitted && !newCat.name.trim() ? '#ef4444' : 'var(--border-color)',
                    backgroundColor: formSubmitted && !newCat.name.trim() ? '#fef2f2' : '#ffffff'
                  }}
                  value={newCat.name}
                  onChange={(e) => {
                    setNewCat({ ...newCat, name: e.target.value });
                    if (modalError && e.target.value.trim()) setModalError('');
                  }}
                  autoFocus
                />
                {formSubmitted && !newCat.name.trim() && (
                  <span style={{ fontSize: '11.5px', color: '#dc2626', fontWeight: '600', marginTop: '4px', display: 'block' }}>
                    ⚠️ Category Name is required.
                  </span>
                )}
              </div>

              <div>
                <label className="form-label">Description / Notes</label>
                <textarea 
                  className="form-input" 
                  rows="3"
                  placeholder="e.g. Medications for blood pressure, cardiac care, and lipid management" 
                  style={{ resize: 'vertical' }}
                  value={newCat.description}
                  onChange={(e) => setNewCat({ ...newCat, description: e.target.value })}
                ></textarea>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)} disabled={isSaving}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', opacity: isSaving ? 0.7 : 1 }} disabled={isSaving}>
                  <CheckCircle size={16} /> {isSaving ? 'Saving…' : 'Save Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

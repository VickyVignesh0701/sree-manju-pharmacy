import { useState } from 'react';
import { Search, Filter, Printer, Calendar, RotateCcw, CheckCircle2, AlertTriangle, X, CreditCard, QrCode, Banknote, Pill } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export default function SalesLog() {
  const { sales, getUnitName, returnSale } = useAppContext();
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Return Confirmation Modal State
  const [saleToReturn, setSaleToReturn] = useState(null);

  const filteredSales = sales.filter(sale => {
    const patientName = sale.patient?.name?.toLowerCase() || 'walk-in customer';
    const medNames = sale.items?.map(i => i.name?.toLowerCase()).join(' ') || '';
    const matchesSearch = patientName.includes(search.toLowerCase()) || 
                          medNames.includes(search.toLowerCase()) ||
                          (sale.patient?.phone && sale.patient.phone.includes(search));
    
    let matchesDate = true;
    if (dateFilter !== 'all') {
      const saleDate = new Date(sale.date);
      const today = new Date();
      if (dateFilter === 'today') {
        matchesDate = saleDate.toDateString() === today.toDateString();
      } else if (dateFilter === 'month') {
        matchesDate = saleDate.getMonth() === today.getMonth() && saleDate.getFullYear() === today.getFullYear();
      } else if (dateFilter === 'year') {
        matchesDate = saleDate.getFullYear() === today.getFullYear();
      } else if (dateFilter === 'custom') {
        if (startDate && endDate) {
          const start = new Date(startDate);
          start.setHours(0,0,0,0);
          const end = new Date(endDate);
          end.setHours(23,59,59,999);
          matchesDate = saleDate >= start && saleDate <= end;
        }
      }
    }
    return matchesSearch && matchesDate;
  });

  const handleConfirmReturn = () => {
    if (!saleToReturn) return;
    const success = returnSale(saleToReturn.id);
    if (success) {
      setSaleToReturn(null);
    }
  };

  const handlePrint = (sale) => {
    const printWindow = window.open('', '_blank');
    const date = new Date(sale.date).toLocaleString();
    let itemsHtml = '';
    
    const subtotal = sale.subtotal || sale.items.reduce((sum, item) => sum + ((item.pricePerStrip / item.tabletsPerStrip) * item.quantity), 0);
    const tax = sale.tax || (subtotal * 0.05);
    const discountAmount = sale.discountAmount || ((subtotal + tax) - sale.totalAmount);

    sale.items.forEach(item => {
      const pricePerTab = item.pricePerStrip / item.tabletsPerStrip;
      const unit = getUnitName(item.formulation);
      itemsHtml += `
        <tr>
          <td style="padding: 8px; border-bottom: 1px dashed #ccc;">${item.name}</td>
          <td style="padding: 8px; border-bottom: 1px dashed #ccc; text-align: center;">${item.quantity} ${unit}s</td>
          <td style="padding: 8px; border-bottom: 1px dashed #ccc; text-align: right;">₹${pricePerTab.toFixed(2)}</td>
          <td style="padding: 8px; border-bottom: 1px dashed #ccc; text-align: right;">₹${(pricePerTab * item.quantity).toFixed(2)}</td>
        </tr>
      `;
    });

    const html = `
      <html>
        <head>
          <title>Receipt - Sree Manju Pharmacy</title>
          <style>
            body { font-family: 'Arial', sans-serif; padding: 40px; color: #333; max-width: 600px; margin: 0 auto; }
            h1 { text-align: center; color: #0ea5e9; margin-bottom: 5px; }
            .header-text { text-align: center; font-size: 14px; color: #666; margin-bottom: 30px; }
            .patient-info { margin-bottom: 30px; padding: 15px; background: #f8fafc; border-radius: 8px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            th { text-align: left; padding: 8px; border-bottom: 2px solid #ddd; color: #666; }
            .totals { width: 50%; float: right; margin-bottom: 40px; }
            .totals div { display: flex; justify-content: space-between; padding: 8px 0; }
            .totals .final { font-weight: bold; font-size: 18px; border-top: 2px solid #ddd; margin-top: 10px; padding-top: 10px; }
            .footer { clear: both; text-align: center; font-size: 12px; color: #666; margin-top: 50px; border-top: 1px solid #ddd; padding-top: 20px; }
            @media print {
              .no-print { display: none !important; }
            }
          </style>
        </head>
        <body>
          <h1>Sree Manju Pharmacy</h1>
          <div class="header-text">
            123 Health Street, Medical District, Chennai<br/>
            GSTIN: 33AAAAA0000A1Z5 | Ph: +91 98765 12345
          </div>
          
          <div class="patient-info">
            <strong>Patient Name:</strong> ${sale.patient?.name || 'Walk-in Customer'}<br/>
            <strong>Phone:</strong> ${sale.patient?.phone || 'N/A'}<br/>
            <strong>Payment Mode:</strong> ${sale.paymentMode || 'Cash'}<br/>
            <strong>Date:</strong> ${date}
          </div>

          <table>
            <thead>
              <tr>
                <th>Medicine</th>
                <th style="text-align: center;">Qty</th>
                <th style="text-align: right;">Rate</th>
                <th style="text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div class="totals">
            <div><span>Subtotal:</span> <span>₹${subtotal.toFixed(2)}</span></div>
            ${discountAmount > 0 ? `<div style="color: #10b981;"><span>Discount:</span> <span>- ₹${discountAmount.toFixed(2)}</span></div>` : ''}
            <div><span>GST (5%):</span> <span>₹${tax.toFixed(2)}</span></div>
            <div class="final"><span>Total:</span> <span>₹${sale.totalAmount.toFixed(2)}</span></div>
          </div>

          <div class="footer">
            Thank you for your visit! Wishing you good health.<br/>
            This is a computer generated invoice.
          </div>
          
          <div class="no-print" style="text-align: center; margin-top: 40px; border-top: 1px dashed #ccc; padding-top: 20px;">
            <button onclick="window.print()" style="padding: 10px 24px; font-size: 16px; background-color: #0ea5e9; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">Print Receipt</button>
            <button onclick="window.close()" style="padding: 10px 24px; font-size: 16px; background-color: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; border-radius: 6px; cursor: pointer; margin-left: 12px; font-weight: 600;">Close</button>
          </div>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
  };

  return (
    <div className="sales-log">
      <div className="card" style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>Sales Log & Receipt Reprinting</h2>
        
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', width: '280px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-secondary)' }} />
            <input 
              type="text" 
              className="form-input" 
              placeholder="Search by patient, phone or medicine..." 
              style={{ paddingLeft: '36px' }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Filter size={16} color="var(--text-secondary)" />
            <select 
              className="form-input" 
              style={{ cursor: 'pointer', width: '150px' }}
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
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <input type="date" className="form-input" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              <span style={{ color: 'var(--text-secondary)' }}>to</span>
              <input type="date" className="form-input" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Patient Name</th>
                <th>Medicines Purchased</th>
                <th>Payment Mode</th>
                <th>Total Amount</th>
                <th>Status</th>
                <th style={{ textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredSales.map(sale => {
                const isReturned = sale.status === 'Returned';
                const pMode = sale.paymentMode || 'Cash';
                return (
                  <tr key={sale.id} className="hover-row" style={{ backgroundColor: isReturned ? '#fef2f2' : 'transparent' }}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                        <Calendar size={14} color="var(--text-secondary)" />
                        {new Date(sale.date).toLocaleString()}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: '600', fontSize: '13px' }}>{sale.patient?.name || 'Walk-in Customer'}</div>
                    </td>
                    
                    {/* Medicines Purchased List */}
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {sale.items && sale.items.map((item, idx) => (
                          <div key={idx} style={{ fontSize: '12.5px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <Pill size={13} color="var(--primary-color)" />
                            <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{item.name}</span>
                            <span style={{ color: 'var(--text-secondary)', fontSize: '11px', backgroundColor: '#f1f5f9', padding: '1px 6px', borderRadius: '4px' }}>
                              {item.quantity} {(item.unitType || 'strip')}{item.quantity > 1 ? 's' : ''}
                            </span>
                          </div>
                        ))}
                      </div>
                    </td>

                    {/* Payment Mode Badge */}
                    <td>
                      {(() => {
                        if (pMode.includes('UPI')) {
                          return (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '20px', fontSize: '11.5px', fontWeight: '600', backgroundColor: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0' }}>
                              <QrCode size={13} color="#166534" /> UPI / QR
                            </span>
                          );
                        }
                        if (pMode.includes('Card')) {
                          return (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '20px', fontSize: '11.5px', fontWeight: '600', backgroundColor: '#eff6ff', color: '#1e40af', border: '1px solid #bfdbfe' }}>
                              <CreditCard size={13} color="#1e40af" /> Card
                            </span>
                          );
                        }
                        return (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '20px', fontSize: '11.5px', fontWeight: '600', backgroundColor: '#fff7ed', color: '#c2410c', border: '1px solid #ffedd5' }}>
                            <Banknote size={13} color="#c2410c" /> Cash
                          </span>
                        );
                      })()}
                    </td>

                    <td><span style={{ fontWeight: '700', fontSize: '14px', color: isReturned ? '#991b1b' : 'var(--primary-color)' }}>₹{sale.totalAmount.toFixed(2)}</span></td>
                    
                    <td>
                      {isReturned ? (
                        <span className="badge badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 8px' }}>
                          <RotateCcw size={12} /> Returned
                        </span>
                      ) : (
                        <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 8px' }}>
                          <CheckCircle2 size={12} /> Completed
                        </span>
                      )}
                    </td>

                    <td style={{ textAlign: 'center', display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button 
                        className="btn btn-outline" 
                        style={{ padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }} 
                        onClick={() => handlePrint(sale)}
                      >
                        <Printer size={14} /> Reprint
                      </button>
                      
                      {!isReturned ? (
                        <button 
                          className="btn btn-outline" 
                          style={{ padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--danger-color)', borderColor: '#fca5a5' }} 
                          onClick={() => setSaleToReturn(sale)}
                        >
                          <RotateCcw size={14} /> Return
                        </button>
                      ) : (
                        <span style={{ fontSize: '12px', color: '#991b1b', fontStyle: 'italic', display: 'flex', alignItems: 'center' }}>
                          Refunded
                        </span>
                      )}
                    </td>
                  </tr>
                );
              }).reverse()}
              {filteredSales.length === 0 && (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                    No sales found for the selected criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Return Confirmation Modal */}
      {saleToReturn && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="card" style={{ width: '500px', maxWidth: '95vw', padding: '24px', borderRadius: '16px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)', backgroundColor: '#ffffff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--danger-color)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                <AlertTriangle size={20} /> Process Sale Return & Refund
              </h3>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }} onClick={() => setSaleToReturn(null)}>
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Are you sure you want to process a return for this sale? Stock items will be restored to your inventory stock.
            </p>

            {/* Sale Summary Box */}
            <div style={{ backgroundColor: '#f8fafc', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '14px', marginBottom: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Patient / Customer:</span>
                <strong>{saleToReturn.patient?.name || 'Walk-in Customer'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Invoice Date:</span>
                <span>{new Date(saleToReturn.date).toLocaleString()}</span>
              </div>
              <div style={{ borderTop: '1px dashed var(--border-color)', paddingTop: '8px', marginTop: '8px' }}>
                <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>Items to Restock:</div>
                {saleToReturn.items.map(item => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', padding: '2px 0' }}>
                    <span>• {item.name}</span>
                    <strong style={{ color: 'var(--primary-color)' }}>{item.quantity} {(item.unitType || 'strip')}s</strong>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', fontWeight: '700', borderTop: '1px solid var(--border-color)', paddingTop: '10px', marginTop: '10px', color: '#991b1b' }}>
                <span>Total Refund Amount:</span>
                <span>₹{saleToReturn.totalAmount.toFixed(2)}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-outline" style={{ padding: '8px 16px' }} onClick={() => setSaleToReturn(null)}>
                Cancel
              </button>
              <button type="button" className="btn btn-primary" style={{ padding: '8px 20px', backgroundColor: '#dc2626', borderColor: '#dc2626', color: '#ffffff', fontWeight: '700' }} onClick={handleConfirmReturn}>
                Confirm Return & Refund
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Search, Filter, Printer, Calendar, RotateCcw, CheckCircle2, AlertTriangle, X, CreditCard, QrCode, Banknote, Pill } from 'lucide-react';
import { apiGet, apiPost } from '../services/api';

export default function SalesLog() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Return modal state - a return is per line item + quantity against the
  // real backend (POST /returns/customer), not "undo the whole sale" the
  // way the old local-only version worked.
  const [saleToReturn, setSaleToReturn] = useState(null);
  const [returnItemId, setReturnItemId] = useState(null);
  const [returnQty, setReturnQty] = useState(1);
  const [returnReason, setReturnReason] = useState('Customer return');
  const [returnError, setReturnError] = useState('');
  const [isReturning, setIsReturning] = useState(false);

  const loadSales = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const data = await apiGet('sales/list?limit=300');
      setSales(data.sales || []);
    } catch (err) {
      setLoadError(err.message || 'Could not load the sales log from the server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadSales(); }, []);

  const filteredSales = sales.filter(sale => {
    const customerName = (sale.customer_name || 'walk-in customer').toLowerCase();
    const medNames = (sale.items || []).map(i => (i.medicine_name || '').toLowerCase()).join(' ');
    const matchesSearch = customerName.includes(search.toLowerCase()) ||
                          medNames.includes(search.toLowerCase()) ||
                          (sale.customer_phone && sale.customer_phone.includes(search)) ||
                          (sale.invoice_no && sale.invoice_no.toLowerCase().includes(search.toLowerCase()));

    let matchesDate = true;
    if (dateFilter !== 'all') {
      const saleDate = new Date(sale.created_at);
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
          start.setHours(0, 0, 0, 0);
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          matchesDate = saleDate >= start && saleDate <= end;
        }
      }
    }
    return matchesSearch && matchesDate;
  });

  const openReturnModal = (sale) => {
    setSaleToReturn(sale);
    setReturnItemId(sale.items?.[0]?.medicine_id || null);
    setReturnQty(1);
    setReturnReason('Customer return');
    setReturnError('');
  };

  const handleConfirmReturn = async () => {
    if (!saleToReturn || !returnItemId) return;
    setReturnError('');
    if (returnQty < 1) {
      setReturnError('Return quantity must be at least 1.');
      return;
    }
    setIsReturning(true);
    try {
      await apiPost('returns/customer', {
        invoice_no: saleToReturn.invoice_no,
        medicine_id: returnItemId,
        quantity: Number(returnQty),
        reason: returnReason
      });
      setSaleToReturn(null);
      await loadSales();
    } catch (err) {
      setReturnError(err.message || 'Could not process this return. It may exceed the quantity still eligible for refund.');
    } finally {
      setIsReturning(false);
    }
  };

  const handlePrint = (sale) => {
    const printWindow = window.open('', '_blank');
    const date = new Date(sale.created_at).toLocaleString();
    let itemsHtml = '';

    (sale.items || []).forEach(item => {
      itemsHtml += `
        <tr>
          <td style="padding: 8px; border-bottom: 1px dashed #ccc;">${item.medicine_name}</td>
          <td style="padding: 8px; border-bottom: 1px dashed #ccc; text-align: center;">${item.quantity} ${item.unit_label}${item.quantity > 1 ? 's' : ''}</td>
          <td style="padding: 8px; border-bottom: 1px dashed #ccc; text-align: right;">₹${Number(item.unit_price).toFixed(2)}</td>
          <td style="padding: 8px; border-bottom: 1px dashed #ccc; text-align: right;">₹${Number(item.line_total).toFixed(2)}</td>
        </tr>
      `;
    });

    const returnAmount = Number(sale.return_amount) || 0;

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
            <strong>Invoice No:</strong> ${sale.invoice_no}<br/>
            <strong>Customer:</strong> ${sale.customer_name || 'Walk-in Customer'}<br/>
            <strong>Phone:</strong> ${sale.customer_phone || 'N/A'}<br/>
            <strong>Payment Mode:</strong> ${sale.payment_mode || 'Cash'}<br/>
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
            <div><span>Subtotal:</span> <span>₹${Number(sale.total_amount).toFixed(2)}</span></div>
            ${Number(sale.discount_amount) > 0 ? `<div style="color: #10b981;"><span>Discount:</span> <span>- ₹${Number(sale.discount_amount).toFixed(2)}</span></div>` : ''}
            <div><span>Tax:</span> <span>₹${Number(sale.tax_amount).toFixed(2)}</span></div>
            ${returnAmount > 0 ? `<div style="color: #dc2626;"><span>Returned:</span> <span>- ₹${returnAmount.toFixed(2)}</span></div>` : ''}
            <div class="final"><span>Total:</span> <span>₹${Number(sale.final_amount).toFixed(2)}</span></div>
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
      {loadError && (
        <div className="card" style={{ marginBottom: '16px', backgroundColor: '#fef2f2', border: '1px solid #fca5a5', color: '#991b1b', fontSize: '13px', fontWeight: '600' }}>
          ⚠️ {loadError}
        </div>
      )}

      <div className="card" style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>Sales Log & Receipt Reprinting</h2>

        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', width: '280px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-secondary)' }} />
            <input
              type="text"
              className="form-input"
              placeholder="Search by customer, phone, invoice or medicine..."
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
        {loading && sales.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading sales…</div>
        ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Customer</th>
                <th>Medicines Purchased</th>
                <th>Payment Mode</th>
                <th>Total Amount</th>
                <th>Status</th>
                <th style={{ textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredSales.map(sale => {
                const returnAmount = Number(sale.return_amount) || 0;
                const isFullyReturned = returnAmount > 0 && Number(sale.final_amount) <= 0;
                const isPartiallyReturned = returnAmount > 0 && !isFullyReturned;
                const pMode = sale.payment_mode || 'Cash';
                return (
                  <tr key={sale.id} className="hover-row" style={{ backgroundColor: isFullyReturned ? '#fef2f2' : 'transparent' }}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                        <Calendar size={14} color="var(--text-secondary)" />
                        {new Date(sale.created_at).toLocaleString()}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: '600', fontSize: '13px' }}>{sale.customer_name || 'Walk-in Customer'}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{sale.invoice_no}</div>
                    </td>

                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {(sale.items || []).map((item, idx) => (
                          <div key={idx} style={{ fontSize: '12.5px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <Pill size={13} color="var(--primary-color)" />
                            <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{item.medicine_name}</span>
                            <span style={{ color: 'var(--text-secondary)', fontSize: '11px', backgroundColor: '#f1f5f9', padding: '1px 6px', borderRadius: '4px' }}>
                              {item.quantity} {item.unit_label}{item.quantity > 1 ? 's' : ''}
                            </span>
                          </div>
                        ))}
                      </div>
                    </td>

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

                    <td><span style={{ fontWeight: '700', fontSize: '14px', color: isFullyReturned ? '#991b1b' : 'var(--primary-color)' }}>₹{Number(sale.final_amount).toFixed(2)}</span></td>

                    <td>
                      {isFullyReturned ? (
                        <span className="badge badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 8px' }}>
                          <RotateCcw size={12} /> Returned
                        </span>
                      ) : isPartiallyReturned ? (
                        <span className="badge badge-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 8px' }}>
                          <RotateCcw size={12} /> Partial Return
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

                      {!isFullyReturned && (sale.items || []).length > 0 ? (
                        <button
                          className="btn btn-outline"
                          style={{ padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--danger-color)', borderColor: '#fca5a5' }}
                          onClick={() => openReturnModal(sale)}
                        >
                          <RotateCcw size={14} /> Return
                        </button>
                      ) : isFullyReturned ? (
                        <span style={{ fontSize: '12px', color: '#991b1b', fontStyle: 'italic', display: 'flex', alignItems: 'center' }}>
                          Refunded
                        </span>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
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
        )}
      </div>

      {/* Return Modal - real per-item, per-quantity return against the backend */}
      {saleToReturn && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="card" style={{ width: '500px', maxWidth: '95vw', padding: '24px', borderRadius: '16px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)', backgroundColor: '#ffffff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--danger-color)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                <AlertTriangle size={20} /> Process Item Return & Refund
              </h3>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }} onClick={() => setSaleToReturn(null)}>
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Invoice <strong>{saleToReturn.invoice_no}</strong> — {saleToReturn.customer_name || 'Walk-in Customer'}. Select which medicine and how many units to return; stock is restored automatically.
            </p>

            {returnError && (
              <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fca5a5', color: '#991b1b', fontSize: '13px', fontWeight: '600', padding: '10px', borderRadius: '8px', marginBottom: '14px' }}>
                ⚠️ {returnError}
              </div>
            )}

            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Medicine</label>
              <select
                className="form-input"
                value={returnItemId || ''}
                onChange={(e) => setReturnItemId(Number(e.target.value))}
              >
                {(saleToReturn.items || []).map(item => (
                  <option key={item.medicine_id} value={item.medicine_id}>
                    {item.medicine_name} — sold {item.quantity} {item.unit_label}{item.quantity > 1 ? 's' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Quantity to return</label>
              <input
                type="number"
                min="1"
                className="form-input"
                value={returnQty}
                onChange={(e) => setReturnQty(Math.max(1, Number(e.target.value) || 1))}
              />
            </div>

            <div style={{ marginBottom: '18px' }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Reason</label>
              <input
                type="text"
                className="form-input"
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-outline" style={{ padding: '8px 16px' }} onClick={() => setSaleToReturn(null)} disabled={isReturning}>
                Cancel
              </button>
              <button type="button" className="btn btn-primary" style={{ padding: '8px 20px', backgroundColor: '#dc2626', borderColor: '#dc2626', color: '#ffffff', fontWeight: '700', opacity: isReturning ? 0.7 : 1 }} onClick={handleConfirmReturn} disabled={isReturning}>
                {isReturning ? 'Processing…' : 'Confirm Return & Refund'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

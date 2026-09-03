const STORAGE_KEY = 'sree-manju-pharmacy:pending-bills';
const CHANGE_EVENT = 'pharmacy:pending-bills-changed';

function readBills() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const bills = raw ? JSON.parse(raw) : [];
    return Array.isArray(bills) ? bills : [];
  } catch {
    return [];
  }
}

function writeBills(bills) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bills));
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: bills }));
  return bills;
}

export function getPendingBills() {
  return readBills().filter((bill) => bill.status !== 'cancelled' && bill.status !== 'paid');
}

export function savePendingBill({ cart, patient, total, paymentMode = 'Pending' }) {
  if (!Array.isArray(cart) || cart.length === 0) {
    throw new Error('Cannot save an empty bill.');
  }

  const now = new Date().toISOString();
  const bill = {
    id: `PB-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    billNumber: `PB-${Date.now().toString().slice(-8)}`,
    status: 'pending',
    createdAt: now,
    updatedAt: now,
    patient: patient || { name: 'Walk-in Customer', phone: 'N/A', address: '' },
    cart: cart.map((item) => ({ ...item })),
    total: Number(total || 0),
    paymentMode,
  };

  writeBills([bill, ...readBills()]);
  return bill;
}

export function updatePendingBill(id, changes) {
  const bills = readBills().map((bill) =>
    bill.id === id ? { ...bill, ...changes, updatedAt: new Date().toISOString() } : bill
  );
  writeBills(bills);
  return bills.find((bill) => bill.id === id) || null;
}

export function removePendingBill(id) {
  return writeBills(readBills().filter((bill) => bill.id !== id));
}

export function markPendingBillPaid(id, saleResult = {}) {
  return updatePendingBill(id, { status: 'paid', saleResult, paidAt: new Date().toISOString() });
}

export function cancelPendingBill(id) {
  return updatePendingBill(id, { status: 'cancelled', cancelledAt: new Date().toISOString() });
}

export function subscribePendingBills(callback) {
  const handler = (event) => callback(event.detail || getPendingBills());
  window.addEventListener(CHANGE_EVENT, handler);
  window.addEventListener('storage', handler);
  return () => {
    window.removeEventListener(CHANGE_EVENT, handler);
    window.removeEventListener('storage', handler);
  };
}

export { STORAGE_KEY as PENDING_BILLS_STORAGE_KEY };

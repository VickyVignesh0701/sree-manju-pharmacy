import { pharmacyApi } from './pharmacyApi';

/**
 * Server-authoritative POS checkout.
 * The browser sends only medicine IDs/quantities; FEFO, pricing, stock,
 * tax and batch deductions are enforced by the PHP transaction.
 */
export async function checkoutSale({ items, patient = {}, paymentMode = 'Cash' }) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('Cart is empty.');
  }

  const normalizedItems = items.map((item) => ({
    medicine_id: Number(item.id ?? item.medicine_id),
    quantity: Number(item.quantity),
    unit_label: String(item.unitType ?? item.unit_label ?? 'strip').toLowerCase(),
    // Discount/tax are sent only as explicit server inputs. The server remains authoritative.
    discount_amount: Number(item.discount_amount ?? 0),
    tax_rate: Number(item.tax_rate ?? 0),
  }));

  for (const item of normalizedItems) {
    if (!Number.isInteger(item.medicine_id) || item.medicine_id <= 0) {
      throw new Error('Invalid medicine in cart.');
    }
    if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
      throw new Error('Every medicine quantity must be a positive whole number.');
    }
  }

  return pharmacyApi.sales.create({
    items: normalizedItems,
    customer_name: patient.name || null,
    customer_phone: patient.phone || null,
    payment_mode: paymentMode === 'UPI / QR Code' ? 'UPI' : paymentMode,
  });
}

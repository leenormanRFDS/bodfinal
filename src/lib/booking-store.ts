// src/lib/booking-store.ts
// BEST-EFFORT MEMORY CACHE ONLY.
// This in-memory store MUST NEVER be the source of truth.
// Precedence hierarchy: CLIENT < MEMORY CACHE < WEBHOOK SIGNAL < LIVE REZDY API.
//
// In serverless environments (e.g. Vercel), instances are ephemeral, stateless,
// and rotate frequently. If memory is empty after cold start or instance rotation,
// booking status resolves authoritatively directly from the live Rezdy API.
// Stores privacy-safe, non-sensitive booking verification states.
// Does NOT store credit card numbers, passwords, or unnecessary PII.

export type BookingStatusState =
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'PENDING_SUPPLIER'
  | 'PENDING_CUSTOMER'
  | 'ON_HOLD'
  | 'CANCELLED'
  | 'ABANDONED_CART'
  | 'NOT_FOUND'
  | 'UNKNOWN';

export interface AuthoritativeBookingRecord {
  orderNumber: string;
  status: BookingStatusState;
  isConfirmed: boolean;
  productName: string;
  productSlug: string;
  date?: string;
  time?: string;
  startTimeLocal?: string;
  endTimeLocal?: string;
  totalQuantity: number;
  ticketSummary: Array<{
    label: string;
    quantity: number;
    price?: number;
  }>;
  totalAmount: number;
  totalCurrency: string;
  barcode?: string;
  barcodeType?: string;
  supplierAlias?: string;
  supplierId?: number;
  verifiedAt: string;
  source: 'webhook' | 'rezdy_api' | 'mock_test';
}

// In-memory cache of verified booking records (LRU style / keyed by orderNumber)
// Best-effort cache only: never the source of truth.
const store = new Map<string, AuthoritativeBookingRecord>();

// Maximum records kept in memory
const MAX_RECORDS = 500;

export function getBookingRecord(orderNumber: string): AuthoritativeBookingRecord | null {
  if (!orderNumber) return null;
  const cleanKey = orderNumber.trim().toUpperCase();
  const record = store.get(cleanKey);
  if (!record) return null;
  return record;
}

export function saveBookingRecord(record: AuthoritativeBookingRecord): void {
  if (!record || !record.orderNumber) return;
  const cleanKey = record.orderNumber.trim().toUpperCase();

  // Enforce memory bounds
  if (store.size >= MAX_RECORDS && !store.has(cleanKey)) {
    const firstKey = store.keys().next().value;
    if (firstKey) store.delete(firstKey);
  }

  store.set(cleanKey, record);
}

export function deleteBookingRecord(orderNumber: string): boolean {
  if (!orderNumber) return false;
  const cleanKey = orderNumber.trim().toUpperCase();
  return store.delete(cleanKey);
}

export function clearBookingStore(): void {
  store.clear();
}

export function hasBookingRecord(orderNumber: string): boolean {
  if (!orderNumber) return false;
  return store.has(orderNumber.trim().toUpperCase());
}

/**
 * Normalizes a raw Rezdy booking payload (from API or Webhook) into our
 * privacy-safe AuthoritativeBookingRecord.
 */
export function normalizeRezdyBooking(raw: any, source: 'webhook' | 'rezdy_api' = 'rezdy_api'): AuthoritativeBookingRecord {
  const orderNumber = String(raw.orderNumber || raw.bookingNumber || raw.orderRef || '').trim().toUpperCase();
  const rawStatus = String(raw.status || raw.orderStatus || 'UNKNOWN').trim().toUpperCase();

  let status: BookingStatusState = 'UNKNOWN';
  if (rawStatus === 'CONFIRMED') status = 'CONFIRMED';
  else if (rawStatus === 'PROCESSING') status = 'PROCESSING';
  else if (rawStatus === 'PENDING_SUPPLIER') status = 'PENDING_SUPPLIER';
  else if (rawStatus === 'PENDING_CUSTOMER') status = 'PENDING_CUSTOMER';
  else if (rawStatus === 'ON_HOLD' || rawStatus === 'ON HOLD') status = 'ON_HOLD';
  else if (rawStatus === 'CANCELLED' || rawStatus === 'CANCELED') status = 'CANCELLED';
  else if (rawStatus === 'ABANDONED_CART') status = 'ABANDONED_CART';

  const isConfirmed = status === 'CONFIRMED';

  const item0 = Array.isArray(raw.items) && raw.items.length > 0 ? raw.items[0] : {};
  const productName = item0.productName || raw.productName || 'The Bombing of Darwin & RFDS Experience';
  const productCode = (item0.productCode || raw.productCode || '').toUpperCase();

  // Determine product slug
  let productSlug = 'general-entry';
  if (productCode === 'PR6UUK' || productName.toLowerCase().includes('aviation')) {
    productSlug = 'aviation-combo';
  } else if (productCode === 'P2Q41Q' || productName.toLowerCase().includes('croc n history ticket')) {
    productSlug = 'croc-n-history';
  } else if (productCode === 'PWVVGE' || productName.toLowerCase().includes('croc n history explorer')) {
    productSlug = 'croc-explorer';
  }

  // Extract start times
  const startTimeLocal = item0.startTimeLocal || raw.startTimeLocal || '';
  const endTimeLocal = item0.endTimeLocal || raw.endTimeLocal || '';
  let date = '';
  let time = '';
  if (startTimeLocal) {
    const parts = startTimeLocal.split(' ');
    date = parts[0] || '';
    time = (parts[1] || '').slice(0, 5);
  }

  // Parse ticket quantities (clean, no PII)
  const ticketSummary: Array<{ label: string; quantity: number; price?: number }> = [];
  let totalQuantity = 0;

  if (Array.isArray(item0.quantities)) {
    for (const q of item0.quantities) {
      const val = Number(q.value) || 0;
      if (val > 0) {
        totalQuantity += val;
        ticketSummary.push({
          label: q.optionLabel || 'Admission',
          quantity: val,
          price: q.optionPrice !== undefined ? Number(q.optionPrice) : undefined,
        });
      }
    }
  } else if (typeof item0.totalQuantity === 'number') {
    totalQuantity = item0.totalQuantity;
  }

  // Check for genuine barcode (never invented)
  const barcode = item0.barcode || raw.barcode || (Array.isArray(item0.vouchers) && item0.vouchers[0]?.barcode) || undefined;
  const barcodeType = raw.barcodeType || item0.barcodeType || undefined;

  return {
    orderNumber,
    status,
    isConfirmed,
    productName,
    productSlug,
    date,
    time,
    startTimeLocal,
    endTimeLocal,
    totalQuantity: totalQuantity || 1,
    ticketSummary,
    totalAmount: Number(raw.totalAmount || raw.totalPaid || 0),
    totalCurrency: String(raw.totalCurrency || 'AUD').toUpperCase(),
    barcode: barcode ? String(barcode) : undefined,
    barcodeType: barcodeType ? String(barcodeType) : undefined,
    supplierAlias: raw.supplierAlias,
    supplierId: typeof raw.supplierId === 'number' ? raw.supplierId : undefined,
    verifiedAt: new Date().toISOString(),
    source,
  };
}

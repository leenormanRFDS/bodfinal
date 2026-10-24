/**
 * Conversion events, sent to GA4 (gtag) and the Meta pixel (fbq) when those are loaded.
 * Analytics.astro creates the queues only on production hostnames, so calls elsewhere are
 * harmless no-ops. Never throws: tracking must not be able to break booking.
 *
 *   begin_checkout / InitiateCheckout  — the Rezdy checkout opens (BookingForm)
 *   purchase / Purchase                — a Rezdy order is server-verified CONFIRMED
 *                                        (tickets/confirmation), once per order per browser
 */
type Item = { item_id: string; item_name: string; item_variant?: string; price: number; quantity: number };

function gtag(...args: unknown[]) {
  const w = window as any;
  if (typeof w.gtag === 'function') w.gtag(...args);
}
function fbq(...args: unknown[]) {
  const w = window as any;
  if (typeof w.fbq === 'function') w.fbq(...args);
}

export function trackBeginCheckout(p: { productSlug: string; productName: string; value: number; items: Item[] }): void {
  try {
    gtag('event', 'begin_checkout', { currency: 'AUD', value: p.value, items: p.items });
    fbq('track', 'InitiateCheckout', {
      currency: 'AUD',
      value: p.value,
      content_ids: [p.productSlug],
      content_type: 'product',
      num_items: p.items.reduce((n, i) => n + i.quantity, 0),
    });
  } catch { /* never block checkout */ }
}

export function trackPurchase(p: {
  orderNumber: string;
  productSlug: string;
  productName: string;
  value: number;
  currency: string;
  quantity: number;
}): void {
  try {
    const key = `bod_purchase_${p.orderNumber}`;
    try {
      if (localStorage.getItem(key)) return; // reload of the confirmation page: already sent
      localStorage.setItem(key, String(Date.now()));
    } catch { /* storage blocked: GA4 still de-duplicates on transaction_id */ }
    gtag('event', 'purchase', {
      transaction_id: p.orderNumber,
      currency: p.currency || 'AUD',
      value: p.value,
      items: [{ item_id: p.productSlug, item_name: p.productName, price: p.value, quantity: 1 }],
    });
    fbq('track', 'Purchase', {
      currency: p.currency || 'AUD',
      value: p.value,
      content_ids: [p.productSlug],
      content_type: 'product',
      num_items: p.quantity,
    }, { eventID: p.orderNumber });
  } catch { /* never block the confirmation page */ }
}

/**
 * Opening cinematic engagement (GA4 only). mode: 'sound' | 'silent'.
 *   opening_start / opening_skip (at_s = seconds in) / opening_complete / opening_audio_fallback
 */
export function trackOpening(name: 'opening_start' | 'opening_skip' | 'opening_complete' | 'opening_audio_fallback', params: Record<string, string | number> = {}): void {
  try { gtag('event', name, params); } catch { /* never block the page */ }
}

/**
 * Conversion events, sent to GA4 (gtag) and the Meta pixel (fbq) when those are loaded.
 * Analytics.astro creates the queues only on production hostnames, so calls elsewhere are
 * harmless no-ops. Never throws: tracking must not be able to break booking.
 *
 *   begin_checkout / InitiateCheckout  — the Rezdy checkout opens (BookingForm)
 *   purchase / Purchase                — a Rezdy order is server-verified CONFIRMED
 *                                        (tickets/confirmation), once per order per browser
 */
import { captureAttribution as capture, buildHandover, withGaDataParam, type HandoverEnv } from './ga-handover';

type Item = { item_id: string; item_name: string; item_variant?: string; price: number; quantity: number };

function browserEnv(): HandoverEnv {
  let storage: HandoverEnv['storage'] = null;
  try { storage = window.sessionStorage; } catch { /* blocked */ }
  return {
    cookie: document.cookie,
    search: location.search,
    referrer: document.referrer,
    hostname: location.hostname,
    storage,
    now: () => Date.now(),
  };
}

/**
 * Remember this visit's first campaign tags (utm_*) and external referrer for the browser session.
 * Called on every page (Base.astro), so a visitor who lands on /story and books later on /tickets
 * still hands Rezdy the campaign they arrived from. See ga-handover.ts.
 */
export function captureAttribution(): void {
  try { capture(browserEnv()); } catch { /* never block the page */ }
}

/** The Rezdy checkout URL with this visitor's GA identity and campaign added (`_ga_data`). */
export function checkoutUrlWithGa(url: string): string {
  try { return withGaDataParam(url, buildHandover(browserEnv())); } catch { return url; }
}

/**
 * Tell the Rezdy checkout inside `iframe` which visitor and campaign it is serving, the same
 * message Rezdy's own embed script sends. Call on every iframe load: each checkout step is a new page.
 */
export function sendGaHandover(iframe: HTMLIFrameElement, checkoutUrl: string): void {
  try {
    const data = buildHandover(browserEnv());
    if (!data || !iframe.contentWindow) return;
    iframe.contentWindow.postMessage({ type: 'GA_TRACKING_DATA', data }, new URL(checkoutUrl).origin);
  } catch { /* never block checkout */ }
}

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

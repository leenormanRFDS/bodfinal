/**
 * Google Analytics handover to Rezdy's checkout.
 *
 * Rezdy's checkout reports `purchase` (with value and order number) to the RFDS Darwin Tourist
 * Facility GA4 property. When it is told which visitor and campaign it is serving, it reports the
 * purchase under that visitor's client ID with the campaign tags attached, so sales can be traced
 * back to this site and its campaigns. Without it, the sale shows up as an unrelated Rezdy visit.
 *
 * Rezdy's own embed script (https://rfdsdarwin1.rezdy.com/pluginJs, read 26 Oct 2026) does this by
 * posting `{ type: 'GA_TRACKING_DATA', data }` into the checkout iframe. That script only reaches
 * iframes that exist when the page first loads; ours is created when the visitor clicks Book, so we
 * send the same payload ourselves. We also put it on the checkout URL as `_ga_data`
 * (encodeURIComponent(btoa(JSON))), which Rezdy's checkout stores and uses as a fallback, and which
 * is the only route available when checkout opens in its own tab (iOS, macOS Safari) or ends up as
 * the top-level page.
 *
 * Differences from Rezdy's script, on purpose:
 *   - Campaign tags are first-touch for the browser session (kept in sessionStorage), not read
 *     from the current URL, because visitors rarely book on the page they landed on.
 *   - Values are cut to printable ASCII, because Rezdy's decoder is a bare atob().
 *
 * Pure functions with an injected environment, so they can be tested without a browser
 * (scripts/verify-ga-handover.mjs). Never throws: tracking must not be able to break booking.
 * Rezdy does not document this payload; if it changes, the worst case is that sales are reported
 * without our campaign tags, exactly as before.
 */

export const ATTR_KEY = 'bod_attr';

export interface GaHandover {
  clientId: string;
  sessionId: number;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmTerm: string | null;
  utmContent: string | null;
  referrer: string;
  timestamp: number;
}

export interface HandoverEnv {
  cookie: string;
  search: string;
  referrer: string;
  hostname: string;
  storage: { getItem(k: string): string | null; setItem(k: string, v: string): void } | null;
  now: () => number;
}

interface StoredAttribution {
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmTerm: string | null;
  utmContent: string | null;
  referrer: string;
}

const UTM_PARAMS: Array<[keyof Omit<StoredAttribution, 'referrer'>, string]> = [
  ['utmSource', 'utm_source'],
  ['utmMedium', 'utm_medium'],
  ['utmCampaign', 'utm_campaign'],
  ['utmTerm', 'utm_term'],
  ['utmContent', 'utm_content'],
];

/** Printable ASCII only, trimmed, at most 100 characters. Empty becomes null. */
export function cleanValue(v: string | null | undefined): string | null {
  if (!v) return null;
  const out = String(v).replace(/[^\x20-\x7E]/g, '').trim().slice(0, 100);
  return out || null;
}

/** GA4 client ID from the `_ga` cookie ("GA1.1.<number>.<timestamp>" gives "<number>.<timestamp>"). */
export function readClientId(cookie: string): string | null {
  const m = /(?:^|;\s*)_ga=GA\d+\.\d+\.(\d+\.\d+)/.exec(cookie || '');
  return m ? m[1] : null;
}

function readStored(storage: HandoverEnv['storage']): StoredAttribution | null {
  try {
    const raw = storage ? storage.getItem(ATTR_KEY) : null;
    if (!raw) return null;
    const o = JSON.parse(raw);
    return o && typeof o === 'object' ? (o as StoredAttribution) : null;
  } catch {
    return null;
  }
}

function externalReferrer(referrer: string, hostname: string): string {
  if (!referrer) return '';
  try {
    const h = new URL(referrer).hostname;
    return h === hostname ? '' : referrer;
  } catch {
    return '';
  }
}

/**
 * Remember the first campaign tags and external referrer seen in this browser session.
 * Call on every page. Later pages never overwrite what is already stored.
 */
export function captureAttribution(env: HandoverEnv): void {
  try {
    if (!env.storage) return;
    const existing = readStored(env.storage);
    const params = new URLSearchParams(env.search || '');
    const fromUrl: StoredAttribution = {
      utmSource: null, utmMedium: null, utmCampaign: null, utmTerm: null, utmContent: null,
      referrer: externalReferrer(env.referrer, env.hostname),
    };
    let hasUtm = false;
    for (const [key, param] of UTM_PARAMS) {
      const v = cleanValue(params.get(param));
      fromUrl[key] = v;
      if (v) hasUtm = true;
    }
    if (!existing) {
      if (hasUtm || fromUrl.referrer) env.storage.setItem(ATTR_KEY, JSON.stringify(fromUrl));
      return;
    }
    // Fill gaps only: a later page with tags must not replace tags already held, but if the first
    // page had none and a later one does, take them.
    const hadUtm = UTM_PARAMS.some(([key]) => !!existing[key]);
    if (!hadUtm && hasUtm) {
      env.storage.setItem(ATTR_KEY, JSON.stringify({ ...fromUrl, referrer: existing.referrer || fromUrl.referrer }));
    }
  } catch { /* storage blocked: fall back to the current URL at checkout time */ }
}

/** The payload Rezdy's own script builds, or null when there is no GA client ID to hand over. */
export function buildHandover(env: HandoverEnv): GaHandover | null {
  try {
    const clientId = readClientId(env.cookie);
    if (!clientId) return null;
    const stored = readStored(env.storage);
    const params = new URLSearchParams(env.search || '');
    const pick = (key: keyof Omit<StoredAttribution, 'referrer'>, param: string) =>
      (stored && cleanValue(stored[key])) || cleanValue(params.get(param));
    const now = env.now();
    return {
      clientId,
      sessionId: now,
      utmSource: pick('utmSource', 'utm_source'),
      utmMedium: pick('utmMedium', 'utm_medium'),
      utmCampaign: pick('utmCampaign', 'utm_campaign'),
      utmTerm: pick('utmTerm', 'utm_term'),
      utmContent: pick('utmContent', 'utm_content'),
      referrer: (stored && stored.referrer) || externalReferrer(env.referrer, env.hostname),
      timestamp: now,
    };
  } catch {
    return null;
  }
}

/** Same encoding as Rezdy's checkout (encodeURIComponent(btoa(JSON))); its decoder is atob(). */
export function encodeGaData(data: GaHandover): string {
  return encodeURIComponent(btoa(JSON.stringify(data)));
}

/** The URL with `_ga_data` added, or the URL unchanged when there is nothing to hand over. */
export function withGaDataParam(url: string, data: GaHandover | null): string {
  if (!data) return url;
  try {
    const u = new URL(url);
    if (u.searchParams.has('_ga_data')) u.searchParams.delete('_ga_data');
    const hash = u.hash;
    const query = u.search;
    u.hash = '';
    u.search = '';
    // Appended by hand: URLSearchParams would percent-encode the value a second time, and
    // Rezdy decodes it once.
    return `${u.toString()}${query ? query + '&' : '?'}_ga_data=${encodeGaData(data)}${hash}`;
  } catch {
    return url;
  }
}

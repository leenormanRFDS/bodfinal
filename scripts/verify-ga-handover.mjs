// Verifies src/lib/ga-handover.ts (the GA identity and campaign handover to Rezdy's checkout).
//
//   node --experimental-strip-types scripts/verify-ga-handover.mjs
//
// Checks the pure logic against a model of Rezdy's own decoder (read from its checkout script,
// 26 Oct 2026: decodeData = JSON.parse(atob(decodeURIComponent(x)))) and the payload keys its
// pluginJs sends. It does NOT prove Rezdy's tag reports the purchase under the handed-over visitor:
// that needs a real booking and a look at the facility GA4 property (see docs/SHIP_STATUS.md).
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  ATTR_KEY, cleanValue, readClientId, captureAttribution, buildHandover, encodeGaData, withGaDataParam,
} from '../src/lib/ga-handover.ts';

let passed = 0;
function check(name, fn) {
  try { fn(); passed++; console.log(`  ok   ${name}`); }
  catch (e) { console.error(`  FAIL ${name}\n       ${e.message}`); process.exitCode = 1; }
}

const makeStorage = () => {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => void m.set(k, v), _m: m };
};
const env = (over = {}) => ({
  cookie: '', search: '', referrer: '', hostname: 'www.thebombingofdarwin.com.au',
  storage: makeStorage(), now: () => 1_700_000_000_000, ...over,
});
// Rezdy's decoder, as found in its checkout script.
const rezdyDecode = (s) => JSON.parse(atob(decodeURIComponent(s)));

// Payload keys Rezdy's pluginJs sends (rzdApp.handleTrackingData).
const REZDY_KEYS = ['clientId', 'sessionId', 'utmSource', 'utmMedium', 'utmCampaign', 'utmTerm', 'utmContent', 'referrer', 'timestamp'].sort();

console.log('ga-handover');

check('readClientId: standard _ga cookie', () => {
  assert.equal(readClientId('_ga=GA1.1.1234567890.1700000000'), '1234567890.1700000000');
});
check('readClientId: among other cookies, GA1.2 prefix, property cookie ignored', () => {
  assert.equal(readClientId('a=b; _ga_MQ9641V0NY=GS2.1.s1; _ga=GA1.2.55.66; c=d'), '55.66');
});
check('readClientId: absent or malformed gives null', () => {
  assert.equal(readClientId(''), null);
  assert.equal(readClientId('_ga_MQ9641V0NY=GS2.1.s1'), null);
  assert.equal(readClientId('_ga=garbage'), null);
});

check('cleanValue: ASCII only, trimmed, capped at 100, empty is null', () => {
  assert.equal(cleanValue('  google  '), 'google');
  assert.equal(cleanValue('café ☃'), 'caf');
  assert.equal(cleanValue('x'.repeat(250)).length, 100);
  assert.equal(cleanValue(''), null);
  assert.equal(cleanValue(null), null);
  assert.equal(cleanValue('☃'), null);
});

check('captureAttribution: first touch stored, later pages do not overwrite', () => {
  const storage = makeStorage();
  captureAttribution(env({ storage, search: '?utm_source=google&utm_medium=cpc&utm_campaign=darwin-national' }));
  captureAttribution(env({ storage, search: '?utm_source=facebook&utm_medium=social&utm_campaign=other' }));
  captureAttribution(env({ storage, search: '' }));
  const s = JSON.parse(storage.getItem(ATTR_KEY));
  assert.equal(s.utmSource, 'google');
  assert.equal(s.utmCampaign, 'darwin-national');
});
check('captureAttribution: nothing to store on a plain visit', () => {
  const storage = makeStorage();
  captureAttribution(env({ storage }));
  assert.equal(storage.getItem(ATTR_KEY), null);
});
check('captureAttribution: external referrer stored; own site ignored', () => {
  const a = makeStorage();
  captureAttribution(env({ storage: a, referrer: 'https://www.rfdsdarwin.com.au/bombing' }));
  assert.equal(JSON.parse(a.getItem(ATTR_KEY)).referrer, 'https://www.rfdsdarwin.com.au/bombing');
  const b = makeStorage();
  captureAttribution(env({ storage: b, referrer: 'https://www.thebombingofdarwin.com.au/story' }));
  assert.equal(b.getItem(ATTR_KEY), null);
});
check('captureAttribution: tags arriving on a later page fill an empty first touch', () => {
  const storage = makeStorage();
  captureAttribution(env({ storage, referrer: 'https://www.google.com/' }));
  captureAttribution(env({ storage, search: '?utm_source=google&utm_medium=cpc' }));
  const s = JSON.parse(storage.getItem(ATTR_KEY));
  assert.equal(s.utmMedium, 'cpc');
  assert.equal(s.referrer, 'https://www.google.com/');
});
check('captureAttribution: blocked storage never throws', () => {
  const storage = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); } };
  captureAttribution(env({ storage, search: '?utm_source=google' }));
  assert.equal(buildHandover(env({ storage, cookie: '_ga=GA1.1.1.2', search: '?utm_source=google' })).utmSource, 'google');
});

check('buildHandover: null without a GA client ID', () => {
  assert.equal(buildHandover(env()), null);
});
check('buildHandover: same keys as Rezdy\'s own payload', () => {
  const d = buildHandover(env({ cookie: '_ga=GA1.1.111.222', search: '?utm_source=google' }));
  assert.deepEqual(Object.keys(d).sort(), REZDY_KEYS);
  assert.equal(d.clientId, '111.222');
  assert.equal(d.utmMedium, null);
  assert.equal(d.timestamp, 1_700_000_000_000);
});
check('buildHandover: stored first touch beats the current URL; URL used when nothing stored', () => {
  const storage = makeStorage();
  captureAttribution(env({ storage, search: '?utm_source=google&utm_medium=cpc&utm_campaign=first' }));
  const d = buildHandover(env({ storage, cookie: '_ga=GA1.1.1.2', search: '?utm_source=other' }));
  assert.equal(d.utmSource, 'google');
  assert.equal(d.utmCampaign, 'first');
  const e = buildHandover(env({ cookie: '_ga=GA1.1.1.2', search: '?utm_source=other' }));
  assert.equal(e.utmSource, 'other');
});

check('encodeGaData: Rezdy\'s decoder reads it back unchanged', () => {
  const d = buildHandover(env({ cookie: '_ga=GA1.1.111.222', search: '?utm_source=google&utm_medium=cpc&utm_campaign=a+b%2Fc%3D1' }));
  assert.deepEqual(rezdyDecode(encodeGaData(d)), d);
});
check('encodeGaData: hostile and non-Latin values cannot break the encoder', () => {
  const d = buildHandover(env({ cookie: '_ga=GA1.1.1.2', search: '?utm_source=%E2%98%83%F0%9F%9A%80&utm_campaign=' + 'z'.repeat(500) }));
  assert.doesNotThrow(() => encodeGaData(d));
  assert.equal(d.utmSource, null);
  assert.equal(d.utmCampaign.length, 100);
});

check('withGaDataParam: appends to a URL with and without a query, keeps the fragment', () => {
  const d = buildHandover(env({ cookie: '_ga=GA1.1.111.222', search: '?utm_source=google' }));
  for (const url of ['https://rfdsdarwin1.rezdy.com/433258/x', 'https://rfdsdarwin1.rezdy.com/433258/x?iframe=true&date=2026-10-27', 'https://rfdsdarwin1.rezdy.com/433258/x?a=1#frag']) {
    const out = withGaDataParam(url, d);
    const u = new URL(out);
    assert.equal(u.origin + u.pathname, new URL(url).origin + new URL(url).pathname);
    // What Rezdy's script does: URLSearchParams.get, then its decoder.
    assert.deepEqual(rezdyDecode(u.searchParams.get('_ga_data')), d);
    assert.equal(u.hash, new URL(url).hash);
    for (const [k, v] of new URL(url).searchParams) assert.equal(u.searchParams.get(k), v);
  }
});
check('withGaDataParam: replaces an existing _ga_data, unchanged with no data or a bad URL', () => {
  const d = buildHandover(env({ cookie: '_ga=GA1.1.111.222' }));
  const once = withGaDataParam('https://r.example/x?_ga_data=old&b=2', d);
  assert.equal(new URL(once).searchParams.getAll('_ga_data').length, 1);
  assert.notEqual(new URL(once).searchParams.get('_ga_data'), 'old');
  assert.equal(withGaDataParam('https://r.example/x?b=2', null), 'https://r.example/x?b=2');
  assert.equal(withGaDataParam('not a url', d), 'not a url');
});

console.log('wiring (string checks only; they show the calls exist, not that they work)');
const read = (p) => readFileSync(new URL(p, import.meta.url), 'utf8');
check('Base.astro captures attribution on every page', () => {
  const t = read('../src/layouts/Base.astro');
  assert.match(t, /captureAttribution\(\)/);
});
check('BookingForm.astro adds _ga_data to the checkout URL and sends the handover on every iframe load', () => {
  const t = read('../src/components/BookingForm.astro');
  assert.match(t, /checkoutUrlWithGa\(`\$\{baseCheckout\}/);
  assert.match(t, /iframe\.addEventListener\('load'[\s\S]{0,200}sendGaHandover\(iframe, checkoutUrl\)/);
});

console.log(`${passed} passed${process.exitCode ? ', with failures' : ''}`);

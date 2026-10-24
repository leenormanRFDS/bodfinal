#!/usr/bin/env node
/**
 * THE BOMBING OF DARWIN — Spatial Engine load profiler
 *
 * Measures what a visitor waits for between reaching the story timeline and
 * seeing the first map, on desktop and on an emulated mid-range phone.
 *
 *   node scripts/profile-spatial-load.mjs --url <base> [--label name] [--out dir] [--share <token>]
 *
 * Reported per profile:
 *   - time to first map pixels (poster still or live canvas), from timeline entry
 *   - Cesium chunk: request start, download end, transfer bytes
 *   - viewer ready (initialize() resolved), from timeline entry
 *   - first-beat tiles loaded, from timeline entry (inflated under software WebGL — see note)
 *   - main-thread script time, request count and bytes by category
 *
 * Note: this container has no GPU. Chromium falls back to SwiftShader (software WebGL,
 * ~1 frame/s), so anything gated on rendered frames ("tiles loaded") is pessimistic and
 * only comparable run-to-run on this rig. Network and JavaScript timings are realistic.
 */
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, cur, i, all) => {
    if (cur.startsWith('--')) acc.push([cur.slice(2), all[i + 1] && !all[i + 1].startsWith('--') ? all[i + 1] : 'true']);
    return acc;
  }, [])
);

const BASE = (args.url || 'http://127.0.0.1:3000').replace(/\/$/, '');
const LABEL = args.label || 'profile';
const OUT = path.resolve(args.out || 'qa-captures');
const SHARE = args.share || '';
fs.mkdirSync(OUT, { recursive: true });

const PROFILES = [
  { name: 'desktop', viewport: { width: 1440, height: 900 }, dpr: 1, mobile: false, cpu: 1, net: null },
  {
    name: 'mobile-midrange',
    viewport: { width: 390, height: 844 },
    dpr: 2,
    mobile: true,
    cpu: 4, // CDP CPU throttle: ~ mid-range phone relative to this host
    net: { latency: 60, downloadThroughput: (12 * 1024 * 1024) / 8, uploadThroughput: (4 * 1024 * 1024) / 8 }, // ~12 Mbps 4G
  },
];

const ONLY = args.profiles ? args.profiles.split(',') : null;
const SKIP_TILES = args['skip-tiles'] === 'true';

const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined,
  args: ['--no-sandbox', '--enable-webgl', '--ignore-gpu-blocklist', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});

const results = { label: LABEL, base: BASE, at: new Date().toISOString(), profiles: [] };

function categorise(url) {
  if (/\/tiles\//.test(url)) return 'tiles';
  if (/\/cesium\/Workers\//.test(url)) return 'cesium-workers';
  if (/\/cesium\//.test(url)) return 'cesium-assets';
  if (/Cesium\.[\w-]+\.js/.test(url)) return 'cesium-chunk';
  if (/\/_astro\/.*\.js/.test(url)) return 'site-js';
  if (/\/spatial-posters\//.test(url)) return 'posters';
  if (/\.(png|jpe?g|webp|avif|svg)(\?|$)/.test(url)) return 'images';
  if (/\.(woff2?|ttf|otf)(\?|$)|typekit|fonts\./.test(url)) return 'fonts';
  return 'other';
}

for (const p of PROFILES.filter((x) => !ONLY || ONLY.includes(x.name))) {
  const context = await browser.newContext({
    viewport: p.viewport,
    deviceScaleFactor: p.dpr,
    isMobile: p.mobile,
    hasTouch: p.mobile,
  });
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await cdp.send('Performance.enable');
  if (p.cpu > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: p.cpu });
  if (p.net) {
    await cdp.send('Network.enable');
    await cdp.send('Network.emulateNetworkConditions', { offline: false, ...p.net });
  }

  const reqs = new Map();
  page.on('requestfinished', async (r) => {
    try {
      const s = await r.sizes();
      const t = r.timing();
      reqs.set(r.url(), { url: r.url(), bytes: s.responseBodySize + s.responseHeadersSize, start: t.startTime, end: t.startTime + t.responseEnd });
    } catch { /* ignore */ }
  });

  const url = `${BASE}/story${SHARE ? `?_vercel_share=${SHARE}` : ''}`;
  await page.goto(url, { waitUntil: 'load', timeout: 180000 });
  // Let the visitor read the opening for a moment (idle-time work happens here).
  await page.waitForTimeout(4000);

  const m0 = await cdp.send('Performance.getMetrics');

  // Scroll to the first beat the way a visitor arrives at it.
  const tEntry = await page.evaluate(() => {
    const el = document.querySelector('[data-beat-index="0"]');
    const r = el.getBoundingClientRect();
    window.scrollBy(0, r.top + r.height / 2 - window.innerHeight / 2);
    window.dispatchEvent(new Event('scroll'));
    return performance.now();
  });

  // First map pixels: a visible poster still, or the live canvas becoming ready.
  const firstPixels = await page.waitForFunction(() => {
    const poster = document.querySelector('[data-spatial-poster].is-visible img');
    if (poster && poster.complete && poster.naturalWidth > 0) return { kind: 'poster', t: performance.now() };
    const s = window.__DARWIN_SPATIAL_VIEWER__?.getStatus?.();
    if (s?.isReady) return { kind: 'live', t: performance.now() };
    return false;
  }, null, { timeout: 180000, polling: 50 }).then((h) => h.jsonValue()).catch(() => null);

  const ready = await page.waitForFunction(() => window.__DARWIN_SPATIAL_VIEWER__?.getStatus?.().isReady === true ? performance.now() : false,
    null, { timeout: 180000, polling: 50 }).then((h) => h.jsonValue()).catch(() => null);

  const tiles = SKIP_TILES ? null : await page.waitForFunction(() => {
    const v = window.__DARWIN_SPATIAL_VIEWER__?.viewer;
    if (!v) return false;
    v.scene.requestRender();
    return v.scene.globe.tilesLoaded ? performance.now() : false;
  }, null, { timeout: 240000, polling: 250 }).then((h) => h.jsonValue()).catch(() => null);

  const m1 = await cdp.send('Performance.getMetrics');
  const metric = (m, n) => m.metrics.find((x) => x.name === n)?.value ?? 0;

  const resourceTimings = await page.evaluate(() =>
    performance.getEntriesByType('resource').map((e) => ({ name: e.name, start: e.startTime, end: e.responseEnd, transfer: e.transferSize, decoded: e.decodedBodySize }))
  );
  const chunk = resourceTimings.find((e) => /Cesium\.[\w-]+\.js/.test(e.name));
  const marks = await page.evaluate(() =>
    Object.fromEntries(performance.getEntriesByType('mark').filter((m) => m.name.startsWith('spatial:')).map((m) => [m.name, m.startTime]))
  );
  const phase = (a, b) => (marks[a] != null && marks[b] != null ? Math.round(marks[b] - marks[a]) : null);
  const initPhasesMs = {
    startedMsFromNav: marks['spatial:init-start'] != null ? Math.round(marks['spatial:init-start']) : null,
    importCesium: phase('spatial:init-start', 'spatial:import-done'),
    createViewer: phase('spatial:import-done', 'spatial:viewer-done'),
    overlayAndControllers: phase('spatial:viewer-done', 'spatial:overlay-done'),
    finalise: phase('spatial:overlay-done', 'spatial:ready'),
  };

  const byCat = {};
  for (const e of resourceTimings) {
    const c = categorise(e.name);
    byCat[c] ??= { count: 0, transferKB: 0 };
    byCat[c].count += 1;
    byCat[c].transferKB += (e.transfer || 0) / 1024;
  }
  for (const c of Object.values(byCat)) c.transferKB = Math.round(c.transferKB);

  const rel = (t) => (t == null ? null : Math.round(t - tEntry));
  const out = {
    profile: p.name,
    cpuThrottle: p.cpu,
    network: p.net ? '12 Mbps / 60 ms' : 'unthrottled',
    cesiumChunk: chunk
      ? { requestedAtMsFromNav: Math.round(chunk.start), downloadedAtMsFromNav: Math.round(chunk.end), requestedBeforeTimelineEntry: chunk.start < tEntry, transferKB: Math.round(chunk.transfer / 1024) }
      : null,
    timelineEntryMsFromNav: Math.round(tEntry),
    initPhasesMs,
    msFromTimelineEntry: {
      firstMapPixels: firstPixels ? { kind: firstPixels.kind, ms: rel(firstPixels.t) } : null,
      viewerReady: rel(ready),
      firstBeatTilesLoaded: rel(tiles),
    },
    scriptSecondsBeforeEntry: +metric(m0, 'ScriptDuration').toFixed(2),
    scriptSecondsTotal: +metric(m1, 'ScriptDuration').toFixed(2),
    taskSecondsTotal: +metric(m1, 'TaskDuration').toFixed(2),
    jsHeapMB: Math.round(metric(m1, 'JSHeapUsedSize') / 1048576),
    requestsByCategory: byCat,
  };
  results.profiles.push(out);
  console.log(JSON.stringify(out, null, 2));
  await context.close();
}

await browser.close();
const file = path.join(OUT, `${LABEL}-load-profile.json`);
fs.writeFileSync(file, JSON.stringify(results, null, 2));
console.log(`Profile: ${file}`);

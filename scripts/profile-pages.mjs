#!/usr/bin/env node
/**
 * Per-page load profile (mobile-midrange emulation): transfer bytes by type, LCP, CLS,
 * long tasks before load, request count, render-blocking requests.
 *   node scripts/profile-pages.mjs --url <base> [--share <token>] [--label name] [--pages /,/story]
 * No GPU in CI containers: WebGL pages are pessimistic; compare run-to-run.
 */
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';
const args = Object.fromEntries(process.argv.slice(2).reduce((a, c, i, all) => { if (c.startsWith('--')) a.push([c.slice(2), all[i + 1]]); return a; }, []));
const BASE = (args.url || 'http://127.0.0.1:3000').replace(/\/$/, '');
const PAGES = (args.pages || '/,/story,/experience,/tickets,/visit,/witness,/memorial,/programs,/schools,/contact,/accessibility').split(',');
const LABEL = args.label || 'pages';
const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined, args: ['--no-sandbox'] });
const results = [];
for (const p of PAGES) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 60, downloadThroughput: (12e6) / 8, uploadThroughput: (3e6) / 8 });
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  const reqs = new Map();
  cdp.on('Network.responseReceived', (e) => reqs.set(e.requestId, { url: e.response.url, type: e.type, status: e.response.status, bytes: 0 }));
  cdp.on('Network.loadingFinished', (e) => { const r = reqs.get(e.requestId); if (r) r.bytes = e.encodedDataLength; });
  await page.addInitScript(() => {
    window.__perf = { lcp: 0, cls: 0, longTasks: 0, longMs: 0 };
    new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__perf.lcp = e.startTime; }).observe({ type: 'largest-contentful-paint', buffered: true });
    new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__perf.cls += e.value; }).observe({ type: 'layout-shift', buffered: true });
    new PerformanceObserver((l) => { for (const e of l.getEntries()) { window.__perf.longTasks++; window.__perf.longMs += e.duration; } }).observe({ type: 'longtask', buffered: true });
  });
  const share = args.share ? `${p.includes('?') ? '&' : '?'}_vercel_share=${args.share}` : '';
  const t0 = Date.now();
  let status = 0;
  try { const r = await page.goto(BASE + p + share, { waitUntil: 'load', timeout: 120000 }); status = r?.status() ?? 0; } catch (e) { status = -1; }
  const loadMs = Date.now() - t0;
  await page.waitForTimeout(4000);
  const perf = await page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0];
    const fcp = performance.getEntriesByName('first-contentful-paint')[0]?.startTime ?? null;
    const blocking = performance.getEntriesByType('resource').filter((r) => r.renderBlockingStatus === 'blocking').map((r) => r.name.split('/').slice(-2).join('/'));
    return { ...window.__perf, fcp, domContentLoaded: nav?.domContentLoadedEventEnd, blocking };
  });
  const byType = {};
  let total = 0;
  for (const r of reqs.values()) { const k = r.type || 'Other'; byType[k] = byType[k] || { n: 0, kb: 0 }; byType[k].n++; byType[k].kb += r.bytes / 1024; total += r.bytes; }
  for (const k in byType) byType[k].kb = Math.round(byType[k].kb);
  const biggest = [...reqs.values()].sort((a, b) => b.bytes - a.bytes).slice(0, 6).map((r) => `${Math.round(r.bytes / 1024)}KB ${r.url.replace(BASE, '').split('?')[0]}`);
  const failed = [...reqs.values()].filter((r) => r.status >= 400).map((r) => `${r.status} ${r.url.replace(BASE, '').split('?')[0]}`);
  results.push({ page: p, status, loadMs, totalKB: Math.round(total / 1024), requests: reqs.size, lcpMs: Math.round(perf.lcp), fcpMs: Math.round(perf.fcp ?? 0), cls: +perf.cls.toFixed(3), longTasks: perf.longTasks, longMs: Math.round(perf.longMs), blocking: perf.blocking, byType, biggest, failed });
  console.log(`${p}  ${Math.round(total / 1024)}KB  req=${reqs.size}  FCP=${Math.round(perf.fcp ?? 0)}  LCP=${Math.round(perf.lcp)}  CLS=${perf.cls.toFixed(3)}  long=${perf.longTasks}/${Math.round(perf.longMs)}ms  blocking=${perf.blocking.length}  failed=${failed.length}`);
  await ctx.close();
}
await browser.close();
const out = path.resolve('qa-captures/perf', `${LABEL}-pages.json`);
fs.writeFileSync(out, JSON.stringify(results, null, 2));
console.log('Report:', out);

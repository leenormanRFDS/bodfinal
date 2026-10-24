#!/usr/bin/env node
/**
 * Full-page / element screenshots of site pages for visual QA (desktop 1440, mobile 390).
 *   node scripts/capture-pages.mjs --url <base> --out <dir> [--pages /,/story] [--selector .s-film] [--full]
 * Reduced motion; scrolls through the page first so lazy images and reveals settle.
 */
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';
const args = Object.fromEntries(process.argv.slice(2).reduce((a, c, i, all) => { if (c.startsWith('--')) a.push([c.slice(2), all[i + 1] && !all[i + 1].startsWith('--') ? all[i + 1] : 'true']); return a; }, []));
const BASE = (args.url || 'http://127.0.0.1:3000').replace(/\/$/, '');
const OUT = path.resolve(args.out || 'qa-captures/pages');
const PAGES = (args.pages || '/').split(',');
fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined, args: ['--no-sandbox'] });
const VPS = [
  { name: 'desktop', width: 1440, height: 900, isMobile: false, deviceScaleFactor: 1 },
  { name: 'mobile', width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
];
for (const vp of VPS) {
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, isMobile: vp.isMobile, hasTouch: !!vp.hasTouch, deviceScaleFactor: vp.deviceScaleFactor, reducedMotion: 'reduce' });
  for (const p of PAGES) {
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('response', (r) => { if (r.status() >= 400 && !r.url().includes('_vercel')) errors.push(`${r.status()} ${r.url()}`); });
    await page.goto(BASE + p, { waitUntil: 'load', timeout: 120000 });
    await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 600) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); } window.scrollTo(0, 0); });
    await page.waitForTimeout(1500);
    const slug = (p === '/' ? 'home' : p.replace(/\//g, '-').replace(/^-/, ''));
    if (args.selector) {
      const el = page.locator(args.selector).first();
      await el.scrollIntoViewIfNeeded();
      await page.waitForTimeout(800);
      await el.screenshot({ path: path.join(OUT, `${slug}-${vp.name}-el.png`), timeout: 60000 });
    } else {
      await page.screenshot({ path: path.join(OUT, `${slug}-${vp.name}.png`), fullPage: args.full === 'true', timeout: 120000 });
    }
    console.log(`${vp.name} ${p}${errors.length ? '  ERRORS: ' + errors.slice(0, 4).join(' | ') : ''}`);
    await page.close();
  }
  await ctx.close();
}
await browser.close();

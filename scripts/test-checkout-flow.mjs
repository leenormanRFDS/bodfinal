// Checkout flow check against a deployed preview (Rezdy stubbed: the sandbox cannot reach rezdy.com).
// Usage: node scripts/test-checkout-flow.mjs <base-url> <vercel-share-token>
// Paths: desktop iframe; own-tab (Apple path, forced via ?checkout=tab); live-availability failure.
import { chromium } from 'playwright-core';
const [B, share] = process.argv.slice(2);
const b = await chromium.launch();
async function run(label, viewport, query, failAvail = false) {
  const ctx = await b.newContext({ viewport, deviceScaleFactor: 2 });
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  // Rezdy is unreachable from this sandbox: stub its pages so the flow can be observed.
  await ctx.route(/rezdy\.com/, r => r.fulfill({ status: 200, contentType: 'text/html', body: '<html><body>REZDY STUB</body></html>' }));
  if (failAvail) await ctx.route(/\/api\/availability/, async (r) => {
    const res = await r.fetch(); const d = await res.json(); d.reason = 'Rezdy 503';
    r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(d) });
  });
  await p.goto(`${B}/?_vercel_share=${share}`, { waitUntil: 'load' });
  await p.goto(`${B}/tickets${query}`, { waitUntil: 'networkidle' });
  await p.locator('[data-pkg="general-entry"]').click();
  await p.waitForTimeout(800);
  // Family Pass tier row "+"
  await p.getByRole('button', { name: /continue to date/i }).click(); await p.waitForTimeout(700);
  await p.locator('#step-date button.day:not([disabled])').first().click(); await p.waitForTimeout(900);
  const slot = p.locator('#step-time button.slot').first();
  if (await slot.count() && await slot.isVisible()) { await slot.click(); await p.waitForTimeout(500); }
  const popupP = ctx.waitForEvent('page', { timeout: 8000 }).catch(() => null);
  await p.locator('[data-book]').click();
  const popup = await popupP;
  await p.waitForTimeout(4000);
  const r = await p.evaluate(() => ({
    modalOpen: document.querySelector('[data-comodal]')?.classList.contains('is-open'),
    remind: document.querySelector('[data-coremind]')?.textContent,
    iframeSrc: document.querySelector('.co-modal__frame iframe')?.getAttribute('src')?.slice(0, 140),
    tabPanel: !document.querySelector('[data-cotab]')?.hidden,
    note: document.querySelector('[data-mocknote]')?.hidden ? null : document.querySelector('[data-mocknote]')?.textContent,
    seatBadges: document.querySelectorAll('.slot__seats').length,
  }));
  console.log(`== ${label}`, JSON.stringify(r));
  console.log('   popup url:', popup ? popup.url().slice(0, 160) : 'none', ' errors:', errs.slice(0, 3));
  await p.screenshot({ path: `qa-captures/ticketing-${label}.png` });
  await ctx.close();
}
await run('desktop-iframe', { width: 1440, height: 900 }, '');
await run('mobile-owntab', { width: 390, height: 844 }, '?checkout=tab');
await run('desktop-livefail', { width: 1440, height: 900 }, '', true);
await b.close();

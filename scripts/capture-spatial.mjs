#!/usr/bin/env node
/**
 * THE BOMBING OF DARWIN — Spatial Engine visual capture harness
 *
 * Reproducible, identical-camera captures of /story beats for visual QA.
 *
 *  - Drives beats the way a visitor does: scrolls the real timeline entry
 *    ([data-beat-index]) into the reading position, rather than calling
 *    internal APIs.
 *  - Uses prefers-reduced-motion so the camera cuts to the authored pose
 *    instantly. Captures are therefore pose-identical across runs/branches.
 *  - Waits for the globe tiles to finish loading before capturing.
 *  - Writes a JSON report per run: camera pose, imagery layers, visible
 *    entities per data source, console errors and failed requests.
 *
 * Usage:
 *   node scripts/capture-spatial.mjs --url http://127.0.0.1:3000 --out <dir> [--beats 2,4] [--label before]
 *
 * Delivery assets (run after any change to a beat's camera, labels or markers):
 *   --posters        also write the live canvas of each beat (no page chrome) to
 *                    <out>/posters/{desktop|mobile}/beat{N}.png, then convert them to
 *                    public/spatial-posters/** /*.webp and update src/lib/spatial/poster-manifest.json
 *                    (scripts/cartography/encode_posters.py)
 *   --record-tiles   record the basemap tiles each beat requests and write
 *                    src/lib/spatial/beat-tiles.json (used for prefetching the next beat)
 *   Use --beats 0,1,2,3,4,5,6,7 with both.
 *
 * Browser resolution (no hardcoded cache paths):
 *   PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH, else playwright-core's default.
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

const BASE = args.url || 'http://127.0.0.1:3000';
const OUT = path.resolve(args.out || 'qa-captures');
const LABEL = args.label || 'capture';
const BEATS = (args.beats || '2,3,4').split(',').map((n) => parseInt(n, 10));

const POSTERS = args.posters === 'true';
const RECORD_TILES = args['record-tiles'] === 'true';
const VIEWPORTS = [
  // Posters are rendered at 1.5x on desktop so they stay crisp on high-density laptop screens.
  { name: 'desktop-1440', layout: 'desktop', width: 1440, height: 900, isMobile: false, deviceScaleFactor: POSTERS ? 1.5 : 1 },
  { name: 'mobile-390', layout: 'mobile', width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
];

const STATE_FOR_BEAT = {
  0: 'BEAT_0_TIMOR_LAUNCH',
  1: 'BEAT_1_BATHURST_WARNING',
  2: 'BEAT_2_HARBOUR_STRIKE',
  3: 'BEAT_3_POST_OFFICE',
  4: 'BEAT_4_PEARY_ATTACK',
  5: 'BEAT_5_RAAF_AIRFIELD',
  6: 'BEAT_6_PEARY_LOST',
  7: 'BEAT_7_RECKONING',
};

fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined,
  args: ['--no-sandbox', '--enable-webgl', '--ignore-gpu-blocklist', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});

const report = { label: LABEL, base: BASE, capturedAt: new Date().toISOString(), runs: [] };
const beatTiles = { layouts: { desktop: {}, mobile: {} } };

for (const vp of VIEWPORTS) {
  const context = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: vp.deviceScaleFactor,
    isMobile: vp.isMobile,
    hasTouch: !!vp.hasTouch,
    reducedMotion: 'reduce',
  });
  const page = await context.newPage();
  const consoleErrors = [];
  const failedRequests = [];
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') consoleErrors.push(`[${m.type()}] ${m.text()}`.slice(0, 400)); });
  page.on('pageerror', (e) => consoleErrors.push(`[pageerror] ${e.message}`.slice(0, 400)));
  page.on('requestfailed', (r) => failedRequests.push(`${r.failure()?.errorText} ${r.url()}`.slice(0, 300)));
  page.on('response', (r) => { if (r.status() >= 400) failedRequests.push(`${r.status()} ${r.url()}`.slice(0, 300)); });
  let tileSet = new Set();
  page.on('request', (r) => {
    const m = r.url().match(/\/tiles\/darwin-basemap\/(\d+)\/(\d+)\/(\d+)\.png/);
    if (m) tileSet.add(`${m[1]}/${m[2]}/${m[3]}`);
  });

  await page.goto(`${BASE}/story`, { waitUntil: 'domcontentloaded', timeout: 90000 });

  // Bring the timeline near so the engine lazy-initialises, then wait for readiness.
  await page.evaluate(() => document.querySelector('.s-tl-section')?.scrollIntoView({ block: 'start' }));
  await page.waitForFunction(() => window.__DARWIN_SPATIAL_VIEWER__?.getStatus?.().isReady === true, null, { timeout: 120000 });

  for (const beat of BEATS) {
    const stateId = STATE_FOR_BEAT[beat];
    tileSet = new Set();
    // Scroll the beat article to the reading line the story controller uses (viewport centre).
    await page.evaluate((idx) => {
      const el = document.querySelector(`[data-beat-index="${idx}"]`);
      if (!el) return;
      const r = el.getBoundingClientRect();
      window.scrollBy(0, r.top + r.height / 2 - window.innerHeight / 2);
      window.dispatchEvent(new Event('scroll'));
    }, beat);

    const reached = await page
      .waitForFunction((sid) => {
        const s = window.__DARWIN_SPATIAL_VIEWER__?.getStatus?.();
        return s && s.activeStateId === sid && !s.isFlying;
      }, stateId, { timeout: 20000 })
      .then(() => true)
      .catch(() => false);

    // Wait for globe tiles to settle (bounded), then force a final render.
    await page.waitForFunction(() => {
      const v = window.__DARWIN_SPATIAL_VIEWER__?.viewer;
      if (!v) return true;
      v.scene.requestRender();
      return v.scene.globe.tilesLoaded;
    }, null, { timeout: Number(args['tiles-timeout'] || 120000), polling: 500 }).catch(() => {});
    // Software WebGL (headless SwiftShader) renders ~1 frame/s; allow the last tiles to composite.
    await page.waitForTimeout(2500);

    const inventory = await page.evaluate(() => {
      const sv = window.__DARWIN_SPATIAL_VIEWER__;
      const v = sv?.viewer;
      if (!v) return null;
      const C = window.Cesium || null;
      const cam = v.camera.positionCartographic;
      const layers = [];
      for (let i = 0; i < v.scene.imageryLayers.length; i++) {
        const l = v.scene.imageryLayers.get(i);
        const p = l.imageryProvider;
        layers.push({ i, show: l.show, alpha: l.alpha, url: p?._resource?._url || p?.url || p?.constructor?.name });
      }
      const sources = [];
      for (let i = 0; i < v.dataSources.length; i++) {
        const ds = v.dataSources.get(i);
        const visible = ds.entities.values.filter((e) => e.isShowing);
        sources.push({
          name: ds.name,
          visible: visible.length,
          labels: visible.filter((e) => e.label).map((e) => (e.label.text?.getValue?.() ?? '').replace(/\n/g, ' / ')),
          polygons: visible.filter((e) => e.polygon).map((e) => e.name || '(unnamed polygon)'),
        });
      }
      return {
        status: sv.getStatus(),
        camera: {
          lon: +(cam.longitude * 180 / Math.PI).toFixed(5),
          lat: +(cam.latitude * 180 / Math.PI).toFixed(5),
          heightM: Math.round(cam.height),
          headingDeg: +(v.camera.heading * 180 / Math.PI).toFixed(1),
          pitchDeg: +(v.camera.pitch * 180 / Math.PI).toFixed(1),
        },
        tilesLoaded: v.scene.globe.tilesLoaded,
        layers,
        sources,
        clock: document.querySelector('[data-clock-t]')?.textContent?.trim() || null,
      };
    });

    if (RECORD_TILES) {
      beatTiles.layouts[vp.layout][String(beat)] = [...tileSet].map((k) => k.split('/').map(Number)).sort((a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2]);
    }
    if (POSTERS) {
      // The live canvas only (map + WebGL labels), without page text, scrims or dock: this is
      // exactly what the poster layer replaces. Read back in the same task as a forced render.
      // Phones show the poster at 2–3x device pixels; the live map renders at 1.25x. Render the
      // poster at 2x so labels stay crisp, wait for any finer tiles, then restore.
      const posterScale = vp.layout === 'mobile' ? 2 : null;
      if (posterScale) {
        await page.evaluate((sc) => {
          const v = window.__DARWIN_SPATIAL_VIEWER__.viewer;
          window.__posterPrevScale = v.resolutionScale;
          v.resolutionScale = sc;
          v.scene.requestRender();
        }, posterScale);
        await page.waitForTimeout(1500);
        await page.waitForFunction(() => {
          const v = window.__DARWIN_SPATIAL_VIEWER__.viewer;
          v.scene.requestRender();
          return v.scene.globe.tilesLoaded;
        }, null, { timeout: 120000, polling: 500 }).catch(() => {});
        await page.waitForTimeout(2500);
      }
      const dataUrl = await page.evaluate(() => {
        const v = window.__DARWIN_SPATIAL_VIEWER__?.viewer;
        // requestRenderMode: render() is a no-op unless a render was requested, and the
        // (non-preserved) drawing buffer would read back cleared — all black.
        v.scene.requestRender();
        v.render();
        return v.scene.canvas.toDataURL('image/png');
      });
      if (posterScale) {
        await page.evaluate(() => {
          const v = window.__DARWIN_SPATIAL_VIEWER__.viewer;
          v.resolutionScale = window.__posterPrevScale;
          v.scene.requestRender();
        });
      }
      if (dataUrl.length < 20000) throw new Error(`Poster for ${vp.layout} beat ${beat} read back blank (${dataUrl.length} bytes)`);
      const pdir = path.join(OUT, 'posters', vp.layout);
      fs.mkdirSync(pdir, { recursive: true });
      fs.writeFileSync(path.join(pdir, `beat${beat}.png`), Buffer.from(dataUrl.split(',')[1], 'base64'));
    }

    const file = path.join(OUT, `${LABEL}-${vp.name}-beat${beat}.png`);
    await page.screenshot({ path: file, timeout: 180000 });
    report.runs.push({ viewport: vp.name, beat, stateId, reached, file, inventory });
    console.log(`${vp.name} beat ${beat} (${stateId}) reached=${reached} -> ${path.basename(file)}`);
  }

  report.runs.push({ viewport: vp.name, consoleErrors: [...new Set(consoleErrors)], failedRequests: [...new Set(failedRequests)] });
  await context.close();
}

await browser.close();
fs.writeFileSync(path.join(OUT, `${LABEL}-report.json`), JSON.stringify(report, null, 2));
if (RECORD_TILES) {
  const target = path.resolve('src/lib/spatial/beat-tiles.json');
  // Merge: a run over a subset of beats keeps the other beats' lists.
  let merged = { layouts: { desktop: {}, mobile: {} } };
  try { merged = JSON.parse(fs.readFileSync(target, 'utf8')); } catch { /* first run */ }
  for (const l of ['desktop', 'mobile']) merged.layouts[l] = { ...(merged.layouts?.[l] || {}), ...beatTiles.layouts[l] };
  fs.writeFileSync(target, JSON.stringify(merged));
  console.log(`Beat tile lists: ${target}`);
}
if (POSTERS) {
  const { execFileSync } = await import('node:child_process');
  execFileSync('python3', ['scripts/cartography/encode_posters.py', '--src', path.join(OUT, 'posters'), '--beats', BEATS.join(',')], { stdio: 'inherit' });
}
console.log(`Report: ${path.join(OUT, `${LABEL}-report.json`)}`);

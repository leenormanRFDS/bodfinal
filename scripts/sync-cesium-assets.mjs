#!/usr/bin/env node
/**
 * Sync CesiumJS static runtime assets into /public/cesium.
 *
 * CesiumJS needs its Workers, Widgets CSS, Assets and ThirdParty folders to be
 * served from CESIUM_BASE_URL (/cesium/). They must come from the SAME version
 * of the `cesium` package that the app imports, otherwise web workers and the
 * main bundle drift apart.
 *
 * Previously /public/cesium was a hand-committed partial copy (Cesium 1.145,
 * with Workers/ and Widgets/ missing and NaturalEarthII nested inside
 * LensFlare/). That produced: 404 widgets.css (canvas never sized to its
 * stage), 404 workers (no polygon/ellipse/ground geometry, globe tiles never
 * completing) and a broken offline fallback.
 *
 * This script runs before `astro dev` and `astro build`, so the served assets
 * always match node_modules/cesium. /public/cesium is git-ignored.
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const cesiumPkgDir = path.dirname(require.resolve('cesium/package.json'));
const { version } = JSON.parse(fs.readFileSync(path.join(cesiumPkgDir, 'package.json'), 'utf8'));
const src = path.join(cesiumPkgDir, 'Build', 'Cesium');
const dest = path.join(root, 'public', 'cesium');
const FOLDERS = ['Workers', 'ThirdParty', 'Assets', 'Widgets'];

const stampFile = path.join(dest, '.cesium-version');
const current = fs.existsSync(stampFile) ? fs.readFileSync(stampFile, 'utf8').trim() : null;
const complete = FOLDERS.every((f) => fs.existsSync(path.join(dest, f)));

if (current === version && complete) {
  console.log(`[cesium-assets] /public/cesium already at ${version}`);
  process.exit(0);
}

for (const f of FOLDERS) {
  if (!fs.existsSync(path.join(src, f))) {
    console.error(`[cesium-assets] Missing ${f} in ${src}. Is the cesium package installed?`);
    process.exit(1);
  }
}

fs.rmSync(dest, { recursive: true, force: true });
fs.mkdirSync(dest, { recursive: true });
for (const f of FOLDERS) {
  fs.cpSync(path.join(src, f), path.join(dest, f), { recursive: true });
}
fs.writeFileSync(stampFile, `${version}\n`);
console.log(`[cesium-assets] Synced Cesium ${version} (${FOLDERS.join(', ')}) -> public/cesium`);

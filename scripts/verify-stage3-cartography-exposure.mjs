/**
 * THE BOMBING OF DARWIN — VERIFICATION SUITE
 * Spatial Cartography: basemap integrity, Cesium runtime assets, truth constraints, legibility.
 *
 * Replaces the earlier string-match suite, which asserted implementation details of the
 * defective cartography (hand-typed coastline names, CARTO exposure numbers) rather than
 * properties a visitor depends on. These checks fail if the map would actually be broken.
 */

import fs from 'node:fs';
import path from 'node:path';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`✓ ${message}`);
    passed++;
  } else {
    console.error(`✗ FAIL: ${message}`);
    failed++;
  }
}

console.log('------------------------------------------------------------');
console.log('STAGE 3 CARTOGRAPHY — BASEMAP, RUNTIME ASSETS, TRUTH, LEGIBILITY');
console.log('------------------------------------------------------------\n');

const read = (p) => fs.readFileSync(path.resolve(p), 'utf-8');

// 1. Basemap manifest and tile pyramid completeness ---------------------------------------
const manifestPath = path.resolve('src/lib/spatial/basemap-manifest.json');
assert(fs.existsSync(manifestPath), 'basemap-manifest.json exists');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
assert(Array.isArray(manifest.layers) && manifest.layers.length >= 4, `Manifest defines nested basemap layers (${manifest.layers?.length})`);
assert(/^#[0-9A-F]{6}$/i.test(manifest.waterColor), `Manifest declares water colour (${manifest.waterColor})`);
assert(manifest.urlTemplate.startsWith('/tiles/'), 'Basemap tiles are served by the site itself (no third-party key or quota)');
assert(/OpenStreetMap/.test(manifest.attribution), 'Basemap attribution credits OpenStreetMap contributors (ODbL)');

function tilesForRect(z, [lon1, lat1, lon2, lat2]) {
  const n = 2 ** z;
  const tx = (lon) => Math.floor(((lon + 180) / 360) * n);
  const ty = (lat) => {
    const r = (Math.max(Math.min(lat, 85.0511), -85.0511) * Math.PI) / 180;
    return Math.floor(((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * n);
  };
  const out = [];
  for (let x = Math.max(0, tx(lon1)); x <= Math.min(n - 1, tx(lon2 - 1e-12)); x++)
    for (let y = Math.max(0, ty(lat2)); y <= Math.min(n - 1, ty(lat1 + 1e-12)); y++) out.push([x, y]);
  return out;
}

const tileRoot = path.resolve('public', manifest.urlTemplate.replace(/^\//, '').split('/{z}')[0]);
let expected = 0;
let missing = [];
for (const layer of manifest.layers) {
  for (let z = layer.minimumLevel; z <= layer.maximumLevel; z++) {
    for (const [x, y] of tilesForRect(z, layer.rect)) {
      expected++;
      if (!fs.existsSync(path.join(tileRoot, String(z), String(x), `${y}.png`))) missing.push(`${layer.id} ${z}/${x}/${y}`);
    }
  }
}
assert(missing.length === 0, `Every tile Cesium can request exists (${expected - missing.length}/${expected})${missing.length ? ' e.g. ' + missing.slice(0, 3).join(', ') : ''}`);

// Story geography must be covered at harbour-scale detail.
const covers = (layer, lon, lat) => lon >= layer.rect[0] && lon <= layer.rect[2] && lat >= layer.rect[1] && lat <= layer.rect[3];
const finest = (lon, lat) => Math.max(...manifest.layers.filter((l) => covers(l, lon, lat)).map((l) => l.maximumLevel));
assert(finest(130.8443, -12.4647) >= 16, 'Post Office precinct covered at z16 detail');
assert(finest(130.8492, -12.4704) >= 16, 'Stokes Hill Wharf covered at z16 detail');
assert(finest(130.829, -12.475) >= 15, 'USS Peary wreck site covered at >= z15 detail');
assert(finest(130.627, -11.758) >= 12, 'Bathurst Island mission covered at >= z12 detail');

// 2. Cartography manager uses the authored basemap only ----------------------------------
const carto = read('src/lib/spatial/cartography-manager.ts');
assert(!/cartocdn|basemaps\.carto/.test(carto), 'No CARTO dependency (anonymous CARTO returns "API KEY REQUIRED" tiles)');
assert(!/archival-texture-/.test(carto), 'AI-generated "archival texture" rasters are not presented as cartography');
assert(carto.includes('basemap-manifest.json') && carto.includes('globe.baseColor = water'), 'Globe base colour is driven by the manifest water colour (invisible coverage edge)');

// 3. Viewer: no default ion imagery, request-render preserved ----------------------------
const viewer = read('src/lib/spatial/spatial-viewer.ts');
assert(viewer.includes('baseLayer: false'), 'Viewer disables default Cesium ion imagery');
assert(viewer.includes('requestRenderMode: true'), 'requestRenderMode is preserved');
assert(!fs.existsSync(path.resolve('src/lib/spatial/spatial-coastline-overlay.ts')), 'Hand-typed coastline overlay removed (real coastline is in the basemap)');

// 4. Cesium runtime assets are generated from the installed package -----------------------
const pkg = JSON.parse(read('package.json'));
assert(/sync-cesium-assets/.test(pkg.scripts.build) && /sync-cesium-assets/.test(pkg.scripts.dev), 'dev and build sync Cesium Workers/Widgets/Assets from node_modules');
for (const f of ['Workers', 'Widgets/widgets.css', 'Assets/approximateTerrainHeights.json', 'Assets/Textures/NaturalEarthII']) {
  assert(fs.existsSync(path.resolve('public/cesium', f)), `public/cesium/${f} present (run npm run cesium:assets if this fails locally)`);
}

// 5. Truth constraints in spatial code -----------------------------------------------------
const overlay = read('src/lib/spatial/spatial-evidence-overlay.ts');
assert(!fs.existsSync(path.resolve('src/lib/spatial/spatial-1942-traces.ts')), 'Invented 1942 wharf/jetty/street coordinates removed (canon: STOKES_HILL_WHARF_1942 and FORT_HILL_WHARF_1942 are null)');
assert(!/showBackground:\s*true/.test(overlay), 'Map labels use halos, not opaque background boxes');
assert(overlay.includes("canonVessel('USS_PEARY_DD226')"), 'USS Peary marker is anchored on the canonical surveyed position');
assert(!/NINE KILLED|9 KILLED|TEN KILLED/.test(overlay), 'Disputed Post Office casualty count is not asserted on the map');
const locations = JSON.parse(read('data/entities/locations.json')).entities;
const shw1942 = locations.find((e) => e.id === 'STOKES_HILL_WHARF_1942');
assert(shw1942 && shw1942.latitude === null, 'Canon still records the 1942 Stokes Hill Wharf geometry as unresolved');

// 6. Scrim (unchanged contract from previous suite) -----------------------------------------
const story = read('src/pages/story.astro');
assert(story.includes('rgba(7, 9, 11, 0.85) 0%'), 'Desktop scrim starts at 0.85 darkness under text');
assert(story.includes('transparent 75%') || story.includes('transparent 100%'), 'Desktop scrim leaves right geographic focal zone transparent');

// 7. Legibility: contrast of the authored palette ------------------------------------------
const builder = read('scripts/cartography/build_basemap.py');
const tuple = (name) => {
  const m = builder.match(new RegExp(`^${name} = \\((\\d+), (\\d+), (\\d+)\\)`, 'm'));
  return m ? m.slice(1, 4).map(Number) : null;
};
function lum([r, g, b]) {
  const f = (c) => ((c /= 255) <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
const ratio = (a, b) => (Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05);
const WATER = tuple('WATER');
const LAND = tuple('LAND');
const BONE = [238, 233, 223];
const GOLD = [198, 161, 91];
assert(WATER && LAND, 'Palette parsed from basemap builder');
assert(manifest.waterColor.toUpperCase() === '#' + WATER.map((v) => v.toString(16).padStart(2, '0')).join('').toUpperCase(), 'Manifest water colour equals builder WATER');
assert(ratio(LAND, WATER) >= 1.18, `Land is visibly lighter than water (${ratio(LAND, WATER).toFixed(2)}:1)`);
assert(ratio(BONE, LAND) >= 7.0, `Ivory labels on land meet AAA (${ratio(BONE, LAND).toFixed(2)}:1)`);
assert(ratio(GOLD, LAND) >= 4.5, `Gold event marks on land meet AA (${ratio(GOLD, LAND).toFixed(2)}:1)`);

console.log('\n------------------------------------------------------------');
console.log(`VERIFICATION SUMMARY: ${passed} PASSED, ${failed} FAILED`);
console.log('------------------------------------------------------------');

if (failed > 0) {
  process.exit(1);
}

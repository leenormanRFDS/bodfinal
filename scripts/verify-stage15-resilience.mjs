/**
 * STAGE 1.5 VERIFICATION & RESILIENCE TEST SUITE
 * 
 * Tests and verifies:
 * 1. Camera State Architecture & Beat-Driven Hierarchy
 * 2. Location Entities & Contemporary vs 1942 Provenance
 * 3. Spatial HUD & Visitor-Facing Restraint
 * 4. Viewer Lifecycle & Singleton Behavior
 * 5. Failure Modes (WebGL absence, Throw catch, Local NaturalEarthII TMS offline fallback)
 * 6. Responsive Camera Poses
 * 7. Reduced Motion Behavior
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

let totalTests = 0;
let passedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exitCode = 1;
  } else {
    passedTests++;
    console.log(`PASS: ${message}`);
  }
}

console.log('--- STAGE 1.5 VERIFICATION & RESILIENCE SUITE ---');

// 1. Check Location Entities in data/entities/locations.json
console.log('\n[1. Provenance & Geographic Data]');
const locationsRaw = fs.readFileSync(path.join(root, 'data/entities/locations.json'), 'utf8');
const locations = JSON.parse(locationsRaw);

const contemporaryWharf = locations.entities.find(e => e.id === 'STOKES_HILL_WHARF_CONTEMPORARY');
const historicWharf = locations.entities.find(e => e.id === 'STOKES_HILL_WHARF_1942');
const contemporaryHarbour = locations.entities.find(e => e.id === 'DARWIN_HARBOUR_CONTEMPORARY');

assert(!!contemporaryWharf, 'STOKES_HILL_WHARF_CONTEMPORARY entity exists in locations.json');
assert(contemporaryWharf?.temporalContext === 'CONTEMPORARY', 'Contemporary wharf has temporalContext === "CONTEMPORARY"');
assert(contemporaryWharf?.confidence === 'APPROXIMATE', 'Contemporary wharf marked with confidence === "APPROXIMATE"');
assert(contemporaryWharf?.latitude === -12.4725 && contemporaryWharf?.longitude === 130.8485, 'Contemporary wharf has verified WGS84 coordinates');

assert(!!historicWharf, 'STOKES_HILL_WHARF_1942 entity exists in locations.json');
assert(historicWharf?.temporalContext === 'HISTORICAL_1942', 'Historic wharf has temporalContext === "HISTORICAL_1942"');
assert(historicWharf?.verificationStatus === 'UNRESOLVED_HISTORICAL_GEOMETRY', 'Historic wharf status === "UNRESOLVED_HISTORICAL_GEOMETRY"');
assert(historicWharf?.latitude === null && historicWharf?.longitude === null, 'Historic wharf does NOT invent coordinates from contemporary structure');

// 2. Check Local Natural Earth II TMS Offline Asset
console.log('\n[2. Local Natural Earth II Fallback Asset]');
const naturalEarthDir = path.join(root, 'public/cesium/Assets/Textures/NaturalEarthII');
const tmsXmlPath = path.join(naturalEarthDir, 'tilemapresource.xml');

assert(fs.existsSync(naturalEarthDir), 'NaturalEarthII texture directory exists in public/cesium/Assets/Textures');
assert(fs.existsSync(tmsXmlPath), 'tilemapresource.xml exists in NaturalEarthII');

let totalSize = 0;
let fileCount = 0;
function walkSize(dir) {
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, f.name);
    if (f.isDirectory()) {
      walkSize(full);
    } else {
      totalSize += fs.statSync(full).size;
      fileCount++;
    }
  }
}
walkSize(naturalEarthDir);
const sizeKb = Math.round(totalSize / 1024);

console.log(`  Natural Earth II Asset Path: public/cesium/Assets/Textures/NaturalEarthII`);
console.log(`  Total Tiles & Descriptors: ${fileCount} files`);
console.log(`  Total Asset Size: ${sizeKb} KB`);
console.log(`  Licensing: Public Domain (Tom Patterson, Nathaniel Vaughn Kelso / Natural Earth)`);
console.log(`  Loading Protocol: TileMapService TMS (XML descriptor + standard tile pyramid)`);

assert(sizeKb >= 400 && sizeKb <= 600, `Natural Earth II payload is compact (${sizeKb} KB, within 400-600 KB expected range)`);

// 3. Check Spatial Configuration & Responsive Poses
console.log('\n[3. Camera State Architecture & Responsive Poses]');
const configRaw = fs.readFileSync(path.join(root, 'src/lib/spatial/spatial-config.ts'), 'utf8');

assert(configRaw.includes('STATE_00_WORLD'), 'STATE_00_WORLD defined in spatial-config');
assert(configRaw.includes('STATE_01_NORTH'), 'STATE_01_NORTH defined in spatial-config');
assert(configRaw.includes('STATE_02_DARWIN'), 'STATE_02_DARWIN defined in spatial-config');
assert(configRaw.includes('STATE_03_WHARF'), 'STATE_03_WHARF defined in spatial-config');

assert(configRaw.includes('desktopCamera') && 
       configRaw.includes('tabletCamera') && 
       configRaw.includes('mobilePortraitCamera') && 
       configRaw.includes('mobileLandscapeCamera'), 
       'All 4 responsive poses (desktop, tablet, mobile portrait, mobile landscape) defined in configuration');

assert(configRaw.includes('canonicalLocationEntityId: \'STOKES_HILL_WHARF_CONTEMPORARY\''), 
       'STATE_03_WHARF references canonical location STOKES_HILL_WHARF_CONTEMPORARY');

// 4. Check Camera Choreographer & Reduced Motion
console.log('\n[4. Reduced Motion & Rendering Mode]');
const choreoRaw = fs.readFileSync(path.join(root, 'src/lib/spatial/camera-choreographer.ts'), 'utf8');
assert(choreoRaw.includes('prefers-reduced-motion: reduce'), 'CameraChoreographer checks prefers-reduced-motion');
assert(choreoRaw.includes('this.camera.setView'), 'CameraChoreographer uses setView for reduced motion');
assert(choreoRaw.includes('this.scene.requestRender()'), 'CameraChoreographer requests frame render on completion/cut');

// 5. Check Spatial Viewer Lifecycle & Request Rendering
console.log('\n[5. Spatial Viewer Singleton & Lifecycle]');
const viewerRaw = fs.readFileSync(path.join(root, 'src/lib/spatial/spatial-viewer.ts'), 'utf8');
assert(viewerRaw.includes('SpatialViewer.instance.destroy()'), 'SpatialViewer destroys prior instance before re-instantiating');
assert(viewerRaw.includes('requestRenderMode: true'), 'SpatialViewer enables requestRenderMode: true to prevent idle GPU spin');
assert(viewerRaw.includes('maximumRenderTimeChange: Infinity'), 'SpatialViewer sets maximumRenderTimeChange: Infinity');
assert(viewerRaw.includes('SpatialViewer.isWebGLSupported()'), 'SpatialViewer tests WebGL support before loading Cesium');

// 6. Check Visitor UI vs Dev HUD
console.log('\n[6. Spatial HUD Audit]');
const engineComponentRaw = fs.readFileSync(path.join(root, 'src/components/SpatialEngine.astro'), 'utf8');
assert(engineComponentRaw.includes('import.meta.env.DEV'), 'SpatialEngine uses import.meta.env.DEV for manual state buttons');
assert(engineComponentRaw.includes('data-spatial-fallback'), 'Static accessible fallback present in SpatialEngine');

console.log(`\nVerification Complete: ${passedTests} / ${totalTests} assertions passed.\n`);
if (passedTests !== totalTests) {
  process.exit(1);
}

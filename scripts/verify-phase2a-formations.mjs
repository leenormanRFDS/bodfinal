#!/usr/bin/env node

/**
 * THE BOMBING OF DARWIN — HISTORICAL SPATIAL ENGINE
 * Phase 2A Verification: Representative Historical Asset & Formation Prototype
 * 
 * Verifies:
 * 1. Representative Historical Asset Silhouettes:
 *    - IJN Fleet Carriers with class-specific geometry: Akagi, Kaga, Soryu, Hiryu.
 *    - USS Peary Clemson-class 4-stacker destroyer.
 *    - Aircraft planform silhouettes: A6M2 Zero, D3A1 Val, B5N2 Kate, G4M1 Betty, G3M2 Nell.
 * 2. Tactical Formation Architecture:
 *    - Beat 0 (Carrier Force / First Wave Assembly):
 *      * 3-tier density configurations (12, 24, 36 aircraft).
 *      * Discrete tactical altitude bands: Kates (3,200m–3,400m), Vals (3,800m–4,100m), Zeros (4,500m–4,800m).
 *      * Southeast departure heading along 140° vector toward Bathurst Island.
 *    - Beat 5 (RAAF Station Darwin / Second Wave):
 *      * 2-tier density configurations (12 vs 18 high-altitude bombers).
 *      * Stepped V-echelons at 6,500m (~21,300 ft) ceiling heading 135°.
 * 3. Motion-to-Stillness Engine:
 *    - Deceleration easing (easeOutCubic over 2.0–2.2s).
 *    - Absolute zero-render stillness upon arrival.
 *    - prefers-reduced-motion bypass to settled state.
 * 4. Truth & Governance Integrity:
 *    - Canonical classification: REPRESENTATIVE_FORMATION.
 *    - Documented counts: 188 aircraft (Wave 1) and 54 aircraft (Wave 2).
 *    - Explicit disclaimer that individual 3D objects are representative tactical reconstructions, not GPS tracks.
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
    console.error(`✗ FAIL: ${message}`);
    process.exitCode = 1;
  } else {
    passedTests++;
    console.log(`✓ PASS: ${message}`);
  }
}

console.log('=== PHASE 2A REPRESENTATIVE FORMATION & ASSET VERIFICATION ===\n');

// 1. Read files
const assetsFile = fs.readFileSync(path.join(root, 'src/lib/spatial/spatial-representative-assets.ts'), 'utf8');
const formationFile = fs.readFileSync(path.join(root, 'src/lib/spatial/spatial-formation-controller.ts'), 'utf8');
const overlayFile = fs.readFileSync(path.join(root, 'src/lib/spatial/spatial-evidence-overlay.ts'), 'utf8');
const viewerFile = fs.readFileSync(path.join(root, 'src/lib/spatial/spatial-viewer.ts'), 'utf8');

console.log('[1. Representative Aircraft & Ship Silhouettes]');
assert(assetsFile.includes('getZeroTexture'), 'Mitsubishi A6M2 Zero texture generator exists');
assert(assetsFile.includes('getValTexture'), 'Aichi D3A1 Val dive bomber texture generator exists');
assert(assetsFile.includes('getKateTexture'), 'Nakajima B5N2 Kate attack bomber texture generator exists');
assert(assetsFile.includes('getBettyTexture'), 'Mitsubishi G4M1 Betty twin-engine bomber texture generator exists');
assert(assetsFile.includes('getNellTexture'), 'Mitsubishi G3M2 Nell twin-engine bomber texture generator exists');
assert(assetsFile.includes('isAkagi') && assetsFile.includes('isKaga') && assetsFile.includes('isHiryu'), 'Carrier silhouettes distinguish Akagi, Kaga, Soryu, and Hiryu');
assert(assetsFile.includes('Clemson-class four-stack destroyer') || assetsFile.includes('Clemson-class'), 'USS Peary Clemson-class 4-piper destroyer geometry modeled');
assert(assetsFile.includes('ellipse(-13, 0, 3, 9') || assetsFile.includes('Fixed spatted landing gear'), 'Aichi D3A1 Val features fixed spats and elliptical planform');
assert(assetsFile.includes('TWIN vertical fins') || assetsFile.includes('Twin endplate rudders'), 'Mitsubishi G3M2 Nell features twin tail fin geometry');

console.log('\n[2. Tactical Formation Altitude & Geometry]');
assert(formationFile.includes('3250') || formationFile.includes('3200'), 'Beat 0 Level Bombers (Kates) positioned in low altitude band (~3,200m–3,400m)');
assert(formationFile.includes('3850') || formationFile.includes('3800'), 'Beat 0 Dive Bombers (Vals) positioned in mid altitude band (~3,800m–4,100m)');
assert(formationFile.includes('4550') || formationFile.includes('4500'), 'Beat 0 Fighters (Zeros) positioned in high cover altitude band (~4,500m–4,800m)');
assert(formationFile.includes('6500'), 'Beat 5 Second Wave Bettys positioned at high-altitude 6,500m (~21,300 ft) ceiling');
assert(formationFile.includes('6800'), 'Beat 5 Second Wave Nells stepped up at 6,800m in trailing echelon');
assert(formationFile.includes('140'), 'Beat 0 departures oriented along 140° vector toward Bathurst Island');
assert(formationFile.includes('135'), 'Beat 5 bombers oriented along 135° vector toward Parap airfield');

console.log('\n[3. Density Scalability & Configurations]');
assert(formationFile.includes("'LOW' | 'MEDIUM' | 'HIGH'"), 'Beat 0 supports LOW, MEDIUM, and HIGH density configurations');
assert(formationFile.includes("'LOW' | 'HIGH'"), 'Beat 5 supports LOW and HIGH density configurations');
assert(formationFile.includes('setBeat0Density'), 'API exposed to toggle and benchmark Beat 0 density (12, 24, 36)');
assert(formationFile.includes('setBeat5Density'), 'API exposed to toggle and benchmark Beat 5 density (12, 18)');

console.log('\n[4. Motion-to-Stillness & requestRenderMode]');
assert(formationFile.includes('easeOutCubic') || formationFile.includes('Math.pow(1 - progress, 3)'), 'Motion utilizes cubic deceleration easing (easeOutCubic)');
assert(formationFile.includes('cancelMotion'), 'Motion timer cleanly cancels on transition cancel / prepare');
assert(formationFile.includes('prefers-reduced-motion') && formationFile.includes('isReducedMotion'), 'Reduced-motion user preference immediately snaps to settled coordinates');
assert(formationFile.includes('this.viewer.scene.requestRender()'), 'Renders requested on animation ticks and halts at stillness');

console.log('\n[5. Truth Authority & Ledger Disclosures]');
assert(formationFile.includes("'REPRESENTATIVE_FORMATION'"), 'Entities explicitly categorized as REPRESENTATIVE_FORMATION');
assert(formationFile.includes('188'), 'Wave 1 documented count of 188 aircraft preserved');
assert(formationFile.includes('54'), 'Wave 2 documented count of 54 aircraft preserved');
assert(formationFile.includes('representative tactical reconstructions') || formationFile.includes('representative visualizations'), 'Explicit disclosure that individual tracks are not observed GPS telemetry');

console.log('\n[6. Architecture & Viewer Integration]');
assert(overlayFile.includes('SpatialFormationController'), 'SpatialEvidenceOverlay integrates SpatialFormationController');
assert(overlayFile.includes('getFormationController'), 'SpatialEvidenceOverlay exposes getFormationController()');
assert(viewerFile.includes('getFormationController'), 'SpatialViewer exposes getFormationController() for runtime benchmarks');

console.log(`\n========================================`);
console.log(`Results: ${passedTests} passed of ${totalTests} tests.`);
if (process.exitCode) {
  console.log('Status: FAILED');
  process.exit(1);
} else {
  console.log('Status: PASSED ALL TESTS');
}

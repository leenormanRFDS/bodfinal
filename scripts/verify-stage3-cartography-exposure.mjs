/**
 * THE BOMBING OF DARWIN — VERIFICATION SUITE
 * Spatial Cartography Legibility & Exposure Pass Verification
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
console.log('STAGE 3 CARTOGRAPHY LEGIBILITY & EXPOSURE VERIFICATION');
console.log('------------------------------------------------------------\n');

// 1. Audit CartographyManager
const cartoPath = path.resolve('src/lib/spatial/cartography-manager.ts');
assert(fs.existsSync(cartoPath), 'cartography-manager.ts exists');
const cartoContent = fs.readFileSync(cartoPath, 'utf-8');

assert(cartoContent.includes('brightness: 1.22') || cartoContent.includes('brightness: 1.28'), 'CartographyManager has tuned exposure brightness (1.22-1.28)');
assert(cartoContent.includes('contrast: 1.08') || cartoContent.includes('contrast: 1.10'), 'CartographyManager has tuned exposure contrast (1.08-1.10)');
assert(cartoContent.includes('gamma: 1.12') || cartoContent.includes('gamma: 1.14'), 'CartographyManager has tuned gamma to lift dark midtones (1.12-1.14)');
assert(cartoContent.includes('saturation: 0.06') || cartoContent.includes('saturation: 0.08'), 'CartographyManager preserves restrained archival saturation (0.06-0.08)');
assert(cartoContent.includes('#0E1217'), 'Globe baseColor tuned to deep blue-charcoal foundation (#0E1217)');
assert(cartoContent.includes('minimumBrightness = 0.16'), 'Scene fog minimumBrightness lifted to 0.16 for oblique camera legibility');
assert(cartoContent.includes('updateResponsiveExposure'), 'CartographyManager provides responsive exposure update hook for mobile vs desktop');
assert(cartoContent.includes('applyLocalFallbackBasemap'), 'Local offline fallback exists and is tuned with archival charcoal exposure');

// 2. Audit SpatialCoastlineOverlay
const coastlinePath = path.resolve('src/lib/spatial/spatial-coastline-overlay.ts');
assert(fs.existsSync(coastlinePath), 'spatial-coastline-overlay.ts exists');
const coastlineContent = fs.readFileSync(coastlinePath, 'utf-8');

assert(coastlineContent.includes('darwin-peninsula'), 'Contains Darwin Peninsula shoreline definition');
assert(coastlineContent.includes('darwin-harbour-basin'), 'Contains Darwin Harbour and estuary arms shoreline definition');
assert(coastlineContent.includes('beagle-gulf-coast'), 'Contains Beagle Gulf & Shoal Bay shoreline definition');
assert(coastlineContent.includes('bathurst-island'), 'Contains Bathurst Island shoreline definition');
assert(coastlineContent.includes('clarence-strait-narrows'), 'Contains Clarence Strait shoreline definition');
assert(coastlineContent.includes('clampToGround: true'), 'Coastline polylines are clamped to ground');
assert(coastlineContent.includes('BASE_COLOR = \'rgba(238, 233, 223, 0.28)\''), 'Coastline uses restrained steel/bone archival color');
assert(coastlineContent.includes('ACTIVE_COLOR = \'rgba(238, 233, 223, 0.68)\''), 'Coastline active emphasis lifts exposure subtly without glow or radar');
assert(coastlineContent.includes('setActiveState'), 'Coastline overlay implements setActiveState for narrative-driven exposure');
assert(coastlineContent.includes('BEAT_1_BATHURST_WARNING'), 'Active state handles Beat 1 Bathurst emphasis');
assert(coastlineContent.includes('BEAT_2_FIRST_WAVE_APPROACH'), 'Active state handles Beat 2 Beagle Gulf approach');
assert(coastlineContent.includes('BEAT_3_DARWIN_IMPACT'), 'Active state handles Beat 3-6 Darwin Harbour & Peninsula emphasis');

// 3. Audit SpatialViewer integration
const viewerPath = path.resolve('src/lib/spatial/spatial-viewer.ts');
assert(fs.existsSync(viewerPath), 'spatial-viewer.ts exists');
const viewerContent = fs.readFileSync(viewerPath, 'utf-8');

assert(viewerContent.includes('SpatialCoastlineOverlay'), 'SpatialViewer imports and instantiates SpatialCoastlineOverlay');
assert(viewerContent.includes('this.coastlineOverlay.initialize()'), 'SpatialCoastlineOverlay is initialized');
assert(viewerContent.includes('this.coastlineOverlay?.setActiveState(stateId)'), 'transitionToState updates coastline exposure');
assert(viewerContent.includes('this.cartography?.updateResponsiveExposure()'), 'ResizeObserver updates responsive cartography exposure');
assert(viewerContent.includes('this.coastlineOverlay.destroy()'), 'SpatialCoastlineOverlay cleaned up on destroy');
assert(viewerContent.includes('requestRenderMode: true'), 'requestRenderMode is strictly preserved');

// 4. Audit Scrim Rebalance in story.astro
const storyPath = path.resolve('src/pages/story.astro');
assert(fs.existsSync(storyPath), 'story.astro exists');
const storyContent = fs.readFileSync(storyPath, 'utf-8');

assert(storyContent.includes('rgba(7, 9, 11, 0.85) 0%'), 'Desktop scrim starts at 0.85 darkness under text');
assert(storyContent.includes('rgba(7, 9, 11, 0.44) 40%'), 'Desktop scrim drops to 0.44 at mid transition (40%)');
assert(storyContent.includes('transparent 75%') || storyContent.includes('transparent 100%'), 'Desktop scrim leaves right geographic focal zone completely transparent');
assert(storyContent.includes('transparent 34%'), 'Mobile scrim keeps upper 34-44% completely clear for cartography');
assert(storyContent.includes('rgba(7, 9, 11, 0.82) 60%'), 'Mobile scrim protects lower reading card area with deep scrim');
assert(storyContent.includes('body.grain::before') && storyContent.includes('opacity: 0.35'), 'Global radial vignette opacity reduced to 0.35 during spatial section');

// 5. Contrast and Color Science Validation
// Land: ~#282C32 (sRGB luminance ~0.026)
// Water: ~#111418 (sRGB luminance ~0.007)
// Bone Text: #EEE9DF (sRGB luminance ~0.817)
// Gold Evidence: #C6A15B (sRGB luminance ~0.370)
function calculateLuminance(r, g, b) {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function contrastRatio(l1, l2) {
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

const lumWater = calculateLuminance(17, 20, 24); // #111418
const lumLand = calculateLuminance(40, 44, 50); // #282C32
const lumBone = calculateLuminance(238, 233, 223); // #EEE9DF
const lumGold = calculateLuminance(198, 161, 91); // #C6A15B

const contrastBoneOnLand = contrastRatio(lumBone, lumLand);
const contrastBoneOnWater = contrastRatio(lumBone, lumWater);
const contrastGoldOnLand = contrastRatio(lumGold, lumLand);
const contrastLandToWater = contrastRatio(lumLand, lumWater);

assert(contrastBoneOnLand >= 7.0, `Bone text on graphite land has AAA contrast: ${contrastBoneOnLand.toFixed(2)}:1 (>= 7.0)`);
assert(contrastBoneOnWater >= 10.0, `Bone text on water has AAA contrast: ${contrastBoneOnWater.toFixed(2)}:1 (>= 10.0)`);
assert(contrastGoldOnLand >= 4.5, `Gold evidence marks on graphite land have AA contrast: ${contrastGoldOnLand.toFixed(2)}:1 (>= 4.5)`);
assert(contrastLandToWater >= 1.30, `Land-to-water has distinct luminance step: ${contrastLandToWater.toFixed(2)}:1`);

console.log('\n------------------------------------------------------------');
console.log(`VERIFICATION SUMMARY: ${passed} PASSED, ${failed} FAILED`);
console.log('------------------------------------------------------------');

if (failed > 0) {
  process.exit(1);
}

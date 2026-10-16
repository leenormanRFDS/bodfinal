#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');

let failed = false;
const pass = (msg) => console.log(`✓ PASS: ${msg}`);
const fail = (msg) => {
  failed = true;
  console.error(`✗ FAIL: ${msg}`);
};

console.log('=== TRUTH & NARRATIVE CORRECTION AUDIT SUITE ===\n');

// 1. USS PEARY CASUALTIES
const storyBeatsRaw = fs.readFileSync(path.join(root, 'data/story-beats.json'), 'utf8');
const canonRaw = fs.readFileSync(path.join(root, 'data/historical-canon.json'), 'utf8');
const eventsRaw = fs.readFileSync(path.join(root, 'data/entities/events.json'), 'utf8');
const spatialConfigRaw = fs.readFileSync(path.join(root, 'src/lib/spatial/spatial-config.ts'), 'utf8');
const memorialRaw = fs.readFileSync(path.join(root, 'src/pages/memorial.astro'), 'utf8');

if (storyBeatsRaw.includes('Ninety‑one of her crew') || storyBeatsRaw.includes('Ninety-one of her crew') || storyBeatsRaw.includes('91 of her crew')) {
  fail('data/story-beats.json asserts 91 Peary casualties as settled fact in story copy');
} else {
  pass('data/story-beats.json does not assert 91 Peary casualties as settled fact');
}

if (storyBeatsRaw.includes('the heaviest single loss of American life in Australian waters')) {
  fail('data/story-beats.json asserts unverified superlative "heaviest single loss"');
} else {
  pass('data/story-beats.json removes unverified superlative for Peary');
}

if (storyBeatsRaw.includes('More than eighty of her crew go down with her')) {
  pass('data/story-beats.json uses approved restrained non-numeric phrasing ("More than eighty")');
} else {
  fail('data/story-beats.json missing approved restrained non-numeric phrasing ("More than eighty")');
}

if (canonRaw.includes('She sinks stern‑first. More than eighty of her crew go down with her.')) {
  pass('data/historical-canon.json TIMELINE_1300 updated with non-dogmatic casualty phrasing');
} else {
  fail('data/historical-canon.json TIMELINE_1300 missing non-dogmatic casualty phrasing');
}

if (spatialConfigRaw.includes('80 killed, RAN/NT records cite 88, and AWM records cite 91')) {
  pass('spatial-config.ts preserves 80 / 88 / 91 institutional casualty discrepancy in evidential nuance');
} else {
  fail('spatial-config.ts missing 80 / 88 / 91 institutional discrepancy');
}

// 2. 09:58 WARNING DISTINCTION
const storyAstroRaw = fs.readFileSync(path.join(root, 'src/pages/story.astro'), 'utf8');

if (storyBeatsRaw.includes('With no siren and no warning') || canonRaw.includes('With no siren and no warning') || storyAstroRaw.includes('With no siren and no warning')) {
  fail('Found "With no siren and no warning" in visitor-facing copy (fails to distinguish warning transmission from siren delay)');
} else {
  pass('No "With no siren and no warning" found; warning transmission distinguished from siren delay');
}

if (storyBeatsRaw.includes('Before the town’s air-raid sirens sound') && canonRaw.includes('Before the town’s air-raid sirens sound') && storyAstroRaw.includes('Before the town’s air-raid sirens sound')) {
  pass('All narrative sources correctly use "Before the town’s air-raid sirens sound"');
} else {
  fail('Missing "Before the town’s air-raid sirens sound" in narrative sources');
}

// 3. PEARL HARBOR COMPARISON
if (storyBeatsRaw.includes('More bombs fell on Darwin than on Pearl Harbour.') || canonRaw.includes('More bombs fell on Darwin than on Pearl Harbour.')) {
  fail('Found unqualified "More bombs fell on Darwin than on Pearl Harbour." in primary copy');
} else {
  pass('No unqualified Pearl Harbor bomb comparison in primary copy');
}

if (storyBeatsRaw.includes('though at a lighter total explosive tonnage') && canonRaw.includes('though at a lighter total explosive tonnage')) {
  pass('Pearl Harbor comparison includes required explosive tonnage qualification');
} else {
  fail('Pearl Harbor comparison missing required explosive tonnage qualification');
}

// 4. McGRATH RADIO MESSAGE
const openingRaw = fs.readFileSync(path.join(root, 'src/components/Opening.astro'), 'utf8');
if (openingRaw.includes('bearing down on us from the north-west') || openingRaw.includes('Identity suspect')) {
  fail('Opening.astro contains unauthenticated McGrath paraphrase ("bearing down on us from the north-west")');
} else {
  pass('Opening.astro removed unauthenticated McGrath paraphrase');
}

if (openingRaw.includes('An unusually large air formation bearing south, heading south, observed over Bathurst Island.')) {
  pass('Opening.astro uses canonical logged McGrath transmission');
} else {
  fail('Opening.astro missing canonical logged McGrath transmission');
}

// 5. POST OFFICE CASUALTY TOTAL IN SPATIAL OVERLAY
const spatialOverlayRaw = fs.readFileSync(path.join(root, 'src/lib/spatial/spatial-evidence-overlay.ts'), 'utf8');
if (spatialOverlayRaw.includes('(9 KILLED)')) {
  fail('spatial-evidence-overlay.ts displays dogmatic (9 KILLED) on map label');
} else {
  pass('spatial-evidence-overlay.ts removes dogmatic (9 KILLED) from map label');
}

// 6. STOKES HILL WHARF MICROCOPY
if (spatialOverlayRaw.includes('CONTEMPORARY ORIENTATION ANCHOR') || spatialOverlayRaw.includes('1942 TIMBER FOOTPRINT UNRESOLVED')) {
  fail('spatial-evidence-overlay.ts contains database-style microcopy on Stokes Hill Wharf label');
} else {
  pass('spatial-evidence-overlay.ts uses clean institutional phrasing for Stokes Hill Wharf');
}

if (spatialOverlayRaw.includes('PRESENT-DAY STOKES HILL WHARF') && spatialOverlayRaw.includes('SAME WHARF PRECINCT. SAME SKY.')) {
  pass('spatial-evidence-overlay.ts presents "PRESENT-DAY STOKES HILL WHARF"');
} else {
  fail('spatial-evidence-overlay.ts missing "PRESENT-DAY STOKES HILL WHARF"');
}

// 7. CROSSHAIRS REMOVAL
if (spatialOverlayRaw.includes('crosshairNS') || spatialOverlayRaw.includes('crosshairEW') || spatialOverlayRaw.includes('poCrossNS') || spatialOverlayRaw.includes('poCrossEW')) {
  fail('spatial-evidence-overlay.ts contains prohibited crosshair geometry entities');
} else {
  pass('spatial-evidence-overlay.ts contains no crosshair geometry entities');
}

if (spatialOverlayRaw.toLowerCase().includes('crosshair')) {
  fail('spatial-evidence-overlay.ts contains "crosshair" references in code or comments');
} else {
  pass('spatial-evidence-overlay.ts contains no "crosshair" references');
}

// 8. 1942 TIME BASIS (NO ANCHRONISTIC ACST)
const heroRaw = fs.readFileSync(path.join(root, 'src/components/Hero.astro'), 'utf8');
if (openingRaw.includes('09:58 ACST') || openingRaw.includes('09:35 ACST') || heroRaw.includes('09:58 ACST')) {
  fail('Visitor-facing 1942 timestamps contain modern "ACST" timezone abbreviation');
} else {
  pass('Visitor-facing 1942 timestamps do not use modern "ACST" abbreviation');
}

console.log('\n==================================================');
if (failed) {
  console.error('TRUTH & NARRATIVE SUITE FAILED');
  process.exit(1);
} else {
  console.log('ALL TRUTH & NARRATIVE CHECKS PASSED (BUILDER VERIFICATION GREEN)');
  process.exit(0);
}

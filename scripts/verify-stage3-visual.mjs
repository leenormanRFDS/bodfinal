#!/usr/bin/env node

/**
 * STAGE 3.1B — HISTORICAL VISUAL GOVERNANCE & PRESENTATION VERIFICATION
 * 
 * Verifies presentation layer constraints:
 * 1. USS Peary casualties are not rendered as a single settled number (null in data, protective phrasing in UI)
 * 2. USS Peary primary map label contains only geographic identity, modern surveyed wreck position, depth 27m, and protected historic shipwreck designation
 * 3. USS Peary source casualty disagreement (80/88/91) is preserved in Evidence Ledger / canon, not in primary spatial label
 * 4. USS Peary vertical sounding line is removed so 40m altitude is not visually confused with 27m seabed bathymetry
 * 5. Post Office casualties are not rendered as a single settled number in the primary spatial overlay
 * 6. 1942 Wharf geometry uncertainty is preserved in canon/ledger, but technical phrase is NOT in Neptuna primary label
 * 7. Ingress direction is marked as reconstructed/approximate
 * 8. "RECONSTRUCTION PARAMETER" developer language is removed from primary UI strings
 * 9. Kelat is strictly separated as contextual subsequent loss (Damaged 19 Feb, Sank 24 Feb) and NOT counted in the 8 vessels sunk on 19 Feb
 * 10. Canonical eight-vessel count for 19 Feb is preserved
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

console.log('=== STAGE 3.1B HISTORICAL VISUAL GOVERNANCE VERIFICATION ===\n');

// 1. Check data models for disputed numbers
console.log('[1. Disputed Casualty Models]');
const vesselsJson = JSON.parse(fs.readFileSync(path.join(root, 'data/entities/vessels.json'), 'utf8'));
const peary = vesselsJson.entities.find(v => v.id === 'USS_PEARY_DD226');
assert(peary?.fatalitiesCount === null, 'USS Peary fatalities count is null (disputed, unresolved in UI)');

const storyBeats = JSON.parse(fs.readFileSync(path.join(root, 'data/story-beats.json'), 'utf8'));
const postOfficeBeat = storyBeats.beats.find(b => b.id === 'BEAT_3');
assert(!postOfficeBeat?.description.includes('nine'), 'Post Office beat description avoids asserting exactly nine casualties');
assert(!postOfficeBeat?.description.includes('ten'), 'Post Office beat description avoids asserting exactly ten casualties');

const canonFile = JSON.parse(fs.readFileSync(path.join(root, 'data/historical-canon.json'), 'utf8'));
const poCasualtyClaim = canonFile.claims.find(c => c.id === 'CLAIM_POST_OFFICE_CASUALTIES');
assert(poCasualtyClaim?.confidence === 'DISPUTED', 'Post Office casualty claim is explicitly documented as DISPUTED');
const pearyCasualtyClaim = canonFile.claims.find(c => c.id === 'CLAIM_USS_PEARY_CASUALTIES');
assert(pearyCasualtyClaim?.confidence === 'DISPUTED', 'USS Peary casualty claim is explicitly documented as DISPUTED');

// 2. Check UI presentation code
console.log('\n[2. Visual Overlay Grammar & Primary Map Labels]');
const overlayCode = fs.readFileSync(path.join(root, 'src/lib/spatial/spatial-evidence-overlay.ts'), 'utf8');

// Parse specific label blocks to avoid relying on whole-file string presence
const pearyLabelMatch = overlayCode.match(/pearyWreckLabel\s*=\s*[\s\S]*?label:\s*\{[\s\S]*?text:\s*['"`]([\s\S]*?)['"`]/);
assert(pearyLabelMatch !== null, 'pearyWreckLabel definition found in overlay code');
const pearyLabelText = pearyLabelMatch ? pearyLabelMatch[1] : '';

// Peary Primary Label assertions
assert(!pearyLabelText.includes('FATALITIES'), 'USS Peary primary spatial label does NOT contain "FATALITIES" line');
assert(!pearyLabelText.includes('80 (US NHHC)'), 'USS Peary primary spatial label does NOT contain 80 (US NHHC)');
assert(!pearyLabelText.includes('88 (RAN/NT)'), 'USS Peary primary spatial label does NOT contain 88 (RAN/NT)');
assert(!pearyLabelText.includes('91 (AWM)'), 'USS Peary primary spatial label does NOT contain 91 (AWM)');
assert(!pearyLabelText.includes('91 LOST'), 'USS Peary primary spatial label does NOT claim "91 LOST"');
assert(!pearyLabelText.includes('WAR GRAVE'), 'USS Peary primary spatial label does NOT claim WAR GRAVE');
assert(pearyLabelText.includes('USS PEARY (DD-226)'), 'USS Peary primary spatial label identifies ship name and pennant');
assert(pearyLabelText.includes('MODERN SURVEYED WRECK POSITION'), 'USS Peary primary spatial label identifies MODERN SURVEYED WRECK POSITION');
assert(pearyLabelText.includes('DEPTH 27M'), 'USS Peary primary spatial label identifies DEPTH 27M');
assert(pearyLabelText.includes('PROTECTED HISTORIC SHIPWRECK (CHART AUS 26)'), 'USS Peary primary spatial label uses authenticated designation PROTECTED HISTORIC SHIPWRECK (CHART AUS 26)');

// Peary evidence ledger dispute preservation
const pearyLedgerMatch = overlayCode.match(/'peary-wreck':\s*\{[\s\S]*?uncertain:\s*['"`]([\s\S]*?)['"`]/);
assert(pearyLedgerMatch !== null, 'peary-wreck ledger record found in overlay code');
const pearyUncertaintyText = pearyLedgerMatch ? pearyLedgerMatch[1] : '';
assert(pearyUncertaintyText.includes('NHHC: 80, RAN: 88, AWM: 91'), 'USS Peary casualty disagreement (80/88/91) is preserved in Evidence Ledger');

// Peary Depth Visual assertions
assert(!overlayCode.includes('depthSoundingLine'), 'Vertical sounding line removed from Peary wreck visualization (no unverified bathymetric column)');
assert(!overlayCode.includes('130.8292, -12.4754, 40,\n          130.8292, -12.4754, 0'), 'Literal +40m to 0m vertical sounding line coordinates removed');
assert(overlayCode.includes('SpatialRepresentativeAssets.getWreckSymbolTexture(27)'), 'Authenticated hydrographic wreck symbol (Chart Aus 26 standard) used for Peary 27m');

// Post Office labels
assert(!overlayCode.includes('9 KILLED'), 'Post Office spatial label does NOT claim "9 KILLED"');
assert(overlayCode.includes('THE SHELTER TRENCH RECEIVED A DIRECT HIT'), 'Post Office spatial label uses neutral descriptive language');

// Developer Language
assert(!overlayCode.includes('text: \'RECONSTRUCTION PARAMETER'), 'Developer language RECONSTRUCTION PARAMETER removed from primary label string');
assert(overlayCode.includes('ESTIMATED LAUNCH AREA'), 'Replaced with humane language ESTIMATED LAUNCH AREA');

// 1942 Wharf & Neptuna presentation vs canon
console.log('\n[3. Wharf & Neptuna Presentation vs Canon Evidence]');
const neptunaLabelMatch = overlayCode.match(/neptunaMarker\s*=\s*[\s\S]*?label:\s*\{[\s\S]*?text:\s*['"`]([\s\S]*?)['"`]/);
assert(neptunaLabelMatch !== null, 'neptunaMarker label definition found in overlay code');
const neptunaLabelText = neptunaLabelMatch ? neptunaLabelMatch[1] : '';

assert(!neptunaLabelText.includes('1942 TIMBER FOOTPRINT UNRESOLVED'), 'Neptuna primary label does NOT contain technical phrase "1942 TIMBER FOOTPRINT UNRESOLVED"');
assert(!neptunaLabelText.includes('UNRESOLVED'), 'Neptuna primary label does NOT contain developer string "UNRESOLVED"');
assert(neptunaLabelText.includes('MV NEPTUNA · EXPLODED ALONGSIDE WHARF · 10:12'), 'Neptuna primary label contains clear historical event');

const wharfLedgerMatch = overlayCode.match(/'stokes-hill-wharf':\s*\{[\s\S]*?uncertain:\s*['"`]([\s\S]*?)['"`]/);
assert(wharfLedgerMatch !== null, 'stokes-hill-wharf ledger record found in overlay code');
const wharfUncertaintyText = wharfLedgerMatch ? wharfLedgerMatch[1] : '';
assert(wharfUncertaintyText.includes('Exact 1942 timber wharf footprint remains unresolved'), 'Wharf geometry uncertainty preserved in Evidence Ledger record');

const locationsFile = fs.readFileSync(path.join(root, 'data/entities/locations.json'), 'utf8');
assert(locationsFile.includes('UNRESOLVED_HISTORICAL_GEOMETRY'), 'Wharf geometry uncertainty preserved in locations.json canon');
assert(locationsFile.includes('SOURCE_REQUIRED_1942_WHARF_SURVEY'), 'Wharf evidence gap preserved in locations.json canon');

// Kelat & Eight-Vessel Consequence Separation
console.log('\n[4. Kelat & Dusk Consequence Grammar]');
const sunkWrecksMatch = overlayCode.match(/const\s+sunkFeb19SurveyedWrecks\s*=\s*\[([\s\S]*?)\];/);
assert(sunkWrecksMatch !== null, 'sunkFeb19SurveyedWrecks array exists in Beat 7');
const sunkWrecksContent = sunkWrecksMatch ? sunkWrecksMatch[1] : '';
assert(!sunkWrecksContent.includes('KELAT'), 'Kelat is strictly excluded from the 19 February sunk vessels list');

// Verify Kelat rendered as separate contextual subsequent loss
const kelatLabelMatch = overlayCode.match(/kelatLabel\s*=\s*[\s\S]*?label:\s*\{[\s\S]*?text:\s*['"`]([\s\S]*?)['"`]/);
assert(kelatLabelMatch !== null, 'kelatLabel definition found in overlay code');
const kelatLabelText = kelatLabelMatch ? kelatLabelMatch[1] : '';
assert(kelatLabelText.includes('KELAT · 15M'), 'Kelat primary label identifies name and modern surveyed depth 15m');
assert(kelatLabelText.includes('DAMAGED 19 FEB · SANK 24 FEB'), 'Kelat primary label explicitly specifies DAMAGED 19 FEB · SANK 24 FEB');
assert(!kelatLabelText.includes('SUNK 19 FEB'), 'Kelat primary label does NOT state SUNK 19 FEB');

// Verify Kelat classification property
assert(overlayCode.includes("classification: 'CONTEXTUAL_SUBSEQUENT_LOSS'"), 'Kelat entity has property classification CONTEXTUAL_SUBSEQUENT_LOSS');
assert(overlayCode.includes("lossDate: '1942-02-24'"), 'Kelat entity has property lossDate 1942-02-24');

// Verify canonical eight vessels sunk on 19 Feb
const wharfLabelMatch = overlayCode.match(/wharfLabel\s*=\s*[\s\S]*?label:\s*\{[\s\S]*?text:\s*['"`]([\s\S]*?)['"`]/);
assert(wharfLabelMatch !== null, 'wharfLabel definition found in overlay code');
const wharfLabelText = wharfLabelMatch ? wharfLabelMatch[1] : '';
assert(wharfLabelText.includes('EIGHT SHIPS SUNK IN HARBOUR'), 'Beat 7 wharf consequence label maintains canonical count: EIGHT SHIPS SUNK IN HARBOUR');

// Verify canon distinction in historical-canon.json
const canonString = JSON.stringify(canonFile);
assert(canonString.includes('Eight ships sunk immediately') && canonString.includes('Kelat sank later'), 'Historical canon explicitly distinguishes eight ships sunk immediately from Kelat sinking later');

// Verify kelat-wreck in CANONICAL_EVIDENCE_RECORDS
const kelatLedgerMatch = overlayCode.match(/'kelat-wreck':\s*\{[\s\S]*?\}/);
assert(kelatLedgerMatch !== null, 'kelat-wreck record present in CANONICAL_EVIDENCE_RECORDS');
assert(overlayCode.includes('Kelat is not counted among the eight vessels sunk on the day of 19 February 1942'), 'kelat-wreck ledger notes confirm Kelat is not in the eight vessels sunk on 19 Feb');

console.log(`\n======================================================`);
console.log(`SUMMARY: ${passedTests} / ${totalTests} tests passed.`);
if (process.exitCode) {
  console.error('STAGE 3.1B VERIFICATION FAILED.');
  process.exit(1);
} else {
  console.log('STAGE 3.1B HISTORICAL VISUAL GOVERNANCE & EVIDENCE SEPARATION VERIFIED.');
}

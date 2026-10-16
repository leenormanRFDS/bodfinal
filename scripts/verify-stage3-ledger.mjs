import fs from 'fs';
import path from 'path';

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

console.log('=== STAGE 3.1D TEMPORAL & LEDGER GOVERNANCE VERIFICATION ===\n');

// 1. First-Wave Launch Time Normalisation & Operational Window
const canon = JSON.parse(fs.readFileSync('data/historical-canon.json', 'utf8'));
const timeClaims = canon.claims.filter(c => c.id.startsWith('TIME_') || c.id === 'WARNING_TIME_0935' || c.id === 'ATTACK_TIME_0958');

assert(timeClaims.length > 0, 'Found time claims to verify');
for (const tc of timeClaims) {
  assert(tc.temporalProvenance, `Claim ${tc.id} has temporalProvenance`);
  if (tc.temporalProvenance) {
    assert(tc.temporalProvenance.reportedTimeZoneOrBasis, `Claim ${tc.id} records reported time zone basis`);
    assert(tc.temporalProvenance.normalizationStatus, `Claim ${tc.id} records normalization status`);
    if (tc.value.includes('approx') || tc.value.includes('–')) {
      assert(tc.temporalProvenance.precision === 'APPROXIMATE', `Approximate time ${tc.id} correctly classified`);
    }
  }
}

const t0800 = timeClaims.find(c => c.id === 'TIME_0800');
assert(t0800 && t0800.temporalProvenance?.rawClockBasis?.includes('Tokyo Standard Time'), 'TIME_0800 records raw source basis as Tokyo Standard Time');
assert(t0800 && t0800.temporalProvenance?.normalizationOperation?.includes('+01:30'), 'TIME_0800 defines explicit +01:30 conversion operation');

const t0845 = timeClaims.find(c => c.id === 'TIME_0845');
assert(t0845 && t0845.temporalProvenance?.normalizedDarwinLocalTime === '08:45', 'TIME_0845 records completion of launch and formation departure at 08:45');

const formations = JSON.parse(fs.readFileSync('data/entities/formations.json', 'utf8'));
const firstWave = formations.formations.find(f => f.id === 'FORMATION_FIRST_WAVE_TOTAL');
assert(firstWave && firstWave.launchTimeAudit, 'Formation entity contains audited launch time breakdown');
assert(firstWave.launchTimeAudit.normalizationOffset.includes('+01:30'), 'Formation launch time audit specifies +01:30 wartime daylight offset');

// 2. 09:35 -> 09:58 Interval Integrity
const w0935 = timeClaims.find(c => c.id === 'WARNING_TIME_0935');
const a0958 = timeClaims.find(c => c.id === 'ATTACK_TIME_0958');
assert(w0935?.temporalProvenance?.utcOffset === '+10:30', '09:35 warning timestamp normalized to UTC+10:30');
assert(a0958?.temporalProvenance?.utcOffset === '+10:30', '09:58 impact timestamp normalized to UTC+10:30');
assert(w0935?.temporalProvenance?.utcOffset === a0958?.temporalProvenance?.utcOffset, '09:35 and 09:58 interval shares identical clock offset (UTC+10:30)');

// 3. UI Temporal grammar
const storyHtml = fs.readFileSync('src/pages/story.astro', 'utf8');
assert(!storyHtml.includes('>ACST<'), '19 February 1942 is not lazily labelled ACST');
assert(storyHtml.includes('DARWIN LOCAL TIME'), 'Timezone uses explicit DARWIN LOCAL TIME label');

// 4. USS Peary Casualty Wording Neutrality (No Unverified Causal Speculation)
const pearyClaim = canon.claims.find(c => c.id === 'CLAIM_USS_PEARY_CASUALTIES');
assert(pearyClaim && pearyClaim.classification === 'HISTORICAL_INTERPRETATION', 'USS Peary casualties classified as HISTORICAL_INTERPRETATION');
assert(pearyClaim && pearyClaim.confidence === 'DISPUTED', 'USS Peary casualties confidence marked DISPUTED');
assert(!pearyClaim.note.includes('crew complement methodologies'), 'Canon note avoids unverified causal speculation on crew complement');
assert(!pearyClaim.note.includes('inclusion of later deaths'), 'Canon note avoids unverified causal speculation on later deaths');
assert(pearyClaim.note.includes('has not been fully reconciled in the current evidence model'), 'Canon note uses neutral irreconciliation phrasing');

// 5. Evidence Ledger Modal Semantics & Focus Management
const ledgerAstro = fs.readFileSync('src/components/EvidenceLedger.astro', 'utf8');
assert(ledgerAstro.includes('role="dialog"'), 'Ledger implements role="dialog"');
assert(ledgerAstro.includes('aria-modal="true"'), 'Ledger implements aria-modal="true"');
assert(ledgerAstro.includes('aria-labelledby="ledger-title"'), 'Ledger implements aria-labelledby');
assert(ledgerAstro.includes('setBackgroundInert(true)'), 'Ledger marks background roots inert when opened');
assert(ledgerAstro.includes('setBackgroundInert(false)'), 'Ledger removes inert from background roots when closed');
assert(ledgerAstro.includes('e.key === \'Escape\''), 'Ledger implements Escape key dismissal');
assert(ledgerAstro.includes('e.key === \'Tab\''), 'Ledger implements keyboard focus trapping for Tab / Shift+Tab');
assert(ledgerAstro.includes('lastFocus.focus()'), 'Ledger restores focus to invoking element on close');
assert(!ledgerAstro.includes('GILL_RAN_VOL1'), 'Ledger component avoids raw source enum IDs in text');
assert(ledgerAstro.includes('.replace(/_/g, \' \')'), 'Ledger component formats developer enums to human readable classifications');

// 6. Cesium Entity Keyboard Accessibility
const spatialEngine = fs.readFileSync('src/components/SpatialEngine.astro', 'utf8');
assert(spatialEngine.includes('CANONICAL_EVIDENCE_RECORDS'), 'SpatialEngine imports CANONICAL_EVIDENCE_RECORDS');
assert(spatialEngine.includes('spatial-stage__evidence-access'), 'SpatialEngine renders accessible evidence roster');
assert(spatialEngine.includes('data-evidence-id'), 'SpatialEngine renders accessible evidence buttons with identifiers');
assert(spatialEngine.includes('aria-haspopup="dialog"'), 'Evidence buttons declare dialog popup relation');
assert(spatialEngine.includes('openEvidenceLedger(CANONICAL_EVIDENCE_RECORDS[id])'), 'Evidence buttons trigger evidence ledger for keyboard users');

// 7. Spatial Evidence Overlay & Provenance Adjudication
const overlay = fs.readFileSync('src/lib/spatial/spatial-evidence-overlay.ts', 'utf8');
assert(overlay.includes('CANONICAL_EVIDENCE_RECORDS'), 'Overlay exports canonical evidence records');
assert(overlay.includes('USS Peary (DD-226)'), 'USS Peary ledger entity exists');
assert(overlay.includes('Casualty-source disagreement: authoritative sources report different casualty totals'), 'USS Peary ledger uses neutral casualty wording');
assert(!overlay.includes('crew complement methodologies'), 'Overlay avoids unverified speculation on crew complement');
assert(overlay.includes('Sacred Heart Mission, Nguiu'), 'Bathurst Island ledger entity exists');
assert(overlay.includes('First-Wave Approach'), 'First Wave ledger entity exists');
assert(overlay.includes('The 71/72 D3A dive bomber discrepancy exists'), 'First Wave ledger explicitly discloses aircraft discrepancy');

// 8. Typography System (Single Monospace Family)
const tokensJson = JSON.parse(fs.readFileSync('config/design-tokens.json', 'utf8'));
assert(tokensJson.typography.evidence.family === 'IBM Plex Mono', 'Design tokens specify IBM Plex Mono for evidence');
const tokensCss = fs.readFileSync('src/styles/tokens.css', 'utf8');
assert(tokensCss.includes("'IBM Plex Mono', monospace"), 'Tokens CSS sets --font-mono to IBM Plex Mono');
assert(!tokensCss.includes('Space Mono') && !tokensCss.includes('JetBrains Mono'), 'No competing monospace fonts in tokens.css');

console.log(`\n======================================================`);
console.log(`SUMMARY: ${passedTests} / ${totalTests} tests passed.`);
if (process.exitCode) {
  console.error('STAGE 3.1D VERIFICATION FAILED.');
  process.exit(1);
} else {
  console.log('STAGE 3.1D TEMPORAL & LEDGER GOVERNANCE VERIFIED.');
}

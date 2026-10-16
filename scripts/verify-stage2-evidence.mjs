#!/usr/bin/env node

/**
 * STAGE 2 — HISTORICAL GEOGRAPHIC EVIDENCE MODEL VERIFICATION SUITE
 * 
 * Verifies:
 * 1. Register Integrity & Schema Validation (sources, locations, aircraft, formations, routes, vessels, events, layers, historical-canon)
 * 2. Strict Provenance Linkage (All sourceRefs resolve to canonical source IDs)
 * 3. Spatial Confidence & Geometry Integrity (No invented coordinates, null for unresolved 1942 geometries)
 * 4. Contemporary vs 1942 Separation (Stokes Hill Wharf 1942 coordinates are null; contemporary wharf has genuine source reference)
 * 5. Formation & Aircraft Decomposition (Wave, aircraft type, role, count, source, confidence)
 * 6. Route Uncertainty Modeling (Corridors, directional constraints, no false precision)
 * 7. Disputed Claims & Adjudication Flags (Lowe Commission 243 vs 235, Pearl Harbor bomb comparison)
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

console.log('=== STAGE 2 HISTORICAL GEOGRAPHIC EVIDENCE MODEL VERIFICATION ===\n');

// 1. Check Data Registers Exist & Parse Valid JSON
console.log('[1. Entity Registers Existence & JSON Syntax]');
const registers = [
  'data/entities/sources.json',
  'data/entities/locations.json',
  'data/entities/aircraft.json',
  'data/entities/formations.json',
  'data/entities/routes.json',
  'data/entities/vessels.json',
  'data/entities/events.json',
  'data/entities/layers.json',
  'data/historical-canon.json'
];

const data = {};
for (const rel of registers) {
  const full = path.join(root, rel);
  assert(fs.existsSync(full), `Register file exists: ${rel}`);
  try {
    data[rel] = JSON.parse(fs.readFileSync(full, 'utf8'));
    assert(true, `Valid JSON: ${rel}`);
  } catch (e) {
    assert(false, `Invalid JSON in ${rel}: ${e.message}`);
  }
}

// 2. Source Register Validation
console.log('\n[2. Canonical Sources Register Validation]');
const sourcesFile = data['data/entities/sources.json'];
assert(Array.isArray(sourcesFile.sources), 'sources.json has a valid sources array');
const sourceIds = new Set(sourcesFile.sources.map(s => s.id || s.sourceId));

assert(sourceIds.has('LOWE_COMMISSION_1942'), 'Lowe Commission 1942 source registered');
assert(sourceIds.has('GILL_RAN_VOL1'), 'RAN Official History (Gill) registered');
assert(sourceIds.has('GILLISON_RAAF_VOL1'), 'RAAF Official History (Gillison) registered');
assert(sourceIds.has('SENSHI_SOSHO_VOL26'), 'Senshi Sosho Vol 26 registered');
assert(sourceIds.has('AHO_CHART_AUS26'), 'Australian Hydrographic Office Chart Aus 26 registered');
assert(sourceIds.has('GA_GEODETIC_SURVEY'), 'Geoscience Australia Geodetic Survey registered');
assert(sourceIds.has('ADMIRALTY_CHART_925_1942'), 'Admiralty Chart 925 registered');
assert(sourceIds.has('FATHER_MCGRATH_RADIO_LOG_1942'), 'Father McGrath Radio Log registered');
assert(sourceIds.has('US_NAVY_DANFS_PEARY'), 'US Navy DANFS Peary registered');
assert(sourceIds.has('NAA_FACT_SHEET_195'), 'NAA Fact Sheet 195 registered');
assert(sourceIds.has('AWM_DARWIN_ENCYCLOPEDIA'), 'AWM Darwin Encyclopedia registered');
assert(sourceIds.has('SOURCE_REQUIRED_1942_WHARF_SURVEY'), 'SOURCE_REQUIRED for 1942 Wharf Survey registered');

const ALLOWED_CLASSIFICATIONS = new Set([
  'PRIMARY_DOCUMENT',
  'ARCHIVAL_MATERIAL',
  'OFFICIAL_HISTORY',
  'OFFICIAL_HYDROGRAPHIC_SURVEY',
  'WAR_GRAVES_RECORD',
  'SCHOLARLY_SECONDARY',
  'MODERN_INSTITUTIONAL_SUMMARY',
  'HISTORICAL_SYNTHESIS'
]);

const ALLOWED_AUTHENTICATIONS = new Set([
  'CATALOGUE_VERIFIED',
  'BIBLIOGRAPHICALLY_VERIFIED',
  'INDIRECTLY_ATTESTED',
  'UNVERIFIED',
  'SUSPECT',
  'SOURCE_REQUIRED'
]);

// Verify every source separates sourceClassification from authenticationStatus and has complete metadata
for (const src of sourcesFile.sources) {
  const hasId = !!(src.id || src.sourceId);
  const hasTitle = typeof src.title === 'string' && src.title.length > 0;
  const validClassification = ALLOWED_CLASSIFICATIONS.has(src.sourceClassification);
  const validAuthentication = ALLOWED_AUTHENTICATIONS.has(src.authenticationStatus);
  const hasPrimaryOrSecondary = typeof src.primaryOrSecondary === 'string';
  const hasClaimsDirect = Array.isArray(src.claimsSupported);
  const hasClaimsSynthesis = Array.isArray(src.claimsSupportedBySynthesis);

  assert(
    hasId && hasTitle && validClassification && validAuthentication && hasPrimaryOrSecondary && hasClaimsDirect && hasClaimsSynthesis,
    `Source ${src.id || src.sourceId} has valid separate classification (${src.sourceClassification}) & authentication (${src.authenticationStatus})`
  );
}

// 2b. Lowe Commission NAA Verified Holdings Validation
const lowe = sourcesFile.sources.find(s => s.id === 'LOWE_COMMISSION_1942');
assert(lowe?.authenticationStatus === 'CATALOGUE_VERIFIED', 'Lowe Commission is CATALOGUE_VERIFIED');
assert(
  lowe?.archiveReference.includes('A816, 37/301/310') &&
  lowe?.archiveReference.includes('A816, 37/301/293') &&
  lowe?.archiveReference.includes('A431, 1949/687') &&
  lowe?.archiveReference.includes('A461, F326/1/4') &&
  lowe?.archiveReference.includes('MP401/1') &&
  lowe?.archiveReference.includes('MP1185/8, 1806/2/31'),
  'Lowe Commission records cross-verified across NAA Series A816, A431, A461, MP401/1, and MP1185/8'
);

// 3. Contemporary vs 1942 Locations & Stokes Hill Wharf Status
console.log('\n[3. Geographic Entities & Provenance]');
const locationsFile = data['data/entities/locations.json'];
const contempWharf = locationsFile.entities.find(e => e.id === 'STOKES_HILL_WHARF_CONTEMPORARY');
const histWharf = locationsFile.entities.find(e => e.id === 'STOKES_HILL_WHARF_1942');

assert(!!contempWharf, 'Contemporary wharf entity present');
assert(contempWharf.sourceRefs.includes('AHO_CHART_AUS26') && contempWharf.sourceRefs.includes('GA_GEODETIC_SURVEY'), 
  'Contemporary wharf has genuine institutional source references, not merely "WGS84"');
assert(contempWharf.confidence === 'APPROXIMATE', 'Contemporary wharf marked as APPROXIMATE centroid');

assert(!!histWharf, '1942 historic wharf entity present');
assert(histWharf.latitude === null && histWharf.longitude === null && histWharf.altitudeM === null, 
  '1942 historic wharf coordinates are strictly NULL (no invented precision)');
assert(histWharf.verificationStatus === 'UNRESOLVED_HISTORICAL_GEOMETRY', 
  '1942 historic wharf is explicitly UNRESOLVED_HISTORICAL_GEOMETRY');
assert(histWharf.sourceRefs.includes('SOURCE_REQUIRED_1942_WHARF_SURVEY'), 
  '1942 historic wharf references SOURCE_REQUIRED_1942_WHARF_SURVEY');

// 4. Source Reference Integrity & Decoupling from Authentication Status
console.log('\n[4. Cross-Dataset Source Reference Resolution & Authentication Decoupling]');
let brokenRefs = 0;
function checkSourceRefs(items, label) {
  for (const item of items) {
    const refs = item.sourceRefs || item.sources || [];
    for (const ref of refs) {
      if (!sourceIds.has(ref)) {
        console.error(`Missing source reference "${ref}" in ${label} item: ${item.id}`);
        brokenRefs++;
      }
    }
  }
}

checkSourceRefs(data['data/historical-canon.json'].claims, 'claims');
checkSourceRefs(data['data/entities/locations.json'].entities, 'locations');
checkSourceRefs(data['data/entities/aircraft.json'].entities, 'aircraft');
checkSourceRefs(data['data/entities/formations.json'].formations, 'formations');
checkSourceRefs(data['data/entities/routes.json'].routes, 'routes');
checkSourceRefs(data['data/entities/vessels.json'].entities, 'vessels');
checkSourceRefs(data['data/entities/events.json'].events, 'events');
checkSourceRefs(data['data/entities/layers.json'].layers, 'layers');

assert(brokenRefs === 0, `All source references resolve to registered canonical sources (0 broken references)`);

// Ensure resolved source reference does NOT imply CATALOGUE_VERIFIED
const sourcesById = new Map(sourcesFile.sources.map(s => [s.id, s]));
const nonCatalogueSources = sourcesFile.sources.filter(s => s.authenticationStatus !== 'CATALOGUE_VERIFIED');
assert(nonCatalogueSources.length >= 7, 'System distinguishes between CATALOGUE_VERIFIED and non-catalogue/indirect/pending sources');
const indirectlyAttested = sourcesFile.sources.find(s => s.authenticationStatus === 'INDIRECTLY_ATTESTED');
assert(!!indirectlyAttested, 'System supports and identifies INDIRECTLY_ATTESTED sources (e.g. Father McGrath telegraph exhibit)');
const requiredSources = sourcesFile.sources.filter(s => s.authenticationStatus === 'SOURCE_REQUIRED');
assert(requiredSources.length === 3, 'All 3 blocking evidence gaps preserved as SOURCE_REQUIRED');

// 5. Aircraft & Formations Model
console.log('\n[5. Aircraft & Formations Decomposition]');
const aircraftFile = data['data/entities/aircraft.json'];
const formationsFile = data['data/entities/formations.json'];

const zero = aircraftFile.entities.find(a => a.id === 'AIRCRAFT_A6M2_ZERO');
const val = aircraftFile.entities.find(a => a.id === 'AIRCRAFT_D3A1_VAL');
const kate = aircraftFile.entities.find(a => a.id === 'AIRCRAFT_B5N2_KATE');
const betty = aircraftFile.entities.find(a => a.id === 'AIRCRAFT_G4M1_BETTY');
const nell = aircraftFile.entities.find(a => a.id === 'AIRCRAFT_G3M2_NELL');

assert(zero?.reportedCount === 36, '36 A6M2 Zeros accounted for');
assert(val?.reportedCount === 71, '71 D3A1 Vals accounted for (corrected)');
assert(kate?.reportedCount === 81, '81 B5N2 Kates accounted for (corrected)');
assert(betty?.reportedCount === 27, '27 G4M1 Bettys accounted for');
assert(nell?.reportedCount === 27, '27 G3M2 Nells accounted for');

const firstWave = formationsFile.formations.find(f => f.id === 'FORMATION_FIRST_WAVE_TOTAL');
assert(firstWave?.totalAircraftCount === 188, 'First wave formation total equals 188 aircraft (81 Kate + 71 Val + 36 Zero)');
assert(firstWave?.subFormations?.length === 3, 'First wave decomposes into 3 subformations with role & target assignments');

const secondWave = formationsFile.formations.find(f => f.id === 'FORMATION_SECOND_WAVE_TOTAL');
assert(secondWave?.totalAircraftCount === 54, 'Second wave formation total equals 54 land bombers (27 + 27)');

// 6. Routes Uncertainty & Geometry Modeling
console.log('\n[6. Route Evidence & Uncertainty Geometry]');
const routesFile = data['data/entities/routes.json'];
assert(routesFile.routes.length >= 5, 'Canonical routes register contains at least 5 structured route segments');

const transit = routesFile.routes.find(r => r.id === 'ROUTE_FIRST_WAVE_TIMOR_TO_BATHURST');
assert(transit?.geometryType === 'corridor', 'Transit over water is modeled as a corridor with uncertainty, not a polyline');

const sighting = routesFile.routes.find(r => r.id === 'ROUTE_FIRST_WAVE_BATHURST_OVERFLIGHT');
assert(sighting?.segmentType === 'SOURCE_OBSERVED_POSITION', 'Bathurst Island overflight is a SOURCE_OBSERVED_POSITION');

const egress = routesFile.routes.find(r => r.id === 'ROUTE_FIRST_WAVE_EGRESS');
assert(egress?.segmentType === 'UNRESOLVED_SEGMENT' && egress?.spatialConfidence === 'LOW', 
  'First wave egress is classified as UNRESOLVED_SEGMENT with LOW spatial confidence');

// 7. Vessels Register Validation
console.log('\n[7. Vessels Register Validation]');
const vesselsFile = data['data/entities/vessels.json'];
const peary = vesselsFile.entities.find(v => v.id === 'USS_PEARY_DD226');
const neptuna = vesselsFile.entities.find(v => v.id === 'MV_NEPTUNA');
const manunda = vesselsFile.entities.find(v => v.id === 'AHS_MANUNDA');

assert(peary?.fatalitiesCount === 91 || peary?.fatalitiesCount === null, 'USS Peary casualties recorded as 91 or marked null (disputed per Stage 3.1B)');
assert(peary?.status19Feb1942 === 'SUNK', 'USS Peary status marked SUNK');
assert(peary?.preAttackPosition && peary?.wreckPositionModernSurvey, 'USS Peary distinguishes preAttackPosition from wreckPositionModernSurvey');
assert(neptuna?.status19Feb1942 === 'SUNK_EXPLODED', 'MV Neptuna status marked SUNK_EXPLODED');
assert(neptuna?.coordinates?.latitude === null, 'MV Neptuna coordinates marked NULL to prevent inventing wharf geometry');
assert(manunda?.status19Feb1942 === 'HEAVILY_DAMAGED', 'AHS Manunda status recorded as HEAVILY_DAMAGED');

// 8. Attack Chronology Events Validation
console.log('\n[8. Attack Chronology Events Validation]');
const eventsFile = data['data/entities/events.json'];
const ev0935 = eventsFile.events.find(e => e.id === 'EVENT_BATHURST_WARNING');
const ev0958 = eventsFile.events.find(e => e.id === 'EVENT_FIRST_BOMBS_DETONATE');
const ev1025 = eventsFile.events.find(e => e.id === 'EVENT_NEPTUNA_EXPLOSION');
const ev1158 = eventsFile.events.find(e => e.id === 'EVENT_SECOND_WAVE_STRIKE');

assert(ev0935?.time.includes('09:35'), '09:35 warning event recorded');
assert(ev0958?.time === '09:58', '09:58 first bombs detonation event recorded');
assert(ev1025?.time === '10:25', '10:25 MV Neptuna explosion recorded');
assert(ev1158?.time.includes('11:58'), '11:58 second wave strike recorded');

// 9. Historical Layers Register Validation
console.log('\n[9. Historical Cartographic Layers Register]');
const layersFile = data['data/entities/layers.json'];
assert(layersFile.layers.length >= 5, 'Layers register documents at least 5 cartographic/aerial layers');
const chart925 = layersFile.layers.find(l => l.id === 'LAYER_ADMIRALTY_CHART_925_1942');
assert(chart925?.georeferenceStatus === 'NOT_GEOREFERENCED', 'Admiralty Chart 925 noted as NOT_GEOREFERENCED');

// 10. Disputed Claims & Adjudication in Historical Canon
console.log('\n[10. Historical Canon Disputed Claims & Casualty Historiography]');
const canonFile = data['data/historical-canon.json'];
const duskClaim = canonFile.claims.find(c => c.id === 'TIMELINE_Dusk');
assert(duskClaim?.confidence === 'DISPUTED', 'Timeline Dusk claim is classified as DISPUTED with explicit nuance');
assert(duskClaim?.note.includes('Lowe Commission') && duskClaim?.note.includes('Pearl Harbor'), 
  'Dusk claim documents casualty adjudication (243 vs 235) and Pearl Harbor bomb comparison');

// 11. Multi-Account Casualty Historiography Verification
console.log('\n[11. Multi-Account Casualty Historiography Verification]');
const loweCas = canonFile.claims.find(c => c.id === 'CLAIM_CASUALTIES_HISTORIOGRAPHY_LOWE');
assert(loweCas?.supportClassification === 'DIRECTLY_SUPPORTED', 'Lowe finding is DIRECTLY_SUPPORTED');
assert(loweCas?.sources.includes('LOWE_COMMISSION_1942'), 'Lowe casualty claim sources LOWE_COMMISSION_1942');

const offCas = canonFile.claims.find(c => c.id === 'CLAIM_CASUALTIES_HISTORIOGRAPHY_OFFICIAL_HISTORIES');
assert(offCas?.supportClassification === 'DIRECTLY_SUPPORTED', 'Official histories casualty finding is DIRECTLY_SUPPORTED');
assert(offCas?.sources.includes('GILL_RAN_VOL1'), 'Official histories claim sources GILL_RAN_VOL1');

const naaCas = canonFile.claims.find(c => c.id === 'CLAIM_CASUALTIES_HISTORIOGRAPHY_NAA_PUBLIC');
assert(naaCas?.supportClassification === 'DIRECTLY_SUPPORTED', 'NAA public account (at least 235) is DIRECTLY_SUPPORTED');
assert(naaCas?.sources.includes('NAA_FACT_SHEET_195'), 'NAA public claim sources NAA_FACT_SHEET_195');

const awmCas = canonFile.claims.find(c => c.id === 'CLAIM_CASUALTIES_HISTORIOGRAPHY_AWM');
assert(awmCas?.supportClassification === 'DIRECTLY_SUPPORTED', 'AWM interpretation is DIRECTLY_SUPPORTED');
assert(awmCas?.sources.includes('AWM_DARWIN_ENCYCLOPEDIA'), 'AWM claim sources AWM_DARWIN_ENCYCLOPEDIA');

const modCas = canonFile.claims.find(c => c.id === 'CLAIM_CASUALTIES_HISTORIOGRAPHY_MODERN_SYNTHESIS');
assert(modCas?.supportClassification === 'SUPPORTED_BY_SYNTHESIS', 'Modern scholarly synthesis is SUPPORTED_BY_SYNTHESIS');

const mythCas = canonFile.claims.find(c => c.id === 'CLAIM_CASUALTIES_UNSUPPORTED_MYTHS');
assert(mythCas?.supportClassification === 'DISPUTED', 'Unsupported 1,000+ casualty myths classified as DISPUTED');

const totalCas = canonFile.claims.find(c => c.id === 'CLAIM_CASUALTIES_TOTAL');
assert(totalCas?.supportClassification === 'SUPPORTED_BY_SYNTHESIS', 'Overall casualties claim reflects synthesis of multiple accounts rather than single dogmatic official total');

// 12. Stage 2.3 CARTO Production Patch & Aircraft Conflict Verification
console.log('\n[12. Stage 2.3 CARTO Production Patch & Aircraft Conflict Verification]');
const cartoManagerCode = fs.readFileSync(path.join(root, 'src/lib/spatial/cartography-manager.ts'), 'utf8');
assert(cartoManagerCode.includes('PUBLIC_CARTO_BASEMAP_KEY'), 'CartographyManager references PUBLIC_CARTO_BASEMAP_KEY');
assert(cartoManagerCode.includes('rastertiles/dark_all/{z}/{x}/{y}.png?key='), 'CartographyManager uses documented CARTO rastertiles endpoint with key parameter');
assert(!cartoManagerCode.includes('CARTO_API_KEY'), 'CartographyManager does NOT reference or expose private CARTO_API_KEY');
assert(!cartoManagerCode.includes('PUBLIC_CARTO_BASEMAP_KEY ||'), 'CartographyManager does NOT implement private-to-public fallback');
assert(cartoManagerCode.includes('applyLocalFallbackBasemap'), 'CartographyManager falls back to local Natural Earth II when key is unavailable');
assert(cartoManagerCode.includes('unauthenticated production CARTO requests are prohibited'), 'CartographyManager explicitly prohibits unauthenticated production CARTO requests');

const spatialEngineCode = fs.readFileSync(path.join(root, 'src/components/SpatialEngine.astro'), 'utf8');
assert(spatialEngineCode.includes('© OpenStreetMap') && spatialEngineCode.includes('© CARTO'), 'SpatialEngine footer includes visible attribution to both OpenStreetMap and CARTO');
assert(spatialEngineCode.includes('carto.com/attributions') && spatialEngineCode.includes('openstreetmap.org/copyright'), 'SpatialEngine footer includes hyperlinked compliance URLs');

const astroConfigCode = fs.readFileSync(path.join(root, 'astro.config.mjs'), 'utf8');
assert(!astroConfigCode.includes('PUBLIC_CARTO_BASEMAP_KEY') && !astroConfigCode.includes('vite:'), 'astro.config.mjs does NOT use vite.define (uses standard Astro import.meta.env.PUBLIC_* mechanism)');

const spatialDoc = fs.readFileSync(path.join(root, 'docs/SPATIAL_ENGINE.md'), 'utf8');
assert(spatialDoc.includes('5 million tile requests per calendar month'), 'docs/SPATIAL_ENGINE.md records CARTO free allowance of 5 million tile requests');
assert(spatialDoc.includes('raster basemaps should be treated as replaceable'), 'docs/SPATIAL_ENGINE.md notes raster basemaps as legacy replaceable infrastructure');

const aircraftVal = data['data/entities/aircraft.json'].entities.find(e => e.id === 'AIRCRAFT_D3A1_VAL');
assert(aircraftVal?.canonicalCount === 71, 'D3A1 Val canonical count recorded as 71');
assert(aircraftVal?.currentCanonicalStatus === 'BEST_SUPPORTED_CURRENT_INTERPRETATION', 'D3A1 Val status is BEST_SUPPORTED_CURRENT_INTERPRETATION');
assert(aircraftVal?.conflictingSourceNote?.reportedCount === 72, 'D3A1 Val attaches conflicting source note documenting AWM 72 count');
assert(aircraftVal?.conflictingSourceNote?.reconstructionConstraint?.includes('DO_NOT_REPRESENT_INDIVIDUAL_D3A_1_TO_1'), 'Reconstruction constraint forbids 1:1 D3A representation until adjudicated');

const formFirstWave = data['data/entities/formations.json'].formations.find(f => f.id === 'FORMATION_FIRST_WAVE_TOTAL');
assert(formFirstWave?.totalAircraftCount === 188, 'First wave total aircraft count recorded as 188');
assert(formFirstWave?.totalAircraftCountConfidence?.includes('HIGH / ESTABLISHED'), 'First wave total confidence is HIGH / ESTABLISHED');
const valSubForm = formFirstWave?.subFormations.find(s => s.aircraftType === 'AIRCRAFT_D3A1_VAL');
assert(valSubForm?.aircraftCount === 71, 'Val subformation count is 71');
assert(valSubForm?.conflictingSourceNote?.reportedCount === 72, 'Val subformation attaches 72 D3A conflict note');

const canonAircraftBreakdown = canonFile.claims.find(c => c.id === 'CLAIM_FIRST_WAVE_AIRCRAFT_BREAKDOWN');
assert(canonAircraftBreakdown?.firstWaveTotal === 188, 'Historical canon records first wave total as 188');
assert(canonAircraftBreakdown?.d3aCount === 71, 'Historical canon records D3A count as 71');
assert(canonAircraftBreakdown?.conflictingSourceNote?.reportedD3ACount === 72, 'Historical canon documents AWM 72 D3A conflicting account');

console.log(`\n======================================================`);
console.log(`SUMMARY: ${passedTests} / ${totalTests} tests passed.`);
if (process.exitCode) {
  console.error('STAGE 2 VERIFICATION FAILED.');
  process.exit(1);
} else {
  console.log('STAGE 2 HISTORICAL GEOGRAPHIC EVIDENCE MODEL VERIFIED.');
}

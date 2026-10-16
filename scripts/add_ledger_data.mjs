import fs from 'fs';
const path = 'src/lib/spatial/spatial-evidence-overlay.ts';
let code = fs.readFileSync(path, 'utf8');

// Bathurst Island
code = code.replace(
  "id: 'mcgrath-mission',",
  "id: 'mcgrath-mission',\n      properties: new Cesium.PropertyBag({ ledgerData: { title: 'Sacred Heart Mission, Nguiu', classification: 'CONTEMPORARY_ARCHIVAL_RECORD', confidence: 'VERIFIED', known: 'The mission was an established location. Father McGrath sighted the formation and transmitted a warning to Darwin VID.', uncertain: 'The exact physical position from which he personally observed the formation is not established to survey precision.', notes: '09:35 sighting. 09:37 transmission (Darwin Local Time).', sources: [{title: 'Lowe Commission Exhibit 3', institution: 'Official Inquiry (1942)'}, {title: 'Father McGrath Radio Log', institution: 'Contemporary Archive'}] } }),"
);

// USS Peary
code = code.replace(
  "id: 'peary-survey',",
  "id: 'peary-survey',\n      properties: new Cesium.PropertyBag({ ledgerData: { title: 'USS Peary (DD-226)', classification: 'ESTABLISHED_FACT', confidence: 'HIGH', known: 'Modern surveyed wreck position on the seabed. Approximate manoeuvre sector during the attack is documented.', uncertain: 'Unresolved exact attack trajectory on the surface. Casualty-source disagreement (80, 88, or 91 fatalities depending on inclusion of later deaths from wounds and crew complement methodologies).', notes: 'Do not force a single \"correct\" casualty source without historical adjudication.', sources: [{title: 'DANFS: USS Peary', institution: 'US Naval History and Heritage Command'}, {title: 'Royal Australian Navy Vol. 1', institution: 'Official History'}] } }),"
);

// First Wave Approach
code = code.replace(
  "id: 'first-wave-approach',",
  "id: 'first-wave-approach',\n      properties: new Cesium.PropertyBag({ ledgerData: { title: 'First-Wave Approach', classification: 'DIGITAL_RECONSTRUCTION', confidence: 'MODERATE', known: '188-aircraft total is strongly supported. The broad approach over the peninsula is evidence-based.', uncertain: 'The 71/72 D3A dive bomber discrepancy exists between official histories and some Australian War Memorial sources. Individual aircraft tracks are not known.', notes: 'The rendered corridor is an interpretive reconstruction. The project does not show false precision by rendering 188 individual 3D aircraft tracks.', sources: [{title: 'Senshi Sōsho Vol. 26', institution: 'Japanese Official History'}, {title: 'Lowe Commission', institution: 'Official Inquiry (1942)'}] } }),"
);

// Launch Area
code = code.replace(
  "id: 'launch-area',",
  "id: 'launch-area',\n      properties: new Cesium.PropertyBag({ ledgerData: { title: 'Estimated Launch Area', classification: 'DIGITAL_RECONSTRUCTION', confidence: 'MODERATE', known: '1st Carrier Air Fleet was operating in the Timor Sea approximately 220 NM NNW of Darwin.', uncertain: 'Exact coordinate of the flagship Akagi during launch is a general operational envelope with a ~40km uncertainty radius.', notes: 'Reconstructed parameter. Center point is a mathematical camera anchor, not an observed coordinate.', sources: [{title: 'Senshi Sōsho Vol. 26', institution: 'Japanese Official History'}] } }),"
);

// Post Office
code = code.replace(
  "id: 'post-office-strike',",
  "id: 'post-office-strike',\n      properties: new Cesium.PropertyBag({ ledgerData: { title: 'Darwin Post & Telegraph Office', classification: 'ESTABLISHED_FACT', confidence: 'VERIFIED', known: 'The civilian shelter trench behind the Post Office received a direct bomb hit at approximately 10:00.', uncertain: 'Casualty discrepancy: AWM records state 9 staff members killed. LANT and some AWM publications state 10 people sheltering were killed.', notes: 'Pending formal adjudication to determine if discrepancy arises from staff classification vs. total occupants.', sources: [{title: 'Lowe Commission', institution: 'Official Inquiry (1942)'}, {title: 'Civilian Casualties', institution: 'Commonwealth War Graves Commission'}] } }),"
);

fs.writeFileSync(path, code);
console.log('Added ledgerData to entities');

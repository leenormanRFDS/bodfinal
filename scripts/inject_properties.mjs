import fs from 'fs';
let code = fs.readFileSync('src/lib/spatial/spatial-evidence-overlay.ts', 'utf8');

function inject(searchStr, replacement) {
  if (code.includes(searchStr)) {
    code = code.replace(searchStr, replacement);
  } else {
    console.error("Could not find:", searchStr);
  }
}

inject(
  "const bathurstMission = this.dataSource.entities.add({",
  "const bathurstMission = this.dataSource.entities.add({\n      properties: new Cesium.PropertyBag({ ledgerData: { title: 'Sacred Heart Mission, Nguiu', classification: 'CONTEMPORARY_ARCHIVAL_RECORD', confidence: 'VERIFIED', known: 'The mission was an established location. Father McGrath sighted the formation and transmitted a warning to Darwin VID.', uncertain: 'The exact physical position from which he personally observed the formation is not established to survey precision.', notes: '09:35 sighting. 09:37 transmission (Darwin Local Time).', sources: [{title: 'Lowe Commission Exhibit 3', institution: 'Official Inquiry (1942)'}, {title: 'Father McGrath Radio Log', institution: 'Contemporary Archive'}] } }),"
);

inject(
  "const harbourCentroid = this.dataSource.entities.add({",
  "const harbourCentroid = this.dataSource.entities.add({\n      properties: new Cesium.PropertyBag({ ledgerData: { title: 'First-Wave Approach', classification: 'DIGITAL_RECONSTRUCTION', confidence: 'MODERATE', known: '188-aircraft total is strongly supported. The broad approach over the peninsula is evidence-based.', uncertain: 'The 71/72 D3A dive bomber discrepancy exists between official histories and some Australian War Memorial sources. Individual aircraft tracks are not known.', notes: 'The rendered corridor is an interpretive reconstruction. The project does not show false precision by rendering 188 individual 3D aircraft tracks.', sources: [{title: 'Senshi Sōsho Vol. 26', institution: 'Japanese Official History'}, {title: 'Lowe Commission', institution: 'Official Inquiry (1942)'}] } }),"
);

inject(
  "const postOfficeMarker = this.dataSource.entities.add({",
  "const postOfficeMarker = this.dataSource.entities.add({\n      properties: new Cesium.PropertyBag({ ledgerData: { title: 'Darwin Post & Telegraph Office', classification: 'ESTABLISHED_FACT', confidence: 'VERIFIED', known: 'The civilian shelter trench behind the Post Office received a direct bomb hit at approximately 10:00.', uncertain: 'Casualty discrepancy: AWM records state 9 staff members killed. LANT and some AWM publications state 10 people sheltering were killed.', notes: 'Pending formal adjudication to determine if discrepancy arises from staff classification vs. total occupants.', sources: [{title: 'Lowe Commission', institution: 'Official Inquiry (1942)'}, {title: 'Civilian Casualties', institution: 'Commonwealth War Graves Commission'}] } }),"
);

inject(
  "const pearyWreckMarker = this.dataSource.entities.add({",
  "const pearyWreckMarker = this.dataSource.entities.add({\n      properties: new Cesium.PropertyBag({ ledgerData: { title: 'USS Peary (DD-226)', classification: 'ESTABLISHED_FACT', confidence: 'HIGH', known: 'Modern surveyed wreck position on the seabed. Approximate manoeuvre sector during the attack is documented.', uncertain: 'Unresolved exact attack trajectory on the surface. Casualty-source disagreement (80, 88, or 91 fatalities depending on inclusion of later deaths from wounds and crew complement methodologies).', notes: 'Do not force a single \"correct\" casualty source without historical adjudication.', sources: [{title: 'DANFS: USS Peary', institution: 'US Naval History and Heritage Command'}, {title: 'Royal Australian Navy Vol. 1', institution: 'Official History'}] } }),"
);

fs.writeFileSync('src/lib/spatial/spatial-evidence-overlay.ts', code);
console.log('Inject script completed');

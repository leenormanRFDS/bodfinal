/**
 * THE BOMBING OF DARWIN — HISTORICAL SPATIAL ENGINE
 * Spatial Evidence Overlay & Representative Asset Coordinator
 * 
 * Manages evidence-governed cartographic markers, representative historical objects,
 * and narrative scene choreography in CesiumJS.
 * 
 * Strict Governance Rules:
 * 1. TRUTH FIRST: Every marker, silhouette and boundary corresponds to verified or approximate canonical entities.
 * 2. NEGATIVE CONSTRAINTS:
 *    - NO 1:1 individual aircraft tracks (corridors and representative formations only).
 *    - 1942 Stokes Hill Wharf geometry remains unresolved (null coordinates) — never drawn.
 *    - MV Neptuna 1942 berth remains unresolved (null coordinates) — never drawn as a point.
 *    - All marker coordinates are read from canon (data/entities/*) or present-day OSM anchors.
 *    - NO game-like HUDs, neon target reticles, or radar pulses.
 * 3. AESTHETICS: Restrained, archival, institutional palette (Bone #ECE7DB, Gold #C6A15B, Dark #07090B).
 * 4. TRANSITION LIFECYCLE: Strict phase management (IDLE -> FLYING -> SETTLED) to eliminate label leakage.
 */

import type * as CesiumType from 'cesium';
import type { SpatialDemonstrationStateId } from './spatial-types';
import { SpatialRepresentativeAssets } from './spatial-representative-assets';
import { SpatialFormationController } from './spatial-formation-controller';
import vesselsData from '../../../data/entities/vessels.json';
import locationsData from '../../../data/entities/locations.json';
import presentDayAnchors from './present-day-anchors.json';

/**
 * Canonical coordinates. Components must not invent positions: every marker
 * below reads from data/entities/* (historical canon) or present-day-anchors.json
 * (present-day OSM geometry). A null canonical coordinate means "do not draw".
 */
type LonLat = { lon: number; lat: number };
function canonVessel(id: string): LonLat | null {
  const v: any = (vesselsData as any).entities.find((e: any) => e.id === id);
  const c = v?.coordinates;
  return c && c.latitude != null && c.longitude != null ? { lon: c.longitude, lat: c.latitude } : null;
}
/** Modern surveyed wreck position (vessels.json wreckPositionModernSurvey), with depth. */
function canonWreck(id: string): (LonLat & { depthM: number | null }) | null {
  const v: any = (vesselsData as any).entities.find((e: any) => e.id === id);
  const c = v?.wreckPositionModernSurvey?.coordinates;
  return c && c.latitude != null && c.longitude != null
    ? { lon: c.longitude, lat: c.latitude, depthM: c.depthM ?? null }
    : null;
}
function canonLocation(id: string): LonLat | null {
  const l: any = (locationsData as any).entities.find((e: any) => e.id === id);
  return l && l.latitude != null && l.longitude != null ? { lon: l.longitude, lat: l.latitude } : null;
}
function presentDay(id: string): LonLat {
  const a = (presentDayAnchors as any).anchors[id];
  return { lon: a.longitude, lat: a.latitude };
}

/** Map annotation typography: IBM Plex Mono (config/design-tokens.json → typography.evidence). */
const MAP_FONT_FAMILY = '"IBM Plex Mono", ui-monospace, monospace';
const LABEL_PRIORITY = { PRIMARY: 0, CONTEXT: 1, DETAIL: 2 } as const;

export interface EvidenceSource {
  title: string;
  institution?: string;
  reference?: string;
}

export interface LedgerEntityData {
  id: string;
  title: string;
  time?: string;
  badge?: string;
  classification: string;
  confidence: string;
  known: string;
  uncertain?: string;
  notes?: string;
  sources: EvidenceSource[];
}

export const CANONICAL_EVIDENCE_RECORDS: Record<string, LedgerEntityData> = {
  'timor-launch': {
    id: 'timor-launch',
    title: 'Estimated Launch Area',
    time: '08:00 (approx)',
    badge: 'DIGITAL RECONSTRUCTION',
    classification: 'DIGITAL_RECONSTRUCTION',
    confidence: 'MODERATE',
    known: '1st Carrier Air Fleet was operating in the Timor Sea approximately 220 NM NNW of Darwin. Takeoff commenced ~07:50–08:00 (06:20–06:25 JST), with Fuchida airborne at 06:22 JST.',
    uncertain: 'Exact coordinate of the flagship Akagi during launch is a general operational envelope with a ~40km uncertainty radius.',
    notes: 'Reconstructed parameter. Center point is a mathematical camera anchor, not an observed coordinate. Full operational launch/assembly window ran 08:00 to 08:45 Darwin Local Time.',
    sources: [{ title: 'Senshi Sōsho Vol. 26', institution: 'Japanese Official History' }]
  },
  'bathurst-mission': {
    id: 'bathurst-mission',
    title: 'Sacred Heart Mission, Nguiu',
    time: '09:35',
    badge: 'ARCHIVAL RECORD',
    classification: 'CONTEMPORARY_ARCHIVAL_RECORD',
    confidence: 'VERIFIED',
    known: 'The mission was an established location. Father McGrath sighted the formation and transmitted a warning to Darwin VID.',
    uncertain: 'The exact physical position from which he personally observed the formation is not established to survey precision.',
    notes: '09:35 sighting. 09:37 transmission (Darwin Local Time).',
    sources: [
      { title: 'Lowe Commission Exhibit 3', institution: 'Official Inquiry (1942)' },
      { title: 'Father McGrath Radio Log', institution: 'Contemporary Archive' }
    ]
  },
  'first-wave-approach': {
    id: 'first-wave-approach',
    title: 'First-Wave Approach',
    time: '09:58',
    badge: 'DIGITAL RECONSTRUCTION',
    classification: 'DIGITAL_RECONSTRUCTION',
    confidence: 'MODERATE',
    known: '188-aircraft total is strongly supported. The broad approach over the peninsula is evidence-based.',
    uncertain: 'The 71/72 D3A dive bomber discrepancy exists between official histories and some Australian War Memorial sources. Individual aircraft tracks are not known.',
    notes: 'The rendered corridor is an interpretive reconstruction. The project does not show false precision by rendering 188 individual 3D aircraft tracks.',
    sources: [
      { title: 'Senshi Sōsho Vol. 26', institution: 'Japanese Official History' },
      { title: 'Lowe Commission', institution: 'Official Inquiry (1942)' }
    ]
  },
  'post-office': {
    id: 'post-office',
    title: 'Darwin Post & Telegraph Office',
    time: '10:00',
    badge: 'ESTABLISHED FACT',
    classification: 'ESTABLISHED_FACT',
    confidence: 'VERIFIED',
    known: 'The civilian shelter trench behind the Post Office received a direct bomb hit at approximately 10:00.',
    uncertain: 'Casualty discrepancy: AWM records state 9 staff members killed. LANT and some AWM publications state 10 people sheltering were killed.',
    notes: 'Pending formal adjudication to determine if discrepancy arises from staff classification vs. total occupants.',
    sources: [
      { title: 'Lowe Commission', institution: 'Official Inquiry (1942)' },
      { title: 'Civilian Casualties', institution: 'Commonwealth War Graves Commission' }
    ]
  },
  'peary-underway': {
    id: 'peary-underway',
    title: 'USS Peary Under Attack',
    time: '10:45',
    badge: 'ESTABLISHED FACT',
    classification: 'ESTABLISHED_FACT',
    confidence: 'VERIFIED',
    known: 'USS Peary (DD-226) was targeted by sustained dive-bomber attacks while manoeuvring in Darwin Harbour, struck by five bombs between 10:15 and 10:45.',
    uncertain: 'Exact surface track during evasive manoeuvres within the harbour is reconstructed from survivor testimony.',
    notes: 'Five direct bomb hits confirmed by US Navy action reports and official naval histories.',
    sources: [
      { title: 'DANFS: USS Peary', institution: 'US Naval History and Heritage Command' },
      { title: 'Royal Australian Navy Vol. 1', institution: 'Official History' }
    ]
  },
  'raaf-station': {
    id: 'raaf-station',
    title: 'RAAF Station Darwin (Airfield)',
    time: '12:00',
    badge: 'ESTABLISHED FACT',
    classification: 'ESTABLISHED_FACT',
    confidence: 'VERIFIED',
    known: 'Fifty-four land-based heavy bombers arrived at high altitude (18,000–23,000 ft) to pattern-bomb RAAF Station Darwin at Parap between 11:58 and 12:25.',
    uncertain: 'Radar 311 at Dripstone was on site but not yet calibrated or connected to an operational plotting network.',
    notes: 'Second raid of 19 February 1942 comprised 27 G4M1 Bettys and 27 G3M2 Nells.',
    sources: [
      { title: 'Senshi Sōsho Vol. 26', institution: 'Japanese Official History' },
      { title: 'Royal Australian Air Force 1939–1942', institution: 'Official History (Gillison)' },
      { title: 'Lowe Commission', institution: 'Official Inquiry (1942)' }
    ]
  },
  'peary-wreck': {
    id: 'peary-wreck',
    title: 'USS Peary (DD-226)',
    time: '13:00',
    badge: 'ESTABLISHED FACT',
    classification: 'ESTABLISHED_FACT',
    confidence: 'HIGH',
    known: 'Modern surveyed wreck position on the seabed at 27m depth. Documented high-speed evasion in harbour channel prior to sinking.',
    uncertain: 'Unresolved exact surface sinking trajectory. Casualty-source disagreement: authoritative sources report different casualty totals (NHHC: 80, RAN: 88, AWM: 91).',
    notes: 'Legally protected historic shipwreck and war grave under Commonwealth legislation.',
    sources: [
      { title: 'Australian Hydrographic Office (Chart Aus 26)', institution: 'Official Hydrographic Survey' },
      { title: 'DANFS: USS Peary', institution: 'US Naval History and Heritage Command' },
      { title: 'Royal Australian Navy Vol. 1', institution: 'Official History' }
    ]
  },
  'stokes-hill-wharf': {
    id: 'stokes-hill-wharf',
    title: 'Stokes Hill Wharf & MV Neptuna',
    time: '10:12',
    badge: 'ARCHIVAL RECORD',
    classification: 'CONTEMPORARY_ARCHIVAL_RECORD',
    confidence: 'VERIFIED',
    known: 'MV Neptuna was berthed at Stokes Hill Wharf laden with depth charges and ammunition. Struck during the first wave, she caught fire and detonated at 10:12, severing a 100-foot section of the wharf.',
    uncertain: 'Exact 1942 timber wharf footprint remains unresolved (null coordinates applied).',
    notes: 'Stokes Hill Wharf is the principal geographic anchor linking 1942 events to the modern waterfront.',
    sources: [
      { title: 'Lowe Commission Exhibit 3', institution: 'Official Inquiry (1942)' },
      { title: 'NAA Darwin Wharf Plans 1942', institution: 'National Archives of Australia' },
      { title: 'AWM 128108 Photograph', institution: 'Australian War Memorial' }
    ]
  },
  'kelat-wreck': {
    id: 'kelat-wreck',
    title: 'Coal Hulk Kelat (Subsequent Loss)',
    time: '24 February 1942',
    badge: 'HISTORICAL FACT',
    classification: 'ESTABLISHED_FACT',
    confidence: 'HIGH',
    known: 'Iron coal hulk Kelat sustained hull damage from bomb near-misses on 19 February 1942, slowly took on water, and sank five days later on 24 February. Modern surveyed wreck rests at 15m depth.',
    uncertain: 'Exact 19 February anchorage position versus 24 February sinking position.',
    notes: 'Contextual seabed evidence; Kelat is not counted among the eight vessels sunk on the day of 19 February 1942.',
    sources: [
      { title: 'Australian Hydrographic Office (Chart Aus 26)', institution: 'Official Hydrographic Survey' },
      { title: 'Royal Australian Navy 1939–1942 (G. Hermon Gill)', institution: 'Official War History' }
    ]
  }
};

export type EvidenceNodeType = 
  | 'DOCUMENTED_HISTORICAL' 
  | 'MODERN_SURVEYED_WRECK' 
  | 'APPROXIMATE_ACTIVITY' 
  | 'BOMB_IMPACT';

interface EvidenceNodeRecord {
  id: string;
  type: EvidenceNodeType;
  primaryEntities: CesiumType.Entity[];
  labelEntity: CesiumType.Entity;
  showContextualLabel?: boolean;
  relevanceMap: Partial<Record<SpatialDemonstrationStateId, 'PRIMARY' | 'CONTEXTUAL' | 'HIDDEN'>>;
}

export enum TransitionPhase {
  IDLE = 'IDLE',
  FLYING = 'FLYING',
  SETTLED = 'SETTLED'
}

export class SpatialEvidenceOverlay {
  private Cesium: typeof CesiumType;
  private viewer: CesiumType.Viewer;
  private dataSource: CesiumType.CustomDataSource | null = null;
  private evidenceNodes: EvidenceNodeRecord[] = [];
  private activeStateId: SpatialDemonstrationStateId = 'STATE_00_WORLD';
  private phase: TransitionPhase = TransitionPhase.IDLE;
  private formationController: SpatialFormationController | null = null;
  private labelPriority: Map<CesiumType.Entity, number> = new Map();

  // Dedicated scene-choreography entities
  private communicationLineEntity: CesiumType.Entity | null = null;
  private communicationLabelEntity: CesiumType.Entity | null = null;
  private communicationProgress: number = 0;
  private communicationTimer: any = null;

  constructor(Cesium: typeof CesiumType, viewer: CesiumType.Viewer) {
    this.Cesium = Cesium;
    this.viewer = viewer;
  }

  public async initialize(): Promise<void> {
    const Cesium = this.Cesium;
    this.dataSource = new Cesium.CustomDataSource('darwin-historical-evidence');
    await this.viewer.dataSources.add(this.dataSource);

    this.formationController = new SpatialFormationController(this.Cesium, this.viewer, this.dataSource);
    this.formationController.initialize();

    // Cesium rasterises label glyphs once; make sure the annotation face is loaded first.
    try {
      const fonts = (document as any).fonts;
      if (fonts?.load) {
        await Promise.race([
          Promise.all([fonts.load(`500 15px ${MAP_FONT_FAMILY}`), fonts.load(`500 12px ${MAP_FONT_FAMILY}`)]),
          new Promise((r) => setTimeout(r, 2500)),
        ]);
      }
    } catch { /* fall back to system monospace */ }

    this.buildEvidenceEntities();
    this.wrapLabelsForViewport();
    this.setupInteraction();
    this.updateVisibility();
  }

  private setupInteraction(): void {
    const handler = new this.Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);
    handler.setInputAction((movement: any) => {
      const pickedObject = this.viewer.scene.pick(movement.position);
      if (this.Cesium.defined(pickedObject) && pickedObject.id && pickedObject.id.properties) {
        const props = pickedObject.id.properties.getValue(this.viewer.clock.currentTime);
        if (props && props.ledgerData) {
          if (typeof window !== 'undefined' && (window as any).openEvidenceLedger) {
            (window as any).openEvidenceLedger(props.ledgerData);
          }
        }
      }
    }, this.Cesium.ScreenSpaceEventType.LEFT_CLICK);
  }

  private buildEvidenceEntities(): void {
    if (!this.dataSource) return;
    const Cesium = this.Cesium;

    const goldColor = Cesium.Color.fromCssColorString('#C6A15B');
    const goldMuted = Cesium.Color.fromCssColorString('rgba(198, 161, 91, 0.40)');
    const boneColor = Cesium.Color.fromCssColorString('#ECE7DB');
    const darkBg = Cesium.Color.fromCssColorString('#070A0E');
    const corridorOutline = Cesium.Color.fromCssColorString('rgba(198, 161, 91, 0.50)');
    const corridorFill = Cesium.Color.fromCssColorString('rgba(198, 161, 91, 0.08)');

    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

    // Priority 3 Typography Hierarchy:
    // Primary event: 16–18px desktop / 14–16px mobile
    // Important geography / vessels: 12–13px desktop / 11–12px mobile
    const primaryEventFont = isMobile ? `500 13px ${MAP_FONT_FAMILY}` : `500 15px ${MAP_FONT_FAMILY}`;
    const geoEntityFont = isMobile ? `500 11px ${MAP_FONT_FAMILY}` : `500 12px ${MAP_FONT_FAMILY}`;

    // Labels carry a dark halo (outline) instead of opaque boxes: legible over land and water
    // without a field of black rectangles. bgBadge retained only for type compatibility.
    const bgBadge = Cesium.Color.fromCssColorString('rgba(7, 10, 14, 0.0)');
    const contextGrey = Cesium.Color.fromCssColorString('#A9AEB2');
    const bgPadding = new Cesium.Cartesian2(8, 5);

    // =========================================================================
    // BEAT 0 (08:00): TIMOR SEA LAUNCH AREA · REPRESENTATIVE CARRIER GROUP & FORMATION
    // 1st Carrier Air Fleet operating ~220 NM NNW Darwin. Uncertainty ~40km.
    // Carriers: Akagi (Flagship), Kaga, Soryu, Hiryu.
    // =========================================================================
    const node0Entities: CesiumType.Entity[] = [];

    // Operational launch envelope: routes.json reconstructed launch centroid, 40 km uncertainty radius.
    const launchArea = this.dataSource.entities.add({
      position: Cesium.Cartesian3.fromDegrees(129.0, -10.5, 0),
      ellipse: {
        semiMajorAxis: 40000,
        semiMinorAxis: 40000,
        height: 0,
        material: corridorFill,
        outline: true,
        outlineColor: corridorOutline,
        outlineWidth: 1.5,
      },
      show: false,
    });
    node0Entities.push(launchArea);

    // The four carriers (formations.json carrierUnits). Their individual positions were not recorded:
    // the grouping inside the launch area is REPRESENTATIVE and labelled as such.
    const carriers = [
      { name: 'AKAGI', lon: 128.92, lat: -10.46, isFlagship: true },
      { name: 'KAGA', lon: 128.98, lat: -10.54, isFlagship: false },
      { name: 'SORYU', lon: 129.06, lat: -10.48, isFlagship: false },
      { name: 'HIRYU', lon: 129.12, lat: -10.55, isFlagship: false },
    ];

    for (const c of carriers) {
      // High-DPI plan silhouette billboard
      const carrierTexture = SpatialRepresentativeAssets.getCarrierTexture({ name: c.name, isFlagship: c.isFlagship });
      if (carrierTexture) {
        const billboard = this.dataSource.entities.add({
          position: Cesium.Cartesian3.fromDegrees(c.lon, c.lat, 35),
          billboard: {
            image: carrierTexture,
            // Kept small: at this scale a 260 m carrier is sub-pixel; the symbol must not dwarf the formation.
            width: 46,
            height: 12,
            alignedAxis: Cesium.Cartesian3.UNIT_Z,
            rotation: Cesium.Math.toRadians(140),
            scaleByDistance: new Cesium.NearFarScalar(5e4, 1.2, 3e6, 0.7),
          },
          show: false,
        });
        node0Entities.push(billboard);
      }

      // Single prominent flagship label (avoids 4 redundant carrier labels)
      if (c.isFlagship) {
        const nameLabel = this.dataSource.entities.add({
          position: Cesium.Cartesian3.fromDegrees(c.lon, c.lat, 80),
          label: {
            text: 'AKAGI · KAGA · SORYU · HIRYU\nCARRIER POSITIONS REPRESENTATIVE',
            font: geoEntityFont,
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            fillColor: goldColor,
            outlineColor: darkBg,
            outlineWidth: 5,
            showBackground: false,
            backgroundColor: bgBadge,
            backgroundPadding: bgPadding,
            // To the left of the group: the onward track runs up-right from it.
            horizontalOrigin: Cesium.HorizontalOrigin.RIGHT,
            verticalOrigin: Cesium.VerticalOrigin.CENTER,
            pixelOffset: new Cesium.Cartesian2(-34, 6),
            scaleByDistance: new Cesium.NearFarScalar(1e5, 1.0, 3e6, 0.6),
          },
          show: false,
        });
        if (isMobile) this.compactForPhone(nameLabel, 'FOUR CARRIERS\n(POSITIONS REPRESENTATIVE)');
        node0Entities.push(nameLabel);
      }
    }

    // Transit corridor vector heading southeast toward Bathurst Island
    const launchCorridor = this.dataSource.entities.add({
      polyline: {
        positions: Cesium.Cartesian3.fromDegreesArrayHeights([
          129.0, -10.5, 4000,
          130.627, -11.758, 3500,
        ]),
        width: 1.5,
        material: new Cesium.PolylineDashMaterialProperty({
          color: corridorOutline,
          dashLength: 16.0,
        }),
      },
      show: false,
    });
    node0Entities.push(launchCorridor);

    // Primary scale & authority label for Beat 0 (16-18px primary event)
    const launchLabel = this.dataSource.entities.add({
      properties: new Cesium.PropertyBag({ ledgerData: CANONICAL_EVIDENCE_RECORDS['timor-launch'] }),
      position: Cesium.Cartesian3.fromDegrees(129.25, -10.75, 4200),
      label: {
        text: 'FIRST WAVE: 188 AIRCRAFT · 08:00–08:45\nESTIMATED LAUNCH AREA · ~220 NM NNW OF DARWIN',
        font: primaryEventFont,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        fillColor: boneColor,
        outlineColor: darkBg,
        outlineWidth: 5,
        showBackground: false,
        backgroundColor: bgBadge,
        backgroundPadding: bgPadding,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        pixelOffset: new Cesium.Cartesian2(0, -16),
        scaleByDistance: new Cesium.NearFarScalar(1e5, 1.0, 4e6, 0.7),
      },
      show: false,
    });
    if (isMobile) this.compactForPhone(launchLabel, 'FIRST WAVE · 188 AIRCRAFT\n08:00–08:45 · LAUNCH AREA');

    this.evidenceNodes.push({
      id: 'NODE_TIMOR_LAUNCH',
      type: 'APPROXIMATE_ACTIVITY',
      primaryEntities: node0Entities,
      labelEntity: launchLabel,
      relevanceMap: {
        BEAT_0_TIMOR_LAUNCH: 'PRIMARY',
        STATE_01_NORTH: 'CONTEXTUAL',
      },
    });

    // =========================================================================
    // BEAT 1 (09:35): BATHURST ISLAND WARNING · NGUIU SITE MONUMENT & SCHEMATIC EVENT
    // Sacred Heart Mission at Nguiu. Father McGrath transmits warning 09:37.
    // Prominent authored labels: BATHURST ISLAND and DARWIN.
    // =========================================================================
    const node1Entities: CesiumType.Entity[] = [];

    // Prominent Project-Authored Geography Labels (12-13px)
    const bathurstIslandLabel = this.dataSource.entities.add({
      position: Cesium.Cartesian3.fromDegrees(130.40, -11.60, 2500),
      label: {
        text: 'BATHURST ISLAND',
        font: geoEntityFont,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        fillColor: boneColor,
        outlineColor: darkBg,
        outlineWidth: 5,
        showBackground: false,
        backgroundColor: bgBadge,
        backgroundPadding: bgPadding,
        scaleByDistance: new Cesium.NearFarScalar(3e4, 1.1, 8e5, 0.7),
      },
      show: false,
    });
    node1Entities.push(bathurstIslandLabel);

    const darwinContextLabel = this.dataSource.entities.add({
      position: Cesium.Cartesian3.fromDegrees(130.84, -12.44, 1500),
      label: {
        text: 'DARWIN (MAINLAND)',
        font: geoEntityFont,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        fillColor: goldColor,
        outlineColor: darkBg,
        outlineWidth: 5,
        showBackground: false,
        backgroundColor: bgBadge,
        backgroundPadding: bgPadding,
        scaleByDistance: new Cesium.NearFarScalar(3e4, 1.0, 8e5, 0.7),
      },
      show: false,
    });
    node1Entities.push(darwinContextLabel);

    // Sacred Heart Mission Architectural Site Monument (vertical presence)
    const missionPlinth = this.dataSource.entities.add({
      properties: new Cesium.PropertyBag({ ledgerData: CANONICAL_EVIDENCE_RECORDS['bathurst-mission'] }),
      position: Cesium.Cartesian3.fromDegrees(130.627, -11.758, 200),
      cylinder: {
        length: 400,
        topRadius: 180,
        bottomRadius: 220,
        material: Cesium.Color.fromCssColorString('rgba(198, 161, 91, 0.25)'),
        outline: true,
        outlineColor: goldColor,
        outlineWidth: 1.5,
      },
      show: false,
    });
    node1Entities.push(missionPlinth);

    // Base survey disc
    const missionDisc = this.dataSource.entities.add({
      position: Cesium.Cartesian3.fromDegrees(130.627, -11.758, 20),
      ellipse: {
        semiMajorAxis: 1200,
        semiMinorAxis: 1200,
        material: Cesium.Color.fromCssColorString('rgba(198, 161, 91, 0.10)'),
        outline: true,
        outlineColor: goldMuted,
        outlineWidth: 1.0,
      },
      show: false,
    });
    node1Entities.push(missionDisc);

    // Observed transit corridor across Clarence Strait heading ~140°
    const bathurstCorridor = this.dataSource.entities.add({
      polyline: {
        positions: Cesium.Cartesian3.fromDegreesArrayHeights([
          130.627, -11.758, 3500,
          131.05, -12.30, 3200,
        ]),
        width: 1.5,
        // Dashed: the formation's onward corridor (approximate). The solid line is the radio warning.
        material: new Cesium.PolylineDashMaterialProperty({ color: corridorOutline, dashLength: 14.0 }),
      },
      show: false,
    });
    node1Entities.push(bathurstCorridor);

    // Dynamic 09:37 Communication Line across Clarence Strait (continuous archival line)
    this.communicationLineEntity = this.dataSource.entities.add({
      polyline: {
        positions: new Cesium.CallbackProperty(() => {
          const t = this.communicationProgress;
          const startLon = 130.627, startLat = -11.758, startAlt = 400;
          const endLon = 130.8443, endLat = -12.4647, endAlt = 100;
          const curLon = startLon + (endLon - startLon) * t;
          const curLat = startLat + (endLat - startLat) * t;
          const curAlt = startAlt + (endAlt - startAlt) * t;
          return Cesium.Cartesian3.fromDegreesArrayHeights([
            startLon, startLat, startAlt,
            curLon, curLat, curAlt,
          ]);
        }, false),
        width: 2.5,
        material: goldColor,
      },
      show: false,
    });
    node1Entities.push(this.communicationLineEntity);

    // 09:37 Warning transmission endpoint annotation
    this.communicationLabelEntity = this.dataSource.entities.add({
      position: Cesium.Cartesian3.fromDegrees(130.8443, -12.4647, 150),
      label: {
        text: '09:37 · WARNING TRANSMITTED VIA COASTAL RADIO SERVICE (VID)\n"LARGE FORMATION UNIDENTIFIED AIRCRAFT OVERHEAD HEADING SOUTH"',
        font: geoEntityFont,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        fillColor: boneColor,
        outlineColor: darkBg,
        outlineWidth: 5,
        showBackground: false,
        backgroundColor: bgBadge,
        backgroundPadding: bgPadding,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        pixelOffset: new Cesium.Cartesian2(0, -16),
      },
      show: false,
    });
    if (isMobile) this.compactForPhone(this.communicationLabelEntity, '09:37 · WARNING SENT\nVIA COASTAL RADIO (VID)');
    node1Entities.push(this.communicationLabelEntity);

    // Primary mission label (16-18px primary event)
    const bathurstLabel = this.dataSource.entities.add({
      properties: new Cesium.PropertyBag({ ledgerData: CANONICAL_EVIDENCE_RECORDS['bathurst-mission'] }),
      position: Cesium.Cartesian3.fromDegrees(130.627, -11.758, 450),
      label: {
        text: 'SACRED HEART MISSION, NGUIU · 09:35\nFATHER MCGRATH TRANSMITS SIGHTING WARNING',
        font: primaryEventFont,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        fillColor: boneColor,
        outlineColor: darkBg,
        outlineWidth: 5,
        showBackground: false,
        backgroundColor: bgBadge,
        backgroundPadding: bgPadding,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        // Clear of the formation overhead (it spans ~±12 km around the mission).
        pixelOffset: new Cesium.Cartesian2(0, -64),
        scaleByDistance: new Cesium.NearFarScalar(3e4, 1.0, 8e5, 0.7),
      },
      show: false,
    });
    if (isMobile) this.compactForPhone(bathurstLabel, 'NGUIU MISSION · 09:35', -36);

    this.evidenceNodes.push({
      id: 'NODE_BATHURST_MISSION',
      type: 'DOCUMENTED_HISTORICAL',
      primaryEntities: node1Entities,
      labelEntity: bathurstLabel,
      relevanceMap: {
        BEAT_1_BATHURST_WARNING: 'PRIMARY',
        BEAT_0_TIMOR_LAUNCH: 'CONTEXTUAL',
        STATE_01_NORTH: 'CONTEXTUAL',
      },
    });

    // =========================================================================
    // BEAT 2 (09:58): DARWIN HARBOUR & TOWN STRIKE · BROAD RECONSTRUCTED APPROACH FIELD
    // Broad tapered directional envelope (fan) out of rising sun (315°–345° axis).
    // Documented shipping roadstead impact sector and civic peninsula sector.
    // =========================================================================
    const node2Entities: CesiumType.Entity[] = [];

    // Broad Reconstructed Approach Envelope (polygon fan coming from southeast)
    const approachFan = this.dataSource.entities.add({
      polygon: {
        hierarchy: Cesium.Cartesian3.fromDegreesArrayHeights([
          130.8456, -12.4634, 1200, // Apex at Darwin Harbour roadstead
          131.02, -12.62, 3200,    // Southern flank
          131.08, -12.54, 3200,    // Eastern flank
        ]),
        perPositionHeight: true,
        material: Cesium.Color.fromCssColorString('rgba(198, 161, 91, 0.035)'),
        outline: true,
        outlineColor: corridorOutline,
        outlineWidth: 1.5,
      },
      show: false,
    });
    // Not shown at 09:58: the 3D approach envelope reads as stray lines at harbour scale.
    // It belongs to an approach beat (M2); entity retained but never revealed here.
    void approachFan;

    // Harbour Roadstead Impact Sector (bounded polygon)
    const harbourRoadstead = this.dataSource.entities.add({
      position: Cesium.Cartesian3.fromDegrees(130.8420, -12.4700, 15),
      ellipse: {
        semiMajorAxis: 1800,
        semiMinorAxis: 1100,
        height: 0,
        material: Cesium.Color.fromCssColorString('rgba(198, 161, 91, 0.05)'),
        outline: true,
        outlineColor: goldMuted,
        outlineWidth: 1.2,
      },
      show: false,
    });
    // Not shown: a 1.8 km ellipse drawn over the town dominated the frame and is not a canonical
    // boundary. The anchored shipping itself shows the roadstead.
    void harbourRoadstead;

    // Anchored harbour shipping in roadstead at 09:58
    const merchantTexture = SpatialRepresentativeAssets.getMerchantVesselTexture('transport', 80);
    const destroyerTex = SpatialRepresentativeAssets.getDestroyerTexture();

    // Shipping at anchor in the roadstead at 09:58. Positions are canonical surveyed wreck/anchorage
    // coordinates (data/entities/vessels.json). MV Neptuna (berth unresolved) and USS Peary
    // (09:58 position unknown) are deliberately not placed here.
    const roadsteadShips = [
      { id: 'MV_ZEALANDIA', name: 'ZEALANDIA', heading: 110, isNaval: false },
      { id: 'USAT_MEIGS', name: 'MEIGS', heading: 125, isNaval: false },
      { id: 'USAT_MAUNA_LOA', name: 'MAUNA LOA', heading: 105, isNaval: false },
      { id: 'BRITISH_MOTORIST', name: 'BRITISH MOTORIST', heading: 115, isNaval: false },
    ]
      .map((v) => ({ ...v, pos: canonVessel(v.id) }))
      .filter((v): v is typeof v & { pos: LonLat } => v.pos !== null)
      .map((v) => ({ ...v, lon: v.pos.lon, lat: v.pos.lat }));

    for (const ship of roadsteadShips) {
      const tex = ship.isNaval ? destroyerTex : merchantTexture;
      if (tex) {
        const ent = this.dataSource.entities.add({
          position: Cesium.Cartesian3.fromDegrees(ship.lon, ship.lat, 10),
          billboard: {
            image: tex,
            // Artwork is portrait (bow up): destroyer 100x280, merchant 46x104. Keep aspect.
            width: ship.isNaval ? 22 : 13,
            height: ship.isNaval ? 62 : 30,
            rotation: Cesium.Math.toRadians(ship.heading),
            scaleByDistance: new Cesium.NearFarScalar(2e3, 1.0, 5e4, 0.6),
          },
          show: false,
        });
        node2Entities.push(ent);
      }

      const lbl = this.dataSource.entities.add({
        position: Cesium.Cartesian3.fromDegrees(ship.lon, ship.lat, 25),
        label: {
          text: ship.name,
          font: geoEntityFont,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          fillColor: contextGrey,
          outlineColor: darkBg,
          outlineWidth: 5,
          showBackground: false,
          backgroundColor: bgBadge,
          backgroundPadding: new Cesium.Cartesian2(4, 3),
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new Cesium.Cartesian2(0, -8),
          scaleByDistance: new Cesium.NearFarScalar(2e3, 0.9, 3.5e4, 0.55),
        },
        show: false,
      });
      node2Entities.push(lbl);
    }

    // Primary Harbour & Town Strike Label (16-18px)
    const harbourLabel = this.dataSource.entities.add({
      properties: new Cesium.PropertyBag({ ledgerData: CANONICAL_EVIDENCE_RECORDS['first-wave-approach'] }),
      // Over the town (Goyder grid, north of the Post Office): the strike fell on harbour AND town.
      position: Cesium.Cartesian3.fromDegrees(130.8418, -12.4612, 120),
      label: {
        text: 'DARWIN HARBOUR & CIVIC PRECINCT · 09:58\nFIRST BOMBS IMPACT SHIPPING ROADSTEAD & TOWN',
        font: primaryEventFont,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        fillColor: boneColor,
        outlineColor: darkBg,
        outlineWidth: 5,
        showBackground: false,
        backgroundColor: bgBadge,
        backgroundPadding: bgPadding,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        pixelOffset: new Cesium.Cartesian2(0, -14),
        scaleByDistance: new Cesium.NearFarScalar(1e4, 1.0, 3e5, 0.7),
      },
      show: false,
    });

    this.evidenceNodes.push({
      id: 'NODE_HARBOUR_STRIKE',
      type: 'BOMB_IMPACT',
      primaryEntities: node2Entities,
      labelEntity: harbourLabel,
      relevanceMap: {
        BEAT_2_HARBOUR_STRIKE: 'PRIMARY',
        STATE_02_DARWIN: 'CONTEXTUAL',
      },
    });

    // =========================================================================
    // BEAT 3 (10:00): DARWIN POST OFFICE TRENCH DIRECT HIT · ABSTRACT ARCHIVAL SITE MONUMENT
    // Corner Mitchell & Bennett Streets. Extruded 3D gold architectural plinth (32m x 20m x 35m).
    // Civilian shelter trench direct hit. Casualty count is disputed (9 vs 10) — held in the Evidence Ledger only.
    // =========================================================================
    const node3Entities: CesiumType.Entity[] = [];

    // Abstract 3D Extruded Architectural Plinth (Mitchell & Bennett Sts)
    const poPlinth = this.dataSource.entities.add({
      properties: new Cesium.PropertyBag({ ledgerData: CANONICAL_EVIDENCE_RECORDS['post-office'] }),
      position: Cesium.Cartesian3.fromDegrees(130.8443, -12.4647, 10),
      box: {
        dimensions: new Cesium.Cartesian3(28, 20, 16),
        material: Cesium.Color.fromCssColorString('rgba(198, 161, 91, 0.25)'),
        outline: true,
        outlineColor: goldColor,
      },
      show: false,
    });
    node3Entities.push(poPlinth);

    // Architectural ground survey perimeter ring
    const poSurveyRing = this.dataSource.entities.add({
      position: Cesium.Cartesian3.fromDegrees(130.8443, -12.4647, 4),
      ellipse: {
        semiMajorAxis: 40,
        semiMinorAxis: 30,
        material: Cesium.Color.fromCssColorString('rgba(198, 161, 91, 0.10)'),
        outline: true,
        outlineColor: goldColor,
        outlineWidth: 1.2,
      },
      show: false,
    });
    node3Entities.push(poSurveyRing);

    // Primary Post Office Label (16-18px)
    const postOfficeLabel = this.dataSource.entities.add({
      properties: new Cesium.PropertyBag({ ledgerData: CANONICAL_EVIDENCE_RECORDS['post-office'] }),
      position: Cesium.Cartesian3.fromDegrees(130.8443, -12.4647, 35),
      label: {
        text: 'DARWIN POST & TELEGRAPH OFFICE · 10:00\nTHE SHELTER TRENCH RECEIVED A DIRECT HIT',
        font: primaryEventFont,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        fillColor: boneColor,
        outlineColor: darkBg,
        outlineWidth: 5,
        showBackground: false,
        backgroundColor: bgBadge,
        backgroundPadding: bgPadding,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        pixelOffset: new Cesium.Cartesian2(0, -12),
      },
      show: false,
    });

    this.evidenceNodes.push({
      id: 'NODE_POST_OFFICE',
      type: 'BOMB_IMPACT',
      primaryEntities: node3Entities,
      labelEntity: postOfficeLabel,
      relevanceMap: {
        BEAT_3_POST_OFFICE: 'PRIMARY',
      },
    });

    // =========================================================================
    // BEAT 4 (10:45): USS PEARY UNDER ATTACK · REPRESENTATIVE SHIP & MANOEUVRE SECTOR
    // Representative Clemson-class destroyer silhouette underway evading in channel.
    // Clean, isolated scene: Peary + Stokes Hill Wharf + Fort Hill. No wreck clutter!
    // =========================================================================
    const node4Entities: CesiumType.Entity[] = [];

    // Anchor: canonical surveyed wreck position (vessels.json USS_PEARY_DD226). Peary's surface track
    // during the attack is reconstructed from testimony and is not drawn; the ring is an explicitly
    // APPROXIMATE manoeuvre area around where she was lost.
    const pearyAnchor = canonVessel('USS_PEARY_DD226') ?? { lon: 130.829, lat: -12.475 };
    const pearyArea = this.dataSource.entities.add({
      position: Cesium.Cartesian3.fromDegrees(pearyAnchor.lon, pearyAnchor.lat, 0),
      ellipse: {
        semiMajorAxis: 750,
        semiMinorAxis: 420,
        height: 0,
        rotation: Cesium.Math.toRadians(35),
        material: Cesium.Color.fromCssColorString('rgba(198, 161, 91, 0.04)'),
        outline: true,
        outlineColor: Cesium.Color.fromCssColorString('rgba(198, 161, 91, 0.32)'),
        outlineWidth: 1.0,
      },
      show: false,
    });
    node4Entities.push(pearyArea);

    // Representative Destroyer (USS Peary) plan silhouette
    // Hull only: the drawn wake read as a stray trail at harbour scale, and her actual track is not recorded.
    const destroyerTexture = SpatialRepresentativeAssets.getDestroyerTexture(false);
    if (destroyerTexture) {
      const pearyShip = this.dataSource.entities.add({
        properties: new Cesium.PropertyBag({ ledgerData: CANONICAL_EVIDENCE_RECORDS['peary-underway'] }),
        position: Cesium.Cartesian3.fromDegrees(pearyAnchor.lon, pearyAnchor.lat, 15),
        billboard: {
          image: destroyerTexture,
          // Portrait artwork (100x190, bow up). Representative silhouette, not a track.
          width: 24,
          height: 46,
          alignedAxis: Cesium.Cartesian3.UNIT_Z,
          rotation: Cesium.Math.toRadians(35),
          scaleByDistance: new Cesium.NearFarScalar(2e3, 1.2, 5e4, 0.7),
        },
        show: false,
      });
      node4Entities.push(pearyShip);
    }

    // Primary USS Peary Label
    const pearyLabel = this.dataSource.entities.add({
      properties: new Cesium.PropertyBag({ ledgerData: CANONICAL_EVIDENCE_RECORDS['peary-underway'] }),
      position: Cesium.Cartesian3.fromDegrees(pearyAnchor.lon, pearyAnchor.lat, 50),
      label: {
        text: 'USS PEARY (DD-226) · 10:15–10:45\nSTRUCK BY FIVE BOMBS · APPROXIMATE AREA',
        font: primaryEventFont,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        fillColor: boneColor,
        outlineColor: darkBg,
        outlineWidth: 5,
        showBackground: false,
        backgroundColor: bgBadge,
        backgroundPadding: bgPadding,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        pixelOffset: new Cesium.Cartesian2(0, -26),
      },
      show: false,
    });

    this.evidenceNodes.push({
      id: 'NODE_PEARY_COMBAT_SECTOR',
      type: 'APPROXIMATE_ACTIVITY',
      primaryEntities: node4Entities,
      labelEntity: pearyLabel,
      relevanceMap: {
        BEAT_4_PEARY_ATTACK: 'PRIMARY',
      },
    });

    // =========================================================================
    // BEAT 5 (12:00): RAAF STATION DARWIN · HIGH-ALTITUDE BOMBER FORMATION
    // 54 land-based heavy bombers (G4M1 Bettys & G3M2 Nells) from Kendari & Ambon.
    // 18,000–23,000 ft (6,500m) altitude. Stepped V-echelon formation flights.
    // =========================================================================
    const node5Entities: CesiumType.Entity[] = [];

    // RAAF Station Darwin: canonical centroid (locations.json). No perimeter is drawn — the 1942
    // boundary is not in canon; the basemap shows the present-day runways on the same site.
    const raaf = canonLocation('RAAF_STATION_DARWIN_1942') ?? { lon: 130.875, lat: -12.414 };
    const raafPoint = this.dataSource.entities.add({
      properties: new Cesium.PropertyBag({ ledgerData: CANONICAL_EVIDENCE_RECORDS['raaf-station'] }),
      position: Cesium.Cartesian3.fromDegrees(raaf.lon, raaf.lat, 10),
      point: { pixelSize: 9, color: goldColor, outlineColor: darkBg, outlineWidth: 2 },
      show: false,
    });
    node5Entities.push(raafPoint);
    const raafRing = this.dataSource.entities.add({
      position: Cesium.Cartesian3.fromDegrees(raaf.lon, raaf.lat, 0),
      ellipse: {
        semiMajorAxis: 600,
        semiMinorAxis: 600,
        height: 0,
        material: Cesium.Color.fromCssColorString('rgba(198, 161, 91, 0.06)'),
        outline: true,
        outlineColor: goldMuted,
        outlineWidth: 1.0,
      },
      show: false,
    });
    node5Entities.push(raafRing);

    // Primary formation & target label (16-18px)
    const raafLabel = this.dataSource.entities.add({
      properties: new Cesium.PropertyBag({ ledgerData: CANONICAL_EVIDENCE_RECORDS['raaf-station'] }),
      position: Cesium.Cartesian3.fromDegrees(raaf.lon, raaf.lat, 40),
      label: {
        text: 'RAAF STATION DARWIN · 12:00\nSECOND RAID: 54 LAND-BASED BOMBERS AT ~20,000 FT',
        font: primaryEventFont,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        fillColor: boneColor,
        outlineColor: darkBg,
        outlineWidth: 5,
        showBackground: false,
        backgroundColor: bgBadge,
        backgroundPadding: bgPadding,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        pixelOffset: new Cesium.Cartesian2(0, -16),
        scaleByDistance: new Cesium.NearFarScalar(1e4, 1.0, 4e5, 0.7),
      },
      show: false,
    });

    this.evidenceNodes.push({
      id: 'NODE_RAAF_AIRFIELD',
      type: 'DOCUMENTED_HISTORICAL',
      primaryEntities: node5Entities,
      labelEntity: raafLabel,
      relevanceMap: {
        BEAT_5_RAAF_AIRFIELD: 'PRIMARY',
        STATE_02_DARWIN: 'CONTEXTUAL',
      },
    });

    // =========================================================================
    // BEAT 6 (13:00): USS PEARY IS LOST · MODERN SURVEYED WRECK POSITION
    // Modern surveyed wreck position at 27m seabed depth (Chart Aus 26).
    // Hydrographic wreck symbol billboard (Chart Aus 26 standard) + DEPTH 27M annotation.
    // =========================================================================
    const node6Entities: CesiumType.Entity[] = [];

    const wreckSymbolTexture = SpatialRepresentativeAssets.getWreckSymbolTexture(27);
    if (wreckSymbolTexture) {
      const wreckSymbol = this.dataSource.entities.add({
        position: Cesium.Cartesian3.fromDegrees(pearyAnchor.lon, pearyAnchor.lat, 5),
        billboard: {
          image: wreckSymbolTexture,
          width: 48,
          height: 48,
          scaleByDistance: new Cesium.NearFarScalar(1e3, 1.2, 3e4, 0.7),
        },
        show: false,
      });
      node6Entities.push(wreckSymbol);
    }

    const pearyWreckLabel = this.dataSource.entities.add({
      properties: new Cesium.PropertyBag({ ledgerData: CANONICAL_EVIDENCE_RECORDS['peary-wreck'] }),
      position: Cesium.Cartesian3.fromDegrees(pearyAnchor.lon, pearyAnchor.lat, 30),
      label: {
        text: 'USS PEARY (DD-226) · MODERN SURVEYED WRECK POSITION\nDEPTH 27M · PROTECTED HISTORIC SHIPWRECK (CHART AUS 26)',
        font: primaryEventFont,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        fillColor: boneColor,
        outlineColor: darkBg,
        outlineWidth: 5,
        showBackground: false,
        backgroundColor: bgBadge,
        backgroundPadding: bgPadding,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        pixelOffset: new Cesium.Cartesian2(0, -14),
      },
      show: false,
    });

    this.evidenceNodes.push({
      id: 'NODE_PEARY_WRECK',
      type: 'MODERN_SURVEYED_WRECK',
      primaryEntities: node6Entities,
      labelEntity: pearyWreckLabel,
      relevanceMap: {
        BEAT_6_PEARY_LOST: 'PRIMARY',
      },
    });

    // =========================================================================
    // GEOGRAPHIC ANCHORS: STOKES HILL WHARF & FORT HILL
    // Always clearly legible in context across all harbour scenes without clutter
    // =========================================================================
    const wharfAnchorEntities: CesiumType.Entity[] = [];
    const shw = presentDay('STOKES_HILL_WHARF_PRESENT');

    const wharfPoint = this.dataSource.entities.add({
      properties: new Cesium.PropertyBag({ ledgerData: CANONICAL_EVIDENCE_RECORDS['stokes-hill-wharf'] }),
      position: Cesium.Cartesian3.fromDegrees(shw.lon, shw.lat, 10),
      point: {
        pixelSize: 8,
        color: goldColor,
        outlineColor: darkBg,
        outlineWidth: 2,
      },
      show: false,
    });
    wharfAnchorEntities.push(wharfPoint);

    const wharfRing = this.dataSource.entities.add({
      position: Cesium.Cartesian3.fromDegrees(shw.lon, shw.lat, 10),
      ellipse: {
        semiMajorAxis: 80,
        semiMinorAxis: 80,
        height: 0,
        material: Cesium.Color.fromCssColorString('rgba(198, 161, 91, 0.15)'),
        outline: true,
        outlineColor: goldColor,
        outlineWidth: 1.5,
      },
      show: false,
    });
    wharfAnchorEntities.push(wharfRing);

    const stokesHillWharfLabel = this.dataSource.entities.add({
      position: Cesium.Cartesian3.fromDegrees(shw.lon, shw.lat, 25),
      label: {
        text: 'STOKES HILL WHARF',
        font: geoEntityFont,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        fillColor: boneColor,
        horizontalOrigin: Cesium.HorizontalOrigin.LEFT,
        outlineColor: darkBg,
        outlineWidth: 5,
        showBackground: false,
        backgroundColor: bgBadge,
        backgroundPadding: bgPadding,
        verticalOrigin: Cesium.VerticalOrigin.CENTER,
        pixelOffset: new Cesium.Cartesian2(12, 0),
      },
      show: false,
    });

    this.evidenceNodes.push({
      id: 'NODE_STOKES_HILL_WHARF',
      type: 'DOCUMENTED_HISTORICAL',
      primaryEntities: wharfAnchorEntities,
      labelEntity: stokesHillWharfLabel,
      showContextualLabel: true,
      relevanceMap: {
        BEAT_2_HARBOUR_STRIKE: 'CONTEXTUAL',
        BEAT_3_POST_OFFICE: 'CONTEXTUAL',
        BEAT_4_PEARY_ATTACK: 'CONTEXTUAL',
        BEAT_6_PEARY_LOST: 'CONTEXTUAL',
        STATE_03_WHARF: 'PRIMARY',
      },
    });

    // Fort Hill Geographic Anchor
    const fortHillEntities: CesiumType.Entity[] = [];
    // Fort Hill: canonical 14th HAA Battery position (locations.json). The promontory itself was
    // excavated in the 1960s; the label marks the place, not a present-day landform.
    const fortHill = canonLocation('AA_BATTERY_14_FORT_HILL_1942') ?? presentDay('FORT_HILL_WHARF_PRESENT');
    const fortHillPoint = this.dataSource.entities.add({
      position: Cesium.Cartesian3.fromDegrees(fortHill.lon, fortHill.lat, 10),
      point: {
        pixelSize: 6,
        color: goldColor,
        outlineColor: darkBg,
        outlineWidth: 2,
      },
      show: false,
    });
    fortHillEntities.push(fortHillPoint);

    const fortHillLabel = this.dataSource.entities.add({
      position: Cesium.Cartesian3.fromDegrees(fortHill.lon, fortHill.lat, 25),
      label: {
        text: 'FORT HILL',
        font: geoEntityFont,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        fillColor: contextGrey,
        horizontalOrigin: Cesium.HorizontalOrigin.RIGHT,
        outlineColor: darkBg,
        outlineWidth: 5,
        showBackground: false,
        backgroundColor: bgBadge,
        backgroundPadding: bgPadding,
        verticalOrigin: Cesium.VerticalOrigin.CENTER,
        pixelOffset: new Cesium.Cartesian2(-12, 0),
      },
      show: false,
    });

    this.evidenceNodes.push({
      id: 'NODE_FORT_HILL',
      type: 'DOCUMENTED_HISTORICAL',
      primaryEntities: fortHillEntities,
      labelEntity: fortHillLabel,
      showContextualLabel: true,
      relevanceMap: {
        BEAT_2_HARBOUR_STRIKE: 'CONTEXTUAL',
        BEAT_4_PEARY_ATTACK: 'CONTEXTUAL',
        BEAT_6_PEARY_LOST: 'CONTEXTUAL',
        STATE_02_DARWIN: 'CONTEXTUAL',
      },
    });

    // =========================================================================
    // BEAT 7 (DUSK): THE RECKONING — THE HARBOUR'S WAR GRAVES
    // Canon (historical-canon.json, beat 7 note): eight ships sunk on 19 February — USS Peary,
    // MV Neptuna, MV Zealandia, USAT Meigs, USAT Mauna Loa, British Motorist, and the luggers
    // Mavie and Highland Warrior. Kelat sank later (24 Feb). Each wreck is drawn ONLY at its modern
    // surveyed position (vessels.json wreckPositionModernSurvey). Neptuna's wreck was salvaged and
    // her berth is unresolved; the luggers have no recorded position. Neither is given a point.
    // =========================================================================
    const wharfLabel = this.dataSource.entities.add({
      properties: new Cesium.PropertyBag({ ledgerData: CANONICAL_EVIDENCE_RECORDS['stokes-hill-wharf'] }),
      // Over the town behind the present-day wharf (foreground of the dusk camera).
      position: Cesium.Cartesian3.fromDegrees(130.8478, -12.4622, 60),
      label: {
        text: 'THE RECKONING · DUSK, 19 FEBRUARY 1942\nEIGHT SHIPS SUNK IN HARBOUR · 235 TO 250+ DEAD (LOWE COMMISSION: ~243)\nPRESENT-DAY STOKES HILL WHARF · SAME WHARF PRECINCT. SAME SKY.',
        font: primaryEventFont,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        fillColor: boneColor,
        outlineColor: darkBg,
        outlineWidth: 5,
        showBackground: false,
        backgroundColor: bgBadge,
        backgroundPadding: bgPadding,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        pixelOffset: new Cesium.Cartesian2(0, -16),
      },
      show: false,
    });
    // Phones: the full three-line text wraps to ~9 lines and buries the wreck field.
    if (isMobile) this.compactForPhone(wharfLabel, 'DUSK · 19 FEB 1942\n8 SHIPS SUNK IN HARBOUR\n235 TO 250+ DEAD');

    this.evidenceNodes.push({
      id: 'NODE_RECKONING_SYNTHESIS',
      type: 'DOCUMENTED_HISTORICAL',
      primaryEntities: [],
      labelEntity: wharfLabel,
      relevanceMap: {
        BEAT_7_RECKONING: 'PRIMARY',
      },
    });

    const wreckEntities: CesiumType.Entity[] = [];

    const sunkFeb19SurveyedWrecks = [
      { name: 'USS PEARY', id: 'USS_PEARY_DD226' },
      { name: 'ZEALANDIA', id: 'MV_ZEALANDIA' },
      { name: 'MEIGS', id: 'USAT_MEIGS' },
      { name: 'MAUNA LOA', id: 'USAT_MAUNA_LOA' },
      { name: 'BRITISH MOTORIST', id: 'BRITISH_MOTORIST' },
    ];
    const sunkFeb19Placed = sunkFeb19SurveyedWrecks
      .map((w) => ({ ...w, pos: canonWreck(w.id) }))
      .filter((w): w is typeof w & { pos: LonLat & { depthM: number | null } } => w.pos !== null)
      .map((w) => ({ ...w, lon: w.pos.lon, lat: w.pos.lat, depth: w.pos.depthM }));

    for (const w of sunkFeb19Placed) {
      const wreckTex = SpatialRepresentativeAssets.getWreckSymbolTexture(w.depth ?? undefined);
      if (wreckTex) {
        const symbol = this.dataSource.entities.add({
          position: Cesium.Cartesian3.fromDegrees(w.lon, w.lat, 5),
          billboard: {
            image: wreckTex,
            width: 30,
            height: 30,
            scaleByDistance: new Cesium.NearFarScalar(1e3, 1.1, 5e4, 0.7),
          },
          show: false,
        });
        wreckEntities.push(symbol);
      }

      const label = this.dataSource.entities.add({
        position: Cesium.Cartesian3.fromDegrees(w.lon, w.lat, 25),
        label: {
          text: w.depth != null ? `${w.name} · ${w.depth} M` : w.name,
          font: geoEntityFont,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          fillColor: boneColor,
          outlineColor: darkBg,
          outlineWidth: 5,
          showBackground: false,
          backgroundColor: bgBadge,
          backgroundPadding: bgPadding,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new Cesium.Cartesian2(0, -12),
          scaleByDistance: new Cesium.NearFarScalar(2e3, 1.0, 4e4, 0.7),
        },
        show: false,
      });
      wreckEntities.push(label);
    }

    // Kelat: damaged 19 Feb, sank 24 Feb — shown in grey, outside the count of eight.
    const kelatPos = canonWreck('COAL_HULK_KELAT');
    if (kelatPos) {
      const kelatWreckTex = SpatialRepresentativeAssets.getWreckSymbolTexture(kelatPos.depthM ?? undefined);
      if (kelatWreckTex) {
        const kelatSymbol = this.dataSource.entities.add({
          position: Cesium.Cartesian3.fromDegrees(kelatPos.lon, kelatPos.lat, 5),
          billboard: {
            image: kelatWreckTex,
            width: 24,
            height: 24,
            color: Cesium.Color.fromCssColorString('#8E959E'),
            scaleByDistance: new Cesium.NearFarScalar(1e3, 0.95, 5e4, 0.6),
          },
          show: false,
        });
        wreckEntities.push(kelatSymbol);
      }
      const kelatLabel = this.dataSource.entities.add({
        properties: new Cesium.PropertyBag({
          classification: 'CONTEXTUAL_SUBSEQUENT_LOSS',
          lossDate: '1942-02-24',
          damageDate: '1942-02-19',
          ledgerData: CANONICAL_EVIDENCE_RECORDS['kelat-wreck'],
        }),
        position: Cesium.Cartesian3.fromDegrees(kelatPos.lon, kelatPos.lat, 25),
        label: {
          text: 'KELAT · 15M\nDAMAGED 19 FEB · SANK 24 FEB',
          font: geoEntityFont,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          fillColor: Cesium.Color.fromCssColorString('#A2A8B0'),
          outlineColor: darkBg,
          outlineWidth: 5,
          showBackground: false,
          backgroundColor: bgBadge,
          backgroundPadding: bgPadding,
          // Below-left of the symbol: British Motorist's label sits to its right and Zealandia's
          // marker above-left; the space under Zealandia is clear at the dusk camera.
          horizontalOrigin: Cesium.HorizontalOrigin.RIGHT,
          verticalOrigin: Cesium.VerticalOrigin.TOP,
          pixelOffset: new Cesium.Cartesian2(-4, 12),
          scaleByDistance: new Cesium.NearFarScalar(2e3, 0.9, 4e4, 0.6),
        },
        show: false,
      });
      wreckEntities.push(kelatLabel);
    }

    // MV Neptuna: exploded at her berth (~10:25); wreck salvaged 1959–61; berth position unresolved.
    // Anchored to the present-day wharf precinct, offset to the side, without claiming a coordinate.
    const neptunaMarker = this.dataSource.entities.add({
      properties: new Cesium.PropertyBag({ ledgerData: CANONICAL_EVIDENCE_RECORDS['stokes-hill-wharf'] }),
      position: Cesium.Cartesian3.fromDegrees(shw.lon, shw.lat, 10),
      label: {
        text: 'MV NEPTUNA · EXPLODED ALONGSIDE WHARF · ~10:25\nWRECK SALVAGED 1959–61',
        font: geoEntityFont,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        fillColor: goldColor,
        outlineColor: darkBg,
        outlineWidth: 5,
        showBackground: false,
        backgroundColor: bgBadge,
        backgroundPadding: bgPadding,
        horizontalOrigin: Cesium.HorizontalOrigin.LEFT,
        verticalOrigin: Cesium.VerticalOrigin.CENTER,
        pixelOffset: new Cesium.Cartesian2(14, 0),
      },
      show: false,
    });
    wreckEntities.push(neptunaMarker);

    // Group header for the wreck field, carrying the two luggers that have no recorded position.
    const wrecksHeader = this.dataSource.entities.add({
      // Beyond the wreck field (south-west, top of the dusk frame), clear of the wreck markers.
      position: Cesium.Cartesian3.fromDegrees(130.8300, -12.4960, 40),
      label: {
        text: 'SURVEYED WRECK POSITIONS\nLUGGERS MAVIE & HIGHLAND WARRIOR: POSITIONS NOT RECORDED',
        font: geoEntityFont,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        fillColor: contextGrey,
        outlineColor: darkBg,
        outlineWidth: 5,
        showBackground: false,
        backgroundColor: bgBadge,
        backgroundPadding: bgPadding,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        pixelOffset: new Cesium.Cartesian2(0, -8),
      },
      show: false,
    });
    if (isMobile) this.compactForPhone(wrecksHeader, 'SURVEYED WRECK POSITIONS');

    this.evidenceNodes.push({
      id: 'NODE_SUNKEN_WRECKS',
      type: 'MODERN_SURVEYED_WRECK',
      primaryEntities: wreckEntities,
      labelEntity: wrecksHeader,
      relevanceMap: {
        BEAT_7_RECKONING: 'PRIMARY',
        STATE_03_WHARF: 'CONTEXTUAL',
      },
    });
  }

  /**
   * Called immediately when camera flight begins:
   * 1. Hides all labels across all nodes immediately (eliminates text flashing / label dragging).
   * 2. Sets phase to FLYING.
   */
  public prepareTransition(targetStateId: SpatialDemonstrationStateId): void {
    this.phase = TransitionPhase.FLYING;
    this.formationController?.prepareTransition(targetStateId);

    if (this.communicationTimer) {
      clearInterval(this.communicationTimer);
      this.communicationTimer = null;
    }
    this.communicationProgress = 0;
    if (this.communicationLineEntity) this.communicationLineEntity.show = false;
    if (this.communicationLabelEntity) this.communicationLabelEntity.show = false;

    // Immediately hide all labels so none drag or pop during travel
    for (const node of this.evidenceNodes) {
      node.labelEntity.show = false;
      // Also hide primary entities of incoming scene until camera settles
      const relevance = node.relevanceMap[targetStateId] || 'HIDDEN';
      if (relevance !== 'CONTEXTUAL') {
        for (const ent of node.primaryEntities) {
          ent.show = false;
        }
      }
    }
    this.viewer.scene.requestRender();
  }

  /**
   * Called when camera arrives and settles at authored composition:
   * 1. Sets phase to SETTLED.
   * 2. Reveals primary entities, primary labels, and contextual entities.
   * 3. Triggers beat-specific arrival events (e.g. 09:37 schematic communication line).
   */
  public completeTransition(stateId: SpatialDemonstrationStateId): void {
    this.activeStateId = stateId;
    this.phase = TransitionPhase.SETTLED;
    this.updateVisibility();
    this.formationController?.completeTransition(stateId);

    // Trigger one-time schematic communication event for Beat 1
    if (stateId === 'BEAT_1_BATHURST_WARNING') {
      this.runBathurstCommunicationEvent();
    }

    this.declutterLabels();
    this.viewer.scene.requestRender();
  }

  /**
   * Cancel in-flight transitions on rapid scroll retargeting
   */
  public cancelTransition(): void {
    this.formationController?.cancelTransition();
    if (this.communicationTimer) {
      clearInterval(this.communicationTimer);
      this.communicationTimer = null;
    }
    this.communicationProgress = 0;
    if (this.communicationLineEntity) this.communicationLineEntity.show = false;
    if (this.communicationLabelEntity) this.communicationLabelEntity.show = false;
    for (const node of this.evidenceNodes) {
      node.labelEntity.show = false;
    }
    this.phase = TransitionPhase.IDLE;
  }

  public setActiveState(stateId: SpatialDemonstrationStateId): void {
    this.prepareTransition(stateId);
    this.completeTransition(stateId);
  }

  private runBathurstCommunicationEvent(): void {
    if (this.communicationTimer) {
      clearInterval(this.communicationTimer);
      this.communicationTimer = null;
    }

    this.communicationProgress = 0;
    if (this.communicationLineEntity) this.communicationLineEntity.show = true;
    if (this.communicationLabelEntity) this.communicationLabelEntity.show = false;

    const startTime = Date.now();
    const duration = 1200; // 1.2s smooth draw across Clarence Strait

    this.communicationTimer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(1.0, elapsed / duration);
      this.communicationProgress = progress;
      this.viewer.scene.requestRender();

      if (progress >= 1.0) {
        clearInterval(this.communicationTimer);
        this.communicationTimer = null;
        if (this.communicationLabelEntity) {
          this.communicationLabelEntity.show = true;
        }
        this.declutterLabels();
        this.viewer.scene.requestRender();
      }
    }, 25);
  }

  /**
   * Beat-Exclusive Evidence Hierarchy when SETTLED:
   * - PRIMARY active subject: 100% full opacity, full archival label shown.
   * - CONTEXTUAL related nodes: subtle opacity, point/ring only (no label clash).
   * - UNRELATED nodes: 0% opacity (completely hidden).
   */
  private updateVisibility(): void {

    // Strictly suppress the Beat 1 warning transmission line on all other beats
    if (this.activeStateId !== 'BEAT_1_BATHURST_WARNING') {
      if (this.communicationLineEntity) this.communicationLineEntity.show = false;
      if (this.communicationLabelEntity) this.communicationLabelEntity.show = false;
    }

    for (const node of this.evidenceNodes) {
      const relevance = node.relevanceMap[this.activeStateId] || 'HIDDEN';

      this.labelPriority.set(
        node.labelEntity,
        relevance === 'PRIMARY' ? LABEL_PRIORITY.PRIMARY : relevance === 'CONTEXTUAL' ? LABEL_PRIORITY.CONTEXT : LABEL_PRIORITY.DETAIL
      );
      if (relevance === 'PRIMARY') {
        for (const ent of node.primaryEntities) {
          // Keep communication entities controlled by communication event
          if (ent === this.communicationLineEntity || ent === this.communicationLabelEntity) {
            continue;
          }
          ent.show = true;
        }
        node.labelEntity.show = true;
      } else if (relevance === 'CONTEXTUAL') {
        for (const ent of node.primaryEntities) {
          if (ent === this.communicationLineEntity || ent === this.communicationLabelEntity) {
            continue;
          }
          ent.show = true;
        }
        // Allow select geographic anchor labels (e.g. STOKES HILL WHARF, FORT HILL) to stay visible in context
        node.labelEntity.show = !!node.showContextualLabel;
      } else {
        for (const ent of node.primaryEntities) {
          ent.show = false;
        }
        node.labelEntity.show = false;
      }
    }
  }

  /**
   * On narrow viewports, re-wrap long label lines (map labels are canvas text: no CSS wrapping).
   * Breaks at " · " first, then at spaces, keeping each line within ~26 monospace characters.
   */
  /**
   * Phones: a shorter label so the map band (above the reading card) is not filled with text.
   * The full wording stays on desktop and in the Evidence Ledger record for the entity.
   */
  private compactForPhone(e: CesiumType.Entity, text: string, offsetY?: number): void {
    if (!e.label) return;
    e.label.text = new this.Cesium.ConstantProperty(text);
    if (offsetY !== undefined) e.label.pixelOffset = new this.Cesium.ConstantProperty(new this.Cesium.Cartesian2(0, offsetY));
  }

  private wrapLabelsForViewport(): void {
    if (!this.dataSource || typeof window === 'undefined' || window.innerWidth >= 768) return;
    const C = this.Cesium;
    const max = 26;
    const wrapLine = (line: string): string[] => {
      if (line.length <= max) return [line];
      const parts = line.split(' · ');
      const out: string[] = [];
      let cur = '';
      for (const part of parts) {
        const candidate = cur ? `${cur} · ${part}` : part;
        if (candidate.length <= max) { cur = candidate; continue; }
        if (cur) out.push(cur);
        if (part.length <= max) { cur = part; continue; }
        let acc = '';
        for (const w of part.split(' ')) {
          const c2 = acc ? `${acc} ${w}` : w;
          if (c2.length > max && acc) { out.push(acc); acc = w; } else { acc = c2; }
        }
        cur = acc;
      }
      if (cur) out.push(cur);
      return out;
    };
    const now = this.viewer.clock.currentTime;
    for (const e of this.dataSource.entities.values) {
      const text: string | undefined = e.label?.text?.getValue(now);
      if (!text) continue;
      const wrapped = text.split('\n').flatMap(wrapLine).join('\n');
      if (wrapped !== text) e.label!.text = new C.ConstantProperty(wrapped);
    }
  }

  /**
   * Screen-space label declutter.
   * Cesium has no built-in label collision handling. After the camera settles (and on resize) we
   * project every visible label, estimate its box from its text and font, and hide lower-priority
   * labels that would overlap a higher-priority one (PRIMARY event > CONTEXT geography > DETAIL).
   * Only the label is hidden; the marker it belongs to stays visible.
   */
  public declutterLabels(): void {
    if (!this.dataSource || this.phase !== TransitionPhase.SETTLED) return;
    const C = this.Cesium;
    const scene = this.viewer.scene;
    const now = this.viewer.clock.currentTime;
    const canvas = scene.canvas;
    const cw = canvas.clientWidth;
    const ch = canvas.clientHeight;
    const transform = (C.SceneTransforms as any).worldToWindowCoordinates ?? (C.SceneTransforms as any).wgs84ToWindowCoordinates;

    type Box = { e: CesiumType.Entity; kind: 'label' | 'icon'; p: number; x0: number; y0: number; x1: number; y1: number };
    const boxes: Box[] = [];
    for (const e of this.dataSource.entities.values) {
      if (!e.isShowing || (!e.label && !e.billboard)) continue;
      const pos = e.position?.getValue(now);
      if (!pos) continue;
      const win = transform(scene, pos);
      if (!win) continue;
      if (e.billboard) e.billboard.show = new C.ConstantProperty(true);
      if (e.label) e.label.show = new C.ConstantProperty(true);

      if (e.billboard && !e.label) {
        // Icons (ships, aircraft) are DETAIL; they yield to labels they would cover.
        const bw = (e.billboard.width?.getValue(now) ?? 24) * 0.6;
        const bh = (e.billboard.height?.getValue(now) ?? 24) * 0.6;
        boxes.push({ e, kind: 'icon', p: LABEL_PRIORITY.DETAIL + 1, x0: win.x - bw / 2, y0: win.y - bh / 2, x1: win.x + bw / 2, y1: win.y + bh / 2 });
        continue;
      }
      if (!e.label) continue;
      const text: string = e.label.text?.getValue(now) ?? '';
      const font: string = e.label.font?.getValue(now) ?? '12px monospace';
      const px = parseFloat((font.match(/(\d+(?:\.\d+)?)px/) || [])[1] || '12');
      const lines = text.split('\n');
      const w = Math.max(...lines.map((l) => l.length)) * px * 0.62 + 6;
      const h = lines.length * px * 1.3 + 4;
      const off = e.label.pixelOffset?.getValue(now) ?? new C.Cartesian2(0, 0);
      const hOrigin = e.label.horizontalOrigin?.getValue(now) ?? C.HorizontalOrigin.CENTER;
      const vOrigin = e.label.verticalOrigin?.getValue(now) ?? C.VerticalOrigin.CENTER;
      const ax = win.x + off.x;
      const ay = win.y + off.y;
      const x0 = hOrigin === C.HorizontalOrigin.LEFT ? ax : hOrigin === C.HorizontalOrigin.RIGHT ? ax - w : ax - w / 2;
      const y0 = vOrigin === C.VerticalOrigin.BOTTOM ? ay - h : vOrigin === C.VerticalOrigin.TOP ? ay : ay - h / 2;
      boxes.push({ e, kind: 'label', p: this.labelPriority.get(e) ?? LABEL_PRIORITY.DETAIL, x0, y0, x1: x0 + w, y1: y0 + h });
    }

    // Reading zones occupied by the narrative HTML: labels there cannot be read.
    // Desktop: the timeline/text column on the left. Mobile portrait: the reading card below ~48%.
    const isPortraitMobile = cw < 768 && ch >= cw;
    const inReadingZone = (b: Box) =>
      isPortraitMobile ? b.y0 > ch * 0.48 : cw >= 1100 ? b.x1 < cw * 0.43 : false;

    const hide = (b: Box) => {
      if (b.kind === 'icon') b.e.billboard!.show = new C.ConstantProperty(false);
      else b.e.label!.show = new C.ConstantProperty(false);
    };

    boxes.sort((a, b) => a.p - b.p);
    const kept: Box[] = [];
    const pad = 4;
    for (const b of boxes) {
      const isPrimary = b.kind === 'label' && b.p === LABEL_PRIORITY.PRIMARY;
      const offscreen = b.x1 < 0 || b.y1 < 0 || b.x0 > cw || b.y0 > ch;
      const clipped = !offscreen && (b.x0 < 0 || b.x1 > cw || b.y0 < 0 || b.y1 > ch);
      // Icons only yield to PRIMARY/CONTEXT labels (never to their own DETAIL name label).
      const blockers = b.kind === 'icon' ? kept.filter((k) => k.kind === 'label' && k.p <= LABEL_PRIORITY.CONTEXT) : kept;
      const collides = blockers.some((k) => b.x0 < k.x1 + pad && b.x1 > k.x0 - pad && b.y0 < k.y1 + pad && b.y1 > k.y0 - pad);
      if (!isPrimary && b.kind === 'label' && (clipped || inReadingZone(b))) {
        hide(b);
      } else if (!isPrimary && collides) {
        hide(b);
      } else if (!offscreen) {
        kept.push(b);
      }
    }
  }

  public getFormationController(): SpatialFormationController | null {
    return this.formationController;
  }

  public destroy(): void {
    this.formationController?.destroy();
    this.formationController = null;
    if (this.communicationTimer) {
      clearInterval(this.communicationTimer);
      this.communicationTimer = null;
    }
    if (this.dataSource && this.viewer && !this.viewer.isDestroyed()) {
      this.viewer.dataSources.remove(this.dataSource, true);
      this.dataSource = null;
    }
    this.evidenceNodes = [];
  }
}

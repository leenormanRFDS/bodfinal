/**
 * THE BOMBING OF DARWIN — HISTORICAL SPATIAL ENGINE
 * Spatial Representative Formation Controller
 * 
 * Governed by TRUTH, EXPERIENCE, DESIGN & TECHNOLOGY authorities.
 * 
 * First Principles:
 * 1. Historical Scale Perceptible: Visualizes the scale of the 188-aircraft First Wave
 *    and 54-aircraft Second Wave without inventing false GPS telemetry.
 * 2. Visual Restraint: Archival, physical, restrained silhouettes (Zero, Val, Kate, Betty, Nell).
 * 3. Discrete Densities: Evaluates 12, 24, and 36 aircraft configurations for Beat 0;
 *    12 and 18 configurations for Beat 5.
 * 4. Motion-to-Stillness: Brief authored advance (2.2s cubic deceleration) establishing
 *    altitude and direction, then settling into absolute zero-render stillness.
 * 5. Mobile Framing: Maintains vertical clearance above bottom cards.
 */

import type * as CesiumType from 'cesium';
import type { SpatialDemonstrationStateId } from './spatial-types';
import { SpatialRepresentativeAssets } from './spatial-representative-assets';

export type FormationDensityBeat0 = 'LOW' | 'MEDIUM' | 'HIGH';
export type FormationDensityBeat5 = 'LOW' | 'HIGH';

export interface FormationAircraftDef {
  id: string;
  type: 'ZERO' | 'VAL' | 'KATE' | 'BETTY' | 'NELL';
  targetLon: number;
  targetLat: number;
  altitudeM: number;
  headingDeg: number;
  layer: 'LOW_COVER' | 'MID_STRIKE' | 'HIGH_COVER' | 'LEAD_ECHELON' | 'TRAIL_ECHELON';
}

export class SpatialFormationController {
  private Cesium: typeof CesiumType;
  private viewer: CesiumType.Viewer;
  private dataSource: CesiumType.CustomDataSource;

  // Active density configurations
  private beat0Density: FormationDensityBeat0 = 'HIGH'; // 36 aircraft default
  private beat5Density: FormationDensityBeat5 = 'HIGH'; // 18 bombers default

  // Entities managed by this controller
  private beat0Entities: CesiumType.Entity[] = [];
  private beat1Entities: CesiumType.Entity[] = [];
  private beat2Entities: CesiumType.Entity[] = [];
  private beat5Entities: CesiumType.Entity[] = [];

  // Motion-to-stillness animation state
  private motionTimer: any = null;
  private isMotionActive: boolean = false;
  private activeBeat: SpatialDemonstrationStateId | null = null;
  private isReducedMotion: boolean = false;

  constructor(
    Cesium: typeof CesiumType,
    viewer: CesiumType.Viewer,
    dataSource: CesiumType.CustomDataSource
  ) {
    this.Cesium = Cesium;
    this.viewer = viewer;
    this.dataSource = dataSource;

    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      this.isReducedMotion = mediaQuery.matches;
      mediaQuery.addEventListener('change', (e) => {
        this.isReducedMotion = e.matches;
      });
    }
  }

  public initialize(): void {
    this.buildBeat0Formations();
    this.buildBeat1Formations();
    this.buildBeat2Formations();
    this.buildBeat5Formations();
    this.hideAll();
  }

  /**
   * Builds Beat 0 First Wave Strike Formation (Timor Sea assembly).
   * Documented total: 188 aircraft (81 level bombers, 71 dive bombers, 36 fighters).
   * Tactical altitudes:
   * - Level bombers (B5N2 Kate): 3,200m – 3,400m
   * - Dive bombers (D3A1 Val): 3,800m – 4,100m
   * - Fighter escort (A6M2 Zero): 4,500m – 4,800m
   * Heading: 140° (southeast toward Bathurst Island).
   */
  private buildBeat0Formations(): void {
    // 08:00–08:45: assembled over the launch area and departing on ~140° (routes.json
    // ROUTE_FIRST_WAVE_TIMOR_TO_BATHURST, bearing 130–150°). Centre ~25 km down-track of the
    // reconstructed launch centroid (-10.5, 129.0); representative, not a recorded position.
    // Seen from ~470 km, a true-scale formation (~25 km across) is a smudge. Here it is drawn as
    // a sparse symbol: fewer aircraft, spread wider, smaller icons. Explicitly representative.
    this.beat0Entities = this.buildFirstWaveFormation('beat0', 129.17, -10.67, 140, '08:00', { spread: 2.2, size: 0.55, density: 'LOW' });
  }

  /**
   * Beat 1 (09:35–09:37): the formation directly over Sacred Heart Mission, Nguiu, heading ~140°
   * (routes.json ROUTE_FIRST_WAVE_BATHURST_OVERFLIGHT: point_with_bearing, HIGH confidence).
   */
  private buildBeat1Formations(): void {
    this.beat1Entities = this.buildFirstWaveFormation('beat1', 130.627, -11.758, 140, '09:35', { spread: 1.6, size: 0.7, density: 'MEDIUM' });
  }

  private buildFirstWaveFormation(
    prefix: string,
    centerLon: number,
    centerLat: number,
    heading: number,
    time: string,
    look: { spread: number; size: number; density?: 'LOW' | 'MEDIUM' | 'HIGH' }
  ): CesiumType.Entity[] {
    const Cesium = this.Cesium;
    const out: CesiumType.Entity[] = [];

    const kateTexture = SpatialRepresentativeAssets.getKateTexture();
    const valTexture = SpatialRepresentativeAssets.getValTexture();
    const zeroTexture = SpatialRepresentativeAssets.getZeroTexture();

    const defs = this.generateBeat0Definitions(centerLon, centerLat, heading, look.spread, look.density);

    for (const d of defs) {
      const image = d.type === 'ZERO' ? zeroTexture : d.type === 'VAL' ? valTexture : kateTexture;
      const size = Math.round((d.type === 'ZERO' ? 30 : d.type === 'VAL' ? 32 : 35) * look.size);

      const entity = this.dataSource.entities.add({
        name: `${prefix}-${d.type}-${d.id}`,
        properties: new Cesium.PropertyBag({
          aircraftDef: d,
          ledgerData: {
            id: 'representative-aircraft-formation-wave1',
            title: `First Wave Strike Formation (${d.type === 'ZERO' ? 'A6M2 Zero Fighter' : d.type === 'VAL' ? 'D3A1 Val Dive Bomber' : 'B5N2 Kate Level Bomber'})`,
            classification: 'REPRESENTATIVE_FORMATION',
            confidence: 'HISTORICAL_ESTIMATION',
            time,
            badge: 'REPRESENTATIVE FORMATION',
            known: 'The First Wave comprised 188 naval aircraft launched from 4 fleet carriers in the Timor Sea: 81 B5N2 level bombers, 71 D3A1 dive bombers, and 36 A6M2 fighters.',
            uncertain: 'Individual aircraft flight paths and exact spacing within chutai flights are representative tactical reconstructions, not observed radar tracks.',
            notes: 'Aircraft stepped in 3 distinct altitude bands (3,200m to 4,800m) following standard IJN naval strike doctrine.',
            sources: [
              { title: 'Senshi Sōsho Vol. 26', institution: 'Japanese Official History' },
              { title: 'Australian War Memorial (AWM 54)', institution: 'Official Records' }
            ]
          }
        }),
        position: Cesium.Cartesian3.fromDegrees(d.targetLon, d.targetLat, d.altitudeM),
        billboard: {
          image: image || undefined,
          width: size,
          height: size,
          // Muted bone tint: representative formation, not a bright game sprite.
          color: Cesium.Color.fromCssColorString('rgba(206, 199, 186, 0.72)'),
          alignedAxis: Cesium.Cartesian3.UNIT_Z,
          rotation: -Cesium.Math.toRadians(heading),
          scaleByDistance: new Cesium.NearFarScalar(5e4, 1.25, 3e6, 0.7),
        },
        show: false,
      });

      out.push(entity);
    }
    return out;
  }

  /**
   * Generates tactical definition coordinates for Beat 0 according to active density.
   */
  private generateBeat0Definitions(
    centerLon: number,
    centerLat: number,
    headingDeg: number,
    spread = 1,
    densityOverride?: 'LOW' | 'MEDIUM' | 'HIGH'
  ): FormationAircraftDef[] {
    const list: FormationAircraftDef[] = [];
    const density = densityOverride ?? this.beat0Density;
    const rad = (headingDeg * Math.PI) / 180;
    const fwdX = Math.sin(rad);
    const fwdY = Math.cos(rad);
    const rgtX = Math.cos(rad);
    const rgtY = -Math.sin(rad);

    // Degree scale: ~1 deg lat = 111km; at lat -10.7, 1 deg lon = ~109km. `spread` widens the
    // layout for distant symbolic views.
    const kmToLon = spread / 109;
    const kmToLat = spread / 111;

    const addAircraft = (
      type: 'ZERO' | 'VAL' | 'KATE',
      fwdKm: number,
      rgtKm: number,
      altitudeM: number,
      layer: 'LOW_COVER' | 'MID_STRIKE' | 'HIGH_COVER'
    ) => {
      const dLon = (fwdKm * fwdX + rgtKm * rgtX) * kmToLon;
      const dLat = (fwdKm * fwdY + rgtKm * rgtY) * kmToLat;
      list.push({
        id: `ac-${list.length}`,
        type,
        targetLon: centerLon + dLon,
        targetLat: centerLat + dLat,
        altitudeM,
        headingDeg,
        layer,
      });
    };

    // 1. Level Bombers (Nakajima B5N2 Kate) - Leading strike element at 3,200m–3,400m
    // Chutai 1 (V of 3)
    addAircraft('KATE', 0, 0, 3250, 'LOW_COVER');
    addAircraft('KATE', -1.4, -1.8, 3280, 'LOW_COVER');
    addAircraft('KATE', -1.4, 1.8, 3280, 'LOW_COVER');
    // Chutai 2 (V of 3 stepped right)
    addAircraft('KATE', -3.2, 3.8, 3320, 'LOW_COVER');
    if (density !== 'LOW') {
      addAircraft('KATE', -4.6, 2.0, 3350, 'LOW_COVER');
      addAircraft('KATE', -4.6, 5.6, 3350, 'LOW_COVER');
      // Chutai 3 (V of 3 stepped left)
      addAircraft('KATE', -3.2, -3.8, 3320, 'LOW_COVER');
      addAircraft('KATE', -4.6, -5.6, 3350, 'LOW_COVER');
      addAircraft('KATE', -4.6, -2.0, 3350, 'LOW_COVER');
    }
    if (density === 'HIGH') {
      // 5 additional level bombers in trail chutai
      addAircraft('KATE', -6.5, -1.8, 3380, 'LOW_COVER');
      addAircraft('KATE', -6.5, 1.8, 3380, 'LOW_COVER');
      addAircraft('KATE', -8.0, 0, 3400, 'LOW_COVER');
      addAircraft('KATE', -8.0, -3.8, 3400, 'LOW_COVER');
      addAircraft('KATE', -8.0, 3.8, 3400, 'LOW_COVER');
    }

    // 2. Dive Bombers (Aichi D3A1 Val) - Stepped above & behind at 3,800m–4,100m
    addAircraft('VAL', -2.5, -8.0, 3850, 'MID_STRIKE');
    addAircraft('VAL', -3.9, -9.8, 3880, 'MID_STRIKE');
    addAircraft('VAL', -3.9, -6.2, 3880, 'MID_STRIKE');
    addAircraft('VAL', -5.5, -8.0, 3920, 'MID_STRIKE');
    if (density !== 'LOW') {
      addAircraft('VAL', -2.5, 8.0, 3850, 'MID_STRIKE');
      addAircraft('VAL', -3.9, 6.2, 3880, 'MID_STRIKE');
      addAircraft('VAL', -3.9, 9.8, 3880, 'MID_STRIKE');
      addAircraft('VAL', -5.5, 8.0, 3920, 'MID_STRIKE');
      addAircraft('VAL', -7.0, -8.0, 3960, 'MID_STRIKE');
    }
    if (density === 'HIGH') {
      addAircraft('VAL', -7.0, 8.0, 3960, 'MID_STRIKE');
      addAircraft('VAL', -8.5, -9.8, 4000, 'MID_STRIKE');
      addAircraft('VAL', -8.5, -6.2, 4000, 'MID_STRIKE');
      addAircraft('VAL', -8.5, 6.2, 4000, 'MID_STRIKE');
      addAircraft('VAL', -8.5, 9.8, 4000, 'MID_STRIKE');
    }

    // 3. Fighter Escort (Mitsubishi A6M2 Zero) - High cover at 4,500m–4,800m
    addAircraft('ZERO', 3.0, -3.5, 4550, 'HIGH_COVER');
    addAircraft('ZERO', 3.0, 3.5, 4550, 'HIGH_COVER');
    addAircraft('ZERO', 1.5, -5.5, 4600, 'HIGH_COVER');
    addAircraft('ZERO', 1.5, 5.5, 4600, 'HIGH_COVER');
    if (density !== 'LOW') {
      addAircraft('ZERO', -1.0, -11.0, 4650, 'HIGH_COVER');
      addAircraft('ZERO', -1.0, 11.0, 4650, 'HIGH_COVER');
      addAircraft('ZERO', -3.0, -12.5, 4700, 'HIGH_COVER');
      addAircraft('ZERO', -3.0, 12.5, 4700, 'HIGH_COVER');
    }

    return list;
  }

  /**
   * Builds Beat 2 (09:58) — the first wave over the harbour.
   * Canon (routes.json ROUTE_FIRST_WAVE_ATTACK_RUN): attack axis 315°–345°, i.e. aircraft came in
   * FROM the south-east heading north-west, out of the morning sun. Nominal heading here: 330°.
   * Dive bombers (D3A1 Val) are shown in the dive band over the anchorage (release 1,500–2,000 ft,
   * recovery low over the water — formations.json); fighters low over the harbour (strafing);
   * level bombers (B5N2 Kate) at their 3,000–3,600 m bombing altitude over the town approach.
   * At the authored 09:58 camera the level bombers are above the frame on desktop; they are kept
   * so the formation stays truthful on layouts with a higher camera (mobile).
   * Representative positions within the documented envelope, not observed tracks.
   */
  private buildBeat2Formations(): void {
    const Cesium = this.Cesium;
    // Centre over the anchorage, just south-east of Stokes Hill Wharf.
    const centerLon = 130.846;
    const centerLat = -12.4775;
    const heading = 330;

    const kateTexture = SpatialRepresentativeAssets.getKateTexture();
    const valTexture = SpatialRepresentativeAssets.getValTexture();
    const zeroTexture = SpatialRepresentativeAssets.getZeroTexture();

    const defs = this.generateBeat2Definitions(centerLon, centerLat, heading);

    for (const d of defs) {
      const image = d.type === 'ZERO' ? zeroTexture : d.type === 'VAL' ? valTexture : kateTexture;
      const size = d.type === 'ZERO' ? 34 : d.type === 'VAL' ? 36 : 38;

      const entity = this.dataSource.entities.add({
        name: `beat2-${d.type}-${d.id}`,
        properties: new Cesium.PropertyBag({
          aircraftDef: d,
          ledgerData: {
            id: 'representative-aircraft-formation-wave1-harbour',
            title: `First Wave over the Harbour (${d.type === 'ZERO' ? 'A6M2 Zero' : d.type === 'VAL' ? 'D3A1 Val Dive Bomber' : 'B5N2 Kate Level Bomber'})`,
            classification: 'REPRESENTATIVE_FORMATION',
            confidence: 'HISTORICAL_ESTIMATION',
            time: '09:58',
            badge: 'REPRESENTATIVE FORMATION',
            known: 'The first wave attacked along a 315°–345° axis, out of the south-east: level bombers on the wharf and town, dive bombers on the shipping, fighters strafing.',
            uncertain: 'Individual aircraft positions are representative, placed within the documented altitude bands and attack axis; they are not observed tracks.',
            notes: 'Dive bombers released at about 1,500–2,000 ft and recovered low over the harbour. Level bombers bombed from about 3,000–3,600 m.',
            sources: [
              { title: 'Senshi Sōsho Vol. 26', institution: 'Japanese Official History' },
              { title: 'Lowe Commission (1942)', institution: 'Official Inquiry' }
            ]
          }
        }),
        position: Cesium.Cartesian3.fromDegrees(d.targetLon, d.targetLat, d.altitudeM),
        ...(d.type === 'ZERO'
          ? {
              // A6M2 Zero: 3D model (owner-supplied geometry; texture and markings removed because
              // they did not match February 1942 carrier aircraft; span corrected to 12.0 m; real
              // scale in metres). At this camera a 12 m aircraft is ~3 px, so minimumPixelSize keeps
              // it legible — a symbol size, not a scale claim. Vals and Kates stay as silhouettes
              // until type-accurate models exist.
              orientation: Cesium.Transforms.headingPitchRollQuaternion(
                Cesium.Cartesian3.fromDegrees(d.targetLon, d.targetLat, d.altitudeM),
                // Model nose is +X (east at heading 0); compass heading H → Cesium heading H − 90°.
                new Cesium.HeadingPitchRoll(Cesium.Math.toRadians(heading - 90), Cesium.Math.toRadians(-4), Cesium.Math.toRadians(d.id.endsWith('1') ? 14 : -10))
              ),
              model: {
                uri: '/models/a6m2-zero.glb',
                minimumPixelSize: 54,
                maximumScale: 600,
                color: Cesium.Color.fromCssColorString('rgb(214, 207, 194)'),
                colorBlendMode: Cesium.ColorBlendMode.MIX,
                colorBlendAmount: 0.55,
                shadows: Cesium.ShadowMode.DISABLED,
              },
            }
          : {
              billboard: {
                image: image || undefined,
                width: size,
                height: size,
                // Muted bone tint: representative formation, not a bright game sprite.
                color: Cesium.Color.fromCssColorString('rgba(206, 199, 186, 0.78)'),
                alignedAxis: Cesium.Cartesian3.UNIT_Z,
                rotation: -Cesium.Math.toRadians(heading),
                scaleByDistance: new Cesium.NearFarScalar(2e3, 1.15, 5e4, 0.6),
              },
            }),
        show: false,
      });

      this.beat2Entities.push(entity);
    }
  }

  private generateBeat2Definitions(
    centerLon: number,
    centerLat: number,
    headingDeg: number
  ): FormationAircraftDef[] {
    const list: FormationAircraftDef[] = [];
    const rad = (headingDeg * Math.PI) / 180;
    const fwdX = Math.sin(rad);
    const fwdY = Math.cos(rad);
    const rgtX = Math.cos(rad);
    const rgtY = -Math.sin(rad);

    const kmToLon = 1 / 108.5;
    const kmToLat = 1 / 111;

    const addPlane = (
      type: 'ZERO' | 'VAL' | 'KATE',
      fwdKm: number,
      rgtKm: number,
      altitudeM: number,
      layer: 'LOW_COVER' | 'MID_STRIKE' | 'HIGH_COVER' | 'LEAD_ECHELON' | 'TRAIL_ECHELON'
    ) => {
      const dLon = (fwdKm * fwdX + rgtKm * rgtX) * kmToLon;
      const dLat = (fwdKm * fwdY + rgtKm * rgtY) * kmToLat;
      list.push({
        id: `harbour-${list.length}`,
        type,
        targetLon: centerLon + dLon,
        targetLat: centerLat + dLat,
        altitudeM,
        headingDeg,
        layer,
      });
    };

    // Dive bombers (D3A1 Val) in the dive band over the anchorage, peeling off in pairs.
    // fwd = towards 330° (north-west); positions spread across the roadstead.
    addPlane('VAL', 0.6, -0.4, 700, 'LEAD_ECHELON');
    addPlane('VAL', 0.2, 0.5, 950, 'LEAD_ECHELON');
    addPlane('VAL', -0.5, -0.9, 1200, 'LEAD_ECHELON');
    addPlane('VAL', -0.9, 0.9, 1400, 'LEAD_ECHELON');
    addPlane('VAL', -1.6, -0.2, 1650, 'LEAD_ECHELON');
    addPlane('VAL', -2.2, 1.4, 1850, 'LEAD_ECHELON');
    addPlane('VAL', -2.6, -1.3, 2100, 'LEAD_ECHELON');

    // Fighters (A6M2 Zero) low over the harbour, strafing.
    addPlane('ZERO', 1.4, 1.6, 300, 'LOW_COVER');
    addPlane('ZERO', 1.1, 2.0, 340, 'LOW_COVER');
    addPlane('ZERO', -0.4, -2.1, 450, 'LOW_COVER');

    // Level bombers (B5N2 Kate) at bombing altitude over the town approach.
    addPlane('KATE', 1.8, 0.0, 3300, 'MID_STRIKE');
    addPlane('KATE', 1.2, -0.7, 3300, 'MID_STRIKE');
    addPlane('KATE', 1.2, 0.7, 3300, 'MID_STRIKE');
    addPlane('KATE', 0.6, -1.4, 3350, 'MID_STRIKE');
    addPlane('KATE', 0.6, 1.4, 3350, 'MID_STRIKE');

    return list;
  }

  /**
   * Builds Beat 5 Second Wave High-Altitude Bomber Formation.
   * Documented total: 54 land-based naval bombers (27 G4M1 Bettys, 27 G3M2 Nells).
   * Tactical altitude: 6,500m (approx 21,300 ft, within 18,000–23,000 ft historical ceiling).
   * Heading: 135° (approaching from Beagle Gulf over Fannie Bay toward Parap airfield).
   */
  private buildBeat5Formations(): void {
    const Cesium = this.Cesium;
    // Canon (routes.json ROUTE_SECOND_WAVE_HIGH_ALTITUDE_RUN): approach bearing 135° from the
    // north-west across Beagle Gulf, 5,500–7,500 m, target RAAF Station Darwin (-12.414, 130.875).
    // Lead aircraft over the target at 12:00, the formation trailing back along the approach line
    // (representative positions).
    const centerLon = 130.871;
    const centerLat = -12.410;
    const heading = 135;

    const bettyTexture = SpatialRepresentativeAssets.getBettyTexture();
    const nellTexture = SpatialRepresentativeAssets.getNellTexture();

    const defs = this.generateBeat5Definitions(centerLon, centerLat, heading);

    for (const d of defs) {
      const image = d.type === 'BETTY' ? bettyTexture : nellTexture;

      const entity = this.dataSource.entities.add({
        name: `beat5-${d.type}-${d.id}`,
        properties: new Cesium.PropertyBag({
          aircraftDef: d,
          ledgerData: {
            id: 'representative-bomber-formation-wave2',
            title: `Second Wave High-Altitude Bomber (${d.type === 'BETTY' ? 'Mitsubishi G4M1 Betty' : 'Mitsubishi G3M2 Nell'})`,
            classification: 'REPRESENTATIVE_FORMATION',
            confidence: 'HISTORICAL_ESTIMATION',
            time: '12:00',
            badge: 'REPRESENTATIVE FORMATION',
            known: '54 twin-engine land-based naval bombers attacked in two major elements: 27 G4M1 Bettys (1st Kokutai from Kendari) and 27 G3M2 Nells (Takao Kokutai from Ambon).',
            uncertain: 'Exact spacing within the stepped V-echelon formations is reconstructed from standard IJN land-attack doctrine.',
            notes: 'Bombers maintained rigid, undisturbed level flight at 18,000 to 23,000 ft (~6,500m) with zero Allied fighter interception.',
            sources: [
              { title: 'Senshi Sōsho Vol. 26', institution: 'Japanese Official History' },
              { title: 'Lowe Commission Report', institution: 'Official Inquiry (1942)' }
            ]
          }
        }),
        position: Cesium.Cartesian3.fromDegrees(d.targetLon, d.targetLat, d.altitudeM),
        billboard: {
          image: image || undefined,
          width: 36,
          height: 36,
          color: Cesium.Color.fromCssColorString('rgba(206, 199, 186, 0.72)'),
          alignedAxis: Cesium.Cartesian3.UNIT_Z,
          rotation: -Cesium.Math.toRadians(heading),
          scaleByDistance: new Cesium.NearFarScalar(5e3, 1.1, 2.5e5, 0.65),
        },
        show: false,
      });

      this.beat5Entities.push(entity);
    }
  }

  /**
   * Generates tactical definition coordinates for Beat 5 (stepped V-echelons).
   */
  private generateBeat5Definitions(
    centerLon: number,
    centerLat: number,
    headingDeg: number
  ): FormationAircraftDef[] {
    const list: FormationAircraftDef[] = [];
    const rad = (headingDeg * Math.PI) / 180;
    const fwdX = Math.sin(rad);
    const fwdY = Math.cos(rad);
    const rgtX = Math.cos(rad);
    const rgtY = -Math.sin(rad);

    // Tight stepped V: the second raid bombed in close formation (pattern bombing). Spacing is
    // compressed from the original 1.2–1.4 km steps, which read as scattered aircraft because the
    // formation sits at 6.5 km, much closer to the camera than the ground.
    const TIGHT = 0.4;
    const kmToLon = TIGHT / 108.5;
    const kmToLat = TIGHT / 111;

    const addBomber = (
      type: 'BETTY' | 'NELL',
      fwdKm: number,
      rgtKm: number,
      altitudeM: number,
      layer: 'LEAD_ECHELON' | 'TRAIL_ECHELON'
    ) => {
      const dLon = (fwdKm * fwdX + rgtKm * rgtX) * kmToLon;
      const dLat = (fwdKm * fwdY + rgtKm * rgtY) * kmToLat;
      list.push({
        id: `bomber-${list.length}`,
        type,
        targetLon: centerLon + dLon,
        targetLat: centerLat + dLat,
        altitudeM,
        headingDeg,
        layer,
      });
    };

    // Lead Echelon: G4M1 Bettys (chutai V of 9 at 6,500m)
    addBomber('BETTY', 0, 0, 6500, 'LEAD_ECHELON');
    addBomber('BETTY', -1.2, -1.4, 6500, 'LEAD_ECHELON');
    addBomber('BETTY', -1.2, 1.4, 6500, 'LEAD_ECHELON');
    addBomber('BETTY', -2.4, -2.8, 6500, 'LEAD_ECHELON');
    addBomber('BETTY', -2.4, 2.8, 6500, 'LEAD_ECHELON');
    addBomber('BETTY', -3.6, -4.2, 6500, 'LEAD_ECHELON');
    addBomber('BETTY', -3.6, 4.2, 6500, 'LEAD_ECHELON');
    if (this.beat5Density === 'HIGH') {
      addBomber('BETTY', -4.8, -5.6, 6500, 'LEAD_ECHELON');
      addBomber('BETTY', -4.8, 5.6, 6500, 'LEAD_ECHELON');
    }

    // Trailing Echelon: G3M2 Nells (stepped up +300m at 6,800m, trailing by ~5km)
    const trailOffsetFwd = -5.5;
    const trailOffsetRgt = 3.5;
    addBomber('NELL', trailOffsetFwd, trailOffsetRgt, 6800, 'TRAIL_ECHELON');
    addBomber('NELL', trailOffsetFwd - 1.2, trailOffsetRgt - 1.4, 6800, 'TRAIL_ECHELON');
    addBomber('NELL', trailOffsetFwd - 1.2, trailOffsetRgt + 1.4, 6800, 'TRAIL_ECHELON');
    addBomber('NELL', trailOffsetFwd - 2.4, trailOffsetRgt - 2.8, 6800, 'TRAIL_ECHELON');
    addBomber('NELL', trailOffsetFwd - 2.4, trailOffsetRgt + 2.8, 6800, 'TRAIL_ECHELON');
    if (this.beat5Density === 'HIGH') {
      addBomber('NELL', trailOffsetFwd - 3.6, trailOffsetRgt - 4.2, 6800, 'TRAIL_ECHELON');
      addBomber('NELL', trailOffsetFwd - 3.6, trailOffsetRgt + 4.2, 6800, 'TRAIL_ECHELON');
      addBomber('NELL', trailOffsetFwd - 4.8, trailOffsetRgt - 5.6, 6800, 'TRAIL_ECHELON');
      addBomber('NELL', trailOffsetFwd - 4.8, trailOffsetRgt + 5.6, 6800, 'TRAIL_ECHELON');
    }

    return list;
  }

  /**
   * Called when camera begins transitioning between beats.
   * Immediately stops any motion animation and hides formation entities.
   */
  public prepareTransition(targetStateId: SpatialDemonstrationStateId): void {
    this.cancelMotion();
    this.activeBeat = null;

    // Keep hidden during flight to prevent visual popping
    this.hideAll();
  }

  /**
   * Called when camera arrives and settles at the authored beat.
   * Reveals entities and initiates the motion-to-stillness sequence.
   */
  public completeTransition(stateId: SpatialDemonstrationStateId): void {
    this.cancelMotion();
    this.activeBeat = stateId;

    if (stateId === 'BEAT_0_TIMOR_LAUNCH') {
      // Departing the launch area: a visible advance at this scale (~30 km), then still.
      this.runMotionToStillnessSequence(this.beat0Entities, 140, 2600, 30000);
    } else if (stateId === 'BEAT_1_BATHURST_WARNING') {
      this.runMotionToStillnessSequence(this.beat1Entities, 140, 2400, 12000);
    } else if (stateId === 'BEAT_2_HARBOUR_STRIKE') {
      this.runMotionToStillnessSequence(this.beat2Entities, 330, 2200, 1800);
    } else if (stateId === 'BEAT_5_RAAF_AIRFIELD') {
      this.runMotionToStillnessSequence(this.beat5Entities, 135, 2000, 1800);
    } else {
      this.hideAll();
    }
  }

  /**
   * Cancels in-flight transition / animation
   */
  public cancelTransition(): void {
    this.cancelMotion();
    this.hideAll();
  }

  /**
   * Motion-to-stillness prototype implementation:
   * 1. Positions aircraft slightly offset along their reverse heading vector (-backwardDistanceM).
   * 2. Shows entities.
   * 3. Animate forward over durationMs using cubic deceleration (easeOutCubic).
   * 4. Upon completion: places at exact target coordinates, cancels all timers,
   *    calls requestRender() one final time, and enters absolute zero-render stillness.
   */
  private runMotionToStillnessSequence(
    entities: CesiumType.Entity[],
    headingDeg: number,
    durationMs: number,
    backwardDistanceM: number
  ): void {
    const Cesium = this.Cesium;

    // If reduced motion is requested, immediately show at settled target without animation
    if (this.isReducedMotion) {
      for (const ent of entities) {
        const def = ent.properties?.getValue(this.viewer.clock.currentTime)?.aircraftDef as FormationAircraftDef;
        if (def) {
          ent.position = new Cesium.ConstantPositionProperty(
            Cesium.Cartesian3.fromDegrees(def.targetLon, def.targetLat, def.altitudeM)
          );
          ent.show = true;
        }
      }
      this.viewer.scene.requestRender();
      return;
    }

    const rad = (headingDeg * Math.PI) / 180;
    const fwdX = Math.sin(rad);
    const fwdY = Math.cos(rad);

    const kmToLon = 1 / 109;
    const kmToLat = 1 / 111;

    // Show all entities at start
    for (const ent of entities) ent.show = true;

    this.isMotionActive = true;
    const startTime = Date.now();

    this.motionTimer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(1.0, elapsed / durationMs);

      // Cubic deceleration (easeOutCubic): 1 - (1 - p)^3
      const ease = 1 - Math.pow(1 - progress, 3);
      // Distance remaining backward (from -backwardDistanceM to 0)
      const currentOffsetM = -backwardDistanceM * (1 - ease);
      const currentOffsetKm = currentOffsetM / 1000;

      const dLon = currentOffsetKm * fwdX * kmToLon;
      const dLat = currentOffsetKm * fwdY * kmToLat;

      for (const ent of entities) {
        const def = ent.properties?.getValue(this.viewer.clock.currentTime)?.aircraftDef as FormationAircraftDef;
        if (def) {
          ent.position = new Cesium.ConstantPositionProperty(
            Cesium.Cartesian3.fromDegrees(def.targetLon + dLon, def.targetLat + dLat, def.altitudeM)
          );
        }
      }

      this.viewer.scene.requestRender();

      if (progress >= 1.0) {
        this.cancelMotion();

        // Snap to exact target
        for (const ent of entities) {
          const def = ent.properties?.getValue(this.viewer.clock.currentTime)?.aircraftDef as FormationAircraftDef;
          if (def) {
            ent.position = new Cesium.ConstantPositionProperty(
              Cesium.Cartesian3.fromDegrees(def.targetLon, def.targetLat, def.altitudeM)
            );
          }
        }

        // Final render to freeze at absolute stillness
        this.viewer.scene.requestRender();
      }
    }, 25);
  }

  private cancelMotion(): void {
    if (this.motionTimer) {
      clearInterval(this.motionTimer);
      this.motionTimer = null;
    }
    this.isMotionActive = false;
  }

  private hideAll(): void {
    for (const ent of this.beat0Entities) ent.show = false;
    for (const ent of this.beat1Entities) ent.show = false;
    for (const ent of this.beat2Entities) ent.show = false;
    for (const ent of this.beat5Entities) ent.show = false;
  }

  /**
   * Density benchmarking API for Beat 0 (12, 24, or 36 aircraft).
   */
  public setBeat0Density(density: FormationDensityBeat0): void {
    if (this.beat0Density === density) return;
    this.beat0Density = density;

    // Remove old entities from dataSource
    for (const ent of this.beat0Entities) {
      this.dataSource.entities.remove(ent);
    }
    this.beat0Entities = [];

    // Rebuild
    this.buildBeat0Formations();

    if (this.activeBeat === 'BEAT_0_TIMOR_LAUNCH') {
      for (const ent of this.beat0Entities) ent.show = true;
      this.viewer.scene.requestRender();
    }
  }

  public getBeat0Density(): FormationDensityBeat0 {
    return this.beat0Density;
  }

  public getBeat0AircraftCount(): number {
    return this.beat0Entities.length;
  }

  /**
   * Density benchmarking API for Beat 5 (12 or 18 bombers).
   */
  public setBeat5Density(density: FormationDensityBeat5): void {
    if (this.beat5Density === density) return;
    this.beat5Density = density;

    for (const ent of this.beat5Entities) {
      this.dataSource.entities.remove(ent);
    }
    this.beat5Entities = [];

    this.buildBeat5Formations();

    if (this.activeBeat === 'BEAT_5_RAAF_AIRFIELD') {
      for (const ent of this.beat5Entities) ent.show = true;
      this.viewer.scene.requestRender();
    }
  }

  public getBeat5Density(): FormationDensityBeat5 {
    return this.beat5Density;
  }

  public getBeat5AircraftCount(): number {
    return this.beat5Entities.length;
  }

  public destroy(): void {
    this.cancelMotion();
    for (const ent of [...this.beat0Entities, ...this.beat1Entities]) {
      this.dataSource.entities.remove(ent);
    }
    for (const ent of this.beat2Entities) {
      this.dataSource.entities.remove(ent);
    }
    for (const ent of this.beat5Entities) {
      this.dataSource.entities.remove(ent);
    }
    this.beat0Entities = [];
    this.beat1Entities = [];
    this.beat2Entities = [];
    this.beat5Entities = [];
  }
}

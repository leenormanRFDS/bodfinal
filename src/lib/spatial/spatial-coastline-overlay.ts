/**
 * THE BOMBING OF DARWIN — HISTORICAL SPATIAL ENGINE
 * Spatial Coastline Overlay
 * 
 * Provides an archival, restrained geographic coastline overlay to ensure
 * immediate shoreline comprehension (Darwin Peninsula, Harbour arms, Beagle Gulf,
 * Bathurst Island / Clarence Strait) without commercial map brightness or neon graphics.
 * 
 * Visual Language:
 * - REST: Restrained steel/bone (rgba(238, 233, 223, 0.28)), 1.2px, clamped to ground.
 * - ACTIVE EMPHASIS: Subtle exposure gain (rgba(238, 233, 223, 0.65-0.70)) for the current narrative beat.
 * - ZERO GLOW, ZERO NEON, ZERO RADAR PULSES.
 * - Preserves Cesium requestRenderMode (renders only on state transition).
 */

import type * as CesiumType from 'cesium';
import type { SpatialDemonstrationStateId } from './spatial-types';

export interface CoastlineSegment {
  id: string;
  name: string;
  region: 'BATHURST_CLARENCE' | 'BEAGLE_GULF' | 'DARWIN_HARBOUR' | 'DARWIN_PENINSULA';
  coordinates: [number, number][]; // [longitude, latitude]
}

/**
 * High-fidelity shorelines for priority historical geography.
 */
export const COASTLINE_SEGMENTS: CoastlineSegment[] = [
  // 1. Darwin Town Peninsula & Inner Harbour Context (Stokes Hill, Fort Hill, Larrakeyah, East Point)
  {
    id: 'darwin-peninsula',
    name: 'Darwin Peninsula Shoreline',
    region: 'DARWIN_PENINSULA',
    coordinates: [
      [130.814, -12.408], // East Point
      [130.822, -12.418], // Dudley Point
      [130.828, -12.428], // Fannie Bay
      [130.832, -12.438], // Mindil Beach
      [130.824, -12.448], // Cullen Bay / Kahlin
      [130.816, -12.458], // Emery Point / Larrakeyah
      [130.828, -12.466], // Oval Point
      [130.836, -12.468], // Lameroo Beach / Esplanade
      [130.841, -12.471], // Fort Hill
      [130.846, -12.472], // Stokes Hill approach
      [130.851, -12.470], // Stokes Hill Wharf root
      [130.856, -12.463], // Frances Bay entrance
      [130.862, -12.450], // Sadgroves Creek
      [130.852, -12.438], // Stuart Park foreshore
      [130.845, -12.415], // Ludmilla Creek
      [130.814, -12.408], // Close loop back to East Point
    ],
  },
  // 2. Darwin Harbour Southern & Western Arms (East Arm, Middle Arm, West Arm, Mandorah, Charles Point)
  {
    id: 'darwin-harbour-basin',
    name: 'Port Darwin Estuary & Southern Arms',
    region: 'DARWIN_HARBOUR',
    coordinates: [
      [130.624, -12.388], // Charles Point
      [130.672, -12.435], // West Point
      [130.740, -12.438], // Wagait Beach
      [130.768, -12.442], // Mandorah Jetty
      [130.765, -12.468], // Shell Island / South Shell
      [130.745, -12.498], // Woods Inlet
      [130.772, -12.542], // West Arm outer
      [130.765, -12.592], // West Arm inner reach
      [130.795, -12.632], // West Arm headwaters
      [130.825, -12.595], // Pioneer Creek
      [130.842, -12.571], // Middle Arm entrance
      [130.865, -12.555], // Channel Island bridge
      [130.875, -12.602], // Middle Arm mangrove basin
      [130.876, -12.518], // Wickham Point
      [130.915, -12.498], // East Arm Bladin Point
      [130.952, -12.502], // Elizabeth River entrance
      [130.902, -12.468], // Hudson Creek
      [130.868, -12.458], // Frances Bay south
    ],
  },
  // 3. Beagle Gulf & Northern Coastal Corridor (Nightcliff, Casuarina, Lee Point, Gunn Point)
  {
    id: 'beagle-gulf-coast',
    name: 'Beagle Gulf & Shoal Bay Coastline',
    region: 'BEAGLE_GULF',
    coordinates: [
      [130.814, -12.408], // East Point
      [130.852, -12.378], // Nightcliff
      [130.862, -12.368], // Rapid Creek
      [130.875, -12.352], // Casuarina Beach / Dripstone
      [130.898, -12.332], // Lee Point
      [130.905, -12.348], // Buffalo Creek
      [130.942, -12.335], // Shoal Bay inner
      [130.985, -12.285], // Tree Point
      [131.002, -12.172], // Gunn Point
      [131.065, -12.145], // Murrumujuk
    ],
  },
  // 4. Bathurst Island & Apsley Strait (Nguiu / Sacred Heart Mission)
  {
    id: 'bathurst-island',
    name: 'Bathurst Island & Apsley Strait Shoreline',
    region: 'BATHURST_CLARENCE',
    coordinates: [
      [130.018, -11.792], // Cape Fourcroy (SW tip)
      [130.025, -11.695], // Rocky Point
      [130.095, -11.585], // Gordon Bay
      [130.138, -11.558], // Cape Helvetius
      [130.220, -11.455], // De Courcy Head
      [130.345, -11.415], // Brace Point
      [130.405, -11.425], // Port Cockburn
      [130.415, -11.450], // Apsley Strait North entrance
      [130.435, -11.602], // Apsley Strait mid-channel
      [130.550, -11.720], // Apsley Strait southern narrows
      [130.627, -11.758], // Nguiu (Sacred Heart Mission)
      [130.645, -11.775], // SE Bathurst spit
      [130.505, -11.820], // Southern Bathurst coast
      [130.320, -11.840], // Twinies
      [130.150, -11.835], // Point Hurd
      [130.018, -11.792], // Close loop at Cape Fourcroy
    ],
  },
  // 5. Southern Melville Island & Clarence Strait Narrows (approach over Vernon Islands)
  {
    id: 'clarence-strait-narrows',
    name: 'Clarence Strait & South Melville Shoreline',
    region: 'BATHURST_CLARENCE',
    coordinates: [
      [130.645, -11.775], // Across strait from Nguiu
      [130.680, -11.785], // Shoal Bay (Melville)
      [130.795, -11.795], // Appletree Point
      [130.950, -11.835], // Piper Head
      [131.120, -11.890], // Conder Point
      [131.255, -11.945], // Cape Gambier (SE Melville)
      [131.095, -12.085], // East Vernon Island
      [131.045, -12.065], // Southwest Vernon Island
    ],
  },
];

export class SpatialCoastlineOverlay {
  private Cesium: typeof CesiumType;
  private viewer: CesiumType.Viewer;
  private dataSource: CesiumType.CustomDataSource | null = null;
  private segmentEntities: Map<string, { entity: CesiumType.Entity; region: CoastlineSegment['region'] }> = new Map();
  private landmassEntities: CesiumType.Entity[] = [];
  private activeStateId: SpatialDemonstrationStateId = 'STATE_00_WORLD';

  // Archival palette (non-neon, non-glowing)
  // Palette: Water #070A0E, Land #181D23, Urban #222830, Wharves rgba(236,231,219,.75)
  private readonly LAND_COLOR = '#181D23';
  private readonly URBAN_COLOR = '#222830';
  private readonly WHARF_COLOR = 'rgba(236, 231, 219, 0.40)';
  private readonly BASE_COLOR = 'rgba(238, 233, 223, 0.28)';
  private readonly ACTIVE_COLOR = 'rgba(238, 233, 223, 0.68)';
  private readonly BASE_WIDTH = 1.2;
  private readonly ACTIVE_WIDTH = 1.8;

  constructor(Cesium: typeof CesiumType, viewer: CesiumType.Viewer) {
    this.Cesium = Cesium;
    this.viewer = viewer;
  }

  public async initialize(): Promise<void> {
    this.dataSource = new this.Cesium.CustomDataSource('darwin-spatial-coastlines');
    await this.viewer.dataSources.add(this.dataSource);

    this.buildLandAndInfrastructurePolygons();
    this.buildCoastlinePolylines();
    this.updateCoastlineExposure();
  }

  /**
   * Builds foundational landmass geometry.
   * At harbour scale, the continuous 1942 historical raster carries all the internal geographic detail.
   */
  private buildLandAndInfrastructurePolygons(): void {
    if (!this.dataSource) return;
    const Cesium = this.Cesium;

    // 1. Darwin Peninsula & Mainland Landmass
    const peninsulaLand = [
      130.814, -12.408, // East Point
      130.822, -12.418, // Dudley Point
      130.828, -12.428, // Fannie Bay
      130.832, -12.438, // Mindil Beach
      130.824, -12.448, // Cullen Bay / Kahlin
      130.816, -12.458, // Emery Point / Larrakeyah
      130.828, -12.466, // Oval Point
      130.836, -12.468, // Lameroo Beach / Esplanade
      130.841, -12.471, // Fort Hill
      130.846, -12.472, // Stokes Hill approach
      130.851, -12.470, // Stokes Hill Wharf root
      130.856, -12.463, // Frances Bay entrance
      130.862, -12.450, // Sadgroves Creek
      130.880, -12.440, // Stuart Park / Winnellie
      130.900, -12.420, // Berrimah inland
      130.900, -12.330, // Lee Point coast
      130.875, -12.352, // Casuarina Beach
      130.852, -12.378, // Nightcliff
      130.814, -12.408, // Back to East Point
    ];

    const ent1 = this.dataSource.entities.add({
      name: 'Darwin Peninsula Landmass',
      polygon: {
        hierarchy: Cesium.Cartesian3.fromDegreesArray(peninsulaLand),
        material: Cesium.Color.fromCssColorString(this.LAND_COLOR),
      },
      show: false,
    });
    this.landmassEntities.push(ent1);

    // 2. Urban Darwin Historical Core
    const urbanCore = [
      130.838, -12.462, // Esplanade west
      130.834, -12.466, // Lameroo cliff
      130.842, -12.471, // Fort Hill base
      130.848, -12.468, // Stokes Hill approach
      130.850, -12.460, // McMinn St / Railway yards
      130.845, -12.457, // Daly St north
      130.838, -12.462, // Close loop
    ];

    const ent2 = this.dataSource.entities.add({
      name: 'Urban Darwin Historical Fabric',
      polygon: {
        hierarchy: Cesium.Cartesian3.fromDegreesArray(urbanCore),
        material: Cesium.Color.fromCssColorString(this.URBAN_COLOR),
      },
      show: false,
    });
    this.landmassEntities.push(ent2);

    // 3. Stokes Hill Wharf & Fort Hill Infrastructure
    const stokesWharfPoly = [
      130.8472, -12.4705,
      130.8512, -12.4720,
      130.8502, -12.4738,
      130.8462, -12.4723,
    ];

    const ent3 = this.dataSource.entities.add({
      name: 'Stokes Hill Wharf Infrastructure',
      polygon: {
        hierarchy: Cesium.Cartesian3.fromDegreesArray(stokesWharfPoly),
        material: Cesium.Color.fromCssColorString(this.WHARF_COLOR),
      },
      show: false,
    });
    this.landmassEntities.push(ent3);

    const fortHillWharfPoly = [
      130.8405, -12.4708,
      130.8425, -12.4724,
      130.8415, -12.4735,
      130.8395, -12.4718,
    ];

    const ent4 = this.dataSource.entities.add({
      name: 'Fort Hill Wharf Infrastructure',
      polygon: {
        hierarchy: Cesium.Cartesian3.fromDegreesArray(fortHillWharfPoly),
        material: Cesium.Color.fromCssColorString(this.WHARF_COLOR),
      },
      show: false,
    });
    this.landmassEntities.push(ent4);

    // 4. Bathurst Island Landmass
    const bathurstSegment = COASTLINE_SEGMENTS.find(s => s.id === 'bathurst-island');
    if (bathurstSegment) {
      const bathurstPoly: number[] = [];
      for (const [lng, lat] of bathurstSegment.coordinates) {
        bathurstPoly.push(lng, lat);
      }
      const ent5 = this.dataSource.entities.add({
        name: 'Bathurst Island Landmass',
        polygon: {
          hierarchy: Cesium.Cartesian3.fromDegreesArray(bathurstPoly),
          material: Cesium.Color.fromCssColorString(this.LAND_COLOR),
        },
        show: true,
      });
      this.landmassEntities.push(ent5);
    }
  }

  private buildCoastlinePolylines(): void {
    if (!this.dataSource) return;
    const Cesium = this.Cesium;

    for (const segment of COASTLINE_SEGMENTS) {
      const degreesArray: number[] = [];
      for (const [lng, lat] of segment.coordinates) {
        degreesArray.push(lng, lat);
      }

      const entity = this.dataSource.entities.add({
        name: segment.name,
        polyline: {
          positions: Cesium.Cartesian3.fromDegreesArray(degreesArray),
          width: this.BASE_WIDTH,
          material: Cesium.Color.fromCssColorString(this.BASE_COLOR),
          clampToGround: true,
        },
        show: true,
      });

      this.segmentEntities.set(segment.id, { entity, region: segment.region });
    }
  }

  /**
   * Active-geography emphasis:
   * Subtly lifts exposure of the active geographic zone without glow, pulse, or radar rings.
   */
  public setActiveState(stateId: SpatialDemonstrationStateId): void {
    if (this.activeStateId === stateId) return;
    this.activeStateId = stateId;
    this.updateCoastlineExposure();
  }

  private updateCoastlineExposure(): void {
    if (!this.dataSource) return;
    const Cesium = this.Cesium;

    // Determine target region based on active beat
    let activeRegion: CoastlineSegment['region'] | 'ALL_QUIET' | 'HARBOUR_AND_PENINSULA' = 'ALL_QUIET';

    switch (this.activeStateId) {
      case 'BEAT_1_BATHURST_WARNING':
        activeRegion = 'BATHURST_CLARENCE';
        break;
      case 'BEAT_2_FIRST_WAVE_APPROACH':
        activeRegion = 'BEAGLE_GULF';
        break;
      case 'BEAT_3_DARWIN_IMPACT':
      case 'BEAT_4_HARBOUR_ENGAGEMENT':
      case 'BEAT_5_RAAF_AIRFIELD':
      case 'BEAT_6_PEARY_SUNKEN':
        activeRegion = 'HARBOUR_AND_PENINSULA';
        break;
      case 'BEAT_0_TIMOR_LAUNCH':
      case 'BEAT_7_DUSK_AFTERMATH':
      default:
        activeRegion = 'ALL_QUIET';
        break;
    }

    const baseColor = Cesium.Color.fromCssColorString(this.BASE_COLOR);
    const activeColor = Cesium.Color.fromCssColorString(this.ACTIVE_COLOR);

    const isHarbourScale = [
      'BEAT_2_HARBOUR_STRIKE',
      'BEAT_3_POST_OFFICE',
      'BEAT_4_PEARY_ATTACK',
      'BEAT_5_RAAF_AIRFIELD',
      'BEAT_6_PEARY_LOST',
      'BEAT_7_RECKONING',
      'STATE_02_DARWIN',
      'STATE_03_WHARF',
      'BEAT_3_DARWIN_IMPACT',
      'BEAT_4_HARBOUR_ENGAGEMENT',
      'BEAT_6_PEARY_SUNKEN',
    ].includes(this.activeStateId as string);

    // Modern vector fill reduction: eliminate opaque land fills over historical raster
    for (const ent of this.landmassEntities) {
      if (ent.name === 'Bathurst Island Landmass') {
        ent.show = !isHarbourScale;
      } else {
        ent.show = false;
      }
    }

    for (const [, item] of this.segmentEntities) {
      const polyline = item.entity.polyline;
      if (!polyline) continue;

      let isActive = false;
      if (activeRegion === 'HARBOUR_AND_PENINSULA') {
        isActive = item.region === 'DARWIN_HARBOUR' || item.region === 'DARWIN_PENINSULA';
      } else {
        isActive = item.region === activeRegion;
      }

      polyline.material = (isActive ? activeColor : baseColor) as any;
      polyline.width = (isActive ? this.ACTIVE_WIDTH : this.BASE_WIDTH) as any;
    }

    this.viewer.scene.requestRender();
  }

  public destroy(): void {
    if (this.dataSource) {
      this.viewer.dataSources.remove(this.dataSource, true);
      this.dataSource = null;
    }
    this.segmentEntities.clear();
  }
}

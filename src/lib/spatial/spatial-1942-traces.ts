/**
 * THE BOMBING OF DARWIN — HISTORICAL SPATIAL ENGINE
 * 1942 Historical Darwin Traces & Ground Structure
 * 
 * Provides verified 1942 historical vector overlays:
 * - 1942 Stokes Hill Wharf (timber approach pier and T-head berthing deck)
 * - 1942 Fort Hill Wharf (cargo jetty and railway approach)
 * - 1942 Goyder Town Grid (Esplanade, Mitchell, Smith, Cavenagh, Bennett, Knuckey)
 * - 1942 Post Office civic footprint & civilian shelter trench
 * - 1942 RAAF Station Darwin runway alignments at Parap
 * - 1942 Shoreline & intertidal reef drying ledges
 * 
 * Rendered above imagery raster layers and integrated into the archival palette.
 */

import type * as CesiumType from 'cesium';
import type { SpatialDemonstrationStateId } from './spatial-types';

export class Spatial1942Traces {
  private Cesium: typeof CesiumType;
  private dataSource: CesiumType.CustomDataSource;
  private entities: CesiumType.Entity[] = [];
  private wharfEntities: CesiumType.Entity[] = [];
  private townEntities: CesiumType.Entity[] = [];
  private airfieldEntities: CesiumType.Entity[] = [];
  private isDestroyed: boolean = false;

  constructor(Cesium: typeof CesiumType, dataSource: CesiumType.CustomDataSource) {
    this.Cesium = Cesium;
    this.dataSource = dataSource;
    this.build1942Features();
  }

  private build1942Features(): void {
    const Cesium = this.Cesium;

    // Palette: restrained archival materials
    const timberDeckColor = Cesium.Color.fromCssColorString('#24201B'); // aged creosote timber
    const timberOutlineColor = Cesium.Color.fromCssColorString('rgba(198, 161, 91, 0.65)'); // aged brass
    const roadColor = Cesium.Color.fromCssColorString('rgba(236, 231, 219, 0.38)'); // muted bone
    const roadMajorColor = Cesium.Color.fromCssColorString('rgba(236, 231, 219, 0.52)');
    const railColor = Cesium.Color.fromCssColorString('rgba(198, 161, 91, 0.45)');
    const reefColor = Cesium.Color.fromCssColorString('rgba(198, 161, 91, 0.12)');
    const reefOutline = Cesium.Color.fromCssColorString('rgba(198, 161, 91, 0.30)');
    const darkBg = Cesium.Color.fromCssColorString('#070A0E');
    const boneColor = Cesium.Color.fromCssColorString('#ECE7DB');
    const bgBadge = Cesium.Color.fromCssColorString('rgba(7, 10, 14, 0.88)');

    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const traceFont = isMobile
      ? '500 11px "Museo Sans", -apple-system, BlinkMacSystemFont, sans-serif'
      : '500 12px "Museo Sans", -apple-system, BlinkMacSystemFont, sans-serif';

    // =========================================================================
    // 1. STOKES HILL WHARF 1942 (HISTORIC TIMBER T-HEAD JETTY)
    // The wooden wharf extending from Stokes Hill where MV Neptuna was berthed
    // =========================================================================
    
    // Timber approach arm
    const stokesApproach = this.dataSource.entities.add({
      name: '1942 Stokes Hill Timber Pier Approach',
      polyline: {
        positions: Cesium.Cartesian3.fromDegreesArrayHeights([
          130.8472, -12.4714, 6,
          130.8506, -12.4718, 6,
        ]),
        width: isMobile ? 3.5 : 4.5,
        material: new Cesium.PolylineOutlineMaterialProperty({
          color: timberDeckColor,
          outlineColor: timberOutlineColor,
          outlineWidth: 1.0,
        }),
        clampToGround: false,
      },
      show: false,
    });
    this.entities.push(stokesApproach);
    this.wharfEntities.push(stokesApproach);

    // T-Head main berthing arm (approx 200m timber wharf face)
    const stokesTHead = this.dataSource.entities.add({
      name: '1942 Stokes Hill Timber Wharf Berthing Face',
      polyline: {
        positions: Cesium.Cartesian3.fromDegreesArrayHeights([
          130.8498, -12.4702, 7,
          130.8516, -12.4735, 7,
        ]),
        width: isMobile ? 5.0 : 6.5,
        material: new Cesium.PolylineOutlineMaterialProperty({
          color: timberDeckColor,
          outlineColor: timberOutlineColor,
          outlineWidth: 1.2,
        }),
        clampToGround: false,
      },
      show: false,
    });
    this.entities.push(stokesTHead);
    this.wharfEntities.push(stokesTHead);

    // MV Neptuna Berthing Location marker on inner/outer face
    const neptunaBerth = this.dataSource.entities.add({
      name: 'MV Neptuna Berth (1942)',
      position: Cesium.Cartesian3.fromDegrees(130.8510, -12.4722, 14),
      point: {
        pixelSize: 6,
        color: Cesium.Color.fromCssColorString('#C6A15B'),
        outlineColor: darkBg,
        outlineWidth: 2,
      },
      label: {
        text: 'MV NEPTUNA BERTH · 1942',
        font: traceFont,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        fillColor: boneColor,
        outlineColor: darkBg,
        outlineWidth: 3,
        showBackground: true,
        backgroundColor: bgBadge,
        backgroundPadding: new Cesium.Cartesian2(6, 4),
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        pixelOffset: new Cesium.Cartesian2(0, -10),
        scaleByDistance: new Cesium.NearFarScalar(1e3, 1.0, 15000, 0.6),
      },
      show: false,
    });
    this.entities.push(neptunaBerth);
    this.wharfEntities.push(neptunaBerth);

    // =========================================================================
    // 2. FORT HILL WHARF 1942 (CARGO & COAL JETTY)
    // Timber jetty extending south into harbour channel
    // =========================================================================
    const fortHillWharf = this.dataSource.entities.add({
      name: '1942 Fort Hill Cargo Wharf',
      polyline: {
        positions: Cesium.Cartesian3.fromDegreesArrayHeights([
          130.8415, -12.4708, 6,
          130.8424, -12.4738, 6,
        ]),
        width: isMobile ? 3.5 : 4.5,
        material: new Cesium.PolylineOutlineMaterialProperty({
          color: timberDeckColor,
          outlineColor: timberOutlineColor,
          outlineWidth: 1.0,
        }),
        clampToGround: false,
      },
      show: false,
    });
    this.entities.push(fortHillWharf);
    this.wharfEntities.push(fortHillWharf);

    const fortHillLabel = this.dataSource.entities.add({
      name: 'Fort Hill Wharf Annotation',
      position: Cesium.Cartesian3.fromDegrees(130.8424, -12.4738, 14),
      label: {
        text: 'FORT HILL JETTY · 1942',
        font: traceFont,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        fillColor: boneColor,
        outlineColor: darkBg,
        outlineWidth: 3,
        showBackground: true,
        backgroundColor: bgBadge,
        backgroundPadding: new Cesium.Cartesian2(6, 4),
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        pixelOffset: new Cesium.Cartesian2(0, -10),
        scaleByDistance: new Cesium.NearFarScalar(1e3, 1.0, 15000, 0.6),
      },
      show: false,
    });
    this.entities.push(fortHillLabel);
    this.wharfEntities.push(fortHillLabel);

    // =========================================================================
    // 3. PRIMARY HISTORICAL ROAD STRUCTURE (1942 GOYDER SURVEY TOWN GRID)
    // Mitchell, Smith, Cavenagh, Esplanade, Bennett, Knuckey
    // =========================================================================
    
    // The Esplanade (Cliff brow overlooking harbour)
    const esplanadeRoad = this.dataSource.entities.add({
      name: 'The Esplanade (1942)',
      polyline: {
        positions: Cesium.Cartesian3.fromDegreesArrayHeights([
          130.8375, -12.4665, 12,
          130.8405, -12.4682, 12,
          130.8440, -12.4695, 12,
        ]),
        width: isMobile ? 2.0 : 2.5,
        material: roadMajorColor,
        clampToGround: true,
      },
      show: false,
    });
    this.entities.push(esplanadeRoad);
    this.townEntities.push(esplanadeRoad);

    // Mitchell Street (Main Civic corridor with Post Office)
    const mitchellRoad = this.dataSource.entities.add({
      name: 'Mitchell Street (1942)',
      polyline: {
        positions: Cesium.Cartesian3.fromDegreesArrayHeights([
          130.8355, -12.4605, 14,
          130.8415, -12.4638, 14,
          130.8465, -12.4665, 14,
        ]),
        width: isMobile ? 2.2 : 2.8,
        material: roadMajorColor,
        clampToGround: true,
      },
      show: false,
    });
    this.entities.push(mitchellRoad);
    this.townEntities.push(mitchellRoad);

    // Smith Street (Commercial spine)
    const smithRoad = this.dataSource.entities.add({
      name: 'Smith Street (1942)',
      polyline: {
        positions: Cesium.Cartesian3.fromDegreesArrayHeights([
          130.8370, -12.4590, 15,
          130.8425, -12.4622, 15,
          130.8475, -12.4650, 15,
        ]),
        width: isMobile ? 1.8 : 2.2,
        material: roadColor,
        clampToGround: true,
      },
      show: false,
    });
    this.entities.push(smithRoad);
    this.townEntities.push(smithRoad);

    // Cavenagh Street (Chinatown / Northern spine)
    const cavenaghRoad = this.dataSource.entities.add({
      name: 'Cavenagh Street (1942)',
      polyline: {
        positions: Cesium.Cartesian3.fromDegreesArrayHeights([
          130.8385, -12.4575, 16,
          130.8440, -12.4608, 16,
          130.8490, -12.4635, 16,
        ]),
        width: isMobile ? 1.8 : 2.2,
        material: roadColor,
        clampToGround: true,
      },
      show: false,
    });
    this.entities.push(cavenaghRoad);
    this.townEntities.push(cavenaghRoad);

    // Bennett Street (Cross street connecting Esplanade past Post Office)
    const bennettRoad = this.dataSource.entities.add({
      name: 'Bennett Street (1942)',
      polyline: {
        positions: Cesium.Cartesian3.fromDegreesArrayHeights([
          130.8432, -12.4690, 14,
          130.8455, -12.4615, 14,
        ]),
        width: isMobile ? 2.0 : 2.5,
        material: roadMajorColor,
        clampToGround: true,
      },
      show: false,
    });
    this.entities.push(bennettRoad);
    this.townEntities.push(bennettRoad);

    // Knuckey Street (Cross street)
    const knuckeyRoad = this.dataSource.entities.add({
      name: 'Knuckey Street (1942)',
      polyline: {
        positions: Cesium.Cartesian3.fromDegreesArrayHeights([
          130.8402, -12.4670, 14,
          130.8428, -12.4595, 14,
        ]),
        width: isMobile ? 1.8 : 2.2,
        material: roadColor,
        clampToGround: true,
      },
      show: false,
    });
    this.entities.push(knuckeyRoad);
    this.townEntities.push(knuckeyRoad);

    // North Australia Railway Track (from Stokes Hill wharf foot to Parap)
    const railwayCorridor = this.dataSource.entities.add({
      name: 'North Australia Railway (1942)',
      polyline: {
        positions: Cesium.Cartesian3.fromDegreesArrayHeights([
          130.8475, -12.4714, 8,
          130.8520, -12.4670, 10,
          130.8550, -12.4580, 12,
          130.8600, -12.4450, 16,
          130.8680, -12.4250, 20,
        ]),
        width: 1.8,
        material: railColor,
        clampToGround: true,
      },
      show: false,
    });
    this.entities.push(railwayCorridor);
    this.airfieldEntities.push(railwayCorridor);

    // =========================================================================
    // 4. 1942 POST OFFICE TRENCH FOOTPRINT
    // Civil shelter trench behind the post office at Mitchell & Bennett Streets
    // =========================================================================
    const poTrenchOutline = this.dataSource.entities.add({
      name: 'Post Office Shelter Trench (1942)',
      polyline: {
        positions: Cesium.Cartesian3.fromDegreesArrayHeights([
          130.8441, -12.4645, 18,
          130.8443, -12.4646, 18,
          130.8442, -12.4647, 18,
          130.8445, -12.4648, 18,
        ]),
        width: 2.2,
        material: Cesium.Color.fromCssColorString('rgba(198, 161, 91, 0.75)'),
        clampToGround: true,
      },
      show: false,
    });
    this.entities.push(poTrenchOutline);
    this.townEntities.push(poTrenchOutline);

    // =========================================================================
    // 5. RAAF STATION DARWIN (PARAP) AIRFIELD RUNWAYS (1942)
    // =========================================================================
    const raafMainRunway = this.dataSource.entities.add({
      name: 'RAAF Darwin Main Runway 13/31 (1942)',
      polyline: {
        positions: Cesium.Cartesian3.fromDegreesArrayHeights([
          130.8690, -12.4180, 30,
          130.8810, -12.4110, 30,
        ]),
        width: isMobile ? 4.0 : 6.0,
        material: new Cesium.PolylineOutlineMaterialProperty({
          color: Cesium.Color.fromCssColorString('rgba(35, 38, 42, 0.85)'),
          outlineColor: Cesium.Color.fromCssColorString('rgba(198, 161, 91, 0.40)'),
          outlineWidth: 1.0,
        }),
        clampToGround: true,
      },
      show: false,
    });
    this.entities.push(raafMainRunway);
    this.airfieldEntities.push(raafMainRunway);

    const raafCrossRunway = this.dataSource.entities.add({
      name: 'RAAF Darwin Cross Runway 04/22 (1942)',
      polyline: {
        positions: Cesium.Cartesian3.fromDegreesArrayHeights([
          130.8715, -12.4080, 30,
          130.8775, -12.4215, 30,
        ]),
        width: isMobile ? 3.5 : 5.0,
        material: new Cesium.PolylineOutlineMaterialProperty({
          color: Cesium.Color.fromCssColorString('rgba(35, 38, 42, 0.85)'),
          outlineColor: Cesium.Color.fromCssColorString('rgba(198, 161, 91, 0.35)'),
          outlineWidth: 1.0,
        }),
        clampToGround: true,
      },
      show: false,
    });
    this.entities.push(raafCrossRunway);
    this.airfieldEntities.push(raafCrossRunway);

    // =========================================================================
    // 6. 1942 INTERTIDAL REEF DRYING LEDGE & SHORELINE FLAT
    // Surrounds Fort Hill and Lameroo Beach
    // =========================================================================
    const fortHillReefFlat = this.dataSource.entities.add({
      name: 'Fort Hill Intertidal Reef Drying Flat (1942)',
      polygon: {
        hierarchy: Cesium.Cartesian3.fromDegreesArray([
          130.8385, -12.4695,
          130.8415, -12.4725,
          130.8435, -12.4720,
          130.8445, -12.4700,
          130.8405, -12.4680,
        ]),
        material: reefColor,
        outline: true,
        outlineColor: reefOutline,
        outlineWidth: 1.2,
      },
      show: false,
    });
    this.entities.push(fortHillReefFlat);
    this.wharfEntities.push(fortHillReefFlat);
  }

  /**
   * Updates visibility according to the active demonstration state.
   * Prominently displayed during Harbour and Town scale story beats.
   */
  public updateState(activeStateId: SpatialDemonstrationStateId): void {
    if (this.isDestroyed) return;

    const isWharfScene = [
      'BEAT_2_HARBOUR_STRIKE',
      'BEAT_4_PEARY_ATTACK',
      'BEAT_6_PEARY_LOST',
      'STATE_03_WHARF',
    ].includes(activeStateId);

    const isTownScene = activeStateId === 'BEAT_3_POST_OFFICE';
    const isAirfieldScene = activeStateId === 'BEAT_5_RAAF_AIRFIELD';

    for (const entity of this.wharfEntities) {
      entity.show = isWharfScene;
    }
    for (const entity of this.townEntities) {
      entity.show = isTownScene;
    }
    for (const entity of this.airfieldEntities) {
      entity.show = isAirfieldScene;
    }
  }

  public destroy(): void {
    this.isDestroyed = true;
    for (const entity of this.entities) {
      this.dataSource.entities.remove(entity);
    }
    this.entities = [];
  }
}

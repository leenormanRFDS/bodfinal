/**
 * THE BOMBING OF DARWIN — HISTORICAL SPATIAL ENGINE
 * Cartography Manager
 *
 * Owns the visible basemap: a project-owned, label-free, dark cartographic tile
 * pyramid rendered from open geographic data (OpenStreetMap, Natural Earth) by
 * scripts/cartography/build_basemap.py and served from /tiles/darwin-basemap/.
 *
 * Why not a third-party tile service:
 *   CARTO raster basemaps now require an API key. Anonymous requests return
 *   HTTP 200 "API KEY REQUIRED" placeholder images, so error-based fallback
 *   never fired and visitors saw a watermarked void. A static, authored basemap
 *   has no key, no per-view cost, no rate limits, no commercial labels, and
 *   works offline. It is PRESENT-DAY geography; 1942 features are overlays.
 *
 * Layers are nested by detail (global → regional → Tiwi/Darwin → harbour →
 * town core). Each is opaque inside its rectangle and uses the same palette,
 * so transitions between them are invisible. Water colour in the tiles equals
 * globe.baseColor so the edge of coverage is invisible too.
 */

import type * as CesiumType from 'cesium';
import manifest from './basemap-manifest.json';

export interface BasemapLayerSpec {
  id: string;
  rect: [number, number, number, number];
  minimumLevel: number;
  maximumLevel: number;
}

export class CartographyManager {
  private Cesium: typeof CesiumType;
  private viewer: CesiumType.Viewer;
  private layers: CesiumType.ImageryLayer[] = [];
  private tileErrorCount = 0;
  private isDestroyed = false;

  constructor(Cesium: typeof CesiumType, viewer: CesiumType.Viewer) {
    this.Cesium = Cesium;
    this.viewer = viewer;
    this.applySceneTuning();
    this.applyBasemap();
  }

  /** Quiet, museum-grade scene: no sky, sun, moon or atmosphere glow. */
  private applySceneTuning(): void {
    const scene = this.viewer.scene;
    const water = this.Cesium.Color.fromCssColorString(manifest.waterColor);
    scene.backgroundColor = water;
    scene.globe.baseColor = water;
    scene.globe.showGroundAtmosphere = false;
    scene.globe.enableLighting = false;
    if (scene.skyBox) scene.skyBox.show = false;
    if (scene.sun) scene.sun.show = false;
    if (scene.moon) scene.moon.show = false;
    if (scene.skyAtmosphere) scene.skyAtmosphere.show = false;

    // Light distance haze for oblique depth; restrained so the horizon never glows.
    if (scene.fog) {
      scene.fog.enabled = true;
      scene.fog.density = 0.00005; // harbour views (2–6 km) stay crisp; 100 km views still recede
      scene.fog.minimumBrightness = 0.03;
    }
  }

  /** Adds the nested basemap layers described by basemap-manifest.json. */
  public applyBasemap(): void {
    if (this.isDestroyed) return;
    const C = this.Cesium;
    const imagery = this.viewer.scene.imageryLayers;
    imagery.removeAll();
    this.layers = [];

    const credit = new C.Credit(
      '<a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">© OpenStreetMap contributors</a> · Natural Earth',
      false
    );

    for (const spec of manifest.layers as BasemapLayerSpec[]) {
      const provider = new C.UrlTemplateImageryProvider({
        url: manifest.urlTemplate,
        tileWidth: manifest.tileSize,
        tileHeight: manifest.tileSize,
        minimumLevel: spec.minimumLevel,
        maximumLevel: spec.maximumLevel,
        rectangle: C.Rectangle.fromDegrees(...spec.rect),
        credit,
      });
      provider.errorEvent.addEventListener(() => {
        // Tiles are static and bundled; an error means a deployment problem, not a network blip.
        this.tileErrorCount += 1;
        if (this.tileErrorCount === 1) {
          console.warn(`[SpatialEngine] Basemap tile failed to load (layer "${spec.id}"). Globe base colour remains visible.`);
        }
      });
      this.layers.push(imagery.addImageryProvider(provider));
    }

    this.viewer.scene.requestRender();
  }

  /**
   * Beat hook retained for the viewer contract. The authored basemap carries its
   * own tonal hierarchy, so no per-beat exposure manipulation is applied.
   */
  public setBeatExposure(_beatId: string, _altitudeM?: number): void {
    if (this.isDestroyed) return;
    this.viewer.scene.requestRender();
  }

  /** Resize hook retained for the viewer contract. */
  public updateResponsiveExposure(): void {
    if (this.isDestroyed) return;
    this.viewer.scene.requestRender();
  }

  public getLayerCount(): number {
    return this.layers.length;
  }

  public destroy(): void {
    this.isDestroyed = true;
    this.layers = [];
  }
}

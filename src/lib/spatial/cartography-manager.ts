/**
 * THE BOMBING OF DARWIN — HISTORICAL SPATIAL ENGINE
 * Cartography Manager
 * 
 * Configures the restrained, dark, architectural cartography.
 * Deep void oceans (#07090B), muted landforms, subtle coastlines, zero commercial POIs.
 * Provides resilient fallback if external map tiles cannot be fetched.
 */

import type * as CesiumType from 'cesium';

export class CartographyManager {
  private Cesium: typeof CesiumType;
  private viewer: CesiumType.Viewer;
  private primaryLayer: CesiumType.ImageryLayer | null = null;
  private archivalPearyLayer: CesiumType.ImageryLayer | null = null;
  private archivalPostOfficeLayer: CesiumType.ImageryLayer | null = null;
  private archivalWharfLayer: CesiumType.ImageryLayer | null = null;
  private hasTriggeredFallback: boolean = false;
  private isDestroyed: boolean = false;

  constructor(Cesium: typeof CesiumType, viewer: CesiumType.Viewer) {
    this.Cesium = Cesium;
    this.viewer = viewer;
    this.applyAtmosphereAndSceneTuning();
    this.applyDarkBasemap();
  }

  /**
   * Suppress default flashy gaming/satellite atmosphere in favor of
   * a quiet, museum-grade, architectural dark environment.
   */
  private applyAtmosphereAndSceneTuning(): void {
    const scene = this.viewer.scene;
    const globe = scene.globe;

    // Palette: Water #070A0E foundation (deep void water)
    scene.backgroundColor = this.Cesium.Color.fromCssColorString('#070A0E');
    globe.baseColor = this.Cesium.Color.fromCssColorString('#070A0E');

    // Turn off distracting celestial bodies
    if (scene.skyBox) scene.skyBox.show = false;
    if (scene.sun) scene.sun.show = false;
    if (scene.moon) scene.moon.show = false;

    // Fog tuning for architectural depth and oblique legibility
    if (scene.fog) {
      scene.fog.enabled = true;
      scene.fog.density = 0.00010;
      scene.fog.minimumBrightness = 0.16;
    }
  }

  /**
   * Exposure parameters for the Archival Cartography.
   * Lifts land into distinct graphite tone (#181D23 / #222830) while holding water in deep black-navy (#070A0E).
   * Land must be visibly lighter than water in every scene.
   */
  public getExposureParams(beatId?: string) {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const isCloseHarbour = beatId && [
      'BEAT_2_HARBOUR_STRIKE',
      'BEAT_3_POST_OFFICE',
      'BEAT_4_PEARY_ATTACK',
      'BEAT_6_PEARY_LOST',
      'BEAT_7_RECKONING',
      'STATE_03_WHARF'
    ].includes(beatId);

    if (isCloseHarbour) {
      // Close harbour beats: deep void water (#070A0E), land lifted to #181D23, urban to #222830
      return isMobile
        ? { brightness: 1.28, contrast: 1.10, gamma: 1.14, saturation: 0.06 }
        : { brightness: 1.28, contrast: 1.10, gamma: 1.14, saturation: 0.06 };
    }

    // Regional and overview beats: high contrast between coastal land and sea
    return isMobile
      ? { brightness: 1.28, contrast: 1.10, gamma: 1.14, saturation: 0.06 }
      : { brightness: 1.22, contrast: 1.10, gamma: 1.14, saturation: 0.06 };
  }

  /**
   * Selective Exposure System:
   * Tunes local exposure, contrast and tonal balance for the active geographic subject.
   */
  public setBeatExposure(beatId: string, _altitudeM?: number): void {
    if (!this.primaryLayer || this.isDestroyed) return;
    const exposure = this.getExposureParams(beatId);
    this.primaryLayer.brightness = exposure.brightness;
    this.primaryLayer.contrast = exposure.contrast;
    this.primaryLayer.gamma = exposure.gamma;
    this.primaryLayer.saturation = exposure.saturation;

    // Selective Event Archival Textures:
    // Only 15–30% opacity (0.22). Soft feathered masks reveal detail only around active event.
    // Suppresses paper background entirely — only historical markings emerge.
    const isPearyScene = beatId === 'BEAT_4_PEARY_ATTACK' || beatId === 'BEAT_6_PEARY_LOST';
    const isPostOfficeScene = beatId === 'BEAT_3_POST_OFFICE';
    const isWharfScene = beatId === 'BEAT_2_HARBOUR_STRIKE' || beatId === 'STATE_03_WHARF';

    if (this.archivalPearyLayer) {
      this.archivalPearyLayer.show = isPearyScene;
      this.archivalPearyLayer.alpha = isPearyScene ? 0.22 : 0.0;
    }
    if (this.archivalPostOfficeLayer) {
      this.archivalPostOfficeLayer.show = isPostOfficeScene;
      this.archivalPostOfficeLayer.alpha = isPostOfficeScene ? 0.22 : 0.0;
    }
    if (this.archivalWharfLayer) {
      this.archivalWharfLayer.show = isWharfScene;
      this.archivalWharfLayer.alpha = isWharfScene ? 0.22 : 0.0;
    }

    this.viewer.scene.requestRender();
  }

  public updateResponsiveExposure(): void {
    if (!this.primaryLayer || this.isDestroyed) return;
    const exposure = this.getExposureParams();
    this.primaryLayer.brightness = exposure.brightness;
    this.primaryLayer.contrast = exposure.contrast;
    this.primaryLayer.gamma = exposure.gamma;
    this.primaryLayer.saturation = exposure.saturation;
    this.viewer.scene.requestRender();
  }

  /**
   * Applies the restrained dark cartographic basemap as the dominant spatial foundation.
   * Uses CARTO dark_nolabels to eliminate modern street name clutter while preserving shoreline/urban geometry.
   * Operates without requiring an external API key; if PUBLIC_CARTO_BASEMAP_KEY is present, it is appended.
   */
  public async applyDarkBasemap(): Promise<void> {
    if (this.isDestroyed) return;
    const scene = this.viewer.scene;
    const layers = scene.imageryLayers;
    layers.removeAll();

    const envObj = typeof import.meta !== 'undefined' ? import.meta.env : undefined;
    const basemapKey: string = envObj?.PUBLIC_CARTO_BASEMAP_KEY ?? '';

    let provider: CesiumType.ImageryProvider | null = null;

    try {
      // Primary: Restrained dark monochrome tiles with documented CARTO rastertiles endpoint
      // Note: unauthenticated production CARTO requests are prohibited
      const tileUrl = basemapKey
        ? `https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}.png?key=${encodeURIComponent(basemapKey)}`
        : `https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}.png`;

      provider = new this.Cesium.UrlTemplateImageryProvider({
        url: tileUrl,
        subdomains: ['a', 'b', 'c', 'd'],
        maximumLevel: 18,
        credit: new this.Cesium.Credit('<a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">© OpenStreetMap contributors</a>, <a href="https://carto.com/attributions" target="_blank" rel="noopener">© CARTO</a>', false),
      });

      // Catch tile network failures and automatically switch to local fallback
      if (provider.errorEvent) {
        provider.errorEvent.addEventListener((_tileError: unknown) => {
          if (!this.hasTriggeredFallback && !this.isDestroyed) {
            this.hasTriggeredFallback = true;
            console.warn('[SpatialEngine] External CARTO basemap network error; falling back to local Natural Earth II.');
            this.applyLocalFallbackBasemap();
          }
        });
      }

      this.primaryLayer = layers.addImageryProvider(provider);
      
      // Archival Charcoal Map: tuned exposure for land/water separation and clear geometry
      const exposure = this.getExposureParams();
      this.primaryLayer.brightness = exposure.brightness;
      this.primaryLayer.contrast = exposure.contrast;
      this.primaryLayer.gamma = exposure.gamma;
      this.primaryLayer.saturation = exposure.saturation;

      // Apply the selective event archival texture layers (revealed only around active events at 15-30% opacity)
      await this.applySelectiveArchivalOverlays();

      scene.requestRender();
    } catch (err) {
      console.warn('[SpatialEngine] Failed to initialize external dark tiles, falling back to local imagery:', err);
      this.applyLocalFallbackBasemap();
    }
  }

  /**
   * Selective Event Archival Texture Layers (15–30% Opacity, Soft Feathered Vignettes):
   * Strips paper background completely so only historical ink markings (soundings, survey roads, wharf) emerge.
   * Soft feathered masks isolate details around Peary, Post Office, and Wharf without any hard polygon or rectangular edges.
   */
  public async applySelectiveArchivalOverlays(): Promise<void> {
    if (this.isDestroyed) return;
    try {
      const scene = this.viewer.scene;
      const layers = scene.imageryLayers;

      const createSingleTile = async (url: string, rect: CesiumType.Rectangle): Promise<CesiumType.ImageryLayer> => {
        let provider: CesiumType.ImageryProvider;
        if (typeof (this.Cesium.SingleTileImageryProvider as any).fromUrl === 'function') {
          provider = await (this.Cesium.SingleTileImageryProvider as any).fromUrl(url, { rectangle: rect });
        } else {
          provider = new this.Cesium.SingleTileImageryProvider({ url, rectangle: rect });
        }
        const layer = layers.addImageryProvider(provider);
        layer.show = false;
        layer.alpha = 0.22; // 15–30% opacity range
        layer.brightness = 1.0;
        layer.contrast = 1.15;
        return layer;
      };

      // 1. USS Peary & Harbour Basin (between Peary, Stokes Hill, and Fort Hill)
      const rectPeary = this.Cesium.Rectangle.fromDegrees(130.822, -12.485, 130.858, -12.464);
      this.archivalPearyLayer = await createSingleTile('/images/spatial/archival-texture-peary.png', rectPeary);

      // 2. Post Office Precinct (Mitchell & Bennett town plan)
      const rectPO = this.Cesium.Rectangle.fromDegrees(130.837, -12.469, 130.849, -12.459);
      this.archivalPostOfficeLayer = await createSingleTile('/images/spatial/archival-texture-postoffice.png', rectPO);

      // 3. Stokes Hill Wharf (timber wharf geometry & approach)
      const rectWharf = this.Cesium.Rectangle.fromDegrees(130.844, -12.477, 130.856, -12.467);
      this.archivalWharfLayer = await createSingleTile('/images/spatial/archival-texture-wharf.png', rectWharf);

      scene.requestRender();
    } catch (err) {
      console.warn('[SpatialEngine] Failed to load selective archival textures:', err);
    }
  }

  /**
   * Local offline fallback basemap utilizing the bundled NaturalEarthII TMS tiles.
   * Located at: /cesium/Assets/Textures/NaturalEarthII (475 KB, Public Domain).
   */
  public async applyLocalFallbackBasemap(): Promise<void> {
    if (this.isDestroyed) return;
    const scene = this.viewer.scene;
    const layers = scene.imageryLayers;
    layers.removeAll();

    try {
      const naturalEarthUrl = this.Cesium.buildModuleUrl('Assets/Textures/NaturalEarthII');
      let fallbackProvider: CesiumType.ImageryProvider;

      if (typeof (this.Cesium.TileMapServiceImageryProvider as any).fromUrl === 'function') {
        fallbackProvider = await (this.Cesium.TileMapServiceImageryProvider as any).fromUrl(naturalEarthUrl);
      } else {
        fallbackProvider = new this.Cesium.TileMapServiceImageryProvider({
          url: naturalEarthUrl,
        });
      }

      if (this.isDestroyed) return;

      this.primaryLayer = layers.addImageryProvider(fallbackProvider);
      // Archival charcoal transformation on natural earth
      this.primaryLayer.brightness = 0.58;
      this.primaryLayer.contrast = 1.16;
      this.primaryLayer.gamma = 1.10;
      this.primaryLayer.saturation = 0.04;
      scene.requestRender();
    } catch (e) {
      console.error('[SpatialEngine] Local fallback basemap failed:', e);
      // Globe baseColor (#0E1217) will continue rendering cleanly
      scene.requestRender();
    }
  }

  public destroy(): void {
    this.isDestroyed = true;
    this.primaryLayer = null;
    this.archivalPearyLayer = null;
    this.archivalPostOfficeLayer = null;
    this.archivalWharfLayer = null;
  }
}

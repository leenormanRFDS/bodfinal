/**
 * THE BOMBING OF DARWIN — HISTORICAL SPATIAL ENGINE
 * Spatial Atmosphere Controller
 * 
 * Manages physical Northern Australian tropical atmosphere, directional historical sunlight,
 * horizon haze, and terrain contrast without generic game-engine bloom or neon filters.
 * 
 * Historical Lighting Design:
 * - 08:00 Launch: Low morning sun (azimuth ~101°, elev ~1.5°) skimming across Timor Sea waters; deep shadows.
 * - 09:35 Bathurst Warning: Sun rising (azimuth ~97°, elev ~24°); Clarence Strait channels highlighted.
 * - 09:58 First Bombs: Mid-morning sun (azimuth ~96°, elev ~30°); attack ingress from south-southeast into morning glare.
 * - 10:00 Post Office: High sun; crisp civic shadows over town peninsula.
 * - 10:45 Peary Attack: Sun climbing (azimuth ~94°, elev ~41°); bright tropical water contrast.
 * - 12:00 Second Raid: Near-zenith sun (azimuth ~91°, elev ~60°); high-altitude contrast over RAAF airfield.
 * - 13:00 Peary Sinks: Overhead tropical sun (azimuth ~87°, elev ~74°); solemn stillness over deep channel.
 * - Dusk Reckoning: Late afternoon/twilight sun (azimuth ~263°, elev ~25° down to dusk); quiet naval evening solemnity.
 */

import type * as CesiumType from 'cesium';
import type { HistoricalTimeController } from './historical-time-controller';

export interface AtmosphereTuning {
  fogDensity: number;
  fogMinBrightness: number;
  fogMaxBrightness: number;
  atmosphereHueShift: number;
  atmosphereSaturationShift: number;
  atmosphereBrightnessShift: number;
  lightIntensity: number;
}

export class SpatialAtmosphereController {
  private Cesium: typeof CesiumType;
  private viewer: CesiumType.Viewer;
  private timeController: HistoricalTimeController;
  private sunLight: CesiumType.SunLight | null = null;
  private isDestroyed: boolean = false;

  constructor(
    Cesium: typeof CesiumType,
    viewer: CesiumType.Viewer,
    timeController: HistoricalTimeController
  ) {
    this.Cesium = Cesium;
    this.viewer = viewer;
    this.timeController = timeController;
    this.initializeAtmosphere();
  }

  private initializeAtmosphere(): void {
    const scene = this.viewer.scene;
    const globe = scene.globe;
    const Cesium = this.Cesium;

    // Base scene void styling: Deep charcoal background
    scene.backgroundColor = Cesium.Color.fromCssColorString('#07090B');
    globe.baseColor = Cesium.Color.fromCssColorString('#0E1217');

    // Enable directional astronomical sunlight from Cesium's solar ephemeris
    try {
      this.sunLight = new Cesium.SunLight();
      scene.light = this.sunLight;
      globe.enableLighting = true;
    } catch (err) {
      console.warn('[SpatialAtmosphereController] SunLight initialization fallback:', err);
      globe.enableLighting = false;
    }

    // Dynamic ground atmosphere enabled with sunlight coupling
    globe.showGroundAtmosphere = true;
    try {
      if ((globe as any).dynamicAtmosphereLightingType !== undefined) {
        (globe as any).dynamicAtmosphereLighting = true;
        (globe as any).dynamicAtmosphereLightingType = (Cesium as any).DynamicAtmosphereLightingType?.SUNLIGHT ?? 1;
      }
    } catch {
      // Dynamic lighting type fallback
    }

    // SkyAtmosphere tuning for restrained Northern Australian tropical marine horizon
    if (scene.skyAtmosphere) {
      scene.skyAtmosphere.show = true;
      // Slight warm-tinted desaturated atmosphere (rejecting electric blue haze)
      scene.skyAtmosphere.hueShift = -0.05;
      scene.skyAtmosphere.saturationShift = -0.45;
      scene.skyAtmosphere.brightnessShift = -0.15;
    }

    // Suppress bright moon / star scatter to preserve museum focus
    if (scene.moon) scene.moon.show = false;
    if (scene.skyBox) scene.skyBox.show = false;
    if (scene.sun) scene.sun.show = false; // Don't show billboard sun disc; preserve directional ray casting

    // Fog calibration for humid tropical maritime horizon depth
    if (scene.fog) {
      scene.fog.enabled = true;
      scene.fog.density = 0.00012;
      scene.fog.minimumBrightness = 0.18;
    }
  }

  /**
   * Updates historical solar ephemeris and atmospheric horizon parameters for the active beat.
   * Runs atomically during beat transitions; preserves requestRenderMode.
   */
  public applyBeatAtmosphere(beatId: string): void {
    if (this.isDestroyed) return;
    const scene = this.viewer.scene;
    const globe = scene.globe;
    const clock = this.viewer.clock;

    const jd = this.timeController.getJulianDateForBeat(beatId);
    if (jd) {
      clock.currentTime = jd;
    }

    const tuning = this.getBeatTuning(beatId);

    // Fog parameters
    if (scene.fog) {
      scene.fog.density = tuning.fogDensity;
      scene.fog.minimumBrightness = tuning.fogMinBrightness;
    }

    // Sky atmosphere parameters
    if (scene.skyAtmosphere) {
      scene.skyAtmosphere.hueShift = tuning.atmosphereHueShift;
      scene.skyAtmosphere.saturationShift = tuning.atmosphereSaturationShift;
      scene.skyAtmosphere.brightnessShift = tuning.atmosphereBrightnessShift;
    }

    // Directional SunLight intensity
    if (this.sunLight && (this.sunLight as any).intensity !== undefined) {
      (this.sunLight as any).intensity = tuning.lightIntensity;
    }

    // Request one frame render
    scene.requestRender();
  }

  private getBeatTuning(beatId: string): AtmosphereTuning {
    switch (beatId) {
      case 'BEAT_0_TIMOR_LAUNCH':
        // 08:00 Launch: Sun skimming horizon (1.5°). Vast ocean expanse with subtle horizon glow.
        return {
          fogDensity: 0.00008,
          fogMinBrightness: 0.22,
          fogMaxBrightness: 0.85,
          atmosphereHueShift: -0.02,
          atmosphereSaturationShift: -0.40,
          atmosphereBrightnessShift: -0.10,
          lightIntensity: 1.6,
        };

      case 'BEAT_1_BATHURST_WARNING':
        // 09:35 Bathurst Warning: Sun at 24° elevation. Tropical haze separates Melville/Bathurst from mainland.
        return {
          fogDensity: 0.00011,
          fogMinBrightness: 0.20,
          fogMaxBrightness: 0.88,
          atmosphereHueShift: -0.04,
          atmosphereSaturationShift: -0.42,
          atmosphereBrightnessShift: -0.12,
          lightIntensity: 1.8,
        };

      case 'BEAT_2_HARBOUR_STRIKE':
        // 09:58 First Bombs: Sun at 30° elevation from 96° azimuth.
        // Direct approach corridor from south-southeast into morning sun glare.
        return {
          fogDensity: 0.00012,
          fogMinBrightness: 0.18,
          fogMaxBrightness: 0.90,
          atmosphereHueShift: -0.05,
          atmosphereSaturationShift: -0.45,
          atmosphereBrightnessShift: -0.15,
          lightIntensity: 2.0,
        };

      case 'BEAT_3_POST_OFFICE':
        // 10:00 Civic Precinct: Clean, high-contrast overhead light on urban peninsula.
        return {
          fogDensity: 0.00014,
          fogMinBrightness: 0.17,
          fogMaxBrightness: 0.92,
          atmosphereHueShift: -0.05,
          atmosphereSaturationShift: -0.45,
          atmosphereBrightnessShift: -0.15,
          lightIntensity: 2.0,
        };

      case 'BEAT_4_PEARY_ATTACK':
        // 10:45 Channel Evasion: Sun at 41°. Bright channel water reflections, crisp boat track visibility.
        return {
          fogDensity: 0.00013,
          fogMinBrightness: 0.18,
          fogMaxBrightness: 0.90,
          atmosphereHueShift: -0.05,
          atmosphereSaturationShift: -0.45,
          atmosphereBrightnessShift: -0.14,
          lightIntensity: 2.1,
        };

      case 'BEAT_5_RAAF_AIRFIELD':
        // 12:00 Second Raid: Midday sun at 60° near-zenith. High-altitude perspective with stark ground contrast.
        return {
          fogDensity: 0.00009,
          fogMinBrightness: 0.20,
          fogMaxBrightness: 0.95,
          atmosphereHueShift: -0.06,
          atmosphereSaturationShift: -0.50,
          atmosphereBrightnessShift: -0.10,
          lightIntensity: 2.2,
        };

      case 'BEAT_6_PEARY_LOST':
        // 13:00 Peary Lost: Sun at 74°. Overhead tropical light, deep water absorption around wreck coordinates.
        return {
          fogDensity: 0.00014,
          fogMinBrightness: 0.16,
          fogMaxBrightness: 0.88,
          atmosphereHueShift: -0.05,
          atmosphereSaturationShift: -0.45,
          atmosphereBrightnessShift: -0.16,
          lightIntensity: 1.9,
        };

      case 'BEAT_7_RECKONING':
      case 'STATE_03_WHARF':
        // Dusk: Sun sinking to horizon (25° down to dusk). Somber, deep charcoal and naval twilight.
        return {
          fogDensity: 0.00015,
          fogMinBrightness: 0.14,
          fogMaxBrightness: 0.70,
          atmosphereHueShift: -0.02,
          atmosphereSaturationShift: -0.35,
          atmosphereBrightnessShift: -0.28,
          lightIntensity: 1.2,
        };

      default:
        // World Context & regional defaults
        return {
          fogDensity: 0.00010,
          fogMinBrightness: 0.18,
          fogMaxBrightness: 0.85,
          atmosphereHueShift: -0.05,
          atmosphereSaturationShift: -0.45,
          atmosphereBrightnessShift: -0.15,
          lightIntensity: 1.8,
        };
    }
  }

  public destroy(): void {
    this.isDestroyed = true;
  }
}

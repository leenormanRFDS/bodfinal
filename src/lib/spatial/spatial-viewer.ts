/**
 * THE BOMBING OF DARWIN — HISTORICAL SPATIAL ENGINE
 * Persistent Cesium Viewer Lifecycle Controller
 * 
 * Manages the single persistent Cesium instance for the Story chapter.
 * Implements lazy loading, WebGL checks, memory cleanup, request rendering, and headless choreographies.
 * Phase 1 Integration: Integrates HistoricalTimeController and SpatialAtmosphereController.
 */

import type * as CesiumType from 'cesium';
import { CameraChoreographer } from './camera-choreographer';
import { CartographyManager } from './cartography-manager';
import { SpatialEvidenceOverlay } from './spatial-evidence-overlay';
import { SpatialCoastlineOverlay } from './spatial-coastline-overlay';
import { HistoricalTimeController } from './historical-time-controller';
import { SpatialAtmosphereController } from './spatial-atmosphere-controller';
import type { SpatialFormationController } from './spatial-formation-controller';
import { DEMONSTRATION_STATES } from './spatial-config';
import type { 
  SpatialDemonstrationStateId, 
  SpatialViewerStatus, 
  SpatialEntityDefinition,
  HistoricalMapLayerDefinition 
} from './spatial-types';

export interface SpatialViewerOptions {
  container: HTMLElement;
  creditContainer?: HTMLElement;
  onStatusChange?: (status: SpatialViewerStatus) => void;
}

export class SpatialViewer {
  private static instance: SpatialViewer | null = null;
  private Cesium: typeof CesiumType | null = null;
  private viewer: CesiumType.Viewer | null = null;
  private choreographer: CameraChoreographer | null = null;
  private cartography: CartographyManager | null = null;
  private evidenceOverlay: SpatialEvidenceOverlay | null = null;
  private coastlineOverlay: SpatialCoastlineOverlay | null = null;
  private timeController: HistoricalTimeController | null = null;
  private atmosphereController: SpatialAtmosphereController | null = null;
  private container: HTMLElement;
  private creditContainer?: HTMLElement;
  private onStatusChange?: (status: SpatialViewerStatus) => void;
  private activeStateId: SpatialDemonstrationStateId = 'STATE_00_WORLD';
  private isDestroyed: boolean = false;
  private resizeObserver: ResizeObserver | null = null;

  // Future GLB & Historical Map Layer registry
  private registeredEntities: Map<string, SpatialEntityDefinition> = new Map();
  private registeredMapLayers: Map<string, HistoricalMapLayerDefinition> = new Map();

  private status: SpatialViewerStatus = {
    isSupported: true,
    isReady: false,
    activeStateId: 'STATE_00_WORLD',
    activeBeatIndex: -1,
    isFlying: false,
    isReducedMotion: false,
    activeAltitudeM: DEMONSTRATION_STATES['STATE_00_WORLD'].desktopCamera.altitudeM,
    errorMessage: null,
  };

  constructor(options: SpatialViewerOptions) {
    // If a prior instance was alive, destroy it immediately to avoid duplicate WebGL contexts
    if (SpatialViewer.instance && !SpatialViewer.instance.isDestroyed) {
      SpatialViewer.instance.destroy();
    }
    SpatialViewer.instance = this;
    if (typeof window !== 'undefined') {
      (window as any).__DARWIN_SPATIAL_VIEWER__ = this;
    }

    this.container = options.container;
    this.creditContainer = options.creditContainer;
    this.onStatusChange = options.onStatusChange;
  }

  public static getInstance(): SpatialViewer | null {
    return SpatialViewer.instance;
  }

  public static isWebGLSupported(): boolean {
    if (typeof window === 'undefined') return false;
    try {
      const canvas = document.createElement('canvas');
      return !!(
        window.WebGLRenderingContext && 
        (canvas.getContext('webgl') || canvas.getContext('experimental-webgl') || canvas.getContext('webgl2'))
      );
    } catch {
      return false;
    }
  }

  public async initialize(): Promise<boolean> {
    if (!SpatialViewer.isWebGLSupported()) {
      this.updateStatus({
        isSupported: false,
        isReady: false,
        errorMessage: 'WebGL is not supported or hardware acceleration is disabled.',
      });
      return false;
    }

    try {
      // Set Cesium base URL before importing so internal workers and assets resolve
      (window as any).CESIUM_BASE_URL = '/cesium/';

      // Dynamic import to keep initial landing page bundle lightweight
      const Cesium = await import('cesium');
      this.Cesium = Cesium;

      if (this.isDestroyed) return false;

      // Ensure Cesium stylesheet is injected if missing
      this.ensureStylesheet();

      // Configure clean viewer without default distracting UI
      const viewerOptions: any = {
        animation: false,
        baseLayerPicker: false,
        fullscreenButton: false,
        geocoder: false,
        homeButton: false,
        infoBox: false,
        sceneModePicker: false,
        selectionIndicator: false,
        timeline: false,
        navigationHelpButton: false,
        navigationInstructionsInitiallyVisible: false,
        scene3DOnly: true,
        shouldAnimate: false,
        useDefaultRenderLoop: true,
        targetFrameRate: 60,
        // Performance: Request rendering mode — render only when needed or during camera moves
        requestRenderMode: true,
        maximumRenderTimeChange: Infinity,
      };

      if (this.creditContainer) {
        viewerOptions.creditContainer = this.creditContainer;
      }

      this.viewer = new Cesium.Viewer(this.container, viewerOptions);

      // Adaptive resolution scaling for mobile vs desktop GPU budgets
      const isMobileInit = typeof window !== 'undefined' && window.innerWidth < 768;
      const dpr = typeof window !== 'undefined' ? (window.devicePixelRatio || 1.0) : 1.0;
      this.viewer.resolutionScale = isMobileInit ? Math.min(dpr, 1.25) : Math.min(dpr, 1.5);

      // Disable default double-click entity zoom
      if (this.viewer.cesiumWidget && this.viewer.cesiumWidget.screenSpaceEventHandler) {
        this.viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(
          Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK
        );
      }

      // Initialize controllers and managers
      this.timeController = new HistoricalTimeController(Cesium);
      this.atmosphereController = new SpatialAtmosphereController(Cesium, this.viewer, this.timeController);

      this.cartography = new CartographyManager(Cesium, this.viewer);
      this.choreographer = new CameraChoreographer(Cesium, this.viewer.camera, this.viewer.scene);
      this.evidenceOverlay = new SpatialEvidenceOverlay(Cesium, this.viewer);
      await this.evidenceOverlay.initialize();

      this.coastlineOverlay = new SpatialCoastlineOverlay(Cesium, this.viewer);
      await this.coastlineOverlay.initialize();

      // Set initial composition (State 00 World Context)
      const initialState = DEMONSTRATION_STATES[this.activeStateId];
      this.choreographer.transitionTo(initialState, { forceInstant: true });
      this.evidenceOverlay.setActiveState(this.activeStateId);
      this.coastlineOverlay.setActiveState(this.activeStateId);
      this.atmosphereController.applyBeatAtmosphere(this.activeStateId);

      // Handle fluid resize with dynamic resolution scaling
      this.resizeObserver = new ResizeObserver(() => {
        if (this.viewer && !this.viewer.isDestroyed()) {
          const isMobileNow = window.innerWidth < 768;
          const currentDpr = window.devicePixelRatio || 1.0;
          this.viewer.resolutionScale = isMobileNow ? Math.min(currentDpr, 1.25) : Math.min(currentDpr, 1.5);
          this.viewer.resize();
          this.cartography?.updateResponsiveExposure();
          if (this.choreographer && this.activeStateId && DEMONSTRATION_STATES[this.activeStateId]) {
            this.choreographer.updatePoseOnResize(DEMONSTRATION_STATES[this.activeStateId]);
          }
          this.viewer.scene.requestRender();
        }
      });
      this.resizeObserver.observe(this.container);

      this.updateStatus({
        isReady: true,
        isSupported: true,
        activeStateId: this.activeStateId,
        activeAltitudeM: this.choreographer.selectPose(initialState).altitudeM,
        isReducedMotion: this.choreographer.getIsReducedMotion(),
        errorMessage: null,
      });

      return true;
    } catch (err: any) {
      console.error('[SpatialViewer] Initialization failed:', err);
      this.updateStatus({
        isSupported: false,
        isReady: false,
        errorMessage: err?.message || 'Spatial Engine initialization failed.',
      });
      return false;
    }
  }

  private ensureStylesheet(): void {
    if (!document.querySelector('link[href*="Widgets/widgets.css"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = '/cesium/Widgets/widgets.css';
      document.head.appendChild(link);
    }
  }

  public transitionToState(stateId: SpatialDemonstrationStateId, forceInstant: boolean = false): void {
    if (!this.viewer || !this.choreographer) return;
    const targetState = DEMONSTRATION_STATES[stateId];
    if (!targetState) return;

    this.activeStateId = stateId;
    this.evidenceOverlay?.prepareTransition(stateId);
    this.coastlineOverlay?.setActiveState(stateId);
    this.cartography?.setBeatExposure(stateId);
    this.atmosphereController?.applyBeatAtmosphere(stateId);

    this.updateStatus({
      activeStateId: stateId,
      isFlying: !forceInstant && !this.choreographer.getIsReducedMotion(),
    });

    this.choreographer.transitionTo(targetState, {
      forceInstant,
      onComplete: () => {
        if (this.choreographer) {
          this.evidenceOverlay?.completeTransition(stateId);
          this.updateStatus({
            activeStateId: stateId,
            isFlying: false,
            activeAltitudeM: this.choreographer.selectPose(targetState).altitudeM,
          });
        }
      },
      onCancel: () => {
        this.evidenceOverlay?.cancelTransition();
        this.updateStatus({ isFlying: false });
      },
    });
  }

  /**
   * Future GLB Entity architecture readiness hook (Stage 1 readiness)
   */
  public registerSpatialEntity(entity: SpatialEntityDefinition): void {
    this.registeredEntities.set(entity.entityId, entity);
  }

  /**
   * Future Historical Map Layer architecture readiness hook (Stage 1 readiness)
   */
  public registerHistoricalMapLayer(layer: HistoricalMapLayerDefinition): void {
    this.registeredMapLayers.set(layer.layerId, layer);
  }

  private updateStatus(patch: Partial<SpatialViewerStatus>): void {
    this.status = { ...this.status, ...patch };
    this.onStatusChange?.(this.status);
  }

  public getStatus(): SpatialViewerStatus {
    return { ...this.status };
  }

  public getCartography(): CartographyManager | null {
    return this.cartography;
  }

  public getEvidenceOverlay(): SpatialEvidenceOverlay | null {
    return this.evidenceOverlay;
  }

  public getCoastlineOverlay(): SpatialCoastlineOverlay | null {
    return this.coastlineOverlay;
  }

  public getTimeController(): HistoricalTimeController | null {
    return this.timeController;
  }

  public getAtmosphereController(): SpatialAtmosphereController | null {
    return this.atmosphereController;
  }

  public getFormationController(): SpatialFormationController | null {
    return this.evidenceOverlay?.getFormationController() || null;
  }

  public destroy(): void {
    this.isDestroyed = true;

    if (this.atmosphereController) {
      this.atmosphereController.destroy();
      this.atmosphereController = null;
    }

    this.timeController = null;

    if (this.coastlineOverlay) {
      this.coastlineOverlay.destroy();
      this.coastlineOverlay = null;
    }

    if (this.evidenceOverlay) {
      this.evidenceOverlay.destroy();
      this.evidenceOverlay = null;
    }

    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    if (this.choreographer) {
      this.choreographer.destroy();
      this.choreographer = null;
    }

    if (this.cartography) {
      this.cartography.destroy();
      this.cartography = null;
    }

    if (this.viewer && !this.viewer.isDestroyed()) {
      this.viewer.destroy();
      this.viewer = null;
    }

    this.registeredEntities.clear();
    this.registeredMapLayers.clear();

    if (SpatialViewer.instance === this) {
      SpatialViewer.instance = null;
    }
    if (typeof window !== 'undefined' && (window as any).__DARWIN_SPATIAL_VIEWER__ === this) {
      (window as any).__DARWIN_SPATIAL_VIEWER__ = null;
    }
  }
}

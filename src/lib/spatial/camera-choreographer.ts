/**
 * THE BOMBING OF DARWIN — HISTORICAL SPATIAL ENGINE
 * Camera Choreographer
 * 
 * Executes deliberate, weighted camera transitions between geographic compositions.
 * Governed by the rhythm: SCROLL → TRANSITION → COMPOSITION → SETTLE → READ.
 * Strictly respects prefers-reduced-motion with instant/static compositions.
 * Integrated with CameraGrammar for authored flight curves and mobile focal protection.
 */

import type * as CesiumType from 'cesium';
import type { CameraPose, SpatialDemonstrationState } from './spatial-types';
import { CameraGrammar, AUTHORED_CAMERA_GRAMMAR } from './camera-grammar';

export interface CameraTransitionOptions {
  forceInstant?: boolean;
  onComplete?: () => void;
  onCancel?: () => void;
}

export class CameraChoreographer {
  private Cesium: typeof CesiumType;
  private camera: CesiumType.Camera;
  private scene: CesiumType.Scene;
  private grammar: CameraGrammar;
  private isReducedMotion: boolean = false;
  private activeTargetStateId: string | null = null;
  private isFlying: boolean = false;
  private mediaQueryList: MediaQueryList | null = null;
  private mediaQueryHandler: ((e: MediaQueryListEvent) => void) | null = null;

  constructor(Cesium: typeof CesiumType, camera: CesiumType.Camera, scene: CesiumType.Scene) {
    this.Cesium = Cesium;
    this.camera = camera;
    this.scene = scene;
    this.grammar = new CameraGrammar(Cesium);
    this.initReducedMotionListener();
  }

  private initReducedMotionListener(): void {
    if (typeof window !== 'undefined' && 'matchMedia' in window) {
      this.mediaQueryList = window.matchMedia('(prefers-reduced-motion: reduce)');
      this.isReducedMotion = this.mediaQueryList.matches;
      this.mediaQueryHandler = (e: MediaQueryListEvent) => {
        this.isReducedMotion = e.matches;
        if (this.isReducedMotion && this.isFlying) {
          this.cancelFlight();
        }
      };
      this.mediaQueryList.addEventListener('change', this.mediaQueryHandler);
    }
  }

  /**
   * Determine the appropriate camera pose according to viewport aspect ratio and width.
   * Leverages CameraGrammar for deterministic mobile focal lifting above narrative scrims.
   */
  public selectPose(state: SpatialDemonstrationState): CameraPose {
    if (typeof window === 'undefined') return state.desktopCamera;
    const w = window.innerWidth;
    const h = window.innerHeight;
    return this.grammar.resolvePose(state, w, h);
  }

  /**
   * Transition the camera to the specified demonstration state composition.
   */
  public transitionTo(
    state: SpatialDemonstrationState, 
    options: CameraTransitionOptions = {}
  ): void {
    const pose = this.selectPose(state);
    
    // Prevent redundant flights if already targeting this exact state
    if (this.activeTargetStateId === state.id && this.isFlying && !options.forceInstant) {
      return;
    }

    this.activeTargetStateId = state.id;

    const destination = this.Cesium.Cartesian3.fromDegrees(
      pose.longitude,
      pose.latitude,
      pose.altitudeM
    );

    const orientation = {
      heading: this.Cesium.Math.toRadians(pose.headingDeg),
      pitch: this.Cesium.Math.toRadians(pose.pitchDeg),
      roll: this.Cesium.Math.toRadians(pose.rollDeg),
    };

    // Instant cut if user prefers reduced motion or instant is forced
    if (this.isReducedMotion || options.forceInstant) {
      this.cancelFlight();
      this.camera.setView({
        destination,
        orientation,
      });
      this.scene.requestRender();
      options.onComplete?.();
      return;
    }

    if (this.isFlying) {
      this.camera.cancelFlight();
    }

    // Authored flight curve and duration from camera grammar
    const beatGrammar = AUTHORED_CAMERA_GRAMMAR[state.id];
    const durationSeconds = beatGrammar
      ? Math.max(1.8, beatGrammar.durationMs / 1000)
      : Math.max(1.8, (state.durationMs || 2400) / 1000);

    const easing = beatGrammar
      ? this.grammar.getEasing(beatGrammar.flightCurve)
      : this.Cesium.EasingFunction.CUBIC_IN_OUT;

    this.isFlying = true;
    this.camera.flyTo({
      destination,
      orientation,
      duration: durationSeconds,
      easingFunction: easing,
      complete: () => {
        this.isFlying = false;
        // Settle briefly, then request render to lock in stillness
        this.scene.requestRender();
        options.onComplete?.();
      },
      cancel: () => {
        this.isFlying = false;
        this.scene.requestRender();
        options.onCancel?.();
      },
    });
  }

  /**
   * Recalibrate camera pose when viewport aspect ratio / breakpoint changes while stationary.
   */
  public updatePoseOnResize(state: SpatialDemonstrationState): void {
    if (this.isFlying) return;
    const pose = this.selectPose(state);
    const destination = this.Cesium.Cartesian3.fromDegrees(
      pose.longitude,
      pose.latitude,
      pose.altitudeM
    );
    const orientation = {
      heading: this.Cesium.Math.toRadians(pose.headingDeg),
      pitch: this.Cesium.Math.toRadians(pose.pitchDeg),
      roll: this.Cesium.Math.toRadians(pose.rollDeg),
    };
    this.camera.setView({
      destination,
      orientation,
    });
    this.scene.requestRender();
  }

  public cancelFlight(): void {
    this.camera.cancelFlight();
    this.isFlying = false;
    this.scene.requestRender();
  }

  public getIsReducedMotion(): boolean {
    return this.isReducedMotion;
  }

  public destroy(): void {
    this.cancelFlight();
    if (this.mediaQueryList && this.mediaQueryHandler) {
      this.mediaQueryList.removeEventListener('change', this.mediaQueryHandler);
    }
    this.mediaQueryList = null;
    this.mediaQueryHandler = null;
  }
}

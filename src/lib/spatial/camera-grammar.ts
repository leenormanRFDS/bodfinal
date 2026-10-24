/**
 * THE BOMBING OF DARWIN — HISTORICAL SPATIAL ENGINE
 * Camera Grammar & Mobile Composition System
 * 
 * Defines authored camera movement parameters and deterministic mobile focal quadrant calculations.
 * Governed by the rhythm: SCROLL → TRANSITION → COMPOSITION → SETTLE → READ.
 * 
 * Architecture:
 * - Computes safe optical quadrants on mobile devices (< 768px portrait) so primary geographic subjects
 *   consistently sit in the unobscured upper 45% viewport above the narrative reading card.
 * - Enforces camera mass with weighted, non-game-like easing curves.
 */

import type * as CesiumType from 'cesium';
import type { CameraPose, SpatialDemonstrationState } from './spatial-types';

export interface AuthoredBeatGrammar {
  beatId: string;
  startingIdea: string;
  movementIntention: string;
  revealGoal: string;
  arrivalSettleMs: number;
  durationMs: number;
  flightCurve: 'COMPRESSION_S_CURVE' | 'WEIGHTED_DROP' | 'QUIET_GLIDE' | 'HORIZONTAL_ARC';
  /**
   * Latitude offset in degrees applied exclusively to portrait mobile (< 768px)
   * to shift the geographic focus up into the unobstructed upper 45% viewport zone.
   * Based on pitch and altitude geometry:
   * deltaLat ≈ (tan(pitch) * altitudeM) / 111,320m
   */
  mobileFocalLatOffsetDeg: number;
  mobileFocalLonOffsetDeg: number;
}

export const AUTHORED_CAMERA_GRAMMAR: Record<string, AuthoredBeatGrammar> = {
  BEAT_0_TIMOR_LAUNCH: {
    beatId: 'BEAT_0_TIMOR_LAUNCH',
    startingIdea: 'Vast, empty ocean expanse ~220 NM NNW of Darwin at dawn.',
    movementIntention: 'Descend from continental orbit into vast oceanic transit corridor; ocean feels immense, carrier launch ellipse is small but distinct.',
    revealGoal: 'Reveal the launch distance and the isolation of Northern Australia.',
    arrivalSettleMs: 300,
    durationMs: 2600,
    flightCurve: 'COMPRESSION_S_CURVE',
    mobileFocalLatOffsetDeg: 1.10, // Shifts focus north toward launch envelope
    mobileFocalLonOffsetDeg: 0.0,
  },

  BEAT_1_BATHURST_WARNING: {
    beatId: 'BEAT_1_BATHURST_WARNING',
    startingIdea: 'Rapid geographic compression from Timor Sea to Bathurst Island.',
    movementIntention: 'Accelerate forward along the attack transit axis; reveal Clarence Strait separating the islands from the mainland.',
    revealGoal: 'Frame Father McGrath’s mission at Nguiu and the 23-minute warning transmission corridor to Darwin.',
    arrivalSettleMs: 350,
    durationMs: 2400,
    flightCurve: 'COMPRESSION_S_CURVE',
    mobileFocalLatOffsetDeg: 0.13,
    mobileFocalLonOffsetDeg: 0.03,
  },

  BEAT_2_HARBOUR_STRIKE: {
    beatId: 'BEAT_2_HARBOUR_STRIKE',
    startingIdea: 'Final ingress across Beagle Gulf into Darwin Harbour.',
    movementIntention: 'Descend along the reconstructed 315°–345° approach corridor; camera aligns looking south-southeast into the morning sun azimuth.',
    revealGoal: 'Reveal the physical vulnerability of Darwin Harbour, the anchored fleet, and the morning sun geometry.',
    arrivalSettleMs: 400,
    durationMs: 2200,
    flightCurve: 'WEIGHTED_DROP',
    mobileFocalLatOffsetDeg: -0.027,
    mobileFocalLonOffsetDeg: 0.010,
  },

  BEAT_3_POST_OFFICE: {
    beatId: 'BEAT_3_POST_OFFICE',
    startingIdea: 'Scale collapse from harbour roadstead into the civic town grid.',
    movementIntention: 'Steep downward pitch over Bennett and Mitchell Streets; immediate dead stop on arrival.',
    revealGoal: 'Expose the intimate civilian ground reality: Post Office slit trench and civic perimeter.',
    arrivalSettleMs: 450,
    durationMs: 2000,
    flightCurve: 'WEIGHTED_DROP',
    mobileFocalLatOffsetDeg: -0.0105,
    mobileFocalLonOffsetDeg: 0.0025,
  },

  BEAT_4_PEARY_ATTACK: {
    beatId: 'BEAT_4_PEARY_ATTACK',
    startingIdea: 'Naval evasion in the narrow harbour channel.',
    movementIntention: 'Gentle horizontal arc around the channel manoeuvre corridor; reveal proximity to burning wharf.',
    revealGoal: 'Frame USS Peary’s high-speed evasive turns and vulnerability under repeated dive-bombing.',
    arrivalSettleMs: 350,
    durationMs: 2200,
    flightCurve: 'HORIZONTAL_ARC',
    mobileFocalLatOffsetDeg: 0.0065,
    mobileFocalLonOffsetDeg: 0.0060,
  },

  BEAT_5_RAAF_AIRFIELD: {
    beatId: 'BEAT_5_RAAF_AIRFIELD',
    startingIdea: 'Sudden vertical expansion to high-altitude bomber airspace (18,000–23,000 ft).',
    movementIntention: 'Launch camera upward to 34,000m altitude; look northwest across Beagle Gulf at Second Wave ingress.',
    revealGoal: 'Contrast the clinical, detached geometry of 54 twin-engine land bombers with the airfield below.',
    arrivalSettleMs: 400,
    durationMs: 2400,
    flightCurve: 'COMPRESSION_S_CURVE',
    mobileFocalLatOffsetDeg: -0.0180,
    mobileFocalLonOffsetDeg: 0.0100,
  },

  BEAT_6_PEARY_LOST: {
    beatId: 'BEAT_6_PEARY_LOST',
    startingIdea: 'Solemn descent to modern surveyed seabed coordinates.',
    movementIntention: 'Quiet, minimal movement settling above the 27m wreck coordinates in the channel.',
    revealGoal: 'Establish the surveyed position as a protected historic shipwreck and war grave.',
    arrivalSettleMs: 500,
    durationMs: 2000,
    flightCurve: 'QUIET_GLIDE',
    mobileFocalLatOffsetDeg: 0.0050,
    mobileFocalLonOffsetDeg: 0.0040,
  },

  BEAT_7_RECKONING: {
    beatId: 'BEAT_7_RECKONING',
    startingIdea: 'Evening perspective across the entire darkened harbour.',
    movementIntention: 'Slow, dignified pull-back framing Stokes Hill Wharf in the foreground with the 8 sunken vessel locations.',
    revealGoal: 'Anchor the timeless connection: Same wharf. Same sky. Eight ships lost.',
    arrivalSettleMs: 500,
    durationMs: 2400,
    flightCurve: 'QUIET_GLIDE',
    mobileFocalLatOffsetDeg: -0.0080,
    mobileFocalLonOffsetDeg: -0.0080,
  },
};

/**
 * Where the subject should sit on screen for each layout (normalised 0..1, y down).
 *  - desktop: the narrative column occupies roughly the left 12–42%; subject sits right of it.
 *  - mobile portrait: the reading card occupies the lower ~55%; subject sits in the clear upper band.
 */
export const LAYOUT_FOCAL: Record<'desktop' | 'tablet' | 'mobilePortrait' | 'mobileLandscape', [number, number]> = {
  desktop: [0.66, 0.5],
  tablet: [0.62, 0.46],
  mobilePortrait: [0.5, 0.28],
  mobileLandscape: [0.64, 0.46],
};

/**
 * Pure geometry, no Cesium dependency: place the camera so that a subject at (lon, lat, h),
 * viewed with heading H and pitch P from distance R, projects to the layout focal point.
 * Works in the subject's local East-North-Up frame (error < 1° at 100 km ranges).
 */
export function framedPose(
  frame: NonNullable<SpatialDemonstrationState['frame']>,
  layout: keyof typeof LAYOUT_FOCAL,
  vw: number,
  vh: number,
  fovRad: number
): CameraPose {
  const toRad = Math.PI / 180;
  const H = frame.headingDeg * toRad;
  const P = frame.pitchDeg * toRad;
  const range = frame.rangeM[layout] ?? (layout === 'mobileLandscape' ? frame.rangeM.desktop : frame.rangeM.tablet ?? frame.rangeM.desktop);
  const aspect = vw / Math.max(1, vh);
  // Cesium: frustum.fov spans the larger viewport dimension.
  const tanX = aspect >= 1 ? Math.tan(fovRad / 2) : Math.tan(fovRad / 2) * aspect;
  const tanY = aspect >= 1 ? Math.tan(fovRad / 2) / aspect : Math.tan(fovRad / 2);
  const [fx, fy] = LAYOUT_FOCAL[layout];
  const a = (2 * fx - 1) * tanX; // subject right of centre -> look left of it
  const b = (1 - 2 * fy) * tanY; // subject above centre -> look below it

  const dir = [Math.cos(P) * Math.sin(H), Math.cos(P) * Math.cos(H), Math.sin(P)];
  const right = [Math.cos(H), -Math.sin(H), 0];
  const up = [
    right[1] * dir[2] - right[2] * dir[1],
    right[2] * dir[0] - right[0] * dir[2],
    right[0] * dir[1] - right[1] * dir[0],
  ];
  const d = [0, 1, 2].map((i) => dir[i] + a * right[i] + b * up[i]);
  const n = Math.hypot(d[0], d[1], d[2]);
  const east = (-range * d[0]) / n;
  const north = (-range * d[1]) / n;
  const upM = (-range * d[2]) / n;

  const lat0 = frame.targetLat * toRad;
  const mPerDegLat = 111132.92 - 559.82 * Math.cos(2 * lat0) + 1.175 * Math.cos(4 * lat0);
  const mPerDegLon = 111412.84 * Math.cos(lat0) - 93.5 * Math.cos(3 * lat0);
  return {
    latitude: frame.targetLat + north / mPerDegLat,
    longitude: frame.targetLon + east / mPerDegLon,
    altitudeM: (frame.targetHeightM ?? 0) + upM,
    headingDeg: frame.headingDeg,
    pitchDeg: frame.pitchDeg,
    rollDeg: 0,
  };
}

export class CameraGrammar {
  private Cesium: typeof CesiumType;

  constructor(Cesium: typeof CesiumType) {
    this.Cesium = Cesium;
  }

  /**
   * Resolves responsive camera pose for a state, applying deterministic mobile focal lifting.
   */
  public resolvePose(
    state: SpatialDemonstrationState,
    viewportWidth: number,
    viewportHeight: number,
    fovRad: number = Math.PI / 3
  ): CameraPose {
    const isMobilePortrait = viewportWidth < 768 && viewportHeight >= viewportWidth;
    const isTablet = viewportWidth >= 768 && viewportWidth < 1100;
    const isMobileLandscape = viewportWidth < 1024 && viewportWidth > viewportHeight;

    if (state.frame) {
      const layout = viewportWidth >= 1100 ? 'desktop' : isMobilePortrait ? 'mobilePortrait' : isMobileLandscape ? 'mobileLandscape' : 'tablet';
      return framedPose(state.frame, layout, viewportWidth, viewportHeight, fovRad);
    }

    if (viewportWidth >= 1100) {
      return state.desktopCamera;
    }

    if (isTablet) {
      return state.tabletCamera || state.desktopCamera;
    }

    if (isMobileLandscape) {
      return state.mobileLandscapeCamera || state.desktopCamera;
    }

    // Default mobile portrait (< 768px):
    // Use authored mobilePortraitCamera base, and check grammar for calibrated focal lifting
    const basePose = state.mobilePortraitCamera || state.tabletCamera || state.desktopCamera;
    const grammar = AUTHORED_CAMERA_GRAMMAR[state.id];

    if (!grammar) {
      return basePose;
    }

    return {
      ...basePose,
      latitude: basePose.latitude,
      longitude: basePose.longitude,
      altitudeM: basePose.altitudeM,
      headingDeg: basePose.headingDeg,
      pitchDeg: basePose.pitchDeg,
      rollDeg: basePose.rollDeg,
    };
  }

  /**
   * Returns easing function corresponding to the authored flight curve.
   */
  public getEasing(curve: AuthoredBeatGrammar['flightCurve']): (time: number) => number {
    const Cesium = this.Cesium;
    switch (curve) {
      case 'COMPRESSION_S_CURVE':
        return Cesium.EasingFunction.CUBIC_IN_OUT;
      case 'WEIGHTED_DROP':
        return Cesium.EasingFunction.QUINTIC_IN_OUT;
      case 'HORIZONTAL_ARC':
        return Cesium.EasingFunction.SINUSOIDAL_IN_OUT;
      case 'QUIET_GLIDE':
      default:
        return Cesium.EasingFunction.QUADRATIC_IN_OUT;
    }
  }
}

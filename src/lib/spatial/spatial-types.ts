/**
 * THE BOMBING OF DARWIN — HISTORICAL SPATIAL ENGINE
 * Spatial Types & Architecture Contracts
 * 
 * Governed by EXPERIENCE & TECHNOLOGY authorities.
 * Adheres to AGENTS.md, docs/SPATIAL_ENGINE.md, and skills/spatial-story/SKILL.md.
 */

export type HistoricalClassification = 
  | 'PRIMARY_SOURCE'
  | 'ARCHIVAL_MATERIAL'
  | 'ESTABLISHED_FACT'
  | 'HISTORICAL_INTERPRETATION'
  | 'INFERENCE'
  | 'DIGITAL_RECONSTRUCTION'
  | 'RECONSTRUCTION_PARAMETER'
  | 'MODERN_SURVEYED_WRECK_POSITION'
  | 'UNRESOLVED_GEOGRAPHY';

export type SpatialCertainty = 'VERIFIED' | 'APPROXIMATE' | 'INFERRED' | 'UNKNOWN' | 'UNRESOLVED';

export type TemporalContext = 'CONTEMPORARY' | 'HISTORICAL_1942' | 'UNRESOLVED';

export interface GeographicCoordinate {
  latitude: number;
  longitude: number;
  altitudeM: number;
}

export interface CameraPose {
  latitude: number;
  longitude: number;
  altitudeM: number;
  headingDeg: number;
  pitchDeg: number;
  rollDeg: number;
}

export type SpatialDemonstrationStateId = 
  | 'STATE_00_WORLD'
  | 'STATE_01_NORTH'
  | 'STATE_02_DARWIN'
  | 'STATE_03_WHARF'
  | 'BEAT_0_TIMOR_LAUNCH'
  | 'BEAT_1_BATHURST_WARNING'
  | 'BEAT_2_HARBOUR_STRIKE'
  | 'BEAT_3_POST_OFFICE'
  | 'BEAT_4_PEARY_ATTACK'
  | 'BEAT_5_RAAF_AIRFIELD'
  | 'BEAT_6_PEARY_LOST'
  | 'BEAT_7_RECKONING';

export type SpatialCameraStateId = SpatialDemonstrationStateId;

export interface SpatialDemonstrationState {
  id: SpatialDemonstrationStateId;
  index: number;
  code: string;
  label: string;
  geographicScope: string;
  purpose: string;
  canonicalLocationEntityId?: string;
  temporalContext: TemporalContext;
  desktopCamera: CameraPose;
  tabletCamera: CameraPose;
  mobilePortraitCamera: CameraPose;
  mobileLandscapeCamera: CameraPose;
  durationMs: number;
  classification: HistoricalClassification;
  confidence: SpatialCertainty;
  notes: string;
  humanClassification?: string;
  humanConfidence?: string;
  sourceInstitutions?: string[];
  evidentialNuance?: string;
  historicalTimestamp?: string;
}

export interface StoryBeatSpatialPayload {
  beatId: string;
  historicalTime: string;
  cameraPreset?: SpatialDemonstrationStateId | string;
  cameraDestination?: GeographicCoordinate;
  cameraTarget?: GeographicCoordinate;
  heading?: number;
  pitch?: number;
  roll?: number;
  altitude?: number;
  transitionDuration?: number;
  transitionMode?: 'CINEMATIC_FLIGHT' | 'STATIC_COMPOSITION' | 'INSTANT_CUT';
  visibleLayerIds?: string[];
  visibleEntityIds?: string[];
  aircraftFormationIds?: string[];
  vesselIds?: string[];
  highlightedLocationIds?: string[];
  archiveLayerIds?: string[];
  annotationState?: Record<string, unknown>;
  confidence?: SpatialCertainty;
  reducedMotionPreset?: string;
}

/**
 * Future Entity / GLB Architecture contracts (Stage 1 readiness)
 */
export interface SpatialEntityDefinition {
  entityId: string;
  entityType: 'AIRCRAFT' | 'VESSEL' | 'LANDMARK' | 'FORMATION';
  assetPath: string;
  lodLevels: {
    heroDistanceM: number;
    mediumDistanceM: number;
    impostorDistanceM: number;
  };
  instanced: boolean;
  scale: number;
  coordinates: GeographicCoordinate;
  orientation: { heading: number; pitch: number; roll: number };
  historicalTime: string;
  sourceRefs: string[];
  confidence: SpatialCertainty;
}

/**
 * Future Historical Map / Layer Architecture contracts (Stage 1 readiness)
 */
export interface HistoricalMapLayerDefinition {
  layerId: string;
  label: string;
  epoch: '1942' | 'CONTEMPORARY';
  archiveSourceId: string;
  bounds: {
    west: number;
    south: number;
    east: number;
    north: number;
  };
  tileUrlOrAsset: string;
  opacity: number;
  blendMode: string;
  classification: HistoricalClassification;
}

export interface SpatialViewerStatus {
  isSupported: boolean;
  isReady: boolean;
  activeStateId: SpatialDemonstrationStateId;
  activeBeatIndex: number;
  isFlying: boolean;
  isReducedMotion: boolean;
  activeAltitudeM: number;
  errorMessage: string | null;
}

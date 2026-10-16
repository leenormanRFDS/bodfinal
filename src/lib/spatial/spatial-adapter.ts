/**
 * THE BOMBING OF DARWIN — HISTORICAL SPATIAL ENGINE
 * Spatial State Adapter
 * 
 * Translates narrative progression into spatial state transitions.
 * Governed strictly by the architectural hierarchy:
 * StoryStateController → active story beat → spatial preset → CameraChoreographer → Cesium Viewer.
 * Scroll does NOT interpolate or invent continuous geographic coordinates.
 */

import { DEMONSTRATION_STATES, mapBeatIndexToDemoState } from './spatial-config';
import type { 
  SpatialDemonstrationState, 
  SpatialDemonstrationStateId 
} from './spatial-types';

export interface StoryBeatLike {
  id: string;
  spatial?: {
    cameraPreset?: string;
  };
}

export type SpatialStateListener = (state: {
  activeStateId: SpatialDemonstrationStateId;
  stateConfig: SpatialDemonstrationState;
  sourceBeatIndex: number;
  forceInstant?: boolean;
}) => void;

export class SpatialStateAdapter {
  private activeStateId: SpatialDemonstrationStateId = 'STATE_00_WORLD';
  private activeBeatIndex: number = -1;
  private listeners: SpatialStateListener[] = [];
  private beats: StoryBeatLike[] = [];

  constructor(beats: StoryBeatLike[] = []) {
    this.beats = beats;
  }

  public setBeats(beats: StoryBeatLike[]): void {
    this.beats = beats;
  }

  public subscribe(listener: SpatialStateListener): () => void {
    this.listeners.push(listener);
    // Immediately inform subscriber of current state
    listener({
      activeStateId: this.activeStateId,
      stateConfig: DEMONSTRATION_STATES[this.activeStateId],
      sourceBeatIndex: this.activeBeatIndex,
      forceInstant: true,
    });

    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Authoritative entry point called by StoryStateController subscription.
   * Derives camera preset strictly from the authored story beat presets.
   * Uses anticipatoryIndex to initiate camera movement ~20-30vh before the editorial card locks.
   */
  public onStoryStateChange(activeIndex: number, inTimeline: boolean, anticipatoryIndex?: number): void {
    this.activeBeatIndex = activeIndex;

    if (!inTimeline || (activeIndex < 0 && (anticipatoryIndex === undefined || anticipatoryIndex < 0))) {
      if (this.activeStateId !== 'STATE_00_WORLD') {
        this.setState('STATE_00_WORLD');
      }
      return;
    }

    // Target index is the anticipatory beat if available, otherwise activeIndex
    const targetIndex = (anticipatoryIndex !== undefined && anticipatoryIndex >= 0)
      ? anticipatoryIndex
      : Math.max(0, activeIndex);

    // Check if the authored beat specifies an explicit valid camera preset
    let targetStateId: SpatialDemonstrationStateId;
    const authoredBeat = this.beats[targetIndex];
    const authoredPreset = authoredBeat?.spatial?.cameraPreset;

    if (authoredPreset && authoredPreset in DEMONSTRATION_STATES) {
      targetStateId = authoredPreset as SpatialDemonstrationStateId;
    } else {
      targetStateId = mapBeatIndexToDemoState(targetIndex);
    }

    if (targetStateId !== this.activeStateId) {
      this.setState(targetStateId);
    }
  }

  /**
   * Set target state and dispatch to all listeners.
   */
  public setState(stateId: SpatialDemonstrationStateId, forceInstant: boolean = false): void {
    this.activeStateId = stateId;
    const stateConfig = DEMONSTRATION_STATES[stateId];

    for (const listener of this.listeners) {
      listener({
        activeStateId: stateId,
        stateConfig,
        sourceBeatIndex: this.activeBeatIndex,
        forceInstant,
      });
    }
  }

  public getActiveState(): SpatialDemonstrationState {
    return DEMONSTRATION_STATES[this.activeStateId];
  }

  public getActiveStateId(): SpatialDemonstrationStateId {
    return this.activeStateId;
  }

  public destroy(): void {
    this.listeners = [];
  }
}

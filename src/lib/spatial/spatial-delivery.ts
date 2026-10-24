/**
 * THE BOMBING OF DARWIN — HISTORICAL SPATIAL ENGINE
 * Delivery: device tier, beat poster stills, beat tile prefetch.
 *
 * Why this exists
 *   The live map needs ~1.3 MB of engine code, a WebGL context and ~100–150 tiles per beat
 *   before it can draw anything. On a phone that is seconds of empty stage. Every beat has a
 *   fixed, authored camera, so each beat can also be shown as a still rendered by the SAME
 *   engine (scripts/capture-spatial.mjs --posters). Stills give the stage an image within a
 *   few hundred milliseconds; the live map cross-fades in once it has arrived at the same beat
 *   with its tiles loaded. Devices that should not run WebGL (no support, data saver, very low
 *   memory, or ?map=static) stay on the stills, which change with the story.
 *
 *   The stills are renders of the engine, not separate artwork: same cartography, same canon
 *   positions, same labels. Re-render them whenever a beat changes (see SHIP_STATUS / CLAUDE.md).
 */

import posterManifest from './poster-manifest.json';
import beatTiles from './beat-tiles.json';
import { basemapTileUrl } from './cartography-manager';
import { ORDERED_BEAT_STATE_IDS } from './spatial-config';
import type { SpatialDemonstrationStateId } from './spatial-types';

export type SpatialTier = 'live' | 'static';
export type PosterLayout = 'desktop' | 'mobile';

interface PosterManifest {
  version: string;
  layouts: Record<PosterLayout, { width: number; height: number; focal: [number, number] }>;
  beats: number[];
}
const posters = posterManifest as unknown as PosterManifest;
const tilesByLayout = beatTiles as unknown as { layouts?: Record<PosterLayout, Record<string, [number, number, number][]>> };

/** Which experience this device gets. Live unless there is a concrete reason not to run WebGL. */
export function detectSpatialTier(webglSupported: boolean): SpatialTier {
  if (typeof window === 'undefined') return 'static';
  try {
    const forced = new URLSearchParams(window.location.search).get('map');
    if (forced === 'static') return 'static';
    if (forced === 'live') return webglSupported ? 'live' : 'static';
  } catch { /* ignore */ }
  if (!webglSupported) return 'static';
  const nav = navigator as any;
  if (nav.connection?.saveData) return 'static';
  // deviceMemory is Chromium-only and coarse (0.25–8). ≤1 GB devices cannot hold the globe comfortably.
  if (typeof nav.deviceMemory === 'number' && nav.deviceMemory <= 1) return 'static';
  return 'live';
}

export function posterLayoutFor(width: number): PosterLayout {
  return width < 768 ? 'mobile' : 'desktop';
}

export function beatIndexForState(stateId: SpatialDemonstrationStateId): number {
  return ORDERED_BEAT_STATE_IDS.indexOf(stateId);
}

function posterUrl(layout: PosterLayout, beat: number): string {
  return `/spatial-posters/${layout}/beat${beat}.webp?v=${posters.version}`;
}

/**
 * Two stacked <img> layers inside [data-spatial-poster]; swapping beats cross-fades between them.
 * The poster sits above the live canvas and is released (faded out) once the live map is ready
 * at the same beat.
 */
export class SpatialPosterController {
  private root: HTMLElement;
  private layers: HTMLImageElement[];
  private front = 0;
  private currentBeat = -1;
  private layout: PosterLayout;
  private released = false;
  private resizeTimer: number | undefined;

  constructor(root: HTMLElement) {
    this.root = root;
    this.layers = Array.from(root.querySelectorAll<HTMLImageElement>('img'));
    this.layout = posterLayoutFor(window.innerWidth);
    this.applyFocal();
    window.addEventListener('resize', () => {
      window.clearTimeout(this.resizeTimer);
      this.resizeTimer = window.setTimeout(() => {
        const next = posterLayoutFor(window.innerWidth);
        if (next !== this.layout) {
          this.layout = next;
          this.applyFocal();
          const b = this.currentBeat;
          this.currentBeat = -1;
          if (b >= 0) this.show(b);
        }
      }, 200);
    });
  }

  public isAvailable(): boolean {
    return this.layers.length === 2 && posters.beats.length > 0;
  }

  /** Keep the subject where the live camera puts it: object-position = the layout's focal point. */
  private applyFocal(): void {
    const f = posters.layouts[this.layout]?.focal ?? [0.5, 0.5];
    for (const img of this.layers) img.style.objectPosition = `${f[0] * 100}% ${f[1] * 100}%`;
  }

  public show(beat: number): void {
    if (!this.isAvailable() || this.released) return;
    const b = posters.beats.includes(beat) ? beat : posters.beats[0];
    if (b === this.currentBeat) return;
    this.currentBeat = b;
    const back = this.layers[1 - this.front];
    const front = this.layers[this.front];
    const url = posterUrl(this.layout, b);
    const reveal = () => {
      if (this.currentBeat !== b) return; // superseded while loading
      back.classList.add('is-on');
      front.classList.remove('is-on');
      this.front = 1 - this.front;
      this.root.classList.add('is-visible');
    };
    if (back.getAttribute('src') === url && back.complete) {
      reveal();
    } else {
      back.onload = reveal;
      back.src = url;
    }
  }

  /** Live map is drawing this beat: fade the poster out and stop swapping. */
  public release(): void {
    if (this.released) return;
    this.released = true;
    this.root.classList.add('is-released');
    window.setTimeout(() => {
      this.root.classList.remove('is-visible');
      for (const img of this.layers) img.removeAttribute('src');
    }, 900);
  }

  /** Warm the cache for the beat a visitor is about to reach (static tier). */
  public preload(beat: number): void {
    if (!posters.beats.includes(beat)) return;
    const img = new Image();
    img.decoding = 'async';
    img.src = posterUrl(this.layout, beat);
  }
}

/**
 * Prefetches the basemap tiles the authored camera of a beat will request, so the live map
 * finds them in the HTTP cache (tiles are immutable-cached). Lists are recorded per layout by
 * scripts/capture-spatial.mjs. Skipped under data saver.
 */
export class BeatTilePrefetcher {
  private done = new Set<string>();
  private layout: PosterLayout;

  constructor() {
    this.layout = posterLayoutFor(window.innerWidth);
  }

  public prefetch(beat: number): void {
    const nav = navigator as any;
    if (nav.connection?.saveData) return;
    const key = `${this.layout}:${beat}`;
    if (this.done.has(key)) return;
    const list = tilesByLayout.layouts?.[this.layout]?.[String(beat)];
    if (!list?.length) return;
    this.done.add(key);
    // A few at a time, low priority, so the live map's own requests stay ahead.
    const queue = list.map(([z, x, y]) => basemapTileUrl(z, x, y));
    const worker = async () => {
      while (queue.length) {
        const url = queue.shift()!;
        try { await fetch(url, { priority: 'low' } as RequestInit); } catch { /* best effort */ }
      }
    };
    for (let i = 0; i < 4; i++) worker();
  }
}

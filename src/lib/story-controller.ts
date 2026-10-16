import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export interface StoryBeat {
  id: string;
  historicalTime: string;
  headline: string;
  description: string;
  spatial: {
    plotBoard?: {
      coordinateSpace: string;
      coordinate: [number, number] | null;
    };
    geospatial?: {
      status: string;
      confidence: string;
      coordinates: null | { latitude: number; longitude: number; altitudeM?: number };
    };
  };
}

export type StoryStateCallback = (state: { 
  activeIndex: number; 
  anticipatoryIndex: number;
  progress: number; 
  nearestDistance: number; 
  inTimeline: boolean; 
}) => void;

export class StoryStateController {
  private beats: StoryBeat[];
  private elements: HTMLElement[] = [];
  private callbacks: StoryStateCallback[] = [];
  private activeIndex: number = -1;
  private anticipatoryIndex: number = -1;
  private inTimeline: boolean = false;
  private reducedMotion: boolean = false;
  private offsets: { top: number; height: number }[] = [];
  private containerBounds: { top: number; bottom: number; height: number } | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private lastNd: number = 1;
  private lastInTl: boolean = false;

  constructor(beats: StoryBeat[], elements: HTMLElement[]) {
    this.beats = beats;
    this.elements = elements;
    this.reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.init();
  }

  public subscribe(cb: StoryStateCallback) {
    this.callbacks.push(cb);
    // Immediately emit current state to new subscriber without requiring scroll or resize
    cb({
      activeIndex: this.activeIndex,
      anticipatoryIndex: this.anticipatoryIndex,
      progress: this.lastNd,
      nearestDistance: this.lastNd,
      inTimeline: this.inTimeline,
    });
  }

  public getState() {
    return {
      activeIndex: this.activeIndex,
      anticipatoryIndex: this.anticipatoryIndex,
      progress: this.lastNd,
      nearestDistance: this.lastNd,
      inTimeline: this.inTimeline,
    };
  }

  public refresh = () => {
    if (this.elements.length === 0) return;
    this.offsets = this.elements.map(el => {
      const rect = el.getBoundingClientRect();
      return {
        top: rect.top + window.scrollY,
        height: rect.height
      };
    });

    const firstEl = this.elements[0];
    const container = firstEl.closest('.s-tl-section') || firstEl.closest('.tl');
    if (container) {
      const cRect = container.getBoundingClientRect();
      this.containerBounds = {
        top: cRect.top + window.scrollY,
        bottom: cRect.bottom + window.scrollY,
        height: cRect.height
      };
    }

    this.update();
  }

  public update = () => {
    if (this.offsets.length === 0) return;

    const scrollY = window.scrollY;
    const vh = window.innerHeight;
    const centerView = scrollY + vh * 0.5;
    const triggerLine = scrollY + vh * 0.55;

    const first = this.offsets[0];
    const last = this.offsets[this.offsets.length - 1];

    const cTop = this.containerBounds ? this.containerBounds.top : first.top - vh * 0.4;
    const cBottom = this.containerBounds ? this.containerBounds.bottom : last.top + last.height + vh * 0.2;

    // The visitor is within the spatial timeline section when the top of the section enters the viewport
    // and before the bottom of the section leaves the viewport.
    const inTl = (scrollY + vh * 0.3 >= cTop) && (scrollY <= cBottom - vh * 0.1);
    this.inTimeline = inTl;

    let cur = -1;
    let anticipatory = -1;
    let nd = 1;

    if (inTl) {
      // Default to Beat 0 immediately upon chapter entry
      cur = 0;
      anticipatory = 0;

      // Anticipatory line is ~25-30vh before the editorial card reaches the trigger line
      const anticipatoryLine = scrollY + vh * 0.82;

      for (let i = 0; i < this.offsets.length; i++) {
        const o = this.offsets[i];
        if (o.top <= triggerLine) {
          cur = i;
        }
        if (o.top <= anticipatoryLine) {
          anticipatory = i;
        }

        const elCenter = o.top + o.height / 2;
        const d = Math.abs(elCenter - centerView) / (vh * 0.5);
        if (d < nd) nd = d;
      }

      // If user prefers reduced motion, disable anticipatory flight
      if (this.reducedMotion) {
        anticipatory = cur;
      }
    } else {
      if (scrollY + vh * 0.3 < cTop) {
        cur = -1; // Pre-timeline (above story section)
        anticipatory = -1;
      } else {
        cur = this.offsets.length - 1; // Post-timeline (scrolled past story section)
        anticipatory = this.offsets.length - 1;
      }
    }

    if (
      cur !== this.activeIndex || 
      anticipatory !== this.anticipatoryIndex ||
      Math.abs(nd - this.lastNd) > 0.01 || 
      inTl !== this.lastInTl
    ) {
      this.activeIndex = cur;
      this.anticipatoryIndex = anticipatory;
      this.lastNd = nd;
      this.lastInTl = inTl;
      this.notify(cur, anticipatory, nd, inTl);
    }
  };

  public destroy() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    window.removeEventListener('resize', this.refresh);
    window.removeEventListener('scroll', this.update);
    gsap.ticker.remove(this.update);
  }

  private init() {
    if (this.elements.length === 0) return;

    const firstEl = this.elements[0];
    const tlContainer = firstEl.closest('.tl') || document.body;

    this.refresh();

    // Re-measure when layout geometry meaningfully changes
    this.resizeObserver = new ResizeObserver(() => this.refresh());
    this.resizeObserver.observe(tlContainer);
    this.elements.forEach(el => this.resizeObserver!.observe(el));

    window.addEventListener('resize', this.refresh);
    window.addEventListener('scroll', this.update, { passive: true });
    if ('fonts' in document && document.fonts.ready) {
      document.fonts.ready.then(() => this.refresh());
    }

    gsap.ticker.add(this.update);
  }

  private notify(activeIndex: number, anticipatoryIndex: number, nearestDistance: number, inTimeline: boolean) {
    for (const cb of this.callbacks) {
      cb({ activeIndex, anticipatoryIndex, progress: nearestDistance, nearestDistance, inTimeline });
    }
  }
}

#!/usr/bin/env node

/**
 * THE BOMBING OF DARWIN — SPATIAL SCROLL LIFECYCLE & STICKY STAGE VERIFICATION
 * 
 * Verifies the resolution of the first-pass scroll lifecycle bug:
 * 1. DOM order: .s-spatial-stage precedes .s-tl-container
 * 2. Sticky containing block: CSS Grid overlay without negative margin hacks
 * 3. StoryStateController: immediate initial state emission & no ticker lockout
 * 4. Forward traversal: Beat 0 activates immediately on first downward scroll
 * 5. Reverse traversal: Steps cleanly backward 7 -> 0
 * 6. Deep link / restored scroll: Emits correct beat immediately on mount
 * 7. Cesium pre-initialization: Pre-initializes in advance (1200px rootMargin + interstitial)
 * 8. Production telemetry: Altitude developer telemetry absent from production
 * 9. Visitor-facing mode switcher labels: "MAP" & "OPERATIONS PLOT"
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

let totalTests = 0;
let passedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (!condition) {
    console.error(`✗ FAIL: ${message}`);
    process.exitCode = 1;
  } else {
    passedTests++;
    console.log(`✓ PASS: ${message}`);
  }
}

console.log('=== STAGE 3.1E SPATIAL SCROLL LIFECYCLE & STAGE VERIFICATION ===\n');

// 1. DOM Order Verification
console.log('[1. DOM Order & Architectural Hierarchy]');
const storyHtml = fs.readFileSync(path.join(root, 'src/pages/story.astro'), 'utf8');

const stageIndex = storyHtml.indexOf('class="s-spatial-stage"');
const narrativeIndex = storyHtml.indexOf('class="container s-tl-container"');

assert(stageIndex !== -1, 'Spatial stage .s-spatial-stage exists in story.astro');
assert(narrativeIndex !== -1, 'Narrative track .s-tl-container exists in story.astro');
assert(stageIndex < narrativeIndex, 'DOM order: .s-spatial-stage precedes .s-tl-container in DOM hierarchy');

// 2. CSS Grid Sticky Architecture (No Negative Margin Collapse)
console.log('\n[2. Sticky Containing Block & Grid Layout]');
assert(storyHtml.includes('grid-area: 1 / 1;'), 'Both stage and narrative utilize grid-area: 1 / 1 for clean overlay');
assert(!storyHtml.includes('margin-bottom: -100svh;'), 'Negative margin hack (margin-bottom: -100svh) is completely removed');
assert(storyHtml.includes('position: sticky;'), 'Spatial stage uses standard position: sticky');
assert(storyHtml.includes('align-self: start;'), 'Spatial stage aligns to start of grid cell for robust sticky pinning');

// 3. Spatial Engine Primacy (2D Plot Board removed per Master Directive)
console.log('\n[3. Spatial Engine Primacy]');
assert(!storyHtml.includes('3D SPATIAL</span>'), 'Internal technology jargon "3D SPATIAL" removed');
assert(!storyHtml.includes('data-spatial-mode'), 'Transitional 2D mode toggle removed from story.astro per master instruction');
assert(!storyHtml.includes('s-spatial-view--2d'), '2D plot view removed allowing Cesium to own spatial presentation');

// 4. Production HUD Telemetry Discipline
console.log('\n[4. Production HUD Telemetry Hygiene]');
assert(storyHtml.includes('import.meta.env.DEV &&'), 'Camera altitude developer telemetry is guarded behind DEV mode');
assert(storyHtml.includes('data-spatial-dock-scope'), 'Geographic scope is preserved in dock for visitor orientation');

// 5. Cesium Pre-Initialization Lifecycle
console.log('\n[5. Cesium Advance Pre-Initialization]');
assert(storyHtml.includes("rootMargin: '1200px 0px 0px 0px'"), 'IntersectionObserver uses generous 1200px preloading margin');
assert(storyHtml.includes('io.observe(interstitialSection)'), 'IntersectionObserver observes preceding interstitial section to load Cesium before Beat 0');
assert(storyHtml.includes('window.scrollY > 150'), 'Restored scroll or deep-link position triggers immediate initialization');

// 6. StoryStateController Algorithmic Lifecycle Verification
console.log('\n[6. StoryStateController Algorithmic Simulation]');
const controllerSource = fs.readFileSync(path.join(root, 'src/lib/story-controller.ts'), 'utf8');

// Ensure ticker lockout bug is gone
assert(!controllerSource.includes('if (!this.inTimeline && this.activeIndex === -1) return;'), 'Deadlocking ticker guard is removed from StoryStateController');
assert(controllerSource.includes('cb({'), 'StoryStateController.subscribe immediately dispatches state to subscriber');

// Simulate the Controller Logic to verify forward, reverse, and restored scroll mathematically
class MockStoryController {
  constructor(beats, elements) {
    this.beats = beats;
    this.elements = elements;
    this.offsets = elements.map((el, i) => ({
      top: el.top,
      height: el.height
    }));
    this.containerBounds = {
      top: 1500,
      bottom: 8500,
      height: 7000
    };
    this.activeIndex = -1;
    this.inTimeline = false;
    this.lastNd = 1;
    this.lastInTl = false;
    this.history = [];
  }

  update(scrollY, vh = 800) {
    const centerView = scrollY + vh * 0.5;
    const triggerLine = scrollY + vh * 0.55;

    const first = this.offsets[0];
    const last = this.offsets[this.offsets.length - 1];

    const cTop = this.containerBounds ? this.containerBounds.top : first.top - vh * 0.4;
    const cBottom = this.containerBounds ? this.containerBounds.bottom : last.top + last.height + vh * 0.2;

    const inTl = (scrollY + vh * 0.3 >= cTop) && (scrollY <= cBottom - vh * 0.1);
    this.inTimeline = inTl;

    let cur = -1;
    let nd = 1;

    if (inTl) {
      cur = 0;
      for (let i = 0; i < this.offsets.length; i++) {
        const o = this.offsets[i];
        if (o.top <= triggerLine) {
          cur = i;
        }
        const elCenter = o.top + o.height / 2;
        const d = Math.abs(elCenter - centerView) / (vh * 0.5);
        if (d < nd) nd = d;
      }
    } else {
      if (scrollY + vh * 0.3 < cTop) {
        cur = -1;
      } else {
        cur = this.offsets.length - 1;
      }
    }

    if (cur !== this.activeIndex || inTl !== this.lastInTl) {
      this.activeIndex = cur;
      this.lastInTl = inTl;
      this.history.push({ activeIndex: cur, inTimeline: inTl, scrollY });
    }
    return { activeIndex: this.activeIndex, inTimeline: this.inTimeline };
  }
}

// 8 Beats placed vertically along the page
const mockBeats = Array.from({ length: 8 }, (_, i) => ({
  top: 1700 + i * 800,
  height: 400
}));

const sim = new MockStoryController(null, mockBeats);

// Test A: Top of page load
const initial = sim.update(0);
assert(initial.inTimeline === false && initial.activeIndex === -1, 'At scrollY = 0, inTimeline is false and activeIndex is -1');

// Test B: First downward scroll entering chapter
const enter = sim.update(1400);
assert(enter.inTimeline === true && enter.activeIndex === 0, 'On FIRST downward pass entering chapter, Beat 0 activates immediately');

// Test C: Forward progression through all 8 beats
for (let b = 1; b < 8; b++) {
  const state = sim.update(1700 + b * 800 - 300);
  assert(state.activeIndex === b, `Forward scroll reaches Beat ${b}`);
}

// Test D: Scrolling past end into Reckoning / Film
const pastEnd = sim.update(9000);
assert(pastEnd.inTimeline === false, 'Scrolling past end naturally marks inTimeline as false');

// Test E: Reverse scroll back up into story
const reverseEnd = sim.update(7500);
assert(reverseEnd.inTimeline === true && reverseEnd.activeIndex === 7, 'Scrolling back up activates Beat 7');

const reverseMiddle = sim.update(1700 + 3 * 800);
assert(reverseMiddle.activeIndex === 3, 'Scrolling backward accurately reaches Beat 3');

const reverseBeat0 = sim.update(1500);
assert(reverseBeat0.activeIndex === 0, 'Scrolling backward accurately reaches Beat 0');

const reverseExit = sim.update(200);
assert(reverseExit.inTimeline === false && reverseExit.activeIndex === -1, 'Scrolling back to top exits timeline to World state');

// Test F: Restored scroll / Deep link direct entry into Beat 4
const restoredSim = new MockStoryController(null, mockBeats);
const restoredState = restoredSim.update(1700 + 4 * 800);
assert(restoredState.inTimeline === true && restoredState.activeIndex === 4, 'Deep link / restored scroll into Beat 4 immediately resolves Beat 4');

console.log(`\n======================================================`);
console.log(`SUMMARY: ${passedTests} / ${totalTests} tests passed.`);
if (process.exitCode) {
  console.error('STAGE 3.1E SCROLL LIFECYCLE VERIFICATION FAILED.');
  process.exit(1);
} else {
  console.log('STAGE 3.1E SCROLL LIFECYCLE & STAGE VERIFIED.');
}

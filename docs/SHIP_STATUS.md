# SHIP STATUS — The Bombing of Darwin

Single persistent technical delivery record. Governance: `AGENTS.md`. Update at every checkpoint.

| Field | Value |
|---|---|
| Current milestone | **M1 + M2 (spatial) — performance, beat framing, formations** (in verification) |
| Working branch | `dev/spatial-engine` (from `main` @ `a7f6c95`, 16 Oct 2026) |
| Production | `dev/spatial-engine` fast-forwarded into `main` and deployed 25 Oct 2026, on the product owner's explicit approval ("Merge them all and deploy"). Previous production: `main` @ `a7f6c95`. |
| Last verified commit | `dev/spatial-engine` HEAD (see git log; verification below run against it) |
| Updated | 25 Oct 2026 |

## Milestones

| | Milestone | Status |
|---|---|---|
| M1 | Spatial Engine and Cartography | In verification |
| M2 | Historical Story, Camera Choreography and Evidence | In progress — all 8 beats framed; formations; Evidence Ledger affordance outstanding |
| M3 | Ticketing and Rezdy Verification | Not started — blocked on staging credentials for live checks |
| M4 | Site-wide UX/UI and Responsive Completion | Not started |
| M5 | Performance, Accessibility and Regression QA | Started — spatial load path (posters, caching, prefetch) |
| M6 | Production Release Candidate | Not started |

## M1 — Root causes found (verified on `main` and on the live preview)

1. **Cesium runtime assets missing in production.** `public/cesium` was a hand-committed partial copy of Cesium 1.145 (npm resolves 1.146) with no `Workers/` or `Widgets/` and NaturalEarthII nested inside `LensFlare/`. Live preview returned 404 for `widgets.css`, `createGeometry.js`, `createVerticesFromHeightmap.js`. Effects: canvas never sized to its stage (map drawn in a small top-left strip), no polygon/ellipse/ground geometry, globe tiles never completing, offline fallback broken, mobile render crash ("Rendering has stopped", WebGL context lost).
2. **Basemap provider returns placeholders.** CARTO now requires an API key. The production bundle has `PUBLIC_CARTO_BASEMAP_KEY` undefined, so every tile is an HTTP 200 "API KEY REQUIRED" image. Error-based fallback never fires. Visitors see a watermarked void.
3. **Hand-typed geography.** `spatial-coastline-overlay.ts` drew ~16-point "shorelines" (≈1 km vertex spacing) as ground lines, some joining distant points straight across water, plus a filled Bathurst Island polygon: the white diagonals and grey slabs in the evidence screenshots.
4. **"Historical" rasters are not archival.** `archival-texture-*.png` and `darwin-1942-overlay.png` are AI-generated illustrations with invented geography (e.g. Frances Bay on the wrong side of Fort Hill, Darwin Harbour labelled "Van Diemen Gulf", fake "TOP SECRET" stamp). `darwin-1942-continuous-map.png` is a modern oblique aerial photo. None can be registered; presenting them as 1942 cartography breaches TRUTH.
5. **Invented 1942 structures.** `spatial-1942-traces.ts` drew exact 1942 wharf/jetty/street/trench/runway lines labelled "verified" while canon records `STOKES_HILL_WHARF_1942` and `FORT_HILL_WHARF_1942` as null.
6. **Components inventing coordinates.** Fort Hill label placed in open water; USS Peary at an invented "underway" point; markers not read from `data/entities/*`.
7. **Label system.** Opaque 88–90% black boxes on every label; no collision handling; labels requested font `"Museo Sans"` while the site loads Typekit `museo-sans`, so all labels fell back to a system face.
8. **Tests asserted the defects.** `verify-stage3-cartography-exposure.mjs` required the hand-typed coastline names and CARTO exposure numbers; `verify-stage2-evidence.mjs` required CARTO.

## M1 — Changes on `dev/spatial-engine`

- `scripts/sync-cesium-assets.mjs` + `package.json` `dev`/`build`: Cesium Workers/Widgets/Assets/ThirdParty generated from `node_modules/cesium` (version-stamped). `public/cesium/` untracked and git-ignored.
- `scripts/cartography/build_basemap.py`: project-owned basemap from OpenStreetMap (ODbL) + Natural Earth — OSM coastline assembled into land, mangroves (chart stipple), intertidal flats, inland water, present-day wharves/piers, roads, buildings, runways, chart-style shallow-water tint. 2,383 × 512px tiles in `public/tiles/darwin-basemap/`, nested global → regional → Tiwi/Darwin → harbour → town core (z0–z16).
- `src/lib/spatial/cartography-manager.ts`: rewritten to use the manifest layers; globe base colour = tile water colour; no CARTO, no AI textures, no per-beat exposure hacks.
- `src/lib/spatial/spatial-viewer.ts`: `baseLayer: false` (no Cesium ion demo imagery/logo); coastline overlay removed; label declutter on resize.
- `src/lib/spatial/spatial-evidence-overlay.ts`: all markers read from canon (`vessels.json`, `locations.json`) or `present-day-anchors.json` (OSM); Peary anchored on canonical surveyed position with explicit APPROXIMATE area; Neptuna/Peary not placed at 09:58 (canon has no position); Post Office label uses neutral wording (casualty dispute stays in Evidence Ledger); halo labels in IBM Plex Mono (token: map annotations) instead of boxes; screen-space declutter by priority (PRIMARY > CONTEXT > DETAIL); rings drawn flat with working outlines.
- Removed: `spatial-coastline-overlay.ts`, `spatial-1942-traces.ts`.
- Attribution: "© OpenStreetMap contributors · Natural Earth" (CARTO removed); default Cesium credit widget hidden.
- Tests: `verify-stage3-cartography-exposure.mjs` rewritten to check real properties (every requestable tile exists, story sites covered at z15–16, no CARTO, Cesium assets present, truth constraints, palette contrast). `verify-stage2-evidence.mjs` §12 updated for the new basemap.
- Tooling: `scripts/capture-spatial.mjs` (identical-camera desktop 1440 / mobile 390 captures + JSON layer/console report); `.gitignore` added (repo had none); `CLAUDE.md`.
- Docs: `docs/SPATIAL_ENGINE.md` cartography section revised; single-engine policy preserved.
- Cameras: subject-framed poses for beats 1–4 (`SubjectFrame` in `spatial-types.ts`, `framedPose()` in `camera-grammar.ts`). Subjects read from canon; camera keeps authored heading/pitch and is translated so the subject lands in each layout's clear zone (desktop x≈0.66 right of the text column; mobile y≈0.28 above the reading card). The previous "mobile focal lifting" was a documented no-op.
- Icons: destroyer/merchant billboards drawn at their portrait aspect (were squashed into smudges). Formation aircraft tinted muted bone.
- 09:58: oversized roadstead ellipse and stray 3D approach fan no longer shown; primary label over the town so wharf context labels show.
- Palette lifted once after visual review (land/water 1.45:1 in palette; rendered town ≈49 vs water ≈18 at 09:58). Fog density reduced for harbour views.
- Declutter extended: icons yield only to PRIMARY/CONTEXT labels; non-primary labels hidden when clipped by the viewport or inside the narrative reading zone (desktop text column / mobile reading card). Mobile label wrapping at ~26 characters.

## Verification evidence (24 Oct 2026)

**Visual (headless Chromium + SwiftShader WebGL, `scripts/capture-spatial.mjs`, reduced-motion so cameras are pose-identical, desktop 1440×900 and mobile 390×844 @2x):**
- Baseline on `main`: canvas drawn in a top-left strip, Cesium ion logo, no basemap, mobile render crash. With assets fixed but old cartography: "API KEY REQUIRED" watermark tiles across the whole globe, hand-drawn diagonals, opaque label boxes.
- After: real Darwin Harbour geography at every beat (peninsula, Goyder street grid, Stokes Hill & Fort Hill wharves, Waterfront basin, Frances Bay mangroves, East/Middle/West Arms, Tiwi Islands/Apsley Strait). No slabs, no watermarks, no fragmented rasters, no label boxes, no label collisions in reviewed states.
- 09:58: town foreground, wharves mid-frame with STOKES HILL WHARF label, roadstead shipping (canonical positions) beyond; primary label over the town.
- 10:45 Peary: destroyer on open water at the canonical surveyed position in the clear right-hand zone (desktop) / upper band (mobile), explicitly APPROXIMATE area ring, Fort Hill and Stokes Hill Wharf on the shore behind.
- 09:35 Bathurst: mission now in frame (was out of frame), Apsley Strait legible. 10:00 Post Office: reads as urban Darwin (grid, blocks), subject in clear zone on both layouts.
- Runtime: 0 failed requests, 0 page errors in captured states (was: 404 widgets.css/workers, "Rendering has stopped", WebGL context lost on mobile).
- Limitation: software WebGL renders ~1 fps, so captures take minutes; real-GPU smoothness and Safari/iOS have NOT been verified here.

**Build:** `npm run build` (Vercel adapter) passes; `.vercel/output/static` contains Cesium Workers/Widgets/Assets and all 2,383 tiles.

**Tests:** validate-ai-os, verify-truth-narrative, verify-stage15-resilience, verify-stage2-evidence (122/122), verify-stage3-cartography-exposure (33/33), verify-stage3-ledger, verify-stage3-scroll-lifecycle, verify-stage3-visual (46/46 — was failing on `main`), verify-phase2a-formations, test-i18n-tolgee: all pass. test-serverless-hardening: 18/19 on both `main` and branch (pre-existing, see M3).

**Booking:** no file under `src/lib/rezdy.ts`, `src/lib/booking-store.ts`, `src/pages/api/*`, `BookingForm.astro` changed. Rezdy suite results identical on `main` and branch.

## Checkpoint 25 Oct 2026 — load performance, beat framing, formations, Zero model, Barossa canon

Owner approvals (in session, 25 Oct): animated aircraft formations and sourced 3D models as a
visitor-facing feature; SS Barossa canon correction.

**Load performance**
- Baseline on the 24 Oct preview (`qa-captures/perf/baseline-preview-load-profile.json`, headless, no GPU):
  timeline entry → first map pixels 7.4 s desktop / 6.1 s emulated mid-range phone (4× CPU, 12 Mbps).
  Cesium chunk 1.31 MB transferred; ~144 tiles (1.3 MB) for the first beat. Tiles served `max-age=0`.
- Beat posters: every beat rendered by the real engine at its authored camera (canvas read-back, no page
  chrome), WebP, desktop 2160×1350 (30–53 KB), mobile 780×1688 @2× (15–37 KB). Shown immediately; the
  live map cross-fades in once it has drawn the same beat (tiles loaded) or has been settled on it
  for 5 s. `src/lib/spatial/spatial-delivery.ts`.
- Delivery tiers: live map for capable devices; posters only for no WebGL, data saver, ≤1 GB devices
  or `?map=static` (`?map=live` forces live).
- Caching: tiles and posters immutable 1 year with `?v=<content hash>`; `/cesium/*` and `/models/*`
  1 week + 30 days SWR (`scripts/vercel-cache-headers.mjs`, run by `npm run build`).
- Engine starts on page idle instead of at timeline approach; next beat's tiles prefetched (low
  priority) from recorded per-beat lists (`beat-tiles.json`); render loop paused off-screen; MSAA off
  on phones. Tiles were already palette-quantised (64 colours); lossless WebP would save only ~16%.
- Re-profiled on the 25 Oct preview (`qa-captures/perf/after-preview-load-profile.json`, same rig):
  timeline entry → first map pixels 7.4 s → 0.2 s desktop, 6.1 s → 0.07 s emulated phone (the live map
  was already ready, so the poster was not needed in this run). Main-thread script before the
  timeline rose 0.6 → 4.7 s desktop, 1.8 → 4.4 s phone, because the engine now initialises during the
  opening; viewer creation is one ~1.3–1.7 s task under software WebGL. Cache headers verified on the
  preview: tiles/posters `max-age=31536000, immutable`, model 1 week + SWR (brotli).
- Risk to watch on real devices: idle start runs the Cesium module evaluation while the visitor reads
  the opening; if that causes jank on low-end phones, move the start back to timeline approach (the
  posters cover the wait either way).

**Beats (all eight now framed; subjects from canon)**
- 08:00 carriers & launch: Timor Sea → Bathurst Island → Darwin in one frame; four carriers marked
  REPRESENTATIVE; first-wave formation drawn as a sparse symbol at this scale.
- 09:35: widened to hold the mission and Darwin; formation over the mission (canon heading 140°).
- 09:58: formation on the canon attack axis (heading 330°, out of the south-east, Howard Springs /
  Berrimah turn). Zeros rendered with the 3D model; Vals and Kates as silhouettes.
- 10:45 Peary: hull-only silhouette (the drawn wake read as a stray trail), approximate-area ring.
- 12:00: RAAF Station Darwin (canon centroid); 54-bomber stepped V tightened (was scattered by
  perspective at 6.5 km altitude); camera pulled back.
- 13:00: Peary's surveyed wreck (27 m).
- Dusk: every wreck with a modern surveyed position (Peary, Zealandia, Meigs, Mauna Loa, British
  Motorist) + Kelat (grey, sank 24 Feb, outside the eight); Neptuna (salvaged, berth unresolved) and
  luggers Mavie / Highland Warrior (positions not recorded) named without points. Label reads
  "Lowe Commission: ~243" (canon: approximately 243).
- Phones: compact label wording for 08:00, 09:35 and dusk (full wording on desktop and in the ledger).

**A6M2 Zero model** (`public/models/a6m2-zero.glb`, 16.7 KB): owner-supplied model (generated with
Tripo). Geometry kept; texture removed because its paint (dark green uppers, yellow leading-edge
strips) is later-war and its national markings were garbled; outer wing span corrected 1.17 → 1.32 ×
length (A6M2: 12.0 m / 9.06 m); real-world metres, nose +Z (glTF forward; first export used +X, which Cesium rendered 90° off — fixed 25 Oct); simplified 10.4k → 3.1k triangles;
meshopt-compressed (was 870 KB). Rendered in muted bone, minimum 54 px (symbol size, not a scale claim).

**Canon correction — SS_BAROSSA** (`data/entities/vessels.json`, sources added to `sources.json`):
previous entry placed her at anchor in the northern anchorage at a point on land, damaged by near
misses. Sea Power Centre – Australia (HMAS Wato) and Lewis, *Naval Action at Darwin* (NHSA 2002):
berthed at the main wharf (other side of the pier from Neptuna), set on fire, towed clear by Wato,
beached nearby, cargo burnt out; later salvaged. Coordinates now null / UNKNOWN, same rule as Neptuna
(1942 wharf geometry unresolved). Previous values preserved in `canonCorrections`. No visitor-facing
text referenced the old account.

**Other fixes:** dock location/classification readouts never updated (selector returned a hidden copy;
also on `main`); sky atmosphere and fog floor re-enabled by the atmosphere controller produced grey
wedges at high-altitude beats; five pre-existing type errors (`'HIGH'` confidence) fixed; capture
harness no longer reads back blank posters (requestRenderMode) and renders phone posters at 2×.

**Verification (25 Oct):** identical-camera captures of all 8 beats, desktop 1440 and mobile 390
(`qa-captures/m2f`, `m2g`; headless Chromium + SwiftShader): 0 page errors, 0 failed requests. All
governance suites pass (truth-narrative, stage2-evidence, stage3 visual/ledger/scroll/cartography,
stage15, phase2a formations, i18n, validate-ai-os). `npm run build` passes with the cache rules in
`.vercel/output/config.json`. NOT verified: real GPU, iOS Safari, real-device load times.

## Checkpoint 25 Oct 2026 (b) — map label wording (owner direction)

Owner found the map headlines/descriptors distracting. Labels now read:
08:00 FIRST WAVE LAUNCHES · 09:35 WARNING RECEIVED (Darwin) / FATHER MCGRATH TRANSMITS SIGHTING WARNING
· 09:58 DARWIN HARBOUR & CIVIC PRECINCT · 10:00 DARWIN POST & TELEGRAPH OFFICE / RECEIVES DIRECT HIT
· 10:45 USS PEARY / STRUCK BY FIVE BOMBS · 12:00 RAAF STATION DARWIN · 13:00 USS PEARY / DEPTH 27M
· Dusk: headline removed; MV NEPTUNA / EXPLODED ALONGSIDE WHARF. Place, ship and wreck name labels unchanged.
Detail removed from the map (times, casualty figures, approximate-area wording, surveyed-wreck
designation, launch-area uncertainty) remains in the Evidence Ledger records; the governance tests now
check it there. "Same wharf. Same sky." no longer appears on the map at dusk; it remains in the dusk
beat content (story-beats.json) — owner to confirm that is acceptable under AGENTS.md.
Owner wrote "Post & Telegram Office"; the label keeps the historical name "Post & Telegraph Office".

## Release 25 Oct 2026 — spatial engine to production

- Approval: product owner, in session, 25 Oct 2026 05:13 ACDT.
- Method: fast-forward of `main` (a7f6c95) to `dev/spatial-engine`; no merge commit. Rollback: Vercel
  instant rollback to the previous production deployment, or reset `main` to `a7f6c95`.
- Pre-release checks on the release commit: all governance suites pass; i18n passes; `npm run build`
  passes; booking/Rezdy files unchanged vs `main` (`src/lib/rezdy.ts`, `src/lib/booking-store.ts`,
  `src/pages/api/*`, `BookingForm.astro`). `test-serverless-hardening` 18/19 — same pre-existing
  failure as on `a7f6c95` (In-Progress TTL Revalidation, M3), not introduced by this release.

## Outstanding defects (logged, not yet addressed)

- **M3 / commerce:** `test-serverless-hardening.ts` 18/19 on both `main` and branch — "In-Progress TTL Revalidation" fails. The AI Studio report claims this was fixed; the fix is not in the repository. Its other claimed fixes (`.env.example`, dual adapter, Cesium asset move, Post Office label) are also absent from `main`.
- **M2:** Map-label click → Evidence Ledger handler cannot fire (canvas is `pointer-events: none` so the page scrolls); needs an accessible, non-canvas affordance.
- **M4:** Booking-bar reverence gating starts at beat index 3; the 09:58 strike beat (index 2) and the desktop "BOOK TICKETS" button are not gated.
- **Repo hygiene:** `public/test-*.png`, `public/acceptance/*` (≈14 MB) are QA debris served publicly; unused AI-generated rasters remain in `public/images/spatial/` pending owner decision.

## Decisions required (owner)

- **Canon corrections (TRUTH):** `STOKES_HILL_WHARF_CONTEMPORARY` centroid lies ~250 m SSW of the actual present-day wharf (in water); `DARWIN_HARBOUR_CONTEMPORARY` falls on land. Markers use OSM for the present-day wharf; canon not edited. (`SS_BAROSSA` corrected 25 Oct with approval.)
- **Canon inconsistency (Neptuna times):** `events.json` has EVENT_NEPTUNA_BOMBED 10:02 and EVENT_NEPTUNA_EXPLOSION 10:25; `vessels.json` MV_NEPTUNA `damageTime` is 10:12. The map label uses the explosion event (~10:25). Needs an owner/historian ruling.
- **3D models:** only the Zero exists. Vals (D3A1), Kates (B5N2), Bettys/Nells and ships stay as silhouettes until type-accurate models are supplied or commissioned. The supplied Zero's licence/terms (Tripo) should be confirmed by the owner before production.
- **Historical raster:** if a genuine 1942 survey (e.g. NAA A2633 wharf plans, RAAF/RAN chart) is available, supply it for proper ground-control registration. Until then, no 1942 raster is shown as cartography.
- **AI-generated images:** confirm deletion of `public/images/spatial/archival-texture-*.png`, `darwin-1942-overlay.png`, `darwin-1942-continuous-map.png`.

## Next action

1. Owner review of the Vercel preview for `dev/spatial-engine` on real devices (desktop + iPhone Safari): load feel, poster → live hand-over, 3D Zeros at 09:58.
2. Re-profile the new preview against the 24 Oct baseline.
3. M2: Evidence Ledger affordance (non-canvas), motion paths for formations between beats.
4. M3: Rezdy in-progress TTL revalidation defect (needs staging credentials for live verification).

# SHIP STATUS — The Bombing of Darwin

Single persistent technical delivery record. Governance: `AGENTS.md`. Update at every checkpoint.

| Field | Value |
|---|---|
| Current milestone | **M1 — Spatial Engine and Cartography** (in verification) |
| Working branch | `dev/spatial-engine` (from `main` @ `a7f6c95`, 16 Oct 2026) |
| Production | Untouched. No merge, no deploy. |
| Last verified commit | `dev/spatial-engine` HEAD (see git log; verification below run against it) |
| Updated | 24 Oct 2026 |

## Milestones

| | Milestone | Status |
|---|---|---|
| M1 | Spatial Engine and Cartography | In verification |
| M2 | Historical Story, Camera Choreography and Evidence | Not started |
| M3 | Ticketing and Rezdy Verification | Not started — blocked on staging credentials for live checks |
| M4 | Site-wide UX/UI and Responsive Completion | Not started |
| M5 | Performance, Accessibility and Regression QA | Not started |
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

## Outstanding defects (logged, not yet addressed)

- **M3 / commerce:** `test-serverless-hardening.ts` 18/19 on both `main` and branch — "In-Progress TTL Revalidation" fails. The AI Studio report claims this was fixed; the fix is not in the repository. Its other claimed fixes (`.env.example`, dual adapter, Cesium asset move, Post Office label) are also absent from `main`.
- **M2:** Map-label click → Evidence Ledger handler cannot fire (canvas is `pointer-events: none` so the page scrolls); needs an accessible, non-canvas affordance.
- **M2:** Formation controller references a state id (`BEAT_0_CARRIER_FORCE`) that does not exist in `SpatialDemonstrationStateId` (type error; dead branch).
- **M4:** Booking-bar reverence gating starts at beat index 3; the 09:58 strike beat (index 2) and the desktop "BOOK TICKETS" button are not gated.
- **Repo hygiene:** `public/test-*.png`, `public/acceptance/*` (≈14 MB) are QA debris served publicly; unused AI-generated rasters remain in `public/images/spatial/` pending owner decision.

## Decisions required (owner)

- **Canon corrections (TRUTH):** `STOKES_HILL_WHARF_CONTEMPORARY` centroid lies ~250 m SSW of the actual present-day wharf (in water); `SS_BAROSSA` and `DARWIN_HARBOUR_CONTEMPORARY` coordinates fall on land. Markers currently use OSM for the present-day wharf; canon not edited.
- **Historical raster:** if a genuine 1942 survey (e.g. NAA A2633 wharf plans, RAAF/RAN chart) is available, supply it for proper ground-control registration. Until then, no 1942 raster is shown as cartography.
- **AI-generated images:** confirm deletion of `public/images/spatial/archival-texture-*.png`, `darwin-1942-overlay.png`, `darwin-1942-continuous-map.png`.

## Next action

1. Owner review of the Vercel preview for `dev/spatial-engine` on real devices (desktop + iPhone Safari).
2. M2: approach/formation beat, beats 5–7 framing, Evidence Ledger affordance, canon corrections once approved.
3. M3: Rezdy in-progress TTL revalidation defect (needs staging credentials for live verification).

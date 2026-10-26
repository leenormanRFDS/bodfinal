# SHIP STATUS — The Bombing of Darwin

Single persistent technical delivery record. Governance: `AGENTS.md`. Update at every checkpoint.

| Field | Value |
|---|---|
| Current milestone | **Opening cinematic — sound first** (released to production 25 Oct 2026). Next: Google Ads launch prerequisites (see Open items) |
| Working branch | `dev/ads-tracking` (merged to `main` 26 Oct 2026; fast-forward, nothing ahead). Previous: `dev/opening`, `dev/site-pass`, `dev/spatial-engine`. |
| Production | `main` @ `9be92dd` (Rezdy GA handover on top of the opening cinematic), deployment `dpl_CxCoQwqz3ytpPCm4U5eQmDgabLjV`, 26 Oct 2026, on owner approval ("Yes"). Previous: `92a5e1c` (`dpl_8dR5VjSufnrErYPzH5JLCXj1YHF1`). `www.thebombingofdarwin.com.au` serves this project; the apex `thebombingofdarwin.com.au` still serves the OLD project (owner/dashboard action pending). |
| Last verified commit | `dev/spatial-engine` HEAD (see git log; verification below run against it) |
| Updated | 26 Oct 2026 (Rezdy GA handover released to production) |

## Milestones

| | Milestone | Status |
|---|---|---|
| M1 | Spatial Engine and Cartography | In verification |
| M2 | Historical Story, Camera Choreography and Evidence | In progress — all 8 beats framed; formations; Evidence Ledger affordance outstanding |
| M3 | Ticketing and Rezdy Verification | In progress on `dev/ticketing` — code fixes done; Rezdy thank-you snippet and real-device test pending owner |
| M4 | Site-wide UX/UI and Responsive Completion | Started — site pass on `dev/site-pass` |
| M5 | Performance, Accessibility and Regression QA | Started — spatial load path; site-wide page weight (site pass) |
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

## Release 25 Oct 2026 (b) — site pass + ticketing to production

- Approval: product owner, in session, 25 Oct 2026 07:27 ACDT ("approve release").
- Method: fast-forward of `main` (6b3a387) to `8b7c2d9` (`dev/site-pass` + `dev/ticketing`); no merge commit.
  Deployed `dpl_BzXXpzGXuzviDzKk4KgMRYK57fyq`, READY, aliased to `bombingofdarwinexperience.vercel.app`.
  Rollback: Vercel instant rollback to `dpl_9XueCRV5G9e8njfW2eQN8wFNUDC3` (`6b3a387`).
- Pre-release checks on `8b7c2d9`: all governance suites pass (stage2 124/124 after check fix);
  serverless hardening 19/19; i18n pass; tsc 0; build pass; Cesium absent from static graphs.
- Post-deploy smoke: all pages 200 (/programs 301 as before); `/api/products` 4 live products;
  `/api/availability` live (mock=false, real 09:00 sessions); booking-status NOT_FOUND → 404;
  checkout flow (iframe + own-tab) opens with live sessions; live map ready, no console errors.
- Custom domain move: NOT done — the agent's attempt to attach the domain was blocked by a safety
  control. Owner to move `thebombingofdarwin.com.au` + `www` from project `bombingofdarwin` to
  `bombingofdarwinexperience` in the Vercel dashboard. Old project stays as rollback.
  After the move: the first real booking verifies confirmation page + GA4 purchase end to end.

## Release 25 Oct 2026 — spatial engine to production

- Approval: product owner, in session, 25 Oct 2026 05:13 ACDT.
- Method: fast-forward of `main` (a7f6c95) to `dev/spatial-engine`; no merge commit. Rollback: Vercel
  instant rollback to the previous production deployment, or reset `main` to `a7f6c95`.
- Pre-release checks on the release commit: all governance suites pass; i18n passes; `npm run build`
  passes; booking/Rezdy files unchanged vs `main` (`src/lib/rezdy.ts`, `src/lib/booking-store.ts`,
  `src/pages/api/*`, `BookingForm.astro`). `test-serverless-hardening` 18/19 — same pre-existing
  failure as on `a7f6c95` (In-Progress TTL Revalidation, M3), not introduced by this release.

- Deployed: `dpl_9XueCRV5G9e8njfW2eQN8wFNUDC3` (commit `6b3a387`), READY, aliased to
  `bombingofdarwinexperience.vercel.app` (no custom domain attached to the Vercel project).
  Rollback candidate: `dpl_9P7aFxBX7chfrL1mrTEAVyT6ndtM` (`a7f6c95`).
- Post-deploy smoke test: `/story` renders all eight beats; poster served `immutable`; `/api/products`
  returns live Rezdy products (Family Pass $90 = 2 adults + 3 children, 5 seats); `/tickets` renders
  all four products; `/book` redirects to `/tickets` as before. Real-device / iOS Safari check by owner.

## Checkpoint 25 Oct 2026 (c) — site pass: speed, unused files, TV witness, tracking (`dev/site-pass`)

Owner request: style/UX/speed pass with special attention to loading; delete unused files that matter;
replace the story "cinema screen" with the TV set (The Witness); install tracking (GA4, Meta, GTM).

**Speed** (`scripts/profile-pages.mjs`, mobile mid-range: 390×844@3x, 12 Mbps/60 ms, 4× CPU;
baseline = production `6b3a387`, after = preview of `dev/site-pass`):

| Page | Transfer before → after | LCP ms before → after |
|---|---|---|
| / | 2321 KB → 950 KB | 3560 → 2000 |
| /story | 3688 KB → 2314 KB* | 2492 → 1272 |
| /experience | 6923 KB → 562 KB | 2416 → 1328 |
| /tickets | 2011 KB → 539 KB | 2288 → 1680 |
| /visit · /witness · /memorial | ~1.7–2.2 MB → 251–737 KB | ~2.2–2.4 s → 1.25–1.87 s |

*/story includes the live-tier Cesium download (~1.3 MB compressed) — now fetched only when the map initialises.

Causes fixed:
- `/brand/logo-1942.svg` embedded six PNGs (2.3 MB, 1.29 MB transferred on EVERY page) → WebP 360/820/1640 + srcset; SVG master moved to `design/brand/`.
- `/experience` interstitial was a 5 MB PNG (and an aerial 3D render, likely a Google Earth capture — not usable) → real exhibition-floor photo (WebP, 1000 px).
- Google Fonts CSS (render-blocking) removed; IBM Plex Mono self-hosted via `@fontsource/ibm-plex-mono`. Typekit CSS remains render-blocking (needed for the display faces).
- Hero plates: 1000w WebP + srcset/sizes.
- Client bundling: `/story`'s main script statically imported Cesium (4.9 MB raw). Cause: EvidenceLedger dynamically imported `spatial-evidence-overlay` (also statically imported elsewhere) → module namespace object → Rolldown's `__export` helper placed in the Cesium chunk. Fixed by sharing records via `window.__BOD_EVIDENCE_RECORDS__` (SpatialEngine) plus a client-only `helpers` chunk group in `astro.config.mjs`. A separate Cesium chunk group was tried and broke Cesium init ("D is not a function", live map dead) — do not reintroduce.

**Unused files:** ~70 unreferenced files removed from `public/` (acceptance shots, test PNGs, old hero
layers, AI rasters incl. `images/spatial/*`, `story/raid-wide.webp`, superseded portraits/badges) and six
old capture scripts that wrote into `public/`. `public/` ≈100 MB → ≈30 MB. `src/assets` (6.8 MB, unserved) left.

**Style/UX:** hero corner ticks render as corners (specificity bug); hero plate caption legible over both
halves; cultural advice keeps its gutter on phones; experience banner image corrected.

**The Witness:** `/story` film section uses `TvWitness` — the TV set image (transparent screen) with the
archival film behind the glass. Click-to-load youtube-nocookie; ≥720 px plays inside the screen, phones
open a full-width lightbox (Esc / close / click-outside). Verified by scripted click on desktop and mobile.

**Tracking** (`src/components/Analytics.astro`, `src/lib/tracking.ts`, `src/consts.ts`):
- Fires only on `thebombingofdarwin.com.au` / `www.` — or any host with `?bod_track=1` for testing. Previews no longer pollute GA4.
- GA4 `G-MQ9641V0NY` direct (gtag), loaded after window load.
- `begin_checkout` / Meta `InitiateCheckout` when the Rezdy checkout opens; `purchase` / Meta `Purchase` once per Rezdy order on the confirmation page (`transaction_id` / `eventID` = order number; localStorage de-dupe). Previously no purchase was ever recorded (the old dataLayer push was never read by gtag).
- GTM: owner's account has no container for this site (only rfdsdarwin.com.au `GTM-MRLQWGR7` and RFDS sites). Decision: no GTM — direct tags are lighter. `gtmContainerId` switch kept in config.
- Meta pixel: code ready, inactive until the dedicated dataset ID is supplied.

Live map verified on preview `386eaaa` (ready, no console errors, Evidence Ledger opens from roster).
Verification: all governance suites pass (formations 31/31, resilience 26/26, evidence 124/124,
cartography 33/33, ledger 78/78, scroll lifecycle 32/32, truth/narrative); `npm run build` passes;
tsc error count unchanged (31, pre-existing). Captures: `qa-captures/pass*`, `qa-captures/perf/*`.

## Checkpoint 25 Oct 2026 (d) — M3 ticketing audit (`dev/ticketing`, from `dev/site-pass`)

Findings (verified against the live Rezdy product page in the owner's Chrome, view only, nothing submitted):
1. **Rezdy ignores quantities passed by link.** `adult=`, `child=`, `family=` and Rezdy's own
   `ItemQuantity[433258][n][quantity]` params are not applied (Adult stays at default 1, others 0).
   `date=` IS honoured. Visitors re-enter tickets in Rezdy. Rezdy documents no prefill parameters.
   → Checkout now shows a reminder bar: "In checkout, choose 1 × Family Pass · Tue 28 Oct · 10:00".
2. **Safari / iOS:** Rezdy's own help article ("Cross-Site Tracking Prevention on iOS/Mac OS") says
   its embedded booking is impacted by Safari's default tracking prevention; its only advice is for
   guests to disable it. → Apple devices now open Rezdy in its own tab (opened within the tap; falls
   back to same tab if blocked). `?checkout=tab` forces this path. Real iPhone test by owner pending.
3. **Purchase tracking depends on a Rezdy setting.** Rezdy has no redirect-after-booking parameter;
   `redirectUrl`/`returnUrl` are not documented. Rezdy runs custom code on its thank-you page
   (Integrations › Custom Conversion Tracking, `###ORDER_NUMBER###`). Snippet prepared in
   `docs/evidence/rezdy-thankyou-snippet.html` — **not installed, needs owner approval** (live Rezdy
   config). **Installed 25 Oct 2026 07:15 ACDT with owner approval**, appended below the existing
   Google Ads tag (unchanged); verified persisted after reload. Fires on the next real booking.
4. **Stale in-progress status served as verified** when Rezdy unreachable → fixed (only CONFIRMED /
   CANCELLED served from cache). `test-serverless-hardening` 19/19 (was 18/19).
5. **Invented availability on Rezdy failure:** production silently fell back to mock sessions with
   fabricated seat counts. → Now dates only, real session chosen in Rezdy; mock seat counts never shown.
   Previews show labelled example times (no `REZDY_API_KEY` in Preview env — production is live).
6. postMessage listener now accepts only `*.rezdy.com` origins.
7. Typecheck: 31 → 0 errors.

Verified on preview (Playwright, Rezdy stubbed): desktop iframe path + reminder; own-tab path opens
Rezdy in a new tab with the waiting panel; availability-failure path. **Owner iPhone test passed**
25 Oct (reached Rezdy's booking form in its own tab). NOT verified: a real completed booking → our
confirmation page + GA4 purchase (needs the merge to production + domain move, then one real booking).

Finding (not changed): Rezdy's thank-you page loads Google Ads `AW-17121250128` with only
`gtag('config', ...)` — no conversion event. That tag belongs to the **cancelled** Ads account
"RFDS Darwin Tourist Facility" (359-238-9847; action "RFDS Ticket Purchase", label
`voFKCNTPwYgbENCWhuQ_`, status Inactive). The "The Bombing of Darwin" Ads account (544-…) is still
in first-campaign setup: no campaigns, no payment. → No Ads conversion line added (it would report
into a cancelled account). Recommendation when BoD ads launch: import the GA4 `purchase` event
(now sent by the site) as the Ads conversion, rather than a Rezdy-side Ads tag.

Correction (25 Oct): `verify-stage2-evidence` failed (123/124) from `386eaaa` onward — its check
rejected any `vite:` key in astro.config.mjs, not just `vite.define`. The site-pass checkpoint's
"all suites pass" was run before that config change. Check narrowed to its intent (`define:` /
CARTO key); 124/124.

## Checkpoint 25 Oct 2026 (e) — the opening cinematic: sound first (`dev/opening`, from `dev/ticketing`)

Owner brief: replace the silent title sequence with a sound-first opening (calm tropical morning → the radio transmission → the dismissal → engines closing in → hard cut to black), ending on the newspaper video (`BOD_paper.mp4`) and the "WW2 Happened Here" monument. First master (59 s, with heartbeat) was shortened by the owner at 09:23 to a **44.05 s master with the heartbeat removed**: engines cut at 29.845 s, foley fades in, sound ends at 44 s. Owner confirmed the newspaper plays at the end of the intro.

**Built (`src/components/Opening.astro`, `src/consts.ts` OPENING, `src/lib/tracking.ts` `trackOpening`):**
- Sound gate ("Headphones recommended" · Enter with sound / Enter silently): browsers only start audio on a tap. Gate states "Voices are re-created from the written record."
- SOUND path: black screen; one master `/audio/bod-opening.m4a` (AAC 112 k, 627 KB, -1.5 dB so encode cannot clip; -16.1 LUFS, peak -1.7 dBFS). The whole timeline is slaved to `audio.currentTime`, so it cannot drift; pauses with the tab; hairline progress; Mute and Skip (audio fades 0.4 s; iOS ignores volume and stops at once). Only the two voice lines are captioned.
- Cues measured from the 44 s mix (`CUES` in Opening.astro): voice 1 speech 10.1–17.0 s; voice 2 17.9–20.5 s; engines from ~21 s, peak ~25 s; hard cut 29.845 s then digital silence to ~29.9 s; foley fades in from 30.0 s with the paper's first impact at 30.85 s. The paper video's own first impact is 0.23 s in; cross-correlating its audio with the master put t=0 at 30.62 s (corr 0.39, weak but the only match, and consistent with the 30.85 s hit), so the paper starts at 30.62 s (0.77 s of black after the cut). Paper held to 37.2 s; monument 38.4 s; leaves 45.4 s.
- SILENT path: the original typed transmission, compressed, plus the paper (silent) and the monument; about 24 s; tap or Skip to leave. Also used if audio is blocked, errors, or fails to start in 10 s (GA4 `opening_audio_fallback`).
- Paper video: `bod-paper-wide.mp4` 1.16 MB (1920×820) and `bod-paper-phone.mp4` 0.56 MB (1500×940 crop framed on the paper, so the headline stays legible at 390 px; chosen by `max-aspect-ratio: 1/1`). Source was 11.4 MB. If the video has not arrived when its cue passes the paper is skipped, never an empty porch. Fetched ~1.5 s after the sound starts, so nothing competes with the hero.
- Audio, video and poster URLs carry `?v=<md5 prefix>` and are served immutable (`scripts/vercel-cache-headers.mjs`); update the hash in OPENING when a file changes.
- Keyboard: Esc skips (previously any key). Dialog semantics added. GA4: `opening_start` / `opening_skip` (`at_s`) / `opening_complete` / `opening_audio_fallback`, each with `mode`.
- `scripts/encode-opening-assets.sh` rebuilds all four assets from the masters.

**Verified (headless Chromium, real clock, 1440×900 and 390×844; `qa-captures/opening/`; Vercel preview of the first build):**
- Default (no gate) → silent path starts immediately, completes in 24 s, `opening_start` + `opening_complete`, 0 console errors.
- `?opening=sound` on the 44 s master → gate, tap starts audio, captions at 12 s and 19 s, black at 27–30.5 s, paper from ~31 s, monument ~40 s, overlay gone ~47 s (incl. ~1 s start offset), 0 console errors. Phone variant loads the phone crop. `npm run build` OK; Cesium still not in any static import graph (only zip-reader). `verify-truth-narrative.mjs` passes. Preview: gate tap, audio and video range requests (206), 0 console errors.
- Defect found and fixed on the first preview: the silent-path stage sat above the gate and swallowed taps on "Enter with sound" (the local test had passed only because the gate was off-centre at the time). Gate is now z-index 4 over a non-interactive stage; hit-test at each button's centre confirmed on desktop and phone.
- NOT verified: actual audible output (headless has no sound device; levels and timings were measured, not heard), real iPhone/Android autoplay behaviour, and sync as heard (the 30.62 s paper start is derived from file analysis; check by ear).

**Voice line vs the record (TRUTH) — resolved by the owner (25 Oct 2026 09:44).** The first `bod1` said "bearing down on us from the northeast" (not the logged transmission; rejected by `verify-truth-narrative.mjs`), so the owner re-recorded it. Owner-confirmed spoken words: "There's an unusually large air formation bearing south, heading south, observed over Bathurst Island." — the logged transmission ("An unusually large air formation bearing south, heading south, observed over Bathurst Island.") with a radio operator's leading "There's". (An automated speech check had heard "That's … going south … observed by the toughest island"; the owner, who performed it, states otherwise and the owner's statement is the record here. It is worth one listen.) The caption now shows the spoken words; the silent path still types the logged text. `OPENING.soundApproved` is now `true`: the gate shows by default; `?opening=silent` forces the silent path. `bod2` ("It's probably just the P-40s returning to base") fits the documented dismissal. Owner also confirmed there is no voice in the foley section (33.7–43 s); the speech check's words there were a false reading. Recorded voices are dramatised; the gate and the first caption say so.

**Release record (25 Oct 2026).** Owner approved the merge in chat ("I approve the merge"). `dev/opening` fast-forwarded into `main` (`8b7c2d9` → `92a5e1c`), deployment `dpl_8dR5VjSufnrErYPzH5JLCXj1YHF1` READY. Pre-merge: verify-truth-narrative, verify-stage2-evidence (124/124), verify-stage3-cartography-exposure (33/0) all green. Production smoke test on `www.thebombingofdarwin.com.au` (headless Chromium, desktop 1440 / phone 390 / `?opening=silent`): gate visible and centred with the Enter-with-sound button, 0 console errors, GA4 `G-MQ9641V0NY` tag loads; audio, both videos and poster return 206 with `cache-control: public, max-age=31536000, immutable`. Not verified: audible output and real-phone autoplay (owner to test on a phone). **Apex domain still on the old project** and serves the old site with no opening, so apex visitors do not see this release.

**Owner answers recorded (25 Oct 2026):** the newspaper clip is a copy of the real Courier-Mail front page of Friday 20 Feb 1942; the voices and ambience were generated by the owner (rights are the owner's); the owner declined extra "reconstruction" labelling beyond the small gate note and caption tag already built ("it's obvious"). Voices remain dramatised re-creations and must never be presented as archival audio.

**Open items / owner:** (1) move the apex `thebombingofdarwin.com.au` to this project (owner dashboard action; `www` is done); (2) real-phone test of the sound gate (iPhone Safari and Android Chrome); (3) "Replay the opening" link not built; the opening plays once per session; (4) Google Ads: account, billing, budget and conversion import still to be settled before any campaign is created.

## Checkpoint 26 Oct 2026 (f) — Google Ads launch prerequisites: purchase tracking (`dev/ads-tracking`, docs only)

No site code changed in this checkpoint. Ads campaign NOT created; no spend.

**GA4 on this site (property 545435638, `G-MQ9641V0NY`).** Confirmed arriving: `page_view`, `session_start`, `first_visit`, `user_engagement`, `scroll`, `opening_start`, `opening_skip`, `begin_checkout`. `purchase` NOT observed.

**Why `purchase` does not fire here (verified).** In a desktop Chrome test (order `RMPB020`, created 25 Oct 4:42 PM, General Entry for 27 Oct 9:00 AM, order total $30.00, discount code used, source Online) Rezdy's thank-you page loaded as the top-level window: no `window.parent` other than itself and no `window.opener`. Our `postMessage` snippet therefore has no target, so `/tickets/confirmation` and `trackPurchase` never run in that flow. Cause of the frame breakout is unknown. Not yet tested: a paid (non-$0) order; the own-tab flow (`?checkout=tab`), which has an opener. Rezdy support (26 Oct) confirms: no supported automatic redirect or `redirectUrl`/`returnUrl` support; "parent" is the page itself when top-level; a completion message cannot be delivered in that state.

**Paid order test (26 Oct 2026, verified).** Order `R0JDBEN`: General Entry, 1 Child, Thu 29 Oct 15:00, paid $18.32 by card (our summary showed $18; Rezdy's confirmation script reports total 18.32). Desktop Chrome, in-site iframe checkout, entered via `?utm_source=handover&utm_medium=test&utm_campaign=handover-test`. The owner reports the checkout breaks out of the frame when "Make booking" is clicked; the order ended on `rfdsdarwin1.rezdy.com/thankyou` as the top-level page, so there was no return to `/tickets/confirmation`. The breakout therefore happens at the payment step, also on a paid order. The thank-you URL still carried `_ga_data` (client `722817180.1784266457`, campaign `handover-test`), so the handover survives the breakout. The thank-you page carries our completion script (sends `rezdy:orderConfirmed` to parent/opener for the apex and www origins only) and only the `G-XSL99FECC8` tag. Consequences: the Google Ads "Purchase" conversion (page load of `/tickets/confirmation`) and our site-property `purchase` cannot fire in the iframe flow. Pending: R0JDBEN's source/campaign in property 425826142 (reporting lag; checked 26 Oct 17:35, not yet present); own-tab flow (`?checkout=tab`) test, which keeps an opener; refund of R0JDBEN. A second load of the thank-you URL (26 Oct, at the owner's request, to inspect the page) may have sent a duplicate `purchase` for R0JDBEN without the campaign data.

**Rezdy already records purchases, in the facility's property.** Rezdy's own tag on its checkout/thank-you pages sends `purchase` (with value and order number) to the RFDS Darwin Tourist Facility property `425826142` (`G-XSL99FECC8`), hostname `rfdsdarwin1.rezdy.com`. Last 30 days to 25 Oct: 11 purchases, $680.51. Both test orders (`RMPB020`, `RUT2UCT`, $30 each, 25 Oct) are in it with source `thebombingofdarwin.com.au`; that $60 test revenue stays in the facility's GA4 even if the Rezdy orders are deleted. Attribution there is weak: the visit shows as a referral, not a Google Ads click.

**Server-side purchase via webhook — not viable as it stands (verified 26 Oct):**
- Rezdy account has 0 webhooks registered (Rezdy back office, Webhooks). `/api/rezdy/webhook` exists in code but nothing calls it. Registering one is account-wide and needs owner approval.
- The account mixes sources (Online, Negotiated rate resellers such as Viator/GetYourGuide/Klook/BookMe/Luxury Escapes, Internal); orders from this site and from rfdsdarwin.com.au both show as Online, so a webhook cannot tell them apart.
- A webhook carries no visitor ID or click ID.
- `REZDY_WEBHOOK_SECRET` is NOT set in the production environment (the endpoint is unauthenticated; it verifies each order against the Rezdy API, so impact is low, but set it before any webhook goes live). No GA4 Measurement Protocol secret exists either.
- Possible fallback (not built): record visitor/click data at checkout start and match to confirmed orders read from the Rezdy API; match would be inferred unless Rezdy's "Reseller Reference" can carry a token (unknown; to ask Rezdy / test).

**Rezdy's recommended route (support email, 26 Oct):** keep purchase in the existing GA4 property; set up GA4 cross-domain measurement with the same Measurement ID/web data stream on both domains; review Rezdy's Linked Domain setting and generated booking JavaScript (`pluginJs`); link the property to the Ads account and import the existing `purchase` as the conversion. Rezdy says its Google integration has one Measurement ID field, cannot confirm two properties, asks that the existing RFDS setup stay unchanged, and does not endorse hand-building `_ga_data` / `GA_TRACKING_DATA`. Observed in Rezdy's checkout script (not documented by Rezdy): it accepts a `_ga_data` URL parameter (`encodeURIComponent(btoa(JSON))` of `{clientId, utmSource, utmMedium, utmCampaign, utmTerm, utmContent}`), stores it in `sessionStorage`, and listens for a `GA_TRACKING_DATA` message from the parent when framed. Its Linked Domain is currently `https://www.rfdsdarwin.com.au/`. **Risk to settle with Rezdy before any change:** whether a second Linked Domain can be added without affecting the facility site. Open follow-up questions drafted for Rezdy (owner sending): Linked Domain, `pluginJs` for a custom embed, safety of the existing Ads tag, `Reseller Reference`.

**Rezdy thank-you custom code.** The 25 Oct snippet (`docs/evidence/rezdy-thankyou-snippet.html`) was reported back on 26 Oct with a broken `origins` line (syntax error as pasted), differing from the repo copy; the owner has replaced it with a clean version listing `https://thebombingofdarwin.com.au` and `https://www.thebombingofdarwin.com.au` only (the `vercel.app` origin is no longer needed). Owner pasted the saved second script back on 26 Oct 10:27: it matches the clean version (valid syntax, two origins). Verified from the owner's paste, not from the Rezdy dashboard (my Rezdy session had expired), and the Google Ads tag above it was not part of the paste. The box also contains a Google Ads base tag `AW-17121250128` (config only, no conversion event); the owning Ads account is unconfirmed. Rezdy warns that extra Google installs there can disrupt its integration.

**Google Ads account.** "The Bombing of Darwin", customer `5446258396` (AUD, Adelaide time). Existing "Campaign #1" Performance Max (enabled, about $62/day, no conversion history) is a placeholder; owner to pause in the Ads UI. The reporting connector (1ClickReport, plan Pro) is read-only for Ads; campaign and conversion creation needs Team ($99/mo) or manual entry. GA4 property `545435638` is not yet linked to the Ads account. Interim Ads conversion candidate: `begin_checkout` (confirmed working), reconciled against Rezdy orders.

**Planning inputs (not final).** Keyword Planner (Australia-wide, rounded monthly): "things to do in darwin" and "darwin tourist attractions" about 8,100; "stokes hill wharf" about 6,600; "bombing of darwin" about 4,400 (Feb peak 8,100, Dec/Jan about 2,400); "darwin tours" about 880. 19 Feb 2027 is the 85th anniversary. Cruise-ship dates for Darwin before Christmas come from aggregator sites only; berth Fort Hill Wharf; to be verified with Darwin Port / Tourism NT before any port-day spend. Starting budget idea: about $40/day average (national about $30/day, port-day Darwin-only about $20/day on confirmed days).

**Rezdy pricing (read-only findings; nothing changed).** Rezdy prices are set per session, so the same product can show different prices on different dates; 17 sessions carry older prices (owner: leave alone). Rezdy shows $32 Adult from 1 Apr 2027 vs $30 on this site. Test promo code `test2` is EXPIRED. `PRGTFQ` is a product code (gift voucher), not a discount. The "2 Adults + 3 Children $90" Family option is a 5-person bundle; four-person families may not be able to use it (facility policy, owner question).

**Rezdy `pluginJs` read (26 Oct; public at `https://rfdsdarwin1.rezdy.com/pluginJs`).** It takes the Measurement ID from the host page's `gtag.js` script, reads the visitor's client ID with `gtag('get', id, 'client_id')`, and posts `{type:'GA_TRACKING_DATA', data:{clientId, sessionId, utmSource, utmMedium, utmCampaign, utmTerm, utmContent, referrer, timestamp}}` into Rezdy iframes that exist at the first `page_view`. Our checkout iframe is created later (on Book), so pluginJs alone would not reach it. Its `_ga_data` URL step builds the value but never applies it to the iframe address, so only the message works there. No click ID (`gclid`) is carried. Whether Rezdy's checkout pages expect the host to answer a "plugin loaded" check (a possible cause of the breakout) was not found in the product-page scripts; unconfirmed.

**Built on `dev/ads-tracking` (owner approved, 26 Oct 13:11; NOT merged, NOT deployed):** `src/lib/ga-handover.ts` (new, pure logic), wrappers in `src/lib/tracking.ts`, `captureAttribution()` on every page via `Base.astro`, and `BookingForm.astro` now (a) adds `_ga_data` to the checkout URL (iframe and own-tab) and (b) sends the `GA_TRACKING_DATA` message on every checkout iframe load. First-touch utm_* and external referrer are kept in `sessionStorage` (`bod_attr`) so a visitor who lands on `/story` and books later still hands over their campaign. No GA cookie, no handover (URL unchanged). No Rezdy setting changed. `scripts/verify-ga-handover.mjs`: 18/18 passed (cookie parsing, first-touch rules, payload keys equal to Rezdy's, round trip through Rezdy's own decoder, hostile and non-Latin values, blocked storage). `npm run build` OK; Cesium still only in `zip-reader`; verify-truth-narrative, verify-stage2-evidence (124/124) and verify-stage3-cartography-exposure (33/0) green. Browser test (headless Chromium, local dev server, Rezdy stubbed because the sandbox cannot reach rezdy.com): desktop iframe received `GA_TRACKING_DATA` with the client ID and the campaign from a `/story?utm_…` landing, and `_ga_data` was on the iframe URL; own-tab popup URL carried `_ga_data`; with no GA cookie neither was sent; 0 page errors.
**NOT verified:** that Rezdy's real tag reports the purchase under the handed-over visitor and campaign (needs one real booking after release, then a look at the facility property 425826142); whether GA4 attributes the purchase to our campaign from event-level `campaign_*` parameters; whether Google Ads can match the imported sale to a click (no `gclid` is passed); the cause of the iframe breakout (unaffected by this change).
**To verify after release:** open the site with `?utm_source=handover&utm_medium=test&utm_campaign=handover-test`, make one booking (own-tab and iframe), then in property 425826142 find the order's `purchase` and check its source, campaign and client; refund the test order.

**Owner actions open:** pause Campaign #1; confirm billing on the Ads account; delete test order `RMPB020` in Rezdy; move the apex domain; send the Rezdy follow-up; verify cruise dates; optionally run one real paid booking in own-tab mode (`?checkout=tab`) and refund it, to test the full chain and answer Rezdy's paid-vs-$0 question.

**Release record (26 Oct 2026).** Owner approved the merge in chat ("Yes"). `dev/ads-tracking` fast-forwarded into `main` (`8060d6d` to `9be92dd`), deployment `dpl_CxCoQwqz3ytpPCm4U5eQmDgabLjV` READY and aliased to `www.thebombingofdarwin.com.au`. Pre-merge: `verify-ga-handover.mjs` 18/18. Production smoke test (headless Chromium against www, Rezdy stubbed, Google/Meta tags blocked so nothing reached analytics, fake `_ga` cookie): landing on `/story?utm_source=google&utm_medium=cpc&utm_campaign=handover-test` stored the first-touch tags in `sessionStorage.bod_attr`; desktop iframe checkout carried `_ga_data` on its URL and received one `GA_TRACKING_DATA` message to the Rezdy origin with clientId and campaign; own-tab (`?checkout=tab`) popup URL carried the same `_ga_data`; with no `_ga` cookie neither was sent; 0 page errors in all three runs. Still NOT verified: that Rezdy's real checkout accepts the payload and its `purchase` in property 425826142 carries our campaign (one real booking is owed, see "NOT verified" above).

**Google Ads decisions (owner, 26 Oct 2026).** Campaign #1 (placeholder Performance Max) paused; Ads billing confirmed. Plan and bulk-upload CSV delivered (three Search campaigns, imported paused): $50/day in total (Core $5, Visitors $35, History $10), manual CPC with ad-group caps ($2.00 / $1.20 / $0.40), Australia-wide, presence only. Primary conversion `begin_checkout` (site GA4 property 545435638 linked to Ads account 5446258396) until a traced purchase is proven; the paid test booking runs alongside launch. Prices per Rezdy's schedule: Adult $30 until April 2027, Family Pass $90 (2 adults + 3 children); no prices in ad text. The old Rezdy Ads tag AW-17121250128 belonged to the Darwin Tourist Facility and was removed; nothing replaces it (a tag on Rezdy's domain cannot see the click ID). History traffic lands on `/experience` (560 KB), not `/story` (2.3 MB with the map). Suggested cost-per-booking target $25 (ceiling $35), awaiting owner confirmation. Known gap: the handover passes client ID and utm tags but not the gclid, so GA4-imported purchases may not be credited to clicks in Ads; offline conversion import by gclid is the fallback if so. Campaigns are not yet built or enabled.

## Outstanding defects (logged, not yet addressed)

- **M3 / tracking:** `purchase` does not fire on this site when Rezdy's thank-you page is top-level (see checkpoint f). Resolution depends on Rezdy's reply on cross-domain measurement.
- ~~M3 TTL revalidation~~ — fixed on `dev/ticketing` (see checkpoint d).
- **M2:** Map-label click → Evidence Ledger handler cannot fire (canvas is `pointer-events: none` so the page scrolls); needs an accessible, non-canvas affordance.
- **M4:** Booking-bar reverence gating starts at beat index 3; the 09:58 strike beat (index 2) and the desktop "BOOK TICKETS" button are not gated.
- ~~Repo hygiene~~ — resolved in the site pass (QA debris and unused AI rasters deleted on owner instruction "If there are unused files - get rid of them").
- ~~Typecheck~~ — 0 errors on `dev/ticketing`.

## Decisions required (owner)

- **Canon corrections (TRUTH):** `STOKES_HILL_WHARF_CONTEMPORARY` centroid lies ~250 m SSW of the actual present-day wharf (in water); `DARWIN_HARBOUR_CONTEMPORARY` falls on land. Markers use OSM for the present-day wharf; canon not edited. (`SS_BAROSSA` corrected 25 Oct with approval.)
- **Canon inconsistency (Neptuna times):** `events.json` has EVENT_NEPTUNA_BOMBED 10:02 and EVENT_NEPTUNA_EXPLOSION 10:25; `vessels.json` MV_NEPTUNA `damageTime` is 10:12. The map label uses the explosion event (~10:25). Needs an owner/historian ruling.
- **3D models:** only the Zero exists. Vals (D3A1), Kates (B5N2), Bettys/Nells and ships stay as silhouettes until type-accurate models are supplied or commissioned. The supplied Zero's licence/terms (Tripo) should be confirmed by the owner before production.
- **Historical raster:** if a genuine 1942 survey (e.g. NAA A2633 wharf plans, RAAF/RAN chart) is available, supply it for proper ground-control registration. Until then, no 1942 raster is shown as cartography.
- **Custom domain:** `thebombingofdarwin.com.au` (+ www) is attached to the OLD Vercel project `bombingofdarwin`, which still serves the old site. Move to `bombingofdarwinexperience` after the site pass is approved (owner: "Wait until passes done"). Keep the old project as rollback.
- **Meta pixel:** dedicated "Bombing of Darwin" dataset ID needed (do not reuse shared RFDS pixel 773978734609862 — Meta health-flagged). Set `ANALYTICS.metaPixelId` in `src/consts.ts`.
- **Privacy wording:** the site terms say personal information is not shared; a Meta pixel shares browsing/purchase events with Meta. Update the privacy statement before enabling the pixel.

## Next action

0. Purchase tracking for Google Ads: await Rezdy's reply (Linked Domain, `pluginJs`, `Reseller Reference`); then propose the cross-domain change (our code only, `dev/*`, owner approval before any Rezdy setting changes). Meanwhile: read Rezdy's generated booking code (`pluginJs`; needs the owner to sign in to Rezdy or paste it), write the Ads build document, set `REZDY_WEBHOOK_SECRET` only if a webhook is ever registered.
1. Owner review of the `dev/site-pass` preview; on approval merge to `main`, then move the custom domain to `bombingofdarwinexperience`.
2. Meta dataset ID + privacy wording, then enable the pixel.
3. M3: merge `dev/site-pass` + `dev/ticketing` to `main` and move the domain (owner approval), then verify one real booking end to end (confirmation page, GA4 purchase).
4. M2: Evidence Ledger affordance (non-canvas), motion paths for formations between beats.
4. M3: Rezdy in-progress TTL revalidation defect (needs staging credentials for live verification).

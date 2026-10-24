# CLAUDE.md

`AGENTS.md` is the project constitution and governs all work here. This file only adds
operational notes for Claude sessions. If anything here conflicts with `AGENTS.md`, `AGENTS.md` wins.

## Delivery record

`docs/SHIP_STATUS.md` is the single persistent technical delivery record (milestones, verified
work, defects, blockers, evidence, last verified commit, next action). Update it at every
meaningful checkpoint. Do not create parallel status/plan documents.

## Branching and release

- Work on `dev/*` branches. Never push to `main` or redeploy production without the product
  owner's explicit approval.
- Approval also required for: live Rezdy payment/pricing/webhook changes, historical canon changes
  (`data/historical-canon.json`, `data/entities/*`), material new visitor-facing features, platform
  migrations, destructive operations.

## Commands

- `npm run dev` — syncs Cesium runtime assets, then starts Astro on :3000.
  Astro 7 runs the dev server as a daemon: stop it with `npx astro dev stop` (pkill is not enough).
  Vite caches the public file list at startup; restart after regenerating `public/`.
- `npm run build` — syncs Cesium assets, then builds.
- `npm run cesium:assets` — copies Workers/Widgets/Assets/ThirdParty from `node_modules/cesium`
  into `public/cesium` (git-ignored, version-stamped).
- `node scripts/capture-spatial.mjs --url http://127.0.0.1:3000 --out <dir> --beats 2,4 --label <name>`
  — identical-camera desktop (1440) / mobile (390) captures of story beats plus a JSON layer/console
  report. Set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` if playwright-core cannot find a browser.
- `node scripts/verify-stage3-cartography-exposure.mjs` — basemap/tile completeness, Cesium assets,
  truth constraints, palette contrast.
- `node scripts/capture-spatial.mjs --url http://127.0.0.1:3000 --out qa-captures/posters --beats 0,1,2,3,4,5,6,7 --posters --record-tiles`
  — REQUIRED after any change to a beat's camera, labels or markers. Regenerates the beat poster
  stills (`public/spatial-posters/**`, `poster-manifest.json`) and the per-beat tile prefetch lists
  (`beat-tiles.json`). Stale posters would show the old beat until the live map takes over.
  Run captures against a SEPARATE dev server/copy if you are editing code at the same time: a
  Vite reload mid-run kills the capture. Tile lists are incremental (tiles newly requested when
  the visitor reaches beat N in story order), which is what "prefetch the next beat" needs.
  Posters are canvas read-backs; a blank (black) read-back aborts the run.
- 3D models live in `public/models/` (glTF, real-world metres, nose +Z = glTF/Cesium forward axis; Cesium heading = compass − 90°). Model URLs carry `?v=<hash>`; update it when the file changes. `a6m2-zero.glb` is the
  owner-supplied Zero with its AI texture and markings removed (inaccurate for Feb 1942), span
  corrected to 12.0 m, simplified to ~3k triangles, meshopt-compressed. Only use a model for the
  type it depicts; other types stay as silhouettes until type-accurate models exist.
- `node scripts/profile-spatial-load.mjs --url <preview> --share <token>` — load profile (desktop and
  throttled mobile). No GPU here: frame-gated timings are pessimistic; compare run to run only.
- `node scripts/profile-pages.mjs --url <base> [--share <token>] --label <name>` — per-page weight/FCP/LCP
  on a throttled mid-range phone; writes `qa-captures/perf/<label>-pages.json` (baseline: `baseline-pages.json`).
  `node scripts/capture-pages.mjs --url <base> --out <dir> --pages /,/story [--selector css] [--full]` — page captures.
- Cesium must stay out of every page's static import graph (load only via `import('cesium')`). After a build,
  `grep -lE 'from"./[Cc]esium' .vercel/output/static/_astro/*.js` may list only Cesium's own deps (zip-reader).
  Never dynamically import a module that is also statically imported (see astro.config.mjs).
- Tracking runs only on production hostnames; append `?bod_track=1` to test elsewhere. IDs in `src/consts.ts`.
- `npm run build` also patches `.vercel/output/config.json` with immutable caching for tiles/posters
  (`scripts/vercel-cache-headers.mjs`). Tile and poster URLs carry `?v=<content hash>`.

## Spatial engine facts (verified, Oct 2026)

- Basemap: project-owned static tiles in `public/tiles/darwin-basemap`, built by
  `scripts/cartography/build_basemap.py` from OpenStreetMap (ODbL) + Natural Earth. Layer rectangles
  and zoom ranges live in `src/lib/spatial/basemap-manifest.json`. Rebuild instructions are in the
  script header. The basemap is PRESENT-DAY geography; 1942 features are overlays only.
- Do not reintroduce CARTO without a key: anonymous CARTO returns HTTP 200 "API KEY REQUIRED" tiles.
- Marker coordinates must come from canon (`data/entities/*`) or `present-day-anchors.json`.
  A null canonical coordinate means do not draw it.
- Delivery tiers (`src/lib/spatial/spatial-delivery.ts`): live Cesium for capable devices, with the
  beat poster shown until the live map has drawn the same beat; static posters only for no-WebGL,
  data saver, ≤1 GB devices, or `?map=static`. `?map=live` forces live.
- Visual QA means looking at rendered captures. A passing string-match test or HTTP 200 is not
  visual acceptance.
- Opening cinematic (`src/components/Opening.astro`): sound is gated by `OPENING.soundApproved` in `src/consts.ts`
  (false until the voice lines are approved against the record); `?opening=sound` previews, `?opening=silent` forces
  the silent path. Assets are rebuilt with `scripts/encode-opening-assets.sh`; cue times live in `CUES` and were
  measured from the master, so re-measure them if the mix changes. Voices are dramatised re-creations — never
  present them as archival audio.

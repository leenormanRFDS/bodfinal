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

## Spatial engine facts (verified, Oct 2026)

- Basemap: project-owned static tiles in `public/tiles/darwin-basemap`, built by
  `scripts/cartography/build_basemap.py` from OpenStreetMap (ODbL) + Natural Earth. Layer rectangles
  and zoom ranges live in `src/lib/spatial/basemap-manifest.json`. Rebuild instructions are in the
  script header. The basemap is PRESENT-DAY geography; 1942 features are overlays only.
- Do not reintroduce CARTO without a key: anonymous CARTO returns HTTP 200 "API KEY REQUIRED" tiles.
- Marker coordinates must come from canon (`data/entities/*`) or `present-day-anchors.json`.
  A null canonical coordinate means do not draw it.
- Visual QA means looking at rendered captures. A passing string-match test or HTTP 200 is not
  visual acceptance.

# Historical Spatial Engine

Darwin Harbour is a historical spatial environment connecting geography, chronology, movement, evidence and narrative.

## Runtime

Primary runtime:

**CesiumJS**

Cesium owns:
- coordinates
- world space
- camera
- time
- terrain
- 3D Tiles
- historical object placement

Use custom restrained cartography.

Hide default Cesium chrome from the visitor.

## Architecture

Prefer one persistent viewer for the Story chapter.

Drive it with structured story state.

A beat may define:
- historical time
- camera destination
- camera target
- heading
- pitch
- roll
- altitude
- transition duration/easing
- visible entities
- aircraft formations
- vessel states
- highlighted locations
- historical imagery/map layer
- archive reference
- annotation state
- sound state
- evidence confidence
- reduced-motion composition

## Camera

Preferred rhythm:

**scroll → transition → composition → read**

Avoid uncontrolled continuous camera spinning.

## Aircraft

Use:
- instancing for formations;
- lightweight distant models;
- higher-detail hero models only near camera;
- compressed textures;
- sensible material counts.

Associate position/orientation/time with sources and confidence.

Do not invent false precision.

## Historical layers

Georeference historical maps/aerials where evidence allows.

Blend them over current coordinates.

Label reconstruction/interpretation.

## Fallback

Core meaning must survive:
- reduced motion;
- WebGL failure;
- low-end devices;
- slow networks.

## Cartographic Infrastructure (revised Oct 2026)

### Project-owned basemap
- **Source of the visible map:** static 512px Web Mercator tiles in `public/tiles/darwin-basemap/`, rendered by `scripts/cartography/build_basemap.py` from **OpenStreetMap** (© OpenStreetMap contributors, ODbL) and **Natural Earth** (public domain), in the project palette. No labels, no POIs, no API key, no per-view cost, works offline.
- **Layers** (`src/lib/spatial/basemap-manifest.json`): global z0–4 → Timor Sea/Darwin regional z5–9 → Tiwi Islands/Darwin z10–12 → Port Darwin harbour z13–15 → town core z16. Each is opaque within its rectangle; same palette, so transitions are invisible. Tile water colour equals `globe.baseColor`.
- **Content:** OSM coastline assembled into land; mangroves (chart-style stipple); intertidal flats; inland water; present-day wharves, piers and breakwaters; roads; buildings (z14+); runways; chart-style shallow-water tint along every shore.
- **Temporal status:** the basemap is **PRESENT DAY**. 1942 features are overlays from canon, never baked into tiles.
- **Attribution:** "© OpenStreetMap contributors · Natural Earth" must remain visible in the stage/dock credits.
- **Rebuild:** see the script header (needs the NT `.osm.pbf` extract and `ne_10m_land.geojson`; ~30 min on 2 cores). Re-run when cartography style changes or OSM coastline updates matter.

### Architectural policy (unchanged)
The basemap is infrastructure beneath the story; raster basemaps should be treated as replaceable. Do NOT introduce MapLibre, deck.gl, or another map engine. CesiumJS remains the sole Historical Spatial Engine and world-space authority. If the static basemap approach ever proves insufficient, evaluate Cesium-native vector tile/MVT pipelines or self-hosted PMTiles/TMS before considering any runtime changes.

### Why CARTO was removed
CARTO raster basemaps now require an API key. Anonymous requests return HTTP **200** "API KEY REQUIRED" placeholder images, so the previous error-based fallback never fired and the live site showed a watermarked void. Do not reintroduce a keyed third-party tile service without an owner decision on account, quota and billing.

### Cesium runtime assets
`public/cesium/` (Workers, Widgets, Assets, ThirdParty) is generated from `node_modules/cesium` by `scripts/sync-cesium-assets.mjs` before `dev` and `build`, and is git-ignored. The previously committed copy was Cesium 1.145, lacked Workers/ and Widgets/, and nested NaturalEarthII inside LensFlare/, which broke geometry, tile loading and canvas sizing in production.

### Historical rasters
Raster overlays may only be presented as cartography when they are genuine archival sources registered with documented ground-control points and residuals. The former `archival-texture-*.png` and `darwin-1942-overlay.png` files are AI-generated illustrations with invented geography; they are not used by the engine.

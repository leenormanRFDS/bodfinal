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

## Cartographic Infrastructure & Raster Lifecycle

### CARTO Raster Basemap Service Lifecycle
- **Active Endpoint:** `https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}.png?key=${PUBLIC_CARTO_BASEMAP_KEY}`.
- **Allowance & Terms:** The CARTO free basemap allowance is currently 5 million tile requests per calendar month. Commercial or high-volume use may require review with CARTO.
- **Mandatory Attribution:** CARTO + OpenStreetMap attribution is strictly mandatory and must remain visible in both the Cesium credit provider and the application interface footer.
- **Service Status & Replacement Risk:** CARTO designates raster PNG basemaps as legacy infrastructure and indicates vector tiles (MVT) are its preferred future direction; raster basemaps should be treated as replaceable.
- **Architectural Policy:** Do NOT introduce MapLibre, deck.gl, or another map engine. CesiumJS remains the sole Historical Spatial Engine and world-space authority. If CARTO discontinues raster tiles in the future, evaluate Cesium-native vector tile/MVT pipelines or self-hosted PMTiles/TMS before considering any runtime changes.
- **Fallback Guarantee:** If `PUBLIC_CARTO_BASEMAP_KEY` is absent or remote tile requests fail, the spatial engine automatically falls back to the bundled offline Natural Earth II TMS tiles (`/cesium/Assets/Textures/NaturalEarthII`). Unauthenticated external requests to CARTO are strictly prohibited in production.
- **Referer Restriction:** Production CARTO basemap keys must be restricted to authorized domains: `thebombingofdarwin.com.au` and `www.thebombingofdarwin.com.au` (with preview and dev hosts added only as necessary).

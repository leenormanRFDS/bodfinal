#!/usr/bin/env python3
"""
THE BOMBING OF DARWIN — Project-owned historical basemap builder.

Renders a static, label-free, dark cartographic basemap for the Historical
Spatial Engine from open geographic data, in the project palette.

WHY THIS EXISTS
  The engine previously depended on CARTO raster tiles. CARTO now requires an
  API key; anonymous requests return HTTP 200 "API KEY REQUIRED" placeholder
  images, so the engine's error-based fallback never fired and visitors saw a
  watermarked void. Hand-typed coastline polylines and AI-generated "archival"
  textures were layered on top to compensate.

  This builder replaces all of that with real geography rendered once into
  static tiles. No API key, no per-view cost, no third-party outage risk, no
  commercial labels/POIs.

SOURCES (both open):
  * OpenStreetMap (c) OpenStreetMap contributors, ODbL 1.0
    Northern Territory extract: download.openstreetmap.fr/extracts/oceania/australia/
    Used for: coastline (assembled into land), mangrove/wetland, tidal flats,
    inland water, piers/wharves/breakwaters, roads, buildings, runways.
    NOTE: this is PRESENT-DAY geography. 1942 features are overlays, never baked in.
  * Natural Earth 10m land (public domain) for global/regional context outside
    the OSM extract.

OUTPUT:
  public/tiles/darwin-basemap/{z}/{x}/{y}.png   (512px, Web Mercator / XYZ)
  src/lib/spatial/basemap-manifest.json        (layer rectangles + zoom ranges)

USAGE:
  pip install shapely osmium pillow numpy
  python3 scripts/cartography/build_basemap.py \
      --osm /path/northern_territory-latest.osm.pbf \
      --ne  /path/ne_10m_land.geojson \
      --out public/tiles/darwin-basemap
"""
from __future__ import annotations

import argparse
import json
import math
import os
import sys
import time
from dataclasses import dataclass

import numpy as np
import osmium
import shapely
from PIL import Image, ImageDraw, ImageFilter
from shapely.geometry import LineString, MultiPolygon, Point, Polygon, box, shape
from shapely.ops import linemerge, polygonize, unary_union
from shapely.strtree import STRtree

# --------------------------------------------------------------------------
# Palette (authored; see config/design-tokens.json — void/charcoal/steel/ivory)
# Water MUST equal globe.baseColor in cartography-manager.ts so tile edges vanish.
# --------------------------------------------------------------------------
WATER = (7, 10, 14)            # #070A0E  deep void water
TIDAL = (16, 21, 26)           # intertidal flats / mud: barely lifted from water
LAND = (40, 46, 53)            # steel land, visibly lighter than water
MANGROVE = (30, 36, 38)        # darker, faintly green-neutral fringe
MANGROVE_DOT = (44, 52, 53)    # stipple, chart-like mangrove symbol
SAND = (48, 51, 54)            # beaches / sand
INLAND_WATER = WATER
ROAD_MINOR = (50, 57, 65)
ROAD_MAJOR = (62, 70, 79)
BUILDING = (47, 54, 62)
RUNWAY = (58, 65, 73)
PIER = (196, 188, 172)         # bone, applied at partial alpha — present-day wharf structure
SHALLOW = (17, 23, 29)         # chart-style shallow-water tint at the shoreline, fades to WATER
COAST = (238, 233, 223)        # archive ivory, applied with low alpha

TILE = 512
SS = 3  # supersampling factor for anti-aliasing

# --------------------------------------------------------------------------
# Coverage (lon_min, lat_min, lon_max, lat_max), zoom ranges.
# Each layer is opaque within its rectangle; finer layers sit above coarser ones.
# --------------------------------------------------------------------------
@dataclass
class Layer:
    id: str
    rect: tuple
    zmin: int
    zmax: int

LAYERS = [
    Layer('global', (-180.0, -85.0, 180.0, 85.0), 0, 4),
    Layer('regional', (126.0, -15.0, 133.5, -8.5), 5, 9),       # Timor Sea launch area -> Darwin
    Layer('tiwi-darwin', (129.85, -12.85, 131.55, -11.15), 10, 12),  # Tiwi Islands, Clarence Strait, Darwin
    Layer('harbour', (130.66, -12.62, 131.00, -12.36), 13, 15),   # Port Darwin, arms, town peninsula
    Layer('core', (130.805, -12.495, 130.885, -12.430), 16, 16),  # town, Stokes Hill, Fort Hill, inner harbour
]
OSM_BBOX = (129.80, -12.90, 131.60, -11.10)  # extraction window (covers tiwi-darwin)

R = 6378137.0


def merc(lon, lat):
    x = np.radians(lon) * R
    y = R * np.log(np.tan(np.pi / 4 + np.radians(lat) / 2))
    return x, y


def tile_bounds_merc(z, x, y):
    n = 2 ** z
    size = 2 * math.pi * R / n
    minx = -math.pi * R + x * size
    maxy = math.pi * R - y * size
    return minx, maxy - size, minx + size, maxy


def tile_bounds_lonlat(z, x, y):
    n = 2 ** z
    lon1 = x / n * 360 - 180
    lon2 = (x + 1) / n * 360 - 180
    lat1 = math.degrees(math.atan(math.sinh(math.pi * (1 - 2 * (y + 1) / n))))
    lat2 = math.degrees(math.atan(math.sinh(math.pi * (1 - 2 * y / n))))
    return lon1, lat1, lon2, lat2


def tiles_for_rect(z, rect):
    lon1, lat1, lon2, lat2 = rect
    n = 2 ** z

    def tx(lon):
        return int(math.floor((lon + 180) / 360 * n))

    def ty(lat):
        lat = max(min(lat, 85.0511), -85.0511)
        r = math.radians(lat)
        return int(math.floor((1 - math.log(math.tan(r) + 1 / math.cos(r)) / math.pi) / 2 * n))

    x0, x1 = max(0, tx(lon1)), min(n - 1, tx(lon2 - 1e-12))
    y0, y1 = max(0, ty(lat2)), min(n - 1, ty(lat1 + 1e-12))
    for x in range(x0, x1 + 1):
        for y in range(y0, y1 + 1):
            yield x, y


# --------------------------------------------------------------------------
# OSM extraction
# --------------------------------------------------------------------------
class Collector(osmium.SimpleHandler):
    def __init__(self, bbox):
        super().__init__()
        self.bbox = bbox
        self.coast = []
        self.mangrove, self.wetland, self.tidal, self.water, self.sand = [], [], [], [], []
        self.pier_areas, self.pier_lines = [], []
        self.roads_major, self.roads_minor = [], []
        self.buildings, self.runway_areas, self.runway_lines = [], [], []
        self.wkb = osmium.geom.WKBFactory()

    def _in(self, lon, lat):
        b = self.bbox
        return b[0] <= lon <= b[2] and b[1] <= lat <= b[3]

    def _line(self, w):
        try:
            pts = [(n.lon, n.lat) for n in w.nodes]
        except osmium.InvalidLocationError:
            return None
        if len(pts) < 2 or not any(self._in(*p) for p in pts):
            return None
        return LineString(pts)

    def way(self, w):
        t = w.tags
        if t.get('natural') == 'coastline':
            g = self._line(w)
            if g is not None:
                self.coast.append(g)
            return
        hw = t.get('highway')
        if hw:
            if hw in ('motorway', 'trunk', 'primary', 'secondary', 'motorway_link', 'trunk_link', 'primary_link'):
                g = self._line(w)
                if g is not None:
                    self.roads_major.append(g)
            elif hw in ('tertiary', 'residential', 'unclassified', 'living_street', 'tertiary_link', 'secondary_link'):
                g = self._line(w)
                if g is not None:
                    self.roads_minor.append(g)
            return
        mm = t.get('man_made')
        if mm in ('pier', 'breakwater', 'groyne', 'quay') and not w.is_closed():
            g = self._line(w)
            if g is not None:
                self.pier_lines.append(g)
            return
        if t.get('aeroway') in ('runway', 'taxiway') and not w.is_closed():
            g = self._line(w)
            if g is not None:
                self.runway_lines.append((g, t.get('aeroway')))

    def area(self, a):
        t = a.tags
        try:
            g = shapely.from_wkb(self.wkb.create_multipolygon(a))
        except Exception:
            return
        if g.is_empty:
            return
        minx, miny, maxx, maxy = g.bounds
        b = self.bbox
        if maxx < b[0] or minx > b[2] or maxy < b[1] or miny > b[3]:
            return
        nat = t.get('natural')
        if nat == 'wetland':
            wt = t.get('wetland', '')
            if wt == 'mangrove':
                self.mangrove.append(g)
            elif wt in ('tidalflat', 'saltmarsh', 'saltern'):
                self.tidal.append(g)
            else:
                self.wetland.append(g)
        elif nat in ('mud', 'shoal') or t.get('tidal') == 'yes' and nat in ('sand', 'bare_rock'):
            self.tidal.append(g)
        elif nat in ('beach', 'sand'):
            self.sand.append(g)
        elif nat == 'water' or t.get('waterway') == 'riverbank' or t.get('landuse') in ('reservoir', 'basin'):
            if t.get('water') not in ('wastewater',):
                self.water.append(g)
        elif t.get('man_made') in ('pier', 'breakwater', 'quay', 'groyne') or t.get('landuse') == 'port' and False:
            self.pier_areas.append(g)
        elif t.get('aeroway') in ('runway', 'taxiway', 'apron'):
            self.runway_areas.append(g)
        elif 'building' in t and t.get('building') != 'no':
            self.buildings.append(g)


def assemble_land(coast_lines, bbox):
    """Assemble OSM coastline ways (land on the LEFT) into land polygons within bbox."""
    frame = box(*bbox)
    merged = linemerge(unary_union(coast_lines))
    parts = list(merged.geoms) if hasattr(merged, 'geoms') else [merged]

    clipped = []
    for ln in parts:
        c = ln.intersection(frame)
        if c.is_empty:
            continue
        if hasattr(c, 'geoms'):
            clipped.extend([g for g in c.geoms if isinstance(g, LineString)])
        elif isinstance(c, LineString):
            clipped.append(c)

    noded = unary_union(clipped + [frame.exterior])
    faces = list(polygonize(noded))

    # Side probes: a point just left (land) and right (water) of each coastline segment.
    eps = 2e-6
    land_probes, water_probes = [], []
    for ln in clipped:
        coords = list(ln.coords)
        step = max(1, len(coords) // 400)
        for i in range(0, len(coords) - 1, step):
            (x1, y1), (x2, y2) = coords[i], coords[i + 1]
            dx, dy = x2 - x1, y2 - y1
            L = math.hypot(dx, dy)
            if L == 0:
                continue
            mx, my = (x1 + x2) / 2, (y1 + y2) / 2
            nx, ny = -dy / L, dx / L
            land_probes.append(Point(mx + nx * eps, my + ny * eps))
            water_probes.append(Point(mx - nx * eps, my - ny * eps))

    tree = STRtree(faces)
    score = np.zeros(len(faces))
    for p in land_probes:
        for idx in tree.query(p, predicate='intersects'):
            score[idx] += 1
    for p in water_probes:
        for idx in tree.query(p, predicate='intersects'):
            score[idx] -= 1
    land = [f for f, s in zip(faces, score) if s > 0]
    unresolved = sum(1 for s in score if s == 0)
    print(f'  coastline: {len(clipped)} segments, {len(faces)} faces, {len(land)} land, {unresolved} unresolved', flush=True)
    return unary_union(land)


def load_ne_land(path):
    with open(path) as f:
        fc = json.load(f)
    geoms = [shape(feat['geometry']) for feat in fc['features']]
    return unary_union(geoms)


# --------------------------------------------------------------------------
# Rendering
# --------------------------------------------------------------------------
def to_merc_geom(g):
    def tf(coords):
        a = np.asarray(coords)
        x, y = merc(a[:, 0], np.clip(a[:, 1], -85.05, 85.05))
        return np.column_stack([x, y])
    return shapely.transform(g, lambda c: tf(c))


class Renderer:
    def __init__(self, feats):
        self.f = feats
        self.trees = {k: STRtree(v) if v else None for k, v in feats.items()}

    def q(self, key, bounds):
        tree = self.trees.get(key)
        if tree is None:
            return []
        idx = tree.query(box(*bounds))
        return [self.f[key][i] for i in idx]

    def render(self, z, x, y):
        W = TILE * SS
        M = W // 8  # margin so blurs, strokes and stipple are continuous across tile seams
        WM = W + 2 * M
        minx, miny, maxx, maxy = tile_bounds_merc(z, x, y)
        sx = W / (maxx - minx)
        sy = W / (maxy - miny)
        mx_m = M / sx
        my_m = M / sy
        qb = (minx - mx_m, miny - my_m, maxx + mx_m, maxy + my_m)
        metres_per_px = (maxx - minx) / W * math.cos(math.radians(-12.5))

        def px(coords):
            a = np.asarray(coords)
            return list(zip(((a[:, 0] - minx) * sx + M).tolist(), ((maxy - a[:, 1]) * sy + M).tolist()))

        def polys(geoms):
            for g in geoms:
                for poly in (g.geoms if hasattr(g, 'geoms') else [g]):
                    if isinstance(poly, Polygon) and not poly.is_empty:
                        yield poly

        img = Image.new('RGB', (WM, WM), WATER)
        d = ImageDraw.Draw(img)

        land = self.q('land', qb)
        land_mask = Image.new('L', (WM, WM), 0)
        lm = ImageDraw.Draw(land_mask)
        for poly in polys(land):
            lm.polygon(px(poly.exterior.coords), fill=255)
            for hole in poly.interiors:
                lm.polygon(px(hole.coords), fill=0)

        # 0. Shallow-water tint: blurred land mask on a dedicated low-res canvas whose margin
        #    exceeds the blur reach, so the field is continuous across tile seams.
        if z >= 8:
            reach_m = 260 if z >= 13 else (700 if z >= 11 else 2200)
            tile_m = maxx - minx
            LR = 256
            m_per_lr = tile_m / LR
            margin_lr = int(math.ceil(2.5 * reach_m / m_per_lr))
            N = LR + 2 * margin_lr
            fminx, fmaxy = minx - margin_lr * m_per_lr, maxy + margin_lr * m_per_lr
            fb = (fminx, fmaxy - N * m_per_lr, fminx + N * m_per_lr, fmaxy)
            field = Image.new('L', (N, N), 0)
            fd = ImageDraw.Draw(field)

            def fpx(coords):
                a = np.asarray(coords)
                return list(zip(((a[:, 0] - fminx) / m_per_lr).tolist(), ((fmaxy - a[:, 1]) / m_per_lr).tolist()))

            for poly in polys(self.q('land', fb)):
                fd.polygon(fpx(poly.exterior.coords), fill=255)
                for hole in poly.interiors:
                    fd.polygon(fpx(hole.coords), fill=0)
            field = field.filter(ImageFilter.GaussianBlur(radius=max(0.8, reach_m / m_per_lr / 2.0)))
            # crop to tile + M margin, upsample to canvas
            mlr = M / W * LR
            c0 = margin_lr - mlr
            field = field.crop((int(round(c0)), int(round(c0)), int(round(c0 + LR + 2 * mlr)), int(round(c0 + LR + 2 * mlr))))
            blur = np.asarray(field.resize((WM, WM), Image.BILINEAR)).astype(np.float32) / 255.0
            t = np.clip(blur * 2.2, 0, 1) ** 0.9  # 1 at shore -> 0 offshore
            sh = np.array(SHALLOW, dtype=np.float32)
            wa = np.array(WATER, dtype=np.float32)
            tint = wa + (sh - wa) * t[..., None]
            img = Image.fromarray(np.clip(tint, 0, 255).astype(np.uint8))
            d = ImageDraw.Draw(img)

        # 1. Land
        img.paste(LAND, (0, 0), land_mask)

        detailed = z >= 10
        if detailed:
            for poly in polys(self.q('tidal', qb)):
                d.polygon(px(poly.exterior.coords), fill=TIDAL)
            mangroves = list(polys(self.q('mangrove', qb)))
            for poly in mangroves:
                d.polygon(px(poly.exterior.coords), fill=MANGROVE)
            if mangroves and z >= 12:
                mask = Image.new('L', (WM, WM), 0)
                md = ImageDraw.Draw(mask)
                for poly in mangroves:
                    md.polygon(px(poly.exterior.coords), fill=255)
                spacing = 7 * SS
                ox = x * W - M  # world pixel of canvas origin
                oy = y * W - M
                dots = Image.new('L', (WM, WM), 0)
                dd = ImageDraw.Draw(dots)
                r = max(1, SS // 2 + (1 if z >= 14 else 0))
                row0 = math.floor(oy / spacing)
                for row in range(row0, row0 + WM // spacing + 2):
                    yy = row * spacing - oy
                    off = spacing // 2 if row % 2 else 0
                    col0 = math.floor((ox - off) / spacing)
                    for col in range(col0, col0 + WM // spacing + 2):
                        xx = col * spacing + off - ox
                        dd.ellipse((xx - r, yy - r, xx + r, yy + r), fill=255)
                m = np.minimum(np.asarray(mask), np.asarray(dots))
                img.paste(MANGROVE_DOT, (0, 0), Image.fromarray(m))
            for poly in polys(self.q('wetland', qb)):
                d.polygon(px(poly.exterior.coords), fill=MANGROVE)
            for poly in polys(self.q('sand', qb)):
                d.polygon(px(poly.exterior.coords), fill=SAND)
            for poly in polys(self.q('water', qb)):
                d.polygon(px(poly.exterior.coords), fill=INLAND_WATER)
                for hole in poly.interiors:
                    d.polygon(px(hole.coords), fill=LAND)

        def stroke(geoms, colour, width):
            w = max(1, int(round(width * SS)))
            for g in geoms:
                for ln in (g.geoms if hasattr(g, 'geoms') else [g]):
                    if ln.is_empty or isinstance(ln, Polygon):
                        continue
                    d.line(px(ln.coords), fill=colour, width=w, joint='curve')

        if z >= 12:
            if z >= 14:
                for poly in polys(self.q('buildings', qb)):
                    d.polygon(px(poly.exterior.coords), fill=BUILDING)
            stroke(self.q('roads_minor', qb), ROAD_MINOR, 0.6 if z < 14 else (1.0 if z < 16 else 1.6))
            stroke(self.q('roads_major', qb), ROAD_MAJOR, 0.9 if z < 14 else (1.6 if z < 16 else 2.4))
            for poly in polys(self.q('runway_areas', qb)):
                d.polygon(px(poly.exterior.coords), fill=RUNWAY)
        if z >= 11:
            stroke(self.q('runway_lines', qb), RUNWAY, 2.0 if z < 14 else 5.0)

        overlay = Image.new('RGBA', (WM, WM), (0, 0, 0, 0))
        od = ImageDraw.Draw(overlay)
        # 2. Coastline hairline: chart precision, not a glow.
        alpha = 70 if z < 8 else (95 if z < 13 else 120)
        cw = max(1, int(round((0.7 if z < 10 else 0.9 if z < 14 else 1.1) * SS)))
        for poly in polys(land):
            od.line(px(poly.exterior.coords), fill=COAST + (alpha,), width=cw, joint='curve')
            for h in poly.interiors:
                od.line(px(h.coords), fill=COAST + (alpha,), width=cw, joint='curve')

        # 3. Present-day wharves, piers, breakwaters — "Same wharf." Muted so event gold stays dominant.
        if z >= 12:
            pa = 92 if z >= 14 else 72
            for poly in polys(self.q('pier_areas', qb)):
                od.polygon(px(poly.exterior.coords), fill=PIER + (pa,))
            pw = max(1, int(round((1.2 if z < 14 else 2.2 if z < 16 else 3.4) * SS)))
            for g in self.q('pier_lines', qb):
                for ln in (g.geoms if hasattr(g, 'geoms') else [g]):
                    od.line(px(ln.coords), fill=PIER + (pa,), width=pw, joint='curve')

        img = img.convert('RGBA')
        img.alpha_composite(overlay)
        img = img.crop((M, M, M + W, M + W)).convert('RGB')
        return img.resize((TILE, TILE), Image.LANCZOS)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--osm', required=True)
    ap.add_argument('--ne', required=True)
    ap.add_argument('--out', required=True)
    ap.add_argument('--manifest', default='src/lib/spatial/basemap-manifest.json')
    ap.add_argument('--only', default='')
    ap.add_argument('--shard', default='0/1', help='i/n: render only every n-th tile (parallel builds)')
    ap.add_argument('--skip-existing', action='store_true')
    args = ap.parse_args()

    t0 = time.time()
    print('Reading OSM extract…', flush=True)
    col = Collector(OSM_BBOX)
    col.apply_file(args.osm, locations=True)
    print(f'  coast={len(col.coast)} mangrove={len(col.mangrove)} tidal={len(col.tidal)} water={len(col.water)} '
          f'piers={len(col.pier_lines)}+{len(col.pier_areas)} roads={len(col.roads_major)}+{len(col.roads_minor)} '
          f'buildings={len(col.buildings)} runways={len(col.runway_lines)}+{len(col.runway_areas)}', flush=True)

    print('Assembling land from coastline…', flush=True)
    osm_land = assemble_land(col.coast, OSM_BBOX)

    print('Loading Natural Earth land…', flush=True)
    ne_land = load_ne_land(args.ne)
    frame = box(*OSM_BBOX)
    land_all = unary_union([ne_land.difference(frame), osm_land])

    print('Projecting…', flush=True)

    def proj_list(geoms):
        out = []
        for g in geoms:
            if g is None or g.is_empty:
                continue
            if not g.is_valid:
                g = g.buffer(0)
            out.append(to_merc_geom(g))
        return out

    def explode(g):
        return list(g.geoms) if hasattr(g, 'geoms') else [g]

    # Simplified land for low zooms keeps global rendering fast.
    land_low = land_all.simplify(0.02, preserve_topology=True)
    feats_detail = {
        'land': proj_list(explode(land_all)),
        'mangrove': proj_list(col.mangrove),
        'wetland': proj_list(col.wetland),
        'tidal': proj_list(col.tidal),
        'water': proj_list(col.water),
        'sand': proj_list(col.sand),
        'pier_areas': proj_list(col.pier_areas),
        'pier_lines': proj_list(col.pier_lines),
        'roads_major': proj_list(col.roads_major),
        'roads_minor': proj_list(col.roads_minor),
        'buildings': proj_list(col.buildings),
        'runway_areas': proj_list(col.runway_areas),
        'runway_lines': proj_list([g for g, _ in col.runway_lines]),
    }
    feats_low = {'land': proj_list(explode(land_low))}
    r_detail = Renderer(feats_detail)
    r_low = Renderer(feats_low)
    print(f'  prepared in {time.time() - t0:.0f}s', flush=True)

    only = set(args.only.split(',')) if args.only else None
    total = 0
    for layer in LAYERS:
        if only and layer.id not in only:
            continue
        for z in range(layer.zmin, layer.zmax + 1):
            tiles = list(tiles_for_rect(z, layer.rect))
            print(f'{layer.id} z{z}: {len(tiles)} tiles', flush=True)
            renderer = r_low if z <= 6 else r_detail
            si, sn = (int(v) for v in args.shard.split('/'))
            for k, (x, y) in enumerate(tiles):
                if k % sn != si:
                    continue
                if args.skip_existing and os.path.exists(os.path.join(args.out, str(z), str(x), f'{y}.png')):
                    continue
                img = renderer.render(z, x, y)
                p = os.path.join(args.out, str(z), str(x))
                os.makedirs(p, exist_ok=True)
                q = img.quantize(colors=64, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE)
                q.save(os.path.join(p, f'{y}.png'), optimize=True)
                total += 1

    manifest = {
        'description': 'Project-owned basemap tile layers (see scripts/cartography/build_basemap.py).',
        # Content hash of every tile. Appended to tile URLs as ?v= so tiles can be served
        # with an immutable, year-long cache and still update when the basemap is rebuilt.
        'version': tree_version(args.out),
        'urlTemplate': '/tiles/darwin-basemap/{z}/{x}/{y}.png',
        'tileSize': TILE,
        'waterColor': '#%02X%02X%02X' % WATER,
        'attribution': '© OpenStreetMap contributors (ODbL) · Natural Earth',
        'builtAt': time.strftime('%Y-%m-%d'),
        'layers': [{'id': l.id, 'rect': list(l.rect), 'minimumLevel': l.zmin, 'maximumLevel': l.zmax} for l in LAYERS],
    }
    with open(args.manifest, 'w') as f:
        json.dump(manifest, f, indent=2)
    print(f'Done: {total} tiles in {time.time() - t0:.0f}s. Manifest -> {args.manifest}', flush=True)


def tree_version(root):
    import hashlib
    h = hashlib.sha256()
    for dirpath, _, files in sorted(os.walk(root)):
        for name in sorted(files):
            if name.endswith('.png'):
                fp = os.path.join(dirpath, name)
                h.update(os.path.relpath(fp, root).encode())
                with open(fp, 'rb') as f:
                    h.update(f.read())
    return h.hexdigest()[:12]


if __name__ == '__main__':
    main()

#!/usr/bin/env python3
"""
Encode Spatial Engine beat posters (PNG canvas captures from scripts/capture-spatial.mjs --posters)
to WebP in public/spatial-posters/{desktop,mobile}/beatN.webp and update
src/lib/spatial/poster-manifest.json (beats present in BOTH layouts + content-hash version).

  python3 scripts/cartography/encode_posters.py --src qa-captures/<run>/posters [--beats 0,1,...]
"""
import argparse
import hashlib
import json
import os

from PIL import Image

OUT = 'public/spatial-posters'
MANIFEST = 'src/lib/spatial/poster-manifest.json'
LAYOUTS = ('desktop', 'mobile')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--src', required=True)
    ap.add_argument('--beats', default='0,1,2,3,4,5,6,7')
    ap.add_argument('--quality', type=int, default=80)
    args = ap.parse_args()
    beats = [int(b) for b in args.beats.split(',')]

    for layout in LAYOUTS:
        os.makedirs(os.path.join(OUT, layout), exist_ok=True)
        for b in beats:
            src = os.path.join(args.src, layout, f'beat{b}.png')
            if not os.path.exists(src):
                continue
            im = Image.open(src).convert('RGB')
            dst = os.path.join(OUT, layout, f'beat{b}.webp')
            im.save(dst, 'WEBP', quality=args.quality, method=6)
            print(f'{dst}: {im.width}x{im.height} {os.path.getsize(dst) // 1024} KB')

    present = sorted(
        b for b in range(8)
        if all(os.path.exists(os.path.join(OUT, l, f'beat{b}.webp')) for l in LAYOUTS)
    )
    h = hashlib.sha256()
    for l in LAYOUTS:
        for b in present:
            with open(os.path.join(OUT, l, f'beat{b}.webp'), 'rb') as f:
                h.update(f.read())

    with open(MANIFEST) as f:
        manifest = json.load(f)
    manifest['version'] = h.hexdigest()[:12]
    manifest['beats'] = present
    with open(MANIFEST, 'w') as f:
        json.dump(manifest, f, indent=2)
        f.write('\n')
    print(f'poster-manifest: beats {present}, version {manifest["version"]}')


if __name__ == '__main__':
    main()

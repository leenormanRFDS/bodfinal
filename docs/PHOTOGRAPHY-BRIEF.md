# Photography & Image Sourcing Brief
_The Bombing of Darwin Experience — art direction for real imagery_
_Prepared 18 July 2026_

This brief lists every image slot now built into the site, what currently fills it
(a stand-in), and what to source or shoot to replace it. Drop the final files in at the
paths shown and they inherit the treatment automatically — no code changes needed.

---

## The register system (keep this discipline)

Every image on the site belongs to one of two registers. This is what makes disparate
photos feel like one authored exhibition, and it's applied automatically in CSS.

- **Archival** — anything of 1942. Rendered warm monochrome + grain (recovered-record look).
- **Present** — the facility, the wharf, visitors, aircraft. Held desaturation (~60%) + grain,
  never full saturation, so nothing fights the ink/bone/gold palette.

When you supply a photo, you don't need to treat it — supply it clean and the site applies
the register. Just supply the **highest-resolution original** you can.

---

## PART 1 — Archival (license, don't shoot)

Primary source: **Australian War Memorial** (awm.gov.au/collection) — much 1942 Darwin
material is public-domain or low-cost for non-commercial/commemorative use. Also:
**Library & Archives NT**, **National Archives of Australia**. Always confirm the licence
and credit line per image; store the accession number for the caption.

| Slot | Path to replace | What to source |
|---|---|---|
| Story — the raid (full-bleed) | `/images/story/raid-wide.webp` | A real photograph of the raid or its immediate aftermath over the harbour — smoke, ships ablaze. (Currently the illustrated poster crop.) |
| Story — timeline beats (not yet placed) | new `Plate`s | The Post Office ruin; USS _Peary_; the wharf/oil tanks burning; the town after. Place one per key timeline moment. |
| In Memoriam — single image (optional) | — | The Post Office ruin, one frame only, near the ten names. One image, maximum restraint. |
| People portraits | `/images/people/*.webp` | Verified portraits of Curtin, Rear Adm. Grant, Toyoshima, Ulungura. **Grant is flagged draft — confirm identity/likeness with AWM before publishing.** Confirm cultural clearance for Ulungura's image with the Tiwi community. |

Captions use an artifact style — supply the accession number and we'll render
`Plate 03 · AWM 027334` etc.

---

## PART 2 — Present-day (a half-day facility shoot)

The present register is the half that sells tickets, and it's currently the thinnest.
One good shoot covers every slot below. Brief for the photographer:

**Look:** available light, real visitors, unstaged. We desaturate in-site, so shoot
for _tone and texture_, not saturated colour. Wide establishing frames **and** intimate
detail — the details are what make it feel valuable.

**Shot list**
- The exhibition floor, wide, under the wharf's steel roof (→ `/images/story/gallery-floor.webp`)
- The suspended replica aircraft from below (→ `/images/story/gallery-plane.webp`)
- The RFDS Pilatus PC-12 — full, plus cockpit and medical-cabin interiors (→ `/images/BOD_PC12.webp`)
- A visitor in a VR headset, face lit by the screen — ideally a child (→ `/images/VR_RFDSPC-12.webp`)
- **Detail set (important):** hands on the headset, propeller rivets, wall text, the RFDS livery, worn floor
- The building exterior on the wharf at **blue hour / dusk** (→ Visit + `/images/BOD_Wharf.webp`)
- The approach — how it looks walking up (Visit — sense of place)
- Two or three real visitor faces, candid (People/testimonial use later)

**Combo-ticket cards** (`aviation-combo`, `croc-n-history`, `croc-explorer`) currently use
wharf crops as stand-ins. Source approved imagery from the partner attractions
(Crocosaurus Cove, Darwin Explorer) or shoot them, so each card shows what it sells.

---

## Deliverables to send back
- Originals at full resolution (we optimise to WebP and crop).
- Licence + credit line for each archival image.
- We convert, crop to the built ratios, and place them — the treatment applies itself.

_Slots are live now with stand-ins; final images replace them one-for-one._

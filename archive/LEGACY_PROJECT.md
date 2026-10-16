# The Bombing of Darwin Experience — Project Brief & Handoff

This document is the memory of the project. It captures the *why* behind the code — the
design philosophy, the decisions, the state, and what's next — so anyone (a new machine, a
new AI session, or another designer/developer) can pick up with full context. Keep it
updated as the project evolves.

---

## 1. What this is

The website for **The Bombing of Darwin Experience** — an immersive VR / hologram / theatre
attraction on Stokes Hill Wharf, Darwin, presented with the **Royal Flying Doctor Service**.
It commemorates the air raids of **19 February 1942**. Domain: `thebombingofdarwin.com.au`.
Live preview: `bombingofdarwin.vercel.app`.

It is treated as a **digital memorial that also sells tickets** — dignity first; commerce
present but subordinate.

## 2. The design manifesto — "Archival Void"

We are not designing a tourism website; we are designing a memorial.
> Typography is architecture. Whitespace is silence. Animation is memory. Colour is
> restraint. Photography is evidence. Nothing exists solely because it looks cool. Every
> pixel must serve remembrance.

Influences: Jony Ive (ruthless reduction), Vignelli (remove), Swiss typography, Ferrari
Centro Stile (emotional restraint), the Australian War Memorial (dignity), military field
manuals (functional clarity), high-end editorial design. Sound design lens: *The Zone of
Interest* (horror via off-screen sound); Spielberg's restraint.

**Archival Void aesthetic:** base is bruised charcoal `#0C0C0B` (never pure black); a
microscopic monochrome film grain at ~7.5% (felt, not seen); a radial vignette so the
corners fall to darkness and content emerges from the centre like an artefact under museum
light. (Implemented as fixed overlays in `src/styles/global.css`, `.grain::before` /
`::after`.)

**Self-critique discipline:** score each screen /10 on Typography, Hierarchy, Rhythm,
Balance, Negative space, Emotional impact, Museum quality, Originality; redesign the weakest
until every category ≥ 9.5. (This pass is still outstanding — see §8.)

## 3. Design system

- **Colour** (`src/styles/tokens.css`): `--ink #0C0C0B`, warm-charcoal surfaces, bone text
  `#ECE7DB`, one gold hairline `#C6A15B`, muted red `--signal` (red-string / stamps). Cyan
  was **retired** from the interface (it read as a tech gimmick and undercut the memorial).
- **Type roles:**
  - Display / monuments — **Guildhall** (Compressed for the big tagline, Condensed for
    titles), via Adobe Fonts kit `https://use.typekit.net/hoe3ija.css`.
  - Human voice / narrative — **Spectral** (serif), Google Fonts.
  - Labels / records / telemetry — **Aktiv Grotesk** (Adobe Fonts), falls back to Work Sans.
    Bigger, medium weight, with a soft text-glow.
  - Body / UI — Work Sans.
- **Motion:** slow, weighted, reduced-motion-safe (Lenis smooth scroll + GSAP).
- Reusable pieces: `PageHeader.astro`, `Window`/aperture pattern, `.record` / `.eyebrow`
  labels, `.btn-book` (the illuminated gold button), `CulturalWarning.astro`.

## 4. Architecture

- **Astro** (static output) → **GitHub** → **Vercel** (auto-deploy on push to `main`).
- Booking proxy: `api/availability.js` is a **Vercel serverless function** holding the Rezdy
  key server-side (never in the browser); returns mock data until env vars are set. Region
  `syd1` (`vercel.json`).
- Analytics: GA4 `G-MQ9641V0NY` in `src/components/Analytics.astro`, **production only**
  (never fires on localhost).

## 5. Site structure (chapters per the Tourism Manager's brief — `source/BOD_BEK.docx`)

- **Home** (`/`) — the **window hero**: void with the monument tagline "WW2 HAPPENED HERE",
  beside a framed evidence-window showing the family on the wharf as the bombs fall.
- **The Experience** (`/experience`) — the three pillars (Step Into History · Meet the
  People · Hear Ampiyartiliwayi's Story), the **Cultural Warning**, and the **Meet the
  People** coverflow of archival case-files (Curtin, Rear Adm. Grant, Toyoshima, Ulungura).
- **The Story** (`/story`) — the 09:58 scroll-timeline of the raid, then The Reckoning.
- **The Witness** (`/witness`) — the period **TV** (`bod_tv.svg`, rendered to a transparent
  webp); a 3-frame montage crossfades through the screen hole (CRT-treated). Swap the frames
  for a `<video>` when real footage is licensed. (No 3D / no spin — deliberately.)
- **Visit / Tickets / Schools & Groups / Accessibility / Contact** — information pages.
- **`/book`** — the seamless booking skin (date → time → tickets → illuminated Book).

## 6. Key decisions & facts

- **Prices:** Adult $30 · Child $18 · Concession $26 · **Family $90 = 2 adults + 3 children**
  (Bek's figure overrides the poster's 2A+2C). Every ticket includes **both** the Bombing of
  Darwin and the RFDS experiences.
- **Booking (phased):** Phase 1 = branded selection skin, Book hands off to Rezdy checkout
  (`rfdsdarwin1.rezdy.com`). Phase 2 = full headless payment (Stripe tokenisation via the
  proxy) — not built yet.
- **Translation:** EN / 简体中文 / 日本語 switcher + browser-translate as catch-all; the
  Acknowledgement and Ampiyartiliwayi's story must be **human-translated**, never machine.
- **In Memoriam (still to build, planned last):** there is **no complete roll** — most of the
  ~235+ dead were never identified. Name those we can verify (AWM Roll of Honour, USS Peary /
  US Navy, merchant navy; Japanese airmen where recorded — both sides), then honour the
  unnamed majority. Set with the Ode of Remembrance (Binyon, public domain in Australia).

## 7. Historical integrity

Facts are sourced (AWM, DVA, National Archives, US Navy). Copy flagged `draft` needs
verification before publishing — notably **Rear Admiral Grant's** bio (`src/data/people.ts`).
All historical/cultural copy should get the Tourism Manager's sign-off.

## 8. Config the site owner controls

- **Vercel → Settings → Environment Variables:** `REZDY_API_KEY`, `REZDY_PRODUCT_CODE`
  (secret; enables live availability). Not in the repo.
- **Adobe Fonts** (kit `hoe3ija`): ensure **Guildhall** (Regular/Condensed/Compressed) and
  **Aktiv Grotesk** are in the web project. Adobe Fonts has **no domain allowlist** — nothing
  else to configure.
- Rezdy API key and the Mapbox token (for a future map) are provided out-of-band, never
  committed.

## 9. Asset pipeline

- Raw high-res artwork lives in `source/` (gitignored — kept locally only, transfer by hand).
- Web-optimised versions are generated into `public/` and **are** committed:
  `public/images/hero/*.webp` (10 poster layers, ~776 KB total), `public/images/witness/*`
  (TV set + montage frames), `public/brand/logo-1942.svg`.
- Optimising was done with Pillow (images) and `@gltf-transform/cli` (the old 3D model, now
  retired). Re-run those against `source/` originals if new art arrives.

## 10. Run / build / deploy

```bash
npm install        # first time (and after any dependency change)
npm run dev        # local preview at http://localhost:4321
npm run build      # production build to /dist
git add . && git commit -m "..." && git push   # deploys via Vercel
```

Work on **one machine at a time**: `git pull` when you start, `git push` when you finish.

## 11. Status — done vs next

**Done:** foundation + design system; Archival Void; the window hero; all information pages;
the booking skin (Phase 1); The Story timeline; The Experience + Meet the People; The Witness
TV; GA4; asset optimisation; Guildhall + Aktiv Grotesk + Spectral type system.

**Next, in order:**
1. **Scored polish pass** — every page audited to the eight categories, weakest redesigned to ≥ 9.5.
2. **In Memoriam** — the sourced roll + the Ode (see §6).
3. **The cinematic opening** for The Experience (typewriter → radio → the P-40 misidentification → the swarm → the TV reveal) — needs licensed audio; caption-first for accessibility.
4. **Phase-2 headless payment** (Rezdy + Stripe) once API access is confirmed.
5. Real footage into the TV screen; real portraits into Meet the People (cultural care for Ulungura).

**Honest state:** what's shipped is a strong, coherent memorial *foundation* (~7.5/10 against
the manifesto's bar). The scored polish pass (and the window hero, now done) are what take it
to the world-class-in-ten-years standard the brief demands.

# Skill: Release QA

Use before production deployment or after a substantial feature.

## Truth
- no new unsourced historical claims;
- archive/reconstruction states labelled;
- canonical values consistent.

## Experience
- narrative sequence coherent;
- utility pathways immediate;
- no interaction blocks reading/navigation.

## Design
- design tokens used;
- no aesthetic drift;
- responsive states composed.

## Accessibility
- keyboard;
- focus;
- touch;
- reduced motion;
- semantic reading order;
- alt/captions where relevant;
- hidden responsive duplicates not exposed.

## Technology
- build/tests pass;
- no core console errors;
- 3D/WebGL fallback works;
- assets load sensibly;
- no client-side secrets;
- third-party failures handled.

## Visitor Growth
- booking works;
- price/visit info reachable;
- SEO/analytics not unintentionally broken.

## Governance

Run:

`node scripts/validate-ai-os.mjs`

Report blockers explicitly before release.

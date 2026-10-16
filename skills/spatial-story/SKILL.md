# Skill: Spatial Story

Use for:
- Cesium
- cartographic storytelling
- aircraft/vessel positioning
- camera choreography
- spatial scrollytelling

Lead:
EXPERIENCE

Required support:
TRUTH + TECHNOLOGY

Add DESIGN for visible interface/composition changes.

Add ACCESSIBILITY for novel interaction.

## Workflow

1. Define the visitor outcome in one sentence.
2. Identify required historical facts.
3. Read:
   - `data/historical-canon.json`
   - relevant `data/entities/*`
4. Classify spatial certainty:
   - VERIFIED
   - APPROXIMATE
   - INFERRED
   - UNKNOWN
5. Never turn approximate/unknown data into false precision.
6. Read `docs/SPATIAL_ENGINE.md`.
7. Define or modify structured `data/story-beats.json` before scattering animation values through components.
8. Design the final camera composition first.
9. Then design the transition into it.
10. Use Cesium for world coordinates/time.
11. Use semantic HTML for narrative.
12. Use LOD/instancing for repeated aircraft.
13. Implement reduced-motion/static fallback.
14. Test desktop/mobile/resize/navigation/fallback.
15. Confirm key meaning survives without 3D.
16. Stop at the requested outcome.

## Reject

- default Cesium chrome as visual language;
- game HUDs;
- invented exact flight paths;
- uncontrolled camera spinning;
- unnecessary multiple Cesium viewers;
- spectacle-only 3D.

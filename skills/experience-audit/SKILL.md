# Experience Audit Skill

## Purpose

Use after material Story, spatial, UX, accessibility or interaction work.

This is an independent assurance workflow. It must not simply restate the Builder's implementation report.

## Required inputs

Read:
- current task;
- current implementation;
- AGENTS.md;
- relevant canonical data;
- relevant doctrine;
- docs/WATCHER_PROTOCOL.md;
- docs/CINEMATIC_STORY_STANDARD.md for Story/spatial work;
- config/quality-gates.json.

## Audit sequence

1. State the intended visitor outcome in one sentence.
2. Inspect the rendered result, not only source code.
3. Identify what the eye sees first.
4. Compare actual visual hierarchy with intended hierarchy.
5. Identify unnecessary information and interface.
6. Test desktop widescreen and normal laptop.
7. Test mobile portrait and landscape.
8. Test first downward scroll.
9. Test reverse scroll.
10. Test rapid scroll and restored position where relevant.
11. Test keyboard operation.
12. Test screen-reader semantics where applicable.
13. Test prefers-reduced-motion.
14. Inspect historical precision versus evidence precision.
15. Inspect failure/fallback behaviour.
16. Run the First-time Tourist, Mobile Visitor and Historical Sceptic red-team perspectives.
17. Attempt to find a material reason to fail the implementation.

## Story-scene audit

For each material Story beat record:
- intended primary subject;
- actual first-seen subject;
- secondary relationship;
- evidence representation;
- camera purpose;
- whether camera settles;
- unexplained geometry;
- irrelevant modern cartography;
- label leakage during transition;
- mobile comprehension;
- reduced-motion comprehension;
- whether the scene works without opening the Ledger.

## Verdict

Use exactly one:
- PASS
- PASS WITH CONDITIONS
- FAIL

A FAIL must identify the smallest set of corrections required to achieve the intended visitor outcome.

Do not redesign unrelated areas.

## Cinematic review

For Story/spatial tasks, also classify:
- CINEMATIC PASS
- CINEMATIC PASS WITH CONDITIONS
- CINEMATIC FAIL

A material Cinematic FAIL prevents completion.

## Completion rule

Do not accept tests, build success or schema validation as sufficient proof of UX quality.

The task is complete only if the rendered result works for a first-time visitor and no material Watcher or Cinematic failure remains.

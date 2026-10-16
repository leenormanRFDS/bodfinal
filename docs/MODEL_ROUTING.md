# Model Routing

## Purpose

Use different models for different responsibilities. Do not assume one model should both build and independently approve material work.

## Builder

### Gemini 3.8 Flash — High thinking

Primary production/build machine.

Use for:
- implementation;
- Astro and TypeScript;
- CesiumJS;
- CSS and responsive layout;
- motion and camera choreography;
- accessibility implementation;
- GLB integration;
- performance work;
- multi-file refactors within approved architecture;
- bug fixing;
- implementing decisions already approved by project Authorities.

Use High thinking for Story, spatial, accessibility-sensitive or architectural work. Medium may be used for routine implementation with an already approved design. Do not use Low for material Story work.

## Principal Reviewer / Watcher

### Gemini 3.1 Pro Preview — High thinking

Use for:
- independent UX audits;
- truth adjudication;
- source conflict review;
- architecture review;
- deep causal diagnosis;
- accessibility audits;
- Story scene critique;
- evidence-vs-reconstruction review;
- temporal/geographic provenance;
- pre-release red-team assessment;
- situations where repeated builder attempts produce regressions.

Default mode should be read-only first. It should inspect, challenge, diagnose, adjudicate and recommend before implementation returns to the Builder.

## Preferred material-work loop

1. Gemini 3.8 Flash High — build.
2. Gemini 3.1 Pro High — read-only Watcher audit.
3. Gemini 3.8 Flash High — correct.
4. Gemini 3.1 Pro High — re-audit after material corrections.

Do not treat Builder self-confidence as independent review.

## Escalation triggers

Escalate from Builder to Principal Reviewer when:
- the same bug survives two meaningful repair attempts;
- historical sources materially conflict;
- desired visualisation exceeds evidential certainty;
- accessibility requirements are ambiguous;
- a scene technically works but remains hard to understand;
- proposed architecture change affects several approved systems;
- Cesium, scroll state and layout state interact unpredictably;
- the Watcher returns FAIL;
- the user explicitly requests deep audit, independent review or architecture judgement.

## Lightweight models

Flash-Lite or lighter models may be used only for low-judgement mechanical work such as formatting, renaming, repetitive schema transformations or simple metadata operations.

Do not use lightweight models as the final decision-maker for historical truth, cinematic direction, accessibility, major UX or Cesium architecture.

## Runtime limitation

If the environment cannot switch models automatically, issue a concise handoff recommendation rather than pretending a switch occurred.

Use:

MODEL HANDOFF RECOMMENDED
FROM: [current model]
TO: [recommended model]
ROLE: [Builder / Watcher / Truth Review / Cinematic Review]
REASON: [one sentence]
NEXT PROMPT: [exact continuation instruction]

## Public invisibility

Model routing is internal infrastructure. Never expose model names, reasoning levels or routing state in the public website.

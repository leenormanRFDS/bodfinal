# The Bombing of Darwin — AI Operating System

This repository-ready operating system is designed for the existing Bombing of Darwin website project.

## Canonical root structure

```text
/
├── AGENTS.md
├── AI_SYSTEM.md
├── skills/
│   ├── spatial-story/SKILL.md
│   ├── premium-interaction/SKILL.md
│   ├── historical-content/SKILL.md
│   ├── visitor-growth/SKILL.md
│   └── release-qa/SKILL.md
├── config/
├── data/
├── docs/
├── scripts/
├── src/
├── public/
└── ...
```

This project intentionally uses the root-level `AGENTS.md` + `skills/` structure as its canonical agent configuration.

## What each area does

- `AGENTS.md` — project constitution and execution protocol.
- `AI_SYSTEM.md` — compatibility copy for AI tools exposing a System Instructions field.
- `skills/*/SKILL.md` — task-specific workflows.
- `config/` — exact machine-readable design, motion and routing rules.
- `data/` — canonical historical/story structures.
- `docs/` — detailed human-readable doctrine.
- `scripts/validate-ai-os.mjs` — validator.

## Google AI Studio — existing imported repository

You already have the website imported/deployed.

After adding these files to GitHub and pulling/syncing the commit into AI Studio, use this one-time initialisation prompt:

```text
PROJECT GOVERNANCE INITIALISATION

This repository contains the operating system for The Bombing of Darwin digital experience.

The repository uses the ROOT agent structure:

AGENTS.md
skills/

Before making application changes, read:

1. AGENTS.md
2. config/decision-matrix.json
3. config/design-tokens.json
4. config/motion-tokens.json
5. docs/TEAM_OPERATING_MANUAL.md

Inspect the specialist workflows under:

skills/

Treat these files as persistent project governance.

Do not rewrite or delete governance files unless I explicitly ask you to modify the operating system.

For every future implementation task:
1. inspect the current implementation;
2. classify the task;
3. identify the lead Authority;
4. read the relevant skills/<skill>/SKILL.md;
5. preserve unrelated working behaviour;
6. implement the requested outcome directly;
7. test and verify;
8. stop.

Do not modify application code during this initialisation.

Reply only with:
- confirmation governance was found;
- the five Authorities;
- the five skills;
- missing/unreadable governance files;
- confirmation no application code changed.
```

## Task brief template

```text
TASK
[Specific change.]

OUTCOME
[What the visitor should understand, feel or be able to do.]

PRESERVE
[Approved behaviours/components that must survive.]

LEAD AUTHORITY
[DESIGN | EXPERIENCE | TRUTH | TECHNOLOGY | VISITOR_GROWTH]

SKILL
[spatial-story | premium-interaction | historical-content | visitor-growth | release-qa]

CONSTRAINTS
[Historical/accessibility/performance/commercial constraints.]

DELIVER
Implement directly.
Do not redesign unrelated sections.
Verify the requested outcome and stop.
```

## Source-of-truth order

1. Verified historical/cultural evidence and approved cultural authority.
2. `data/historical-canon.json` and linked sources.
3. `config/` machine-readable rules.
4. `AGENTS.md`.
5. `docs/`.
6. Existing project documents such as `PHOTOGRAPHY-BRIEF.md`.
7. Current task brief.
8. Existing code conventions, unless they conflict with the above.

If sources conflict, report the conflict rather than silently inventing a resolution.

## File formats

Use:
- Markdown for doctrine/instructions.
- JSON for exact rules/data.
- PDF for archival material where layout, maps, scans or visual page structure matter.

## Validate

Run:

```bash
node scripts/validate-ai-os.mjs
```

The validator also checks that obsolete hidden agent-path references have not been reintroduced.

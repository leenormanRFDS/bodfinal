#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');

let failed = false;
const parsed = {};

const fail = (msg) => {
  failed = true;
  console.error(`✗ ${msg}`);
};

const pass = (msg) => console.log(`✓ ${msg}`);

const requiredFiles = [
  'AGENTS.md',
  'AI_SYSTEM.md',
  'skills/spatial-story/SKILL.md',
  'skills/premium-interaction/SKILL.md',
  'skills/historical-content/SKILL.md',
  'skills/visitor-growth/SKILL.md',
  'skills/release-qa/SKILL.md',
  'config/design-tokens.json',
  'config/motion-tokens.json',
  'config/decision-matrix.json',
  'data/historical-canon.json',
  'data/story-beats.json',
  'data/entities/aircraft.json',
  'data/entities/vessels.json',
  'data/entities/locations.json',
  'data/entities/sources.json'
];

for (const rel of requiredFiles) {
  const file = path.join(root, rel);
  if (!fs.existsSync(file)) fail(`Missing required file: ${rel}`);
  else pass(`Found: ${rel}`);
}

const jsonFiles = requiredFiles.filter((p) => p.endsWith('.json'));

for (const rel of jsonFiles) {
  const file = path.join(root, rel);
  if (!fs.existsSync(file)) continue;

  try {
    parsed[rel] = JSON.parse(fs.readFileSync(file, 'utf8'));
    pass(`Valid JSON: ${rel}`);
  } catch (err) {
    fail(`Invalid JSON: ${rel} — ${err.message}`);
  }
}

const matrix = parsed['config/decision-matrix.json'];

if (matrix) {
  const authorities = new Set(matrix.authorities || []);
  const supportDisciplines = new Set(matrix.supportDisciplines || []);

  for (const [task, rule] of Object.entries(matrix.tasks || {})) {
    if (!authorities.has(rule.lead)) {
      fail(`${task}: unknown lead Authority ${rule.lead}`);
    }

    for (const support of rule.support || []) {
      if (!authorities.has(support) && !supportDisciplines.has(support)) {
        fail(`${task}: unknown support Authority/discipline ${support}`);
      }
    }

    if (rule.skill) {
      const skillPath = path.join(root, 'skills', rule.skill, 'SKILL.md');
      if (!fs.existsSync(skillPath)) {
        fail(`${task}: configured skill does not exist: ${rule.skill}`);
      }
    }
  }

  pass('Decision matrix references valid Authorities/support disciplines/skills');
}

const canon = parsed['data/historical-canon.json'];
const beats = parsed['data/story-beats.json'];

if (canon && beats) {
  const claimIds = new Set((canon.claims || []).map((x) => x.id));

  for (const beat of beats.beats || []) {
    for (const ref of beat.truthRefs || []) {
      if (!claimIds.has(ref)) {
        fail(`${beat.id}: missing truthRef ${ref}`);
      }
    }
  }

  pass('Story-beat truth references resolve');
}

// Fail on executable governance references to the obsolete hidden path.
const textExtensions = new Set(['.md', '.json', '.mjs', '.js', '.ts', '.tsx']);
const obsolete = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === '.git' || entry.name === 'node_modules') continue;

    const full = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      walk(full);
      continue;
    }

    if (!textExtensions.has(path.extname(entry.name))) continue;

    const text = fs.readFileSync(full, 'utf8');

    const obsoleteToken = '.' + 'agents/';

    if (text.includes(obsoleteToken)) {
      obsolete.push(path.relative(root, full));
    }
  }
}

walk(root);

if (obsolete.length) {
  fail(`Obsolete hidden agent-path references found in: ${obsolete.join(', ')}`);
} else {
  pass('No obsolete hidden agent-path references found');
}

if (failed) {
  console.error('\nAI operating-system validation failed.');
  process.exit(1);
}

console.log('\nAI operating-system validation passed.');

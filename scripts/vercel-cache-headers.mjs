#!/usr/bin/env node
/**
 * Adds long-lived cache headers for the Spatial Engine's static assets to the Vercel
 * Build Output (.vercel/output/config.json) produced by @astrojs/vercel.
 *
 * Why here and not vercel.json: the adapter writes config.json itself (it already marks
 * /_astro/* immutable). Patching its output is deterministic and visible in review.
 *
 *   /tiles/darwin-basemap/*  immutable, 1 year  — URLs carry ?v=<content hash> (basemap-manifest.json)
 *   /spatial-posters/*       immutable, 1 year  — URLs carry ?v=<content hash> (poster-manifest.json)
 *   /audio/*, /video/*, /images/opening/*  immutable, 1 year — the opening's master, paper video and poster; URLs
 *                            carry ?v=<md5 prefix> (OPENING in src/consts.ts). Change the hash when the file changes.
 *   /cesium/*                1 week + 30 days stale-while-revalidate — unversioned URLs, change only
 *                            when the cesium package is upgraded.
 *   /models/*                same as /cesium (unversioned glTF models; rename the file if it changes).
 *
 * Without this, Vercel serves public/ files with `max-age=0, must-revalidate`, so every
 * visit re-validates every tile.
 */
import fs from 'node:fs';
import path from 'node:path';

const file = path.resolve('.vercel/output/config.json');
if (!fs.existsSync(file)) {
  console.log('[cache-headers] no .vercel/output/config.json (non-Vercel build) — skipped');
  process.exit(0);
}

const IMMUTABLE = 'public, max-age=31536000, immutable';
const RULES = [
  { src: '^/tiles/darwin-basemap/(.*)$', headers: { 'cache-control': IMMUTABLE }, continue: true },
  { src: '^/spatial-posters/(.*)$', headers: { 'cache-control': IMMUTABLE }, continue: true },
  { src: '^/(audio|video)/(.*)$', headers: { 'cache-control': IMMUTABLE }, continue: true },
  { src: '^/images/opening/(.*)$', headers: { 'cache-control': IMMUTABLE }, continue: true },
  { src: '^/cesium/(.*)$', headers: { 'cache-control': 'public, max-age=604800, stale-while-revalidate=2592000' }, continue: true },
  { src: '^/models/(.*)$', headers: { 'cache-control': 'public, max-age=604800, stale-while-revalidate=2592000' }, continue: true },
];

const config = JSON.parse(fs.readFileSync(file, 'utf8'));
config.routes ??= [];
const existing = new Set(config.routes.map((r) => r.src));
const fsIndex = config.routes.findIndex((r) => r.handle === 'filesystem');
const insertAt = fsIndex === -1 ? 0 : fsIndex;
const toAdd = RULES.filter((r) => !existing.has(r.src));
config.routes.splice(insertAt, 0, ...toAdd);
fs.writeFileSync(file, JSON.stringify(config, null, 2));
console.log(`[cache-headers] added ${toAdd.length} cache rule(s) before the filesystem handler`);

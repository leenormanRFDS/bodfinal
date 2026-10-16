// scripts/sync-tolgee.ts
// Secure Server-Side Sync with Tolgee Cloud (Project 35042)
// Uses TOLGEE_API_KEY securely on the server/CLI only.
// Never exposes TOLGEE_API_KEY to client or public bundles.

import fs from 'node:fs';
import path from 'node:path';

const API_KEY = process.env.TOLGEE_API_KEY;
const API_URL = process.env.TOLGEE_API_URL || 'https://app.tolgee.io';
const PROJECT_ID = 35042;

if (!API_KEY) {
  console.log('[Tolgee Sync] No TOLGEE_API_KEY detected in environment. Skipping remote sync.');
  process.exit(0);
}

const localesDir = path.resolve(process.cwd(), 'src/i18n/locales');
const en = JSON.parse(fs.readFileSync(path.join(localesDir, 'en.json'), 'utf-8'));
const zh = JSON.parse(fs.readFileSync(path.join(localesDir, 'zh.json'), 'utf-8'));
const ja = JSON.parse(fs.readFileSync(path.join(localesDir, 'ja.json'), 'utf-8'));
const de = JSON.parse(fs.readFileSync(path.join(localesDir, 'de.json'), 'utf-8'));

async function syncToTolgee() {
  console.log(`[Tolgee Sync] Starting synchronization with Tolgee Project ${PROJECT_ID}...`);

  const keys = Object.keys(en);
  let createdCount = 0;
  let updatedCount = 0;

  for (const keyName of keys) {
    try {
      const payload = {
        name: keyName,
        translations: {
          en: en[keyName] || '',
          zh: zh[keyName] || '',
          ja: ja[keyName] || '',
          'de-DE': de[keyName] || '',
        },
      };

      const res = await fetch(`${API_URL}/v2/projects/${PROJECT_ID}/keys`, {
        method: 'POST',
        headers: {
          'X-API-Key': API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (res.status === 201) {
        createdCount++;
      } else if (res.status === 400 || res.status === 409) {
        // Key might already exist; update translations
        // Tolgee key import / set translations
        const updateRes = await fetch(`${API_URL}/v2/projects/${PROJECT_ID}/translations`, {
          method: 'PUT',
          headers: {
            'X-API-Key': API_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            key: keyName,
            translations: payload.translations,
          }),
        });
        if (updateRes.ok) updatedCount++;
      }
    } catch (err: any) {
      console.warn(`[Tolgee Sync] Warning for key ${keyName}:`, err.message);
    }
  }

  console.log(`[Tolgee Sync] Completed! Keys created: ${createdCount}, updated: ${updatedCount}, total catalog: ${keys.length}`);
}

syncToTolgee().catch((err) => {
  console.error('[Tolgee Sync] Sync failed:', err);
});

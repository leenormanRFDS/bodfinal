// scripts/test-i18n-tolgee.ts
// Verification test for Tolgee internationalisation architecture, security, and catalog completeness.

import fs from 'node:fs';
import path from 'node:path';
import { SUPPORTED_LOCALES, DEFAULT_LOCALE } from '../src/i18n/config';

console.log('====================================================');
console.log('TOLGEE INTERNATIONALISATION VERIFICATION SUITE');
console.log('====================================================\n');

let failed = 0;
function assert(desc: string, cond: boolean, detail?: string) {
  if (cond) {
    console.log(`[PASS] ${desc}`);
  } else {
    console.error(`[FAIL] ${desc}${detail ? ' -> ' + detail : ''}`);
    failed++;
  }
}

// 1. Catalog integrity & parity
const localesDir = path.resolve(process.cwd(), 'src/i18n/locales');
const en = JSON.parse(fs.readFileSync(path.join(localesDir, 'en.json'), 'utf-8'));
const zh = JSON.parse(fs.readFileSync(path.join(localesDir, 'zh.json'), 'utf-8'));
const ja = JSON.parse(fs.readFileSync(path.join(localesDir, 'ja.json'), 'utf-8'));
const de = JSON.parse(fs.readFileSync(path.join(localesDir, 'de.json'), 'utf-8'));

const enKeys = Object.keys(en);
assert('English canonical catalog has >= 40 semantic keys', enKeys.length >= 40, `Found: ${enKeys.length}`);

const zhKeys = Object.keys(zh);
const jaKeys = Object.keys(ja);
const deKeys = Object.keys(de);

const missingInZh = enKeys.filter((k) => !(k in zh));
const missingInJa = enKeys.filter((k) => !(k in ja));
const missingInDe = enKeys.filter((k) => !(k in de));

assert('Parity: All canonical keys present in Chinese catalog', missingInZh.length === 0, `Missing: ${missingInZh.join(', ')}`);
assert('Parity: All canonical keys present in Japanese catalog', missingInJa.length === 0, `Missing: ${missingInJa.join(', ')}`);
assert('Parity: All canonical keys present in German catalog', missingInDe.length === 0, `Missing: ${missingInDe.join(', ')}`);

// 2. Strict Credential Isolation (Security check)
const clientCode = fs.readFileSync(path.resolve(process.cwd(), 'src/i18n/client.ts'), 'utf-8');
assert('Security: TOLGEE_API_KEY is NOT referenced in src/i18n/client.ts', !clientCode.includes('TOLGEE_API_KEY'));
assert('Security: Client uses staticData delivery', clientCode.includes('staticData'));

// 3. Supported Locales Configuration
const supportedCodes = SUPPORTED_LOCALES.map((l) => l.code);
assert('Config: English supported', supportedCodes.includes('en'));
assert('Config: Chinese supported', supportedCodes.includes('zh'));
assert('Config: Japanese supported', supportedCodes.includes('ja'));
assert('Config: German supported', supportedCodes.includes('de'));
assert('Config: Default locale is English', DEFAULT_LOCALE === 'en');

// 4. Proper Nouns & Historical Truth Preservation Check
const properNouns = ['USS Peary', 'Stokes Hill Wharf', '09:35 → 09:58'];
for (const noun of properNouns) {
  const presentInZh = Object.values(zh).some((v: any) => String(v).includes(noun));
  const presentInJa = Object.values(ja).some((v: any) => String(v).includes(noun));
  const presentInDe = Object.values(de).some((v: any) => String(v).includes(noun));
  assert(`Truth Governance: '${noun}' preserved in Chinese`, presentInZh);
  assert(`Truth Governance: '${noun}' preserved in Japanese`, presentInJa);
  assert(`Truth Governance: '${noun}' preserved in German`, presentInDe);
}

// 5. Verification of Tolgee Cloud project state via Tolgee API
async function verifyTolgeeCloud() {
  const key = process.env.TOLGEE_API_KEY;
  const apiUrl = process.env.TOLGEE_API_URL || 'https://app.tolgee.io';
  const projectId = 35042;

  if (!key) {
    console.log('[Tolgee API] TOLGEE_API_KEY not found in test environment.');
    return;
  }

  try {
    const res = await fetch(`${apiUrl}/v2/projects/${projectId}`, {
      headers: { 'X-API-Key': key },
    });
    assert('Tolgee API: Connected to Project 35042', res.status === 200, `Status: ${res.status}`);
    const data = await res.json();
    assert('Tolgee API: Project name is "Bombing of Darwin"', data.name === 'Bombing of Darwin');
    assert('Tolgee API: Base language is English', data.baseLanguage.tag === 'en');
  } catch (err: any) {
    assert('Tolgee API query', false, err.message);
  }
}

verifyTolgeeCloud().then(() => {
  console.log('\n====================================================');
  if (failed === 0) {
    console.log('ALL I18N & TOLGEE ARCHITECTURAL TESTS PASSED (0 FAILURES)');
  } else {
    console.error(`${failed} TEST(S) FAILED`);
    process.exit(1);
  }
  console.log('====================================================');
});

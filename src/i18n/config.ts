// src/i18n/config.ts
// Authoritative Internationalisation Configuration & Governance.

export interface LocaleDefinition {
  code: string;
  label: string;
  name: string;
  tolgeeTag: string;
  dir?: 'ltr' | 'rtl';
}

export const SUPPORTED_LOCALES: LocaleDefinition[] = [
  { code: 'en', label: 'EN', name: 'English', tolgeeTag: 'en' },
  { code: 'zh', label: '中文', name: '简体中文', tolgeeTag: 'zh' },
  { code: 'ja', label: '日本語', name: '日本語', tolgeeTag: 'ja' },
  { code: 'de', label: 'DE', name: 'Deutsch', tolgeeTag: 'de-DE' },
];

export const DEFAULT_LOCALE = 'en';

export const LOCALE_STORAGE_KEY = 'bod-locale';

/**
 * Content Classification according to Project Internationalisation Governance:
 *
 * Class A: INTERFACE / UTILITY
 * Fast navigation, buttons, status badges, accessibility tags, form controls.
 *
 * Class B: TOURISM / VISITOR COPY
 * Admission package descriptions, opening hours, visitor directions, parking instructions.
 * Requires human cultural review.
 *
 * Class C: HISTORICAL NARRATIVE / EVIDENCE
 * Story beat headlines, historical facts, evidence ledger claims, certainty classifications.
 * Strictly governed; English canon remains the source of truth. Translations are presentation layers.
 *
 * Class D: PROPER NOUNS / HISTORICAL ENTITIES
 * USS Peary, Stokes Hill Wharf, RAAF Station Darwin, Bathurst Island, MV Neptuna, Lowe Commission.
 * Preserved in historical form and never blindly altered.
 */
export enum ContentClassification {
  INTERFACE_UTILITY = 'INTERFACE_UTILITY',
  TOURISM_VISITOR = 'TOURISM_VISITOR',
  HISTORICAL_NARRATIVE = 'HISTORICAL_NARRATIVE',
  PROPER_NOUNS = 'PROPER_NOUNS',
}

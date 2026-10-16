// src/i18n/client.ts
// Production-Safe Tolgee Client Instance.
//
// Zero-Credential Architecture:
// In browser/production delivery, translations are loaded strictly from staticData dictionaries.
// Private project API keys are NEVER sent or exposed in client bundles or network requests.

import { Tolgee, FormatSimple } from '@tolgee/web';
import { SUPPORTED_LOCALES, DEFAULT_LOCALE, LOCALE_STORAGE_KEY } from './config';

import en from './locales/en.json';
import zh from './locales/zh.json';
import ja from './locales/ja.json';
import de from './locales/de.json';

const staticDictionaries: Record<string, Record<string, string>> = {
  en,
  zh,
  ja,
  de,
  'de-DE': de,
};

/**
 * Determine initial locale following strict precedence:
 * 1. Stored visitor preference in localStorage
 * 2. Browser language (navigator.language) if matching supported locale
 * 3. English default fallback
 */
export function getInitialLocale(): string {
  if (typeof window === 'undefined') return DEFAULT_LOCALE;

  try {
    const saved = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (saved && (saved in staticDictionaries)) {
      return saved;
    }

    const browserLang = (navigator.language || '').toLowerCase();
    if (browserLang.startsWith('zh')) return 'zh';
    if (browserLang.startsWith('ja')) return 'ja';
    if (browserLang.startsWith('de')) return 'de';
  } catch {
    // LocalStorage or navigator access failure (sandboxed or private mode)
  }

  return DEFAULT_LOCALE;
}

let activeLocale = getInitialLocale();

// Initialize Tolgee core with staticData
export const tolgee = Tolgee()
  .use(FormatSimple())
  .init({
    language: activeLocale,
    fallbackLanguage: DEFAULT_LOCALE,
    staticData: {
      en,
      zh,
      ja,
      de,
    },
  });

/**
 * Translate a key synchronously with optional parameters.
 * Falls back to English dictionary or key name if missing.
 */
export function t(key: string, params?: Record<string, any>, defaultValue?: string): string {
  const dict = staticDictionaries[activeLocale] || staticDictionaries[DEFAULT_LOCALE] || {};
  let str = dict[key] || staticDictionaries[DEFAULT_LOCALE]?.[key] || defaultValue || key;

  if (params && typeof str === 'string') {
    for (const [k, v] of Object.entries(params)) {
      str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
    }
  }

  return str;
}

/**
 * Set and persist active locale, updating document attributes and dispatching global event.
 */
export async function setLocale(locale: string): Promise<void> {
  const normalized = (locale === 'de-DE' ? 'de' : locale);
  if (!(normalized in staticDictionaries)) {
    console.warn(`[i18n] Unsupported locale: ${locale}. Retaining ${activeLocale}.`);
    return;
  }

  activeLocale = normalized;

  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, normalized);
  } catch {
    // Ignore storage errors in restricted contexts
  }

  if (typeof document !== 'undefined') {
    document.documentElement.lang = normalized;

    // Update language selector active states
    document.querySelectorAll<HTMLButtonElement>('.lang__btn').forEach((btn) => {
      btn.setAttribute('aria-current', String(btn.dataset.locale === normalized));
    });

    // Translate all annotated DOM elements in-place
    bindTranslations(document);

    // Dispatch global custom event for islands (booking form, cesium story, etc.)
    window.dispatchEvent(new CustomEvent('bod:locale_changed', { detail: { locale: normalized } }));
  }

  try {
    await tolgee.changeLanguage(normalized);
  } catch {
    // Tolgee instance state sync
  }
}

export function getActiveLocale(): string {
  return activeLocale;
}

/**
 * Automatically binds translations to elements annotated with:
 * data-i18n="translation.key"
 * data-i18n-attr="aria-label:translation.key,title:translation.key"
 */
export function bindTranslations(root: Element | Document = document): void {
  if (typeof document === 'undefined') return;

  const elements = root.querySelectorAll<HTMLElement>('[data-i18n]');
  elements.forEach((el) => {
    const key = el.dataset.i18n;
    if (key) {
      el.textContent = t(key, undefined, el.textContent || '');
    }
  });

  const attrElements = root.querySelectorAll<HTMLElement>('[data-i18n-attr]');
  attrElements.forEach((el) => {
    const attrDefs = el.dataset.i18nAttr?.split(',') || [];
    attrDefs.forEach((def) => {
      const [attr, key] = def.trim().split(':');
      if (attr && key) {
        el.setAttribute(attr, t(key));
      }
    });
  });
}

// Auto-run on client bootstrap
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      document.documentElement.lang = activeLocale;
      bindTranslations(document);
    });
  } else {
    document.documentElement.lang = activeLocale;
    bindTranslations(document);
  }

  // Handle cross-tab storage sync
  window.addEventListener('storage', (e) => {
    if (e.key === LOCALE_STORAGE_KEY && e.newValue && e.newValue !== activeLocale) {
      setLocale(e.newValue);
    }
  });
}

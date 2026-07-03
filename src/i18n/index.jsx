import { createContext, useContext, useState, useCallback, useMemo } from 'react';

// --- Locale imports ---
import zhTW from './locales/zh-TW.json';
import en from './locales/en.json';

// --- Constants ---
const STORAGE_KEY = 'pikmin-lang';
const DEFAULT_LANG = 'zh-TW';
const FALLBACK_LANG = 'zh-TW';

const LANGUAGES = [
  { code: 'zh-TW', label: '繁體中文' },
  { code: 'en', label: 'English' },
];

const LOCALE_MAP = {
  'zh-TW': zhTW,
  en,
};

// --- Helpers ---

/**
 * Detect the initial language:
 * 1. Check localStorage for a saved preference
 * 2. Check navigator.language – if it starts with 'zh', use 'zh-TW'
 * 3. Otherwise fall back to 'en'
 */
function detectLanguage() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && LOCALE_MAP[stored]) {
      return stored;
    }
  } catch {
    // localStorage may be unavailable (e.g. private browsing)
  }

  if (typeof navigator !== 'undefined' && navigator.language) {
    if (navigator.language.toLowerCase().startsWith('zh')) {
      return 'zh-TW';
    }
    return 'en';
  }

  return DEFAULT_LANG;
}

/**
 * Resolve a dot-separated key path from a nested object.
 * e.g. resolve(obj, 'dashboard.selected_count') → obj.dashboard.selected_count
 */
function resolve(obj, keyPath) {
  if (!obj || !keyPath) return undefined;
  const keys = keyPath.split('.');
  let current = obj;
  for (const key of keys) {
    if (current == null || typeof current !== 'object') {
      return undefined;
    }
    current = current[key];
  }
  return current;
}

/**
 * Interpolate {{variable}} placeholders inside a string.
 * e.g. interpolate('已選 {{count}} 個分類', { count: 5 }) → '已選 5 個分類'
 */
function interpolate(template, vars) {
  if (!vars || typeof template !== 'string') return template;
  return template.replace(/\{\{(\w+)\}\}/g, (_, name) => {
    return vars[name] !== undefined ? String(vars[name]) : `{{${name}}}`;
  });
}

// --- Context ---
const I18nContext = createContext(null);

/**
 * I18nProvider – wraps the application and provides translation utilities.
 *
 * Usage:
 *   <I18nProvider>
 *     <App />
 *   </I18nProvider>
 */
export function I18nProvider({ children }) {
  const [language, setLanguageState] = useState(detectLanguage);

  const setLanguage = useCallback((code) => {
    if (!LOCALE_MAP[code]) {
      console.warn(`[i18n] Unknown language code: "${code}"`);
      return;
    }
    setLanguageState(code);
    try {
      localStorage.setItem(STORAGE_KEY, code);
    } catch {
      // ignore write errors
    }
  }, []);

  /**
   * Translation function.
   *
   * @param {string} keyPath – dot-separated key, e.g. 'dashboard.selected_count'
   * @param {Object} [vars]  – interpolation variables, e.g. { count: 5 }
   * @returns {string} The translated string, or the key path if not found.
   */
  const t = useCallback(
    (keyPath, vars) => {
      // 1. Try current language
      let value = resolve(LOCALE_MAP[language], keyPath);

      // 2. Fallback to zh-TW if missing
      if (value === undefined && language !== FALLBACK_LANG) {
        value = resolve(LOCALE_MAP[FALLBACK_LANG], keyPath);
      }

      // 3. If still missing, return the key itself as a last resort
      if (value === undefined) {
        console.warn(`[i18n] Missing translation key: "${keyPath}"`);
        return keyPath;
      }

      // 4. Only strings are interpolated; objects / arrays are returned as-is
      if (typeof value === 'string') {
        return interpolate(value, vars);
      }

      return value;
    },
    [language],
  );

  const contextValue = useMemo(
    () => ({
      t,
      language,
      setLanguage,
      languages: LANGUAGES,
    }),
    [t, language, setLanguage],
  );

  return (
    <I18nContext.Provider value={contextValue}>
      {children}
    </I18nContext.Provider>
  );
}

/**
 * useTranslation – access the i18n context from any component.
 *
 * @returns {{ t: Function, language: string, setLanguage: Function, languages: Array }}
 */
export function useTranslation() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error(
      'useTranslation() must be used within an <I18nProvider>. ' +
        'Wrap your app with <I18nProvider> in main.jsx.',
    );
  }
  return context;
}

/**
 * 取得支援多國語系的顯示名稱
 * 優先根據當前語言回傳，若無則回傳另一個語言的名稱。
 * @param {Object} item 包含 name 和 name_ch 的物件
 * @param {string} language 目前的語系代碼 ('zh-TW' 或是 'en')
 * @returns {string} 適合的顯示名稱
 */
export function getLocalizedName(item, language) {
  if (!item) return '';
  if (language === 'zh-TW') {
    return item.name_ch || item.name || '';
  }
  return item.name || item.name_ch || '';
}

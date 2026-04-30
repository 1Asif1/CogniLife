/**
 * translationService.ts
 * ─────────────────────
 * API-driven translation via MyMemory (free, no key needed).
 * Caches results in AsyncStorage to avoid redundant API calls.
 *
 * NEW FILE — zero changes to existing code.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const MYMEMORY_URL = 'https://api.mymemory.translated.net/get';
const CACHE_PREFIX = 'translation_cache_';
// Cache lives for 7 days — translations don't change
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export type SupportedLanguage = {
  code: string;
  label: string;
  nativeLabel: string;
  flag: string;
};

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  { code: 'en',    label: 'English',    nativeLabel: 'English',    flag: '🇬🇧' },
  { code: 'hi',    label: 'Hindi',      nativeLabel: 'हिन्दी',         flag: '🇮🇳' },
  { code: 'kn',    label: 'Kannada',    nativeLabel: 'ಕನ್ನಡ',           flag: '🇮🇳' },
  { code: 'ta',    label: 'Tamil',      nativeLabel: 'தமிழ்',           flag: '🇮🇳' },
  { code: 'te',    label: 'Telugu',     nativeLabel: 'తెలుగు',          flag: '🇮🇳' },
  { code: 'mr',    label: 'Marathi',    nativeLabel: 'मराठी',           flag: '🇮🇳' },
  { code: 'bn',    label: 'Bengali',    nativeLabel: 'বাংলা',           flag: '🇮🇳' },
  { code: 'gu',    label: 'Gujarati',   nativeLabel: 'ગુજરાતી',         flag: '🇮🇳' },
  { code: 'es',    label: 'Spanish',    nativeLabel: 'Español',        flag: '🇪🇸' },
  { code: 'fr',    label: 'French',     nativeLabel: 'Français',       flag: '🇫🇷' },
  { code: 'de',    label: 'German',     nativeLabel: 'Deutsch',        flag: '🇩🇪' },
  { code: 'ar',    label: 'Arabic',     nativeLabel: 'العربية',        flag: '🇸🇦' },
  { code: 'zh-CN', label: 'Chinese',    nativeLabel: '中文',            flag: '🇨🇳' },
  { code: 'ja',    label: 'Japanese',   nativeLabel: '日本語',          flag: '🇯🇵' },
];

interface CacheEntry {
  translated: string;
  timestamp: number;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function cacheKey(text: string, targetLang: string): string {
  // Stable key, safe for AsyncStorage
  const hash = `${targetLang}_${text.slice(0, 60).replace(/\s+/g, '_')}`;
  return `${CACHE_PREFIX}${hash}`;
}

async function getFromCache(text: string, targetLang: string): Promise<string | null> {
  try {
    const raw = await AsyncStorage.getItem(cacheKey(text, targetLang));
    if (!raw) return null;
    const entry: CacheEntry = JSON.parse(raw);
    if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
      // Expired — purge silently
      await AsyncStorage.removeItem(cacheKey(text, targetLang));
      return null;
    }
    return entry.translated;
  } catch {
    return null;
  }
}

async function saveToCache(text: string, targetLang: string, translated: string): Promise<void> {
  try {
    const entry: CacheEntry = { translated, timestamp: Date.now() };
    await AsyncStorage.setItem(cacheKey(text, targetLang), JSON.stringify(entry));
  } catch {
    // Cache write failures are non-fatal
  }
}

// ── Core translation function ─────────────────────────────────────────────────

/**
 * Translate a single string.
 * Returns the original text on any error (graceful degradation).
 */
export async function translateText(text: string, targetLang: string): Promise<string> {
  if (!text?.trim() || targetLang === 'en') return text;

  // 1. Cache hit?
  const cached = await getFromCache(text, targetLang);
  if (cached) return cached;

  // 2. API call
  try {
    const params = new URLSearchParams({
      q: text,
      langpair: `en|${targetLang}`,
    });
    const res = await fetch(`${MYMEMORY_URL}?${params.toString()}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const translated: string = json?.responseData?.translatedText ?? text;
    console.log('[translation]', { text, targetLang, result: translated });

    // MyMemory returns the original on quota/error — detect and fall back
    if (translated && translated !== text) {
      await saveToCache(text, targetLang, translated);
      return translated;
    }
  } catch (err) {
    console.warn('[translationService] API error:', err);
  }

  return text; // graceful fallback
}

/**
 * Translate multiple strings in parallel (batched with cache-first logic).
 * Returns a map of original → translated.
 */
export async function translateBatch(
  texts: string[],
  targetLang: string,
): Promise<Record<string, string>> {
  if (targetLang === 'en') {
    return Object.fromEntries(texts.map((t) => [t, t]));
  }
  const results = await Promise.all(
    texts.map(async (t) => [t, await translateText(t, targetLang)] as [string, string]),
  );
  return Object.fromEntries(results);
}

/** Clear ALL translation cache entries from AsyncStorage */
export async function clearTranslationCache(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const translationKeys = keys.filter((k) => k.startsWith(CACHE_PREFIX));
    if (translationKeys.length > 0) await AsyncStorage.multiRemove(translationKeys);
  } catch {
    // Non-fatal
  }
}
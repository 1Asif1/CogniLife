/**
 * translationService.ts
 * API-driven translation via MyMemory (free, no key needed).
 * Caches results in AsyncStorage to avoid redundant API calls.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Primary: Google Translate unofficial (free, no quota, supports all languages)
// Fallback: MyMemory (free but low quota)
const GOOGLE_TRANSLATE_URL = 'https://translate.googleapis.com/translate_a/single';
const MYMEMORY_URL = 'https://api.mymemory.translated.net/get';
const CACHE_PREFIX = 'translation_cache_';
// Cache lives for 7 days — translations don't change
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

// ── Junk responses returned by MyMemory on quota/error ────────────────────────
const MYMEMORY_JUNK_RESPONSES = [
  'NAME OF TRANSLATORS',
  'PLEASE ENTER A VALID EMAIL',
  'MYMEMORY WARNING',
  'YOU USED ALL AVAILABLE FREE USAGE',
  'QUERY LENGTH LIMIT',
];

function isJunkResponse(text: string): boolean {
  const upper = text.toUpperCase();
  return MYMEMORY_JUNK_RESPONSES.some((junk) => upper.includes(junk));
}

/**
 * Google Translate unofficial API (no key needed, high rate limit)
 * Returns translated string or null on failure.
 */
async function translateViaGoogle(text: string, targetLang: string): Promise<string | null> {
  try {
    const params = new URLSearchParams({
      client: 'gtx',
      sl: 'en',
      tl: targetLang,
      dt: 't',
      q: text,
    });
    const res = await fetch(`${GOOGLE_TRANSLATE_URL}?${params.toString()}`);
    if (!res.ok) return null;
    const json = await res.json();
    // Response shape: [[[translatedText, originalText, ...],...], ...]
    const translated: string = json?.[0]
      ?.map((chunk: any[]) => chunk?.[0] ?? '')
      .join('') ?? '';
    if (translated && translated !== text) return translated;
    return null;
  } catch {
    return null;
  }
}

/**
 * MyMemory fallback
 */
async function translateViaMyMemory(text: string, targetLang: string): Promise<string | null> {
  try {
    const params = new URLSearchParams({ q: text, langpair: `en|${targetLang}` });
    const res = await fetch(`${MYMEMORY_URL}?${params.toString()}`);
    if (!res.ok) return null;
    const json = await res.json();
    const translated: string = json?.responseData?.translatedText ?? text;
    if (translated && translated !== text && !isJunkResponse(translated)) return translated;
    return null;
  } catch {
    return null;
  }
}

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
  const hash = `${targetLang}_${text.slice(0, 60).replace(/\s+/g, '_')}`;
  return `${CACHE_PREFIX}${hash}`;
}

async function getFromCache(text: string, targetLang: string): Promise<string | null> {
  try {
    const raw = await AsyncStorage.getItem(cacheKey(text, targetLang));
    if (!raw) return null;
    const entry: CacheEntry = JSON.parse(raw);
    if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
      await AsyncStorage.removeItem(cacheKey(text, targetLang));
      return null;
    }
    // ── Guard: purge any previously cached junk ───────────────────────────
    if (isJunkResponse(entry.translated)) {
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


export async function translateText(text: string, targetLang: string): Promise<string> {
  if (!text?.trim() || targetLang === 'en') return text;

  // 1. Cache hit?
  const cached = await getFromCache(text, targetLang);
  if (cached) return cached;

  // 2. Try Google Translate first (primary — supports all 15 languages reliably)
  const googleResult = await translateViaGoogle(text, targetLang);
  if (googleResult) {
    console.log('[translation] Google:', { text, targetLang, result: googleResult });
    await saveToCache(text, targetLang, googleResult);
    return googleResult;
  }

  // 3. Fallback to MyMemory if Google failed
  const myMemoryResult = await translateViaMyMemory(text, targetLang);
  if (myMemoryResult) {
    console.log('[translation] MyMemory fallback:', { text, targetLang, result: myMemoryResult });
    await saveToCache(text, targetLang, myMemoryResult);
    return myMemoryResult;
  }

  console.warn('[translationService] Both APIs failed, falling back to original for:', text);

  return text; // graceful fallback
}


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
    
  }
}
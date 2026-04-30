import AsyncStorage from '@react-native-async-storage/async-storage';
// Added useRef to the imports
import { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import {
  SUPPORTED_LANGUAGES,
  SupportedLanguage,
  translateText
} from '../services/translationService';

// ── Types ─────────────────────────────────────────────────────────────────────

interface LanguageContextType {
  language: string;
  languageInfo: SupportedLanguage;
  supportedLanguages: SupportedLanguage[];
  setLanguage: (code: string, userId?: string) => Promise<void>;
  t: (text: string) => Promise<string>;
  isChangingLanguage: boolean;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const LOCAL_LANG_KEY = 'cognilife_preferred_language';
const DEFAULT_LANG = 'en';

// ── Context ───────────────────────────────────────────────────────────────────

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// ── Provider ──────────────────────────────────────────────────────────────────

export function useAsyncTranslate() {
  const { language } = useLanguage();
  
  const translateValue = useCallback(async (text: string) => {
    if (language === 'en' || !text) return text;
    return await translateText(text, language);
  }, [language]);

  return translateValue;
}

export function LanguageProvider({ children, userId }: { children: ReactNode; userId?: string }) {
  const [language, setLanguageState] = useState<string>(DEFAULT_LANG);
  const [isChangingLanguage, setIsChangingLanguage] = useState(false);

  useEffect(() => {
    (async () => {
      const local = await AsyncStorage.getItem(LOCAL_LANG_KEY);
      if (local) setLanguageState(local);

      if (userId) {
        try {
          const { data, error } = await supabase
            .from('users')
            .select('preferred_language')
            .eq('user_id', userId)
            .maybeSingle();

          if (!error && data?.preferred_language) {
            setLanguageState(data.preferred_language);
            await AsyncStorage.setItem(LOCAL_LANG_KEY, data.preferred_language);
          }
        } catch (e) {
          // Non-fatal
        }
      }
    })();
  }, [userId]);

  const setLanguage = useCallback(async (code: string, uid?: string) => {
    if (code === language) return;
    setIsChangingLanguage(true);
    try {
      setLanguageState(code);
      await AsyncStorage.setItem(LOCAL_LANG_KEY, code);

      const targetUserId = uid ?? userId;
      if (targetUserId) {
        await supabase
          .from('users')
          .update({ preferred_language: code })
          .eq('user_id', targetUserId);
      }
    } catch (e) {
      console.warn('[LanguageContext] Failed to persist language:', e);
    } finally {
      setIsChangingLanguage(false);
    }
  }, [language, userId]);

  const t = useCallback(
    (text: string) => translateText(text, language),
    [language],
  );

  const languageInfo =
    SUPPORTED_LANGUAGES.find((l) => l.code === language) ?? SUPPORTED_LANGUAGES[0];

  return (
    <LanguageContext.Provider
      value={{
        language,
        languageInfo,
        supportedLanguages: SUPPORTED_LANGUAGES,
        setLanguage,
        t,
        isChangingLanguage,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useLanguage(): LanguageContextType {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used inside <LanguageProvider>');
  return ctx;
}

// ── Utility hook: Modified as requested ──────────────────────────────────────

export function useTranslated<T extends Record<string, string>>(source: T): T {
  const { language } = useLanguage();
  // ✅ Stable key so the object identity doesn't thrash the effect
  const sourceRef = useRef(source);
  sourceRef.current = source;
  const [translated, setTranslated] = useState<T>(source);

  useEffect(() => {
    if (language === 'en') {
      setTranslated(sourceRef.current);
      return;
    }
    let cancelled = false;
    (async () => {
      const entries = await Promise.all(
        Object.entries(sourceRef.current).map(async ([k, v]) => [
          k,
          await translateText(v, language),
        ]),
      );
      if (!cancelled) setTranslated(Object.fromEntries(entries) as T);
    })();
    return () => {
      cancelled = true;
    };
  }, [language]); // ✅ language is the only reactive dep needed

  return translated;
}
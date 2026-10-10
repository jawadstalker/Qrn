import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";

import AsyncStorage from "@react-native-async-storage/async-storage";

import { translations } from "@/core/i18n/translations";
import { Language } from "@/core/types/index";

export type TranslationValue = Record<string, string>;

interface LanguageContextType {
  language: Language;

  isRTL: boolean;

  isLanguageLoaded: boolean;

  t: TranslationValue;

  setLanguage: (lang: Language) => Promise<void>;

  toggleLanguage: () => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined,
);

const LANGUAGE_KEY = "@neurolia_language";

function getTranslations(language: Language): TranslationValue {
  const selected = translations[language as keyof typeof translations];

  return selected as TranslationValue;
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("fa");

  const [isLanguageLoaded, setIsLanguageLoaded] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadLanguage = async () => {
      try {
        const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);

        if (!mounted) {
          return;
        }

        if (savedLanguage === "fa" || savedLanguage === "en") {
          setLanguageState(savedLanguage);
        }
      } catch (error) {
        console.error("[LANGUAGE] Failed to load language:", error);
      } finally {
        if (mounted) {
          setIsLanguageLoaded(true);
        }
      }
    };

    void loadLanguage();

    return () => {
      mounted = false;
    };
  }, []);

  const setLanguage = useCallback(
    async (newLanguage: Language) => {
      if (newLanguage === language) {
        return;
      }

      setLanguageState(newLanguage);

      try {
        await AsyncStorage.setItem(LANGUAGE_KEY, newLanguage);
      } catch (error) {
        console.error("[LANGUAGE] Failed to save language:", error);
      }
    },
    [language],
  );

  const toggleLanguage = useCallback(() => {
    setLanguageState((currentLanguage) => {
      const nextLanguage: Language = currentLanguage === "fa" ? "en" : "fa";

      void AsyncStorage.setItem(LANGUAGE_KEY, nextLanguage).catch((error) => {
        console.error("[LANGUAGE] Failed to persist language:", error);
      });

      return nextLanguage;
    });
  }, []);

  const isRTL = language === "fa";

  const t = useMemo<TranslationValue>(
    () => getTranslations(language),
    [language],
  );

  const value = useMemo<LanguageContextType>(
    () => ({
      language,

      isRTL,

      isLanguageLoaded,

      t,

      setLanguage,

      toggleLanguage,
    }),
    [language, isRTL, isLanguageLoaded, t, setLanguage, toggleLanguage],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }

  return context;
}

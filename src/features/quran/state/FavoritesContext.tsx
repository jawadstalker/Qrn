import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { SURAHS, type SurahInfo } from "@/features/quran/data/surahs";

interface FavoritesContextValue {
  favorites: number[];
  favoriteCount: number;
  isFavorite: (surahId: number) => boolean;
  /** Resolves with the new state: true = now a favorite. */
  toggleFavorite: (surahId: number) => Promise<boolean>;
  getFavoriteSurahs: () => SurahInfo[];
}

const FAVORITES_STORAGE_KEY = "@quran_favorites";

const FavoritesContext = createContext<FavoritesContextValue | undefined>(
  undefined,
);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<number[]>([]);
  // The latest list, readable synchronously, so two quick taps never read a stale one.
  const latest = useRef<number[]>([]);

  const apply = useCallback((next: number[]) => {
    latest.current = next;
    setFavorites(next);
  }, []);

  useEffect(() => {
    let mounted = true;

    AsyncStorage.getItem(FAVORITES_STORAGE_KEY)
      .then((saved) => {
        if (!mounted || !saved) {
          return;
        }

        try {
          const parsed: unknown = JSON.parse(saved);

          if (Array.isArray(parsed)) {
            const stored = parsed.filter(
              (id): id is number => typeof id === "number",
            );

            // Anything tapped before the saved list arrived is kept too.
            apply([...new Set([...stored, ...latest.current])]);
          }
        } catch {
          // A damaged list is treated as empty.
        }
      })
      .catch(() => undefined);

    return () => {
      mounted = false;
    };
  }, [apply]);

  const isFavorite = useCallback(
    (surahId: number): boolean => favorites.includes(surahId),
    [favorites],
  );

  const toggleFavorite = useCallback(
    async (surahId: number): Promise<boolean> => {
      try {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {
        // Haptics are a bonus.
      }

      const current = latest.current;
      const willBeFavorite = !current.includes(surahId);
      const next = willBeFavorite
        ? [...current, surahId]
        : current.filter((id) => id !== surahId);

      apply(next);

      try {
        await AsyncStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Still a favorite for this session; it is saved with the next change.
      }

      return willBeFavorite;
    },
    [apply],
  );

  const getFavoriteSurahs = useCallback((): SurahInfo[] => {
    const set = new Set(favorites);

    return SURAHS.filter((surah) => set.has(surah.id));
  }, [favorites]);

  const value = useMemo(
    () => ({
      favorites,
      favoriteCount: favorites.length,
      isFavorite,
      toggleFavorite,
      getFavoriteSurahs,
    }),
    [favorites, isFavorite, toggleFavorite, getFavoriteSurahs],
  );

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites(): FavoritesContextValue {
  const context = useContext(FavoritesContext);

  if (!context) {
    throw new Error("useFavorites must be used within FavoritesProvider");
  }

  return context;
}

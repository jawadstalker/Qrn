import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
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
  toggleFavorite: (surahId: number) => Promise<boolean>;
  getFavoriteSurahs: () => SurahInfo[];
}

const FAVORITES_STORAGE_KEY = "@quran_favorites";

const FavoritesContext = createContext<FavoritesContextValue | undefined>(
  undefined,
);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<number[]>([]);

  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(FAVORITES_STORAGE_KEY)
      .then((saved) => {
        if (mounted && saved) {
          try {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed)) {
              setFavorites(parsed.filter((id) => typeof id === "number"));
            }
          } catch {
            // Ignore parse errors
          }
        }
      })
      .catch(() => undefined);

    return () => {
      mounted = false;
    };
  }, []);

  const persistFavorites = useCallback(async (next: number[]) => {
    try {
      await AsyncStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Storage error fallback
    }
  }, []);

  const isFavorite = useCallback(
    (surahId: number): boolean => favorites.includes(surahId),
    [favorites],
  );

  const toggleFavorite = useCallback(
    async (surahId: number): Promise<boolean> => {
      try {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {
        // Haptics optional
      }

      let willBeFavorite = false;
      setFavorites((prev) => {
        let next: number[];
        if (prev.includes(surahId)) {
          next = prev.filter((id) => id !== surahId);
          willBeFavorite = false;
        } else {
          next = [...prev, surahId];
          willBeFavorite = true;
        }
        void persistFavorites(next);
        return next;
      });

      return willBeFavorite;
    },
    [persistFavorites],
  );

  const getFavoriteSurahs = useCallback((): SurahInfo[] => {
    const favoriteSet = new Set(favorites);
    return SURAHS.filter((surah) => favoriteSet.has(surah.id));
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

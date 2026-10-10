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
import {
  PAGE1_SURAH_ID,
  PAGE1_VERSES,
} from "@/features/quran/data/mushafPage1";
import {
  STABLE_REVIEWS,
  computePlant,
  isDueForReview,
  type PlantSnapshot,
} from "@/features/quran/utils/plantGrowth";

export interface VerseRecord {
  learnedAt: number;
  lastReviewedAt: number;
  reviews: number;
}

type SurahRecords = Record<number, VerseRecord>;
type ProgressMap = Record<number, SurahRecords>;

export interface RememberResult {
  becameLearned: boolean;
  stageChanged: boolean;
}

interface QuranProgressValue {
  isLoaded: boolean;
  plant: PlantSnapshot;
  learnedCount: number;
  stableCount: number;
  dueAyahs: number[];
  nextNewAyah: number | null;
  currentAyah: number;
  recordFor: (ayah: number) => VerseRecord | undefined;
  remember: (ayah: number) => Promise<RememberResult>;
  needsReview: (ayah: number) => Promise<void>;
  reset: () => Promise<void>;
}

const QuranProgressContext = createContext<QuranProgressValue | undefined>(
  undefined,
);

const STORAGE_KEY = "@quran_garden_progress";

function parseProgress(raw: string | null): ProgressMap {
  if (!raw) {
    return {};
  }

  try {
    const value = JSON.parse(raw) as ProgressMap;

    return value && typeof value === "object" ? value : {};
  } catch {
    return {};
  }
}

export function QuranProgressProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<ProgressMap>({});
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let mounted = true;
    setIsLoaded(false);

    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (mounted) {
          setProgress(parseProgress(raw));
        }
      })
      .catch(() => {
        if (mounted) {
          setProgress({});
        }
      })
      .finally(() => {
        if (mounted) {
          setIsLoaded(true);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const persist = useCallback(async (next: ProgressMap) => {
    setProgress(next);

    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (error) {
      console.error("[QURAN] Failed to save progress:", error);
    }
  }, []);

  const records = useMemo<SurahRecords>(
    () => progress[PAGE1_SURAH_ID] ?? {},
    [progress],
  );

  const derived = useMemo(() => {
    const now = Date.now();
    const entries = PAGE1_VERSES.map((verse) => ({
      verse,
      record: records[verse.ayah],
    }));
    const learned = entries.filter((entry) => entry.record);
    const stable = learned.filter(
      (entry) => (entry.record?.reviews ?? 0) >= STABLE_REVIEWS,
    );
    const due = learned
      .filter((entry) =>
        isDueForReview(
          entry.record!.reviews,
          entry.record!.lastReviewedAt,
          now,
        ),
      )
      .map((entry) => entry.verse.ayah);
    const nextNew = entries.find((entry) => !entry.record)?.verse.ayah ?? null;

    return {
      learnedCount: learned.length,
      stableCount: stable.length,
      dueAyahs: due,
      nextNewAyah: nextNew,
      currentAyah:
        nextNew ?? due[0] ?? PAGE1_VERSES[PAGE1_VERSES.length - 1]!.ayah,
    };
  }, [records]);

  const plant = useMemo(
    () => computePlant(derived.learnedCount, derived.stableCount),
    [derived.learnedCount, derived.stableCount],
  );

  const recordFor = useCallback((ayah: number) => records[ayah], [records]);

  const remember = useCallback(
    async (ayah: number): Promise<RememberResult> => {
      const now = Date.now();
      const existing = records[ayah];
      const nextRecords: SurahRecords = {
        ...records,
        [ayah]: existing
          ? { ...existing, reviews: existing.reviews + 1, lastReviewedAt: now }
          : { learnedAt: now, lastReviewedAt: now, reviews: 1 },
      };
      const before = computePlant(derived.learnedCount, derived.stableCount);
      const learnedAfter = existing
        ? derived.learnedCount
        : derived.learnedCount + 1;
      const stableAfter = Object.values(nextRecords).filter(
        (record) => record.reviews >= STABLE_REVIEWS,
      ).length;
      const after = computePlant(learnedAfter, stableAfter);

      await persist({ ...progress, [PAGE1_SURAH_ID]: nextRecords });

      return {
        becameLearned: !existing,
        stageChanged: before.stage.id !== after.stage.id,
      };
    },
    [derived.learnedCount, derived.stableCount, persist, progress, records],
  );

  const needsReview = useCallback(
    async (ayah: number) => {
      const existing = records[ayah];

      if (!existing) {
        return;
      }

      await persist({
        ...progress,
        [PAGE1_SURAH_ID]: {
          ...records,
          [ayah]: { ...existing, reviews: 0, lastReviewedAt: 0 },
        },
      });
    },
    [persist, progress, records],
  );

  const reset = useCallback(() => persist({}), [persist]);

  const value = useMemo<QuranProgressValue>(
    () => ({
      isLoaded,
      plant,
      learnedCount: derived.learnedCount,
      stableCount: derived.stableCount,
      dueAyahs: derived.dueAyahs,
      nextNewAyah: derived.nextNewAyah,
      currentAyah: derived.currentAyah,
      recordFor,
      remember,
      needsReview,
      reset,
    }),
    [isLoaded, plant, derived, recordFor, remember, needsReview, reset],
  );

  return (
    <QuranProgressContext.Provider value={value}>
      {children}
    </QuranProgressContext.Provider>
  );
}

export function useQuranProgress(): QuranProgressValue {
  const context = useContext(QuranProgressContext);

  if (!context) {
    throw new Error(
      "useQuranProgress must be used within a QuranProgressProvider",
    );
  }

  return context;
}

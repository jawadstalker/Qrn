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
  const progressRef = useRef<ProgressMap>({});

  useEffect(() => {
    let mounted = true;
    setIsLoaded(false);

    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (mounted) {
          const parsed = parseProgress(raw);
          progressRef.current = parsed;
          setProgress(parsed);
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
    progressRef.current = next;
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
      const current = progressRef.current;
      const currentRecords = current[PAGE1_SURAH_ID] ?? {};
      const existing = currentRecords[ayah];
      const nextRecords: SurahRecords = {
        ...currentRecords,
        [ayah]: existing
          ? { ...existing, reviews: existing.reviews + 1, lastReviewedAt: now }
          : { learnedAt: now, lastReviewedAt: now, reviews: 1 },
      };
      const count = (map: SurahRecords) => {
        const all = Object.values(map);

        return {
          learned: all.length,
          stable: all.filter((record) => record.reviews >= STABLE_REVIEWS)
            .length,
        };
      };
      const before = count(currentRecords);
      const after = count(nextRecords);

      await persist({ ...current, [PAGE1_SURAH_ID]: nextRecords });

      return {
        becameLearned: !existing,
        stageChanged:
          computePlant(before.learned, before.stable).stage.id !==
          computePlant(after.learned, after.stable).stage.id,
      };
    },
    [persist],
  );

  const needsReview = useCallback(
    async (ayah: number) => {
      const current = progressRef.current;
      const currentRecords = current[PAGE1_SURAH_ID] ?? {};
      const existing = currentRecords[ayah];

      if (!existing) {
        return;
      }

      await persist({
        ...current,
        [PAGE1_SURAH_ID]: {
          ...currentRecords,
          [ayah]: { ...existing, reviews: 0, lastReviewedAt: 0 },
        },
      });
    },
    [persist],
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

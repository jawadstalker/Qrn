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
  DEFAULT_SURAH_ID,
  getMushafSurah,
  type MushafSurah,
} from "@/features/quran/data/mushafPages";
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

export interface QuizResult {
  /** Best score ever reached on this surah's quiz. */
  best: number;
  /** Number of questions in the quiz that produced `best`. */
  total: number;
  lastScore: number;
  lastTotal: number;
  lastAt: number;
  attempts: number;
}

type QuizMap = Record<number, QuizResult>;

export interface RememberResult {
  becameLearned: boolean;
  stageChanged: boolean;
}

export interface SurahStats {
  learned: number;
  stable: number;
  total: number;
  dueAyahs: number[];
  nextNewAyah: number | null;
  /** Where "continue" should open: next new verse, else first due, else the last verse. */
  startAyah: number;
  plant: PlantSnapshot;
}

interface QuranProgressValue {
  isLoaded: boolean;
  surahId: number;
  mushaf: MushafSurah;
  setSurah: (surahId: number) => void;
  statsFor: (surahId: number) => SurahStats | undefined;
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
  quizFor: (surahId: number) => QuizResult | undefined;
  recordQuiz: (surahId: number, score: number, total: number) => Promise<void>;
}

const QuranProgressContext = createContext<QuranProgressValue | undefined>(
  undefined,
);

const STORAGE_KEY = "@quran_garden_progress";
const SURAH_KEY = "@quran_garden_active_surah";
const QUIZ_KEY = "@quran_garden_quiz";

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

function parseQuiz(raw: string | null): QuizMap {
  if (!raw) {
    return {};
  }

  try {
    const value = JSON.parse(raw) as QuizMap;

    return value && typeof value === "object" ? value : {};
  } catch {
    return {};
  }
}

function computeStats(surah: MushafSurah, records: SurahRecords): SurahStats {
  const now = Date.now();
  const entries = surah.verses.map((verse) => ({
    ayah: verse.ayah,
    record: records[verse.ayah],
  }));
  const learned = entries.filter((entry) => entry.record);
  const stable = learned.filter(
    (entry) => (entry.record?.reviews ?? 0) >= STABLE_REVIEWS,
  );
  const due = learned
    .filter((entry) =>
      isDueForReview(entry.record!.reviews, entry.record!.lastReviewedAt, now),
    )
    .map((entry) => entry.ayah);
  const nextNew = entries.find((entry) => !entry.record)?.ayah ?? null;

  return {
    learned: learned.length,
    stable: stable.length,
    total: surah.verses.length,
    dueAyahs: due,
    nextNewAyah: nextNew,
    startAyah: nextNew ?? due[0] ?? surah.verses[surah.verses.length - 1]!.ayah,
    plant: computePlant(learned.length, stable.length, surah.verses.length),
  };
}

export function QuranProgressProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<ProgressMap>({});
  const [surahId, setSurahId] = useState(DEFAULT_SURAH_ID);
  const [isLoaded, setIsLoaded] = useState(false);
  const [quiz, setQuiz] = useState<QuizMap>({});
  const progressRef = useRef<ProgressMap>({});
  const quizRef = useRef<QuizMap>({});
  const surahRef = useRef(DEFAULT_SURAH_ID);

  useEffect(() => {
    let mounted = true;

    Promise.all([
      AsyncStorage.getItem(STORAGE_KEY),
      AsyncStorage.getItem(SURAH_KEY),
      AsyncStorage.getItem(QUIZ_KEY),
    ])
      .then(([raw, storedSurah, storedQuiz]) => {
        if (!mounted) {
          return;
        }

        const parsed = parseProgress(raw);
        const parsedQuiz = parseQuiz(storedQuiz);
        const id = Number(storedSurah);

        progressRef.current = parsed;
        setProgress(parsed);
        quizRef.current = parsedQuiz;
        setQuiz(parsedQuiz);

        if (getMushafSurah(id)) {
          surahRef.current = id;
          setSurahId(id);
        }
      })
      .catch(() => undefined)
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

  const setSurah = useCallback((id: number) => {
    if (!getMushafSurah(id)) {
      return;
    }

    surahRef.current = id;
    setSurahId(id);
    AsyncStorage.setItem(SURAH_KEY, String(id)).catch(() => undefined);
  }, []);

  const mushaf = useMemo(
    () => getMushafSurah(surahId) ?? getMushafSurah(DEFAULT_SURAH_ID)!,
    [surahId],
  );
  const records = useMemo<SurahRecords>(
    () => progress[mushaf.surahId] ?? {},
    [progress, mushaf.surahId],
  );
  const stats = useMemo(() => computeStats(mushaf, records), [mushaf, records]);

  const statsFor = useCallback(
    (id: number) => {
      const target = getMushafSurah(id);

      return target ? computeStats(target, progress[id] ?? {}) : undefined;
    },
    [progress],
  );

  const recordFor = useCallback((ayah: number) => records[ayah], [records]);

  const remember = useCallback(
    async (ayah: number): Promise<RememberResult> => {
      const target = getMushafSurah(surahRef.current)!;
      const now = Date.now();
      const current = progressRef.current;
      const currentRecords = current[target.surahId] ?? {};
      const existing = currentRecords[ayah];
      const nextRecords: SurahRecords = {
        ...currentRecords,
        [ayah]: existing
          ? { ...existing, reviews: existing.reviews + 1, lastReviewedAt: now }
          : { learnedAt: now, lastReviewedAt: now, reviews: 1 },
      };
      const before = computeStats(target, currentRecords).plant.stage.id;
      const after = computeStats(target, nextRecords).plant.stage.id;

      await persist({ ...current, [target.surahId]: nextRecords });

      return { becameLearned: !existing, stageChanged: before !== after };
    },
    [persist],
  );

  const needsReview = useCallback(
    async (ayah: number) => {
      const id = surahRef.current;
      const current = progressRef.current;
      const currentRecords = current[id] ?? {};
      const existing = currentRecords[ayah];

      if (!existing) {
        return;
      }

      await persist({
        ...current,
        [id]: {
          ...currentRecords,
          [ayah]: { ...existing, reviews: 0, lastReviewedAt: 0 },
        },
      });
    },
    [persist],
  );

  const recordQuiz = useCallback(
    async (id: number, score: number, total: number) => {
      const previous = quizRef.current[id];
      const improved =
        !previous || score / Math.max(total, 1) > previous.best / Math.max(previous.total, 1);
      const next: QuizMap = {
        ...quizRef.current,
        [id]: {
          best: improved ? score : previous.best,
          total: improved ? total : previous.total,
          lastScore: score,
          lastTotal: total,
          lastAt: Date.now(),
          attempts: (previous?.attempts ?? 0) + 1,
        },
      };

      quizRef.current = next;
      setQuiz(next);

      try {
        await AsyncStorage.setItem(QUIZ_KEY, JSON.stringify(next));
      } catch (error) {
        console.error("[QURAN] Failed to save quiz result:", error);
      }
    },
    [],
  );

  const quizFor = useCallback((id: number) => quiz[id], [quiz]);

  const reset = useCallback(async () => {
    quizRef.current = {};
    setQuiz({});
    AsyncStorage.removeItem(QUIZ_KEY).catch(() => undefined);
    await persist({});
  }, [persist]);

  const value = useMemo<QuranProgressValue>(
    () => ({
      isLoaded,
      surahId: mushaf.surahId,
      mushaf,
      setSurah,
      statsFor,
      plant: stats.plant,
      learnedCount: stats.learned,
      stableCount: stats.stable,
      dueAyahs: stats.dueAyahs,
      nextNewAyah: stats.nextNewAyah,
      currentAyah: stats.startAyah,
      recordFor,
      remember,
      needsReview,
      reset,
      quizFor,
      recordQuiz,
    }),
    [
      isLoaded,
      mushaf,
      setSurah,
      statsFor,
      stats,
      recordFor,
      remember,
      needsReview,
      reset,
      quizFor,
      recordQuiz,
    ],
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

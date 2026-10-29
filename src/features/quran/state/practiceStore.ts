import { useEffect, useSyncExternalStore } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type PracticeKind = "fill" | "next" | "number" | "concept" | "recall";
export type PracticeMode = "quiz" | "stage" | "recall" | "exam";

export interface KindTally {
  right: number;
  total: number;
}

export interface AttemptRecord {
  id: string;
  surahId: number;
  mode: PracticeMode;
  /** Stage number (1-4) when mode is "stage". */
  stage?: number;
  score: number;
  total: number;
  at: number;
  byKind: Partial<Record<PracticeKind, KindTally>>;
}

export interface MistakeRecord {
  key: string;
  surahId: number;
  ayah?: number;
  kind: PracticeKind;
  /** How many times this question was missed. */
  count: number;
  /** Correct answers in a row since the last miss. */
  streak: number;
  firstAt: number;
  lastAt: number;
  /** The wrong answer the learner chose last (text of the option). */
  lastPicked?: string;
  /** The correct answer (text of the option, or the verse for recall). */
  correct?: string;
  /** Whether picked/correct are Arabic and need the Quran font. */
  arabic: boolean;
}

export interface AyahStat {
  right: number;
  wrong: number;
  lastAt: number;
}

export interface PracticeState {
  loaded: boolean;
  attempts: AttemptRecord[];
  mistakes: Record<string, MistakeRecord>;
  /** Keyed by `${surahId}:${ayah}`. */
  ayahStats: Record<string, AyahStat>;
}

export const RESOLVE_STREAK = 2;

const STORAGE_KEY = "@quran_garden_practice_v1";
const MAX_ATTEMPTS = 300;

let state: PracticeState = {
  loaded: false,
  attempts: [],
  mistakes: {},
  ayahStats: {},
};
let loading: Promise<void> | null = null;
const listeners = new Set<() => void>();

function emit(next: PracticeState) {
  state = next;
  listeners.forEach((listener) => listener());
}

async function persist() {
  try {
    const { attempts, mistakes, ayahStats } = state;

    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ attempts, mistakes, ayahStats }),
    );
  } catch (error) {
    console.error("[QURAN] Failed to save practice data:", error);
  }
}

/** Forgets the in-memory copy and reads the stored data again (used after a sync pulled new data). */
export function reloadPracticeStore(): Promise<void> {
  loading = null;
  // Start from defaults so old in-memory values are not merged into the reloaded data.
  state = { loaded: false, attempts: [], mistakes: {}, ayahStats: {} };

  return load();
}

function load(): Promise<void> {
  if (!loading) {
    loading = AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        let parsed: Partial<PracticeState> = {};

        try {
          parsed = raw ? (JSON.parse(raw) as Partial<PracticeState>) : {};
        } catch {
          parsed = {};
        }

        // Anything logged before the load finished is kept on top of the stored data.
        emit({
          loaded: true,
          attempts: [...(parsed.attempts ?? []), ...state.attempts].slice(
            -MAX_ATTEMPTS,
          ),
          mistakes: { ...(parsed.mistakes ?? {}), ...state.mistakes },
          ayahStats: { ...(parsed.ayahStats ?? {}), ...state.ayahStats },
        });
      })
      .catch(() => emit({ ...state, loaded: true }));
  }

  return loading;
}

function subscribe(listener: () => void) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return state;
}

/** Subscribes a component to the practice data (attempts, mistakes, per-verse stats). */
export function usePractice(): PracticeState {
  useEffect(() => {
    void load();
  }, []);

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export interface AnswerLog {
  surahId: number;
  /** Stable question id, e.g. `fill-3` or `concept-xyz`. */
  questionId: string;
  kind: PracticeKind;
  ayah?: number;
  right: boolean;
  picked?: string;
  correct?: string;
  arabic?: boolean;
}

/** Records one answered question: updates verse stats and the mistake history. */
export async function logAnswer(answer: AnswerLog): Promise<void> {
  await load();

  const now = Date.now();
  const key = `${answer.surahId}:${answer.questionId}`;
  let ayahStats = state.ayahStats;
  let mistakes = state.mistakes;

  if (answer.ayah !== undefined) {
    const statKey = `${answer.surahId}:${answer.ayah}`;
    const previous = ayahStats[statKey] ?? { right: 0, wrong: 0, lastAt: 0 };

    ayahStats = {
      ...ayahStats,
      [statKey]: {
        right: previous.right + (answer.right ? 1 : 0),
        wrong: previous.wrong + (answer.right ? 0 : 1),
        lastAt: now,
      },
    };
  }

  const existing = mistakes[key];

  if (!answer.right) {
    mistakes = {
      ...mistakes,
      [key]: {
        key,
        surahId: answer.surahId,
        ayah: answer.ayah,
        kind: answer.kind,
        count: (existing?.count ?? 0) + 1,
        streak: 0,
        firstAt: existing?.firstAt ?? now,
        lastAt: now,
        lastPicked: answer.picked,
        correct: answer.correct,
        arabic: answer.arabic ?? false,
      },
    };
  } else if (existing) {
    mistakes = {
      ...mistakes,
      [key]: { ...existing, streak: existing.streak + 1 },
    };
  }

  emit({ ...state, ayahStats, mistakes });
  await persist();
}

export interface AttemptLog {
  surahId: number;
  mode: PracticeMode;
  stage?: number;
  score: number;
  total: number;
  byKind: Partial<Record<PracticeKind, KindTally>>;
}

export async function logAttempt(attempt: AttemptLog): Promise<void> {
  await load();

  const at = Date.now();
  const record: AttemptRecord = {
    ...attempt,
    id: `${at}-${Math.floor(Math.random() * 1e6)}`,
    at,
  };

  emit({ ...state, attempts: [...state.attempts, record].slice(-MAX_ATTEMPTS) });
  await persist();
}

export async function resolveMistake(key: string): Promise<void> {
  await load();

  const existing = state.mistakes[key];

  if (!existing) {
    return;
  }

  emit({
    ...state,
    mistakes: {
      ...state.mistakes,
      [key]: { ...existing, streak: Math.max(existing.streak, RESOLVE_STREAK) },
    },
  });
  await persist();
}

/** Clears mistakes and per-verse stats; keeps the attempt log so stage progress survives. */
export async function clearMistakes(): Promise<void> {
  await load();
  emit({ ...state, mistakes: {}, ayahStats: {} });
  await persist();
}

export function isUnresolved(mistake: MistakeRecord): boolean {
  return mistake.streak < RESOLVE_STREAK;
}

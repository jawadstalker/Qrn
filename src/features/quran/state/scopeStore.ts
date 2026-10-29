import { useEffect, useSyncExternalStore } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { VERSE_TEXT } from "@/features/quran/data/verseText";

export interface AyahRange {
  from: number;
  to: number;
}

export interface ScopeState {
  loaded: boolean;
  surahId: number;
  /** Memorization range per surah. Missing = the whole surah. */
  ranges: Record<number, AyahRange>;
  /** Verses the learner marked as memorized, per surah. Missing = every verse in the range. */
  selected: Record<number, number[]>;
  questionCount: number;
  /** Pass mark in percent. */
  passPercent: number;
}

export const QUESTION_COUNTS: readonly number[] = [5, 8, 12];
export const PASS_MARKS: readonly number[] = [60, 70, 80, 90];

const STORAGE_KEY = "@quran_garden_scope_v1";

/** Surahs whose verse text is bundled, so they can be practiced and examined. */
export const SCOPE_SURAHS: readonly number[] = Object.keys(VERSE_TEXT)
  .map(Number)
  .sort((a, b) => a - b);

let state: ScopeState = {
  loaded: false,
  surahId: SCOPE_SURAHS[SCOPE_SURAHS.length - 1] ?? 1,
  ranges: {},
  selected: {},
  questionCount: 8,
  passPercent: 70,
};
let loading: Promise<void> | null = null;
const listeners = new Set<() => void>();

export function totalVerses(surahId: number): number {
  return VERSE_TEXT[surahId]?.length ?? 0;
}

export function rangeOf(current: ScopeState, surahId: number): AyahRange {
  const total = totalVerses(surahId);
  const stored = current.ranges[surahId];
  const from = Math.min(Math.max(stored?.from ?? 1, 1), Math.max(total, 1));
  const to = Math.min(Math.max(stored?.to ?? total, from), Math.max(total, 1));

  return { from, to };
}

/** The memorized verses inside the range, ascending. */
export function selectionOf(current: ScopeState, surahId: number): number[] {
  const { from, to } = rangeOf(current, surahId);
  const stored = current.selected[surahId];
  const all = Array.from({ length: to - from + 1 }, (_, index) => from + index);

  return stored
    ? all.filter((ayah) => stored.includes(ayah))
    : all;
}

function emit(next: ScopeState) {
  state = next;
  listeners.forEach((listener) => listener());
}

async function persist() {
  try {
    const { surahId, ranges, selected, questionCount, passPercent } = state;

    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ surahId, ranges, selected, questionCount, passPercent }),
    );
  } catch (error) {
    console.error("[QURAN] Failed to save scope:", error);
  }
}

/** Forgets the in-memory copy and reads the stored data again (used after a sync pulled new data). */
export function reloadScopeStore(): Promise<void> {
  loading = null;
  // Start from defaults so old in-memory values are not merged into the reloaded data.
  state = {
    loaded: false,
    surahId: SCOPE_SURAHS[SCOPE_SURAHS.length - 1] ?? 1,
    ranges: {},
    selected: {},
    questionCount: 8,
    passPercent: 70,
  };

  return load();
}

function load(): Promise<void> {
  if (!loading) {
    loading = AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        let parsed: Partial<ScopeState> = {};

        try {
          parsed = raw ? (JSON.parse(raw) as Partial<ScopeState>) : {};
        } catch {
          parsed = {};
        }

        emit({
          ...state,
          loaded: true,
          surahId:
            parsed.surahId !== undefined && totalVerses(parsed.surahId) > 0
              ? parsed.surahId
              : state.surahId,
          ranges: parsed.ranges ?? {},
          selected: parsed.selected ?? {},
          questionCount: QUESTION_COUNTS.includes(parsed.questionCount ?? 0)
            ? parsed.questionCount!
            : state.questionCount,
          passPercent: PASS_MARKS.includes(parsed.passPercent ?? 0)
            ? parsed.passPercent!
            : state.passPercent,
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

export function useScope(): ScopeState {
  useEffect(() => {
    void load();
  }, []);

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

async function update(change: (current: ScopeState) => ScopeState) {
  await load();
  emit(change(state));
  await persist();
}

export function setScopeSurah(surahId: number) {
  if (totalVerses(surahId) === 0) {
    return Promise.resolve();
  }

  return update((current) => ({ ...current, surahId }));
}

/** Sets the range; verses that fall outside it drop out of the selection. */
export function setScopeRange(surahId: number, from: number, to: number) {
  const total = totalVerses(surahId);
  const low = Math.min(Math.max(Math.round(from), 1), total);
  const high = Math.min(Math.max(Math.round(to), low), total);

  return update((current) => {
    const stored = current.selected[surahId];

    return {
      ...current,
      ranges: { ...current.ranges, [surahId]: { from: low, to: high } },
      selected: stored
        ? {
            ...current.selected,
            [surahId]: stored.filter((ayah) => ayah >= low && ayah <= high),
          }
        : current.selected,
    };
  });
}

export function toggleScopeAyah(surahId: number, ayah: number) {
  return update((current) => {
    const now = selectionOf(current, surahId);
    const next = now.includes(ayah)
      ? now.filter((item) => item !== ayah)
      : [...now, ayah].sort((a, b) => a - b);

    return { ...current, selected: { ...current.selected, [surahId]: next } };
  });
}

export function setScopeSelection(surahId: number, ayahs: readonly number[]) {
  return update((current) => {
    const { from, to } = rangeOf(current, surahId);

    return {
      ...current,
      selected: {
        ...current.selected,
        [surahId]: ayahs
          .filter((ayah) => ayah >= from && ayah <= to)
          .sort((a, b) => a - b),
      },
    };
  });
}

export function setExamSettings(questionCount: number, passPercent: number) {
  return update((current) => ({ ...current, questionCount, passPercent }));
}

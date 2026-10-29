import { useEffect, useSyncExternalStore } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { DEFAULT_SECTION_SIZE, SECTION_SIZES } from "@/features/quran/utils/sections";

export interface AyahReps {
  /** Completed listening repetitions of this verse. */
  reps: number;
  lastAt: number;
}

export type RepeatScope = "ayah" | "section";

export interface RepeatSettings {
  scope: RepeatScope;
  /** How many times each verse is played in a row. */
  ayahRepeats: number;
  /** How many times the whole section is played. 0 means until stopped. */
  loops: number;
  /** Silent pause between two recitations, in seconds. */
  gapSeconds: number;
}

export interface SectionState {
  loaded: boolean;
  sectionSize: number;
  repeat: RepeatSettings;
  /** Keyed by `${surahId}:${ayah}`. */
  reps: Record<string, AyahReps>;
}

export const AYAH_REPEAT_OPTIONS: readonly number[] = [1, 3, 5, 10];
export const LOOP_OPTIONS: readonly number[] = [1, 2, 3, 5, 0];
export const GAP_OPTIONS: readonly number[] = [0, 1, 2, 4];

const STORAGE_KEY = "@quran_garden_sections_v1";

const DEFAULT_REPEAT: RepeatSettings = {
  scope: "section",
  ayahRepeats: 3,
  loops: 1,
  gapSeconds: 1,
};

let state: SectionState = {
  loaded: false,
  sectionSize: DEFAULT_SECTION_SIZE,
  repeat: DEFAULT_REPEAT,
  reps: {},
};
let loading: Promise<void> | null = null;
const listeners = new Set<() => void>();

function emit(next: SectionState) {
  state = next;
  listeners.forEach((listener) => listener());
}

async function persist() {
  try {
    const { sectionSize, repeat, reps } = state;

    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ sectionSize, repeat, reps }),
    );
  } catch (error) {
    console.error("[QURAN] Failed to save section data:", error);
  }
}

function pick(value: number, allowed: readonly number[], fallback: number) {
  return allowed.includes(value) ? value : fallback;
}

/** Forgets the in-memory copy and reads the stored data again (used after a sync pulled new data). */
export function reloadSectionStore(): Promise<void> {
  loading = null;
  // Start from defaults so old in-memory values are not merged into the reloaded data.
  state = { loaded: false, sectionSize: DEFAULT_SECTION_SIZE, repeat: DEFAULT_REPEAT, reps: {} };

  return load();
}

function load(): Promise<void> {
  if (!loading) {
    loading = AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        let parsed: Partial<SectionState> = {};

        try {
          parsed = raw ? (JSON.parse(raw) as Partial<SectionState>) : {};
        } catch {
          parsed = {};
        }

        const stored = parsed.repeat;

        // Repetitions logged before the load finished are added on top of the stored ones.
        const reps: Record<string, AyahReps> = { ...(parsed.reps ?? {}) };

        Object.entries(state.reps).forEach(([key, value]) => {
          const previous = reps[key];

          reps[key] = {
            reps: (previous?.reps ?? 0) + value.reps,
            lastAt: Math.max(previous?.lastAt ?? 0, value.lastAt),
          };
        });

        emit({
          loaded: true,
          sectionSize: pick(
            parsed.sectionSize ?? state.sectionSize,
            SECTION_SIZES,
            DEFAULT_SECTION_SIZE,
          ),
          repeat: {
            scope: stored?.scope === "ayah" ? "ayah" : DEFAULT_REPEAT.scope,
            ayahRepeats: pick(
              stored?.ayahRepeats ?? DEFAULT_REPEAT.ayahRepeats,
              AYAH_REPEAT_OPTIONS,
              DEFAULT_REPEAT.ayahRepeats,
            ),
            loops: pick(
              stored?.loops ?? DEFAULT_REPEAT.loops,
              LOOP_OPTIONS,
              DEFAULT_REPEAT.loops,
            ),
            gapSeconds: pick(
              stored?.gapSeconds ?? DEFAULT_REPEAT.gapSeconds,
              GAP_OPTIONS,
              DEFAULT_REPEAT.gapSeconds,
            ),
          },
          reps,
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

/** Subscribes a component to section settings and per-verse repetition counts. */
export function useSections(): SectionState {
  useEffect(() => {
    void load();
  }, []);

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function repsKey(surahId: number, ayah: number): string {
  return `${surahId}:${ayah}`;
}

export function repsFor(
  current: SectionState,
  surahId: number,
  ayah: number,
): AyahReps {
  return current.reps[repsKey(surahId, ayah)] ?? { reps: 0, lastAt: 0 };
}

export async function setSectionSize(size: number): Promise<void> {
  await load();

  if (!SECTION_SIZES.includes(size) || size === state.sectionSize) {
    return;
  }

  emit({ ...state, sectionSize: size });
  await persist();
}

export async function updateRepeatSettings(
  patch: Partial<RepeatSettings>,
): Promise<void> {
  await load();
  emit({ ...state, repeat: { ...state.repeat, ...patch } });
  await persist();
}

/** The latest settings, for code outside React (the audio player). */
export function getRepeatSettings(): RepeatSettings {
  return state.repeat;
}

/** Records finished listening repetitions of one verse. */
export async function logAyahReps(
  surahId: number,
  ayah: number,
  count = 1,
): Promise<void> {
  if (count <= 0) {
    return;
  }

  const key = repsKey(surahId, ayah);
  const previous = state.reps[key] ?? { reps: 0, lastAt: 0 };

  emit({
    ...state,
    reps: {
      ...state.reps,
      [key]: { reps: previous.reps + count, lastAt: Date.now() },
    },
  });

  // Wait for the stored data to be merged before saving so nothing is overwritten.
  await load();
  await persist();
}

/** Forgets all repetition counts (the settings are kept). */
export async function clearSectionReps(): Promise<void> {
  await load();
  emit({ ...state, reps: {} });
  await persist();
}

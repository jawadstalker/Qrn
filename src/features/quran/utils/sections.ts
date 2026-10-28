import { STABLE_REVIEWS, isDueForReview } from "@/features/quran/utils/plantGrowth";

/** Memorization status shown as a color on verses and sections. */
export type SectionStatus = "new" | "learning" | "fair" | "good" | "mastered";

export const STATUS_ORDER: readonly SectionStatus[] = [
  "new",
  "learning",
  "fair",
  "good",
  "mastered",
];

/** Fixed colors (readable on both light and dark themes). */
export const STATUS_COLORS: Record<SectionStatus, string> = {
  new: "#9AA3A0",
  learning: "#D64545",
  fair: "#E8A33D",
  good: "#7DB84A",
  mastered: "#1F9D74",
};

export const SECTION_SIZES: readonly number[] = [3, 5, 7, 10];
export const DEFAULT_SECTION_SIZE = 5;

/** One "I remembered it" check counts as this many listening repetitions. */
export const RECALL_WEIGHT = 3;
/** Average practice units per verse needed to reach each level. */
export const FAIR_UNITS = 6;
export const GOOD_UNITS = 15;
export const MASTERED_UNITS = 30;

export interface SectionRange {
  /** Zero-based index of the section inside the surah. */
  index: number;
  from: number;
  to: number;
  count: number;
}

/** Splits a surah into short, evenly sized sections (sizes differ by at most one verse). */
export function splitIntoSections(
  totalVerses: number,
  size: number = DEFAULT_SECTION_SIZE,
): SectionRange[] {
  const total = Math.max(Math.floor(totalVerses), 0);

  if (total === 0) {
    return [];
  }

  const target = Math.max(Math.floor(size), 1);
  const sections = Math.ceil(total / target);
  const base = Math.floor(total / sections);
  const extra = total % sections;
  const result: SectionRange[] = [];
  let from = 1;

  for (let index = 0; index < sections; index += 1) {
    const count = base + (index < extra ? 1 : 0);

    result.push({ index, from, to: from + count - 1, count });
    from += count;
  }

  return result;
}

export function sectionIndexOf(
  sections: readonly SectionRange[],
  ayah: number,
): number {
  const found = sections.find(
    (section) => ayah >= section.from && ayah <= section.to,
  );

  return found ? found.index : Math.max(sections.length - 1, 0);
}

export interface VerseSignal {
  /** True when the verse was marked as learned (it has a progress record). */
  learned: boolean;
  /** Number of "I remembered" reviews. */
  reviews: number;
  /** Completed listening / repetition passes. */
  audioReps: number;
  lastReviewedAt: number;
}

export function practiceUnits(signal: VerseSignal): number {
  return signal.audioReps + RECALL_WEIGHT * signal.reviews;
}

export interface StatusResult {
  status: SectionStatus;
  /** Average practice units per verse. */
  units: number;
  /** True when at least one learned verse is due for review (the status was lowered). */
  due: boolean;
  /** Fraction of verses already learned, 0..1. */
  learnedRatio: number;
  /** Progress inside the current status toward the next one, 0..1. */
  progress: number;
}

function shiftDown(status: SectionStatus): SectionStatus {
  const index = STATUS_ORDER.indexOf(status);

  return index > 1 ? STATUS_ORDER[index - 1]! : status;
}

/**
 * Status of a group of verses (one verse or a whole section).
 *
 * - `new`: nothing practiced yet.
 * - `learning` (red): started, but not every verse is learned or practice is still low.
 * - `fair` (amber): every verse learned, some practice.
 * - `good` (light green): plenty of practice.
 * - `mastered` (green): lots of practice and every verse reviewed enough times.
 *
 * When `trackLearned` is false (surahs without bundled text) only listening counts.
 * A learned verse that is due for spaced review lowers the status by one level.
 */
export function classifyVerses(
  signals: readonly VerseSignal[],
  now: number = Date.now(),
  trackLearned = true,
): StatusResult {
  const count = Math.max(signals.length, 1);
  const learnedCount = signals.filter((signal) => signal.learned).length;
  const units =
    signals.reduce((sum, signal) => sum + practiceUnits(signal), 0) / count;
  const allLearned = !trackLearned || learnedCount === signals.length;
  const allStable = signals.every(
    (signal) => !trackLearned || signal.reviews >= STABLE_REVIEWS,
  );
  const due = signals.some(
    (signal) =>
      signal.learned && isDueForReview(signal.reviews, signal.lastReviewedAt, now),
  );
  const learnedRatio = signals.length === 0 ? 0 : learnedCount / signals.length;

  let status: SectionStatus;
  let progress: number;

  if (units <= 0 && learnedCount === 0) {
    status = "new";
    progress = 0;
  } else if (!allLearned || units < FAIR_UNITS) {
    status = "learning";
    progress = Math.min(units / FAIR_UNITS, 1) * (allLearned ? 1 : 0.9);
  } else if (units < GOOD_UNITS) {
    status = "fair";
    progress = (units - FAIR_UNITS) / (GOOD_UNITS - FAIR_UNITS);
  } else if (units < MASTERED_UNITS || !allStable) {
    status = "good";
    progress = Math.min(
      (units - GOOD_UNITS) / (MASTERED_UNITS - GOOD_UNITS),
      1,
    );
  } else {
    status = "mastered";
    progress = 1;
  }

  const lowered = due && status !== "new" ? shiftDown(status) : status;

  return {
    status: lowered,
    units,
    due: due && lowered !== status,
    learnedRatio,
    progress: Math.max(0, Math.min(progress, 1)),
  };
}

export interface SectionInfo extends SectionRange, StatusResult {}

export interface SectionInputs {
  totalVerses: number;
  size: number;
  trackLearned: boolean;
  signalFor: (ayah: number) => VerseSignal;
  now?: number;
}

/** Sections of one surah with their current status. */
export function computeSections(inputs: SectionInputs): SectionInfo[] {
  return splitIntoSections(inputs.totalVerses, inputs.size).map((section) => {
    const signals: VerseSignal[] = [];

    for (let ayah = section.from; ayah <= section.to; ayah += 1) {
      signals.push(inputs.signalFor(ayah));
    }

    return {
      ...section,
      ...classifyVerses(signals, inputs.now, inputs.trackLearned),
    };
  });
}

export function statusCounts(
  sections: readonly { status: SectionStatus }[],
): Record<SectionStatus, number> {
  const counts: Record<SectionStatus, number> = {
    new: 0,
    learning: 0,
    fair: 0,
    good: 0,
    mastered: 0,
  };

  sections.forEach((section) => {
    counts[section.status] += 1;
  });

  return counts;
}

/** The section that most needs practice: due or weakest, earliest first. */
export function weakestSection<T extends SectionInfo>(
  sections: readonly T[],
): T | undefined {
  const open = sections.filter(
    (section) => section.status !== "new" && section.status !== "mastered",
  );
  const fresh = sections.filter((section) => section.status === "new");
  const pool = open.length > 0 ? open : fresh.length > 0 ? fresh : sections;

  return [...pool].sort((a, b) => {
    const rankA = STATUS_ORDER.indexOf(a.status) - (a.due ? 0.5 : 0);
    const rankB = STATUS_ORDER.indexOf(b.status) - (b.due ? 0.5 : 0);

    return rankA - rankB || a.index - b.index;
  })[0];
}

export function withAlpha(hex: string, alpha: number): string {
  const value = hex.replace("#", "");
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

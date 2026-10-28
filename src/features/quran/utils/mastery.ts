import { STABLE_REVIEWS } from "@/features/quran/utils/plantGrowth";
import type {
  AyahStat,
  MistakeRecord,
} from "@/features/quran/state/practiceStore";
import { isUnresolved } from "@/features/quran/state/practiceStore";

export type MasteryLevel = "weak" | "fair" | "good" | "mastered";

/** Mastery of one verse, 0..1. Combines spaced-review count, quiz accuracy and open mistakes. */
export function ayahMastery(
  reviews: number | undefined,
  stat: AyahStat | undefined,
  openMistakes: number,
): number {
  const base = Math.min((reviews ?? 0) / STABLE_REVIEWS, 1);
  const answered = (stat?.right ?? 0) + (stat?.wrong ?? 0);
  const score =
    answered > 0
      ? 0.5 * base + 0.5 * ((stat?.right ?? 0) / answered)
      : 0.7 * base;
  const penalty = Math.min(openMistakes, 2) * 0.15;

  return Math.max(0, Math.min(1, score - penalty));
}

export function levelFor(mastery: number): MasteryLevel {
  return mastery >= 0.9
    ? "mastered"
    : mastery >= 0.7
      ? "good"
      : mastery >= 0.4
        ? "fair"
        : "weak";
}

export function openMistakesByAyah(
  mistakes: Record<string, MistakeRecord>,
  surahId: number,
): Record<number, number> {
  const result: Record<number, number> = {};

  Object.values(mistakes).forEach((mistake) => {
    if (
      mistake.surahId === surahId &&
      mistake.ayah !== undefined &&
      isUnresolved(mistake)
    ) {
      result[mistake.ayah] = (result[mistake.ayah] ?? 0) + 1;
    }
  });

  return result;
}

/** Verses with an open mistake in this surah, most-missed first. */
export function weakAyahs(
  mistakes: Record<string, MistakeRecord>,
  surahId: number,
): number[] {
  const score = new Map<number, number>();

  Object.values(mistakes).forEach((mistake) => {
    if (
      mistake.surahId === surahId &&
      mistake.ayah !== undefined &&
      isUnresolved(mistake)
    ) {
      score.set(mistake.ayah, (score.get(mistake.ayah) ?? 0) + mistake.count);
    }
  });

  return Array.from(score.entries())
    .sort((a, b) => b[1] - a[1] || a[0] - b[0])
    .map(([ayah]) => ayah);
}

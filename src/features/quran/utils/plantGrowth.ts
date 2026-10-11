import { PAGE1_VERSES } from "@/features/quran/data/mushafPage1";

export type PlantStageId = "seed" | "sprout" | "sapling" | "bud" | "bloom";

export interface PlantStage {
  id: PlantStageId;
  minLearned: number;
}

const TOTAL_VERSES = PAGE1_VERSES.length;

// Stage thresholds scale with the verses that actually exist,
// so "bloom" is always reachable (previously needed 10 of 7 verses).
export const PLANT_STAGES: readonly PlantStage[] = [
  { id: "seed", minLearned: 0 },
  { id: "sprout", minLearned: 1 },
  { id: "sapling", minLearned: Math.max(2, Math.ceil(TOTAL_VERSES * 0.4)) },
  { id: "bud", minLearned: Math.max(3, Math.ceil(TOTAL_VERSES * 0.7)) },
  { id: "bloom", minLearned: TOTAL_VERSES },
];

export const MAX_VISIBLE_LEAVES = 8;
export const MAX_FLOWERS = 2;
export const STABLE_REVIEWS = 3;
export const VERSES_PER_FLOWER = 3;

export interface PlantSnapshot {
  stage: PlantStage;
  nextStage: PlantStage | null;
  leaves: number;
  flowers: number;
  versesToNextStage: number;
  stageProgress: number;
}

export function computePlant(learned: number, stable: number): PlantSnapshot {
  const reached = PLANT_STAGES.filter((stage) => learned >= stage.minLearned);
  const stage = reached[reached.length - 1] ?? PLANT_STAGES[0]!;
  const nextStage =
    PLANT_STAGES.find((candidate) => candidate.minLearned > learned) ?? null;
  const span = nextStage ? nextStage.minLearned - stage.minLearned : 1;
  const done = nextStage ? learned - stage.minLearned : 1;

  return {
    stage,
    nextStage,
    leaves: Math.min(learned, MAX_VISIBLE_LEAVES),
    flowers: Math.min(
      Math.max(
        Math.floor(stable / VERSES_PER_FLOWER),
        stage.id === "bloom" ? 1 : 0,
      ),
      MAX_FLOWERS,
    ),
    versesToNextStage: nextStage ? nextStage.minLearned - learned : 0,
    stageProgress: Math.min(done / span, 1),
  };
}

const REVIEW_INTERVAL_DAYS = [1, 3, 7, 14, 30];
const DAY_MS = 24 * 60 * 60 * 1000;

export function reviewIntervalMs(reviews: number): number {
  const index = Math.min(
    Math.max(reviews - 1, 0),
    REVIEW_INTERVAL_DAYS.length - 1,
  );

  return (REVIEW_INTERVAL_DAYS[index] ?? 1) * DAY_MS;
}

export function isDueForReview(
  reviews: number,
  lastReviewedAt: number,
  now: number,
): boolean {
  return now - lastReviewedAt >= reviewIntervalMs(reviews);
}

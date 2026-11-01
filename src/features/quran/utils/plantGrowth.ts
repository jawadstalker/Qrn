export type PlantStageId = "seed" | "sprout" | "sapling" | "bud" | "bloom";

export interface PlantStage {
  id: PlantStageId;
  minLearned: number;
}

/** Only a few leaves, so the plant is not buried in foliage. */
export const MAX_VISIBLE_LEAVES = 3;
/** Blossoms sit on the stem: bottom, middle, top. */
export const MAX_FLOWERS = 3;
export const STABLE_REVIEWS = 3;

/**
 * How many verses must be learned before blossom 1 (bottom), 2 (middle) and
 * 3 (top) opens. Spread in thirds; the last one needs the whole surah.
 */
export function blossomThresholds(total: number): number[] {
  const size = Math.max(total, 1);

  return Array.from({ length: MAX_FLOWERS }, (_, index) =>
    Math.max(Math.ceil((size * (index + 1)) / MAX_FLOWERS), 1),
  );
}

export type GrowthMarker = "leaf" | "blossom";

/**
 * Which not-yet-learned verses will add a leaf or a blossom to the plant once
 * learned. `unlearned` is the verses still to learn, in the order they will
 * be learned; the k-th one takes the learned count to `learned + k`.
 */
export function growthMarkers(
  unlearned: readonly number[],
  learned: number,
  total: number,
): Map<number, GrowthMarker> {
  const markers = new Map<number, GrowthMarker>();

  for (let target = 1; target <= MAX_VISIBLE_LEAVES; target += 1) {
    const ayah = unlearned[target - learned - 1];

    if (target > learned && ayah !== undefined) {
      markers.set(ayah, "leaf");
    }
  }

  blossomThresholds(total).forEach((target) => {
    const ayah = unlearned[target - learned - 1];

    // A blossom wins over a leaf when both land on the same verse.
    if (target > learned && ayah !== undefined) {
      markers.set(ayah, "blossom");
    }
  });

  return markers;
}

/** Stage thresholds scale with the surah length so "bloom" is always reachable. */
export function stagesFor(total: number): readonly PlantStage[] {
  const size = Math.max(total, 1);

  return [
    { id: "seed", minLearned: 0 },
    { id: "sprout", minLearned: 1 },
    {
      id: "sapling",
      minLearned: Math.min(Math.max(2, Math.ceil(size * 0.4)), size),
    },
    {
      id: "bud",
      minLearned: Math.min(Math.max(3, Math.ceil(size * 0.7)), size),
    },
    { id: "bloom", minLearned: size },
  ].filter(
    (stage, index, all) =>
      index === 0 || stage.minLearned > all[index - 1]!.minLearned,
  ) as readonly PlantStage[];
}

export interface PlantSnapshot {
  stage: PlantStage;
  nextStage: PlantStage | null;
  leaves: number;
  flowers: number;
  /** The verse just learned added a leaf to the plant. */
  newLeaf: boolean;
  /** The verse just learned opened a new blossom. */
  newBlossom: boolean;
  versesToNextStage: number;
  stageProgress: number;
}

export function computePlant(
  learned: number,
  _stable: number,
  total: number,
): PlantSnapshot {
  const stages = stagesFor(total);
  const reached = stages.filter((stage) => learned >= stage.minLearned);
  const stage = reached[reached.length - 1] ?? stages[0]!;
  const nextStage =
    stages.find((candidate) => candidate.minLearned > learned) ?? null;
  const thresholds = blossomThresholds(total);
  const span = nextStage ? nextStage.minLearned - stage.minLearned : 1;
  const done = nextStage ? learned - stage.minLearned : 1;

  return {
    stage,
    nextStage,
    leaves: Math.min(learned, MAX_VISIBLE_LEAVES),
    flowers: thresholds.filter((target) => learned >= target).length,
    newLeaf: learned >= 1 && learned <= MAX_VISIBLE_LEAVES,
    newBlossom: thresholds.includes(learned),
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

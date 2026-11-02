import type { QuizKind } from "@/features/quran/utils/quiz";
import type { AttemptRecord } from "@/features/quran/state/practiceStore";

export type StageId = 1 | 2 | 3 | 4;

export interface StageSpec {
  id: StageId;
  /** Question kinds for quiz stages; stage 4 is the recall exam and has none. */
  kinds: readonly QuizKind[];
  length: number;
  /** Fraction of correct answers needed to pass. */
  pass: number;
  recall: boolean;
}

export const STAGES: readonly StageSpec[] = [
  { id: 1, kinds: ["order", "number"], length: 6, pass: 0.7, recall: false },
  { id: 2, kinds: ["order", "next", "page"], length: 8, pass: 0.75, recall: false },
  {
    id: 3,
    kinds: ["order", "next", "number", "page", "line", "concept"],
    length: 10,
    pass: 0.8,
    recall: false,
  },
  { id: 4, kinds: [], length: 8, pass: 0.8, recall: true },
];

export function getStage(id: number): StageSpec | undefined {
  return STAGES.find((stage) => stage.id === id);
}

export interface StageStatus {
  spec: StageSpec;
  passed: boolean;
  unlocked: boolean;
  /** Best percentage (0..100) over all attempts, or null if never tried. */
  bestPercent: number | null;
}

export function stageStatuses(
  attempts: readonly AttemptRecord[],
  surahId: number,
): StageStatus[] {
  let previousPassed = true;

  return STAGES.map((spec) => {
    const tries = attempts.filter(
      (attempt) =>
        attempt.mode === "stage" &&
        attempt.stage === spec.id &&
        attempt.surahId === surahId &&
        attempt.total > 0,
    );
    const best = tries.reduce(
      (max, attempt) => Math.max(max, attempt.score / attempt.total),
      -1,
    );
    const passed = best >= spec.pass;
    const status: StageStatus = {
      spec,
      passed,
      unlocked: previousPassed,
      bestPercent: best >= 0 ? Math.round(best * 100) : null,
    };

    previousPassed = passed;

    return status;
  });
}

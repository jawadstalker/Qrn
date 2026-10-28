import type {
  AttemptRecord,
  PracticeKind,
} from "@/features/quran/state/practiceStore";

const DAY = 24 * 60 * 60 * 1000;

export function startOfDay(time: number): number {
  const date = new Date(time);

  date.setHours(0, 0, 0, 0);

  return date.getTime();
}

export interface DayPoint {
  /** Start of the local day. */
  day: number;
  questions: number;
  right: number;
  /** 0..1, or null when nothing was answered that day. */
  accuracy: number | null;
}

export function dailySeries(
  attempts: readonly AttemptRecord[],
  days: number,
  now: number = Date.now(),
): DayPoint[] {
  const today = startOfDay(now);
  const points: DayPoint[] = [];

  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const day = today - offset * DAY;
    const inDay = attempts.filter(
      (attempt) => attempt.at >= day && attempt.at < day + DAY,
    );
    const questions = inDay.reduce((sum, attempt) => sum + attempt.total, 0);
    const right = inDay.reduce((sum, attempt) => sum + attempt.score, 0);

    points.push({
      day,
      questions,
      right,
      accuracy: questions > 0 ? right / questions : null,
    });
  }

  return points;
}

function accuracyBetween(
  attempts: readonly AttemptRecord[],
  from: number,
  to: number,
): number | null {
  const inRange = attempts.filter(
    (attempt) => attempt.at >= from && attempt.at < to,
  );
  const total = inRange.reduce((sum, attempt) => sum + attempt.total, 0);

  if (total === 0) {
    return null;
  }

  return inRange.reduce((sum, attempt) => sum + attempt.score, 0) / total;
}

export interface WeekTrend {
  thisWeek: number | null;
  previousWeek: number | null;
  /** Percentage points, or null when one of the weeks has no data. */
  delta: number | null;
}

export function weekTrend(
  attempts: readonly AttemptRecord[],
  now: number = Date.now(),
): WeekTrend {
  const end = startOfDay(now) + DAY;
  const thisWeek = accuracyBetween(attempts, end - 7 * DAY, end);
  const previousWeek = accuracyBetween(attempts, end - 14 * DAY, end - 7 * DAY);

  return {
    thisWeek,
    previousWeek,
    delta:
      thisWeek !== null && previousWeek !== null
        ? Math.round((thisWeek - previousWeek) * 100)
        : null,
  };
}

export function accuracyByKind(
  attempts: readonly AttemptRecord[],
): Partial<Record<PracticeKind, { right: number; total: number }>> {
  const result: Partial<Record<PracticeKind, { right: number; total: number }>> =
    {};

  attempts.forEach((attempt) => {
    (Object.entries(attempt.byKind) as [
      PracticeKind,
      { right: number; total: number },
    ][]).forEach(([kind, tally]) => {
      const previous = result[kind] ?? { right: 0, total: 0 };

      result[kind] = {
        right: previous.right + tally.right,
        total: previous.total + tally.total,
      };
    });
  });

  return result;
}

/** Consecutive days with at least one attempt, ending today (or yesterday if today is empty). */
export function practiceStreak(
  attempts: readonly AttemptRecord[],
  now: number = Date.now(),
): number {
  const days = new Set(attempts.map((attempt) => startOfDay(attempt.at)));
  let cursor = startOfDay(now);

  if (!days.has(cursor)) {
    cursor -= DAY;
  }

  let streak = 0;

  while (days.has(cursor)) {
    streak += 1;
    cursor -= DAY;
  }

  return streak;
}

export function overallAccuracy(
  attempts: readonly AttemptRecord[],
): number | null {
  const total = attempts.reduce((sum, attempt) => sum + attempt.total, 0);

  if (total === 0) {
    return null;
  }

  return attempts.reduce((sum, attempt) => sum + attempt.score, 0) / total;
}

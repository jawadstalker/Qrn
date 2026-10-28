import { getSurah } from "@/features/quran/data/surahs";
import {
  addDays,
  diffDays,
  isValidISO,
  weekdayOf,
  type ISODate,
} from "@/features/quran/plan/calendar";

export interface Segment {
  surahId: number;
  from: number;
  to: number;
}

export type PlanMode = "perDay" | "targetDate";

export interface PlanConfig {
  /** Surahs in the order they will be memorized. */
  surahIds: number[];
  /** Only used when exactly one surah is selected. `null` = whole surah. */
  fromAyah: number | null;
  toAyah: number | null;
  mode: PlanMode;
  /** Verses per session (used when `mode` is "perDay"). */
  perDay: number;
  /** Memorization days, numbered like `Date#getDay` (0 = Sunday). */
  weekdays: number[];
  startDate: ISODate;
  /** Used when `mode` is "targetDate". */
  targetDate: ISODate | null;
  /** Add "review the previous session" to every session. */
  review: boolean;
}

export interface PlanSession {
  index: number;
  date: ISODate;
  segments: Segment[];
  count: number;
  /** Verses finished after this session. */
  cumulative: number;
  review: Segment[];
}

export type PlanIssue =
  | "noSurah"
  | "badRange"
  | "noWeekday"
  | "badAmount"
  | "badDate"
  | "targetBeforeStart"
  | "noSessionBeforeTarget"
  | "tooLong";

export interface PlanSummary {
  totalAyahs: number;
  sessionCount: number;
  maxPerSession: number;
  minPerSession: number;
  firstDate: ISODate | null;
  lastDate: ISODate | null;
  /** Calendar days from the first to the last session (inclusive). */
  spanDays: number;
}

export interface BuiltPlan {
  issues: PlanIssue[];
  sessions: PlanSession[];
  summary: PlanSummary;
}

export const MAX_PER_DAY = 100;
export const MAX_SESSIONS = 3000;
/** Longest stretch of days searched for memorization days. */
const MAX_SPAN_DAYS = 365 * 15;

export const EMPTY_SUMMARY: PlanSummary = {
  totalAyahs: 0,
  sessionCount: 0,
  maxPerSession: 0,
  minPerSession: 0,
  firstDate: null,
  lastDate: null,
  spanDays: 0,
};

export function defaultConfig(startDate: ISODate): PlanConfig {
  return {
    surahIds: [],
    fromAyah: null,
    toAyah: null,
    mode: "perDay",
    perDay: 5,
    weekdays: [6, 0, 1, 2, 3, 4],
    startDate,
    targetDate: null,
    review: true,
  };
}

/** The ranges that make up the plan, in memorization order. */
export function scopeBlocks(config: PlanConfig): Segment[] {
  const blocks: Segment[] = [];

  config.surahIds.forEach((surahId) => {
    const surah = getSurah(surahId);

    if (!surah) {
      return;
    }

    const single = config.surahIds.length === 1;
    const from = single ? (config.fromAyah ?? 1) : 1;
    const to = single ? (config.toAyah ?? surah.verses) : surah.verses;

    blocks.push({ surahId, from, to });
  });

  return blocks;
}

export function countAyahs(segments: readonly Segment[]): number {
  return segments.reduce((sum, item) => sum + (item.to - item.from + 1), 0);
}

function validateRange(config: PlanConfig): boolean {
  if (config.surahIds.length !== 1) {
    return true;
  }

  const surah = getSurah(config.surahIds[0]!);

  if (!surah) {
    return false;
  }

  const from = config.fromAyah ?? 1;
  const to = config.toAyah ?? surah.verses;

  return from >= 1 && to <= surah.verses && from <= to;
}

/** Cuts `amounts[i]` verses per session out of the ordered blocks. */
function slice(blocks: readonly Segment[], amounts: readonly number[]) {
  const result: Segment[][] = [];
  let blockIndex = 0;
  let cursor = blocks[0]?.from ?? 1;

  amounts.forEach((amount) => {
    const segments: Segment[] = [];
    let left = amount;

    while (left > 0 && blockIndex < blocks.length) {
      const block = blocks[blockIndex]!;
      const take = Math.min(left, block.to - cursor + 1);

      segments.push({
        surahId: block.surahId,
        from: cursor,
        to: cursor + take - 1,
      });

      left -= take;
      cursor += take;

      if (cursor > block.to) {
        blockIndex += 1;
        cursor = blocks[blockIndex]?.from ?? 1;
      }
    }

    result.push(segments);
  });

  return result;
}

/** Memorization days from `start` on, optionally up to `until` (inclusive). */
function memorizationDates(
  start: ISODate,
  weekdays: readonly number[],
  limit: number,
  until: ISODate | null,
): ISODate[] {
  const allowed = new Set(weekdays);
  const dates: ISODate[] = [];
  const lastOffset = until ? diffDays(start, until) : MAX_SPAN_DAYS;

  for (
    let offset = 0;
    offset <= Math.min(lastOffset, MAX_SPAN_DAYS) && dates.length < limit;
    offset += 1
  ) {
    const date = addDays(start, offset);

    if (allowed.has(weekdayOf(date))) {
      dates.push(date);
    }
  }

  return dates;
}

function summarize(sessions: readonly PlanSession[]): PlanSummary {
  if (sessions.length === 0) {
    return EMPTY_SUMMARY;
  }

  const counts = sessions.map((session) => session.count);
  const firstDate = sessions[0]!.date;
  const lastDate = sessions[sessions.length - 1]!.date;

  return {
    totalAyahs: counts.reduce((sum, value) => sum + value, 0),
    sessionCount: sessions.length,
    maxPerSession: Math.max(...counts),
    minPerSession: Math.min(...counts),
    firstDate,
    lastDate,
    spanDays: diffDays(firstDate, lastDate) + 1,
  };
}

function fail(issues: PlanIssue[]): BuiltPlan {
  return { issues, sessions: [], summary: EMPTY_SUMMARY };
}

/**
 * Turns a plan configuration into a day-by-day schedule.
 *
 * - "perDay": a fixed number of verses per session, the last one may be shorter.
 * - "targetDate": the verses are spread as evenly as possible over every
 *   memorization day up to the target date (sessions differ by at most one verse).
 */
export function buildPlan(config: PlanConfig): BuiltPlan {
  const issues: PlanIssue[] = [];
  const blocks = scopeBlocks(config);

  if (blocks.length === 0) {
    issues.push("noSurah");
  } else if (!validateRange(config)) {
    issues.push("badRange");
  }

  if (config.weekdays.length === 0) {
    issues.push("noWeekday");
  }

  if (!isValidISO(config.startDate)) {
    issues.push("badDate");
  }

  if (config.mode === "perDay") {
    if (
      !Number.isInteger(config.perDay) ||
      config.perDay < 1 ||
      config.perDay > MAX_PER_DAY
    ) {
      issues.push("badAmount");
    }
  } else if (!config.targetDate || !isValidISO(config.targetDate)) {
    issues.push("badDate");
  } else if (
    isValidISO(config.startDate) &&
    diffDays(config.startDate, config.targetDate) < 0
  ) {
    issues.push("targetBeforeStart");
  }

  if (issues.length > 0) {
    return fail(issues);
  }

  const total = countAyahs(blocks);
  let dates: ISODate[];
  let amounts: number[];

  if (config.mode === "perDay") {
    const sessions = Math.ceil(total / config.perDay);

    if (sessions > MAX_SESSIONS) {
      return fail(["tooLong"]);
    }

    dates = memorizationDates(
      config.startDate,
      config.weekdays,
      sessions,
      null,
    );
    amounts = dates.map((_, i) =>
      Math.min(config.perDay, total - i * config.perDay),
    );
  } else {
    const available = memorizationDates(
      config.startDate,
      config.weekdays,
      MAX_SESSIONS,
      config.targetDate,
    );

    if (available.length === 0) {
      return fail(["noSessionBeforeTarget"]);
    }

    const used = Math.min(available.length, total);
    const base = Math.floor(total / used);
    const extra = total % used;

    dates = available.slice(0, used);
    amounts = dates.map((_, i) => base + (i < extra ? 1 : 0));
  }

  if (dates.length < amounts.length || dates.length > MAX_SESSIONS) {
    return fail(["tooLong"]);
  }

  const parts = slice(blocks, amounts);
  let cumulative = 0;
  const sessions: PlanSession[] = dates.map((date, index) => {
    const segments = parts[index] ?? [];
    const count = countAyahs(segments);

    cumulative += count;

    return {
      index,
      date,
      segments,
      count,
      cumulative,
      review: config.review && index > 0 ? (parts[index - 1] ?? []) : [],
    };
  });

  return { issues: [], sessions, summary: summarize(sessions) };
}

/** Index of the session on `date`, or -1. */
export function sessionOn(
  sessions: readonly PlanSession[],
  date: ISODate,
): number {
  return sessions.findIndex((session) => session.date === date);
}

/** First session on or after `date`, or -1 when the plan is over. */
export function nextSessionFrom(
  sessions: readonly PlanSession[],
  date: ISODate,
): number {
  return sessions.findIndex((session) => session.date >= date);
}

export function formatSegments(
  segments: readonly Segment[],
  numberFormat: (value: number) => string,
  surahName: (surahId: number) => string,
): string {
  return segments
    .map((segment) => {
      const range =
        segment.from === segment.to
          ? numberFormat(segment.from)
          : `${numberFormat(segment.from)}–${numberFormat(segment.to)}`;

      return `${surahName(segment.surahId)} ${range}`;
    })
    .join(" · ");
}

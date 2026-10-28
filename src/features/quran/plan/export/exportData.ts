import { formatNumber } from "@/core/i18n/format";
import type { Language } from "@/core/types/index";
import { getSurah } from "@/features/quran/data/surahs";
import {
  formatDate,
  formatDateNumeric,
  weekStartFor,
  weekdayName,
  weekdayOrder,
  type ISODate,
} from "@/features/quran/plan/calendar";
import {
  formatSegments,
  type PlanConfig,
  type PlanSession,
  type PlanSummary,
} from "@/features/quran/plan/planEngine";
import { fill } from "@/features/quran/utils/fill";

export type ExportCell = string | number;

export interface ExportRow {
  cells: ExportCell[];
  done: boolean;
}

export interface ExportDoc {
  language: Language;
  rtl: boolean;
  title: string;
  subtitle: string;
  generatedLine: string;
  summary: { label: string; value: string }[];
  headers: string[];
  /** Same length as `headers`; "number" columns hold real numbers for Excel. */
  kinds: ("number" | "text")[];
  rows: ExportRow[];
}

interface ExportInput {
  config: PlanConfig;
  sessions: readonly PlanSession[];
  summary: PlanSummary;
  done: readonly number[];
  t: Record<string, string>;
  language: Language;
  /** Adds the Gregorian date next to the Jalali one (Persian only). */
  includeGregorian: boolean;
  today: ISODate;
}

export function surahLabel(surahId: number, language: Language): string {
  const surah = getSurah(surahId);

  if (!surah) {
    return String(surahId);
  }

  return language === "fa" ? surah.name : surah.transliteration;
}

export function buildExportDoc(input: ExportInput): ExportDoc {
  const { config, sessions, summary, done, t, language, today } = input;
  const number = (value: number) => formatNumber(value, language);
  const doneSet = new Set(done);
  const name = (id: number) => surahLabel(id, language);
  const portion = (segments: PlanSession["segments"]) =>
    formatSegments(segments, number, name);
  const withGregorian = input.includeGregorian && language === "fa";
  const total = Math.max(summary.totalAyahs, 1);

  const headers = [
    t.plan_col_no,
    t.plan_col_date,
    ...(withGregorian ? [t.plan_col_gregorian] : []),
    t.plan_col_weekday,
    t.plan_col_portion,
    t.plan_col_count,
    t.plan_col_total,
    t.plan_col_percent,
    t.plan_col_review,
    t.plan_col_done,
  ].map((value) => value ?? "");
  const kinds: ExportDoc["kinds"] = [
    "number",
    "text",
    ...(withGregorian ? (["text"] as const) : []),
    "text",
    "text",
    "number",
    "number",
    "text",
    "text",
    "text",
  ];

  const rows: ExportRow[] = sessions.map((session) => {
    const isDone = doneSet.has(session.index);

    return {
      done: isDone,
      cells: [
        session.index + 1,
        formatDateNumeric(session.date, language),
        ...(withGregorian ? [session.date] : []),
        weekdayName(language, new Date(`${session.date}T00:00:00Z`).getUTCDay()),
        portion(session.segments),
        session.count,
        session.cumulative,
        `${number(Math.round((session.cumulative / total) * 100))}${language === "fa" ? "٪" : "%"}`,
        session.review.length > 0 ? portion(session.review) : "—",
        isDone ? "✓" : "",
      ],
    };
  });

  const perSession =
    summary.minPerSession === summary.maxPerSession
      ? number(summary.maxPerSession)
      : `${number(summary.minPerSession)}–${number(summary.maxPerSession)}`;
  const days = weekdayOrder(weekStartFor(language))
    .filter((day) => config.weekdays.includes(day))
    .map((day) => weekdayName(language, day))
    .join(language === "fa" ? "، " : ", ");
  const finished = sessions.filter((session) => doneSet.has(session.index));
  const finishedAyahs = finished.reduce((sum, session) => sum + session.count, 0);
  const subtitle = config.surahIds
    .map((id) => {
      const surah = getSurah(id);

      return surah ? name(id) : "";
    })
    .filter(Boolean)
    .join(language === "fa" ? "، " : ", ");

  return {
    language,
    rtl: language === "fa",
    title: t.plan_export_title ?? "",
    subtitle,
    generatedLine: fill(t.plan_export_generated, {
      date: formatDate(today, language),
    }),
    summary: [
      { label: t.plan_sum_total ?? "", value: number(summary.totalAyahs) },
      { label: t.plan_sum_sessions ?? "", value: number(summary.sessionCount) },
      { label: t.plan_sum_per_session ?? "", value: perSession },
      { label: t.plan_sum_days ?? "", value: days },
      {
        label: t.plan_sum_start ?? "",
        value: summary.firstDate ? formatDate(summary.firstDate, language) : "—",
      },
      {
        label: t.plan_sum_end ?? "",
        value: summary.lastDate ? formatDate(summary.lastDate, language) : "—",
      },
      {
        label: t.plan_sum_progress ?? "",
        value: fill(t.plan_sum_progress_value, {
          done: number(finished.length),
          sessions: number(summary.sessionCount),
          ayahs: number(finishedAyahs),
          total: number(summary.totalAyahs),
        }),
      },
    ],
    headers,
    kinds,
    rows,
  };
}

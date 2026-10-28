import type { Language } from "@/core/types/index";

/**
 * Calendar helpers for the memorization plan.
 *
 * Dates are plain "YYYY-MM-DD" strings in the Gregorian calendar (local day,
 * no time zone), so plans survive DST and travel. The Persian (Jalali)
 * calendar is only used to display and pick dates.
 */

export type ISODate = string;

export interface YMD {
  y: number;
  m: number;
  d: number;
}

const DAY_MS = 86_400_000;

function div(a: number, b: number): number {
  return Math.trunc(a / b);
}

function mod(a: number, b: number): number {
  return a - Math.trunc(a / b) * b;
}

/** Modulo that is always in [0, b), also for negative numbers. */
function floorMod(a: number, b: number): number {
  return ((a % b) + b) % b;
}

function pad(value: number, size = 2): string {
  return String(value).padStart(size, "0");
}

// ---------------------------------------------------------------- ISO dates

export function toISO({ y, m, d }: YMD): ISODate {
  return `${pad(y, 4)}-${pad(m)}-${pad(d)}`;
}

export function parseISO(iso: ISODate): YMD {
  const [y, m, d] = iso.split("-").map(Number);

  return { y: y ?? 1970, m: m ?? 1, d: d ?? 1 };
}

export function isValidISO(value: unknown): value is ISODate {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const { y, m, d } = parseISO(value);
  const date = new Date(Date.UTC(y, m - 1, d));

  return (
    date.getUTCFullYear() === y &&
    date.getUTCMonth() === m - 1 &&
    date.getUTCDate() === d
  );
}

/** Whole days since 1970-01-01 (UTC based, so DST never shifts it). */
export function toDayNumber(iso: ISODate): number {
  const { y, m, d } = parseISO(iso);

  return Math.round(Date.UTC(y, m - 1, d) / DAY_MS);
}

export function fromDayNumber(day: number): ISODate {
  const date = new Date(day * DAY_MS);

  return toISO({
    y: date.getUTCFullYear(),
    m: date.getUTCMonth() + 1,
    d: date.getUTCDate(),
  });
}

export function addDays(iso: ISODate, days: number): ISODate {
  return fromDayNumber(toDayNumber(iso) + days);
}

export function diffDays(from: ISODate, to: ISODate): number {
  return toDayNumber(to) - toDayNumber(from);
}

/** 0 = Sunday ... 6 = Saturday (same as `Date#getDay`). */
export function weekdayOf(iso: ISODate): number {
  return floorMod(toDayNumber(iso) + 4, 7);
}

export function todayISO(now: Date = new Date()): ISODate {
  return toISO({
    y: now.getFullYear(),
    m: now.getMonth() + 1,
    d: now.getDate(),
  });
}

// ------------------------------------------------------------------ Jalali
// Port of the well-known 33-year-cycle algorithm (jalaali-js, MIT).

const BREAKS = [
  -61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097,
  2192, 2262, 2324, 2394, 2456, 3178,
];

function jalCal(jy: number, withoutLeap: boolean) {
  const bl = BREAKS.length;
  const gy = jy + 621;
  let leapJ = -14;
  let jp = BREAKS[0]!;
  let jump = 0;

  if (jy < jp || jy >= BREAKS[bl - 1]!) {
    throw new Error(`Invalid Jalali year ${jy}`);
  }

  for (let i = 1; i < bl; i += 1) {
    const jm = BREAKS[i]!;

    jump = jm - jp;

    if (jy < jm) {
      break;
    }

    leapJ = leapJ + div(jump, 33) * 8 + div(mod(jump, 33), 4);
    jp = jm;
  }

  let n = jy - jp;

  leapJ = leapJ + div(n, 33) * 8 + div(mod(n, 33) + 3, 4);

  if (mod(jump, 33) === 4 && jump - n === 4) {
    leapJ += 1;
  }

  const leapG = div(gy, 4) - div((div(gy, 100) + 1) * 3, 4) - 150;
  const march = 20 + leapJ - leapG;

  if (withoutLeap) {
    return { leap: 0, gy, march };
  }

  if (jump - n < 6) {
    n = n - jump + div(jump + 4, 33) * 33;
  }

  let leap = mod(mod(n + 1, 33) - 1, 4);

  if (leap === -1) {
    leap = 4;
  }

  return { leap, gy, march };
}

function g2d(gy: number, gm: number, gd: number): number {
  let d =
    div((gy + div(gm - 8, 6) + 100100) * 1461, 4) +
    div(153 * mod(gm + 9, 12) + 2, 5) +
    gd -
    34840408;

  d = d - div(div(gy + 100100 + div(gm - 8, 6), 100) * 3, 4) + 752;

  return d;
}

function d2g(jdn: number): YMD {
  let j = 4 * jdn + 139361631;

  j = j + div(div(4 * jdn + 183187720, 146097) * 3, 4) * 4 - 3908;

  const i = div(mod(j, 1461), 4) * 5 + 308;
  const d = div(mod(i, 153), 5) + 1;
  const m = mod(div(i, 153), 12) + 1;
  const y = div(j, 1461) - 100100 + div(8 - m, 6);

  return { y, m, d };
}

function j2d(jy: number, jm: number, jd: number): number {
  const r = jalCal(jy, true);

  return g2d(r.gy, 3, r.march) + (jm - 1) * 31 - div(jm, 7) * (jm - 7) + jd - 1;
}

function d2j(jdn: number): YMD {
  let jy = d2g(jdn).y - 621;
  const r = jalCal(jy, false);
  const jdn1f = g2d(jy + 621, 3, r.march);
  let k = jdn - jdn1f;

  if (k >= 0) {
    if (k <= 185) {
      return { y: jy, m: 1 + div(k, 31), d: mod(k, 31) + 1 };
    }

    k -= 186;
  } else {
    jy -= 1;
    k += 179;

    if (r.leap === 1) {
      k += 1;
    }
  }

  return { y: jy, m: 7 + div(k, 30), d: mod(k, 30) + 1 };
}

export function gregorianToJalali(iso: ISODate): YMD {
  const { y, m, d } = parseISO(iso);

  return d2j(g2d(y, m, d));
}

export function jalaliToGregorian({ y, m, d }: YMD): ISODate {
  return toISO(d2g(j2d(y, m, d)));
}

export function jalaliMonthLength(jy: number, jm: number): number {
  if (jm <= 6) {
    return 31;
  }

  if (jm <= 11) {
    return 30;
  }

  const next = j2d(jy + 1, 1, 1);

  return next - j2d(jy, 12, 1);
}

// ---------------------------------------------------------- calendar views

/** Which calendar is shown for a UI language. Persian users get the Jalali one. */
export type CalendarKind = "jalali" | "gregorian";

export function calendarFor(language: Language): CalendarKind {
  return language === "fa" ? "jalali" : "gregorian";
}

export interface CalendarDate extends YMD {
  iso: ISODate;
}

export function toCalendarDate(iso: ISODate, kind: CalendarKind): CalendarDate {
  const ymd = kind === "jalali" ? gregorianToJalali(iso) : parseISO(iso);

  return { ...ymd, iso };
}

export function monthLength(kind: CalendarKind, y: number, m: number): number {
  return kind === "jalali"
    ? jalaliMonthLength(y, m)
    : new Date(Date.UTC(y, m, 0)).getUTCDate();
}

export function firstDayOfMonth(
  kind: CalendarKind,
  y: number,
  m: number,
): ISODate {
  return kind === "jalali"
    ? jalaliToGregorian({ y, m, d: 1 })
    : toISO({ y, m, d: 1 });
}

export function shiftMonth(
  y: number,
  m: number,
  delta: number,
): { y: number; m: number } {
  const index = y * 12 + (m - 1) + delta;

  return { y: Math.floor(index / 12), m: floorMod(index, 12) + 1 };
}

export interface MonthCell {
  iso: ISODate;
  day: number;
}

/**
 * Weeks of a month as rows of 7. Cells outside the month are `null`.
 * `weekStart` uses `Date#getDay` numbering (6 = Saturday, 0 = Sunday).
 */
export function monthGrid(
  kind: CalendarKind,
  y: number,
  m: number,
  weekStart: number,
): (MonthCell | null)[][] {
  const first = firstDayOfMonth(kind, y, m);
  const length = monthLength(kind, y, m);
  const offset = floorMod(weekdayOf(first) - weekStart, 7);
  const cells: (MonthCell | null)[] = Array.from({ length: offset }, () => null);

  for (let day = 1; day <= length; day += 1) {
    cells.push({ iso: addDays(first, day - 1), day });
  }

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  const weeks: (MonthCell | null)[][] = [];

  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }

  return weeks;
}

export function weekStartFor(language: Language): number {
  return language === "fa" ? 6 : 1;
}

export function weekdayOrder(weekStart: number): number[] {
  return Array.from({ length: 7 }, (_, i) => (weekStart + i) % 7);
}

// ------------------------------------------------------------------- names

const JALALI_MONTHS = [
  "فروردین",
  "اردیبهشت",
  "خرداد",
  "تیر",
  "مرداد",
  "شهریور",
  "مهر",
  "آبان",
  "آذر",
  "دی",
  "بهمن",
  "اسفند",
];

const GREGORIAN_MONTHS: Record<Language, readonly string[]> = {
  fa: [
    "ژانویه",
    "فوریه",
    "مارس",
    "آوریل",
    "مه",
    "ژوئن",
    "ژوئیه",
    "اوت",
    "سپتامبر",
    "اکتبر",
    "نوامبر",
    "دسامبر",
  ],
  en: [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ],
};

const WEEKDAYS: Record<Language, readonly string[]> = {
  fa: ["یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه", "شنبه"],
  en: [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ],
};

const WEEKDAYS_SHORT: Record<Language, readonly string[]> = {
  fa: ["ی", "د", "س", "چ", "پ", "ج", "ش"],
  en: ["S", "M", "T", "W", "T", "F", "S"],
};

export function monthName(
  language: Language,
  kind: CalendarKind,
  m: number,
): string {
  const names = kind === "jalali" ? JALALI_MONTHS : GREGORIAN_MONTHS[language];

  return names[m - 1] ?? "";
}

export function weekdayName(language: Language, weekday: number): string {
  return WEEKDAYS[language][weekday] ?? "";
}

export function weekdayShort(language: Language, weekday: number): string {
  return WEEKDAYS_SHORT[language][weekday] ?? "";
}

function toPersianDigits(text: string): string {
  return text.replace(/\d/g, (digit) => "۰۱۲۳۴۵۶۷۸۹"[Number(digit)] ?? digit);
}

/** "۶ آبان ۱۴۰۵" in Persian, "28 Oct 2026" in English. */
export function formatDate(iso: ISODate, language: Language): string {
  const kind = calendarFor(language);
  const date = toCalendarDate(iso, kind);
  const month = monthName(language, kind, date.m);

  if (language === "fa") {
    return toPersianDigits(`${date.d} ${month} ${date.y}`);
  }

  return `${date.d} ${month.slice(0, 3)} ${date.y}`;
}

/** Numeric form used in spreadsheets: "1405/08/06" or "2026-10-28". */
export function formatDateNumeric(iso: ISODate, language: Language): string {
  if (language === "fa") {
    const j = gregorianToJalali(iso);

    return toPersianDigits(`${j.y}/${pad(j.m)}/${pad(j.d)}`);
  }

  return iso;
}

export function formatMonthTitle(
  y: number,
  m: number,
  language: Language,
  kind: CalendarKind,
): string {
  const name = monthName(language, kind, m);

  return language === "fa" ? toPersianDigits(`${name} ${y}`) : `${name} ${y}`;
}

import { SURAHS } from "@/features/quran/data/surahs";

export const JUZ_COUNT = 30;

/** First verse (surah, ayah) of each juz, in the Madinah Mushaf. */
export const JUZ_STARTS: readonly (readonly [number, number])[] = [
  [1, 1],
  [2, 142],
  [2, 253],
  [3, 93],
  [4, 24],
  [4, 148],
  [5, 82],
  [6, 111],
  [7, 88],
  [8, 41],
  [9, 93],
  [11, 6],
  [12, 53],
  [15, 1],
  [17, 1],
  [18, 75],
  [21, 1],
  [23, 1],
  [25, 21],
  [27, 56],
  [29, 46],
  [33, 31],
  [36, 28],
  [39, 32],
  [41, 47],
  [46, 1],
  [51, 31],
  [58, 1],
  [67, 1],
  [78, 1],
];

const JUZ_ORDINALS: readonly string[] = [
  "الأول",
  "الثاني",
  "الثالث",
  "الرابع",
  "الخامس",
  "السادس",
  "السابع",
  "الثامن",
  "التاسع",
  "العاشر",
  "الحادي عشر",
  "الثاني عشر",
  "الثالث عشر",
  "الرابع عشر",
  "الخامس عشر",
  "السادس عشر",
  "السابع عشر",
  "الثامن عشر",
  "التاسع عشر",
  "العشرون",
  "الحادي والعشرون",
  "الثاني والعشرون",
  "الثالث والعشرون",
  "الرابع والعشرون",
  "الخامس والعشرون",
  "السادس والعشرون",
  "السابع والعشرون",
  "الثامن والعشرون",
  "التاسع والعشرون",
  "الثلاثون",
];

/** Printed running header of a juz, for example "الجزء الأول". */
export function juzTitle(juz: number): string {
  return `الجزء ${JUZ_ORDINALS[juz - 1] ?? ""}`.trim();
}

/** Juz that a Madinah Mushaf page (1-604) belongs to: juz 1 is pages 1-21, then 20 pages each. */
export function juzOfPage(page: number): number {
  return page < 22 ? 1 : Math.min(JUZ_COUNT, Math.floor((page - 2) / 20) + 1);
}

function position(surahId: number, ayah: number): number {
  return surahId * 1000 + ayah;
}

/** Surah ids that have at least one verse inside the given juz (1-30). */
export function surahsInJuz(juz: number): number[] {
  const start = JUZ_STARTS[juz - 1];

  if (!start) {
    return [];
  }

  const next = JUZ_STARTS[juz];
  const from = position(start[0], start[1]);
  const to = next ? position(next[0], next[1]) : Number.POSITIVE_INFINITY;

  return SURAHS.filter((surah) => {
    const first = position(surah.id, 1);
    const last = position(surah.id, surah.verses);

    return last >= from && first < to;
  }).map((surah) => surah.id);
}

/** Juz numbers (1-30) that contain part of the given surah. */
export function juzOfSurah(surahId: number): number[] {
  const result: number[] = [];

  for (let juz = 1; juz <= JUZ_COUNT; juz += 1) {
    if (surahsInJuz(juz).includes(surahId)) {
      result.push(juz);
    }
  }

  return result;
}

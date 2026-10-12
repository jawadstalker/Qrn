import {
  PAGE1_ADVANCES,
  PAGE1_FIRST_CODEPOINT,
  PAGE1_LINES,
  PAGE1_SURAH_ID,
  PAGE1_VERSES,
  MUSHAF_FONT_FAMILY,
  MUSHAF_UNITS_PER_EM,
  type MushafLine,
  type MushafVerse,
} from "@/features/quran/data/mushafPage1";
import {
  PAGE583_ADVANCES,
  PAGE583_CELLS,
  PAGE583_FONT_FAMILY,
  PAGE583_LINES,
  PAGE583_NUMBER,
  PAGE583_SURAH_ID,
  PAGE583_VERSES,
} from "@/features/quran/data/mushafPage583";
import {
  BISMILLAH_ADVANCES,
  BISMILLAH_CODEPOINTS,
  BISMILLAH_FONT_FAMILY,
  PAGE582_ADVANCES,
  PAGE582_CELLS,
  PAGE582_FONT_FAMILY,
  PAGE582_LINES,
  PAGE582_NUMBER,
  PAGE582_SURAH_ID,
  PAGE582_VERSES,
} from "@/features/quran/data/mushafPage582";

export interface MushafFrame {
  runningHeader: string;
  runningTitle: string;
}

export interface MushafSurahHeader {
  title: string;
  order: number;
  versesCount: number;
  /** Omitted when the bismillah is already part of the page text (Al-Fatiha). */
  bismillahFont?: string;
  bismillahCodepoints?: readonly number[];
  bismillahAdvances?: readonly number[];
}

export interface MushafPageData {
  surahId: number;
  pageNumber: number;
  fontFamily: string;
  unitsPerEm: number;
  /** One cell per word / verse marker; a cell may hold several glyph codepoints. */
  cells: readonly (readonly number[])[];
  advances: readonly number[];
  lines: readonly MushafLine[];
  verses: readonly MushafVerse[];
  /** Printed-mushaf frame with running header and page number. */
  frame?: MushafFrame;
  /** Surah title banner and bismillah (only on the page where the surah starts). */
  surahHeader?: MushafSurahHeader;
}

export interface MushafSurah {
  surahId: number;
  pages: readonly MushafPageData[];
  verses: readonly MushafVerse[];
}

const NABA_FRAME: MushafFrame = {
  runningHeader: "الجزء الثلاثون",
  runningTitle: "سُورَةُ النَّبَإِ",
};

const NABA_P582: MushafPageData = {
  surahId: PAGE582_SURAH_ID,
  pageNumber: PAGE582_NUMBER,
  fontFamily: PAGE582_FONT_FAMILY,
  unitsPerEm: MUSHAF_UNITS_PER_EM,
  cells: PAGE582_CELLS,
  advances: PAGE582_ADVANCES,
  lines: PAGE582_LINES,
  verses: PAGE582_VERSES,
  frame: NABA_FRAME,
  surahHeader: {
    title: "سُورَةُ النَّبَإِ",
    order: 78,
    versesCount: 40,
    bismillahFont: BISMILLAH_FONT_FAMILY,
    bismillahCodepoints: BISMILLAH_CODEPOINTS,
    bismillahAdvances: BISMILLAH_ADVANCES,
  },
};

// Continuation of An-Naba (verses 31-40); the next surah on this page is intentionally omitted.
const NABA_P583: MushafPageData = {
  surahId: PAGE583_SURAH_ID,
  pageNumber: PAGE583_NUMBER,
  fontFamily: PAGE583_FONT_FAMILY,
  unitsPerEm: MUSHAF_UNITS_PER_EM,
  cells: PAGE583_CELLS,
  advances: PAGE583_ADVANCES,
  lines: PAGE583_LINES,
  verses: PAGE583_VERSES,
  frame: NABA_FRAME,
};

const FATIHA_PAGE: MushafPageData = {
  surahId: PAGE1_SURAH_ID,
  pageNumber: 1,
  fontFamily: MUSHAF_FONT_FAMILY,
  unitsPerEm: MUSHAF_UNITS_PER_EM,
  cells: PAGE1_ADVANCES.map((_, index) => [PAGE1_FIRST_CODEPOINT + index]),
  advances: PAGE1_ADVANCES,
  lines: PAGE1_LINES,
  verses: PAGE1_VERSES,
  frame: {
    runningHeader: "الجزء الأول",
    runningTitle: "سُورَةُ الْفَاتِحَةِ",
  },
  surahHeader: {
    title: "سُورَةُ الْفَاتِحَةِ",
    order: 1,
    versesCount: 7,
  },
};

function surahOf(pages: readonly MushafPageData[]): MushafSurah {
  return {
    surahId: pages[0]!.surahId,
    pages,
    verses: pages.flatMap((page) => page.verses),
  };
}

/** Listed in real Quran order. */
export const MUSHAF_SURAHS: readonly MushafSurah[] = [
  surahOf([FATIHA_PAGE]),
  surahOf([NABA_P582, NABA_P583]),
];
/** The surah a new user starts with (An-Naba). */
export const DEFAULT_SURAH_ID = PAGE582_SURAH_ID;

export function getMushafSurah(surahId: number): MushafSurah | undefined {
  return MUSHAF_SURAHS.find((surah) => surah.surahId === surahId);
}

export function hasMushafPage(surahId: number): boolean {
  return getMushafSurah(surahId) !== undefined;
}

export function pageForAyah(surah: MushafSurah, ayah: number): MushafPageData {
  return (
    surah.pages.find((page) =>
      page.verses.some((verse) => verse.ayah === ayah),
    ) ?? surah.pages[0]!
  );
}

export function cellText(page: MushafPageData, index: number): string {
  return String.fromCodePoint(...(page.cells[index] ?? [0x20]));
}

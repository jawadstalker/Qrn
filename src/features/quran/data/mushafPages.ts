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
  BISMILLAH_ADVANCES,
  BISMILLAH_CODEPOINTS,
  BISMILLAH_FONT_FAMILY,
  PAGE582_ADVANCES,
  PAGE582_CODEPOINTS,
  PAGE582_FONT_FAMILY,
  PAGE582_LINES,
  PAGE582_NUMBER,
  PAGE582_SURAH_ID,
  PAGE582_VERSES,
} from "@/features/quran/data/mushafPage582";

export interface MushafOrnament {
  title: string;
  order: number;
  versesCount: number;
  runningHeader: string;
  bismillahFont: string;
  bismillahCodepoints: readonly number[];
  bismillahAdvances: readonly number[];
}

export interface MushafPageData {
  surahId: number;
  pageNumber: number;
  fontFamily: string;
  unitsPerEm: number;
  codepoints: readonly number[];
  advances: readonly number[];
  lines: readonly MushafLine[];
  verses: readonly MushafVerse[];
  /** When set, the page is drawn like a printed mushaf page (frame, header, bismillah). */
  ornament?: MushafOrnament;
}

const NABA: MushafPageData = {
  surahId: PAGE582_SURAH_ID,
  pageNumber: PAGE582_NUMBER,
  fontFamily: PAGE582_FONT_FAMILY,
  unitsPerEm: MUSHAF_UNITS_PER_EM,
  codepoints: PAGE582_CODEPOINTS,
  advances: PAGE582_ADVANCES,
  lines: PAGE582_LINES,
  verses: PAGE582_VERSES,
  ornament: {
    title: "سُورَةُ النَّبَإِ",
    order: 78,
    versesCount: 40,
    runningHeader: "الجزء الثلاثون",
    bismillahFont: BISMILLAH_FONT_FAMILY,
    bismillahCodepoints: BISMILLAH_CODEPOINTS,
    bismillahAdvances: BISMILLAH_ADVANCES,
  },
};

const FATIHA: MushafPageData = {
  surahId: PAGE1_SURAH_ID,
  pageNumber: 1,
  fontFamily: MUSHAF_FONT_FAMILY,
  unitsPerEm: MUSHAF_UNITS_PER_EM,
  codepoints: PAGE1_ADVANCES.map((_, index) => PAGE1_FIRST_CODEPOINT + index),
  advances: PAGE1_ADVANCES,
  lines: PAGE1_LINES,
  verses: PAGE1_VERSES,
};

/** The first entry is the surah every new user starts with. */
export const MUSHAF_PAGES: readonly MushafPageData[] = [NABA, FATIHA];
export const DEFAULT_SURAH_ID = NABA.surahId;

export function getMushafPage(surahId: number): MushafPageData | undefined {
  return MUSHAF_PAGES.find((page) => page.surahId === surahId);
}

export function glyphChar(page: MushafPageData, index: number): string {
  return String.fromCodePoint(page.codepoints[index] ?? 0x20);
}

export function hasMushafPage(surahId: number): boolean {
  return getMushafPage(surahId) !== undefined;
}

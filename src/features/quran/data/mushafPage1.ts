export const MUSHAF_FONT_FAMILY = 'QCF_P001';
export const MUSHAF_UNITS_PER_EM = 2048;
export const PAGE1_SURAH_ID = 1;
export const PAGE1_FIRST_CODEPOINT = 0xfb51;

export const PAGE1_ADVANCES: readonly number[] = [
  2845, 1191, 2344, 2881, 1930, 3773, 1255, 2730, 6168, 1932, 3516, 3719, 1925, 2949, 1649, 3487,
  1924, 2135, 2673, 3110, 5660, 1922, 3097, 3685, 4628, 1965, 2947, 2334, 3304, 2773, 1680, 6079,
  3131, 1690, 4372, 1923,
];

export type LineAlignment = 'justify' | 'center';

export interface MushafLine {
  from: number;
  to: number;
  alignment: LineAlignment;
}

export const PAGE1_LINES: readonly MushafLine[] = [
  { from: 0, to: 5, alignment: 'center' },
  { from: 5, to: 11, alignment: 'justify' },
  { from: 11, to: 17, alignment: 'justify' },
  { from: 17, to: 22, alignment: 'justify' },
  { from: 22, to: 27, alignment: 'justify' },
  { from: 27, to: 32, alignment: 'justify' },
  { from: 32, to: 36, alignment: 'center' },
];

export interface MushafVerse {
  ayah: number;
  from: number;
  to: number;
  markerIndex: number;
}

export const PAGE1_VERSES: readonly MushafVerse[] = [
  { ayah: 1, from: 0, to: 5, markerIndex: 4 },
  { ayah: 2, from: 5, to: 10, markerIndex: 9 },
  { ayah: 3, from: 10, to: 13, markerIndex: 12 },
  { ayah: 4, from: 13, to: 17, markerIndex: 16 },
  { ayah: 5, from: 17, to: 22, markerIndex: 21 },
  { ayah: 6, from: 22, to: 26, markerIndex: 25 },
  { ayah: 7, from: 26, to: 36, markerIndex: 35 },
];

export function glyphChar(index: number): string {
  return String.fromCodePoint(PAGE1_FIRST_CODEPOINT + index);
}

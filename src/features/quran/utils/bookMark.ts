/**
 * Flat (2D) version of the 3D splash book, drawn on a 200 x 140 grid. Every measurement comes
 * from the 3D scene (utils/splashScene.ts, 1 world unit = 100 grid units): the covers are 2 x 1.4,
 * the pages 0.97 x 1.34 with a double gold frame, the spine 0.06 wide with two gold bands.
 * The splash lays this exactly over the final 3D frame, so the 3D book can dissolve into it
 * layer by layer without anything jumping.
 */
export const BOOK_W = 200;
export const BOOK_H = 140;
/** Open book width divided by its height. */
export const BOOK_ASPECT = BOOK_W / BOOK_H;

export const BOOK_COLORS = {
  green: "#1F5C42",
  greenDark: "#174A34",
  greenLight: "#2A7557",
  gold: "#D9B864",
  goldDark: "#B8934A",
  cream: "#F7EFD6",
  paperShade: "#E6D19E",
  ink: "#1A1209",
} as const;

export const SPINE = { x: 94, width: 6 } as const;
export const SPINE_BANDS_Y: readonly number[] = [25, 115];
export const LEFT_PAGE = { x: 2.5, y: 1.6, width: 97, height: 136.8 } as const;
export const RIGHT_PAGE = { x: 100.5, y: 1.6, width: 97, height: 136.8 } as const;

/** Frame insets measured from the page edge: [outer line, inner line]. */
export const FRAME_INSET = { outer: 4.4, inner: 6.4 } as const;

export const CARTOUCHE = { x: 14.5, y: 19.5, width: 73.5, height: 12.5, radius: 6.2 } as const;

/** Small deterministic generator, so the "text" is identical on every launch. */
function random(seed: number): () => number {
  let state = seed >>> 0;

  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;

    return state / 4294967296;
  };
}

export interface TextLayout {
  /** One stroke per word, written right to left, line by line (M x y h -length). */
  words: string;
  /** Centers of the small verse-end rings. */
  markers: readonly (readonly [number, number])[];
}

/**
 * Lines of justified "words", like a Mushaf page: each line is filled edge to edge so the block
 * has straight sides, exactly like the 3D pages.
 */
export function pageText(
  from: number,
  to: number,
  top: number,
  bottom: number,
  pitch: number,
  seed: number,
): TextLayout {
  const next = random(seed);
  const lines = Math.max(Math.floor((bottom - top) / pitch) + 1, 1);
  const words: string[] = [];
  const markers: [number, number][] = [];
  const gap = 1.7;

  for (let line = 0; line < lines; line += 1) {
    const y = top + line * pitch;
    const lengths: number[] = [];
    let used = 0;

    while (used < to - from - 5) {
      const length = 3.5 + next() * 7.5;

      lengths.push(length);
      used += length + gap;
    }

    // Stretch or squeeze the words so the line ends exactly at `to`.
    const scale = (to - from - gap * (lengths.length - 1)) /
      lengths.reduce((sum, length) => sum + length, 0);
    // Word positions from the left; they are written right to left, like Arabic text.
    const placed: [number, number][] = [];
    let x = from;

    lengths.forEach((length, index) => {
      const size = length * scale;

      placed.push([x, size]);

      if (index < lengths.length - 1 && next() < 0.09) {
        markers.push([x + size + gap / 2, y]);
      }

      x += size + gap;
    });

    placed.reverse().forEach(([start, size]) => {
      words.push(`M${(start + size).toFixed(2)} ${y.toFixed(2)}h${(-size).toFixed(2)}`);
    });
  }

  return { words: words.join(""), markers };
}

/** Left page: a title cartouche, then lines. Right page: lines from the top. */
export const LEFT_TEXT = pageText(9.5, 90.5, 38.5, 106.5, 6.75, 11);
export const RIGHT_TEXT = pageText(107, 191.5, 24.5, 99, 6.75, 29);

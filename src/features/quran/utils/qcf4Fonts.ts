import { useEffect, useState } from "react";
import * as Font from "expo-font";

// The QCF v4 page fonts used by Juz 30 (pages 582-604) of the Madinah Mushaf (Uthman Taha). The .ttf files are created by
// `scripts/prepare-qcf4-fonts.mjs` (runs after `npm install`). They are large, so each font is
// loaded the first time a page that needs it is shown, not at startup.
const QCF4_FONT_FILES: Readonly<Record<string, number>> = {
  QCF4_Hafs_45: require("../../../../assets/fonts/qcf4/QCF4_Hafs_45.ttf"),
  QCF4_Hafs_46: require("../../../../assets/fonts/qcf4/QCF4_Hafs_46.ttf"),
  QCF4_Hafs_47: require("../../../../assets/fonts/qcf4/QCF4_Hafs_47.ttf"),
};

const pending = new Map<string, Promise<void>>();

/** True when the font needs no loading (bundled at startup) or is already loaded. */
export function isMushafFontReady(family: string): boolean {
  return !(family in QCF4_FONT_FILES) || Font.isLoaded(family);
}

export function loadMushafFont(family: string): Promise<void> {
  const source = QCF4_FONT_FILES[family];

  if (source === undefined || Font.isLoaded(family)) {
    return Promise.resolve();
  }

  const running = pending.get(family);

  if (running) {
    return running;
  }

  const task = Font.loadAsync({ [family]: source }).finally(() => {
    pending.delete(family);
  });

  pending.set(family, task);

  return task;
}

/**
 * Loads the page font on demand. Returns true once glyphs can be drawn.
 *
 * Readiness is read from expo-font on every render instead of being copied into state. A state
 * copy is one render late when the page changes to a page with another font, and for that one
 * render the words would be laid out with a font that is not there yet.
 */
export function useMushafFont(family: string): boolean {
  const [, refresh] = useState(0);
  const ready = isMushafFontReady(family);

  useEffect(() => {
    if (ready) {
      return undefined;
    }

    let active = true;

    loadMushafFont(family)
      .then(() => {
        if (active) {
          refresh((count) => count + 1);
        }
      })
      .catch((error: unknown) => {
        console.warn("[QURAN] Could not load mushaf font", family, error);
      });

    return () => {
      active = false;
    };
  }, [family, ready]);

  return ready;
}

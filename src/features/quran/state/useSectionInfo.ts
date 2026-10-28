import { useCallback, useMemo } from "react";
import { getSurah } from "@/features/quran/data/surahs";
import { hasMushafPage } from "@/features/quran/data/mushafPages";
import { useQuranProgress } from "@/features/quran/state/QuranProgressContext";
import { repsFor, useSections } from "@/features/quran/state/sectionStore";
import {
  classifyVerses,
  computeSections,
  type SectionInfo,
  type StatusResult,
  type VerseSignal,
} from "@/features/quran/utils/sections";

export interface SectionData {
  surahId: number;
  totalVerses: number;
  sectionSize: number;
  sections: SectionInfo[];
  /** Status of a single verse. */
  verseStatus: (ayah: number) => StatusResult;
}

/** Sections (with colored status) of any surah, from learned verses and listening practice. */
export function useSectionData(surahId?: number): SectionData {
  const { surahId: activeSurah, recordOf } = useQuranProgress();
  const store = useSections();
  const id = surahId ?? activeSurah;
  const totalVerses = getSurah(id)?.verses ?? 0;
  const trackLearned = hasMushafPage(id);

  const signalFor = useCallback(
    (ayah: number): VerseSignal => {
      const record = recordOf(id, ayah);

      return {
        learned: Boolean(record),
        reviews: record?.reviews ?? 0,
        lastReviewedAt: record?.lastReviewedAt ?? 0,
        audioReps: repsFor(store, id, ayah).reps,
      };
    },
    [id, recordOf, store],
  );

  const sections = useMemo(
    () =>
      computeSections({
        totalVerses,
        size: store.sectionSize,
        trackLearned,
        signalFor,
      }),
    [totalVerses, store.sectionSize, trackLearned, signalFor],
  );

  const verseStatus = useCallback(
    (ayah: number) => classifyVerses([signalFor(ayah)], Date.now(), trackLearned),
    [signalFor, trackLearned],
  );

  return {
    surahId: id,
    totalVerses,
    sectionSize: store.sectionSize,
    sections,
    verseStatus,
  };
}

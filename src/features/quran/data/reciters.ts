import { SURAHS } from "@/features/quran/data/surahs";

export interface Reciter {
  id: string;
  /** Name shown in Persian. */
  fa: string;
  /** Name shown in English. */
  en: string;
  /** Builds the full-surah MP3 URL (streamed, nothing is bundled in the app). */
  surahUrl: (surahId: number) => string;
}

function pad3(value: number): string {
  return String(value).padStart(3, "0");
}

/**
 * Whole-surah recitations are streamed from the public mp3quran.net servers.
 * To change a reciter or move to your own hosting, edit only this list.
 */
export const RECITERS: readonly Reciter[] = [
  {
    id: "alafasy",
    fa: "مشاری راشد العفاسی",
    en: "Mishary Alafasy",
    surahUrl: (id) => `https://server8.mp3quran.net/afs/${pad3(id)}.mp3`,
  },
  {
    id: "husary",
    fa: "محمود خلیل الحصری",
    en: "Mahmoud Khalil Al-Husary",
    surahUrl: (id) => `https://server13.mp3quran.net/husr/${pad3(id)}.mp3`,
  },
  {
    id: "basit",
    fa: "عبدالباسط عبدالصمد (مجوّد)",
    en: "Abdul Basit (Mujawwad)",
    surahUrl: (id) =>
      `https://server7.mp3quran.net/basit/Almusshaf-Al-Mojawwad/${pad3(id)}.mp3`,
  },
  {
    id: "minshawi",
    fa: "محمد صدیق المنشاوی",
    en: "Mohamed Siddiq Al-Minshawi",
    surahUrl: (id) => `https://server10.mp3quran.net/minsh/${pad3(id)}.mp3`,
  },
  {
    id: "maher",
    fa: "ماهر المعیقلی",
    en: "Maher Al-Muaiqly",
    surahUrl: (id) => `https://server12.mp3quran.net/maher/${pad3(id)}.mp3`,
  },
];

export const DEFAULT_RECITER_ID = RECITERS[0]!.id;

export function getReciter(id: string): Reciter {
  return RECITERS.find((reciter) => reciter.id === id) ?? RECITERS[0]!;
}

/** Number of verses in all surahs before this one (to get the global verse number). */
function versesBefore(surahId: number): number {
  return SURAHS.filter((surah) => surah.id < surahId).reduce(
    (sum, surah) => sum + surah.verses,
    0,
  );
}

/**
 * Single-verse recitation (Mishary Alafasy) from the Islamic Network CDN.
 * The file name is the verse's global number (1 to 6236); in this numbering
 * the Bismillah of Al-Fatihah is verse 1, matching the app's own numbering.
 */
export function ayahAudioUrl(surahId: number, ayah: number): string {
  return `https://cdn.islamic.app/quran/audio/ar.alafasy/${versesBefore(surahId) + ayah}.mp3`;
}

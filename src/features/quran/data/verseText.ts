// Generated from the `quran-json` npm package (v3.1.2) by scripts/build-mushaf-data.py.
// Arabic: Uthmani text from The Noble Qur'an Encyclopedia (quranenc.com).
// English: Saheeh International translation via tanzil.net.
// License of the source data: CC BY-SA 4.0 (https://github.com/risan/quran-json).
// Have a qualified person review everything related to the Quran before release.

import verseTextAll from "@/features/quran/data/verseTextAll.json";

export interface VerseText {
  /** Arabic verse text (Uthmani script, plain Unicode; render with the UthmanicHafs font). */
  ar: string;
  /** English translation. */
  en: string;
}

export interface DailyAyah extends VerseText {
  surahId: number;
  ayah: number;
  /** Short Persian paraphrase of the meaning (not an official translation). */
  fa: string;
}

export const BASMALA = "بِسۡمِ ٱللَّهِ ٱلرَّحۡمَٰنِ ٱلرَّحِيمِ";

/** Verse texts of the Juz 30 surahs (78-114), indexed by surah id then ayah - 1 (generated into verseTextAll.json). */
export const VERSE_TEXT = verseTextAll as unknown as Readonly<
  Record<number, readonly VerseText[]>
>;

export function verseText(
  surahId: number,
  ayah: number,
): VerseText | undefined {
  return VERSE_TEXT[surahId]?.[ayah - 1];
}

export function hasVerseText(surahId: number): boolean {
  return VERSE_TEXT[surahId] !== undefined;
}

/** Short, well-known verses (all juz) on the garden screen. */
const ALL_DAILY_AYAHS: readonly DailyAyah[] = [
  {
    surahId: 94,
    ayah: 5,
    ar: "فَإِنَّ مَعَ ٱلۡعُسۡرِ يُسۡرًا",
    en: "For indeed, with hardship [will be] ease",
    fa: "به‌راستی با هر سختی، آسانی‌ای است.",
  },
  {
    surahId: 94,
    ayah: 6,
    ar: "إِنَّ مَعَ ٱلۡعُسۡرِ يُسۡرٗا",
    en: "Indeed, with hardship [will be] ease",
    fa: "آری، با هر سختی، آسانی‌ای است.",
  },
  {
    surahId: 13,
    ayah: 28,
    ar: "ٱلَّذِينَ ءَامَنُواْ وَتَطۡمَئِنُّ قُلُوبُهُم بِذِكۡرِ ٱللَّهِۗ أَلَا بِذِكۡرِ ٱللَّهِ تَطۡمَئِنُّ ٱلۡقُلُوبُ",
    en: "Those who have believed and whose hearts are assured by the remembrance of Allah. Unquestionably, by the remembrance of Allah hearts are assured",
    fa: "همان کسانی که ایمان آورده‌اند و دل‌هایشان به یاد خدا آرام می‌گیرد؛ آگاه باشید که تنها با یاد خدا دل‌ها آرامش می‌یابد.",
  },
  {
    surahId: 2,
    ayah: 152,
    ar: "فَٱذۡكُرُونِيٓ أَذۡكُرۡكُمۡ وَٱشۡكُرُواْ لِي وَلَا تَكۡفُرُونِ",
    en: "So remember Me; I will remember you. And be grateful to Me and do not deny Me",
    fa: "پس مرا یاد کنید تا شما را یاد کنم، و سپاسگزارم باشید و ناسپاسی نکنید.",
  },
  {
    surahId: 20,
    ayah: 114,
    ar: "فَتَعَٰلَى ٱللَّهُ ٱلۡمَلِكُ ٱلۡحَقُّۗ وَلَا تَعۡجَلۡ بِٱلۡقُرۡءَانِ مِن قَبۡلِ أَن يُقۡضَىٰٓ إِلَيۡكَ وَحۡيُهُۥۖ وَقُل رَّبِّ زِدۡنِي عِلۡمٗا",
    en: 'So high [above all] is Allah, the Sovereign, the Truth. And, [O Muhammad], do not hasten with [recitation of] the Qur\'an before its revelation is completed to you, and say, "My Lord, increase me in knowledge"',
    fa: "بلندمرتبه است خدا، فرمانروای حق. و پیش از آنکه وحی‌اش بر تو تمام شود، در خواندن قرآن شتاب مکن و بگو: پروردگارا، دانشم را بیفزا.",
  },
  {
    surahId: 3,
    ayah: 139,
    ar: "وَلَا تَهِنُواْ وَلَا تَحۡزَنُواْ وَأَنتُمُ ٱلۡأَعۡلَوۡنَ إِن كُنتُم مُّؤۡمِنِينَ",
    en: "So do not weaken and do not grieve, and you will be superior if you are [true] believers",
    fa: "سست نشوید و اندوهگین مباشید؛ اگر مؤمن باشید، شما برترید.",
  },
  {
    surahId: 93,
    ayah: 3,
    ar: "مَا وَدَّعَكَ رَبُّكَ وَمَا قَلَىٰ",
    en: "Your Lord has not taken leave of you, [O Muhammad], nor has He detested [you]",
    fa: "پروردگارت تو را وانگذاشته و از تو بیزار نشده است.",
  },
  {
    surahId: 112,
    ayah: 1,
    ar: "قُلۡ هُوَ ٱللَّهُ أَحَدٌ",
    en: 'Say, "He is Allah, [who is] One"',
    fa: "بگو: او خدایی یکتاست.",
  },
  {
    surahId: 108,
    ayah: 1,
    ar: "إِنَّآ أَعۡطَيۡنَٰكَ ٱلۡكَوۡثَرَ",
    en: "Indeed, We have granted you, [O Muhammad], al-Kawthar",
    fa: "ما به تو کوثر (خیر فراوان) عطا کردیم.",
  },
  {
    surahId: 103,
    ayah: 3,
    ar: "إِلَّا ٱلَّذِينَ ءَامَنُواْ وَعَمِلُواْ ٱلصَّـٰلِحَٰتِ وَتَوَاصَوۡاْ بِٱلۡحَقِّ وَتَوَاصَوۡاْ بِٱلصَّبۡرِ",
    en: "Except for those who have believed and done righteous deeds and advised each other to truth and advised each other to patience",
    fa: "مگر کسانی که ایمان آوردند و کارهای شایسته کردند و یکدیگر را به حق و به شکیبایی سفارش کردند.",
  },
  {
    surahId: 55,
    ayah: 13,
    ar: "فَبِأَيِّ ءَالَآءِ رَبِّكُمَا تُكَذِّبَانِ",
    en: "So which of the favors of your Lord would you deny",
    fa: "پس کدام‌یک از نعمت‌های پروردگارتان را انکار می‌کنید؟",
  },
  {
    surahId: 16,
    ayah: 128,
    ar: "إِنَّ ٱللَّهَ مَعَ ٱلَّذِينَ ٱتَّقَواْ وَّٱلَّذِينَ هُم مُّحۡسِنُونَ",
    en: "Indeed, Allah is with those who fear Him and those who are doers of good",
    fa: "همانا خدا با کسانی است که پرهیزگاری پیشه کرده‌اند و با نیکوکاران.",
  },
  {
    surahId: 2,
    ayah: 153,
    ar: "يَـٰٓأَيُّهَا ٱلَّذِينَ ءَامَنُواْ ٱسۡتَعِينُواْ بِٱلصَّبۡرِ وَٱلصَّلَوٰةِۚ إِنَّ ٱللَّهَ مَعَ ٱلصَّـٰبِرِينَ",
    en: "O you who have believed, seek help through patience and prayer. Indeed, Allah is with the patient",
    fa: "ای کسانی که ایمان آورده‌اید، از شکیبایی و نماز یاری بجویید؛ همانا خدا با شکیبایان است.",
  },
  {
    surahId: 20,
    ayah: 25,
    ar: "قَالَ رَبِّ ٱشۡرَحۡ لِي صَدۡرِي",
    en: '[Moses] said, "My Lord, expand for me my breast [with assurance]"',
    fa: "موسی گفت: پروردگارا، سینه‌ام را گشاده گردان.",
  },
  {
    surahId: 2,
    ayah: 201,
    ar: "وَمِنۡهُم مَّن يَقُولُ رَبَّنَآ ءَاتِنَا فِي ٱلدُّنۡيَا حَسَنَةٗ وَفِي ٱلۡأٓخِرَةِ حَسَنَةٗ وَقِنَا عَذَابَ ٱلنَّارِ",
    en: 'But among them is he who says, "Our Lord, give us in this world [that which is] good and in the Hereafter [that which is] good and protect us from the punishment of the Fire"',
    fa: "و از آنان کسی است که می‌گوید: پروردگارا، به ما در دنیا نیکی عطا کن و در آخرت نیکی، و ما را از عذاب آتش نگاه دار.",
  },
];

/** The app covers Juz 30 only, so only its verses are offered as the daily ayah. */
export const DAILY_AYAHS: readonly DailyAyah[] = ALL_DAILY_AYAHS.filter(
  (ayah) => ayah.surahId >= 78,
);

/** Stable pick for a calendar day, so the verse only changes at midnight. */
export function dailyAyahFor(date: Date): DailyAyah {
  const start = new Date(date.getFullYear(), 0, 0);
  const day = Math.floor((date.getTime() - start.getTime()) / 86400000);

  return DAILY_AYAHS[day % DAILY_AYAHS.length]!;
}

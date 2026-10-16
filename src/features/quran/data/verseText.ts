// Generated from the `quran-json` npm package (v3.1.2).
// Arabic: Uthmani text from The Noble Qur'an Encyclopedia (quranenc.com).
// English: Saheeh International translation via tanzil.net.
// License of the source data: CC BY-SA 4.0 (https://github.com/risan/quran-json).
// Have a qualified person review everything related to the Quran before release.

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

/** Verse texts for the surahs that can be memorized, indexed by surah id then ayah - 1. */
export const VERSE_TEXT: Readonly<Record<number, readonly VerseText[]>> = {
  1: [
    { ar: "بِسۡمِ ٱللَّهِ ٱلرَّحۡمَٰنِ ٱلرَّحِيمِ", en: "In the name of Allah, the Entirely Merciful, the Especially Merciful" },
    { ar: "ٱلۡحَمۡدُ لِلَّهِ رَبِّ ٱلۡعَٰلَمِينَ", en: "[All] praise is [due] to Allah, Lord of the worlds" },
    { ar: "ٱلرَّحۡمَٰنِ ٱلرَّحِيمِ", en: "The Entirely Merciful, the Especially Merciful" },
    { ar: "مَٰلِكِ يَوۡمِ ٱلدِّينِ", en: "Sovereign of the Day of Recompense" },
    { ar: "إِيَّاكَ نَعۡبُدُ وَإِيَّاكَ نَسۡتَعِينُ", en: "It is You we worship and You we ask for help" },
    { ar: "ٱهۡدِنَا ٱلصِّرَٰطَ ٱلۡمُسۡتَقِيمَ", en: "Guide us to the straight path" },
    { ar: "صِرَٰطَ ٱلَّذِينَ أَنۡعَمۡتَ عَلَيۡهِمۡ غَيۡرِ ٱلۡمَغۡضُوبِ عَلَيۡهِمۡ وَلَا ٱلضَّآلِّينَ", en: "The path of those upon whom You have bestowed favor, not of those who have evoked [Your] anger or of those who are astray" },
  ],
  78: [
    { ar: "عَمَّ يَتَسَآءَلُونَ", en: "About what are they asking one another" },
    { ar: "عَنِ ٱلنَّبَإِ ٱلۡعَظِيمِ", en: "About the great news" },
    { ar: "ٱلَّذِي هُمۡ فِيهِ مُخۡتَلِفُونَ", en: "That over which they are in disagreement" },
    { ar: "كَلَّا سَيَعۡلَمُونَ", en: "No! They are going to know" },
    { ar: "ثُمَّ كَلَّا سَيَعۡلَمُونَ", en: "Then, no! They are going to know" },
    { ar: "أَلَمۡ نَجۡعَلِ ٱلۡأَرۡضَ مِهَٰدٗا", en: "Have We not made the earth a resting place" },
    { ar: "وَٱلۡجِبَالَ أَوۡتَادٗا", en: "And the mountains as stakes" },
    { ar: "وَخَلَقۡنَٰكُمۡ أَزۡوَٰجٗا", en: "And We created you in pairs" },
    { ar: "وَجَعَلۡنَا نَوۡمَكُمۡ سُبَاتٗا", en: "And made your sleep [a means for] rest" },
    { ar: "وَجَعَلۡنَا ٱلَّيۡلَ لِبَاسٗا", en: "And made the night as clothing" },
    { ar: "وَجَعَلۡنَا ٱلنَّهَارَ مَعَاشٗا", en: "And made the day for livelihood" },
    { ar: "وَبَنَيۡنَا فَوۡقَكُمۡ سَبۡعٗا شِدَادٗا", en: "And constructed above you seven strong [heavens]" },
    { ar: "وَجَعَلۡنَا سِرَاجٗا وَهَّاجٗا", en: "And made [therein] a burning lamp" },
    { ar: "وَأَنزَلۡنَا مِنَ ٱلۡمُعۡصِرَٰتِ مَآءٗ ثَجَّاجٗا", en: "And sent down, from the rain clouds, pouring water" },
    { ar: "لِّنُخۡرِجَ بِهِۦ حَبّٗا وَنَبَاتٗا", en: "That We may bring forth thereby grain and vegetation" },
    { ar: "وَجَنَّـٰتٍ أَلۡفَافًا", en: "And gardens of entwined growth" },
    { ar: "إِنَّ يَوۡمَ ٱلۡفَصۡلِ كَانَ مِيقَٰتٗا", en: "Indeed, the Day of Judgement is an appointed time" },
    { ar: "يَوۡمَ يُنفَخُ فِي ٱلصُّورِ فَتَأۡتُونَ أَفۡوَاجٗا", en: "The Day the Horn is blown and you will come forth in multitudes" },
    { ar: "وَفُتِحَتِ ٱلسَّمَآءُ فَكَانَتۡ أَبۡوَٰبٗا", en: "And the heaven is opened and will become gateways" },
    { ar: "وَسُيِّرَتِ ٱلۡجِبَالُ فَكَانَتۡ سَرَابًا", en: "And the mountains are removed and will be [but] a mirage" },
    { ar: "إِنَّ جَهَنَّمَ كَانَتۡ مِرۡصَادٗا", en: "Indeed, Hell has been lying in wait" },
    { ar: "لِّلطَّـٰغِينَ مَـَٔابٗا", en: "For the transgressors, a place of return" },
    { ar: "لَّـٰبِثِينَ فِيهَآ أَحۡقَابٗا", en: "In which they will remain for ages [unending]" },
    { ar: "لَّا يَذُوقُونَ فِيهَا بَرۡدٗا وَلَا شَرَابًا", en: "They will not taste therein [any] coolness or drink" },
    { ar: "إِلَّا حَمِيمٗا وَغَسَّاقٗا", en: "Except scalding water and [foul] purulence" },
    { ar: "جَزَآءٗ وِفَاقًا", en: "An appropriate recompense" },
    { ar: "إِنَّهُمۡ كَانُواْ لَا يَرۡجُونَ حِسَابٗا", en: "Indeed, they were not expecting an account" },
    { ar: "وَكَذَّبُواْ بِـَٔايَٰتِنَا كِذَّابٗا", en: "And denied Our verses with [emphatic] denial" },
    { ar: "وَكُلَّ شَيۡءٍ أَحۡصَيۡنَٰهُ كِتَٰبٗا", en: "But all things We have enumerated in writing" },
    { ar: "فَذُوقُواْ فَلَن نَّزِيدَكُمۡ إِلَّا عَذَابًا", en: "So taste [the penalty], and never will We increase you except in torment" },
    { ar: "إِنَّ لِلۡمُتَّقِينَ مَفَازًا", en: "Indeed, for the righteous is attainment" },
    { ar: "حَدَآئِقَ وَأَعۡنَٰبٗا", en: "Gardens and grapevines" },
    { ar: "وَكَوَاعِبَ أَتۡرَابٗا", en: "And full-breasted [companions] of equal age" },
    { ar: "وَكَأۡسٗا دِهَاقٗا", en: "And a full cup" },
    { ar: "لَّا يَسۡمَعُونَ فِيهَا لَغۡوٗا وَلَا كِذَّـٰبٗا", en: "No ill speech will they hear therein or any falsehood" },
    { ar: "جَزَآءٗ مِّن رَّبِّكَ عَطَآءً حِسَابٗا", en: "[As] reward from your Lord, [a generous] gift [made due by] account" },
    { ar: "رَّبِّ ٱلسَّمَٰوَٰتِ وَٱلۡأَرۡضِ وَمَا بَيۡنَهُمَا ٱلرَّحۡمَٰنِۖ لَا يَمۡلِكُونَ مِنۡهُ خِطَابٗا", en: "[From] the Lord of the heavens and the earth and whatever is between them, the Most Merciful. They possess not from Him [authority for] speech" },
    { ar: "يَوۡمَ يَقُومُ ٱلرُّوحُ وَٱلۡمَلَـٰٓئِكَةُ صَفّٗاۖ لَّا يَتَكَلَّمُونَ إِلَّا مَنۡ أَذِنَ لَهُ ٱلرَّحۡمَٰنُ وَقَالَ صَوَابٗا", en: "The Day that the Spirit and the angels will stand in rows, they will not speak except for one whom the Most Merciful permits, and he will say what is correct" },
    { ar: "ذَٰلِكَ ٱلۡيَوۡمُ ٱلۡحَقُّۖ فَمَن شَآءَ ٱتَّخَذَ إِلَىٰ رَبِّهِۦ مَـَٔابًا", en: "That is the True Day; so he who wills may take to his Lord a [way of] return" },
    { ar: "إِنَّآ أَنذَرۡنَٰكُمۡ عَذَابٗا قَرِيبٗا يَوۡمَ يَنظُرُ ٱلۡمَرۡءُ مَا قَدَّمَتۡ يَدَاهُ وَيَقُولُ ٱلۡكَافِرُ يَٰلَيۡتَنِي كُنتُ تُرَٰبَۢا", en: "Indeed, We have warned you of a near punishment on the Day when a man will observe what his hands have put forth and the disbeliever will say, \"Oh, I wish that I were dust\"" },
  ],
};

export function verseText(surahId: number, ayah: number): VerseText | undefined {
  return VERSE_TEXT[surahId]?.[ayah - 1];
}

export function hasVerseText(surahId: number): boolean {
  return VERSE_TEXT[surahId] !== undefined;
}

/** Short, well-known verses shown one per day on the garden screen. */
export const DAILY_AYAHS: readonly DailyAyah[] = [
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
    en: "So high [above all] is Allah, the Sovereign, the Truth. And, [O Muhammad], do not hasten with [recitation of] the Qur'an before its revelation is completed to you, and say, \"My Lord, increase me in knowledge\"",
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
    en: "Say, \"He is Allah, [who is] One\"",
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
    en: "[Moses] said, \"My Lord, expand for me my breast [with assurance]\"",
    fa: "موسی گفت: پروردگارا، سینه‌ام را گشاده گردان.",
  },
  {
    surahId: 2,
    ayah: 201,
    ar: "وَمِنۡهُم مَّن يَقُولُ رَبَّنَآ ءَاتِنَا فِي ٱلدُّنۡيَا حَسَنَةٗ وَفِي ٱلۡأٓخِرَةِ حَسَنَةٗ وَقِنَا عَذَابَ ٱلنَّارِ",
    en: "But among them is he who says, \"Our Lord, give us in this world [that which is] good and in the Hereafter [that which is] good and protect us from the punishment of the Fire\"",
    fa: "و از آنان کسی است که می‌گوید: پروردگارا، به ما در دنیا نیکی عطا کن و در آخرت نیکی، و ما را از عذاب آتش نگاه دار.",
  },
];

/** Stable pick for a calendar day, so the verse only changes at midnight. */
export function dailyAyahFor(date: Date): DailyAyah {
  const start = new Date(date.getFullYear(), 0, 0);
  const day = Math.floor((date.getTime() - start.getTime()) / 86400000);

  return DAILY_AYAHS[day % DAILY_AYAHS.length]!;
}

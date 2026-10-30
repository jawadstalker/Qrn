import { VERSE_TEXT } from "@/features/quran/data/verseText";
import { JUZ30_SURAHS, type SurahInfo } from "@/features/quran/data/surahs";
import { JUZ30_CONCEPT_QUESTIONS } from "@/features/quran/data/juz30/conceptBank";
import type { Exam, ExamQuestion } from "@/features/quran/data/exams";

/**
 * Two exams for each Juz 30 surah (79-114; An-Naba keeps its hand-written exams):
 *  - memorization exam, built from the verse text itself (opening, verse count, ending, order);
 *  - tafsir exam, built from the meaning questions in conceptBank.ts.
 * Everything is deterministic (no Math.random) so an exam looks the same every time it is opened.
 */

const FIRST_GENERATED_SURAH = 79;
const DIGITS = "۰۱۲۳۴۵۶۷۸۹";

function persianNumber(value: number): string {
  return String(value).replace(/\d/g, (digit) => DIGITS[Number(digit)]!);
}

/** Puts the correct option at a rotating position so answers are not always in the same slot. */
function place(
  correct: string,
  wrong: readonly string[],
  seed: number,
): { options: string[]; answer: number } {
  const options = wrong.slice(0, 3);
  const answer = seed % 4;

  options.splice(answer, 0, correct);

  return { options, answer };
}

function uniqueWrong(
  correct: string,
  candidates: readonly string[],
  count = 3,
): string[] {
  const result: string[] = [];

  for (const candidate of candidates) {
    if (candidate !== correct && !result.includes(candidate)) {
      result.push(candidate);
    }

    if (result.length === count) {
      break;
    }
  }

  return result;
}

function versesOf(surahId: number): readonly string[] {
  return (VERSE_TEXT[surahId] ?? []).map((verse) => verse.ar);
}

/** Verses of other Juz 30 surahs, picked at fixed distances so the options never change. */
function fromOthers(
  surah: SurahInfo,
  pick: (verses: readonly string[]) => string | undefined,
): string[] {
  const position = JUZ30_SURAHS.findIndex((item) => item.id === surah.id);
  const total = JUZ30_SURAHS.length;

  return [1, 5, 11, 17, 23]
    .map((step) => JUZ30_SURAHS[(position + step) % total]!)
    .filter((item) => item.id !== surah.id)
    .map((item) => pick(versesOf(item.id)))
    .filter((text): text is string => typeof text === "string");
}

function memorizeQuestions(surah: SurahInfo): ExamQuestion[] {
  const verses = versesOf(surah.id);

  if (verses.length < 3) {
    return [];
  }

  const name = surah.name;
  const questions: ExamQuestion[] = [];
  const add = (
    id: string,
    prompt: string,
    correct: string,
    wrong: readonly string[],
    extra: { arabic?: string; arabicOptions?: boolean } = {},
  ) => {
    const clean = uniqueWrong(correct, wrong);

    if (clean.length < 3) {
      return;
    }

    const { options, answer } = place(
      correct,
      clean,
      surah.id + questions.length,
    );

    questions.push({
      id: `s${surah.id}-m-${id}`,
      prompt,
      options,
      answer,
      ...extra,
    });
  };

  add(
    "start",
    `سورهٔ ${name} با کدام آیه آغاز می‌شود؟`,
    verses[0]!,
    fromOthers(surah, (list) => list[0]),
    { arabicOptions: true },
  );

  const count = verses.length;
  const counts = [count - 2, count - 1, count + 1, count + 2, count + 3].filter(
    (value) => value >= 1,
  );

  add(
    "count",
    `سورهٔ ${name} چند آیه دارد؟`,
    `${persianNumber(count)} آیه`,
    counts.map((value) => `${persianNumber(value)} آیه`),
  );

  add(
    "second",
    `آیهٔ دوم سورهٔ ${name} کدام است؟`,
    verses[1]!,
    [
      ...verses.filter((_, index) => index !== 1),
      ...fromOthers(surah, (list) => list[1]),
    ],
    { arabicOptions: true },
  );

  add(
    "last",
    `آخرین آیهٔ سورهٔ ${name} کدام است؟`,
    verses[count - 1]!,
    [
      ...verses.filter((_, index) => index !== count - 1),
      ...fromOthers(surah, (list) => list[list.length - 1]),
    ],
    { arabicOptions: true },
  );

  if (count >= 5) {
    const index = Math.floor(count / 2);

    add(
      "order",
      "کدام آیه بلافاصله بعد از این آیه می‌آید؟",
      verses[index]!,
      verses.filter((_, position) => position !== index),
      { arabic: verses[index - 1]!, arabicOptions: true },
    );
  }

  return questions;
}

function tafsirQuestions(surahId: number): ExamQuestion[] {
  return JUZ30_CONCEPT_QUESTIONS.filter(
    (item) => item.surahId === surahId,
  ).map((item, index) => {
    const { options, answer } = place(
      item.correct.fa,
      item.wrong.map((wrong) => wrong.fa),
      surahId + index + 1,
    );

    return { id: `s${surahId}-t-${item.id}`, prompt: item.prompt.fa, options, answer };
  });
}

export const JUZ30_EXAMS: readonly Exam[] = JUZ30_SURAHS.filter(
  (surah) => surah.id >= FIRST_GENERATED_SURAH,
).flatMap((surah): Exam[] => {
  const result: Exam[] = [];
  const memorize = memorizeQuestions(surah);
  const tafsir = tafsirQuestions(surah.id);

  if (memorize.length > 0) {
    result.push({
      id: `s${surah.id}-memorize`,
      surahId: surah.id,
      arabicName: surah.name,
      title: {
        fa: `آزمون حفظ سورهٔ ${surah.name}`,
        en: `${surah.transliteration} memorization quiz`,
      },
      subtitle: {
        fa: "آغاز سوره، تعداد و ترتیب آیه‌ها",
        en: "Opening, verse count and verse order",
      },
      questions: memorize,
    });
  }

  if (tafsir.length > 0) {
    result.push({
      id: `s${surah.id}-tafsir`,
      surahId: surah.id,
      arabicName: surah.name,
      title: {
        fa: `آزمون مفاهیم سورهٔ ${surah.name}`,
        en: `${surah.transliteration} meaning quiz`,
      },
      subtitle: {
        fa: "معنا و پیام آیه‌ها",
        en: "Meaning and message of the verses",
      },
      questions: tafsir,
    });
  }

  return result;
});

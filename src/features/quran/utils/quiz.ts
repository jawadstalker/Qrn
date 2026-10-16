import { conceptQuestionsFor } from "@/features/quran/data/quizConcepts";
import { VERSE_TEXT } from "@/features/quran/data/verseText";
import type { Language } from "@/core/types/index";
import { formatNumber } from "@/core/i18n/format";
import { fill } from "@/features/quran/utils/fill";

export type QuizKind = "fill" | "next" | "number" | "concept";

export interface QuizOption {
  id: string;
  text: string;
  /** Arabic options are drawn in the Quran font, right to left. */
  arabic: boolean;
}

export interface QuizQuestion {
  id: string;
  kind: QuizKind;
  /** Instruction line (localized). */
  prompt: string;
  /** Arabic text shown under the instruction (verse with a blank, or the verse to continue). */
  arabicPrompt?: string;
  options: QuizOption[];
  correctId: string;
  /** Shown after answering. */
  explanation: string;
  /** Verse to send the learner back to when the answer was wrong. */
  ayah?: number;
  /** Full Arabic verse revealed after answering. */
  revealVerse?: string;
}

export const QUIZ_LENGTH = 8;
const BLANK = "_______";
const OPTION_COUNT = 4;

type Translate = Record<string, string>;

export function shuffle<T>(items: readonly T[]): T[] {
  const copy = items.slice();

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    const held = copy[index]!;

    copy[index] = copy[swap]!;
    copy[swap] = held;
  }

  return copy;
}

function pickOthers<T>(pool: readonly T[], count: number): T[] {
  return shuffle(pool).slice(0, count);
}

/** Letters only, so words that differ by marks alone are not offered as two options. */
function skeleton(word: string): string {
  return word.replace(/[ً-ٰٟۖ-ۭـ]/g, "");
}

function wordsOf(verse: string): string[] {
  return verse.split(" ").filter((word) => word.length > 0);
}

function buildFill(
  surahId: number,
  ayah: number,
  t: Translate,
): QuizQuestion | undefined {
  const verses = VERSE_TEXT[surahId];
  const verse = verses?.[ayah - 1]?.ar;

  if (!verses || !verse) {
    return undefined;
  }

  const words = wordsOf(verse);
  const candidates = words
    .map((word, index) => ({ word, index }))
    .filter(({ word }) => skeleton(word).length >= 3);

  if (words.length < 3 || candidates.length === 0) {
    return undefined;
  }

  const target = candidates[Math.floor(Math.random() * candidates.length)]!;
  const targetSkeleton = skeleton(target.word);
  const pool = new Map<string, string>();

  verses.forEach((item) => {
    wordsOf(item.ar).forEach((word) => {
      const letters = skeleton(word);

      if (letters.length >= 3 && letters !== targetSkeleton) {
        pool.set(letters, word);
      }
    });
  });

  const wrong = pickOthers(Array.from(pool.values()), OPTION_COUNT - 1);

  if (wrong.length < OPTION_COUNT - 1) {
    return undefined;
  }

  const blanked = words
    .map((word, index) => (index === target.index ? BLANK : word))
    .join(" ");
  const options = shuffle([
    { id: "correct", text: target.word, arabic: true },
    ...wrong.map((word, index) => ({
      id: `wrong-${index}`,
      text: word,
      arabic: true,
    })),
  ]);

  return {
    id: `fill-${ayah}`,
    kind: "fill",
    prompt: t.quran_quiz_fill ?? "",
    arabicPrompt: blanked,
    options,
    correctId: "correct",
    explanation: t.quran_quiz_explain_fill ?? "",
    ayah,
    revealVerse: verse,
  };
}

function buildNext(
  surahId: number,
  ayah: number,
  t: Translate,
  language: Language,
): QuizQuestion | undefined {
  const verses = VERSE_TEXT[surahId];
  const current = verses?.[ayah - 1]?.ar;
  const following = verses?.[ayah]?.ar;

  if (!verses || !current || !following) {
    return undefined;
  }

  const others = verses
    .map((item, index) => ({ text: item.ar, ayah: index + 1 }))
    .filter((item) => item.ayah !== ayah && item.ayah !== ayah + 1);

  if (others.length < OPTION_COUNT - 1) {
    return undefined;
  }

  // Short verses make easier-to-read options; the correct answer is never swapped out.
  const wrong = pickOthers(
    others.sort((a, b) => a.text.length - b.text.length).slice(0, 12),
    OPTION_COUNT - 1,
  );
  const options = shuffle([
    { id: "correct", text: following, arabic: true },
    ...wrong.map((item) => ({
      id: `wrong-${item.ayah}`,
      text: item.text,
      arabic: true,
    })),
  ]);

  return {
    id: `next-${ayah}`,
    kind: "next",
    prompt: t.quran_quiz_next_prompt ?? "",
    arabicPrompt: current,
    options,
    correctId: "correct",
    explanation: fill(t.quran_quiz_explain_next, {
      ayah: formatNumber(ayah + 1, language),
    }),
    ayah: ayah + 1,
  };
}

function buildNumber(
  surahId: number,
  ayah: number,
  t: Translate,
  language: Language,
): QuizQuestion | undefined {
  const verses = VERSE_TEXT[surahId];
  const verse = verses?.[ayah - 1]?.ar;

  if (!verses || !verse) {
    return undefined;
  }

  const total = verses.length;
  const numbers = new Set<number>([ayah]);

  for (const offset of shuffle([-3, -2, -1, 1, 2, 3, 4, -4])) {
    const value = ayah + offset;

    if (value >= 1 && value <= total) {
      numbers.add(value);
    }

    if (numbers.size === OPTION_COUNT) {
      break;
    }
  }

  if (numbers.size < OPTION_COUNT) {
    return undefined;
  }

  const options = shuffle(
    Array.from(numbers).map((value) => ({
      id: value === ayah ? "correct" : `wrong-${value}`,
      text: formatNumber(value, language),
      arabic: false,
    })),
  );

  return {
    id: `number-${ayah}`,
    kind: "number",
    prompt: t.quran_quiz_number_prompt ?? "",
    arabicPrompt: verse,
    options,
    correctId: "correct",
    explanation: fill(t.quran_quiz_explain_number, {
      ayah: formatNumber(ayah, language),
    }),
    ayah,
  };
}

/**
 * Builds a mixed quiz for a memorized surah: fill-in-the-blank, "which verse comes next",
 * "which verse number" and a few meaning questions. Returns [] when there is no verse text.
 */
export function buildQuiz(
  surahId: number,
  language: Language,
  t: Translate,
  length: number = QUIZ_LENGTH,
): QuizQuestion[] {
  const verses = VERSE_TEXT[surahId];

  if (!verses) {
    return [];
  }

  const total = verses.length;
  const ayahs = shuffle(Array.from({ length: total }, (_, index) => index + 1));
  const questions: QuizQuestion[] = [];

  const concept = shuffle(conceptQuestionsFor(surahId))
    .slice(0, Math.min(3, Math.floor(length / 2)))
    .map<QuizQuestion>((item) => {
      const options = shuffle([
        { id: "correct", text: item.correct[language], arabic: false },
        ...item.wrong.map((wrong, index) => ({
          id: `wrong-${index}`,
          text: wrong[language],
          arabic: false,
        })),
      ]);

      return {
        id: `concept-${item.id}`,
        kind: "concept",
        prompt: item.prompt[language],
        options,
        correctId: "correct",
        explanation: item.explanation[language],
      };
    });

  const wanted = length - concept.length;
  // Roughly: 3 of 5 fill-in-the-blank, then "next verse" and "verse number".
  const plan: QuizKind[] = [];

  for (let index = 0; index < wanted; index += 1) {
    plan.push(index % 5 === 3 ? "next" : index % 5 === 4 ? "number" : "fill");
  }

  let cursor = 0;

  for (const kind of plan) {
    let built: QuizQuestion | undefined;

    for (let tries = 0; tries < total && !built; tries += 1) {
      const ayah = ayahs[cursor % total]!;

      cursor += 1;
      built =
        kind === "fill"
          ? buildFill(surahId, ayah, t)
          : kind === "next"
            ? buildNext(surahId, ayah, t, language)
            : buildNumber(surahId, ayah, t, language);
    }

    if (built) {
      questions.push(built);
    }
  }

  return shuffle([...questions, ...concept]);
}

export function starsFor(score: number, total: number): number {
  if (total <= 0 || score <= 0) {
    return 0;
  }

  const ratio = score / total;

  return ratio >= 0.9 ? 3 : ratio >= 0.6 ? 2 : 1;
}

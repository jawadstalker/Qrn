import { conceptQuestionsFor } from "@/features/quran/data/quizConcepts";
import { VERSE_TEXT } from "@/features/quran/data/verseText";
import type { Language } from "@/core/types/index";
import { formatNumber } from "@/core/i18n/format";
import { fill } from "@/features/quran/utils/fill";
import {
  LINES_PER_PAGE,
  pageBounds,
  verseLocation,
} from "@/features/quran/data/verseLocations";

export type QuizKind = "order" | "next" | "number" | "page" | "line" | "concept";

export interface QuizOption {
  id: string;
  text: string;
  /** Arabic options are drawn in the Quran font, right to left. */
  arabic: boolean;
}

/** A word-arranging question: the learner puts the shuffled words back in verse order. */
export interface QuizArrange {
  /** Words in the correct order. */
  words: string[];
  /** The same words, shuffled, each with its own id. */
  bank: { id: string; text: string }[];
  /** True when only the beginning of a long verse is asked. */
  partial: boolean;
}

export interface QuizQuestion {
  id: string;
  /** Unique per built question (React key); `id` stays stable across rounds for the mistake history. */
  uid: string;
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
  /** Present for "order" questions. */
  arrange?: QuizArrange;
}

export const QUIZ_LENGTH = 8;
const OPTION_COUNT = 4;
/** Verses longer than this are asked by their first words only. */
const ORDER_MAX_WORDS = 8;
const ORDER_MIN_WORDS = 3;

let uidCounter = 0;

function nextUid(): string {
  uidCounter += 1;

  return `q${uidCounter}`;
}

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

/** Words of a verse; stop-sign tokens that hold no letter are glued to the word before them. */
function wordsOf(verse: string): string[] {
  const words: string[] = [];

  verse
    .split(" ")
    .filter((word) => word.length > 0)
    .forEach((word) => {
      if (!/[ء-يٱ-ۓ]/.test(word) && words.length > 0) {
        words[words.length - 1] += ` ${word}`;
      } else {
        words.push(word);
      }
    });

  return words;
}

function buildOrder(
  surahId: number,
  ayah: number,
  t: Translate,
  language: Language,
): QuizQuestion | undefined {
  const verse = VERSE_TEXT[surahId]?.[ayah - 1]?.ar;

  if (!verse) {
    return undefined;
  }

  const all = wordsOf(verse);

  if (all.length < ORDER_MIN_WORDS) {
    return undefined;
  }

  const partial = all.length > ORDER_MAX_WORDS;
  const words = partial ? all.slice(0, ORDER_MAX_WORDS) : all;
  let bank = shuffle(words.map((text, index) => ({ id: `w${index}`, text })));

  // A shuffle that happens to keep the verse order would be a free answer.
  for (let tries = 0; tries < 5; tries += 1) {
    if (bank.some((item, index) => item.text !== words[index])) {
      break;
    }

    bank = shuffle(bank);
  }

  return {
    id: `order-${ayah}`,
    uid: nextUid(),
    kind: "order",
    prompt: fill(partial ? t.quran_quiz_order_partial : t.quran_quiz_order, {
      ayah: formatNumber(ayah, language),
    }),
    options: [{ id: "correct", text: words.join(" "), arabic: true }],
    correctId: "correct",
    explanation: t.quran_quiz_explain_order ?? "",
    ayah,
    revealVerse: verse,
    arrange: { words, bank, partial },
  };
}

function buildNext(
  surahId: number,
  ayah: number,
  t: Translate,
  language: Language,
  lastAyah: number = Number.POSITIVE_INFINITY,
): QuizQuestion | undefined {
  const verses = VERSE_TEXT[surahId];
  const current = verses?.[ayah - 1]?.ar;
  const following = verses?.[ayah]?.ar;

  if (!verses || !current || !following || ayah + 1 > lastAyah) {
    return undefined;
  }

  const others = verses
    .map((item, index) => ({ text: item.ar, ayah: index + 1 }))
    .filter(
      (item) =>
        item.ayah !== ayah && item.ayah !== ayah + 1 && item.text !== following,
    )
    // Repeated verses (e.g. the refrain of Ar-Rahman-style surahs) must not appear twice as options.
    .filter(
      (item, index, list) =>
        list.findIndex((other) => other.text === item.text) === index,
    );

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
    uid: nextUid(),
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
    uid: nextUid(),
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

/** Correct number plus close-by wrong ones (min..max inclusive), topped up at random when the range is tight. */
function nearbyNumbers(correct: number, min: number, max: number): number[] {
  const numbers = new Set<number>([correct]);

  for (const offset of shuffle([-4, -3, -2, -1, 1, 2, 3, 4])) {
    const value = correct + offset;

    if (value >= min && value <= max) {
      numbers.add(value);
    }

    if (numbers.size === OPTION_COUNT) {
      break;
    }
  }

  for (const value of shuffle(
    Array.from({ length: max - min + 1 }, (_, index) => min + index),
  )) {
    if (numbers.size >= OPTION_COUNT) {
      break;
    }

    numbers.add(value);
  }

  return Array.from(numbers);
}

function numberOptions(
  numbers: readonly number[],
  correct: number,
  language: Language,
): QuizOption[] {
  return shuffle(
    numbers.map((value) => ({
      id: value === correct ? "correct" : `wrong-${value}`,
      text: formatNumber(value, language),
      arabic: false,
    })),
  );
}

function buildPage(
  surahId: number,
  ayah: number,
  t: Translate,
  language: Language,
): QuizQuestion | undefined {
  const verse = VERSE_TEXT[surahId]?.[ayah - 1]?.ar;
  const location = verseLocation(surahId, ayah);

  if (!verse || !location) {
    return undefined;
  }

  const { min, max } = pageBounds();
  const numbers = nearbyNumbers(location.page, min, max);

  if (numbers.length < OPTION_COUNT) {
    return undefined;
  }

  return {
    id: `page-${ayah}`,
    uid: nextUid(),
    kind: "page",
    prompt: t.quran_quiz_page_prompt ?? "",
    arabicPrompt: verse,
    options: numberOptions(numbers, location.page, language),
    correctId: "correct",
    explanation: fill(t.quran_quiz_explain_page, {
      page: formatNumber(location.page, language),
      line: formatNumber(location.line, language),
    }),
    ayah,
  };
}

function buildLine(
  surahId: number,
  ayah: number,
  t: Translate,
  language: Language,
): QuizQuestion | undefined {
  const verse = VERSE_TEXT[surahId]?.[ayah - 1]?.ar;
  const location = verseLocation(surahId, ayah);

  if (!verse || !location) {
    return undefined;
  }

  const numbers = nearbyNumbers(location.line, 1, LINES_PER_PAGE);

  return {
    id: `line-${ayah}`,
    uid: nextUid(),
    kind: "line",
    prompt: fill(t.quran_quiz_line_prompt, {
      page: formatNumber(location.page, language),
    }),
    arabicPrompt: verse,
    options: numberOptions(numbers, location.line, language),
    correctId: "correct",
    explanation: fill(t.quran_quiz_explain_page, {
      page: formatNumber(location.page, language),
      line: formatNumber(location.line, language),
    }),
    ayah,
  };
}

/**
 * Builds a mixed quiz for a memorized surah: arrange the words of a verse, "which verse comes next",
 * "which verse number", "which page", "which line" and a few meaning questions.
 * Returns [] when there is no verse text.
 */
export interface BuildQuizOptions {
  /** Only these question kinds are generated (default: all kinds). */
  kinds?: readonly QuizKind[];
  /** Only ask about these verses (default: the whole surah). */
  ayahs?: readonly number[];
  /** "Next verse" questions never reach past this verse (default: the end of the surah). */
  lastAyah?: number;
}

export function buildQuiz(
  surahId: number,
  language: Language,
  t: Translate,
  length: number = QUIZ_LENGTH,
  options?: BuildQuizOptions,
): QuizQuestion[] {
  const verses = VERSE_TEXT[surahId];

  if (!verses) {
    return [];
  }

  const total = verses.length;
  const allowedKinds = options?.kinds;
  const withConcept = !allowedKinds || allowedKinds.includes("concept");
  const verseKinds = allowedKinds?.filter((kind) => kind !== "concept") ?? [];
  const scope =
    options?.ayahs && options.ayahs.length > 0
      ? options.ayahs.filter((ayah) => ayah >= 1 && ayah <= total)
      : Array.from({ length: total }, (_, index) => index + 1);
  const ayahs = shuffle(scope.length > 0 ? scope : [1]);
  const questions: QuizQuestion[] = [];

  const concept = shuffle(withConcept ? conceptQuestionsFor(surahId) : [])
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
        uid: nextUid(),
        kind: "concept",
        prompt: item.prompt[language],
        options,
        correctId: "correct",
        explanation: item.explanation[language],
      };
    });

  const wanted = length - concept.length;
  // Default mix: two word-arranging questions, then "next verse", verse number, page and line.
  const defaultPlan: readonly QuizKind[] = [
    "order",
    "next",
    "order",
    "number",
    "page",
    "line",
  ];
  const plan: QuizKind[] = [];

  for (let index = 0; index < wanted; index += 1) {
    plan.push(
      verseKinds.length > 0
        ? verseKinds[index % verseKinds.length]!
        : defaultPlan[index % defaultPlan.length]!,
    );
  }

  let cursor = 0;

  for (const kind of plan) {
    let built: QuizQuestion | undefined;

    for (let tries = 0; tries < ayahs.length && !built; tries += 1) {
      const ayah = ayahs[cursor % ayahs.length]!;

      cursor += 1;
      built =
        kind === "order"
          ? buildOrder(surahId, ayah, t, language)
          : kind === "next"
            ? buildNext(surahId, ayah, t, language, options?.lastAyah)
            : kind === "page"
              ? buildPage(surahId, ayah, t, language)
              : kind === "line"
                ? buildLine(surahId, ayah, t, language)
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

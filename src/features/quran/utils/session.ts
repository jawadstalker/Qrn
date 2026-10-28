import type {
  AnswerLog,
  KindTally,
  PracticeKind,
} from "@/features/quran/state/practiceStore";
import type { QuizOption, QuizQuestion } from "@/features/quran/utils/quiz";

export function answerLogFor(
  surahId: number,
  question: QuizQuestion,
  picked: QuizOption,
): AnswerLog {
  const correct = question.options.find(
    (option) => option.id === question.correctId,
  );

  return {
    surahId,
    questionId: question.id,
    kind: question.kind,
    ayah: question.ayah,
    right: picked.id === question.correctId,
    picked: picked.text,
    correct: correct?.text,
    arabic: picked.arabic,
  };
}

export type KindTallies = Partial<Record<PracticeKind, KindTally>>;

export function addToTally(
  tallies: KindTallies,
  kind: PracticeKind,
  right: boolean,
): KindTallies {
  const previous = tallies[kind] ?? { right: 0, total: 0 };

  return {
    ...tallies,
    [kind]: {
      right: previous.right + (right ? 1 : 0),
      total: previous.total + 1,
    },
  };
}

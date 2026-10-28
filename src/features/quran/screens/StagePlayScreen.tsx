import React, { useCallback, useEffect, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useDirection } from "@/core/i18n/useDirection";
import { useLanguage } from "@/core/i18n/LanguageContext";
import { formatNumber } from "@/core/i18n/format";
import { useTheme } from "@/core/theme/ThemeContext";
import { AppText } from "@/shared/components/ui/AppText";
import { ChunkyButton } from "@/shared/components/ui/ChunkyButton";
import {
  GOLD,
  StarBadge,
} from "@/features/quran/components/QuranDecor";
import {
  Card,
  PillButton,
  ProgressBar,
  ScreenFrame,
} from "@/features/quran/components/PracticeChrome";
import { QuizQuestionCard } from "@/features/quran/components/QuizQuestionCard";
import { usePT } from "@/features/quran/i18n/practice";
import {
  logAnswer,
  logAttempt,
} from "@/features/quran/state/practiceStore";
import { useQuranProgress } from "@/features/quran/state/QuranProgressContext";
import {
  buildQuiz,
  starsFor,
  type QuizOption,
  type QuizQuestion,
} from "@/features/quran/utils/quiz";
import {
  addToTally,
  answerLogFor,
  type KindTallies,
} from "@/features/quran/utils/session";
import { getStage } from "@/features/quran/utils/stages";

type Phase = "question" | "result";

export default function StagePlayScreen() {
  const { colors } = useTheme();
  const { t, language } = useLanguage();
  const { row } = useDirection();
  const router = useRouter();
  const p = usePT();
  const params = useLocalSearchParams<{ stage?: string }>();
  const { mushaf } = useQuranProgress();
  const stage = getStage(Number(params.stage));
  const number = (value: number) => formatNumber(value, language);

  const [phase, setPhase] = useState<Phase>("question");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [missed, setMissed] = useState<number[]>([]);
  const [tallies, setTallies] = useState<KindTallies>({});

  const start = useCallback(() => {
    if (!stage || stage.recall) {
      return;
    }

    const built = buildQuiz(mushaf.surahId, language, t, stage.length, {
      kinds: stage.kinds,
    });

    setQuestions(built);
    setIndex(0);
    setPicked(null);
    setScore(0);
    setMissed([]);
    setTallies({});
    setPhase("question");
  }, [language, mushaf.surahId, stage, t]);

  useEffect(() => {
    start();
    // Build the first round once when the screen opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const question = questions[index];
  const answered = picked !== null;
  const isLast = index + 1 >= questions.length;

  const choose = useCallback(
    (option: QuizOption) => {
      if (!question || picked !== null) {
        return;
      }

      const right = option.id === question.correctId;

      setPicked(option.id);
      setTallies((previous) => addToTally(previous, question.kind, right));
      void logAnswer(answerLogFor(mushaf.surahId, question, option));

      if (right) {
        setScore((value) => value + 1);
      } else if (question.ayah !== undefined) {
        setMissed((previous) => [...previous, question.ayah!]);
      }
    },
    [mushaf.surahId, picked, question],
  );

  const next = useCallback(() => {
    if (!isLast) {
      setIndex((value) => value + 1);
      setPicked(null);

      return;
    }

    if (stage) {
      void logAttempt({
        surahId: mushaf.surahId,
        mode: "stage",
        stage: stage.id,
        score,
        total: questions.length,
        byKind: tallies,
      });
    }

    setPhase("result");
  }, [isLast, mushaf.surahId, questions.length, score, stage, tallies]);

  const passed = useMemo(
    () =>
      stage !== undefined &&
      questions.length > 0 &&
      score / questions.length >= stage.pass,
    [questions.length, score, stage],
  );

  if (!stage || stage.recall) {
    return (
      <ScreenFrame
        arabicTitle="الْمَرَاحِلُ"
        title={p("stage_title")}
        subtitle=""
        backTo="/stages"
      >
        <Card>
          <AppText variant="bodySmall" style={{ color: colors.textSecondary }}>
            {p("stage_no_text")}
          </AppText>
        </Card>
      </ScreenFrame>
    );
  }

  if (questions.length === 0 && phase === "question") {
    return (
      <ScreenFrame
        arabicTitle="الْمَرَاحِلُ"
        title={p("stage_title")}
        subtitle={p(`stage_${stage.id}_name`)}
        backTo="/stages"
      >
        <Card>
          <AppText
            variant="bodySmall"
            style={{ color: colors.textSecondary, textAlign: "center" }}
          >
            {p("stage_no_text")}
          </AppText>
        </Card>
      </ScreenFrame>
    );
  }

  const stars = starsFor(score, questions.length);
  const goStage = (id: number) => {
    if (id === 4) {
      router.replace({ pathname: "/recall", params: { stage: "4" } });
    } else {
      router.replace({ pathname: "/stage-play", params: { stage: String(id) } });
    }
  };

  return (
    <ScreenFrame
      arabicTitle="الْمَرَاحِلُ"
      title={`${p("stage_n", { n: stage.id })} — ${p(`stage_${stage.id}_name`)}`}
      subtitle={p("stage_pass", { percent: Math.round(stage.pass * 100) })}
      backTo="/stages"
      compact={phase === "question"}
    >
      {phase === "question" && question ? (
        <>
          <View style={[styles.progressRow, { flexDirection: row }]}>
            <AppText
              variant="caption"
              style={{ color: colors.textSecondary, fontWeight: "700" }}
            >
              {t.quran_quiz_q_of
                ?.replace("{n}", number(index + 1))
                .replace("{total}", number(questions.length))}
            </AppText>
            <ProgressBar
              value={(index + (answered ? 1 : 0)) / questions.length}
              color={GOLD}
            />
          </View>

          <QuizQuestionCard question={question} picked={picked} onPick={choose} />

          {answered ? (
            <View style={styles.nextButton}>
              <ChunkyButton
                label={(isLast ? t.quran_quiz_finish : t.quran_quiz_next) ?? ""}
                onPress={next}
              />
            </View>
          ) : null}
        </>
      ) : null}

      {phase === "result" ? (
        <Card>
          <View style={styles.stars}>
            {[1, 2, 3].map((value) => (
              <StarBadge
                key={value}
                size={value === 2 ? 64 : 52}
                color={GOLD}
                fillColor={value <= stars ? GOLD : "transparent"}
              />
            ))}
          </View>
          <AppText
            variant="h1"
            style={{ color: colors.text, textAlign: "center", fontWeight: "800" }}
          >
            {`${number(score)} / ${number(questions.length)}`}
          </AppText>
          <AppText
            variant="bodySmall"
            style={{
              color: passed ? colors.success : colors.textSecondary,
              textAlign: "center",
              fontWeight: "800",
            }}
          >
            {passed
              ? stage.id < 4
                ? p("stage_pass_msg")
                : p("stage_pass_last")
              : p("stage_fail_msg")}
          </AppText>

          {passed && stage.id < 4 ? (
            <ChunkyButton
              label={p("stage_next")}
              onPress={() => goStage(stage.id + 1)}
            />
          ) : (
            <ChunkyButton label={p("stage_retry")} onPress={start} />
          )}
          {passed ? (
            <PillButton label={p("stage_retry")} onPress={start} />
          ) : null}
          {missed.length > 0 ? (
            <PillButton
              label={t.quran_quiz_review ?? ""}
              onPress={() =>
                router.replace({
                  pathname: "/memorize",
                  params: { ayah: String(missed[0]) },
                })
              }
            />
          ) : null}
          <PillButton
            label={p("stage_to_stages")}
            onPress={() => router.replace("/stages")}
          />
        </Card>
      ) : null}
    </ScreenFrame>
  );
}

const styles = StyleSheet.create({
  progressRow: {
    alignItems: "center",
    gap: 10,
  },
  nextButton: {
    marginTop: 4,
  },
  stars: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "center",
    gap: 8,
  },
});

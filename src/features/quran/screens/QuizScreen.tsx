import React, { useCallback, useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDirection } from "@/core/i18n/useDirection";
import { useLanguage } from "@/core/i18n/LanguageContext";
import { formatNumber } from "@/core/i18n/format";
import { useTheme } from "@/core/theme/ThemeContext";
import { AppText } from "@/shared/components/ui/AppText";
import { ChunkyButton } from "@/shared/components/ui/ChunkyButton";
import { Rise } from "@/shared/motion/motion";
import {
  GOLD,
  PageBanner,
  StarBadge,
} from "@/features/quran/components/QuranDecor";
import { QuizQuestionCard } from "@/features/quran/components/QuizQuestionCard";
import { getSurah } from "@/features/quran/data/surahs";
import { VERSE_TEXT } from "@/features/quran/data/verseText";
import {
  logAnswer,
  logAttempt,
} from "@/features/quran/state/practiceStore";
import { useQuranProgress } from "@/features/quran/state/QuranProgressContext";
import { fill } from "@/features/quran/utils/fill";
import {
  QUIZ_LENGTH,
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

const PADDING = 20;

type Phase = "intro" | "question" | "result";

export default function QuizScreen() {
  const { colors } = useTheme();
  const { t, language } = useLanguage();
  const { row, textAlign, isRTL } = useDirection();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { mushaf, recordQuiz, quizFor } = useQuranProgress();
  const surah = getSurah(mushaf.surahId);
  const number = (value: number) => formatNumber(value, language);
  const hasQuiz = VERSE_TEXT[mushaf.surahId] !== undefined;

  const [phase, setPhase] = useState<Phase>("intro");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [missed, setMissed] = useState<number[]>([]);
  const [tallies, setTallies] = useState<KindTallies>({});

  const best = quizFor(mushaf.surahId);
  const question = questions[index];
  const answered = picked !== null;

  const start = useCallback(() => {
    const built = buildQuiz(mushaf.surahId, language, t, QUIZ_LENGTH);

    setQuestions(built);
    setIndex(0);
    setPicked(null);
    setScore(0);
    setMissed([]);
    setTallies({});
    setPhase(built.length > 0 ? "question" : "intro");
  }, [language, mushaf.surahId, t]);

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
    if (index + 1 < questions.length) {
      setIndex(index + 1);
      setPicked(null);

      return;
    }

    void recordQuiz(mushaf.surahId, score, questions.length);
    void logAttempt({
      surahId: mushaf.surahId,
      mode: "quiz",
      score,
      total: questions.length,
      byKind: tallies,
    });
    setPhase("result");
  }, [index, mushaf.surahId, questions.length, recordQuiz, score, tallies]);

  const goGarden = () => router.replace("/");
  const reviewMissed = () => {
    const first = missed[0];

    router.replace({
      pathname: "/memorize",
      params: first ? { ayah: String(first) } : undefined,
    });
  };

  const stars = starsFor(score, questions.length);
  const message =
    questions.length > 0 && score / questions.length >= 0.85
      ? t.quran_quiz_msg_great
      : questions.length > 0 && score / questions.length >= 0.55
        ? t.quran_quiz_msg_good
        : t.quran_quiz_msg_try;

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 28,
          paddingHorizontal: PADDING,
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <Rise>
        <PageBanner
          width={width - PADDING * 2}
          background={colors.primary}
          arabicTitle="الاختبار"
          title={t.quran_quiz_title ?? ""}
          subtitle={t.quran_quiz_sub ?? ""}
          illustration="star"
          isRTL={isRTL}
        />
      </Rise>

      {phase === "intro" ? (
        <Rise delay={80}>
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            {hasQuiz && surah ? (
              <>
                <Text
                  allowFontScaling={false}
                  style={[styles.surahName, { color: colors.text }]}
                >
                  {surah.name}
                </Text>
                <AppText
                  variant="bodySmall"
                  style={{ color: colors.textSecondary, textAlign: "center" }}
                >
                  {fill(t.quran_quiz_intro, {
                    count: number(QUIZ_LENGTH),
                    surah: isRTL ? surah.name : surah.transliteration,
                  })}
                </AppText>
                <AppText
                  variant="caption"
                  style={{ color: colors.text, textAlign: "center", fontWeight: "700" }}
                >
                  {best
                    ? fill(t.quran_quiz_best, {
                        score: number(best.best),
                        total: number(best.total),
                      })
                    : t.quran_quiz_not_taken}
                </AppText>
                <ChunkyButton label={t.quran_quiz_start ?? ""} onPress={start} />
              </>
            ) : (
              <AppText
                variant="bodySmall"
                style={{ color: colors.textSecondary, textAlign: "center" }}
              >
                {t.quran_quiz_empty}
              </AppText>
            )}
          </View>
        </Rise>
      ) : null}

      {phase === "question" && question ? (
        <>
          <View style={[styles.progressRow, { flexDirection: row }]}>
            <AppText
              variant="caption"
              style={{ color: colors.textSecondary, fontWeight: "700" }}
            >
              {fill(t.quran_quiz_q_of, {
                n: number(index + 1),
                total: number(questions.length),
              })}
            </AppText>
            <View style={[styles.track, { backgroundColor: colors.track }]}>
              <View
                style={[
                  styles.fill,
                  {
                    backgroundColor: GOLD,
                    width: `${Math.round(((index + (answered ? 1 : 0)) / questions.length) * 100)}%`,
                  },
                ]}
              />
            </View>
          </View>

          <QuizQuestionCard
            question={question}
            picked={picked}
            onPick={choose}
          />

          {answered ? (
            <View style={styles.nextButton}>
              <ChunkyButton
                label={
                  (index + 1 < questions.length
                    ? t.quran_quiz_next
                    : t.quran_quiz_finish) ?? ""
                }
                onPress={next}
              />
            </View>
          ) : null}
        </>
      ) : null}

      {phase === "result" ? (
        <Rise>
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <AppText
              variant="body"
              style={{ color: colors.textSecondary, textAlign: "center" }}
            >
              {t.quran_quiz_result_title}
            </AppText>
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
              {fill(t.quran_quiz_score, {
                score: number(score),
                total: number(questions.length),
              })}
            </AppText>
            <AppText
              variant="bodySmall"
              style={{ color: colors.textSecondary, textAlign: "center" }}
            >
              {message}
            </AppText>
            <ChunkyButton label={t.quran_quiz_retry ?? ""} onPress={start} />
            {missed.length > 0 ? (
              <Pressable
                accessibilityRole="button"
                onPress={reviewMissed}
                style={[styles.secondary, { backgroundColor: colors.tint }]}
              >
                <AppText
                  variant="bodySmall"
                  style={{ color: colors.onTint, fontWeight: "800" }}
                >
                  {t.quran_quiz_review}
                </AppText>
              </Pressable>
            ) : null}
            <Pressable
              accessibilityRole="button"
              onPress={() => router.replace("/exam")}
              style={[styles.secondary, { backgroundColor: colors.tint }]}
            >
              <AppText
                variant="bodySmall"
                style={{ color: colors.onTint, fontWeight: "800" }}
              >
                {t.quran_exam_title}
              </AppText>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={goGarden}
              style={styles.later}
            >
              <AppText variant="bodySmall" style={{ color: colors.textSecondary }}>
                {t.quran_quiz_home}
              </AppText>
            </Pressable>
          </View>
        </Rise>
      ) : null}

      {phase !== "result" ? (
        <Pressable
          accessibilityRole="button"
          onPress={goGarden}
          style={styles.later}
        >
          <AppText variant="bodySmall" style={{ color: colors.textSecondary }}>
            {t.quran_quiz_home}
          </AppText>
        </Pressable>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 14,
  },
  card: {
    borderRadius: 24,
    padding: 16,
    gap: 12,
  },
  surahName: {
    fontFamily: "UthmanicHafs",
    fontSize: 36,
    lineHeight: 60,
    textAlign: "center",
    includeFontPadding: false,
  },
  progressRow: {
    alignItems: "center",
    gap: 10,
  },
  track: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  fill: {
    height: 8,
    borderRadius: 4,
  },
  nextButton: {
    marginTop: 12,
  },
  stars: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "center",
    gap: 8,
  },
  secondary: {
    minHeight: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  later: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
  },
});

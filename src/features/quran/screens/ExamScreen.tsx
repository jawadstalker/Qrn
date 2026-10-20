import React, { useCallback, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Check, X } from "lucide-react-native";
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
import { getExam } from "@/features/quran/data/exams";
import { useExamResults } from "@/features/quran/state/useExamResults";
import { fill } from "@/features/quran/utils/fill";
import { starsFor } from "@/features/quran/utils/quiz";

const PADDING = 20;
const GOOD = "#2FB38A";
const BAD = "#D64545";

type Phase = "question" | "result";

export default function ExamScreen() {
  const { colors } = useTheme();
  const { t, language } = useLanguage();
  const { row, textAlign, isRTL } = useDirection();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const params = useLocalSearchParams<{ id?: string }>();
  const { record } = useExamResults();
  const exam = getExam(params.id);
  const number = (value: number) => formatNumber(value, language);

  const [phase, setPhase] = useState<Phase>("question");
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);

  const questions = exam?.questions ?? [];
  const question = questions[index];
  const answered = picked !== null;

  const restart = useCallback(() => {
    setPhase("question");
    setIndex(0);
    setPicked(null);
    setScore(0);
  }, []);

  const choose = useCallback(
    (optionIndex: number) => {
      if (!question || picked !== null) {
        return;
      }

      const right = optionIndex === question.answer;

      setPicked(optionIndex);
      void Haptics.notificationAsync(
        right
          ? Haptics.NotificationFeedbackType.Success
          : Haptics.NotificationFeedbackType.Error,
      );

      if (right) {
        setScore((value) => value + 1);
      }
    },
    [picked, question],
  );

  const next = useCallback(() => {
    if (index + 1 < questions.length) {
      setIndex(index + 1);
      setPicked(null);

      return;
    }

    if (exam) {
      void record(exam.id, score, questions.length);
    }

    setPhase("result");
  }, [exam, index, questions.length, record, score]);

  const goList = () => router.replace("/exam");
  const goMemorize = () => router.replace("/memorize");

  const stars = starsFor(score, questions.length);
  const message =
    questions.length > 0 && score / questions.length >= 0.85
      ? t.quran_quiz_msg_great
      : questions.length > 0 && score / questions.length >= 0.55
        ? t.quran_quiz_msg_good
        : t.quran_quiz_msg_try;

  if (!exam) {
    return (
      <View
        style={[
          styles.empty,
          { backgroundColor: colors.background, paddingTop: insets.top + 16 },
        ]}
      >
        <AppText variant="bodySmall" style={{ color: colors.textSecondary }}>
          {t.quran_exam_not_found}
        </AppText>
        <ChunkyButton label={t.quran_exam_back ?? ""} onPress={goList} />
      </View>
    );
  }

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
          arabicTitle={exam.arabicName}
          title={exam.title[language]}
          subtitle={exam.subtitle[language]}
          illustration="star"
          isRTL={isRTL}
        />
      </Rise>

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

          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <AppText
              variant="body"
              style={{ color: colors.text, fontWeight: "800", textAlign }}
            >
              {question.prompt}
            </AppText>
            {question.arabic ? (
              <View style={styles.verseBox}>
                <Text allowFontScaling={false} style={styles.arabicPrompt}>
                  {question.arabic}
                </Text>
              </View>
            ) : null}

            {question.options.map((option, optionIndex) => {
              const isPicked = picked === optionIndex;
              const isRight = optionIndex === question.answer;
              const showRight = answered && isRight;
              const showWrong = answered && isPicked && !isRight;

              return (
                <Pressable
                  key={`${question.id}-${optionIndex}`}
                  accessibilityRole="button"
                  accessibilityState={{
                    selected: isPicked,
                    disabled: answered,
                  }}
                  disabled={answered}
                  onPress={() => choose(optionIndex)}
                  style={[
                    styles.option,
                    {
                      flexDirection: question.arabicOptions
                        ? "row-reverse"
                        : row,
                      backgroundColor: showRight
                        ? "rgba(47,179,138,0.16)"
                        : showWrong
                          ? "rgba(214,69,69,0.14)"
                          : colors.tintSoft,
                      borderColor: showRight
                        ? GOOD
                        : showWrong
                          ? BAD
                          : "transparent",
                    },
                  ]}
                >
                  {question.arabicOptions ? (
                    <Text
                      allowFontScaling={false}
                      style={[
                        styles.arabicOption,
                        option.length > 40 && styles.arabicOptionLong,
                        { color: colors.text },
                      ]}
                    >
                      {option}
                    </Text>
                  ) : (
                    <AppText
                      variant="bodySmall"
                      style={{
                        color: colors.text,
                        flex: 1,
                        textAlign,
                        fontWeight: isPicked ? "800" : "500",
                      }}
                    >
                      {option}
                    </AppText>
                  )}
                  {showRight ? <Check size={22} color={GOOD} /> : null}
                  {showWrong ? <X size={22} color={BAD} /> : null}
                </Pressable>
              );
            })}
          </View>

          {answered ? (
            <Rise>
              <View
                style={[
                  styles.feedback,
                  {
                    backgroundColor:
                      picked === question.answer
                        ? "rgba(47,179,138,0.14)"
                        : colors.highlightTint,
                  },
                ]}
              >
                <AppText
                  variant="bodySmall"
                  style={{ color: colors.text, fontWeight: "800", textAlign }}
                >
                  {picked === question.answer
                    ? t.quran_quiz_correct
                    : t.quran_quiz_wrong}
                </AppText>
              </View>
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
            </Rise>
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
              style={{
                color: colors.text,
                textAlign: "center",
                fontWeight: "800",
              }}
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
            <ChunkyButton label={t.quran_quiz_retry ?? ""} onPress={restart} />
            <Pressable
              accessibilityRole="button"
              onPress={goList}
              style={[styles.secondary, { backgroundColor: colors.tint }]}
            >
              <AppText
                variant="bodySmall"
                style={{ color: colors.onTint, fontWeight: "800" }}
              >
                {t.quran_exam_back}
              </AppText>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={goMemorize}
              style={styles.later}
            >
              <AppText
                variant="bodySmall"
                style={{ color: colors.textSecondary }}
              >
                {t.quran_exam_to_memorize}
              </AppText>
            </Pressable>
          </View>
        </Rise>
      ) : null}

      {phase === "question" ? (
        <Pressable
          accessibilityRole="button"
          onPress={goList}
          style={styles.later}
        >
          <AppText variant="bodySmall" style={{ color: colors.textSecondary }}>
            {t.quran_exam_back}
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
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    padding: PADDING,
  },
  card: {
    borderRadius: 24,
    padding: 16,
    gap: 12,
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
  verseBox: {
    backgroundColor: "#FFFBEF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: GOLD,
    padding: 14,
  },
  arabicPrompt: {
    fontFamily: "UthmanicHafs",
    fontSize: 26,
    lineHeight: 50,
    color: "#14110D",
    textAlign: "center",
    writingDirection: "rtl",
    includeFontPadding: false,
  },
  option: {
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    minHeight: 54,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 2,
  },
  arabicOption: {
    flex: 1,
    fontFamily: "UthmanicHafs",
    fontSize: 24,
    lineHeight: 44,
    textAlign: "center",
    writingDirection: "rtl",
    includeFontPadding: false,
  },
  arabicOptionLong: {
    fontSize: 18,
    lineHeight: 34,
  },
  feedback: {
    borderRadius: 22,
    padding: 16,
    gap: 6,
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

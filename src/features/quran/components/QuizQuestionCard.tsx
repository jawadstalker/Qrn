import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import * as Haptics from "expo-haptics";
import { Check, X } from "lucide-react-native";
import { useDirection } from "@/core/i18n/useDirection";
import { useLanguage } from "@/core/i18n/LanguageContext";
import { useTheme } from "@/core/theme/ThemeContext";
import { AppText } from "@/shared/components/ui/AppText";
import { Rise } from "@/shared/motion/motion";
import { GOLD } from "@/features/quran/components/QuranDecor";
import { usePT } from "@/features/quran/i18n/practice";
import type {
  QuizOption,
  QuizQuestion,
} from "@/features/quran/utils/quiz";

const GOOD = "#2FB38A";
const BAD = "#D64545";

interface QuizQuestionCardProps {
  question: QuizQuestion;
  /** Id of the option the learner picked, or null before answering. */
  picked: string | null;
  onPick: (option: QuizOption) => void;
}

function OptionText({
  option,
  color,
  bold,
}: {
  option: QuizOption;
  color: string;
  bold?: boolean;
}) {
  const { textAlign } = useDirection();

  return option.arabic ? (
    <Text
      allowFontScaling={false}
      style={[
        styles.arabicOption,
        option.text.length > 40 && styles.arabicOptionLong,
        { color },
      ]}
    >
      {option.text}
    </Text>
  ) : (
    <AppText
      variant="bodySmall"
      style={{
        color,
        flex: 1,
        textAlign,
        fontWeight: bold ? "800" : "500",
      }}
    >
      {option.text}
    </AppText>
  );
}

/** One quiz question: prompt, options and, after answering, feedback with your answer vs the right one. */
export function QuizQuestionCard({
  question,
  picked,
  onPick,
}: QuizQuestionCardProps) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { row, textAlign } = useDirection();
  const p = usePT();
  const answered = picked !== null;
  const wasRight = picked === question.correctId;
  const pickedOption = question.options.find((option) => option.id === picked);
  const correctOption = question.options.find(
    (option) => option.id === question.correctId,
  );

  return (
    <>
      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        <AppText
          variant="body"
          style={{ color: colors.text, fontWeight: "800", textAlign }}
        >
          {question.prompt}
        </AppText>
        {question.arabicPrompt ? (
          <View style={styles.verseBox}>
            <Text allowFontScaling={false} style={styles.arabicPrompt}>
              {question.arabicPrompt}
            </Text>
          </View>
        ) : null}

        {question.options.map((option) => {
          const isPicked = picked === option.id;
          const isRight = option.id === question.correctId;
          const showRight = answered && isRight;
          const showWrong = answered && isPicked && !isRight;

          return (
            <Pressable
              key={option.id}
              accessibilityRole="button"
              accessibilityState={{ selected: isPicked, disabled: answered }}
              disabled={answered}
              onPress={() => {
                void Haptics.notificationAsync(
                  isRight
                    ? Haptics.NotificationFeedbackType.Success
                    : Haptics.NotificationFeedbackType.Error,
                );
                onPick(option);
              }}
              style={[
                styles.option,
                {
                  flexDirection: option.arabic ? "row-reverse" : row,
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
              <OptionText option={option} color={colors.text} bold={isPicked} />
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
                backgroundColor: wasRight
                  ? "rgba(47,179,138,0.14)"
                  : colors.highlightTint,
              },
            ]}
          >
            <AppText
              variant="bodySmall"
              style={{ color: colors.text, fontWeight: "800", textAlign }}
            >
              {wasRight ? t.quran_quiz_correct : t.quran_quiz_wrong}
            </AppText>

            {!wasRight && pickedOption && correctOption ? (
              <View style={styles.compare}>
                <View style={[styles.compareBox, { borderColor: BAD }]}>
                  <AppText
                    variant="caption"
                    style={{ color: BAD, fontWeight: "800", textAlign }}
                  >
                    {p("your_answer")}
                  </AppText>
                  <View style={{ flexDirection: pickedOption.arabic ? "row-reverse" : row }}>
                    <OptionText option={pickedOption} color={colors.text} />
                  </View>
                </View>
                <View style={[styles.compareBox, { borderColor: GOOD }]}>
                  <AppText
                    variant="caption"
                    style={{ color: GOOD, fontWeight: "800", textAlign }}
                  >
                    {p("correct_answer")}
                  </AppText>
                  <View style={{ flexDirection: correctOption.arabic ? "row-reverse" : row }}>
                    <OptionText option={correctOption} color={colors.text} />
                  </View>
                </View>
              </View>
            ) : null}

            <AppText
              variant="caption"
              style={{ color: colors.text, textAlign, lineHeight: 22 }}
            >
              {question.explanation}
            </AppText>
            {question.revealVerse ? (
              <Text allowFontScaling={false} style={styles.revealVerse}>
                {question.revealVerse}
              </Text>
            ) : null}
          </View>
        </Rise>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    padding: 16,
    gap: 12,
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
    gap: 8,
  },
  compare: {
    gap: 8,
  },
  compareBox: {
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 2,
  },
  revealVerse: {
    fontFamily: "UthmanicHafs",
    fontSize: 22,
    lineHeight: 42,
    color: "#14110D",
    textAlign: "center",
    writingDirection: "rtl",
    includeFontPadding: false,
    paddingTop: 4,
  },
});

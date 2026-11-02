import React, { useCallback, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import * as Haptics from "expo-haptics";
import { useDirection } from "@/core/i18n/useDirection";
import { useLanguage } from "@/core/i18n/LanguageContext";
import { formatNumber } from "@/core/i18n/format";
import { useTheme } from "@/core/theme/ThemeContext";
import { AppText } from "@/shared/components/ui/AppText";
import { ChunkyButton } from "@/shared/components/ui/ChunkyButton";
import { Rise } from "@/shared/motion/motion";
import { GOLD } from "@/features/quran/components/QuranDecor";
import { usePT } from "@/features/quran/i18n/practice";
import { fill } from "@/features/quran/utils/fill";
import type { QuizOption, QuizQuestion } from "@/features/quran/utils/quiz";

const GOOD = "#2FB38A";
const BAD = "#D64545";

interface ArrangeQuestionProps {
  question: QuizQuestion;
  /** "correct" / "wrong" once answered, otherwise null. */
  picked: string | null;
  onPick: (option: QuizOption) => void;
}

/**
 * "Put the scrambled words of the verse back in order". The learner fills numbered slots one by one
 * from a bank of shuffled words, then checks the answer. Remount (key) it for every new question.
 */
export function ArrangeQuestion({
  question,
  picked,
  onPick,
}: ArrangeQuestionProps) {
  const { colors } = useTheme();
  const { t, language } = useLanguage();
  const { textAlign } = useDirection();
  const p = usePT();
  const arrange = question.arrange!;
  const total = arrange.words.length;
  const answered = picked !== null;
  const number = (value: number) => formatNumber(value, language);

  const [placed, setPlaced] = useState<(string | null)[]>(() =>
    arrange.words.map(() => null),
  );
  const [selected, setSelected] = useState<number | null>(null);

  const textOf = useMemo(() => {
    const map = new Map<string, string>();

    arrange.bank.forEach((item) => map.set(item.id, item.text));

    return map;
  }, [arrange.bank]);

  const used = useMemo(
    () => new Set(placed.filter((id): id is string => id !== null)),
    [placed],
  );
  const firstEmpty = placed.findIndex((id) => id === null);
  const complete = firstEmpty === -1;
  const target =
    selected !== null && placed[selected] === null ? selected : firstEmpty;
  const slotRight = placed.map(
    (id, index) => id !== null && textOf.get(id) === arrange.words[index],
  );
  const allRight = complete && slotRight.every(Boolean);

  const place = useCallback(
    (id: string) => {
      if (answered || target < 0) {
        return;
      }

      void Haptics.selectionAsync();
      setPlaced((previous) => {
        const next = previous.slice();

        next[target] = id;

        return next;
      });
      setSelected(null);
    },
    [answered, target],
  );

  const tapSlot = useCallback(
    (index: number) => {
      if (answered) {
        return;
      }

      if (placed[index] === null) {
        setSelected(index);

        return;
      }

      // Taking a word back: that slot becomes the next one to fill.
      void Haptics.selectionAsync();
      setPlaced((previous) => {
        const next = previous.slice();

        next[index] = null;

        return next;
      });
      setSelected(index);
    },
    [answered, placed],
  );

  const reset = useCallback(() => {
    if (answered) {
      return;
    }

    setPlaced(arrange.words.map(() => null));
    setSelected(null);
  }, [answered, arrange.words]);

  const check = useCallback(() => {
    if (answered || !complete) {
      return;
    }

    const right = placed.every(
      (id, index) => id !== null && textOf.get(id) === arrange.words[index],
    );
    const text = placed
      .map((id) => (id ? (textOf.get(id) ?? "") : ""))
      .join(" ");

    void Haptics.notificationAsync(
      right
        ? Haptics.NotificationFeedbackType.Success
        : Haptics.NotificationFeedbackType.Error,
    );
    onPick({ id: right ? "correct" : "wrong", text, arabic: true });
  }, [answered, arrange.words, complete, onPick, placed, textOf]);

  const mine = placed.map((id) => (id ? (textOf.get(id) ?? "") : "")).join(" ");
  const correctText = arrange.words.join(" ");

  return (
    <>
      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        <AppText
          variant="body"
          style={{ color: colors.text, fontWeight: "800", textAlign }}
        >
          {question.prompt}
        </AppText>

        {!answered ? (
          <AppText
            variant="caption"
            style={{ color: colors.textSecondary, textAlign }}
          >
            {target >= 0
              ? fill(t.quran_quiz_order_pick, {
                  n: number(target + 1),
                  total: number(total),
                })
              : t.quran_quiz_order_hint}
          </AppText>
        ) : null}

        <View style={styles.slots}>
          {placed.map((id, index) => {
            const word = id ? textOf.get(id) : undefined;
            const isTarget = !answered && index === target;
            const border = answered
              ? slotRight[index]
                ? GOOD
                : BAD
              : isTarget
                ? GOLD
                : id
                  ? colors.tint
                  : colors.track;

            return (
              <Pressable
                key={`slot-${index}`}
                accessibilityRole="button"
                accessibilityLabel={`${index + 1}${word ? ` ${word}` : ""}`}
                disabled={answered}
                onPress={() => tapSlot(index)}
                style={[
                  styles.slot,
                  {
                    borderColor: border,
                    borderStyle: id || answered ? "solid" : "dashed",
                    backgroundColor: answered
                      ? slotRight[index]
                        ? "rgba(47,179,138,0.16)"
                        : "rgba(214,69,69,0.14)"
                      : id
                        ? colors.tintSoft
                        : "transparent",
                  },
                ]}
              >
                <Text
                  allowFontScaling={false}
                  style={[styles.slotNumber, { color: colors.textSecondary }]}
                >
                  {number(index + 1)}
                </Text>
                {word ? (
                  <Text
                    allowFontScaling={false}
                    style={[styles.word, { color: colors.text }]}
                  >
                    {word}
                  </Text>
                ) : (
                  <Text allowFontScaling={false} style={styles.emptyWord}>
                    {" "}
                  </Text>
                )}
              </Pressable>
            );
          })}
        </View>

        {!answered ? (
          <View style={[styles.bank, { borderTopColor: colors.track }]}>
            {arrange.bank.map((item) => {
              const isUsed = used.has(item.id);

              return (
                <Pressable
                  key={item.id}
                  accessibilityRole="button"
                  accessibilityLabel={item.text}
                  disabled={isUsed}
                  onPress={() => place(item.id)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: colors.tintSoft,
                      opacity: isUsed ? 0.18 : 1,
                    },
                  ]}
                >
                  <Text
                    allowFontScaling={false}
                    style={[styles.word, { color: colors.text }]}
                  >
                    {item.text}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}

        {!answered ? (
          <View style={styles.actions}>
            {complete ? (
              <ChunkyButton
                label={t.quran_quiz_order_check ?? ""}
                onPress={check}
              />
            ) : null}
            {used.size > 0 ? (
              <Pressable
                accessibilityRole="button"
                onPress={reset}
                style={[styles.reset, { backgroundColor: colors.tintSoft }]}
              >
                <AppText
                  variant="bodySmall"
                  style={{ color: colors.text, fontWeight: "800" }}
                >
                  {t.quran_quiz_order_reset}
                </AppText>
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </View>

      {answered ? (
        <Rise>
          <View
            style={[
              styles.feedback,
              {
                backgroundColor: allRight
                  ? "rgba(47,179,138,0.14)"
                  : colors.highlightTint,
              },
            ]}
          >
            <AppText
              variant="bodySmall"
              style={{ color: colors.text, fontWeight: "800", textAlign }}
            >
              {allRight ? t.quran_quiz_correct : t.quran_quiz_wrong}
            </AppText>

            {!allRight ? (
              <View style={styles.compare}>
                <View style={[styles.compareBox, { borderColor: BAD }]}>
                  <AppText
                    variant="caption"
                    style={{ color: BAD, fontWeight: "800", textAlign }}
                  >
                    {p("your_answer")}
                  </AppText>
                  <Text
                    allowFontScaling={false}
                    style={[styles.compareText, { color: colors.text }]}
                  >
                    {mine}
                  </Text>
                </View>
                <View style={[styles.compareBox, { borderColor: GOOD }]}>
                  <AppText
                    variant="caption"
                    style={{ color: GOOD, fontWeight: "800", textAlign }}
                  >
                    {p("correct_answer")}
                  </AppText>
                  <Text
                    allowFontScaling={false}
                    style={[styles.compareText, { color: colors.text }]}
                  >
                    {correctText}
                  </Text>
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
  // Arabic reads right to left, so the first slot sits at the right edge.
  slots: {
    flexDirection: "row-reverse",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    gap: 8,
  },
  slot: {
    minWidth: 72,
    minHeight: 68,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  slotNumber: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "700",
  },
  bank: {
    flexDirection: "row-reverse",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  chip: {
    minHeight: 52,
    minWidth: 64,
    paddingHorizontal: 14,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  word: {
    fontFamily: "UthmanicHafs",
    fontSize: 22,
    lineHeight: 42,
    textAlign: "center",
    writingDirection: "rtl",
    includeFontPadding: false,
  },
  emptyWord: {
    fontSize: 22,
    lineHeight: 42,
  },
  actions: {
    gap: 10,
  },
  reset: {
    minHeight: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
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
  compareText: {
    fontFamily: "UthmanicHafs",
    fontSize: 20,
    lineHeight: 38,
    textAlign: "center",
    writingDirection: "rtl",
    includeFontPadding: false,
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

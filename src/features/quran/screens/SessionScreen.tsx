import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { useDirection } from "@/core/i18n/useDirection";
import { useLanguage } from "@/core/i18n/LanguageContext";
import { formatNumber } from "@/core/i18n/format";
import { useTheme } from "@/core/theme/ThemeContext";
import { AppText } from "@/shared/components/ui/AppText";
import { ChunkyButton } from "@/shared/components/ui/ChunkyButton";
import { GOLD, StarBadge } from "@/features/quran/components/QuranDecor";
import {
  Card,
  Chip,
  PillButton,
  ProgressBar,
  ScreenFrame,
} from "@/features/quran/components/PracticeChrome";
import { QuizQuestionCard } from "@/features/quran/components/QuizQuestionCard";
import { getSurah } from "@/features/quran/data/surahs";
import { VERSE_TEXT } from "@/features/quran/data/verseText";
import { usePT } from "@/features/quran/i18n/practice";
import { logAnswer, logAttempt } from "@/features/quran/state/practiceStore";
import {
  rangeOf,
  selectionOf,
  useScope,
} from "@/features/quran/state/scopeStore";
import { applyHideStyle, type HideStyle } from "@/features/quran/utils/hide";
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

type Phase = "loading" | "practice" | "quiz" | "result";
type Mode = "both" | "exam" | "practice";

/** Practice difficulty ramp: from the full verse to a fully hidden one. */
const LEVELS: readonly { key: string; style: HideStyle | null }[] = [
  { key: "full", style: null },
  { key: "alternate", style: "alternate" },
  { key: "letters", style: "letters" },
  { key: "all", style: "all" },
];

interface Answered {
  ayah: number;
  right: boolean;
}

export default function SessionScreen() {
  const { colors } = useTheme();
  const { t, language } = useLanguage();
  const { row, textAlign, isRTL } = useDirection();
  const router = useRouter();
  const p = usePT();
  const params = useLocalSearchParams<{ mode?: string }>();
  const mode: Mode =
    params.mode === "exam" || params.mode === "practice" ? params.mode : "both";
  const scope = useScope();
  const surahId = scope.surahId;
  const surah = getSurah(surahId);
  const verses = VERSE_TEXT[surahId];
  const range = rangeOf(scope, surahId);
  const ayahs = useMemo(() => selectionOf(scope, surahId), [scope, surahId]);
  const number = (value: number) => formatNumber(value, language);

  const [phase, setPhase] = useState<Phase>("loading");
  const [focus, setFocus] = useState<number[] | null>(null);
  const [index, setIndex] = useState(0);
  const [level, setLevel] = useState(mode === "both" ? 0 : 1);
  const [revealed, setRevealed] = useState<ReadonlySet<number>>(new Set());
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [qIndex, setQIndex] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Answered[]>([]);
  const [tallies, setTallies] = useState<KindTallies>({});

  const list = focus ?? ayahs;
  const ayah = list[index];
  const verse = ayah !== undefined ? verses?.[ayah - 1]?.ar : undefined;
  const hideStyle = LEVELS[level]?.style ?? null;
  const words = useMemo(
    () => (verse && hideStyle ? applyHideStyle(verse, hideStyle) : []),
    [hideStyle, verse],
  );

  const startExam = useCallback(() => {
    const count = Math.min(scope.questionCount, Math.max(ayahs.length * 3, 3));
    const built = buildQuiz(surahId, language, t, count, {
      kinds: ["order", "next", "number", "page", "line"],
      ayahs,
      lastAyah: range.to,
    });

    setQuestions(built);
    setQIndex(0);
    setPicked(null);
    setAnswers([]);
    setTallies({});
    setPhase("quiz");
  }, [ayahs, language, range.to, scope.questionCount, surahId, t]);

  useEffect(() => {
    if (!scope.loaded || phase !== "loading") {
      return;
    }

    if (mode === "exam") {
      startExam();
    } else {
      setIndex(0);
      setPhase("practice");
    }
  }, [mode, phase, scope.loaded, startExam]);

  const startPractice = useCallback((only: number[] | null) => {
    setFocus(only);
    setIndex(0);
    setRevealed(new Set());
    setLevel(1);
    setPhase("practice");
  }, []);

  const changeLevel = (delta: number) => {
    setLevel((value) => Math.min(Math.max(value + delta, 0), LEVELS.length - 1));
    setRevealed(new Set());
  };

  const move = (delta: number) => {
    setIndex((value) => Math.min(Math.max(value + delta, 0), list.length - 1));
    setRevealed(new Set());
  };

  const finishPractice = () => {
    if (mode === "practice") {
      router.replace("/scope");
    } else {
      startExam();
    }
  };

  const question = questions[qIndex];
  const answered = picked !== null;
  const isLastQuestion = qIndex + 1 >= questions.length;
  const score = answers.filter((item) => item.right).length;
  const percent =
    questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;
  const passed = percent >= scope.passPercent;

  const choose = useCallback(
    (option: QuizOption) => {
      if (!question || picked !== null) {
        return;
      }

      const right = option.id === question.correctId;

      setPicked(option.id);
      setTallies((previous) => addToTally(previous, question.kind, right));
      setAnswers((previous) => [
        ...previous,
        { ayah: question.ayah ?? 0, right },
      ]);
      void logAnswer(answerLogFor(surahId, question, option));
    },
    [picked, question, surahId],
  );

  const nextQuestion = useCallback(() => {
    if (!isLastQuestion) {
      setQIndex((value) => value + 1);
      setPicked(null);

      return;
    }

    void logAttempt({
      surahId,
      mode: "exam",
      score,
      total: questions.length,
      byKind: tallies,
    });
    setPhase("result");
  }, [isLastQuestion, questions.length, score, surahId, tallies]);

  const perAyah = useMemo(() => {
    const map = new Map<number, { right: number; total: number }>();

    answers.forEach((item) => {
      if (item.ayah === 0) {
        return;
      }

      const previous = map.get(item.ayah) ?? { right: 0, total: 0 };

      map.set(item.ayah, {
        right: previous.right + (item.right ? 1 : 0),
        total: previous.total + 1,
      });
    });

    return Array.from(map.entries()).sort((a, b) => a[0] - b[0]);
  }, [answers]);
  const missedAyahs = perAyah
    .filter(([, tally]) => tally.right < tally.total)
    .map(([item]) => item);

  const title =
    phase === "practice"
      ? p("session_practice_title")
      : p("session_exam_title");
  const emptyState = ayahs.length === 0 || !verses;

  if (phase === "loading" || emptyState || (phase === "quiz" && questions.length === 0)) {
    return (
      <ScreenFrame
        arabicTitle="الْجَلْسَةُ"
        title={title}
        subtitle=""
        backTo="/scope"
        compact
      >
        {phase === "loading" && !emptyState ? null : (
          <Card>
            <AppText
              variant="bodySmall"
              style={{ color: colors.textSecondary, textAlign: "center" }}
            >
              {p("session_empty")}
            </AppText>
            <PillButton
              label={p("session_back_scope")}
              onPress={() => router.replace("/scope")}
            />
          </Card>
        )}
      </ScreenFrame>
    );
  }

  return (
    <ScreenFrame
      arabicTitle="الْجَلْسَةُ"
      title={title}
      subtitle={`${p("scope_pass")}: ${number(scope.passPercent)}٪`}
      backTo="/scope"
      compact={phase !== "result"}
    >
      {phase === "practice" && verse && ayah !== undefined ? (
        <>
          <View style={[styles.progressRow, { flexDirection: row }]}>
            <AppText
              variant="caption"
              style={{ color: colors.textSecondary, fontWeight: "700" }}
            >
              {p("session_verse", { n: index + 1, total: list.length })}
            </AppText>
            <ProgressBar value={(index + 1) / list.length} color={GOLD} />
          </View>

          <Card>
            <View style={[styles.verseHeader, { flexDirection: row }]}>
              <Text
                allowFontScaling={false}
                style={[styles.surahName, { color: colors.text }]}
              >
                {surah?.name ?? ""}
              </Text>
              <View style={[styles.badge, { backgroundColor: colors.tintSoft }]}>
                <AppText
                  variant="caption"
                  style={{ color: colors.onTint, fontWeight: "800" }}
                >
                  {p("mistake_ayah", { ayah })}
                </AppText>
              </View>
            </View>

            <View style={styles.verseBox}>
              {hideStyle === null ? (
                <Text allowFontScaling={false} style={styles.verse}>
                  {verse}
                </Text>
              ) : (
                <View style={styles.words}>
                  {words.map((item, position) => {
                    const shown = !item.hidden || revealed.has(position);

                    return shown ? (
                      <Text key={position} allowFontScaling={false} style={styles.word}>
                        {item.word}
                      </Text>
                    ) : (
                      <Pressable
                        key={position}
                        accessibilityRole="button"
                        onPress={() => {
                          void Haptics.selectionAsync();
                          setRevealed((previous) => new Set(previous).add(position));
                        }}
                        style={[
                          styles.blank,
                          {
                            width: Math.max(44, Math.min(item.word.length * 9 + 20, 120)),
                            backgroundColor: colors.tintSoft,
                          },
                        ]}
                      >
                        {item.hint ? (
                          <Text allowFontScaling={false} style={styles.hint}>
                            {item.hint}
                          </Text>
                        ) : null}
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </View>

            {hideStyle !== null ? (
              <AppText
                variant="caption"
                style={{ color: colors.textSecondary, textAlign }}
              >
                {p("session_tap_hint")}
              </AppText>
            ) : null}

            <View style={[styles.chips, { flexDirection: row }]}>
              {LEVELS.map((item, position) => (
                <Chip
                  key={item.key}
                  label={p(`session_level_${item.key}`)}
                  active={level === position}
                  onPress={() => {
                    setLevel(position);
                    setRevealed(new Set());
                  }}
                />
              ))}
            </View>
            <View style={[styles.navRow, { flexDirection: row }]}>
              <View style={styles.navCell}>
                <PillButton
                  label={p("session_easier")}
                  onPress={() => changeLevel(-1)}
                />
              </View>
              <View style={styles.navCell}>
                <PillButton
                  label={p("session_harder")}
                  onPress={() => changeLevel(1)}
                />
              </View>
            </View>
          </Card>

          <View style={[styles.navRow, { flexDirection: row }]}>
            <View style={styles.navCell}>
              <PillButton label={p("session_prev")} onPress={() => move(-1)} />
            </View>
            <View style={styles.navCell}>
              {index + 1 < list.length ? (
                <PillButton label={p("session_next")} onPress={() => move(1)} />
              ) : null}
            </View>
          </View>
          {index + 1 >= list.length ? (
            <ChunkyButton
              label={mode === "practice" ? p("session_finish_practice") : p("session_to_exam")}
              onPress={finishPractice}
            />
          ) : mode !== "practice" ? (
            <PillButton label={p("session_to_exam")} onPress={finishPractice} />
          ) : null}
        </>
      ) : null}

      {phase === "quiz" && question ? (
        <>
          <View style={[styles.progressRow, { flexDirection: row }]}>
            <AppText
              variant="caption"
              style={{ color: colors.textSecondary, fontWeight: "700" }}
            >
              {t.quran_quiz_q_of
                ?.replace("{n}", number(qIndex + 1))
                .replace("{total}", number(questions.length))}
            </AppText>
            <ProgressBar
              value={(qIndex + (answered ? 1 : 0)) / questions.length}
              color={GOLD}
            />
          </View>

          <QuizQuestionCard question={question} picked={picked} onPick={choose} />

          {answered ? (
            <ChunkyButton
              label={(isLastQuestion ? t.quran_quiz_finish : t.quran_quiz_next) ?? ""}
              onPress={nextQuestion}
            />
          ) : null}
        </>
      ) : null}

      {phase === "result" ? (
        <Card>
          <AppText
            variant="body"
            style={{ color: colors.textSecondary, textAlign: "center" }}
          >
            {p("session_result")}
          </AppText>
          <View style={styles.stars}>
            {[1, 2, 3].map((value) => (
              <StarBadge
                key={value}
                size={value === 2 ? 64 : 52}
                color={GOLD}
                fillColor={
                  value <= starsFor(score, questions.length) ? GOLD : "transparent"
                }
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
            style={{ color: colors.textSecondary, textAlign: "center" }}
          >
            {p("session_percent", { percent: percent, pass: scope.passPercent })}
          </AppText>
          <AppText
            variant="bodySmall"
            style={{
              color: passed ? colors.success : colors.error,
              textAlign: "center",
              fontWeight: "800",
            }}
          >
            {passed ? p("session_passed") : p("session_failed")}
          </AppText>

          {perAyah.length > 0 ? (
            <>
              <AppText
                variant="bodySmall"
                style={{ color: colors.text, fontWeight: "800", textAlign }}
              >
                {p("session_breakdown")}
              </AppText>
              <View style={[styles.chips, { flexDirection: row }]}>
                {perAyah.map(([item, tally]) => {
                  const ok = tally.right === tally.total;

                  return (
                    <View
                      key={item}
                      style={[
                        styles.result,
                        { backgroundColor: ok ? colors.success : colors.error },
                      ]}
                    >
                      <AppText
                        variant="caption"
                        style={{ color: "#FFFFFF", fontWeight: "800" }}
                      >
                        {`${number(item)} · ${number(tally.right)}/${number(tally.total)}`}
                      </AppText>
                    </View>
                  );
                })}
              </View>
            </>
          ) : null}

          {missedAyahs.length > 0 ? (
            <ChunkyButton
              label={p("session_review_missed")}
              onPress={() => startPractice(missedAyahs)}
            />
          ) : null}
          <PillButton label={p("session_retry")} onPress={startExam} />
          <PillButton
            label={p("session_back_scope")}
            onPress={() => router.replace("/scope")}
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
  verseHeader: {
    alignItems: "center",
    justifyContent: "space-between",
  },
  surahName: {
    fontFamily: "UthmanicHafs",
    fontSize: 28,
    lineHeight: 48,
    includeFontPadding: false,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 14,
  },
  verseBox: {
    backgroundColor: "#FFFBEF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: GOLD,
    padding: 14,
    minHeight: 96,
    justifyContent: "center",
  },
  verse: {
    fontFamily: "UthmanicHafs",
    fontSize: 28,
    lineHeight: 54,
    color: "#14110D",
    textAlign: "center",
    writingDirection: "rtl",
    includeFontPadding: false,
  },
  words: {
    flexDirection: "row-reverse",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
    columnGap: 8,
    rowGap: 4,
  },
  word: {
    fontFamily: "UthmanicHafs",
    fontSize: 26,
    lineHeight: 50,
    color: "#14110D",
    includeFontPadding: false,
  },
  blank: {
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  hint: {
    fontFamily: "UthmanicHafs",
    fontSize: 24,
    lineHeight: 40,
    color: "#14110D",
    includeFontPadding: false,
  },
  chips: {
    flexWrap: "wrap",
    gap: 8,
  },
  navRow: {
    gap: 10,
  },
  navCell: {
    flex: 1,
  },
  stars: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "center",
    gap: 8,
  },
  result: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
});

import React, { useCallback, useMemo, useState } from "react";
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
import { getSurah } from "@/features/quran/data/surahs";
import { VERSE_TEXT } from "@/features/quran/data/verseText";
import { usePT } from "@/features/quran/i18n/practice";
import {
  logAnswer,
  logAttempt,
  usePractice,
} from "@/features/quran/state/practiceStore";
import { useQuranProgress } from "@/features/quran/state/QuranProgressContext";
import {
  HIDE_STYLES,
  applyHideStyle,
  type HideStyle,
} from "@/features/quran/utils/hide";
import { shuffle, starsFor } from "@/features/quran/utils/quiz";
import { weakAyahs } from "@/features/quran/utils/mastery";
import { getStage } from "@/features/quran/utils/stages";
import { GuideTarget } from "@/features/guide/guideTargets";

type Phase = "setup" | "run" | "result";
type Scope = "all" | "weak";

const MAX_PEEKS = 3;
const DEFAULT_COUNT = 8;

interface Outcome {
  ayah: number;
  right: boolean;
}

export default function RecallScreen() {
  const { colors } = useTheme();
  const { t, language } = useLanguage();
  const { row, textAlign } = useDirection();
  const router = useRouter();
  const p = usePT();
  const params = useLocalSearchParams<{
    ayah?: string;
    weak?: string;
    stage?: string;
  }>();
  const { mushaf, needsReview, recordFor } = useQuranProgress();
  const { mistakes } = usePractice();
  const surah = getSurah(mushaf.surahId);
  const verses = VERSE_TEXT[mushaf.surahId];
  const stage = getStage(Number(params.stage));
  const fromStage = stage?.recall === true;
  const number = (value: number) => formatNumber(value, language);

  const weak = useMemo(
    () => weakAyahs(mistakes, mushaf.surahId),
    [mistakes, mushaf.surahId],
  );
  const singleAyah = Number(params.ayah);
  const hasSingle =
    Number.isInteger(singleAyah) &&
    verses !== undefined &&
    singleAyah >= 1 &&
    singleAyah <= verses.length;

  const [phase, setPhase] = useState<Phase>("setup");
  const [style, setStyle] = useState<HideStyle>("all");
  const [scope, setScope] = useState<Scope>(
    params.weak === "1" && weak.length > 0 ? "weak" : "all",
  );
  const [queue, setQueue] = useState<number[]>([]);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState<ReadonlySet<number>>(new Set());
  const [checked, setChecked] = useState(false);
  const [outcomes, setOutcomes] = useState<Outcome[]>([]);

  const ayah = queue[index];
  const verse = ayah !== undefined ? verses?.[ayah - 1]?.ar : undefined;
  const cue = ayah !== undefined && ayah > 1 ? verses?.[ayah - 2]?.ar : undefined;
  const words = useMemo(
    () => (verse ? applyHideStyle(verse, style) : []),
    [style, verse],
  );
  const peeks = revealed.size;
  const peeksLeft = Math.max(MAX_PEEKS - peeks, 0);

  const start = useCallback(() => {
    if (!verses) {
      return;
    }

    let picked: number[];

    if (hasSingle && params.weak !== "1" && !fromStage) {
      picked = [singleAyah];
    } else {
      const pool =
        scope === "weak" && weak.length > 0
          ? weak
          : verses.map((_, position) => position + 1);
      const count = fromStage ? (stage?.length ?? DEFAULT_COUNT) : DEFAULT_COUNT;

      picked = shuffle(pool)
        .slice(0, count)
        .sort((a, b) => a - b);
    }

    setQueue(picked);
    setIndex(0);
    setRevealed(new Set());
    setChecked(false);
    setOutcomes([]);
    setPhase("run");
  }, [fromStage, hasSingle, params.weak, scope, singleAyah, stage, verses, weak]);

  const peek = useCallback(
    (position: number) => {
      if (checked || peeks >= MAX_PEEKS) {
        return;
      }

      void Haptics.selectionAsync();
      setRevealed((previous) => new Set(previous).add(position));
    },
    [checked, peeks],
  );

  const finish = useCallback(
    (all: Outcome[]) => {
      const right = all.filter((outcome) => outcome.right).length;

      void logAttempt({
        surahId: mushaf.surahId,
        mode: fromStage ? "stage" : "recall",
        stage: fromStage ? stage?.id : undefined,
        score: right,
        total: all.length,
        byKind: { recall: { right, total: all.length } },
      });
      setPhase("result");
    },
    [fromStage, mushaf.surahId, stage],
  );

  const grade = useCallback(
    (claimedRight: boolean) => {
      if (ayah === undefined || !verse) {
        return;
      }

      const right = claimedRight;
      const all = [...outcomes, { ayah, right }];

      void logAnswer({
        surahId: mushaf.surahId,
        questionId: `recall-${ayah}`,
        kind: "recall",
        ayah,
        right,
        correct: verse,
        arabic: true,
      });

      if (!right && recordFor(ayah)) {
        void needsReview(ayah);
      }

      setOutcomes(all);

      if (index + 1 < queue.length) {
        setIndex(index + 1);
        setRevealed(new Set());
        setChecked(false);
      } else {
        finish(all);
      }
    },
    [ayah, finish, index, mushaf.surahId, needsReview, outcomes, queue.length, recordFor, verse],
  );

  const score = outcomes.filter((outcome) => outcome.right).length;
  const missed = outcomes.filter((outcome) => !outcome.right).map((o) => o.ayah);
  const ratio = outcomes.length > 0 ? score / outcomes.length : 0;
  const message =
    ratio >= 0.85
      ? p("recall_msg_great")
      : ratio >= 0.55
        ? p("recall_msg_good")
        : p("recall_msg_try");
  const passed = fromStage && stage !== undefined && ratio >= stage.pass;
  const backTo = fromStage ? "/stages" : "/exam";

  if (!verses) {
    return (
      <ScreenFrame
        arabicTitle="مِنَ الْحِفْظِ"
        title={p("recall_title")}
        subtitle={p("recall_sub")}
        backTo={backTo}
      >
        <Card>
          <AppText
            variant="bodySmall"
            style={{ color: colors.textSecondary, textAlign: "center" }}
          >
            {p("recall_empty")}
          </AppText>
        </Card>
      </ScreenFrame>
    );
  }

  return (
    <ScreenFrame
      arabicTitle="مِنَ الْحِفْظِ"
      title={fromStage ? `${p("stage_n", { n: 4 })} — ${p("stage_4_name")}` : p("recall_title")}
      subtitle={p("recall_sub")}
      backTo={backTo}
      compact={phase === "run"}
    >
      {phase === "setup" ? (
        <Card>
          {surah ? (
            <Text
              allowFontScaling={false}
              style={[styles.surahName, { color: colors.text }]}
            >
              {surah.name}
            </Text>
          ) : null}

          <AppText
            variant="bodySmall"
            style={{ color: colors.text, fontWeight: "800", textAlign }}
          >
            {p("recall_style")}
          </AppText>
          <GuideTarget id="recall.style">
            <View style={[styles.chips, { flexDirection: row }]}>
              {HIDE_STYLES.map((item) => (
                <Chip
                  key={item}
                  label={p(`style_${item}`)}
                  active={style === item}
                  onPress={() => setStyle(item)}
                />
              ))}
            </View>
          </GuideTarget>

          {hasSingle && params.weak !== "1" && !fromStage ? (
            <AppText
              variant="caption"
              style={{ color: colors.textSecondary, textAlign }}
            >
              {p("mistake_ayah", { ayah: singleAyah })}
            </AppText>
          ) : (
            <>
              <AppText
                variant="bodySmall"
                style={{ color: colors.text, fontWeight: "800", textAlign }}
              >
                {p("recall_scope")}
              </AppText>
              <GuideTarget id="recall.scope">
                <View style={[styles.chips, { flexDirection: row }]}>
                  <Chip
                    label={p("scope_all")}
                    active={scope === "all"}
                    onPress={() => setScope("all")}
                  />
                  <Chip
                    label={p("scope_weak")}
                    active={scope === "weak"}
                    disabled={weak.length === 0}
                    onPress={() => setScope("weak")}
                  />
                </View>
              </GuideTarget>
              {weak.length === 0 ? (
                <AppText
                  variant="caption"
                  style={{ color: colors.textSecondary, textAlign }}
                >
                  {p("scope_weak_none")}
                </AppText>
              ) : null}
            </>
          )}

          <GuideTarget id="recall.start">
            <ChunkyButton label={p("recall_start")} onPress={start} />
          </GuideTarget>
        </Card>
      ) : null}

      {phase === "run" && verse ? (
        <>
          <View style={[styles.progressRow, { flexDirection: row }]}>
            <AppText
              variant="caption"
              style={{ color: colors.textSecondary, fontWeight: "700" }}
            >
              {p("recall_item", { n: index + 1, total: queue.length })}
            </AppText>
            <ProgressBar value={(index + (checked ? 1 : 0)) / queue.length} color={GOLD} />
          </View>

          <Card>
            <AppText
              variant="caption"
              style={{ color: colors.textSecondary, textAlign }}
            >
              {`${p("recall_prev")} · ${p("mistake_ayah", { ayah: ayah! })}`}
            </AppText>
            <View style={styles.cueBox}>
              {cue ? (
                <Text allowFontScaling={false} style={styles.cueText}>
                  {cue}
                </Text>
              ) : (
                <AppText
                  variant="bodySmall"
                  style={{ color: colors.textSecondary, textAlign: "center" }}
                >
                  {p("recall_first_cue")}
                </AppText>
              )}
            </View>

            <View style={styles.verseBox}>
              <View style={styles.words}>
                {words.map((item, position) => {
                  const shown = !item.hidden || checked || revealed.has(position);
                  const isHidden = item.hidden && !shown;

                  if (!item.hidden || shown) {
                    return (
                      <Text
                        key={position}
                        allowFontScaling={false}
                        style={[
                          styles.word,
                          item.hidden && checked && !revealed.has(position)
                            ? { color: colors.error }
                            : null,
                        ]}
                      >
                        {item.word}
                      </Text>
                    );
                  }

                  return (
                    <Pressable
                      key={position}
                      accessibilityRole="button"
                      accessibilityLabel={p("recall_peeks_left", { n: peeksLeft })}
                      disabled={!isHidden || peeksLeft === 0}
                      onPress={() => peek(position)}
                      style={[
                        styles.blank,
                        {
                          width: Math.max(44, Math.min(item.word.length * 9 + 20, 120)),
                          backgroundColor: colors.tintSoft,
                          opacity: peeksLeft === 0 ? 0.6 : 1,
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
            </View>

            {checked ? (
              <>
                <AppText
                  variant="caption"
                  style={{ color: colors.text, textAlign, fontWeight: "700" }}
                >
                  {p("recall_checked")}
                </AppText>
                <View style={[styles.gradeRow, { flexDirection: row }]}>
                  <View style={styles.gradeCell}>
                    <PillButton
                      tone="good"
                      label={p("recall_right")}
                      onPress={() => grade(true)}
                    />
                  </View>
                  <View style={styles.gradeCell}>
                    <PillButton
                      tone="bad"
                      label={p("recall_wrong")}
                      onPress={() => grade(false)}
                    />
                  </View>
                </View>
              </>
            ) : (
              <>
                <AppText
                  variant="caption"
                  style={{ color: colors.textSecondary, textAlign }}
                >
                  {`${p("recall_hint", { max: MAX_PEEKS })} ${p("recall_peeks_left", { n: peeksLeft })}`}
                </AppText>
                <ChunkyButton
                  label={p("recall_check")}
                  onPress={() => setChecked(true)}
                />
              </>
            )}
          </Card>
        </>
      ) : null}

      {phase === "result" ? (
        <Card>
          <AppText
            variant="body"
            style={{ color: colors.textSecondary, textAlign: "center" }}
          >
            {p("recall_result")}
          </AppText>
          <View style={styles.stars}>
            {[1, 2, 3].map((value) => (
              <StarBadge
                key={value}
                size={value === 2 ? 64 : 52}
                color={GOLD}
                fillColor={value <= starsFor(score, outcomes.length) ? GOLD : "transparent"}
              />
            ))}
          </View>
          <AppText
            variant="h1"
            style={{ color: colors.text, textAlign: "center", fontWeight: "800" }}
          >
            {`${number(score)} / ${number(outcomes.length)}`}
          </AppText>
          <AppText
            variant="bodySmall"
            style={{
              color: fromStage ? (passed ? colors.success : colors.textSecondary) : colors.textSecondary,
              textAlign: "center",
              fontWeight: fromStage ? "800" : "500",
            }}
          >
            {fromStage ? (passed ? p("stage_pass_last") : p("stage_fail_msg")) : message}
          </AppText>

          {missed.length > 0 ? (
            <>
              <AppText
                variant="bodySmall"
                style={{ color: colors.text, fontWeight: "800", textAlign }}
              >
                {p("recall_missed_title")}
              </AppText>
              <View style={[styles.chips, { flexDirection: row }]}>
                {missed.map((item) => (
                  <Chip
                    key={item}
                    label={p("mistake_ayah", { ayah: item })}
                    active={false}
                    onPress={() =>
                      router.replace({
                        pathname: "/memorize",
                        params: { ayah: String(item) },
                      })
                    }
                  />
                ))}
              </View>
            </>
          ) : null}

          <ChunkyButton label={p("recall_again")} onPress={start} />
          <PillButton
            label={fromStage ? p("stage_to_stages") : p("recall_back")}
            onPress={() => router.replace(backTo)}
          />
        </Card>
      ) : null}
    </ScreenFrame>
  );
}

const styles = StyleSheet.create({
  surahName: {
    fontFamily: "UthmanicHafs",
    fontSize: 36,
    lineHeight: 60,
    textAlign: "center",
    includeFontPadding: false,
  },
  chips: {
    flexWrap: "wrap",
    gap: 8,
  },
  progressRow: {
    alignItems: "center",
    gap: 10,
  },
  cueBox: {
    backgroundColor: "#FFFBEF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: GOLD,
    padding: 12,
    minHeight: 56,
    justifyContent: "center",
  },
  cueText: {
    fontFamily: "UthmanicHafs",
    fontSize: 20,
    lineHeight: 38,
    color: "#14110D",
    textAlign: "center",
    writingDirection: "rtl",
    includeFontPadding: false,
  },
  verseBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: GOLD,
    padding: 14,
    minHeight: 96,
    justifyContent: "center",
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
  gradeRow: {
    gap: 10,
  },
  gradeCell: {
    flex: 1,
  },
  stars: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "center",
    gap: 8,
  },
});

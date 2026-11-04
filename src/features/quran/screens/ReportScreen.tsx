import React, { useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { useDirection } from "@/core/i18n/useDirection";
import { useLanguage } from "@/core/i18n/LanguageContext";
import { formatNumber } from "@/core/i18n/format";
import { useTheme } from "@/core/theme/ThemeContext";
import { AppText } from "@/shared/components/ui/AppText";
import { ChunkyButton } from "@/shared/components/ui/ChunkyButton";
import { Rise } from "@/shared/motion/motion";
import {
  Card,
  ProgressBar,
  ScreenFrame,
} from "@/features/quran/components/PracticeChrome";
import { usePT } from "@/features/quran/i18n/practice";
import {
  isUnresolved,
  usePractice,
  type PracticeKind,
} from "@/features/quran/state/practiceStore";
import { useQuranProgress } from "@/features/quran/state/QuranProgressContext";
import {
  accuracyByKind,
  dailySeries,
  overallAccuracy,
  practiceStreak,
  weekTrend,
} from "@/features/quran/utils/analytics";
import {
  ayahMastery,
  levelFor,
  openMistakesByAyah,
  type MasteryLevel,
} from "@/features/quran/utils/mastery";
import { GuideTarget } from "@/features/guide/guideTargets";

const KINDS: readonly PracticeKind[] = [
  "fill",
  "next",
  "number",
  "concept",
  "recall",
];
const BAR_AREA = 80;

export default function ReportScreen() {
  const { colors } = useTheme();
  const { language } = useLanguage();
  const { row, textAlign } = useDirection();
  const router = useRouter();
  const p = usePT();
  const { mushaf, recordFor } = useQuranProgress();
  const { attempts, ayahStats, mistakes } = usePractice();
  const number = (value: number) => formatNumber(value, language);
  const locale = language === "fa" ? "fa-IR" : "en-US";

  const levelColor: Record<MasteryLevel, string> = {
    weak: colors.error,
    fair: colors.warning,
    good: "#7CC36B",
    mastered: colors.success,
  };

  const surahId = mushaf.surahId;
  const open = useMemo(
    () => openMistakesByAyah(mistakes, surahId),
    [mistakes, surahId],
  );
  const rows = mushaf.verses.map((verse) => {
    const record = recordFor(verse.ayah);
    const mastery = ayahMastery(
      record?.reviews,
      ayahStats[`${surahId}:${verse.ayah}`],
      open[verse.ayah] ?? 0,
    );

    return { ayah: verse.ayah, learned: record !== undefined, mastery };
  });
  const learnedCount = rows.filter((row_) => row_.learned).length;
  const overall =
    rows.length > 0
      ? rows.reduce((sum, item) => sum + item.mastery, 0) / rows.length
      : 0;
  const counts: Record<MasteryLevel, number> = {
    weak: 0,
    fair: 0,
    good: 0,
    mastered: 0,
  };

  rows.forEach((item) => {
    counts[levelFor(item.mastery)] += 1;
  });

  const weakest = rows
    .filter((item) => item.learned || (open[item.ayah] ?? 0) > 0)
    .sort((a, b) => a.mastery - b.mastery)
    .slice(0, 5);

  const surahAttempts = useMemo(
    () => attempts.filter((attempt) => attempt.surahId === surahId),
    [attempts, surahId],
  );
  const series = useMemo(() => dailySeries(surahAttempts, 7), [surahAttempts]);
  const trend = useMemo(() => weekTrend(surahAttempts), [surahAttempts]);
  const byKind = useMemo(() => accuracyByKind(surahAttempts), [surahAttempts]);
  const streak = useMemo(() => practiceStreak(attempts), [attempts]);
  const accuracy = overallAccuracy(surahAttempts);
  const questions = surahAttempts.reduce((sum, item) => sum + item.total, 0);
  const maxQuestions = Math.max(...series.map((point) => point.questions), 1);
  const unresolved = Object.values(mistakes).filter(
    (mistake) => mistake.surahId === surahId && isUnresolved(mistake),
  ).length;
  const level = levelFor(overall);

  const dayLabel = (time: number) => {
    try {
      return new Date(time).toLocaleDateString(locale, { weekday: "narrow" });
    } catch {
      return "";
    }
  };

  const trendText =
    trend.delta === null
      ? p("report_trend_none")
      : trend.delta > 0
        ? p("report_trend_up", { n: trend.delta })
        : trend.delta < 0
          ? p("report_trend_down", { n: Math.abs(trend.delta) })
          : p("report_trend_flat");
  const trendColor =
    trend.delta === null || trend.delta === 0
      ? colors.textSecondary
      : trend.delta > 0
        ? colors.success
        : colors.error;

  return (
    <ScreenFrame
      arabicTitle="تقرير الإتقان"
      title={p("report_title")}
      subtitle={p("report_sub")}
      backTo="/exam"
    >
      <Rise delay={100}>
        <GuideTarget id="report.mastery">
          <Card>
            <AppText
              variant="bodySmall"
              style={{ color: colors.textSecondary, textAlign }}
            >
              {p("report_mastery")}
            </AppText>
            <View style={[styles.bigRow, { flexDirection: row }]}>
              <AppText
                variant="display"
                style={{ color: levelColor[level], fontWeight: "800" }}
              >
                {`${number(Math.round(overall * 100))}٪`}
              </AppText>
              <View style={styles.bigMeta}>
                <AppText
                  variant="bodySmall"
                  style={{ color: colors.text, fontWeight: "800", textAlign }}
                >
                  {p(`level_${level}`)}
                </AppText>
                <AppText
                  variant="caption"
                  style={{ color: colors.textSecondary, textAlign }}
                >
                  {p("report_learned", { learned: learnedCount, total: rows.length })}
                </AppText>
              </View>
            </View>
            <ProgressBar value={overall} color={levelColor[level]} height={10} />

            <View style={[styles.legend, { flexDirection: row }]}>
              {(Object.keys(counts) as MasteryLevel[]).map((key) => (
                <View key={key} style={[styles.legendItem, { flexDirection: row }]}>
                  <View style={[styles.dot, { backgroundColor: levelColor[key] }]} />
                  <AppText variant="caption" style={{ color: colors.textSecondary }}>
                    {`${p(`level_${key}`)} ${number(counts[key])}`}
                  </AppText>
                </View>
              ))}
            </View>
            {unresolved > 0 ? (
              <AppText
                variant="caption"
                style={{ color: colors.error, fontWeight: "700", textAlign }}
              >
                {`${p("report_unresolved")}: ${number(unresolved)}`}
              </AppText>
            ) : null}
          </Card>
        </GuideTarget>
      </Rise>

      <Rise delay={160}>
        <GuideTarget id="report.grid">
          <Card>
            <AppText
              variant="bodySmall"
              style={{ color: colors.text, fontWeight: "800", textAlign }}
            >
              {p("report_grid")}
            </AppText>
            <AppText
              variant="caption"
              style={{ color: colors.textSecondary, textAlign }}
            >
              {p("report_grid_hint")}
            </AppText>
            <View style={[styles.grid, { flexDirection: row }]}>
              {rows.map((item) => (
                <Pressable
                  key={item.ayah}
                  accessibilityRole="button"
                  accessibilityLabel={p("mistake_ayah", { ayah: item.ayah })}
                  onPress={() =>
                    router.push({
                      pathname: "/memorize",
                      params: { ayah: String(item.ayah) },
                    })
                  }
                  style={[
                    styles.cell,
                    {
                      backgroundColor: item.learned || item.mastery > 0
                        ? levelColor[levelFor(item.mastery)]
                        : colors.track,
                      opacity: item.learned || item.mastery > 0 ? 1 : 0.8,
                    },
                  ]}
                >
                  <AppText
                    variant="caption"
                    style={{
                      color: item.learned || item.mastery > 0 ? "#FFFFFF" : colors.textSecondary,
                      fontWeight: "800",
                    }}
                  >
                    {number(item.ayah)}
                  </AppText>
                </Pressable>
              ))}
            </View>
          </Card>
        </GuideTarget>
      </Rise>

      {weakest.length > 0 ? (
        <Rise delay={200}>
          <GuideTarget id="report.weakest">
            <Card>
              <AppText
                variant="bodySmall"
                style={{ color: colors.text, fontWeight: "800", textAlign }}
              >
                {p("report_weakest")}
              </AppText>
              {weakest.map((item) => (
                <View key={item.ayah} style={[styles.weakRow, { flexDirection: row }]}>
                  <AppText
                    variant="caption"
                    style={{ color: colors.text, fontWeight: "700", width: 72, textAlign }}
                  >
                    {p("mistake_ayah", { ayah: item.ayah })}
                  </AppText>
                  <ProgressBar
                    value={item.mastery}
                    color={levelColor[levelFor(item.mastery)]}
                  />
                  <AppText
                    variant="caption"
                    style={{ color: colors.textSecondary, width: 40 }}
                  >
                    {`${number(Math.round(item.mastery * 100))}٪`}
                  </AppText>
                </View>
              ))}
              <ChunkyButton
                label={p("report_practice_weak")}
                onPress={() => router.push({ pathname: "/recall", params: { weak: "1" } })}
              />
            </Card>
          </GuideTarget>
        </Rise>
      ) : null}

      <Rise delay={240}>
        <GuideTarget id="report.progress">
          <Card>
            <AppText
              variant="bodySmall"
              style={{ color: colors.text, fontWeight: "800", textAlign }}
            >
              {p("report_progress")}
            </AppText>

            {surahAttempts.length === 0 ? (
              <AppText
                variant="caption"
                style={{ color: colors.textSecondary, textAlign: "center" }}
              >
                {p("report_no_data")}
              </AppText>
            ) : (
              <>
                <View style={[styles.stats, { flexDirection: row }]}>
                  <Stat label={p("report_attempts")} value={number(surahAttempts.length)} />
                  <Stat label={p("report_questions")} value={number(questions)} />
                  <Stat
                    label={p("report_overall_accuracy")}
                    value={accuracy === null ? "—" : `${number(Math.round(accuracy * 100))}٪`}
                  />
                </View>

                <AppText
                  variant="caption"
                  style={{ color: colors.textSecondary, textAlign }}
                >
                  {p("report_week")}
                </AppText>
                <View style={[styles.bars, { flexDirection: row }]}>
                  {series.map((point) => {
                    const barColor =
                      point.accuracy === null
                        ? colors.track
                        : point.accuracy >= 0.8
                          ? colors.success
                          : point.accuracy >= 0.55
                            ? colors.warning
                            : colors.error;

                    return (
                      <View key={point.day} style={styles.barColumn}>
                        <AppText
                          variant="caption"
                          style={{ color: colors.textSecondary, fontSize: 10, lineHeight: 14 }}
                        >
                          {point.accuracy === null
                            ? ""
                            : number(Math.round(point.accuracy * 100))}
                        </AppText>
                        <View style={[styles.barSlot, { height: BAR_AREA }]}>
                          <View
                            style={{
                              height: Math.max(
                                point.questions > 0
                                  ? (point.questions / maxQuestions) * BAR_AREA
                                  : 4,
                                4,
                              ),
                              borderRadius: 6,
                              backgroundColor: barColor,
                            }}
                          />
                        </View>
                        <AppText variant="caption" style={{ color: colors.textSecondary }}>
                          {dayLabel(point.day)}
                        </AppText>
                      </View>
                    );
                  })}
                </View>

                <AppText
                  variant="caption"
                  style={{ color: trendColor, fontWeight: "800", textAlign }}
                >
                  {trendText}
                </AppText>
                <AppText
                  variant="caption"
                  style={{ color: colors.textSecondary, textAlign }}
                >
                  {p("report_streak", { n: streak })}
                </AppText>

                <AppText
                  variant="bodySmall"
                  style={{ color: colors.text, fontWeight: "800", textAlign, marginTop: 6 }}
                >
                  {p("report_by_kind")}
                </AppText>
                {KINDS.map((kind) => {
                  const tally = byKind[kind];

                  if (!tally || tally.total === 0) {
                    return null;
                  }

                  const ratio = tally.right / tally.total;

                  return (
                    <View key={kind} style={[styles.kindRow, { flexDirection: row }]}>
                      <AppText
                        variant="caption"
                        style={{ color: colors.text, width: 76, textAlign }}
                      >
                        {p(`kind_${kind}`)}
                      </AppText>
                      <ProgressBar
                        value={ratio}
                        color={
                          ratio >= 0.8
                            ? colors.success
                            : ratio >= 0.55
                              ? colors.warning
                              : colors.error
                        }
                      />
                      <AppText
                        variant="caption"
                        style={{ color: colors.textSecondary, width: 44 }}
                      >
                        {`${number(Math.round(ratio * 100))}٪`}
                      </AppText>
                    </View>
                  );
                })}
              </>
            )}
          </Card>
        </GuideTarget>
      </Rise>
    </ScreenFrame>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme();

  return (
    <View style={[styles.stat, { backgroundColor: colors.tintSoft }]}>
      <AppText
        variant="h3"
        style={{ color: colors.onTint, fontWeight: "800", textAlign: "center" }}
      >
        {value}
      </AppText>
      <AppText
        variant="caption"
        style={{ color: colors.onTint, textAlign: "center" }}
      >
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  bigRow: {
    alignItems: "center",
    gap: 14,
  },
  bigMeta: {
    flex: 1,
    gap: 2,
  },
  legend: {
    flexWrap: "wrap",
    gap: 12,
  },
  legendItem: {
    alignItems: "center",
    gap: 6,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  grid: {
    flexWrap: "wrap",
    gap: 6,
  },
  cell: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  weakRow: {
    alignItems: "center",
    gap: 10,
  },
  stats: {
    gap: 8,
  },
  stat: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 6,
  },
  bars: {
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 6,
  },
  barColumn: {
    flex: 1,
    alignItems: "center",
    gap: 2,
  },
  barSlot: {
    width: "100%",
    justifyContent: "flex-end",
    paddingHorizontal: 6,
  },
  kindRow: {
    alignItems: "center",
    gap: 10,
  },
});

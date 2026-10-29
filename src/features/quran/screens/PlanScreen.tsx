import React, { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type ListRenderItemInfo,
} from "react-native";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  FileSpreadsheet,
  FileText,
  Pencil,
  Trash2,
  Undo2,
} from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDirection } from "@/core/i18n/useDirection";
import { useLanguage } from "@/core/i18n/LanguageContext";
import { formatNumber } from "@/core/i18n/format";
import { useTheme } from "@/core/theme/ThemeContext";
import { AppText } from "@/shared/components/ui/AppText";
import { ChunkyButton } from "@/shared/components/ui/ChunkyButton";
import { Rise } from "@/shared/motion/motion";
import { PageBanner } from "@/features/quran/components/QuranDecor";
import { hasMushafPage } from "@/features/quran/data/mushafPages";
import {
  calendarFor,
  formatDate,
  toCalendarDate,
  todayISO,
  weekdayName,
  weekdayOf,
  type ISODate,
} from "@/features/quran/plan/calendar";
import { MonthCalendar } from "@/features/quran/plan/components/MonthCalendar";
import {
  buildExportDoc,
  surahLabel,
} from "@/features/quran/plan/export/exportData";
import {
  formatSegments,
  nextSessionFrom,
  sessionOn,
  type PlanSession,
} from "@/features/quran/plan/planEngine";
import { useMemorizationPlan } from "@/features/quran/state/MemorizationPlanContext";
import { useQuranProgress } from "@/features/quran/state/QuranProgressContext";
import { fill } from "@/features/quran/utils/fill";

const PADDING = 20;

type View_ = "calendar" | "list";
type ExportKind = "pdf" | "excel";

export default function PlanScreen() {
  const { colors } = useTheme();
  const { t, language } = useLanguage();
  const { row, textAlign, isRTL } = useDirection();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { plan, built, isLoaded, isDone, toggleDone, removePlan } =
    useMemorizationPlan();
  const { setSurah } = useQuranProgress();
  const [view, setView] = useState<View_>("calendar");
  const [month, setMonth] = useState<{ y: number; m: number } | null>(null);
  const [selected, setSelected] = useState<ISODate | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [exporting, setExporting] = useState<ExportKind | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const number = (value: number) => formatNumber(value, language);
  const name = (id: number) => surahLabel(id, language);
  const kind = calendarFor(language);
  const BackIcon = isRTL ? ArrowRight : ArrowLeft;
  const today = todayISO();
  const sessions = useMemo(() => built?.sessions ?? [], [built]);
  const summary = built?.summary ?? null;
  const portion = (session: PlanSession["segments"]) =>
    formatSegments(session, number, name);

  // A month picked in one calendar means nothing in the other one.
  useEffect(() => {
    setMonth(null);
  }, [language]);

  const byDate = useMemo(
    () => new Map(sessions.map((session) => [session.date, session])),
    [sessions],
  );

  const anchor = useMemo(() => {
    if (!summary?.firstDate || !summary.lastDate) {
      return today;
    }

    if (today < summary.firstDate) {
      return summary.firstDate;
    }

    return today > summary.lastDate ? summary.lastDate : today;
  }, [summary, today]);

  const anchorMonth = toCalendarDate(anchor, kind);
  const viewMonth = month ?? { y: anchorMonth.y, m: anchorMonth.m };
  const firstMonth = toCalendarDate(summary?.firstDate ?? today, kind);
  const lastMonth = toCalendarDate(summary?.lastDate ?? today, kind);
  const monthIndex = viewMonth.y * 12 + viewMonth.m;

  const todayIndex = sessionOn(sessions, today);
  const nextIndex = nextSessionFrom(sessions, today);
  const defaultSelected =
    todayIndex >= 0
      ? today
      : nextIndex >= 0
        ? (sessions[nextIndex]?.date ?? null)
        : null;
  const activeDay = selected ?? defaultSelected;
  const activeSession = activeDay ? byDate.get(activeDay) : undefined;

  const doneCount = sessions.filter((session) => isDone(session.index)).length;
  const doneAyahs = sessions
    .filter((session) => isDone(session.index))
    .reduce((sum, session) => sum + session.count, 0);
  const behind = sessions.filter(
    (session) => session.date < today && !isDone(session.index),
  ).length;
  const allDone = sessions.length > 0 && doneCount === sessions.length;
  const progress = sessions.length > 0 ? doneCount / sessions.length : 0;

  const startMemorizing = (session: PlanSession) => {
    const target = session.segments.find((segment) =>
      hasMushafPage(segment.surahId),
    );

    if (!target) {
      return;
    }

    setSurah(target.surahId);
    router.push({
      pathname: "/memorize",
      params: { ayah: String(target.from) },
    });
  };

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/");
    }
  };

  const runExport = async (target: ExportKind) => {
    if (!plan || !built || exporting) {
      return;
    }

    setExporting(target);
    setMessage(null);

    try {
      // Loaded on demand so the plan screen opens even if a native module is missing.
      const { exportPlanExcel, exportPlanPdf } = await import(
        "@/features/quran/plan/export/exportPlan"
      );
      const doc = buildExportDoc({
        config: plan.config,
        sessions: built.sessions,
        summary: built.summary,
        done: plan.done,
        t,
        language,
        includeGregorian: target === "excel",
        today,
      });
      const result =
        target === "pdf"
          ? await exportPlanPdf(doc, "quran-plan")
          : await exportPlanExcel(doc, "quran-plan", {
              summary: t.plan_sheet_summary ?? "Summary",
              schedule: t.plan_sheet_schedule ?? "Schedule",
            });

      setMessage(
        result === "unavailable"
          ? (t.plan_export_unavailable ?? null)
          : result === "saved"
            ? (t.plan_export_saved ?? null)
            : null,
      );
    } catch (error) {
      console.error("[PLAN] Export failed:", error);
      setMessage(t.plan_export_error ?? null);
    } finally {
      setExporting(null);
    }
  };

  const renderSession = (
    session: PlanSession,
    heading: string,
    withActions = true,
  ) => {
    const canStart = session.segments.some((segment) =>
      hasMushafPage(segment.surahId),
    );
    const done = isDone(session.index);

    return (
      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        <AppText
          variant="caption"
          style={{ color: colors.textSecondary, textAlign, fontWeight: "700" }}
        >
          {heading}
        </AppText>
        <AppText
          variant="bodySmall"
          style={{ color: colors.text, textAlign, fontWeight: "800" }}
        >
          {`${weekdayName(language, weekdayOf(session.date))} · ${formatDate(session.date, language)}`}
        </AppText>
        <Text
          allowFontScaling={false}
          style={[styles.portion, { color: colors.text, textAlign }]}
        >
          {portion(session.segments)}
        </Text>
        <View style={[styles.metaRow, { flexDirection: row }]}>
          <View style={[styles.badge, { backgroundColor: colors.tintSoft }]}>
            <AppText
              variant="caption"
              style={{ color: colors.onTint, fontWeight: "700" }}
            >
              {`${number(session.count)} ${t.quran_verses_word}`}
            </AppText>
          </View>
          <AppText variant="caption" style={{ color: colors.textSecondary }}>
            {fill(t.plan_session_of, {
              n: number(session.index + 1),
              total: number(sessions.length),
            })}
          </AppText>
        </View>
        {session.review.length > 0 ? (
          <AppText
            variant="caption"
            style={{ color: colors.textSecondary, textAlign }}
          >
            {fill(t.plan_review_line, { portion: portion(session.review) })}
          </AppText>
        ) : null}
        {withActions ? (
          <View style={[styles.actions, { flexDirection: row }]}>
            {canStart && !done ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => startMemorizing(session)}
                style={[styles.action, { backgroundColor: colors.primary }]}
              >
                <AppText
                  variant="bodySmall"
                  style={{ color: colors.onPrimary, fontWeight: "800" }}
                >
                  {t.plan_start_memorizing}
                </AppText>
              </Pressable>
            ) : null}
            <Pressable
              accessibilityRole="button"
              onPress={() => void toggleDone(session.index)}
              style={[
                styles.action,
                { backgroundColor: done ? colors.track : colors.tintSoft },
              ]}
            >
              {done ? (
                <Undo2 size={16} color={colors.text} />
              ) : (
                <Check size={16} color={colors.onTint} strokeWidth={3} />
              )}
              <AppText
                variant="bodySmall"
                style={{
                  color: done ? colors.text : colors.onTint,
                  fontWeight: "800",
                }}
              >
                {done ? t.plan_mark_undone : t.plan_mark_done}
              </AppText>
            </Pressable>
          </View>
        ) : null}
      </View>
    );
  };

  const todayCard = () => {
    if (allDone) {
      return (
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <AppText
            variant="body"
            style={{ color: colors.text, textAlign, fontWeight: "800" }}
          >
            {t.plan_all_done}
          </AppText>
        </View>
      );
    }

    if (todayIndex >= 0) {
      return renderSession(sessions[todayIndex]!, t.plan_today ?? "");
    }

    if (nextIndex < 0) {
      return (
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <AppText
            variant="body"
            style={{ color: colors.text, textAlign, fontWeight: "800" }}
          >
            {t.plan_finished}
          </AppText>
        </View>
      );
    }

    const next = sessions[nextIndex]!;
    const notStarted = summary?.firstDate ? today < summary.firstDate : false;

    return (
      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        <AppText
          variant="caption"
          style={{ color: colors.textSecondary, textAlign, fontWeight: "700" }}
        >
          {t.plan_today}
        </AppText>
        <AppText
          variant="body"
          style={{ color: colors.text, textAlign, fontWeight: "800" }}
        >
          {notStarted
            ? fill(t.plan_before_start, {
                date: formatDate(next.date, language),
              })
            : t.plan_rest_day}
        </AppText>
        {!notStarted ? (
          <AppText
            variant="caption"
            style={{ color: colors.textSecondary, textAlign }}
          >
            {fill(t.plan_next_session, { date: formatDate(next.date, language) })}
          </AppText>
        ) : null}
      </View>
    );
  };

  const renderRow = ({ item }: ListRenderItemInfo<PlanSession>) => {
    const done = isDone(item.index);
    const isToday = item.date === today;

    return (
      <View
        style={[
          styles.listRow,
          {
            backgroundColor: done ? colors.mintTint : colors.surface,
            borderColor: isToday ? colors.primary : "transparent",
            flexDirection: row,
          },
        ]}
      >
        <View style={[styles.numberBadge, { backgroundColor: colors.tintSoft }]}>
          <AppText
            variant="caption"
            style={{ color: colors.onTint, fontWeight: "800" }}
          >
            {number(item.index + 1)}
          </AppText>
        </View>
        <View style={styles.listText}>
          <AppText
            variant="caption"
            style={{ color: colors.textSecondary, textAlign }}
          >
            {`${weekdayName(language, weekdayOf(item.date))} · ${formatDate(item.date, language)}`}
          </AppText>
          <Text
            allowFontScaling={false}
            style={[styles.rowPortion, { color: colors.text, textAlign }]}
          >
            {portion(item.segments)}
          </Text>
          {item.review.length > 0 ? (
            <AppText
              variant="caption"
              numberOfLines={1}
              style={{ color: colors.textSecondary, textAlign }}
            >
              {fill(t.plan_review_line, { portion: portion(item.review) })}
            </AppText>
          ) : null}
        </View>
        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: done }}
          accessibilityLabel={t.plan_mark_done}
          onPress={() => void toggleDone(item.index)}
          hitSlop={8}
          style={[
            styles.check,
            {
              borderColor: done ? colors.success : colors.primary,
              backgroundColor: done ? colors.success : "transparent",
            },
          ]}
        >
          {done ? <Check size={18} color="#FFFFFF" strokeWidth={3} /> : null}
        </Pressable>
      </View>
    );
  };

  const header = (
    <View style={styles.headerWrap}>
      <Rise>
        <View style={[styles.topRow, { flexDirection: row }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t.quran_back}
            onPress={goBack}
            style={[styles.iconButton, { backgroundColor: colors.surface }]}
          >
            <BackIcon size={22} color={colors.text} />
          </Pressable>
        </View>
      </Rise>

      <Rise delay={60}>
        <PageBanner
          width={width - PADDING * 2}
          background={colors.primary}
          arabicTitle="خُطَّةُ الْحِفْظِ"
          title={t.plan_title ?? ""}
          subtitle={t.plan_sub ?? ""}
          illustration="rehal"
          isRTL={isRTL}
        />
      </Rise>

      {!isLoaded ? null : !plan || !built || !summary ? (
        <Rise delay={120}>
          <View style={[styles.card, styles.empty, { backgroundColor: colors.surface }]}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.tintSoft }]}>
              <CalendarDays size={30} color={colors.onTint} />
            </View>
            <AppText
              variant="body"
              style={{ color: colors.text, fontWeight: "800", textAlign: "center" }}
            >
              {t.plan_empty_title}
            </AppText>
            <AppText
              variant="bodySmall"
              style={{ color: colors.textSecondary, textAlign: "center" }}
            >
              {t.plan_empty_text}
            </AppText>
            <ChunkyButton
              label={t.plan_create ?? ""}
              onPress={() => router.push("/plan-setup")}
              style={styles.fullWidth}
            />
          </View>
        </Rise>
      ) : (
        <>
          <Rise delay={110}>
            <View style={styles.stack}>
              {todayCard()}
              {behind > 0 && !allDone ? (
                <AppText
                  variant="caption"
                  style={{ color: colors.textSecondary, textAlign }}
                >
                  {fill(t.plan_behind, { count: number(behind) })}
                </AppText>
              ) : null}
            </View>
          </Rise>

          <Rise delay={150}>
            <View style={[styles.card, { backgroundColor: colors.surface }]}>
              <View style={[styles.track, { backgroundColor: colors.track }]}>
                <View
                  style={[
                    styles.fill,
                    {
                      backgroundColor: colors.success,
                      width: `${Math.round(progress * 100)}%`,
                    },
                  ]}
                />
              </View>
              <AppText
                variant="caption"
                style={{ color: colors.textSecondary, textAlign, fontWeight: "700" }}
              >
                {fill(t.plan_sum_progress_value, {
                  done: number(doneCount),
                  sessions: number(sessions.length),
                  ayahs: number(doneAyahs),
                  total: number(summary.totalAyahs),
                })}
              </AppText>
              <View style={[styles.statGrid, { flexDirection: row }]}>
                {[
                  {
                    label: t.plan_sum_per_session,
                    value:
                      summary.minPerSession === summary.maxPerSession
                        ? number(summary.maxPerSession)
                        : `${number(summary.minPerSession)}–${number(summary.maxPerSession)}`,
                  },
                  {
                    label: t.plan_sum_start,
                    value: summary.firstDate
                      ? formatDate(summary.firstDate, language)
                      : "—",
                  },
                  {
                    label: t.plan_sum_end,
                    value: summary.lastDate
                      ? formatDate(summary.lastDate, language)
                      : "—",
                  },
                ].map((item) => (
                  <View
                    key={item.label}
                    style={[styles.stat, { backgroundColor: colors.tintSoft }]}
                  >
                    <AppText
                      variant="caption"
                      style={{ color: colors.textSecondary, textAlign }}
                    >
                      {item.label}
                    </AppText>
                    <AppText
                      variant="bodySmall"
                      style={{ color: colors.text, fontWeight: "800", textAlign }}
                    >
                      {item.value}
                    </AppText>
                  </View>
                ))}
              </View>
            </View>
          </Rise>

          <Rise delay={190}>
            <View style={[styles.card, { backgroundColor: colors.surface }]}>
              <AppText
                variant="body"
                style={{ color: colors.text, textAlign, fontWeight: "800" }}
              >
                {t.plan_export}
              </AppText>
              <AppText
                variant="caption"
                style={{ color: colors.textSecondary, textAlign }}
              >
                {t.plan_export_hint}
              </AppText>
              <View style={[styles.actions, { flexDirection: row }]}>
                {(
                  [
                    { id: "pdf", label: t.plan_export_pdf, icon: FileText },
                    { id: "excel", label: t.plan_export_excel, icon: FileSpreadsheet },
                  ] as const
                ).map((item) => {
                  const Icon = item.icon;
                  const busy = exporting === item.id;

                  return (
                    <Pressable
                      key={item.id}
                      accessibilityRole="button"
                      accessibilityState={{ busy, disabled: exporting !== null }}
                      disabled={exporting !== null}
                      onPress={() => void runExport(item.id)}
                      style={[
                        styles.action,
                        {
                          backgroundColor: colors.tintSoft,
                          opacity: exporting && !busy ? 0.5 : 1,
                        },
                      ]}
                    >
                      <Icon size={18} color={colors.onTint} />
                      <AppText
                        variant="bodySmall"
                        style={{ color: colors.onTint, fontWeight: "800" }}
                      >
                        {busy ? t.plan_exporting : item.label}
                      </AppText>
                    </Pressable>
                  );
                })}
              </View>
              {message ? (
                <AppText
                  variant="caption"
                  accessibilityLiveRegion="polite"
                  style={{ color: colors.textSecondary, textAlign }}
                >
                  {message}
                </AppText>
              ) : null}
            </View>
          </Rise>

          <Rise delay={230}>
            <View
              style={[
                styles.segmented,
                { backgroundColor: colors.track, flexDirection: row },
              ]}
            >
              {(
                [
                  { id: "calendar", label: t.plan_view_calendar },
                  { id: "list", label: t.plan_view_list },
                ] as const
              ).map((item) => {
                const isSelected = view === item.id;

                return (
                  <Pressable
                    key={item.id}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: isSelected }}
                    onPress={() => setView(item.id)}
                    style={[
                      styles.segment,
                      isSelected && { backgroundColor: colors.surface },
                    ]}
                  >
                    <AppText
                      variant="bodySmall"
                      style={{
                        color: colors.text,
                        fontWeight: isSelected ? "800" : "500",
                      }}
                    >
                      {item.label}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>
          </Rise>

          {view === "calendar" ? (
            <View style={styles.stack}>
              <View style={[styles.card, { backgroundColor: colors.surface }]}>
                <MonthCalendar
                  year={viewMonth.y}
                  month={viewMonth.m}
                  onChangeMonth={(y, m) => setMonth({ y, m })}
                  onSelect={(iso) => setSelected(iso)}
                  canGoPrev={monthIndex > firstMonth.y * 12 + firstMonth.m}
                  canGoNext={monthIndex < lastMonth.y * 12 + lastMonth.m}
                  stateOf={(iso) => {
                    const session = byDate.get(iso);

                    return {
                      marked: session !== undefined,
                      done: session ? isDone(session.index) : false,
                      ring: iso === activeDay,
                    };
                  }}
                />
                <View style={[styles.legend, { flexDirection: row }]}>
                  {[
                    { color: colors.tint, label: t.plan_legend_session },
                    { color: colors.success, label: t.plan_legend_done },
                  ].map((item) => (
                    <View
                      key={item.label}
                      style={[styles.legendItem, { flexDirection: row }]}
                    >
                      <View style={[styles.dot, { backgroundColor: item.color }]} />
                      <AppText
                        variant="caption"
                        style={{ color: colors.textSecondary }}
                      >
                        {item.label}
                      </AppText>
                    </View>
                  ))}
                  <View style={[styles.legendItem, { flexDirection: row }]}>
                    <View
                      style={[
                        styles.dot,
                        { borderColor: colors.primary, borderWidth: 2 },
                      ]}
                    />
                    <AppText variant="caption" style={{ color: colors.textSecondary }}>
                      {t.plan_legend_today}
                    </AppText>
                  </View>
                </View>
              </View>

              {activeSession ? (
                renderSession(
                  activeSession,
                  activeSession.date === today
                    ? (t.plan_today ?? "")
                    : fill(t.plan_session_of, {
                        n: number(activeSession.index + 1),
                        total: number(sessions.length),
                      }),
                )
              ) : activeDay ? (
                <View style={[styles.card, { backgroundColor: colors.surface }]}>
                  <AppText
                    variant="bodySmall"
                    style={{ color: colors.textSecondary, textAlign }}
                  >
                    {`${formatDate(activeDay, language)} · ${t.plan_day_empty}`}
                  </AppText>
                </View>
              ) : null}
            </View>
          ) : null}
        </>
      )}
    </View>
  );

  const footer =
    plan && built ? (
      <View style={styles.footer}>
        <View style={[styles.actions, { flexDirection: row }]}>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push("/plan-setup")}
            style={[styles.action, { backgroundColor: colors.surface }]}
          >
            <Pencil size={16} color={colors.text} />
            <AppText
              variant="bodySmall"
              style={{ color: colors.text, fontWeight: "800" }}
            >
              {t.plan_edit}
            </AppText>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => setConfirmingDelete(true)}
            style={[styles.action, { backgroundColor: colors.surface }]}
          >
            <Trash2 size={16} color={colors.error} />
            <AppText
              variant="bodySmall"
              style={{ color: colors.error, fontWeight: "800" }}
            >
              {t.plan_delete}
            </AppText>
          </Pressable>
        </View>

        {confirmingDelete ? (
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <AppText
              variant="body"
              style={{ color: colors.text, textAlign, fontWeight: "800" }}
            >
              {t.plan_delete_title}
            </AppText>
            <AppText
              variant="bodySmall"
              style={{ color: colors.textSecondary, textAlign }}
            >
              {t.plan_delete_text}
            </AppText>
            <View style={[styles.actions, { flexDirection: row }]}>
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  setConfirmingDelete(false);
                  void removePlan();
                }}
                style={[styles.action, { backgroundColor: colors.error }]}
              >
                <AppText
                  variant="bodySmall"
                  style={{ color: "#FFFFFF", fontWeight: "800" }}
                >
                  {t.plan_confirm_delete}
                </AppText>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => setConfirmingDelete(false)}
                style={[styles.action, { backgroundColor: colors.track }]}
              >
                <AppText
                  variant="bodySmall"
                  style={{ color: colors.text, fontWeight: "800" }}
                >
                  {t.plan_cancel}
                </AppText>
              </Pressable>
            </View>
          </View>
        ) : null}
      </View>
    ) : null;

  return (
    <FlatList
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 16, paddingHorizontal: PADDING },
      ]}
      data={view === "list" && plan ? sessions : []}
      keyExtractor={(item) => String(item.index)}
      renderItem={renderRow}
      ListHeaderComponent={header}
      ListFooterComponent={footer}
      ItemSeparatorComponent={Separator}
      showsVerticalScrollIndicator={false}
      initialNumToRender={14}
      windowSize={9}
    />
  );
}

function Separator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 28,
  },
  headerWrap: {
    gap: 14,
    paddingBottom: 14,
  },
  topRow: {
    alignItems: "center",
    justifyContent: "space-between",
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  stack: {
    gap: 10,
  },
  card: {
    borderRadius: 24,
    padding: 16,
    gap: 8,
  },
  empty: {
    alignItems: "center",
    gap: 12,
    paddingVertical: 24,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  fullWidth: {
    alignSelf: "stretch",
  },
  portion: {
    fontFamily: "EstedadMedium",
    fontSize: 20,
    lineHeight: 34,
    includeFontPadding: false,
  },
  metaRow: {
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 14,
  },
  actions: {
    gap: 10,
    marginTop: 4,
  },
  action: {
    flex: 1,
    minHeight: 44,
    borderRadius: 22,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  track: {
    height: 10,
    borderRadius: 5,
    overflow: "hidden",
  },
  fill: {
    height: 10,
    borderRadius: 5,
  },
  statGrid: {
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
  },
  stat: {
    flexBasis: "30%",
    flexGrow: 1,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  segmented: {
    borderRadius: 22,
    padding: 4,
  },
  segment: {
    flex: 1,
    minHeight: 44,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  legend: {
    flexWrap: "wrap",
    gap: 14,
    marginTop: 8,
    justifyContent: "center",
  },
  legendItem: {
    alignItems: "center",
    gap: 6,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  listRow: {
    alignItems: "center",
    gap: 12,
    borderRadius: 20,
    borderWidth: 2,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  numberBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  listText: {
    flex: 1,
    gap: 0,
  },
  rowPortion: {
    fontFamily: "EstedadMedium",
    fontSize: 15,
    lineHeight: 26,
    includeFontPadding: false,
  },
  check: {
    width: 32,
    height: 32,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  separator: {
    height: 8,
  },
  footer: {
    gap: 12,
    paddingTop: 16,
  },
});

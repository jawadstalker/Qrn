import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Minus,
  Plus,
} from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDirection } from "@/core/i18n/useDirection";
import { useLanguage } from "@/core/i18n/LanguageContext";
import { formatNumber } from "@/core/i18n/format";
import { useTheme } from "@/core/theme/ThemeContext";
import { AppText } from "@/shared/components/ui/AppText";
import { ChunkyButton } from "@/shared/components/ui/ChunkyButton";
import { useSound } from "@/shared/audio/SoundContext";
import { getSurah } from "@/features/quran/data/surahs";
import {
  addDays,
  formatDate,
  todayISO,
  weekStartFor,
  weekdayName,
  weekdayOrder,
  type ISODate,
} from "@/features/quran/plan/calendar";
import {
  MAX_PER_DAY,
  buildPlan,
  defaultConfig,
  formatSegments,
  type PlanConfig,
  type PlanMode,
} from "@/features/quran/plan/planEngine";
import { DatePickerModal } from "@/features/quran/plan/components/DatePickerModal";
import { SurahPickerModal } from "@/features/quran/plan/components/SurahPickerModal";
import { surahLabel } from "@/features/quran/plan/export/exportData";
import { useMemorizationPlan } from "@/features/quran/state/MemorizationPlanContext";
import { useQuranProgress } from "@/features/quran/state/QuranProgressContext";
import { fill } from "@/features/quran/utils/fill";
import { GuideTarget, useGuideScroll } from "@/features/guide/guideTargets";

const PADDING = 20;
const QUICK_AMOUNTS = [3, 5, 10, 15, 20];
const HEAVY_SESSION = 15;
const JUZ_30 = Array.from({ length: 37 }, (_, i) => 78 + i);

type DateTarget = "start" | "target";

function Card({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: colors.surface }]}>
      {children}
    </View>
  );
}

function Stepper({
  value,
  min,
  max,
  label,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  label: string;
  onChange: (next: number) => void;
}) {
  const { colors } = useTheme();
  const { language } = useLanguage();
  const { row } = useDirection();
  const { play } = useSound();
  const step = (delta: number) => {
    const next = Math.min(Math.max(value + delta, min), max);

    if (next !== value) {
      play("tap");
      onChange(next);
    }
  };

  return (
    <View style={[styles.stepper, { flexDirection: row }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label} −`}
        disabled={value <= min}
        onPress={() => step(-1)}
        style={[
          styles.stepButton,
          { backgroundColor: colors.tintSoft, opacity: value <= min ? 0.35 : 1 },
        ]}
      >
        <Minus size={20} color={colors.onTint} />
      </Pressable>
      <AppText
        variant="h3"
        accessibilityLabel={`${label}: ${value}`}
        style={{ color: colors.text, fontWeight: "800", minWidth: 56, textAlign: "center" }}
      >
        {formatNumber(value, language)}
      </AppText>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label} +`}
        disabled={value >= max}
        onPress={() => step(1)}
        style={[
          styles.stepButton,
          { backgroundColor: colors.tintSoft, opacity: value >= max ? 0.35 : 1 },
        ]}
      >
        <Plus size={20} color={colors.onTint} />
      </Pressable>
    </View>
  );
}

function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const { play } = useSound();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={() => {
        play("select");
        onPress();
      }}
      style={[
        styles.chip,
        {
          backgroundColor: selected ? colors.primary : colors.tintSoft,
        },
      ]}
    >
      <AppText
        variant="bodySmall"
        style={{
          color: selected ? colors.onPrimary : colors.onTint,
          fontWeight: selected ? "800" : "600",
        }}
      >
        {label}
      </AppText>
    </Pressable>
  );
}

function SectionTitle({ children }: { children: string }) {
  const { colors } = useTheme();
  const { textAlign } = useDirection();

  return (
    <AppText
      variant="body"
      style={{ color: colors.text, textAlign, fontWeight: "800" }}
    >
      {children}
    </AppText>
  );
}

function Hint({ children }: { children: string }) {
  const { colors } = useTheme();
  const { textAlign } = useDirection();

  return (
    <AppText
      variant="caption"
      style={{ color: colors.textSecondary, textAlign }}
    >
      {children}
    </AppText>
  );
}

export default function PlanSetupScreen() {
  const { colors } = useTheme();
  const { t, language } = useLanguage();
  const { row, textAlign, isRTL } = useDirection();
  const insets = useSafeAreaInsets();
  const guideScroll = useGuideScroll();
  const router = useRouter();
  const { play } = useSound();
  const { plan, isLoaded, savePlan } = useMemorizationPlan();
  const { surahId: currentSurahId } = useQuranProgress();
  const number = (value: number) => formatNumber(value, language);
  const BackIcon = isRTL ? ArrowRight : ArrowLeft;
  const editing = plan !== null;

  const [config, setConfig] = useState<PlanConfig>(
    () => plan?.config ?? defaultConfig(todayISO()),
  );
  const [pickingSurahs, setPickingSurahs] = useState(false);
  const [pickingDate, setPickingDate] = useState<DateTarget | null>(null);
  const [saving, setSaving] = useState(false);
  const initialised = useRef(false);

  // The stored plan may arrive after the first render (cold start).
  useEffect(() => {
    if (isLoaded && !initialised.current) {
      initialised.current = true;

      if (plan) {
        setConfig(plan.config);
      }
    }
  }, [isLoaded, plan]);

  const update = (patch: Partial<PlanConfig>) =>
    setConfig((current) => ({ ...current, ...patch }));

  const reversed =
    config.surahIds.length > 1 &&
    config.surahIds[0]! > config.surahIds[config.surahIds.length - 1]!;

  const setSurahs = (ids: number[], reverse: boolean) => {
    const sorted = [...ids].sort((a, b) => a - b);

    update({
      surahIds: reverse ? sorted.reverse() : sorted,
      fromAyah: null,
      toAyah: null,
    });
  };

  const built = useMemo(() => buildPlan(config), [config]);
  const singleSurah =
    config.surahIds.length === 1 ? getSurah(config.surahIds[0]!) : undefined;
  const weekStart = weekStartFor(language);
  const name = (id: number) => surahLabel(id, language);
  const rangeFrom = config.fromAyah ?? 1;
  const rangeTo = config.toAyah ?? singleSurah?.verses ?? 1;

  const issueText = (issue: string) =>
    fill(t[`plan_issue_${issue}`], { max: number(MAX_PER_DAY) });
  const showHeavy =
    built.issues.length === 0 && built.summary.maxPerSession > HEAVY_SESSION;
  const showEarly =
    built.issues.length === 0 &&
    config.mode === "targetDate" &&
    config.targetDate !== null &&
    built.summary.lastDate !== null &&
    built.summary.lastDate < config.targetDate &&
    built.summary.maxPerSession === 1;

  const changeMode = (mode: PlanMode) => {
    update({
      mode,
      targetDate:
        mode === "targetDate"
          ? (config.targetDate ?? addDays(config.startDate, 30))
          : config.targetDate,
    });
  };

  const toggleWeekday = (day: number) =>
    update({
      weekdays: config.weekdays.includes(day)
        ? config.weekdays.filter((item) => item !== day)
        : [...config.weekdays, day],
    });

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/plan");
    }
  };

  const save = async () => {
    if (built.issues.length > 0 || saving) {
      return;
    }

    setSaving(true);
    await savePlan(config, false);
    play("success");
    router.replace("/plan");
  };

  const dateValue = pickingDate === "target" ? config.targetDate : config.startDate;

  return (
    <ScrollView
      {...guideScroll}
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 16, paddingHorizontal: PADDING },
      ]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.header, { flexDirection: row }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.quran_back}
          onPress={goBack}
          style={[styles.iconButton, { backgroundColor: colors.surface }]}
        >
          <BackIcon size={22} color={colors.text} />
        </Pressable>
        <AppText
          variant="h2"
          style={{ color: colors.text, fontWeight: "800", flex: 1, textAlign }}
        >
          {editing ? t.plan_setup_edit : t.plan_setup_new}
        </AppText>
      </View>

      <GuideTarget id="planSetup.what">
        <Card>
          <SectionTitle>{t.plan_step_what ?? ""}</SectionTitle>

          <Pressable
            accessibilityRole="button"
            onPress={() => setPickingSurahs(true)}
            style={[styles.field, { backgroundColor: colors.tintSoft, flexDirection: row }]}
          >
            <AppText
              variant="bodySmall"
              numberOfLines={2}
              style={{ color: colors.onTint, fontWeight: "700", flex: 1, textAlign }}
            >
              {config.surahIds.length > 0
                ? config.surahIds.length <= 3
                  ? config.surahIds.map(name).join(language === "fa" ? "، " : ", ")
                  : fill(t.plan_surahs_selected, {
                      count: number(config.surahIds.length),
                    })
                : t.plan_pick_surahs}
            </AppText>
            <Plus size={18} color={colors.onTint} />
          </Pressable>

          <View style={[styles.wrapRow, { flexDirection: row }]}>
            <Chip
              label={t.plan_preset_current ?? ""}
              selected={
                config.surahIds.length === 1 && config.surahIds[0] === currentSurahId
              }
              onPress={() => setSurahs([currentSurahId], false)}
            />
            <Chip
              label={t.plan_preset_juz30 ?? ""}
              selected={
                config.surahIds.length === JUZ_30.length &&
                config.surahIds.every((id) => JUZ_30.includes(id))
              }
              onPress={() => setSurahs(JUZ_30, reversed)}
            />
            <Chip
              label={t.plan_preset_clear ?? ""}
              selected={false}
              onPress={() => setSurahs([], false)}
            />
          </View>

          {config.surahIds.length > 1 ? (
            <View style={styles.block}>
              <Hint>{t.plan_order_label ?? ""}</Hint>
              <View
                style={[
                  styles.segmented,
                  { backgroundColor: colors.track, flexDirection: row },
                ]}
              >
                {[
                  { id: false, label: t.plan_order_quran },
                  { id: true, label: t.plan_order_reverse },
                ].map((item) => {
                  const selected = reversed === item.id;

                  return (
                    <Pressable
                      key={String(item.id)}
                      accessibilityRole="radio"
                      accessibilityState={{ selected }}
                      onPress={() => {
                        if (!selected) {
                          play("select");
                          update({ surahIds: [...config.surahIds].reverse() });
                        }
                      }}
                      style={[
                        styles.segment,
                        selected && { backgroundColor: colors.surface },
                      ]}
                    >
                      <AppText
                        variant="bodySmall"
                        style={{ color: colors.text, fontWeight: selected ? "800" : "500" }}
                      >
                        {item.label}
                      </AppText>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ) : null}

          {singleSurah ? (
            <View style={styles.block}>
              <Hint>{t.plan_range_title ?? ""}</Hint>
              <View style={[styles.rangeRow, { flexDirection: row }]}>
                <View style={styles.rangeItem}>
                  <Hint>{t.plan_range_from ?? ""}</Hint>
                  <Stepper
                    value={rangeFrom}
                    min={1}
                    max={singleSurah.verses}
                    label={t.plan_range_from ?? ""}
                    onChange={(next) =>
                      update({ fromAyah: next, toAyah: Math.max(rangeTo, next) })
                    }
                  />
                </View>
                <View style={styles.rangeItem}>
                  <Hint>{t.plan_range_to ?? ""}</Hint>
                  <Stepper
                    value={rangeTo}
                    min={rangeFrom}
                    max={singleSurah.verses}
                    label={t.plan_range_to ?? ""}
                    onChange={(next) => update({ toAyah: next })}
                  />
                </View>
              </View>
            </View>
          ) : null}
        </Card>
      </GuideTarget>

      <GuideTarget id="planSetup.how">
        <Card>
          <SectionTitle>{t.plan_step_how ?? ""}</SectionTitle>
          <View
            style={[
              styles.segmented,
              { backgroundColor: colors.track, flexDirection: row },
            ]}
          >
            {(
              [
                { id: "perDay", label: t.plan_mode_per_day },
                { id: "targetDate", label: t.plan_mode_target },
              ] as const
            ).map((item) => {
              const selected = config.mode === item.id;

              return (
                <Pressable
                  key={item.id}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  onPress={() => {
                    if (!selected) {
                      play("select");
                      changeMode(item.id);
                    }
                  }}
                  style={[
                    styles.segment,
                    selected && { backgroundColor: colors.surface },
                  ]}
                >
                  <AppText
                    variant="bodySmall"
                    style={{ color: colors.text, fontWeight: selected ? "800" : "500" }}
                  >
                    {item.label}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
          <Hint>
            {(config.mode === "perDay"
              ? t.plan_mode_per_day_hint
              : t.plan_mode_target_hint) ?? ""}
          </Hint>

          {config.mode === "perDay" ? (
            <View style={styles.block}>
              <Hint>{t.plan_per_day_label ?? ""}</Hint>
              <View style={styles.center}>
                <Stepper
                  value={config.perDay}
                  min={1}
                  max={MAX_PER_DAY}
                  label={t.plan_per_day_label ?? ""}
                  onChange={(next) => update({ perDay: next })}
                />
              </View>
              <View style={[styles.wrapRow, styles.centerRow, { flexDirection: row }]}>
                {QUICK_AMOUNTS.map((amount) => (
                  <Chip
                    key={amount}
                    label={number(amount)}
                    selected={config.perDay === amount}
                    onPress={() => update({ perDay: amount })}
                  />
                ))}
              </View>
            </View>
          ) : (
            <View style={styles.block}>
              <Hint>{t.plan_target_label ?? ""}</Hint>
              <Pressable
                accessibilityRole="button"
                onPress={() => setPickingDate("target")}
                style={[styles.field, { backgroundColor: colors.tintSoft, flexDirection: row }]}
              >
                <AppText
                  variant="bodySmall"
                  style={{ color: colors.onTint, fontWeight: "700", flex: 1, textAlign }}
                >
                  {config.targetDate
                    ? formatDate(config.targetDate, language)
                    : t.plan_pick_date}
                </AppText>
                <CalendarDays size={18} color={colors.onTint} />
              </Pressable>
            </View>
          )}

          <View style={styles.block}>
            <Hint>{t.plan_start_label ?? ""}</Hint>
            <Pressable
              accessibilityRole="button"
              onPress={() => setPickingDate("start")}
              style={[styles.field, { backgroundColor: colors.tintSoft, flexDirection: row }]}
            >
              <AppText
                variant="bodySmall"
                style={{ color: colors.onTint, fontWeight: "700", flex: 1, textAlign }}
              >
                {formatDate(config.startDate, language)}
              </AppText>
              <CalendarDays size={18} color={colors.onTint} />
            </Pressable>
          </View>
        </Card>
      </GuideTarget>

      <GuideTarget id="planSetup.days">
        <Card>
          <SectionTitle>{t.plan_days_label ?? ""}</SectionTitle>
          <View style={[styles.wrapRow, { flexDirection: row }]}>
            {weekdayOrder(weekStart).map((day) => (
              <Chip
                key={day}
                label={weekdayName(language, day)}
                selected={config.weekdays.includes(day)}
                onPress={() => toggleWeekday(day)}
              />
            ))}
          </View>
          <Hint>{t.plan_days_hint ?? ""}</Hint>

          <View style={[styles.switchRow, { flexDirection: row }]}>
            <View style={styles.switchText}>
              <AppText
                variant="bodySmall"
                style={{ color: colors.text, textAlign, fontWeight: "800" }}
              >
                {t.plan_review_label}
              </AppText>
              <Hint>{t.plan_review_hint ?? ""}</Hint>
            </View>
            <Switch
              value={config.review}
              onValueChange={(next) => {
                play("select");
                update({ review: next });
              }}
              accessibilityLabel={t.plan_review_label}
              trackColor={{ true: colors.primary, false: colors.track }}
              thumbColor="#FFFFFF"
            />
          </View>
        </Card>
      </GuideTarget>

      <GuideTarget id="planSetup.preview">
        <Card>
          <SectionTitle>{t.plan_preview ?? ""}</SectionTitle>

          {built.issues.length > 0 ? (
            <View style={styles.block}>
              {built.issues.map((issue) => (
                <AppText
                  key={issue}
                  variant="bodySmall"
                  style={{ color: colors.warning, textAlign, fontWeight: "700" }}
                >
                  {issueText(issue)}
                </AppText>
              ))}
            </View>
          ) : (
            <>
              <View style={[styles.statGrid, { flexDirection: row }]}>
                {[
                  {
                    label: t.plan_sum_sessions,
                    value: number(built.summary.sessionCount),
                  },
                  {
                    label: t.plan_sum_per_session,
                    value:
                      built.summary.minPerSession === built.summary.maxPerSession
                        ? number(built.summary.maxPerSession)
                        : `${number(built.summary.minPerSession)}–${number(built.summary.maxPerSession)}`,
                  },
                  {
                    label: t.plan_sum_end,
                    value: built.summary.lastDate
                      ? formatDate(built.summary.lastDate, language)
                      : "—",
                  },
                  {
                    label: t.plan_sum_total,
                    value: number(built.summary.totalAyahs),
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
              <Hint>
                {fill(t.plan_days_count, { count: number(built.summary.spanDays) })}
              </Hint>

              {built.sessions.slice(0, 3).map((session) => (
                <View
                  key={session.index}
                  style={[styles.previewRow, { flexDirection: row, borderColor: colors.border }]}
                >
                  <AppText
                    variant="caption"
                    style={{ color: colors.textSecondary, fontWeight: "700" }}
                  >
                    {formatDate(session.date, language)}
                  </AppText>
                  <Text
                    allowFontScaling={false}
                    numberOfLines={1}
                    style={[styles.previewPortion, { color: colors.text, textAlign }]}
                  >
                    {formatSegments(session.segments, number, name)}
                  </Text>
                </View>
              ))}

              {showHeavy ? (
                <AppText
                  variant="caption"
                  style={{ color: colors.warning, textAlign, fontWeight: "700" }}
                >
                  {fill(t.plan_heavy_warning, {
                    count: number(built.summary.maxPerSession),
                  })}
                </AppText>
              ) : null}
              {showEarly ? (
                <AppText
                  variant="caption"
                  style={{ color: colors.textSecondary, textAlign }}
                >
                  {t.plan_early_note}
                </AppText>
              ) : null}
            </>
          )}
        </Card>
      </GuideTarget>

      {editing && plan!.done.length > 0 ? (
        <Hint>{t.plan_edit_warning ?? ""}</Hint>
      ) : null}

      {built.issues.length === 0 ? (
        <GuideTarget id="planSetup.save">
          <ChunkyButton
            label={editing ? (t.plan_save_edit ?? "") : (t.plan_save ?? "")}
            onPress={() => void save()}
          />
        </GuideTarget>
      ) : (
        <View
          accessibilityRole="button"
          accessibilityState={{ disabled: true }}
          style={[styles.disabledButton, { backgroundColor: colors.track }]}
        >
          <AppText
            variant="button"
            style={{ color: colors.textSecondary, fontWeight: "800" }}
          >
            {editing ? t.plan_save_edit : t.plan_save}
          </AppText>
        </View>
      )}

      <SurahPickerModal
        visible={pickingSurahs}
        selected={config.surahIds}
        onConfirm={(ids) => {
          setSurahs(ids, reversed);
          setPickingSurahs(false);
        }}
        onClose={() => setPickingSurahs(false)}
      />
      <DatePickerModal
        visible={pickingDate !== null}
        value={dateValue ?? null}
        minDate={pickingDate === "target" ? config.startDate : undefined}
        onSelect={(iso: ISODate) =>
          pickingDate === "target"
            ? update({ targetDate: iso })
            : update({ startDate: iso })
        }
        onClose={() => setPickingDate(null)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 40,
    gap: 14,
  },
  header: {
    alignItems: "center",
    gap: 12,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    borderRadius: 22,
    padding: 16,
    gap: 10,
  },
  block: {
    gap: 6,
  },
  field: {
    minHeight: 48,
    borderRadius: 24,
    paddingHorizontal: 16,
    alignItems: "center",
    gap: 10,
  },
  wrapRow: {
    flexWrap: "wrap",
    gap: 8,
  },
  centerRow: {
    justifyContent: "center",
  },
  center: {
    alignItems: "center",
  },
  chip: {
    minHeight: 40,
    borderRadius: 20,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
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
    paddingHorizontal: 6,
  },
  stepper: {
    alignItems: "center",
    gap: 6,
  },
  stepButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  rangeRow: {
    gap: 12,
  },
  rangeItem: {
    flex: 1,
    gap: 4,
    alignItems: "center",
  },
  switchRow: {
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 4,
  },
  switchText: {
    flex: 1,
    gap: 2,
  },
  statGrid: {
    flexWrap: "wrap",
    gap: 8,
  },
  stat: {
    flexBasis: "48%",
    flexGrow: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  previewRow: {
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 8,
  },
  previewPortion: {
    flex: 1,
    fontFamily: "EstedadMedium",
    fontSize: 14,
  },
  disabledButton: {
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
});

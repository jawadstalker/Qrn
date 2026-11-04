import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Minus, Plus } from "lucide-react-native";
import { useDirection } from "@/core/i18n/useDirection";
import { useLanguage } from "@/core/i18n/LanguageContext";
import { formatNumber } from "@/core/i18n/format";
import { useTheme } from "@/core/theme/ThemeContext";
import { AppText } from "@/shared/components/ui/AppText";
import { ChunkyButton } from "@/shared/components/ui/ChunkyButton";
import { Rise } from "@/shared/motion/motion";
import {
  Card,
  Chip,
  PillButton,
  ScreenFrame,
} from "@/features/quran/components/PracticeChrome";
import { getSurah } from "@/features/quran/data/surahs";
import { usePT } from "@/features/quran/i18n/practice";
import {
  PASS_MARKS,
  QUESTION_COUNTS,
  SCOPE_SURAHS,
  rangeOf,
  selectionOf,
  setExamSettings,
  setScopeRange,
  setScopeSelection,
  setScopeSurah,
  toggleScopeAyah,
  totalVerses,
  useScope,
} from "@/features/quran/state/scopeStore";
import { useQuranProgress } from "@/features/quran/state/QuranProgressContext";
import { GuideTarget } from "@/features/guide/guideTargets";

function Stepper({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (next: number) => void;
}) {
  const { colors } = useTheme();
  const { language } = useLanguage();
  const { row } = useDirection();

  return (
    <View style={styles.stepper}>
      <AppText
        variant="caption"
        style={{ color: colors.textSecondary, textAlign: "center" }}
      >
        {label}
      </AppText>
      <View style={[styles.stepperRow, { flexDirection: row }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="-"
          disabled={value <= min}
          onPress={() => onChange(value - 1)}
          style={[
            styles.stepButton,
            { backgroundColor: colors.tintSoft, opacity: value <= min ? 0.4 : 1 },
          ]}
        >
          <Minus size={18} color={colors.onTint} />
        </Pressable>
        <AppText
          variant="h3"
          style={{ color: colors.text, fontWeight: "800", minWidth: 44, textAlign: "center" }}
        >
          {formatNumber(value, language)}
        </AppText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="+"
          disabled={value >= max}
          onPress={() => onChange(value + 1)}
          style={[
            styles.stepButton,
            { backgroundColor: colors.tintSoft, opacity: value >= max ? 0.4 : 1 },
          ]}
        >
          <Plus size={18} color={colors.onTint} />
        </Pressable>
      </View>
    </View>
  );
}

export default function ScopeScreen() {
  const { colors } = useTheme();
  const { language } = useLanguage();
  const { row, textAlign, isRTL } = useDirection();
  const router = useRouter();
  const p = usePT();
  const scope = useScope();
  const { mushaf, recordFor } = useQuranProgress();
  const number = (value: number) => formatNumber(value, language);

  const surahId = scope.surahId;
  const total = totalVerses(surahId);
  const { from, to } = rangeOf(scope, surahId);
  const selection = selectionOf(scope, surahId);
  const surah = getSurah(surahId);
  const inRange = Array.from({ length: to - from + 1 }, (_, index) => from + index);
  const learnedInApp =
    mushaf.surahId === surahId
      ? inRange.filter((ayah) => recordFor(ayah) !== undefined)
      : [];
  const ready = selection.length > 0;
  const questions = Math.min(scope.questionCount, Math.max(selection.length * 3, 3));

  const description = p("scope_desc_text", {
    surah: surah ? (isRTL ? surah.name : surah.transliteration) : surahId,
    from,
    to,
    count: selection.length,
    questions,
    pass: scope.passPercent,
  });

  const go = (mode: "both" | "exam" | "practice") =>
    router.push({ pathname: "/session", params: { mode } });

  return (
    <ScreenFrame
      arabicTitle="النِّطَاقُ"
      title={p("scope_title")}
      subtitle={p("scope_sub")}
      backTo="/exam"
    >
      <Rise delay={80}>
        <GuideTarget id="scope.range">
          <Card>
            <AppText
              variant="bodySmall"
              style={{ color: colors.text, fontWeight: "800", textAlign }}
            >
              {p("scope_surah")}
            </AppText>
            <View style={[styles.chips, { flexDirection: row }]}>
              {SCOPE_SURAHS.map((id) => {
                const info = getSurah(id);

                return (
                  <Chip
                    key={id}
                    label={info ? (isRTL ? info.name : info.transliteration) : String(id)}
                    active={id === surahId}
                    onPress={() => void setScopeSurah(id)}
                  />
                );
              })}
            </View>

            <AppText
              variant="bodySmall"
              style={{ color: colors.text, fontWeight: "800", textAlign }}
            >
              {p("scope_range")}
            </AppText>
            <View style={[styles.steppers, { flexDirection: row }]}>
              <Stepper
                label={p("scope_from")}
                value={from}
                min={1}
                max={to}
                onChange={(next) => void setScopeRange(surahId, next, to)}
              />
              <Stepper
                label={p("scope_to")}
                value={to}
                min={from}
                max={total}
                onChange={(next) => void setScopeRange(surahId, from, next)}
              />
            </View>
            <View style={[styles.chips, { flexDirection: row }]}>
              <Chip
                label={p("scope_whole")}
                active={from === 1 && to === total}
                onPress={() => void setScopeRange(surahId, 1, total)}
              />
            </View>
          </Card>
        </GuideTarget>
      </Rise>

      <Rise delay={140}>
        <GuideTarget id="scope.verses">
          <Card>
            <AppText
              variant="bodySmall"
              style={{ color: colors.text, fontWeight: "800", textAlign }}
            >
              {p("scope_memorized")}
            </AppText>
            <AppText
              variant="caption"
              style={{ color: colors.textSecondary, textAlign }}
            >
              {p("scope_memorized_hint")}
            </AppText>

            <View style={[styles.grid, { flexDirection: row }]}>
              {inRange.map((ayah) => {
                const on = selection.includes(ayah);

                return (
                  <Pressable
                    key={ayah}
                    accessibilityRole="button"
                    accessibilityState={{ selected: on }}
                    onPress={() => void toggleScopeAyah(surahId, ayah)}
                    style={[
                      styles.cell,
                      { backgroundColor: on ? colors.primary : colors.tintSoft },
                    ]}
                  >
                    <AppText
                      variant="caption"
                      style={{
                        color: on ? colors.onPrimary : colors.onTint,
                        fontWeight: "800",
                      }}
                    >
                      {number(ayah)}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>

            <View style={[styles.chips, { flexDirection: row }]}>
              <Chip
                label={p("scope_select_all")}
                active={false}
                onPress={() => void setScopeSelection(surahId, inRange)}
              />
              <Chip
                label={p("scope_none")}
                active={false}
                onPress={() => void setScopeSelection(surahId, [])}
              />
              {learnedInApp.length > 0 ? (
                <Chip
                  label={p("scope_app_learned")}
                  active={false}
                  onPress={() => void setScopeSelection(surahId, learnedInApp)}
                />
              ) : null}
            </View>
            <AppText
              variant="caption"
              style={{ color: ready ? colors.textSecondary : colors.error, textAlign }}
            >
              {ready ? p("scope_selected", { n: selection.length }) : p("scope_need_selection")}
            </AppText>
          </Card>
        </GuideTarget>
      </Rise>

      <Rise delay={200}>
        <GuideTarget id="scope.exam">
          <Card>
            <AppText
              variant="bodySmall"
              style={{ color: colors.text, fontWeight: "800", textAlign }}
            >
              {p("scope_exam_settings")}
            </AppText>
            <AppText variant="caption" style={{ color: colors.textSecondary, textAlign }}>
              {p("scope_questions")}
            </AppText>
            <View style={[styles.chips, { flexDirection: row }]}>
              {QUESTION_COUNTS.map((count) => (
                <Chip
                  key={count}
                  label={number(count)}
                  active={scope.questionCount === count}
                  onPress={() => void setExamSettings(count, scope.passPercent)}
                />
              ))}
            </View>
            <AppText variant="caption" style={{ color: colors.textSecondary, textAlign }}>
              {p("scope_pass")}
            </AppText>
            <View style={[styles.chips, { flexDirection: row }]}>
              {PASS_MARKS.map((mark) => (
                <Chip
                  key={mark}
                  label={`${number(mark)}٪`}
                  active={scope.passPercent === mark}
                  onPress={() => void setExamSettings(scope.questionCount, mark)}
                />
              ))}
            </View>

            <View style={[styles.descBox, { borderColor: colors.border }]}>
              <AppText
                variant="caption"
                style={{ color: colors.text, fontWeight: "800", textAlign }}
              >
                {p("scope_description")}
              </AppText>
              <AppText
                variant="caption"
                style={{ color: colors.textSecondary, textAlign, lineHeight: 22 }}
              >
                {description}
              </AppText>
            </View>
          </Card>
        </GuideTarget>
      </Rise>

      {ready ? (
        <>
          <GuideTarget id="scope.start">
            <ChunkyButton label={p("scope_start_both")} onPress={() => go("both")} />
          </GuideTarget>
          <PillButton label={p("scope_start_exam")} onPress={() => go("exam")} />
          <PillButton label={p("scope_start_practice")} onPress={() => go("practice")} />
        </>
      ) : null}
    </ScreenFrame>
  );
}

const styles = StyleSheet.create({
  chips: {
    flexWrap: "wrap",
    gap: 8,
  },
  steppers: {
    gap: 12,
  },
  stepper: {
    flex: 1,
    gap: 4,
  },
  stepperRow: {
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  stepButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
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
  descBox: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    gap: 4,
  },
});

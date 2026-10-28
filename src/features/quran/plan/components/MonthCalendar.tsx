import React, { useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { useDirection } from "@/core/i18n/useDirection";
import { useLanguage } from "@/core/i18n/LanguageContext";
import { formatNumber } from "@/core/i18n/format";
import { useTheme } from "@/core/theme/ThemeContext";
import { AppText } from "@/shared/components/ui/AppText";
import {
  calendarFor,
  formatDate,
  formatMonthTitle,
  monthGrid,
  shiftMonth,
  todayISO,
  weekStartFor,
  weekdayOrder,
  weekdayShort,
  type ISODate,
} from "@/features/quran/plan/calendar";

export interface DayState {
  /** A memorization day. */
  marked?: boolean;
  /** A memorization day that was checked as done. */
  done?: boolean;
  /** Filled with the primary color (used by the date picker). */
  selected?: boolean;
  /** Outlined, keeps the fill of a marked or done day (used by the plan view). */
  ring?: boolean;
  disabled?: boolean;
}

interface MonthCalendarProps {
  year: number;
  month: number;
  onChangeMonth: (year: number, month: number) => void;
  onSelect: (iso: ISODate) => void;
  stateOf: (iso: ISODate) => DayState;
  /** Months outside this range cannot be reached with the arrows. */
  canGoPrev?: boolean;
  canGoNext?: boolean;
}

const CELL_HEIGHT = 44;

export function MonthCalendar({
  year,
  month,
  onChangeMonth,
  onSelect,
  stateOf,
  canGoPrev = true,
  canGoNext = true,
}: MonthCalendarProps) {
  const { colors } = useTheme();
  const { t, language } = useLanguage();
  const { row, isRTL } = useDirection();
  const kind = calendarFor(language);
  const weekStart = weekStartFor(language);
  const today = todayISO();
  const weeks = useMemo(
    () => monthGrid(kind, year, month, weekStart),
    [kind, year, month, weekStart],
  );
  const PrevIcon = isRTL ? ChevronRight : ChevronLeft;
  const NextIcon = isRTL ? ChevronLeft : ChevronRight;

  const go = (delta: number) => {
    const next = shiftMonth(year, month, delta);

    onChangeMonth(next.y, next.m);
  };

  return (
    <View style={styles.wrapper}>
      <View style={[styles.header, { flexDirection: row }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.plan_prev_month}
          disabled={!canGoPrev}
          onPress={() => go(-1)}
          style={[
            styles.navButton,
            { backgroundColor: colors.tintSoft, opacity: canGoPrev ? 1 : 0.35 },
          ]}
        >
          <PrevIcon size={20} color={colors.onTint} />
        </Pressable>
        <AppText
          variant="body"
          style={{ color: colors.text, fontWeight: "800", textAlign: "center" }}
        >
          {formatMonthTitle(year, month, language, kind)}
        </AppText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.plan_next_month}
          disabled={!canGoNext}
          onPress={() => go(1)}
          style={[
            styles.navButton,
            { backgroundColor: colors.tintSoft, opacity: canGoNext ? 1 : 0.35 },
          ]}
        >
          <NextIcon size={20} color={colors.onTint} />
        </Pressable>
      </View>

      <View style={[styles.weekRow, { flexDirection: row }]}>
        {weekdayOrder(weekStart).map((day) => (
          <View key={day} style={styles.weekdayCell}>
            <AppText
              variant="caption"
              style={{ color: colors.textSecondary, fontWeight: "700" }}
            >
              {weekdayShort(language, day)}
            </AppText>
          </View>
        ))}
      </View>

      {weeks.map((week, weekIndex) => (
        <View key={weekIndex} style={[styles.weekRow, { flexDirection: row }]}>
          {week.map((cell, cellIndex) => {
            if (!cell) {
              return <View key={cellIndex} style={styles.cell} />;
            }

            const state = stateOf(cell.iso);
            const isToday = cell.iso === today;
            const filled = state.done || state.selected;
            const background = state.done
              ? colors.success
              : state.selected
                ? colors.primary
                : state.marked
                  ? colors.tint
                  : "transparent";
            const textColor = filled
              ? "#FFFFFF"
              : state.marked
                ? colors.onTint
                : colors.text;

            return (
              <View key={cellIndex} style={styles.cell}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={formatDate(cell.iso, language)}
                  accessibilityState={{
                    selected: Boolean(state.selected),
                    disabled: Boolean(state.disabled),
                  }}
                  disabled={state.disabled}
                  onPress={() => onSelect(cell.iso)}
                  style={[
                    styles.day,
                    {
                      backgroundColor: background,
                      borderColor: state.ring
                        ? colors.ink
                        : isToday
                          ? colors.primary
                          : "transparent",
                      opacity: state.disabled ? 0.3 : 1,
                    },
                  ]}
                >
                  <AppText
                    variant="bodySmall"
                    style={{
                      color: textColor,
                      fontWeight:
                        state.marked || state.selected || state.ring
                          ? "800"
                          : "500",
                    }}
                  >
                    {formatNumber(cell.day, language)}
                  </AppText>
                </Pressable>
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 4,
  },
  header: {
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  weekRow: {
    alignItems: "center",
  },
  weekdayCell: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 4,
  },
  cell: {
    flex: 1,
    height: CELL_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
  },
  day: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
});

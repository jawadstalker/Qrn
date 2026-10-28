import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react-native";
import { useDirection } from "@/core/i18n/useDirection";
import { useLanguage } from "@/core/i18n/LanguageContext";
import { formatNumber } from "@/core/i18n/format";
import { useTheme } from "@/core/theme/ThemeContext";
import { AppText } from "@/shared/components/ui/AppText";
import { todayISO } from "@/features/quran/plan/calendar";
import { surahLabel } from "@/features/quran/plan/export/exportData";
import { formatSegments, sessionOn } from "@/features/quran/plan/planEngine";
import { useMemorizationPlan } from "@/features/quran/state/MemorizationPlanContext";
import { fill } from "@/features/quran/utils/fill";

/** Garden shortcut: opens the plan and shows today's portion when there is one. */
export function PlanShortcutCard() {
  const { colors } = useTheme();
  const { t, language } = useLanguage();
  const { row, textAlign, isRTL } = useDirection();
  const router = useRouter();
  const { plan, built, isDone } = useMemorizationPlan();
  const Arrow = isRTL ? ChevronLeft : ChevronRight;

  let hint = t.plan_card_empty ?? "";

  if (plan && built) {
    const index = sessionOn(built.sessions, todayISO());
    const session = index >= 0 ? built.sessions[index] : undefined;

    hint = session
      ? isDone(session.index)
        ? (t.plan_mark_done ?? "")
        : fill(t.plan_card_today, {
            portion: formatSegments(
              session.segments,
              (value) => formatNumber(value, language),
              (id) => surahLabel(id, language),
            ),
          })
      : (t.plan_rest_day ?? "");
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t.plan_card_title}
      onPress={() => router.push("/plan")}
      style={[styles.card, { backgroundColor: colors.surface, flexDirection: row }]}
    >
      <View style={[styles.icon, { backgroundColor: colors.tint }]}>
        <CalendarDays size={22} color={colors.onTint} />
      </View>
      <View style={styles.text}>
        <AppText
          variant="bodySmall"
          style={{ color: colors.text, fontWeight: "800", textAlign }}
        >
          {t.plan_card_title}
        </AppText>
        <AppText
          variant="caption"
          numberOfLines={2}
          style={{ color: colors.textSecondary, textAlign }}
        >
          {hint}
        </AppText>
      </View>
      <Arrow size={20} color={colors.textSecondary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: "center",
    gap: 12,
    borderRadius: 22,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    flex: 1,
    gap: 2,
  },
});

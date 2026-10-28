import React, { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { useDirection } from "@/core/i18n/useDirection";
import { useTheme } from "@/core/theme/ThemeContext";
import { AppText } from "@/shared/components/ui/AppText";
import { ChunkyButton } from "@/shared/components/ui/ChunkyButton";
import {
  SectionStrip,
  StatusLegend,
} from "@/features/quran/components/SectionPractice";
import { useST } from "@/features/quran/i18n/sections";
import { useSectionData } from "@/features/quran/state/useSectionInfo";
import {
  STATUS_COLORS,
  statusCounts,
  weakestSection,
  type SectionInfo,
} from "@/features/quran/utils/sections";

/** Garden card: the colored sections of the active surah and a shortcut to the weakest one. */
export function SectionSummaryCard({
  onPractice,
}: {
  onPractice: (section: SectionInfo) => void;
}) {
  const { colors } = useTheme();
  const { textAlign } = useDirection();
  const st = useST();
  const { sections } = useSectionData();
  const counts = useMemo(() => statusCounts(sections), [sections]);
  const weakest = useMemo(() => weakestSection(sections), [sections]);
  const showWeak = weakest !== undefined && weakest.status !== "mastered";

  return (
    <View style={[styles.card, { backgroundColor: colors.surface }]}>
      <AppText
        variant="body"
        style={{ color: colors.text, fontWeight: "800", textAlign }}
      >
        {st("sec_garden_title")}
      </AppText>
      <SectionStrip
        sections={sections}
        selectedIndex={showWeak ? weakest.index : undefined}
        onSelect={onPractice}
      />
      <StatusLegend counts={counts} />
      {showWeak ? (
        <>
          <View style={styles.weakRow}>
            <View
              style={[
                styles.weakDot,
                { backgroundColor: STATUS_COLORS[weakest.status] },
              ]}
            />
            <AppText
              variant="bodySmall"
              style={{ color: colors.textSecondary, flex: 1, textAlign }}
            >
              {st("sec_garden_weak")}
            </AppText>
          </View>
          <ChunkyButton
            label={st("sec_garden_cta", { n: weakest.index + 1 })}
            onPress={() => onPractice(weakest)}
          />
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    padding: 16,
    gap: 12,
  },
  weakRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  weakDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
});

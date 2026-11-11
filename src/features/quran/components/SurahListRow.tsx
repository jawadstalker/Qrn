import React, { type ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useDirection } from "@/core/i18n/useDirection";
import { useLanguage } from "@/core/i18n/LanguageContext";
import { formatNumber } from "@/core/i18n/format";
import { useTheme } from "@/core/theme/ThemeContext";
import { AppText } from "@/shared/components/ui/AppText";
import {
  GOLD,
  GOLD_DARK,
  StarBadge,
} from "@/features/quran/components/QuranDecor";
import { type SurahInfo } from "@/features/quran/data/surahs";

interface SurahListRowProps {
  surah: SurahInfo;
  /** Second line under the name. Defaults to the transliteration and verse count. */
  subtitle?: string;
  /** Action buttons, laid out in a row on the trailing side. */
  children?: ReactNode;
}

/** One surah in the Favorites and Downloads lists, so both look and behave the same. */
export function SurahListRow({ surah, subtitle, children }: SurahListRowProps) {
  const { colors } = useTheme();
  const { t, language } = useLanguage();
  const { row, textAlign, isRTL } = useDirection();
  const number = (value: number) => formatNumber(value, language);

  return (
    <View
      style={[
        styles.row,
        { backgroundColor: colors.surface, flexDirection: row },
      ]}
    >
      <StarBadge
        size={40}
        label={number(surah.id)}
        color={GOLD}
        labelColor={GOLD_DARK}
      />

      <View style={styles.text}>
        <Text
          allowFontScaling={false}
          numberOfLines={1}
          style={[
            styles.arabicName,
            { color: colors.text, textAlign: isRTL ? "right" : "left" },
          ]}
        >
          {surah.name}
        </Text>
        <AppText
          variant="caption"
          numberOfLines={1}
          style={{ color: colors.textSecondary, textAlign }}
        >
          {subtitle ??
            `${surah.transliteration} · ${number(surah.verses)} ${t.quran_verses_word}`}
        </AppText>
      </View>

      <View style={[styles.actions, { flexDirection: row }]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    padding: 12,
    borderRadius: 18,
    alignItems: "center",
    gap: 10,
  },
  text: {
    flex: 1,
    gap: 2,
  },
  arabicName: {
    fontFamily: "UthmanicHafs",
    fontSize: 22,
    lineHeight: 34,
    includeFontPadding: false,
  },
  actions: {
    alignItems: "center",
    gap: 6,
  },
});

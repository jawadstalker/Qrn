import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { usePathname } from "expo-router";
import { Loader, Pause, Play, X } from "lucide-react-native";
import { useDirection } from "@/core/i18n/useDirection";
import { useLanguage } from "@/core/i18n/LanguageContext";
import { formatNumber } from "@/core/i18n/format";
import { normalizeRoute } from "@/core/navigation/routes";
import { useTheme } from "@/core/theme/ThemeContext";
import { AppText } from "@/shared/components/ui/AppText";
import { getReciter } from "@/features/quran/data/reciters";
import { getSurah } from "@/features/quran/data/surahs";
import { useRecitation } from "@/features/quran/state/RecitationContext";
import { fill } from "@/features/quran/utils/fill";
import { Crescent, GOLD } from "@/features/quran/components/QuranDecor";

/** Screens that show their own audio controls or need full focus. */
const HIDDEN_ROUTES = ["/listen", "/memorize", "/moment", "/quiz"];

export function MiniPlayer() {
  const { colors } = useTheme();
  const { t, language } = useLanguage();
  const { row, isRTL } = useDirection();
  const pathname = normalizeRoute(usePathname() || "/");
  const {
    target,
    playing,
    loading,
    failed,
    position,
    duration,
    reciterId,
    toggle,
    stop,
  } = useRecitation();

  if (!target || HIDDEN_ROUTES.includes(pathname)) {
    return null;
  }

  const surah = getSurah(target.surahId);
  const surahName = isRTL ? (surah?.name ?? "") : (surah?.transliteration ?? "");
  const title =
    target.kind === "ayah"
      ? fill(t.quran_mini_ayah, {
          surah: surahName,
          ayah: formatNumber(target.ayah, language),
        })
      : surahName;
  const reciter = getReciter(reciterId);
  const subtitle = failed
    ? t.quran_audio_error
    : loading
      ? t.quran_audio_loading
      : target.kind === "ayah"
        ? t.quran_mini_ayah_reciter
        : isRTL
          ? reciter.fa
          : reciter.en;
  const ratio = duration > 0 ? Math.min(position / duration, 1) : 0;
  const StateIcon = loading ? Loader : playing ? Pause : Play;

  return (
    <View
      style={[
        styles.bar,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <View style={[styles.track, { backgroundColor: colors.track }]}>
        <View
          style={[
            styles.fill,
            { backgroundColor: GOLD, width: `${Math.round(ratio * 100)}%` },
          ]}
        />
      </View>
      <View style={[styles.row, { flexDirection: row }]}>
        <View style={[styles.icon, { backgroundColor: colors.primary }]}>
          <Crescent size={24} color="#FFFBEF" />
        </View>
        <View style={styles.text}>
          <Text
            allowFontScaling={false}
            numberOfLines={1}
            style={[
              styles.title,
              {
                color: colors.text,
                fontFamily: isRTL ? "UthmanicHafs" : undefined,
                textAlign: isRTL ? "right" : "left",
              },
            ]}
          >
            {title}
          </Text>
          <AppText
            variant="caption"
            numberOfLines={1}
            style={{
              color: failed ? colors.error : colors.textSecondary,
              textAlign: isRTL ? "right" : "left",
            }}
          >
            {subtitle}
          </AppText>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={playing ? t.quran_pause : t.quran_play}
          onPress={toggle}
          hitSlop={6}
          style={[styles.button, { backgroundColor: colors.tint }]}
        >
          <StateIcon size={20} color={colors.onTint} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.quran_close}
          onPress={stop}
          hitSlop={6}
          style={styles.close}
        >
          <X size={18} color={colors.textSecondary} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    marginHorizontal: 12,
    marginBottom: 8,
    borderRadius: 18,
    borderWidth: 1,
    overflow: "hidden",
  },
  track: {
    height: 3,
  },
  fill: {
    height: 3,
  },
  row: {
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  icon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    lineHeight: 32,
    includeFontPadding: false,
  },
  button: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  close: {
    width: 28,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
});

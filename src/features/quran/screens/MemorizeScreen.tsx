import React, { useCallback, useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, ArrowRight } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDirection } from "@/core/i18n/useDirection";
import { useLanguage } from "@/core/i18n/LanguageContext";
import { formatNumber } from "@/core/i18n/format";
import { useTheme } from "@/core/theme/ThemeContext";
import { AppText } from "@/shared/components/ui/AppText";
import { ChunkyButton } from "@/shared/components/ui/ChunkyButton";
import { Mascot } from "@/shared/components/ui/Mascot";
import { Rise } from "@/shared/motion/motion";
import { MushafPage } from "@/features/quran/components/MushafPage";
import {
  PAGE1_SURAH_ID,
  PAGE1_VERSES,
} from "@/features/quran/data/mushafPage1";
import { getSurah } from "@/features/quran/data/surahs";
import { useQuranProgress } from "@/features/quran/state/QuranProgressContext";
import { fill } from "@/features/quran/utils/fill";

type Mode = "full" | "half" | "hidden";

const MODES: readonly Mode[] = ["full", "half", "hidden"];
const PADDING = 20;
const PAPER_PADDING = 14;
const TOTAL_VERSES = PAGE1_VERSES.length;
const MASCOT_SIZE = 84;

function hiddenIndicesFor(mode: Mode, currentAyah: number): Set<number> {
  const hidden = new Set<number>();

  if (mode === "full") {
    return hidden;
  }

  PAGE1_VERSES.forEach((verse) => {
    for (let index = verse.from; index < verse.to; index += 1) {
      if (index === verse.markerIndex) {
        continue;
      }

      const offset = index - verse.from;
      const hide =
        mode === "hidden" ||
        verse.ayah > currentAyah ||
        (verse.ayah === currentAyah && offset % 2 === 1);

      if (hide) {
        hidden.add(index);
      }
    }
  });

  return hidden;
}

export default function MemorizeScreen() {
  const { colors } = useTheme();
  const { t, language } = useLanguage();
  const { row, textAlign, isRTL } = useDirection();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const params = useLocalSearchParams<{ ayah?: string }>();
  const { currentAyah, recordFor, remember, needsReview } = useQuranProgress();
  const initial = Number(params.ayah);
  const [current, setCurrent] = useState(
    Number.isInteger(initial) && initial >= 1 && initial <= TOTAL_VERSES
      ? initial
      : currentAyah,
  );
  const [mode, setMode] = useState<Mode>("half");
  const [revealed, setRevealed] = useState<ReadonlySet<number>>(new Set());
  const number = (value: number) => formatNumber(value, language);
  const BackIcon = isRTL ? ArrowRight : ArrowLeft;
  const surah = getSurah(PAGE1_SURAH_ID);

  const hidden = useMemo(() => {
    const base = hiddenIndicesFor(mode, current);
    revealed.forEach((index) => base.delete(index));

    return base;
  }, [mode, current, revealed]);

  const changeMode = useCallback((next: Mode) => {
    setMode(next);
    setRevealed(new Set());
  }, []);

  const reveal = useCallback((index: number) => {
    setRevealed((previous) => new Set(previous).add(index));
  }, []);

  const goNext = useCallback(() => {
    setRevealed(new Set());
    setCurrent((value) => Math.min(value + 1, TOTAL_VERSES));
  }, []);

  const handleRemembered = useCallback(async () => {
    const result = await remember(current);

    if (result.becameLearned) {
      router.push({ pathname: "/moment", params: { ayah: String(current) } });
    }

    goNext();
  }, [current, goNext, remember, router]);

  const handleAgain = useCallback(async () => {
    await needsReview(current);
    goNext();
  }, [current, goNext, needsReview]);

  const pageWidth = width - PADDING * 2 - PAPER_PADDING * 2;

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 16, paddingHorizontal: PADDING },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <Rise>
        <View style={[styles.header, { flexDirection: row }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t.quran_back}
            onPress={() => router.replace("/")}
            style={[styles.iconButton, { backgroundColor: colors.surface }]}
          >
            <BackIcon size={22} color={colors.text} />
          </Pressable>
          <View style={styles.title}>
            <Text
              style={[styles.surahName, { color: colors.text }]}
              allowFontScaling={false}
            >
              {surah?.name}
            </Text>
            <AppText variant="caption" style={{ color: colors.textSecondary }}>
              {fill(t.quran_verses_range, {
                from: number(1),
                to: number(TOTAL_VERSES),
              })}
            </AppText>
          </View>
          <View style={styles.iconButton} />
        </View>
      </Rise>

      <Rise delay={80}>
        <View
          style={[
            styles.segmented,
            { backgroundColor: colors.tintSoft, flexDirection: row },
          ]}
        >
          {MODES.map((item) => {
            const selected = item === mode;

            return (
              <Pressable
                key={item}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                onPress={() => changeMode(item)}
                style={[
                  styles.segment,
                  selected && { backgroundColor: colors.surface },
                ]}
              >
                <AppText
                  variant="bodySmall"
                  style={{
                    color: colors.text,
                    fontWeight: selected ? "800" : "500",
                  }}
                >
                  {t[`quran_mode_${item}`]}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      </Rise>

      <Rise delay={160}>
        <View style={[styles.paper, { padding: PAPER_PADDING }]}>
          <MushafPage
            width={pageWidth}
            highlightAyah={current}
            hiddenIndices={hidden}
            onRevealWord={reveal}
            accessibilityLabel={t.quran_page_label ?? ""}
          />
        </View>
      </Rise>

      <Rise delay={220}>
        <View style={[styles.hintRow, { flexDirection: row }]}>
          <Mascot pose="wave" size={MASCOT_SIZE} />
          <View style={[styles.bubble, { backgroundColor: colors.surface }]}>
            <AppText
              variant="caption"
              style={{ color: colors.text, fontWeight: "700", textAlign }}
            >
              {mode === "full" ? t.quran_bubble : t.quran_tap_hint}
            </AppText>
          </View>
        </View>
      </Rise>

      <View style={[styles.dotsRow, { flexDirection: row }]}>
        <AppText variant="caption" style={{ color: colors.textSecondary }}>
          {fill(t.quran_verse_of, {
            ayah: number(current),
            total: number(TOTAL_VERSES),
          })}
        </AppText>
        {PAGE1_VERSES.map((verse) => {
          const learned = Boolean(recordFor(verse.ayah));
          const isCurrent = verse.ayah === current;

          return (
            <View
              key={verse.ayah}
              style={[
                styles.dot,
                {
                  backgroundColor: isCurrent
                    ? colors.highlight
                    : learned
                      ? colors.primary
                      : colors.tint,
                },
              ]}
            />
          );
        })}
      </View>

      <View style={[styles.actions, { flexDirection: row }]}>
        <Pressable
          accessibilityRole="button"
          onPress={() => void handleAgain()}
          style={[
            styles.secondary,
            { backgroundColor: colors.surface, shadowColor: colors.tint },
          ]}
        >
          <AppText
            variant="bodySmall"
            style={{ color: colors.text, fontWeight: "700" }}
          >
            {t.quran_again}
          </AppText>
        </Pressable>
        <View style={styles.primary}>
          <ChunkyButton
            label={t.quran_knew ?? ""}
            onPress={() => void handleRemembered()}
          />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 28,
    gap: 14,
  },
  header: {
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
  title: {
    alignItems: "center",
    flex: 1,
  },
  surahName: {
    fontFamily: "UthmanicHafs",
    fontSize: 26,
    lineHeight: 44,
    includeFontPadding: false,
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
  paper: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    alignItems: "center",
  },
  hintRow: {
    alignItems: "center",
    gap: 8,
  },
  bubble: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    flexShrink: 1,
  },
  dotsRow: {
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  actions: {
    gap: 12,
    alignItems: "flex-start",
  },
  secondary: {
    flex: 1,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  primary: {
    flex: 1.2,
  },
});

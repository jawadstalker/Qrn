import React, { useCallback, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { ChevronDown, ChevronUp, Pause, Play } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDirection } from "@/core/i18n/useDirection";
import { useLanguage } from "@/core/i18n/LanguageContext";
import { formatNumber } from "@/core/i18n/format";
import { useTheme } from "@/core/theme/ThemeContext";
import { AppText } from "@/shared/components/ui/AppText";
import { Rise } from "@/shared/motion/motion";
import {
  GOLD,
  GOLD_DARK,
  OrnamentDivider,
  PageBanner,
  StarBadge,
} from "@/features/quran/components/QuranDecor";
import {
  TAFSIR_SURAH_IDS,
  getTafsir,
  type TafsirSection,
} from "@/features/quran/data/tafsir";
import { getSurah } from "@/features/quran/data/surahs";
import { VERSE_TEXT } from "@/features/quran/data/verseText";
import { useQuranProgress } from "@/features/quran/state/QuranProgressContext";
import { useRecitation } from "@/features/quran/state/RecitationContext";
import { fill } from "@/features/quran/utils/fill";

const PADDING = 20;

export default function TafsirScreen() {
  const { colors } = useTheme();
  const { t, language } = useLanguage();
  const { row, textAlign, isRTL } = useDirection();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { surahId: activeSurah } = useQuranProgress();
  const { target, playing, toggle, playSurah } = useRecitation();
  const [selected, setSelected] = useState(
    TAFSIR_SURAH_IDS.includes(activeSurah)
      ? activeSurah
      : (TAFSIR_SURAH_IDS[0] ?? activeSurah),
  );
  const [open, setOpen] = useState<ReadonlySet<number>>(new Set([0]));
  const number = (value: number) => formatNumber(value, language);
  const tafsir = getTafsir(selected);
  const surah = getSurah(selected);
  const verses = VERSE_TEXT[selected];
  const isThisPlaying =
    target?.kind === "surah" && target.surahId === selected && playing;
  const isThisLoaded = target?.kind === "surah" && target.surahId === selected;

  const choose = useCallback((id: number) => {
    setSelected(id);
    setOpen(new Set([0]));
  }, []);

  const toggleSection = useCallback((index: number) => {
    setOpen((previous) => {
      const next = new Set(previous);

      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }

      return next;
    });
  }, []);

  const listen = useCallback(() => {
    if (isThisLoaded) {
      toggle();
    } else {
      playSurah(selected);
    }
  }, [isThisLoaded, playSurah, selected, toggle]);

  const rangeLabel = (section: TafsirSection) =>
    section.from === section.to
      ? fill(t.quran_verse_single, { ayah: number(section.from) })
      : fill(t.quran_verses_range, {
          from: number(section.from),
          to: number(section.to),
        });

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
        <PageBanner
          width={width - PADDING * 2}
          background={colors.primary}
          arabicTitle="التفسير"
          title={t.quran_tafsir_title ?? ""}
          subtitle={t.quran_tafsir_sub ?? ""}
          illustration="rehal"
          isRTL={isRTL}
        />
      </Rise>

      <Rise delay={60}>
        <View
          style={[
            styles.segmented,
            { backgroundColor: colors.tintSoft, flexDirection: row },
          ]}
        >
          {TAFSIR_SURAH_IDS.map((id) => {
            const item = getSurah(id);
            const isSelected = id === selected;

            return (
              <Pressable
                key={id}
                accessibilityRole="radio"
                accessibilityState={{ selected: isSelected }}
                onPress={() => choose(id)}
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
                  {isRTL ? item?.name : item?.transliteration}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      </Rise>

      {tafsir && surah ? (
        <>
          <Rise delay={120}>
            <View style={[styles.card, { backgroundColor: colors.surface }]}>
              <View style={[styles.surahRow, { flexDirection: row }]}>
                <StarBadge
                  size={52}
                  label={number(surah.id)}
                  color={GOLD}
                  labelColor={GOLD_DARK}
                />
                <View style={styles.surahText}>
                  <Text
                    allowFontScaling={false}
                    style={[
                      styles.surahName,
                      { color: colors.text, textAlign: isRTL ? "right" : "left" },
                    ]}
                  >
                    {surah.name}
                  </Text>
                  <AppText
                    variant="caption"
                    style={{ color: colors.textSecondary, textAlign }}
                  >
                    {`${surah.transliteration} · ${number(surah.verses)} ${t.quran_verses_word} · ${
                      tafsir.revelation === "meccan"
                        ? t.quran_revelation_meccan
                        : t.quran_revelation_medinan
                    }`}
                  </AppText>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t.quran_listen_surah}
                  onPress={listen}
                  style={[styles.listenButton, { backgroundColor: colors.primary }]}
                >
                  {isThisPlaying ? (
                    <Pause size={20} color={colors.onPrimary} />
                  ) : (
                    <Play size={20} color={colors.onPrimary} />
                  )}
                </Pressable>
              </View>
              <OrnamentDivider />
              <AppText
                variant="bodySmall"
                style={{ color: colors.text, textAlign, lineHeight: 26 }}
              >
                {tafsir.intro[language]}
              </AppText>
            </View>
          </Rise>

          {tafsir.sections.map((section, index) => {
            const isOpen = open.has(index);
            const Chevron = isOpen ? ChevronUp : ChevronDown;
            const sectionVerses = Array.from(
              { length: section.to - section.from + 1 },
              (_, offset) => section.from + offset,
            );

            return (
              <Rise key={`${selected}-${section.from}`} delay={160 + index * 40}>
                <View style={[styles.card, { backgroundColor: colors.surface }]}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ expanded: isOpen }}
                    onPress={() => toggleSection(index)}
                    style={[styles.sectionHeader, { flexDirection: row }]}
                  >
                    <View
                      style={[styles.rangeChip, { backgroundColor: colors.tint }]}
                    >
                      <AppText
                        variant="caption"
                        style={{ color: colors.onTint, fontWeight: "700" }}
                      >
                        {rangeLabel(section)}
                      </AppText>
                    </View>
                    <AppText
                      variant="body"
                      style={{
                        color: colors.text,
                        fontWeight: "800",
                        flex: 1,
                        textAlign,
                      }}
                    >
                      {section.title[language]}
                    </AppText>
                    <Chevron size={20} color={colors.textSecondary} />
                  </Pressable>

                  {isOpen ? (
                    <View style={styles.sectionBody}>
                      <View style={[styles.versesBox, { backgroundColor: "#FFFBEF" }]}>
                        {sectionVerses.map((ayah) => {
                          const text = verses?.[ayah - 1];

                          if (!text) {
                            return null;
                          }

                          return (
                            <View key={ayah} style={styles.verse}>
                              <View style={styles.verseRow}>
                                <StarBadge
                                  size={28}
                                  label={number(ayah)}
                                  color={GOLD}
                                  labelColor={GOLD_DARK}
                                />
                                <Text
                                  allowFontScaling={false}
                                  style={styles.arabic}
                                >
                                  {text.ar}
                                </Text>
                              </View>
                              {language === "en" ? (
                                <AppText
                                  variant="caption"
                                  forceEnglish
                                  style={styles.translation}
                                >
                                  {text.en}
                                </AppText>
                              ) : null}
                            </View>
                          );
                        })}
                      </View>
                      <AppText
                        variant="bodySmall"
                        style={{ color: colors.text, textAlign, lineHeight: 26 }}
                      >
                        {section.text[language]}
                      </AppText>
                    </View>
                  ) : null}
                </View>
              </Rise>
            );
          })}

          <Rise delay={420}>
            <View style={[styles.card, { backgroundColor: colors.surface }]}>
              <AppText
                variant="body"
                style={{ color: colors.text, fontWeight: "800", textAlign }}
              >
                {t.quran_tafsir_lessons}
              </AppText>
              {tafsir.lessons[language].map((lesson) => (
                <View key={lesson} style={[styles.lessonRow, { flexDirection: row }]}>
                  <StarBadge size={16} color={GOLD} fillColor={GOLD} />
                  <AppText
                    variant="bodySmall"
                    style={{ color: colors.text, textAlign, flex: 1, lineHeight: 24 }}
                  >
                    {lesson}
                  </AppText>
                </View>
              ))}
            </View>
          </Rise>

          <Rise delay={460}>
            <View style={[styles.note, { backgroundColor: colors.highlightTint }]}>
              <AppText
                variant="caption"
                style={{ color: colors.text, textAlign, lineHeight: 22 }}
              >
                {t.quran_tafsir_note}
              </AppText>
            </View>
          </Rise>
        </>
      ) : (
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <AppText variant="bodySmall" style={{ color: colors.textSecondary, textAlign }}>
            {t.quran_no_tafsir}
          </AppText>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 28,
    gap: 14,
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
  card: {
    borderRadius: 24,
    padding: 16,
    gap: 12,
  },
  surahRow: {
    alignItems: "center",
    gap: 12,
  },
  surahText: {
    flex: 1,
  },
  surahName: {
    fontFamily: "UthmanicHafs",
    fontSize: 30,
    lineHeight: 50,
    includeFontPadding: false,
  },
  listenButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionHeader: {
    alignItems: "center",
    gap: 10,
    minHeight: 44,
  },
  rangeChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
  },
  sectionBody: {
    gap: 12,
  },
  versesBox: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: GOLD,
    padding: 12,
    gap: 10,
  },
  verse: {
    gap: 4,
  },
  verseRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 10,
  },
  arabic: {
    flex: 1,
    fontFamily: "UthmanicHafs",
    fontSize: 24,
    lineHeight: 46,
    color: "#14110D",
    textAlign: "right",
    writingDirection: "rtl",
    includeFontPadding: false,
  },
  translation: {
    color: "#4F4A3E",
    textAlign: "left",
    lineHeight: 20,
  },
  lessonRow: {
    alignItems: "flex-start",
    gap: 10,
  },
  note: {
    borderRadius: 22,
    padding: 16,
  },
});

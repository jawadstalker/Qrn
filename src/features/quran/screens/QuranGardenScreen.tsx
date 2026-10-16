import React, { useCallback } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useRouter } from "expo-router";
import {
  BookOpen,
  BookOpenText,
  Droplets,
  Headphones,
  Pause,
  Play,
  Sprout,
  Trophy,
} from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDirection } from "@/core/i18n/useDirection";
import { useLanguage } from "@/core/i18n/LanguageContext";
import { formatNumber } from "@/core/i18n/format";
import { useTheme } from "@/core/theme/ThemeContext";
import { AppText } from "@/shared/components/ui/AppText";
import { ChunkyButton } from "@/shared/components/ui/ChunkyButton";
import { Float, Rise } from "@/shared/motion/motion";
import {
  BasmalaBanner,
  GOLD,
  GOLD_DARK,
  IslamicPattern,
  Lantern,
  MosqueSkyline,
  OrnamentDivider,
  Sparkle,
  StarBadge,
} from "@/features/quran/components/QuranDecor";
import { GrowthPlant } from "@/features/quran/components/GrowthPlant";
import { Sun } from "@/features/quran/components/Sun";
import { useQuranProgress } from "@/features/quran/state/QuranProgressContext";
import { useRecitation } from "@/features/quran/state/RecitationContext";
import { dailyAyahFor } from "@/features/quran/data/verseText";
import { getSurah } from "@/features/quran/data/surahs";
import { fill } from "@/features/quran/utils/fill";

const PADDING = 20;
const CARD_HEIGHT = 380;
const PLANT_WIDTH = 200;
const AVATAR_SIZE = 52;
const SUN_SIZE = 132;

export default function QuranGardenScreen() {
  const { colors } = useTheme();
  const { t, language } = useLanguage();
  const { row, textAlign, isRTL } = useDirection();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { plant, learnedCount, dueAyahs, nextNewAyah, mushaf, quizFor } =
    useQuranProgress();
  const { target, playing, playAyah, toggle } = useRecitation();
  const surah = getSurah(mushaf.surahId);
  const daily = React.useMemo(() => dailyAyahFor(new Date()), []);
  const dailySurah = getSurah(daily.surahId);
  const dailyPlaying =
    target?.kind === "ayah" &&
    target.surahId === daily.surahId &&
    target.ayah === daily.ayah &&
    playing;
  const quiz = quizFor(mushaf.surahId);
  const cardWidth = width - PADDING * 2;
  const shortcuts = [
    {
      route: "/tafsir" as const,
      icon: BookOpenText,
      title: t.quran_quick_tafsir,
      hint: t.quran_quick_tafsir_hint,
    },
    {
      route: "/listen" as const,
      icon: Headphones,
      title: t.quran_quick_listen,
      hint: t.quran_quick_listen_hint,
    },
    {
      route: "/quiz" as const,
      icon: Trophy,
      title: t.quran_quick_quiz,
      hint: quiz
        ? fill(t.quran_quiz_best, {
            score: formatNumber(quiz.best, language),
            total: formatNumber(quiz.total, language),
          })
        : t.quran_quiz_not_taken,
    },
  ];
  const number = (value: number) => formatNumber(value, language);

  const openMemorize = useCallback(
    (ayah: number) =>
      router.push({ pathname: "/memorize", params: { ayah: String(ayah) } }),
    [router],
  );

  const stageName = t[`quran_stage_${plant.stage.id}`] ?? "";
  const nextName = plant.nextStage
    ? (t[`quran_stage_${plant.nextStage.id}`] ?? "")
    : "";
  const waterAyah = dueAyahs[0];
  const progressText = plant.nextStage
    ? fill(t.quran_to_next, {
        count: number(plant.versesToNextStage),
        stage: nextName,
      })
    : t.quran_full_bloom;

  const stats = [
    { value: learnedCount, label: t.quran_stat_learned },
    {
      value: plant.flowers,
      label: t.quran_stat_blooms,
    },
    { value: plant.leaves, label: t.quran_stat_leaves },
  ];

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
          <View style={styles.headerText}>
            <AppText
              variant="h1"
              style={{ color: colors.text, textAlign, fontWeight: "800" }}
            >
              {t.quran_garden}
            </AppText>
            {surah ? (
              <AppText
                variant="caption"
                style={{ color: colors.textSecondary, textAlign }}
              >
                {`${surah.transliteration} · ${number(surah.verses)} ${t.quran_verses_word}`}
              </AppText>
            ) : null}
          </View>
          <View style={[styles.avatar, { backgroundColor: colors.tint }]}>
            <Sprout size={28} color={colors.onTint} strokeWidth={2.2} />
          </View>
        </View>
      </Rise>

      <Rise delay={40}>
        <BasmalaBanner width={cardWidth} background={colors.primary} />
      </Rise>

      <Rise delay={80}>
        <View style={[styles.plantCard, { backgroundColor: colors.tintSoft }]}>
          <IslamicPattern
            width={cardWidth}
            height={CARD_HEIGHT}
            color={GOLD_DARK}
            opacity={0.1}
          />
          <View style={styles.skyline} pointerEvents="none">
            <MosqueSkyline width={cardWidth} color={colors.primary} opacity={0.22} />
          </View>
          <View
            style={[styles.lantern, isRTL ? styles.chipRight : styles.chipLeft]}
            pointerEvents="none"
          >
            <Float amplitude={3} duration={2800}>
              <Lantern size={24} />
            </Float>
          </View>
          <View style={[styles.sparkle, { top: 96, left: "46%" }]} pointerEvents="none">
            <Float amplitude={4} duration={2200}>
              <Sparkle size={12} />
            </Float>
          </View>
          <View style={[styles.sparkle, { top: 190, left: "14%" }]} pointerEvents="none">
            <Float amplitude={3} duration={3000} delay={600}>
              <Sparkle size={9} />
            </Float>
          </View>
          <View style={[styles.sparkle, { top: 150, right: "12%" }]} pointerEvents="none">
            <Float amplitude={5} duration={2600} delay={300}>
              <Sparkle size={10} />
            </Float>
          </View>
          <View
            style={[styles.sun, isRTL ? styles.sunStart : styles.sunEnd]}
            pointerEvents="none"
          >
            <Sun size={SUN_SIZE} />
          </View>
          <View
            style={[
              styles.stageChip,
              { backgroundColor: colors.surface },
              isRTL ? styles.chipRight : styles.chipLeft,
            ]}
          >
            <AppText
              variant="caption"
              style={{ color: colors.onTint, fontWeight: "700" }}
            >
              {`${stageName} · ${number(learnedCount)}`}
            </AppText>
          </View>
          <View style={styles.plant}>
            <GrowthPlant
              key={`${plant.leaves}-${plant.flowers}`}
              width={PLANT_WIDTH}
              leaves={plant.leaves}
              flowers={plant.flowers}
            />
          </View>
          <View style={[styles.progressRow, { flexDirection: row }]}>
            <View style={[styles.track, { backgroundColor: colors.surface }]}>
              <View
                style={[
                  styles.fill,
                  {
                    backgroundColor: colors.primary,
                    width: `${Math.round(plant.stageProgress * 100)}%`,
                  },
                ]}
              />
            </View>
            <AppText
              variant="caption"
              style={{ color: colors.text, fontWeight: "700" }}
            >
              {progressText}
            </AppText>
          </View>
        </View>
      </Rise>

      <Rise delay={120}>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <View style={[styles.cardHeader, { flexDirection: row }]}>
            <StarBadge size={26} color={GOLD} fillColor={GOLD} />
            <AppText
              variant="body"
              style={{ color: colors.text, fontWeight: "800", flex: 1, textAlign }}
            >
              {t.quran_ayah_of_day}
            </AppText>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={dailyPlaying ? t.quran_pause : t.quran_play}
              onPress={() =>
                dailyPlaying ? toggle() : playAyah(daily.surahId, daily.ayah)
              }
              style={[styles.dailyPlay, { backgroundColor: colors.primary }]}
            >
              {dailyPlaying ? (
                <Pause size={18} color={colors.onPrimary} />
              ) : (
                <Play size={18} color={colors.onPrimary} />
              )}
            </Pressable>
          </View>
          <View style={styles.dailyBox}>
            <Text allowFontScaling={false} style={styles.dailyArabic}>
              {daily.ar}
            </Text>
          </View>
          <AppText
            variant="bodySmall"
            forceEnglish={language === "en"}
            style={{ color: colors.text, textAlign, lineHeight: 25 }}
          >
            {language === "fa" ? daily.fa : daily.en}
          </AppText>
          <AppText
            variant="caption"
            style={{ color: colors.textSecondary, textAlign }}
          >
            {`${language === "fa" ? (dailySurah?.name ?? "") : (dailySurah?.transliteration ?? "")} · ${number(daily.ayah)}`}
          </AppText>
        </View>
      </Rise>

      <Rise delay={140}>
        <View style={[styles.shortcuts, { flexDirection: row }]}>
          {shortcuts.map((item) => {
            const Icon = item.icon;

            return (
              <Pressable
                key={item.route}
                accessibilityRole="button"
                accessibilityLabel={item.title}
                onPress={() => router.push(item.route)}
                style={[styles.shortcut, { backgroundColor: colors.surface }]}
              >
                <View style={[styles.shortcutIcon, { backgroundColor: colors.tint }]}>
                  <Icon size={22} color={colors.onTint} />
                </View>
                <AppText
                  variant="bodySmall"
                  style={{ color: colors.text, fontWeight: "800", textAlign: "center" }}
                >
                  {item.title}
                </AppText>
                <AppText
                  variant="caption"
                  numberOfLines={2}
                  style={{ color: colors.textSecondary, textAlign: "center" }}
                >
                  {item.hint}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      </Rise>

      <Rise delay={160}>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <View style={[styles.cardHeader, { flexDirection: row }]}>
            <Droplets size={20} color={colors.primary} />
            <AppText
              variant="body"
              style={{ color: colors.text, fontWeight: "800" }}
            >
              {t.quran_water_title}
            </AppText>
          </View>
          <AppText
            variant="bodySmall"
            style={{ color: colors.textSecondary, textAlign }}
          >
            {waterAyah
              ? fill(t.quran_water_due, { count: number(dueAyahs.length) })
              : t.quran_water_none}
          </AppText>
          {waterAyah ? (
            <ChunkyButton
              label={t.quran_water_cta}
              onPress={() => openMemorize(waterAyah)}
            />
          ) : null}
        </View>
      </Rise>

      <Rise delay={240}>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <View style={[styles.cardHeader, { flexDirection: row }]}>
            <BookOpen size={20} color={colors.primary} />
            <AppText
              variant="body"
              style={{ color: colors.text, fontWeight: "800" }}
            >
              {t.quran_learn_title}
            </AppText>
          </View>
          <AppText
            variant="bodySmall"
            style={{ color: colors.textSecondary, textAlign }}
          >
            {nextNewAyah
              ? fill(t.quran_learn_next, {
                  ayah: number(nextNewAyah),
                  surah:
                    language === "fa"
                      ? (surah?.name ?? "")
                      : (surah?.transliteration ?? ""),
                })
              : t.quran_learn_done}
          </AppText>
          {nextNewAyah ? (
            <ChunkyButton
              label={t.quran_learn_cta}
              onPress={() => openMemorize(nextNewAyah)}
            />
          ) : null}
        </View>
      </Rise>

      <Rise delay={320}>
        <View style={[styles.stats, { flexDirection: row }]}>
          {stats.map((stat) => (
            <View
              key={stat.label}
              style={[styles.stat, { backgroundColor: colors.surface }]}
            >
              <AppText
                variant="h3"
                style={{ color: colors.text, fontWeight: "800" }}
              >
                {number(stat.value)}
              </AppText>
              <AppText
                variant="caption"
                style={{ color: colors.textSecondary, textAlign: "center" }}
              >
                {stat.label}
              </AppText>
            </View>
          ))}
        </View>
      </Rise>

      <Rise delay={400}>
        <AppText
          variant="caption"
          style={{ color: colors.textSecondary, textAlign }}
        >
          {t.quran_gentle}
        </AppText>
      </Rise>

      <OrnamentDivider />
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
  headerText: {
    flex: 1,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  plantCard: {
    height: CARD_HEIGHT,
    borderRadius: 28,
    overflow: "hidden",
  },
  // The canvas is larger than the sun body so the flames have room; offsets keep the body
  // near its old corner position (the card clips the overflow).
  sun: {
    position: "absolute",
    top: -SUN_SIZE / 2 + 44,
    width: SUN_SIZE,
    height: SUN_SIZE,
  },
  sunEnd: { right: -SUN_SIZE / 2 + 44 },
  sunStart: { left: -SUN_SIZE / 2 + 44 },
  skyline: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 34,
  },
  lantern: {
    position: "absolute",
    top: 54,
  },
  sparkle: {
    position: "absolute",
  },
  dailyPlay: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  dailyBox: {
    backgroundColor: "#FFFBEF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: GOLD,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  dailyArabic: {
    fontFamily: "UthmanicHafs",
    fontSize: 24,
    lineHeight: 46,
    color: "#14110D",
    textAlign: "center",
    writingDirection: "rtl",
    includeFontPadding: false,
  },
  shortcuts: {
    gap: 8,
  },
  shortcut: {
    flex: 1,
    borderRadius: 22,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: "center",
    gap: 4,
  },
  shortcutIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  stageChip: {
    position: "absolute",
    top: 16,
    minHeight: 32,
    paddingHorizontal: 12,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  chipLeft: { left: 16 },
  chipRight: { right: 16 },
  plant: {
    position: "absolute",
    top: 48,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  progressRow: {
    position: "absolute",
    left: 18,
    right: 18,
    bottom: 14,
    alignItems: "center",
    gap: 10,
  },
  track: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  fill: {
    height: 8,
    borderRadius: 4,
  },
  card: {
    borderRadius: 24,
    padding: 16,
    gap: 10,
  },
  cardHeader: {
    alignItems: "center",
    gap: 8,
  },
  stats: {
    gap: 8,
  },
  stat: {
    flex: 1,
    borderRadius: 24,
    padding: 12,
    alignItems: "center",
    gap: 2,
  },
});

import React, { useCallback } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { BookOpen, Droplets, Sprout } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDirection } from "@/core/i18n/useDirection";
import { useLanguage } from "@/core/i18n/LanguageContext";
import { formatNumber } from "@/core/i18n/format";
import { useTheme } from "@/core/theme/ThemeContext";
import { AppText } from "@/shared/components/ui/AppText";
import { ChunkyButton } from "@/shared/components/ui/ChunkyButton";
import { Rise } from "@/shared/motion/motion";
import { GrowthPlant } from "@/features/quran/components/GrowthPlant";
import { useQuranProgress } from "@/features/quran/state/QuranProgressContext";
import { getSurah } from "@/features/quran/data/surahs";
import { fill } from "@/features/quran/utils/fill";

const PADDING = 20;
const CARD_HEIGHT = 380;
const PLANT_WIDTH = 200;
const AVATAR_SIZE = 52;

export default function QuranGardenScreen() {
  const { colors } = useTheme();
  const { t, language } = useLanguage();
  const { row, textAlign, isRTL } = useDirection();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { plant, learnedCount, dueAyahs, nextNewAyah, mushaf } =
    useQuranProgress();
  const surah = getSurah(mushaf.surahId);
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

      <Rise delay={80}>
        <View style={[styles.plantCard, { backgroundColor: colors.tintSoft }]}>
          <View
            style={[
              styles.sun,
              { backgroundColor: colors.highlightTint },
              isRTL ? styles.sunStart : styles.sunEnd,
            ]}
          />
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
  sun: {
    position: "absolute",
    top: 18,
    width: 54,
    height: 54,
    borderRadius: 27,
  },
  sunEnd: { right: 18 },
  sunStart: { left: 18 },
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

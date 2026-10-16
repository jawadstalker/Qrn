import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDirection } from "@/core/i18n/useDirection";
import { useLanguage } from "@/core/i18n/LanguageContext";
import { formatNumber } from "@/core/i18n/format";
import { useTheme } from "@/core/theme/ThemeContext";
import { AppText } from "@/shared/components/ui/AppText";
import { ChunkyButton } from "@/shared/components/ui/ChunkyButton";
import { Rise } from "@/shared/motion/motion";
import { GrowthPlant } from "@/features/quran/components/GrowthPlant";
import { PetalRain } from "@/features/quran/components/PetalRain";
import { useQuranProgress } from "@/features/quran/state/QuranProgressContext";
import { fill } from "@/features/quran/utils/fill";

const HERO_HEIGHT = 470;
const PLANT_WIDTH = 236;
const GLOW_SIZE = 330;

export default function GrowthMomentScreen() {
  const { colors } = useTheme();
  const { t, language } = useLanguage();
  const { row, textAlign } = useDirection();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ ayah?: string; next?: string }>();
  const { plant } = useQuranProgress();
  const ayah = Number(params.ayah) || 1;
  const number = (value: number) => formatNumber(value, language);
  const nextName = plant.nextStage
    ? (t[`quran_stage_${plant.nextStage.id}`] ?? "")
    : "";
  const stageName = t[`quran_stage_${plant.stage.id}`] ?? "";

  const goesToQuiz = params.next === "quiz";
  const goBack = () => router.replace(goesToQuiz ? "/quiz" : "/");

  return (
    <View style={[styles.container, { backgroundColor: colors.primary }]}>
      <ScrollView
        bounces={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        <View
          style={[
            styles.hero,
            { backgroundColor: colors.primary, paddingTop: insets.top },
          ]}
        >
          <PetalRain distance={HERO_HEIGHT} />
          <View style={[styles.glow, { backgroundColor: colors.tintSoft }]} />
          <View style={styles.plant}>
            <GrowthPlant
              width={PLANT_WIDTH}
              leaves={Math.max(plant.leaves, 1)}
              flowers={plant.flowers}
              hasNewLeaf
            />
          </View>
        </View>

        <Rise
          delay={600}
          style={[
            styles.sheet,
            {
              backgroundColor: colors.background,
              paddingBottom: insets.bottom + 24,
            },
          ]}
        >
          <View>
            <AppText
              variant="h2"
              style={{ color: colors.text, textAlign, fontWeight: "800" }}
            >
              {fill(t.quran_moment_title, { ayah: number(ayah) })}
            </AppText>
            <AppText
              variant="bodySmall"
              style={{ color: colors.textSecondary, textAlign }}
            >
              {t.quran_moment_sub}
            </AppText>
          </View>

          <View style={[styles.stageRow, { flexDirection: row }]}>
            <AppText
              variant="caption"
              style={{ color: colors.text, fontWeight: "700" }}
            >
              {stageName}
            </AppText>
            <View style={[styles.track, { backgroundColor: colors.tintSoft }]}>
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
            {plant.nextStage ? (
              <AppText
                variant="caption"
                style={{ color: colors.highlightShadow, fontWeight: "700" }}
              >
                {nextName}
              </AppText>
            ) : null}
          </View>

          <View
            style={[styles.note, { backgroundColor: colors.highlightTint }]}
          >
            <AppText
              variant="caption"
              style={{ color: colors.text, textAlign, lineHeight: 22 }}
            >
              {t.quran_moment_note}
            </AppText>
          </View>

          <ChunkyButton
            label={(goesToQuiz ? t.quran_quiz_start : t.quran_continue) ?? ""}
            onPress={goBack}
          />
          <View style={styles.later}>
            <AppText
              variant="bodySmall"
              accessibilityRole="button"
              onPress={() => router.replace("/")}
              style={{ color: colors.textSecondary }}
            >
              {t.quran_back_garden}
            </AppText>
          </View>
        </Rise>
      </ScrollView>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
  },
  hero: {
    height: HERO_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  glow: {
    position: "absolute",
    width: GLOW_SIZE,
    height: GLOW_SIZE,
    borderRadius: GLOW_SIZE / 2,
    opacity: 0.22,
  },
  plant: {
    marginTop: 6,
  },
  sheet: {
    flexGrow: 1,
    marginTop: -28,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 20,
    paddingTop: 24,
    gap: 12,
  },
  stageRow: {
    alignItems: "center",
    gap: 10,
  },
  track: {
    flex: 1,
    height: 10,
    borderRadius: 5,
    overflow: "hidden",
  },
  fill: {
    height: 10,
    borderRadius: 5,
  },
  note: {
    borderRadius: 22,
    padding: 16,
  },
  later: {
    alignItems: "center",
    minHeight: 44,
    justifyContent: "center",
  },
});

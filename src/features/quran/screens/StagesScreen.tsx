import React, { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Check, Lock } from "lucide-react-native";
import { useDirection } from "@/core/i18n/useDirection";
import { useLanguage } from "@/core/i18n/LanguageContext";
import { formatNumber } from "@/core/i18n/format";
import { useTheme } from "@/core/theme/ThemeContext";
import { AppText } from "@/shared/components/ui/AppText";
import { Rise } from "@/shared/motion/motion";
import {
  Card,
  ScreenFrame,
} from "@/features/quran/components/PracticeChrome";
import { getSurah } from "@/features/quran/data/surahs";
import { VERSE_TEXT } from "@/features/quran/data/verseText";
import { usePT } from "@/features/quran/i18n/practice";
import { usePractice } from "@/features/quran/state/practiceStore";
import { useQuranProgress } from "@/features/quran/state/QuranProgressContext";
import { stageStatuses } from "@/features/quran/utils/stages";
import { GuideTarget } from "@/features/guide/guideTargets";

export default function StagesScreen() {
  const { colors } = useTheme();
  const { language } = useLanguage();
  const { row, textAlign, isRTL } = useDirection();
  const router = useRouter();
  const p = usePT();
  const { mushaf } = useQuranProgress();
  const { attempts } = usePractice();
  const surah = getSurah(mushaf.surahId);
  const hasText = VERSE_TEXT[mushaf.surahId] !== undefined;
  const statuses = useMemo(
    () => stageStatuses(attempts, mushaf.surahId),
    [attempts, mushaf.surahId],
  );
  const allPassed = statuses.every((status) => status.passed);

  const open = (stageId: number) => {
    if (stageId === 4) {
      router.push({ pathname: "/recall", params: { stage: "4" } });
    } else {
      router.push({ pathname: "/stage-play", params: { stage: String(stageId) } });
    }
  };

  return (
    <ScreenFrame
      arabicTitle="الْمَرَاحِلُ"
      title={p("stage_title")}
      subtitle={p("hub_stages_hint")}
      backTo="/exam"
    >
      {surah ? (
        <Rise delay={100}>
          <GuideTarget id="stages.surah">
            <View style={[styles.surahRow, { flexDirection: row }]}>
              <Text
                allowFontScaling={false}
                style={[styles.surahName, { color: colors.text }]}
              >
                {surah.name}
              </Text>
              <AppText
                variant="caption"
                style={{ color: colors.textSecondary, textAlign }}
              >
                {p("stage_surah", { surah: isRTL ? surah.name : surah.transliteration })}
              </AppText>
            </View>
          </GuideTarget>
        </Rise>
      ) : null}

      {!hasText ? (
        <Card>
          <AppText
            variant="bodySmall"
            style={{ color: colors.textSecondary, textAlign: "center" }}
          >
            {p("stage_no_text")}
          </AppText>
        </Card>
      ) : (
        statuses.map((status, position) => {
          const { spec } = status;
          const locked = !status.unlocked;

          return (
            <Rise key={spec.id} delay={140 + position * 60}>
              <GuideTarget id={`stages.item.${position}`}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ disabled: locked }}
                  disabled={locked}
                  onPress={() => open(spec.id)}
                  style={[
                    styles.stage,
                    {
                      backgroundColor: colors.surface,
                      flexDirection: row,
                      opacity: locked ? 0.55 : 1,
                      borderColor: status.passed ? colors.success : "transparent",
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.badge,
                      {
                        backgroundColor: status.passed
                          ? colors.success
                          : colors.tintSoft,
                      },
                    ]}
                  >
                    {status.passed ? (
                      <Check size={24} color="#FFFFFF" />
                    ) : locked ? (
                      <Lock size={22} color={colors.textSecondary} />
                    ) : (
                      <AppText
                        variant="h3"
                        style={{ color: colors.onTint, fontWeight: "800" }}
                      >
                        {formatNumber(spec.id, language)}
                      </AppText>
                    )}
                  </View>
                  <View style={styles.stageText}>
                    <AppText
                      variant="bodySmall"
                      style={{ color: colors.text, fontWeight: "800", textAlign }}
                    >
                      {`${p("stage_n", { n: spec.id })} — ${p(`stage_${spec.id}_name`)}`}
                    </AppText>
                    <AppText
                      variant="caption"
                      style={{ color: colors.textSecondary, textAlign }}
                    >
                      {p(`stage_${spec.id}_desc`)}
                    </AppText>
                    <AppText
                      variant="caption"
                      style={{
                        color: locked ? colors.textSecondary : colors.text,
                        fontWeight: "700",
                        textAlign,
                      }}
                    >
                      {locked
                        ? p("stage_locked")
                        : status.bestPercent === null
                          ? `${p("stage_not_tried")} · ${p("stage_pass", { percent: Math.round(spec.pass * 100) })}`
                          : `${status.passed ? p("stage_passed") : p("stage_retry")} · ${p("stage_best", { percent: status.bestPercent })} · ${p("stage_pass", { percent: Math.round(spec.pass * 100) })}`}
                    </AppText>
                  </View>
                </Pressable>
              </GuideTarget>
            </Rise>
          );
        })
      )}

      {allPassed && hasText ? (
        <AppText
          variant="bodySmall"
          style={{ color: colors.success, textAlign: "center", fontWeight: "800" }}
        >
          {p("stage_pass_last")}
        </AppText>
      ) : null}
    </ScreenFrame>
  );
}

const styles = StyleSheet.create({
  surahRow: {
    alignItems: "center",
    justifyContent: "space-between",
  },
  surahName: {
    fontFamily: "UthmanicHafs",
    fontSize: 30,
    lineHeight: 52,
    includeFontPadding: false,
  },
  stage: {
    borderRadius: 24,
    padding: 16,
    alignItems: "center",
    gap: 14,
    borderWidth: 2,
  },
  badge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  stageText: {
    flex: 1,
    gap: 2,
  },
});

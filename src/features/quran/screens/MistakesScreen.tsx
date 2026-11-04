import React, { useMemo, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useDirection } from "@/core/i18n/useDirection";
import { useLanguage } from "@/core/i18n/LanguageContext";
import { useTheme } from "@/core/theme/ThemeContext";
import { AppText } from "@/shared/components/ui/AppText";
import { ChunkyButton } from "@/shared/components/ui/ChunkyButton";
import { Rise } from "@/shared/motion/motion";
import {
  Card,
  Chip,
  PillButton,
  ScreenFrame,
} from "@/features/quran/components/PracticeChrome";
import { getSurah } from "@/features/quran/data/surahs";
import { usePT } from "@/features/quran/i18n/practice";
import {
  clearMistakes,
  isUnresolved,
  resolveMistake,
  usePractice,
  type MistakeRecord,
} from "@/features/quran/state/practiceStore";
import { useQuranProgress } from "@/features/quran/state/QuranProgressContext";
import { GuideTarget } from "@/features/guide/guideTargets";

type Filter = "open" | "all";

export default function MistakesScreen() {
  const { colors } = useTheme();
  const { language } = useLanguage();
  const { row, textAlign, isRTL } = useDirection();
  const router = useRouter();
  const p = usePT();
  const { surahId, setSurah } = useQuranProgress();
  const { mistakes } = usePractice();
  const [filter, setFilter] = useState<Filter>("open");

  const all = useMemo(
    () =>
      Object.values(mistakes).sort((a, b) => b.lastAt - a.lastAt),
    [mistakes],
  );
  const visible = filter === "open" ? all.filter(isUnresolved) : all;
  const openCount = all.filter(isUnresolved).length;
  const locale = language === "fa" ? "fa-IR" : "en-US";

  const dateText = (time: number) => {
    try {
      return new Date(time).toLocaleDateString(locale);
    } catch {
      return new Date(time).toDateString();
    }
  };

  const practice = (mistake: MistakeRecord) => {
    if (mistake.ayah === undefined) {
      return;
    }

    if (mistake.surahId !== surahId) {
      setSurah(mistake.surahId);
    }

    router.push({ pathname: "/recall", params: { ayah: String(mistake.ayah) } });
  };

  const confirmClear = () => {
    Alert.alert(p("mistakes_clear"), p("mistakes_clear_confirm"), [
      { text: p("cancel"), style: "cancel" },
      {
        text: p("confirm"),
        style: "destructive",
        onPress: () => void clearMistakes(),
      },
    ]);
  };

  return (
    <ScreenFrame
      arabicTitle="الْأَخْطَاءُ"
      title={p("mistakes_title")}
      subtitle={p("mistakes_sub")}
      backTo="/exam"
    >
      <GuideTarget id="mistakes.filter">
        <View style={[styles.chips, { flexDirection: row }]}>
          <Chip
            label={`${p("mistakes_filter_open")} (${openCount})`}
            active={filter === "open"}
            onPress={() => setFilter("open")}
          />
          <Chip
            label={`${p("mistakes_filter_all")} (${all.length})`}
            active={filter === "all"}
            onPress={() => setFilter("all")}
          />
        </View>
      </GuideTarget>

      {openCount > 0 ? (
        <GuideTarget id="mistakes.practice">
          <ChunkyButton
            label={p("mistakes_practice_all")}
            onPress={() => router.push({ pathname: "/recall", params: { weak: "1" } })}
          />
        </GuideTarget>
      ) : null}

      {visible.length === 0 ? (
        <GuideTarget id="mistakes.empty">
          <Card>
            <AppText
              variant="bodySmall"
              style={{ color: colors.textSecondary, textAlign: "center" }}
            >
              {filter === "open" && all.length > 0
                ? p("mistakes_empty_open")
                : p("mistakes_empty")}
            </AppText>
          </Card>
        </GuideTarget>
      ) : (
        visible.map((mistake, position) => {
          const surah = getSurah(mistake.surahId);
          const open = isUnresolved(mistake);

          return (
            <Rise key={mistake.key} delay={Math.min(position, 8) * 40}>
              <GuideTarget id={`mistakes.item.${position}`}>
                <View
                  style={[
                    styles.card,
                    {
                      backgroundColor: colors.surface,
                      borderColor: open ? colors.error : colors.success,
                    },
                  ]}
                >
                  <View style={[styles.titleRow, { flexDirection: row }]}>
                    <AppText
                      variant="bodySmall"
                      style={{ color: colors.text, fontWeight: "800", textAlign }}
                    >
                      {[
                        surah ? (isRTL ? surah.name : surah.transliteration) : "",
                        mistake.ayah !== undefined
                          ? p("mistake_ayah", { ayah: mistake.ayah })
                          : "",
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </AppText>
                    <View style={[styles.kind, { backgroundColor: colors.tintSoft }]}>
                      <AppText
                        variant="caption"
                        style={{ color: colors.onTint, fontWeight: "700" }}
                      >
                        {p(`kind_${mistake.kind}`)}
                      </AppText>
                    </View>
                  </View>

                  <AppText
                    variant="caption"
                    style={{ color: colors.textSecondary, textAlign }}
                  >
                    {`${p("mistakes_times", { n: mistake.count })} · ${p("mistakes_last", { date: dateText(mistake.lastAt) })}`}
                  </AppText>

                  {mistake.lastPicked ? (
                    <View style={[styles.answer, { borderColor: colors.error }]}>
                      <AppText
                        variant="caption"
                        style={{ color: colors.error, fontWeight: "800", textAlign }}
                      >
                        {p("your_answer")}
                      </AppText>
                      {mistake.arabic ? (
                        <Text allowFontScaling={false} style={[styles.arabic, { color: colors.text }]}>
                          {mistake.lastPicked}
                        </Text>
                      ) : (
                        <AppText variant="caption" style={{ color: colors.text, textAlign }}>
                          {mistake.lastPicked}
                        </AppText>
                      )}
                    </View>
                  ) : null}

                  {mistake.correct ? (
                    <View style={[styles.answer, { borderColor: colors.success }]}>
                      <AppText
                        variant="caption"
                        style={{ color: colors.success, fontWeight: "800", textAlign }}
                      >
                        {p("correct_answer")}
                      </AppText>
                      {mistake.arabic ? (
                        <Text allowFontScaling={false} style={[styles.arabic, { color: colors.text }]}>
                          {mistake.correct}
                        </Text>
                      ) : (
                        <AppText variant="caption" style={{ color: colors.text, textAlign }}>
                          {mistake.correct}
                        </AppText>
                      )}
                    </View>
                  ) : null}

                  {open ? (
                    <View style={[styles.actions, { flexDirection: row }]}>
                      {mistake.ayah !== undefined ? (
                        <View style={styles.action}>
                          <PillButton
                            label={p("mistakes_practice")}
                            onPress={() => practice(mistake)}
                          />
                        </View>
                      ) : null}
                      <View style={styles.action}>
                        <PillButton
                          tone="good"
                          label={p("mistakes_resolve")}
                          onPress={() => void resolveMistake(mistake.key)}
                        />
                      </View>
                    </View>
                  ) : (
                    <AppText
                      variant="caption"
                      style={{ color: colors.success, fontWeight: "800", textAlign }}
                    >
                      {p("mistakes_resolved")}
                    </AppText>
                  )}
                </View>
              </GuideTarget>
            </Rise>
          );
        })
      )}

      {all.length > 0 ? (
        <>
          <AppText
            variant="caption"
            style={{ color: colors.textSecondary, textAlign: "center" }}
          >
            {p("mistakes_hint")}
          </AppText>
          <PillButton tone="bad" label={p("mistakes_clear")} onPress={confirmClear} />
        </>
      ) : null}
    </ScreenFrame>
  );
}

const styles = StyleSheet.create({
  chips: {
    flexWrap: "wrap",
    gap: 8,
  },
  card: {
    borderRadius: 22,
    padding: 14,
    gap: 8,
    borderWidth: 1.5,
  },
  titleRow: {
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  kind: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  answer: {
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 2,
  },
  arabic: {
    fontFamily: "UthmanicHafs",
    fontSize: 20,
    lineHeight: 38,
    textAlign: "center",
    writingDirection: "rtl",
    includeFontPadding: false,
  },
  actions: {
    gap: 8,
  },
  action: {
    flex: 1,
  },
});

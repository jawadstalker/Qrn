import React from "react";
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
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Brain,
  ListChecks,
  Target,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDirection } from "@/core/i18n/useDirection";
import { useLanguage } from "@/core/i18n/LanguageContext";
import { formatNumber } from "@/core/i18n/format";
import { useTheme } from "@/core/theme/ThemeContext";
import { AppText } from "@/shared/components/ui/AppText";
import { Rise } from "@/shared/motion/motion";
import { PageBanner } from "@/features/quran/components/QuranDecor";
import { EXAMS } from "@/features/quran/data/exams";
import { usePT } from "@/features/quran/i18n/practice";
import { useExamResults } from "@/features/quran/state/useExamResults";
import { fill } from "@/features/quran/utils/fill";
import { GuideTarget, useGuideScroll } from "@/features/guide/guideTargets";

const PADDING = 20;

interface PracticeLink {
  route: "/scope" | "/stages" | "/recall" | "/mistakes" | "/report";
  titleKey: string;
  hintKey: string;
  icon: LucideIcon;
}

const PRACTICE_LINKS: readonly PracticeLink[] = [
  { route: "/scope", titleKey: "hub_scope", hintKey: "hub_scope_hint", icon: Target },
  { route: "/stages", titleKey: "hub_stages", hintKey: "hub_stages_hint", icon: ListChecks },
  { route: "/recall", titleKey: "hub_recall", hintKey: "hub_recall_hint", icon: Brain },
  { route: "/mistakes", titleKey: "hub_mistakes", hintKey: "hub_mistakes_hint", icon: TriangleAlert },
  { route: "/report", titleKey: "hub_report", hintKey: "hub_report_hint", icon: BarChart3 },
];

export default function ExamListScreen() {
  const { colors } = useTheme();
  const { t, language } = useLanguage();
  const { row, textAlign, isRTL } = useDirection();
  const insets = useSafeAreaInsets();
  const guideScroll = useGuideScroll();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { resultFor } = useExamResults();
  const p = usePT();
  const number = (value: number) => formatNumber(value, language);
  const BackIcon = isRTL ? ArrowRight : ArrowLeft;

  return (
    <ScrollView
      {...guideScroll}
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
            onPress={() => router.replace("/memorize")}
            style={[styles.iconButton, { backgroundColor: colors.surface }]}
          >
            <BackIcon size={22} color={colors.text} />
          </Pressable>
        </View>
      </Rise>

      <Rise delay={60}>
        <PageBanner
          width={width - PADDING * 2}
          background={colors.primary}
          arabicTitle="الِاخْتِبَارُ"
          title={t.quran_exam_title ?? ""}
          subtitle={t.quran_exam_sub ?? ""}
          illustration="star"
          isRTL={isRTL}
        />
      </Rise>

      {PRACTICE_LINKS.map((link, position) => {
        const Icon = link.icon;

        return (
          <Rise key={link.route} delay={100 + position * 50}>
            <GuideTarget id={`exam.link.${link.route}`}>
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push(link.route)}
                style={[
                  styles.card,
                  { backgroundColor: colors.surface, flexDirection: row, gap: 14 },
                ]}
              >
                <View style={[styles.linkIcon, { backgroundColor: colors.tintSoft }]}>
                  <Icon size={24} color={colors.onTint} />
                </View>
                <View style={styles.cardText}>
                  <AppText
                    variant="bodySmall"
                    style={{ color: colors.text, fontWeight: "800", textAlign }}
                  >
                    {p(link.titleKey)}
                  </AppText>
                  <AppText
                    variant="caption"
                    style={{ color: colors.textSecondary, textAlign }}
                  >
                    {p(link.hintKey)}
                  </AppText>
                </View>
              </Pressable>
            </GuideTarget>
          </Rise>
        );
      })}

      {EXAMS.map((exam, position) => {
        const result = resultFor(exam.id);

        return (
          <Rise key={exam.id} delay={120 + Math.min(position, 8) * 60}>
            <GuideTarget id={`exam.item.${position}`}>
              <Pressable
                accessibilityRole="button"
                onPress={() =>
                  router.push({
                    pathname: "/exam-play",
                    params: { id: exam.id },
                  })
                }
                style={[
                  styles.card,
                  { backgroundColor: colors.surface, flexDirection: row },
                ]}
              >
                <View style={styles.cardText}>
                  <Text
                    allowFontScaling={false}
                    style={[styles.arabicName, { color: colors.text, textAlign }]}
                  >
                    {exam.arabicName}
                  </Text>
                  <AppText
                    variant="bodySmall"
                    style={{ color: colors.text, fontWeight: "800", textAlign }}
                  >
                    {exam.title[language]}
                  </AppText>
                  <AppText
                    variant="caption"
                    style={{ color: colors.textSecondary, textAlign }}
                  >
                    {exam.subtitle[language]}
                  </AppText>
                  <View style={[styles.metaRow, { flexDirection: row }]}>
                    <View
                      style={[styles.badge, { backgroundColor: colors.tintSoft }]}
                    >
                      <AppText
                        variant="caption"
                        style={{ color: colors.onTint, fontWeight: "700" }}
                      >
                        {fill(t.quran_exam_count, {
                          count: number(exam.questions.length),
                        })}
                      </AppText>
                    </View>
                    <AppText
                      variant="caption"
                      style={{ color: colors.textSecondary, fontWeight: "700" }}
                    >
                      {result
                        ? fill(t.quran_quiz_best, {
                            score: number(result.best),
                            total: number(result.total),
                          })
                        : t.quran_quiz_not_taken}
                    </AppText>
                  </View>
                </View>
              </Pressable>
            </GuideTarget>
          </Rise>
        );
      })}
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
  card: {
    borderRadius: 24,
    padding: 16,
    alignItems: "center",
  },
  cardText: {
    flex: 1,
    gap: 4,
  },
  arabicName: {
    fontFamily: "UthmanicHafs",
    fontSize: 28,
    lineHeight: 50,
    includeFontPadding: false,
  },
  metaRow: {
    alignItems: "center",
    gap: 10,
    marginTop: 6,
    flexWrap: "wrap",
  },
  linkIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 14,
  },
});

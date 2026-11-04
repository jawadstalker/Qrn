import React, { type ReactNode } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import { useRouter, type Href } from "expo-router";
import { ArrowLeft, ArrowRight } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDirection } from "@/core/i18n/useDirection";
import { useLanguage } from "@/core/i18n/LanguageContext";
import { useTheme } from "@/core/theme/ThemeContext";
import { AppText } from "@/shared/components/ui/AppText";
import { Rise } from "@/shared/motion/motion";
import { PageBanner } from "@/features/quran/components/QuranDecor";
import { useGuideScroll } from "@/features/guide/guideTargets";

export const SCREEN_PADDING = 20;

interface ScreenFrameProps {
  arabicTitle: string;
  title: string;
  subtitle: string;
  backTo: Href;
  /** Hides the banner (used while a question is on screen to save space). */
  compact?: boolean;
  children: ReactNode;
}

/** Scrolling page with a back button and the standard banner used by the practice screens. */
export function ScreenFrame({
  arabicTitle,
  title,
  subtitle,
  backTo,
  compact = false,
  children,
}: ScreenFrameProps) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { row, isRTL } = useDirection();
  const insets = useSafeAreaInsets();
  const guideScroll = useGuideScroll();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const BackIcon = isRTL ? ArrowRight : ArrowLeft;

  return (
    <ScrollView
      {...guideScroll}
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 40,
          paddingHorizontal: SCREEN_PADDING,
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <Rise>
        <View style={[styles.header, { flexDirection: row }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t.quran_back}
            onPress={() => router.replace(backTo)}
            style={[styles.iconButton, { backgroundColor: colors.surface }]}
          >
            <BackIcon size={22} color={colors.text} />
          </Pressable>
          {compact ? (
            <AppText
              variant="bodySmall"
              style={{ color: colors.textSecondary, fontWeight: "700" }}
            >
              {title}
            </AppText>
          ) : null}
        </View>
      </Rise>

      {compact ? null : (
        <Rise delay={60}>
          <PageBanner
            width={width - SCREEN_PADDING * 2}
            background={colors.primary}
            arabicTitle={arabicTitle}
            title={title}
            subtitle={subtitle}
            illustration="star"
            isRTL={isRTL}
          />
        </Rise>
      )}

      {children}
    </ScrollView>
  );
}

export function Card({ children }: { children: ReactNode }) {
  const { colors } = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: colors.surface }]}>
      {children}
    </View>
  );
}

/** Secondary pill button used next to the main ChunkyButton. */
export function PillButton({
  label,
  onPress,
  tone = "tint",
}: {
  label: string;
  onPress: () => void;
  tone?: "tint" | "good" | "bad";
}) {
  const { colors } = useTheme();
  const background =
    tone === "good" ? colors.success : tone === "bad" ? colors.error : colors.tint;
  const color = tone === "tint" ? colors.onTint : "#FFFFFF";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={[styles.pill, { backgroundColor: background }]}
    >
      <AppText variant="bodySmall" style={{ color, fontWeight: "800" }}>
        {label}
      </AppText>
    </Pressable>
  );
}

export function Chip({
  label,
  active,
  onPress,
  disabled,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  disabled?: boolean;
}) {
  const { colors } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: active ? colors.primary : colors.tintSoft,
          opacity: disabled ? 0.45 : 1,
        },
      ]}
    >
      <AppText
        variant="caption"
        style={{
          color: active ? colors.onPrimary : colors.onTint,
          fontWeight: "800",
        }}
      >
        {label}
      </AppText>
    </Pressable>
  );
}

export function ProgressBar({
  value,
  color,
  height = 8,
}: {
  /** 0..1 */
  value: number;
  color: string;
  height?: number;
}) {
  const { colors } = useTheme();

  return (
    <View
      style={{
        flex: 1,
        height,
        borderRadius: height / 2,
        backgroundColor: colors.track,
        overflow: "hidden",
      }}
    >
      <View
        style={{
          height,
          borderRadius: height / 2,
          backgroundColor: color,
          width: `${Math.round(Math.max(0, Math.min(1, value)) * 100)}%`,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
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
    gap: 12,
  },
  pill: {
    minHeight: 48,
    borderRadius: 24,
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  chip: {
    minHeight: 38,
    borderRadius: 19,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
  },
});

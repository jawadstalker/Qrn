import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, ArrowRight } from "lucide-react-native";
import { useDirection } from "@/core/i18n/useDirection";
import { useLanguage } from "@/core/i18n/LanguageContext";
import { useTheme } from "@/core/theme/ThemeContext";
import { useGoBack } from "@/features/auth/components/AuthUi";
import { AppText } from "@/shared/components/ui/AppText";

interface GameFrameProps {
  title: string;
  subtitle?: string;
  /** Shown at the far end of the top bar (e.g. a timer). */
  trailing?: React.ReactNode;
  onBack?: () => void;
  children: React.ReactNode;
}

/** A full-screen layout with a slim top bar, for screens that must fit without scrolling. */
export function GameFrame({
  title,
  subtitle,
  trailing,
  onBack,
  children,
}: GameFrameProps) {
  const { colors } = useTheme();
  const { isRTL } = useDirection();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const goBack = useGoBack();
  const BackIcon = isRTL ? ArrowRight : ArrowLeft;

  return (
    <View
      style={[
        styles.frame,
        {
          backgroundColor: colors.background,
          paddingTop: insets.top + 6,
          paddingBottom: insets.bottom + 10,
        },
      ]}
    >
      <View
        style={[styles.bar, { flexDirection: isRTL ? "row-reverse" : "row" }]}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.quran_back}
          hitSlop={10}
          onPress={onBack ?? goBack}
          style={[styles.back, { backgroundColor: colors.surface }]}
        >
          <BackIcon size={22} color={colors.text} />
        </Pressable>
        <View style={styles.titles}>
          <AppText
            variant="h3"
            numberOfLines={1}
            style={{ color: colors.text, textAlign: "center" }}
          >
            {title}
          </AppText>
          {subtitle ? (
            <AppText
              variant="caption"
              numberOfLines={1}
              style={{ color: colors.textSecondary, textAlign: "center" }}
            >
              {subtitle}
            </AppText>
          ) : null}
        </View>
        <View style={styles.trailing}>{trailing}</View>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    flex: 1,
  },
  bar: {
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  back: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  titles: {
    flex: 1,
  },
  trailing: {
    minWidth: 42,
    alignItems: "center",
    justifyContent: "center",
  },
});

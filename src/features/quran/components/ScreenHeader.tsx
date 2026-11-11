import React, { type ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft, ArrowRight } from "lucide-react-native";
import { useDirection } from "@/core/i18n/useDirection";
import { useLanguage } from "@/core/i18n/LanguageContext";
import { useTheme } from "@/core/theme/ThemeContext";
import { AppText } from "@/shared/components/ui/AppText";

interface ScreenHeaderProps {
  title: string;
  /** Small element on the trailing side (a count badge, say). */
  trailing?: ReactNode;
}

/** Back button + title, for the pages reached from the library. */
export function ScreenHeader({ title, trailing }: ScreenHeaderProps) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { row, isRTL } = useDirection();
  const router = useRouter();

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/library");
    }
  };

  return (
    <View style={[styles.bar, { flexDirection: row }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t.quran_back}
        onPress={goBack}
        hitSlop={10}
        style={styles.side}
      >
        {isRTL ? (
          <ArrowRight size={22} color={colors.text} />
        ) : (
          <ArrowLeft size={22} color={colors.text} />
        )}
      </Pressable>

      <AppText
        variant="h2"
        accessibilityRole="header"
        style={{ color: colors.text, fontWeight: "800" }}
      >
        {title}
      </AppText>

      <View style={styles.side}>{trailing}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  side: {
    minWidth: 34,
    minHeight: 34,
    alignItems: "center",
    justifyContent: "center",
  },
});

import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { useLanguage } from "@/core/i18n/LanguageContext";
import { useTheme } from "@/core/theme/ThemeContext";
import { AppText } from "@/shared/components/ui/AppText";

interface PlanErrorFallbackProps {
  error: Error;
  retry: () => Promise<unknown>;
}

/**
 * Shown instead of a blank screen when a plan page fails to load or render, so the cause is
 * visible and the person can go back to the garden.
 */
export function PlanErrorFallback({ error, retry }: PlanErrorFallbackProps) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const router = useRouter();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppText
        variant="body"
        style={{ color: colors.text, fontWeight: "800", textAlign: "center" }}
      >
        {t.plan_open_error ?? "The plan could not be opened."}
      </AppText>
      <AppText
        variant="caption"
        numberOfLines={6}
        style={{ color: colors.textSecondary, textAlign: "center" }}
      >
        {error?.message ?? ""}
      </AppText>
      <View style={styles.row}>
        <Pressable
          accessibilityRole="button"
          onPress={() => void retry()}
          style={[styles.button, { backgroundColor: colors.primary }]}
        >
          <AppText
            variant="bodySmall"
            style={{ color: colors.onPrimary, fontWeight: "800" }}
          >
            {t.plan_retry ?? "Try again"}
          </AppText>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.replace("/")}
          style={[styles.button, { backgroundColor: colors.tintSoft }]}
        >
          <AppText
            variant="bodySmall"
            style={{ color: colors.onTint, fontWeight: "800" }}
          >
            {t.plan_back_home ?? "Back to the garden"}
          </AppText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 24,
  },
  row: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
  },
  button: {
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 18,
  },
});

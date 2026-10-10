import React from "react";
import { Pressable, ScrollView, StyleSheet, Switch, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDirection } from "@/core/i18n/useDirection";
import { useLanguage } from "@/core/i18n/LanguageContext";
import { useTheme } from "@/core/theme/ThemeContext";
import { Colors, THEME_ORDER } from "@/core/theme/tokens";
import type { Language } from "@/core/types/index";
import { useSound } from "@/shared/audio/SoundContext";
import { AppText } from "@/shared/components/ui/AppText";
import { Rise } from "@/shared/motion/motion";

const SWATCH_SIZE = 44;
const LANGUAGES: readonly { id: Language; label: string }[] = [
  { id: "fa", label: "فارسی" },
  { id: "en", label: "English" },
];

function Card({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: colors.surface }]}>
      {children}
    </View>
  );
}

export default function SettingsScreen() {
  const { colors, theme, setTheme } = useTheme();
  const { t, language, setLanguage } = useLanguage();
  const { row, textAlign } = useDirection();
  const { enabled, setEnabled, play } = useSound();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 20 }]}
      showsVerticalScrollIndicator={false}
    >
      <Rise>
        <AppText
          variant="h1"
          style={{ color: colors.text, textAlign, fontWeight: "800" }}
        >
          {t.quran_settings}
        </AppText>
      </Rise>

      <Rise delay={80}>
        <Card>
          <AppText
            variant="body"
            style={{ color: colors.text, textAlign, fontWeight: "800" }}
          >
            {t.theme}
          </AppText>
          <View style={[styles.swatches, { flexDirection: row }]}>
            {THEME_ORDER.map((mode) => {
              const selected = theme === mode;

              return (
                <Pressable
                  key={mode}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  accessibilityLabel={t[`theme_${mode}`]}
                  onPress={() => {
                    play("select");
                    void setTheme(mode);
                  }}
                  style={styles.swatchItem}
                >
                  <View
                    style={[
                      styles.swatchRing,
                      {
                        borderColor: selected
                          ? Colors[mode].primary
                          : "transparent",
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.swatch,
                        { backgroundColor: Colors[mode].primary },
                      ]}
                    />
                  </View>
                  <AppText
                    variant="caption"
                    style={{
                      color: colors.text,
                      fontWeight: selected ? "800" : "500",
                    }}
                  >
                    {t[`theme_${mode}`]}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
        </Card>
      </Rise>

      <Rise delay={160}>
        <Card>
          <AppText
            variant="body"
            style={{ color: colors.text, textAlign, fontWeight: "800" }}
          >
            {t.language}
          </AppText>
          <View
            style={[
              styles.segmented,
              { backgroundColor: colors.track, flexDirection: row },
            ]}
          >
            {LANGUAGES.map((item) => {
              const selected = language === item.id;

              return (
                <Pressable
                  key={item.id}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  onPress={() => {
                    play("select");
                    void setLanguage(item.id);
                  }}
                  style={[
                    styles.segment,
                    selected && { backgroundColor: colors.surface },
                  ]}
                >
                  <AppText
                    variant="bodySmall"
                    style={{
                      color: colors.text,
                      fontWeight: selected ? "800" : "500",
                    }}
                  >
                    {item.label}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
        </Card>
      </Rise>

      <Rise delay={240}>
        <Card>
          <View style={[styles.switchRow, { flexDirection: row }]}>
            <View style={styles.switchText}>
              <AppText
                variant="body"
                style={{ color: colors.text, textAlign, fontWeight: "800" }}
              >
                {t.sound_effects}
              </AppText>
              <AppText
                variant="caption"
                style={{ color: colors.textSecondary, textAlign }}
              >
                {t.sound_effects_hint}
              </AppText>
            </View>
            <Switch
              value={enabled}
              onValueChange={(next) => {
                setEnabled(next);
                if (next) {
                  play("select");
                }
              }}
              accessibilityLabel={t.sound_effects}
              trackColor={{ true: colors.primary, false: colors.track }}
              thumbColor="#FFFFFF"
            />
          </View>
        </Card>
      </Rise>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    paddingBottom: 28,
    gap: 14,
  },
  card: {
    borderRadius: 22,
    padding: 16,
    gap: 8,
  },
  swatches: {
    justifyContent: "space-between",
    paddingTop: 8,
  },
  swatchItem: {
    alignItems: "center",
    gap: 6,
    minWidth: 56,
  },
  swatchRing: {
    width: SWATCH_SIZE + 12,
    height: SWATCH_SIZE + 12,
    borderRadius: (SWATCH_SIZE + 12) / 2,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  swatch: {
    width: SWATCH_SIZE,
    height: SWATCH_SIZE,
    borderRadius: SWATCH_SIZE / 2,
  },
  segmented: {
    borderRadius: 22,
    padding: 4,
    marginTop: 4,
  },
  segment: {
    flex: 1,
    minHeight: 44,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  switchRow: {
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  switchText: {
    flex: 1,
    gap: 2,
  },
});

import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Switch, View } from "react-native";
import { useRouter } from "expo-router";
import {
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  RotateCcw,
  UserRound,
} from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/features/auth/AuthContext";
import { useDirection } from "@/core/i18n/useDirection";
import { useLanguage } from "@/core/i18n/LanguageContext";
import { useTheme } from "@/core/theme/ThemeContext";
import { Colors, THEME_ORDER } from "@/core/theme/tokens";
import type { Language } from "@/core/types/index";
import { useSound } from "@/shared/audio/SoundContext";
import { AppText } from "@/shared/components/ui/AppText";
import { Rise } from "@/shared/motion/motion";
import { GUIDE_UI } from "@/features/guide/guideContent";
import { useGuide } from "@/features/guide/GuideContext";

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
  const { row, textAlign, isRTL } = useDirection();
  const { enabled, setEnabled, play } = useSound();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { status, user } = useAuth();
  const Chevron = isRTL ? ChevronLeft : ChevronRight;
  const { pagesEnabled, setPagesEnabled, resetPageGuides, start } = useGuide();
  const [guidesReset, setGuidesReset] = useState(false);
  const guideText = GUIDE_UI[language];

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

      <Rise delay={40}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            status === "in" ? t.auth_account_card_manage : t.auth_login_cta
          }
          onPress={() => {
            play("select");
            router.push(status === "in" ? "/account" : "/login");
          }}
          style={({ pressed }) => [
            styles.card,
            styles.accountCard,
            {
              backgroundColor: colors.surface,
              flexDirection: row,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
        >
          <View style={[styles.avatar, { backgroundColor: colors.tintSoft }]}>
            <UserRound size={24} color={colors.onTint} />
          </View>
          <View style={styles.switchText}>
            <AppText
              variant="body"
              style={{ color: colors.text, textAlign, fontWeight: "800" }}
            >
              {status === "in" ? t.auth_account_title : t.auth_account_card_title}
            </AppText>
            <AppText
              variant="caption"
              numberOfLines={2}
              forceEnglish={status === "in"}
              style={{ color: colors.textSecondary, textAlign }}
            >
              {status === "in" && user ? user.email : t.auth_account_card_out}
            </AppText>
          </View>
          <Chevron size={22} color={colors.textTertiary} />
        </Pressable>
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

      <Rise delay={320}>
        <Card>
          <AppText
            variant="body"
            style={{ color: colors.text, textAlign, fontWeight: "800" }}
          >
            {guideText.settingsTitle}
          </AppText>
          <View style={[styles.switchRow, { flexDirection: row }]}>
            <View style={styles.switchText}>
              <AppText
                variant="bodySmall"
                style={{ color: colors.text, textAlign, fontWeight: "800" }}
              >
                {guideText.pagesTitle}
              </AppText>
              <AppText
                variant="caption"
                style={{ color: colors.textSecondary, textAlign }}
              >
                {guideText.pagesHint}
              </AppText>
            </View>
            <Switch
              value={pagesEnabled}
              onValueChange={(next) => {
                setPagesEnabled(next);
                setGuidesReset(false);
                if (next) {
                  play("select");
                }
              }}
              accessibilityLabel={guideText.pagesTitle}
              trackColor={{ true: colors.primary, false: colors.track }}
              thumbColor="#FFFFFF"
            />
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={guideText.replayTitle}
            onPress={() => {
              play("select");
              start("tour");
            }}
            style={({ pressed }) => [
              styles.guideRow,
              { flexDirection: row, opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <View
              style={[styles.guideIcon, { backgroundColor: colors.tintSoft }]}
            >
              <CircleHelp size={20} color={colors.onTint} />
            </View>
            <View style={styles.switchText}>
              <AppText
                variant="bodySmall"
                style={{ color: colors.text, textAlign, fontWeight: "800" }}
              >
                {guideText.replayTitle}
              </AppText>
              <AppText
                variant="caption"
                style={{ color: colors.textSecondary, textAlign }}
              >
                {guideText.replayHint}
              </AppText>
            </View>
            <Chevron size={20} color={colors.textTertiary} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={guideText.resetTitle}
            onPress={() => {
              play("select");
              resetPageGuides();
              setGuidesReset(true);
            }}
            style={({ pressed }) => [
              styles.guideRow,
              { flexDirection: row, opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <View
              style={[styles.guideIcon, { backgroundColor: colors.tintSoft }]}
            >
              <RotateCcw size={20} color={colors.onTint} />
            </View>
            <View style={styles.switchText}>
              <AppText
                variant="bodySmall"
                style={{ color: colors.text, textAlign, fontWeight: "800" }}
              >
                {guideText.resetTitle}
              </AppText>
              <AppText
                variant="caption"
                style={{
                  color: guidesReset ? colors.success : colors.textSecondary,
                  textAlign,
                }}
              >
                {guidesReset ? guideText.resetDone : guideText.resetHint}
              </AppText>
            </View>
          </Pressable>
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
  accountCard: {
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  switchText: {
    flex: 1,
    gap: 2,
  },
  guideRow: {
    alignItems: "center",
    gap: 12,
    minHeight: 52,
  },
  guideIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
});

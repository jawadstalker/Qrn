import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";
import { useRouter } from "expo-router";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  type LucideIcon,
} from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDirection } from "@/core/i18n/useDirection";
import { useLanguage } from "@/core/i18n/LanguageContext";
import { useTheme } from "@/core/theme/ThemeContext";
import { Fonts } from "@/core/theme/tokens";
import { SoundPressable } from "@/shared/components/ui/SoundPressable";
import { AppText } from "@/shared/components/ui/AppText";
import { Rise } from "@/shared/motion/motion";

const LOGO = require("../../../../assets/brand/logo2.png") as number;
const LOGO_WIDTH = 220;
const LOGO_HEIGHT = Math.round((LOGO_WIDTH * 1024) / 1536);

/** Goes back, or to the settings tab when there is no history (e.g. after a cold start). */
export function useGoBack() {
  const router = useRouter();

  return () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/settings");
    }
  };
}

interface ScaffoldProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

/** Page frame: back button, the brand logo on top, a title and a scrolling form area. */
export function AuthScaffold({ title, subtitle, children }: ScaffoldProps) {
  const { colors } = useTheme();
  const { isRTL } = useDirection();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const goBack = useGoBack();
  const BackIcon = isRTL ? ArrowRight : ArrowLeft;

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 32 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.topBar,
            { flexDirection: isRTL ? "row-reverse" : "row" },
          ]}
        >
          <SoundPressable
            accessibilityRole="button"
            accessibilityLabel={t.quran_back}
            hitSlop={10}
            onPress={goBack}
            style={[styles.backButton, { backgroundColor: colors.surface }]}
          >
            <BackIcon size={22} color={colors.text} />
          </SoundPressable>
        </View>

        <Rise>
          <View style={styles.hero}>
            <Image
              source={LOGO}
              style={{ width: LOGO_WIDTH, height: LOGO_HEIGHT }}
              resizeMode="contain"
              accessibilityIgnoresInvertColors
            />
            <AppText
              variant="h2"
              style={{
                color: colors.text,
                fontWeight: "800",
                textAlign: "center",
              }}
            >
              {title}
            </AppText>
            {subtitle ? (
              <AppText
                variant="bodySmall"
                style={{ color: colors.textSecondary, textAlign: "center" }}
              >
                {subtitle}
              </AppText>
            ) : null}
          </View>
        </Rise>

        <Rise delay={90}>
          <View
            style={[
              styles.card,
              { backgroundColor: colors.surface, shadowColor: colors.primary },
            ]}
          >
            {children}
          </View>
        </Rise>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

interface FieldProps
  extends Pick<
    TextInputProps,
    | "value"
    | "onChangeText"
    | "placeholder"
    | "autoComplete"
    | "textContentType"
    | "returnKeyType"
    | "onSubmitEditing"
    | "keyboardType"
    | "editable"
    | "maxLength"
  > {
  label: string;
  icon: LucideIcon;
  secure?: boolean;
  error?: string | null;
  hint?: string;
}

export const AuthField = React.forwardRef<TextInput, FieldProps>(
  function AuthField(
    { label, icon: Icon, secure = false, error, hint, ...input },
    ref,
  ) {
    const { colors } = useTheme();
    const { row, textAlign } = useDirection();
    const { t } = useLanguage();
    const [focused, setFocused] = useState(false);
    const [shown, setShown] = useState(false);
    const borderColor = error
      ? colors.error
      : focused
        ? colors.primary
        : colors.border;

    return (
      <View style={styles.fieldWrap}>
        <AppText
          variant="bodySmall"
          style={{ color: colors.text, textAlign, fontWeight: "700" }}
        >
          {label}
        </AppText>
        <View
          style={[
            styles.field,
            {
              flexDirection: row,
              borderColor,
              backgroundColor: colors.background,
            },
          ]}
        >
          <Icon size={20} color={focused ? colors.primary : colors.textTertiary} />
          <TextInput
            ref={ref}
            {...input}
            accessibilityLabel={label}
            secureTextEntry={secure && !shown}
            autoCapitalize="none"
            autoCorrect={false}
            spellCheck={false}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholderTextColor={colors.textTertiary}
            selectionColor={colors.primary}
            style={[styles.input, { color: colors.text }]}
          />
          {secure ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={shown ? t.auth_hide_password : t.auth_show_password}
              hitSlop={10}
              onPress={() => setShown((value) => !value)}
            >
              {shown ? (
                <EyeOff size={20} color={colors.textTertiary} />
              ) : (
                <Eye size={20} color={colors.textTertiary} />
              )}
            </Pressable>
          ) : null}
        </View>
        {error ? (
          <AppText
            variant="caption"
            style={{ color: colors.error, textAlign }}
            accessibilityLiveRegion="polite"
          >
            {error}
          </AppText>
        ) : hint ? (
          <AppText
            variant="caption"
            style={{ color: colors.textTertiary, textAlign }}
          >
            {hint}
          </AppText>
        ) : null}
      </View>
    );
  },
);

interface ButtonProps {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: "primary" | "danger" | "soft";
}

export function AuthButton({
  label,
  onPress,
  loading = false,
  disabled = false,
  variant = "primary",
}: ButtonProps) {
  const { colors } = useTheme();
  const inactive = disabled || loading;
  const palette =
    variant === "danger"
      ? { bg: colors.error, fg: "#FFFFFF" }
      : variant === "soft"
        ? { bg: colors.tintSoft, fg: colors.onTint }
        : { bg: colors.primary, fg: colors.onPrimary };

  return (
    <SoundPressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: palette.bg,
          opacity: inactive ? 0.55 : pressed ? 0.88 : 1,
          transform: [{ scale: pressed && !inactive ? 0.985 : 1 }],
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={palette.fg} />
      ) : (
        <AppText
          variant="button"
          style={{ color: palette.fg, fontWeight: "800", fontSize: 16 }}
        >
          {label}
        </AppText>
      )}
    </SoundPressable>
  );
}

/** A tappable line of text, used for "have an account?" style links. */
export function AuthLink({
  label,
  onPress,
  muted = false,
}: {
  label: string;
  onPress: () => void;
  muted?: boolean;
}) {
  const { colors } = useTheme();

  return (
    <SoundPressable
      accessibilityRole="link"
      accessibilityLabel={label}
      hitSlop={8}
      onPress={onPress}
      style={styles.link}
    >
      <AppText
        variant="bodySmall"
        style={{
          color: muted ? colors.textSecondary : colors.primary,
          fontWeight: muted ? "500" : "800",
          textAlign: "center",
        }}
      >
        {label}
      </AppText>
    </SoundPressable>
  );
}

export function Banner({
  kind,
  text,
}: {
  kind: "error" | "success";
  text: string;
}) {
  const { colors } = useTheme();
  const { row, textAlign } = useDirection();
  const tone = kind === "error" ? colors.error : colors.success;
  const Icon = kind === "error" ? AlertCircle : CheckCircle2;

  return (
    <View
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={[
        styles.banner,
        { flexDirection: row, borderColor: tone, backgroundColor: `${tone}18` },
      ]}
    >
      <Icon size={20} color={tone} />
      <AppText
        variant="bodySmall"
        style={{ color: colors.text, flex: 1, textAlign }}
      >
        {text}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { paddingHorizontal: 20, gap: 16 },
  topBar: { height: 48, alignItems: "center" },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  hero: { alignItems: "center", gap: 6, paddingBottom: 4 },
  card: {
    borderRadius: 26,
    padding: 20,
    gap: 16,
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  fieldWrap: { gap: 6 },
  field: {
    height: 56,
    borderRadius: 16,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    alignItems: "center",
    gap: 10,
  },
  input: {
    flex: 1,
    height: 56,
    fontFamily: Fonts.regular,
    fontSize: 16,
    textAlign: "left",
    writingDirection: "ltr",
  },
  button: {
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  link: { minHeight: 44, alignItems: "center", justifyContent: "center" },
  banner: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    alignItems: "center",
    gap: 10,
  },
});

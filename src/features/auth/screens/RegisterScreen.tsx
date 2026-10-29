import React, { useRef, useState } from "react";
import { type TextInput } from "react-native";
import { useRouter } from "expo-router";
import { Lock, Mail } from "lucide-react-native";
import { useLanguage } from "@/core/i18n/LanguageContext";
import { useAuth } from "@/features/auth/AuthContext";
import { MIN_PASSWORD_LENGTH } from "@/features/auth/config";
import { errorKey, isValidEmail } from "@/features/auth/errors";
import {
  AuthButton,
  AuthField,
  AuthLink,
  AuthScaffold,
  Banner,
  useGoBack,
} from "@/features/auth/components/AuthUi";
import { AppText } from "@/shared/components/ui/AppText";
import { useTheme } from "@/core/theme/ThemeContext";
import { useDirection } from "@/core/i18n/useDirection";

export default function RegisterScreen() {
  const { t } = useLanguage();
  const { colors } = useTheme();
  const { textAlign } = useDirection();
  const { register } = useAuth();
  const router = useRouter();
  const goBack = useGoBack();
  const passwordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  const emailError =
    submitted && !isValidEmail(email) ? t.auth_err_invalid_email : null;
  const passwordError =
    submitted && password.length < MIN_PASSWORD_LENGTH
      ? t.auth_err_weak_password
      : null;
  const confirmError =
    submitted && confirm !== password ? t.auth_err_mismatch : null;

  const submit = async () => {
    setSubmitted(true);
    setFailure(null);

    if (
      !isValidEmail(email) ||
      password.length < MIN_PASSWORD_LENGTH ||
      confirm !== password
    ) {
      return;
    }

    setBusy(true);

    try {
      await register(email.trim().toLowerCase(), password);
      goBack();
    } catch (error) {
      setFailure(t[errorKey(error)]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthScaffold
      title={t.auth_register_title}
      subtitle={t.auth_register_subtitle}
    >
      {failure ? <Banner kind="error" text={failure} /> : null}

      <AuthField
        label={t.auth_email}
        icon={Mail}
        value={email}
        onChangeText={setEmail}
        placeholder={t.auth_email_placeholder}
        keyboardType="email-address"
        autoComplete="email"
        textContentType="emailAddress"
        returnKeyType="next"
        onSubmitEditing={() => passwordRef.current?.focus()}
        editable={!busy}
        error={emailError}
      />
      <AuthField
        ref={passwordRef}
        label={t.auth_password}
        icon={Lock}
        secure
        value={password}
        onChangeText={setPassword}
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="next"
        onSubmitEditing={() => confirmRef.current?.focus()}
        editable={!busy}
        hint={t.auth_password_hint}
        error={passwordError}
      />
      <AuthField
        ref={confirmRef}
        label={t.auth_confirm_password}
        icon={Lock}
        secure
        value={confirm}
        onChangeText={setConfirm}
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="go"
        onSubmitEditing={() => void submit()}
        editable={!busy}
        error={confirmError}
      />

      <AuthButton
        label={t.auth_register_cta}
        loading={busy}
        onPress={() => void submit()}
      />

      <AppText
        variant="caption"
        style={{ color: colors.textTertiary, textAlign }}
      >
        {t.auth_forgot_note}
      </AppText>
      <AppText
        variant="caption"
        style={{ color: colors.textTertiary, textAlign }}
      >
        {t.auth_privacy_note}
      </AppText>

      <AuthLink
        label={t.auth_to_login}
        onPress={() => router.replace("/login")}
      />
      <AuthLink label={t.auth_skip} muted onPress={goBack} />
    </AuthScaffold>
  );
}

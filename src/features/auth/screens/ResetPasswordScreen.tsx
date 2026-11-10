import React, { useRef, useState } from "react";
import { type TextInput } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { KeyRound, Lock } from "lucide-react-native";
import { useDirection } from "@/core/i18n/useDirection";
import { useLanguage } from "@/core/i18n/LanguageContext";
import { useTheme } from "@/core/theme/ThemeContext";
import { useAuth } from "@/features/auth/AuthContext";
import {
  CODE_LENGTH,
  MIN_PASSWORD_LENGTH,
  RESEND_SECONDS,
} from "@/features/auth/config";
import { errorKey, normalizeCode } from "@/features/auth/errors";
import { useCountdown } from "@/features/auth/useCountdown";
import {
  AuthButton,
  AuthField,
  AuthLink,
  AuthScaffold,
  Banner,
} from "@/features/auth/components/AuthUi";
import { AppText } from "@/shared/components/ui/AppText";

export default function ResetPasswordScreen() {
  const { t } = useLanguage();
  const { colors } = useTheme();
  const { textAlign } = useDirection();
  const { resetPassword, forgotPassword } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();
  const email = typeof params.email === "string" ? params.email : "";
  const passwordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);
  const { left, restart } = useCountdown(RESEND_SECONDS);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  if (!email) {
    return (
      <AuthScaffold title={t.auth_reset_title}>
        <AuthButton
          label={t.auth_forgot_cta}
          onPress={() => router.replace("/forgot-password")}
        />
      </AuthScaffold>
    );
  }

  const codeError =
    submitted && code.length !== CODE_LENGTH ? t.auth_err_code_format : null;
  const passwordError =
    submitted && password.length < MIN_PASSWORD_LENGTH
      ? t.auth_err_weak_password
      : null;
  const confirmError =
    submitted && confirm !== password ? t.auth_err_mismatch : null;

  const submit = async () => {
    setSubmitted(true);
    setFailure(null);
    setNotice(null);

    if (
      code.length !== CODE_LENGTH ||
      password.length < MIN_PASSWORD_LENGTH ||
      confirm !== password
    ) {
      return;
    }

    setBusy(true);

    try {
      await resetPassword(email, code, password);
      router.replace({ pathname: "/login", params: { reset: "1", email } });
    } catch (error) {
      setFailure(t[errorKey(error)]);
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    if (left > 0 || busy) {
      return;
    }

    setFailure(null);
    setNotice(null);
    setBusy(true);

    try {
      await forgotPassword(email);
      restart();
      setNotice(t.auth_code_sent);
    } catch (error) {
      setFailure(t[errorKey(error)]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthScaffold
      title={t.auth_reset_title}
      subtitle={t.auth_reset_subtitle.replace("{email}", email)}
    >
      {failure ? <Banner kind="error" text={failure} /> : null}
      {notice ? <Banner kind="success" text={notice} /> : null}

      <AuthField
        label={t.auth_code}
        icon={KeyRound}
        value={code}
        onChangeText={(value) => setCode(normalizeCode(value, CODE_LENGTH))}
        placeholder="------"
        keyboardType="number-pad"
        autoComplete="one-time-code"
        textContentType="oneTimeCode"
        maxLength={CODE_LENGTH}
        returnKeyType="next"
        onSubmitEditing={() => passwordRef.current?.focus()}
        editable={!busy}
        error={codeError}
      />
      <AuthField
        ref={passwordRef}
        label={t.auth_new_password}
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
        label={t.auth_reset_cta}
        loading={busy}
        onPress={() => void submit()}
      />

      <AppText
        variant="caption"
        style={{ color: colors.textTertiary, textAlign }}
      >
        {t.auth_check_spam}
      </AppText>

      <AuthLink
        label={
          left > 0
            ? t.auth_resend_in.replace("{s}", String(left))
            : t.auth_resend
        }
        muted={left > 0}
        onPress={() => void resend()}
      />
      <AuthLink
        label={t.auth_to_login}
        muted
        onPress={() => router.replace("/login")}
      />
    </AuthScaffold>
  );
}

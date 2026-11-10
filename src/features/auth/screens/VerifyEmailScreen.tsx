import React, { useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { KeyRound } from "lucide-react-native";
import { useDirection } from "@/core/i18n/useDirection";
import { useLanguage } from "@/core/i18n/LanguageContext";
import { useTheme } from "@/core/theme/ThemeContext";
import { useAuth } from "@/features/auth/AuthContext";
import { CODE_LENGTH, RESEND_SECONDS } from "@/features/auth/config";
import { errorKey, normalizeCode } from "@/features/auth/errors";
import { useCountdown } from "@/features/auth/useCountdown";
import {
  AuthButton,
  AuthField,
  AuthLink,
  AuthScaffold,
  Banner,
  useGoBack,
} from "@/features/auth/components/AuthUi";
import { AppText } from "@/shared/components/ui/AppText";

export default function VerifyEmailScreen() {
  const { t } = useLanguage();
  const { colors } = useTheme();
  const { textAlign } = useDirection();
  const { verifyEmail, resendCode } = useAuth();
  const router = useRouter();
  const goBack = useGoBack();
  const params = useLocalSearchParams<{ email?: string }>();
  const email = typeof params.email === "string" ? params.email : "";
  const { left, restart } = useCountdown(RESEND_SECONDS);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  if (!email) {
    return (
      <AuthScaffold title={t.auth_verify_title}>
        <AuthButton
          label={t.auth_login_cta}
          onPress={() => router.replace("/login")}
        />
      </AuthScaffold>
    );
  }

  const codeError =
    submitted && code.length !== CODE_LENGTH ? t.auth_err_code_format : null;

  const submit = async () => {
    setSubmitted(true);
    setFailure(null);
    setNotice(null);

    if (code.length !== CODE_LENGTH) {
      return;
    }

    setBusy(true);

    try {
      await verifyEmail(email, code);
      goBack();
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
      await resendCode(email);
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
      title={t.auth_verify_title}
      subtitle={t.auth_verify_subtitle.replace("{email}", email)}
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
        returnKeyType="go"
        onSubmitEditing={() => void submit()}
        editable={!busy}
        error={codeError}
      />

      <AuthButton
        label={t.auth_verify_cta}
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
        label={t.auth_change_email}
        muted
        onPress={() => router.replace("/register")}
      />
    </AuthScaffold>
  );
}

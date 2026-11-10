import React, { useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Mail } from "lucide-react-native";
import { useLanguage } from "@/core/i18n/LanguageContext";
import { useAuth } from "@/features/auth/AuthContext";
import { errorKey, isValidEmail } from "@/features/auth/errors";
import {
  AuthButton,
  AuthField,
  AuthLink,
  AuthScaffold,
  Banner,
  useGoBack,
} from "@/features/auth/components/AuthUi";

export default function ForgotPasswordScreen() {
  const { t } = useLanguage();
  const { forgotPassword } = useAuth();
  const router = useRouter();
  const goBack = useGoBack();
  const params = useLocalSearchParams<{ email?: string }>();
  const [email, setEmail] = useState(
    typeof params.email === "string" ? params.email : "",
  );
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  const emailError =
    submitted && !isValidEmail(email) ? t.auth_err_invalid_email : null;

  const submit = async () => {
    setSubmitted(true);
    setFailure(null);

    if (!isValidEmail(email)) {
      return;
    }

    const normalized = email.trim().toLowerCase();

    setBusy(true);

    try {
      await forgotPassword(normalized);
      router.replace({
        pathname: "/reset-password",
        params: { email: normalized },
      });
    } catch (error) {
      setFailure(t[errorKey(error)]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthScaffold title={t.auth_forgot_title} subtitle={t.auth_forgot_subtitle}>
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
        returnKeyType="go"
        onSubmitEditing={() => void submit()}
        editable={!busy}
        error={emailError}
      />

      <AuthButton
        label={t.auth_forgot_cta}
        loading={busy}
        onPress={() => void submit()}
      />

      <AuthLink
        label={t.auth_to_login}
        onPress={() => router.replace("/login")}
      />
      <AuthLink label={t.auth_skip} muted onPress={goBack} />
    </AuthScaffold>
  );
}

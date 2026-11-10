import React, { useRef, useState } from "react";
import { type TextInput } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Lock, Mail } from "lucide-react-native";
import { useLanguage } from "@/core/i18n/LanguageContext";
import { ApiError } from "@/features/auth/api";
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

export default function LoginScreen() {
  const { t } = useLanguage();
  const { login } = useAuth();
  const router = useRouter();
  const goBack = useGoBack();
  const passwordRef = useRef<TextInput>(null);
  const params = useLocalSearchParams<{ reset?: string; email?: string }>();
  const [email, setEmail] = useState(
    typeof params.email === "string" ? params.email : "",
  );
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  const emailError =
    submitted && !isValidEmail(email) ? t.auth_err_invalid_email : null;
  const passwordError = submitted && !password ? t.auth_err_required : null;

  const submit = async () => {
    setSubmitted(true);
    setFailure(null);

    if (!isValidEmail(email) || !password) {
      return;
    }

    setBusy(true);

    const normalized = email.trim().toLowerCase();

    try {
      await login(normalized, password);
      goBack();
    } catch (error) {
      if (error instanceof ApiError && error.code === "email_not_verified") {
        router.replace({
          pathname: "/verify-email",
          params: { email: normalized },
        });
        return;
      }

      setFailure(t[errorKey(error)]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthScaffold title={t.auth_login_title} subtitle={t.auth_login_subtitle}>
      {params.reset === "1" ? (
        <Banner kind="success" text={t.auth_reset_done} />
      ) : null}
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
        autoComplete="current-password"
        textContentType="password"
        returnKeyType="go"
        onSubmitEditing={() => void submit()}
        editable={!busy}
        error={passwordError}
      />

      <AuthButton
        label={t.auth_login_cta}
        loading={busy}
        onPress={() => void submit()}
      />

      <AuthLink
        label={t.auth_forgot_link}
        muted
        onPress={() =>
          router.push({
            pathname: "/forgot-password",
            params: { email: email.trim().toLowerCase() },
          })
        }
      />
      <AuthLink
        label={t.auth_to_register}
        onPress={() => router.replace("/register")}
      />
      <AuthLink label={t.auth_skip} muted onPress={goBack} />
    </AuthScaffold>
  );
}

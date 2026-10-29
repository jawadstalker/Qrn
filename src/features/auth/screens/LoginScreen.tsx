import React, { useRef, useState } from "react";
import { type TextInput } from "react-native";
import { useRouter } from "expo-router";
import { Lock, Mail } from "lucide-react-native";
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

export default function LoginScreen() {
  const { t } = useLanguage();
  const { login } = useAuth();
  const router = useRouter();
  const goBack = useGoBack();
  const passwordRef = useRef<TextInput>(null);
  const [email, setEmail] = useState("");
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

    try {
      await login(email.trim().toLowerCase(), password);
      goBack();
    } catch (error) {
      setFailure(t[errorKey(error)]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthScaffold title={t.auth_login_title} subtitle={t.auth_login_subtitle}>
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
        label={t.auth_to_register}
        onPress={() => router.replace("/register")}
      />
      <AuthLink label={t.auth_skip} muted onPress={goBack} />
    </AuthScaffold>
  );
}

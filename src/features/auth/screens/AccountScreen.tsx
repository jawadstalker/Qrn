import React, { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import {
  KeyRound,
  Lock,
  LogOut,
  Mail,
  Trash2,
  type LucideIcon,
} from "lucide-react-native";
import { useDirection } from "@/core/i18n/useDirection";
import { useLanguage } from "@/core/i18n/LanguageContext";
import { useTheme } from "@/core/theme/ThemeContext";
import { useAuth } from "@/features/auth/AuthContext";
import { MIN_PASSWORD_LENGTH } from "@/features/auth/config";
import { errorKey } from "@/features/auth/errors";
import {
  AuthButton,
  AuthField,
  AuthScaffold,
  Banner,
  useGoBack,
} from "@/features/auth/components/AuthUi";
import { AppText } from "@/shared/components/ui/AppText";

type Panel = "none" | "password" | "delete";

function formatTime(ms: number, language: string): string {
  try {
    return new Date(ms).toLocaleString(language === "fa" ? "fa-IR" : "en-GB", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return new Date(ms).toISOString();
  }
}

function Divider() {
  const { colors } = useTheme();

  return <View style={[styles.divider, { backgroundColor: colors.border }]} />;
}

export default function AccountScreen() {
  const { t, language } = useLanguage();
  const { colors } = useTheme();
  const { row, textAlign } = useDirection();
  const router = useRouter();
  const goBack = useGoBack();
  const {
    status,
    user,
    syncStatus,
    lastSyncAt,
    sync,
    logout,
    changePassword,
    deleteAccount,
  } = useAuth();
  const [panel, setPanel] = useState<Panel>("none");
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  if (status !== "in" || !user) {
    return (
      <AuthScaffold title={t.auth_account_title} subtitle={t.auth_account_card_out}>
        <AuthButton
          label={t.auth_login_cta}
          onPress={() => router.replace("/login")}
        />
        <AuthButton
          label={t.auth_register_cta}
          variant="soft"
          onPress={() => router.replace("/register")}
        />
      </AuthScaffold>
    );
  }

  const open = (target: Panel) => {
    setPanel((value) => (value === target ? "none" : target));
    setFailure(null);
    setNotice(null);
    setSubmitted(false);
    setCurrent("");
    setNext("");
    setDeletePassword("");
  };

  const run = async (action: () => Promise<void>, onDone?: () => void) => {
    setBusy(true);
    setFailure(null);

    try {
      await action();
      onDone?.();
    } catch (error) {
      setFailure(t[errorKey(error)]);
    } finally {
      setBusy(false);
    }
  };

  const savePassword = () => {
    setSubmitted(true);

    if (!current || next.length < MIN_PASSWORD_LENGTH) {
      return;
    }

    void run(
      () => changePassword(current, next),
      () => {
        setPanel("none");
        setCurrent("");
        setNext("");
        setSubmitted(false);
        setNotice(t.auth_password_changed);
      },
    );
  };

  const confirmDelete = () => {
    setSubmitted(true);

    if (!deletePassword) {
      return;
    }

    void run(() => deleteAccount(deletePassword), goBack);
  };

  const syncLabel =
    syncStatus === "syncing"
      ? t.auth_sync_status_syncing
      : syncStatus === "error"
        ? t.auth_sync_status_error
        : lastSyncAt
          ? t.auth_sync_last.replace("{time}", formatTime(lastSyncAt, language))
          : t.auth_sync_never;

  return (
    <AuthScaffold title={t.auth_account_title}>
      {failure ? <Banner kind="error" text={failure} /> : null}
      {notice ? <Banner kind="success" text={notice} /> : null}

      <View style={[styles.identity, { flexDirection: row }]}>
        <View style={[styles.avatar, { backgroundColor: colors.tintSoft }]}>
          <Mail size={22} color={colors.onTint} />
        </View>
        <View style={styles.identityText}>
          <AppText
            variant="caption"
            style={{ color: colors.textSecondary, textAlign }}
          >
            {t.auth_signed_in_as}
          </AppText>
          <AppText
            variant="body"
            numberOfLines={1}
            forceEnglish
            style={{ color: colors.text, textAlign, fontWeight: "800" }}
          >
            {user.email}
          </AppText>
        </View>
      </View>

      <Divider />

      <View style={styles.block}>
        <AppText
          variant="bodySmall"
          style={{
            color: syncStatus === "error" ? colors.error : colors.textSecondary,
            textAlign,
          }}
          accessibilityLiveRegion="polite"
        >
          {syncLabel}
        </AppText>
        <AuthButton
          label={t.auth_sync_now}
          variant="soft"
          loading={syncStatus === "syncing"}
          onPress={() => void sync()}
        />
      </View>

      <Divider />

      <View style={styles.block}>
        <MenuRow
          icon={KeyRound}
          label={t.auth_change_password}
          expanded={panel === "password"}
          onPress={() => open("password")}
        />
        {panel === "password" ? (
          <View style={styles.block}>
            <AuthField
              label={t.auth_current_password}
              icon={Lock}
              secure
              value={current}
              onChangeText={setCurrent}
              autoComplete="current-password"
              textContentType="password"
              editable={!busy}
              error={submitted && !current ? t.auth_err_required : null}
            />
            <AuthField
              label={t.auth_new_password}
              icon={Lock}
              secure
              value={next}
              onChangeText={setNext}
              autoComplete="new-password"
              textContentType="newPassword"
              editable={!busy}
              hint={t.auth_password_hint}
              error={
                submitted && next.length < MIN_PASSWORD_LENGTH
                  ? t.auth_err_weak_password
                  : null
              }
            />
            <AuthButton
              label={t.auth_save}
              loading={busy}
              onPress={savePassword}
            />
          </View>
        ) : null}
      </View>

      <Divider />

      <View style={styles.block}>
        <MenuRow
          icon={LogOut}
          label={t.auth_logout}
          onPress={() => void run(logout, goBack)}
          disabled={busy}
        />
        <AppText
          variant="caption"
          style={{ color: colors.textTertiary, textAlign }}
        >
          {t.auth_logout_hint}
        </AppText>
      </View>

      <Divider />

      <View style={styles.block}>
        <MenuRow
          icon={Trash2}
          label={t.auth_delete}
          danger
          expanded={panel === "delete"}
          onPress={() => open("delete")}
        />
        {panel === "delete" ? (
          <View style={styles.block}>
            <AppText
              variant="bodySmall"
              style={{ color: colors.text, textAlign, fontWeight: "800" }}
            >
              {t.auth_delete_title}
            </AppText>
            <AppText
              variant="bodySmall"
              style={{ color: colors.textSecondary, textAlign }}
            >
              {t.auth_delete_warning}
            </AppText>
            <AuthField
              label={t.auth_delete_password_prompt}
              icon={Lock}
              secure
              value={deletePassword}
              onChangeText={setDeletePassword}
              autoComplete="current-password"
              textContentType="password"
              editable={!busy}
              error={submitted && !deletePassword ? t.auth_err_required : null}
            />
            <AuthButton
              label={t.auth_delete_confirm}
              variant="danger"
              loading={busy}
              onPress={confirmDelete}
            />
            <AuthButton
              label={t.auth_cancel}
              variant="soft"
              disabled={busy}
              onPress={() => open("delete")}
            />
          </View>
        ) : null}
      </View>
    </AuthScaffold>
  );
}

function MenuRow({
  icon: Icon,
  label,
  onPress,
  danger = false,
  expanded,
  disabled = false,
}: {
  icon: LucideIcon;
  label: string;
  onPress: () => void;
  danger?: boolean;
  expanded?: boolean;
  disabled?: boolean;
}) {
  const { colors } = useTheme();
  const { row, textAlign } = useDirection();
  const tone = danger ? colors.error : colors.text;

  return (
    <AuthButtonRow
      onPress={onPress}
      disabled={disabled}
      label={label}
      expanded={expanded}
    >
      <View style={[styles.menuRow, { flexDirection: row }]}>
        <Icon size={22} color={tone} />
        <AppText
          variant="body"
          style={{ color: tone, flex: 1, textAlign, fontWeight: "700" }}
        >
          {label}
        </AppText>
      </View>
    </AuthButtonRow>
  );
}

function AuthButtonRow({
  children,
  onPress,
  disabled,
  label,
  expanded,
}: {
  children: React.ReactNode;
  onPress: () => void;
  disabled: boolean;
  label: string;
  expanded?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ expanded, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.rowPress, { opacity: pressed ? 0.7 : 1 }]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  identity: { alignItems: "center", gap: 12 },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  identityText: { flex: 1, gap: 2 },
  divider: { height: StyleSheet.hairlineWidth },
  block: { gap: 12 },
  menuRow: { alignItems: "center", gap: 12 },
  rowPress: { minHeight: 44, justifyContent: "center" },
});

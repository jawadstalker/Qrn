import React, { useCallback, useState } from "react";
import { StyleSheet, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import { Hash } from "lucide-react-native";
import { useDirection } from "@/core/i18n/useDirection";
import { useLanguage } from "@/core/i18n/LanguageContext";
import { useTheme } from "@/core/theme/ThemeContext";
import { useAuth } from "@/features/auth/AuthContext";
import {
  AuthButton,
  AuthField,
  AuthLink,
  AuthScaffold,
  Banner,
} from "@/features/auth/components/AuthUi";
import { roomsApi } from "@/features/rooms/api";
import { AvatarBadge } from "@/features/rooms/components/AvatarBadge";
import { roomErrorMessage } from "@/features/rooms/errors";
import { LAST_ROOM_KEY, normalizeRoomCode } from "@/features/rooms/format";
import type { Profile } from "@/features/rooms/types";
import { AppText } from "@/shared/components/ui/AppText";

export default function RoomsHubScreen() {
  const { t } = useLanguage();
  const { colors } = useTheme();
  const { row } = useDirection();
  const { status, getToken } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [lastRoom, setLastRoom] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      if (status !== "in") {
        return undefined;
      }

      void (async () => {
        try {
          const result = await roomsApi.getProfile(getToken());

          if (active) {
            setProfile(result.profile);
          }
        } catch (error) {
          if (active) {
            setFailure(roomErrorMessage(error, t));
          }
        }

        const stored = await AsyncStorage.getItem(LAST_ROOM_KEY);

        if (active) {
          setLastRoom(stored);
        }
      })();

      return () => {
        active = false;
      };
    }, [getToken, status, t]),
  );

  if (status !== "in") {
    return (
      <AuthScaffold title={t.room_title} subtitle={t.room_subtitle}>
        <Banner kind="error" text={t.room_login_needed} />
        <AuthButton
          label={t.auth_login_cta}
          onPress={() => router.push("/login")}
        />
      </AuthScaffold>
    );
  }

  const needsProfile = profile !== null && !profile.hasProfile;

  const join = async () => {
    setFailure(null);

    if (needsProfile) {
      setFailure(t.room_set_profile_first);
      return;
    }

    setBusy(true);

    try {
      const room = await roomsApi.join(getToken(), code);

      await AsyncStorage.setItem(LAST_ROOM_KEY, room.code);
      router.push({ pathname: "/room", params: { code: room.code } });
    } catch (error) {
      setFailure(roomErrorMessage(error, t));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthScaffold title={t.room_title} subtitle={t.room_subtitle}>
      {failure ? <Banner kind="error" text={failure} /> : null}

      {profile ? (
        <View
          style={[
            styles.profile,
            { backgroundColor: colors.surface, flexDirection: row },
          ]}
        >
          <AvatarBadge avatar={profile.avatar} size={52} />
          <View style={styles.profileText}>
            <AppText variant="h3" style={{ color: colors.text }}>
              {profile.hasProfile ? profile.displayName : "—"}
            </AppText>
            <AppText variant="caption" style={{ color: colors.textSecondary }}>
              {needsProfile ? t.room_set_profile_first : t.room_edit_avatar}
            </AppText>
          </View>
        </View>
      ) : null}

      <AuthButton
        label={t.room_edit_avatar}
        variant={needsProfile ? "primary" : "soft"}
        onPress={() => router.push("/avatar")}
      />

      <AuthButton
        label={t.room_create}
        disabled={needsProfile}
        onPress={() => router.push("/room-create")}
      />

      <AuthField
        label={t.room_code}
        icon={Hash}
        value={code}
        onChangeText={(value) => setCode(normalizeRoomCode(value))}
        placeholder={t.room_code_placeholder}
        maxLength={6}
        returnKeyType="go"
        onSubmitEditing={() => void join()}
        editable={!busy}
      />
      <AuthButton
        label={t.room_join_cta}
        variant="soft"
        loading={busy}
        disabled={code.length !== 6}
        onPress={() => void join()}
      />

      {lastRoom ? (
        <AuthLink
          label={t.room_resume}
          muted
          onPress={() =>
            router.push({ pathname: "/room", params: { code: lastRoom } })
          }
        />
      ) : null}
    </AuthScaffold>
  );
}

const styles = StyleSheet.create({
  profile: {
    alignItems: "center",
    gap: 14,
    padding: 14,
    borderRadius: 18,
  },
  profileText: {
    flex: 1,
    gap: 2,
  },
});

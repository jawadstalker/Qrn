import React, { useCallback, useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { User } from "lucide-react-native";
import { useLanguage } from "@/core/i18n/LanguageContext";
import { useTheme } from "@/core/theme/ThemeContext";
import { useAuth } from "@/features/auth/AuthContext";
import {
  AuthButton,
  AuthField,
  Banner,
  useGoBack,
} from "@/features/auth/components/AuthUi";
import {
  ACCENT_COLORS,
  DEFAULT_AVATAR,
  FACE_TONES,
  GLOW_COLORS,
  HAIR_COLORS,
  HAIR_STYLES,
  HATS,
  HAT_COLORS,
  OUTFIT_COLORS,
  OUTFIT_STYLES,
  PANTS_COLORS,
  randomAvatar,
  sanitizeAvatar,
  type AvatarParams,
  type HairStyle,
  type Hat,
  type OutfitStyle,
} from "@/features/rooms/avatar";
import { roomsApi } from "@/features/rooms/api";
import { AvatarView3D } from "@/features/rooms/components/AvatarView3D";
import { GameFrame } from "@/features/rooms/components/GameFrame";
import {
  ChipRow,
  SwatchRow,
  TabStrip,
} from "@/features/rooms/components/Pickers";
import { roomErrorMessage } from "@/features/rooms/errors";
import { AppText } from "@/shared/components/ui/AppText";

const NAME_MIN = 2;
const NAME_MAX = 24;

type Tab = "look" | "hair" | "hat" | "outfit";

export default function AvatarScreen() {
  const { t } = useLanguage();
  const { colors } = useTheme();
  const { getToken } = useAuth();
  const goBack = useGoBack();
  const { width, height } = useWindowDimensions();
  const [tab, setTab] = useState<Tab>("look");
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState<AvatarParams>(DEFAULT_AVATAR);
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const [previewFailed, setPreviewFailed] = useState(false);

  useEffect(() => {
    let active = true;

    void (async () => {
      try {
        const { profile } = await roomsApi.getProfile(getToken());

        if (active) {
          setName(profile.hasProfile ? profile.displayName : "");
          setAvatar(sanitizeAvatar(profile.avatar));
        }
      } catch (error) {
        if (active) {
          setFailure(roomErrorMessage(error, t));
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [getToken, t]);

  const onPreviewFailure = useCallback(() => setPreviewFailed(true), []);
  const trimmed = name.trim();
  const nameError =
    submitted && (trimmed.length < NAME_MIN || trimmed.length > NAME_MAX)
      ? t.avatar_err_name
      : null;
  const previewWidth = Math.min(width, 520);
  const previewHeight = Math.round(Math.min(330, Math.max(220, height * 0.36)));

  const update = (patch: Partial<AvatarParams>) =>
    setAvatar((current) => ({ ...current, ...patch }));

  const save = async () => {
    setSubmitted(true);
    setFailure(null);

    if (trimmed.length < NAME_MIN || trimmed.length > NAME_MAX) {
      setTab("look");
      return;
    }

    setBusy(true);

    try {
      await roomsApi.saveProfile(getToken(), trimmed, { ...avatar });
      goBack();
    } catch (error) {
      setFailure(roomErrorMessage(error, t));
    } finally {
      setBusy(false);
    }
  };

  const tabs = [
    { value: "look", label: t.avatar_tab_look },
    { value: "hair", label: t.avatar_tab_hair },
    { value: "hat", label: t.avatar_tab_hat },
    { value: "outfit", label: t.avatar_tab_outfit },
  ] as const;

  const hairOptions = HAIR_STYLES.map((value) => ({
    value,
    label: t[`hair_${value}`] ?? value,
  }));
  const hatOptions = HATS.map((value) => ({
    value,
    label: t[`hat_${value}`] ?? value,
  }));
  const outfitOptions = OUTFIT_STYLES.map((value) => ({
    value,
    label: t[`outfit_${value}`] ?? value,
  }));

  return (
    <GameFrame title={t.avatar_title}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View
          style={[
            styles.preview,
            { backgroundColor: colors.tintSoft, height: previewHeight },
          ]}
        >
          {previewFailed ? (
            <AppText
              variant="caption"
              style={{ color: colors.textSecondary, textAlign: "center" }}
            >
              {t.avatar_fallback}
            </AppText>
          ) : (
            <AvatarView3D
              width={previewWidth}
              height={previewHeight}
              avatar={avatar}
              onFailure={onPreviewFailure}
            />
          )}
        </View>

        <View style={styles.tabs}>
          <TabStrip<Tab> tabs={tabs} selected={tab} onSelect={setTab} />
        </View>

        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.options}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {failure ? <Banner kind="error" text={failure} /> : null}

          {tab === "look" ? (
            <>
              <AuthField
                label={t.avatar_name}
                icon={User}
                value={name}
                onChangeText={setName}
                maxLength={NAME_MAX}
                editable={!busy}
                error={nameError}
              />
              <SwatchRow
                label={t.avatar_face}
                colors={FACE_TONES}
                selected={avatar.face}
                onSelect={(face) => update({ face })}
              />
              <ChipRow<"on" | "off">
                label={t.avatar_glasses}
                options={[
                  { value: "off", label: t.avatar_glasses_off },
                  { value: "on", label: t.avatar_glasses },
                ]}
                selected={avatar.glasses ? "on" : "off"}
                onSelect={(value) => update({ glasses: value === "on" })}
              />
            </>
          ) : null}

          {tab === "hair" ? (
            <>
              <ChipRow<HairStyle>
                label={t.avatar_hairstyle}
                options={hairOptions}
                selected={avatar.hairStyle}
                onSelect={(hairStyle) => update({ hairStyle })}
              />
              <SwatchRow
                label={t.avatar_hair}
                colors={HAIR_COLORS}
                selected={avatar.hairColor}
                onSelect={(hairColor) => update({ hairColor })}
              />
              <SwatchRow
                label={t.avatar_glow}
                colors={GLOW_COLORS}
                selected={avatar.glow}
                onSelect={(glow) => update({ glow })}
              />
            </>
          ) : null}

          {tab === "hat" ? (
            <>
              <ChipRow<Hat>
                label={t.avatar_hat}
                options={hatOptions}
                selected={avatar.hat}
                onSelect={(hat) => update({ hat })}
              />
              {avatar.hat !== "none" ? (
                <SwatchRow
                  label={t.avatar_hat_color}
                  colors={HAT_COLORS}
                  selected={avatar.hatColor}
                  onSelect={(hatColor) => update({ hatColor })}
                />
              ) : null}
            </>
          ) : null}

          {tab === "outfit" ? (
            <>
              <ChipRow<OutfitStyle>
                label={t.avatar_outfit_style}
                options={outfitOptions}
                selected={avatar.outfitStyle}
                onSelect={(outfitStyle) => update({ outfitStyle })}
              />
              <SwatchRow
                label={t.avatar_top}
                colors={OUTFIT_COLORS}
                selected={avatar.outfit}
                onSelect={(outfit) => update({ outfit })}
              />
              <SwatchRow
                label={t.avatar_pants}
                colors={PANTS_COLORS}
                selected={avatar.pants}
                onSelect={(pants) => update({ pants })}
              />
              <SwatchRow
                label={t.avatar_accent}
                colors={ACCENT_COLORS}
                selected={avatar.accent}
                onSelect={(accent) => update({ accent })}
              />
            </>
          ) : null}
        </ScrollView>

        <View style={styles.actions}>
          <View style={styles.flex}>
            <AuthButton
              label={t.avatar_random}
              variant="soft"
              onPress={() => setAvatar(randomAvatar())}
            />
          </View>
          <View style={styles.flex}>
            <AuthButton
              label={t.avatar_save}
              loading={busy}
              onPress={() => void save()}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </GameFrame>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  preview: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  tabs: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  options: {
    gap: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 6,
  },
});

import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useDirection } from "@/core/i18n/useDirection";
import { useLanguage } from "@/core/i18n/LanguageContext";
import { useTheme } from "@/core/theme/ThemeContext";
import { useAuth } from "@/features/auth/AuthContext";
import {
  AuthButton,
  AuthScaffold,
  Banner,
} from "@/features/auth/components/AuthUi";
import { SURAHS } from "@/features/quran/data/surahs";
import { roomsApi } from "@/features/rooms/api";
import { Stepper } from "@/features/rooms/components/Pickers";
import { roomErrorMessage } from "@/features/rooms/errors";
import { LAST_ROOM_KEY } from "@/features/rooms/format";
import type { RoomMode } from "@/features/rooms/types";
import { AppText } from "@/shared/components/ui/AppText";

const MODES: readonly RoomMode[] = ["chain", "elimination"];
const MAX_RANGE = 50;

export default function CreateRoomScreen() {
  const { t } = useLanguage();
  const { colors } = useTheme();
  const { textAlign } = useDirection();
  const { getToken } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<RoomMode>("chain");
  const [surahId, setSurahId] = useState(112);
  const [start, setStart] = useState(1);
  const [end, setEnd] = useState(4);
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [lives, setLives] = useState(3);
  const [listOpen, setListOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  const surah = SURAHS.find((item) => item.id === surahId) ?? SURAHS[0]!;

  const chooseSurah = (id: number) => {
    const next = SURAHS.find((item) => item.id === id) ?? SURAHS[0]!;

    setSurahId(id);
    setStart(1);
    setEnd(Math.min(next.verses, 5));
    setListOpen(false);
  };

  const changeStart = (value: number) => {
    setStart(value);

    if (end <= value) {
      setEnd(value + 1);
    }
  };

  const create = async () => {
    setFailure(null);
    setBusy(true);

    try {
      const room = await roomsApi.create(getToken(), {
        mode,
        surah: surahId,
        startAyah: start,
        endAyah: end,
        maxPlayers,
        ...(mode === "elimination" ? { lives } : {}),
      });

      await AsyncStorage.setItem(LAST_ROOM_KEY, room.code);
      router.replace({ pathname: "/room", params: { code: room.code } });
    } catch (error) {
      setFailure(roomErrorMessage(error, t));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthScaffold title={t.create_title}>
      {failure ? <Banner kind="error" text={failure} /> : null}

      <AppText
        variant="bodySmall"
        style={{ color: colors.textSecondary, textAlign }}
      >
        {t.create_mode}
      </AppText>
      {MODES.map((item) => {
        const selected = item === mode;

        return (
          <Pressable
            key={item}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            onPress={() => setMode(item)}
            style={[
              styles.modeCard,
              {
                backgroundColor: selected ? colors.tintSoft : colors.surface,
                borderColor: selected ? colors.primary : "transparent",
              },
            ]}
          >
            <AppText variant="h3" style={{ color: colors.text, textAlign }}>
              {t[`mode_${item}`]}
            </AppText>
            <AppText
              variant="caption"
              style={{ color: colors.textSecondary, textAlign }}
            >
              {t[`mode_${item}_desc`]}
            </AppText>
          </Pressable>
        );
      })}

      <AppText
        variant="bodySmall"
        style={{ color: colors.textSecondary, textAlign }}
      >
        {t.create_surah}
      </AppText>
      <Pressable
        accessibilityRole="button"
        onPress={() => setListOpen((open) => !open)}
        style={[styles.surahButton, { backgroundColor: colors.surface }]}
      >
        <AppText variant="body" style={{ color: colors.text, textAlign }}>
          {`${surah.id}. ${surah.name} (${surah.verses})`}
        </AppText>
      </Pressable>
      {listOpen ? (
        <ScrollView
          nestedScrollEnabled
          style={[styles.list, { backgroundColor: colors.surface }]}
        >
          {SURAHS.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => chooseSurah(item.id)}
              style={[
                styles.listItem,
                item.id === surahId && { backgroundColor: colors.tintSoft },
              ]}
            >
              <AppText variant="body" style={{ color: colors.text, textAlign }}>
                {`${item.id}. ${item.name} (${item.verses})`}
              </AppText>
            </Pressable>
          ))}
        </ScrollView>
      ) : null}

      <Stepper
        label={t.create_from}
        value={start}
        min={1}
        max={Math.max(1, surah.verses - 1)}
        onChange={changeStart}
      />
      <Stepper
        label={t.create_to}
        value={end}
        min={start + 1}
        max={Math.min(surah.verses, start + MAX_RANGE)}
        onChange={setEnd}
      />
      <Stepper
        label={t.create_players}
        value={maxPlayers}
        min={1}
        max={8}
        onChange={setMaxPlayers}
      />
      {mode === "elimination" ? (
        <Stepper
          label={t.create_lives}
          value={lives}
          min={1}
          max={5}
          onChange={setLives}
        />
      ) : null}

      <View style={styles.gap} />
      <AuthButton
        label={t.create_cta}
        loading={busy}
        onPress={() => void create()}
      />
    </AuthScaffold>
  );
}

const styles = StyleSheet.create({
  modeCard: {
    gap: 4,
    padding: 14,
    borderRadius: 18,
    borderWidth: 2,
  },
  surahButton: {
    padding: 14,
    borderRadius: 16,
  },
  list: {
    maxHeight: 240,
    borderRadius: 16,
  },
  listItem: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  gap: {
    height: 4,
  },
});

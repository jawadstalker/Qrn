import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Check, Crown, Heart, Share2, Volume2, X } from "lucide-react-native";
import { useDirection } from "@/core/i18n/useDirection";
import { useLanguage } from "@/core/i18n/LanguageContext";
import { useTheme } from "@/core/theme/ThemeContext";
import { useAuth } from "@/features/auth/AuthContext";
import { AuthButton, Banner } from "@/features/auth/components/AuthUi";
import { SURAHS } from "@/features/quran/data/surahs";
import { useRecitation } from "@/features/quran/state/RecitationContext";
import { roomsApi } from "@/features/rooms/api";
import { sanitizeAvatar } from "@/features/rooms/avatar";
import { AvatarBadge } from "@/features/rooms/components/AvatarBadge";
import { GameFrame } from "@/features/rooms/components/GameFrame";
import { Stage3D } from "@/features/rooms/components/Stage3D";
import { roomErrorMessage } from "@/features/rooms/errors";
import { fill, LAST_ROOM_KEY } from "@/features/rooms/format";
import type { RoomPlayer, RoomState } from "@/features/rooms/types";
import { useRoom } from "@/features/rooms/useRoom";
import type { StageState } from "@/features/rooms/utils/stageScene";
import { AppText } from "@/shared/components/ui/AppText";

const SUCCESS = "#2F9E6E";

export default function RoomScreen() {
  const { t } = useLanguage();
  const { colors } = useTheme();
  const { row, textAlign } = useDirection();
  const { user, getToken } = useAuth();
  const router = useRouter();
  const recitation = useRecitation();
  const { width, height } = useWindowDimensions();
  const params = useLocalSearchParams<{ code?: string }>();
  const code = typeof params.code === "string" ? params.code.toUpperCase() : "";
  const { room, fatal, offline, apply, serverNow } = useRoom(code);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const [stageFailed, setStageFailed] = useState(false);
  const [, setClock] = useState(0);

  // The bot's audio must never run on into the next ayah (that would give the answer away).
  const recitationRef = useRef(recitation);

  recitationRef.current = recitation;

  useEffect(() => {
    const player = recitationRef.current;
    const saved = { autoNext: player.autoNext, repeat: player.repeat };

    player.setAutoNext(false);
    player.setRepeat(false);

    return () => {
      const current = recitationRef.current;

      current.setAutoNext(saved.autoNext);
      current.setRepeat(saved.repeat);
      current.stop();
    };
  }, []);

  // One tick per second drives the countdown.
  useEffect(() => {
    const timer = setInterval(() => setClock((value) => value + 1), 1000);

    return () => clearInterval(timer);
  }, []);

  // Remember the room so the hub can offer a way back; forget it when it is gone.
  useEffect(() => {
    if (fatal || room?.status === "finished") {
      void AsyncStorage.removeItem(LAST_ROOM_KEY);
    } else if (room) {
      void AsyncStorage.setItem(LAST_ROOM_KEY, room.code);
    }
  }, [fatal, room]);

  // Play the bot's ayah whenever a new prompt comes up.
  const roomRef = useRef<RoomState | null>(null);

  roomRef.current = room;

  const promptKey =
    room && room.status === "playing" && room.promptAyah !== null
      ? `${room.code}:${room.currentAyah}:${room.attempt}:${room.promptAyah}`
      : null;

  useEffect(() => {
    const current = roomRef.current;

    if (promptKey && current && current.promptAyah !== null) {
      recitationRef.current.playAyah(current.surah, current.promptAyah);
    }
  }, [promptKey]);

  const myId = user?.id ?? -1;
  const myTurn =
    room?.status === "playing" && room.turnUserId === myId && !fatal;
  const speakerPlaying = recitation.playing || recitation.loading;

  // A short buzz when the turn comes to me.
  useEffect(() => {
    if (myTurn) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [myTurn]);

  const stageState = useMemo<StageState>(
    () => ({
      players: (room?.players ?? [])
        .filter((player) => player.status !== "left")
        .map((player) => ({
          userId: player.userId,
          avatar: sanitizeAvatar(player.avatar),
          faded: player.status !== "active",
        })),
      turnUserId: room?.status === "playing" ? room.turnUserId : null,
      speakerPlaying,
      reciting:
        room?.status === "playing" &&
        room.turnUserId !== null &&
        !speakerPlaying,
    }),
    [room, speakerPlaying],
  );

  const onStageFailure = useCallback(() => setStageFailed(true), []);

  const run = async (action: () => Promise<RoomState | null>) => {
    setFailure(null);
    setBusy(true);

    try {
      const next = await action();

      if (next) {
        apply(next);
      }
    } catch (error) {
      setFailure(roomErrorMessage(error, t));
    } finally {
      setBusy(false);
    }
  };

  const leave = async () => {
    setBusy(true);

    try {
      await roomsApi.leave(getToken(), code);
    } catch {
      // Leaving is best effort: the room is dropped from this device either way.
    }

    await AsyncStorage.removeItem(LAST_ROOM_KEY);
    router.replace("/rooms");
  };

  const share = async () => {
    try {
      await Share.share({ message: fill(t.room_share_message, { code }) });
    } catch {
      // The share sheet was dismissed or is unavailable.
    }
  };

  if (fatal) {
    return (
      <GameFrame title={t.room_title} onBack={() => router.replace("/rooms")}>
        <View style={styles.centered}>
          <Banner kind="error" text={t[`room_err_${fatal}`] ?? t.room_gone} />
          <AuthButton
            label={t.room_back_hub}
            onPress={() => router.replace("/rooms")}
          />
        </View>
      </GameFrame>
    );
  }

  if (!room) {
    return (
      <GameFrame title={t.room_title}>
        <View style={styles.centered}>
          <AppText
            variant="display"
            forceEnglish
            style={{ color: colors.textSecondary, letterSpacing: 6 }}
          >
            {code}
          </AppText>
        </View>
      </GameFrame>
    );
  }

  const surah = SURAHS.find((item) => item.id === room.surah);
  const players = room.players.filter((p) => p.status !== "left");
  const isHost = room.hostId === myId;
  const stageWidth = Math.min(width, 520);
  const stageHeight = Math.round(
    Math.min(
      stageWidth * 0.86,
      height * (room.status === "playing" ? 0.42 : 0.34),
    ),
  );
  const turnPlayer = room.players.find((p) => p.userId === room.turnUserId);
  const secondsLeft =
    room.status === "playing" && room.turnDeadline !== null
      ? Math.max(0, room.turnDeadline - serverNow())
      : null;
  const timerRatio =
    secondsLeft !== null && room.turnSeconds > 0
      ? Math.min(1, secondsLeft / room.turnSeconds)
      : 0;
  const urgent = secondsLeft !== null && secondsLeft <= 10;
  const scoreboard = [...players].sort((a, b) => b.score - a.score);
  const winner = room.players.find((p) => p.userId === room.winnerId);
  const subtitle = `${surah?.name ?? room.surah} · ${fill(t.room_range, {
    from: room.startAyah,
    to: room.endAyah,
  })}`;

  const stage = stageFailed ? (
    <View
      style={[
        styles.stageFallback,
        { backgroundColor: colors.tintSoft, height: 120 },
      ]}
    >
      <AppText variant="caption" style={{ color: colors.textSecondary }}>
        {t.room_stage_fallback}
      </AppText>
    </View>
  ) : (
    <View
      style={[
        styles.stage,
        { backgroundColor: colors.tintSoft, width: stageWidth },
      ]}
    >
      <Stage3D
        width={stageWidth}
        height={stageHeight}
        state={stageState}
        floorColor={colors.surface}
        onFailure={onStageFailure}
      />
    </View>
  );

  const timerBadge =
    secondsLeft !== null ? (
      <View
        style={[
          styles.timer,
          { backgroundColor: urgent ? colors.error : colors.tintSoft },
        ]}
      >
        <AppText
          variant="bodySmall"
          style={{
            color: urgent ? colors.onPrimary : colors.onTint,
            fontWeight: "800",
          }}
        >
          {secondsLeft}
        </AppText>
      </View>
    ) : null;

  const playerChip = (player: RoomPlayer, compact: boolean) => {
    const isTurn =
      room.status === "playing" && player.userId === room.turnUserId;

    return (
      <View
        key={player.userId}
        style={[
          compact ? styles.chip : styles.playerRow,
          {
            backgroundColor: isTurn ? colors.tintSoft : colors.surface,
            borderColor: isTurn ? colors.primary : "transparent",
            flexDirection: row,
            opacity: player.status === "active" ? 1 : 0.5,
          },
        ]}
      >
        <AvatarBadge avatar={player.avatar} size={compact ? 32 : 40} />
        <View style={compact ? undefined : styles.flex}>
          <AppText
            variant={compact ? "caption" : "body"}
            numberOfLines={1}
            style={{ color: colors.text, textAlign }}
          >
            {player.name}
          </AppText>
          {room.status !== "lobby" ? (
            <View style={[styles.inline, { flexDirection: row }]}>
              <AppText
                variant="caption"
                style={{ color: colors.textSecondary, fontWeight: "700" }}
              >
                {player.score}
              </AppText>
              {room.mode === "elimination" ? (
                <>
                  <Heart size={12} color={colors.error} />
                  <AppText
                    variant="caption"
                    style={{ color: colors.textSecondary }}
                  >
                    {player.lives}
                  </AppText>
                </>
              ) : null}
            </View>
          ) : player.isHost ? (
            <View style={[styles.inline, { flexDirection: row }]}>
              <Crown size={12} color={colors.textSecondary} />
              <AppText
                variant="caption"
                style={{ color: colors.textSecondary }}
              >
                {t.room_host}
              </AppText>
            </View>
          ) : null}
        </View>
      </View>
    );
  };

  // ------------------------------------------------------------------ lobby
  if (room.status === "lobby") {
    return (
      <GameFrame
        title={t.room_title}
        subtitle={subtitle}
        onBack={() => router.replace("/rooms")}
      >
        <ScrollView
          contentContainerStyle={styles.lobby}
          showsVerticalScrollIndicator={false}
        >
          {offline ? <Banner kind="error" text={t.room_conn_lost} /> : null}
          {failure ? <Banner kind="error" text={failure} /> : null}
          {stage}

          <View style={[styles.codeCard, { backgroundColor: colors.surface }]}>
            <View style={styles.flex}>
              <AppText
                variant="caption"
                style={{ color: colors.textSecondary }}
              >
                {`${t.room_code} · ${t[`mode_${room.mode}`]} · ${players.length}/${room.maxPlayers}`}
              </AppText>
              <AppText
                variant="display"
                forceEnglish
                style={{ color: colors.text, letterSpacing: 6 }}
              >
                {room.code}
              </AppText>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t.room_share}
              onPress={() => void share()}
              style={[styles.roundButton, { backgroundColor: colors.tintSoft }]}
            >
              <Share2 size={22} color={colors.onTint} />
            </Pressable>
          </View>

          <View style={styles.list}>
            {players.map((p) => playerChip(p, false))}
          </View>

          {isHost ? (
            <AuthButton
              label={t.room_start}
              loading={busy}
              onPress={() => void run(() => roomsApi.start(getToken(), code))}
            />
          ) : (
            <AppText
              variant="body"
              style={{ color: colors.textSecondary, textAlign: "center" }}
            >
              {t.room_lobby_wait}
            </AppText>
          )}
          <AuthButton
            label={t.room_leave}
            variant="soft"
            disabled={busy}
            onPress={() => void leave()}
          />
        </ScrollView>
      </GameFrame>
    );
  }

  // ------------------------------------------------------------------ finished
  if (room.status === "finished") {
    return (
      <GameFrame
        title={t.room_finished}
        subtitle={subtitle}
        onBack={() => void leave()}
      >
        <ScrollView
          contentContainerStyle={styles.lobby}
          showsVerticalScrollIndicator={false}
        >
          {stage}
          <View
            style={[styles.resultCard, { backgroundColor: colors.surface }]}
          >
            <AppText
              variant="h2"
              style={{ color: colors.text, textAlign: "center" }}
            >
              {room.mode === "chain"
                ? t.room_team_done
                : winner
                  ? fill(t.room_winner, { name: winner.name })
                  : players.some((p) => p.status === "active")
                    ? t.room_draw
                    : t.room_all_out}
            </AppText>
          </View>
          <View style={styles.list}>
            {scoreboard.map((p) => playerChip(p, false))}
          </View>
          <AuthButton label={t.room_back_hub} onPress={() => void leave()} />
        </ScrollView>
      </GameFrame>
    );
  }

  // ------------------------------------------------------------------ playing
  const listening = myTurn && speakerPlaying && room.promptAyah !== null;
  const progress = fill(t.room_ayah_of, {
    n: room.currentAyah ?? room.startAyah,
    total: room.endAyah,
  });

  return (
    <GameFrame
      title={surah?.name ?? t.room_title}
      subtitle={progress}
      trailing={timerBadge}
      onBack={() => router.replace("/rooms")}
    >
      <View style={[styles.timerTrack, { backgroundColor: colors.surface }]}>
        <View
          style={[
            styles.timerFill,
            {
              width: `${Math.round(timerRatio * 100)}%`,
              backgroundColor: urgent ? colors.error : colors.primary,
            },
          ]}
        />
      </View>

      {offline ? <Banner kind="error" text={t.room_conn_lost} /> : null}
      <View style={styles.stageWrap}>{stage}</View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chips}
        contentContainerStyle={styles.chipsContent}
      >
        {players.map((p) => playerChip(p, true))}
      </ScrollView>

      <View style={[styles.panel, { backgroundColor: colors.surface }]}>
        {failure ? <Banner kind="error" text={failure} /> : null}

        {myTurn && room.currentAyah !== null ? (
          <>
            <View style={styles.panelHeader}>
              <View style={styles.flex}>
                <AppText
                  variant="h3"
                  style={{ color: colors.text, textAlign: "center" }}
                >
                  {t.room_turn_you}
                </AppText>
                <AppText
                  variant="body"
                  style={{ color: colors.textSecondary, textAlign: "center" }}
                >
                  {listening
                    ? t.room_listening
                    : fill(t.room_recite_ayah, { n: room.currentAyah })}
                </AppText>
              </View>
            </View>

            {listening ? null : (
              <>
                <View style={[styles.answers, { flexDirection: row }]}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t.room_i_did_right}
                    disabled={busy}
                    onPress={() =>
                      void run(() =>
                        roomsApi.turn(
                          getToken(),
                          code,
                          100,
                          room.currentAyah ?? 0,
                        ),
                      )
                    }
                    style={[
                      styles.answer,
                      { backgroundColor: SUCCESS, opacity: busy ? 0.6 : 1 },
                    ]}
                  >
                    <Check size={28} color="#FFFFFF" />
                    <AppText variant="bodySmall" style={styles.answerLabel}>
                      {t.room_i_did_right}
                    </AppText>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t.room_i_did_wrong}
                    disabled={busy}
                    onPress={() =>
                      void run(() =>
                        roomsApi.turn(
                          getToken(),
                          code,
                          0,
                          room.currentAyah ?? 0,
                        ),
                      )
                    }
                    style={[
                      styles.answer,
                      {
                        backgroundColor: colors.error,
                        opacity: busy ? 0.6 : 1,
                      },
                    ]}
                  >
                    <X size={28} color="#FFFFFF" />
                    <AppText variant="bodySmall" style={styles.answerLabel}>
                      {t.room_i_did_wrong}
                    </AppText>
                  </Pressable>
                </View>
                <AppText
                  variant="caption"
                  style={{ color: colors.textTertiary, textAlign: "center" }}
                >
                  {t.room_test_mode}
                </AppText>
              </>
            )}
          </>
        ) : (
          <View style={styles.panelHeader}>
            <View style={styles.flex}>
              <AppText
                variant="h3"
                style={{ color: colors.text, textAlign: "center" }}
              >
                {fill(t.room_waiting_for, { name: turnPlayer?.name ?? "" })}
              </AppText>
              <AppText
                variant="body"
                style={{ color: colors.textSecondary, textAlign: "center" }}
              >
                {speakerPlaying ? t.room_listening : progress}
              </AppText>
            </View>
          </View>
        )}

        {room.mode === "chain" && room.attempt === 2 ? (
          <AppText
            variant="caption"
            style={{ color: colors.textSecondary, textAlign: "center" }}
          >
            {t.room_retry}
          </AppText>
        ) : null}

        <View style={[styles.footer, { flexDirection: row }]}>
          {room.promptAyah !== null ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t.room_replay}
              onPress={() =>
                recitation.playAyah(room.surah, room.promptAyah ?? 1)
              }
              style={[styles.smallButton, { backgroundColor: colors.tintSoft }]}
            >
              <Volume2 size={18} color={colors.onTint} />
              <AppText variant="caption" style={{ color: colors.onTint }}>
                {t.room_replay}
              </AppText>
            </Pressable>
          ) : (
            <View />
          )}
          <Pressable
            accessibilityRole="button"
            disabled={busy}
            onPress={() => void leave()}
            hitSlop={8}
          >
            <AppText variant="caption" style={{ color: colors.textTertiary }}>
              {t.room_leave}
            </AppText>
          </Pressable>
        </View>
      </View>
    </GameFrame>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    gap: 16,
    paddingHorizontal: 24,
  },
  lobby: {
    gap: 14,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  stageWrap: {
    alignItems: "center",
  },
  stage: {
    alignSelf: "center",
    borderRadius: 20,
    overflow: "hidden",
  },
  stageFallback: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
  },
  codeCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 20,
  },
  roundButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
  },
  list: {
    gap: 8,
  },
  playerRow: {
    alignItems: "center",
    gap: 12,
    padding: 10,
    borderRadius: 16,
    borderWidth: 2,
  },
  chips: {
    flexGrow: 0,
    marginTop: 10,
  },
  chipsContent: {
    gap: 8,
    paddingHorizontal: 16,
  },
  chip: {
    alignItems: "center",
    gap: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
    borderWidth: 2,
    maxWidth: 160,
  },
  inline: {
    alignItems: "center",
    gap: 4,
  },
  timer: {
    minWidth: 42,
    height: 42,
    paddingHorizontal: 8,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  timerTrack: {
    height: 5,
    marginHorizontal: 16,
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 8,
  },
  timerFill: {
    height: 5,
    borderRadius: 3,
  },
  panel: {
    flex: 1,
    marginTop: 10,
    marginHorizontal: 12,
    padding: 14,
    gap: 10,
    borderRadius: 24,
    justifyContent: "space-between",
  },
  panelHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  answers: {
    gap: 12,
  },
  answer: {
    flex: 1,
    height: 74,
    gap: 4,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  answerLabel: {
    color: "#FFFFFF",
    fontWeight: "800",
  },
  footer: {
    alignItems: "center",
    justifyContent: "space-between",
  },
  smallButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  resultCard: {
    padding: 18,
    borderRadius: 20,
  },
});

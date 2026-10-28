import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
} from "expo-audio";
import {
  DEFAULT_RECITER_ID,
  RECITERS,
  ayahAudioUrl,
  getReciter,
} from "@/features/quran/data/reciters";
import { SURAHS } from "@/features/quran/data/surahs";
import { logAyahReps } from "@/features/quran/state/sectionStore";

export type PlaybackTarget =
  | { kind: "surah"; surahId: number }
  | { kind: "ayah"; surahId: number; ayah: number }
  | { kind: "range"; surahId: number; from: number; to: number };

/** How a range of verses is repeated by `playRange`. */
export interface RangePlan {
  /** Times each verse is played in a row. */
  ayahRepeats: number;
  /** Times the whole range is played. 0 repeats until stopped. */
  loops: number;
  /** Silent pause between two recitations, in seconds. */
  gapSeconds: number;
}

/** Where a range playback currently is. `loop`, `rep` start at 1; `loops` 0 means endless. */
export interface RangeProgress {
  ayah: number;
  rep: number;
  ayahRepeats: number;
  loop: number;
  loops: number;
}

interface RecitationValue {
  reciterId: string;
  setReciterId: (id: string) => void;
  target: PlaybackTarget | null;
  playing: boolean;
  /** True while a target is chosen but audio has not started yet. */
  loading: boolean;
  /** True when the audio did not load (offline or the server is unreachable). */
  failed: boolean;
  position: number;
  duration: number;
  repeat: boolean;
  setRepeat: (value: boolean) => void;
  autoNext: boolean;
  setAutoNext: (value: boolean) => void;
  playSurah: (surahId: number) => void;
  playAyah: (surahId: number, ayah: number) => void;
  /** Plays verses `from`..`to` with the repetition plan (verse repeats, section loops, pauses). */
  playRange: (
    surahId: number,
    from: number,
    to: number,
    plan: RangePlan,
  ) => void;
  /** Null unless a range is playing. */
  rangeProgress: RangeProgress | null;
  toggle: () => void;
  stop: () => void;
  seekBy: (seconds: number) => void;
  seekToRatio: (ratio: number) => void;
  playRelativeSurah: (step: 1 | -1) => void;
}

const RecitationContext = createContext<RecitationValue | undefined>(undefined);

const RECITER_KEY = "@quran_garden_reciter";
const LOAD_TIMEOUT_MS = 20000;
const STATUS_INTERVAL_MS = 400;
const LAST_SURAH = SURAHS[SURAHS.length - 1]!.id;

function sourceFor(
  target: PlaybackTarget,
  reciterId: string,
  ayah?: number,
): string {
  if (target.kind === "surah") {
    return getReciter(reciterId).surahUrl(target.surahId);
  }

  return ayahAudioUrl(
    target.surahId,
    target.kind === "range" ? (ayah ?? target.from) : target.ayah,
  );
}

export function RecitationProvider({ children }: { children: ReactNode }) {
  const player = useAudioPlayer(null, STATUS_INTERVAL_MS);
  const status = useAudioPlayerStatus(player);
  const [reciterId, setReciterState] = useState(DEFAULT_RECITER_ID);
  const [target, setTarget] = useState<PlaybackTarget | null>(null);
  const [repeat, setRepeat] = useState(false);
  const [autoNext, setAutoNext] = useState(false);
  const [failed, setFailed] = useState(false);
  const [requestId, setRequestId] = useState(0);
  const statusRef = useRef(status);
  const reciterRef = useRef(DEFAULT_RECITER_ID);
  const targetRef = useRef<PlaybackTarget | null>(null);
  const audioModeSet = useRef(false);
  const planRef = useRef<RangePlan | null>(null);
  const cursorRef = useRef<RangeProgress | null>(null);
  const finishHandled = useRef(false);
  const gapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [rangeProgress, setRangeProgress] = useState<RangeProgress | null>(
    null,
  );

  statusRef.current = status;

  const clearGap = useCallback(() => {
    if (gapTimer.current) {
      clearTimeout(gapTimer.current);
      gapTimer.current = null;
    }
  }, []);

  useEffect(() => clearGap, [clearGap]);

  useEffect(() => {
    let mounted = true;

    AsyncStorage.getItem(RECITER_KEY)
      .then((stored) => {
        if (mounted && stored && RECITERS.some((item) => item.id === stored)) {
          reciterRef.current = stored;
          setReciterState(stored);
        }
      })
      .catch(() => undefined);

    return () => {
      mounted = false;
    };
  }, []);

  const start = useCallback(
    (next: PlaybackTarget) => {
      if (!audioModeSet.current) {
        audioModeSet.current = true;
        setAudioModeAsync({
          playsInSilentMode: true,
          interruptionMode: "duckOthers",
          interruptionModeAndroid: "duckOthers",
          shouldPlayInBackground: false,
        }).catch(() => undefined);
      }

      clearGap();

      if (next.kind !== "range") {
        planRef.current = null;
        cursorRef.current = null;
        setRangeProgress(null);
      }

      targetRef.current = next;
      setTarget(next);
      setFailed(false);
      setRequestId((value) => value + 1);

      try {
        player.replace({
          uri: sourceFor(next, reciterRef.current, cursorRef.current?.ayah),
        });
        player.play();
      } catch (error) {
        console.error("[RECITATION] Failed to start playback:", error);
        setFailed(true);
      }
    },
    [player, clearGap],
  );

  const setReciterId = useCallback(
    (id: string) => {
      if (!RECITERS.some((item) => item.id === id)) {
        return;
      }

      reciterRef.current = id;
      setReciterState(id);
      AsyncStorage.setItem(RECITER_KEY, id).catch(() => undefined);

      const current = targetRef.current;

      // Keep listening to the same surah with the newly chosen voice.
      if (current?.kind === "surah") {
        start(current);
      }
    },
    [start],
  );

  const playSurah = useCallback(
    (surahId: number) => start({ kind: "surah", surahId }),
    [start],
  );

  const playAyah = useCallback(
    (surahId: number, ayah: number) => start({ kind: "ayah", surahId, ayah }),
    [start],
  );

  const playRange = useCallback(
    (surahId: number, from: number, to: number, plan: RangePlan) => {
      const first = Math.min(from, to);
      const last = Math.max(from, to);
      const safe: RangePlan = {
        ayahRepeats: Math.max(Math.floor(plan.ayahRepeats), 1),
        loops: Math.max(Math.floor(plan.loops), 0),
        gapSeconds: Math.max(plan.gapSeconds, 0),
      };
      const cursor: RangeProgress = {
        ayah: first,
        rep: 1,
        ayahRepeats: safe.ayahRepeats,
        loop: 1,
        loops: safe.loops,
      };

      planRef.current = safe;
      cursorRef.current = cursor;
      setRangeProgress(cursor);
      start({ kind: "range", surahId, from: first, to: last });
    },
    [start],
  );

  const stop = useCallback(() => {
    try {
      player.pause();
    } catch {
      // The player may already be released.
    }

    clearGap();
    planRef.current = null;
    cursorRef.current = null;
    setRangeProgress(null);
    targetRef.current = null;
    setTarget(null);
    setFailed(false);
  }, [player, clearGap]);

  const toggle = useCallback(() => {
    try {
      if (status.playing) {
        player.pause();
      } else if (status.didJustFinish) {
        player.seekTo(0).catch(() => undefined);
        player.play();
      } else {
        player.play();
      }
    } catch {
      setFailed(true);
    }
  }, [player, status.didJustFinish, status.playing]);

  const seekBy = useCallback(
    (seconds: number) => {
      const limit = status.duration > 0 ? status.duration : Number.MAX_SAFE_INTEGER;
      const next = Math.min(Math.max(status.currentTime + seconds, 0), limit);

      player.seekTo(next).catch(() => undefined);
    },
    [player, status.currentTime, status.duration],
  );

  const seekToRatio = useCallback(
    (ratio: number) => {
      if (status.duration > 0) {
        player
          .seekTo(Math.min(Math.max(ratio, 0), 1) * status.duration)
          .catch(() => undefined);
      }
    },
    [player, status.duration],
  );

  const playRelativeSurah = useCallback(
    (step: 1 | -1) => {
      const current = targetRef.current;

      if (!current) {
        return;
      }

      const next = current.surahId + step;

      if (next >= 1 && next <= LAST_SURAH) {
        start({ kind: "surah", surahId: next });
      }
    },
    [start],
  );

  // When a recording ends: advance the repetition plan, repeat it, or move on to the next surah.
  useEffect(() => {
    if (!status.didJustFinish) {
      finishHandled.current = false;

      return;
    }

    // Changing a setting while the finished flag is still set must not count the recitation twice.
    if (finishHandled.current) {
      return;
    }

    finishHandled.current = true;

    const current = targetRef.current;

    if (!current) {
      return;
    }

    if (current.kind === "range") {
      const plan = planRef.current;
      const cursor = cursorRef.current;

      if (!plan || !cursor) {
        return;
      }

      // One full recitation of this verse is complete: it counts as practice.
      void logAyahReps(current.surahId, cursor.ayah);

      let next: RangeProgress | null = null;

      if (cursor.rep < cursor.ayahRepeats) {
        next = { ...cursor, rep: cursor.rep + 1 };
      } else if (cursor.ayah < current.to) {
        next = { ...cursor, ayah: cursor.ayah + 1, rep: 1 };
      } else if (cursor.loops === 0 || cursor.loop < cursor.loops) {
        next = { ...cursor, ayah: current.from, rep: 1, loop: cursor.loop + 1 };
      }

      if (!next) {
        // Finished: keep the last position visible but stop playing.
        planRef.current = null;
        cursorRef.current = null;
        setRangeProgress(null);
        targetRef.current = null;
        setTarget(null);

        return;
      }

      const upcoming = next;
      const sameVerse = upcoming.ayah === cursor.ayah;

      const playNext = () => {
        gapTimer.current = null;

        if (targetRef.current !== current) {
          return;
        }

        cursorRef.current = upcoming;
        setRangeProgress(upcoming);

        try {
          if (sameVerse) {
            player.seekTo(0).catch(() => undefined);
          } else {
            player.replace({
              uri: sourceFor(current, reciterRef.current, upcoming.ayah),
            });
          }

          player.play();
        } catch {
          setFailed(true);
        }
      };

      clearGap();

      if (plan.gapSeconds > 0) {
        gapTimer.current = setTimeout(playNext, plan.gapSeconds * 1000);
      } else {
        playNext();
      }

      return;
    }

    if (repeat) {
      player.seekTo(0).catch(() => undefined);
      player.play();
    } else if (autoNext && current.kind === "surah" && current.surahId < LAST_SURAH) {
      start({ kind: "surah", surahId: current.surahId + 1 });
    }
  }, [status.didJustFinish, repeat, autoNext, player, start, clearGap]);

  // Mark playback as failed when nothing started in a reasonable time (usually no internet).
  useEffect(() => {
    if (requestId === 0) {
      return;
    }

    const timer = setTimeout(() => {
      const current = statusRef.current;

      if (targetRef.current && !current.playing && current.currentTime <= 0) {
        setFailed(true);
      }
    }, LOAD_TIMEOUT_MS);

    return () => clearTimeout(timer);
  }, [requestId]);

  const value = useMemo<RecitationValue>(
    () => ({
      reciterId,
      setReciterId,
      target,
      playing: status.playing,
      loading:
        target !== null && !failed && (!status.isLoaded || status.isBuffering),
      failed,
      position: status.currentTime,
      duration: status.duration,
      repeat,
      setRepeat,
      autoNext,
      setAutoNext,
      playSurah,
      playAyah,
      playRange,
      rangeProgress,
      toggle,
      stop,
      seekBy,
      seekToRatio,
      playRelativeSurah,
    }),
    [
      reciterId,
      setReciterId,
      target,
      status.playing,
      status.isLoaded,
      status.isBuffering,
      status.currentTime,
      status.duration,
      failed,
      repeat,
      autoNext,
      playSurah,
      playAyah,
      playRange,
      rangeProgress,
      toggle,
      stop,
      seekBy,
      seekToRatio,
      playRelativeSurah,
    ],
  );

  return (
    <RecitationContext.Provider value={value}>
      {children}
    </RecitationContext.Provider>
  );
}

export function useRecitation(): RecitationValue {
  const context = useContext(RecitationContext);

  if (!context) {
    throw new Error("useRecitation must be used within a RecitationProvider");
  }

  return context;
}

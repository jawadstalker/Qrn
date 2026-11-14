import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import { ApiError } from "@/features/auth/api";
import { useAuth } from "@/features/auth/AuthContext";
import { roomsApi } from "@/features/rooms/api";
import type { RoomState } from "@/features/rooms/types";

const POLL_MS = 1500;
const RETRY_MS = 4000;

interface UseRoomResult {
  room: RoomState | null;
  /** Error code when the room cannot be read anymore (not_in_room, room_not_found ...). */
  fatal: string | null;
  /** True while requests are failing (offline); polling keeps retrying. */
  offline: boolean;
  /** Replaces the state with a fresh one (e.g. the response of start or turn). */
  apply: (state: RoomState) => void;
  /** Current server time in seconds, corrected for clock differences. */
  serverNow: () => number;
}

/** Keeps a room up to date by polling; sends the last version so unchanged rooms cost almost nothing. */
export function useRoom(code: string): UseRoomResult {
  const { getToken } = useAuth();
  const [room, setRoom] = useState<RoomState | null>(null);
  const [fatal, setFatal] = useState<string | null>(null);
  const [offline, setOffline] = useState(false);
  const versionRef = useRef(0);
  const skewRef = useRef(0);

  const apply = useCallback((state: RoomState) => {
    if (state.version >= versionRef.current) {
      versionRef.current = state.version;
      skewRef.current = state.serverTime * 1000 - Date.now();
      setRoom(state);
    }
  }, []);

  const serverNow = useCallback(
    () => Math.floor((Date.now() + skewRef.current) / 1000),
    [],
  );

  useEffect(() => {
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const schedule = (delay: number) => {
      if (!stopped) {
        timer = setTimeout(() => void poll(), delay);
      }
    };

    const poll = async () => {
      if (stopped) {
        return;
      }

      if (AppState.currentState !== "active") {
        schedule(POLL_MS);
        return;
      }

      try {
        const result = await roomsApi.state(
          getToken(),
          code,
          versionRef.current || undefined,
        );

        if (stopped) {
          return;
        }

        setOffline(false);
        skewRef.current = result.serverTime * 1000 - Date.now();

        if (result.changed) {
          apply(result);
        }

        schedule(POLL_MS);
      } catch (error) {
        if (stopped) {
          return;
        }

        if (
          error instanceof ApiError &&
          (error.status === 403 || error.status === 404)
        ) {
          setFatal(error.code);
          return;
        }

        setOffline(true);
        schedule(RETRY_MS);
      }
    };

    void poll();

    return () => {
      stopped = true;

      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [apply, code, getToken]);

  return { room, fatal, offline, apply, serverNow };
}

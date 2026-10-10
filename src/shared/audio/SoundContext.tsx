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
  createAudioPlayer,
  setAudioModeAsync,
  type AudioPlayer,
} from "expo-audio";
import {
  SOUND_NAMES,
  SOUND_SOURCES,
  SOUND_VOLUMES,
  type SoundName,
} from "@/shared/audio/sounds";

const STORAGE_KEY = "@neurolia_sound_enabled";

interface SoundContextValue {
  enabled: boolean;
  setEnabled: (value: boolean) => void;
  play: (name: SoundName) => void;
}

const SoundContext = createContext<SoundContextValue | undefined>(undefined);

export function SoundProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabledState] = useState(true);
  const enabledRef = useRef(true);
  const players = useRef<Partial<Record<SoundName, AudioPlayer>>>({});

  useEffect(() => {
    let mounted = true;

    setAudioModeAsync({
      playsInSilentMode: false,
      interruptionMode: "mixWithOthers",
      shouldPlayInBackground: false,
    }).catch(() => undefined);

    for (const name of SOUND_NAMES) {
      try {
        const player = createAudioPlayer(SOUND_SOURCES[name]);
        player.volume = SOUND_VOLUMES[name];
        players.current[name] = player;
      } catch (error) {
        console.error("[SOUND] Failed to load sound:", name, error);
      }
    }

    AsyncStorage.getItem(STORAGE_KEY)
      .then((value) => {
        if (mounted && value === "false") {
          enabledRef.current = false;
          setEnabledState(false);
        }
      })
      .catch(() => undefined);

    const loaded = players.current;

    return () => {
      mounted = false;

      for (const name of SOUND_NAMES) {
        try {
          loaded[name]?.remove();
        } catch {
          continue;
        }
      }
    };
  }, []);

  const setEnabled = useCallback((value: boolean) => {
    enabledRef.current = value;
    setEnabledState(value);
    AsyncStorage.setItem(STORAGE_KEY, String(value)).catch(() => undefined);
  }, []);

  const play = useCallback((name: SoundName) => {
    if (!enabledRef.current) {
      return;
    }

    const player = players.current[name];

    if (!player) {
      return;
    }

    try {
      player.seekTo(0).catch(() => undefined);
      player.play();
    } catch {
      return;
    }
  }, []);

  const value = useMemo<SoundContextValue>(
    () => ({ enabled, setEnabled, play }),
    [enabled, setEnabled, play],
  );

  return (
    <SoundContext.Provider value={value}>{children}</SoundContext.Provider>
  );
}

export function useSound(): SoundContextValue {
  const context = useContext(SoundContext);

  if (!context) {
    throw new Error("useSound must be used within a SoundProvider");
  }

  return context;
}

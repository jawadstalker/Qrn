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
import type { RefObject } from "react";
import type { View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  GUIDE_IDS,
  PAGE_GUIDE_IDS,
  isGuideId,
  type GuideId,
} from "@/features/guide/guideContent";

/**
 * Remembers which guides the person has already seen.
 *
 * It is stored on the device only. The key is deliberately not part of SYNC_KEYS in
 * features/auth/config.ts, so a guide that was seen is not replayed after logging out, and signing in
 * on a second phone shows the guides there once.
 */
const STORAGE_KEY = "@quran_garden_guide_v1";

type Seen = Partial<Record<GuideId, true>>;

interface StoredGuides {
  v: 1;
  seen: Seen;
  /** The person turned the automatic page guides off. */
  pagesOff: boolean;
}

/** The main vertical scroller of the screen that is on top, so a guide can bring a target into view. */
export interface GuideScroller {
  scrollTo: (y: number) => void;
  getOffset: () => number;
}

interface GuideContextType {
  /** The stored flags are loaded; nothing opens before that. */
  ready: boolean;
  /** The guide that is open right now, if any. */
  active: GuideId | null;
  /** Whether page guides open on their own (for the Settings switch). */
  pagesEnabled: boolean;
  /** Stable getters that read the latest value without re-rendering the caller. */
  hasSeen: (id: GuideId) => boolean;
  pagesAllowed: () => boolean;
  /** Opens a guide now (also used to replay one). */
  start: (id: GuideId) => void;
  /**
   * Closes the guide and remembers that it was seen.
   * `alsoSeen` marks other guides as seen too (skipping the intro also skips the first page guide).
   */
  finish: (
    id: GuideId,
    options?: { disablePages?: boolean; alsoSeen?: readonly GuideId[] },
  ) => void;
  setPagesEnabled: (enabled: boolean) => void;
  /** Forgets every page guide (not the intro) and turns page guides back on. */
  resetPageGuides: () => void;
  /** Screens register the elements a guide can point at; returns the function that removes it. */
  registerTarget: (id: string, ref: RefObject<View | null>) => () => void;
  getTarget: (id: string) => View | null;
  registerScroller: (scroller: GuideScroller) => () => void;
  getScroller: () => GuideScroller | null;
}

const GuideContext = createContext<GuideContextType | undefined>(undefined);

function parseStored(raw: string | null): StoredGuides {
  const empty: StoredGuides = { v: 1, seen: {}, pagesOff: false };

  if (!raw) {
    return empty;
  }

  try {
    const data = JSON.parse(raw) as Partial<StoredGuides> | null;
    const seen: Seen = {};

    if (data && typeof data === "object" && data.seen) {
      Object.entries(data.seen).forEach(([id, value]) => {
        if (value === true && isGuideId(id)) {
          seen[id] = true;
        }
      });
    }

    return { v: 1, seen, pagesOff: data?.pagesOff === true };
  } catch {
    return empty;
  }
}

export function GuideProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [active, setActive] = useState<GuideId | null>(null);
  const [pagesEnabled, setPagesEnabledState] = useState(true);
  const seenRef = useRef<Seen>({});
  const pagesOffRef = useRef(false);
  const targetsRef = useRef(new Map<string, RefObject<View | null>>());
  const scrollersRef = useRef<GuideScroller[]>([]);

  const persist = useCallback(() => {
    const payload: StoredGuides = {
      v: 1,
      seen: seenRef.current,
      pagesOff: pagesOffRef.current,
    };

    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload)).catch(
      (error) => {
        console.error("[GUIDE] Failed to save guide state:", error);
      },
    );
  }, []);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const stored = parseStored(await AsyncStorage.getItem(STORAGE_KEY));

        seenRef.current = stored.seen;
        pagesOffRef.current = stored.pagesOff;

        if (mounted) {
          setPagesEnabledState(!stored.pagesOff);
        }
      } catch (error) {
        console.error("[GUIDE] Failed to load guide state:", error);

        // The stored state is unknown, so do not nag: treat every guide as seen for this session.
        seenRef.current = Object.fromEntries(
          GUIDE_IDS.map((id) => [id, true as const]),
        ) as Seen;
      } finally {
        if (mounted) {
          setReady(true);
        }
      }
    };

    void load();

    return () => {
      mounted = false;
    };
  }, []);

  const hasSeen = useCallback(
    (id: GuideId) => seenRef.current[id] === true,
    [],
  );

  const pagesAllowed = useCallback(() => !pagesOffRef.current, []);

  const start = useCallback((id: GuideId) => {
    setActive(id);
  }, []);

  const finish = useCallback(
    (
      id: GuideId,
      options?: { disablePages?: boolean; alsoSeen?: readonly GuideId[] },
    ) => {
      const next: Seen = { ...seenRef.current, [id]: true };

      options?.alsoSeen?.forEach((other) => {
        next[other] = true;
      });

      seenRef.current = next;

      if (options?.disablePages) {
        pagesOffRef.current = true;
        setPagesEnabledState(false);
      }

      persist();
      setActive((current) => (current === id ? null : current));
    },
    [persist],
  );

  const setPagesEnabled = useCallback(
    (enabled: boolean) => {
      pagesOffRef.current = !enabled;
      setPagesEnabledState(enabled);
      persist();
    },
    [persist],
  );

  const resetPageGuides = useCallback(() => {
    const next: Seen = { ...seenRef.current };

    PAGE_GUIDE_IDS.forEach((id) => {
      delete next[id];
    });

    seenRef.current = next;
    pagesOffRef.current = false;
    setPagesEnabledState(true);
    persist();
  }, [persist]);

  const registerTarget = useCallback(
    (id: string, ref: RefObject<View | null>) => {
      targetsRef.current.set(id, ref);

      return () => {
        /* A newer element may have taken the id over (remount); only remove our own. */
        if (targetsRef.current.get(id) === ref) {
          targetsRef.current.delete(id);
        }
      };
    },
    [],
  );

  const getTarget = useCallback(
    (id: string) => targetsRef.current.get(id)?.current ?? null,
    [],
  );

  const registerScroller = useCallback((scroller: GuideScroller) => {
    scrollersRef.current = [...scrollersRef.current, scroller];

    return () => {
      scrollersRef.current = scrollersRef.current.filter(
        (item) => item !== scroller,
      );
    };
  }, []);

  /* The most recently focused screen wins. */
  const getScroller = useCallback(
    () => scrollersRef.current[scrollersRef.current.length - 1] ?? null,
    [],
  );

  const value = useMemo<GuideContextType>(
    () => ({
      ready,
      active,
      pagesEnabled,
      hasSeen,
      pagesAllowed,
      start,
      finish,
      setPagesEnabled,
      resetPageGuides,
      registerTarget,
      getTarget,
      registerScroller,
      getScroller,
    }),
    [
      ready,
      active,
      pagesEnabled,
      hasSeen,
      pagesAllowed,
      start,
      finish,
      setPagesEnabled,
      resetPageGuides,
      registerTarget,
      getTarget,
      registerScroller,
      getScroller,
    ],
  );

  return (
    <GuideContext.Provider value={value}>{children}</GuideContext.Provider>
  );
}

export function useGuide(): GuideContextType {
  const context = useContext(GuideContext);

  if (!context) {
    throw new Error("useGuide must be used within a GuideProvider");
  }

  return context;
}

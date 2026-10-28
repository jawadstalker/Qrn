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
import { getSurah } from "@/features/quran/data/surahs";
import { isValidISO } from "@/features/quran/plan/calendar";
import {
  buildPlan,
  type BuiltPlan,
  type PlanConfig,
} from "@/features/quran/plan/planEngine";

export interface StoredPlan {
  config: PlanConfig;
  createdAt: number;
  /** Indexes of the sessions the user checked as done. */
  done: number[];
}

interface PlanValue {
  isLoaded: boolean;
  plan: StoredPlan | null;
  built: BuiltPlan | null;
  isDone: (sessionIndex: number) => boolean;
  savePlan: (config: PlanConfig, keepDone?: boolean) => Promise<void>;
  removePlan: () => Promise<void>;
  toggleDone: (sessionIndex: number) => Promise<void>;
}

const STORAGE_KEY = "@quran_garden_plan_v1";

const PlanContext = createContext<PlanValue | undefined>(undefined);

function isIntegerArray(value: unknown): value is number[] {
  return (
    Array.isArray(value) && value.every((item) => Number.isInteger(item))
  );
}

/** Accepts only a well-formed plan; anything else is treated as "no plan". */
function parsePlan(raw: string | null): StoredPlan | null {
  if (!raw) {
    return null;
  }

  try {
    const value = JSON.parse(raw) as Partial<StoredPlan> | null;
    const config = value?.config as Partial<PlanConfig> | undefined;

    if (
      !value ||
      !config ||
      !isIntegerArray(config.surahIds) ||
      !config.surahIds.every((id) => getSurah(id)) ||
      !isIntegerArray(config.weekdays) ||
      !config.weekdays.every((day) => day >= 0 && day <= 6) ||
      !isValidISO(config.startDate) ||
      (config.mode !== "perDay" && config.mode !== "targetDate") ||
      typeof config.perDay !== "number" ||
      typeof config.review !== "boolean" ||
      !(config.targetDate === null || isValidISO(config.targetDate)) ||
      !(config.fromAyah === null || Number.isInteger(config.fromAyah)) ||
      !(config.toAyah === null || Number.isInteger(config.toAyah)) ||
      !isIntegerArray(value.done)
    ) {
      return null;
    }

    const stored: StoredPlan = {
      config: config as PlanConfig,
      createdAt: typeof value.createdAt === "number" ? value.createdAt : 0,
      done: value.done,
    };

    return buildPlan(stored.config).issues.length === 0 ? stored : null;
  } catch {
    return null;
  }
}

export function MemorizationPlanProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [plan, setPlan] = useState<StoredPlan | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const planRef = useRef<StoredPlan | null>(null);

  useEffect(() => {
    let mounted = true;

    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!mounted) {
          return;
        }

        const parsed = parsePlan(raw);

        planRef.current = parsed;
        setPlan(parsed);
      })
      .catch(() => undefined)
      .finally(() => {
        if (mounted) {
          setIsLoaded(true);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const persist = useCallback(async (next: StoredPlan | null) => {
    planRef.current = next;
    setPlan(next);

    try {
      if (next) {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } else {
        await AsyncStorage.removeItem(STORAGE_KEY);
      }
    } catch (error) {
      console.error("[PLAN] Failed to save the plan:", error);
    }
  }, []);

  const built = useMemo(() => (plan ? buildPlan(plan.config) : null), [plan]);

  const savePlan = useCallback(
    async (config: PlanConfig, keepDone = false) => {
      const previous = planRef.current;

      await persist({
        config,
        createdAt: previous?.createdAt ?? Date.now(),
        done: keepDone && previous ? previous.done : [],
      });
    },
    [persist],
  );

  const removePlan = useCallback(() => persist(null), [persist]);

  const toggleDone = useCallback(
    async (sessionIndex: number) => {
      const current = planRef.current;

      if (!current) {
        return;
      }

      const done = current.done.includes(sessionIndex)
        ? current.done.filter((item) => item !== sessionIndex)
        : [...current.done, sessionIndex].sort((a, b) => a - b);

      await persist({ ...current, done });
    },
    [persist],
  );

  const doneSet = useMemo(() => new Set(plan?.done ?? []), [plan]);
  const isDone = useCallback(
    (sessionIndex: number) => doneSet.has(sessionIndex),
    [doneSet],
  );

  const value = useMemo<PlanValue>(
    () => ({
      isLoaded,
      plan,
      built,
      isDone,
      savePlan,
      removePlan,
      toggleDone,
    }),
    [isLoaded, plan, built, isDone, savePlan, removePlan, toggleDone],
  );

  return <PlanContext.Provider value={value}>{children}</PlanContext.Provider>;
}

export function useMemorizationPlan(): PlanValue {
  const context = useContext(PlanContext);

  if (!context) {
    throw new Error(
      "useMemorizationPlan must be used within a MemorizationPlanProvider",
    );
  }

  return context;
}

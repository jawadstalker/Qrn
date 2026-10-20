import { useCallback, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "expo-router";

export interface ExamResult {
  best: number;
  total: number;
  attempts: number;
}

type ExamResultMap = Record<string, ExamResult>;

const EXAM_KEY = "@quran_garden_exams";

function parseResults(raw: string | null): ExamResultMap {
  if (!raw) {
    return {};
  }

  try {
    const value = JSON.parse(raw) as ExamResultMap;

    return value && typeof value === "object" ? value : {};
  } catch {
    return {};
  }
}

export function useExamResults() {
  const [results, setResults] = useState<ExamResultMap>({});
  const ref = useRef<ExamResultMap>({});

  useFocusEffect(
    useCallback(() => {
      let active = true;

      AsyncStorage.getItem(EXAM_KEY)
        .then((raw) => {
          if (active) {
            ref.current = parseResults(raw);
            setResults(ref.current);
          }
        })
        .catch(() => undefined);

      return () => {
        active = false;
      };
    }, []),
  );

  const record = useCallback(
    async (id: string, score: number, total: number) => {
      const previous = ref.current[id];
      const improved =
        !previous ||
        score / Math.max(total, 1) >
          previous.best / Math.max(previous.total, 1);
      const next: ExamResultMap = {
        ...ref.current,
        [id]: {
          best: improved ? score : previous.best,
          total: improved ? total : previous.total,
          attempts: (previous?.attempts ?? 0) + 1,
        },
      };

      ref.current = next;
      setResults(next);

      try {
        await AsyncStorage.setItem(EXAM_KEY, JSON.stringify(next));
      } catch (error) {
        console.error("[QURAN] Failed to save exam result:", error);
      }
    },
    [],
  );

  const resultFor = useCallback((id: string) => results[id], [results]);

  return { resultFor, record };
}

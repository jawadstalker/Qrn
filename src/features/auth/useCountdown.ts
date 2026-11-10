import { useCallback, useEffect, useState } from "react";

/** Counts down once per second from `initial`; `restart` starts it again. */
export function useCountdown(initial: number) {
  const [left, setLeft] = useState(initial);

  useEffect(() => {
    if (left <= 0) {
      return undefined;
    }

    const timer = setTimeout(() => setLeft((value) => value - 1), 1000);

    return () => clearTimeout(timer);
  }, [left]);

  const restart = useCallback(
    (seconds: number = initial) => setLeft(seconds),
    [initial],
  );

  return { left, restart };
}

import { useCallback, useEffect, useRef, useState } from "react";

export function useStopwatch() {
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const startRef = useRef<number | null>(null);
  const frameRef = useRef<number | null>(null);

  const tick = useCallback(() => {
    if (startRef.current !== null) {
      setElapsedMs(Date.now() - startRef.current);
      frameRef.current = requestAnimationFrame(tick);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, []);

  const start = useCallback(() => {
    startRef.current = Date.now() - elapsedMs;
    setIsRunning(true);
    frameRef.current = requestAnimationFrame(tick);
  }, [elapsedMs, tick]);

  const pause = useCallback(() => {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    startRef.current = null;
    setIsRunning(false);
  }, []);

  const reset = useCallback(() => {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    startRef.current = null;
    setIsRunning(false);
    setElapsedMs(0);
  }, []);

  const elapsedMinutes = Math.round(elapsedMs / 60000);
  const elapsedLabel = (() => {
    const totalSeconds = Math.floor(elapsedMs / 1000);
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  })();

  return { isRunning, elapsedMinutes, elapsedLabel, start, pause, reset };
}

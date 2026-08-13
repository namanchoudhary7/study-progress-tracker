import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useCreateSession } from "../hooks/useSessions";

const STORAGE_KEY = "study-timer";

export interface ActiveTimerTask {
  subjectId: number;
  subjectName: string;
  topicId: number | null;
  topicName: string | null;
}

interface StoredTimerState {
  task: ActiveTimerTask;
  startedAt: number | null;
  accumulatedMs: number;
}

interface TimerContextValue {
  task: ActiveTimerTask | null;
  isRunning: boolean;
  elapsedMinutes: number;
  elapsedLabel: string;
  isLogging: boolean;
  start: (task: ActiveTimerTask) => void;
  pause: () => void;
  resume: () => void;
  stopAndLog: (notes?: string) => Promise<void>;
  cancel: () => void;
}

const TimerContext = createContext<TimerContextValue | null>(null);

function loadStored(): StoredTimerState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredTimerState) : null;
  } catch {
    return null;
  }
}

function saveStored(state: StoredTimerState | null) {
  if (state) localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  else localStorage.removeItem(STORAGE_KEY);
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function TimerProvider({ children }: { children: ReactNode }) {
  const createSession = useCreateSession();
  const [stored, setStored] = useState<StoredTimerState | null>(() => loadStored());
  const [, forceTick] = useState(0);
  const frameRef = useRef<number | null>(null);

  const isRunning = stored !== null && stored.startedAt !== null;

  useEffect(() => {
    if (!isRunning) return;
    function loop() {
      forceTick((t) => t + 1);
      frameRef.current = requestAnimationFrame(loop);
    }
    frameRef.current = requestAnimationFrame(loop);
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, [isRunning]);

  function update(next: StoredTimerState | null) {
    setStored(next);
    saveStored(next);
  }

  function start(task: ActiveTimerTask) {
    update({ task, startedAt: Date.now(), accumulatedMs: 0 });
  }

  function pause() {
    if (!stored || stored.startedAt === null) return;
    update({ ...stored, startedAt: null, accumulatedMs: stored.accumulatedMs + (Date.now() - stored.startedAt) });
  }

  function resume() {
    if (!stored || stored.startedAt !== null) return;
    update({ ...stored, startedAt: Date.now() });
  }

  function cancel() {
    update(null);
  }

  const elapsedMs = stored ? stored.accumulatedMs + (stored.startedAt !== null ? Date.now() - stored.startedAt : 0) : 0;
  const elapsedMinutes = Math.round(elapsedMs / 60000);
  const totalSeconds = Math.floor(elapsedMs / 1000);
  const elapsedLabel = `${Math.floor(totalSeconds / 60)}:${(totalSeconds % 60).toString().padStart(2, "0")}`;

  async function stopAndLog(notes?: string) {
    if (!stored) return;
    const minutes = Math.max(1, Math.round(elapsedMs / 60000));
    const task = stored.task;
    update(null);
    await createSession.mutateAsync({
      subject_id: task.subjectId,
      topic_id: task.topicId,
      session_date: todayISO(),
      duration_minutes: minutes,
      notes: notes || null,
    });
  }

  return (
    <TimerContext.Provider
      value={{
        task: stored?.task ?? null,
        isRunning,
        elapsedMinutes,
        elapsedLabel,
        isLogging: createSession.isPending,
        start,
        pause,
        resume,
        stopAndLog,
        cancel,
      }}
    >
      {children}
    </TimerContext.Provider>
  );
}

export function useTimer(): TimerContextValue {
  const ctx = useContext(TimerContext);
  if (!ctx) throw new Error("useTimer must be used within a TimerProvider");
  return ctx;
}

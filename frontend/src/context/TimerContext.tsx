import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useCreateSession } from "../hooks/useSessions";

const STORAGE_KEY = "study-timer";

export interface ActiveTimerTask {
  subjectId: number;
  subjectName: string;
  topicId: number | null;
  topicName: string | null;
}

export interface PomodoroConfig {
  workMinutes: number;
  breakMinutes: number;
}

interface PomodoroState extends PomodoroConfig {
  onBreak: boolean;
  phaseStartedAt: number;
}

interface StoredTimerState {
  task: ActiveTimerTask;
  startedAt: number | null;
  accumulatedMs: number;
  pomodoro: PomodoroState | null;
}

interface TimerContextValue {
  task: ActiveTimerTask | null;
  isRunning: boolean;
  elapsedMinutes: number;
  elapsedLabel: string;
  isLogging: boolean;
  pomodoro: PomodoroState | null;
  pomodoroPhaseLabel: string;
  start: (task: ActiveTimerTask, pomodoro?: PomodoroConfig) => void;
  pause: () => void;
  resume: () => void;
  skipBreak: () => void;
  stopAndLog: (notes?: string) => Promise<void>;
  cancel: () => void;
}

function notify(title: string, body: string) {
  if (typeof Notification !== "undefined" && Notification.permission === "granted") {
    new Notification(title, { body });
  }
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = 880;
    osc.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.2);
    osc.onended = () => ctx.close();
  } catch {
    // audio not available — notification (if any) still fired
  }
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
  const storedRef = useRef(stored);
  storedRef.current = stored;

  const isRunning = stored !== null && stored.startedAt !== null;
  const pomodoroActive = stored?.pomodoro != null;

  useEffect(() => {
    if (!isRunning && !pomodoroActive) return;
    function loop() {
      checkPomodoroPhase();
      forceTick((t) => t + 1);
      frameRef.current = requestAnimationFrame(loop);
    }
    frameRef.current = requestAnimationFrame(loop);
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning, pomodoroActive]);

  // Drives pomodoro phase transitions — checked every animation frame (via storedRef, so it
  // always sees the latest state without needing `stored` itself as an effect dependency,
  // since ticking alone doesn't change that reference) and flips work/break, auto-pausing or
  // resuming the underlying timer so break time never gets logged as study time.
  function checkPomodoroPhase() {
    const current = storedRef.current;
    if (!current?.pomodoro) return;
    const { pomodoro } = current;
    const durationMs = (pomodoro.onBreak ? pomodoro.breakMinutes : pomodoro.workMinutes) * 60000;
    const elapsed = Date.now() - pomodoro.phaseStartedAt;
    if (elapsed < durationMs) return;

    if (pomodoro.onBreak) {
      notify("Back to work", "Break's over — resuming your study session.");
      update({
        ...current,
        startedAt: Date.now(),
        pomodoro: { ...pomodoro, onBreak: false, phaseStartedAt: Date.now() },
      });
    } else {
      notify("Break time", `Nice work — take a ${pomodoro.breakMinutes} minute break.`);
      update({
        ...current,
        startedAt: null,
        accumulatedMs: current.accumulatedMs + (current.startedAt !== null ? Date.now() - current.startedAt : 0),
        pomodoro: { ...pomodoro, onBreak: true, phaseStartedAt: Date.now() },
      });
    }
  }

  function update(next: StoredTimerState | null) {
    setStored(next);
    saveStored(next);
  }

  function start(task: ActiveTimerTask, pomodoroConfig?: PomodoroConfig) {
    if (pomodoroConfig && typeof Notification !== "undefined" && Notification.permission === "default") {
      Notification.requestPermission();
    }
    update({
      task,
      startedAt: Date.now(),
      accumulatedMs: 0,
      pomodoro: pomodoroConfig
        ? { ...pomodoroConfig, onBreak: false, phaseStartedAt: Date.now() }
        : null,
    });
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

  function skipBreak() {
    if (!stored?.pomodoro?.onBreak) return;
    update({
      ...stored,
      startedAt: Date.now(),
      pomodoro: { ...stored.pomodoro, onBreak: false, phaseStartedAt: Date.now() },
    });
  }

  const elapsedMs = stored ? stored.accumulatedMs + (stored.startedAt !== null ? Date.now() - stored.startedAt : 0) : 0;
  const elapsedMinutes = Math.round(elapsedMs / 60000);
  const totalSeconds = Math.floor(elapsedMs / 1000);
  const elapsedLabel = `${Math.floor(totalSeconds / 60)}:${(totalSeconds % 60).toString().padStart(2, "0")}`;

  let pomodoroPhaseLabel = "";
  if (stored?.pomodoro) {
    const { pomodoro } = stored;
    const durationMs = (pomodoro.onBreak ? pomodoro.breakMinutes : pomodoro.workMinutes) * 60000;
    const remainingMs = Math.max(0, durationMs - (Date.now() - pomodoro.phaseStartedAt));
    const remainingSeconds = Math.floor(remainingMs / 1000);
    const remainingLabel = `${Math.floor(remainingSeconds / 60)}:${(remainingSeconds % 60).toString().padStart(2, "0")}`;
    pomodoroPhaseLabel = `${pomodoro.onBreak ? "Break" : "Work"} · ${remainingLabel} left`;
  }

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
        pomodoro: stored?.pomodoro ?? null,
        pomodoroPhaseLabel,
        start,
        pause,
        resume,
        skipBreak,
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

import { useState } from "react";
import { Clock, Pause, Play, Square, X } from "lucide-react";
import { Card } from "./Card";
import { Button } from "./ui/Button";
import { IconButton } from "./ui/IconButton";
import { useTimer } from "../context/TimerContext";
import { TaskPickerModal } from "./TaskPickerModal";

export function TimerWidget() {
  const timer = useTimer();
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <Card>
      <div className="flex flex-wrap items-center gap-3">
        <Clock className="h-4 w-4 shrink-0 text-neutral-500" />
        {timer.task ? (
          <>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{timer.task.topicName}</p>
              <p className="truncate text-xs text-neutral-500">{timer.task.subjectName}</p>
            </div>
            {timer.pomodoro && (
              <span
                className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${
                  timer.pomodoro.onBreak
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                    : "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400"
                }`}
              >
                {timer.pomodoroPhaseLabel}
              </span>
            )}
            <span className="tabular-nums text-neutral-600 dark:text-neutral-400">{timer.elapsedLabel}</span>
            {timer.pomodoro?.onBreak ? (
              <Button size="sm" icon={Play} onClick={timer.skipBreak}>
                Skip break
              </Button>
            ) : timer.isRunning ? (
              <Button size="sm" icon={Pause} onClick={timer.pause}>
                Pause
              </Button>
            ) : (
              <Button size="sm" icon={Play} onClick={timer.resume}>
                Resume
              </Button>
            )}
            <Button
              size="sm"
              variant="primary"
              icon={Square}
              disabled={timer.isLogging}
              onClick={() => timer.stopAndLog()}
            >
              Stop &amp; log
            </Button>
            <IconButton icon={X} label="Cancel timer without logging" variant="ghost" onClick={timer.cancel} />
          </>
        ) : (
          <>
            <span className="flex-1 text-sm text-neutral-500">No timer running</span>
            <Button
              size="md"
              variant="primary"
              icon={Play}
              className="px-5 py-2.5 text-base"
              onClick={() => setPickerOpen(true)}
            >
              Start timer
            </Button>
          </>
        )}
      </div>
      {pickerOpen && <TaskPickerModal onClose={() => setPickerOpen(false)} />}
    </Card>
  );
}

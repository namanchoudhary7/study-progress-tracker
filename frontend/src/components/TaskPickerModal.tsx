import { useState } from "react";
import { CalendarDays, CircleDot, ListTodo, X } from "lucide-react";
import { useSubjects } from "../hooks/useSubjects";
import { useTopics } from "../hooks/useTopics";
import { useTodayPlans } from "../hooks/usePlans";
import { useTimer } from "../context/TimerContext";
import { IconButton } from "./ui/IconButton";
import { Input } from "./ui/Input";

export function TaskPickerModal({ onClose }: { onClose: () => void }) {
  const { data: subjects } = useSubjects();
  const { data: topics, isLoading } = useTopics();
  const { data: todayPlans } = useTodayPlans();
  const { start } = useTimer();
  const [pomodoroOn, setPomodoroOn] = useState(false);
  const [workMinutes, setWorkMinutes] = useState("25");
  const [breakMinutes, setBreakMinutes] = useState("5");

  const pending = (topics ?? []).filter((t) => t.status === "todo" || t.status === "in_progress");
  const subjectName = (id: number) => subjects?.find((s) => s.id === id)?.name ?? "—";
  const pomodoroConfig = pomodoroOn
    ? { workMinutes: Number(workMinutes) || 25, breakMinutes: Number(breakMinutes) || 5 }
    : undefined;

  function handlePick(topicId: number | null, topicName: string | null, subjectId: number) {
    start({ subjectId, subjectName: subjectName(subjectId), topicId, topicName }, pomodoroConfig);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="relative w-full max-w-md rounded-md border border-neutral-200 bg-white p-4 shadow-xl before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-accent-500/60 before:to-transparent dark:border-neutral-800 dark:bg-neutral-900">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">Pick a task to start</h2>
          <IconButton icon={X} label="Close" onClick={onClose} />
        </div>

        <div className="mb-3 border-b border-neutral-200 pb-3 dark:border-neutral-800">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={pomodoroOn} onChange={(e) => setPomodoroOn(e.target.checked)} />
            Pomodoro mode
          </label>
          {pomodoroOn && (
            <div className="mt-2 flex items-center gap-2 text-xs text-neutral-500">
              <label className="flex items-center gap-1">
                Work
                <Input
                  type="number"
                  min={1}
                  max={120}
                  className="w-16"
                  value={workMinutes}
                  onChange={(e) => setWorkMinutes(e.target.value)}
                />
                min
              </label>
              <label className="flex items-center gap-1">
                Break
                <Input
                  type="number"
                  min={1}
                  max={60}
                  className="w-16"
                  value={breakMinutes}
                  onChange={(e) => setBreakMinutes(e.target.value)}
                />
                min
              </label>
            </div>
          )}
        </div>

        {todayPlans && todayPlans.length > 0 && (
          <div className="mb-3 space-y-1 border-b border-neutral-200 pb-3 dark:border-neutral-800">
            <p className="flex items-center gap-1 font-mono-label text-neutral-500 dark:text-neutral-400">
              <CalendarDays className="h-3.5 w-3.5" /> Today's plan
            </p>
            {todayPlans.map((plan) => (
              <button
                key={plan.id}
                onClick={() => handlePick(plan.topic_id, plan.topic_name, plan.subject_id)}
                className="flex w-full items-center gap-2 rounded-md bg-accent-50 px-3 py-2 text-left text-sm hover:bg-accent-100 dark:bg-accent-950/30 dark:hover:bg-accent-950/50"
              >
                <CalendarDays className="h-3.5 w-3.5 shrink-0 text-accent-600 dark:text-accent-400" />
                <span className="flex-1">
                  <span className="font-medium">{plan.topic_name ?? plan.subject_name}</span>
                  {plan.topic_name && <span className="text-neutral-500"> · {plan.subject_name}</span>}
                </span>
              </button>
            ))}
          </div>
        )}

        {isLoading && <p className="text-sm text-neutral-500">Loading…</p>}

        {!isLoading && pending.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-8 text-center text-sm text-neutral-500">
            <ListTodo className="h-8 w-8 text-neutral-300 dark:text-neutral-700" />
            No pending topics — add some in Subjects to start a timer.
          </div>
        )}

        <div className="max-h-80 space-y-1 overflow-y-auto">
          {pending.map((topic) => (
            <button
              key={topic.id}
              onClick={() => handlePick(topic.id, topic.name, topic.subject_id)}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              <CircleDot
                className={`h-3.5 w-3.5 shrink-0 ${
                  topic.status === "in_progress" ? "text-accent-600 dark:text-accent-400" : "text-neutral-400"
                }`}
              />
              <span className="flex-1">
                <span className="font-medium">{topic.name}</span>
                <span className="text-neutral-500"> · {subjectName(topic.subject_id)}</span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
